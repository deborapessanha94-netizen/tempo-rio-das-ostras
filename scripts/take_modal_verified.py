# -*- coding: utf-8 -*-
import subprocess, time, http.server, socketserver, threading, os

PORT = 8998
repo_dir = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app'
artifacts_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'
os.chdir(repo_dir)

# Read index.html and make modal visible by default for the screenshot
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

test_html = html.replace('id="modal-praias-detalhes" class="fixed inset-0 z-50 hidden', 'id="modal-praias-detalhes" class="fixed inset-0 z-50 flex')

with open('test_modal_praias.html', 'w', encoding='utf-8') as f:
    f.write(test_html)

Handler = http.server.SimpleHTTPRequestHandler
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(('', PORT), Handler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
modal_path = os.path.join(artifacts_dir, 'v72_praias_modal_verified.png')

cmd = [
    edge_path,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,1200',
    f'--screenshot={modal_path}',
    f'http://localhost:{PORT}/test_modal_praias.html'
]

time.sleep(3)
res = subprocess.run(cmd, capture_output=True, timeout=30)
httpd.shutdown()

if os.path.exists('test_modal_praias.html'):
    os.remove('test_modal_praias.html')

print('Modal Verified Screenshot:', os.path.getsize(modal_path) if os.path.exists(modal_path) else 'Missing')
