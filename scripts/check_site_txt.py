with open('js/social-cards.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'siteTxt' in line or 'tempo-riodasostras' in line or '.com.br' in line or 'ctx.fillText' in line and ('site' in line or 'fontes' in line.lower() or 'tempo' in line):
        print(f"L{i+1}: {line.strip()[:100]}")
        for j in range(max(0, i-5), min(len(lines), i+15)):
            print(f"  L{j+1}: {lines[j].rstrip()}")
