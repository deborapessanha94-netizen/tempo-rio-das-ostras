import re

INDEX_PATH = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html'
APP_JS_PATH = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\app.js'

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove btn-hero-export-social from top right pill group
# Target pattern: <button type="button" id="btn-hero-export-social" ... </button>
pattern_top_btn = re.compile(r'\s*<button\s+type="button"\s+id="btn-hero-export-social".*?</button>', re.DOTALL)
if pattern_top_btn.search(content):
    content = pattern_top_btn.sub('', content, count=1)
    print("SUCCESS: Removed btn-hero-export-social")
else:
    print("WARNING: Could not find btn-hero-export-social")

# 2. Remove banner block containing btn-hero-export-social-main and btn-hero-panorama-semanal
# Target pattern: <!-- Botão de Alto Destaque: Baixar Imagem Oficial do Tempo Agora --> <div class="mb-3 space-y-2">...</div>
pattern_main_banner = re.compile(
    r'\s*<!--\s*Botão de Alto Destaque: Baixar Imagem Oficial do Tempo Agora\s*-->\s*<div class="mb-3 space-y-2">.*?</div>',
    re.DOTALL
)
if pattern_main_banner.search(content):
    content = pattern_main_banner.sub('', content, count=1)
    print("SUCCESS: Removed main banner block (btn-hero-export-social-main + btn-hero-panorama-semanal)")
else:
    print("WARNING: Could not find main banner block")

# 3. Remove footer "Postar Tempo Agora" button from hero card
# Target pattern: <button\s+type="button"\s+onclick="openSocialModalTempoAgora()".*?Postar Tempo Agora.*?</span>\s*</button>
pattern_footer_btn = re.compile(
    r'\s*<button\s+type="button"\s+onclick="openSocialModalTempoAgora\(\)"[^>]*>.*?Postar Tempo Agora.*?</span>\s*</button>',
    re.DOTALL
)
if pattern_footer_btn.search(content):
    content = pattern_footer_btn.sub('', content, count=1)
    print("SUCCESS: Removed footer Postar Tempo Agora button")
else:
    print("WARNING: Could not find footer Postar Tempo Agora button")

# 4. Update dropdown menu inside #nav-wrapper-previsao
# Let's locate the dropdown inside nav-wrapper-previsao
pattern_dropdown = re.compile(
    r'(<div id="nav-wrapper-previsao"[^>]*>.*?<div class="space-y-0\.5">)(.*?)(<a onclick="window\.closeAllNavDropdowns\(\); window\.showAllSubSections\(\'previsao\'\);")',
    re.DOTALL
)

new_dropdown_items = """
            <a onclick="navigateSubSection('previsao', 'section-hero-previsao', event)" class="nav-dropdown-item cursor-pointer">
              <i data-lucide="zap" class="w-3.5 h-3.5 text-[#f07a53] shrink-0"></i>
              <div>
                <span class="font-bold text-slate-800 dark:text-slate-100">Tempo Agora</span>
                <span class="nav-dropdown-item-desc">Condições em tempo real, temperatura e sensação</span>
              </div>
            </a>
            <a onclick="navigateSubSection('previsao', 'section-panorama-semanal', event)" class="nav-dropdown-item cursor-pointer">
              <i data-lucide="calendar-days" class="w-3.5 h-3.5 text-[#0284c7] shrink-0"></i>
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="font-bold text-slate-800 dark:text-slate-100">Panorama Semanal (7 Dias)</span>
                  <span class="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">Segunda a Domingo</span>
                </div>
                <span class="nav-dropdown-item-desc">Resumo da semana: vento, rajadas, chuva, sistemas atuantes e riscos de extremos</span>
              </div>
            </a>
            <a onclick="navigateSubSection('previsao', 'section-graficos-tendencia', event)" class="nav-dropdown-item cursor-pointer">
              <i data-lucide="activity" class="w-3.5 h-3.5 text-[#0284c7] shrink-0"></i>
              <div>
                <span>Gráficos de Tendência</span>
                <span class="nav-dropdown-item-desc">Evolução horária de 72h (Temp, Chuva, Vento)</span>
              </div>
            </a>
            <a onclick="navigateSubSection('previsao', 'section-previsao-3dias', event)" class="nav-dropdown-item cursor-pointer">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-[#ea580c] shrink-0"></i>
              <div>
                <span>Previsão dos Próximos Dias</span>
                <span class="nav-dropdown-item-desc">Cards operacionais de 4 dias (Hoje + 3 dias à frente) com mar e detalhes</span>
              </div>
            </a>
            <a onclick="navigateSubSection('previsao', 'section-panorama-sinotico', event)" class="nav-dropdown-item cursor-pointer">
              <i data-lucide="compass" class="w-3.5 h-3.5 text-[#d97706] shrink-0"></i>
              <div>
                <span>Panorama Sinótico Geral</span>
                <span class="nav-dropdown-item-desc">Diagnóstico sinótico e termodinâmico de mesoescala</span>
              </div>
            </a>
            <a onclick="navigateSubSection('previsao', 'section-plancon-resumo', event)" class="nav-dropdown-item cursor-pointer">
              <i data-lucide="shield" class="w-3.5 h-3.5 text-[#16a34a] shrink-0"></i>
              <div>
                <span>Plano de Contingência (PLANCON)</span>
                <span class="nav-dropdown-item-desc">Níveis e protocolos operacionais da Defesa Civil</span>
              </div>
            </a>

            <!-- Ações de Baixar Imagens Oficiais para Redes Sociais -->
            <div class="border-t border-slate-200 dark:border-slate-800 my-1.5 pt-2 px-1">
              <div class="text-[10px] font-black uppercase tracking-wider text-[#ea580c] dark:text-[#ea580c] mb-1.5 px-2 flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <i data-lucide="camera" class="w-3.5 h-3.5 text-[#ea580c]"></i>
                  <span>Baixar Cards Oficiais (Redes Sociais)</span>
                </span>
                <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#ffebe4] dark:bg-orange-950/60 text-[#c2410c] dark:text-orange-300">Feed & Story</span>
              </div>
              <div class="space-y-1">
                <a onclick="window.closeAllNavDropdowns(); window.openSocialModalWithTab ? window.openSocialModalWithTab('tempo') : window.openSocialModalTempoAgora();" class="nav-dropdown-item cursor-pointer bg-[#fff7ed] hover:bg-[#ffedd5] dark:bg-slate-800/90 dark:hover:bg-slate-700/90 border border-[#fed7aa] dark:border-slate-700 rounded-xl">
                  <i data-lucide="sun-medium" class="w-4 h-4 text-[#ea580c] shrink-0"></i>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-1">
                      <span class="font-bold text-xs text-[#9a3412] dark:text-[#fb923c]">Baixar Card Tempo Agora</span>
                      <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200 uppercase">Post / Story</span>
                    </div>
                    <span class="nav-dropdown-item-desc">Imagem oficial completa com temperatura, chuva e 8 sensores</span>
                  </div>
                </a>
                <a onclick="window.closeAllNavDropdowns(); window.openSocialModalWithTab ? window.openSocialModalWithTab('semanal') : window.openSocialModalSemanal();" class="nav-dropdown-item cursor-pointer bg-sky-50 hover:bg-sky-100 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 border border-sky-200 dark:border-slate-700 rounded-xl">
                  <i data-lucide="calendar-days" class="w-4 h-4 text-[#0284c7] shrink-0"></i>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-1">
                      <span class="font-bold text-xs text-[#0369a1] dark:text-sky-300">Baixar Card Panorama Semanal</span>
                      <span class="text-[9px] font-black px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-800 dark:text-sky-200 uppercase">7 Dias</span>
                    </div>
                    <span class="nav-dropdown-item-desc">Resumo da semana: vento, rajadas, chuva e sistemas atuantes</span>
                  </div>
                </a>
              </div>
            </div>
            """

def repl_dropdown(m):
    return m.group(1) + new_dropdown_items + m.group(3)

if pattern_dropdown.search(content):
    content = pattern_dropdown.sub(repl_dropdown, content, count=1)
    print("SUCCESS: Updated #nav-wrapper-previsao dropdown")
else:
    print("WARNING: Could not match #nav-wrapper-previsao dropdown pattern")

# 5. Add "Baixar Card" in section-previsao-3dias header
pattern_3dias_header = re.compile(
    r'(<section id="section-previsao-3dias"[^>]*>.*?<div class="flex items-center justify-between border-b border-\[#dfb992\]/15 pb-3">.*?<div>.*?<h3[^>]*>Previsão dos Próximos Dias</h3>.*?<p id="sidebar-period-txt"[^>]*>.*?</p>\s*</div>\s*</div>)(\s*</div>)',
    re.DOTALL
)

btn_3dias_card = """
        <div class="flex items-center gap-2">
          <button 
            type="button" 
            onclick="window.openSocialModalWithTab ? window.openSocialModalWithTab('tempo') : window.openSocialModalTempoAgora()" 
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-[#ffebe4] hover:bg-[#ffd9cb] text-black border border-[#f07a53] shadow-xs transition cursor-pointer" 
            title="Baixar imagem oficial para postar nas redes sociais"
          >
            <i data-lucide="camera" class="w-3.5 h-3.5 text-[#ea580c]"></i>
            <span class="hidden sm:inline">Baixar Card</span>
            <span class="sm:hidden">Baixar</span>
          </button>
        </div>"""

def repl_3dias(m):
    return m.group(1) + btn_3dias_card + m.group(2)

if pattern_3dias_header.search(content):
    content = pattern_3dias_header.sub(repl_3dias, content, count=1)
    print("SUCCESS: Added Baixar Card in section-previsao-3dias header")
else:
    print("WARNING: Could not match section-previsao-3dias header pattern")

# 6. Add fallbacks for openSocialModalSemanal & openSocialModalWithTab in index.html script tag
target_fallback = "window.openSocialModalTempoAgora = function() {"
replacement_fallback = """window.openSocialModalSemanal = function() {
      if (typeof window.openSocialModalWithTab === 'function') window.openSocialModalWithTab('semanal');
      else if (typeof window.openSocialModalChuva === 'function') {
        window.openSocialModalChuva();
        if (typeof window.setSocialTab === 'function') window.setSocialTab('semanal');
      }
    };
    window.openSocialModalWithTab = window.openSocialModalWithTab || function(tab) {
      if (tab === 'semanal' && typeof window.openSocialModalSemanal === 'function') return window.openSocialModalSemanal();
      if (tab === 'tempo' && typeof window.openSocialModalTempoAgora === 'function') return window.openSocialModalTempoAgora();
      if (tab === 'vento' && typeof window.openSocialModalVento === 'function') return window.openSocialModalVento();
      if (typeof window.openSocialModalChuva === 'function') {
        window.openSocialModalChuva();
        if (typeof window.setSocialTab === 'function') window.setSocialTab(tab || 'tempo');
      }
    };
    window.openSocialModalTempoAgora = function() {"""

if target_fallback in content:
    content = content.replace(target_fallback, replacement_fallback, 1)
    print("SUCCESS: Added script fallbacks for openSocialModalSemanal & openSocialModalWithTab")

# 7. Bump version to v=197 in index.html
content = content.replace('src="js/app.js?v=196"', 'src="js/app.js?v=197"')
print("SUCCESS: Bumped index.html to v=197")

with open(INDEX_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

# Update js/app.js to v=197
with open(APP_JS_PATH, 'r', encoding='utf-8') as f:
    app_js = f.read()

app_js = app_js.replace("social-cards.js?v=196", "social-cards.js?v=197")
app_js = app_js.replace("weekly-overview.js?v=196", "weekly-overview.js?v=197")

with open(APP_JS_PATH, 'w', encoding='utf-8') as f:
    f.write(app_js)

print("SUCCESS: Bumped js/app.js imports to v=197")
