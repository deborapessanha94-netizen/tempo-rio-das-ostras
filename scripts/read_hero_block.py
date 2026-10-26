with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('// 1. Hero Card')
print(text[pos-200:pos+1500])
