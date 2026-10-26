import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'<img[^>]*meteograma[^>]*>', text, re.I):
    print("Found img:", m.group(0))

for m in re.finditer(r'id="modal-meteogramas"[\s\S]*?</div>\s*</div>\s*</div>', text):
    print("Modal length:", len(m.group(0)))
