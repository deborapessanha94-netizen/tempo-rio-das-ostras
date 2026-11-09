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

PORT = 8774
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
        "--remote-debugging-port=9223",
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
            with urllib.request.urlopen("http://127.0.0.1:9223/json", timeout=2) as resp:
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

        url = f"http://127.0.0.1:{PORT}/index.html?v=193#chuva"
        print(f"Navigating to {url}...")
        cdp.send("Page.navigate", {"url": url})
        time.sleep(3)

        # 1. Open modal directly in Vento mode
        print("1. Opening modal in Vento mode...")
        cdp.evaluate("window.openSocialModalVento()")
        time.sleep(1.5)

        # Check filterMode is 'active'
        filter_mode = cdp.evaluate("window.socialState.filterMode")
        print(f"Filter mode: {filter_mode}")
        assert filter_mode == "active", f"Expected active, got {filter_mode}"

        # 2. Check active stations for wind
        active_wind_stations = cdp.evaluate("""(() => {
            const raw = window.socialState.stationsData || [];
            return raw.filter(s => s.online !== false && (s.categoria === 'meteorologica' || s.tipo === 'meteorologica' || s.codigo.startsWith('IR') || s.codigo.startsWith('IC')))
                      .map(s => s.nome_curto || s.nome);
        })()""")
        print(f"Active wind stations: {active_wind_stations}")
        assert len(active_wind_stations) == 4, f"Expected 4 active wind stations, got {len(active_wind_stations)}"
        assert not any("Jacinto" in s or "Pássaros" in s for s in active_wind_stations)

        # 3. Test Dark Mode for Vento (Standard default)
        print("3. Checking Dark Mode for Vento...")
        theme_state = cdp.evaluate("window.socialState.cardTheme")
        print(f"Card theme state: {theme_state}")
        if theme_state != "dark":
            cdp.evaluate("window.setSocialCardTheme('dark')")
            time.sleep(0.5)

        # Capture modal in Dark Mode
        modal_vento_dark_png = os.path.join(ARTIFACT_DIR, "v193_modal_vento_dark.png")
        cdp.capture_screenshot(modal_vento_dark_png)

        # Export Dark Vento Post
        post_url = cdp.evaluate("document.getElementById('social-export-canvas').toDataURL('image/png')")
        post_bytes = base64.b64decode(post_url.split(",")[1])
        dark_vento_post_png = os.path.join(ARTIFACT_DIR, "v193_instagram_vento_post_dark.png")
        with open(dark_vento_post_png, "wb") as f:
            f.write(post_bytes)
        print(f"[OK] Saved Dark Vento Post: {dark_vento_post_png} ({len(post_bytes)} bytes)")

        # Export Dark Vento Stories
        cdp.evaluate("window.setSocialFormat('story')")
        time.sleep(0.8)
        story_url = cdp.evaluate("document.getElementById('social-export-canvas').toDataURL('image/png')")
        story_bytes = base64.b64decode(story_url.split(",")[1])
        dark_vento_story_png = os.path.join(ARTIFACT_DIR, "v193_instagram_vento_story_dark.png")
        with open(dark_vento_story_png, "wb") as f:
            f.write(story_bytes)
        print(f"[OK] Saved Dark Vento Stories: {dark_vento_story_png} ({len(story_bytes)} bytes)")

        # 4. Switch to Chuva in Dark Mode
        print("4. Switching to Chuva in Dark Mode...")
        cdp.evaluate("window.setSocialFormat('post')")
        cdp.evaluate("window.setSocialTab('chuva')")
        time.sleep(0.8)

        dark_chuva_url = cdp.evaluate("document.getElementById('social-export-canvas').toDataURL('image/png')")
        dark_chuva_bytes = base64.b64decode(dark_chuva_url.split(",")[1])
        dark_chuva_png = os.path.join(ARTIFACT_DIR, "v193_instagram_chuva_post_dark.png")
        with open(dark_chuva_png, "wb") as f:
            f.write(dark_chuva_bytes)
        print(f"[OK] Saved Dark Chuva Post: {dark_chuva_png} ({len(dark_chuva_bytes)} bytes)")

        # 5. Switch to Clara (Nórdica)
        print("5. Switching to Clara (Nórdica)...")
        cdp.evaluate("window.setSocialCardTheme('nordic')")
        time.sleep(0.8)

        clara_chuva_url = cdp.evaluate("document.getElementById('social-export-canvas').toDataURL('image/png')")
        clara_chuva_bytes = base64.b64decode(clara_chuva_url.split(",")[1])
        clara_chuva_png = os.path.join(ARTIFACT_DIR, "v193_instagram_chuva_post_clara.png")
        with open(clara_chuva_png, "wb") as f:
            f.write(clara_chuva_bytes)
        print(f"[OK] Saved Clara Chuva Post: {clara_chuva_png} ({len(clara_chuva_bytes)} bytes)")

        # Switch back to Vento in Clara
        cdp.evaluate("window.setSocialTab('vento')")
        time.sleep(0.8)
        clara_vento_url = cdp.evaluate("document.getElementById('social-export-canvas').toDataURL('image/png')")
        clara_vento_bytes = base64.b64decode(clara_vento_url.split(",")[1])
        clara_vento_png = os.path.join(ARTIFACT_DIR, "v193_instagram_vento_post_clara.png")
        with open(clara_vento_png, "wb") as f:
            f.write(clara_vento_bytes)
        print(f"[OK] Saved Clara Vento Post: {clara_vento_png} ({len(clara_vento_bytes)} bytes)")

        # 6. Test Mobile Viewport
        print("6. Emulating Mobile Viewport (iPhone 390x844)...")
        cdp.send("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 2,
            "mobile": True
        })
        time.sleep(1)
        mobile_png = os.path.join(ARTIFACT_DIR, "v193_modal_vento_mobile_dark.png")
        cdp.evaluate("window.setSocialCardTheme('dark')")
        time.sleep(0.5)
        cdp.capture_screenshot(mobile_png)

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
