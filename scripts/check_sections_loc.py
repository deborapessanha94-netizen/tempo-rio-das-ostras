with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines in index.html: {len(lines)}")
for i in range(1348, len(lines)):
    line = lines[i]
    if '<section' in line or '<div id="view-' in line or '<div id="card-' in line or '<footer' in line or '<div id="modal-' in line:
        print(f"L{i+1}: {line.strip()[:100]}")
