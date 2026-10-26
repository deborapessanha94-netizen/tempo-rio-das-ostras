# -*- coding: utf-8 -*-
with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(235, 285):
    print(f"{i+1}: {lines[i].strip()}".encode('ascii', 'replace').decode('ascii'))
