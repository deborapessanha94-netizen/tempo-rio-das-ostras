# -*- coding: utf-8 -*-
with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

# Verify line 1681 (index 1680)
print(f"Target start: {lines[1680].strip()}")
print(f"Target end: {lines[1732].strip()}")

# Keep lines before 1680 and after 1732 (index 1733 onwards)
new_lines = lines[:1680] + lines[1733:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Removed lines 1681 to 1733. Total lines now: {len(new_lines)}")
