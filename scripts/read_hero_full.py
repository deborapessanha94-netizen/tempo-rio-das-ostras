import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'id="hero-condition"' in l:
        print(f"Found at line {i+1}")
        for j in range(max(0, i-25), min(len(lines), i+35)):
            print(f"{j+1}: {lines[j]}", end='')
        break
