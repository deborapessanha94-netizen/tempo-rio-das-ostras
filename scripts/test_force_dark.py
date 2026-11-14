import subprocess, time, os, sys, http.server, socketserver, threading

sys.stdout.reconfigure(encoding='utf-8')

PORT = 8092
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

dark_desktop = os.path.join(ARTIFACTS_DIR, "v219_aistudio_dark_desktop.png")
dark_mobile = os.path.join(ARTIFACTS_DIR, "v219_aistudio_dark_mobile.png")

def capture(url, out, win_size):
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--force-dark-mode",
        "--blink-settings=forceDarkModeEnabled=true",
        f"--window-size={win_size}",
        "--hide-scrollbars",
        "--virtual-time-budget=3000",
        f"--screenshot={out}",
        url
    ]
    subprocess.run(cmd, check=True)
    print(f"Captured: {out} ({os.path.getsize(out)} bytes)")

capture(f"http://localhost:{PORT}/index.html#previsao", dark_desktop, "1440,1050")
capture(f"http://localhost:{PORT}/index.html#previsao", dark_mobile, "390,844")

# Also capture Chuva tab in desktop light mode
chuva_desktop = os.path.join(ARTIFACTS_DIR, "v219_aistudio_desktop_chuva.png")
capture(f"http://localhost:{PORT}/index.html#chuva", chuva_desktop, "1440,1050")

print("Done!")
