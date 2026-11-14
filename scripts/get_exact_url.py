# -*- coding: utf-8 -*-
import re
from pathlib import Path

cache_dir = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data")

def extract_url(path):
    data = path.read_bytes()
    # URLs usually start with 1/0/https://... or similar at the end
    matches = re.findall(b"https?://[a-zA-Z0-9_./?%&=#-]+", data)
    return matches[-1].decode('utf-8', errors='ignore') if matches else "No URL"

for name in ["f_086369", "f_086379", "f_086377", "f_086374"]:
    p = cache_dir / name
    if p.exists():
        print(name, "->", extract_url(p))
