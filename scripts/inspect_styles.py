import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('C:/Users/debor/.gemini/antigravity/scratch/meteorologia-app/scripts/aistudio_extracted_app.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'<style[^>]*>.*?</style>', text, re.DOTALL)
print('Styles in extracted app:', len(matches))
for s in matches:
    print(s[:500])

# Also check CssExportModal component
idx = text.find('CssExportModal')
print('CssExportModal found at:', idx)
if idx != -1:
    print(text[idx-200:idx+1500])
