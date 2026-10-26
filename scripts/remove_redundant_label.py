# -*- coding: utf-8 -*-
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

target = """      <!-- Barra de Ordenação: Maior para Menor Volume -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 text-xs">
        <div class="flex items-center gap-2">
          <span class="font-black text-black flex items-center gap-1.5 text-xs">
            <i data-lucide="arrow-down-narrow-wide" class="w-4 h-4 text-[#ea580c]"></i>
            Classificação por Volume (Maior → Menor):
          </span>
          <span class="text-[10.5px] font-bold text-black/70 bg-[#f1f5f9] px-2 py-0.5 rounded-full border border-[#cbd5e1]">
            Distribuição Decrescente
          </span>
        </div>
        <div class="flex items-center gap-1.5" role="tablist">
          <span class="text-[11px] font-bold text-black/80">Ordenar por:</span>
          <button id="sort-btn-24h" onclick="sortStationsBy('24h')" class="px-2.5 py-1 rounded-lg text-xs font-black bg-[#ffebe4] border border-[#f07a53] text-black shadow-2xs cursor-pointer">
            24 Horas
          </button>
          <button id="sort-btn-1h" onclick="sortStationsBy('1h')" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#f1f5f9] border border-[#cbd5e1] text-black hover:bg-white cursor-pointer">
            1 Hora
          </button>
          <button id="sort-btn-96h" onclick="sortStationsBy('96h')" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#f1f5f9] border border-[#cbd5e1] text-black hover:bg-white cursor-pointer">
            96 Horas
          </button>
        </div>
      </div>"""

replacement = """      <!-- Barra de Ordenação por Período -->
      <div class="flex items-center justify-end gap-2 pt-1 text-xs">
        <div class="flex items-center gap-1.5" role="tablist">
          <span class="text-[11px] font-bold text-black/80">Ordenar por:</span>
          <button id="sort-btn-24h" onclick="sortStationsBy('24h')" class="px-2.5 py-1 rounded-lg text-xs font-black bg-[#ffebe4] border border-[#f07a53] text-black shadow-2xs cursor-pointer">
            24 Horas
          </button>
          <button id="sort-btn-1h" onclick="sortStationsBy('1h')" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#f1f5f9] border border-[#cbd5e1] text-black hover:bg-white cursor-pointer">
            1 Hora
          </button>
          <button id="sort-btn-96h" onclick="sortStationsBy('96h')" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#f1f5f9] border border-[#cbd5e1] text-black hover:bg-white cursor-pointer">
            96 Horas
          </button>
        </div>
      </div>"""

html_norm = html.replace('\r\n', '\n')
target_norm = target.replace('\r\n', '\n')

if target_norm in html_norm:
    html_norm = html_norm.replace(target_norm, replacement)
    print("Replaced ordering banner in index.html.")
else:
    print("Could not find target in index.html.")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html_norm.replace('\n', '\r\n'))

print("Updated index.html successfully.")
