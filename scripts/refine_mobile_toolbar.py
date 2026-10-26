with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Refine modal body padding
text = text.replace('class="p-5 sm:p-6 overflow-y-auto space-y-4 text-sm text-[#334155] bg-white"',
                    'class="p-3 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 text-sm text-[#334155] bg-white"')

# Refine meteo-zoom-toolbar
old_toolbar = '''<!-- Barra de Controles de Zoom & Interação -->
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
          </div>'''

new_toolbar = '''<!-- Barra de Controles de Zoom & Interação -->
          <div id="meteo-zoom-toolbar" class="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 text-xs shadow-2xs">
            <div class="flex items-center gap-1.5 text-[11px] text-[#334155] dark:text-slate-300 font-medium truncate min-w-0">
              <i data-lucide="zoom-in" class="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0"></i>
              <span class="hidden sm:inline">Scroll ou arraste para mover &bull;</span>
              <span class="truncate">Toque duplo amplia</span>
            </div>
            <div class="flex items-center gap-1 shrink-0 ml-auto">
              <button type="button" id="meteo-btn-zoom-out" class="p-1 rounded-lg text-[#334155] dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 active:scale-95 transition cursor-pointer" title="Diminuir Zoom (-)" aria-label="Diminuir Zoom">
                <i data-lucide="zoom-out" class="w-3.5 h-3.5"></i>
              </button>
              <button type="button" id="meteo-btn-zoom-reset" class="px-2 py-0.5 text-[11px] font-bold text-[#0f172a] dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-[#cbd5e1] dark:border-slate-700 rounded-lg shadow-2xs active:scale-95 transition cursor-pointer min-w-[44px] text-center" title="Redefinir Zoom (100%)">
                <span id="meteo-zoom-badge">100%</span>
              </button>
              <button type="button" id="meteo-btn-zoom-in" class="p-1 rounded-lg text-[#334155] dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 active:scale-95 transition cursor-pointer" title="Aumentar Zoom (+)" aria-label="Aumentar Zoom">
                <i data-lucide="zoom-in" class="w-3.5 h-3.5"></i>
              </button>
              <div class="w-px h-3.5 bg-[#cbd5e1] dark:bg-slate-700 mx-0.5"></div>
              <button type="button" id="meteo-btn-zoom-expand" class="p-1 rounded-lg text-[#334155] dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 active:scale-95 transition cursor-pointer" title="Abrir Imagem em Alta Resolução em Nova Guia" aria-label="Abrir Imagem em Nova Guia">
                <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>'''

if old_toolbar in text:
    text = text.replace(old_toolbar, new_toolbar)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Refined toolbar in index.html!")
else:
    print("Old toolbar block not found!")
