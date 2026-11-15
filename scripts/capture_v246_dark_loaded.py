import subprocess, time, json, urllib.request, websocket, base64
from pathlib import Path

ARTIFACTS_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9231",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1280,1200",
    "--user-data-dir=C:\\Users\\debor\\.gemini\\antigravity\\scratch\\chrome_v246_dark"
])
time.sleep(2.5)

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

tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9231/json").read())
ws = websocket.create_connection(tabs[0]["webSocketDebuggerUrl"])
send(ws, "Page.enable")
send(ws, "Runtime.enable")

send(ws, "Page.navigate", {"url": "http://localhost:8092/index.html?tab=previsao&sub=proximos-dias&theme=dark"})
time.sleep(3.5)
send(ws, "Runtime.evaluate", { "expression": "window.scrollTo(0, 480);" })
time.sleep(1.5)

res = send(ws, "Page.captureScreenshot", {"format": "png"})
img_data = base64.b64decode(res["result"]["data"])
out_file = ARTIFACTS_DIR / "v246_proximos_dias_dark_loaded.png"
with open(out_file, "wb") as f:
    f.write(img_data)
print(f"Saved: {out_file}")

ws.close()
proc.terminate()
