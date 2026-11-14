import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('C:/Users/debor/.gemini/antigravity/scratch/meteorologia-app/scripts/aistudio_extracted_app.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'CssExportModal', text)]
for idx in matches:
    print('idx:', idx)
    print(text[idx-50:idx+400])
