import urllib.request
import re

url = 'https://meteograma.inmet.gov.br/static/js/main.c7d0a372.chunk.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

# find occurrences of apimeteograma or apiprevmet3
for m in re.finditer(r'(?:apimeteograma|apiprevmet3|meteograma)', js):
    pos = m.start()
    print("="*40)
    print(js[max(0, pos-150):min(len(js), pos+350)])
