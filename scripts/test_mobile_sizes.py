# -*- coding: utf-8 -*-
import subprocess, time, http.server, socketserver, threading, os

PORT = 9001
os.chdir(r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app')

Handler = http.server.SimpleHTTPRequestHandler
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(('', PORT), Handler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()
time.sleep(1)

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
art_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'

for w, h, name in [(412, 915, 'v104_mobile_412.png'), (480, 900, 'v104_mobile_480.png'), (768, 1024, 'v104_tablet_768.png')]:
    out_path = os.path.join(art_dir, name)
    cmd = [
        edge_path,
        '--headless=new',
        '--disable-gpu',
        f'--window-size={w},{h}',
        '--virtual-time-budget=3000',
        f'--screenshot={out_path}',
        f'http://localhost:{PORT}/index.html#previsao'
    ]
    subprocess.run(cmd, capture_output=True, timeout=20)
    print(f"Captured {name}: {os.path.getsize(out_path)} bytes")

httpd.shutdown()
