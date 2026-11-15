import os
import re

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "src", "App.tsx"), "r", encoding="utf-8") as f:
    text = f.read()

# search for useState hooks in App component
matches = re.findall(r'const\s*\[\s*([a-zA-Z0-9_]+)\s*,\s*set[a-zA-Z0-9_]+\s*\]\s*=\s*useState', text)
print("useState variables in App.tsx:")
for m in matches[:25]:
    print(" -", m)
