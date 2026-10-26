# -*- coding: utf-8 -*-
import urllib.request, re

url = "https://www.gov.br/cemaden/pt-br/assuntos/riscos-geo-hidrologicos/26-10-2026-previsao-de-riscos-geo-hidrologicos-1"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')

# Extract clean text from article body
body_m = re.search(r'<div id="parent-fieldname-text"[^>]*>(.*?)</div>\s*<div', html, re.DOTALL)
if body_m:
    text = re.sub(r'<br\s*/?>', '\n', body_m.group(1))
    text = re.sub(r'</p>', '\n\n', text)
    text = re.sub(r'<[^>]+>', '', text)
    print(text.strip())
else:
    print("Not found")
