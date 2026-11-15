# -*- coding: utf-8 -*-
import subprocess, time, urllib.request, json, base64, asyncio, websockets, os
chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
art_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'
dbg_port = 9274
out_path = os.path.join(art_dir, 'v248_mobile_mar_in_text_scrolled.png')
user_data = rf'C:\Users\debor\.gemini\antigravity\scratch\chrome_user_v248_{dbg_port}'
cmd = [chrome_path, '--headless=new', f'--remote-debugging-port={dbg_port}', '--window-size=390,844', f'--user-data-dir={user_data}', '--hide-scrollbars', 'http://localhost:8092/index.html?tab=previsao&sub=proximos-dias&theme=dark']
proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(2.5)
try:
    targets = json.loads(urllib.request.urlopen(f'http://127.0.0.1:{dbg_port}/json').read())
    ws_url = targets[0]['webSocketDebuggerUrl']
    async def run():
        async with websockets.connect(ws_url) as ws:
            await ws.send(json.dumps({'id': 1, 'method': 'Runtime.enable'}))
            await ws.recv()
            await asyncio.sleep(2.5)
            await ws.send(json.dumps({'id': 2, 'method': 'Runtime.evaluate', 'params': {'expression': 'window.scrollTo({ top: 380, behavior: "instant" });'}}))
            await ws.recv()
            await asyncio.sleep(1.0)
            await ws.send(json.dumps({'id': 100, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}}))
            while True:
                msg = json.loads(await ws.recv())
                if msg.get('id') == 100:
                    with open(out_path, 'wb') as f:
                        f.write(base64.b64decode(msg['result']['data']))
                    print('Captured scrolled mobile')
                    break
    asyncio.run(run())
finally:
    proc.kill()
    proc.wait()
