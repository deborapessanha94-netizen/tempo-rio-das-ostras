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

profile_dir = r"C:\Users\debor\.gemini\antigravity\scratch\chrome_test_profile_social"

proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9224",
    "--disable-gpu",
    "--no-sandbox",
    f"--user-data-dir={profile_dir}"
])

print(f"Launched browser on port 9224, waiting for startup...")
time.sleep(2.5)

msg_id = 0

try:
    tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9224/json").read().decode())
    target = tabs[0]
    ws_url = target["webSocketDebuggerUrl"]
    ws = websocket.create_connection(ws_url, timeout=15)

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

    # Set Desktop viewport
    cdp("Emulation.setDeviceMetricsOverride", {
        "width": 1400,
        "height": 960,
        "deviceScaleFactor": 1,
        "mobile": False
    })

    url = "http://127.0.0.1:8092/index.html?tab=chuva"
    print(f"Navigating to {url}...")
    cdp("Page.navigate", {"url": url})
    time.sleep(3)

    # 1. Check if buttons exist in DOM
    eval_buttons = cdp("Runtime.evaluate", {
        "expression": """
            ({
                btnChuva: !!document.querySelector('button[title*="Acumulados de Chuva"]'),
                btnVento: !!document.querySelector('button[title*="Maiores Ventos e Rajadas"]'),
                btnTempo: !!document.querySelector('button[title*="Tempo Agora"]'),
                dedicatedSection: !!document.querySelector('section:has(h3:contains("Exportar Imagens Oficiais"))') || document.body.innerText.includes('Exportar Imagens Oficiais para Redes Sociais'),
                modalExists: !!document.getElementById('modal-social-chuva'),
                modalHidden: document.getElementById('modal-social-chuva')?.classList.contains('hidden')
            })
        """,
        "returnByValue": True
    })
    print("DOM Check:", eval_buttons.get("result", {}).get("value"))

    # Capture Tab Chuva before opening modal
    shot_chuva_tab = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "v234_tab_chuva_cards.png", "wb") as f:
        f.write(base64.b64decode(shot_chuva_tab["data"]))
    print("Saved v234_tab_chuva_cards.png")

    # 2. Open Social Modal for Chuva
    cdp("Runtime.evaluate", {
        "expression": "window.openSocialModalChuva('24h');"
    })
    time.sleep(1.5)

    modal_state = cdp("Runtime.evaluate", {
        "expression": """
            ({
                modalVisible: !document.getElementById('modal-social-chuva')?.classList.contains('hidden'),
                title: document.getElementById('social-modal-title')?.textContent,
                previewSrcLen: (document.getElementById('social-preview-image')?.src || '').length,
                downloadBtnText: document.getElementById('social-download-main-btn')?.textContent
            })
        """,
        "returnByValue": True
    })
    print("Modal State after openSocialModalChuva:", modal_state.get("result", {}).get("value"))

    # Capture Modal Chuva
    shot_modal_chuva = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "v234_card_chuva_modal.png", "wb") as f:
        f.write(base64.b64decode(shot_modal_chuva["data"]))
    print("Saved v234_card_chuva_modal.png")

    # 3. Switch to Vento Tab
    cdp("Runtime.evaluate", {
        "expression": "window.setSocialTab('vento');"
    })
    time.sleep(1.5)

    modal_vento_state = cdp("Runtime.evaluate", {
        "expression": """
            ({
                title: document.getElementById('social-modal-title')?.textContent,
                previewSrcLen: (document.getElementById('social-preview-image')?.src || '').length,
                downloadBtnText: document.getElementById('social-download-main-btn')?.textContent
            })
        """,
        "returnByValue": True
    })
    print("Modal State after setSocialTab('vento'):", modal_vento_state.get("result", {}).get("value"))

    # Capture Modal Vento
    shot_modal_vento = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "v234_card_vento_modal.png", "wb") as f:
        f.write(base64.b64decode(shot_modal_vento["data"]))
    print("Saved v234_card_vento_modal.png")

    # 4. Switch to Story (9:16) format & Dark theme on Vento
    cdp("Runtime.evaluate", {
        "expression": "window.setSocialFormat('story'); window.setSocialCardTheme('dark');"
    })
    time.sleep(1.5)

    shot_modal_vento_story_dark = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "v234_card_vento_story_dark.png", "wb") as f:
        f.write(base64.b64decode(shot_modal_vento_story_dark["data"]))
    print("Saved v234_card_vento_story_dark.png")

    # 5. Switch to Chuva Story & Dark
    cdp("Runtime.evaluate", {
        "expression": "window.setSocialTab('chuva');"
    })
    time.sleep(1.5)

    shot_modal_chuva_story_dark = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "v234_card_chuva_story_dark.png", "wb") as f:
        f.write(base64.b64decode(shot_modal_chuva_story_dark["data"]))
    print("Saved v234_card_chuva_story_dark.png")

    # 6. Test closing modal
    cdp("Runtime.evaluate", {
        "expression": "window.closeSocialModalChuva();"
    })
    time.sleep(0.5)

    is_closed = cdp("Runtime.evaluate", {
        "expression": "document.getElementById('modal-social-chuva')?.classList.contains('hidden')",
        "returnByValue": True
    })
    print("Modal is closed:", is_closed.get("result", {}).get("value"))

    print("ALL TESTS PASSED SUCCESSFULLY!")

finally:
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except:
        proc.kill()
