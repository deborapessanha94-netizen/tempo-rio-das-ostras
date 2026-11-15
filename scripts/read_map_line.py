import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "src", "App.tsx"), "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(1250, 1275):
    if "mapa_rj" in lines[i]:
        print(f"Line {i+1}: {lines[i].strip()}")
        for j in range(i-5, i+6):
            print(f"  {j+1}: {lines[j].rstrip()}")
