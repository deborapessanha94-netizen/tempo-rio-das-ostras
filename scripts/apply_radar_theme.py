# -*- coding: utf-8 -*-
path_radar = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\radar.js'

with open(path_radar, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("'bg-sky-600', 'text-white'", "'bg-[#dfb992]', 'text-[#2b180e]'")
text = text.replace("'bg-slate-100', 'text-slate-700'", "'bg-[#0c271d]', 'text-[#eedfcb]'")

with open(path_radar, 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated radar.js successfully!')
