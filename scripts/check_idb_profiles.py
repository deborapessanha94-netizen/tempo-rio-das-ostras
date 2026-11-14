# -*- coding: utf-8 -*-
from pathlib import Path

base = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data")

for prof in ["Default", "Profile 1", "Profile 2", "Profile 3"]:
    idb_dir = base / prof / "IndexedDB"
    if idb_dir.exists():
        print(f"=== IndexedDB in {prof} ===")
        for d in idb_dir.iterdir():
            if any(k in d.name.lower() for k in ["aistudio", "google", "opal", "labs", "gemini"]):
                print(" ", d.name)
