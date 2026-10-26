import urllib.request
import json
from datetime import datetime, timezone

headers = {'User-Agent': 'Mozilla/5.0'}
today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
print('Today UTC:', today)

for rodada in ['00', '12']:
    url = f"https://apiprevmet3.inmet.gov.br/meteograma/3304524/{today}/{rodada}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"URL: {url} -> Keys: {list(data.keys()) if isinstance(data, dict) else type(data)}")
            if isinstance(data, dict) and 'base64' in data:
                b64 = data['base64']
                print(f"  base64 length: {len(b64)}, starts with: {b64[:40]}")
    except Exception as e:
        print(f"FAILED {url}: {e}")
