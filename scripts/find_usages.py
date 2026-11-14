# -*- coding: utf-8 -*-
from pathlib import Path

content = Path(r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\scripts\aistudio_extracted_app.tsx").read_text(encoding="utf-8")
lines = content.splitlines()

for target in ["HourlyChart", "RiverChart", "CssExportModal", "PLANCON_LIMIARES", "PLANCON_EL_NINO"]:
    print(f"=== Usage of {target} ===")
    for i, l in enumerate(lines):
        if target in l:
            print(f"  L{i+1}: {l.strip()[:100]}")
