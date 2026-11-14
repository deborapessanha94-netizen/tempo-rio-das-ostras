# -*- coding: utf-8 -*-
from pathlib import Path

cache_dir = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data")

searches = {
    "siteData": b"loadAllLiveSiteData",
    "planconStatic": b"PLANCON_LIMIARES",
    "HourlyChart": b"HourlyChart",
    "RiverChart": b"RiverChart",
    "CssExportModal": b"CssExportModal"
}

results = {k: [] for k in searches}

for f in cache_dir.iterdir():
    if f.is_file():
        try:
            data = f.read_bytes()
            for k, pattern in searches.items():
                if pattern in data:
                    results[k].append((f.name, len(data)))
        except:
            pass

for k, matches in results.items():
    print(f"=== {k} (found in {len(matches)} files) ===")
    # Sort by file size, find unique sizes
    matches.sort(key=lambda x: x[1])
    for name, size in matches[:8]:
        # print first line
        txt = (cache_dir / name).read_bytes().decode('utf-8', errors='ignore')
        first_line = txt.splitlines()[0] if txt.splitlines() else ""
        print(f"  {name} ({size} bytes): {first_line[:70]}")
