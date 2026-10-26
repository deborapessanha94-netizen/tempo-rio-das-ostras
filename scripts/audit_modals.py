# -*- coding: utf-8 -*-
with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'id="modal-praias-detalhes"' in line or 'id="modal-social-chuva"' in line or 'id="modal-meteogramas"' in line:
        print(f"Line {i+1}: {line.strip()[:100]}")
        # print 20 lines
        for j in range(i, min(i+35, len(lines))):
            print(f"  {j+1}: {lines[j].strip()[:90]}")
