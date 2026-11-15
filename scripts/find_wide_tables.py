# -*- coding: utf-8 -*-
with open("src/App.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

import re
for i, l in enumerate(lines):
    if re.search(r"min-w-\[(?:6|7|8)\d\dpx\]", l):
        print(f"Line {i+1}: {l.strip()}")
