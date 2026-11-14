# -*- coding: utf-8 -*-
from pathlib import Path

content = Path(r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\scripts\aistudio_extracted_app.tsx").read_text(encoding="utf-8")

lines = content.splitlines()
print(f"Total lines in aistudio_extracted_app.tsx: {len(lines)}")

# Let's inspect imports
print("Imports:")
for l in lines[:70]:
    if l.startswith("import ") or l.startswith("from ") or l.startswith("} from"):
        print(" ", l)

# Let's search where components are defined
print("\nExported / Defined Components & Functions:")
for i, l in enumerate(lines):
    if any(l.startswith(prefix) for prefix in ["export function", "export const", "function ", "const App", "export default"]):
        print(f"Line {i+1}: {l[:100]}")
