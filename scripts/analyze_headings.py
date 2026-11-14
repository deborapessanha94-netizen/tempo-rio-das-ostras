# -*- coding: utf-8 -*-
from pathlib import Path

content = Path(r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\scripts\aistudio_extracted_app.tsx").read_text(encoding="utf-8")
lines = content.splitlines()

# Let's inspect sections and what data they render
print(f"Total lines: {len(lines)}")

# Search for section headings
headings = []
for i, l in enumerate(lines):
    if "<h1" in l or "<h2" in l or "<h3" in l:
        headings.append((i+1, l.strip()[:100]))

print(f"Found {len(headings)} headings in App.tsx:")
for ln, h in headings[:40]:
    print(f"  L{ln}: {h}")
