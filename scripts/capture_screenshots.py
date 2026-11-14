import subprocess, time, os, sys, http.server, socketserver, threading

sys.stdout.reconfigure(encoding='utf-8')

PORT = 8089
DIRECTORY = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
ARTIFACTS_DIR = r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        httpd.serve_forever()

t = threading.Thread(target=start_server, daemon=True)
t.start()
time.sleep(1)

# Helper to take screenshot
def take_screenshot(url, output_path, window_size="1440,900", delay=2):
    cmd = [
        CHROME_PATH,
        "--headless=new",
        f"--window-size={window_size}",
        "--hide-scrollbars",
        f"--virtual-time-budget={delay * 1000}",
        f"--screenshot={output_path}",
        url
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    print(f"Captured: {output_path} ({os.path.getsize(output_path)} bytes)")

# 1. Desktop - Previsão
desktop_previsao = os.path.join(ARTIFACTS_DIR, "v219_aistudio_desktop_previsao.png")
take_screenshot(f"http://localhost:{PORT}/index.html#previsao", desktop_previsao, "1440,1050", delay=3)

# 2. Desktop - Chuva
desktop_chuva = os.path.join(ARTIFACTS_DIR, "v219_aistudio_desktop_chuva.png")
take_screenshot(f"http://localhost:{PORT}/index.html#chuva", desktop_chuva, "1440,1050", delay=3)

# 3. Desktop - Rio
desktop_rio = os.path.join(ARTIFACTS_DIR, "v219_aistudio_desktop_rio.png")
take_screenshot(f"http://localhost:{PORT}/index.html#rio", desktop_rio, "1440,1050", delay=3)

# 4. Mobile - Previsão
mobile_previsao = os.path.join(ARTIFACTS_DIR, "v219_aistudio_mobile_previsao.png")
take_screenshot(f"http://localhost:{PORT}/index.html#previsao", mobile_previsao, "390,844", delay=3)

# 5. Mobile - Chuva
mobile_chuva = os.path.join(ARTIFACTS_DIR, "v219_aistudio_mobile_chuva.png")
take_screenshot(f"http://localhost:{PORT}/index.html#chuva", mobile_chuva, "390,844", delay=3)

print("All screenshots captured successfully!")
