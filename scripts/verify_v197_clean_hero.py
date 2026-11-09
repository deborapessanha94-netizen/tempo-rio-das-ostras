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
HTTP_PORT = 8089

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
    # 1. Start local http server
    server_proc = subprocess.Popen(
        ["python", "-m", "http.server", str(HTTP_PORT)],
        cwd=APP_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(1.0)

    # 2. Launch Edge in headless remote debugging mode
    edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    edge_proc = subprocess.Popen([
        edge_exe,
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

        # Set desktop viewport
        await cdp.send("Emulation.setDeviceMetricsOverride", {
            "width": 1280,
            "height": 900,
            "deviceScaleFactor": 1,
            "mobile": False
        })
        await cdp.send("Page.navigate", {"url": f"http://localhost:{HTTP_PORT}/index.html"})
        await asyncio.sleep(2.5)

        # Verification 1: Hero Card clean check
        hero_btn_top = await cdp.eval("!!document.getElementById('btn-hero-export-social')")
        hero_btn_main = await cdp.eval("!!document.getElementById('btn-hero-export-social-main')")
        hero_btn_semanal_hero = await cdp.eval("!!document.getElementById('btn-hero-panorama-semanal')")
        hero_footer_postar = await cdp.eval("""
            (() => {
                const hero = document.getElementById('section-hero-previsao');
                if (!hero) return false;
                const buttons = Array.from(hero.querySelectorAll('button'));
                return buttons.some(b => b.innerText.includes('Postar Tempo Agora') || b.innerText.includes('Baixar Imagem'));
            })()
        """)

        print(f"[Verification 1] Hero top button exists: {hero_btn_top} (expected False)")
        print(f"[Verification 1] Hero main banner exists: {hero_btn_main} (expected False)")
        print(f"[Verification 1] Hero semanal banner exists: {hero_btn_semanal_hero} (expected False)")
        print(f"[Verification 1] Hero footer postar exists: {hero_footer_postar} (expected False)")
        assert not hero_btn_top, "Hero top button still exists!"
        assert not hero_btn_main, "Hero main banner still exists!"
        assert not hero_btn_semanal_hero, "Hero semanal banner still exists!"
        assert not hero_footer_postar, "Hero footer postar button still exists!"

        # Screenshot clean desktop hero
        await cdp.screenshot(os.path.join(BRAIN_DIR, "v197_hero_clean_desktop.png"))

        # Verification 2: Check Previsao dropdown items
        # Open dropdown
        await cdp.eval("window.toggleNavDropdown('previsao')")
        await asyncio.sleep(0.5)

        dropdown_info = await cdp.eval("""
            (() => {
                const wrapper = document.getElementById('nav-wrapper-previsao');
                if (!wrapper) return { found: false };
                const menu = wrapper.querySelector('.nav-dropdown-menu');
                const items = Array.from(wrapper.querySelectorAll('.nav-dropdown-item, a, button')).map(el => el.innerText.trim()).filter(Boolean);
                const hasCardTempo = items.some(t => t.includes('Baixar Card Tempo Agora'));
                const hasCardSemanal = items.some(t => t.includes('Baixar Card Panorama Semanal'));
                const hasPanoramaSemanal = items.some(t => t.includes('Panorama Semanal (7 Dias)'));
                return {
                    found: true,
                    isOpen: wrapper.classList.contains('open'),
                    hasCardTempo,
                    hasCardSemanal,
                    hasPanoramaSemanal,
                    itemsCount: items.length
                };
            })()
        """)
        print(f"[Verification 2] Dropdown Info: {dropdown_info}")
        assert dropdown_info["hasCardTempo"], "Dropdown missing Baixar Card Tempo Agora!"
        assert dropdown_info["hasCardSemanal"], "Dropdown missing Baixar Card Panorama Semanal!"
        assert dropdown_info["hasPanoramaSemanal"], "Dropdown missing Panorama Semanal (7 Dias)!"

        # Screenshot dropdown open
        await cdp.screenshot(os.path.join(BRAIN_DIR, "v197_dropdown_with_download_items.png"))

        # Verification 3: Test opening modal from dropdown for Tempo Agora
        await cdp.eval("window.openSocialModalWithTab('tempo')")
        await asyncio.sleep(1.0)
        modal_open_tempo = await cdp.eval("!document.getElementById('modal-social-chuva').classList.contains('hidden')")
        tab_active_tempo = await cdp.eval("window.socialState.activeTab")
        print(f"[Verification 3] Modal open: {modal_open_tempo}, Active tab: {tab_active_tempo}")
        assert modal_open_tempo and tab_active_tempo == 'tempo', "Failed to open Tempo Agora modal!"

        # Close modal
        await cdp.eval("window.closeSocialModalChuva()")
        await asyncio.sleep(0.5)

        # Verification 4: Test opening modal from dropdown for Panorama Semanal
        await cdp.eval("window.openSocialModalWithTab('semanal')")
        await asyncio.sleep(1.0)
        modal_open_semanal = await cdp.eval("!document.getElementById('modal-social-chuva').classList.contains('hidden')")
        tab_active_semanal = await cdp.eval("window.socialState.activeTab")
        print(f"[Verification 4] Modal open: {modal_open_semanal}, Active tab: {tab_active_semanal}")
        assert modal_open_semanal and tab_active_semanal == 'semanal', "Failed to open Panorama Semanal modal!"

        # Close modal
        await cdp.eval("window.closeSocialModalChuva()")
        await asyncio.sleep(0.5)

        # Verification 5: Mobile viewport test
        await cdp.send("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 2,
            "mobile": True
        })
        await asyncio.sleep(0.5)

        # Mobile hero screenshot
        await cdp.screenshot(os.path.join(BRAIN_DIR, "v197_hero_clean_mobile.png"))

        # Click tab on mobile to open mobile dropdown panel
        await cdp.eval("window.toggleNavDropdown('previsao')")
        await asyncio.sleep(0.5)

        mobile_panel_info = await cdp.eval("""
            (() => {
                const panel = document.getElementById('mobile-dropdown-panel');
                if (!panel) return { found: false };
                const isVisible = !panel.classList.contains('hidden');
                const contentText = panel.innerText;
                return {
                    found: true,
                    isVisible,
                    hasCardTempo: contentText.includes('Baixar Card Tempo Agora'),
                    hasCardSemanal: contentText.includes('Baixar Card Panorama Semanal')
                };
            })()
        """)
        print(f"[Verification 5] Mobile Dropdown Panel: {mobile_panel_info}")
        assert mobile_panel_info["hasCardTempo"], "Mobile panel missing Baixar Card Tempo Agora!"
        assert mobile_panel_info["hasCardSemanal"], "Mobile panel missing Baixar Card Panorama Semanal!"

        # Mobile dropdown screenshot
        await cdp.screenshot(os.path.join(BRAIN_DIR, "v197_mobile_dropdown_download_items.png"))

        print("\n>>> ALL V197 VERIFICATIONS PASSED SUCCESSFULLY! <<<")
        await cdp.close()

    finally:
        edge_proc.terminate()
        server_proc.terminate()

if __name__ == "__main__":
    asyncio.run(main())
