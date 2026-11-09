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

PORT = 8771
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
        cdp.send("Page.enable")
        cdp.send("Runtime.enable")

        url = f"http://127.0.0.1:{PORT}/index.html?v=191#chuva"
        print(f"Navigating to {url}...")
        cdp.send("Page.navigate", {"url": url})
        time.sleep(3)

        # 1. Verify default theme is Nordic Light
        is_dark = cdp.evaluate("document.documentElement.classList.contains('dark')")
        print(f"1. Theme Check: is_dark={is_dark}")
        assert not is_dark, "FAIL: document should NOT have 'dark' class by default!"

        # 2. Open Social Modal in Chuva mode
        print("2. Opening Social Modal in Chuva mode...")
        cdp.evaluate("window.openSocialModalChuva('24h')")
        time.sleep(1.5)

        tab_state = cdp.evaluate("window.socialState.activeTab")
        print(f"Active tab: {tab_state}")
        assert tab_state == "chuva", f"Expected tab=chuva, got {tab_state}"

        modal_chuva_png = os.path.join(ARTIFACT_DIR, "v191_modal_chuva.png")
        cdp.capture_screenshot(modal_chuva_png)

        # 3. Switch tab to Vento
        print("3. Switching tab to Vento (Card de Ventos & Rajadas)...")
        cdp.evaluate("window.setSocialTab('vento')")
        time.sleep(1.2)

        tab_state_vento = cdp.evaluate("window.socialState.activeTab")
        print(f"Active tab after switch: {tab_state_vento}")
        assert tab_state_vento == "vento", f"Expected tab=vento, got {tab_state_vento}"

        # Verify Chuva controls hidden, Vento controls visible
        controls_check = cdp.evaluate("""(() => {
            const cChuva = document.getElementById('social-controls-chuva');
            const cVento = document.getElementById('social-controls-vento');
            const title = document.getElementById('social-modal-title').innerText;
            const btn = document.getElementById('social-download-main-btn').innerText;
            return {
                chuvaHidden: cChuva.classList.contains('hidden'),
                ventoVisible: !cVento.classList.contains('hidden'),
                title,
                btn
            };
        })()""")
        print(f"Controls check: {controls_check}")
        assert controls_check["chuvaHidden"], "Chuva controls should be hidden!"
        assert controls_check["ventoVisible"], "Vento controls should be visible!"
        assert "Ventos" in controls_check["title"], "Title should mention Ventos!"
        assert "Ventos" in controls_check["btn"], "Download button should mention Ventos!"

        modal_vento_png = os.path.join(ARTIFACT_DIR, "v191_modal_vento.png")
        cdp.capture_screenshot(modal_vento_png)

        # 4. Export Nordic Vento Post (1080x1350)
        print("4. Exporting Nordic Vento Post (1080x1350)...")
        cdp.evaluate("window.setSocialFormat('post')")
        time.sleep(0.8)
        post_url = cdp.evaluate("document.getElementById('social-export-canvas').toDataURL('image/png')")
        assert post_url and "," in post_url
        post_bytes = base64.b64decode(post_url.split(",")[1])
        vento_post_png = os.path.join(ARTIFACT_DIR, "v191_instagram_vento_post_nordic.png")
        with open(vento_post_png, "wb") as f:
            f.write(post_bytes)
        print(f"[OK] Saved Nordic Vento Post: {vento_post_png} ({len(post_bytes)} bytes)")

        # 5. Export Nordic Vento Stories (1080x1920)
        print("5. Exporting Nordic Vento Stories (1080x1920)...")
        cdp.evaluate("window.setSocialFormat('story')")
        time.sleep(0.8)
        story_url = cdp.evaluate("document.getElementById('social-export-canvas').toDataURL('image/png')")
        assert story_url and "," in story_url
        story_bytes = base64.b64decode(story_url.split(",")[1])
        vento_story_png = os.path.join(ARTIFACT_DIR, "v191_instagram_vento_story_nordic.png")
        with open(vento_story_png, "wb") as f:
            f.write(story_bytes)
        print(f"[OK] Saved Nordic Vento Story: {vento_story_png} ({len(story_bytes)} bytes)")

        # 6. Test Vento Metrics (24h and Agora)
        print("6. Testing Vento Metrics...")
        cdp.evaluate("window.setSocialWindMetric('24h')")
        time.sleep(0.5)
        m24h = cdp.evaluate("window.socialState.windMetric")
        assert m24h == "24h"

        cdp.evaluate("window.setSocialWindMetric('agora')")
        time.sleep(0.5)
        magora = cdp.evaluate("window.socialState.windMetric")
        assert magora == "agora"

        # Back to hoje
        cdp.evaluate("window.setSocialWindMetric('hoje')")
        time.sleep(0.5)

        # 7. Switch to Dark Card Theme for Vento
        print("7. Exporting Dark Vento Post...")
        cdp.evaluate("window.setSocialFormat('post')")
        cdp.evaluate("window.setSocialCardTheme('dark')")
        time.sleep(0.8)
        dark_url = cdp.evaluate("document.getElementById('social-export-canvas').toDataURL('image/png')")
        dark_bytes = base64.b64decode(dark_url.split(",")[1])
        vento_dark_png = os.path.join(ARTIFACT_DIR, "v191_instagram_vento_post_dark.png")
        with open(vento_dark_png, "wb") as f:
            f.write(dark_bytes)
        print(f"[OK] Saved Dark Vento Post: {vento_dark_png} ({len(dark_bytes)} bytes)")

        # Switch back to Nordic
        cdp.evaluate("window.setSocialCardTheme('nordic')")
        time.sleep(0.5)

        # 8. Emulate Mobile Viewport (iPhone 390x844)
        print("8. Emulating Mobile Viewport (iPhone 390x844)...")
        cdp.send("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 2,
            "mobile": True
        })
        time.sleep(1)
        mobile_vento_png = os.path.join(ARTIFACT_DIR, "v191_modal_vento_mobile.png")
        cdp.capture_screenshot(mobile_vento_png)

        # Test download function call in mobile simulation
        download_test = cdp.evaluate("""(() => {
            try {
                let shared = false;
                navigator.share = async (d) => { shared = true; return true; };
                window.downloadSocialCurrentFormat();
                return { success: true, shared };
            } catch(e) {
                return { success: false, error: e.message };
            }
        })()""")
        print(f"Mobile download test: {download_test}")
        assert download_test.get("success"), f"Download failed: {download_test}"

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
