# -*- coding: utf-8 -*-
path_index = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html'
path_app = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\app.js'

# 1. index.html
with open(path_index, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('bg-[#092017]/80', 'bg-[#f8fafc]')
text = text.replace('id="orla-day-summary" class="p-2.5 rounded-xl bg-[#092218]/80', 'id="orla-day-summary" class="p-2.5 rounded-xl bg-[#f8fafc]')

with open(path_index, 'w', encoding='utf-8') as f:
    f.write(text)

# 2. app.js
with open(path_app, 'r', encoding='utf-8') as f:
    app_text = f.read()

app_text = app_text.replace(
    'p-2 rounded-lg bg-zinc-50/80 border border-zinc-200/50 text-xs text-zinc-700 leading-snug space-y-1',
    'p-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#334155] leading-snug space-y-1'
)

with open(path_app, 'w', encoding='utf-8') as f:
    f.write(app_text)

print('Applied clean light container polish to index.html and app.js!')
