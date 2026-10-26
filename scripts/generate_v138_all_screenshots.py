# -*- coding: utf-8 -*-
import subprocess
from pathlib import Path
from PIL import Image

ARTIFACT_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

def capture(url, out_path, w, h):
    cmd = [
        EDGE_PATH,
        "--headless=new",
        "--disable-gpu",
        f"--window-size={w},{h}",
        "--virtual-time-budget=4000",
        f"--screenshot={out_path}",
        url
    ]
    subprocess.run(cmd, capture_output=True)

# 1. Desktop Light
raw_desk_light = ARTIFACT_DIR / "raw_plancon_desk_light.png"
capture("http://localhost:9012/index.html?tab=previsao&theme=light", raw_desk_light, 1280, 3200)
if raw_desk_light.exists():
    im = Image.open(raw_desk_light)
    # Crop to PLANCON section
    crop_im = im.crop((40, 1540, 1240, 2210))
    crop_im.save(ARTIFACT_DIR / "v138_plancon_cards_desktop_light.png")
    print("Desktop Light done:", (ARTIFACT_DIR / "v138_plancon_cards_desktop_light.png").stat().st_size)

# 2. Desktop Dark
raw_desk_dark = ARTIFACT_DIR / "raw_plancon_desk_dark.png"
capture("http://localhost:9012/index.html?tab=previsao&theme=dark", raw_desk_dark, 1280, 3200)
if raw_desk_dark.exists():
    im = Image.open(raw_desk_dark)
    crop_im = im.crop((40, 1540, 1240, 2210))
    crop_im.save(ARTIFACT_DIR / "v138_plancon_cards_desktop_dark.png")
    print("Desktop Dark done:", (ARTIFACT_DIR / "v138_plancon_cards_desktop_dark.png").stat().st_size)

# 3. Mobile Light (Let's capture 412x5500 to find PLANCON coordinates)
raw_mob_light = ARTIFACT_DIR / "raw_plancon_mob_light.png"
capture("http://localhost:9012/index.html?tab=previsao&theme=light", raw_mob_light, 412, 5500)
print("Mobile raw light done:", raw_mob_light.exists())

# 4. Mobile Dark
raw_mob_dark = ARTIFACT_DIR / "raw_plancon_mob_dark.png"
capture("http://localhost:9012/index.html?tab=previsao&theme=dark", raw_mob_dark, 412, 5500)
print("Mobile raw dark done:", raw_mob_dark.exists())
