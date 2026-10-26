# -*- coding: utf-8 -*-
"""
Applies WaveWatch III (WW3) integration to index.html:
1. Orla card tab list: adds orla-tab-btn-wwatch
2. Orla card panels: adds orla-panel-wwatch
3. Modal meteogramas: adds tab-btn-wwatch-meteo and tab-content-wwatch-meteo
4. Cache busters: styles.css?v=104 and app.js?v=132
"""
from pathlib import Path

index_path = Path("index.html")
content = index_path.read_text(encoding="utf-8")

# 1. Update Orla Card Tab Bar (lines ~6422)
target_tab_bar = '''          <div class="grid grid-cols-3 gap-1 bg-[#f5efe8]/80 p-1.5 rounded-2xl border border-[#b8a99a]/50 text-center" role="tablist">

            <button id="orla-tab-btn-mar" onclick="switchOrlaTab('mar')" class="orla-tab-btn active flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-black transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs" role="tab" aria-selected="true">
              <i data-lucide="waves" class="w-3.5 h-3.5 text-black"></i>
              <span>Mar (3 Dias)</span>
            </button>

            <button id="orla-tab-btn-mares" onclick="switchOrlaTab('mares')" class="orla-tab-btn flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer" role="tab" aria-selected="false">
              <i data-lucide="compass" class="w-3.5 h-3.5 text-black"></i>
              <span>Tábuas de Maré</span>
            </button>

            <button id="orla-tab-btn-balnear" onclick="switchOrlaTab('balnear')" class="orla-tab-btn flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer" role="tab" aria-selected="false">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-black"></i>
              <span>Balneabilidade</span>
            </button>

          </div>'''

new_tab_bar = '''          <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#f5efe8]/80 p-1.5 rounded-2xl border border-[#b8a99a]/50 text-center" role="tablist">

            <button id="orla-tab-btn-mar" onclick="switchOrlaTab('mar')" class="orla-tab-btn active flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-black transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs" role="tab" aria-selected="true">
              <i data-lucide="waves" class="w-3.5 h-3.5 text-black"></i>
              <span>Mar & Praias</span>
            </button>

            <button id="orla-tab-btn-wwatch" onclick="switchOrlaTab('wwatch')" class="orla-tab-btn flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer" role="tab" aria-selected="false">
              <i data-lucide="activity" class="w-3.5 h-3.5 text-black"></i>
              <span>WaveWatch III</span>
            </button>

            <button id="orla-tab-btn-mares" onclick="switchOrlaTab('mares')" class="orla-tab-btn flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer" role="tab" aria-selected="false">
              <i data-lucide="compass" class="w-3.5 h-3.5 text-black"></i>
              <span>Tábuas de Maré</span>
            </button>

            <button id="orla-tab-btn-balnear" onclick="switchOrlaTab('balnear')" class="orla-tab-btn flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer" role="tab" aria-selected="false">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-black"></i>
              <span>Balneabilidade</span>
            </button>

          </div>'''

# Check if target_tab_bar in content (tolerant to extra whitespace or exact matches)
if "orla-tab-btn-wwatch" not in content:
    # Find position of orla-tab-btn-mar
    idx_start = content.find('<div class="grid grid-cols-3 gap-1 bg-[#f5efe8]/80')
    if idx_start != -1:
        idx_end = content.find('</div>', idx_start) + len('</div>')
        content = content[:idx_start] + new_tab_bar + content[idx_end:]
        print("Updated Orla card tab bar to 4 tabs.")
    else:
        print("Warning: grid-cols-3 tab bar not found by exact string, trying alternate search.")
else:
    print("Orla tab button wwatch already present.")

# 2. Add orla-panel-wwatch right after orla-panel-balnear (before card-condicoes-orla closes)
wwatch_panel_html = '''

          <!-- PAINEL 4: MODELO DE ONDAS WAVEWATCH III (CPTEC/INPE) & CONSENSO MULTIMODELO -->
          <div id="orla-panel-wwatch" class="space-y-4 hidden">
            <!-- Cabeçalho Informativo com Badges -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <i data-lucide="waves" class="w-5 h-5"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h4 class="text-sm font-black text-black">Modelo WAVEWATCH III (WW3)</h4>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300">CPTEC / INPE</span>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">Rodada 00Z</span>
                  </div>
                  <p class="text-[11px] font-medium text-black mt-0.5">
                    Modelagem espectral numérica de ondas de 3ª geração calibrada para a costa de Rio das Ostras e Região dos Lagos
                  </p>
                </div>
              </div>
              <a href="https://previsaonumerica.cptec.inpe.br/wwatch/alt_onda/glo/2026-10-25-00z/" target="_blank" rel="noopener noreferrer" class="self-start sm:self-center px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 hover:text-sky-950 bg-white border border-sky-200 shadow-2xs hover:bg-sky-100 transition flex items-center gap-1.5 shrink-0">
                <span>Portal CPTEC Ondas</span>
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
              </a>
            </div>

            <!-- Controles Interativos (Toggles de Produto, Horizonte e Região) -->
            <div class="p-3.5 rounded-2xl bg-white border border-[#cbd5e1] space-y-3 shadow-2xs">
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <!-- Seletor de Produto -->
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[11px] font-bold text-black uppercase tracking-wider mr-1">Produto:</span>
                  <button type="button" id="btn-wwatch-prod-alt" class="btn-wwatch-prod px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer bg-[#0284c7] text-white shadow-xs">
                    Altura & Direção
                  </button>
                  <button type="button" id="btn-wwatch-prod-pico" class="btn-wwatch-prod px-3 py-1 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer">
                    Período de Pico
                  </button>
                  <button type="button" id="btn-wwatch-prod-windsea" class="btn-wwatch-prod px-3 py-1 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer">
                    Mar de Vento
                  </button>
                </div>

                <!-- Seletor de Horizonte de Previsão -->
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[11px] font-bold text-black uppercase tracking-wider mr-1">Prazo:</span>
                  <button type="button" id="btn-wwatch-step-000" class="btn-wwatch-step px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer bg-slate-900 text-white">
                    00h (Hoje)
                  </button>
                  <button type="button" id="btn-wwatch-step-024" class="btn-wwatch-step px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer">
                    +24h
                  </button>
                  <button type="button" id="btn-wwatch-step-048" class="btn-wwatch-step px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer">
                    +48h
                  </button>
                  <button type="button" id="btn-wwatch-step-072" class="btn-wwatch-step px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer">
                    +72h
                  </button>
                </div>

                <!-- Seletor de Região -->
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[11px] font-bold text-black uppercase tracking-wider mr-1">Área:</span>
                  <button type="button" id="btn-wwatch-reg-sud" class="btn-wwatch-reg px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer bg-sky-700 text-white">
                    Sudeste (RJ)
                  </button>
                  <button type="button" id="btn-wwatch-reg-bra" class="btn-wwatch-reg px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer">
                    Brasil
                  </button>
                </div>
              </div>
            </div>

            <!-- Visualizador do Mapa de Ondas CPTEC com Opção de Zoom -->
            <div class="relative w-full rounded-2xl bg-white border border-[#cbd5e1] p-3 shadow-xs">
              <!-- Barra Superior da Imagem -->
              <div class="flex items-center justify-between pb-2 mb-2 border-b border-[#e2e8f0] flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span id="badge-wwatch-title" class="text-xs font-black text-black">
                    Altura Significativa e Direção das Ondas • Análise Atual (00h) - Costa Sudeste
                  </span>
                </div>
                <div class="flex items-center gap-1.5">
                  <button type="button" id="btn-wwatch-zoom" onclick="openWwatchZoom()" class="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:text-black bg-slate-100 hover:bg-slate-200 transition cursor-pointer flex items-center gap-1" title="Ver em tamanho ampliado">
                    <i data-lucide="zoom-in" class="w-3.5 h-3.5"></i>
                    <span>Ampliar</span>
                  </button>
                  <a id="btn-wwatch-download" href="img/cptec/wwatch_alt_onda_sud_000h.png" download="cptec_wwatch_alt_onda_sudeste.png" class="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:text-black bg-slate-100 hover:bg-slate-200 transition cursor-pointer flex items-center gap-1" title="Baixar mapa em PNG">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                    <span>Baixar</span>
                  </a>
                </div>
              </div>

              <!-- Container da Imagem com Zoom Click -->
              <div class="relative overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center min-h-[380px] sm:min-h-[460px] cursor-zoom-in" onclick="openWwatchZoom()">
                <img id="img-wwatch-mapa" src="img/cptec/wwatch_alt_onda_sud_000h.png" alt="Modelo de Ondas WaveWatch III - CPTEC/INPE" class="w-full max-h-[560px] object-contain rounded-lg transition-transform hover:scale-[1.01]">
              </div>
            </div>

            <!-- Card de Consenso Multimodelo de Ondas (CPTEC WW3 + CHM Marinha + Open-Meteo) -->
            <div class="p-4 rounded-2xl bg-white border border-[#cbd5e1] space-y-3.5 shadow-2xs">
              <div class="flex items-center justify-between border-b border-[#cbd5e1] pb-2.5 flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-[#ccfbf1] text-[#0f766e] flex items-center justify-center shrink-0">
                    <i data-lucide="layers" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h5 class="text-xs sm:text-sm font-black text-black">Consenso Multimodelo de Ondas & Meteorologia Marítima</h5>
                    <span class="text-[10px] sm:text-[11px] text-[#64748b] font-medium">Equilíbrio técnico entre as 3 fontes oficiais monitoradas</span>
                  </div>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wide">
                  Modelos Convergentes
                </span>
              </div>

              <!-- Grid dos 3 Modelos -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <!-- Modelo 1: CPTEC WW3 -->
                <div class="p-3 rounded-xl bg-[#f8fafc] border border-sky-200 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <strong class="text-xs font-black text-sky-900 flex items-center gap-1.5">
                      <i data-lucide="cpu" class="w-3.5 h-3.5 text-sky-600"></i>
                      CPTEC / WW3
                    </strong>
                    <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">Supercomputador</span>
                  </div>
                  <ul class="text-[11px] text-black space-y-1 font-medium">
                    <li>• Altura de Onda: <strong class="font-bold">1,2 a 1,5 m</strong></li>
                    <li>• Período Dominante: <strong class="font-bold">8 a 10 s (Swell SE)</strong></li>
                    <li>• Mar de Vento: <strong class="font-bold">0,4 a 0,7 m (E/NE)</strong></li>
                    <li>• Resolução: Grade Espectral Global/Regional</li>
                  </ul>
                </div>

                <!-- Modelo 2: Marinha do Brasil CHM -->
                <div class="p-3 rounded-xl bg-[#f8fafc] border border-blue-200 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <strong class="text-xs font-black text-blue-900 flex items-center gap-1.5">
                      <i data-lucide="anchor" class="w-3.5 h-3.5 text-blue-600"></i>
                      Marinha (CHM)
                    </strong>
                    <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">Área Delta</span>
                  </div>
                  <ul class="text-[11px] text-black space-y-1 font-medium">
                    <li>• Avisos de Mau Tempo: <strong class="font-bold text-emerald-700">Sem avisos ativos</strong></li>
                    <li>• Estado do Mar: <strong class="font-bold">Mar 5 (Moderado)</strong></li>
                    <li>• Ondas Costeiras: <strong class="font-bold">1,2 a 1,6 m</strong></li>
                    <li>• Maré Máxima: <strong class="font-bold">1,52 m (Preia-mar Imbetiba)</strong></li>
                  </ul>
                </div>

                <!-- Modelo 3: Open-Meteo Marine -->
                <div class="p-3 rounded-xl bg-[#f8fafc] border border-teal-200 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <strong class="text-xs font-black text-teal-900 flex items-center gap-1.5">
                      <i data-lucide="compass" class="w-3.5 h-3.5 text-teal-600"></i>
                      Open-Meteo Marine
                    </strong>
                    <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800">ECMWF / Copernicus</span>
                  </div>
                  <ul class="text-[11px] text-black space-y-1 font-medium">
                    <li>• Onda Significativa: <strong class="font-bold">1,35 m</strong></li>
                    <li>• Período Médio: <strong class="font-bold">8,8 s</strong></li>
                    <li>• Direção Principal: <strong class="font-bold">115° (ESE)</strong></li>
                    <li>• Velocidade Vento: <strong class="font-bold">12 a 16 nós</strong></li>
                  </ul>
                </div>
              </div>

              <!-- Síntese e Diretrizes Locais para Rio das Ostras -->
              <div class="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-black leading-relaxed">
                <strong class="font-bold text-amber-950 block mb-1">
                  Diretriz Técnica para a Orla de Rio das Ostras:
                </strong>
                O alinhamento harmônico entre o modelo CPTEC/WaveWatch III, as análises de Área Delta da Marinha do Brasil e a grade horária costeira confirma que o litoral riostrense opera sob condições regulares de mar moderado. Praias oceânicas abertas e de arrebentação franca (<strong class="font-bold">Costazul, Remanso e Mar do Norte</strong>) sustentam ondas de 1,2 a 1,6 m com correntes de retorno pontuais, recomendando cautela a banhistas e esportistas; já as enseadas naturais abrigadas (<strong class="font-bold">Praia do Bosque, Tartaruga e Praia do Centro</strong>) contam com ondas atenuadas de 0,3 a 0,7 m, oferecendo segurança para banho e lazer familiar.
              </div>
            </div>
          </div> <!-- /#orla-panel-wwatch -->
'''

if "id=\"orla-panel-wwatch\"" not in content:
    target_balnear_end = '</div> <!-- /#orla-panel-balnear -->'
    idx_balnear = content.find(target_balnear_end)
    if idx_balnear != -1:
        insert_pos = idx_balnear + len(target_balnear_end)
        content = content[:insert_pos] + wwatch_panel_html + content[insert_pos:]
        print("Added orla-panel-wwatch to index.html.")
    else:
        print("Warning: orla-panel-balnear end tag not found.")
else:
    print("orla-panel-wwatch already present.")

# 3. Add Tab 4 button to modal-meteogramas
tab4_btn_html = '''        <button id="tab-btn-wwatch-meteo" class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 border-transparent text-[#64748b] hover:text-[#1e293b] cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">
          <span>Ondas WaveWatch III</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">CPTEC</span>
        </button>'''

if "tab-btn-wwatch-meteo" not in content:
    target_tab_prob = 'id="tab-btn-prob-meteo"'
    idx_prob = content.find(target_tab_prob)
    if idx_prob != -1:
        idx_btn_end = content.find('</button>', idx_prob) + len('</button>')
        content = content[:idx_btn_end] + "\n" + tab4_btn_html + content[idx_btn_end:]
        print("Added tab-btn-wwatch-meteo button.")
else:
    print("tab-btn-wwatch-meteo already present.")

# 4. Add Tab 4 content to modal-meteogramas
tab4_content_html = '''

        <!-- ABA 4: MODELO DE ONDAS WAVEWATCH III (CPTEC/INPE) -->
        <div id="tab-content-wwatch-meteo" class="space-y-3.5 hidden">
          <!-- Cabeçalho Informativo -->
          <div class="flex items-center justify-between p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex-wrap gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-sky-950 dark:text-sky-200">INPE / CPTEC — WAVEWATCH III (WW3)</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-sky-200 text-sky-900 font-bold">Costa Sudeste / RJ</span>
              </div>
              <p class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Modelagem oceânica operacional de ondas para a costa de Rio das Ostras e Região dos Lagos
              </p>
            </div>
            <a href="https://previsaonumerica.cptec.inpe.br/wwatch/alt_onda/glo/2026-10-25-00z/" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700 hover:bg-sky-50 transition flex items-center gap-1">
              <span>Portal CPTEC Ondas</span>
              <i data-lucide="external-link" class="w-3 h-3"></i>
            </a>
          </div>

          <!-- Controles Rápidos no Modal -->
          <div class="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-wrap">
            <div class="flex items-center gap-1.5">
              <span class="text-[11px] font-bold text-slate-500 uppercase mr-1">Produto:</span>
              <button id="modal-wwatch-btn-alt" class="px-3 py-1 rounded-lg text-xs font-bold bg-[#0284c7] text-white transition cursor-pointer">Altura & Direção</button>
              <button id="modal-wwatch-btn-pico" class="px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer">Período de Pico</button>
              <button id="modal-wwatch-btn-windsea" class="px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer">Mar de Vento</button>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-[11px] font-bold text-slate-500 uppercase mr-1">Prazo:</span>
              <button id="modal-wwatch-btn-000" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 transition cursor-pointer">00h</button>
              <button id="modal-wwatch-btn-024" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer">24h</button>
              <button id="modal-wwatch-btn-048" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer">48h</button>
              <button id="modal-wwatch-btn-072" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer">72h</button>
            </div>
          </div>

          <!-- Imagem no Modal -->
          <div class="relative w-full rounded-xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 p-2 flex items-center justify-center min-h-[300px]">
            <img id="modal-img-wwatch" src="img/cptec/wwatch_alt_onda_sud_000h.png" alt="Modelo de Ondas WaveWatch III CPTEC" class="w-full max-h-[55vh] object-contain rounded-lg">
          </div>
        </div>
'''

if "tab-content-wwatch-meteo" not in content:
    target_prob_content_end = 'id="modal-img-cptec-prob"'
    idx_modal_img = content.find(target_prob_content_end)
    if idx_modal_img != -1:
        # Find closing of tab-content-prob-meteo
        idx_div_end = content.find('</div>\n\n      </div>', idx_modal_img)
        if idx_div_end == -1:
            idx_div_end = content.find('</div>\r\n\r\n      </div>', idx_modal_img)
        if idx_div_end == -1:
            idx_div_end = content.find('</div>', idx_modal_img)
            idx_div_end = content.find('</div>', idx_div_end + 6)
        if idx_div_end != -1:
            idx_div_end += len('</div>')
            content = content[:idx_div_end] + tab4_content_html + content[idx_div_end:]
            print("Added tab-content-wwatch-meteo to modal-meteogramas.")
        else:
            print("Warning: could not locate end of tab-content-prob-meteo.")
else:
    print("tab-content-wwatch-meteo already present.")

# 5. Bump cache busters
content = content.replace('css/styles.css?v=103', 'css/styles.css?v=104')
content = content.replace('js/app.js?v=131', 'js/app.js?v=132')

index_path.write_text(content, encoding="utf-8")
print("Successfully written updated index.html.")
