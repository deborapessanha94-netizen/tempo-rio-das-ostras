import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
legacy_path = os.path.join(base_dir, "index.legacy.html")

with open(legacy_path, "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

for marker in ["social-export-canvas", "social-mobile-save-overlay", "social-mobile-helper-img"]:
    idx = text.find(marker)
    print(f"Marker {marker}: idx={idx}")
    if idx != -1:
        line_start = text.rfind("\n", 0, idx)
        line_end = text.find("\n", idx)
        print(text[line_start:line_end])
