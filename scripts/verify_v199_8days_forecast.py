import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets

PORT = 9222
APP_DIR = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
BRAIN_DIR = r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf"
HTTP_PORT = 8091
EDGE_EXE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

class CDPClient:
    def __init__(self, ws_url):
        self.ws_url = ws_url
        self.msg_id = 0
        self.ws = None

    async def connect(self):
        self.ws = await websockets.connect(self.ws_url, max_size=50*1024*1024)

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
        res = await self.send("Runtime.evaluate", {
            "expression": expr,
            "returnByValue": True,
            "awaitPromise": True
        })
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
        stderr=subprocess.DEVNULL
    )
    time.sleep(1.0)

    edge_proc = subprocess.Popen([
        EDGE_EXE,
        f"--remote-debugging-port={PORT}",
        "--headless=new",
        "--disable-gpu",
        "--disable-extensions",
        f"http://localhost:{HTTP_PORT}/index.html"
    ])
    time.sleep(2.0)

    try:
        targets_res = urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json").read()
        targets = json.loads(targets_res)
        page_target = next((t for t in targets if t.get("type") == "page"), None)
        if not page_target:
            raise Exception("No Edge page target found!")

        ws_url = page_target["webSocketDebuggerUrl"]
        cdp = CDPClient(ws_url)
        await cdp.connect()

        # Desktop Viewport
        await cdp.send("Emulation.setDeviceMetricsOverride", {
            "width": 1400,
            "height": 1100,
            "deviceScaleFactor": 1,
            "mobile": False
        })
        await cdp.send("Page.navigate", {"url": f"http://localhost:{HTTP_PORT}/index.html"})
        await asyncio.sleep(2.5)

        # Navigate to Previsão dos Próximos Dias
        await cdp.eval("window.switchSubSection('previsao', 'section-previsao-3dias')")
        await asyncio.sleep(1.0)

        # Verification 1: Header period and cards count
        period_text = await cdp.eval("document.getElementById('sidebar-period-txt') ? document.getElementById('sidebar-period-txt').innerText : ''")
        cards_count = await cdp.eval("""
            (() => {
                const list = document.getElementById('sidebar-3days-list');
                return list ? list.children.length : 0;
            })()
        """)

        cards_data = await cdp.eval("""
            (() => {
                const list = document.getElementById('sidebar-3days-list');
                if (!list) return [];
                return Array.from(list.children).map((card, i) => {
                    const text = card.innerText;
                    return {
                        index: i,
                        title: card.querySelector('.font-black.text-sm')?.innerText || '',
                        dia: card.querySelector('.text-xs.font-bold')?.innerText || '',
                        data: card.querySelector('.text-\\\\[11px\\\\]')?.innerText || '',
                        temp: card.querySelector('.font-mono')?.innerText || ''
                    };
                });
            })()
        """)

        print(f"[Verification 1] Period text: {period_text}")
        print(f"[Verification 1] Cards count: {cards_count} (expected 8)")
        print(f"[Verification 1] Cards summary: {json.dumps(cards_data, ensure_ascii=False, indent=2)}")

        assert cards_count == 8, f"Expected 8 cards in sidebar-3days-list, found {cards_count}!"

        # Screenshot Desktop 8 Cards
        await cdp.screenshot(os.path.join(BRAIN_DIR, "v199_previsao_8dias_desktop.png"))

        # Verification 2: Mobile Viewport
        await cdp.send("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 2,
            "mobile": True
        })
        await asyncio.sleep(0.5)

        # Scroll to cards
        await cdp.eval("document.getElementById('section-previsao-3dias').scrollIntoView()")
        await asyncio.sleep(0.5)

        await cdp.screenshot(os.path.join(BRAIN_DIR, "v199_previsao_8dias_mobile.png"))

        # Verification 3: Check turnos 8 days selector in Boletim
        await cdp.eval("window.switchAppTab('boletim')")
        await asyncio.sleep(0.5)
        turnos_btns_count = await cdp.eval("""
            (() => {
                const sel = document.getElementById('chuva-turnos-day-selector');
                return sel ? sel.querySelectorAll('button').length : 0;
            })()
        """)
        print(f"[Verification 3] Turnos day selector buttons count: {turnos_btns_count} (expected 8)")
        assert turnos_btns_count == 8, f"Expected 8 buttons in chuva-turnos-day-selector, found {turnos_btns_count}!"

        print("\n>>> ALL V199 VERIFICATIONS PASSED SUCCESSFULLY! <<<")
        await cdp.close()

    finally:
        edge_proc.terminate()
        server_proc.terminate()

if __name__ == "__main__":
    asyncio.run(main())
