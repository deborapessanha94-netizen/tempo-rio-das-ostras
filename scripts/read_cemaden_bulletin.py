# -*- coding: utf-8 -*-
import urllib.request
import re

urls = [
    "https://www.gov.br/cemaden/pt-br/assuntos/riscos-geo-hidrologicos/26-10-2026-previsao-de-riscos-geo-hidrologicos",
    "https://www.gov.br/cemaden/pt-br/assuntos/riscos-geo-hidrologicos/26-10-2026-previsao-de-riscos-geo-hidrologicos-1",
    "https://www.gov.br/cemaden/pt-br/assuntos/riscos-geo-hidrologicos/27-10-2026-previsao-de-riscos-geo-hidrologicos"
]

headers = {'User-Agent': 'Mozilla/5.0'}

for u in urls:
    print(f"\n====================\nURL: {u}")
    try:
        req = urllib.request.Request(u, headers=headers)
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            
            # Find title and publication date
            title_m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
            if title_m:
                print("Title:", re.sub(r'<[^>]+>', '', title_m.group(1)).strip())
                
            # Find content area
            body_m = re.search(r'<div id="parent-fieldname-text"[^>]*>(.*?)</div>\s*<div', html, re.DOTALL)
            if not body_m:
                body_m = re.search(r'<div id="content-core"[^>]*>(.*?)</div>\s*<div id="viewlet-below-content"', html, re.DOTALL)
                
            if body_m:
                text = re.sub(r'<[^>]+>', ' ', body_m.group(1))
                text = re.sub(r'\s+', ' ', text).strip()
                print(f"Content length: {len(text)} chars")
                print("Preview:\n", text[:1500])
                
                # Look for RJ or Rio de Janeiro or Sudeste
                for m in re.finditer(r'.{0,100}(?:Rio de Janeiro|RJ|Sudeste|Lagos|Norte Fluminense|Litoral).{0,150}', text, re.IGNORECASE):
                    print("\n  [RJ Match]:", m.group(0))
            else:
                print("Could not isolate body content.")
                
            # Look for images (maps)
            img_srcs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html)
            print(f"Images in page ({len(img_srcs)}):")
            for img in img_srcs:
                if any(k in img.lower() for k in ['mapa', 'risco', 'hidro', 'geo', 'alerta', 'cemaden', 'view', 'image']):
                    print("  IMG:", img)
    except Exception as e:
        print("Error:", e)
