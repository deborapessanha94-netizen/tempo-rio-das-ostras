with open('js/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(2370, min(2410, len(lines))):
    print(f"L{i+1}: {lines[i].rstrip()}")
