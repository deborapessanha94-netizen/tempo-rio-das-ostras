with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(960, 1045):
    print(f"{j+1}: {repr(lines[j])}")
