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
dbg_port = 9280

def capture(width, height, output_name, url_path, js_eval=None):
    out_path = os.path.join(art_dir, output_name)
    user_data = rf"C:\Users\debor\.gemini\antigravity\scratch\chrome_user_v249_{dbg_port}"
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

                if js_eval:
                    eval_cmd = {
                        "id": 10,
                        "method": "Runtime.evaluate",
                        "params": {"expression": js_eval, "returnByValue": True}
                    }
                    await ws.send(json.dumps(eval_cmd))
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

# 1. Mobile Native Navigation View (Bottom Nav + Subsections Pills)
print("1. Capturing Mobile Native Navigation View...")
capture(390, 844, "v249_mobile_native_navigation.png", "index.html?tab=previsao&sub=tempo-agora&theme=dark")

# 2. Open PWA Modal on Mobile (Android view)
print("2. Capturing PWA Modal (Android view)...")
js_open_modal_android = """
(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Instalar App'));
  if (btn) btn.click();
})()
"""
capture(390, 844, "v249_pwa_modal_android.png", "index.html?tab=previsao&theme=dark", js_open_modal_android)

# 3. Open PWA Modal on Mobile (iOS Safari view)
print("3. Capturing PWA Modal (iOS view)...")
js_open_modal_ios = """
(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Instalar App'));
  if (btn) btn.click();
  setTimeout(() => {
    const iosBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('iPhone'));
    if (iosBtn) iosBtn.click();
  }, 300);
})()
"""
capture(390, 844, "v249_pwa_modal_ios.png", "index.html?tab=previsao&theme=dark", js_open_modal_ios)

# 4. Desktop Header with Instalar App Button
print("4. Capturing Desktop Header with Instalar App Button...")
capture(1280, 800, "v249_desktop_header_install_btn.png", "index.html?tab=previsao&theme=dark")

print("All verification shots complete!")
