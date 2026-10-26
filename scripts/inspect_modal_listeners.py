# -*- coding: utf-8 -*-
with open('js/app.js', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(315, 355):
    print(f"{i+1}: {lines[i].strip()}".encode('ascii', 'replace').decode('ascii'))
