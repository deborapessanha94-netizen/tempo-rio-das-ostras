import sys

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = None
end_idx = None

for i, l in enumerate(lines):
    if 'BARRA DE SELEÇÃO DE PERÍODO E DATAS LIVRES' in l:
        start_idx = i
    if start_idx is not None and 'OS 4 GRANDES NÚMEROS DO PERÍODO SELECIONADO' in l:
        end_idx = i
        break

print(f"Start: {start_idx}, End: {end_idx}")
for i in range(start_idx - 1, end_idx + 1):
    print(f"{i+1}: {lines[i]}", end="")
