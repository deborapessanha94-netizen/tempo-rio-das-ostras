# -*- coding: utf-8 -*-
import subprocess
from pathlib import Path

ARTIFACT_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

shots = [
    # 1. Desktop Light: Acumulados de Chuva tab, showing station cards
    {
        "name": "v139_estacoes_vento_rajadas_desktop_light.png",
        "url": "http://localhost:9012/index.html?tab=chuva&theme=light#chuva",
        "w": 1280,
        "h": 1400
    },
    # 2. Desktop Dark: Acumulados de Chuva tab
    {
        "name": "v139_estacoes_vento_rajadas_desktop_dark.png",
        "url": "http://localhost:9012/index.html?tab=chuva&theme=dark#chuva",
        "w": 1280,
        "h": 1400
    },
    # 3. Mobile Light: Acumulados de Chuva tab, showing Praia da Tartaruga card
    {
        "name": "v139_estacoes_vento_rajadas_mobile_light.png",
        "url": "http://localhost:9012/index.html?tab=chuva&theme=light#chuva",
        "w": 412,
        "h": 2200
    },
    # 4. Mobile Dark: Acumulados de Chuva tab
    {
        "name": "v139_estacoes_vento_rajadas_mobile_dark.png",
        "url": "http://localhost:9012/index.html?tab=chuva&theme=dark#chuva",
        "w": 412,
        "h": 2200
    }
]

for s in shots:
    out_file = ARTIFACT_DIR / s["name"]
    cmd = [
        EDGE_PATH,
        "--headless=new",
        "--disable-gpu",
        f"--window-size={s['w']},{s['h']}",
        "--virtual-time-budget=4000",
        f"--screenshot={out_file}",
        s["url"]
    ]
    print(f"Capturing {s['name']}...")
    try:
        res = subprocess.run(cmd, capture_output=True, timeout=30)
        print(f"Captured: {out_file.exists()} ({out_file.stat().st_size if out_file.exists() else 0} bytes)")
    except Exception as e:
        print(f"Error {s['name']}: {e}")

print("All v139 screenshots completed.")
