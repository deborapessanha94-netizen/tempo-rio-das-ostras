import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<!-- Visualizador Interativo com Zoom & Pan do Meteograma -->'
end_marker = '</div>\n\n\n\n        </div>\n\n\n\n\n\n\n\n        <!-- Conteúdo Aba 2: CPTEC Multimodel -->'

start_pos = content.find(start_marker)
end_pos = content.find(end_marker, start_pos)

if start_pos == -1 or end_pos == -1:
    # Try finding without trailing comments
    start_pos = content.find('id="meteo-zoom-container-inmet"')
    start_pos = content.rfind('\n', 0, start_pos)
    end_pos = content.find('<!-- Conteúdo Aba 2: CPTEC Multimodel -->')
    end_pos = content.rfind('</div>', 0, end_pos)
    print("Fallback markers:", start_pos, end_pos)

print("Block found between:", start_pos, end_pos)
print("Preview old block:\n", repr(content[start_pos:start_pos+120]))

new_block = '''<!-- Barra de Controles de Zoom & Interação -->
          <div id="meteo-zoom-toolbar" class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 text-xs shadow-2xs">
            <div class="flex items-center gap-1.5 text-[11px] text-[#334155] dark:text-slate-300 font-medium">
              <i data-lucide="zoom-in" class="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0"></i>
              <span class="hidden sm:inline">Use o scroll ou arraste para mover &bull;</span>
              <span>Toque duplo amplia (1x &harr; 2.2x)</span>
            </div>
            <div class="flex items-center gap-1 ml-auto">
              <button type="button" id="meteo-btn-zoom-out" class="p-1 rounded-lg text-[#334155] dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 active:scale-95 transition cursor-pointer" title="Diminuir Zoom (-)" aria-label="Diminuir Zoom">
                <i data-lucide="zoom-out" class="w-4 h-4"></i>
              </button>
              <button type="button" id="meteo-btn-zoom-reset" class="px-2.5 py-1 text-xs font-bold text-[#0f172a] dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-[#cbd5e1] dark:border-slate-700 rounded-lg shadow-2xs active:scale-95 transition cursor-pointer min-w-[50px] text-center" title="Redefinir Zoom (100%)">
                <span id="meteo-zoom-badge">100%</span>
              </button>
              <button type="button" id="meteo-btn-zoom-in" class="p-1 rounded-lg text-[#334155] dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 active:scale-95 transition cursor-pointer" title="Aumentar Zoom (+)" aria-label="Aumentar Zoom">
                <i data-lucide="zoom-in" class="w-4 h-4"></i>
              </button>
              <div class="w-px h-4 bg-[#cbd5e1] dark:bg-slate-700 mx-0.5"></div>
              <button type="button" id="meteo-btn-zoom-expand" class="p-1 rounded-lg text-[#334155] dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 active:scale-95 transition cursor-pointer" title="Abrir Imagem em Alta Resolução em Nova Guia" aria-label="Abrir Imagem em Nova Guia">
                <i data-lucide="maximize-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- Viewport do Gráfico com Pan e Zoom -->
          <div id="meteo-zoom-container-inmet" class="relative rounded-2xl border border-[#cbd5e1] dark:border-slate-800 overflow-hidden bg-[#f8fafc] dark:bg-slate-950/80 shadow-xs select-none">
            <div id="meteo-zoom-viewport" class="w-full h-[62vh] min-h-[400px] max-h-[640px] overflow-hidden flex items-center justify-center relative cursor-zoom-in touch-none">
              <div id="meteo-panzoom-stage" class="w-full h-full flex items-center justify-center origin-center will-change-transform" style="transform: translate(0px, 0px) scale(1);">
                <img id="modal-img-meteograma-inmet" src="img/meteograma_inmet.png" alt="Meteograma Oficial INMET Rio das Ostras" class="max-w-full max-h-full object-contain pointer-events-none select-none rounded-lg shadow-xs" onerror="this.src=\'https://meteograma.inmet.gov.br/3304524/dinamico\'">
              </div>
            </div>
          </div>
'''

content = content[:start_pos] + new_block + content[end_pos:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated index.html with top zoom toolbar successfully!")
