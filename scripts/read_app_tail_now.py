import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "src", "App.tsx"), "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(len(lines)-25, len(lines)):
    print(f"{i+1}: {lines[i].rstrip()}")
