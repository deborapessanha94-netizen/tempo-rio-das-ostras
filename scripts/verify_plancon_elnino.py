# -*- coding: utf-8 -*-
"""
Verificação automatizada: Valida aba e renderização do painel Riscos El Niño no PLANCON (v218).
"""
import urllib.request, json, time, subprocess, tempfile, socket, websocket, base64
from pathlib import Path

ROOT = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
BRAIN = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")

s = socket.socket()
s.bind(("127.0.0.1", 0))
http_port = s.getsockname()[1]
s.close()

srv = subprocess.Popen(["python", "-m", "http.server", str(http_port)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
temp_dir = tempfile.mkdtemp()
cdp_port = 9335
edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
proc = subprocess.Popen([edge_path, "--headless=new", f"--remote-debugging-port={cdp_port}", f"--user-data-dir={temp_dir}", "--window-size=1440,1200", "about:blank"])

try:
    time.sleep(2.5)
    tabs = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{cdp_port}/json").read().decode())
    target = next(t for t in tabs if t.get("type") == "page")
    ws = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=10)
    msg_id = 0

    def cdp(method, params=None):
        global msg_id
        msg_id += 1
        ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
        while True:
            r = json.loads(ws.recv())
            if r.get("id") == msg_id:
                return r.get("result", {})

    cdp("Page.enable")
    cdp("Runtime.enable")

    # 1. Desktop Test (1440x1200)
    cdp("Emulation.setDeviceMetricsOverride", {
        "width": 1440,
        "height": 1200,
        "deviceScaleFactor": 1,
        "mobile": False
    })
    cdp("Page.navigate", {"url": f"http://127.0.0.1:{http_port}/index.html?v=218"})
    time.sleep(3.5)

    # Exibir a sub-seção do PLANCON e ativar a aba El Niño
    switch_res = cdp("Runtime.evaluate", {
        "expression": """
        (() => {
            if (typeof window.switchSubSection === 'function') {
                window.switchSubSection('previsao', 'section-plancon-resumo');
            }
            const sec = document.getElementById('section-plancon-resumo');
            if (sec) sec.classList.remove('hidden');
            
            const btn = document.getElementById('plancon-tab-btn-elnino');
            if (!btn) return { ok: false, error: 'btn-not-found' };
            window.switchPlanconTab('elnino');
            
            const panel = document.getElementById('plancon-panel-elnino');
            const isVisible = panel && !panel.classList.contains('hidden');
            const isActive = btn.classList.contains('active');
            
            return {
                ok: isVisible && isActive,
                isVisible,
                isActive,
                btnText: btn.innerText.trim(),
                hasPdfLink: !!panel.querySelector('a[href*="plancon_el_nino_rio_das_ostras.pdf"]'),
                secVisible: sec && window.getComputedStyle(sec).display !== 'none'
            };
        })()
        """,
        "returnByValue": True
    })
    status = switch_res.get("result", {}).get("value", {})
    print("Desktop Tab Status:", json.dumps(status, indent=2))

    time.sleep(1.0)

    # Obter posição e dimensões
    res_dim = cdp("Runtime.evaluate", {
        "expression": """
        (() => {
            const sec = document.getElementById('section-plancon-resumo');
            if (!sec) return null;
            const r = sec.getBoundingClientRect();
            return {
                x: Math.round(r.left),
                y: Math.round(r.top + window.scrollY),
                w: Math.round(r.width),
                h: Math.round(r.height)
            };
        })()
        """,
        "returnByValue": True
    })
    dim = res_dim.get("result", {}).get("value")
    print("Desktop Section Dim:", dim)

    # Screenshot Desktop
    if dim and dim.get("w", 0) > 0 and dim.get("h", 0) > 0:
        clip = {
            "x": dim["x"],
            "y": dim["y"],
            "width": dim["w"],
            "height": min(1800, dim["h"]),
            "scale": 1
        }
        print("Capturing Desktop Clip:", clip)
        shot = cdp("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": True, "clip": clip})
        if shot.get("data"):
            desktop_img = BRAIN / "v218_plancon_elnino_desktop.png"
            desktop_img.write_bytes(base64.b64decode(shot["data"]))
            print(f"Salvo com sucesso: {desktop_img} ({desktop_img.stat().st_size} bytes)")

    # 2. Mobile Test (412x915)
    cdp("Emulation.setDeviceMetricsOverride", {
        "width": 412,
        "height": 915,
        "deviceScaleFactor": 2,
        "mobile": True
    })
    time.sleep(1.0)
    cdp("Runtime.evaluate", {
        "expression": """
        (() => {
            if (typeof window.switchSubSection === 'function') {
                window.switchSubSection('previsao', 'section-plancon-resumo');
            }
            const sec = document.getElementById('section-plancon-resumo');
            if (sec) sec.classList.remove('hidden');
            window.switchPlanconTab('elnino');
        })()
        """
    })
    time.sleep(1.0)

    res_dim_m = cdp("Runtime.evaluate", {
        "expression": """
        (() => {
            const sec = document.getElementById('section-plancon-resumo');
            if (!sec) return null;
            const r = sec.getBoundingClientRect();
            return {
                x: Math.round(r.left),
                y: Math.round(r.top + window.scrollY),
                w: Math.round(r.width),
                h: Math.round(r.height)
            };
        })()
        """,
        "returnByValue": True
    })
    dim_m = res_dim_m.get("result", {}).get("value")
    print("Mobile Section Dim:", dim_m)

    if dim_m and dim_m.get("w", 0) > 0 and dim_m.get("h", 0) > 0:
        clip_m = {
            "x": dim_m["x"],
            "y": dim_m["y"],
            "width": dim_m["w"],
            "height": min(2200, dim_m["h"]),
            "scale": 1
        }
        print("Capturing Mobile Clip:", clip_m)
        shot_m = cdp("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": True, "clip": clip_m})
        if shot_m.get("data"):
            mobile_img = BRAIN / "v218_plancon_elnino_mobile.png"
            mobile_img.write_bytes(base64.b64decode(shot_m["data"]))
            print(f"Salvo com sucesso: {mobile_img} ({mobile_img.stat().st_size} bytes)")

except Exception as e:
    print("ERRO no teste CDP:", e)
finally:
    try: ws.close()
    except: pass
    try: proc.terminate()
    except: pass
    try: srv.terminate()
    except: pass
print("Verificação de screenshots concluída!")
