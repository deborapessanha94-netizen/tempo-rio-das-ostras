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
dbg_port = 9252

def run_browser(width, height, output_name, actions):
    out_path = os.path.join(art_dir, output_name)
    user_data = rf"C:\Users\debor\.gemini\antigravity\scratch\chrome_user_v247_{dbg_port}"
    cmd = [
        chrome_path,
        "--headless=new",
        f"--remote-debugging-port={dbg_port}",
        f"--window-size={width},{height}",
        f"--user-data-dir={user_data}",
        "--hide-scrollbars",
        "http://localhost:8092/index.html?tab=previsao&sub=graficos&theme=dark"
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2.5)

    try:
        targets_raw = urllib.request.urlopen(f"http://127.0.0.1:{dbg_port}/json").read()
        targets = json.loads(targets_raw)
        ws_url = targets[0]["webSocketDebuggerUrl"]

        async def do_steps():
            async with websockets.connect(ws_url) as ws:
                # Enable Runtime
                await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
                await ws.recv()

                # Wait for React app to mount and fetch data
                await asyncio.sleep(2.0)

                # Execute actions
                for idx, action_js in enumerate(actions):
                    req_id = 10 + idx
                    eval_cmd = {
                        "id": req_id,
                        "method": "Runtime.evaluate",
                        "params": {"expression": action_js, "returnByValue": True}
                    }
                    await ws.send(json.dumps(eval_cmd))
                    # Read until we get our response id
                    while True:
                        raw = await ws.recv()
                        msg = json.loads(raw)
                        if msg.get("id") == req_id:
                            print(f"Action {idx+1} result:", msg.get("result", {}).get("value"))
                            break
                    await asyncio.sleep(0.8)

                await asyncio.sleep(1.0)

                # Capture Screenshot
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

# Action 1: Click Chuva button
click_chuva = """
(() => {
  const rainBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Chuva'));
  if (rainBtn) {
    rainBtn.click();
    return 'clicked Chuva';
  }
  return 'button not found';
})()
"""

# Action 2: Select 15/11 in dropdown
select_sunday = """
(() => {
  const sel = document.querySelector('select[aria-label=\"Filtrar dia específico no gráfico\"]');
  if (sel) {
    const opt = Array.from(sel.options).find(o => o.value.includes('15/11') || o.text.includes('15/11'));
    if (opt) {
      sel.value = opt.value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return 'selected 15/11: ' + opt.value;
    }
  }
  return 'select or option not found';
})()
"""

# Action 3: Click 48h horizon button
click_48h = """
(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === '48h');
  if (btn) {
    btn.click();
    return 'clicked 48h';
  }
  return '48h not found';
})()
"""

# Action 4: Scroll down slightly so chart is fully centered in view
scroll_to_chart = """
(() => {
  window.scrollTo({ top: 140, behavior: 'instant' });
  return 'scrolled';
})()
"""

print("1. Capturing Mobile Sunday 15/11 Rain...")
run_browser(390, 844, "v247_mobile_rain_sunday_15nov.png", [click_chuva, select_sunday, scroll_to_chart])

print("2. Capturing Mobile 24h Rain...")
run_browser(390, 844, "v247_mobile_rain_24h.png", [click_chuva, scroll_to_chart])

print("3. Capturing Desktop Sunday 15/11 Rain...")
run_browser(1280, 850, "v247_desktop_rain_sunday_15nov.png", [click_chuva, select_sunday, scroll_to_chart])

print("4. Capturing Desktop 48h Rain...")
run_browser(1280, 850, "v247_desktop_rain_48h.png", [click_chuva, click_48h, scroll_to_chart])

print("All screenshots completed successfully!")
