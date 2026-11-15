import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "src", "App.tsx"), "r", encoding="utf-8") as f:
    text = f.read()

lines = text.splitlines()
print(f"Total lines in App.tsx: {len(lines)}")
# Find occurrences of "Rede Pluviom" or "chuva"
for i, line in enumerate(lines):
    if "Rede Pluviom" in line or "Pluviométrica" in line or "card-chuva" in line or "acumulados" in line:
        print(f"Line {i+1}: {line[:120]}")
