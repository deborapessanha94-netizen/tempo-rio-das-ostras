# -*- coding: utf-8 -*-
import urllib.request
import re
import json

url = "https://www.gov.br/cemaden/pt-br/assuntos/riscos-geo-hidrologicos"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        print(f"Loaded HTML: {len(html)} bytes")
        
        # Find title
        m_title = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
        if m_title:
            print("Title:", m_title.group(1).strip())
            
        # Find links inside page
        links = re.findall(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html, re.IGNORECASE | re.DOTALL)
        print(f"Total links found: {len(links)}")
        
        geo_links = []
        for href, text in links:
            clean_text = re.sub(r'<[^>]+>', '', text).strip()
            if any(k in href.lower() or k in clean_text.lower() for k in ['boletim', 'risco', 'alerta', 'hidrolog', 'geolog', 'rio-de-janeiro', 'rj', '2026', 'outubro', 'dia']):
                geo_links.append((clean_text, href))
                
        print(f"Relevant links: {len(geo_links)}")
        for t, h in geo_links[:30]:
            print(f"  {t[:70]} -> {h}")
            
        # Look for text snippets mentioning Rio de Janeiro or Sudeste
        rj_snippets = re.findall(r'.{0,100}(?:Rio de Janeiro|Região dos Lagos|Norte Fluminense|Baixadas Litorâneas|Rio das Ostras|Macaé).{0,100}', html, re.IGNORECASE)
        print(f"\nRJ snippets found ({len(rj_snippets)}):")
        for s in rj_snippets[:10]:
            print("  -->", s.strip())

except Exception as e:
    print("Error:", e)
