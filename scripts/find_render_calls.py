with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
for m in re.finditer(r'renderDashboardUI', text):
    pos = m.start()
    print("="*40)
    print(text[max(0, pos-100):min(len(text), pos+200)])
