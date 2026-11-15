import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "src", "App.tsx"), "r", encoding="utf-8") as f:
    text = f.read()

lines = text.splitlines()
for i, line in enumerate(lines):
    if "bannerMes" in line:
        print(f"bannerMes: L{i+1}: {line.strip()[:100]}")
    if "informe_alerta" in line:
        print(f"informe_alerta: L{i+1}: {line.strip()[:100]}")
