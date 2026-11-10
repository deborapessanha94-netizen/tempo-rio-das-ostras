import asyncio
import json
import os
import subprocess
import sys
import time
import urllib.request
import websockets

sys.stdout.reconfigure(encoding="utf-8")

PORT = 9228
APP_DIR = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
BRAIN_DIR = r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf"
HTTP_PORT = 8098
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

        await cdp.send("Network.enable")
        await cdp.send("Network.setCacheDisabled", {"cacheDisabled": True})

        # 1. Desktop Viewport
        await cdp.send(
            "Emulation.setDeviceMetricsOverride",
            {"width": 1440, "height": 960, "deviceScaleFactor": 1, "mobile": False},
        )
        await cdp.send("Page.navigate", {"url": f"http://localhost:{HTTP_PORT}/index.html?v=201"})

        # Wait until state.boletimData is loaded
        for _ in range(25):
            loaded = await cdp.eval("Boolean(window.state && window.state.boletimData && window.state.boletimData.length > 0)")
            if loaded:
                break
            await asyncio.sleep(0.35)

        # Navigate to Gráficos de Tendência
        await cdp.eval("window.navigateSubSection('previsao', 'section-graficos-tendencia')")
        await asyncio.sleep(0.8)
        await cdp.eval("window.updateBulletinChart && window.updateBulletinChart()")
        await asyncio.sleep(0.4)

        # Scroll section into view nicely
        await cdp.eval("document.getElementById('section-graficos-tendencia').scrollIntoView({block: 'start'})")
        await asyncio.sleep(0.4)

        # Check initial state (Temperatura @ 175% Zoom, 8 Dias / 32 Turnos)
        info_temp = await cdp.eval(
            """
            (() => {
                const canvas = document.getElementById('bulletin-chart');
                const stage = document.getElementById('bulletin-chart-stage');
                const status = document.getElementById('bulletin-zoom-status-label')?.innerText || '';
                const chart = canvas?._activeBulletinChart;
                return {
                    visible: !document.getElementById('section-graficos-tendencia').classList.contains('hidden'),
                    stageWidthStyle: stage?.style.width,
                    stageMinWidthStyle: stage?.style.minWidth,
                    stageClientWidth: stage?.clientWidth,
                    viewportClientWidth: document.getElementById('bulletin-chart-scroll-viewport')?.clientWidth,
                    statusText: status,
                    pointsCount: chart?.data?.labels?.length || 0,
                    datasetsCount: chart?.data?.datasets?.length || 0,
                    dayOptionsCount: document.getElementById('bulletin-day-filter-select')?.options?.length || 0
                };
            })()
            """
        )
        print("Desktop Temperatura Default (175% Zoom):", json.dumps(info_temp, ensure_ascii=False, indent=2))
        assert info_temp["visible"], "section-graficos-tendencia must be visible!"
        assert info_temp["pointsCount"] == 32, f"Expected 32 points, got {info_temp['pointsCount']}"
        assert info_temp["stageClientWidth"] >= 2300, f"Stage width must be >= 2300px at 175% zoom, got {info_temp['stageClientWidth']}"

        await cdp.screenshot(os.path.join(BRAIN_DIR, "v201_zoom_temperatura_desktop.png"))

        # Test all 5 metrics
        for metric in ["precipitation", "wind", "pressure", "humidity"]:
            await cdp.eval(f"document.querySelector('.bulletin-tab-btn[data-metric=\"{metric}\"]').click()")
            await asyncio.sleep(0.45)
            m_info = await cdp.eval(
                """
                (() => {
                    const canvas = document.getElementById('bulletin-chart');
                    const chart = canvas?._activeBulletinChart;
                    return {
                        metric: window.state?.activeMetric,
                        labelsLen: chart?.data?.labels?.length || 0,
                        status: document.getElementById('bulletin-zoom-status-label')?.innerText || ''
                    };
                })()
                """
            )
            print(f"Verified metric={metric}:", m_info)
            assert m_info["labelsLen"] == 32

        # Switch to Vento and set Zoom 250%
        await cdp.eval("document.querySelector('.bulletin-tab-btn[data-metric=\"wind\"]').click()")
        await cdp.eval("document.querySelector('.bulletin-zoom-preset-btn[data-zoom=\"250\"]').click()")
        await asyncio.sleep(0.5)
        await cdp.screenshot(os.path.join(BRAIN_DIR, "v201_zoom_vento_250_desktop.png"))

        # Switch to Chuva and test 'Próx. 4 Dias' (16 turnos)
        await cdp.eval("document.querySelector('.bulletin-tab-btn[data-metric=\"precipitation\"]').click()")
        await cdp.eval("document.querySelector('.bulletin-range-btn[data-range=\"first16\"]').click()")
        await asyncio.sleep(0.5)
        info_4d = await cdp.eval(
            """
            (() => {
                const canvas = document.getElementById('bulletin-chart');
                const chart = canvas?._activeBulletinChart;
                return {
                    labelsLen: chart?.data?.labels?.length || 0,
                    status: document.getElementById('bulletin-zoom-status-label')?.innerText || ''
                };
            })()
            """
        )
        print("Chuva Próx. 4 Dias (16 turnos):", info_4d)
        assert info_4d["labelsLen"] == 16
        await cdp.screenshot(os.path.join(BRAIN_DIR, "v201_zoom_chuva_4dias_desktop.png"))

        # Test Mobile Viewport (390x844)
        await cdp.send(
            "Emulation.setDeviceMetricsOverride",
            {"width": 390, "height": 844, "deviceScaleFactor": 2, "mobile": True},
        )
        await cdp.eval("document.getElementById('bulletin-zoom-reset-btn').click()")
        await cdp.eval("document.querySelector('.bulletin-tab-btn[data-metric=\"temperature\"]').click()")
        await asyncio.sleep(0.6)
        await cdp.eval("document.getElementById('section-graficos-tendencia').scrollIntoView({block: 'start'})")
        await asyncio.sleep(0.4)
        await cdp.screenshot(os.path.join(BRAIN_DIR, "v201_zoom_mobile.png"))

        await cdp.close()
        print("ALL v201 CHART ZOOM CHECKS PASSED SUCCESSFULLY!")

    finally:
        edge_proc.terminate()
        server_proc.terminate()


if __name__ == "__main__":
    asyncio.run(main())
