with open('css/styles.css', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('body')
print(text[pos:pos+300])
