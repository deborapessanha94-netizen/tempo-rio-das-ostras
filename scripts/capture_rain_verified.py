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
dbg_port = 9260

def capture(width, height, output_name, url_path):
    out_path = os.path.join(art_dir, output_name)
    user_data = rf"C:\Users\debor\.gemini\antigravity\scratch\chrome_user_v247_ver_{dbg_port}"
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

                # Scroll chart heading into view
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

print("1. Capturing Mobile Sunday 15/11 Rain...")
capture(390, 844, "v247_mobile_rain_sunday_15nov.png", "index.html?tab=previsao&sub=graficos&metric=rain&day=15/11&theme=dark")

print("2. Capturing Mobile 24h Rain...")
capture(390, 844, "v247_mobile_rain_24h.png", "index.html?tab=previsao&sub=graficos&metric=rain&horizon=24&theme=dark")

print("3. Capturing Desktop Sunday 15/11 Rain...")
capture(1280, 800, "v247_desktop_rain_sunday_15nov.png", "index.html?tab=previsao&sub=graficos&metric=rain&day=15/11&theme=dark")

print("4. Capturing Desktop 48h Rain...")
capture(1280, 800, "v247_desktop_rain_48h.png", "index.html?tab=previsao&sub=graficos&metric=rain&horizon=48&theme=dark")

print("Verification shots complete!")
