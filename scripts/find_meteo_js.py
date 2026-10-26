with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'modal-meteogramas', text)]
for pos in matches:
    print(text[max(0, pos-100):min(len(text), pos+300)])
    print("="*40)
