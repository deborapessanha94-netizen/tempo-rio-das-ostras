with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('async function loadAllApplicationData()')
print(text[pos:pos+1000])
