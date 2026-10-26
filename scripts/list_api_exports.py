with open('js/api.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
for m in re.finditer(r'export\s+(?:async\s+)?function\s+([a-zA-Z0-9_]+)', text):
    print(m.group(1))
