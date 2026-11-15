import subprocess, time, json, urllib.request, websocket, base64
from pathlib import Path

ARTIFACTS_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9228",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1280,1000",
    "--user-data-dir=C:\\Users\\debor\\.gemini\\antigravity\\scratch\\chrome_v245_proofs"
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

def take_shot(ws, filename):
    res = send(ws, "Page.captureScreenshot", {"format": "png"})
    img_data = base64.b64decode(res["result"]["data"])
    out_file = ARTIFACTS_DIR / filename
    with open(out_file, "wb") as f:
        f.write(img_data)
    print(f"Saved: {filename} ({len(img_data)} bytes)")

tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9228/json").read())
ws = websocket.create_connection(tabs[0]["webSocketDebuggerUrl"])
send(ws, "Page.enable")
send(ws, "Runtime.enable")

print("Navigating to previsao dark...")
send(ws, "Page.navigate", {"url": "http://localhost:8092/index.html?tab=previsao&theme=dark"})
time.sleep(3.5)
take_shot(ws, "v245_tempo_agora_dark.png")

print("Navigating to previsao light...")
send(ws, "Page.navigate", {"url": "http://localhost:8092/index.html?tab=previsao&theme=light"})
time.sleep(3.5)
take_shot(ws, "v245_tempo_agora_light.png")

ws.close()
proc.terminate()
print("Done capturing v245 proofs!")
