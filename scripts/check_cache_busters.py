import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'(?:styles\.css|app\.js)\?v=[0-9]+', text):
    print("Found cache-buster:", m.group(0))
