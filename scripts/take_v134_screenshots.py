# -*- coding: utf-8 -*-
import subprocess
from pathlib import Path

ARTIFACT_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

shots = [
    # 1. Desktop Light: Síntese CEMADEN (Dual Monitor + REDEC 1)
    {
        "name": "v134_cemaden_sintese_desktop_light.png",
        "url": "http://localhost:9012/?theme=light#cemaden",
        "w": 1280,
        "h": 1250
    },
    # 2. Desktop Dark: Síntese CEMADEN (Dual Monitor + REDEC 1)
    {
        "name": "v134_cemaden_sintese_desktop_dark.png",
        "url": "http://localhost:9012/?theme=dark#cemaden",
        "w": 1280,
        "h": 1250
    },
    # 3. Desktop Light: Painel Estadual RJ (Mapas Vetoriais CEMADEN-RJ)
    {
        "name": "v134_cemaden_painel_rj_desktop_light.png",
        "url": "http://localhost:9012/?theme=light#cemaden-painel",
        "w": 1280,
        "h": 1150
    },
    # 4. Desktop Dark: Painel Estadual RJ (Mapas Vetoriais CEMADEN-RJ)
    {
        "name": "v134_cemaden_painel_rj_desktop_dark.png",
        "url": "http://localhost:9012/?theme=dark#cemaden-painel",
        "w": 1280,
        "h": 1150
    },
    # 5. Mobile Light: CEMADEN
    {
        "name": "v134_cemaden_mobile_light.png",
        "url": "http://localhost:9012/?theme=light#cemaden",
        "w": 412,
        "h": 915
    },
    # 6. Mobile Dark: CEMADEN
    {
        "name": "v134_cemaden_mobile_dark.png",
        "url": "http://localhost:9012/?theme=dark#cemaden",
        "w": 412,
        "h": 915
    }
]

for s in shots:
    out_file = ARTIFACT_DIR / s["name"]
    cmd = [
        EDGE_PATH,
        "--headless",
        "--disable-gpu",
        f"--window-size={s['w']},{s['h']}",
        f"--screenshot={out_file}",
        s["url"]
    ]
    print(f"Capturing {s['name']}...")
    try:
        subprocess.run(cmd, timeout=22)
        print(f"Captured: {out_file.exists()} ({out_file.stat().st_size if out_file.exists() else 0} bytes)")
    except Exception as e:
        print(f"Error {s['name']}: {e}")

print("All v134 screenshots completed.")
