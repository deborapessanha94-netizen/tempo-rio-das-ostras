import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "src", "App.tsx"), "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines[:2325]):
    if "activeTab ===" in line:
        safe_line = line.encode("ascii", "replace").decode("ascii")
        print(f"Line {i+1}: {safe_line.strip()}")
