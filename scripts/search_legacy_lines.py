import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "index.legacy.html"), "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    for term in ["Exportar imagem oficial", "EXPORTAR IMAGEM", "Baixar Imagem"]:
        if term.lower() in line.lower():
            safe_line = line.encode("ascii", "replace").decode("ascii")
            print(f"Line {i+1}: {safe_line.strip()}")
