# -*- coding: utf-8 -*-
import urllib.request

template = "https://s1.cptec.inpe.br/grafico/Modelos/{model}/pn/{product}/{year}/{month}/{day}/{turn}/{model}_{product}_{region}_{year}{month}{day}{turn}z_{forecastTime}z.png"

# Test combinations
test_cases = [
    # Global alt_onda 000z on 2026-10-26
    {"model": "wwatch", "product": "alt_onda", "year": "2026", "month": "10", "day": "26", "turn": "00", "region": "glo", "forecastTime": "000"},
    # Sudeste alt_onda 000z on 2026-10-26
    {"model": "wwatch", "product": "alt_onda", "year": "2026", "month": "10", "day": "26", "turn": "00", "region": "sud", "forecastTime": "000"},
    # Sudeste alt_onda 024z on 2026-10-26
    {"model": "wwatch", "product": "alt_onda", "year": "2026", "month": "10", "day": "26", "turn": "00", "region": "sud", "forecastTime": "024"},
    # Brasil alt_onda 024z on 2026-10-26
    {"model": "wwatch", "product": "alt_onda", "year": "2026", "month": "10", "day": "26", "turn": "00", "region": "bra", "forecastTime": "024"},
    # Global alt_onda 000z on 2026-10-25
    {"model": "wwatch", "product": "alt_onda", "year": "2026", "month": "10", "day": "25", "turn": "00", "region": "glo", "forecastTime": "000"},
]

headers = {'User-Agent': 'Mozilla/5.0'}

for t in test_cases:
    url = template.format(**t)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            print(f"SUCCESS {t['region']} {t['product']} {t['forecastTime']}h: {len(data)} bytes -> {url}")
    except Exception as e:
        print(f"FAILED {t['region']} {t['product']} {t['forecastTime']}h: {e} -> {url}")
