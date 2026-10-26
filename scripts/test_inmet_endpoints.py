import urllib.request
import json

headers = {'User-Agent': 'Mozilla/5.0'}
endpoints = [
    'https://meteograma.inmet.gov.br/3304524/estatico',
    'https://apiprevmet3.inmet.gov.br/meteograma/3304524',
    'https://apimeteograma.inmet.gov.br/3304524',
    'https://apimeteograma.inmet.gov.br/meteograma/3304524',
    'https://apimeteograma.inmet.gov.br/meteograma/3304524/dinamico',
    'https://apimeteograma.inmet.gov.br/meteograma/3304524/estatico',
]

for ep in endpoints:
    try:
        req = urllib.request.Request(ep, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            print(f"SUCCESS {ep}: status {resp.status}, length {len(data)}, type: {resp.headers.get('Content-Type')}")
            if 'image' in resp.headers.get('Content-Type', ''):
                print("  IS IMAGE!")
            elif 'json' in resp.headers.get('Content-Type', ''):
                txt = data.decode('utf-8')[:300]
                print("  JSON snippet:", txt)
    except Exception as e:
        print(f"FAILED {ep}: {e}")
