# -*- coding: utf-8 -*-
import re

with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

light_bgs = [
    '#f0fdf4', '#fffbeb', '#fff7ed', '#fef2f2', '#fef3c7', '#dcfce7', '#e0f2fe', '#ffe4e6',
    '#ecfdf5', '#ffedd5', '#ffebe4', '#f5efe8', '#f8fafc', '#f1f5f9', '#e2e8f0', '#eaf0f6',
    '#dee4e8', '#f4f6f8', '#bae6fd', '#ccfbf1', '#fed7cc', '#fee2e2',
    'emerald-50', 'emerald-100', 'amber-50', 'amber-100', 'orange-50', 'orange-100',
    'rose-50', 'rose-100', 'purple-50', 'purple-100', 'blue-50', 'blue-100', 'sky-50', 'sky-100',
    'slate-50', 'slate-100', 'zinc-50', 'zinc-100', 'gray-50', 'gray-100'
]

results = []
for i, line in enumerate(lines, 1):
    for bg in light_bgs:
        if bg in line:
            # extract tag or snippet
            m = re.search(r'<([a-zA-Z0-9]+)[^>]*class="[^"]*' + re.escape(bg) + r'[^"]*"[^>]*>', line)
            tag = m.group(1) if m else '?'
            results.append((i, tag, bg, line.strip()[:100]))
            break

print(f"Total matching lines: {len(results)}")
for r in results[:40]:
    print(f"Line {r[0]} <{r[1]}> [{r[2]}]: {r[3][:70]}")
