with open('src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

assert 'const LOGO_LIGHT' in text
text = text.replace("const LOGO_LIGHT = './img/logo-transparent.png';", "const LOGO_LIGHT = './img/logo-dark-text.png';")
text = text.replace("const LOGO_DARK = './img/logo.png';", "const LOGO_DARK = './img/logo-transparent.png';")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated src/App.tsx successfully')
