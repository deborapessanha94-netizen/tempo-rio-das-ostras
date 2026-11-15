import os
import re

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "index.legacy.html"), "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

# search for "baixar" or "download" or "imagem" or "card"
matches = re.finditer(r'(?:baixar|download|salvar|exportar)[^<\n]{0,50}(?:chuva|vento|acumulado|imagem|card)', text, re.IGNORECASE)
for m in set(match.group(0).strip() for match in matches):
    print("Match 1:", m)

matches2 = re.finditer(r'(?:chuva|vento|acumulado)[^<\n]{0,50}(?:baixar|download|salvar|exportar)', text, re.IGNORECASE)
for m in set(match.group(0).strip() for match in matches2):
    print("Match 2:", m)
