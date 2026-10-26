# -*- coding: utf-8 -*-
import subprocess
from pathlib import Path

ARTIFACT_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

shots = [
    # 1. Desktop Light: PLANCON cards (1280x950 scrolled to plancon)
    {
        "name": "v138_plancon_cards_desktop_light.png",
        "url": "http://localhost:9012/index.html?tab=previsao&theme=light&scroll=plancon",
        "w": 1280,
        "h": 900
    },
    # 2. Desktop Dark: PLANCON cards
    {
        "name": "v138_plancon_cards_desktop_dark.png",
        "url": "http://localhost:9012/index.html?tab=previsao&theme=dark&scroll=plancon",
        "w": 1280,
        "h": 900
    },
    # 3. Mobile Light: PLANCON cards (412x1400 scrolled to plancon)
    {
        "name": "v138_plancon_cards_mobile_light.png",
        "url": "http://localhost:9012/index.html?tab=previsao&theme=light&scroll=plancon",
        "w": 412,
        "h": 1400
    },
    # 4. Mobile Dark: PLANCON cards
    {
        "name": "v138_plancon_cards_mobile_dark.png",
        "url": "http://localhost:9012/index.html?tab=previsao&theme=dark&scroll=plancon",
        "w": 412,
        "h": 1400
    }
]

for s in shots:
    out_file = ARTIFACT_DIR / s["name"]
    cmd = [
        EDGE_PATH,
        "--headless=new",
        "--disable-gpu",
        f"--window-size={s['w']},{s['h']}",
        "--virtual-time-budget=4500",
        f"--screenshot={out_file}",
        s["url"]
    ]
    print(f"Capturing {s['name']}...")
    try:
        res = subprocess.run(cmd, capture_output=True, timeout=30)
        print(f"Captured: {out_file.exists()} ({out_file.stat().st_size if out_file.exists() else 0} bytes)")
    except Exception as e:
        print(f"Error {s['name']}: {e}")

print("All v138 screenshots completed.")
