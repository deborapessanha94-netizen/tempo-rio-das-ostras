with open('js/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'hero-chip-' in l:
        print(f"Found at line {i+1}")
        for j in range(max(0, i-25), min(len(lines), i+35)):
            print(f"{j+1}: {repr(lines[j])}")
        break
