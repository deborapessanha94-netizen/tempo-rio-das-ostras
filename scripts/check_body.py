with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '<body' in line:
        print(f"L{i+1}: {line.rstrip()}")
        for j in range(i, i+15):
            print(f"  L{j+1}: {lines[j].rstrip()}")
        break
