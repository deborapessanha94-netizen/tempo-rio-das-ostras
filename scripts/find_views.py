# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

lines = open('index.html', encoding='utf-8').readlines()
for i, l in enumerate(lines):
    if 'id="view-tab-' in l or 'section-panorama-sinotico' in l:
        print(f"{i+1}: {l.strip()[:80]}")
