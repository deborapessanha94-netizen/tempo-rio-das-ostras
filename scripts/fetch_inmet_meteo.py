import urllib.request
import re

headers = {'User-Agent': 'Mozilla/5.0'}
urls = [
    'https://meteograma.inmet.gov.br/3304524/dinamico',
    'https://meteograma.inmet.gov.br/3304524'
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode('utf-8', errors='ignore')
            print(f'URL: {url} -> Status: {resp.status}, Length: {len(content)}')
            matches = re.findall(r'<button[^>]*>.*?<\/button>|<a[^>]*>.*?<\/a>|<img[^>]*>', content, re.I | re.DOTALL)
            for m in matches[:30]:
                print('   Element:', re.sub(r'\s+', ' ', m)[:100])
    except Exception as e:
        print(f'Error fetching {url}: {e}')
