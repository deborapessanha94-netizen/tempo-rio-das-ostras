# -*- coding: utf-8 -*-
from pathlib import Path

cache_dir = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data")

for name in ["f_086369", "f_086379"]:
    p = cache_dir / name
    data = p.read_bytes()
    # Search for http: or https: near the end
    end_data = data[-2000:]
    cleaned = "".join(chr(b) if 32 <= b < 127 else " " for b in end_data)
    print(f"=== {name} URL info ===")
    for token in cleaned.split():
        if "http" in token or "aistudio" in token:
            print(" ", token)
