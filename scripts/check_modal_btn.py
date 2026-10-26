with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'Baixar Imagem Instagram' in line:
        print(f"L{i+1}: {line.strip()[:100]}")
        for j in range(max(0, i-2), min(len(lines), i+6)):
            print(f"  L{j+1}: {lines[j].rstrip()}")
        break
