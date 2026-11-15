import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "src", "App.tsx"), "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(5885, len(lines)):
    safe = lines[i].encode("ascii", "replace").decode("ascii")
    print(f"{i+1:4d}: {safe.rstrip()}")
