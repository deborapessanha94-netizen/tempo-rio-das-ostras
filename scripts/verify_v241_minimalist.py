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

profile_dir = r"C:\Users\debor\.gemini\antigravity\scratch\chrome_audit_v241"

proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9238",
    "--disable-gpu",
    "--no-sandbox",
    f"--user-data-dir={profile_dir}"
])

time.sleep(2)
msg_id = 0

shots = [
    ("chuva", "audit_v241_chuva.png", None),
    ("orla", "audit_v241_balnear.png", "Balneabilidade"),
    ("alertas", "audit_v241_alertas.png", None),
    ("boletim", "audit_v241_boletim.png", None),
]

try:
    tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9238/json").read().decode())
    target = tabs[0]
    ws = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=15)

    def cdp(method, params=None):
        global msg_id
        msg_id += 1
        cid = msg_id
        ws.send(json.dumps({"id": cid, "method": method, "params": params or {}}))
        while True:
            resp = json.loads(ws.recv())
            if resp.get("id") == cid:
                return resp.get("result", {})

    cdp("Page.enable")
    cdp("Runtime.enable")

    cdp("Emulation.setDeviceMetricsOverride", {
        "width": 1400,
        "height": 1300,
        "deviceScaleFactor": 1,
        "mobile": False
    })

    for tab_name, out_file, sub_text in shots:
        url = f"http://127.0.0.1:8092/index.html?tab={tab_name}"
        cdp("Page.navigate", {"url": url})
        time.sleep(2.5)

        sub_js = ""
        if sub_text:
            sub_js = f"""
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent.includes('{sub_text}'));
            if (btn) btn.click();
            """

        cdp("Runtime.evaluate", {
            "expression": f"""
            document.documentElement.classList.add('dark');
            {sub_js}
            """
        })
        time.sleep(1.5)

        shot = cdp("Page.captureScreenshot", {"format": "png"})
        with open(ARTIFACTS_DIR / out_file, "wb") as f:
            f.write(base64.b64decode(shot["data"]))
        print(f"Saved {out_file}")

    print("ALL V241 VERIFICATION SCREENSHOTS CAPTURED!")

finally:
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except:
        proc.kill()
