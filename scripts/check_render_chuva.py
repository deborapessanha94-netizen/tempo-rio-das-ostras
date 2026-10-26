# -*- coding: utf-8 -*-
with open('js/app.js', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'renderChuvaKPIsAndStations' in line or 'atualizacaoTxtEl' in line:
        for j in range(max(0, i-5), min(i+25, len(lines))):
            print(f"{j+1}: {lines[j].strip()[:100]}")
        break
