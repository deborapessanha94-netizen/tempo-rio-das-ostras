with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('const state =')
if pos == -1:
    pos = text.find('let state =')
print(text[pos:pos+300])
