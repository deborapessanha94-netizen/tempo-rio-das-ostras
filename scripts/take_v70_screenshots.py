# -*- coding: utf-8 -*-
import subprocess, time, http.server, socketserver, threading, os

PORT = 8993
repo_dir = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app'
artifacts_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'
os.chdir(repo_dir)

Handler = http.server.SimpleHTTPRequestHandler
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(('', PORT), Handler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

# 1. Desktop screenshot
desktop_path = os.path.join(artifacts_dir, 'v70_desktop_screenshot.png')
cmd_desktop = [
    edge_path,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,1800',
    f'--screenshot={desktop_path}',
    f'http://localhost:{PORT}/index.html'
]

# 2. Mobile screenshot
mobile_path = os.path.join(artifacts_dir, 'v70_mobile_screenshot.png')
cmd_mobile = [
    edge_path,
    '--headless=new',
    '--disable-gpu',
    '--window-size=430,2200',
    f'--screenshot={mobile_path}',
    f'http://localhost:{PORT}/index.html'
]

time.sleep(3)
res_d = subprocess.run(cmd_desktop, capture_output=True, timeout=30)
res_m = subprocess.run(cmd_mobile, capture_output=True, timeout=30)
httpd.shutdown()

print('Desktop Screenshot:', os.path.getsize(desktop_path) if os.path.exists(desktop_path) else 'Missing')
print('Mobile Screenshot:', os.path.getsize(mobile_path) if os.path.exists(mobile_path) else 'Missing')
