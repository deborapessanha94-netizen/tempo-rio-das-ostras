with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

pos_chuva = text.find('id="view-tab-chuva"')
chuva_part = text[pos_chuva:]

import re
ids = re.findall(r'id="([^"]+)"', chuva_part)
print("IDs in view-tab-chuva:")
for i in ids:
    print(" -", i)
