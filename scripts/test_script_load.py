import os
import time
import json
import subprocess
import urllib.request
import websocket
from http.server import SimpleHTTPRequestHandler, HTTPServer
import threading

PORT = 8789
PROJECT_DIR = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROJECT_DIR, **kwargs)
    def log_message(self, format, *args):
        pass

def main():
    httpd = HTTPServer(('127.0.0.1', PORT), QuietHandler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    
    cmd = [
        EDGE_PATH,
        "--remote-debugging-port=9349",
        "--user-data-dir=C:\\Users\\debor\\AppData\\Local\\Temp\\edge_script_load",
        "--headless=new",
        "--disable-gpu",
        "--disable-extensions",
        "about:blank"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(1.5)

    with urllib.request.urlopen("http://127.0.0.1:9349/json") as resp:
        targets = json.loads(resp.read().decode())
    ws_url = None
    for t in targets:
        if t.get("type") == "page":
            ws_url = t["webSocketDebuggerUrl"]
            break
    
    ws = websocket.create_connection(ws_url, timeout=10)
    msg_id = 0
    def send(method, params=None):
        nonlocal msg_id
        msg_id += 1
        ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
        while True:
            r = json.loads(ws.recv())
            if r.get("id") == msg_id:
                return r

    send("Page.enable")
    send("Runtime.enable")
    send("Network.enable")

    failed_requests = []
    def listen():
        try:
            while True:
                msg = json.loads(ws.recv())
                if msg.get("method") == "Network.loadingFailed":
                    failed_requests.append(msg["params"])
                elif msg.get("method") == "Runtime.exceptionThrown":
                    print("EXCEPTION:", msg["params"]["exceptionDetails"])
        except Exception:
            pass
    threading.Thread(target=listen, daemon=True).start()

    url = f"http://127.0.0.1:{PORT}/index.html?v=196"
    print(f"Navigating to {url}...")
    send("Page.navigate", {"url": url})
    time.sleep(5.0)

    res = send("Runtime.evaluate", {
        "expression": """
            (() => {
                return {
                    windowRenderPanorama: typeof window.renderPanoramaSemanal,
                    windowResolveWeekly: typeof window.resolveWeeklyForecast7Days,
                    stateExists: Boolean(window.state),
                    weatherExists: Boolean(window.state?.weatherData),
                    secInnerHTML: document.getElementById('section-panorama-semanal')?.innerHTML
                };
            })()
        """,
        "returnByValue": True
    })
    print("Evaluate result:", json.dumps(res.get("result", {}).get("result", {}).get("value"), indent=2))
    print("Failed network requests:", len(failed_requests))
    for f in failed_requests:
        print("Failed:", f.get("errorText"), f.get("type"))

    proc.kill()
    httpd.shutdown()

if __name__ == "__main__":
    main()
