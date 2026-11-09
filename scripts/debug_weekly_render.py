import os
import time
import json
import subprocess
import urllib.request
import websocket
from http.server import SimpleHTTPRequestHandler, HTTPServer
import threading

PORT = 8782
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
        "--remote-debugging-port=9337",
        "--user-data-dir=C:\\Users\\debor\\AppData\\Local\\Temp\\edge_debug_weekly",
        "--headless=new",
        "--disable-gpu",
        "--window-size=1280,950",
        "about:blank"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(1.5)

    with urllib.request.urlopen("http://127.0.0.1:9337/json") as resp:
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
    send("Log.enable")
    
    url = f"http://127.0.0.1:{PORT}/index.html?v=196"
    print(f"Navigating to {url}...")
    send("Page.navigate", {"url": url})
    time.sleep(5.0)

    # Check console errors and status of variables
    diag = send("Runtime.evaluate", {
        "expression": """
            (() => {
                const res = {
                    hasWeatherData: Boolean(window.state?.weatherData),
                    hasBoletimMetadata: Boolean(window.state?.boletimMetadata),
                    hasRenderPanorama: typeof window.renderPanoramaSemanal,
                    hasResolveWeekly: typeof window.resolveWeeklyForecast7Days,
                    hasOpenSocialModalSemanal: typeof window.openSocialModalSemanal,
                    sectionInnerHTML: document.getElementById('section-panorama-semanal')?.innerHTML?.length || 0,
                    secElem: Boolean(document.getElementById('section-panorama-semanal'))
                };
                if (typeof window.resolveWeeklyForecast7Days === 'function' && window.state?.weatherData) {
                    try {
                        const weekly = window.resolveWeeklyForecast7Days(window.state.weatherData, window.state.boletimMetadata);
                        res.weeklyComputedDays = weekly?.days?.length || 0;
                        res.weeklyPeriod = weekly?.periodLabel;
                    } catch (e) {
                        res.resolveError = e.message;
                    }
                }
                if (typeof window.renderPanoramaSemanal === 'function' && window.state?.weatherData) {
                    try {
                        window.renderPanoramaSemanal(window.state.weatherData, window.state.boletimMetadata);
                        res.afterManualRenderLength = document.getElementById('section-panorama-semanal')?.innerHTML?.length || 0;
                    } catch (e) {
                        res.renderError = e.message;
                    }
                }
                return res;
            })()
        """,
        "returnByValue": True
    })
    print("Diagnostics:", json.dumps(diag.get("result", {}).get("result", {}).get("value"), indent=2))
    
    proc.kill()
    httpd.shutdown()

if __name__ == "__main__":
    main()
