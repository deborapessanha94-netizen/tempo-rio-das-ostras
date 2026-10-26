with open('scripts/sync_data.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("sync_data.py lines:", len(lines))
for i in range(min(50, len(lines))):
    print(f"{i+1}: {lines[i]}", end='')
