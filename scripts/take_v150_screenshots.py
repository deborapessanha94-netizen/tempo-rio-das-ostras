# -*- coding: utf-8 -*-
import subprocess
from pathlib import Path

ARTIFACT_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

shots = [
    {
        "name": "v150_chuva_jundia_clean_desktop_light.png",
        "url": "http://localhost:9012/index.html?tab=chuva&theme=light",
        "w": 1280,
        "h": 1400
    },
    {
        "name": "v150_chuva_jundia_clean_desktop_dark.png",
        "url": "http://localhost:9012/index.html?tab=chuva&theme=dark",
        "w": 1280,
        "h": 1400
    },
    {
        "name": "v150_chuva_jundia_clean_mobile_light.png",
        "url": "http://localhost:9012/index.html?tab=chuva&theme=light",
        "w": 412,
        "h": 1600
    },
    {
        "name": "v150_chuva_jundia_clean_mobile_dark.png",
        "url": "http://localhost:9012/index.html?tab=chuva&theme=dark",
        "w": 412,
        "h": 1600
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

print("All v150 screenshots completed.")
