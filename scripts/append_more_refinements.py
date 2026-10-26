# -*- coding: utf-8 -*-
with open('css/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

more_rules = """
/* Refinamentos Finais Dark Mode (Rio & Orla) */
html.dark a[href*="alertadecheias.com.br"] {
  background-color: #1a253a !important;
  border-color: #38bdf8 !important;
  color: #f8fafc !important;
}

html.dark a[href*="alertadecheias.com.br"]:hover {
  background-color: #24324c !important;
}

html.dark span[class*="bg-[#ecfdf5]"] {
  background-color: #0d231b !important;
  border-color: #059669 !important;
  color: #6ee7b7 !important;
}

html.dark span[class*="bg-[#ffedd5]"] {
  background-color: #2b1812 !important;
  border-color: #ea580c !important;
  color: #fdba74 !important;
}

html.dark #orla-summary-content > div {
  background-image: none !important;
  background-color: #131b2e !important;
  border-color: #334155 !important;
}
"""

if '/* Refinamentos Finais Dark Mode' not in css:
    css += more_rules
    with open('css/styles.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print("More refinements added to css/styles.css")
else:
    print("Already present.")
