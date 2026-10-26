with open('js/social-cards.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(410, min(445, len(lines))):
    print(f"L{i+1}: {lines[i].rstrip()}")
