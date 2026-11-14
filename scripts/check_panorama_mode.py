for fname in ['index.html', 'js/panorama_mensal.js']:
    path = f'C:/Users/debor/.gemini/antigravity/scratch/meteorologia-app/{fname}'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    import re
    matches = [m.start() for m in re.finditer(r'switchPanoramaMode', text)]
    print(f'{fname}: {len(matches)} matches')
    for idx in matches:
        print(text[idx-20:idx+200])
