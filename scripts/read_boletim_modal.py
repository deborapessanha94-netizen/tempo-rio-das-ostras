import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('id="modal-boletim-tecnico"')
if pos != -1:
    print(text[pos:pos+1000])
