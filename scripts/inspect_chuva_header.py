# -*- coding: utf-8 -*-
with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(2074, min(2140, len(lines))):
    print(f"{i+1}: {lines[i].strip()[:110]}")
