with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(410, 856):
    line = lines[i]
    if '<section' in line or '</section>' in line or '<main' in line or '</main>' in line or 'id=' in line:
        print(f"L{i+1}: {line.strip()[:100]}")
