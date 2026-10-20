# -*- coding: utf-8 -*-
"""
Script de harmonização total de classes em index.html
Substitui todas as classes neutras/frias (zinc/white) por classes
do sistema visual luxuoso Floresta, Terra & Areia Dourada.
"""

path_index = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html'

with open(path_index, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Limpeza de bg-white nos cards principais
text = text.replace('<div class="modern-card p-5 sm:p-6 bg-white space-y-4">', '<div class="modern-card p-5 sm:p-6 space-y-4">')
text = text.replace('modern-card p-5 sm:p-6 bg-white border border-zinc-200', 'modern-card p-5 sm:p-6')
text = text.replace('modern-card p-5 sm:p-6 bg-white space-y-4', 'modern-card p-5 sm:p-6 space-y-4')

# 2. Radar controls
text = text.replace(
    'class="px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer transition"',
    'class="px-3 py-1 rounded-full text-xs font-semibold bg-[#0c271d] border border-[#dfb992]/25 text-[#eedfcb] hover:bg-[#143c2c] cursor-pointer transition"'
)
text = text.replace(
    'class="px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-900 text-white cursor-pointer transition"',
    'class="px-3 py-1 rounded-full text-xs font-bold bg-[#dfb992] text-[#2b180e] shadow-sm cursor-pointer transition"'
)
text = text.replace(
    '<div class="p-2.5 bg-white border-t border-zinc-200 flex items-center justify-between gap-3 text-xs">',
    '<div class="p-2.5 bg-[#0a2319] border-t border-[#dfb992]/20 flex items-center justify-between gap-3 text-xs">'
)
text = text.replace(
    '<span id="radar-time-label" class="font-mono font-medium text-zinc-700 ml-1">',
    '<span id="radar-time-label" class="font-mono font-medium text-[#eedfcb] ml-1">'
)

# 3. Orla tabs e dias
text = text.replace(
    'class="orla-tab-btn active flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition shadow-sm bg-white text-zinc-900 cursor-pointer"',
    'class="orla-tab-btn active flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-bold transition cursor-pointer"'
)
text = text.replace(
    'class="orla-tab-btn flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-medium transition text-zinc-600 hover:text-zinc-900 cursor-pointer"',
    'class="orla-tab-btn flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-medium transition text-[#a9c6b6] hover:text-white cursor-pointer"'
)
text = text.replace(
    'class="orla-day-btn active px-2.5 py-1 rounded text-xs font-bold bg-blue-600 text-white shadow-xs cursor-pointer"',
    'class="orla-day-btn active px-3 py-1 rounded-full text-xs font-bold cursor-pointer"'
)
text = text.replace(
    'class="orla-day-btn px-2.5 py-1 rounded text-xs font-medium bg-white text-zinc-700 hover:bg-zinc-100 border border-blue-200 cursor-pointer"',
    'class="orla-day-btn px-3 py-1 rounded-full text-xs font-medium bg-[#133a2b] text-[#eedfcb] hover:bg-[#1c4d39] border border-[#dfb992]/25 cursor-pointer"'
)
text = text.replace(
    'id="orla-day-summary" class="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between gap-2"',
    'id="orla-day-summary" class="p-2.5 rounded-xl bg-[#092218]/80 border border-[#dfb992]/20 text-xs flex items-center justify-between gap-2"'
)

# 4. Modais
modal_replaces = [
    ('overflow-hidden bg-white border border-zinc-200', 'overflow-hidden bg-[#0c271d] border border-[#dfb992]/30 text-[#faf4eb]'),
    ('px-5 py-3.5 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800', 'px-5 py-3.5 bg-[#091c14] text-[#faf4eb] flex items-center justify-between border-b border-[#dfb992]/20'),
    ('overflow-y-auto space-y-5 text-sm text-zinc-700 bg-white', 'overflow-y-auto space-y-5 text-sm text-[#eedfcb] bg-[#0c271d]'),
    ('overflow-y-auto space-y-4 bg-white', 'overflow-y-auto space-y-4 bg-[#0c271d] text-[#eedfcb]'),
    ('overflow-y-auto space-y-3.5 text-sm bg-white', 'overflow-y-auto space-y-3.5 text-sm bg-[#0c271d] text-[#eedfcb]'),
    ('overflow-y-auto space-y-4 text-sm text-zinc-700 bg-white', 'overflow-y-auto space-y-4 text-sm text-[#eedfcb] bg-[#0c271d]'),
    ('px-5 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs font-medium text-zinc-600', 'px-5 py-3 bg-[#091c14] border-t border-[#dfb992]/20 flex items-center justify-between text-xs font-medium text-[#a9c6b6]'),
    ('px-4 py-1.5 rounded-lg font-semibold bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer', 'px-4 py-1.5 rounded-full font-semibold btn-action-outline cursor-pointer'),
    ('bg-zinc-50 border border-zinc-200/70', 'bg-[#092017]/80 border border-[#dfb992]/20'),
    ('bg-zinc-50 border border-zinc-200', 'bg-[#092017]/80 border border-[#dfb992]/20'),
    ('bg-zinc-50/80 border border-zinc-200/80', 'bg-[#092017]/80 border border-[#dfb992]/20'),
    ('bg-zinc-50/80 border border-zinc-200/50', 'bg-[#092017]/80 border border-[#dfb992]/20'),
    ('border-zinc-100', 'border-[#dfb992]/15'),
    ('border-zinc-200', 'border-[#dfb992]/20'),
    ('text-zinc-950', 'text-[#faf4eb]'),
    ('text-zinc-900', 'text-[#faf4eb]'),
    ('text-zinc-800', 'text-[#eedfcb]'),
    ('text-zinc-700', 'text-[#eedfcb]'),
    ('text-zinc-600', 'text-[#a9c6b6]'),
    ('text-zinc-500', 'text-[#a9c6b6]'),
    ('text-zinc-400', 'text-[#a9c6b6]')
]

for old, new in modal_replaces:
    text = text.replace(old, new)

# 5. Salva index.html
with open(path_index, 'w', encoding='utf-8') as f:
    f.write(text)

print('Harmonized index.html successfully!')
