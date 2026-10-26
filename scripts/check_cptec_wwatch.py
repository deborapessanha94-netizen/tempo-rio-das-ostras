# -*- coding: utf-8 -*-
"""
Explore CPTEC WaveWatch III numerical wave forecasting model
"""
import urllib.request
import re
from datetime import datetime, timedelta

base_url = "https://previsaonumerica.cptec.inpe.br/wwatch/alt_onda/glo/"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://previsaonumerica.cptec.inpe.br/'
}

# 1. Try fetching the URL provided by user or current dates
dates_to_test = [
    "https://previsaonumerica.cptec.inpe.br/wwatch/alt_onda/glo/2026-10-25-00z/",
    "https://previsaonumerica.cptec.inpe.br/wwatch/alt_onda/glo/2026-10-26-00z/",
    "https://previsaonumerica.cptec.inpe.br/wwatch/alt_onda/glo/",
    "https://previsaonumerica.cptec.inpe.br/wwatch/"
]

for u in dates_to_test:
    print(f"\n--- Testing URL: {u} ---")
    try:
        req = urllib.request.Request(u, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode('utf-8', errors='ignore')
            print(f"Status 200, length: {len(content)} bytes")
            # find images, links, or json/api endpoints
            links = re.findall(r'href=["\']([^"\']+)["\']', content)
            imgs = re.findall(r'src=["\']([^"\']+)["\']', content)
            print(f"Found {len(links)} links, {len(imgs)} img tags")
            for l in links[:15]:
                print("  link:", l)
            for im in imgs[:15]:
                print("  img:", im)
    except Exception as e:
        print(f"Error for {u}: {e}")
