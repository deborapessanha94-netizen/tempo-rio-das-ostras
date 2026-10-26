with open('css/styles.css', 'r', encoding='utf-8') as f:
    text = f.read()

import re
for m in re.finditer(r'\.modern-card\s*\{[^}]*\}', text):
    print(m.group(0))
