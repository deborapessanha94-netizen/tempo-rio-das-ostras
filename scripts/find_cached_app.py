# -*- coding: utf-8 -*-
import os
from pathlib import Path

target_uuid = b"dec9e986-7a21-466e-a222-004bb7111290"
base = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default")

matches = []
for root, dirs, files in os.walk(base):
    for f in files:
        if f.lower().endswith(('.ldb', '.log', '.dat', '.json', '.txt', 'data_0', 'data_1', 'data_2', 'data_3', 'index')):
            p = Path(root) / f
            try:
                content = p.read_bytes()
                if target_uuid in content:
                    matches.append((p, p.stat().st_size, content.count(target_uuid)))
            except:
                pass

print(f"Found {len(matches)} files containing {target_uuid.decode()}:")
for p, size, count in matches:
    print(f" - {p.relative_to(base)} ({size} bytes, {count} occurrences)")
