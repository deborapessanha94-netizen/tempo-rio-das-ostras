with open('index.legacy.html', encoding='utf-8', errors='ignore') as f:
    text = f.read()

idx = text.find('modal-social-chuva')
if idx != -1:
    div_start = text.rfind('<div', 0, idx)
    # find where this div ends by counting tags or scanning
    print("Found modal at idx", div_start)
    # print up to 5000 chars
    print(text[div_start:div_start+5000])
else:
    print("modal-social-chuva not found in index.legacy.html")
