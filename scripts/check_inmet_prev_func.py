with open('js/api.js', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('function getInmetForecast')
print(text[pos:pos+400])
