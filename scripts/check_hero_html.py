import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('id="hero-condition"')
if pos == -1:
    pos = text.find('Sensação:')

print("Found at pos:", pos)
if pos != -1:
    print(text[pos-200:pos+1200])
