with open('css/styles.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(max(0, len(lines)-50), len(lines)):
    print(f'{i+1}: {lines[i]}', end='')
