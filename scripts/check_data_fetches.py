with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'data/[a-z0-9_-]+\.json', text)]
for pos in matches:
    print(text[max(0, pos-40):min(len(text), pos+60)])
