import subprocess, time, json, urllib.request, websocket, base64
from pathlib import Path

ARTIFACTS_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9227",
    "--disable-gpu",
    "--no-sandbox",
    "--user-data-dir=C:\\Users\\debor\\.gemini\\antigravity\\scratch\\chrome_test_profile5"
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

    cdp("Emulation.setDeviceMetricsOverride", {
        "width": 1440,
        "height": 900,
        "deviceScaleFactor": 1,
        "mobile": False
    })

    cdp("Page.navigate", {"url": "http://127.0.0.1:8092/index.html"})
    time.sleep(3)

    # 1. Dark Mode Screenshot
    shot_dark = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "v221_verified_dark.png", "wb") as f:
        f.write(base64.b64decode(shot_dark["data"]))
    print("Saved v221_verified_dark.png")

    # 2. Click button to switch to Light Mode
    cdp("Runtime.evaluate", {"expression": """
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tema Claro') || b.textContent.includes('Tema Escuro'));
        btn?.click();
    """})
    time.sleep(1)

    # 3. Light Mode Screenshot
    shot_light = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "v221_verified_light.png", "wb") as f:
        f.write(base64.b64decode(shot_light["data"]))
    print("Saved v221_verified_light.png")

    img_info = cdp("Runtime.evaluate", {"expression": """
        const img = document.querySelector('header img');
        JSON.stringify({
            src: img?.src,
            isDark: document.documentElement.classList.contains('dark')
        })
    """})
    print("Light mode img info:", img_info.get("result", {}).get("value"))

    ws.close()
finally:
    proc.terminate()
