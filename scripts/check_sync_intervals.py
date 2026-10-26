# -*- coding: utf-8 -*-
with open('js/app.js', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'renderChuvaStations' in line or 'setInterval' in line:
        print(f"Line {i+1}: {line.strip()[:100]}")
