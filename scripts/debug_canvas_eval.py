import subprocess
import time
import json
import urllib.request
import websocket
import os

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(chrome_path):
    chrome_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

profile_dir = r"C:\Users\debor\.gemini\antigravity\scratch\chrome_test_profile_debug"

proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9225",
    "--disable-gpu",
    "--no-sandbox",
    f"--user-data-dir={profile_dir}"
])

time.sleep(2)

msg_id = 0

try:
    tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9225/json").read().decode())
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

    cdp("Page.navigate", {"url": "http://127.0.0.1:8092/index.html?tab=chuva"})
    time.sleep(3)

    # Check canvas and openSocialModalChuva
    debug_eval = cdp("Runtime.evaluate", {
        "expression": """
            (() => {
                const logs = [];
                try {
                    logs.push('openSocialModalChuva exists: ' + (typeof window.openSocialModalChuva));
                    logs.push('socialState exists: ' + (typeof window.socialState));
                    logs.push('canvas exists: ' + !!document.getElementById('social-export-canvas'));
                    logs.push('modal exists: ' + !!document.getElementById('modal-social-chuva'));
                    logs.push('previewImg exists: ' + !!document.getElementById('social-preview-image'));
                    
                    window.openSocialModalChuva('24h');
                    
                    const canvas = document.getElementById('social-export-canvas');
                    logs.push('canvas width/height: ' + canvas?.width + 'x' + canvas?.height);
                    const preview = document.getElementById('social-preview-image');
                    logs.push('preview src length: ' + (preview?.src?.length || 0));
                    logs.push('preview src prefix: ' + (preview?.src ? preview.src.substring(0, 30) : 'none'));
                } catch(e) {
                    logs.push('ERROR: ' + e.toString());
                }
                return logs;
            })()
        """,
        "returnByValue": True
    })
    print("Debug Results:")
    for log in debug_eval.get("result", {}).get("value", []):
        print("  -", log)

finally:
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except:
        proc.kill()
