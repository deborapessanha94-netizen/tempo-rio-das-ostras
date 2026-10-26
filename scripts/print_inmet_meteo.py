import urllib.request

headers = {'User-Agent': 'Mozilla/5.0'}
url = 'https://meteograma.inmet.gov.br/3304524/dinamico'
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, timeout=10) as resp:
    print(resp.read().decode('utf-8', errors='ignore'))
