# -*- coding: utf-8 -*-
with open('css/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

rules = """
/* Refinamentos Adicionais para Dark Mode (KPIs, Sub-cards e Pilulas) */
html.dark [class*="bg-gradient-to-br"] {
  background-image: none !important;
  background-color: #162032 !important;
  border-color: #334155 !important;
}

html.dark [class*="bg-white/95"],
html.dark [class*="bg-white/90"],
html.dark [class*="bg-white/80"],
html.dark [class*="bg-white/70"],
html.dark .bg-white {
  background-color: #131b2e !important;
  border-color: #334155 !important;
}

html.dark #jundia-cota-atencao,
html.dark #jundia-cota-alerta,
html.dark #jundia-cota-transbordo {
  background-color: #1e293b !important;
  border-color: #475569 !important;
  color: #f8fafc !important;
}

html.dark .orla-day-btn:not(.active) {
  background-color: #162032 !important;
  border-color: #334155 !important;
  color: #f8fafc !important;
}

html.dark #btn-open-meteogramas-card,
html.dark a[href*="previsao.inmet.gov.br"],
html.dark .bg-zinc-100,
html.dark .bg-zinc-50 {
  background-color: #1e293b !important;
  border-color: #334155 !important;
  color: #f8fafc !important;
}

html.dark span[class*="text-[#166534]"],
html.dark span[class*="bg-[#dcfce7]"],
html.dark span[class*="bg-[#e0f2fe]"],
html.dark span[class*="bg-[#fef3c7]"],
html.dark span[class*="bg-[#ffe4e6]"] {
  background-color: #1e293b !important;
  border-color: #334155 !important;
  color: #f8fafc !important;
}

html.dark #orla-status-badge,
html.dark .bg-rose-50,
html.dark .bg-red-50 {
  background-color: #2b1417 !important;
  border-color: #be123c !important;
  color: #fca5a5 !important;
}

html.dark .bg-emerald-50,
html.dark .bg-green-50 {
  background-color: #0f241d !important;
  border-color: #059669 !important;
  color: #6ee7b7 !important;
}

html.dark .bg-amber-50,
html.dark .bg-yellow-50 {
  background-color: #261c0c !important;
  border-color: #d97706 !important;
  color: #fde047 !important;
}

html.dark .bg-sky-50,
html.dark .bg-blue-50 {
  background-color: #112338 !important;
  border-color: #0284c7 !important;
  color: #7dd3fc !important;
}
"""

if '/* Refinamentos Adicionais para Dark Mode' not in css:
    css += rules
    with open('css/styles.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print("Refinements appended successfully.")
else:
    print("Already present.")
