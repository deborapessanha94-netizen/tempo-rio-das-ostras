import urllib.request, json, asyncio, websockets, subprocess, time, http.server, socketserver, threading

PORT = 8096
DIRECTORY = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
dbg_port = 9228

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
            async def eval_js(expr):
                nonlocal cid
                payload = {"id": cid, "method": "Runtime.evaluate", "params": {"expression": expr, "returnByValue": True}}
                cid += 1
                await ws.send(json.dumps(payload))
                while True:
                    raw = await ws.recv()
                    data = json.loads(raw)
                    if data.get("id") == payload["id"]:
                        return data.get("result", {}).get("result", {}).get("value")

            await asyncio.sleep(2)
            c1 = await eval_js("document.getElementById('app-sidebar-nav') ? document.getElementById('app-sidebar-nav').className : 'NOT_FOUND'")
            print("Before toggle:", c1)
            t_res = await eval_js("window.toggleMobileSidebar(); document.getElementById('app-sidebar-nav').className")
            print("After toggle:", t_res)
            disp = await eval_js("window.getComputedStyle(document.getElementById('app-sidebar-nav')).display")
            print("Computed display:", disp)

    asyncio.run(run())
finally:
    proc.kill()
