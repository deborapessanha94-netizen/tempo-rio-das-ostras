with open('js/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(1915, min(1980, len(lines))):
    print(f"L{i+1}: {lines[i].rstrip()}")
