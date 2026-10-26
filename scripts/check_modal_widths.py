import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

pos1 = text.find('id="modal-meteogramas"')
pos2 = text.find('id="modal-social-chuva"')

modal_html = text[pos1:pos2]

for m in re.finditer(r'(min-w-[^\s\"]+|w-\[[^\s\"]+\])', modal_html):
    print("Found width constraint:", m.group(0))

for m in re.finditer(r'<table[^>]*>', modal_html):
    print("Found table:", m.group(0))
