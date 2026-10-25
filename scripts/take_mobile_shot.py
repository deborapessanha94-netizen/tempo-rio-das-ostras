# -*- coding: utf-8 -*-
import subprocess, time, http.server, socketserver, threading, os

PORT = 8999
os.chdir(r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app')

Handler = http.server.SimpleHTTPRequestHandler
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(('', PORT), Handler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()
time.sleep(1)

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
art_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'
out_path = os.path.join(art_dir, 'v104_mobile_tabs_perfect.png')

cmd = [
    edge_path,
    '--headless=new',
    '--disable-gpu',
    '--window-size=390,900',
    '--virtual-time-budget=3000',
    f'--screenshot={out_path}',
    f'http://localhost:{PORT}/index.html#previsao'
]

res = subprocess.run(cmd, capture_output=True, timeout=20)
httpd.shutdown()
print("Mobile shot captured:", os.path.exists(out_path))
