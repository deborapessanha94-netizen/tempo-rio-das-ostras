# -*- coding: utf-8 -*-
"""
Inspect the SPA JS on previsaonumerica.cptec.inpe.br to find image paths / APIs for wwatch
"""
import urllib.request
import re

url_js = "https://previsaonumerica.cptec.inpe.br/assets/index-DpTPefgv.js"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Referer': 'https://previsaonumerica.cptec.inpe.br/'
}

try:
    req = urllib.request.Request(url_js, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        content = resp.read().decode('utf-8', errors='ignore')
        print(f"Loaded JS bundle: {len(content)} bytes")
        
        # Look for wwatch, alt_onda, s1.cptec, s2.cptec, s3.cptec, api, png patterns
        matches = re.findall(r'.{0,60}(?:wwatch|alt_onda|dir_onda|per_onda|dataserver|nowcasting).{0,60}', content)
        print(f"Found {len(matches)} matches for wwatch/wave patterns:")
        for m in matches[:20]:
            print(" ->", m.strip())
            
        urls = re.findall(r'https?://[^\s"\'`)]+', content)
        print(f"\nFound {len(urls)} absolute URLs in bundle:")
        for u in set(urls):
            if any(k in u.lower() for k in ['cptec', 'inpe', 'onda', 'wave', 'wwatch', 'api']):
                print("  URL ->", u)
except Exception as e:
    print(f"Error fetching JS: {e}")
