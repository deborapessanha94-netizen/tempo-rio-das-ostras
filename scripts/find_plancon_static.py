# -*- coding: utf-8 -*-
from pathlib import Path

cache_dir = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data")
matches = []

for f in cache_dir.iterdir():
    if f.is_file():
        try:
            d = f.read_bytes()
            if b"PLANCON_AREAS_VULNERAVEIS" in d:
                matches.append((f.name, len(d)))
        except:
            pass

print(f"Matches for PLANCON_AREAS_VULNERAVEIS: {len(matches)}")
for name, size in matches:
    print(f"  {name} ({size} bytes)")
