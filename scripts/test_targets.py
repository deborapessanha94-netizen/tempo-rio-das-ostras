import json
import urllib.request
import subprocess
import time

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
proc = subprocess.Popen([
    EDGE_PATH,
    "--remote-debugging-port=9342",
    "--user-data-dir=C:\\Users\\debor\\AppData\\Local\\Temp\\edge_targets_test",
    "--headless=new",
    "--disable-gpu",
    "about:blank"
])
time.sleep(1.5)

with urllib.request.urlopen("http://127.0.0.1:9342/json") as resp:
    targets = json.loads(resp.read().decode())
print("Targets found:", len(targets))
for t in targets:
    print(t.get("type"), t.get("url"), t.get("webSocketDebuggerUrl"))

proc.kill()
