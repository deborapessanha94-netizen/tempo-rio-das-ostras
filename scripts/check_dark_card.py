import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('js/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(2141, 2210):
    print(f"L{i+1}: {lines[i].rstrip()}")
