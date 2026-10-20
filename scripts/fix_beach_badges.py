# -*- coding: utf-8 -*-
path_index = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html'
path_app = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\app.js'

# 1. Update index.html
with open(path_index, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('bg-zinc-200 text-[#eedfcb] font-normal', 'bg-[#133a2b] text-[#eedfcb] font-normal border border-[#dfb992]/20')
text = text.replace('bg-zinc-200', 'bg-[#133a2b]')
text = text.replace('bg-amber-50 text-amber-800 border border-amber-200', 'bg-amber-500/20 text-amber-300 border border-amber-500/40')
text = text.replace('bg-emerald-50 text-emerald-800 border border-emerald-200', 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40')
text = text.replace('bg-rose-50 text-rose-800 border border-rose-200', 'bg-rose-500/20 text-rose-300 border border-rose-500/40')
text = text.replace('border border-[#dfb992]/20/80', 'border border-[#dfb992]/20')
text = text.replace('text-blue-700', 'text-cyan-300')

with open(path_index, 'w', encoding='utf-8') as f:
    f.write(text)

# 2. Update app.js badge classes in renderCondicoesMarList
with open(path_app, 'r', encoding='utf-8') as f:
    app_text = f.read()

app_text = app_text.replace("badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';", "badgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';")
app_text = app_text.replace("badgeClass = 'bg-rose-50 text-rose-800 border-rose-200';", "badgeClass = 'bg-rose-500/20 text-rose-300 border border-rose-500/40';")
app_text = app_text.replace("badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';", "badgeClass = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';")

with open(path_app, 'w', encoding='utf-8') as f:
    f.write(app_text)

print('Updated beach tags and badges successfully!')
