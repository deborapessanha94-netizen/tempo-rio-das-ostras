# -*- coding: utf-8 -*-
import subprocess, time, http.server, socketserver, threading, os

PORT = 8995
repo_dir = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app'
artifacts_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'
os.chdir(repo_dir)

Handler = http.server.SimpleHTTPRequestHandler
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(('', PORT), Handler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

bottom_path = os.path.join(artifacts_dir, 'v70_bottom_screenshot.png')

cmd = [
    edge_path,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,3800',
    f'--screenshot={bottom_path}',
    f'http://localhost:{PORT}/index.html'
]

time.sleep(3)
res = subprocess.run(cmd, capture_output=True, timeout=30)
httpd.shutdown()

print('Bottom Screenshot:', os.path.getsize(bottom_path) if os.path.exists(bottom_path) else 'Missing')
