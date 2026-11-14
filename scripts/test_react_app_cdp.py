import subprocess, time, json, urllib.request, websocket, base64, os
from pathlib import Path

ARTIFACTS_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9223",
    "--disable-gpu",
    "--no-sandbox",
    "--user-data-dir=C:\\Users\\debor\\.gemini\\antigravity\\scratch\\chrome_test_profile"
])

print("Launched Chrome on port 9223, waiting for startup...")
time.sleep(2)

msg_id = 0

try:
    tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9223/json").read().decode())
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
        "width": 1440,
        "height": 900,
        "deviceScaleFactor": 1,
        "mobile": False
    })

    print("Navigating to http://127.0.0.1:8092/index.html...")
    cdp("Page.navigate", {"url": "http://127.0.0.1:8092/index.html"})
    time.sleep(3)

    # Check console errors and body text
    body_res = cdp("Runtime.evaluate", {"expression": "document.body.innerText.substring(0, 500)"})
    print("Page innerText preview:\n", body_res.get("result", {}).get("value"))

    root_html = cdp("Runtime.evaluate", {"expression": "document.getElementById('root').innerHTML.substring(0, 300)"})
    print("\nRoot innerHTML preview:\n", root_html.get("result", {}).get("value"))

    # Take screenshot of desktop
    shot = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "react_desktop_previsao.png", "wb") as f:
        f.write(base64.b64decode(shot["data"]))
    print("Saved react_desktop_previsao.png")

    # Switch to Chuva tab
    cdp("Runtime.evaluate", {"expression": "Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Acumulados Chuva'))?.click()"})
    time.sleep(1)
    shot_chuva = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "react_desktop_chuva.png", "wb") as f:
        f.write(base64.b64decode(shot_chuva["data"]))
    print("Saved react_desktop_chuva.png")

    # Switch to Rio tab
    cdp("Runtime.evaluate", {"expression": "Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Nível do Rio'))?.click()"})
    time.sleep(1)
    shot_rio = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "react_desktop_rio.png", "wb") as f:
        f.write(base64.b64decode(shot_rio["data"]))
    print("Saved react_desktop_rio.png")

    # Test Mobile Viewport
    cdp("Emulation.setDeviceMetricsOverride", {
        "width": 390,
        "height": 844,
        "deviceScaleFactor": 2,
        "mobile": True
    })
    time.sleep(1)

    shot_mob = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "react_mobile_previsao.png", "wb") as f:
        f.write(base64.b64decode(shot_mob["data"]))
    print("Saved react_mobile_previsao.png")

    # Click mobile menu button
    cdp("Runtime.evaluate", {"expression": "document.querySelector('button[aria-label=\"Abrir navegação mobile\"], button[aria-label*=\"menu\" i], header button')?.click()"})
    time.sleep(1)

    shot_mob_drawer = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "react_mobile_drawer.png", "wb") as f:
        f.write(base64.b64decode(shot_mob_drawer["data"]))
    print("Saved react_mobile_drawer.png")

    ws.close()

except Exception as e:
    print("CDP Error:", e)
finally:
    proc.terminate()
    print("Terminated test Chrome")
