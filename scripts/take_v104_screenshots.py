# -*- coding: utf-8 -*-
import subprocess, time, http.server, socketserver, threading, os

PORT = 8998
os.chdir(r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app')

Handler = http.server.SimpleHTTPRequestHandler
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(('', PORT), Handler)
t = threading.Thread(target=httpd.serve_forever, daemon=True)
t.start()
time.sleep(1)

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
art_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'

targets = [
    ('v104_desktop_tabs_previsao.png', f'http://localhost:{PORT}/index.html#previsao', '1280,1200'),
    ('v104_desktop_chuva.png', f'http://localhost:{PORT}/index.html#chuva', '1280,1400'),
    ('v104_desktop_rio.png', f'http://localhost:{PORT}/index.html#rio', '1280,1200'),
    ('v104_desktop_orla.png', f'http://localhost:{PORT}/index.html#orla', '1280,1200'),
    ('v104_desktop_alertas.png', f'http://localhost:{PORT}/index.html#alertas', '1280,1200'),
    ('v104_desktop_boletim.png', f'http://localhost:{PORT}/index.html#boletim', '1280,1200'),
    ('v104_mobile_tabs.png', f'http://localhost:{PORT}/index.html#previsao', '390,900'),
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
        res = subprocess.run(cmd, capture_output=True, timeout=20)
        size = os.path.getsize(out_path) if os.path.exists(out_path) else 0
        print(f"Captured {filename}: {size} bytes (code {res.returncode})")
    except Exception as e:
        print(f"Failed {filename}: {e}")

httpd.shutdown()
print("All screenshots taken successfully!")
