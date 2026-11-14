# -*- coding: utf-8 -*-
import os
from pathlib import Path

sw_dir = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default\Service Worker\CacheStorage")

targets = {
    "planconStatic": b"PLANCON_LIMIARES",
    "HourlyChart": b"HourlyChart",
    "RiverChart": b"RiverChart",
    "CssExportModal": b"CssExportModal",
}

found = {}

for root, dirs, files in os.walk(sw_dir):
    for f in files:
        p = Path(root) / f
        try:
            data = p.read_bytes()
            for k, pattern in targets.items():
                if pattern in data:
                    if k not in found: found[k] = []
                    found[k].append((p, len(data)))
        except:
            pass

for k, matches in found.items():
    print(f"=== {k} ({len(matches)} matches) ===")
    matches.sort(key=lambda x: x[1])
    for p, size in matches[:5]:
        print(f"  {p.name} ({size} bytes)")
