with open('C:/Users/debor/.gemini/antigravity/scratch/meteorologia-app/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'tailwindcss|tailwind', text)]
print('Matches for tailwind:', len(matches))
for idx in matches[:5]:
    print(text[idx-20:idx+150])
