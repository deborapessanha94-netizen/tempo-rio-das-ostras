# -*- coding: utf-8 -*-
from pathlib import Path

cache_dir = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data")

# Let's inspect small and large files around this range (f_086300 to f_086385)
files_to_check = [f"f_{i:06x}" for i in range(0x086300, 0x086385)]

print("Scanning range f_086300 to f_086384:")
for name in files_to_check:
    p = cache_dir / name
    if p.exists():
        data = p.read_bytes()
        text = data.decode('utf-8', errors='ignore')
        # check if it looks like typescript or javascript
        if any(kw in text[:200] for kw in ["import ", "export ", "const ", "<!DOCTYPE", "{\n"]):
            first_line = text.splitlines()[0] if text.splitlines() else ""
            # print ascii safe
            safe_first = first_line[:90].encode('ascii', errors='replace').decode()
            print(f" {name} ({len(data)} bytes) -> {safe_first}")
