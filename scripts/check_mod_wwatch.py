# -*- coding: utf-8 -*-
import urllib.request
import json

url = "https://s1.cptec.inpe.br/grafico/Modelos/portal_previsao_numerica/mod_wwatch.json"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(json.dumps(data, indent=2, ensure_ascii=False)[:2500])
except Exception as e:
    print(f"Error: {e}")
