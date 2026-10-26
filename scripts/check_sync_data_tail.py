with open('scripts/sync_data.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)-30, len(lines)):
    print(f"{i+1}: {lines[i]}", end='')
