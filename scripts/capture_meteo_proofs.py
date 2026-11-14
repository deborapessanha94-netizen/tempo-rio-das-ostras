import subprocess
import time
import os

PORT = 8092
edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
art_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'

targets = [
    ('v232_meteograma_cptec_light.png', f'http://localhost:{PORT}/index.html?tab=boletim&sub=meteogramas&meteo=cptec&theme=light', '1280,1100'),
    ('v232_meteograma_cptec_dark.png', f'http://localhost:{PORT}/index.html?tab=boletim&sub=meteogramas&meteo=cptec&theme=dark', '1280,1100'),
    ('v232_meteograma_inmet_light.png', f'http://localhost:{PORT}/index.html?tab=boletim&sub=meteogramas&meteo=inmet&theme=light', '1280,1100'),
    ('v232_meteograma_inmet_dark.png', f'http://localhost:{PORT}/index.html?tab=boletim&sub=meteogramas&meteo=inmet&theme=dark', '1280,1100'),
    ('v232_meteograma_wwatch_dark.png', f'http://localhost:{PORT}/index.html?tab=boletim&sub=meteogramas&meteo=wwatch&theme=dark', '1280,1100'),
]

for filename, url, win_size in targets:
    out_path = os.path.join(art_dir, filename)
    # clean old
    if os.path.exists(out_path):
        os.remove(out_path)
    cmd = [
        edge_path,
        '--headless=new',
        '--disable-gpu',
        f'--window-size={win_size}',
        '--virtual-time-budget=5000',
        f'--screenshot={out_path}',
        url
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, timeout=30)
        size = os.path.getsize(out_path) if os.path.exists(out_path) else 0
        print(f"Captured {filename}: {size} bytes (exit {res.returncode})")
    except Exception as e:
        print(f"Failed {filename}: {e}")

print("Meteogram verification capture complete!")
