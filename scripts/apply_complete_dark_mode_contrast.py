# -*- coding: utf-8 -*-
import re

# 1. Update css/styles.css
with open('css/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Cut anything from /* ALTO CONTRASTE E VISIBILIDADE TOTAL NO MODO ESCURO to the end
idx = css.find('/* ========================================================================= */\n/* ALTO CONTRASTE E VISIBILIDADE TOTAL NO MODO ESCURO')
if idx != -1:
    css = css[:idx]

master_block = """/* ========================================================================= */
/* ALTO CONTRASTE E VISIBILIDADE TOTAL NO MODO ESCURO (TEXTOS, BADGES E ICONES)*/
/* ========================================================================= */

/* 1. Tipografia Mestre no Dark Mode: Alto Contraste Crisp White */
html.dark,
html.dark body,
html.dark p, html.dark span, html.dark div,
html.dark h1, html.dark h2, html.dark h3, html.dark h4, html.dark h5, html.dark h6,
html.dark .font-heading, html.dark .font-mono, html.dark .mono-val,
html.dark a, html.dark button, html.dark input, html.dark select, html.dark textarea,
html.dark table, html.dark th, html.dark td, html.dark label, html.dark strong,
html.dark b, html.dark em, html.dark i, html.dark small, html.dark pre, html.dark code,
html.dark li, html.dark ul, html.dark ol {
  color: #f8fafc !important;
}

/* 2. Anulação de utilitários escuros do Tailwind no Dark Mode */
html.dark .text-black,
html.dark [class*="text-black/"],
html.dark [class*="text-[#334155]"],
html.dark [class*="text-[#475569]"],
html.dark [class*="text-[#3d4f61]"],
html.dark [class*="text-[#786450]"],
html.dark [class*="text-[#786350]"],
html.dark [class*="text-zinc-700"],
html.dark [class*="text-zinc-800"],
html.dark [class*="text-zinc-900"],
html.dark [class*="text-slate-700"],
html.dark [class*="text-slate-800"],
html.dark [class*="text-slate-900"],
html.dark [class*="text-gray-700"],
html.dark [class*="text-gray-800"],
html.dark [class*="text-gray-900"] {
  color: #f8fafc !important;
}

html.dark [class*="text-[#64748b]"],
html.dark .text-slate-400,
html.dark .text-gray-400,
html.dark .text-zinc-400 {
  color: #cbd5e1 !important;
}

/* 3. Destaques Coloridos Vibrantes e Legíveis no Dark Mode */
html.dark .text-\\[\\#ea580c\\],
html.dark .text-\\[\\#f07a53\\],
html.dark .text-\\[\\#f97316\\],
html.dark .text-orange-500,
html.dark .text-orange-600 {
  color: #fb923c !important;
}

html.dark .text-\\[\\#0284c7\\],
html.dark .text-\\[\\#0369a1\\],
html.dark .text-blue-600,
html.dark .text-sky-500,
html.dark .text-sky-400 {
  color: #38bdf8 !important;
}

html.dark .text-emerald-700,
html.dark .text-emerald-800,
html.dark .text-emerald-600,
html.dark .text-emerald-500,
html.dark .text-\\[\\#065f46\\],
html.dark .text-\\[\\#166534\\] {
  color: #4ade80 !important;
}

html.dark .text-rose-700,
html.dark .text-rose-800,
html.dark .text-rose-600,
html.dark .text-red-600,
html.dark .text-\\[\\#9f1239\\],
html.dark .text-\\[\\#be123c\\],
html.dark .text-\\[\\#b91c1c\\] {
  color: #fb7185 !important;
}

html.dark .text-amber-700,
html.dark .text-amber-800,
html.dark .text-amber-600,
html.dark .text-\\[\\#92400e\\],
html.dark .text-\\[\\#b45309\\],
html.dark .text-\\[\\#d97706\\] {
  color: #fbbf24 !important;
}

html.dark .text-purple-700,
html.dark .text-purple-800,
html.dark .text-purple-900,
html.dark .text-purple-600 {
  color: #c084fc !important;
}

/* 4. Conversão de Pastéis e Medallions para Superfícies Escuras de Alto Contraste */
/* Azul / Sky */
html.dark [class*="bg-[#e0f2fe]"],
html.dark [class*="bg-[#bae6fd]"],
html.dark [class*="bg-[#f0f9ff]"],
html.dark [class*="bg-sky-100"],
html.dark [class*="bg-blue-100"] {
  background-color: #0d2136 !important;
  border-color: #0369a1 !important;
  color: #38bdf8 !important;
}

/* Verde / Emerald */
html.dark [class*="bg-[#f0fdf4]"],
html.dark [class*="bg-[#dcfce7]"],
html.dark [class*="bg-[#ccfbf1]"],
html.dark [class*="bg-[#ecfdf5]"],
html.dark [class*="bg-emerald-100"],
html.dark [class*="bg-emerald-50"] {
  background-color: #092117 !important;
  border-color: #059669 !important;
  color: #4ade80 !important;
}

/* Âmbar / Amarelo */
html.dark [class*="bg-[#fef3c7]"],
html.dark [class*="bg-[#fffbeb]"],
html.dark [class*="bg-amber-100"],
html.dark [class*="bg-amber-50"] {
  background-color: #241a06 !important;
  border-color: #d97706 !important;
  color: #fbbf24 !important;
}

/* Laranja / Terracotta */
html.dark [class*="bg-[#ffebe4]"],
html.dark [class*="bg-[#ffedd5]"],
html.dark [class*="bg-[#fff7ed]"],
html.dark [class*="bg-[#fed7cc]"],
html.dark [class*="bg-orange-100"] {
  background-color: #2b1408 !important;
  border-color: #ea580c !important;
  color: #fb923c !important;
}

/* Vermelho / Rose */
html.dark [class*="bg-[#fef2f2]"],
html.dark [class*="bg-[#fee2e2]"],
html.dark [class*="bg-[#ffe4e6]"],
html.dark [class*="bg-rose-100"],
html.dark [class*="bg-rose-50"] {
  background-color: #2a0c10 !important;
  border-color: #e11d48 !important;
  color: #fb7185 !important;
}

/* Roxo / Violeta */
html.dark [class*="bg-purple-100"],
html.dark [class*="bg-purple-50"],
html.dark [class*="bg-violet-100"] {
  background-color: #200c2e !important;
  border-color: #9333ea !important;
  color: #c084fc !important;
}

/* Slate Neutro / Cinza / Pedra / Badges de Cabeçalho */
html.dark [class*="bg-[#f1f5f9]"],
html.dark [class*="bg-[#f8fafc]"],
html.dark [class*="bg-[#e2e8f0]"],
html.dark [class*="bg-[#eaf0f6]"],
html.dark [class*="bg-[#f5efe8]"],
html.dark [class*="bg-[#f4f6f8]"],
html.dark [class*="bg-slate-100"],
html.dark [class*="bg-zinc-100"],
html.dark [class*="bg-zinc-50"] {
  background-color: #192233 !important;
  border-color: #334155 !important;
  color: #f8fafc !important;
}

/* 5. Gradientes Adaptados ao Modo Escuro */
html.dark [class*="bg-gradient-to-r"][class*="from-[#ffebe4]"],
html.dark [class*="bg-gradient-to-br"][class*="from-[#ffebe4]"],
html.dark [class*="bg-gradient-to-br"][class*="from-[#fff7ed]"] {
  background: linear-gradient(150deg, #2b1408 0%, #170d0a 100%) !important;
  border-color: #ea580c !important;
}

html.dark [class*="bg-gradient-to-r"][class*="from-[#eaf0f6]"],
html.dark [class*="bg-gradient-to-br"][class*="from-[#eaf0f6]"],
html.dark [class*="bg-gradient-to-br"][class*="from-[#f8fafc]"] {
  background: linear-gradient(150deg, #112033 0%, #0b1522 100%) !important;
  border-color: #38bdf8 !important;
}

html.dark [class*="bg-gradient-to-br"][class*="from-[#f5efe8]"] {
  background: linear-gradient(150deg, #221c17 0%, #14100d 100%) !important;
  border-color: #a89f91 !important;
}

html.dark [class*="bg-gradient-to-br"][class*="from-[#fef3c7]"] {
  background: linear-gradient(150deg, #241a06 0%, #150f06 100%) !important;
  border-color: #d97706 !important;
}

html.dark [class*="bg-gradient-to-br"][class*="from-[#f0fdf4]"] {
  background: linear-gradient(150deg, #092117 0%, #081711 100%) !important;
  border-color: #059669 !important;
}

/* 6. PLANCON Níveis de Volume no Dark Mode */
html.dark .plancon-card-n1 {
  background: linear-gradient(150deg, #092117 0%, #05140e 100%) !important;
  border-color: #059669 !important;
}
html.dark .plancon-card-n1 strong { color: #f8fafc !important; }
html.dark .plancon-card-n1 span { color: #4ade80 !important; }

html.dark .plancon-card-n2 {
  background: linear-gradient(150deg, #241a06 0%, #140e03 100%) !important;
  border-color: #d97706 !important;
}
html.dark .plancon-card-n2 strong { color: #f8fafc !important; }
html.dark .plancon-card-n2 span { color: #fbbf24 !important; }

html.dark .plancon-card-n3 {
  background: linear-gradient(150deg, #2b1408 0%, #170a04 100%) !important;
  border-color: #ea580c !important;
}
html.dark .plancon-card-n3 strong { color: #f8fafc !important; }
html.dark .plancon-card-n3 span { color: #fb923c !important; }

html.dark .plancon-card-n4 {
  background: linear-gradient(150deg, #2a0c10 0%, #170608 100%) !important;
  border-color: #e11d48 !important;
}
html.dark .plancon-card-n4 strong { color: #f8fafc !important; }
html.dark .plancon-card-n4 span { color: #fb7185 !important; }

html.dark .plancon-card-n5 {
  background: linear-gradient(150deg, #200c2e 0%, #110618 100%) !important;
  border-color: #9333ea !important;
}
html.dark .plancon-card-n5 strong { color: #f8fafc !important; }
html.dark .plancon-card-n5 span { color: #c084fc !important; }

/* 7. Botões e Controles: Máximo Contraste */
html.dark .tab-metric-btn.active,
html.dark .station-filter-btn.active,
html.dark [onclick*="openModalPraias"] .bg-white\\/95 {
  background-color: #ffffff !important;
  color: #000000 !important;
  font-weight: 800 !important;
  border-color: #ffffff !important;
}

html.dark .tab-metric-btn:not(.active) {
  background: transparent !important;
  color: #cbd5e1 !important;
  border-color: transparent !important;
}

html.dark .tab-metric-btn:not(.active):hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

html.dark [onclick*="openModalPraias"] {
  background: linear-gradient(90deg, #2b1408 0%, #1a0c05 100%) !important;
  border-color: #f07a53 !important;
}
html.dark [onclick*="openModalPraias"] span:not(.bg-white\\/95) {
  color: #f8fafc !important;
}

/* 8. Ícones SVG Lucide: Traçado Crisp White e Cores Preservadas */
html.dark svg,
html.dark svg path,
html.dark svg circle,
html.dark svg line,
html.dark svg polyline,
html.dark svg rect,
html.dark svg polygon {
  stroke: #f8fafc !important;
}

html.dark svg.text-emerald-500, html.dark svg.text-emerald-400, html.dark svg.text-emerald-600,
html.dark [class*="text-emerald"] svg, html.dark [class*="text-[#065f46]"] svg, html.dark [class*="text-[#166534]"] svg,
html.dark [class*="bg-[#f0fdf4]"] svg, html.dark [class*="bg-[#dcfce7]"] svg {
  stroke: #4ade80 !important;
}

html.dark svg.text-amber-500, html.dark svg.text-amber-400, html.dark svg.text-amber-600,
html.dark [class*="text-amber"] svg, html.dark [class*="text-[#92400e]"] svg, html.dark [class*="text-[#b45309]"] svg,
html.dark [class*="bg-[#fef3c7]"] svg, html.dark [class*="bg-[#fffbeb]"] svg {
  stroke: #fbbf24 !important;
}

html.dark svg.text-rose-500, html.dark svg.text-rose-600, html.dark svg.text-red-500,
html.dark [class*="text-rose"] svg, html.dark [class*="text-red"] svg,
html.dark [class*="bg-[#fef2f2]"] svg, html.dark [class*="bg-[#fee2e2]"] svg {
  stroke: #fb7185 !important;
}

html.dark svg.text-\\[\\#0284c7\\], html.dark svg.text-\\[\\#38bdf8\\], html.dark svg.text-sky-400, html.dark svg.text-blue-500,
html.dark [class*="text-[#0284c7]"] svg, html.dark [class*="text-[#38bdf8]"] svg,
html.dark [class*="bg-[#e0f2fe]"] svg, html.dark [class*="bg-[#bae6fd]"] svg {
  stroke: #38bdf8 !important;
}

html.dark svg.text-\\[\\#f07a53\\], html.dark svg.text-\\[\\#ea580c\\], html.dark svg.text-\\[\\#f97316\\],
html.dark [class*="text-[#f07a53]"] svg, html.dark [class*="text-[#ea580c]"] svg,
html.dark [class*="bg-[#ffebe4]"] svg {
  stroke: #fb923c !important;
}

html.dark [class*="bg-purple"] svg, html.dark [class*="text-purple"] svg {
  stroke: #c084fc !important;
}
"""

css += master_block

with open('css/styles.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Updated css/styles.css successfully.")

# 2. Update js/app.js line 781
with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

old_dc = '<span class="text-[10px] text-black/50 uppercase tracking-wider">Defesa Civil</span>'
new_dc = '<span class="text-[10px] text-black/60 dark:text-slate-400 uppercase tracking-wider font-semibold">Boletim Oficial</span>'

if old_dc in js:
    js = js.replace(old_dc, new_dc)
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("Updated js/app.js successfully.")
else:
    print("Defesa Civil badge string not matched in js/app.js.")
