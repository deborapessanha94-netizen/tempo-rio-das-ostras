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

profile_dir = r"C:\Users\debor\.gemini\antigravity\scratch\chrome_test_profile_v236"

proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9228",
    "--disable-gpu",
    "--no-sandbox",
    f"--user-data-dir={profile_dir}"
])

time.sleep(2)

msg_id = 0

try:
    tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9228/json").read().decode())
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
        "height": 960,
        "deviceScaleFactor": 1,
        "mobile": False
    })

    url = "http://127.0.0.1:8092/index.html?tab=previsao"
    print(f"Navigating to {url}...")
    cdp("Page.navigate", {"url": url})
    time.sleep(3)

    # Scroll to footer
    cdp("Runtime.evaluate", {
        "expression": "window.scrollTo(0, document.body.scrollHeight);"
    })
    time.sleep(1)

    eval_css_btn = cdp("Runtime.evaluate", {
        "expression": """
            ({
                hasCopiarCss: document.body.innerText.includes('Copiar CSS') || document.body.innerText.includes('Aplica CSS') || document.body.innerText.includes('CSS do Tema'),
                footerText: document.querySelector('footer')?.innerText
            })
        """,
        "returnByValue": True
    })
    val = eval_css_btn.get("result", {}).get("value")
    print("Footer Verification:", val)

    shot = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "v236_footer_sem_css.png", "wb") as f:
        f.write(base64.b64decode(shot["data"]))
    print("Saved v236_footer_sem_css.png")

    assert val["hasCopiarCss"] is False, "Button still found!"
    print("VERIFICATION SUCCESSFUL: CSS button completely removed!")

finally:
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except:
        proc.kill()
