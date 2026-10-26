import re

with open('css/styles.css', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'modal-boletim[^{]*\{[^}]*\}', text):
    print(m.group(0))
