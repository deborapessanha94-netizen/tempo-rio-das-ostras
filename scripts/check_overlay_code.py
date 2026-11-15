import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "js", "social-cards.js"), "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find("social-mobile-save-overlay")
if idx != -1:
    print(text[max(0, idx-200):min(len(text), idx+600)])
