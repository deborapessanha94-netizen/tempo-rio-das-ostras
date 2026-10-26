# -*- coding: utf-8 -*-
with open('index.html', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if 'id="view-tab-' in line:
            print(f"Line {i}: {line.strip()[:100]}")
