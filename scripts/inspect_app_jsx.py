# -*- coding: utf-8 -*-
from pathlib import Path

content = Path(r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\scripts\aistudio_extracted_app.tsx").read_text(encoding="utf-8")
lines = content.splitlines()

# Search for main JSX sections in App()
print("Key JSX sections in App():")
for i, l in enumerate(lines):
    if any(k in l for k in ["<header", "<nav", "<main", "<footer", "activeTab ===", "activeTab ==="]):
        print(f"L{i+1}: {l.strip()[:100]}")
