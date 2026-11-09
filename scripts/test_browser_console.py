import os
import time
import json
import subprocess
import urllib.request
import websocket
from http.server import SimpleHTTPRequestHandler, HTTPServer
import threading

PORT = 8786
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
        "--remote-debugging-port=9341",
        "--user-data-dir=C:\\Users\\debor\\AppData\\Local\\Temp\\edge_console_test",
        "--headless=new",
        "--disable-gpu",
        "--window-size=1280,950",
        "about:blank"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(1.5)

    with urllib.request.urlopen("http://127.0.0.1:9341/json") as resp:
        targets = json.loads(resp.read().decode())
    ws_url = targets[0]["webSocketDebuggerUrl"]
    
    ws = websocket.create_connection(ws_url, timeout=10)
    
    # Send Page and Console enables
    ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
    ws.send(json.dumps({"id": 2, "method": "Runtime.enable"}))
    ws.send(json.dumps({"id": 3, "method": "Log.enable"}))
    
    # Collect all messages
    console_logs = []
    
    def listener():
        try:
            while True:
                raw = ws.recv()
                msg = json.loads(raw)
                m = msg.get("method")
                if m == "Runtime.consoleAPICalled":
                    args = msg.get("params", {}).get("args", [])
                    txt = " ".join(str(a.get("value", a.get("description", ""))) for a in args)
                    console_logs.append(f"CONSOLE: {txt}")
                elif m == "Runtime.exceptionThrown":
                    desc = msg.get("params", {}).get("exceptionDetails", {})
                    console_logs.append(f"EXCEPTION: {json.dumps(desc)}")
                elif m == "Log.entryAdded":
                    entry = msg.get("params", {}).get("entry", {})
                    console_logs.append(f"LOG: {entry.get('level')}: {entry.get('text')}")
        except Exception:
            pass

    t = threading.Thread(target=listener, daemon=True)
    t.start()

    time.sleep(0.5)
    ws.send(json.dumps({"id": 4, "method": "Page.navigate", "params": {"url": f"http://127.0.0.1:{PORT}/index.html?v=196"}}))
    
    time.sleep(5.0)

    print("--- CONSOLE OUTPUT (Total:", len(console_logs), ") ---")
    for log in console_logs:
        print(log)

    proc.kill()
    httpd.shutdown()

if __name__ == "__main__":
    main()
