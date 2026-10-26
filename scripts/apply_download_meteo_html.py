import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<div id="tab-content-inmet-meteo"'
end_marker = '<!-- Viewport do Gráfico com Pan e Zoom -->'

start_pos = content.find(start_marker)
end_pos = content.find(end_marker, start_pos)

if start_pos == -1 or end_pos == -1:
    print("ERROR: Markers not found!")
    sys.exit(1)

new_block = '''<div id="tab-content-inmet-meteo" class="space-y-3 sm:space-y-4">

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#f8fafc] dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 text-xs">
            <div>
              <strong class="text-[#1e293b] dark:text-slate-100 font-semibold block">Meteograma Numérico Oficial do INMET — Rio das Ostras</strong>
              <span class="text-[#64748b] dark:text-slate-400">Modelagem COSMO (7x7 km): Pressão, Temperatura (2m), Umidade Relativa, Ventos e Chuva horária.</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button type="button" id="meteo-btn-download-top" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer" title="Baixar Meteograma Oficial em Alta Resolução (PNG)">
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
                <span>Baixar Meteograma</span>
              </button>
              <span class="text-slate-300 dark:text-slate-700">|</span>
              <a href="https://meteograma.inmet.gov.br/3304524/dinamico" target="_blank" rel="noopener noreferrer" class="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1">
                <span>Abrir no Portal INMET ↗</span>
              </a>
            </div>
          </div>

          <!-- Barra de Controles: Rodadas, Download & Zoom -->
          <div id="meteo-zoom-toolbar" class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 text-xs shadow-2xs">
            <!-- Alternador de Rodadas Oficiais do INMET -->
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rodada:</span>
              <div class="inline-flex rounded-lg p-0.5 bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                <button type="button" id="meteo-rodada-00" class="px-2 py-0.5 text-xs font-bold rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs cursor-pointer transition" title="Rodada 00:00 UTC (Previsão Completa de 7 Dias)">
                  00 UTC (7 Dias)
                </button>
                <button type="button" id="meteo-rodada-12" class="px-2 py-0.5 text-xs font-semibold rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition" title="Rodada 12:00 UTC (Curto Prazo)">
                  12 UTC
                </button>
              </div>
            </div>

            <!-- Botões de Ação: Baixar PNG & Ferramentas de Zoom -->
            <div class="flex items-center gap-1.5 ml-auto shrink-0">
              <!-- Botão Principal de Download -->
              <button type="button" id="meteo-btn-download" class="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg shadow-xs transition cursor-pointer" title="Baixar Imagem do Meteograma em Alta Resolução (PNG)">
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
                <span>Baixar PNG</span>
              </button>

              <div class="w-px h-4 bg-[#cbd5e1] dark:bg-slate-700 mx-0.5"></div>

              <!-- Controles de Zoom -->
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
          </div>

          '''

content = content[:start_pos] + new_block + content[end_pos:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated index.html with download & rodada controls successfully!")
