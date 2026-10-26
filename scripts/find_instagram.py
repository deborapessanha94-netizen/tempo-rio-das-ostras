# -*- coding: utf-8 -*-
with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'Baixar Imagem Instagram' in line:
        for j in range(max(0, i-5), min(i+15, len(lines))):
            print(f"{j+1}: {lines[j].strip()}")
        break
