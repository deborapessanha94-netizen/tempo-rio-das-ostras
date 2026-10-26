with open('scripts/sync_data.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the broken def
text = text.replace('def sync_inmet_forecast()\n    sync_inmet_meteograma():', 'def sync_inmet_forecast():')

with open('scripts/sync_data.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Fixed def sync_inmet_forecast()!")
