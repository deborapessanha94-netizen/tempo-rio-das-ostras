# -*- coding: utf-8 -*-
import subprocess
from pathlib import Path

ARTIFACT_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

shots = [
    # 1. Desktop Light: Alertas view with CEMADEN section right after alerts
    {
        "name": "v133_alertas_cemaden_desktop_light.png",
        "url": "http://localhost:9012/?theme=light#cemaden",
        "w": 1280,
        "h": 1250
    },
    # 2. Desktop Dark: Alertas view with CEMADEN section right after alerts
    {
        "name": "v133_alertas_cemaden_desktop_dark.png",
        "url": "http://localhost:9012/?theme=dark#cemaden",
        "w": 1280,
        "h": 1250
    },
    # 3. Mobile Light: CEMADEN section
    {
        "name": "v133_alertas_cemaden_mobile_light.png",
        "url": "http://localhost:9012/?theme=light#cemaden",
        "w": 412,
        "h": 915
    },
    # 4. Mobile Dark: CEMADEN section
    {
        "name": "v133_alertas_cemaden_mobile_dark.png",
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
        subprocess.run(cmd, timeout=15)
        print(f"Captured: {out_file.exists()} ({out_file.stat().st_size if out_file.exists() else 0} bytes)")
    except Exception as e:
        print(f"Error {s['name']}: {e}")

print("Done captures.")
