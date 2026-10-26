import os

matches = []
for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root:
        continue
    for file in files:
        if file.endswith(('.js', '.html', '.json', '.css', '.md')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if 'tempo-riodasostras.com.br' in content:
                    matches.append((path, 'tempo-riodasostras.com.br'))
                if 'tempo-riodasostras' in content:
                    matches.append((path, 'tempo-riodasostras'))

print("Found matches:")
for m in set(matches):
    print(" -", m[0], ":", m[1])
