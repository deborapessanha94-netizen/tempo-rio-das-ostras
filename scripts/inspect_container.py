with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'id="meteo-zoom-container-inmet"' in l:
        for j in range(max(0, i-2), min(len(lines), i+30)):
            print(f"{j+1}: {repr(lines[j])}")
        break
