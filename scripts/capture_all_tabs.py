import urllib.request, json, asyncio, websockets, subprocess, time, http.server, socketserver, threading, base64, os

PORT = 8098
DIRECTORY = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ARTIFACTS_DIR = r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf"
dbg_port = 9230

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

t = threading.Thread(target=start_server, daemon=True)
t.start()
time.sleep(1)

# Helper function
def capture_tab(hash_name, filename):
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--window-size=1440,1050",
        "--hide-scrollbars",
        "--virtual-time-budget=3000",
        f"--screenshot={os.path.join(ARTIFACTS_DIR, filename)}",
        f"http://localhost:{PORT}/index.html#{hash_name}"
    ]
    subprocess.run(cmd, check=True)
    print(f"Captured {filename} ({os.path.getsize(os.path.join(ARTIFACTS_DIR, filename))} bytes)")

capture_tab("chuva", "v219_aistudio_desktop_chuva.png")
capture_tab("rio", "v219_aistudio_desktop_rio.png")
capture_tab("alertas", "v219_aistudio_desktop_alertas.png")
print("Finished capturing tabs!")
