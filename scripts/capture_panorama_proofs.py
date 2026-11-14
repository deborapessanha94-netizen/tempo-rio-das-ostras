import subprocess
import os

PORT = 8092
edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
art_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'

targets = [
    # 01 a 07 de Novembro - Dark Mode
    ('v233_panorama_01a07_nov_dark.png', f'http://localhost:{PORT}/index.html?tab=panorama&theme=dark', '1280,1200'),
    # 01 a 07 de Novembro - Light Mode
    ('v233_panorama_01a07_nov_light.png', f'http://localhost:{PORT}/index.html?tab=panorama&theme=light', '1280,1200'),
    # Feed Carrossel Lâmina Dinâmica - 01 a 07 de Novembro
    ('v233_panorama_feed_nov_dark.png', f'http://localhost:{PORT}/index.html?tab=panorama&sub=feed&theme=dark', '1280,1200'),
    # Legenda Formatada de Novembro
    ('v233_panorama_legenda_nov_dark.png', f'http://localhost:{PORT}/index.html?tab=panorama&sub=legenda&theme=dark', '1280,1200'),
]

for filename, url, win_size in targets:
    out_path = os.path.join(art_dir, filename)
    if os.path.exists(out_path):
        os.remove(out_path)
    cmd = [
        edge_path,
        '--headless=new',
        '--disable-gpu',
        f'--window-size={win_size}',
        '--virtual-time-budget=6000',
        f'--screenshot={out_path}',
        url
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, timeout=40)
        size = os.path.getsize(out_path) if os.path.exists(out_path) else 0
        print(f"Captured {filename}: {size} bytes (exit {res.returncode})")
    except Exception as e:
        print(f"Failed {filename}: {e}")

print("Panorama proofs successfully updated!")
