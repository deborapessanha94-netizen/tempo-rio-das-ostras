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
HTTP_PORT = 8090
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

        # Desktop
        await cdp.send("Emulation.setDeviceMetricsOverride", {
            "width": 1280,
            "height": 900,
            "deviceScaleFactor": 1,
            "mobile": False
        })
        await cdp.send("Page.navigate", {"url": f"http://localhost:{HTTP_PORT}/index.html"})
        await asyncio.sleep(2.5)

        # 1. Verify section-panorama-semanal is gone
        has_semanal_section = await cdp.eval("!!document.getElementById('section-panorama-semanal')")
        print(f"[Verification 1] section-panorama-semanal exists in DOM: {has_semanal_section} (expected False)")
        assert not has_semanal_section, "section-panorama-semanal still in DOM!"

        # 2. Open desktop dropdown and verify items
        await cdp.eval("window.toggleNavDropdown('previsao')")
        await asyncio.sleep(0.5)

        dropdown_info = await cdp.eval("""
            (() => {
                const wrapper = document.getElementById('nav-wrapper-previsao');
                if (!wrapper) return { found: false };
                const text = wrapper.innerText;
                return {
                    found: true,
                    isOpen: wrapper.classList.contains('open'),
                    hasPanoramaSemanal: text.includes('Panorama Semanal'),
                    hasSegundaDomingo: text.includes('SEGUNDA A DOMINGO'),
                    hasCardTempo: text.includes('Baixar Card Tempo Agora'),
                    hasCardSemanal: text.includes('Baixar Card Panorama Semanal')
                };
            })()
        """)
        print(f"[Verification 2] Desktop Dropdown Info: {dropdown_info}")
        assert not dropdown_info["hasPanoramaSemanal"], "Dropdown still contains Panorama Semanal!"
        assert not dropdown_info["hasSegundaDomingo"], "Dropdown still contains SEGUNDA A DOMINGO badge!"
        assert not dropdown_info["hasCardSemanal"], "Dropdown still contains Baixar Card Panorama Semanal!"
        assert dropdown_info["hasCardTempo"], "Dropdown missing Baixar Card Tempo Agora!"

        await cdp.screenshot(os.path.join(BRAIN_DIR, "v198_dropdown_desktop_clean.png"))

        # 3. Mobile test
        await cdp.send("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 2,
            "mobile": True
        })
        await asyncio.sleep(0.5)

        await cdp.eval("window.toggleNavDropdown('previsao')")
        await asyncio.sleep(0.5)

        mobile_info = await cdp.eval("""
            (() => {
                const panel = document.getElementById('mobile-dropdown-panel');
                if (!panel) return { found: false };
                const text = panel.innerText;
                return {
                    found: true,
                    isVisible: !panel.classList.contains('hidden'),
                    hasPanoramaSemanal: text.includes('Panorama Semanal'),
                    hasSegundaDomingo: text.includes('SEGUNDA A DOMINGO'),
                    hasCardTempo: text.includes('Baixar Card Tempo Agora'),
                    hasCardSemanal: text.includes('Baixar Card Panorama Semanal')
                };
            })()
        """)
        print(f"[Verification 3] Mobile Dropdown Info: {mobile_info}")
        assert not mobile_info["hasPanoramaSemanal"], "Mobile panel still contains Panorama Semanal!"
        assert not mobile_info["hasSegundaDomingo"], "Mobile panel still contains SEGUNDA A DOMINGO badge!"
        assert not mobile_info["hasCardSemanal"], "Mobile panel still contains Baixar Card Panorama Semanal!"
        assert mobile_info["hasCardTempo"], "Mobile panel missing Baixar Card Tempo Agora!"

        await cdp.screenshot(os.path.join(BRAIN_DIR, "v198_mobile_dropdown_clean.png"))

        print("\n>>> ALL V198 VERIFICATIONS PASSED SUCCESSFULLY! <<<")
        await cdp.close()

    finally:
        edge_proc.terminate()
        server_proc.terminate()

if __name__ == "__main__":
    asyncio.run(main())
