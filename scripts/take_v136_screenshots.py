# -*- coding: utf-8 -*-
import subprocess
from pathlib import Path

ARTIFACT_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

shots = [
    # 1. Desktop Light: Previsão tab with metric=wind
    {
        "name": "v136_vento_rajadas_chart_desktop_light.png",
        "url": "http://localhost:9012/index.html?tab=previsao&metric=wind&theme=light#bulletin-chart",
        "w": 1280,
        "h": 1400
    },
    # 2. Desktop Dark: Previsão tab with metric=wind
    {
        "name": "v136_vento_rajadas_chart_desktop_dark.png",
        "url": "http://localhost:9012/index.html?tab=previsao&metric=wind&theme=dark#bulletin-chart",
        "w": 1280,
        "h": 1400
    },
    # 3. Mobile Light: Previsão tab with metric=wind
    {
        "name": "v136_vento_rajadas_chart_mobile_light.png",
        "url": "http://localhost:9012/index.html?tab=previsao&metric=wind&theme=light#bulletin-chart",
        "w": 412,
        "h": 1300
    },
    # 4. Mobile Dark: Previsão tab with metric=wind
    {
        "name": "v136_vento_rajadas_chart_mobile_dark.png",
        "url": "http://localhost:9012/index.html?tab=previsao&metric=wind&theme=dark#bulletin-chart",
        "w": 412,
        "h": 1300
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
        res = subprocess.run(cmd, capture_output=True, timeout=25)
        print(f"Captured: {out_file.exists()} ({out_file.stat().st_size if out_file.exists() else 0} bytes)")
    except Exception as e:
        print(f"Error {s['name']}: {e}")

print("All v136 screenshots completed.")
