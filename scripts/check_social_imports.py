import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "js", "social-cards.js"), "r", encoding="utf-8") as f:
    text = f.read()

import re
imports = re.findall(r"^import\s+.*$", text, re.MULTILINE)
print("Imports in social-cards.js:")
for imp in imports:
    print(" -", imp)
