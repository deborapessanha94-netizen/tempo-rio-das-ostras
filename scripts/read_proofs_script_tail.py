import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "scripts", "capture_panorama_proofs.py"), "r", encoding="utf-8") as f:
    print(f.read()[1000:])
