# -*- coding: utf-8 -*-
from pathlib import Path

target_uuid = b"dec9e986-7a21-466e-a222-004bb7111290"
base = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default\Sync Data\LevelDB")

for name in ["002810.log", "002811.ldb"]:
    p = base / name
    if p.exists():
        data = p.read_bytes()
        print(f"=== {name} ({len(data)} bytes) ===")
        idx = 0
        while True:
            idx = data.find(target_uuid, idx)
            if idx == -1: break
            snippet = data[max(0, idx - 100):min(len(data), idx + 300)]
            # Clean printable
            cleaned = "".join(chr(b) if 32 <= b < 127 else " " for b in snippet)
            print(f"Offset {idx}: {cleaned}")
            idx += len(target_uuid)
