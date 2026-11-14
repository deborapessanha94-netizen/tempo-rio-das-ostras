# -*- coding: utf-8 -*-
from pathlib import Path

cache_dir = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data")

keywords = [
    b"loadAllLiveSiteData",
    b"PLANCON_EL_NINO",
    b"HourlyChart",
    b"RiverChart",
    b"CssExportModal",
    b"degToCompass",
    b"REDEC_1_MUNICIPIOS"
]

found_files = {}

for f in cache_dir.iterdir():
    if f.is_file():
        try:
            data = f.read_bytes()
            for kw in keywords:
                if kw in data:
                    if f.name not in found_files:
                        found_files[f.name] = (len(data), [])
                    found_files[f.name][1].append(kw.decode())
        except:
            pass

print(f"Found {len(found_files)} files in cache matching keywords:")
for name, (size, kws) in found_files.items():
    print(f" - {name} ({size} bytes): {', '.join(kws)}")
