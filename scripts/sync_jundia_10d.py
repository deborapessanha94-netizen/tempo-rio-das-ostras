import urllib.request
import ssl
import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://alertadecheias.com.br/stations/2241036/10d"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, context=ctx, timeout=15) as res:
        raw = res.read().decode('utf-8')
        data = json.loads(raw)
        
        target_path = DATA_DIR / "inea_jundia_10d.json"
        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Successfully saved {target_path} ({len(raw)} bytes, {len(data.get('dados', []))} records)")
except Exception as e:
    print(f"Error: {e}")
