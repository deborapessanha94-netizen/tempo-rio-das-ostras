import subprocess
import time
import json
import urllib.request
import websocket
import base64
import os
from pathlib import Path

ARTIFACTS_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(chrome_path):
    chrome_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

profile_dir = r"C:\Users\debor\.gemini\antigravity\scratch\chrome_audit_subtabs"

proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9236",
    "--disable-gpu",
    "--no-sandbox",
    f"--user-data-dir={profile_dir}"
])

time.sleep(2)
msg_id = 0

subtabs_to_audit = [
    # (tab, subtab_button_text, scroll_y, out_name)
    ("previsao", "Gráficos de Tendência", 0, "audit_prev_graficos.png"),
    ("previsao", "Plano de Contingência", 0, "audit_prev_plancon.png"),
    ("chuva", "10 Estações da Rede", 0, "audit_chuva_cards.png"),
    ("chuva", "Tabela Comparativa", 0, "audit_chuva_tabela.png"),
    ("chuva", "Histórico em Planilha", 0, "audit_chuva_planilha.png"),
    ("rio", "Cota Atual & Calha do Rio", 500, "audit_rio_cota_calha.png"),
    ("rio", "Histórico Telemétrico", 0, "audit_rio_historico.png"),
    ("rio", "Rios da Região", 0, "audit_rio_macae.png"),
    ("alertas", "Riscos Geo-Hidrológicos (CEMADEN)", 0, "audit_alertas_cemaden.png"),
    ("boletim", "Meteogramas Numéricos", 0, "audit_boletim_meteogramas.png"),
    ("boletim", "Telefones Úteis", 0, "audit_boletim_telefones.png"),
]

try:
    tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9236/json").read().decode())
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
        "width": 1400,
        "height": 1400,
        "deviceScaleFactor": 1,
        "mobile": False
    })

    for tab_name, btn_text, scroll_y, out_name in subtabs_to_audit:
        url = f"http://127.0.0.1:8092/index.html?tab={tab_name}"
        cdp("Page.navigate", {"url": url})
        time.sleep(2)

        cdp("Runtime.evaluate", {
            "expression": f"""
            document.documentElement.classList.add('dark');
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent.includes('{btn_text}'));
            if (btn) btn.click();
            window.scrollTo(0, {scroll_y});
            """
        })
        time.sleep(1.5)

        shot = cdp("Page.captureScreenshot", {"format": "png"})
        with open(ARTIFACTS_DIR / out_name, "wb") as f:
            f.write(base64.b64decode(shot["data"]))
        print(f"Saved {out_name}")

finally:
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except:
        proc.kill()
