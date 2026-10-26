import urllib.request
import re

headers = {'User-Agent': 'Mozilla/5.0'}
url = 'https://meteograma.inmet.gov.br/static/js/main.c7d0a372.chunk.js'
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, timeout=10) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

print('JS length:', len(js))
# search for endpoints or keywords
for kw in ['download', 'baixar', 'png', 'jpg', 'meteograma', 'cosmo', 'gefs', 'api']:
    matches = [m.start() for m in re.finditer(kw, js, re.I)]
    print(f'Keyword "{kw}": {len(matches)} occurrences')
    for pos in matches[:5]:
        snippet = js[max(0, pos-40):min(len(js), pos+80)]
        print('   ', repr(snippet))
