import subprocess, time, os, sys, http.server, socketserver, threading

sys.stdout.reconfigure(encoding='utf-8')

PORT = 8090
DIRECTORY = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
ARTIFACTS_DIR = r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

t = threading.Thread(target=start_server, daemon=True)
t.start()
time.sleep(1)

# Helper to take screenshot with CDP evaluating dark mode
import urllib.request, json

def capture_with_cdp(url, output_path, width=1440, height=900, is_dark=True):
    # Launch Chrome with remote debugging
    dbg_port = 9223
    cmd = [
        CHROME_PATH,
        "--headless=new",
        f"--remote-debugging-port={dbg_port}",
        f"--window-size={width},{height}",
        "--hide-scrollbars",
        url
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2.5)

    try:
        # Get target websocket URL
        targets_raw = urllib.request.urlopen(f"http://127.0.0.1:{dbg_port}/json").read()
        targets = json.loads(targets_raw)
        ws_url = targets[0]["webSocketDebuggerUrl"]

        import asyncio, websockets
        async def do_cdp():
            async with websockets.connect(ws_url) as ws:
                # 1. Enable Runtime
                await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
                await ws.recv()

                # If dark mode, toggle theme
                if is_dark:
                    eval_cmd = {
                        "id": 2,
                        "method": "Runtime.evaluate",
                        "params": {"expression": "document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); if(window.updateThemeIcon) window.updateThemeIcon(true);"}
                    }
                    await ws.send(json.dumps(eval_cmd))
                    await ws.recv()

                await asyncio.sleep(1.5)

                # Capture screenshot
                shot_cmd = {
                    "id": 3,
                    "method": "Page.captureScreenshot",
                    "params": {"format": "png"}
                }
                await ws.send(json.dumps(shot_cmd))
                res = await ws.recv()
                data = json.loads(res)
                import base64
                img_bytes = base64.b64decode(data["result"]["data"])
                with open(output_path, "wb") as f:
                    f.write(img_bytes)
                print(f"Captured: {output_path} ({len(img_bytes)} bytes)")

        asyncio.run(do_cdp())
    finally:
        proc.kill()

# Check if websockets package is available
try:
    import websockets
    has_ws = True
except ImportError:
    has_ws = False

if has_ws:
    dark_desktop = os.path.join(ARTIFACTS_DIR, "v219_aistudio_dark_desktop.png")
    capture_with_cdp(f"http://localhost:{PORT}/index.html#previsao", dark_desktop, 1440, 1050, is_dark=True)

    dark_mobile = os.path.join(ARTIFACTS_DIR, "v219_aistudio_dark_mobile.png")
    capture_with_cdp(f"http://localhost:{PORT}/index.html#previsao", dark_mobile, 390, 844, is_dark=True)
else:
    print("websockets not installed, will test dark mode via index default class")
