# -*- coding: utf-8 -*-
from pathlib import Path

cache_dir = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data")
data = (cache_dir / "f_0862b4").read_text(encoding="utf-8", errors="ignore")

print("File f_0862b4 length:", len(data))
print("Start:")
for l in data.splitlines()[:50]:
    print(" ", l[:100])
