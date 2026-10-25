import re

with open('index.html', 'r', encoding='utf-8') as f:
    orig = f.read()

lines = orig.splitlines(keepends=True)

def slice_lines(start_1indexed, end_1indexed):
    return "".join(lines[start_1indexed - 1 : end_1indexed])

# 1. Top before tabs
part_top = slice_lines(1, 129)

# 2. Main tabs (6 tabs, grid responsive, 100% full width, zero void)
part_tabs = '''  <!-- ========================================================================= -->
  <!-- NAVEGAÇÃO DE ABAS PRINCIPAIS (6 SEÇÕES DISTRIBUÍDAS - ZERO VAZIOS)       -->
  <!-- ========================================================================= -->
  <nav id="app-main-tabs" class="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-1">
    <div class="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2 p-1.5 bg-[#f5efe8]/90 rounded-2xl border border-[#b8a99a]/50 shadow-xs" role="tablist">

      <!-- Aba 1: Previsão & Tempo -->
      <button id="nav-tab-previsao" onclick="switchAppTab('previsao')" class="app-nav-tab active flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs w-full text-center" role="tab" aria-selected="true">
        <i data-lucide="cloud-sun" class="w-4 h-4 shrink-0 text-black"></i>
        <span class="truncate">Previsão & Tempo</span>
      </button>

      <!-- Aba 2: Acumulados de Chuva -->
      <button id="nav-tab-chuva" onclick="switchAppTab('chuva')" class="app-nav-tab flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer w-full text-center" role="tab" aria-selected="false">
        <i data-lucide="cloud-rain" class="w-4 h-4 shrink-0 text-black"></i>
        <span class="truncate">Acumulados Chuva</span>
      </button>

      <!-- Aba 3: Nível do Rio Jundiá -->
      <button id="nav-tab-rio" onclick="switchAppTab('rio')" class="app-nav-tab flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer w-full text-center" role="tab" aria-selected="false">
        <i data-lucide="waves" class="w-4 h-4 shrink-0 text-black"></i>
        <span class="truncate">Nível do Rio</span>
      </button>

      <!-- Aba 4: Orla & Praias -->
      <button id="nav-tab-orla" onclick="switchAppTab('orla')" class="app-nav-tab flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer w-full text-center" role="tab" aria-selected="false">
        <i data-lucide="anchor" class="w-4 h-4 shrink-0 text-black"></i>
        <span class="truncate">Orla & Praias</span>
      </button>

      <!-- Aba 5: Alertas & Sinótico -->
      <button id="nav-tab-alertas" onclick="switchAppTab('alertas')" class="app-nav-tab flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer w-full text-center" role="tab" aria-selected="false">
        <i data-lucide="shield-alert" class="w-4 h-4 shrink-0 text-black"></i>
        <span class="truncate">Alertas & Sinótico</span>
      </button>

      <!-- Aba 6: Boletim Operacional -->
      <button id="nav-tab-boletim" onclick="switchAppTab('boletim')" class="app-nav-tab flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer w-full text-center" role="tab" aria-selected="false">
        <i data-lucide="file-text" class="w-4 h-4 shrink-0 text-black"></i>
        <span class="truncate">Boletim 12 Turnos</span>
      </button>

    </div>
  </nav>
'''

# 3. Slices
section_alertas = slice_lines(163, 333)
section_alertas = section_alertas.replace(
    '<section id="section-alertas-oficiais" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5">',
    '<section id="section-alertas-oficiais" class="w-full">'
)

section_sinotico = slice_lines(337, 409)
section_sinotico = section_sinotico.replace(
    '<section id="section-panorama-sinotico" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5">',
    '<section id="section-panorama-sinotico" class="w-full">'
)

section_previsao3dias = slice_lines(412, 649)
card_hero = slice_lines(663, 807)
card_chart = slice_lines(808, 852)

# card_orla - fix closing divs
card_orla = slice_lines(854, 1091).rstrip() + "\n          </div> <!-- /#orla-panel-balnear -->\n        </div> <!-- /#card-condicoes-orla -->\n"

card_jundia = slice_lines(1101, 1160)
card_telefones = slice_lines(1163, 1241)
card_turnos = slice_lines(1244, 1338)
view_chuva = slice_lines(1349, 1597)
part_footer_and_modals = slice_lines(1601, len(lines))

# Construct view 1 (previsao)
view_previsao = f'''  <!-- ========================================================================= -->
  <!-- VIEW 1: PREVISÃO & TEMPO GERAL                                           -->
  <!-- ========================================================================= -->
  <div id="view-tab-previsao" class="app-tab-view space-y-6">

    <!-- Status Cards: 3 Mini Atalhos Operacionais (Para Conexão Harmônica) -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <!-- Mini Card 1: Alertas & Sinótico -->
        <button onclick="switchAppTab('alertas')" class="p-4 bg-white rounded-2xl border border-[#cbd5e1] hover:border-[#f07a53] transition shadow-xs flex items-center justify-between text-left cursor-pointer group">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#fff2eb] text-[#d95d39] flex items-center justify-center shrink-0 shadow-2xs">
              <i data-lucide="shield-alert" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="text-[10px] uppercase font-black text-black tracking-wider">Avisos Vigentes</div>
              <div class="text-sm font-black text-black">Alertas & Sinótico</div>
              <div class="text-[11px] font-medium text-black">INMET & Marinha do Brasil</div>
            </div>
          </div>
          <i data-lucide="arrow-right" class="w-4 h-4 text-black group-hover:translate-x-1 transition"></i>
        </button>

        <!-- Mini Card 2: Nível do Rio Jundiá -->
        <button onclick="switchAppTab('rio')" class="p-4 bg-white rounded-2xl border border-[#cbd5e1] hover:border-[#38bdf8] transition shadow-xs flex items-center justify-between text-left cursor-pointer group">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center shrink-0 shadow-2xs">
              <i data-lucide="waves" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="text-[10px] uppercase font-black text-black tracking-wider">Cota 1.59 m • Vigilância</div>
              <div class="text-sm font-black text-black">Nível do Rio Jundiá</div>
              <div class="text-[11px] font-medium text-black">Estação INEA n° 2241036</div>
            </div>
          </div>
          <i data-lucide="arrow-right" class="w-4 h-4 text-black group-hover:translate-x-1 transition"></i>
        </button>

        <!-- Mini Card 3: Orla & Praias -->
        <button onclick="switchAppTab('orla')" class="p-4 bg-white rounded-2xl border border-[#cbd5e1] hover:border-[#2dd4bf] transition shadow-xs flex items-center justify-between text-left cursor-pointer group">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#ccfbf1] text-[#0d9488] flex items-center justify-center shrink-0 shadow-2xs">
              <i data-lucide="anchor" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="text-[10px] uppercase font-black text-black tracking-wider">Ondas 1.2 m • 11 Praias</div>
              <div class="text-sm font-black text-black">Orla & Balneabilidade</div>
              <div class="text-[11px] font-medium text-black">Marés & Condições INEA</div>
            </div>
          </div>
          <i data-lucide="arrow-right" class="w-4 h-4 text-black group-hover:translate-x-1 transition"></i>
        </button>
      </div>
    </div>

    <!-- Bloco Central: Hero Condições Atuais ao Vivo + Gráfico Horário 24h -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="space-y-6">
{card_hero}
{card_chart}
      </div>
    </main>

    <!-- Previsão Estendida 3 Dias -->
{section_previsao3dias}

  </div> <!-- /#view-tab-previsao -->
'''

# Construct view 3 (rio)
view_rio = f'''  <!-- ========================================================================= -->
  <!-- VIEW 3: NÍVEL DO RIO JUNDIÁ (TELEMETRIA FLUVIAL & COTAS INEA)             -->
  <!-- ========================================================================= -->
  <div id="view-tab-rio" class="app-tab-view hidden max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-6 space-y-6">
    <!-- Header Temático Hidrológico -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#cbd5e1] shadow-xs">
      <div class="flex items-center gap-3">
        <div class="medallion-title-orange w-10 h-10 rounded-2xl flex items-center justify-center text-black shadow-xs shrink-0">
          <i data-lucide="waves" class="w-5 h-5 text-black"></i>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg sm:text-xl font-black text-black tracking-tight font-heading">
              Telemetria & Cota do Rio Jundiá
            </h2>
            <span class="text-[11px] px-2.5 py-0.5 rounded-full font-black bg-[#e0f2fe] text-[#0369a1] border border-[#0284c7]/40 uppercase tracking-wide">
              Estação INEA 2241036
            </span>
          </div>
          <p class="text-xs font-semibold text-black mt-0.5">
            Monitoramento hidrológico fluvial oficial da bacia do Rio Jundiá em Rio das Ostras
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <a href="https://alertadecheias.com.br/stations/2241036/full" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-black bg-[#ffebe4] border border-[#f07a53] hover:bg-[#fed7cc] transition shadow-xs cursor-pointer">
          <i data-lucide="external-link" class="w-4 h-4 text-black"></i>
          <span>Portal Alerta de Cheias INEA</span>
        </a>
      </div>
    </div>

    <!-- Card de Telemetria do Rio Jundiá -->
{card_jundia}

    <!-- Grid de 2 Colunas: Contexto Hidrológico & Protocolos de Cheia -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Coluna 1: Bacia RH-VIII & Dinâmica Fluvial -->
      <div class="modern-card p-5 sm:p-6 bg-white border border-[#cbd5e1] space-y-4 shadow-xs">
        <div class="flex items-center gap-2.5 border-b border-[#cbd5e1] pb-3">
          <div class="w-8 h-8 rounded-lg bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center shrink-0">
            <i data-lucide="map" class="w-4 h-4"></i>
          </div>
          <div>
            <h4 class="text-sm font-black text-black">Bacia Hidrográfica RH-VIII</h4>
            <span class="text-[11px] font-normal text-black">Macaé e das Ostras • Escoamento e Foz</span>
          </div>
        </div>
        <p class="text-xs text-black leading-relaxed">
          O Rio Jundiá corta áreas urbanas e rurais de Rio das Ostras, banhando os bairros Cantagalo, Âncora, Cláudio Ribeiro e desaguando em direção à orla costeira. 
        </p>
        <div class="space-y-2 pt-1 text-xs">
          <div class="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
            <span class="font-bold text-black block mb-0.5">Influência das Marés Oceânicas:</span>
            <span class="text-black">Em marés astronômicas altas (preamar), o refluxo das águas marinhas diminui o gradiente hidráulico do rio, desacelerando o escoamento pluvial e aumentando o tempo de retenção nos leitos.</span>
          </div>
          <div class="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
            <span class="font-bold text-black block mb-0.5">Sensor Telemétrico Automático INEA:</span>
            <span class="text-black">Estação 2241036 equipada com sensor de nível piezométrico/pressão com transmissão contínua ao INEA via telemetria satelital e celular GPRS.</span>
          </div>
        </div>
      </div>

      <!-- Coluna 2: Protocolo Operacional de Cheias & Cotas -->
      <div class="modern-card p-5 sm:p-6 bg-white border border-[#cbd5e1] space-y-4 shadow-xs">
        <div class="flex items-center gap-2.5 border-b border-[#cbd5e1] pb-3">
          <div class="w-8 h-8 rounded-lg bg-[#fef3c7] text-[#b45309] flex items-center justify-center shrink-0">
            <i data-lucide="alert-triangle" class="w-4 h-4"></i>
          </div>
          <div>
            <h4 class="text-sm font-black text-black">Escala Oficial de Estágios INEA</h4>
            <span class="text-[11px] font-normal text-black">Classificação Operacional do Alerta de Cheias</span>
          </div>
        </div>
        <div class="space-y-2 text-xs">
          <div class="flex items-center justify-between p-2.5 rounded-lg bg-[#f0fdf4] border border-[#86efac]">
            <span class="font-bold text-black">Normal (&lt; 1,50 m):</span>
            <span class="font-bold text-[#166534]">Calha segura • Fluxo livre</span>
          </div>
          <div class="flex items-center justify-between p-2.5 rounded-lg bg-[#f0fdf4] border border-[#86efac]">
            <span class="font-bold text-black">Vigilância (1,50 m a 1,98 m):</span>
            <span class="font-bold text-[#166534]">Nível atual (1,59 m) • Monitoramento</span>
          </div>
          <div class="flex items-center justify-between p-2.5 rounded-lg bg-[#fffbeb] border border-[#fde68a]">
            <span class="font-bold text-black">Atenção (1,99 m a 2,26 m):</span>
            <span class="font-bold text-[#b45309]">Prontidão das equipes operacionais</span>
          </div>
          <div class="flex items-center justify-between p-2.5 rounded-lg bg-[#fff7ed] border border-[#fdba74]">
            <span class="font-bold text-black">Alerta (2,27 m a 2,83 m):</span>
            <span class="font-bold text-[#c2410c]">Risco iminente de alagamentos</span>
          </div>
          <div class="flex items-center justify-between p-2.5 rounded-lg bg-[#fef2f2] border border-[#fca5a5]">
            <span class="font-bold text-black">Transbordo (≥ 2,84 m):</span>
            <span class="font-bold text-[#b91c1c]">Extravasamento da calha</span>
          </div>
        </div>
      </div>
    </div>
  </div> <!-- /#view-tab-rio -->
'''

# Construct view 4 (orla)
view_orla = f'''  <!-- ========================================================================= -->
  <!-- VIEW 4: ORLA & PRAIAS (MARÉ, ONDULAÇÃO & BALNEABILIDADE INEA)            -->
  <!-- ========================================================================= -->
  <div id="view-tab-orla" class="app-tab-view hidden max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-6 space-y-6">
    <!-- Header da Aba Orla -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#cbd5e1] shadow-xs">
      <div class="flex items-center gap-3">
        <div class="medallion-title-orange w-10 h-10 rounded-2xl flex items-center justify-center text-black shadow-xs shrink-0">
          <i data-lucide="anchor" class="w-5 h-5 text-black"></i>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg sm:text-xl font-black text-black tracking-tight font-heading">
              Condições da Orla, Marés & Balneabilidade
            </h2>
            <span class="text-[11px] px-2.5 py-0.5 rounded-full font-black bg-[#ccfbf1] text-[#0f766e] border border-[#0d9488]/40 uppercase tracking-wide">
              11 Praias Monitoradas
            </span>
          </div>
          <p class="text-xs font-semibold text-black mt-0.5">
            Previsão marítima CHM/Marinha do Brasil, tábua de marés astronômica e balneabilidade oficial INEA
          </p>
        </div>
      </div>
    </div>

    <!-- Card Completo de Condições da Orla & Praias -->
{card_orla}

    <!-- Grid de 2 Colunas: Recomendações e Segurança Marítima -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="modern-card p-5 sm:p-6 bg-white border border-[#cbd5e1] space-y-3 shadow-xs">
        <div class="flex items-center gap-2.5 border-b border-[#cbd5e1] pb-3">
          <div class="w-8 h-8 rounded-lg bg-[#ccfbf1] text-[#0f766e] flex items-center justify-center shrink-0">
            <i data-lucide="life-buoy" class="w-4 h-4"></i>
          </div>
          <div>
            <h4 class="text-sm font-black text-black">Segurança na Orla & Banhistas</h4>
            <span class="text-[11px] font-normal text-black">Orientações aos Frequentadores das Praias</span>
          </div>
        </div>
        <p class="text-xs text-black leading-relaxed">
          Respeite sempre as bandeiras de sinalização fixadas pelos guarda-vidas. Em caso de maré alta ou ondas superiores a 1,5 metro, evite banho nas áreas de costão e canais de correntes de retorno (Costazul e Praiamar).
        </p>
      </div>

      <div class="modern-card p-5 sm:p-6 bg-white border border-[#cbd5e1] space-y-3 shadow-xs">
        <div class="flex items-center gap-2.5 border-b border-[#cbd5e1] pb-3">
          <div class="w-8 h-8 rounded-lg bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center shrink-0">
            <i data-lucide="compass" class="w-4 h-4"></i>
          </div>
          <div>
            <h4 class="text-sm font-black text-black">Apoio a Navegantes & Embarcações</h4>
            <span class="text-[11px] font-normal text-black">Capitania dos Portos / CHM Rio de Janeiro</span>
          </div>
        </div>
        <p class="text-xs text-black leading-relaxed">
          Pequenas embarcações e praticantes de esportes náuticos devem consultar os avisos de mau tempo da Capitania dos Portos antes de se fazer ao mar, especialmente com ventos de quadrante Sudoeste/Sul.
        </p>
      </div>
    </div>
  </div> <!-- /#view-tab-orla -->
'''

# Construct view 5 (alertas)
view_alertas = f'''  <!-- ========================================================================= -->
  <!-- VIEW 5: ALERTAS & SINÓTICO (AVISOS INMET/MARINHA & ATMOSFERA REGIONAL)   -->
  <!-- ========================================================================= -->
  <div id="view-tab-alertas" class="app-tab-view hidden max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-6 space-y-6">
    <!-- Header da Aba Alertas -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#cbd5e1] shadow-xs">
      <div class="flex items-center gap-3">
        <div class="medallion-title-orange w-10 h-10 rounded-2xl flex items-center justify-center text-black shadow-xs shrink-0">
          <i data-lucide="shield-alert" class="w-5 h-5 text-black"></i>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg sm:text-xl font-black text-black tracking-tight font-heading">
              Alertas Meteorológicos Oficiais & Panorama Sinótico
            </h2>
            <span class="text-[11px] px-2.5 py-0.5 rounded-full font-black bg-[#fee2e2] text-[#991b1b] border border-[#dc2626]/40 uppercase tracking-wide">
              Fontes Oficiais INMET & Marinha
            </span>
          </div>
          <p class="text-xs font-semibold text-black mt-0.5">
            Avisos meteorológicos vigentes, áreas sob atenção e análise técnica da Região dos Lagos
          </p>
        </div>
      </div>
    </div>

    <!-- Seção de Alertas Oficiais Vigentes -->
{section_alertas}

    <!-- Seção de Panorama Sinótico -->
{section_sinotico}
  </div> <!-- /#view-tab-alertas -->
'''

# Construct view 6 (boletim)
view_boletim = f'''  <!-- ========================================================================= -->
  <!-- VIEW 6: BOLETIM OPERACIONAL (PLANCON 12 TURNOS, EMERGÊNCIAS & DOWNLOADS) -->
  <!-- ========================================================================= -->
  <div id="view-tab-boletim" class="app-tab-view hidden max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-6 space-y-6">
    <!-- Header da Aba Boletim -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#cbd5e1] shadow-xs">
      <div class="flex items-center gap-3">
        <div class="medallion-title-orange w-10 h-10 rounded-2xl flex items-center justify-center text-black shadow-xs shrink-0">
          <i data-lucide="file-text" class="w-5 h-5 text-black"></i>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg sm:text-xl font-black text-black tracking-tight font-heading">
              Boletim Operacional & Suporte de Emergência
            </h2>
            <span class="text-[11px] px-2.5 py-0.5 rounded-full font-black bg-[#f1f5f9] text-[#334155] border border-[#cbd5e1] uppercase tracking-wide">
              PLANCON Municipal • 12 Turnos
            </span>
          </div>
          <p class="text-xs font-semibold text-black mt-0.5">
            Precipitação por turnos operacionais de 2 horas, telefones úteis de pronta resposta e downloads oficiais
          </p>
        </div>
      </div>
    </div>

    <!-- Grid de 2 Colunas: Precipitação por Turnos PLANCON + Telefones Úteis -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-8">
{card_turnos}
      </div>
      <div class="lg:col-span-4">
{card_telefones}
      </div>
    </div>

    <!-- Bloco Oficial de Downloads & Meteogramas -->
    <div class="modern-card p-5 sm:p-6 bg-white border border-[#cbd5e1] shadow-xs">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-black">Downloads Oficiais & Meteogramas</h3>
          <p class="text-xs text-black">Baixe os boletins em PDF gerados diariamente ou consulte os gráficos de alta resolução.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button id="btn-ver-boletim-modal-boletim" onclick="document.getElementById('modal-boletim-tecnico')?.classList.remove('hidden')" class="px-4 py-2 bg-[#f8fafc] hover:bg-[#e2e8f0] border border-[#cbd5e1] rounded-xl text-xs font-bold text-black transition flex items-center gap-2 cursor-pointer shadow-xs">
            <i data-lucide="file-text" class="w-4 h-4 text-black"></i>
            <span>Ver Boletim Técnico</span>
          </button>
          <button id="btn-open-meteogramas-boletim" onclick="document.getElementById('modal-meteogramas')?.classList.remove('hidden')" class="px-4 py-2 bg-[#ffebe4] hover:bg-[#fed7cc] border border-[#f07a53] rounded-xl text-xs font-bold text-black transition flex items-center gap-2 cursor-pointer shadow-xs">
            <i data-lucide="bar-chart-2" class="w-4 h-4 text-black"></i>
            <span>Meteogramas INMET / CPTEC</span>
          </button>
        </div>
      </div>
    </div>
  </div> <!-- /#view-tab-boletim -->
'''

full_new_html = part_top + part_tabs + "\n" + view_previsao + "\n" + view_chuva + "\n" + view_rio + "\n" + view_orla + "\n" + view_alertas + "\n" + view_boletim + "\n" + part_footer_and_modals

# Bump version in sw/app to v104
full_new_html = full_new_html.replace('js/app.js?v=103', 'js/app.js?v=104')
full_new_html = full_new_html.replace('css/custom.css?v=103', 'css/custom.css?v=104')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(full_new_html)

print("Updated index.html directly! New size:", len(full_new_html))
