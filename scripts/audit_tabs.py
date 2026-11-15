import subprocess
import time
import json
import urllib.request
import websocket
import base64
import os
from pathlib import Path

ARTIFACTS_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(chrome_path):
    chrome_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

profile_dir = r"C:\Users\debor\.gemini\antigravity\scratch\chrome_audit_profile"

proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9235",
    "--disable-gpu",
    "--no-sandbox",
    f"--user-data-dir={profile_dir}"
])

time.sleep(2)
msg_id = 0

tabs_to_audit = [
    ("previsao", "audit_previsao_dark.png"),
    ("chuva", "audit_chuva_dark.png"),
    ("rio", "audit_rio_dark.png"),
    ("orla", "audit_orla_dark.png"),
    ("alertas", "audit_alertas_dark.png"),
    ("boletim", "audit_boletim_dark.png"),
    ("panorama", "audit_panorama_dark.png"),
]

try:
    tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9235/json").read().decode())
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

    cdp("Emulation.setDeviceMetricsOverride", {
        "width": 1400,
        "height": 1600,
        "deviceScaleFactor": 1,
        "mobile": False
    })

    for tab_name, out_file in tabs_to_audit:
        url = f"http://127.0.0.1:8092/index.html?tab={tab_name}"
        print(f"Navigating to {url}...")
        cdp("Page.navigate", {"url": url})
        time.sleep(3)

        cdp("Runtime.evaluate", {
            "expression": """
            document.documentElement.classList.add('dark');
            """
        })
        time.sleep(1)

        shot = cdp("Page.captureScreenshot", {"format": "png"})
        with open(ARTIFACTS_DIR / out_file, "wb") as f:
            f.write(base64.b64decode(shot["data"]))
        print(f"Saved {out_file}")

    print("ALL AUDIT SCREENSHOTS CAPTURED!")

finally:
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except:
        proc.kill()
