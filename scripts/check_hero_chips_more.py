with open('js/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(2255, min(len(lines), 2320)):
    print(f"{j+1}: {repr(lines[j])}")
