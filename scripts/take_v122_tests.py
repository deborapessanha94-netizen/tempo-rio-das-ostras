# -*- coding: utf-8 -*-
import subprocess, time, os

PORT = 9012
edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
art_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'

targets = [
    ('v122_wind_chart_light.png', f'http://localhost:{PORT}/index.html?theme=light&metric=wind#previsao', '1280,1400'),
    ('v122_wind_chart_dark.png', f'http://localhost:{PORT}/index.html?theme=dark&metric=wind#previsao', '1280,1400'),
    ('v122_chuva_stations_light.png', f'http://localhost:{PORT}/index.html?theme=light#chuva', '1280,1600'),
    ('v122_chuva_stations_dark.png', f'http://localhost:{PORT}/index.html?theme=dark#chuva', '1280,1600'),
]

for filename, url, win_size in targets:
    out_path = os.path.join(art_dir, filename)
    cmd = [
        edge_path,
        '--headless=new',
        '--disable-gpu',
        f'--window-size={win_size}',
        '--virtual-time-budget=4000',
        f'--screenshot={out_path}',
        url
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, timeout=25)
        size = os.path.getsize(out_path) if os.path.exists(out_path) else 0
        print(f"Captured {filename}: {size} bytes (code {res.returncode})")
    except Exception as e:
        print(f"Failed {filename}: {e}")

print("All v122 test screenshots completed!")
