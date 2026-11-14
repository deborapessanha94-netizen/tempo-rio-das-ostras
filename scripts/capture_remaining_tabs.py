import subprocess, time, json, urllib.request, websocket, base64
from pathlib import Path

ARTIFACTS_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9224",
    "--disable-gpu",
    "--no-sandbox",
    "--user-data-dir=C:\\Users\\debor\\.gemini\\antigravity\\scratch\\chrome_test_profile2"
])

time.sleep(2)
msg_id = 0

try:
    tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9224/json").read().decode())
    target = tabs[0]
    ws = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=15)

    def cdp(method, params=None):
        global msg_id
        msg_id += 1
        current_id = msg_id
        ws.send(json.dumps({"id": current_id, "method": method, "params": params or {}}))
        while True:
            resp = json.loads(ws.recv())
            if resp.get("id") == current_id:
                return resp.get("result", {})

    cdp("Page.enable")
    cdp("Runtime.enable")

    cdp("Emulation.setDeviceMetricsOverride", {
        "width": 1440,
        "height": 900,
        "deviceScaleFactor": 1,
        "mobile": False
    })

    cdp("Page.navigate", {"url": "http://127.0.0.1:8092/index.html"})
    time.sleep(3)

    tabs_to_test = [
        ("Orla & Praias", "react_desktop_orla.png"),
        ("Alertas & Sinótico", "react_desktop_alertas.png"),
        ("Boletim 16 Turnos", "react_desktop_boletim.png"),
        ("Panorama Mensal", "react_desktop_panorama.png"),
    ]

    for label, fname in tabs_to_test:
        cdp("Runtime.evaluate", {"expression": f"Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('{label}'))?.click()"})
        time.sleep(1)
        shot = cdp("Page.captureScreenshot", {"format": "png"})
        with open(ARTIFACTS_DIR / fname, "wb") as f:
            f.write(base64.b64decode(shot["data"]))
        print(f"Saved {fname}")

    # Now click Previsao -> PLANCON sub-section
    cdp("Runtime.evaluate", {"expression": "Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Previsão & Tempo'))?.click()"})
    time.sleep(0.5)
    cdp("Runtime.evaluate", {"expression": "Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Plano de Contingência (PLANCON)'))?.click()"})
    time.sleep(0.5)

    # Click El Nino sub-tab
    cdp("Runtime.evaluate", {"expression": "Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('El Niño'))?.click()"})
    time.sleep(1)

    shot_plancon = cdp("Page.captureScreenshot", {"format": "png"})
    with open(ARTIFACTS_DIR / "react_desktop_plancon_elnino.png", "wb") as f:
        f.write(base64.b64decode(shot_plancon["data"]))
    print("Saved react_desktop_plancon_elnino.png")

    ws.close()

except Exception as e:
    print("Error:", e)
finally:
    proc.terminate()
