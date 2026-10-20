import os

html_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

old_header_block = """  <!-- ========================================================================= -->
  <!-- BARRA SUPERIOR INSTITUCIONAL MINIMALISTA                                  -->
  <!-- ========================================================================= -->
  <header id="site-header" class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#cbd5e1]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
      
      <!-- Marca Oficial: Logo e Título Institucional -->
      <div class="flex items-center gap-3">
        <img src="img/logo-full.png" onerror="this.src='img/logo.png'" alt="TEMPO em Rio das Ostras" class="site-logo shrink-0" title="TEMPO em Rio das Ostras — Sistema Oficial">
        <div class="hidden sm:flex flex-col justify-center">
          <div class="flex items-center gap-2">
            <span class="text-base font-bold text-[#1e293b] tracking-tight">Rio das Ostras</span>
            <span class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-[#f1f5f9] text-black border border-[#e2e8f0]">Defesa Civil 24H</span>
          </div>
          <p class="text-xs font-normal text-[#64748b] truncate">Portal Integrado de Meteorologia, Alerta Hidrológico & Marítimo</p>
        </div>
      </div>

      <!-- Centro: Status Ao Vivo & Relógio de Brasília -->
      <div class="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-[#f8fafc] border border-[#cbd5e1]">
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-500 live-pulse"></span>
          <span class="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">AO VIVO</span>
        </div>
        <div class="h-3.5 w-px bg-[#cbd5e1]"></div>
        <div class="flex items-center gap-1.5 font-mono text-sm font-semibold text-[#1e293b]">
          <i data-lucide="clock" class="w-3.5 h-3.5 text-[#f07a53]"></i>
          <span id="hero-clock">--:--</span>
        </div>
      </div>

      <!-- Ações Rápidas de Topo -->
      <div class="flex items-center gap-2 sm:gap-2.5 text-sm">
        
        <!-- Plantão 199 Defesa Civil -->
        <a href="tel:199" class="btn-emergency px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold rounded-lg" title="Ligue 199 para a Defesa Civil">
          <i data-lucide="phone-call" class="w-3.5 h-3.5"></i>
          <span class="font-bold">199</span>
          <span class="hidden lg:inline text-xs font-normal opacity-90">• Defesa Civil</span>
        </a>

        <!-- Download Boletim Técnico PDF -->
        <a href="docs/boletim_operacional.pdf" target="_blank" download="Boletim_Operacional_Rio_das_Ostras.pdf" class="btn-action-outline px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold rounded-lg" title="Baixar PDF do Boletim Técnico Oficial">
          <i data-lucide="file-check-2" class="w-3.5 h-3.5 text-[#64748b]"></i>
          <span class="hidden md:inline">Boletim</span> <span class="font-normal text-[#64748b]">(PDF)</span>
        </a>

        <!-- Meteogramas Numéricos INMET & CPTEC -->
        <button id="dock-btn-meteogramas" class="btn-action-outline px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold rounded-lg cursor-pointer" title="Ver Meteogramas Oficiais do INMET e CPTEC/INPE">
          <i data-lucide="line-chart" class="w-3.5 h-3.5 text-[#64748b]"></i>
          <span class="hidden md:inline">Meteogramas</span>
        </button>

        <!-- Instalar App PWA -->
        <button id="btn-install-desktop" class="btn-action-outline px-3 py-1.5 flex items-center gap-1.5 cursor-pointer text-xs font-semibold rounded-lg" title="Instalar aplicativo no celular ou computador">
          <i data-lucide="smartphone" class="w-3.5 h-3.5 text-[#64748b]"></i>
          <span class="hidden lg:inline">Instalar</span>
        </button>

        <!-- Sincronizar Agora -->
        <button id="btn-sync-now" class="btn-action-outline p-1.5 text-[#64748b] hover:text-[#1e293b] cursor-pointer rounded-lg" title="Sincronizar dados agora">
          <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
        </button>

      </div>

    </div>
  </header>"""

new_header_block = """  <!-- ========================================================================= -->
  <!-- BARRA SUPERIOR INSTITUCIONAL: PADRÃO NÓRDICO CERÂMICO                     -->
  <!-- ========================================================================= -->
  <header id="site-header" class="sticky top-0 z-40 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
      
      <!-- Marca Oficial: Logo e Título Institucional -->
      <div class="flex items-center gap-3">
        <img src="img/logo-full.png" onerror="this.src='img/logo.png'" alt="TEMPO em Rio das Ostras" class="site-logo shrink-0" title="TEMPO em Rio das Ostras — Sistema Oficial">
        <div class="hidden sm:flex flex-col justify-center">
          <div class="flex items-center gap-2">
            <span class="text-base sm:text-lg font-extrabold text-black tracking-tight font-heading">Rio das Ostras</span>
            <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#ffebe4] text-black border border-[#f97316] tracking-wider shadow-2xs">Defesa Civil 24H</span>
          </div>
          <p class="text-xs font-semibold text-black truncate">Portal Integrado de Meteorologia, Alerta Hidrológico & Marítimo</p>
        </div>
      </div>

      <!-- Centro: Status Ao Vivo & Relógio de Brasília (Slate Ice Capsule) -->
      <div class="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#eaf0f6] border border-[#94a3b8] shadow-xs">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 live-pulse"></span>
          <span class="text-[11px] font-bold text-black uppercase tracking-wider">AO VIVO</span>
        </div>
        <div class="h-3.5 w-[1.5px] bg-[#94a3b8]/70"></div>
        <div class="flex items-center gap-1.5 font-mono text-sm font-bold text-black">
          <i data-lucide="clock" class="w-3.5 h-3.5 text-[#f07a53]"></i>
          <span id="hero-clock">--:--</span>
        </div>
      </div>

      <!-- Ações Rápidas de Topo com Paleta Nórdica Cerâmica -->
      <div class="flex items-center gap-2 sm:gap-2.5 text-sm">
        
        <!-- Plantão 199 Defesa Civil (Coral Terracota Cerâmico) -->
        <a href="tel:199" class="btn-emergency flex items-center gap-1.5 text-xs font-extrabold" title="Ligue 199 para a Defesa Civil">
          <i data-lucide="phone-call" class="w-3.5 h-3.5 text-black"></i>
          <span class="font-extrabold text-black">199</span>
          <span class="hidden lg:inline text-xs font-bold text-black">• Defesa Civil</span>
        </a>

        <!-- Download Boletim Técnico PDF (Slate Ice Cerâmico) -->
        <a href="docs/boletim_operacional.pdf" target="_blank" download="Boletim_Operacional_Rio_das_Ostras.pdf" class="btn-action-slate flex items-center gap-1.5 text-xs font-bold" title="Baixar PDF do Boletim Técnico Oficial">
          <i data-lucide="file-check-2" class="w-3.5 h-3.5 text-black"></i>
          <span class="hidden md:inline text-black">Boletim</span> <span class="font-semibold text-black">(PDF)</span>
        </a>

        <!-- Meteogramas Numéricos INMET & CPTEC (Ceramic Stoneware) -->
        <button id="dock-btn-meteogramas" class="btn-action-outline flex items-center gap-1.5 text-xs font-bold cursor-pointer" title="Ver Meteogramas Oficiais do INMET e CPTEC/INPE">
          <i data-lucide="line-chart" class="w-3.5 h-3.5 text-black"></i>
          <span class="hidden md:inline text-black">Meteogramas</span>
        </button>

        <!-- Instalar App PWA (Ceramic Stoneware) -->
        <button id="btn-install-desktop" class="btn-action-outline flex items-center gap-1.5 cursor-pointer text-xs font-bold" title="Instalar aplicativo no celular ou computador">
          <i data-lucide="smartphone" class="w-3.5 h-3.5 text-black"></i>
          <span class="hidden lg:inline text-black">Instalar</span>
        </button>

        <!-- Sincronizar Agora (Circular Pill) -->
        <button id="btn-sync-now" class="btn-action-outline p-2 text-black hover:bg-[#e2e8f0] cursor-pointer rounded-full" title="Sincronizar dados agora">
          <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-black"></i>
        </button>

      </div>

    </div>
  </header>"""

if old_header_block in html:
    html = html.replace(old_header_block, new_header_block)
else:
    html = html.replace(old_header_block.replace('\r\n', '\n'), new_header_block)

# Bump version to v67
html = html.replace('css/styles.css?v=66', 'css/styles.css?v=67')
html = html.replace('js/app.js?v=66', 'js/app.js?v=67')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

# sw.js
sw_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\sw.js'
with open(sw_path, 'r', encoding='utf-8') as f:
    sw = f.read()
sw = sw.replace("'meteo-ostras-v66'", "'meteo-ostras-v67'")
with open(sw_path, 'w', encoding='utf-8') as f:
    f.write(sw)

# js/app.js
app_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\app.js'
with open(app_path, 'r', encoding='utf-8') as f:
    app = f.read()
app = app.replace("register('./sw.js?v=66')", "register('./sw.js?v=67')")
with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app)

print("Updated index.html, sw.js, and app.js (v67) successfully")
