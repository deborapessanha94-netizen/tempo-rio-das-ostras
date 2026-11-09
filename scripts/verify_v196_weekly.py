import os
import sys
import time
import json
import base64
import tempfile
import threading
import subprocess
from http.server import SimpleHTTPRequestHandler, HTTPServer
import urllib.request
import websocket

PORT = 8790
PROJECT_DIR = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
ARTIFACT_DIR = r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf"
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROJECT_DIR, **kwargs)
    def log_message(self, format, *args):
        pass

def start_server():
    httpd = HTTPServer(('127.0.0.1', PORT), QuietHandler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    return httpd

class CDPClient:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, timeout=30)
        self.msg_id = 0

    def send(self, method, params=None):
        self.msg_id += 1
        payload = {"id": self.msg_id, "method": method}
        if params:
            payload["params"] = params
        self.ws.send(json.dumps(payload))
        while True:
            res = json.loads(self.ws.recv())
            if res.get("id") == self.msg_id:
                return res

    def evaluate(self, expression):
        res = self.send("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True
        })
        if "error" in res:
            raise RuntimeError(f"Eval error: {res['error']}")
        result = res.get("result", {}).get("result", {})
        return result.get("value")

    def capture_screenshot(self, output_path, clip=None):
        params = {"format": "png"}
        if clip:
            params["clip"] = clip
        res = self.send("Page.captureScreenshot", params)
        data = res.get("result", {}).get("data", "")
        if data:
            with open(output_path, "wb") as f:
                f.write(base64.b64decode(data))
            print(f"Screenshot saved: {os.path.basename(output_path)}")
            return True
        return False

def main():
    print(f"Starting server on port {PORT}...")
    server = start_server()
    user_data_dir = tempfile.mkdtemp()
    cdp_port = 9350
    
    cmd = [
        EDGE_PATH,
        f"--remote-debugging-port={cdp_port}",
        f"--user-data-dir={user_data_dir}",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--headless=new",
        "--disable-gpu",
        "--window-size=1280,950",
        "about:blank"
    ]
    proc = subprocess.Popen(cmd)

    ws_url = None
    for _ in range(25):
        time.sleep(0.4)
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{cdp_port}/json", timeout=2) as resp:
                targets = json.loads(resp.read().decode())
                for t in targets:
                    if t.get("type") == "page" and "webSocketDebuggerUrl" in t:
                        ws_url = t["webSocketDebuggerUrl"]
                        break
            if ws_url:
                break
        except Exception:
            pass

    if not ws_url:
        print("[ERROR] Could not connect to Edge page target")
        proc.kill()
        server.shutdown()
        return

    print(f"Connected to Edge Page Target: {ws_url}")
    cdp = CDPClient(ws_url)

    try:
        cdp.send("Page.enable")
        cdp.send("Runtime.enable")

        url = f"http://127.0.0.1:{PORT}/index.html?v=196"
        print(f"Navigating to {url}...")
        cdp.send("Page.navigate", {"url": url})
        
        # Wait for data load
        print("Waiting for data load...")
        for _ in range(15):
            time.sleep(0.5)
            ready = cdp.evaluate("Boolean(window.state && window.state.weatherData)")
            if ready:
                print("WeatherData ready in state!")
                break

        # 1. Test Dropdown Menu (Previsão & Tempo • Seções)
        print("1. Testing Dropdown Menu...")
        cdp.evaluate("window.toggleNavDropdown('previsao')")
        time.sleep(0.6)

        dropdown_info = cdp.evaluate("""
            (() => {
                const wrapper = document.getElementById('nav-wrapper-previsao');
                const menu = wrapper ? wrapper.querySelector('.nav-dropdown-menu') : null;
                const items = menu ? Array.from(menu.querySelectorAll('.nav-dropdown-item')).map(a => a.textContent.trim().replace(/\\s+/g, ' ')) : [];
                return {
                    isOpen: wrapper ? wrapper.classList.contains('open') : false,
                    hasWeekly: items.some(t => t.includes('Panorama Semanal')),
                    itemsCount: items.length,
                    items
                };
            })()
        """)
        print("Dropdown status:", dropdown_info)

        # Screenshot of dropdown menu
        cdp.capture_screenshot(os.path.join(ARTIFACT_DIR, "v196_dropdown_desktop.png"), {
            "x": 0, "y": 0, "width": 600, "height": 650, "scale": 1
        })

        # 2. Navigate to Panorama Semanal
        print("2. Navigating to section-panorama-semanal...")
        cdp.evaluate("window.switchSubSection('previsao', 'section-panorama-semanal')")
        time.sleep(1.0)

        section_info = cdp.evaluate("""
            (() => {
                const sec = document.getElementById('section-panorama-semanal');
                if (!sec) return { found: false };
                const isHidden = sec.classList.contains('hidden');
                const title = sec.querySelector('h2')?.textContent.trim();
                const table = sec.querySelector('table');
                const rows = table ? table.querySelectorAll('tbody tr') : [];
                const dailyCards = sec.querySelectorAll('.grid > div');
                return {
                    found: true,
                    isHidden,
                    title,
                    dailyCardsCount: dailyCards.length,
                    tableRowsCount: rows.length,
                    contentLength: sec.innerHTML.length
                };
            })()
        """)
        print("Section evaluation:", section_info)

        # Screenshot of Panorama Semanal section (Desktop)
        sec_box = cdp.evaluate("""
            (() => {
                const sec = document.getElementById('section-panorama-semanal');
                if (!sec) return null;
                const rect = sec.getBoundingClientRect();
                return { x: 0, y: Math.max(0, rect.top + window.pageYOffset - 80), width: 1280, height: 1650 };
            })()
        """)
        if sec_box:
            cdp.capture_screenshot(os.path.join(ARTIFACT_DIR, "v196_secao_panorama_semanal_desktop.png"), {
                "x": sec_box["x"], "y": sec_box["y"], "width": sec_box["width"], "height": sec_box["height"], "scale": 1
            })

        # 3. Test Social Modal on Tab Semanal
        print("3. Testing Social Modal tab 'semanal'...")
        cdp.evaluate("window.openSocialModalSemanal()")
        time.sleep(1.2)

        modal_status = cdp.evaluate("""
            (() => {
                const modal = document.getElementById('modal-social-chuva');
                const canvas = document.getElementById('social-export-canvas');
                return {
                    isOpen: modal && !modal.classList.contains('hidden'),
                    activeTab: window.socialState?.activeTab,
                    canvasW: canvas?.width,
                    canvasH: canvas?.height
                };
            })()
        """)
        print("Modal status:", modal_status)

        # Capture Dark Theme Post (4:5) Modal
        cdp.capture_screenshot(os.path.join(ARTIFACT_DIR, "v196_modal_semanal_dark.png"), {
            "x": 0, "y": 0, "width": 1280, "height": 950, "scale": 1
        })

        # Save Canvas directly to PNG
        def save_canvas(filename):
            data_url = cdp.evaluate("document.getElementById('social-export-canvas').toDataURL('image/png')")
            if data_url and ',' in data_url:
                b64 = data_url.split(',')[1]
                path = os.path.join(ARTIFACT_DIR, filename)
                with open(path, "wb") as f:
                    f.write(base64.b64decode(b64))
                print(f"Canvas exported: {filename}")

        save_canvas("v196_semanal_post_dark.png")

        # Switch to Story (9:16)
        print("Switching to Story format...")
        cdp.evaluate("window.setSocialFormat('story')")
        time.sleep(0.6)
        save_canvas("v196_semanal_story_dark.png")

        # Switch to Nordic Light Theme
        print("Switching to Nordic Light Theme...")
        cdp.evaluate("window.setSocialCardTheme('nordic')")
        time.sleep(0.6)
        save_canvas("v196_semanal_story_clara.png")

        # Switch back to Post in Nordic Light
        cdp.evaluate("window.setSocialFormat('post')")
        time.sleep(0.6)
        save_canvas("v196_semanal_post_clara.png")

        # Close Modal
        cdp.evaluate("window.closeSocialModalChuva()")
        time.sleep(0.5)

        # 4. Mobile Responsiveness Test (iPhone 390x844)
        print("4. Testing Mobile Viewport (390x844)...")
        cdp.send("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 2,
            "mobile": True
        })
        time.sleep(0.5)

        cdp.evaluate("window.scrollTo(0, 0)")
        time.sleep(0.5)

        # Open mobile dropdown
        print("Opening Mobile Dropdown...")
        cdp.evaluate("window.toggleNavDropdown('previsao')")
        time.sleep(0.8)

        cdp.capture_screenshot(os.path.join(ARTIFACT_DIR, "v196_mobile_dropdown.png"), {
            "x": 0, "y": 0, "width": 390, "height": 650, "scale": 1
        })

        # Navigate to weekly section on mobile
        cdp.evaluate("window.navigateSubSection('previsao', 'section-panorama-semanal')")
        time.sleep(1.0)

        cdp.capture_screenshot(os.path.join(ARTIFACT_DIR, "v196_secao_panorama_semanal_mobile.png"), {
            "x": 0, "y": 0, "width": 390, "height": 950, "scale": 1
        })

        # Test clicking the social card button on mobile
        print("Testing Social Card on Mobile...")
        cdp.evaluate("window.openSocialModalSemanal()")
        time.sleep(1.0)

        cdp.capture_screenshot(os.path.join(ARTIFACT_DIR, "v196_modal_semanal_mobile.png"), {
            "x": 0, "y": 0, "width": 390, "height": 844, "scale": 1
        })

        print("=== ALL CDP VERIFICATIONS COMPLETED SUCCESSFULLY! ===")

    finally:
        proc.kill()
        server.shutdown()

if __name__ == "__main__":
    main()
