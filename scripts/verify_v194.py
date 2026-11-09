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

PORT = 8778
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
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    print("Starting local HTTP server...")
    httpd = start_server()
    time.sleep(0.5)

    temp_user_data = tempfile.mkdtemp()
    edge_cmd = [
        EDGE_PATH,
        "--headless=new",
        "--remote-debugging-port=9227",
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
            with urllib.request.urlopen("http://127.0.0.1:9227/json", timeout=2) as resp:
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

        url = f"http://127.0.0.1:{PORT}/index.html?v=194#previsao"
        print(f"Navigating to {url}...")
        cdp.send("Page.navigate", {"url": url})
        time.sleep(3.5)

        # 1. Verify buttons on Hero Card
        print("1. Checking buttons on Hero Card...")
        btn_top_exists = cdp.evaluate("Boolean(document.getElementById('btn-hero-export-social'))")
        print(f"Top hero button exists: {btn_top_exists}")
        assert btn_top_exists, "Expected btn-hero-export-social to exist"

        # 2. Click button to open modal in Tempo Agora mode
        print("2. Opening modal in Tempo Agora mode...")
        cdp.evaluate("window.openSocialModalTempoAgora()")
        time.sleep(1.5)

        active_tab = cdp.evaluate("window.socialState.activeTab")
        print(f"Active tab: {active_tab}")
        assert active_tab == "tempo", f"Expected 'tempo', got {active_tab}"

        # 3. Check Dark Mode Default
        print("3. Checking Dark Mode for Tempo Agora...")
        cdp.evaluate("window.setSocialCardTheme('dark')")
        cdp.evaluate("window.setSocialFormat('post')")
        time.sleep(0.8)

        modal_tempo_dark_png = os.path.join(ARTIFACT_DIR, "v194_modal_tempo_dark.png")
        cdp.capture_screenshot(modal_tempo_dark_png)

        # Export Post Dark
        post_dark_url = cdp.evaluate("document.getElementById('social-export-canvas').toDataURL('image/png')")
        bytes_post_dark = base64.b64decode(post_dark_url.split(",")[1])
        path_post_dark = os.path.join(ARTIFACT_DIR, "v194_tempo_agora_post_dark.png")
        with open(path_post_dark, "wb") as f:
            f.write(bytes_post_dark)
        print(f"[OK] Saved Dark Tempo Agora Post: {path_post_dark} ({len(bytes_post_dark)} bytes)")

        # Export Stories Dark
        print("Exporting Stories Dark...")
        cdp.evaluate("window.setSocialFormat('story')")
        time.sleep(0.8)
        story_dark_url = cdp.evaluate("document.getElementById('social-export-canvas').toDataURL('image/png')")
        bytes_story_dark = base64.b64decode(story_dark_url.split(",")[1])
        path_story_dark = os.path.join(ARTIFACT_DIR, "v194_tempo_agora_story_dark.png")
        with open(path_story_dark, "wb") as f:
            f.write(bytes_story_dark)
        print(f"[OK] Saved Dark Tempo Agora Stories: {path_story_dark} ({len(bytes_story_dark)} bytes)")

        # 4. Switch to Clara (Nórdica)
        print("4. Switching to Clara (Nórdica)...")
        cdp.evaluate("window.setSocialCardTheme('nordic')")
        cdp.evaluate("window.setSocialFormat('post')")
        time.sleep(0.8)

        post_clara_url = cdp.evaluate("document.getElementById('social-export-canvas').toDataURL('image/png')")
        bytes_post_clara = base64.b64decode(post_clara_url.split(",")[1])
        path_post_clara = os.path.join(ARTIFACT_DIR, "v194_tempo_agora_post_clara.png")
        with open(path_post_clara, "wb") as f:
            f.write(bytes_post_clara)
        print(f"[OK] Saved Clara Tempo Agora Post: {path_post_clara} ({len(bytes_post_clara)} bytes)")

        cdp.evaluate("window.setSocialFormat('story')")
        time.sleep(0.8)
        story_clara_url = cdp.evaluate("document.getElementById('social-export-canvas').toDataURL('image/png')")
        bytes_story_clara = base64.b64decode(story_clara_url.split(",")[1])
        path_story_clara = os.path.join(ARTIFACT_DIR, "v194_tempo_agora_story_clara.png")
        with open(path_story_clara, "wb") as f:
            f.write(bytes_story_clara)
        print(f"[OK] Saved Clara Tempo Agora Stories: {path_story_clara} ({len(bytes_story_clara)} bytes)")

        # 5. Test Tab Switching
        print("5. Testing Tab Switching (Chuva and Vento)...")
        cdp.evaluate("window.setSocialTab('chuva')")
        time.sleep(0.5)
        assert cdp.evaluate("window.socialState.activeTab") == 'chuva'

        cdp.evaluate("window.setSocialTab('vento')")
        time.sleep(0.5)
        assert cdp.evaluate("window.socialState.activeTab") == 'vento'

        cdp.evaluate("window.setSocialTab('tempo')")
        time.sleep(0.5)
        assert cdp.evaluate("window.socialState.activeTab") == 'tempo'

        # 6. Test Mobile Viewport
        print("6. Emulating Mobile Viewport (iPhone 390x844)...")
        cdp.send("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 2,
            "mobile": True
        })
        time.sleep(1)
        cdp.evaluate("window.setSocialCardTheme('dark')")
        cdp.evaluate("window.setSocialFormat('post')")
        time.sleep(0.5)
        mobile_png = os.path.join(ARTIFACT_DIR, "v194_modal_tempo_mobile_dark.png")
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
