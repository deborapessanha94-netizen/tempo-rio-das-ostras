# -*- coding: utf-8 -*-
import os
from pathlib import Path

cache_dir = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data")
target = b"dec9e986"

matches = []
if cache_dir.exists():
    for f in cache_dir.iterdir():
        if f.is_file():
            try:
                data = f.read_bytes()
                if target in data or b"Tempo em Rio das Ostras" in data:
                    matches.append((f.name, len(data), target in data, b"Tempo em Rio das Ostras" in data))
            except:
                pass

print(f"Found {len(matches)} files in cache:")
for name, size, has_uuid, has_title in matches:
    print(f" - {name} ({size} bytes): uuid={has_uuid}, title={has_title}")
