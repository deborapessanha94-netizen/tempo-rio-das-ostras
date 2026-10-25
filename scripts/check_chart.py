with open('js/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'bulletinchart' in line.lower():
        print(f"L{i+1}: {line.strip()[:100]}")
