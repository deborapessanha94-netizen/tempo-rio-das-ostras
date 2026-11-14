with open('scripts/aistudio_extracted_app.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("const LOGO_LIGHT = '/assets/aistudio/image_3687731e.png';", "const LOGO_LIGHT = './img/logo-transparent.png';")
text = text.replace("const LOGO_DARK = '/assets/aistudio/image_0941c150.png';", "const LOGO_DARK = './img/logo.png';")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Written src/App.tsx, length:', len(text))
