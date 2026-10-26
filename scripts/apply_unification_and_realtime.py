# -*- coding: utf-8 -*-

# 1. Update js/app.js: Real-Time Timestamp
with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Fix in startHeroClock
old_hero_clock = """    if (heroSyncLabel) {
      heroSyncLabel.textContent = `Atualizado às ${hh}:${mm} (Tempo Real • 1 em 1 min)`;
    }"""

new_hero_clock = """    if (heroSyncLabel) {
      heroSyncLabel.textContent = `Atualizado às ${hh}:${mm} (Tempo Real • 1 em 1 min)`;
    }
    const chuvaSyncEl = document.getElementById('chuva-atualizacao-txt');
    if (chuvaSyncEl) {
      chuvaSyncEl.textContent = `Atualizado às ${hh}:${mm} (Tempo Real)`;
    }"""

# Fix in renderChuvaKPIsAndStations
old_chuva_atualizacao = """  if (atualizacaoTxtEl && dataset.atualizacao) {
    atualizacaoTxtEl.textContent = `Atualizado às ${dataset.atualizacao.split(' ')[1] || '17:00'}`;
  }"""

new_chuva_atualizacao = """  if (atualizacaoTxtEl) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    atualizacaoTxtEl.textContent = `Atualizado às ${hh}:${mm} (Tempo Real)`;
  }"""

js_norm = js.replace('\r\n', '\n')
old_hero_clock_norm = old_hero_clock.replace('\r\n', '\n')
new_hero_clock_norm = new_hero_clock.replace('\r\n', '\n')
old_chuva_atualizacao_norm = old_chuva_atualizacao.replace('\r\n', '\n')
new_chuva_atualizacao_norm = new_chuva_atualizacao.replace('\r\n', '\n')

if old_hero_clock_norm in js_norm:
    js_norm = js_norm.replace(old_hero_clock_norm, new_hero_clock_norm)
    print("Updated startHeroClock with chuvaSyncEl.")
else:
    print("Could not find old_hero_clock.")

if old_chuva_atualizacao_norm in js_norm:
    js_norm = js_norm.replace(old_chuva_atualizacao_norm, new_chuva_atualizacao_norm)
    print("Updated renderChuvaKPIsAndStations timestamp.")
else:
    print("Could not find old_chuva_atualizacao.")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(js_norm.replace('\n', '\r\n'))

print("js/app.js updated.")

# 2. Update index.html:
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html_norm = html.replace('\r\n', '\n')

# A. Make dock-btn-meteogramas visible on all screen sizes in top header
old_dock_meteo = 'id="dock-btn-meteogramas" class="hidden sm:flex btn-action-outline'
new_dock_meteo = 'id="dock-btn-meteogramas" class="flex btn-action-outline'

if old_dock_meteo in html_norm:
    html_norm = html_norm.replace(old_dock_meteo, new_dock_meteo)
    print("Made dock-btn-meteogramas always visible at top.")

# B. Remove redundant buttons in section-previsao-3dias header
old_previsao_btns = """        <div class="flex items-center gap-2 flex-wrap">
          <button onclick="document.getElementById('modal-boletim-tecnico').classList.remove('hidden'); document.getElementById('modal-boletim-tecnico').classList.add('flex');" class="btn-coral-pill text-xs py-1.5 px-3.5 cursor-pointer" title="Abrir boletim completo com previsão dos 12 turnos">
            <i data-lucide="file-text" class="w-3.5 h-3.5 text-blue-600"></i>
            <span>Boletim Completo (12 Turnos) ↗</span>
          </button>
          <button id="btn-open-meteogramas-card" class="text-xs font-semibold text-[#334155] hover:text-[#1e293b] px-2.5 py-1.5 rounded-lg border border-[#cbd5e1] hover:bg-[#f1f5f9] transition flex items-center gap-1 cursor-pointer">
            <i data-lucide="line-chart" class="w-3 h-3"></i>
            <span>Meteogramas</span>
          </button>
          <a href="https://previsao.inmet.gov.br/3304524" target="_blank" rel="noopener noreferrer" class="text-xs font-semibold text-[#334155] hover:text-[#1e293b] px-2.5 py-1.5 rounded-lg border border-[#cbd5e1] hover:bg-[#f1f5f9] transition flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>INMET ↗</span>
          </a>
        </div>"""

# Replace with nothing (clean header)
old_previsao_btns_norm = old_previsao_btns.replace('\r\n', '\n')
if old_previsao_btns_norm in html_norm:
    html_norm = html_norm.replace(old_previsao_btns_norm, '')
    print("Removed redundant boletim & meteograma buttons from previsao 3dias header.")
else:
    print("Could not match old_previsao_btns.")

# C. Remove redundant Downloads Oficiais & Meteogramas block in view-tab-boletim
old_boletim_block = """    <!-- Bloco Oficial de Downloads & Meteogramas -->
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
    </div>"""

old_boletim_block_norm = old_boletim_block.replace('\r\n', '\n')
if old_boletim_block_norm in html_norm:
    html_norm = html_norm.replace(old_boletim_block_norm, '')
    print("Removed duplicate Downloads Oficiais & Meteogramas block from view-tab-boletim.")
else:
    print("Could not match old_boletim_block.")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html_norm.replace('\n', '\r\n'))

print("index.html updated.")
