# -*- coding: utf-8 -*-
import re

with open('index.html', encoding='utf-8') as f:
    html = f.read()

grads = set(re.findall(r'class="[^"]*(?:from-|to-|bg-gradient)[^"]*"', html))
for g in sorted(grads):
    print(g[:110])
