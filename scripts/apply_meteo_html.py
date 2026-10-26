import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Target block around modal-img-meteograma-inmet
old_block_snippet = '<img id="modal-img-meteograma-inmet" src="img/meteograma_inmet.png" alt="Meteograma Oficial INMET Rio das Ostras" class="w-full h-auto rounded-lg mx-auto max-h-[60vh] object-contain" onerror="this.src=\'https://meteograma.inmet.gov.br/3304524/dinamico\'">'

if old_block_snippet not in content:
    print("ERROR: old_block_snippet not found in index.html!")
    sys.exit(1)

# Find the parent div of old_block_snippet
pos = content.find(old_block_snippet)
# Search backward for '<div class="rounded-xl border border-[#e2e8f0]'
parent_start = content.rfind('<div class="rounded-xl border border-[#e2e8f0]', 0, pos)
# Search forward for '</div>' after pos
parent_end = content.find('</div>', pos) + len('</div>')

old_parent_div = content[parent_start:parent_end]
print("Found old container:", repr(old_parent_div[:80]), "...", repr(old_parent_div[-30:]))

new_container = '''<!-- Visualizador Interativo com Zoom & Pan do Meteograma -->
          <div id="meteo-zoom-container-inmet" class="relative rounded-2xl border border-[#cbd5e1] dark:border-slate-800 overflow-hidden bg-[#f8fafc] dark:bg-slate-950/80 shadow-xs select-none">
            
            <!-- Barra de Ferramentas Flutuante de Zoom -->
            <div id="meteo-zoom-toolbar" class="absolute top-3 right-3 z-30 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-xl border border-[#cbd5e1] dark:border-slate-700 shadow-md">
              <button type="button" id="meteo-btn-zoom-in" class="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer" title="Aumentar Zoom (+)" aria-label="Aumentar Zoom">
                <i data-lucide="zoom-in" class="w-4 h-4"></i>
              </button>
              <button type="button" id="meteo-btn-zoom-out" class="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer" title="Diminuir Zoom (-)" aria-label="Diminuir Zoom">
                <i data-lucide="zoom-out" class="w-4 h-4"></i>
              </button>
              <button type="button" id="meteo-btn-zoom-reset" class="px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg active:scale-95 transition-all cursor-pointer min-w-[50px] text-center" title="Redefinir Zoom (100%)">
                <span id="meteo-zoom-badge">100%</span>
              </button>
              <div class="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>
              <button type="button" id="meteo-btn-zoom-expand" class="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer" title="Visualizar Imagem Completa em Nova Guia" aria-label="Visualizar Imagem Completa">
                <i data-lucide="maximize-2" class="w-4 h-4"></i>
              </button>
            </div>

            <!-- Dica Visual de Interação -->
            <div id="meteo-zoom-hint" class="absolute bottom-2.5 left-3 z-20 pointer-events-none hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xs px-2.5 py-1 rounded-md border border-black/5 dark:border-white/10 shadow-xs">
              <i data-lucide="mouse-pointer" class="w-3.5 h-3.5 text-blue-500"></i>
              <span>Scroll para zoom &bull; Clique e arraste para mover &bull; Toque duplo para ampliar</span>
            </div>

            <!-- Viewport Interativo -->
            <div id="meteo-zoom-viewport" class="w-full h-[62vh] min-h-[400px] max-h-[640px] overflow-hidden flex items-center justify-center relative cursor-zoom-in touch-none">
              <div id="meteo-panzoom-stage" class="w-full h-full flex items-center justify-center origin-center will-change-transform" style="transform: translate(0px, 0px) scale(1);">
                <img id="modal-img-meteograma-inmet" src="img/meteograma_inmet.png" alt="Meteograma Oficial INMET Rio das Ostras" class="max-w-full max-h-full object-contain pointer-events-none select-none rounded-lg shadow-xs" onerror="this.src=\'https://meteograma.inmet.gov.br/3304524/dinamico\'">
              </div>
            </div>

          </div>'''

content = content[:parent_start] + new_container + content[parent_end:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("index.html updated successfully!")
