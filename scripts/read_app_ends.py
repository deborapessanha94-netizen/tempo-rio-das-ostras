import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "src", "App.tsx"), "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Head of App.tsx:")
for i in range(min(40, len(lines))):
    safe_line = lines[i].encode("ascii", "replace").decode("ascii")
    print(f"{i+1:3d}: {safe_line.rstrip()}")

print("\nTail of App.tsx:")
for i in range(max(0, len(lines)-30), len(lines)):
    safe_line = lines[i].encode("ascii", "replace").decode("ascii")
    print(f"{i+1:4d}: {safe_line.rstrip()}")
