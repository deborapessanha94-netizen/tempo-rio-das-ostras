with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('id="modal-img-meteograma-inmet"')
print(text[pos:pos+400])
