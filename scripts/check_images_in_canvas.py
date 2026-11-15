import os
import re

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "js", "social-cards.js"), "r", encoding="utf-8") as f:
    text = f.read()

draw_images = re.findall(r'.*drawImage.*', text)
print(f"drawImage occurrences: {len(draw_images)}")
for d in draw_images:
    print(d.strip())

new_images = re.findall(r'.*new Image.*', text)
print(f"new Image occurrences: {len(new_images)}")
for n in new_images:
    print(n.strip())
