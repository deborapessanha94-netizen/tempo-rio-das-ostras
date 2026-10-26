# -*- coding: utf-8 -*-
with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'btn-open-meteogramas-card' in line:
        start = max(0, i - 15)
        end = min(len(lines), i + 25)
        for idx in range(start, end):
            print(f"{idx+1}: {repr(lines[idx])}")
        break
