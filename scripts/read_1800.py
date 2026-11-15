import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "src", "App.tsx"), "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(1800, 1850):
    safe_line = lines[i].encode("ascii", "replace").decode("ascii")
    print(f"{i+1:4d}: {safe_line.rstrip()}")
