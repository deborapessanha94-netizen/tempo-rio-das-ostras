# -*- coding: utf-8 -*-
from pathlib import Path

cache_dir = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data")

matches = []
for f in cache_dir.iterdir():
    if f.is_file():
        try:
            d = f.read_bytes()
            if b"HourlyChart" in d:
                matches.append((f.name, len(d)))
        except:
            pass

matches.sort(key=lambda x: x[1])
print(f"Total files with 'HourlyChart': {len(matches)}")
for name, size in matches:
    txt = (cache_dir / name).read_bytes().decode('utf-8', errors='ignore')
    first_line = txt.splitlines()[0] if txt.splitlines() else ""
    print(f"  {name} ({size} bytes): {first_line[:80]}")
