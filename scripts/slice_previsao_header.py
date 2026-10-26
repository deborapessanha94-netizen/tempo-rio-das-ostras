# -*- coding: utf-8 -*-
with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

for idx in range(1680, min(len(lines), 1750)):
    txt = lines[idx].strip()
    if txt:
        print(f"{idx+1}: {txt[:70]}".encode('ascii', 'replace').decode('ascii'))
