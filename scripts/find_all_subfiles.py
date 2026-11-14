# -*- coding: utf-8 -*-
from pathlib import Path

cache_dir = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data")

targets = {
    "planconStatic": b"PLANCON_AREAS_VULNERAVEIS",
    "HourlyChart": b"export const HourlyChart",
    "RiverChart": b"export const RiverChart",
    "CssExportModal": b"export const CssExportModal",
    "indexHtml": b"<!DOCTYPE html>",
    "mainTsx": b"ReactDOM.createRoot",
    "tailwind": b"tailwind",
    "viteConfig": b"vite.config"
}

found = {}
for f in cache_dir.iterdir():
    if f.is_file():
        try:
            data = f.read_bytes()
            for key, pattern in targets.items():
                if pattern in data:
                    if key not in found: found[key] = []
                    found[key].append((f.name, len(data)))
        except:
            pass

for k, list_files in found.items():
    print(f"=== {k} ===")
    for name, size in list_files[-5:]: # show latest 5
        print(f"  {name} ({size} bytes)")
