with open('js/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(11590, min(len(lines), 11630)):
    print(f'{i+1}: {lines[i]}', end='')
