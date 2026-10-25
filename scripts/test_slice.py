import re

with open('index.html', 'r', encoding='utf-8') as f:
    orig = f.read()

# Let's inspect the exact lines to extract
lines = orig.splitlines(keepends=True)

def slice_lines(start_1indexed, end_1indexed):
    return "".join(lines[start_1indexed - 1 : end_1indexed])

# 1. Before app-main-tabs (L1 to L129)
part_top = slice_lines(1, 129)

# 2. Main tabs (L130 to L154) - we will replace this with the 6 tabs grid
part_tabs = '''  <nav id="app-main-tabs" class="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-1">
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
  </nav>
'''

# 3. Extract sections:
section_alertas = slice_lines(163, 333)
section_sinotico = slice_lines(337, 409)
section_previsao3dias = slice_lines(412, 649)
card_hero = slice_lines(663, 807)
card_chart = slice_lines(808, 852)
card_orla = slice_lines(854, 1091)
card_jundia = slice_lines(1101, 1160)
card_telefones = slice_lines(1163, 1241)
card_turnos = slice_lines(1244, 1338)
view_chuva = slice_lines(1349, 1597)
part_footer_and_modals = slice_lines(1601, len(lines))

print("Sections extracted successfully!")
print("section_alertas len:", len(section_alertas))
print("section_sinotico len:", len(section_sinotico))
print("section_previsao3dias len:", len(section_previsao3dias))
print("card_hero len:", len(card_hero))
print("card_chart len:", len(card_chart))
print("card_orla len:", len(card_orla))
print("card_jundia len:", len(card_jundia))
print("card_telefones len:", len(card_telefones))
print("card_turnos len:", len(card_turnos))
print("view_chuva len:", len(view_chuva))
