import re

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'id="app-main-tabs"' in line:
        print(f"L{i+1}: app-main-tabs found")
        for j in range(i, min(i+45, len(lines))):
            print(f"L{j+1}: {lines[j].rstrip()}")
        break

print("\n--- Sections & Views in index.html ---")
for i, line in enumerate(lines):
    if re.search(r'<(section|div)[^>]*(id="[^"]*view|id="[^"]*tab|id="section-|id="card-)', line):
        print(f"L{i+1}: {line.strip()[:100]}")
