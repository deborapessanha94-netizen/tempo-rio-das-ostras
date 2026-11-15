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
    "--window-size=1280,1100",
    "--user-data-dir=C:\\Users\\debor\\.gemini\\antigravity\\scratch\\chrome_v244_proofs"
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

tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9227/json").read())
ws = websocket.create_connection(tabs[0]["webSocketDebuggerUrl"])
send(ws, "Page.enable")
send(ws, "Runtime.enable")

pages = [
    ("v244_panorama_dark.png", "http://localhost:8092/index.html?tab=panorama&theme=dark"),
    ("v244_panorama_light.png", "http://localhost:8092/index.html?tab=panorama&theme=light"),
    ("v244_previsao_dark.png", "http://localhost:8092/index.html?tab=previsao&theme=dark"),
    ("v244_alertas_dark.png", "http://localhost:8092/index.html?tab=alertas&theme=dark"),
    ("v244_chuva_dark.png", "http://localhost:8092/index.html?tab=chuva&theme=dark"),
]

for filename, url in pages:
    print(f"Navigating to {url}...")
    send(ws, "Page.navigate", {"url": url})
    time.sleep(3.5)
    take_shot(ws, filename)

ws.close()
proc.terminate()
print("Done capturing v244 proofs!")
