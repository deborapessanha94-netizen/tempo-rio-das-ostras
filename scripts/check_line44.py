with open('scripts/sync_data.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(40, 50):
    print(f"{i+1}: {repr(lines[i])}")
