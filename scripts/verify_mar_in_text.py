# -*- coding: utf-8 -*-
import subprocess
import time
import os
import urllib.request
import json
import base64
import asyncio
import websockets

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
art_dir = r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf"
dbg_port = 9268

def capture(width, height, output_name, url_path):
    out_path = os.path.join(art_dir, output_name)
    user_data = rf"C:\Users\debor\.gemini\antigravity\scratch\chrome_user_v248_{dbg_port}"
    full_url = f"http://localhost:8092/{url_path}"
    cmd = [
        chrome_path,
        "--headless=new",
        f"--remote-debugging-port={dbg_port}",
        f"--window-size={width},{height}",
        f"--user-data-dir={user_data}",
        "--hide-scrollbars",
        full_url
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2.5)

    try:
        targets_raw = urllib.request.urlopen(f"http://127.0.0.1:{dbg_port}/json").read()
        targets = json.loads(targets_raw)
        ws_url = targets[0]["webSocketDebuggerUrl"]

        async def do_steps():
            async with websockets.connect(ws_url) as ws:
                await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
                await ws.recv()

                # Wait for React to load data and render
                await asyncio.sleep(2.5)

                # Scroll to card
                scroll_eval = {
                    "id": 2,
                    "method": "Runtime.evaluate",
                    "params": {"expression": "document.querySelector('h2')?.scrollIntoView({ behavior: 'instant', block: 'start' });"}
                }
                await ws.send(json.dumps(scroll_eval))
                await ws.recv()

                await asyncio.sleep(1.0)

                # Capture screenshot
                shot_cmd = {
                    "id": 100,
                    "method": "Page.captureScreenshot",
                    "params": {"format": "png"}
                }
                await ws.send(json.dumps(shot_cmd))
                while True:
                    raw = await ws.recv()
                    msg = json.loads(raw)
                    if msg.get("id") == 100:
                        data = msg["result"]["data"]
                        img_bytes = base64.b64decode(data)
                        with open(out_path, "wb") as f:
                            f.write(img_bytes)
                        print(f"Captured: {output_name} ({len(img_bytes)} bytes)")
                        break

        asyncio.run(do_steps())
    finally:
        proc.kill()
        proc.wait()
        time.sleep(1)

print("1. Capturing Desktop Previsão dos Próximos Dias (Mar no texto)...")
capture(1280, 850, "v248_proximos_dias_mar_no_texto_desktop.png", "index.html?tab=previsao&sub=proximos-dias&theme=dark")

print("2. Capturing Mobile Previsão dos Próximos Dias (Mar no texto)...")
capture(390, 844, "v248_proximos_dias_mar_no_texto_mobile.png", "index.html?tab=previsao&sub=proximos-dias&theme=dark")

print("Verification complete!")
