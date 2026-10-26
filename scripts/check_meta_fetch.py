with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('metaRes')
print(text[pos-400:pos+200])
