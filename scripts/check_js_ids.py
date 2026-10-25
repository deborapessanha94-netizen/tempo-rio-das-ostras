import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

ids = set(re.findall(r'document\.getElementById\([\'"]([^\'"]+)[\'"]\)', content))
print(f"Total distinct getElementById in app.js: {len(ids)}")
for elem_id in sorted(ids):
    print(elem_id)
