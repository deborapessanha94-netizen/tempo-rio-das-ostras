import os
import re

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "index.legacy.html"), "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

matches = re.findall(r'<script[^>]*lucide[^>]*></script>', text)
print("Lucide script tags in index.legacy.html:", matches)
