with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

pos = 28865
print(text[pos+3000:pos+4600])
