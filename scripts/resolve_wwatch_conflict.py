# -*- coding: utf-8 -*-
import subprocess

conflicted = [
    "data/boletim_metadata.json",
    "data/boletim_oficial.json",
    "data/cptec_wwatch.json",
    "data/inea_alerta_cheias_boletim.json",
    "data/inmet_meteograma.json",
    "data/tabua_mares.json",
    "docs/boletim_operacional.pdf",
    "docs/informativo_populacao.pdf"
]

for f in conflicted:
    res = subprocess.run(["git", "checkout", "--theirs", f], capture_output=True, text=True)
    print(f"Checkout --theirs {f}: {res.returncode}")

subprocess.run(["git", "add", "."], check=True)
print("Added all files.")
