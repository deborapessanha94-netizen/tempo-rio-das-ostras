with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('id="hero-condition"')
start_pos = text.rfind('<div class="space-y-0.5">', 0, pos)
end_pos = text.find('</div>', pos) + len('</div>')

old_block = text[start_pos:end_pos]

new_block = '''<div class="space-y-1">



                <!-- Condição do Céu no Momento -->

                <div class="flex items-center gap-1.5 flex-wrap">

                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 shadow-2xs">

                    <i data-lucide="eye" class="w-3 h-3 text-orange-600 dark:text-orange-400"></i>

                    <span>Céu no Momento</span>

                  </span>

                  <span id="hero-sky-condition" class="text-xs font-semibold text-black dark:text-slate-200">

                    Céu Carregado com Trovoadas e Raios

                  </span>

                </div>



                <h3 id="hero-condition" class="text-base sm:text-lg font-bold text-black dark:text-white leading-snug">



                  Muitas nuvens com pancadas de chuva e trovoadas



                </h3>



                <p id="hero-subcondition" class="text-xs font-medium text-black dark:text-slate-300">



                  Chuva prevista: 7.3 mm (Até 50 mm em tempestade) • Rajadas 64 km/h na orla marítima



                </p>



              </div>'''

text = text[:start_pos] + new_block + text[end_pos:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated index.html with hero-sky-condition!")
