import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "src", "App.tsx"), "r", encoding="utf-8") as f:
    text = f.read()

lines = text.splitlines()
for i, line in enumerate(lines):
    if "openMeteo" in line and ("const " in line or "let " in line):
        safe_line = line.encode("ascii", "replace").decode("ascii")
        print(f"L{i+1}: {safe_line.strip()}")
