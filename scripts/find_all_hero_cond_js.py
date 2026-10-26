with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'hero-condition', text)]
for idx, pos in enumerate(matches):
    print(f"Match {idx+1} at pos {pos}:")
    print(text[max(0, pos-150):min(len(text), pos+300)])
    print("="*50)
