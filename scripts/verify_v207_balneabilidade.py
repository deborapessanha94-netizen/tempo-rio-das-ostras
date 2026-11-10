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
PORT = 9378
HTTP_PORT = 8178

def run():
    server = subprocess.Popen(
        ["python", "-m", "http.server", str(HTTP_PORT)],
        cwd=str(ROOT),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(1.0)

    user_data = ROOT / ".edge_v207_profile"
    edge = subprocess.Popen(
        [
            EDGE_PATH,
            "--headless=new",
            "--disable-gpu",
            f"--remote-debugging-port={PORT}",
            f"--user-data-dir={user_data}",
            "--window-size=1440,1080",
            f"http://127.0.0.1:{HTTP_PORT}/index.html?v=207",
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
            if evaluate("typeof window.switchAppTab === 'function' && document.querySelectorAll('#balnear-inline-pontos-grid > div').length > 0"):
                break
            time.sleep(0.4)
        time.sleep(1.0)

        evaluate("window.switchSubSection('orla', 'orla-panel-balnear'); window.scrollTo(0, 0);")
        time.sleep(0.8)

        info = evaluate("""({
            cardsCount: document.querySelectorAll('#balnear-inline-pontos-grid > div').length,
            statusGeral: document.getElementById('balnear-status-geral-txt')?.textContent,
            dataBadge: document.getElementById('balnear-data-badge')?.textContent,
            propriasCount: document.getElementById('balnear-proprias-count')?.textContent,
            impropriasCount: document.getElementById('balnear-improprias-count')?.textContent,
            firstCardText: document.querySelector('#balnear-inline-pontos-grid > div')?.innerText
        })""")
        print("Balneabilidade UI State:", json.dumps(info, ensure_ascii=True))
        screenshot("v207_balneabilidade_top.png")

        evaluate("window.scrollTo(0, 420);")
        time.sleep(0.6)
        screenshot("v207_balneabilidade_grid.png")

        ws.close()
    finally:
        edge.terminate()
        server.terminate()

if __name__ == "__main__":
    run()
