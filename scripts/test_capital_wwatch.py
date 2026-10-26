# -*- coding: utf-8 -*-
import urllib.request

urls = [
    "https://s1.cptec.inpe.br/grafico/Modelos/Wwatch/pn/alt_onda/2026/10/26/00/Wwatch_alt_onda_bra_2026102600z_000z.png",
    "https://s1.cptec.inpe.br/grafico/Modelos/Wwatch/pn/alt_onda/2026/10/26/00/Wwatch_alt_onda_sud_2026102600z_000z.png",
    "https://s1.cptec.inpe.br/grafico/Modelos/Wwatch/pn/alt_onda/2026/10/26/00/Wwatch_alt_onda_glo_2026102600z_000z.png",
    "https://s1.cptec.inpe.br/grafico/Modelos/Wwatch/pn/alt_onda/2026/10/25/00/Wwatch_alt_onda_glo_2026102500z_000z.png",
    "https://s1.cptec.inpe.br/grafico/Modelos/Wwatch/pn/alt_onda/2026/10/25/00/Wwatch_alt_onda_bra_2026102500z_000z.png",
    "https://s1.cptec.inpe.br/grafico/Modelos/Wwatch/pn/alt_onda/2026/10/25/00/Wwatch_alt_onda_sud_2026102500z_000z.png",
]

headers = {'User-Agent': 'Mozilla/5.0'}

for u in urls:
    try:
        req = urllib.request.Request(u, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            print(f"SUCCESS: {len(data)} bytes -> {u}")
    except Exception as e:
        print(f"FAILED: {e} -> {u}")
