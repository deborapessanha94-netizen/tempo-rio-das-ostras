# -*- coding: utf-8 -*-
import subprocess
from pathlib import Path

ARTIFACT_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

shots = [
    # 1. Desktop Light: Nível do Rio tab with Macaé Notification Banner
    {
        "name": "v135_rio_macae_notificacao_desktop_light.png",
        "url": "http://localhost:9012/?tab=rio&theme=light#rio",
        "w": 1280,
        "h": 1200
    },
    # 2. Desktop Dark: Nível do Rio tab with Macaé Notification Banner
    {
        "name": "v135_rio_macae_notificacao_desktop_dark.png",
        "url": "http://localhost:9012/?tab=rio&theme=dark#rio",
        "w": 1280,
        "h": 1200
    },
    # 3. Mobile Light: Nível do Rio tab
    {
        "name": "v135_rio_macae_notificacao_mobile_light.png",
        "url": "http://localhost:9012/?tab=rio&theme=light#rio",
        "w": 412,
        "h": 915
    },
    # 4. Mobile Dark: Nível do Rio tab
    {
        "name": "v135_rio_macae_notificacao_mobile_dark.png",
        "url": "http://localhost:9012/?tab=rio&theme=dark#rio",
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

print("All v135 screenshots completed.")
