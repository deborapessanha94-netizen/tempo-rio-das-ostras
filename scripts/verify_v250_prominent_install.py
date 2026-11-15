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
dbg_port = 9283

def capture(width, height, output_name, url_path, js_eval=None):
    out_path = os.path.join(art_dir, output_name)
    user_data = rf"C:\Users\debor\.gemini\antigravity\scratch\chrome_user_v250_{dbg_port}_{int(time.time()*1000)%10000}"
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

if __name__ == "__main__":
    print("Capturing v250 verification screenshots...")
    # 1. Mobile Portrait view (390x844) showing top banner and bottom nav
    capture(390, 844, "v250_mobile_prominent_banner.png", "index.html?tab=previsao&sub=tempo-agora&theme=dark")

    # 2. Mobile Modal Open
    capture(
        390, 844, "v250_mobile_modal_open.png", "index.html?tab=previsao&sub=tempo-agora&theme=dark",
        js_eval="""(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const baixarBtn = btns.find(b => b.textContent && b.textContent.includes('Baixar'));
            if (baixarBtn) baixarBtn.click();
        })()"""
    )

    # 3. Desktop view (1280x800)
    capture(1280, 800, "v250_desktop_header.png", "index.html?tab=previsao&sub=tempo-agora&theme=dark")
    print("Done all captures!")
