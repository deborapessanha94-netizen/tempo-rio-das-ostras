import subprocess
import time
import json
import urllib.request
import websocket
import os

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(chrome_path):
    chrome_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

profile_dir = r"C:\Users\debor\.gemini\antigravity\scratch\chrome_test_profile_debug2"

proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9226",
    "--disable-gpu",
    "--no-sandbox",
    f"--user-data-dir={profile_dir}"
])

time.sleep(2)

msg_id = 0

try:
    tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9226/json").read().decode())
    target = tabs[0]
    ws = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=15)

    def cdp(method, params=None):
        global msg_id
        msg_id += 1
        current_id = msg_id
        ws.send(json.dumps({"id": current_id, "method": method, "params": params or {}}))
        while True:
            resp = json.loads(ws.recv())
            if resp.get("id") == current_id:
                return resp.get("result", {})

    cdp("Page.enable")
    cdp("Runtime.enable")
    cdp("Log.enable")

    errors = []
    # listen for logs
    cdp("Page.navigate", {"url": "http://127.0.0.1:8092/index.html?tab=chuva"})
    
    start = time.time()
    while time.time() - start < 4:
        try:
            ws.settimeout(1)
            raw = ws.recv()
            data = json.loads(raw)
            if data.get("method") in ["Log.entryAdded", "Runtime.exceptionThrown", "Runtime.consoleAPICalled"]:
                errors.append(data)
        except:
            pass

    print(f"Captured {len(errors)} console/runtime events:")
    for ev in errors:
        print(json.dumps(ev)[:200])

finally:
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except:
        proc.kill()
