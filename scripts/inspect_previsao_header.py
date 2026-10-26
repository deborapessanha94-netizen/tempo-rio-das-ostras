# -*- coding: utf-8 -*-
with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(830, 870):
    print(f"{i+1}: {lines[i].strip()}")
