# -*- coding: utf-8 -*-
with open('css/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

rules = """
/* Refinamentos para Turnos de Chuva e Sinopse no Dark Mode */
html.dark [id^="btn-turno-day-"] {
  background-color: #162032 !important;
  border-color: #334155 !important;
  color: #f8fafc !important;
}

html.dark [id^="btn-turno-day-"][class*="border-[#0284c7]"],
html.dark [id^="btn-turno-day-"].border-\\[\\#0284c7\\] {
  background-color: #112338 !important;
  border-color: #38bdf8 !important;
  color: #f8fafc !important;
}

html.dark #chuva-formula-3d {
  background-color: #162032 !important;
  border-color: #334155 !important;
  color: #f8fafc !important;
}

html.dark #sinopse-texto-completo,
html.dark #sinopse-texto-completo p,
html.dark #section-panorama-sinotico p {
  color: #f8fafc !important;
}
"""

if '/* Refinamentos para Turnos de Chuva' not in css:
    css += rules
    with open('css/styles.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print("Turnos & Sinopse dark mode rules appended.")
else:
    print("Already present.")
