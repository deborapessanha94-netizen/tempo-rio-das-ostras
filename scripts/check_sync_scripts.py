import re

for fname in ['scripts/sync_data.py', 'scripts/collector.py']:
    try:
        with open(fname, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'meteograma' in content:
                print(f"Found meteograma in {fname}:")
                for line in content.splitlines():
                    if 'meteograma' in line.lower() or 'apiprevmet' in line.lower() or 'inmet' in line.lower():
                        print('  ', line[:100])
            else:
                print(f"No meteograma in {fname}")
    except Exception as e:
        print(f"Error reading {fname}: {e}")
