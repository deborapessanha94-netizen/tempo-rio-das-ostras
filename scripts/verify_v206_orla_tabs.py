import base64
import json
import subprocess
import time
from pathlib import Path
import urllib.request
import websocket

ROOT = Path(r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app")
ARTIFACT_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
PORT = 9366
HTTP_PORT = 8166

def run():
    server = subprocess.Popen(
        ["python", "-m", "http.server", str(HTTP_PORT)],
        cwd=str(ROOT),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(1.0)

    user_data = ROOT / ".edge_v206_profile"
    edge = subprocess.Popen(
        [
            EDGE_PATH,
            "--headless=new",
            "--disable-gpu",
            f"--remote-debugging-port={PORT}",
            f"--user-data-dir={user_data}",
            "--window-size=1440,950",
            f"http://127.0.0.1:{HTTP_PORT}/index.html?v=206",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        ws_url = None
        for _ in range(30):
            try:
                data = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json").read().decode())
                for target in data:
                    if target.get("type") == "page" and "index.html" in target.get("url", ""):
                        ws_url = target["webSocketDebuggerUrl"]
                        break
                if ws_url:
                    break
            except Exception:
                pass
            time.sleep(0.5)

        assert ws_url, "Failed to connect to Edge CDP"
        ws = websocket.create_connection(ws_url)
        msg_id = 1

        def send_cmd(method, params=None):
            nonlocal msg_id
            payload = {"id": msg_id, "method": method, "params": params or {}}
            ws.send(json.dumps(payload))
            cur_id = msg_id
            msg_id += 1
            while True:
                resp = json.loads(ws.recv())
                if resp.get("id") == cur_id:
                    return resp.get("result", {})

        def evaluate(expr):
            res = send_cmd("Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True})
            return res.get("result", {}).get("value")

        def screenshot(filename):
            res = send_cmd("Page.captureScreenshot", {"format": "png"})
            img_bytes = base64.b64decode(res["data"])
            out_path = ARTIFACT_DIR / filename
            out_path.write_bytes(img_bytes)
            print(f"Saved {out_path}")

        for _ in range(30):
            if evaluate("typeof window.switchAppTab === 'function'"):
                break
            time.sleep(0.3)
        time.sleep(1.0)

        # 1. Open Orla & Praias -> Condições do Mar & Ondas (orla-panel-mar)
        evaluate("window.switchSubSection('orla', 'orla-panel-mar'); window.scrollTo(0, 0);")
        time.sleep(0.8)
        state_mar = evaluate("""({
            hasInternalTabBtn: !!document.getElementById('orla-tab-btn-mar'),
            headerTitle: document.getElementById('orla-card-header-title')?.textContent,
            headerSubtitle: document.getElementById('orla-card-header-subtitle')?.textContent,
            marVisible: !document.getElementById('orla-panel-mar')?.classList.contains('hidden'),
            maresVisible: !document.getElementById('orla-panel-mares')?.classList.contains('hidden'),
            balnearVisible: !document.getElementById('orla-panel-balnear')?.classList.contains('hidden'),
            segGridVisible: !document.getElementById('orla-seguranca-grid')?.classList.contains('hidden')
        })""")
        print("State Mar:", json.dumps(state_mar, ensure_ascii=False))
        screenshot("v206_orla_mar_desktop.png")

        # 2. Click Orla & Praias top tab button while already active -> verify dropdown opens!
        evaluate("window.handleNavTabClick('orla', null);")
        time.sleep(0.5)
        dropdown_open = evaluate("document.getElementById('nav-wrapper-orla')?.classList.contains('open')")
        print("Dropdown open after clicking active Orla tab:", dropdown_open)
        screenshot("v206_orla_dropdown_open.png")

        # 3. Switch to Tábua de Marés (orla-panel-mares)
        evaluate("window.switchSubSection('orla', 'orla-panel-mares'); window.scrollTo(0, 0);")
        time.sleep(0.8)
        state_mares = evaluate("""({
            headerTitle: document.getElementById('orla-card-header-title')?.textContent,
            marVisible: !document.getElementById('orla-panel-mar')?.classList.contains('hidden'),
            maresVisible: !document.getElementById('orla-panel-mares')?.classList.contains('hidden'),
            balnearVisible: !document.getElementById('orla-panel-balnear')?.classList.contains('hidden'),
            segGridVisible: !document.getElementById('orla-seguranca-grid')?.classList.contains('hidden')
        })""")
        print("State Marés:", json.dumps(state_mares, ensure_ascii=False))
        screenshot("v206_orla_mares_desktop.png")

        # 4. Switch to Balneabilidade das Praias (orla-panel-balnear)
        evaluate("window.switchSubSection('orla', 'orla-panel-balnear'); window.scrollTo(0, 0);")
        time.sleep(0.8)
        state_balnear = evaluate("""({
            headerTitle: document.getElementById('orla-card-header-title')?.textContent,
            marVisible: !document.getElementById('orla-panel-mar')?.classList.contains('hidden'),
            maresVisible: !document.getElementById('orla-panel-mares')?.classList.contains('hidden'),
            balnearVisible: !document.getElementById('orla-panel-balnear')?.classList.contains('hidden'),
            segGridVisible: !document.getElementById('orla-seguranca-grid')?.classList.contains('hidden')
        })""")
        print("State Balneabilidade:", json.dumps(state_balnear, ensure_ascii=False))
        screenshot("v206_orla_balneabilidade_desktop.png")

        ws.close()
    finally:
        edge.terminate()
        server.terminate()

if __name__ == "__main__":
    run()
