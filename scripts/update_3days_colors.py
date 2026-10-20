import os, re

# ==========================================
# 1. Update css/styles.css
# ==========================================
css_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\css\styles.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

old_cards_pattern = r'/\* Varia.*?o Card Coral Suave.*?(?=/\* ========================================================================= \*/)'

new_cards_block = """/* Variação Card Coral Suave (Inspirado no Vaso Terracota da Imagem) */
.card-coral {
  background: linear-gradient(150deg, #ffebe4 0%, #ffdcd1 100%) !important;
  border: 1.5px solid #f97316 !important;
  color: #000000 !important;
  box-shadow: 0 4px 16px rgba(249, 115, 22, 0.12) !important;
}

/* Variação Card Slate Ice (Inspirado no Vaso Slate Blue da Imagem) */
.card-slate {
  background: linear-gradient(150deg, #e3ecf4 0%, #d8e5f0 100%) !important;
  border: 1.5px solid #6d8ba6 !important;
  color: #000000 !important;
  box-shadow: 0 4px 16px rgba(61, 79, 97, 0.1) !important;
}

/* Variação Card Stoneware Sandstone (Inspirado no Vaso Cerâmica da Imagem) */
.card-stoneware {
  background: linear-gradient(150deg, #f5efe8 0%, #ebe2d7 100%) !important;
  border: 1.5px solid #b8a99a !important;
  color: #000000 !important;
  box-shadow: 0 4px 16px rgba(120, 100, 80, 0.08) !important;
}

/* Variação Card Central de Emergência Claro */
.card-navy-banner {
  background: #ffffff !important;
  border: 1.5px solid var(--border-medium) !important;
  color: #000000 !important;
  box-shadow: var(--shadow-card) !important;
}

"""

css, count = re.subn(old_cards_pattern, new_cards_block, css, flags=re.DOTALL)
print("Updated 3-days card styles in css/styles.css count:", count)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

# ==========================================
# 2. Update js/app.js
# ==========================================
app_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\app.js'
with open(app_path, 'r', encoding='utf-8') as f:
    app = f.read()

old_card_themes_pattern = r'const cardThemes = \[.*?\];'

new_card_themes_code = """const cardThemes = [
      {
        cardClass: 'card-coral shadow-sm',
        medallionClass: 'icon-medallion bg-white text-black border-1.5 border-[#f97316] shadow-xs',
        badgeText: 'text-black font-semibold',
        titleText: 'text-black font-extrabold',
        tempText: 'text-black font-extrabold bg-white/90 px-2.5 py-1 rounded-xl border border-[#f97316]/40 shadow-2xs',
        iconColor: 'text-black',
        chevronColor: 'text-black',
        subCardBg: 'bg-white/95 border border-[#f97316]/30 text-black shadow-2xs',
        subCardLabel: 'text-[#ea580c] font-bold text-[9.5px]'
      },
      {
        cardClass: 'card-slate shadow-sm',
        medallionClass: 'icon-medallion bg-white text-black border-1.5 border-[#6d8ba6] shadow-xs',
        badgeText: 'text-black font-semibold',
        titleText: 'text-black font-extrabold',
        tempText: 'text-black font-extrabold bg-white/90 px-2.5 py-1 rounded-xl border border-[#6d8ba6]/40 shadow-2xs',
        iconColor: 'text-black',
        chevronColor: 'text-black',
        subCardBg: 'bg-white/95 border border-[#6d8ba6]/30 text-black shadow-2xs',
        subCardLabel: 'text-[#3d4f61] font-bold text-[9.5px]'
      },
      {
        cardClass: 'card-stoneware shadow-sm',
        medallionClass: 'icon-medallion bg-white text-black border-1.5 border-[#b8a99a] shadow-xs',
        badgeText: 'text-black font-semibold',
        titleText: 'text-black font-extrabold',
        tempText: 'text-black font-extrabold bg-white/90 px-2.5 py-1 rounded-xl border border-[#b8a99a]/40 shadow-2xs',
        iconColor: 'text-black',
        chevronColor: 'text-black',
        subCardBg: 'bg-white/95 border border-[#b8a99a]/35 text-black shadow-2xs',
        subCardLabel: 'text-[#786350] font-bold text-[9.5px]'
      }
    ];"""

app, count_app = re.subn(old_card_themes_pattern, new_card_themes_code, app, flags=re.DOTALL)
print("Updated cardThemes in js/app.js count:", count_app)

# Bump version in app.js
app = app.replace("register('./sw.js?v=68')", "register('./sw.js?v=69')")

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app)

# ==========================================
# 3. Update index.html
# ==========================================
html_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Update header of 3-days forecast section
old_3days_header = """      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#dfb992]/15 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-zinc-100 text-[#334155] border border-[#e2e8f0] flex items-center justify-center shrink-0">
            <i data-lucide="calendar" class="w-4 h-4"></i>
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-bold text-[#1e293b] tracking-tight">Previsão dos Próximos Dias</h3>
            <p id="sidebar-period-txt" class="text-xs font-normal text-[#64748b]">20/10 (Terça-feira) a 22/10 (Quinta-feira)</p>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button onclick="document.getElementById('modal-boletim-tecnico').classList.remove('hidden'); document.getElementById('modal-boletim-tecnico').classList.add('flex');" class="btn-coral-pill text-xs py-1.5 px-3.5 cursor-pointer" title="Abrir boletim completo com previsão dos 12 turnos">
            <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i>
            <span>Boletim Completo (12 Turnos) →</span>
          </button>
          <button id="btn-open-meteogramas-card" class="text-xs font-semibold text-[#334155] hover:text-[#1e293b] px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-[#f1f5f9] border border-[#e2e8f0] transition flex items-center gap-1.5 cursor-pointer" title="Ver Meteogramas Oficiais do INMET e CPTEC/INPE">
            <i data-lucide="line-chart" class="w-3.5 h-3.5 text-[#64748b]"></i>
            <span>Meteogramas</span>
          </button>
          <a href="https://previsao.inmet.gov.br/3304524" target="_blank" rel="noopener noreferrer" class="text-xs font-semibold text-[#334155] hover:text-[#1e293b] px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-[#f1f5f9] border border-[#e2e8f0] transition flex items-center gap-1.5" title="Abrir previsão oficial do INMET para Rio das Ostras">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>INMET →</span>
          </a>
        </div>
      </div>"""

new_3days_header = """      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#cbd5e1] pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-[#ffebe4] text-black border border-[#f97316] flex items-center justify-center shrink-0 shadow-xs">
            <i data-lucide="calendar" class="w-4 h-4 text-black"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-base sm:text-lg font-extrabold text-black tracking-tight font-heading">Previsão dos Próximos Dias</h3>
              <span id="sidebar-period-txt" class="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#eaf0f6] text-black border border-[#94a3b8] shadow-2xs">20/10 a 22/10 (12 Turnos)</span>
            </div>
            <p class="text-xs font-semibold text-black mt-0.5">Evolução meteorológica e climatológica oficial para Rio das Ostras</p>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button onclick="document.getElementById('modal-boletim-tecnico').classList.remove('hidden'); document.getElementById('modal-boletim-tecnico').classList.add('flex');" class="btn-emergency text-xs py-1.5 px-3.5 cursor-pointer font-extrabold text-black whitespace-nowrap shadow-xs" title="Abrir boletim completo com previsão dos 12 turnos">
            <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-black"></i>
            <span>Boletim Completo (12 Turnos) →</span>
          </button>
          <button id="btn-open-meteogramas-card" class="btn-action-slate text-xs py-1.5 px-3.5 font-bold text-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs" title="Ver Meteogramas Oficiais do INMET e CPTEC/INPE">
            <i data-lucide="line-chart" class="w-3.5 h-3.5 text-black"></i>
            <span>Meteogramas</span>
          </button>
          <a href="https://previsao.inmet.gov.br/3304524" target="_blank" rel="noopener noreferrer" class="btn-action-outline text-xs py-1.5 px-3.5 font-bold text-black flex items-center gap-1.5 whitespace-nowrap shadow-xs" title="Abrir previsão oficial do INMET para Rio das Ostras">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>INMET →</span>
          </a>
        </div>
      </div>"""

if old_3days_header in html:
    html = html.replace(old_3days_header, new_3days_header)
else:
    html = html.replace(old_3days_header.replace('\r\n', '\n'), new_3days_header)

# Bump version in index.html
html = html.replace('css/styles.css?v=68', 'css/styles.css?v=69')
html = html.replace('js/app.js?v=68', 'js/app.js?v=69')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

# ==========================================
# 4. Update sw.js
# ==========================================
sw_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\sw.js'
with open(sw_path, 'r', encoding='utf-8') as f:
    sw = f.read()
sw = sw.replace("'meteo-ostras-v68'", "'meteo-ostras-v69'")
with open(sw_path, 'w', encoding='utf-8') as f:
    f.write(sw)

print("Updated index.html, sw.js, and app.js to v69 successfully")
