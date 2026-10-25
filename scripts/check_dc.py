with open('index.html.new', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'defesa civil' in line.lower():
        print(f"L{i+1}: {line.strip()[:100]}")
