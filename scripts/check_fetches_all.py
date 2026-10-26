with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
for m in re.finditer(r'fetch\([\'\"][^\'\"]+[\'\"]\)', text):
    print(m.group(0))
