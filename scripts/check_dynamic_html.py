# -*- coding: utf-8 -*-
import re

with open('js/app.js', encoding='utf-8') as f:
    js = f.read()

snippets = re.findall(r'class=[\'"][^\'"]*bg-[^\'"]*[\'"]', js)
print(f"Total dynamic bg- snippets: {len(snippets)}")
for s in sorted(set(snippets)):
    print(" ", s)
