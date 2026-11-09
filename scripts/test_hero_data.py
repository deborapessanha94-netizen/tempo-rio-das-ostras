import os
import sys
import time
import json
import base64
import tempfile
import threading
import subprocess
from http.server import SimpleHTTPRequestHandler, HTTPServer
import urllib.request
import websocket

PORT = 8775
PROJECT_DIR = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROJECT_DIR, **kwargs)
    def log_message(self, format, *args):
        pass

def start_server():
    httpd = HTTPServer(('127.0.0.1', PORT), QuietHandler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    return httpd

class CDPClient:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, timeout=15)
        self.msg_id = 0

    def send(self, method, params=None):
        self.msg_id += 1
        payload = {"id": self.msg_id, "method": method}
        if params:
            payload["params"] = params
        self.ws.send(json.dumps(payload))
        while True:
            res = json.loads(self.ws.recv())
            if res.get("id") == self.msg_id:
                return res

    def evaluate(self, expression):
        res = self.send("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": True
        })
        if "error" in res:
            raise RuntimeError(f"Eval error: {res['error']}")
        result = res.get("result", {}).get("result", {})
        return result.get("value")

    def close(self):
        try:
            self.ws.close()
        except Exception:
            pass

def main():
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass
    httpd = start_server()
    temp_user_data = tempfile.mkdtemp()
    edge_cmd = [
        EDGE_PATH,
        "--headless=new",
        "--remote-debugging-port=9224",
        f"--user-data-dir={temp_user_data}",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--window-size=1400,950",
        "about:blank"
    ]
    edge_proc = subprocess.Popen(edge_cmd)

    ws_url = None
    for _ in range(20):
        time.sleep(0.5)
        try:
            with urllib.request.urlopen("http://127.0.0.1:9224/json", timeout=2) as resp:
                targets = json.loads(resp.read().decode())
                for t in targets:
                    if t.get("type") == "page" and "webSocketDebuggerUrl" in t:
                        ws_url = t["webSocketDebuggerUrl"]
                        break
            if ws_url:
                break
        except Exception:
            pass

    if not ws_url:
        print("[ERROR] Could not connect to Edge CDP")
        edge_proc.terminate()
        return

    cdp = CDPClient(ws_url)

    try:
        cdp.send("Page.enable")
        cdp.send("Runtime.enable")

        url = f"http://127.0.0.1:{PORT}/index.html?v=193"
        cdp.send("Page.navigate", {"url": url})
        time.sleep(3)

        hero_data = cdp.evaluate("""(() => {
            const getTxt = (id, fallback = '') => {
                const el = document.getElementById(id);
                return el ? el.textContent.trim().replace(/\\s+/g, ' ') : fallback;
            };
            return {
                title: 'Rio das Ostras, RJ - Tempo agora',
                estacaoAno: getTxt('hero-estacao-txt', 'Estação: Primavera'),
                alertPill: getTxt('hero-alert-pill', 'Alerta Oficial Vigente Hoje'),
                temp: getTxt('sidebar-temp', '19°'),
                sensacao: getTxt('hero-sensacao', 'Sensação em Tempo Real: 19°C'),
                skyCond: getTxt('hero-sky-condition', 'Céu no Momento'),
                condTitle: getTxt('hero-condition', 'Muitas nuvens com pancadas de chuva'),
                condSub: getTxt('hero-subcondition', 'Chuva prevista e rajadas'),
                date: getTxt('hero-date', 'Data Oficial'),
                syncLabel: getTxt('hero-sync-label', 'Atualização a cada 5 min'),
                // Chips
                chuvaVal: getTxt('hero-chip-chuva-val', '15.4 mm'),
                chuvaSub: getTxt('hero-chip-chuva-sub', 'Pico: 20 a 30 mm/h'),
                ventoVal: getTxt('sidebar-wind', '6 km/h'),
                ventoSub: getTxt('hero-chip-vento-sub', 'Rajadas 16 km/h'),
                umidVal: getTxt('sidebar-hum', '93%'),
                umidSub: getTxt('hero-chip-umid-sub', 'Ar Muito Úmido'),
                marVal: getTxt('sidebar-sea', '2,0 a 2,5 m (Agitado)'),
                marSub: getTxt('hero-chip-mar-sub', 'Atenção'),
                pressVal: getTxt('hero-chip-press-val', '1021 hPa'),
                pressSub: getTxt('hero-chip-press-sub', 'Estável'),
                uvVal: getTxt('hero-chip-uv-val', '0 - Baixo'),
                uvSub: getTxt('hero-chip-uv-sub', 'Tempo real • IRIODA17'),
                solVal: getTxt('hero-chip-sol-val', '🌅 05:04 • 🌇 17:57'),
                solSub: getTxt('hero-chip-sol-sub', '12h 53m de Sol'),
                luaVal: getTxt('hero-chip-lua-val', '🌕 Lua Cheia'),
                luaSub: getTxt('hero-chip-lua-sub', 'Ilum. 100% • Noite')
            };
        })()""")

        print(json.dumps(hero_data, indent=2, ensure_ascii=False))

    finally:
        cdp.close()
        edge_proc.terminate()
        try:
            edge_proc.wait(timeout=3)
        except Exception:
            edge_proc.kill()

if __name__ == "__main__":
    main()
