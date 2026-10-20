import os

html_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

old_section_block = """  <!-- ========================================================================= -->
  <!-- SEÇÃO DE PANORAMA SINÓTICO GERAL & ANÁLISE METEOROLÓGICA OFICIAL           -->
  <!-- ========================================================================= -->
  <section id="section-panorama-sinotico" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
    <div class="modern-card p-5 sm:p-6 bg-white border border-[#e2e8f0] space-y-4">
      
      <!-- Cabeçalho do Panorama Sinótico -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#dfb992]/15 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-zinc-100 text-[#334155] border border-[#e2e8f0] flex items-center justify-center shrink-0">
            <i data-lucide="layers" class="w-4 h-4"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-bold text-black tracking-tight font-heading">
                Panorama Sinótico Geral
              </h2>
              <span id="badge-periodo-sinotico" class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-[#f1f5f9] text-[#3d4f61] border border-[#e2e8f0]">
                20/10 a 22/10
              </span>
            </div>
            <p class="text-xs font-normal text-[#64748b] mt-0.5">
              Análise técnica da dinâmica atmosférica, bacia hidrográfica e evolução regional (Carta CHM 12Z & Modelos ECMWF/GFS)
            </p>
          </div>
        </div>

        <!-- Ações do Panorama: Recolher / Expandir -->
        <div class="flex items-center gap-2 self-start sm:self-center">
          <button id="btn-toggle-sinopse" class="p-1.5 rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-zinc-50 cursor-pointer" title="Minimizar / Expandir Panorama">
            <i data-lucide="chevron-up" id="icon-toggle-sinopse" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- Conteúdo do Panorama Sinótico: Texto Técnico Contínuo Oficial -->
      <div id="container-conteudo-sinopse">
        <div id="sinopse-texto-completo" class="p-5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] text-sm text-[#334155] leading-relaxed space-y-3.5 text-justify font-normal shadow-xs">
          <p class="leading-relaxed text-justify">O panorama meteorológico regional sobre o município de Rio das Ostras e o litoral norte fluminense para o período de 20/10 (Terça-feira) a 22/10 (Quinta-feira) é condicionado pela atuação de uma massa de ar quente e úmida tropical, combinada à circulação de brisas marítimas e ao forte aquecimento diurno. Esse padrão termodinâmico sustenta temperaturas elevadas e favorece o desenvolvimento de instabilidades convectivas a partir da tarde, sob influência de cavados em médios níveis da atmosfera e borda oeste do anticiclone subtropical do Atlântico Sul (Carta Sinótica CHM 12Z). As temperaturas oscilam entre mínima de 20°C ao amanhecer e máxima de 24°C na terça-feira (20/10), com acumulado pluviométrico diário previsto de 2.1 mm (sem avisos meteorológicos vigentes). O gradiente térmico semanal evolui com calor persistente, alcançando pico de até 24°C na quinta-feira (22/10).</p>
          <p class="leading-relaxed text-justify">No monitoramento hidrográfico municipal, a Bacia do Rio Jundiá opera em regime de estabilidade e contínua vazante. A estação telemétrica municipal (INEA 2241036) registrou cota de 1.9 m (Status: VIGILÂNCIA), posicionando-se com margem de segurança de mais de 1 metro abaixo da cota de transbordo (2,84 m) e com capacidade de calha em 60%. Nas últimas 24 horas, a rede telemétrica não registrou precipitação significativa (0,0 mm no Jundiá), permitindo o escoamento pleno das águas pluviais nos canais de drenagem dos bairros Âncora, Nova Esperança e adjacências. Na faixa litorânea (Área Delta - Farol de São Tomé a Cabo Frio), a Marinha do Brasil não registra avisos de mau tempo vigentes, apresentando mar com ondas moderadas entre 1,2 e 1,6 m e ventos costeiros regulares com rajadas pontuais de até 45 km/h associadas às células convectivas da tarde.</p>
          <p class="leading-relaxed text-justify">Para os dias subsequentes, na quarta-feira (21/10) a aproximação de instabilidades mantém variação de nuvens com máxima de 24°C e pancadas de chuva com trovoadas (4.8 mm acumulados, sem avisos meteorológicos vigentes). Na quinta-feira (22/10), o calor persiste com máxima de 24°C e gradual diminuição de instabilidades (5.2 mm acumulados, sob Alerta Amarelo de Tempestade nº 56118 do INMET). A infraestrutura de monitoramento meteorológico opera de forma contínua 24h na nuvem, com processamento automatizado e redundante dos dados do INMET, INEA e Open-Meteo. A Subsecretaria de Defesa Civil de Rio das Ostras mantém monitoramento preventivo ininterrupto no Centro de Operações (PLANCON), com canais de emergência pelo 199 e Bombeiros 193.</p>
        </div>
      </div>

    </div>
  </section>"""

new_section_block = """  <!-- ========================================================================= -->
  <!-- SEÇÃO DE PANORAMA SINÓTICO GERAL: PADRÃO NÓRDICO CERÂMICO                 -->
  <!-- ========================================================================= -->
  <section id="section-panorama-sinotico" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
    <div class="modern-card p-5 sm:p-6 bg-white border border-[#cbd5e1] space-y-4 shadow-sm">
      
      <!-- Cabeçalho do Panorama Sinótico -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#cbd5e1] pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-[#eaf0f6] text-black border border-[#94a3b8] flex items-center justify-center shrink-0 shadow-xs">
            <i data-lucide="compass" class="w-4 h-4 text-black"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-base sm:text-lg font-bold text-black tracking-tight font-heading">
                Panorama Sinótico Geral
              </h2>
              <span id="badge-periodo-sinotico" class="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#ffebe4] text-black border border-[#f97316] shadow-2xs">
                20/10 a 22/10
              </span>
            </div>
            <p class="text-xs font-semibold text-black mt-0.5">
              Análise técnica da dinâmica atmosférica, bacia hidrográfica e evolução regional (Carta CHM 12Z & Modelos ECMWF/GFS)
            </p>
          </div>
        </div>

        <!-- Ações do Panorama: Recolher / Expandir -->
        <div class="flex items-center gap-2 self-start sm:self-center">
          <button id="btn-toggle-sinopse" class="p-1.5 rounded-full border border-[#cbd5e1] text-black hover:bg-[#f1f5f9] cursor-pointer transition shadow-2xs" title="Minimizar / Expandir Panorama">
            <i data-lucide="chevron-up" id="icon-toggle-sinopse" class="w-4 h-4 text-black"></i>
          </button>
        </div>
      </div>

      <!-- Conteúdo do Panorama Sinótico: Cartões Nórdicos Cerâmicos Estruturados -->
      <div id="container-conteudo-sinopse">
        <div id="sinopse-texto-completo" class="p-3 sm:p-4 rounded-2xl bg-[#f4f6f8] border border-[#cbd5e1] space-y-3 shadow-inner">
          
          <div class="p-4 sm:p-5 rounded-2xl bg-white border border-[#cbd5e1] shadow-2xs space-y-2.5 transition hover:border-[#94a3b8]">
            <div class="flex items-center gap-2 border-b border-[#e2e8f0] pb-2">
              <span class="text-[10.5px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#eaf0f6] text-black border border-[#94a3b8] flex items-center gap-1.5 tracking-wider">
                <i data-lucide="cloud-sun" class="w-3.5 h-3.5 text-black"></i>
                <span>Dinâmica Atmosférica & Temperatura</span>
              </span>
            </div>
            <p class="leading-relaxed text-justify text-sm text-black font-normal">O panorama meteorológico regional sobre o município de Rio das Ostras e o litoral norte fluminense para o período de 20/10 (Terça-feira) a 22/10 (Quinta-feira) é condicionado pela atuação de uma massa de ar quente e úmida tropical, combinada à circulação de brisas marítimas e ao forte aquecimento diurno. Esse padrão termodinâmico sustenta temperaturas elevadas e favorece o desenvolvimento de instabilidades convectivas a partir da tarde, sob influência de cavados em médios níveis da atmosfera e borda oeste do anticiclone subtropical do Atlântico Sul (Carta Sinótica CHM 12Z). As temperaturas oscilam entre mínima de 20°C ao amanhecer e máxima de 24°C na terça-feira (20/10), com acumulado pluviométrico diário previsto de 2.1 mm (sem avisos meteorológicos vigentes). O gradiente térmico semanal evolui com calor persistente, alcançando pico de até 24°C na quinta-feira (22/10).</p>
          </div>

          <div class="p-4 sm:p-5 rounded-2xl bg-white border border-[#cbd5e1] shadow-2xs space-y-2.5 transition hover:border-[#94a3b8]">
            <div class="flex items-center gap-2 border-b border-[#e2e8f0] pb-2">
              <span class="text-[10.5px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#ffebe4] text-black border border-[#f97316] flex items-center gap-1.5 tracking-wider">
                <i data-lucide="waves" class="w-3.5 h-3.5 text-black"></i>
                <span>Hidrografia, Rio Jundiá & Faixa Litorânea</span>
              </span>
            </div>
            <p class="leading-relaxed text-justify text-sm text-black font-normal">No monitoramento hidrográfico municipal, a Bacia do Rio Jundiá opera em regime de estabilidade e contínua vazante. A estação telemétrica municipal (INEA 2241036) registrou cota de 1.9 m (Status: VIGILÂNCIA), posicionando-se com margem de segurança de mais de 1 metro abaixo da cota de transbordo (2,84 m) e com capacidade de calha em 60%. Nas últimas 24 horas, a rede telemétrica não registrou precipitação significativa (0,0 mm no Jundiá), permitindo o escoamento pleno das águas pluviais nos canais de drenagem dos bairros Âncora, Nova Esperança e adjacências. Na faixa litorânea (Área Delta - Farol de São Tomé a Cabo Frio), a Marinha do Brasil não registra avisos de mau tempo vigentes, apresentando mar com ondas moderadas entre 1,2 e 1,6 m e ventos costeiros regulares com rajadas pontuais de até 45 km/h associadas às células convectivas da tarde.</p>
          </div>

          <div class="p-4 sm:p-5 rounded-2xl bg-white border border-[#cbd5e1] shadow-2xs space-y-2.5 transition hover:border-[#94a3b8]">
            <div class="flex items-center gap-2 border-b border-[#e2e8f0] pb-2">
              <span class="text-[10.5px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#f1f5f9] text-black border border-[#cbd5e1] flex items-center gap-1.5 tracking-wider">
                <i data-lucide="calendar-clock" class="w-3.5 h-3.5 text-black"></i>
                <span>Tendência dos Próximos Dias & PLANCON</span>
              </span>
            </div>
            <p class="leading-relaxed text-justify text-sm text-black font-normal">Para os dias subsequentes, na quarta-feira (21/10) a aproximação de instabilidades mantém variação de nuvens com máxima de 24°C e pancadas de chuva com trovoadas (4.8 mm acumulados, sem avisos meteorológicos vigentes). Na quinta-feira (22/10), o calor persiste com máxima de 24°C e gradual diminuição de instabilidades (5.2 mm acumulados, sob Alerta Amarelo de Tempestade nº 56118 do INMET). A infraestrutura de monitoramento meteorológico opera de forma contínua 24h na nuvem, com processamento automatizado e redundante dos dados do INMET, INEA e Open-Meteo. A Subsecretaria de Defesa Civil de Rio das Ostras mantém monitoramento preventivo ininterrupto no Centro de Operações (PLANCON), com canais de emergência pelo 199 e Bombeiros 193.</p>
          </div>

        </div>
      </div>

    </div>
  </section>"""

if old_section_block in html:
    html = html.replace(old_section_block, new_section_block)
else:
    html = html.replace(old_section_block.replace('\r\n', '\n'), new_section_block)

# Bump to v68
html = html.replace('css/styles.css?v=67', 'css/styles.css?v=68')
html = html.replace('js/app.js?v=67', 'js/app.js?v=68')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

# sw.js
sw_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\sw.js'
with open(sw_path, 'r', encoding='utf-8') as f:
    sw = f.read()
sw = sw.replace("'meteo-ostras-v67'", "'meteo-ostras-v68'")
with open(sw_path, 'w', encoding='utf-8') as f:
    f.write(sw)

print("Updated index.html and sw.js (v68) successfully")
