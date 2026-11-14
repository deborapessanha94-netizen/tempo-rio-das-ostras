import subprocess, time, json, urllib.request, websocket

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9226",
    "--disable-gpu",
    "--no-sandbox",
    "--user-data-dir=C:\\Users\\debor\\.gemini\\antigravity\\scratch\\chrome_test_profile4"
])

time.sleep(2)
msg_id = 0

try:
    tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9226/json").read().decode())
    target = tabs[0]
    ws = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=15)

    def cdp(method, params=None):
        global msg_id
        msg_id += 1
        current_id = msg_id
        ws.send(json.dumps({"id": current_id, "method": method, "params": params or {}}))
        while True:
            resp = json.loads(ws.recv())
            if resp.get("id") == current_id:
                return resp.get("result", {})

    cdp("Page.enable")
    cdp("Runtime.enable")
    cdp("Page.navigate", {"url": "http://127.0.0.1:8092/index.html"})
    time.sleep(3)

    res = cdp("Runtime.evaluate", {"expression": """
        const img = document.querySelector('header img');
        JSON.stringify({
            src: img?.src,
            currentSrc: img?.currentSrc,
            isDark: document.documentElement.classList.contains('dark'),
            naturalWidth: img?.naturalWidth,
            naturalHeight: img?.naturalHeight
        })
    """})
    print("Default state:", res.get("result", {}).get("value"))

    # Click theme button
    cdp("Runtime.evaluate", {"expression": """
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tema Claro') || b.textContent.includes('Tema Escuro'));
        btn?.click();
    """})
    time.sleep(1)

    res2 = cdp("Runtime.evaluate", {"expression": """
        const img = document.querySelector('header img');
        JSON.stringify({
            src: img?.src,
            currentSrc: img?.currentSrc,
            isDark: document.documentElement.classList.contains('dark'),
            naturalWidth: img?.naturalWidth,
            naturalHeight: img?.naturalHeight
        })
    """})
    print("After click:", res2.get("result", {}).get("value"))

    ws.close()
finally:
    proc.terminate()
