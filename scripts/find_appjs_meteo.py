with open('js/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'Modal 4: Meteogramas Oficiais' in l:
        print(f"Found at line {i+1}")
        for j in range(max(0, i-5), min(len(lines), i+65)):
            print(f"{j+1}: {repr(lines[j])}")
        break
