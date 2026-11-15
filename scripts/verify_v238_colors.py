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

profile_dir = r"C:\Users\debor\.gemini\antigravity\scratch\chrome_test_profile_v238"

proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9230",
    "--disable-gpu",
    "--no-sandbox",
    f"--user-data-dir={profile_dir}"
])

time.sleep(2)
msg_id = 0

try:
    tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9230/json").read().decode())
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
        "height": 1050,
        "deviceScaleFactor": 1,
        "mobile": False
    })

    url = "http://127.0.0.1:8092/index.html?tab=previsao"
    print(f"Navigating to {url}...")
    cdp("Page.navigate", {"url": url})
    time.sleep(4)

    # Light mode
    cdp("Runtime.evaluate", {
        "expression": "document.documentElement.classList.remove('dark');"
    })
    time.sleep(1)

    # 1. Click "Previsão dos Próximos Dias"
    cdp("Runtime.evaluate", {
        "expression": """
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent.trim() === 'Previsão dos Próximos Dias');
        if (btn) btn.click();
        """
    })
    time.sleep(1)

    shot1 = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "v238_previsao_light.png", "wb") as f:
        f.write(base64.b64decode(shot1["data"]))
    print("Saved v238_previsao_light.png")

    # 2. Click "Panorama Sinótico Geral"
    cdp("Runtime.evaluate", {
        "expression": """
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent.trim() === 'Panorama Sinótico Geral');
        if (btn) btn.click();
        """
    })
    time.sleep(1)

    shot2 = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "v238_sinotico_light.png", "wb") as f:
        f.write(base64.b64decode(shot2["data"]))
    print("Saved v238_sinotico_light.png")

    # Dark mode
    cdp("Runtime.evaluate", {
        "expression": "document.documentElement.classList.add('dark');"
    })
    time.sleep(1)

    # 3. Panorama Sinótico Geral (Dark)
    shot3 = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "v238_sinotico_dark.png", "wb") as f:
        f.write(base64.b64decode(shot3["data"]))
    print("Saved v238_sinotico_dark.png")

    # 4. Click "Previsão dos Próximos Dias" (Dark)
    cdp("Runtime.evaluate", {
        "expression": """
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent.trim() === 'Previsão dos Próximos Dias');
        if (btn) btn.click();
        """
    })
    time.sleep(1)

    shot4 = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "v238_previsao_dark.png", "wb") as f:
        f.write(base64.b64decode(shot4["data"]))
    print("Saved v238_previsao_dark.png")

    print("ALL VERIFICATION SCREENSHOTS SAVED SUCCESSFULLY!")

finally:
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except:
        proc.kill()
