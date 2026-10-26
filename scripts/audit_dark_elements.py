# -*- coding: utf-8 -*-
import re

with open('index.html', encoding='utf-8') as f:
    html = f.read()

# Find all elements with light backgrounds
light_bg_patterns = [
    r'bg-\[(?:#ffebe4|#f1f5f9|#e2e8f0|#f8fafc|#e3ecf4|#d8e5f0|#f5efe8|#ebe2d7)\]',
    r'bg-(?:white|amber-100|rose-100|purple-100|emerald-100|orange-100|slate-100|gray-100|zinc-100)',
    r'from-(?:white|amber-50|rose-50|purple-50|emerald-50|orange-50)',
]

found = {}
for p in light_bg_patterns:
    matches = re.findall(p, html)
    found[p] = len(matches)

for k, v in found.items():
    print(f"{k}: {v} occurrences")

# Find classes in index.html with bg-
bg_classes = set(re.findall(r'class="[^"]*(bg-[^\s"]+)', html))
print("\nUnique bg- classes:")
for c in sorted(bg_classes):
    print(" ", c)
