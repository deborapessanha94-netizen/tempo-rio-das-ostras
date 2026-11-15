import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "src", "App.tsx"), "r", encoding="utf-8") as f:
    text = f.read()

lines = text.splitlines()
for i, line in enumerate(lines):
    if "activeTab === 'boletim'" in line:
        safe_line = line.encode("ascii", "replace").decode("ascii")
        print(f"Line {i+1}: {safe_line[:120]}")
