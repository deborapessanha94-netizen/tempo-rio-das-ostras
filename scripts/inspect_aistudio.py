# -*- coding: utf-8 -*-
import urllib.request, json, time, websocket

tabs = json.loads(urllib.request.urlopen('http://127.0.0.1:9222/json').read().decode())
print("Targets count:", len(tabs))
for t in tabs:
    print("- ID:", t.get("id"), "Title:", t.get("title"), "URL:", t.get("url"))

# Find the aistudio or google target
target = next((x for x in tabs if "aistudio" in x.get("url", "") or "google" in x.get("url", "")), None)
if target:
    ws = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=10)
    def cdp(method, params=None, req_id=1):
        ws.send(json.dumps({"id": req_id, "method": method, "params": params or {}}))
        while True:
            r = json.loads(ws.recv())
            if r.get("id") == req_id:
                return r.get("result", {})
    
    cdp("Runtime.enable", req_id=1)
    res = cdp("Runtime.evaluate", {"expression": "document.title + ' ||| ' + window.location.href + ' ||| ' + document.body.innerText.substring(0, 500)"}, req_id=2)
    print("\nPage Content:")
    print(res.get("result", {}).get("value"))
    ws.close()
else:
    print("No target matched!")
