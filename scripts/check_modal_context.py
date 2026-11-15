with open('index.legacy.html', encoding='utf-8', errors='ignore') as f:
    text = f.read()

idx = text.find("openSocialModalChuva('24h')")
print(text[max(0, idx-500):min(len(text), idx+1000)])
