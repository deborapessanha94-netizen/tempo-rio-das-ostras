with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('id="tab-btn-inmet-meteo"')
print(text[pos-200:pos+300])
