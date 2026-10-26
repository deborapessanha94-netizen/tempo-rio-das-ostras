import subprocess, os

PORT = 9012
edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
art_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'

targets = [
    ('v127_hero_light.png', f'http://localhost:{PORT}/index.html?theme=light', '1280,900'),
    ('v127_hero_dark.png', f'http://localhost:{PORT}/index.html?theme=dark', '1280,900'),
    ('v127_hero_mobile_light.png', f'http://localhost:{PORT}/index.html?theme=light', '390,844'),
    ('v127_hero_mobile_dark.png', f'http://localhost:{PORT}/index.html?theme=dark', '390,844'),
]

for filename, url, win_size in targets:
    out_path = os.path.join(art_dir, filename)
    cmd = [
        edge_path,
        '--headless=new',
        '--disable-gpu',
        f'--window-size={win_size}',
        '--virtual-time-budget=4500',
        f'--screenshot={out_path}',
        url
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, timeout=25)
        size = os.path.getsize(out_path) if os.path.exists(out_path) else 0
        print(f"Captured {filename}: {size} bytes (code {res.returncode})")
    except Exception as e:
        print(f"Failed {filename}: {e}")

print("v127 screenshots completed!")
