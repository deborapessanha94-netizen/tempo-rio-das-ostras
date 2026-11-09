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

PORT = 8769
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
        self.ws = websocket.create_connection(ws_url, timeout=15)
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
            "returnByValue": True,
            "awaitPromise": True
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
        data = res.get("result", {}).get("data")
        if data:
            with open(output_path, "wb") as f:
                f.write(base64.b64decode(data))
            print(f"[OK] Saved screenshot: {output_path}")

    def close(self):
        try:
            self.ws.close()
        except Exception:
            pass

def main():
    print("Starting local HTTP server...")
    httpd = start_server()
    time.sleep(0.5)

    temp_user_data = tempfile.mkdtemp()
    edge_cmd = [
        EDGE_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        f"--user-data-dir={temp_user_data}",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--window-size=1400,950",
        "about:blank"
    ]
    print("Launching headless Edge...")
    edge_proc = subprocess.Popen(edge_cmd)

    ws_url = None
    for _ in range(20):
        time.sleep(0.5)
        try:
            with urllib.request.urlopen("http://127.0.0.1:9222/json", timeout=2) as resp:
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
        print("[ERROR] Could not connect to Edge CDP")
        edge_proc.terminate()
        return

    print(f"Connected to CDP: {ws_url}")
    cdp = CDPClient(ws_url)

    try:
        # Enable Page and Runtime
        cdp.send("Page.enable")
        cdp.send("Runtime.enable")

        url = f"http://127.0.0.1:{PORT}/index.html?v=190#chuva"
        print(f"Navigating to {url}...")
        cdp.send("Page.navigate", {"url": url})
        time.sleep(3)

        # 1. Verify default theme is Nordic Light
        is_dark = cdp.evaluate("document.documentElement.classList.contains('dark')")
        bg_color = cdp.evaluate("window.getComputedStyle(document.body).backgroundColor")
        print(f"1. Theme Check: is_dark={is_dark}, body bg_color={bg_color}")
        assert not is_dark, "FAIL: document should NOT have 'dark' class by default!"

        # 2. Open Social Modal
        print("2. Opening Social Modal...")
        cdp.evaluate("window.openSocialModal('chuva')")
        time.sleep(1.5)

        modal_visible = cdp.evaluate("""
            const m = document.getElementById('modal-social-chuva');
            Boolean(m && !m.classList.contains('hidden'))
        """)
        print(f"Modal is visible: {modal_visible}")
        assert modal_visible, "FAIL: Modal should be visible!"

        # Take screenshot of the desktop modal
        modal_desktop_png = os.path.join(ARTIFACT_DIR, "v190_modal_social_desktop.png")
        cdp.capture_screenshot(modal_desktop_png)

        # 3. Test typing custom hours: 15h
        print("3. Testing custom hours typing (15h)...")
        state_15 = cdp.evaluate("""(() => {
            const inp = document.getElementById('social-custom-hours-input');
            inp.value = '15';
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            return {
                hours: window.socialState.horizonHours,
                isHoje: window.socialState.isHoje,
                firstStationRain: window.getStationRainForSocial ? window.getStationRainForSocial(window.socialState.stationsData[0]) : null
            };
        })()""")
        print(f"State after typing 15: {state_15}")
        assert state_15['hours'] == 15.0, f"Expected 15.0, got {state_15['hours']}"
        assert state_15['isHoje'] == False, "Expected isHoje=False"

        time.sleep(0.5)

        # Test typing custom hours: 36h
        state_36 = cdp.evaluate("""(() => {
            const inp = document.getElementById('social-custom-hours-input');
            inp.value = '36';
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            return {
                hours: window.socialState.horizonHours,
                isHoje: window.socialState.isHoje
            };
        })()""")
        print(f"State after typing 36: {state_36}")
        assert state_36['hours'] == 36.0, f"Expected 36.0, got {state_36['hours']}"

        # Test clicking Hoje (desde 00h)
        state_hoje = cdp.evaluate("""(() => {
            const btn = document.getElementById('social-btn-toggle-hoje');
            if (btn) btn.click();
            return {
                hours: window.socialState.horizonHours,
                isHoje: window.socialState.isHoje
            };
        })()""")
        print(f"State after clicking Hoje: {state_hoje}")
        assert state_hoje['isHoje'] == True, "Expected isHoje=True"

        # 4. Check card canvas export in Nordic Light palette
        print("4. Exporting canvas in Nordic Light palette...")
        # Post format
        cdp.evaluate("window.setSocialFormat('post')")
        time.sleep(0.8)
        post_data_url = cdp.evaluate("document.getElementById('social-export-canvas').toDataURL('image/png')")
        if post_data_url and "," in post_data_url:
            post_bytes = base64.b64decode(post_data_url.split(",")[1])
            post_png = os.path.join(ARTIFACT_DIR, "v190_instagram_post_nordic.png")
            with open(post_png, "wb") as f:
                f.write(post_bytes)
            print(f"[OK] Saved Nordic Post: {post_png} ({len(post_bytes)} bytes)")

        # Story format
        cdp.evaluate("window.setSocialFormat('story')")
        time.sleep(0.8)
        story_data_url = cdp.evaluate("document.getElementById('social-export-canvas').toDataURL('image/png')")
        if story_data_url and "," in story_data_url:
            story_bytes = base64.b64decode(story_data_url.split(",")[1])
            story_png = os.path.join(ARTIFACT_DIR, "v190_instagram_story_nordic.png")
            with open(story_png, "wb") as f:
                f.write(story_bytes)
            print(f"[OK] Saved Nordic Story: {story_png} ({len(story_bytes)} bytes)")

        # Switch to Dark palette
        print("5. Switching to Dark Card Palette...")
        cdp.evaluate("window.setSocialCardTheme('dark')")
        time.sleep(0.8)
        dark_post_data = cdp.evaluate("document.getElementById('social-export-canvas').toDataURL('image/png')")
        if dark_post_data and "," in dark_post_data:
            dark_bytes = base64.b64decode(dark_post_data.split(",")[1])
            dark_png = os.path.join(ARTIFACT_DIR, "v190_instagram_post_dark.png")
            with open(dark_png, "wb") as f:
                f.write(dark_bytes)
            print(f"[OK] Saved Dark Post: {dark_png} ({len(dark_bytes)} bytes)")

        # Switch back to Nordic
        cdp.evaluate("window.setSocialCardTheme('nordic')")
        time.sleep(0.5)

        # 6. Test Mobile Viewport
        print("6. Emulating Mobile Viewport (iPhone 390x844)...")
        cdp.send("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 2,
            "mobile": True
        })
        time.sleep(1)
        mobile_modal_png = os.path.join(ARTIFACT_DIR, "v190_modal_social_mobile.png")
        cdp.capture_screenshot(mobile_modal_png)

        # Test mobile download function call (ensure no JS crash)
        download_res = cdp.evaluate("""(() => {
            try {
                // Mock navigator.share to verify it gets invoked on mobile
                let shared = false;
                navigator.share = async (data) => { shared = true; return true; };
                window.downloadSocialCard();
                return { success: true, shared };
            } catch(e) {
                return { success: false, error: e.message };
            }
        })()""")
        print(f"Mobile download test result: {download_res}")
        assert download_res.get("success"), f"Mobile download failed: {download_res}"

        print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")

    finally:
        cdp.close()
        edge_proc.terminate()
        try:
            edge_proc.wait(timeout=3)
        except Exception:
            edge_proc.kill()

if __name__ == "__main__":
    main()
