with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if "activeTab === 'boletim'" in l or "activeTab === 'previsao'" in l:
        print(f"{i+1}: {l.strip()}")
