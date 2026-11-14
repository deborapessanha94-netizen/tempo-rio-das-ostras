import subprocess, json, time, urllib.request, base64, os, shutil

user_data = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\.chrome-v223-profile'
if os.path.exists(user_data):
    shutil.rmtree(user_data, ignore_errors=True)

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
cmd = [
    chrome_path,
    '--headless=new',
    '--remote-debugging-port=9222',
    f'--user-data-dir={user_data}',
    '--disable-gpu',
    '--no-sandbox',
    'http://127.0.0.1:8092/index.html'
]
proc = subprocess.Popen(cmd)
time.sleep(3)

try:
    req = urllib.request.urlopen('http://127.0.0.1:9222/json')
    tabs = json.loads(req.read())
    ws_url = tabs[0]['webSocketDebuggerUrl']

    import websocket
    ws = websocket.create_connection(ws_url)

    def send(method, params=None):
        msg = {'id': 1, 'method': method, 'params': params or {}}
        ws.send(json.dumps(msg))
        while True:
            res = json.loads(ws.recv())
            if res.get('id') == 1:
                return res.get('result', {})

    send('Network.enable')
    send('Network.setCacheDisabled', {'cacheDisabled': True})
    send('Emulation.setDeviceMetricsOverride', {
        'width': 1440,
        'height': 1200,
        'deviceScaleFactor': 1,
        'mobile': False
    })
    send('Page.reload', {'ignoreCache': True})
    time.sleep(4)

    out_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'

    # Ensure Light Mode and click "Previsão dos Próximos Dias"
    res1 = send('Runtime.evaluate', {
        'expression': """
            (() => {
                const isDarkActive = document.documentElement.classList.contains('dark');
                const themeBtn = document.querySelector('button[aria-label="Alternar tema"]');
                if (isDarkActive && themeBtn) themeBtn.click();
                
                // Find subbutton
                const allButtons = Array.from(document.querySelectorAll('button'));
                const target = allButtons.find(b => b.textContent.trim().startsWith('Previsão dos Próximos Dias'));
                if (target) { target.click(); return 'clicked proximos dias'; }
                return 'not found';
            })()
        """
    })
    print("Action 1:", res1.get('result', {}).get('value'))
    time.sleep(1.5)

    scr1 = send('Page.captureScreenshot', {'format': 'png'})
    with open(os.path.join(out_dir, 'v223_desktop_light_proximos_dias.png'), 'wb') as f:
        f.write(base64.b64decode(scr1['data']))

    # Click "Panorama Sinótico Geral"
    res2 = send('Runtime.evaluate', {
        'expression': """
            (() => {
                const allButtons = Array.from(document.querySelectorAll('button'));
                const target = allButtons.find(b => b.textContent.trim().startsWith('Panorama Sinótico Geral'));
                if (target) { target.click(); return 'clicked sinotico'; }
                return 'not found';
            })()
        """
    })
    print("Action 2:", res2.get('result', {}).get('value'))
    time.sleep(1.5)

    scr2 = send('Page.captureScreenshot', {'format': 'png'})
    with open(os.path.join(out_dir, 'v223_desktop_light_sinotico.png'), 'wb') as f:
        f.write(base64.b64decode(scr2['data']))

    # Click "Ver Todas as Seções" to show both together
    res3 = send('Runtime.evaluate', {
        'expression': """
            (() => {
                const allButtons = Array.from(document.querySelectorAll('button'));
                const target = allButtons.find(b => b.textContent.trim().startsWith('Ver Todas as Seções'));
                if (target) { target.click(); return 'clicked all'; }
                return 'not found';
            })()
        """
    })
    print("Action 3:", res3.get('result', {}).get('value'))
    time.sleep(1.5)

    # Scroll down to Previsão dos Próximos Dias & Panorama Sinótico
    send('Runtime.evaluate', {
        'expression': """
            window.scrollTo(0, 1600);
        """
    })
    time.sleep(1)

    scr3 = send('Page.captureScreenshot', {'format': 'png'})
    with open(os.path.join(out_dir, 'v223_desktop_light_both.png'), 'wb') as f:
        f.write(base64.b64decode(scr3['data']))

    # Now toggle to Dark Mode
    send('Runtime.evaluate', {
        'expression': """
            const themeBtn = document.querySelector('button[aria-label="Alternar tema"]');
            if (themeBtn) themeBtn.click();
        """
    })
    time.sleep(1.5)

    scr4 = send('Page.captureScreenshot', {'format': 'png'})
    with open(os.path.join(out_dir, 'v223_desktop_dark_both.png'), 'wb') as f:
        f.write(base64.b64decode(scr4['data']))

    ws.close()
    print("All captures completed successfully!")
finally:
    proc.terminate()
