import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "js", "social-cards.js"), "r", encoding="utf-8") as f:
    text = f.read()

lines = text.splitlines()
for i, line in enumerate(lines[:150]):
    if "window" in line:
        safe_line = line.encode("ascii", "replace").decode("ascii")
        print(f"{i+1:3d}: {safe_line.strip()}")
