import asyncio
import json
import os
import subprocess
import sys
import time
import urllib.request
import websockets

sys.stdout.reconfigure(encoding="utf-8")

PORT = 9226
APP_DIR = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
BRAIN_DIR = r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf"
HTTP_PORT = 8096
EDGE_EXE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"


class CDPClient:
    def __init__(self, ws_url):
        self.ws_url = ws_url
        self.msg_id = 0
        self.ws = None

    async def connect(self):
        self.ws = await websockets.connect(self.ws_url, max_size=50 * 1024 * 1024)

    async def send(self, method, params=None):
        self.msg_id += 1
        curr_id = self.msg_id
        payload = {"id": curr_id, "method": method, "params": params or {}}
        await self.ws.send(json.dumps(payload))
        while True:
            resp = json.loads(await self.ws.recv())
            if resp.get("id") == curr_id:
                return resp.get("result", {})

    async def eval(self, expr):
        res = await self.send(
            "Runtime.evaluate",
            {"expression": expr, "returnByValue": True, "awaitPromise": True},
        )
        if "exceptionDetails" in res:
            raise Exception(res["exceptionDetails"])
        return res.get("result", {}).get("value")

    async def screenshot(self, path):
        res = await self.send("Page.captureScreenshot", {"format": "png"})
        import base64

        with open(path, "wb") as f:
            f.write(base64.b64decode(res["data"]))
        print(f"[Screenshot saved]: {path}")

    async def close(self):
        if self.ws:
            await self.ws.close()


async def main():
    server_proc = subprocess.Popen(
        ["python", "-m", "http.server", str(HTTP_PORT)],
        cwd=APP_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(1.0)

    edge_proc = subprocess.Popen(
        [
            EDGE_EXE,
            f"--remote-debugging-port={PORT}",
            "--headless=new",
            "--disable-gpu",
            "--disable-extensions",
            f"http://localhost:{HTTP_PORT}/index.html",
        ]
    )
    time.sleep(2.2)

    try:
        targets_res = urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json").read()
        targets = json.loads(targets_res)
        page_target = next((t for t in targets if t.get("type") == "page"), None)
        if not page_target:
            raise Exception("No Edge page target found!")

        ws_url = page_target["webSocketDebuggerUrl"]
        cdp = CDPClient(ws_url)
        await cdp.connect()

        # 1. Desktop Viewport
        await cdp.send(
            "Emulation.setDeviceMetricsOverride",
            {"width": 1440, "height": 1050, "deviceScaleFactor": 1, "mobile": False},
        )
        await cdp.send("Page.navigate", {"url": f"http://localhost:{HTTP_PORT}/index.html"})
        await asyncio.sleep(2.8)

        # Open Planilha Histórica via button
        await cdp.eval("window.openHistoricoPlanilha()")
        await asyncio.sleep(1.2)

        # Check state and DOM elements
        check_info = await cdp.eval(
            """
            (() => {
                const sec = document.getElementById('section-chuva-historico');
                const monthCards = document.getElementById('hist-monthly-cards-container');
                const tbody = document.getElementById('historico-planilha-tbody');
                const tfoot = document.getElementById('historico-planilha-tfoot');
                const headers = Array.from(document.querySelectorAll('#historico-planilha-table thead th')).map(th => th.innerText.trim());
                return {
                    visible: sec && !sec.classList.contains('hidden'),
                    monthCardsCount: monthCards ? monthCards.children.length : 0,
                    rowsCount: tbody ? tbody.children.length : 0,
                    hasFooter: tfoot && tfoot.innerText.includes('TOTAL GERAL'),
                    headers: headers,
                    badgeText: document.getElementById('hist-rows-count-badge')?.innerText || ''
                };
            })()
        """
        )
        print("[Check 1 - Overview]:", json.dumps(check_info, ensure_ascii=False, indent=2))
        assert check_info["visible"], "section-chuva-historico should be visible!"
        assert check_info["monthCardsCount"] == 2, "Should render 2 monthly summary cards (Outubro & Novembro)!"
        assert check_info["rowsCount"] > 900, f"Expected >900 rows in hourly view, got {check_info['rowsCount']}"
        assert check_info["hasFooter"], "Footer with TOTAL GERAL should be present!"

        # Screenshot 1: Top of Historical Spreadsheet Section (Header, Download Buttons, Monthly Cards, Filter Bar)
        await cdp.eval("document.getElementById('section-chuva-historico').scrollIntoView()")
        await asyncio.sleep(0.5)
        await cdp.screenshot(os.path.join(BRAIN_DIR, "v200_historico_planilha_desktop.png"))

        # Screenshot 2: Scroll to the Spreadsheet Table showing Hourly rows + TOTAL DO DIA + sticky TOTAL GERAL footer
        await cdp.eval(
            """
            (() => {
                const tbl = document.getElementById('historico-planilha-table');
                if (tbl) tbl.scrollIntoView({ block: 'start' });
                const wrapper = tbl ? tbl.parentElement : null;
                if (wrapper) wrapper.scrollTop = 920;
            })()
        """
        )
        await asyncio.sleep(0.6)
        await cdp.screenshot(os.path.join(BRAIN_DIR, "v200_historico_tabela_detalhe_desktop.png"))

        # Screenshot 3: Test selecting a specific rainy day (e.g., 2026-10-03) to verify Diagnostic Card + 24h + TOTAL DO DIA
        await cdp.eval(
            """
            (() => {
                const sel = document.getElementById('hist-filter-day-select');
                if (sel) {
                    sel.value = '2026-10-03';
                    window.onHistoricoFilterChange('day_select');
                }
                document.getElementById('hist-selected-day-card').scrollIntoView({ block: 'start' });
            })()
        """
        )
        await asyncio.sleep(0.6)
        day_check = await cdp.eval(
            """
            (() => {
                const card = document.getElementById('hist-selected-day-card');
                const tbody = document.getElementById('historico-planilha-tbody');
                return {
                    cardVisible: card && !card.classList.contains('hidden'),
                    cardText: card ? card.innerText.substring(0, 180) : '',
                    rowsForDay: tbody ? tbody.children.length : 0
                };
            })()
        """
        )
        print("[Check 2 - Specific Day 03/10/2026]:", json.dumps(day_check, ensure_ascii=False, indent=2))
        assert day_check["cardVisible"], "Diagnostic card for selected day should be visible!"
        assert day_check["rowsForDay"] == 25, f"Expected 24 hourly rows + 1 TOTAL DO DIA row = 25, got {day_check['rowsForDay']}"

        await cdp.screenshot(os.path.join(BRAIN_DIR, "v200_historico_dia_consultado_desktop.png"))

        # Reset filter and test Mobile Viewport
        await cdp.eval("window.clearHistoricoFilters()")
        await asyncio.sleep(0.4)

        await cdp.send(
            "Emulation.setDeviceMetricsOverride",
            {"width": 412, "height": 915, "deviceScaleFactor": 2, "mobile": True},
        )
        await asyncio.sleep(0.6)
        await cdp.eval("document.getElementById('section-chuva-historico').scrollIntoView()")
        await asyncio.sleep(0.5)
        await cdp.screenshot(os.path.join(BRAIN_DIR, "v200_historico_planilha_mobile.png"))

        print("\n>>> ALL V200 HISTORICAL SPREADSHEET VERIFICATIONS PASSED 100%! <<<")
        await cdp.close()

    finally:
        edge_proc.terminate()
        server_proc.terminate()


if __name__ == "__main__":
    asyncio.run(main())
