import urllib.request, json, asyncio, websockets, subprocess, time, http.server, socketserver, threading, base64, os

PORT = 8097
DIRECTORY = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ARTIFACTS_DIR = r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf"
drawer_mobile = os.path.join(ARTIFACTS_DIR, "v219_aistudio_mobile_drawer_open.png")
dbg_port = 9229

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

t = threading.Thread(target=start_server, daemon=True)
t.start()
time.sleep(1)

cmd = [
    CHROME_PATH,
    "--headless=new",
    f"--remote-debugging-port={dbg_port}",
    "--window-size=390,950",
    "--hide-scrollbars",
    f"http://localhost:{PORT}/index.html#previsao"
]
proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(2)

try:
    targets_raw = urllib.request.urlopen(f"http://127.0.0.1:{dbg_port}/json").read()
    targets = json.loads(targets_raw)
    ws_url = targets[0]["webSocketDebuggerUrl"]

    async def run():
        async with websockets.connect(ws_url) as ws:
            cid = 1
            async def send_cmd(method, params=None):
                nonlocal cid
                payload = {"id": cid, "method": method}
                if params: payload["params"] = params
                cid += 1
                await ws.send(json.dumps(payload))
                while True:
                    raw = await ws.recv()
                    data = json.loads(raw)
                    if data.get("id") == payload["id"]:
                        return data

            await send_cmd("Runtime.enable")
            await send_cmd("Page.enable")
            await asyncio.sleep(2.5)

            # Trigger mobile toggle
            await send_cmd("Runtime.evaluate", {"expression": "window.toggleMobileSidebar();"})
            await asyncio.sleep(1.0)

            # Take screenshot
            res = await send_cmd("Page.captureScreenshot", {"format": "png"})
            img_bytes = base64.b64decode(res["result"]["data"])
            with open(drawer_mobile, "wb") as f:
                f.write(img_bytes)
            print("Successfully captured v219_aistudio_mobile_drawer_open.png!")

    asyncio.run(run())
finally:
    proc.kill()
