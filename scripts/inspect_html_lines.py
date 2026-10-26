# -*- coding: utf-8 -*-
with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

print("--- LINES 1675 to 1735 ---")
for i in range(1675, min(1735, len(lines))):
    if lines[i].strip():
        print(f"{i+1}: {lines[i].strip()}")

print("\n--- LINES 9580 to 9660 ---")
for i in range(9580, min(9660, len(lines))):
    if lines[i].strip():
        print(f"{i+1}: {lines[i].strip()}".encode('ascii', 'replace').decode('ascii'))
