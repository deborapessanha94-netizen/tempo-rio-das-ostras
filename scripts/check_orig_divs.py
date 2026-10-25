with open('index.html', 'r', encoding='utf-8') as f:
    orig = f.read()

import re

for tag in ['div', 'section', 'nav', 'main']:
    opens = len(re.findall(rf'<{tag}(\s|>)', orig))
    closes = len(re.findall(rf'</{tag}>', orig))
    print(f"ORIGINAL Tag <{tag}>: {opens} opens, {closes} closes, diff = {opens - closes}")
