# -*- coding: utf-8 -*-
with open("src/App.tsx", "r", encoding="utf-8") as f:
    text = f.read()

import re
matches = re.findall(r"safe-area[^\s\"\'\)]*", text)
print("safe-area in App.tsx:", matches)

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()
print("safe-area in index.html:", re.findall(r"safe-area[^\s\"\'\)]*", html))

with open("src/index.css", "r", encoding="utf-8") as f:
    css = f.read()
print("safe-area in index.css:", re.findall(r"safe-area[^\s\"\'\)]*", css))
