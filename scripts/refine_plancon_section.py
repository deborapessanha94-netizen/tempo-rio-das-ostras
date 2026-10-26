# -*- coding: utf-8 -*-
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Atualizar link do PDF para o PLANCON oficial baixável
old_link = '<a href="docs/boletim_operacional.pdf" target="_blank" class="btn-action-slate text-xs py-1.5 px-3 whitespace-nowrap" title="Abrir documentação técnica oficial">\n            <i data-lucide="file-text" class="w-3.5 h-3.5 text-black"></i>\n            <span>Ver Documento Completo ↗</span>\n          </a>'
new_link = '<a href="docs/plancon_rio_das_ostras.pdf" target="_blank" download="PLANCON_Rio_das_Ostras_2025_2026.pdf" class="btn-action-slate text-xs py-1.5 px-3 whitespace-nowrap" title="Baixar Plano de Contingência Oficial 2025/2026 (PDF)">\n            <i data-lucide="file-check-2" class="w-3.5 h-3.5 text-black"></i>\n            <span>Baixar PLANCON 4.0 (PDF) ↗</span>\n          </a>'

if old_link in html:
    html = html.replace(old_link, new_link, 1)
    print("Link do PDF atualizado para plancon_rio_das_ostras.pdf")
else:
    # Tenta variação com CRLF
    old_link_crlf = old_link.replace('\n', '\r\n')
    new_link_crlf = new_link.replace('\n', '\r\n')
    if old_link_crlf in html:
        html = html.replace(old_link_crlf, new_link_crlf, 1)
        print("Link do PDF atualizado para plancon_rio_das_ostras.pdf (CRLF)")
    else:
        print("Link já atualizado ou target não encontrado")

# Adicionar classes plancon-card-n1 a n5
for i in range(1, 6):
    old_cls = f'plancon-card-n{i}'
    if old_cls not in html:
        if i == 1:
            html = html.replace('border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/50 to-white', 'plancon-card-n1 border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-50/50 to-white', 1)
        elif i == 2:
            html = html.replace('border-2 border-amber-400/50 bg-gradient-to-br from-amber-50/50 to-white', 'plancon-card-n2 border-2 border-amber-400/60 bg-gradient-to-br from-amber-50/50 to-white', 1)
        elif i == 3:
            html = html.replace('border-2 border-orange-500/60 bg-gradient-to-br from-orange-50/50 to-white', 'plancon-card-n3 border-2 border-orange-500/70 bg-gradient-to-br from-orange-50/50 to-white', 1)
        elif i == 4:
            html = html.replace('border-2 border-rose-500/70 bg-gradient-to-br from-rose-50/50 to-white', 'plancon-card-n4 border-2 border-rose-500/80 bg-gradient-to-br from-rose-50/50 to-white', 1)
        elif i == 5:
            html = html.replace('border-2 border-purple-600/70 bg-gradient-to-br from-purple-50/50 to-white', 'plancon-card-n5 border-2 border-purple-600/80 bg-gradient-to-br from-purple-50/50 to-white', 1)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("index.html atualizado.")

# Atualizar css/styles.css
with open('css/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

plancon_dark_css = """
/* Cards de Níveis de Volume do PLANCON no Dark Mode */
html.dark .plancon-card-n1 {
  background: linear-gradient(150deg, #0d231b 0%, #081711 100%) !important;
  border-color: #059669 !important;
}
html.dark .plancon-card-n2 {
  background: linear-gradient(150deg, #261c0c 0%, #150f06 100%) !important;
  border-color: #d97706 !important;
}
html.dark .plancon-card-n3 {
  background: linear-gradient(150deg, #2b1812 0%, #170d0a 100%) !important;
  border-color: #ea580c !important;
}
html.dark .plancon-card-n4 {
  background: linear-gradient(150deg, #2b1417 0%, #170b0c 100%) !important;
  border-color: #e11d48 !important;
}
html.dark .plancon-card-n5 {
  background: linear-gradient(150deg, #23122c 0%, #120917 100%) !important;
  border-color: #9333ea !important;
}
"""

if '/* Cards de Níveis de Volume do PLANCON' not in css:
    css += plancon_dark_css
    with open('css/styles.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print("Regras dos cards PLANCON adicionadas a css/styles.css")
else:
    print("Regras dos cards PLANCON já presentes.")
