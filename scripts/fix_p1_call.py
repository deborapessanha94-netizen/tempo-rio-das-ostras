# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'(getIneaJundia10d\(\)\s*\]\);)')
m = pattern.search(content)
if m:
    content = content[:m.start()] + 'getIneaJundia10d(),\n      getInmetForecast()\n    ]);' + content[m.end():]
    print("Successfully added getInmetForecast() to Phase 1 Promise.allSettled!")
else:
    print("Could not find getIneaJundia10d() pattern!")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
