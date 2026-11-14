# -*- coding: utf-8 -*-
from pathlib import Path

content = Path(r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\scripts\aistudio_extracted_app.tsx").read_text(encoding="utf-8")

symbols = [
    "HourlyChart",
    "RiverChart",
    "CssExportModal",
    "PLANCON_LIMIARES",
    "PLANCON_EL_NINO",
    "PLANCON_AREAS_VULNERAVEIS",
    "REDEC_1_MUNICIPIOS",
    "CENTRAL_EMERGENCIAS"
]

for s in symbols:
    cnt = content.count(s)
    print(f"Symbol '{s}': {cnt} occurrences")
