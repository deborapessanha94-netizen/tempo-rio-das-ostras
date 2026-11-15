import subprocess
import os
import time

PORT = 8092
edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
art_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'

targets = [
    ('v243_panorama_dark.png', f'http://localhost:{PORT}/index.html?tab=panorama&theme=dark', '1280,1000'),
    ('v243_panorama_light.png', f'http://localhost:{PORT}/index.html?tab=panorama&theme=light', '1280,1000'),
]

for filename, url, window_size in targets:
    out_path = os.path.join(art_dir, filename)
    cmd = [
        edge_path,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        f'--window-size={window_size}',
        f'--screenshot={out_path}',
        url
    ]
    print(f"Capturing {filename}...")
    subprocess.run(cmd, check=True)
    time.sleep(1)
    if os.path.exists(out_path):
        print(f"Captured: {out_path} ({os.path.getsize(out_path)} bytes)")

print("Done capturing v243 panorama!")
