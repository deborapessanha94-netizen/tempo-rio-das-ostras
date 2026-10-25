with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re
# Check for any min-w-[...] or fixed large widths in header or hero
fixed_widths = re.findall(r'min-w-\[?[0-9a-zA-Z]+\]?', html)
print("Fixed min widths:", set(fixed_widths))

# Check header
header_pos = html.find('<header')
header_end = html.find('</header>')
print("Header:")
print(html[header_pos:header_end+9])
