# -*- coding: utf-8 -*-
with open('js/app.js', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(4340, min(4370, len(lines))):
    print(f"{i+1}: {lines[i].strip()}")
