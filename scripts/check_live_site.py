import urllib.request
import re

url = f"https://deborapessanha94-netizen.github.io/tempo-rio-das-ostras/?_t={urllib.request.time.time()}"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Cache-Control": "no-cache"})

try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode('utf-8')
        has_v196 = 'src="js/app.js?v=196"' in html
        has_sec = 'id="section-panorama-semanal"' in html
        has_nav = 'section-panorama-semanal' in html
        print(f"Live GitHub Pages Check:")
        print(f"  - App v196: {has_v196}")
        print(f"  - Section Panorama Semanal: {has_sec}")
        print(f"  - Nav dropdown item: {has_nav}")
except Exception as e:
    print(f"Error checking live site: {e}")
