import os
import re

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "scripts", "extracted_modal.html"), "r", encoding="utf-8") as f:
    html = f.read()

# Let's inspect all attributes with events or styles
styles = re.findall(r'style="([^"]*)"', html)
print("Styles found:", set(styles))

events = re.findall(r'on\w+="([^"]*)"', html)
print("Events found:", set(events))
