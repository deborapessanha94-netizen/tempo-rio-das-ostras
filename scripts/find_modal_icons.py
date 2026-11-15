import os
import re

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "scripts", "extracted_modal.html"), "r", encoding="utf-8") as f:
    text = f.read()

icons = re.findall(r'data-lucide="([^"]+)"', text)
print("Icons used in modal:", sorted(set(icons)))
