# -*- coding: utf-8 -*-
"""
Capture screenshots of Hero Card and Modal Mapa RJ in Light and Dark mode, Desktop and Mobile.
"""
import subprocess
import time
import os

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
OUTPUT_DIR = r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf"

def run_screenshot(url, filename, window_size="1280,850"):
    out_path = os.path.join(OUTPUT_DIR, filename)
    cmd = [
        EDGE_PATH,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--window-size={window_size}",
        f"--screenshot={out_path}",
        url
    ]
    subprocess.run(cmd, check=True)
    print(f"Captured: {filename}")

if __name__ == '__main__':
    # 1. Desktop Light Hero
    run_screenshot("http://localhost:9012/index.html?theme=light", "v129_hero_light.png", "1280,850")
    
    # 2. Desktop Dark Hero
    run_screenshot("http://localhost:9012/index.html?theme=dark", "v129_hero_dark.png", "1280,850")
    
    # 3. Desktop Light Modal
    run_screenshot("http://localhost:9012/index.html?theme=light&modal=mapa-rj", "v129_modal_mapa_light.png", "1280,850")
    
    # 4. Desktop Dark Modal
    run_screenshot("http://localhost:9012/index.html?theme=dark&modal=mapa-rj", "v129_modal_mapa_dark.png", "1280,850")
    
    # 5. Mobile Light Hero
    run_screenshot("http://localhost:9012/index.html?theme=light", "v129_hero_mobile_light.png", "390,844")
    
    # 6. Mobile Dark Hero
    run_screenshot("http://localhost:9012/index.html?theme=dark", "v129_hero_mobile_dark.png", "390,844")
