# -*- coding: utf-8 -*-
"""
Applies CEMADEN Riscos Geo-hidrológicos to index.html:
1. Anchor sub-navigation pills at top of view-tab-alertas
2. Dedicated section #section-cemaden-riscos with 4 tabs right after #section-alertas-oficiais
3. Bump cache busters to styles.css?v=105 and app.js?v=133
"""
from pathlib import Path

index_path = Path("index.html")
content = index_path.read_text(encoding="utf-8")

# 1. Add sub-navigation pills right before section-alertas-oficiais
subnav_pills = '''    <!-- Navegação Rápida entre os Módulos da Aba Alertas -->
    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
      <a href="#section-alertas-oficiais" class="px-3.5 py-1.5 rounded-full text-xs font-bold transition text-black bg-[#ffebe4] border border-[#f07a53] shadow-2xs whitespace-nowrap flex items-center gap-1.5 shrink-0 hover:bg-[#ffd9cc]">
        <i data-lucide="shield-alert" class="w-3.5 h-3.5 text-black"></i>
        <span>Alertas Oficiais (INMET & Marinha)</span>
      </a>
      <a href="#section-cemaden-riscos" class="px-3.5 py-1.5 rounded-full text-xs font-bold transition text-black bg-[#fef3c7] border border-[#d97706] hover:bg-[#fde68a] shadow-2xs whitespace-nowrap flex items-center gap-1.5 shrink-0">
        <i data-lucide="mountain-snow" class="w-3.5 h-3.5 text-black"></i>
        <span>Riscos Geo-Hidrológicos (CEMADEN)</span>
        <span class="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-black">ALERTA RJ</span>
      </a>
      <a href="#section-cptec-probabilistica" class="px-3.5 py-1.5 rounded-full text-xs font-bold transition text-black bg-white hover:bg-slate-100 border border-[#cbd5e1] shadow-2xs whitespace-nowrap flex items-center gap-1.5 shrink-0">
        <i data-lucide="cloud-lightning" class="w-3.5 h-3.5 text-black"></i>
        <span>Previsão Probabilística (CPTEC)</span>
      </a>
      <a href="#section-panorama-sinotico" class="px-3.5 py-1.5 rounded-full text-xs font-bold transition text-black bg-white hover:bg-slate-100 border border-[#cbd5e1] shadow-2xs whitespace-nowrap flex items-center gap-1.5 shrink-0">
        <i data-lucide="compass" class="w-3.5 h-3.5 text-black"></i>
        <span>Panorama Sinótico</span>
      </a>
    </div>

'''

if "section-cemaden-riscos" not in content:
    target_section_alertas = '<section id="section-alertas-oficiais" class="w-full">'
    if target_section_alertas in content:
        content = content.replace(target_section_alertas, subnav_pills + target_section_alertas)
        print("Added sub-navigation pills before section-alertas-oficiais.")
    else:
        print("Warning: target_section_alertas not found.")

# 2. Add section-cemaden-riscos right after </section> of section-alertas-oficiais
cemaden_section_html = '''

    <!-- ========================================================================= -->
    <!-- PREVISÃO DE RISCOS GEO-HIDROLÓGICOS (CEMADEN / MCTI) -->
    <!-- ========================================================================= -->
    <section id="section-cemaden-riscos" class="w-full">
      <div class="modern-card p-5 sm:p-6 bg-white dark:bg-[#0d1527] border border-[#cbd5e1] dark:border-slate-800 space-y-4 shadow-sm">
        
        <!-- Cabeçalho do Bloco CEMADEN -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#cbd5e1] dark:border-slate-800 pb-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="medallion-title-orange w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-black">
              <i data-lucide="mountain-snow" class="w-4 h-4 text-black"></i>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm sm:text-base font-black text-black dark:text-white tracking-tight font-heading">
                  Riscos Geo-Hidrológicos Oficiais (CEMADEN / MCTI)
                </h3>
                <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700">
                  Alerta no RJ Vigente
                </span>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  Boletim 26/10/2026
                </span>
              </div>
              <p class="text-xs font-semibold text-black dark:text-slate-300 mt-0.5">
                Monitoramento nacional de desastres naturais: deslizamentos de encostas e inundações para o Estado do Rio de Janeiro e Rio das Ostras
              </p>
            </div>
          </div>
          
          <a href="https://www.gov.br/cemaden/pt-br/assuntos/riscos-geo-hidrologicos" target="_blank" rel="noopener noreferrer" class="self-start sm:self-center px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition flex items-center gap-1.5 shrink-0 shadow-2xs">
            <span>Portal Oficial CEMADEN</span>
            <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
          </a>
        </div>

        <!-- Seletor de Abas Internas do CEMADEN -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#f5efe8]/80 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-[#b8a99a]/50 dark:border-slate-800 text-center" role="tablist">
          <button type="button" id="cemaden-tab-btn-rj" onclick="switchCemadenTab('rj')" class="cemaden-tab-btn active flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-black transition cursor-pointer bg-[#fef3c7] border-2 border-[#d97706] text-black shadow-xs" role="tab" aria-selected="true">
            <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-black"></i>
            <span>Alertas RJ & Rio das Ostras</span>
          </button>
          <button type="button" id="cemaden-tab-btn-geo" onclick="switchCemadenTab('geo')" class="cemaden-tab-btn flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-bold transition text-black dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 border-2 border-transparent cursor-pointer" role="tab" aria-selected="false">
            <i data-lucide="mountain" class="w-3.5 h-3.5 text-black dark:text-slate-300"></i>
            <span>Risco Geológico</span>
          </button>
          <button type="button" id="cemaden-tab-btn-hidro" onclick="switchCemadenTab('hidro')" class="cemaden-tab-btn flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-bold transition text-black dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 border-2 border-transparent cursor-pointer" role="tab" aria-selected="false">
            <i data-lucide="droplets" class="w-3.5 h-3.5 text-black dark:text-slate-300"></i>
            <span>Risco Hidrológico</span>
          </button>
          <button type="button" id="cemaden-tab-btn-mapas" onclick="switchCemadenTab('mapas')" class="cemaden-tab-btn flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-bold transition text-black dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 border-2 border-transparent cursor-pointer" role="tab" aria-selected="false">
            <i data-lucide="map" class="w-3.5 h-3.5 text-black dark:text-slate-300"></i>
            <span>Mapas Oficiais</span>
          </button>
        </div>

        <!-- PAINEL 1: ALERTAS RJ & RIO DAS OSTRAS (DESTAQUE PRINCIPAL) -->
        <div id="cemaden-panel-rj" class="space-y-4">
          <!-- Card de Destaque Oficial: Risco Geológico no RJ -->
          <div class="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800/80 space-y-3 shadow-xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 dark:border-amber-800/60 pb-2.5">
              <div class="flex items-center gap-2">
                <span class="inline-block w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
                <span class="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                  Alerta Oficial Vigente • Risco Geológico Moderado no RJ
                </span>
              </div>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 uppercase">
                Movimentos de Massa / Deslizamentos
              </span>
            </div>

            <div class="text-xs text-black dark:text-slate-200 leading-relaxed font-medium space-y-2">
              <p class="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 italic">
                "Considera-se <strong>MODERADA</strong> a possibilidade de ocorrência de eventos de movimentos de massa nas Regiões Geográficas Intermediárias de <strong>Rio de Janeiro (RJ)</strong>; São Paulo e São José dos Campos (SP), devido à presença de áreas com alta suscetibilidade a estes processos, aos acumulados registrados nos últimos dias e à previsão de chuvas que podem deflagrar deslizamentos pontuais em encostas."
                <span class="block text-[10px] text-[#64748b] dark:text-slate-400 not-italic mt-1">— Boletim Técnico Diário CEMADEN / MCTI</span>
              </p>

              <!-- Setores Locais de Atenção Geológica em Rio das Ostras -->
              <div class="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <strong class="text-xs font-black text-black dark:text-white block flex items-center gap-1.5">
                  <i data-lucide="map-pin" class="w-3.5 h-3.5 text-amber-600"></i>
                  Setores Mapeados com Atenção Geológica em Rio das Ostras:
                </strong>
                <ul class="text-[11px] text-black dark:text-slate-300 space-y-1.5 pl-1">
                  <li class="flex items-start gap-1.5">
                    <span class="text-amber-600 font-bold">•</span>
                    <span><strong>Costões Rochosos & Encostas Costeiras:</strong> Praia da Joana, Costazul, Praiamar e Mirante da Baleia — atenção ao risco de rolamento de blocos rochosos e descalçamento superficial por intemperismo e ondas.</span>
                  </li>
                  <li class="flex items-start gap-1.5">
                    <span class="text-amber-600 font-bold">•</span>
                    <span><strong>Taludes de Rodovia e Aterro:</strong> Margens da Rodovia Amaral Peixoto (RJ-106) e vias de corte íngreme com solo exposto nos bairros Cantagalo, Rocha Leão e Nova Cidade.</span>
                  </li>
                  <li class="flex items-start gap-1.5">
                    <span class="text-amber-600 font-bold">•</span>
                    <span><strong>Áreas Periurbanas de Encosta:</strong> Setores com declividade acentuada em Mar do Norte onde intervenções antrópicas (cortes e aterros) elevam a suscetibilidade a escorregamentos.</span>
                  </li>
                </ul>
              </div>

              <!-- Recomendações Preventivas -->
              <div class="p-2.5 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800 text-[11px] text-amber-950 dark:text-amber-200">
                <strong>Orientações de Segurança:</strong> Em caso de aparecimento de trincas em paredes ou no solo, inclinação de postes/árvores ou estalos na encosta, saia imediatamente do imóvel e acione a Defesa Civil Municipal pelo telefone <strong>199</strong> ou Bombeiros <strong>193</strong>.
              </div>
            </div>
          </div>

          <!-- Card de Cenário Hidrológico em Rio das Ostras -->
          <div class="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/70 space-y-2.5 shadow-2xs">
            <div class="flex items-center justify-between border-b border-sky-200 dark:border-sky-800/60 pb-2">
              <strong class="text-xs font-black text-sky-950 dark:text-sky-200 flex items-center gap-1.5">
                <i data-lucide="droplet" class="w-3.5 h-3.5 text-sky-600"></i>
                Cenário Hidrológico Municipal (Rio Jundiá & Drenagem Urbana)
              </strong>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200">
                Atenção Local
              </span>
            </div>
            <p class="text-[11px] text-black dark:text-slate-300 leading-relaxed font-medium">
              O boletim nacional do CEMADEN não indica risco de inundações de grande porte em bacias regionais do RJ. No entanto, em âmbito local, mantém-se a <strong>atenção hidrológica contínua</strong> para enxurradas rápidas e alagamentos urbanos em caso de tempestades com pancadas de chuva de até 30 mm/h. Os bairros com maior suscetibilidade por drenagem lenta incluem <strong>Cidade Beira-Mar, Âncora, Recanto, Nova Aliança e Periperi</strong>. O Rio Jundiá (INEA estação 2241036) opera em cota regular (1,84 m).
            </p>
          </div>
        </div>

        <!-- PAINEL 2: RISCO GEOLÓGICO COMPLETO -->
        <div id="cemaden-panel-geo" class="space-y-4 hidden">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-black dark:text-white">Mapa Nacional de Risco Geológico (CEMADEN)</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">Figura 2</span>
              </div>
              <p class="text-xs text-black dark:text-slate-300 leading-relaxed">
                O mapa do CEMADEN destaca o <strong>Estado do Rio de Janeiro em nível Moderado (Amarelo)</strong> para movimentos de massa, integrando áreas com alta suscetibilidade, histórico de ocorrências e acumulados antecedentes combinados à previsão de chuva.
              </p>
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-black dark:text-white">Escala Oficial de Risco CEMADEN:</span>
                  <span class="text-[10px] text-slate-500">Metodologia MCTI</span>
                </div>
                <div class="grid grid-cols-4 gap-1 text-center font-bold text-[10px]">
                  <div class="p-1 rounded bg-[#bbf7d0] text-emerald-900">Baixo</div>
                  <div class="p-1 rounded bg-[#fef08a] text-amber-950 border-2 border-amber-500">Moderado ★</div>
                  <div class="p-1 rounded bg-[#fed7aa] text-orange-950">Alto</div>
                  <div class="p-1 rounded bg-[#fecaca] text-rose-950">Muito Alto</div>
                </div>
              </div>
            </div>
            <div class="rounded-xl overflow-hidden border border-[#cbd5e1] dark:border-slate-800 bg-slate-50 flex items-center justify-center p-2">
              <img src="img/cemaden/cemaden_risco_geologico.png" alt="Mapa de Risco Geológico CEMADEN" class="w-full max-h-[380px] object-contain rounded-lg">
            </div>
          </div>
        </div>

        <!-- PAINEL 3: RISCO HIDROLÓGICO COMPLETO -->
        <div id="cemaden-panel-hidro" class="space-y-4 hidden">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-black dark:text-white">Mapa Nacional de Risco Hidrológico (CEMADEN)</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 font-bold">Figura 1</span>
              </div>
              <p class="text-xs text-black dark:text-slate-300 leading-relaxed">
                Mapeamento das possibilidades de ocorrência de eventos hidrológicos de grande magnitude (inundações graduais, enxurradas bruscas e alagamentos). No Estado do Rio de Janeiro, o cenário estadual geral permanece em nível regular, enquanto municípios vizinhos em MG e ES operam em nível moderado.
              </p>
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                <strong class="font-bold text-black dark:text-white block">Estações Pluviométricas CEMADEN no Município:</strong>
                <span class="text-[#64748b] dark:text-slate-400 block">• PCD 18789 — Palmital / Rio das Ostras</span>
                <span class="text-[#64748b] dark:text-slate-400 block">• PCD Cantagalo • PCD Cidade Praiana • PCD Rocha Leão</span>
              </div>
            </div>
            <div class="rounded-xl overflow-hidden border border-[#cbd5e1] dark:border-slate-800 bg-slate-50 flex items-center justify-center p-2">
              <img src="img/cemaden/cemaden_risco_hidrologico.png" alt="Mapa de Risco Hidrológico CEMADEN" class="w-full max-h-[380px] object-contain rounded-lg">
            </div>
          </div>
        </div>

        <!-- PAINEL 4: MAPAS OFICIAIS LADO A LADO -->
        <div id="cemaden-panel-mapas" class="space-y-4 hidden">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <strong class="text-xs font-black text-black dark:text-white">Figura 1 — Risco Hidrológico Nacional</strong>
                <span class="text-[10px] font-bold text-slate-500">CEMADEN</span>
              </div>
              <img src="img/cemaden/cemaden_risco_hidrologico.png" alt="Risco Hidrológico CEMADEN" class="w-full max-h-[340px] object-contain rounded-lg bg-white">
            </div>
            <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <strong class="text-xs font-black text-black dark:text-white">Figura 2 — Risco Geológico Nacional</strong>
                <span class="text-[10px] font-bold text-amber-600">Alerta no RJ</span>
              </div>
              <img src="img/cemaden/cemaden_risco_geologico.png" alt="Risco Geológico CEMADEN" class="w-full max-h-[340px] object-contain rounded-lg bg-white">
            </div>
          </div>
        </div>

      </div>
    </section>
'''

if "id=\"section-cemaden-riscos\"" not in content:
    target_alertas_end = '</section>\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n    <!-- ========================================================================= -->\n    <!-- PREVISÃO PROBABILÍSTICA CPTEC/INPE: CHUVA INTENSA & TEMPO SEVERO (24H/48H) -->'
    idx_target = content.find('<!-- PREVISÃO PROBABILÍSTICA CPTEC/INPE')
    if idx_target != -1:
        # Find closing </section> before idx_target
        idx_prev_sec = content.rfind('</section>', 0, idx_target)
        if idx_prev_sec != -1:
            idx_insert = idx_prev_sec + len('</section>')
            content = content[:idx_insert] + cemaden_section_html + content[idx_insert:]
            print("Successfully inserted section-cemaden-riscos.")
        else:
            print("Warning: could not locate </section> before cptec-probabilistica.")
    else:
        print("Warning: cptec-probabilistica header not found.")
else:
    print("section-cemaden-riscos already present.")

# 3. Bump cache busters
content = content.replace('css/styles.css?v=104', 'css/styles.css?v=105')
content = content.replace('js/app.js?v=132', 'js/app.js?v=133')

index_path.write_text(content, encoding="utf-8")
print("Saved updated index.html.")
