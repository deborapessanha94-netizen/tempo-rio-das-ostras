# -*- coding: utf-8 -*-
with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(4790, min(4830, len(lines))):
    print(f"{i+1}: {lines[i].strip()}".encode('ascii', 'replace').decode('ascii'))
