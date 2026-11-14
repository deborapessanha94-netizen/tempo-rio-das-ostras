# -*- coding: utf-8 -*-
import sqlite3, shutil, tempfile, os
from pathlib import Path

base = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data")
for p in base.iterdir():
    if p.is_dir() and (p.name.startswith("Profile") or p.name == "Default"):
        hist = p / "History"
        if hist.exists():
            tmp = tempfile.mktemp(suffix=".db")
            try:
                shutil.copy2(hist, tmp)
                conn = sqlite3.connect(tmp)
                c = conn.cursor()
                c.execute("SELECT url, title, last_visit_time FROM urls WHERE url LIKE '%dec9e986%' ORDER BY last_visit_time DESC LIMIT 5")
                rows = c.fetchall()
                if rows:
                    print(f"=== Found in {p.name} ===")
                    for r in rows:
                        print(" ", r[0], "|", r[1])
                conn.close()
            except Exception as e:
                print("Error in", p.name, e)
            finally:
                if os.path.exists(tmp): os.remove(tmp)
