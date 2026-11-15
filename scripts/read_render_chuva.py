import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "js", "social-cards.js"), "r", encoding="utf-8") as f:
    text = f.read()

lines = text.splitlines()
print("Lines 889 to 950 (start of renderSocialCanvasChuva):")
for i in range(888, min(950, len(lines))):
    safe_line = lines[i].encode("ascii", "replace").decode("ascii")
    print(f"{i+1:4d}: {safe_line}")
