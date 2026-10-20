# -*- coding: utf-8 -*-
"""
Script de transformação temática: Floresta, Terra & Areia Dourada
Aplica a nova identidade visual luxuosa inspirada na imagem de referência
sem alterar nenhum ID, hook ou lógica do sistema.
"""

path_index = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html'

with open(path_index, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Metas e versão
c = c.replace('content="#0284c7"', 'content="#0c261c"')
c = c.replace('css/styles.css?v=62', 'css/styles.css?v=63')
c = c.replace('js/app.js?v=62', 'js/app.js?v=63')

# 2. Body
c = c.replace(
    'class="antialiased selection:bg-zinc-900 selection:text-white pb-12 min-h-screen bg-[#fafafa] text-zinc-900"',
    'class="antialiased selection:bg-[#dfb992] selection:text-[#2b180e] pb-12 min-h-screen text-[#faf4eb]"'
)

# 3. Header
c = c.replace(
    '<header id="site-header" class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80">',
    '<header id="site-header" class="sticky top-0 z-40 bg-[#091c14]/92 backdrop-blur-md border-b border-[#dfb992]/20">'
)
c = c.replace(
    '<span class="text-base font-bold text-zinc-950 tracking-tight">Rio das Ostras</span>',
    '<span class="text-base font-bold text-[#faf4eb] tracking-tight">Rio das Ostras</span>'
)
c = c.replace(
    '<span class="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase bg-zinc-100 text-zinc-700 border border-zinc-200">Defesa Civil 24H</span>',
    '<span class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-[#143c2c] text-[#eedfcb] border border-[#dfb992]/30">Defesa Civil 24H</span>'
)
c = c.replace(
    '<p class="text-xs font-normal text-zinc-500 truncate">Portal Integrado de Meteorologia, Alerta Hidrológico & Marítimo</p>',
    '<p class="text-xs font-normal text-[#a9c6b6] truncate">Portal Integrado de Meteorologia, Alerta Hidrológico & Marítimo</p>'
)
c = c.replace(
    '<div class="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200/80">',
    '<div class="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-[#0c271d] border border-[#dfb992]/25 shadow-inner">'
)
c = c.replace(
    '<span class="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">AO VIVO</span>',
    '<span class="text-[11px] font-semibold text-[#a9c6b6] uppercase tracking-wider">AO VIVO</span>'
)
c = c.replace(
    '<div class="h-3.5 w-px bg-zinc-300"></div>',
    '<div class="h-3.5 w-px bg-[#dfb992]/30"></div>'
)
c = c.replace(
    '<div class="flex items-center gap-1.5 font-mono text-sm font-semibold text-zinc-900">',
    '<div class="flex items-center gap-1.5 font-mono text-sm font-semibold text-[#faf4eb]">'
)
c = c.replace(
    '<i data-lucide="clock" class="w-3.5 h-3.5 text-zinc-400"></i>',
    '<i data-lucide="clock" class="w-3.5 h-3.5 text-[#dfb992]"></i>'
)

# 4. Seção Alertas
c = c.replace(
    '<section id="section-alertas-oficiais" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5">\n    <div class="modern-card p-5 sm:p-6 bg-white border border-zinc-200">',
    '<section id="section-alertas-oficiais" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5">\n    <div class="modern-card card-earth p-5 sm:p-6">'
)
c = c.replace(
    '<h2 class="text-base sm:text-lg font-bold text-zinc-950 tracking-tight">',
    '<h2 class="text-base sm:text-lg font-bold text-[#faf4eb] tracking-tight">'
)
c = c.replace(
    '<span id="badge-total-alertas" class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-amber-50 text-amber-800 border border-amber-200">',
    '<span id="badge-total-alertas" class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">'
)
c = c.replace(
    '<button id="dock-btn-avisos" class="text-xs font-semibold text-zinc-900 hover:underline cursor-pointer">',
    '<button id="dock-btn-avisos" class="text-xs font-bold text-[#dfb992] hover:text-[#f8d7b3] hover:underline cursor-pointer">'
)

# 5. Seção Panorama Sinótico
c = c.replace(
    '<section id="section-panorama-sinotico" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5">\n    <div class="modern-card p-5 sm:p-6 bg-white border border-zinc-200 space-y-4">',
    '<section id="section-panorama-sinotico" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5">\n    <div class="modern-card card-sage p-5 sm:p-6 space-y-4">'
)
c = c.replace(
    '<span id="badge-periodo-sinotico" class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-zinc-100 text-zinc-800 border border-zinc-200">',
    '<span id="badge-periodo-sinotico" class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-[#0c261c] text-[#eedfcb] border border-[#dfb992]/30">'
)
c = c.replace(
    'id="sinopse-texto-completo" class="p-4 sm:p-5 rounded-xl bg-zinc-50/80 border border-zinc-200/80 text-xs sm:text-sm text-zinc-800 leading-relaxed space-y-3.5 text-justify font-normal"',
    'id="sinopse-texto-completo" class="p-4 sm:p-5 rounded-2xl bg-[#092017]/85 border border-[#dfb992]/20 text-xs sm:text-sm text-[#eedfcb] leading-relaxed space-y-3.5 text-justify font-normal shadow-inner"'
)

# 6. Seção Previsão 3 Dias
c = c.replace(
    '<section id="section-previsao-3dias" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5">\n    <div class="modern-card p-5 sm:p-6 bg-white border border-zinc-200 space-y-4">',
    '<section id="section-previsao-3dias" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5">\n    <div class="modern-card p-5 sm:p-6 space-y-4">'
)
c = c.replace(
    '<h3 class="text-base sm:text-lg font-bold text-zinc-950 tracking-tight">Previsão dos Próximos Dias</h3>',
    '<h3 class="text-base sm:text-lg font-bold text-[#faf4eb] tracking-tight">Previsão dos Próximos Dias</h3>'
)
c = c.replace(
    'onclick="document.getElementById(\'modal-boletim-tecnico\').classList.remove(\'hidden\'); document.getElementById(\'modal-boletim-tecnico\').classList.add(\'flex\');" class="text-xs font-semibold text-blue-700 hover:text-blue-900 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition flex items-center gap-1.5 cursor-pointer"',
    'onclick="document.getElementById(\'modal-boletim-tecnico\').classList.remove(\'hidden\'); document.getElementById(\'modal-boletim-tecnico\').classList.add(\'flex\');" class="btn-sand-pill text-xs py-1 px-3 cursor-pointer"'
)

# 7. Hero Card
c = c.replace(
    '<div class="hero-card p-6 sm:p-7 modern-card border border-zinc-200 bg-white">',
    '<div class="hero-card p-6 sm:p-7">'
)
c = c.replace(
    '<span id="hero-alert-pill" class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-amber-50 text-amber-800 border border-amber-200">',
    '<span id="hero-alert-pill" class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">'
)
c = c.replace(
    '<span class="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase bg-zinc-100 text-zinc-700">',
    '<span class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-[#0c271d] text-[#eedfcb] border border-[#dfb992]/20">'
)
c = c.replace(
    '<span id="sidebar-temp" class="text-6xl sm:text-7xl font-bold font-heading text-zinc-950 tracking-tight">28°</span>',
    '<span id="sidebar-temp" class="text-6xl sm:text-7xl font-extrabold font-heading text-white tracking-tight drop-shadow-md">28°</span>'
)
c = c.replace(
    '<span class="text-xl font-bold text-zinc-400">C</span>',
    '<span class="text-2xl font-bold text-[#dfb992]">C</span>'
)
c = c.replace(
    '<span class="text-xs font-medium text-zinc-500">Sensação: 31°C</span>',
    '<span class="text-xs font-semibold text-[#eedfcb]">Sensação: 31°C</span>'
)
c = c.replace(
    '<h3 id="hero-condition" class="text-lg sm:text-xl font-bold text-zinc-900 leading-snug">',
    '<h3 id="hero-condition" class="text-lg sm:text-xl font-bold text-[#faf4eb] leading-snug">'
)
c = c.replace(
    '<p id="hero-subcondition" class="text-xs sm:text-sm font-normal text-zinc-500">',
    '<p id="hero-subcondition" class="text-xs sm:text-sm font-normal text-[#a9c6b6]">'
)
c = c.replace(
    '<div id="hero-weather-icon" class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-700">',
    '<div id="hero-weather-icon" class="icon-medallion w-20 h-20 sm:w-24 sm:h-24 shadow-xl text-[#dfb992]">'
)
c = c.replace(
    '<span id="hero-date" class="font-medium text-zinc-700">Terça-feira, 20 de Outubro de 2026</span>',
    '<span id="hero-date" class="font-medium text-[#eedfcb]">Terça-feira, 20 de Outubro de 2026</span>'
)

# 8. Tendência Horária
c = c.replace(
    '<h3 class="text-base font-bold text-zinc-950 tracking-tight">\n                  Tendência Horária das Próximas 24 Horas\n                </h3>',
    '<h3 class="text-base font-bold text-[#faf4eb] tracking-tight">\n                  Tendência Horária das Próximas 24 Horas\n                </h3>'
)
c = c.replace(
    '<div class="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg overflow-x-auto scrollbar-none">',
    '<div class="flex items-center gap-1 bg-[#092218]/90 p-1 rounded-full border border-[#dfb992]/20 overflow-x-auto scrollbar-none">'
)

# 9. Telemetria Jundiá
c = c.replace(
    '<div class="modern-card p-5 sm:p-6 bg-white space-y-4" id="card-telemetria-jundia">',
    '<div class="modern-card card-earth p-5 sm:p-6 space-y-4" id="card-telemetria-jundia">'
)
c = c.replace(
    '<div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center space-y-1">',
    '<div class="p-4 rounded-2xl bg-[#24130c]/70 border border-[#dfb992]/25 text-center space-y-1 shadow-inner">'
)
c = c.replace(
    '<span id="kpi-jundia-val" class="text-5xl font-bold font-mono text-zinc-950 block tracking-tight">1,91 m</span>',
    '<span id="kpi-jundia-val" class="text-5xl font-bold font-mono text-[#faf4eb] block tracking-tight drop-shadow-md">1,91 m</span>'
)
c = c.replace(
    '<a href="https://alertadecheias.inea.rj.gov.br/alertadecheias/224103620.html" target="_blank" rel="noopener" class="text-zinc-900 font-semibold hover:underline flex items-center gap-1">',
    '<a href="https://alertadecheias.inea.rj.gov.br/alertadecheias/224103620.html" target="_blank" rel="noopener" class="text-[#dfb992] font-semibold hover:underline flex items-center gap-1">'
)

# 10. Orla e Praias
c = c.replace(
    '<div class="modern-card p-5 sm:p-6 bg-white space-y-4" id="card-condicoes-orla">',
    '<div class="modern-card p-5 sm:p-6 space-y-4" id="card-condicoes-orla">'
)
c = c.replace(
    '<div class="grid grid-cols-3 gap-1 bg-zinc-100 p-1 rounded-xl text-center" role="tablist">',
    '<div class="grid grid-cols-3 gap-1 bg-[#092218] p-1 rounded-full border border-[#dfb992]/20 text-center" role="tablist">'
)

# 11. Central de Emergências
c = c.replace(
    '<div class="modern-card p-5 sm:p-6 bg-zinc-900 text-white space-y-3.5">',
    '<div class="modern-card card-earth p-5 sm:p-6 space-y-3.5">'
)
c = c.replace(
    '<button id="dock-btn-boletim" class="text-zinc-200 hover:text-white font-semibold cursor-pointer">',
    '<button id="dock-btn-boletim" class="text-[#dfb992] hover:text-[#faf4eb] font-semibold cursor-pointer">'
)

with open(path_index, 'w', encoding='utf-8') as f:
    f.write(c)

print('Transformation script executed successfully!')
