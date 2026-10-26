import urllib.request

url = 'https://meteograma.inmet.gov.br/static/js/main.c7d0a372.chunk.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

pos = js.find('createObjectURL')
if pos != -1:
    print(js[pos-600:pos])
