with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('id="hero-condition"')
print("Snippet around hero-condition in index.html:")
print(text[pos-250:pos+500])
