import subprocess, time, json, urllib.request, websocket, base64, os
from pathlib import Path

ARTIFACTS_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9225",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1280,1100",
    "--user-data-dir=C:\\Users\\debor\\.gemini\\antigravity\\scratch\\chrome_v243_profile"
])

print("Launched Chrome on port 9225...")
time.sleep(2)

msg_id = 0

def send(ws, method, params=None):
    global msg_id
    msg_id += 1
    req = {"id": msg_id, "method": method}
    if params:
        req["params"] = params
    ws.send(json.dumps(req))
    while True:
        resp = json.loads(ws.recv())
        if resp.get("id") == msg_id:
            return resp

def take_screenshot(ws, filename):
    res = send(ws, "Page.captureScreenshot", {"format": "png"})
    img_data = base64.b64decode(res["result"]["data"])
    out_file = ARTIFACTS_DIR / filename
    with open(out_file, "wb") as f:
        f.write(img_data)
    print(f"Saved: {out_file} ({len(img_data)} bytes)")

try:
    tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9225/json").read())
    ws_url = tabs[0]["webSocketDebuggerUrl"]
    ws = websocket.create_connection(ws_url)

    send(ws, "Page.enable")
    send(ws, "Runtime.enable")

    # Navigate to panorama
    print("Navigating to panorama...")
    send(ws, "Page.navigate", {"url": "http://localhost:8092/index.html?tab=panorama&theme=dark"})
    time.sleep(3.5)

    take_screenshot(ws, "v243_panorama_nov_loaded.png")

    # Switch to Outubro / 2026
    print("Clicking Outubro...")
    send(ws, "Runtime.evaluate", {
        "expression": """
            const btns = Array.from(document.querySelectorAll('button'));
            const outBtn = btns.find(b => b.textContent.includes('Outubro / 2026'));
            if (outBtn) outBtn.click();
        """
    })
    time.sleep(1.5)
    take_screenshot(ws, "v243_panorama_outubro_loaded.png")

    # Switch to Day 14 of Outubro
    print("Clicking Day 14...")
    send(ws, "Runtime.evaluate", {
        "expression": """
            const btns = Array.from(document.querySelectorAll('button'));
            const day14 = btns.find(b => b.textContent.trim() === '14' && b.getAttribute('title')?.includes('dia 14'));
            if (day14) day14.click();
        """
    })
    time.sleep(1.5)
    take_screenshot(ws, "v243_panorama_dia14_loaded.png")

    ws.close()
finally:
    proc.terminate()
    print("Finished.")
