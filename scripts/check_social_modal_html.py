with open('index.legacy.html', encoding='utf-8', errors='ignore') as f:
    text = f.read()

idx = text.find('social-modal')
if idx != -1:
    print(text[idx:idx+2500])
else:
    print("social-modal not found")
