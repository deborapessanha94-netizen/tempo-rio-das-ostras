import urllib.request
import json
import base64
from datetime import datetime, timezone

headers = {'User-Agent': 'Mozilla/5.0'}
today = datetime.now(timezone.utc).strftime('%Y-%m-%d')

for rodada in ['12', '00']:
    url = f"https://apiprevmet3.inmet.gov.br/meteograma/3304524/{today}/{rodada}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if isinstance(data, dict) and 'base64' in data:
                b64 = data['base64']
                if b64.startswith('data:image/png;base64,'):
                    raw_b64 = b64.split(',', 1)[1]
                    img_bytes = base64.b64decode(raw_b64)
                    filename = f"img/inmet_live_{rodada}utc.png"
                    with open(filename, 'wb') as img_f:
                        img_f.write(img_bytes)
                    print(f"Saved {filename}: {len(img_bytes)} bytes")
    except Exception as e:
        print(f"Failed {url}: {e}")
