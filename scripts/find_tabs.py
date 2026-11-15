import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "src", "App.tsx"), "r", encoding="utf-8") as f:
    text = f.read()

import re
tabs = re.findall(r"activeTab === '([^']+)'", text)
print("Unique activeTab values:", set(tabs))
