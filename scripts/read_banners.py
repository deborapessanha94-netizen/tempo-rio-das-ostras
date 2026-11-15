import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "src", "App.tsx"), "r", encoding="utf-8") as f:
    text = f.read()

# Let's inspect around index 42000 to 44500
idx = text.find("bannerMes")
print("First bannerMes at", idx)
lines = text.splitlines()
for i, line in enumerate(lines):
    if "bannerMes" in line or "informe_alerta" in line or "RETROSPECTIVA OFICIAL" in line:
        safe = line.encode("ascii", "replace").decode("ascii")
        print(f"L{i+1}: {safe[:100]}")
