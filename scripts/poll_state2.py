import os
import time
import json
import subprocess
import urllib.request
import websocket
from http.server import SimpleHTTPRequestHandler, HTTPServer
import threading

PORT = 8785
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
        "--remote-debugging-port=9340",
        "--user-data-dir=C:\\Users\\debor\\AppData\\Local\\Temp\\edge_debug_state2",
        "--headless=new",
        "--disable-gpu",
        "--window-size=1280,950",
        "about:blank"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(1.5)

    with urllib.request.urlopen("http://127.0.0.1:9340/json") as resp:
        targets = json.loads(resp.read().decode())
    ws_url = targets[0]["webSocketDebuggerUrl"]
    
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
    
    url = f"http://127.0.0.1:{PORT}/index.html?v=196"
    print(f"Navigating to {url}...")
    send("Page.navigate", {"url": url})
    
    for step in range(8):
        time.sleep(1.0)
        res = send("Runtime.evaluate", {
            "expression": """
                (() => {
                    const sec = document.getElementById('section-panorama-semanal');
                    return {
                        hasWeather: Boolean(window.state?.weatherData),
                        hasBoletim: Boolean(window.state?.boletimMetadata),
                        secFound: Boolean(sec),
                        secHidden: sec?.classList?.contains('hidden'),
                        secContentLen: sec?.innerHTML?.length || 0,
                        renderFnType: typeof window.renderPanoramaSemanal
                    };
                })()
            """,
            "returnByValue": True
        })
        val = res.get("result", {}).get("result", {}).get("value")
        print(f"[{step+1}s] State:", val)
        if val and val.get("hasWeather") and val.get("secContentLen", 0) > 100:
            print("Successfully rendered!")
            break

    proc.kill()
    httpd.shutdown()

if __name__ == "__main__":
    main()
