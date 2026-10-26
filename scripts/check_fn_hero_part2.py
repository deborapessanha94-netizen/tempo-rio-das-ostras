with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

pos = 28865
print(text[pos+1200:pos+3000])
