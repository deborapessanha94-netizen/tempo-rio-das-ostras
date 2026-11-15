import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "scripts", "extracted_modal.html"), "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
for i in range(0, min(100, len(lines))):
    print(f"{i+1:3d}: {lines[i].rstrip()}")
