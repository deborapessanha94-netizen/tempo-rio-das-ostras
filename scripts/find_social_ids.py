import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
js_path = os.path.join(base_dir, "js", "social-cards.js")

with open(js_path, "r", encoding="utf-8") as f:
    text = f.read()

import re
elem_ids = re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)", text)
print("Unique getElementById in social-cards.js:")
for eid in sorted(set(elem_ids)):
    print(" -", eid)
