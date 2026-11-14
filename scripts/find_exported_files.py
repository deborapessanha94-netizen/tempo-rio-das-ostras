# -*- coding: utf-8 -*-
from pathlib import Path

cache_dir = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data")

patterns = {
    "planconStatic.ts": b"export const PLANCON_LIMIARES",
    "HourlyChart.tsx": b"export const HourlyChart",
    "RiverChart.tsx": b"export const RiverChart",
    "CssExportModal.tsx": b"export const CssExportModal",
    "index.html": b"<div id=\"root\"></div>"
}

found = {}
for f in cache_dir.iterdir():
    if f.is_file():
        try:
            data = f.read_bytes()
            for name, pat in patterns.items():
                if pat in data:
                    if name not in found: found[name] = []
                    found[name].append((f.name, len(data)))
        except:
            pass

for name, files in found.items():
    print(f"=== {name} ({len(files)} files found) ===")
    for fname, size in files[-3:]:
        print(f"  {fname} ({size} bytes)")
