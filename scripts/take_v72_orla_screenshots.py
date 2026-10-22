# -*- coding: utf-8 -*-
import subprocess, time, http.server, socketserver, threading, os

PORT = 8997
repo_dir = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app'
artifacts_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'
os.chdir(repo_dir)

Handler = http.server.SimpleHTTPRequestHandler
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(('', PORT), Handler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

# 1. Main card screenshot
main_orla_path = os.path.join(artifacts_dir, 'v72_orla_summary_screenshot.png')
cmd_main = [
    edge_path,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,2600',
    f'--screenshot={main_orla_path}',
    f'http://localhost:{PORT}/index.html'
]

# 2. Modal screenshot (with helper html that opens the modal automatically)
helper_html = f"""
<!DOCTYPE html>
<html>
<body>
<iframe id="app-frame" src="http://localhost:{PORT}/index.html" style="width: 1280px; height: 1200px; border: none;"></iframe>
<script>
window.onload = () => {{
    setTimeout(() => {{
        const iframeWin = document.getElementById('app-frame').contentWindow;
        if (iframeWin && iframeWin.openModalPraias) {{
            iframeWin.openModalPraias('mar');
        }}
    }}, 1200);
}};
</script>
</body>
</html>
"""

with open('modal_praias_helper.html', 'w', encoding='utf-8') as f:
    f.write(helper_html)

modal_path = os.path.join(artifacts_dir, 'v72_praias_modal_screenshot.png')
cmd_modal = [
    edge_path,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,1200',
    f'--screenshot={modal_path}',
    f'http://localhost:{PORT}/modal_praias_helper.html'
]

time.sleep(3)
res_main = subprocess.run(cmd_main, capture_output=True, timeout=30)
res_modal = subprocess.run(cmd_modal, capture_output=True, timeout=30)
httpd.shutdown()

if os.path.exists('modal_praias_helper.html'):
    os.remove('modal_praias_helper.html')

print('Main Orla Screenshot:', os.path.getsize(main_orla_path) if os.path.exists(main_orla_path) else 'Missing')
print('Modal Praias Screenshot:', os.path.getsize(modal_path) if os.path.exists(modal_path) else 'Missing')
