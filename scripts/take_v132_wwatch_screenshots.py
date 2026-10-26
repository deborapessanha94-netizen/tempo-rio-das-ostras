# -*- coding: utf-8 -*-
import subprocess
import time
from pathlib import Path

ARTIFACT_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

shots = [
    # 1. Desktop Light: Orla Tab with Wwatch active
    {
        "name": "v132_orla_wwatch_desktop_light.png",
        "url": "http://localhost:9012/?theme=light#wwatch",
        "w": 1280,
        "h": 1250
    },
    # 2. Desktop Dark: Orla Tab with Wwatch active
    {
        "name": "v132_orla_wwatch_desktop_dark.png",
        "url": "http://localhost:9012/?theme=dark#wwatch",
        "w": 1280,
        "h": 1250
    },
    # 3. Mobile Light: Orla Tab with Wwatch active
    {
        "name": "v132_orla_wwatch_mobile_light.png",
        "url": "http://localhost:9012/?theme=light#wwatch",
        "w": 412,
        "h": 915
    },
    # 4. Mobile Dark: Orla Tab with Wwatch active
    {
        "name": "v132_orla_wwatch_mobile_dark.png",
        "url": "http://localhost:9012/?theme=dark#wwatch",
        "w": 412,
        "h": 915
    },
    # 5. Modal Meteogramas Tab 4 WaveWatch III
    {
        "name": "v132_modal_wwatch_desktop.png",
        "url": "http://localhost:9012/?modal=wwatch",
        "w": 1280,
        "h": 950
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
