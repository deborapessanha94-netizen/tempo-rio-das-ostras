import re

with open('js/social-cards.js', encoding='utf-8', errors='ignore') as f:
    text = f.read()

matches = re.findall(r'document\.getElementById\([\'"]([^\'"]+)[\'"]\)', text)
print('IDs in social-cards.js:')
for m in sorted(set(matches)):
    print(' -', m)
