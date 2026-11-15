import subprocess, time, json, urllib.request, websocket, base64
from pathlib import Path

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9226",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1280,1100",
    "--user-data-dir=C:\\Users\\debor\\.gemini\\antigravity\\scratch\\chrome_test_click14"
])
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

tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9226/json").read())
ws = websocket.create_connection(tabs[0]["webSocketDebuggerUrl"])
send(ws, "Page.enable")
send(ws, "Runtime.enable")
send(ws, "Page.navigate", {"url": "http://localhost:8092/index.html?tab=panorama&theme=dark"})
time.sleep(3.5)

# Click day pill '14'
res = send(ws, "Runtime.evaluate", {
    "expression": """
        const btns = Array.from(document.querySelectorAll('button'));
        const dayBtn = btns.find(b => b.title && b.title.includes('dia 14/11'));
        if (dayBtn) {
            dayBtn.click();
            'CLICKED: ' + dayBtn.title;
        } else {
            'NOT FOUND';
        }
    """
})
print("Click result:", res.get("result", {}).get("value"))
time.sleep(1.5)

# Capture screenshot of day 14
res_shot = send(ws, "Page.captureScreenshot", {"format": "png"})
img_data = base64.b64decode(res_shot["result"]["data"])
out_file = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf\v243_panorama_single_dia14.png")
with open(out_file, "wb") as f:
    f.write(img_data)
print(f"Saved: {out_file}")

ws.close()
proc.terminate()
