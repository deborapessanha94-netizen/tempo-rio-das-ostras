# -*- coding: utf-8 -*-
import os
from pathlib import Path

target = b"HourlyChart"
base = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default")

matches = []
for root, dirs, files in os.walk(base):
    for f in files:
        p = Path(root) / f
        try:
            # only check files < 50MB
            if p.stat().st_size < 50 * 1024 * 1024:
                d = p.read_bytes()
                if target in d:
                    matches.append((p.relative_to(base), len(d)))
        except:
            pass

print(f"Found {len(matches)} files containing '{target.decode()}':")
for rel, size in matches:
    print(f" - {rel} ({size} bytes)")
