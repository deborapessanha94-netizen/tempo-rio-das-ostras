import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Header replacement
header_pos = text.find('id="btn-close-modal-meteogramas"')
if header_pos != -1:
    h_start = text.rfind('<div class="px-5 py-3.5 bg-[#f8fafc]', 0, header_pos)
    h_end = text.find('</div>', header_pos) + len('</div>')
    old_h = text[h_start:h_end]
    new_h = '''<div class="px-3.5 sm:px-5 py-3 bg-[#f8fafc] text-[#1e293b] flex items-center justify-between border-b border-[#e2e8f0]">
        <div class="flex items-center gap-2 min-w-0 pr-2">
          <div class="medallion-title-orange w-7 h-7 rounded-lg flex items-center justify-center text-black shadow-xs shrink-0">
            <i data-lucide="line-chart" class="w-4 h-4 text-black"></i>
          </div>
          <div class="min-w-0">
            <h3 class="text-sm sm:text-base font-bold text-black leading-tight truncate">Meteogramas Numéricos Oficiais</h3>
            <span class="text-[11px] sm:text-xs text-[#64748b] font-normal block truncate">Modelagem INMET (COSMO) & CPTEC/INPE</span>
          </div>
        </div>
        <button id="btn-close-modal-meteogramas" class="p-1 rounded-lg text-[#64748b] hover:text-black cursor-pointer transition shrink-0" title="Fechar">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>'''
    text = text[:h_start] + new_h + text[h_end:]
    print("Replaced header successfully!")

# 2. Footer replacement
foot_pos = text.find('id="btn-close-modal-meteogramas-foot"')
if foot_pos != -1:
    f_start = text.rfind('<div class="px-5 py-3 bg-[#f8fafc]', 0, foot_pos)
    f_end = text.find('</div>', foot_pos) + len('</div>')
    old_f = text[f_start:f_end]
    new_f = '''<div class="px-3.5 sm:px-5 py-2.5 bg-[#f8fafc] border-t border-[#cbd5e1] flex items-center justify-between gap-2 text-xs font-medium text-[#64748b]">
        <span class="truncate text-[11px] sm:text-xs min-w-0">INMET (COSMO 7km) & CPTEC/INPE</span>
        <button id="btn-close-modal-meteogramas-foot" class="px-4 py-1.5 rounded-full font-semibold btn-action-outline cursor-pointer shrink-0 text-center text-xs">
          Fechar
        </button>
      </div>'''
    text = text[:f_start] + new_f + text[f_end:]
    print("Replaced footer successfully!")

# 3. Add min-w-0 to modern-card of modal-meteogramas
modal_div_pos = text.find('id="modal-meteogramas"')
if modal_div_pos != -1:
    card_pos = text.find('class="modern-card max-w-4xl w-full', modal_div_pos)
    if card_pos != -1 and card_pos < modal_div_pos + 300:
        text = text[:card_pos] + text[card_pos:].replace('class="modern-card max-w-4xl w-full', 'class="modern-card max-w-4xl w-full min-w-0', 1)
        print("Added min-w-0 to modal card!")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated index.html successfully!")
