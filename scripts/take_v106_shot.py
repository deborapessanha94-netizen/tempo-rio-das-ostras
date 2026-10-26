# -*- coding: utf-8 -*-
import subprocess, time, http.server, socketserver, threading, os

PORT = 9010
os.chdir(r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app')

Handler = http.server.SimpleHTTPRequestHandler
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(('', PORT), Handler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()
time.sleep(1)

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
art_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'
out_path = os.path.join(art_dir, 'v106_chuva_jundia_ceramic_palette.png')

cmd = [
    edge_path,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,1800',
    '--virtual-time-budget=4000',
    f'--screenshot={out_path}',
    f'http://localhost:{PORT}/index.html#chuva'
]

subprocess.run(cmd, capture_output=True, timeout=25)
httpd.shutdown()

print("Screenshot captured:", os.path.exists(out_path), os.path.getsize(out_path) if os.path.exists(out_path) else 0)
