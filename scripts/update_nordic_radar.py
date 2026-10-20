# -*- coding: utf-8 -*-
path_radar = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\radar.js'

with open(path_radar, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("'bg-[#dfb992]', 'text-[#2b180e]'", "'bg-[#f07a53]', 'text-white'")
text = text.replace("'bg-[#0c271d]', 'text-[#eedfcb]'", "'bg-[#ffffff]', 'text-[#334155]'")

with open(path_radar, 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated radar.js for Nordic theme successfully!')
