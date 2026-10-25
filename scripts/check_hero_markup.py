with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(215, 250):
    print(f"L{j+1}: {lines[j].rstrip()}")
