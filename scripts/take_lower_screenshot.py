# -*- coding: utf-8 -*-
import subprocess, time, http.server, socketserver, threading, os

PORT = 8994
repo_dir = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app'
artifacts_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'
os.chdir(repo_dir)

Handler = http.server.SimpleHTTPRequestHandler
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(('', PORT), Handler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

# Screenshot focused on lower half
lower_path = os.path.join(artifacts_dir, 'v70_lower_screenshot.png')

# We can take a tall screenshot or use a script that scrolls down
script_scroll = """
<!DOCTYPE html>
<html>
<body>
<iframe id="frame" src="http://localhost:8994/index.html" style="width: 1280px; height: 1800px; border: none;"></iframe>
<script>
window.onload = () => {
    setTimeout(() => {
        document.getElementById('frame').contentWindow.scrollTo(0, 1400);
    }, 1500);
};
</script>
</body>
</html>
"""

with open('scroll_helper.html', 'w', encoding='utf-8') as f:
    f.write(script_scroll)

cmd = [
    edge_path,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,2400',
    f'--screenshot={lower_path}',
    f'http://localhost:{PORT}/index.html'
]

time.sleep(3)
res = subprocess.run(cmd, capture_output=True, timeout=30)
httpd.shutdown()

print('Lower Screenshot:', os.path.getsize(lower_path) if os.path.exists(lower_path) else 'Missing')
