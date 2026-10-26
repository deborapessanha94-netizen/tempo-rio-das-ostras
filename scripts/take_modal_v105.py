# -*- coding: utf-8 -*-
import subprocess, time, http.server, socketserver, threading, os

PORT = 9008
os.chdir(r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app')

Handler = http.server.SimpleHTTPRequestHandler
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(('', PORT), Handler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()
time.sleep(1)

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
art_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'
out_path = os.path.join(art_dir, 'v105_modal_social_no_site.png')

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Auto-open modal on DOM load
hook = """
<script>
window.addEventListener('load', () => {
  setTimeout(() => {
    window.switchAppTab('chuva');
    setTimeout(() => {
      if (window.openSocialModalChuva) {
        window.openSocialModalChuva('24h');
      }
    }, 800);
  }, 1000);
});
</script>
</body>
"""
html = html.replace('</body>', hook)
with open('test_open_modal.html', 'w', encoding='utf-8') as f:
    f.write(html)

cmd = [
    edge_path,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,1100',
    '--virtual-time-budget=6000',
    f'--screenshot={out_path}',
    f'http://localhost:{PORT}/test_open_modal.html'
]

subprocess.run(cmd, capture_output=True, timeout=25)
httpd.shutdown()
if os.path.exists('test_open_modal.html'):
    os.remove('test_open_modal.html')

print("Screenshot captured:", os.path.exists(out_path), os.path.getsize(out_path) if os.path.exists(out_path) else 0)
