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
dbg_port = 9256

def capture(width, height, output_name, js_action):
    out_path = os.path.join(art_dir, output_name)
    user_data = rf"C:\Users\debor\.gemini\antigravity\scratch\chrome_user_v247_test_{dbg_port}"
    cmd = [
        chrome_path,
        "--headless=new",
        f"--remote-debugging-port={dbg_port}",
        f"--window-size={width},{height}",
        f"--user-data-dir={user_data}",
        "--hide-scrollbars",
        "http://localhost:8092/index.html?theme=dark"
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

                # Wait for React to load
                await asyncio.sleep(2.5)

                # Execute action
                req_id = 10
                eval_cmd = {
                    "id": req_id,
                    "method": "Runtime.evaluate",
                    "params": {"expression": js_action, "returnByValue": True}
                }
                await ws.send(json.dumps(eval_cmd))
                while True:
                    raw = await ws.recv()
                    msg = json.loads(raw)
                    if msg.get("id") == req_id:
                        print("JS Action Result:", msg.get("result", {}).get("result", {}).get("value"))
                        break

                await asyncio.sleep(1.5)

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

js_mobile_sunday = """
(() => {
  // 1. Switch to Previsão tab if not active
  const prevBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Previsão & Tempo'));
  if (prevBtn) prevBtn.click();

  // 2. Click Gráficos de Tendência sub-section
  const grafBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Gráficos de Tendência'));
  if (grafBtn) grafBtn.click();

  // 3. Click exactly 'Chuva' metric button
  const rainBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Chuva');
  if (rainBtn) rainBtn.click();

  // 4. Select Sunday 15/11 in select
  const sel = document.querySelector('select[aria-label=\"Filtrar dia específico no gráfico\"]');
  let selectedDay = 'none';
  if (sel) {
    const opt = Array.from(sel.options).find(o => o.text.includes('15/11'));
    if (opt) {
      sel.value = opt.value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      selectedDay = opt.text;
    }
  }

  // 5. Scroll to chart
  const heading = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Gráficos de Tendência'));
  if (heading) {
    heading.scrollIntoView({ behavior: 'instant', block: 'start' });
  }

  return {
    switchedGraf: !!grafBtn,
    clickedRain: !!rainBtn,
    selectedDay: selectedDay
  };
})()
"""

js_mobile_24h = """
(() => {
  // 1. Click Gráficos de Tendência sub-section
  const grafBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Gráficos de Tendência'));
  if (grafBtn) grafBtn.click();

  // 2. Click exactly 'Chuva' metric button
  const rainBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Chuva');
  if (rainBtn) rainBtn.click();

  // 3. Reset to 'all' days and click 24h
  const sel = document.querySelector('select[aria-label=\"Filtrar dia específico no gráfico\"]');
  if (sel) {
    sel.value = 'all';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const btn24h = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === '24h');
  if (btn24h) btn24h.click();

  // 4. Scroll to chart
  const heading = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Gráficos de Tendência'));
  if (heading) {
    heading.scrollIntoView({ behavior: 'instant', block: 'start' });
  }

  return 'configured 24h rain view';
})()
"""

print("Capturing v247_mobile_rain_sunday_15nov.png...")
capture(390, 844, "v247_mobile_rain_sunday_15nov.png", js_mobile_sunday)

print("Capturing v247_mobile_rain_24h.png...")
capture(390, 844, "v247_mobile_rain_24h.png", js_mobile_24h)

print("Capturing v247_desktop_rain_sunday_15nov.png...")
capture(1280, 800, "v247_desktop_rain_sunday_15nov.png", js_mobile_sunday)

print("Done!")
