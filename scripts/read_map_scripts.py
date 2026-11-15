import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
for fname in ["scripts/make_dark_hd_map.py", "scripts/make_hd_map.py"]:
    print(f"=== {fname} ===")
    with open(os.path.join(base_dir, fname), "r", encoding="utf-8") as f:
        print(f.read())
