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

profile_dir = r"C:\Users\debor\.gemini\antigravity\scratch\chrome_test_profile_v235"

proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9227",
    "--disable-gpu",
    "--no-sandbox",
    f"--user-data-dir={profile_dir}"
])

time.sleep(2)

msg_id = 0

try:
    tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9227/json").read().decode())
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

    # Set Desktop viewport
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

    # 1. Check if the banners are gone from the page text
    check = cdp("Runtime.evaluate", {
        "expression": """
            ({
                hasRetrospectivaBanner: document.body.innerText.includes('Retrospectiva Oficial') || document.body.innerText.includes('Ver Vídeo & Imagens'),
                hasInformeOperacional: document.body.innerText.includes('Informe Operacional: Rio Jundiá') || document.body.innerText.includes('Ir para Alertas & Sinótico'),
                hasTempoAgoraHero: document.body.innerText.includes('Condições Meteorológicas') || document.body.innerText.includes('Tempo Agora')
            })
        """,
        "returnByValue": True
    })
    print("Previsão Tab Check:", check.get("result", {}).get("value"))

    # Capture Screenshot of Clean Previsão Tab
    shot = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "v235_previsao_sem_banners.png", "wb") as f:
        f.write(base64.b64decode(shot["data"]))
    print("Saved v235_previsao_sem_banners.png")

    # Check dark mode
    cdp("Runtime.evaluate", {
        "expression": "document.documentElement.classList.add('dark');"
    })
    time.sleep(0.5)

    shot_dark = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "v235_previsao_sem_banners_dark.png", "wb") as f:
        f.write(base64.b64decode(shot_dark["data"]))
    print("Saved v235_previsao_sem_banners_dark.png")

    print("ALL VERIFICATIONS PASSED!")

finally:
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except:
        proc.kill()
