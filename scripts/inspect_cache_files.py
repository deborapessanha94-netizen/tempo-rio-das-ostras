# -*- coding: utf-8 -*-
from pathlib import Path

cache_dir = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data")

for name in ["f_086379", "f_086377", "f_086374"]:
    p = cache_dir / name
    if p.exists():
        data = p.read_bytes()
        # Find if it's HTML, JS, or JSON
        print(f"=== {name} ({len(data)} bytes) ===")
        # Check start
        text = data.decode('utf-8', errors='ignore')
        print("Start:", repr(text[:300]))
        # Search for interesting keywords
        for kw in ["<!DOCTYPE", "<html", "function", "const ", "class ", "Rio das Ostras", "template", "component"]:
            if kw in text:
                print(f"  Contains {kw}: count={text.count(kw)}")
