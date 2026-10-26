# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

start_marker = '<section id="section-panorama-sinotico"'
end_marker = '</div> <!-- /#view-tab-alertas -->'

p_start = c.find(start_marker)
p_end = c.find(end_marker, p_start)
section_slice = c[p_start:p_end]
p_section_end = section_slice.rfind('</section>') + len('</section>')

p1 = (
    "A configuração sinótica sobre o município de Rio das Ostras e o setor costeiro da Bacia de Campos é modulada pelo posicionamento "
    "da borda ocidental do Anticiclone Subtropical do Atlântico Sul (ASAS, isóbara central de ~1020-1022 hPa), mantendo gradiente bárico "
    "favorável ao escoamento contínuo de ventos de quadrante Nordeste a Leste na camada limite planetária (1000 a 850 hPa). Esse padrão "
    "de circulação zonal impõe advecção horizontal contínua de ar quente e úmido de origem marítima tropical em direção ao continente. "
    "Em médios níveis da troposfera (500 hPa), a propagação de perturbações ondulatórias baroclínicas (cavados de onda curta) gera advecção "
    "de vorticidade ciclônica relativa positiva, potencializando a convergência de massa em superfície acoplada à difluência térmica em "
    "altos níveis (250 hPa) associada ao ramo polar/subtropical do jato. O perfil térmico na superfície apresenta oscilação barométrica "
    "estável, com temperaturas oscilando entre mínima de 19°C ao amanhecer (sob resfriamento radiativo noturno) e máxima diurna de 24°C, "
    "sem alertas de descontinuidade frontal severa no ciclo diário."
)

p2 = (
    "O forte aquecimento diabático por radiação solar em superfície durante o ciclo diurno estabelece taxas de lapso superadiabáticas "
    "junto ao solo, promovendo forçamento termodinâmico ascensional e desestabilização vertical da troposfera. A conjugação entre elevado "
    "teor de água precipitável na coluna troposférica (PW de 38 a 42 mm aferida nos modelos numéricos), umidade relativa em superfície "
    "(82% a 90%) e expressiva disponibilidade de Energia Potencial Convectiva Disponível (índices CAPE moderados a altos, com erosão "
    "progressiva da inibição convectiva - CINE a partir da tarde) sustenta o desenvolvimento de nuvens cumuliformes de grande "
    "desenvolvimento vertical (Cumulus congestus e núcleos convectivos de Cumulonimbus - Cb). Esse regime potencializa a formação de "
    "pancadas de chuva convectivas de intensidade moderada a forte, com risco de descargas elétricas atmosféricas (raios nuvem-solo) e "
    "rajadas de vento descendentes convectivas (downbursts / frentes de rajada de até 60 km/h na orla marítima). No monitoramento "
    "hidrometeorológico, a Bacia Hidrográfica do Rio Jundiá opera em regime fluviométrico de estabilidade e vazante contínua, com a "
    "estação telemétrica municipal (INEA 224103620) acusando cota de 1.82 m (capacidade de calha em 60% e ampla margem de segurança de "
    "1.02 m para a cota de transbordo de 2,84 m), garantindo escoamento pluvial pleno nos canais urbanos."
)

p3 = (
    "Na evolução do prognóstico numérico de mesoescala para o horizonte de 72 horas (rodadas sinóticas ECMWF, GFS e COSMO/INMET 12Z), "
    "projeta-se a passagem gradual da instabilidade pré-frontal e o restabelecimento progressivo de subsidência atmosférica com elevação "
    "bárica na retaguarda. Para terça-feira (27/10), o escoamento de superfície passa por rotação gradativa dos ventos para Sudeste/Leste "
    "(rajadas regulares de até 37 km/h), com precipitação residual em declínio (0.7 mm). Na quarta-feira (28/10), consolida-se "
    "estabilização troposférica com redução expressiva da cobertura de nuvens, predomínio de sol e volumes pluviométricos residuais "
    "(< 0.5 mm). No domínio oceanográfico costeiro (Área Delta - Farol de São Tomé a Cabo Frio, sob monitoramento do CHM/Marinha do Brasil), "
    "o estado do mar é caracterizado por ondas de 1,2 a 1,6 m formadas por vagas de vento sobrepostas a ondas de gravidade oceânicas "
    "superficiais (swell de E/SE), mantendo hidrodinâmica costeira favorável sem represamento de maré na desembocadura dos canais "
    "pluviais. A infraestrutura de telemetria meteorológica e hidrológica opera com processamento autônomo e contínuo 24h na nuvem, "
    "assegurando vigilância ininterrupta dos dados sinóticos municipais."
)

new_section = f'''<section id="section-panorama-sinotico" class="w-full">
    <div class="modern-card p-5 sm:p-6 bg-white dark:bg-[#0d1527] border border-[#cbd5e1] dark:border-slate-800 space-y-4 shadow-sm">
      
      <!-- Cabeçalho do Panorama Sinótico -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#cbd5e1] dark:border-slate-800 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="medallion-title-orange w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-black">
            <i data-lucide="compass" class="w-4 h-4 text-black"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-base sm:text-lg font-bold text-black dark:text-white tracking-tight font-heading">
                Panorama Sinótico Geral
              </h2>
              <span id="badge-periodo-sinotico" class="badge-title-orange text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase shadow-2xs">
                26/10 (Segunda-feira) a 28/10 (Quarta-feira)
              </span>
            </div>
            <p class="text-xs font-semibold text-black dark:text-slate-300 mt-0.5">
              Diagnóstico sinótico e termodinâmico da troposfera, modelagem numérica de mesoescala (ECMWF/GFS/COSMO), hidrometeorologia da Bacia do Rio Jundiá e oceanografia costeira (Carta Sinótica CHM 12Z)
            </p>
          </div>
        </div>

        <!-- Ações do Panorama: Recolher / Expandir -->
        <div class="flex items-center gap-2 self-start sm:self-center">
          <button id="btn-toggle-sinopse" class="p-1.5 rounded-full border border-[#cbd5e1] dark:border-slate-700 text-black dark:text-white hover:bg-[#f1f5f9] dark:hover:bg-slate-800 cursor-pointer transition shadow-2xs" title="Minimizar / Expandir Panorama">
            <i data-lucide="chevron-up" id="icon-toggle-sinopse" class="w-4 h-4 text-black dark:text-white"></i>
          </button>
        </div>
      </div>

      <!-- Conteúdo do Panorama Sinótico: Cartões Nórdicos Estruturados -->
      <div id="container-conteudo-sinopse">
        <div id="sinopse-texto-completo" class="p-3 sm:p-4 rounded-2xl bg-[#f4f6f8] dark:bg-slate-900/60 border border-[#cbd5e1] dark:border-slate-800 space-y-3 shadow-inner">
          
          <!-- Card 1: Escoamento & Dinâmica Sinótica -->
          <div class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131d35] border border-[#cbd5e1] dark:border-slate-800 shadow-2xs space-y-3 transition hover:border-[#94a3b8] dark:hover:border-slate-700">
            <div class="flex items-center justify-between gap-2 border-b border-[#e2e8f0] dark:border-slate-800 pb-2.5 flex-wrap">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[10.5px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 shadow-2xs flex items-center gap-1.5 tracking-wider">
                  <i data-lucide="compass" class="w-3.5 h-3.5 text-current"></i>
                  <span>Escoamento & Dinâmica Sinótica</span>
                </span>
                <h3 class="text-xs sm:text-[13px] font-bold text-black dark:text-white leading-tight">Configuração Sinótica Regional, Campos de Pressão & Escoamento Troposférico</h3>
              </div>
              <span class="text-[9.5px] sm:text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/80 font-mono">
                ASAS (1020 hPa) • Cavados em 500 hPa • Advecção de Umidade
              </span>
            </div>
            <p class="leading-relaxed text-justify text-xs sm:text-sm text-black dark:text-slate-200 font-normal">
              {p1}
            </p>
          </div>

          <!-- Card 2: Termodinâmica & Hidrometeorologia -->
          <div class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131d35] border border-[#cbd5e1] dark:border-slate-800 shadow-2xs space-y-3 transition hover:border-[#94a3b8] dark:hover:border-slate-700">
            <div class="flex items-center justify-between gap-2 border-b border-[#e2e8f0] dark:border-slate-800 pb-2.5 flex-wrap">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[10.5px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-2xs flex items-center gap-1.5 tracking-wider">
                  <i data-lucide="cloud-lightning" class="w-3.5 h-3.5 text-current"></i>
                  <span>Termodinâmica & Hidrometeorologia</span>
                </span>
                <h3 class="text-xs sm:text-[13px] font-bold text-black dark:text-white leading-tight">Termodinâmica Atmosférica, Instabilidade Convectiva & Resposta Hidrológica do Rio Jundiá</h3>
              </div>
              <span class="text-[9.5px] sm:text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/80 font-mono">
                Convecção Diurna • Índices CAPE / CINE • Cota INEA 1.82 m (Vazante)
              </span>
            </div>
            <p class="leading-relaxed text-justify text-xs sm:text-sm text-black dark:text-slate-200 font-normal">
              {p2}
            </p>
          </div>

          <!-- Card 3: Modelagem Numérica & Oceanografia -->
          <div class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131d35] border border-[#cbd5e1] dark:border-slate-800 shadow-2xs space-y-3 transition hover:border-[#94a3b8] dark:hover:border-slate-700">
            <div class="flex items-center justify-between gap-2 border-b border-[#e2e8f0] dark:border-slate-800 pb-2.5 flex-wrap">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[10.5px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs flex items-center gap-1.5 tracking-wider">
                  <i data-lucide="cpu" class="w-3.5 h-3.5 text-current"></i>
                  <span>Modelagem Numérica & Oceanografia</span>
                </span>
                <h3 class="text-xs sm:text-[13px] font-bold text-black dark:text-white leading-tight">Prognóstico Numérico de Mesoescala (ECMWF/GFS), Oceanografia Costeira & Tendência</h3>
              </div>
              <span class="text-[9.5px] sm:text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/80 font-mono">
                Modelos ECMWF/GFS 12Z • Swell E/SE • Área Delta CHM
              </span>
            </div>
            <p class="leading-relaxed text-justify text-xs sm:text-sm text-black dark:text-slate-200 font-normal">
              {p3}
            </p>
          </div>

        </div>
      </div>

    </div>
  </section>'''

c_updated = c[:p_start] + new_section + c[p_start + p_section_end:]

# Bump cache busters
c_updated = c_updated.replace('css/styles.css?v=99', 'css/styles.css?v=100')
c_updated = c_updated.replace('js/app.js?v=127', 'js/app.js?v=128')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(c_updated)

print("Safe replacement of section-panorama-sinotico in index.html completed successfully!")
