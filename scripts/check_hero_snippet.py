with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(998, 1035):
    print(f"{j+1}: {repr(lines[j])}")
