import sys, re, os

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
index_path = os.path.join(BASE_DIR, "index.html")

with open(index_path, "r", encoding="utf-8") as fp:
    html = fp.read()

# 1. Update body tag
body_old = '<body class="antialiased selection:bg-[#ffebe4] selection:text-black pb-12 min-h-screen bg-[#f4f6f8] text-[#1e293b] overflow-x-hidden">'
body_new = '<body class="antialiased selection:bg-[#FCA311] selection:text-black pb-12 min-h-screen bg-[#F7F8FA] dark:bg-[#05080F] text-[#14213D] dark:text-[#F8FAFC] transition-colors duration-200 overflow-x-hidden">'
assert body_old in html, "Could not find body tag"
html = html.replace(body_old, body_new, 1)
print("Updated body tag")

# 2. Find and replace app-sticky-navigation
idx_nav_start = html.find('<div id="app-sticky-navigation"')
idx_nav_end = html.find('</div> <!-- /#app-sticky-navigation -->')
assert idx_nav_start != -1 and idx_nav_end != -1, "Could not find app-sticky-navigation boundaries"
idx_nav_end += len('</div> <!-- /#app-sticky-navigation -->')

header_and_sidebar = """<!-- ========================================================================= -->
  <!-- BARRA SUPERIOR INSTITUCIONAL (GOOGLE AI STUDIO DESIGN SYSTEM)              -->
  <!-- ========================================================================= -->
  <header id="site-header" class="sticky top-0 z-40 bg-white/95 dark:bg-[#14213D]/95 backdrop-blur-md border-b border-[#E5E5E5] dark:border-[#233354] transition-colors duration-200 shadow-2xs">
    <div class="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
      
      <!-- Esquerda: Botão Drawer Mobile + Marca Oficial -->
      <div class="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <button
          id="btn-sidebar-toggle-top"
          onclick="window.toggleMobileSidebar();"
          class="lg:hidden p-2 rounded-xl border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#0B1324] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FCA311] cursor-pointer transition-colors shadow-2xs"
          aria-label="Alternar menu de navegação vertical"
        >
          <i data-lucide="menu" class="w-4 h-4"></i>
        </button>

        <a
          href="#previsao"
          onclick="if(window.switchAppTab){window.switchAppTab('previsao'); window.switchSubSection('previsao', 'section-hero-previsao');} return false;"
          class="flex items-center gap-2.5 shrink-0 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCA311]"
          aria-label="Início Tempo em Rio das Ostras"
        >
          <img
            src="img/logo-rounded.png?v=219"
            alt="TEMPO em Rio das Ostras"
            class="h-9 sm:h-10 w-auto object-contain rounded-lg shadow-2xs"
          />
          <div class="hidden sm:flex flex-col text-left">
            <span class="text-sm sm:text-base font-extrabold text-[#14213D] dark:text-white tracking-tight leading-tight">Rio das Ostras</span>
            <span class="text-[10px] font-semibold text-slate-500 dark:text-[#E5E5E5]/75 leading-none">Rede Meteorológica & Alerta</span>
          </div>
        </a>
      </div>

      <!-- Centro: Status Ao Vivo & Sincronização -->
      <div class="hidden md:flex items-center gap-2.5 text-xs text-slate-600 dark:text-[#E5E5E5]/75 truncate">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] tracking-wide uppercase shadow-2xs">
          <span class="w-2 h-2 rounded-full bg-emerald-500 live-pulse"></span>
          AO VIVO
        </span>
        <span class="font-semibold text-[#14213D] dark:text-white truncate">
          Portal Integrado de Meteorologia, Alerta Hidrológico & Marítimo
        </span>
        <span aria-hidden="true" class="text-slate-400">•</span>
        <span id="hero-clock" class="hidden font-mono font-bold text-slate-700 dark:text-slate-300">--:--</span>
        <span id="header-sync-status" class="font-mono whitespace-nowrap text-[11px] text-slate-500 dark:text-[#E5E5E5]/70">
          Sincronizado via Open-Meteo & Rede Local
        </span>
      </div>

      <!-- Direita: Ações (199 Central, Meteogramas, Atualizar, Tema) -->
      <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <a href="tel:199" class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors shadow-2xs" title="Ligue 199 para a Defesa Civil">
          <i data-lucide="phone-call" class="w-3.5 h-3.5 text-rose-600 dark:text-rose-400"></i>
          <span>199</span>
        </a>

        <button
          id="btn-sync-now"
          onclick="if(window.refreshData) window.refreshData();"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#0B1324] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FCA311]/70 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          title="Sincronizar dados telemétricos agora"
        >
          <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-[#14213D] dark:text-[#FCA311]"></i>
          <span class="hidden sm:inline">Atualizar</span>
          <span id="header-sync-countdown" class="font-mono text-[10.5px] font-bold text-sky-700 dark:text-sky-400 ml-0.5">05:00</span>
        </button>

        <button
          id="btn-theme-toggle"
          onclick="window.toggleTheme()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#0B1324] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FCA311]/70 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          title="Alternar tema claro / escuro"
          aria-label="Alternar tema"
        >
          <i id="theme-icon" data-lucide="moon" class="w-3.5 h-3.5 text-[#14213D] dark:text-[#FCA311]"></i>
          <span id="theme-toggle-label" class="hidden sm:inline">Tema</span>
        </button>
      </div>
    </div>
  </header>

  <!-- ========================================================================= -->
  <!-- WORKSPACE SHELL: LEFT VERTICAL TABS RAIL + MAIN CONTENT                   -->
  <!-- ========================================================================= -->
  <div id="app-workspace-shell" class="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
    
    <!-- BARRA ATIVA MOBILE (Visível apenas em Mobile/Tablet < lg) -->
    <div id="mobile-tab-bar" class="w-full lg:hidden flex items-center justify-between gap-3 bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-2xl px-4 py-3 shadow-xs">
      <div class="flex items-center gap-2.5 min-w-0">
        <div id="mobile-active-tab-icon" class="w-8 h-8 rounded-lg bg-[#14213D] dark:bg-[#FCA311] flex items-center justify-center shrink-0">
          <i data-lucide="cloud-sun" class="w-4 h-4 text-[#FCA311] dark:text-[#000000]"></i>
        </div>
        <div class="truncate">
          <div id="mobile-active-tab-label" class="text-xs font-bold text-[#14213D] dark:text-white truncate">
            Previsão & Tempo
          </div>
          <div id="mobile-active-sub-label" class="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/70 truncate">
            Tempo Agora
          </div>
        </div>
      </div>
      <button
        id="btn-toggle-mobile-menu"
        onclick="window.toggleMobileSidebar();"
        class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] shrink-0 cursor-pointer shadow-xs"
      >
        <span id="mobile-menu-text">Abas & Seções</span>
        <i id="mobile-menu-chevron" data-lucide="chevron-down" class="w-3.5 h-3.5 transition-transform duration-200"></i>
      </button>
    </div>

    <!-- SIDEBAR VERTICAL RAIL (Desktop Fixo & Mobile Drawer) -->
    <aside id="app-sidebar-nav" class="hidden lg:block w-full lg:w-72 xl:w-76 shrink-0 lg:sticky lg:top-20 z-30 transition-all duration-200">
      <nav aria-label="Abas principais do portal" class="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-2xl p-3 space-y-1.5 shadow-sm">
        <div class="px-3 pt-1 pb-2 flex items-center justify-between border-b border-[#E5E5E5] dark:border-[#233354]/80">
          <span class="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/65">
            Abas do Portal
          </span>
          <span id="sidebar-boletim-meta" class="text-[10px] font-mono text-[#FCA311] truncate max-w-[120px]">
            Rede Operacional
          </span>
        </div>

        <div class="space-y-1 pt-1" id="sidebar-nav-tabs">
          <!-- Aba 1: Previsão & Tempo -->
          <div class="sidebar-tab-group" data-tab="previsao">
            <button
              type="button"
              id="nav-tab-previsao"
              onclick="window.handleSidebarTabClick('previsao', event)"
              class="sidebar-tab-btn active w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              aria-selected="true"
            >
              <span class="flex items-center gap-2.5 min-w-0">
                <i data-lucide="cloud-sun" class="sidebar-icon w-4 h-4 shrink-0"></i>
                <span class="truncate">Previsão & Tempo</span>
              </span>
              <i data-lucide="chevron-down" class="sidebar-chevron w-3.5 h-3.5 shrink-0 transition-transform"></i>
            </button>
            <div id="sidebar-subsections-previsao" class="sidebar-subsections-tree mt-1.5 mb-2 ml-4 pl-3 border-l border-[#E5E5E5] dark:border-[#233354] space-y-1">
              <button type="button" onclick="window.switchSubSection('previsao', 'section-hero-previsao')" data-section="section-hero-previsao" class="sidebar-sub-btn active w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Tempo Agora
              </button>
              <button type="button" onclick="window.switchSubSection('previsao', 'section-graficos-tendencia')" data-section="section-graficos-tendencia" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Gráficos de Tendência
              </button>
              <button type="button" onclick="window.switchSubSection('previsao', 'section-previsao-3dias')" data-section="section-previsao-3dias" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Previsão dos Próximos Dias
              </button>
              <button type="button" onclick="window.switchSubSection('previsao', 'section-panorama-sinotico')" data-section="section-panorama-sinotico" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Panorama Sinótico Geral
              </button>
              <button type="button" onclick="window.switchSubSection('previsao', 'section-plancon-resumo')" data-section="section-plancon-resumo" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Plano de Contingência (PLANCON)
              </button>
              <button type="button" onclick="window.showAllSubSections('previsao')" data-section="all" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Ver Todas as Seções
              </button>
            </div>
          </div>

          <!-- Aba 2: Acumulados Chuva -->
          <div class="sidebar-tab-group" data-tab="chuva">
            <button
              type="button"
              id="nav-tab-chuva"
              onclick="window.handleSidebarTabClick('chuva', event)"
              class="sidebar-tab-btn w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              aria-selected="false"
            >
              <span class="flex items-center gap-2.5 min-w-0">
                <i data-lucide="cloud-rain" class="sidebar-icon w-4 h-4 shrink-0"></i>
                <span class="truncate">Acumulados Chuva</span>
              </span>
              <i data-lucide="chevron-down" class="sidebar-chevron w-3.5 h-3.5 shrink-0 transition-transform -rotate-90 opacity-60"></i>
            </button>
            <div id="sidebar-subsections-chuva" class="sidebar-subsections-tree hidden mt-1.5 mb-2 ml-4 pl-3 border-l border-[#E5E5E5] dark:border-[#233354] space-y-1">
              <button type="button" onclick="window.switchSubSection('chuva', 'section-chuva-resumo')" data-section="section-chuva-resumo" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Resumo & KPIs de Chuva
              </button>
              <button type="button" onclick="window.switchSubSection('chuva', 'section-chuva-cards')" data-section="section-chuva-cards" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                10 Estações da Rede
              </button>
              <button type="button" onclick="window.switchSubSection('chuva', 'section-chuva-tabela')" data-section="section-chuva-tabela" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Tabela Comparativa
              </button>
              <button type="button" id="nav-item-chuva-historico" onclick="window.switchSubSection('chuva', 'section-chuva-historico')" data-section="section-chuva-historico" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Histórico em Planilha
              </button>
              <button type="button" onclick="window.showAllSubSections('chuva')" data-section="all" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Ver Todas as Seções
              </button>
            </div>
          </div>

          <!-- Aba 3: Nível do Rio -->
          <div class="sidebar-tab-group" data-tab="rio">
            <button
              type="button"
              id="nav-tab-rio"
              onclick="window.handleSidebarTabClick('rio', event)"
              class="sidebar-tab-btn w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              aria-selected="false"
            >
              <span class="flex items-center gap-2.5 min-w-0">
                <i data-lucide="waves" class="sidebar-icon w-4 h-4 shrink-0"></i>
                <span class="truncate">Nível do Rio</span>
                <span id="nav-badge-rio-macae" class="hidden w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-1" title="Alerta Hidrológico Ativo"></span>
              </span>
              <i data-lucide="chevron-down" class="sidebar-chevron w-3.5 h-3.5 shrink-0 transition-transform -rotate-90 opacity-60"></i>
            </button>
            <div id="sidebar-subsections-rio" class="sidebar-subsections-tree hidden mt-1.5 mb-2 ml-4 pl-3 border-l border-[#E5E5E5] dark:border-[#233354] space-y-1">
              <button type="button" onclick="window.switchSubSection('rio', 'card-telemetria-jundia')" data-section="card-telemetria-jundia" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Cota Atual & Calha do Rio
              </button>
              <button type="button" onclick="window.switchSubSection('rio', 'card-tabela-rio-jundia')" data-section="card-tabela-rio-jundia" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Histórico Telemétrico 24h & 10d
              </button>
              <button type="button" onclick="window.switchSubSection('rio', 'section-rio-macae')" data-section="section-rio-macae" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Rios da Região (Macaé & RH-VIII)
              </button>
              <button type="button" onclick="window.showAllSubSections('rio')" data-section="all" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Ver Todas as Seções
              </button>
            </div>
          </div>

          <!-- Aba 4: Orla & Praias -->
          <div class="sidebar-tab-group" data-tab="orla">
            <button
              type="button"
              id="nav-tab-orla"
              onclick="window.handleSidebarTabClick('orla', event)"
              class="sidebar-tab-btn w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              aria-selected="false"
            >
              <span class="flex items-center gap-2.5 min-w-0">
                <i data-lucide="umbrella" class="sidebar-icon w-4 h-4 shrink-0"></i>
                <span class="truncate">Orla & Praias</span>
              </span>
              <i data-lucide="chevron-down" class="sidebar-chevron w-3.5 h-3.5 shrink-0 transition-transform -rotate-90 opacity-60"></i>
            </button>
            <div id="sidebar-subsections-orla" class="sidebar-subsections-tree hidden mt-1.5 mb-2 ml-4 pl-3 border-l border-[#E5E5E5] dark:border-[#233354] space-y-1">
              <button type="button" onclick="window.switchSubSection('orla', 'orla-panel-mar')" data-section="orla-panel-mar" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Condições do Mar & Ondas
              </button>
              <button type="button" onclick="window.switchSubSection('orla', 'orla-panel-mares')" data-section="orla-panel-mares" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Tábua de Marés
              </button>
              <button type="button" onclick="window.switchSubSection('orla', 'orla-panel-balnear')" data-section="orla-panel-balnear" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Balneabilidade das Praias
              </button>
              <button type="button" onclick="window.showAllSubSections('orla')" data-section="all" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Ver Todas as Seções
              </button>
            </div>
          </div>

          <!-- Aba 5: Alertas & Sinótico -->
          <div class="sidebar-tab-group" data-tab="alertas">
            <button
              type="button"
              id="nav-tab-alertas"
              onclick="window.handleSidebarTabClick('alertas', event)"
              class="sidebar-tab-btn w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              aria-selected="false"
            >
              <span class="flex items-center gap-2.5 min-w-0">
                <i data-lucide="shield-alert" class="sidebar-icon w-4 h-4 shrink-0"></i>
                <span class="truncate">Alertas & Sinótico</span>
              </span>
              <i data-lucide="chevron-down" class="sidebar-chevron w-3.5 h-3.5 shrink-0 transition-transform -rotate-90 opacity-60"></i>
            </button>
            <div id="sidebar-subsections-alertas" class="sidebar-subsections-tree hidden mt-1.5 mb-2 ml-4 pl-3 border-l border-[#E5E5E5] dark:border-[#233354] space-y-1">
              <button type="button" onclick="window.switchSubSection('alertas', 'section-alertas-oficiais')" data-section="section-alertas-oficiais" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Alertas Meteorológicos Vigentes
              </button>
              <button type="button" onclick="window.switchSubSection('alertas', 'section-cemaden-riscos')" data-section="section-cemaden-riscos" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Riscos Geo-Hidrológicos (CEMADEN)
              </button>
              <button type="button" onclick="window.showAllSubSections('alertas')" data-section="all" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Ver Todas as Seções
              </button>
            </div>
          </div>

          <!-- Aba 6: Boletim 16 Turnos -->
          <div class="sidebar-tab-group" data-tab="boletim">
            <button
              type="button"
              id="nav-tab-boletim"
              onclick="window.handleSidebarTabClick('boletim', event)"
              class="sidebar-tab-btn w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              aria-selected="false"
            >
              <span class="flex items-center gap-2.5 min-w-0">
                <i data-lucide="calendar-clock" class="sidebar-icon w-4 h-4 shrink-0"></i>
                <span class="truncate">Boletim 16 Turnos</span>
              </span>
              <i data-lucide="chevron-down" class="sidebar-chevron w-3.5 h-3.5 shrink-0 transition-transform -rotate-90 opacity-60"></i>
            </button>
            <div id="sidebar-subsections-boletim" class="sidebar-subsections-tree hidden mt-1.5 mb-2 ml-4 pl-3 border-l border-[#E5E5E5] dark:border-[#233354] space-y-1">
              <button type="button" onclick="window.switchSubSection('boletim', 'section-boletim-turnos')" data-section="section-boletim-turnos" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Previsão Operacional 16 Turnos
              </button>
              <button type="button" onclick="window.switchSubSection('boletim', 'section-boletim-telefones')" data-section="section-boletim-telefones" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Telefones Úteis & Pronta Resposta
              </button>
              <button type="button" onclick="window.showAllSubSections('boletim')" data-section="all" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Ver Todas as Seções
              </button>
            </div>
          </div>

          <!-- Aba 7: Panorama Mensal -->
          <div class="sidebar-tab-group" data-tab="panorama">
            <button
              type="button"
              id="nav-tab-panorama"
              onclick="window.handleSidebarTabClick('panorama', event)"
              class="sidebar-tab-btn w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              aria-selected="false"
            >
              <span class="flex items-center gap-2.5 min-w-0">
                <i data-lucide="film" class="sidebar-icon w-4 h-4 shrink-0"></i>
                <span class="truncate">Panorama Mensal</span>
              </span>
              <i data-lucide="chevron-down" class="sidebar-chevron w-3.5 h-3.5 shrink-0 transition-transform -rotate-90 opacity-60"></i>
            </button>
            <div id="sidebar-subsections-panorama" class="sidebar-subsections-tree hidden mt-1.5 mb-2 ml-4 pl-3 border-l border-[#E5E5E5] dark:border-[#233354] space-y-1">
              <button type="button" onclick="window.switchSubSection('panorama', 'video')" data-section="video" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Vídeo Reels (9:16)
              </button>
              <button type="button" onclick="window.switchSubSection('panorama', 'feed')" data-section="feed" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Post Carrossel (Feed 4:5)
              </button>
              <button type="button" onclick="window.switchSubSection('panorama', 'stories')" data-section="stories" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Story Sequencial (9:16)
              </button>
              <button type="button" onclick="window.switchSubSection('panorama', 'legenda')" data-section="legenda" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Legenda Oficial Instagram
              </button>
              <button type="button" onclick="window.showAllSubSections('panorama')" data-section="all" class="sidebar-sub-btn w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                Ver Todas as Seções
              </button>
            </div>
          </div>
        </div>
      </nav>
    </aside>

    <!-- COLUNA PRINCIPAL DE CONTEÚDO (MAIN) -->
    <main id="app-main-content" class="flex-1 min-w-0 w-full space-y-6">"""

html = html[:idx_nav_start] + header_and_sidebar + html[idx_nav_end:]
print("Replaced app-sticky-navigation with Header + Sidebar + Main opening")

# 3. Remove old misplaced footer (between view 6 and view 7)
idx_footer_start = html.find('<footer class="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6 border-t-2 border-[#cbd5e1]')
idx_footer_end = html.find('<!-- VIEW 7: RETROSPECTIVA / PANORAMA MENSAL DO CLIMA', idx_footer_start)
assert idx_footer_start != -1 and idx_footer_end != -1, "Could not find old footer boundaries"
html = html[:idx_footer_start] + html[idx_footer_end:]
print("Removed old misplaced footer")

# 4. Insert closing of </main> and </div>, plus new official footer after View 7
# Find end of view-tab-panorama
idx_pano_start = html.find('id="view-tab-panorama"')
assert idx_pano_start != -1, "Could not find view-tab-panorama"
idx_pano_modal = html.find('<div id="modal-boletim-tecnico"', idx_pano_start)
assert idx_pano_modal != -1, "Could not find modal-boletim-tecnico"

# Find the closing </div> of view-tab-panorama right before modal-boletim-tecnico
idx_pano_close = html.rfind('</div><!-- ========================================================================= -->', idx_pano_start, idx_pano_modal)
if idx_pano_close == -1:
    idx_pano_close = html.rfind('</div>', idx_pano_start, idx_pano_modal)

assert idx_pano_close != -1, "Could not find closing of view-tab-panorama"
idx_pano_close += len('</div>')

footer_new = """\n  </div> <!-- /#view-tab-panorama -->
</main>
</div> <!-- /#app-workspace-shell -->

<!-- ========================================================================= -->
<!-- FOOTER OFICIAL GOOGLE AI STUDIO DESIGN SYSTEM                              -->
<!-- ========================================================================= -->
<footer class="border-t border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#14213D] transition-colors mt-auto py-8">
  <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-[#E5E5E5]/70">
    <div class="flex items-center gap-3">
      <img src="img/logo-rounded.png?v=219" alt="TEMPO em Rio das Ostras" class="h-8 w-auto object-contain rounded-lg shadow-2xs">
      <div class="flex flex-col">
        <span class="font-bold text-[#14213D] dark:text-white text-sm">Rede Meteorológica & Alerta Hidrológico</span>
        <span class="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70">Rio das Ostras, RJ • Portal Oficial de Monitoramento</span>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-3 text-[11px] font-mono text-center md:text-right">
      <span>Fontes: Open-Meteo, CEMADEN, INEA, INMET, Marinha do Brasil</span>
      <span class="hidden sm:inline text-slate-400">•</span>
      <span class="text-[#FCA311] font-semibold">Atualização contínua a cada 5 min</span>
    </div>
  </div>
</footer>
"""

html = html[:idx_pano_close] + footer_new + html[idx_pano_close:]
print("Inserted closing of </main></div> and new Google AI Studio footer")

# 5. Update script block for navigation and sidebar sync
idx_script_start = html.find('window.SUB_SECTIONS_CONFIG = {')
assert idx_script_start != -1, "Could not find SUB_SECTIONS_CONFIG"
open_script = html.rfind('<script', 0, idx_script_start)
idx_script_end = html.find('</script>', idx_script_start)
assert open_script != -1 and idx_script_end != -1, "Could not find script block"
idx_script_end += len('</script>')

new_script_block = """<script>
    // Configuração síncrona das abas e sub-seções (Google AI Studio Navigation Architecture)
    window.NAV_ITEMS_CONFIG = [
      { id: 'previsao', label: 'Previsão & Tempo', icon: 'cloud-sun' },
      { id: 'chuva', label: 'Acumulados Chuva', icon: 'cloud-rain' },
      { id: 'rio', label: 'Nível do Rio', icon: 'waves' },
      { id: 'orla', label: 'Orla & Praias', icon: 'umbrella' },
      { id: 'alertas', label: 'Alertas & Sinótico', icon: 'shield-alert' },
      { id: 'boletim', label: 'Boletim 16 Turnos', icon: 'calendar-clock' },
      { id: 'panorama', label: 'Panorama Mensal', icon: 'film' }
    ];

    window.SUB_SECTIONS_CONFIG = {
      previsao: {
        default: 'section-hero-previsao',
        sections: ['section-hero-previsao', 'section-graficos-tendencia', 'section-previsao-3dias', 'section-panorama-sinotico', 'section-plancon-resumo']
      },
      chuva: {
        default: 'section-chuva-resumo',
        sections: ['section-chuva-resumo', 'section-chuva-cards', 'section-chuva-tabela', 'section-chuva-historico']
      },
      rio: {
        default: 'card-telemetria-jundia',
        sections: ['card-telemetria-jundia', 'card-tabela-rio-jundia', 'section-rio-macae']
      },
      orla: {
        default: 'orla-panel-mar',
        sections: ['orla-panel-mar', 'orla-panel-mares', 'orla-panel-balnear']
      },
      alertas: {
        default: 'section-alertas-oficiais',
        sections: ['section-alertas-oficiais', 'section-cemaden-riscos']
      },
      boletim: {
        default: 'section-boletim-turnos',
        sections: ['section-boletim-turnos', 'section-boletim-telefones']
      },
      panorama: {
        default: 'video',
        sections: ['video', 'feed', 'stories', 'legenda']
      }
    };

    window.state = window.state || {};
    window.state.activeTab = window.state.activeTab || 'previsao';
    window.state.activeSubSections = window.state.activeSubSections || {
      previsao: 'section-hero-previsao',
      chuva: 'section-chuva-resumo',
      rio: 'card-telemetria-jundia',
      orla: 'orla-panel-mar',
      alertas: 'section-alertas-oficiais',
      boletim: 'section-boletim-turnos',
      panorama: 'video'
    };

    // Atualiza estado visual da barra lateral (Rail) e barra móvel
    window.updateSidebarNavState = function(activeTab, activeSub) {
      var tabs = ['previsao', 'chuva', 'rio', 'orla', 'alertas', 'boletim', 'panorama'];
      tabs.forEach(function(t) {
        var btn = document.getElementById('nav-tab-' + t);
        var subTree = document.getElementById('sidebar-subsections-' + t);
        var chevron = btn ? btn.querySelector('.sidebar-chevron') : null;
        var isThisTab = (t === activeTab);

        if (btn) {
          if (isThisTab) {
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
          } else {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
          }
        }

        if (subTree) {
          if (isThisTab) {
            subTree.classList.remove('hidden');
            if (chevron) {
              chevron.classList.remove('-rotate-90', 'opacity-60');
              chevron.classList.add('rotate-0', 'opacity-100');
            }
            // Destaca a sub-seção ativa
            subTree.querySelectorAll('.sidebar-sub-btn').forEach(function(subBtn) {
              var secAttr = subBtn.getAttribute('data-section');
              if (secAttr === activeSub) {
                subBtn.classList.add('active');
              } else {
                subBtn.classList.remove('active');
              }
            });
          } else {
            subTree.classList.add('hidden');
            if (chevron) {
              chevron.classList.add('-rotate-90', 'opacity-60');
              chevron.classList.remove('rotate-0', 'opacity-100');
            }
          }
        }
      });

      // Atualiza a barra de abas ativa no mobile
      var activeItem = window.NAV_ITEMS_CONFIG.find(function(item) { return item.id === activeTab; });
      var mobileTabLabel = document.getElementById('mobile-active-tab-label');
      var mobileSubLabel = document.getElementById('mobile-active-sub-label');
      var mobileTabIcon = document.getElementById('mobile-active-tab-icon');

      if (mobileTabLabel && activeItem) {
        mobileTabLabel.textContent = activeItem.label;
      }
      if (mobileTabIcon && activeItem) {
        mobileTabIcon.innerHTML = '<i data-lucide="' + activeItem.icon + '" class="w-4 h-4 text-[#FCA311] dark:text-[#000000]"></i>';
      }
      if (mobileSubLabel) {
        var subTree = document.getElementById('sidebar-subsections-' + activeTab);
        var subBtn = subTree ? subTree.querySelector('.sidebar-sub-btn.active') : null;
        if (subBtn) {
          mobileSubLabel.textContent = subBtn.textContent.trim();
        }
      }

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    };

    window.toggleMobileSidebar = function() {
      var aside = document.getElementById('app-sidebar-nav');
      var chevron = document.getElementById('mobile-menu-chevron');
      var menuText = document.getElementById('mobile-menu-text');
      if (!aside) return;
      var isHidden = aside.classList.contains('hidden');
      if (isHidden) {
        aside.classList.remove('hidden');
        if (chevron) chevron.classList.add('rotate-180');
        if (menuText) menuText.textContent = 'Ocultar Abas';
      } else {
        aside.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
        if (menuText) menuText.textContent = 'Abas & Seções';
      }
    };

    window.closeMobileSidebar = function() {
      if (window.innerWidth >= 1024) return;
      var aside = document.getElementById('app-sidebar-nav');
      var chevron = document.getElementById('mobile-menu-chevron');
      var menuText = document.getElementById('mobile-menu-text');
      if (aside && !aside.classList.contains('hidden')) {
        aside.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
        if (menuText) menuText.textContent = 'Abas & Seções';
      }
    };

    window.handleSidebarTabClick = function(tabName, event) {
      if (event) event.stopPropagation();
      var isAlreadyActive = window.state && window.state.activeTab === tabName;
      if (!isAlreadyActive) {
        if (typeof window.switchAppTab === 'function') {
          window.switchAppTab(tabName);
        } else {
          document.querySelectorAll('.app-tab-view').forEach(function(v) {
            if (v.id === 'view-tab-' + tabName) v.classList.remove('hidden');
            else v.classList.add('hidden');
          });
        }
        var activeSub = (window.state && window.state.activeSubSections && window.state.activeSubSections[tabName]) || (window.SUB_SECTIONS_CONFIG[tabName] && window.SUB_SECTIONS_CONFIG[tabName].default);
        if (activeSub) {
          window.switchSubSection(tabName, activeSub);
        }
      } else {
        var subTree = document.getElementById('sidebar-subsections-' + tabName);
        var btn = document.getElementById('nav-tab-' + tabName);
        var chevron = btn ? btn.querySelector('.sidebar-chevron') : null;
        if (subTree) {
          var isHidden = subTree.classList.toggle('hidden');
          if (chevron) {
            if (isHidden) {
              chevron.classList.add('-rotate-90', 'opacity-60');
              chevron.classList.remove('rotate-0', 'opacity-100');
            } else {
              chevron.classList.remove('-rotate-90', 'opacity-60');
              chevron.classList.add('rotate-0', 'opacity-100');
            }
          }
        }
      }
    };

    window.switchSubSection = function(tabName, sectionId) {
      var config = window.SUB_SECTIONS_CONFIG[tabName];
      if (!config) return;
      var targetId = sectionId || (window.state.activeSubSections && window.state.activeSubSections[tabName]) || config.default;
      window.state.activeSubSections[tabName] = targetId;
      window.state.activeTab = tabName;

      if (typeof window.switchAppTab === 'function') {
        window.switchAppTab(tabName);
      } else {
        document.querySelectorAll('.app-tab-view').forEach(function(v) {
          if (v.id === 'view-tab-' + tabName) v.classList.remove('hidden');
          else v.classList.add('hidden');
        });
      }

      config.sections.forEach(function(sId) {
        var el = document.getElementById(sId);
        if (!el) return;

        if (tabName === 'boletim') {
          var turnosCol = document.getElementById('section-boletim-turnos-col');
          var telCol = document.getElementById('section-boletim-telefones-col');
          if (targetId === 'section-boletim-turnos') {
            if (turnosCol) { turnosCol.classList.remove('hidden', 'lg:col-span-8'); turnosCol.classList.add('w-full', 'lg:col-span-12'); }
            if (telCol) telCol.classList.add('hidden');
          } else if (targetId === 'section-boletim-telefones') {
            if (telCol) { telCol.classList.remove('hidden', 'lg:col-span-4'); telCol.classList.add('w-full', 'lg:col-span-12'); }
            if (turnosCol) turnosCol.classList.add('hidden');
          }
          return;
        }

        if (sId === targetId) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      });

      if (tabName === 'orla') {
        if (targetId === 'orla-panel-mar' && typeof window.switchOrlaTab === 'function') window.switchOrlaTab('mar');
        else if (targetId === 'orla-panel-mares' && typeof window.switchOrlaTab === 'function') window.switchOrlaTab('mares');
        else if (targetId === 'orla-panel-balnear' && typeof window.switchOrlaTab === 'function') window.switchOrlaTab('balnear');
      }
      if (tabName === 'rio') {
        var notifMacae = document.getElementById('notificacao-rios-macae');
        if (notifMacae) {
          if (targetId === 'card-tabela-rio-jundia') notifMacae.classList.add('hidden');
          else notifMacae.classList.remove('hidden');
        }
      }
      if (tabName === 'panorama') {
        if (typeof window.switchPanoramaMode === 'function') {
          window.switchPanoramaMode(targetId);
        }
      }

      window.updateSidebarNavState(tabName, targetId);
      window.closeMobileSidebar();

      if (targetId === 'section-graficos-tendencia') {
        setTimeout(function() {
          window.dispatchEvent(new Event('resize'));
          if (typeof window.updateBulletinChart === 'function') window.updateBulletinChart();
        }, 60);
      }
    };

    window.showAllSubSections = function(tabName) {
      var config = window.SUB_SECTIONS_CONFIG[tabName];
      if (!config) return;
      if (typeof window.switchAppTab === 'function') window.switchAppTab(tabName);
      config.sections.forEach(function(sId) {
        var el = document.getElementById(sId);
        if (el) el.classList.remove('hidden');
      });
      if (tabName === 'boletim') {
        var turnosCol = document.getElementById('section-boletim-turnos-col');
        var telCol = document.getElementById('section-boletim-telefones-col');
        if (turnosCol) { turnosCol.classList.remove('hidden', 'lg:col-span-12', 'w-full'); turnosCol.classList.add('lg:col-span-8'); }
        if (telCol) { telCol.classList.remove('hidden', 'lg:col-span-12', 'w-full'); telCol.classList.add('lg:col-span-4'); }
      }
      if (tabName === 'orla') {
        var segGrid = document.getElementById('orla-seguranca-grid');
        if (segGrid) segGrid.classList.remove('hidden');
        var hTitle = document.getElementById('orla-card-header-title');
        var hSub = document.getElementById('orla-card-header-subtitle');
        if (hTitle) hTitle.textContent = 'Condições da Orla, Marés & Balneabilidade';
        if (hSub) hSub.textContent = 'Mar (1 Semana / 8 Dias), Tábuas de Maré e Balneabilidade INEA';
      }
      if (tabName === 'rio') {
        var notifMacae = document.getElementById('notificacao-rios-macae');
        if (notifMacae) notifMacae.classList.remove('hidden');
      }

      window.updateSidebarNavState(tabName, 'all');
      var mobileSubLabel = document.getElementById('mobile-active-sub-label');
      if (mobileSubLabel) mobileSubLabel.textContent = 'Todas as Seções';
      window.closeMobileSidebar();

      setTimeout(function() {
        window.dispatchEvent(new Event('resize'));
        if (typeof window.updateBulletinChart === 'function') window.updateBulletinChart();
      }, 60);
    };

    // Backwards-compatible aliases
    window.closeAllNavDropdowns = function() { window.closeMobileSidebar(); };
    window.toggleNavDropdown = function(tabName, event) { window.handleSidebarTabClick(tabName, event); };
    window.handleNavTabClick = function(tabName, event) { window.handleSidebarTabClick(tabName, event); };
    window.navigateSubSection = function(tabName, sectionId, event) {
      if (event) { event.preventDefault(); event.stopPropagation(); }
      window.switchSubSection(tabName, sectionId);
    };

    document.addEventListener('DOMContentLoaded', function() {
      var h = (window.location.hash || '').replace('#', '');
      if (h && window.SUB_SECTIONS_CONFIG) {
        for (var t in window.SUB_SECTIONS_CONFIG) {
          if (window.SUB_SECTIONS_CONFIG[t].sections.indexOf(h) !== -1) {
            window.switchSubSection(t, h);
            return;
          }
        }
      }
      window.updateSidebarNavState(window.state.activeTab || 'previsao', (window.state.activeSubSections && window.state.activeSubSections['previsao']) || 'section-hero-previsao');
    });
  </script>"""

html = html[:open_script] + new_script_block + html[idx_script_end:]
print("Updated script block")

# 6. Bump cache busting version to v219
html = html.replace('css/styles.css?v=218', 'css/styles.css?v=219')
html = html.replace('js/app.js?v=218', 'js/app.js?v=219')
html = html.replace('js/historico_planilha.js?v=217', 'js/historico_planilha.js?v=219')
html = html.replace('js/panorama_mensal.js?v=217', 'js/panorama_mensal.js?v=219')
html = html.replace('img/logo-rounded.png?v=217', 'img/logo-rounded.png?v=219')
print("Bumped version query params to v219")

with open(index_path, "w", encoding="utf-8") as fp:
    fp.write(html)
print("Successfully wrote updated index.html")
