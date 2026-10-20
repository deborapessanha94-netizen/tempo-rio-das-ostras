# -*- coding: utf-8 -*-
"""
Script de acabamento fino para index.html:
Garante que todos os componentes estáticos de index.html estejam alinhados
com o tema Floresta, Terra & Areia Dourada.
"""

path_index = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html'

with open(path_index, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Atualizar os 3 Cards de Previsão em index.html
old_3days_static = """      <!-- Lista / Grid dos 3 Dias -->
      <div id="sidebar-3days-list" class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <!-- Dia 1: Hoje -->
        <div class="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-2.5 cursor-pointer transition hover:border-zinc-300 shadow-xs" onclick="window.toggleDayCard(0)">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                <i data-lucide="cloud-rain" class="w-4 h-4"></i>
              </div>
              <div class="min-w-0">
                <span class="font-bold text-zinc-900 text-sm block leading-tight truncate">Hoje (TERÇA-FEIRA)</span>
                <span class="text-xs font-normal text-zinc-500 block truncate">Muitas nuvens • 2.1 mm</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0 pl-2">
              <span class="font-bold font-mono text-zinc-900 text-sm sm:text-base">20° / 24°C</span>
              <i data-lucide="chevron-down" id="day-card-chevron-0" class="w-4 h-4 text-zinc-400 transition"></i>
            </div>
          </div>
          <div id="day-card-collapse-0" class="pilares-collapse hidden pt-2 border-t border-zinc-100 space-y-2">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Céu</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">Muitas nuvens</span>
              </div>
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Chuva</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">2.1 mm</span>
              </div>
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Vento</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">Rajadas 32 km/h</span>
              </div>
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Mar</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">1.2 a 1.6 m</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Dia 2: Amanhã -->
        <div class="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-2.5 cursor-pointer transition hover:border-zinc-300 shadow-xs" onclick="window.toggleDayCard(1)">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                <i data-lucide="cloud-drizzle" class="w-4 h-4"></i>
              </div>
              <div class="min-w-0">
                <span class="font-bold text-zinc-900 text-sm block leading-tight truncate">Amanhã (QUARTA-FEIRA)</span>
                <span class="text-xs font-normal text-zinc-500 block truncate">Encoberto com chuvisco • 4.8 mm</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0 pl-2">
              <span class="font-bold font-mono text-zinc-900 text-sm sm:text-base">20° / 24°C</span>
              <i data-lucide="chevron-down" id="day-card-chevron-1" class="w-4 h-4 text-zinc-400 transition"></i>
            </div>
          </div>
          <div id="day-card-collapse-1" class="pilares-collapse hidden pt-2 border-t border-zinc-100 space-y-2">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Céu</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">Encoberto com chuvisco</span>
              </div>
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Chuva</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">4.8 mm</span>
              </div>
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Vento</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">Rajadas 28 km/h</span>
              </div>
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Mar</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">1.0 a 1.4 m</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Dia 3: Depois de amanhã -->
        <div class="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-2.5 cursor-pointer transition hover:border-zinc-300 shadow-xs" onclick="window.toggleDayCard(2)">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                <i data-lucide="cloud-lightning" class="w-4 h-4 text-amber-500"></i>
              </div>
              <div class="min-w-0">
                <span class="font-bold text-zinc-900 text-sm block leading-tight truncate">Depois de amanhã (QUINTA-FEIRA)</span>
                <span class="text-xs font-normal text-zinc-500 block truncate">Garoa Fraca • 5.2 mm (Alerta 56118)</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0 pl-2">
              <span class="font-bold font-mono text-zinc-900 text-sm sm:text-base">19° / 24°C</span>
              <i data-lucide="chevron-down" id="day-card-chevron-2" class="w-4 h-4 text-zinc-400 transition"></i>
            </div>
          </div>
          <div id="day-card-collapse-2" class="pilares-collapse hidden pt-2 border-t border-zinc-100 space-y-2">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Céu</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">Pancadas c/ Trovoadas</span>
              </div>
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Chuva</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">5.2 mm</span>
              </div>
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Vento</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">Rajadas 32 km/h</span>
              </div>
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Alerta</span>
                <span class="text-amber-700 font-semibold text-xs truncate block">Amarelo (INMET 56118)</span>
              </div>
            </div>
          </div>
        </div>
      </div>"""

new_3days_static = """      <!-- Lista / Grid dos 3 Dias (Inspirados na Estética da Imagem: Sage, Earth & Toffee) -->
      <div id="sidebar-3days-list" class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <!-- Dia 1: Hoje (Card Sage / Folha Verde) -->
        <div class="p-4 rounded-2xl card-sage border border-[#a9c6b6]/35 space-y-2.5 cursor-pointer transition hover:scale-[1.01] shadow-md" onclick="window.toggleDayCard(0)">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-3 min-w-0">
              <div class="icon-medallion w-9 h-9 shrink-0">
                <i data-lucide="cloud-rain" class="w-4 h-4 text-[#faf4eb]"></i>
              </div>
              <div class="min-w-0">
                <span class="font-bold text-[#faf4eb] text-sm block leading-tight truncate">Hoje (TERÇA-FEIRA)</span>
                <span class="text-xs font-normal text-[#dce8df] block truncate">Muitas nuvens • 2.1 mm</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0 pl-2">
              <span class="font-bold font-mono text-[#faf4eb] text-sm sm:text-base">20° / 24°C</span>
              <i data-lucide="chevron-down" id="day-card-chevron-0" class="w-4 h-4 text-[#dfb992] transition"></i>
            </div>
          </div>
          <div id="day-card-collapse-0" class="pilares-collapse hidden pt-3 border-t border-white/10 space-y-2.5">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2 rounded-xl bg-black/25 border border-white/10">
                <span class="text-[#a9c6b6] font-semibold block uppercase text-[10px] tracking-wider">Céu</span>
                <span class="text-[#faf4eb] font-medium text-xs truncate block">Muitas nuvens</span>
              </div>
              <div class="p-2 rounded-xl bg-black/25 border border-white/10">
                <span class="text-[#a9c6b6] font-semibold block uppercase text-[10px] tracking-wider">Chuva</span>
                <span class="text-[#faf4eb] font-medium text-xs truncate block">2.1 mm</span>
              </div>
              <div class="p-2 rounded-xl bg-black/25 border border-white/10">
                <span class="text-[#a9c6b6] font-semibold block uppercase text-[10px] tracking-wider">Vento</span>
                <span class="text-[#faf4eb] font-medium text-xs truncate block">Rajadas 32 km/h</span>
              </div>
              <div class="p-2 rounded-xl bg-black/25 border border-white/10">
                <span class="text-[#a9c6b6] font-semibold block uppercase text-[10px] tracking-wider">Mar</span>
                <span class="text-[#faf4eb] font-medium text-xs truncate block">1.2 a 1.6 m</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Dia 2: Amanhã (Card Earth / Terracota Cacau) -->
        <div class="p-4 rounded-2xl card-earth border border-[#dfb992]/35 space-y-2.5 cursor-pointer transition hover:scale-[1.01] shadow-md" onclick="window.toggleDayCard(1)">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-3 min-w-0">
              <div class="icon-medallion icon-medallion-earth w-9 h-9 shrink-0">
                <i data-lucide="cloud-drizzle" class="w-4 h-4 text-[#eedfcb]"></i>
              </div>
              <div class="min-w-0">
                <span class="font-bold text-[#faf4eb] text-sm block leading-tight truncate">Amanhã (QUARTA-FEIRA)</span>
                <span class="text-xs font-normal text-[#eedfcb] block truncate">Encoberto com chuvisco • 4.8 mm</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0 pl-2">
              <span class="font-bold font-mono text-[#faf4eb] text-sm sm:text-base">20° / 24°C</span>
              <i data-lucide="chevron-down" id="day-card-chevron-1" class="w-4 h-4 text-[#dfb992] transition"></i>
            </div>
          </div>
          <div id="day-card-collapse-1" class="pilares-collapse hidden pt-3 border-t border-white/10 space-y-2.5">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2 rounded-xl bg-black/25 border border-white/10">
                <span class="text-[#a9c6b6] font-semibold block uppercase text-[10px] tracking-wider">Céu</span>
                <span class="text-[#faf4eb] font-medium text-xs truncate block">Encoberto com chuvisco</span>
              </div>
              <div class="p-2 rounded-xl bg-black/25 border border-white/10">
                <span class="text-[#a9c6b6] font-semibold block uppercase text-[10px] tracking-wider">Chuva</span>
                <span class="text-[#faf4eb] font-medium text-xs truncate block">4.8 mm</span>
              </div>
              <div class="p-2 rounded-xl bg-black/25 border border-white/10">
                <span class="text-[#a9c6b6] font-semibold block uppercase text-[10px] tracking-wider">Vento</span>
                <span class="text-[#faf4eb] font-medium text-xs truncate block">Rajadas 28 km/h</span>
              </div>
              <div class="p-2 rounded-xl bg-black/25 border border-white/10">
                <span class="text-[#a9c6b6] font-semibold block uppercase text-[10px] tracking-wider">Mar</span>
                <span class="text-[#faf4eb] font-medium text-xs truncate block">1.0 a 1.4 m</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Dia 3: Depois de amanhã (Card Toffee / Bronze Dourado) -->
        <div class="p-4 rounded-2xl card-toffee border border-[#f0c598]/35 space-y-2.5 cursor-pointer transition hover:scale-[1.01] shadow-md" onclick="window.toggleDayCard(2)">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-3 min-w-0">
              <div class="icon-medallion icon-medallion-sand w-9 h-9 shrink-0">
                <i data-lucide="cloud-lightning" class="w-4 h-4 text-amber-200"></i>
              </div>
              <div class="min-w-0">
                <span class="font-bold text-[#faf4eb] text-sm block leading-tight truncate">Depois de amanhã (QUINTA-FEIRA)</span>
                <span class="text-xs font-normal text-[#fde68a] block truncate">Garoa Fraca • 5.2 mm (Alerta 56118)</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0 pl-2">
              <span class="font-bold font-mono text-[#faf4eb] text-sm sm:text-base">19° / 24°C</span>
              <i data-lucide="chevron-down" id="day-card-chevron-2" class="w-4 h-4 text-[#dfb992] transition"></i>
            </div>
          </div>
          <div id="day-card-collapse-2" class="pilares-collapse hidden pt-3 border-t border-white/10 space-y-2.5">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2 rounded-xl bg-black/25 border border-white/10">
                <span class="text-[#a9c6b6] font-semibold block uppercase text-[10px] tracking-wider">Céu</span>
                <span class="text-[#faf4eb] font-medium text-xs truncate block">Pancadas c/ Trovoadas</span>
              </div>
              <div class="p-2 rounded-xl bg-black/25 border border-white/10">
                <span class="text-[#a9c6b6] font-semibold block uppercase text-[10px] tracking-wider">Chuva</span>
                <span class="text-[#faf4eb] font-medium text-xs truncate block">5.2 mm</span>
              </div>
              <div class="p-2 rounded-xl bg-black/25 border border-white/10">
                <span class="text-[#a9c6b6] font-semibold block uppercase text-[10px] tracking-wider">Vento</span>
                <span class="text-[#faf4eb] font-medium text-xs truncate block">Rajadas 32 km/h</span>
              </div>
              <div class="p-2 rounded-xl bg-black/25 border border-white/10">
                <span class="text-[#a9c6b6] font-semibold block uppercase text-[10px] tracking-wider">Alerta</span>
                <span class="text-[#fde68a] font-semibold text-xs truncate block">Amarelo (INMET 56118)</span>
              </div>
            </div>
          </div>
        </div>
      </div>"""

text = text.replace(old_3days_static.replace('\r\n', '\n'), new_3days_static.replace('\r\n', '\n'))

# 2. Central de Emergências Links
old_emerg = """          <div class="grid grid-cols-2 gap-2 text-xs">
            <a href="tel:199" class="p-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 flex flex-col justify-between transition">
              <span class="text-zinc-400 font-medium">Defesa Civil</span>
              <span class="text-lg font-mono font-bold text-white mt-1">199</span>
            </a>
            <a href="tel:193" class="p-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 flex flex-col justify-between transition">
              <span class="text-zinc-400 font-medium">Bombeiros</span>
              <span class="text-lg font-mono font-bold text-white mt-1">193</span>
            </a>
            <a href="tel:192" class="p-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 flex flex-col justify-between transition">
              <span class="text-zinc-400 font-medium">SAMU</span>
              <span class="text-lg font-mono font-bold text-white mt-1">192</span>
            </a>
            <a href="tel:190" class="p-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 flex flex-col justify-between transition">
              <span class="text-zinc-400 font-medium">Polícia Militar</span>
              <span class="text-lg font-mono font-bold text-white mt-1">190</span>
            </a>
          </div>"""

new_emerg = """          <div class="grid grid-cols-2 gap-2 text-xs">
            <a href="tel:199" class="p-3 rounded-2xl bg-[#24130c]/85 hover:bg-[#341b11] border border-[#dfb992]/25 flex flex-col justify-between transition shadow-inner">
              <span class="text-[#eedfcb]/80 font-medium">Defesa Civil</span>
              <span class="text-xl font-mono font-bold text-[#faf4eb] mt-1">199</span>
            </a>
            <a href="tel:193" class="p-3 rounded-2xl bg-[#24130c]/85 hover:bg-[#341b11] border border-[#dfb992]/25 flex flex-col justify-between transition shadow-inner">
              <span class="text-[#eedfcb]/80 font-medium">Bombeiros</span>
              <span class="text-xl font-mono font-bold text-[#faf4eb] mt-1">193</span>
            </a>
            <a href="tel:192" class="p-3 rounded-2xl bg-[#24130c]/85 hover:bg-[#341b11] border border-[#dfb992]/25 flex flex-col justify-between transition shadow-inner">
              <span class="text-[#eedfcb]/80 font-medium">SAMU</span>
              <span class="text-xl font-mono font-bold text-[#faf4eb] mt-1">192</span>
            </a>
            <a href="tel:190" class="p-3 rounded-2xl bg-[#24130c]/85 hover:bg-[#341b11] border border-[#dfb992]/25 flex flex-col justify-between transition shadow-inner">
              <span class="text-[#eedfcb]/80 font-medium">Polícia Militar</span>
              <span class="text-xl font-mono font-bold text-[#faf4eb] mt-1">190</span>
            </a>
          </div>"""

text = text.replace(old_emerg.replace('\r\n', '\n'), new_emerg.replace('\r\n', '\n'))

with open(path_index, 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated static cards in index.html successfully!')
