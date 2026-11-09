import os
import re

BASE_DIR = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"

# ==============================================================================
# 1. PATCH INDEX.HTML
# ==============================================================================
index_path = os.path.join(BASE_DIR, "index.html")
with open(index_path, "r", encoding="utf-8") as f:
    index_content = f.read()

# 1.1 Add Panorama Semanal to the Dropdown Menu (lines 665-675)
dropdown_target = '''            <a onclick="window.closeAllNavDropdowns(); window.openSocialModalTempoAgora && window.openSocialModalTempoAgora()" class="nav-dropdown-item cursor-pointer">
              <i data-lucide="camera" class="w-3.5 h-3.5 text-[#ea580c] shrink-0"></i>
              <div>
                <span class="font-bold text-[#ea580c]">Baixar Card Tempo Agora</span>
                <span class="nav-dropdown-item-desc">Imagem oficial completa para Post ou Stories</span>
              </div>
            </a>'''

dropdown_replacement = '''            <a onclick="window.closeAllNavDropdowns(); window.openSocialModalTempoAgora && window.openSocialModalTempoAgora()" class="nav-dropdown-item cursor-pointer">
              <i data-lucide="camera" class="w-3.5 h-3.5 text-[#ea580c] shrink-0"></i>
              <div>
                <span class="font-bold text-[#ea580c]">Baixar Card Tempo Agora</span>
                <span class="nav-dropdown-item-desc">Imagem oficial completa para Post ou Stories</span>
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
            </a>'''

if dropdown_target in index_content:
    index_content = index_content.replace(dropdown_target, dropdown_replacement, 1)
    print("Patch 1.1 applied: Dropdown menu item")
else:
    print("Warning 1.1: dropdown_target not found")

# 1.2 Add Quick Access Pill in Hero Card
hero_target = '''          <!-- Botão de Alto Destaque: Baixar Imagem Oficial do Tempo Agora -->
          <div class="mb-3">
            <button 
              type="button" 
              id="btn-hero-export-social-main" 
              onclick="openSocialModalTempoAgora()" 
              class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-[#ffebe4] via-[#fff7ed] to-[#ffebe4] hover:brightness-95 text-[#c2410c] dark:text-[#ea580c] border-2 border-[#f07a53] shadow-xs transition cursor-pointer active:scale-98" 
              title="Clique para abrir e baixar a imagem oficial completa do Tempo Agora para postar"
            >
              <i data-lucide="camera" class="w-4 h-4 text-[#ea580c]"></i>
              <span class="tracking-wide">📸 BAIXAR IMAGEM DO TEMPO AGORA (PARA POSTAR)</span>
            </button>
          </div>'''

hero_replacement = '''          <!-- Botão de Alto Destaque: Baixar Imagem Oficial do Tempo Agora -->
          <div class="mb-3 space-y-2">
            <button 
              type="button" 
              id="btn-hero-export-social-main" 
              onclick="openSocialModalTempoAgora()" 
              class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-[#ffebe4] via-[#fff7ed] to-[#ffebe4] hover:brightness-95 text-[#c2410c] dark:text-[#ea580c] border-2 border-[#f07a53] shadow-xs transition cursor-pointer active:scale-98" 
              title="Clique para abrir e baixar a imagem oficial completa do Tempo Agora para postar"
            >
              <i data-lucide="camera" class="w-4 h-4 text-[#ea580c]"></i>
              <span class="tracking-wide">📸 BAIXAR IMAGEM DO TEMPO AGORA (PARA POSTAR)</span>
            </button>

            <!-- Botão de Acesso Direto ao Panorama Semanal (7 Dias) -->
            <button 
              type="button" 
              id="btn-hero-panorama-semanal" 
              onclick="navigateSubSection('previsao', 'section-panorama-semanal', event)" 
              class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-[#0284c7] dark:text-sky-300 border border-sky-400/40 shadow-xs transition cursor-pointer" 
              title="Ver o Panorama Meteorológico Completo de 7 Dias para esta semana"
            >
              <i data-lucide="calendar-days" class="w-4 h-4 text-[#0284c7]"></i>
              <span class="tracking-tight">🗓️ VER PANORAMA SEMANAL (7 DIAS • VENTO, RAJADAS, CHUVA & SISTEMAS)</span>
            </button>
          </div>'''

if hero_target in index_content:
    index_content = index_content.replace(hero_target, hero_replacement, 1)
    print("Patch 1.2 applied: Hero quick button")
else:
    print("Warning 1.2: hero_target not found")

# 1.3 Add Section #section-panorama-semanal right after section-previsao-3dias
section_target = '''  </section>

  <!-- ========================================================================= -->
  <!-- SEÇÃO DE PANORAMA SINÓTICO GERAL (METEOROLOGIA & DINÂMICA DA TROPOSFERA)    -->
  <!-- ========================================================================= -->'''

section_replacement = '''  </section>

  <!-- ========================================================================= -->
  <!-- SEÇÃO DE PANORAMA SEMANAL (7 DIAS - SEGUNDA A DOMINGO)                    -->
  <!-- ========================================================================= -->
  <section id="section-panorama-semanal" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5 w-full hidden">
    <!-- Gerado dinamicamente via js/weekly-overview.js -->
  </section>

  <!-- ========================================================================= -->
  <!-- SEÇÃO DE PANORAMA SINÓTICO GERAL (METEOROLOGIA & DINÂMICA DA TROPOSFERA)    -->
  <!-- ========================================================================= -->'''

if section_target in index_content:
    index_content = index_content.replace(section_target, section_replacement, 1)
    print("Patch 1.3 applied: section-panorama-semanal")
else:
    print("Warning 1.3: section_target not found")

# 1.4 Add 4th tab button to modal-social-chuva
modal_tab_target = '''        <button 
          type="button" 
          id="social-tab-btn-vento" 
          onclick="setSocialTab('vento')" 
          class="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#f8fafc] hover:bg-[#e0f2fe] border border-[#cbd5e1] text-black cursor-pointer flex items-center justify-center gap-1.5 transition whitespace-nowrap"
        >
          <i data-lucide="wind" class="w-4 h-4 text-[#0284c7]"></i>
          <span>💨 Ventos & Rajadas</span>
        </button>
      </div>'''

modal_tab_replacement = '''        <button 
          type="button" 
          id="social-tab-btn-vento" 
          onclick="setSocialTab('vento')" 
          class="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#f8fafc] hover:bg-[#e0f2fe] border border-[#cbd5e1] text-black cursor-pointer flex items-center justify-center gap-1.5 transition whitespace-nowrap"
        >
          <i data-lucide="wind" class="w-4 h-4 text-[#0284c7]"></i>
          <span>💨 Ventos & Rajadas</span>
        </button>
        <button 
          type="button" 
          id="social-tab-btn-semanal" 
          onclick="setSocialTab('semanal')" 
          class="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#f8fafc] hover:bg-[#e0f2fe] border border-[#cbd5e1] text-black cursor-pointer flex items-center justify-center gap-1.5 transition whitespace-nowrap"
        >
          <i data-lucide="calendar-days" class="w-4 h-4 text-[#0284c7]"></i>
          <span>🗓️ Panorama Semanal</span>
        </button>
      </div>'''

if modal_tab_target in index_content:
    index_content = index_content.replace(modal_tab_target, modal_tab_replacement, 1)
    print("Patch 1.4 applied: modal tab button semanal")
else:
    print("Warning 1.4: modal_tab_target not found")

# 1.5 Update window.SUB_SECTIONS_CONFIG in index.html
sub_cfg_target = "sections: ['section-hero-previsao', 'section-graficos-tendencia', 'section-previsao-3dias', 'section-panorama-sinotico', 'section-plancon-resumo']"
sub_cfg_replacement = "sections: ['section-hero-previsao', 'section-graficos-tendencia', 'section-previsao-3dias', 'section-panorama-semanal', 'section-panorama-sinotico', 'section-plancon-resumo']"

if sub_cfg_target in index_content:
    index_content = index_content.replace(sub_cfg_target, sub_cfg_replacement)
    print("Patch 1.5 applied: SUB_SECTIONS_CONFIG in index.html")
else:
    print("Warning 1.5: sub_cfg_target not found")

# 1.6 Bump app.js version to 196
index_content = index_content.replace('src="js/app.js?v=195"', 'src="js/app.js?v=196"')
print("Patch 1.6 applied: Version bumped to 196 in index.html")

with open(index_path, "w", encoding="utf-8") as f:
    f.write(index_content)

# ==============================================================================
# 2. PATCH JS/APP.JS
# ==============================================================================
app_path = os.path.join(BASE_DIR, "js", "app.js")
with open(app_path, "r", encoding="utf-8") as f:
    app_content = f.read()

# 2.1 Update imports at top of app.js
app_import_target = "} from './social-cards.js?v=195';"
app_import_replacement = """  openSocialModalVento,
  openSocialModalSemanal
} from './social-cards.js?v=196';
import { renderPanoramaSemanal, resolveWeeklyForecast7Days } from './weekly-overview.js?v=196';"""

if app_import_target in app_content:
    app_content = app_content.replace(app_import_target, app_import_replacement, 1)
    print("Patch 2.1 applied: app.js imports")
else:
    print("Warning 2.1: app_import_target not found")

# 2.2 Update SUB_SECTIONS_CONFIG in app.js
app_sub_target = """    sections: [
      'section-hero-previsao',
      'section-graficos-tendencia',
      'section-previsao-3dias',
      'section-panorama-sinotico',
      'section-plancon-resumo'
    ]"""

app_sub_replacement = """    sections: [
      'section-hero-previsao',
      'section-graficos-tendencia',
      'section-previsao-3dias',
      'section-panorama-semanal',
      'section-panorama-sinotico',
      'section-plancon-resumo'
    ]"""

if app_sub_target in app_content:
    app_content = app_content.replace(app_sub_target, app_sub_replacement, 1)
    print("Patch 2.2 applied: SUB_SECTIONS_CONFIG in app.js")
else:
    print("Warning 2.2: app_sub_target not found")

# 2.3 Call renderPanoramaSemanal inside renderDashboardUI
# Right before the end of renderDashboardUI
render_dash_target = """    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }
}



/**

 * Função Auxiliar para Cores e Badges Oficiais dos Alertas do INMET"""

render_dash_replacement = """    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // Renderiza a Seção Completa de Panorama Semanal (7 Dias)
  try {
    if (typeof renderPanoramaSemanal === 'function') {
      renderPanoramaSemanal(weather, meta);
    }
  } catch (errWeekly) {
    console.warn('[Weekly Overview] Erro ao renderizar panorama semanal:', errWeekly);
  }
}



/**

 * Função Auxiliar para Cores e Badges Oficiais dos Alertas do INMET"""

if render_dash_target in app_content:
    app_content = app_content.replace(render_dash_target, render_dash_replacement, 1)
    print("Patch 2.3 applied: renderPanoramaSemanal call in renderDashboardUI")
else:
    print("Warning 2.3: render_dash_target not found")

# 2.4 Add openSocialModalSemanal to global window
app_global_target = "window.openSocialModalVento = openSocialModalVento;"
app_global_replacement = """window.openSocialModalVento = openSocialModalVento;
window.openSocialModalSemanal = openSocialModalSemanal;
window.renderPanoramaSemanal = renderPanoramaSemanal;
window.resolveWeeklyForecast7Days = resolveWeeklyForecast7Days;"""

if app_global_target in app_content:
    app_content = app_content.replace(app_global_target, app_global_replacement, 1)
    print("Patch 2.4 applied: app.js global window exports")
else:
    print("Warning 2.4: app_global_target not found, trying append")
    app_content += "\nwindow.openSocialModalSemanal = openSocialModalSemanal;\nwindow.renderPanoramaSemanal = renderPanoramaSemanal;\n"

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_content)

# ==============================================================================
# 3. PATCH JS/SOCIAL-CARDS.JS (UPDATE DOWNLOAD BUTTON & FILENAME)
# ==============================================================================
sc_path = os.path.join(BASE_DIR, "js", "social-cards.js")
with open(sc_path, "r", encoding="utf-8") as f:
    sc_content = f.read()

# 3.1 updateDownloadButtonLabel
sc_btn_target = """  if (socialState.activeTab === 'tempo') {
    btn.innerHTML = `<i data-lucide="download" class="w-4 h-4 text-black"></i><span>Baixar Card do Tempo Agora (${fmtText})</span>`;
  } else if (socialState.activeTab === 'vento') {
    btn.innerHTML = `<i data-lucide="download" class="w-4 h-4 text-black"></i><span>Baixar Card de Ventos & Rajadas (${fmtText})</span>`;
  } else {
    btn.innerHTML = `<i data-lucide="download" class="w-4 h-4 text-black"></i><span>Baixar Card de Chuva (${fmtText})</span>`;
  }"""

sc_btn_replacement = """  if (socialState.activeTab === 'tempo') {
    btn.innerHTML = `<i data-lucide="download" class="w-4 h-4 text-black"></i><span>Baixar Card do Tempo Agora (${fmtText})</span>`;
  } else if (socialState.activeTab === 'vento') {
    btn.innerHTML = `<i data-lucide="download" class="w-4 h-4 text-black"></i><span>Baixar Card de Ventos & Rajadas (${fmtText})</span>`;
  } else if (socialState.activeTab === 'semanal') {
    btn.innerHTML = `<i data-lucide="download" class="w-4 h-4 text-black"></i><span>Baixar Card Semanal (7 Dias) (${fmtText})</span>`;
  } else {
    btn.innerHTML = `<i data-lucide="download" class="w-4 h-4 text-black"></i><span>Baixar Card de Chuva (${fmtText})</span>`;
  }"""

if sc_btn_target in sc_content:
    sc_content = sc_content.replace(sc_btn_target, sc_btn_replacement, 1)
    print("Patch 3.1 applied: social-cards.js button label")
else:
    print("Warning 3.1: sc_btn_target not found")

# 3.2 downloadSocialCard filename
sc_fn_target = """  if (socialState.activeTab === 'tempo') {
    fileName = `tempo_agora_${fmtName}_riodasostras.png`;
    shareTitle = 'Tempo Agora - Rio das Ostras, RJ';
    const tempText = (document.getElementById('sidebar-temp')?.textContent || '').trim();
    const condText = (document.getElementById('hero-condition')?.textContent || '').trim();
    shareText = `Condições completas do tempo agora em Rio das Ostras (${tempText} C, ${condText}). Canal Oficial @tempoemriodasostras`;
  } else if (socialState.activeTab === 'vento') {
    fileName = `maiores_ventos_rajadas_${socialState.windMetric}_${fmtName}_riodasostras.png`;
    shareTitle = 'Maiores Ventos e Rajadas - Rio das Ostras';
    shareText = `Maiores ventos e rajadas registrados pela rede municipal de Rio das Ostras (${socialState.windMetric.toUpperCase()}).`;
  } else {"""

sc_fn_replacement = """  if (socialState.activeTab === 'tempo') {
    fileName = `tempo_agora_${fmtName}_riodasostras.png`;
    shareTitle = 'Tempo Agora - Rio das Ostras, RJ';
    const tempText = (document.getElementById('sidebar-temp')?.textContent || '').trim();
    const condText = (document.getElementById('hero-condition')?.textContent || '').trim();
    shareText = `Condições completas do tempo agora em Rio das Ostras (${tempText} C, ${condText}). Canal Oficial @tempoemriodasostras`;
  } else if (socialState.activeTab === 'vento') {
    fileName = `maiores_ventos_rajadas_${socialState.windMetric}_${fmtName}_riodasostras.png`;
    shareTitle = 'Maiores Ventos e Rajadas - Rio das Ostras';
    shareText = `Maiores ventos e rajadas registrados pela rede municipal de Rio das Ostras (${socialState.windMetric.toUpperCase()}).`;
  } else if (socialState.activeTab === 'semanal') {
    fileName = `panorama_semanal_7dias_${fmtName}_riodasostras.png`;
    shareTitle = 'Panorama Semanal (7 Dias) - Rio das Ostras, RJ';
    shareText = 'Panorama Meteorológico Semanal (7 Dias) de Rio das Ostras: vento, rajadas, chuva e sistemas atuantes. Canal Oficial @tempoemriodasostras';
  } else {"""

if sc_fn_target in sc_content:
    sc_content = sc_content.replace(sc_fn_target, sc_fn_replacement, 1)
    print("Patch 3.2 applied: social-cards.js download filename")
else:
    print("Warning 3.2: sc_fn_target not found")

with open(sc_path, "w", encoding="utf-8") as f:
    f.write(sc_content)

print("All patches completed successfully!")
