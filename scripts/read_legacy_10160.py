import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "index.legacy.html"), "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i in range(10155, min(10220, len(lines))):
    safe_line = lines[i].encode("ascii", "replace").decode("ascii")
    print(f"{i+1:5d}: {safe_line.rstrip()}")
