import re

INDEX_PATH = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html"

with open(INDEX_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Previsão dropdown: add Baixar Card Tempo Agora
target1 = '''            <a onclick="navigateSubSection('previsao', 'section-hero-previsao', event)" class="nav-dropdown-item">
              <i data-lucide="zap" class="w-3.5 h-3.5 text-[#f07a53] shrink-0"></i>
              <div>
                <span>Tempo Agora</span>
                <span class="nav-dropdown-item-desc">Condições em tempo real, temperatura e sensação</span>
              </div>
            </a>'''

replacement1 = '''            <a onclick="navigateSubSection('previsao', 'section-hero-previsao', event)" class="nav-dropdown-item">
              <i data-lucide="zap" class="w-3.5 h-3.5 text-[#f07a53] shrink-0"></i>
              <div>
                <span>Tempo Agora</span>
                <span class="nav-dropdown-item-desc">Condições em tempo real, temperatura e sensação</span>
              </div>
            </a>
            <a onclick="window.closeAllNavDropdowns(); window.openSocialModalTempoAgora && window.openSocialModalTempoAgora()" class="nav-dropdown-item cursor-pointer">
              <i data-lucide="camera" class="w-3.5 h-3.5 text-[#ea580c] shrink-0"></i>
              <div>
                <span class="font-bold text-[#ea580c]">Baixar Card Tempo Agora</span>
                <span class="nav-dropdown-item-desc">Imagem oficial completa para Post ou Stories</span>
              </div>
            </a>'''

if target1 in content:
    content = content.replace(target1, replacement1, 1)
    print("Patch 1 applied (Dropdown item)")
else:
    print("Warning: target1 not found")

# 2. Hero Card Header button
pattern2 = re.compile(
    r'<div class="flex items-center gap-1\.5">\s*<span id="hero-alert-pill"[^>]*>.*?</span>\s*<span class="text-\[10px\][^>]*>.*?24H.*?</span>\s*</div>',
    re.DOTALL
)

replacement2 = '''<div class="flex items-center gap-1.5 flex-wrap justify-end">
                <span id="hero-alert-pill" class="badge-title-orange text-[10.5px] px-2 py-0.5 rounded-full font-bold uppercase shadow-xs">
                  Alerta Oficial Vigente
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-white text-black border border-[#cbd5e1]">
                  24H
                </span>
                <button 
                  type="button" 
                  id="btn-hero-export-social" 
                  onclick="openSocialModalTempoAgora()" 
                  class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition cursor-pointer bg-[#ffebe4] hover:bg-[#ffd9cb] text-black border-2 border-[#f07a53] shadow-xs active:scale-95" 
                  title="Baixar imagem oficial completa do Tempo Agora para postar nas redes sociais"
                >
                  <i data-lucide="camera" class="w-3.5 h-3.5 text-[#ea580c]"></i>
                  <span class="hidden sm:inline">Baixar Imagem / Postar</span>
                  <span class="sm:hidden">Baixar Imagem</span>
                </button>
              </div>'''

content, count2 = pattern2.subn(replacement2, content, count=1)
print(f"Patch 2 applied (Hero Header): {count2} match(es)")

# 3. Hero Card Footer button
pattern3 = re.compile(
    r'<div class="pt-2 mt-2 border-t border-\[#dfb992\]/20 flex items-center justify-between text-\[11px\] text-black">\s*<span id="hero-date"[^>]*>.*?</span>\s*<span id="hero-sync-badge"[^>]*>.*?</span>\s*</div>',
    re.DOTALL
)

replacement3 = '''<div class="pt-2 mt-2 border-t border-[#dfb992]/20 flex items-center justify-between text-[11px] text-black flex-wrap gap-2">
            <span id="hero-date" class="font-bold text-black">Terça-feira, 20 de Outubro de 2026</span>
            <div class="flex items-center gap-2 flex-wrap">
              <span id="hero-sync-badge" class="flex items-center gap-1.5 font-medium text-black bg-[#f1f5f9] px-2.5 py-0.5 rounded-full border border-[#cbd5e1] text-[10px]" title="Atualizado automaticamente a cada 5 minutos">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span id="hero-sync-label">Atualização a cada 5 min (Tempo Real)</span>
              </span>
              <button 
                type="button" 
                onclick="openSocialModalTempoAgora()" 
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#ffebe4] hover:bg-[#ffd9cb] text-black border border-[#f07a53] transition cursor-pointer shadow-2xs" 
                title="Exportar imagem do Tempo Agora"
              >
                <i data-lucide="share-2" class="w-3.5 h-3.5 text-[#ea580c]"></i>
                <span>Postar Tempo Agora</span>
              </button>
            </div>
          </div>'''

content, count3 = pattern3.subn(replacement3, content, count=1)
print(f"Patch 3 applied (Hero Footer): {count3} match(es)")

# 4. Pluviômetro toolbar button
target4 = '''          <button onclick="openSocialModalChuva('24h')" class="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-black transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs hover:brightness-95" title="Exportar imagem oficial de Acumulados de Chuva para Instagram">'''

replacement4 = '''          <button onclick="openSocialModalTempoAgora()" class="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-black transition cursor-pointer bg-[#fff7ed] border-2 border-[#ea580c] text-black shadow-xs hover:brightness-95" title="Exportar imagem oficial do Tempo Agora para Instagram">
            <i data-lucide="sun-medium" class="w-3.5 h-3.5 text-[#ea580c]"></i>
            <span>Card Tempo Agora</span>
          </button>
          <button onclick="openSocialModalChuva('24h')" class="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-black transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs hover:brightness-95" title="Exportar imagem oficial de Acumulados de Chuva para Instagram">'''

if target4 in content:
    content = content.replace(target4, replacement4, 1)
    print("Patch 4 applied (Pluv toolbar)")
else:
    print("Warning: target4 not found")

# 5. Modal 3 tabs & filter group ID
pattern5 = re.compile(
    r'<!-- Aba de Seleção: Chuva vs Ventos & Rajadas \(Duas imagens separadas\) -->\s*<div class="px-3 sm:px-4 py-2\.5 bg-white border-b border-\[#cbd5e1\] flex items-center gap-2 shrink-0">.*?</div>',
    re.DOTALL
)

replacement5 = '''<!-- Aba de Seleção: Tempo Agora vs Chuva vs Ventos & Rajadas -->
      <div class="px-3 sm:px-4 py-2 bg-white border-b border-[#cbd5e1] flex items-center gap-1.5 sm:gap-2 shrink-0 overflow-x-auto">
        <button 
          type="button" 
          id="social-tab-btn-tempo" 
          onclick="setSocialTab('tempo')" 
          class="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition whitespace-nowrap"
        >
          <i data-lucide="sun-medium" class="w-4 h-4 text-[#ea580c]"></i>
          <span>☀️ Tempo Agora</span>
        </button>
        <button 
          type="button" 
          id="social-tab-btn-chuva" 
          onclick="setSocialTab('chuva')" 
          class="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#f8fafc] hover:bg-[#ffebe4] border border-[#cbd5e1] text-black cursor-pointer flex items-center justify-center gap-1.5 transition whitespace-nowrap"
        >
          <i data-lucide="cloud-rain" class="w-4 h-4 text-[#ea580c]"></i>
          <span>🌧️ Chuva</span>
        </button>
        <button 
          type="button" 
          id="social-tab-btn-vento" 
          onclick="setSocialTab('vento')" 
          class="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#f8fafc] hover:bg-[#e0f2fe] border border-[#cbd5e1] text-black cursor-pointer flex items-center justify-center gap-1.5 transition whitespace-nowrap"
        >
          <i data-lucide="wind" class="w-4 h-4 text-[#0284c7]"></i>
          <span>💨 Ventos & Rajadas</span>
        </button>
      </div>'''

content, count5 = pattern5.subn(replacement5, content, count=1)
print(f"Patch 5 applied (Modal Tabs): {count5} match(es)")

target5b = '<div class="flex items-center justify-between sm:justify-end gap-1.5 w-full lg:w-auto">'
replacement5b = '<div id="social-filter-station-group" class="flex items-center justify-between sm:justify-end gap-1.5 w-full lg:w-auto">'
if target5b in content:
    content = content.replace(target5b, replacement5b, 1)
    print("Patch 5b applied (Filter Group ID)")
else:
    print("Warning: target5b not found")

# 6. Global window functions & version bump
target6 = '''    window.openSocialModal = function(modeOrHz) {
      if (modeOrHz === 'vento') {
        if (typeof window.openSocialModalVento === 'function') window.openSocialModalVento();
        else if (typeof window.openSocialModalChuva === 'function') {
          window.openSocialModalChuva();
          if (typeof window.setSocialTab === 'function') window.setSocialTab('vento');
        }
      } else {
        if (typeof window.openSocialModalChuva === 'function') window.openSocialModalChuva(modeOrHz || '24h');
      }
    };
    window.openSocialModalVento = function() {
      if (typeof window.openSocialModalChuva === 'function') {
        window.openSocialModalChuva();
        if (typeof window.setSocialTab === 'function') window.setSocialTab('vento');
      }
    };
  </script>
  <script type="module" src="js/app.js?v=193"></script>'''

replacement6 = '''    window.openSocialModalTempoAgora = function() {
      if (typeof window.openSocialModalWithTab === 'function') window.openSocialModalWithTab('tempo');
      else if (typeof window.openSocialModalChuva === 'function') {
        window.openSocialModalChuva();
        if (typeof window.setSocialTab === 'function') window.setSocialTab('tempo');
      }
    };
    window.openSocialModal = function(modeOrHz) {
      if (modeOrHz === 'tempo' || modeOrHz === 'tempo_agora') {
        window.openSocialModalTempoAgora();
      } else if (modeOrHz === 'vento') {
        if (typeof window.openSocialModalVento === 'function') window.openSocialModalVento();
        else if (typeof window.openSocialModalChuva === 'function') {
          window.openSocialModalChuva();
          if (typeof window.setSocialTab === 'function') window.setSocialTab('vento');
        }
      } else {
        if (typeof window.openSocialModalChuva === 'function') window.openSocialModalChuva(modeOrHz || '24h');
      }
    };
    window.openSocialModalVento = function() {
      if (typeof window.openSocialModalChuva === 'function') {
        window.openSocialModalChuva();
        if (typeof window.setSocialTab === 'function') window.setSocialTab('vento');
      }
    };
  </script>
  <script type="module" src="js/app.js?v=194"></script>'''

if target6 in content:
    content = content.replace(target6, replacement6, 1)
    print("Patch 6 applied (Global window functions + v194)")
else:
    print("Warning: target6 not found")

with open(INDEX_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("SUCCESS: index.html patched for v194!")
