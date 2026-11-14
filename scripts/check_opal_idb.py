# -*- coding: utf-8 -*-
from pathlib import Path

opal_dir = Path(r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default\IndexedDB\https_opal.google_0.indexeddb.leveldb")

if opal_dir.exists():
    print("Files in https_opal.google_0.indexeddb.leveldb:")
    for f in opal_dir.iterdir():
        data = f.read_bytes()
        print(f" {f.name} ({len(data)} bytes)")
        # check for filenames or keywords
        for kw in [b"dec9e986", b"planconStatic", b"HourlyChart", b"RiverChart", b"CssExportModal", b"weatherData"]:
            if kw in data:
                print(f"   --> Found keyword {kw.decode()} ({data.count(kw)} times) in {f.name}")
else:
    print("opal_dir does not exist")
