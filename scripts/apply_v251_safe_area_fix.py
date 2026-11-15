# -*- coding: utf-8 -*-
import os
import re

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"

# 1. Update src/index.css
css_path = os.path.join(base_dir, "src", "index.css")
with open(css_path, "r", encoding="utf-8") as f:
    css_content = f.read()

safe_css = """
/* Safe area insets for iOS / Android notch & home indicator */
:root {
  --sat: env(safe-area-inset-top, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
  --sar: env(safe-area-inset-right, 0px);
}

.pt-safe {
  padding-top: env(safe-area-inset-top, 0px);
}
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.pl-safe {
  padding-left: env(safe-area-inset-left, 0px);
}
.pr-safe {
  padding-right: env(safe-area-inset-right, 0px);
}

html {
  height: -webkit-fill-available;
}

body {
  min-height: 100vh;
  min-height: -webkit-fill-available;
}
"""

if "safe-area-inset" not in css_content:
    css_content = css_content + "\n" + safe_css
    with open(css_path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(css_content)
    print("Updated src/index.css with safe-area variables and rules.")

# 2. Update index.html
index_path = os.path.join(base_dir, "index.html")
with open(index_path, "r", encoding="utf-8") as f:
    html_content = f.read()

html_content = html_content.replace(
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
    '<meta name="apple-mobile-web-app-status-bar-style" content="default" />'
)

with open(index_path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(html_content)
print("Updated index.html: apple-mobile-web-app-status-bar-style set to default.")

# 3. Update src/App.tsx
app_path = os.path.join(base_dir, "src", "App.tsx")
with open(app_path, "r", encoding="utf-8") as f:
    app_code = f.read()

# 3.1 Update TAB_SUBSECTIONS with shortLabel
old_subsections = """const TAB_SUBSECTIONS: Record<SectionTab, { id: string; label: string }[]> = {
  previsao: [
    { id: 'tempo-agora', label: 'Tempo Agora' },
    { id: 'graficos', label: 'Gráficos de Tendência' },
    { id: 'proximos-dias', label: 'Previsão dos Próximos Dias' },
    { id: 'sinotico', label: 'Panorama Sinótico Geral' },
    { id: 'plancon', label: 'Plano de Contingência (PLANCON)' },
    { id: 'all', label: 'Ver Todas as Seções' },
  ],
  chuva: [
    { id: 'resumo', label: 'Resumo & KPIs de Chuva' },
    { id: 'cards', label: '10 Estações da Rede' },
    { id: 'tabela', label: 'Tabela Comparativa' },
    { id: 'planilha', label: 'Histórico em Planilha' },
    { id: 'all', label: 'Ver Todas as Seções' },
  ],
  rio: [
    { id: 'cota', label: 'Cota Atual & Calha do Rio' },
    { id: 'historico', label: 'Histórico Telemétrico 24h & 10d' },
    { id: 'macae', label: 'Rios da Região (Macaé & RH-VIII)' },
    { id: 'all', label: 'Ver Todas as Seções' },
  ],
  orla: [
    { id: 'mar', label: 'Condições do Mar & Ondas' },
    { id: 'mares', label: 'Tábua de Marés' },
    { id: 'balnear', label: 'Balneabilidade das Praias' },
    { id: 'all', label: 'Ver Todas as Seções' },
  ],
  alertas: [
    { id: 'avisos', label: 'Alertas Meteorológicos Vigentes' },
    { id: 'cemaden', label: 'Riscos Geo-Hidrológicos (CEMADEN)' },
    { id: 'all', label: 'Ver Todas as Seções' },
  ],
  boletim: [
    { id: 'turnos', label: 'Previsão Operacional 16 Turnos' },
    { id: 'meteogramas', label: 'Meteogramas Numéricos' },
    { id: 'telefones', label: 'Telefones Úteis & Pronta Resposta' },
    { id: 'all', label: 'Ver Todas as Seções' },
  ],
  panorama: [
    { id: 'video', label: 'Vídeo Reels (9:16)' },
    { id: 'feed', label: 'Carrossel Feed (4:5)' },
    { id: 'stories', label: 'Stories / Reels (9:16)' },
    { id: 'legenda', label: 'Legenda Formatada' },
  ],
};"""

new_subsections = """const TAB_SUBSECTIONS: Record<SectionTab, { id: string; label: string; shortLabel?: string }[]> = {
  previsao: [
    { id: 'tempo-agora', label: 'Tempo Agora', shortLabel: 'Tempo Agora' },
    { id: 'graficos', label: 'Gráficos de Tendência', shortLabel: 'Gráficos' },
    { id: 'proximos-dias', label: 'Previsão dos Próximos Dias', shortLabel: 'Próximos Dias' },
    { id: 'sinotico', label: 'Panorama Sinótico Geral', shortLabel: 'Sinótico' },
    { id: 'plancon', label: 'Plano de Contingência (PLANCON)', shortLabel: 'PLANCON' },
    { id: 'all', label: 'Ver Todas as Seções', shortLabel: 'Ver Tudo' },
  ],
  chuva: [
    { id: 'resumo', label: 'Resumo & KPIs de Chuva', shortLabel: 'Resumo' },
    { id: 'cards', label: '10 Estações da Rede', shortLabel: '10 Estações' },
    { id: 'tabela', label: 'Tabela Comparativa', shortLabel: 'Tabela' },
    { id: 'planilha', label: 'Histórico em Planilha', shortLabel: 'Planilha' },
    { id: 'all', label: 'Ver Todas as Seções', shortLabel: 'Ver Tudo' },
  ],
  rio: [
    { id: 'cota', label: 'Cota Atual & Calha do Rio', shortLabel: 'Cota Atual' },
    { id: 'historico', label: 'Histórico Telemétrico 24h & 10d', shortLabel: 'Histórico' },
    { id: 'macae', label: 'Rios da Região (Macaé & RH-VIII)', shortLabel: 'Rios Região' },
    { id: 'all', label: 'Ver Todas as Seções', shortLabel: 'Ver Tudo' },
  ],
  orla: [
    { id: 'mar', label: 'Condições do Mar & Ondas', shortLabel: 'Mar & Ondas' },
    { id: 'mares', label: 'Tábua de Marés', shortLabel: 'Marés' },
    { id: 'balnear', label: 'Balneabilidade das Praias', shortLabel: 'Balneabilidade' },
    { id: 'all', label: 'Ver Todas as Seções', shortLabel: 'Ver Tudo' },
  ],
  alertas: [
    { id: 'avisos', label: 'Alertas Meteorológicos Vigentes', shortLabel: 'Alertas' },
    { id: 'cemaden', label: 'Riscos Geo-Hidrológicos (CEMADEN)', shortLabel: 'CEMADEN' },
    { id: 'all', label: 'Ver Todas as Seções', shortLabel: 'Ver Tudo' },
  ],
  boletim: [
    { id: 'turnos', label: 'Previsão Operacional 16 Turnos', shortLabel: '16 Turnos' },
    { id: 'meteogramas', label: 'Meteogramas Numéricos', shortLabel: 'Meteogramas' },
    { id: 'telefones', label: 'Telefones Úteis & Pronta Resposta', shortLabel: 'Telefones' },
    { id: 'all', label: 'Ver Todas as Seções', shortLabel: 'Ver Tudo' },
  ],
  panorama: [
    { id: 'video', label: 'Vídeo Reels (9:16)', shortLabel: 'Vídeo' },
    { id: 'feed', label: 'Carrossel Feed (4:5)', shortLabel: 'Feed' },
    { id: 'stories', label: 'Stories / Reels (9:16)', shortLabel: 'Stories' },
    { id: 'legenda', label: 'Legenda Formatada', shortLabel: 'Legenda' },
  ],
};"""

app_code = app_code.replace(old_subsections, new_subsections)

# 3.2 Update <header> with safe-area padding top and responsive logo height
old_header = """      {/* Top Bar: 3 zones (Logo | Live Sync Status | Actions) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#14213D]/95 backdrop-blur-sm border-b border-[#E5E5E5] dark:border-[#233354]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FF8244] cursor-pointer"
              aria-label="Alternar menu de abas vertical"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setActiveTab('previsao');
                setSubForTab('previsao', 'tempo-agora');
              }}
              className="flex items-center shrink-0 cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8244]"
              aria-label="Início Tempo em Rio das Ostras"
            >
              <img
                src={isDark ? LOGO_DARK : LOGO_LIGHT}
                alt="TEMPO em Rio das Ostras"
                className="h-10 sm:h-11 w-auto object-contain rounded"
              />
            </button>
          </div>"""

new_header = """      {/* Top Bar: 3 zones (Logo | Live Sync Status | Actions) */}
      <header
        className="sticky top-0 z-40 bg-white/95 dark:bg-[#14213D]/95 backdrop-blur-sm border-b border-[#E5E5E5] dark:border-[#233354]"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        <div className="max-w-[1440px] mx-auto px-3 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FF8244] cursor-pointer"
              aria-label="Alternar menu de abas vertical"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setActiveTab('previsao');
                setSubForTab('previsao', 'tempo-agora');
              }}
              className="flex items-center shrink-0 cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8244]"
              aria-label="Início Tempo em Rio das Ostras"
            >
              <img
                src={isDark ? LOGO_DARK : LOGO_LIGHT}
                alt="TEMPO em Rio das Ostras"
                className="h-8 sm:h-11 w-auto object-contain rounded"
              />
            </button>
          </div>"""

app_code = app_code.replace(old_header, new_header)

# 3.3 Update header right buttons to have compact mobile App label
old_header_btns = """            {!isAppInstalled && (
              <button
                onClick={() => setShowInstallModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg bg-[#FF8244] hover:bg-[#e0682a] text-[#000000] shadow-sm transition-all cursor-pointer whitespace-nowrap"
                title="Baixar Aplicativo no Celular"
              >
                <Download className="w-3.5 h-3.5 text-[#000000]" />
                <span>Baixar App</span>
              </button>
            )}"""

new_header_btns = """            {!isAppInstalled && (
              <button
                onClick={() => setShowInstallModal(true)}
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs font-bold rounded-lg bg-[#FF8244] hover:bg-[#e0682a] text-[#000000] shadow-sm transition-all cursor-pointer whitespace-nowrap"
                title="Baixar Aplicativo no Celular"
              >
                <Download className="w-3.5 h-3.5 text-[#000000]" />
                <span className="hidden sm:inline">Baixar App</span>
                <span className="sm:hidden text-[11px]">App</span>
              </button>
            )}"""

app_code = app_code.replace(old_header_btns, new_header_btns)

# 3.4 Update Workspace Shell container with safe-area padding bottom
old_shell = """      {/* Workspace Shell: Left Vertical Tabs Rail + Main Content */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6 lg:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">"""

new_shell = """      {/* Workspace Shell: Left Vertical Tabs Rail + Main Content */}
      <div
        className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-8 py-4 sm:py-6 lg:py-8 flex flex-col lg:flex-row gap-5 lg:gap-8 items-start"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6.5rem)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 0.75rem)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 0.75rem)',
        }}
      >"""

app_code = app_code.replace(old_shell, new_shell)

# 3.5 Update Mobile Horizontal Subsections Pill Bar
old_pill_bar = """        {/* Mobile Horizontal Subsections Pill Bar (Navegação horizontal rápida de sub-seções) */}
        <div className="w-full lg:hidden overflow-x-auto scrollbar-none py-1 -mt-3">
          <div className="flex items-center gap-1.5 min-w-max px-0.5">
            {TAB_SUBSECTIONS[activeTab]?.map((sub) => {
              const isSubActive = subSection === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    setSubForTab(activeTab, sub.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isSubActive
                      ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-semibold shadow-xs'
                      : 'bg-white dark:bg-[#14213D] text-slate-600 dark:text-[#E5E5E5]/75 border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]/50'
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        </div>"""

new_pill_bar = """        {/* Mobile Horizontal Subsections Pill Bar (Navegação horizontal rápida de sub-seções) */}
        <div className="w-full lg:hidden overflow-x-auto scrollbar-none py-1 -mt-2">
          <div className="flex items-center gap-1.5 min-w-max px-1 pr-10">
            {TAB_SUBSECTIONS[activeTab]?.map((sub) => {
              const isSubActive = subSection === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    setSubForTab(activeTab, sub.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isSubActive
                      ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-bold shadow-xs'
                      : 'bg-white dark:bg-[#14213D] text-slate-600 dark:text-[#E5E5E5]/75 border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]/50 font-medium'
                  }`}
                >
                  {sub.shortLabel || sub.label}
                </button>
              );
            })}
          </div>
        </div>"""

app_code = app_code.replace(old_pill_bar, new_pill_bar)

# 3.6 Update Bottom Navigation Bar with safe-area bottom padding and wrap Baixar with !isAppInstalled
old_bottom_nav = """      <nav
        aria-label="Navegação rápida no celular"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#14213D]/95 backdrop-blur-md border-t border-[#E5E5E5] dark:border-[#233354] px-2 py-1.5 shadow-lg flex items-center justify-around"
      >
        {[
          { id: 'previsao' as SectionTab, label: 'Previsão', icon: CloudSun },
          { id: 'chuva' as SectionTab, label: 'Chuva', icon: CloudRain },
          { id: 'rio' as SectionTab, label: 'Rio Jundiá', icon: Waves },
          { id: 'orla' as SectionTab, label: 'Orla', icon: Umbrella },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#FF8244] font-semibold'
                  : 'text-slate-500 dark:text-[#E5E5E5]/65 hover:text-[#14213D] dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#FF8244]' : 'text-current'}`} />
              <span className="text-[10px] font-sans mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* Botão Baixar App no Bottom Nav */}
        <button
          onClick={() => setShowInstallModal(true)}
          className="flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[#FF8244] font-bold cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-[#FF8244] text-[#000000] flex items-center justify-center shadow-xs">
            <Download className="w-3.5 h-3.5" />
          </div>
          <span className="text-[9.5px] font-sans mt-0.5 tracking-tight font-extrabold text-[#FF8244]">Baixar</span>
        </button>

        {/* Botão Mais / Menu */}"""

new_bottom_nav = """      <nav
        aria-label="Navegação rápida no celular"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#14213D]/95 backdrop-blur-md border-t border-[#E5E5E5] dark:border-[#233354] px-2 pt-1.5 shadow-lg flex items-center justify-around"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.45rem)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        {[
          { id: 'previsao' as SectionTab, label: 'Previsão', icon: CloudSun },
          { id: 'chuva' as SectionTab, label: 'Chuva', icon: CloudRain },
          { id: 'rio' as SectionTab, label: 'Rio Jundiá', icon: Waves },
          { id: 'orla' as SectionTab, label: 'Orla', icon: Umbrella },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#FF8244] font-semibold'
                  : 'text-slate-500 dark:text-[#E5E5E5]/65 hover:text-[#14213D] dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#FF8244]' : 'text-current'}`} />
              <span className="text-[10px] font-sans mt-0.5 tracking-tight whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}

        {/* Botão Baixar App no Bottom Nav (Somente visível quando não instalado) */}
        {!isAppInstalled && (
          <button
            onClick={() => setShowInstallModal(true)}
            className="flex flex-col items-center justify-center py-1 px-1 rounded-lg text-[#FF8244] font-bold cursor-pointer shrink-0"
          >
            <div className="w-5 h-5 rounded-full bg-[#FF8244] text-[#000000] flex items-center justify-center shadow-xs">
              <Download className="w-3 h-3" />
            </div>
            <span className="text-[9px] font-sans mt-0.5 tracking-tight font-extrabold text-[#FF8244]">Baixar</span>
          </button>
        )}

        {/* Botão Mais / Menu */}"""

app_code = app_code.replace(old_bottom_nav, new_bottom_nav)

with open(app_path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(app_code)

print("Updated src/App.tsx with complete safe-area and responsive adjustments!")
