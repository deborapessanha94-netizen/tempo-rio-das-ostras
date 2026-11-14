import sys, os
sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
index_path = os.path.join(BASE_DIR, "index.html")

with open(index_path, "r", encoding="utf-8") as fp:
    html = fp.read()

replacements = [
    ('<div id="view-tab-chuva" class="app-tab-view hidden max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-6">',
     '<div id="view-tab-chuva" class="app-tab-view hidden w-full space-y-6">'),
    ('<div id="view-tab-rio" class="app-tab-view hidden max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-6 space-y-6">',
     '<div id="view-tab-rio" class="app-tab-view hidden w-full space-y-6">'),
    ('<div id="view-tab-orla" class="app-tab-view hidden max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-6 space-y-6">',
     '<div id="view-tab-orla" class="app-tab-view hidden w-full space-y-6">'),
    ('<div id="view-tab-alertas" class="app-tab-view hidden max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-6 space-y-6">',
     '<div id="view-tab-alertas" class="app-tab-view hidden w-full space-y-6">'),
    ('<div id="view-tab-boletim" class="app-tab-view hidden max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-6 space-y-6">',
     '<div id="view-tab-boletim" class="app-tab-view hidden w-full space-y-6">'),
    ('<div id="view-tab-panorama" class="app-tab-view hidden max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-8 space-y-6">',
     '<div id="view-tab-panorama" class="app-tab-view hidden w-full space-y-6">'),
    ('<div id="banner-panorama-mensal" class="max-w-7xl mx-auto px-4 sm:px-6 mb-4">',
     '<div id="banner-panorama-mensal" class="w-full mb-4">'),
    ('<div id="section-hero-previsao" class="max-w-7xl mx-auto px-4 sm:px-6">',
     '<div id="section-hero-previsao" class="w-full">'),
    ('<div id="section-graficos-tendencia" class="max-w-7xl mx-auto px-4 sm:px-6 hidden">',
     '<div id="section-graficos-tendencia" class="w-full hidden">'),
    ('<section id="section-previsao-3dias" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5 hidden">',
     '<section id="section-previsao-3dias" class="w-full hidden">'),
    ('<section id="section-panorama-sinotico" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5 w-full hidden">',
     '<section id="section-panorama-sinotico" class="w-full hidden">'),
    ('<section id="section-plancon-resumo" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5 hidden">',
     '<section id="section-plancon-resumo" class="w-full hidden">')
]

for old, new in replacements:
    assert old in html, f"Target not found: {old[:50]}"
    html = html.replace(old, new, 1)

with open(index_path, "w", encoding="utf-8") as fp:
    fp.write(html)

print("Adjusted view container classes to responsive w-full")
