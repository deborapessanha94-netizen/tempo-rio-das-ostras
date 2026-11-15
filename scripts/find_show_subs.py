# -*- coding: utf-8 -*-
with open("src/App.tsx", "r", encoding="utf-8") as f:
    text = f.read()

import re
matches = re.findall(r"showSub\(['\"]([^'\"]+)['\"]\)", text)
print("Unique showSub targets:", set(matches))
