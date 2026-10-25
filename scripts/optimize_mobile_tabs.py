with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's inspect the buttons in app-main-tabs
old_tab_bar = '''  <nav id="app-main-tabs" class="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-1">
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
  </nav>'''

new_tab_bar = '''  <nav id="app-main-tabs" class="max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-1">
    <div class="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2 p-1.5 bg-[#f5efe8]/90 rounded-2xl border border-[#b8a99a]/50 shadow-xs" role="tablist">

      <!-- Aba 1: Previsão & Tempo -->
      <button id="nav-tab-previsao" onclick="switchAppTab('previsao')" class="app-nav-tab active flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs lg:text-sm font-black transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs w-full text-center" role="tab" aria-selected="true">
        <i data-lucide="cloud-sun" class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-black"></i>
        <span class="leading-none whitespace-nowrap">Previsão & Tempo</span>
      </button>

      <!-- Aba 2: Acumulados de Chuva -->
      <button id="nav-tab-chuva" onclick="switchAppTab('chuva')" class="app-nav-tab flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs lg:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer w-full text-center" role="tab" aria-selected="false">
        <i data-lucide="cloud-rain" class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-black"></i>
        <span class="leading-none whitespace-nowrap">Acumulados Chuva</span>
      </button>

      <!-- Aba 3: Nível do Rio Jundiá -->
      <button id="nav-tab-rio" onclick="switchAppTab('rio')" class="app-nav-tab flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs lg:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer w-full text-center" role="tab" aria-selected="false">
        <i data-lucide="waves" class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-black"></i>
        <span class="leading-none whitespace-nowrap">Nível do Rio</span>
      </button>

      <!-- Aba 4: Orla & Praias -->
      <button id="nav-tab-orla" onclick="switchAppTab('orla')" class="app-nav-tab flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs lg:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer w-full text-center" role="tab" aria-selected="false">
        <i data-lucide="anchor" class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-black"></i>
        <span class="leading-none whitespace-nowrap">Orla & Praias</span>
      </button>

      <!-- Aba 5: Alertas & Sinótico -->
      <button id="nav-tab-alertas" onclick="switchAppTab('alertas')" class="app-nav-tab flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs lg:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer w-full text-center" role="tab" aria-selected="false">
        <i data-lucide="shield-alert" class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-black"></i>
        <span class="leading-none whitespace-nowrap">Alertas & Sinótico</span>
      </button>

      <!-- Aba 6: Boletim Operacional -->
      <button id="nav-tab-boletim" onclick="switchAppTab('boletim')" class="app-nav-tab flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs lg:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer w-full text-center" role="tab" aria-selected="false">
        <i data-lucide="file-text" class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-black"></i>
        <span class="leading-none whitespace-nowrap">Boletim 12 Turnos</span>
      </button>

    </div>
  </nav>'''

if old_tab_bar in html:
    html = html.replace(old_tab_bar, new_tab_bar)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Replaced tab bar styling for perfect mobile fit!")
else:
    print("ERROR: old_tab_bar not found in index.html")
