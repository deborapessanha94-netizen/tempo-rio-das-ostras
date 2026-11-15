with open('index.legacy.html', encoding='utf-8', errors='ignore') as f:
    text = f.read()

idx = text.find('modal-social-chuva')
div_start = text.rfind('<div', 0, idx)
# print 5000:10000
print(text[div_start+5000:div_start+10000])
