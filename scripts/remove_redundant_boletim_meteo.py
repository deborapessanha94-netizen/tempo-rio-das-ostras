# -*- coding: utf-8 -*-
import re

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove the button group from section-previsao-3dias
# It starts with <div class="flex items-center gap-2 flex-wrap"> and ends after the </a> button
# We can find the range between 'Previsão dos Próximos Dias' and the end of that header div
pattern_previsao_btns = r'(<h3[^>]*>Previs[ãa]o dos Pr[óo]ximos Dias</h3>\s*<p[^>]*id="sidebar-period-txt"[^>]*>.*?</p>\s*</div>\s*</div>\s*)<div class="flex items-center gap-2 flex-wrap">.*?</div>(\s*</div>\s*<!-- \d+ CARDS:)'

match_prev = re.search(pattern_previsao_btns, html, re.DOTALL)
if match_prev:
    html = html[:match_prev.start()] + match_prev.group(1) + match_prev.group(2) + html[match_prev.end():]
    print("Successfully removed redundant buttons from 3-day forecast header.")
else:
    print("Could not match pattern_previsao_btns with regex.")

# Remove the Downloads Oficiais & Meteogramas block in view-tab-boletim
pattern_boletim_block = r'<!-- Bloco Oficial de Downloads & Meteogramas -->\s*<div class="modern-card[^"]*">.*?Downloads Oficiais & Meteogramas.*?</div>\s*</div>\s*</div>'
match_bol = re.search(pattern_boletim_block, html, re.DOTALL)
if match_bol:
    html = html[:match_bol.start()] + html[match_bol.end():]
    print("Successfully removed duplicate Downloads Oficiais & Meteogramas card.")
else:
    # Try finding by btn-ver-boletim-modal-boletim
    pattern_card = r'<div class="modern-card[^"]*">\s*<div[^>]*>\s*<div[^>]*>\s*<h3[^>]*>Downloads Oficiais & Meteogramas</h3>.*?</div>\s*</div>\s*</div>'
    match_card = re.search(pattern_card, html, re.DOTALL)
    if match_card:
        html = html[:match_card.start()] + html[match_card.end():]
        print("Successfully removed duplicate Downloads Oficiais & Meteogramas card (fallback).")
    else:
        print("Could not match pattern_boletim_block.")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# 2. Update js/app.js for real-time timestamp
with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace the static split(' ')[1] update
old_js_stat = r'if\s*\(\s*atualizacaoTxtEl\s*&&\s*dataset\.atualizacao\s*\)\s*\{[^}]*atualizacaoTxtEl\.textContent\s*=\s*`Atualizado[^`]*`;\s*\}'
new_js_stat = """if (atualizacaoTxtEl) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    atualizacaoTxtEl.textContent = `Atualizado às ${hh}:${mm} (Tempo Real)`;
  }"""

if re.search(old_js_stat, js):
    js = re.sub(old_js_stat, new_js_stat, js)
    print("Replaced static atualizacaoTxtEl with live real-time timestamp.")
else:
    print("Could not match old_js_stat.")

# Also update hero clock to update chuva-atualizacao-txt every minute
if 'chuva-atualizacao-txt' not in js[:4000]:
    old_clock = r'(heroSyncLabel\.textContent\s*=\s*`Atualizado[^`]*`;)'
    new_clock = r'\1\n    const chuvaLiveEl = document.getElementById("chuva-atualizacao-txt");\n    if (chuvaLiveEl) chuvaLiveEl.textContent = `Atualizado às ${hh}:${mm} (Tempo Real)`;'
    js = re.sub(old_clock, new_clock, js, count=1)
    print("Added live real-time sync to hero clock.")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Finished applying updates.")
