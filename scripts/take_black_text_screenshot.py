# -*- coding: utf-8 -*-
import subprocess, time, http.server, socketserver, threading, os

PORT = 8999
os.chdir(r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app')

Handler = http.server.SimpleHTTPRequestHandler
# Allow address reuse in case socket was recently used
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(('', PORT), Handler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
screenshot_path = os.path.join(r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf', 'all_black_letters_screenshot.png')

cmd = [
    edge_path,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,2600',
    f'--screenshot={screenshot_path}',
    f'http://localhost:{PORT}/index.html'
]

# Wait 3 seconds for server and fetch to render initial data
time.sleep(3)
res = subprocess.run(cmd, capture_output=True, timeout=30)
httpd.shutdown()

print('Edge return code:', res.returncode)
print('Screenshot size:', os.path.getsize(screenshot_path) if os.path.exists(screenshot_path) else 'Missing')
