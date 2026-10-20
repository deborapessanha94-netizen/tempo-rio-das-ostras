# -*- coding: utf-8 -*-
"""
Script de transformação para o Design Nórdico Minimalista de Cerâmica
(Nordic Slate Denim, Warm Coral Orange & Pure White)
"""

path_index = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html'

with open(path_index, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Metas e versões
text = text.replace('content="#0c261c"', 'content="#3d4f61"')
text = text.replace('css/styles.css?v=63', 'css/styles.css?v=64')
text = text.replace('js/app.js?v=63', 'js/app.js?v=64')

# 2. Body
text = text.replace(
    'class="antialiased selection:bg-[#dfb992] selection:text-[#2b180e] pb-12 min-h-screen text-[#faf4eb]"',
    'class="antialiased selection:bg-[#f07a53] selection:text-white pb-12 min-h-screen bg-[#f4f6f8] text-[#1e293b]"'
)

# 3. Header
old_header = """  <header id="site-header" class="sticky top-0 z-40 bg-[#091c14]/92 backdrop-blur-md border-b border-[#dfb992]/20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
      
      <!-- Marca Oficial: Logo e Título Institucional -->
      <div class="flex items-center gap-3">
        <img src="img/logo-full.png" onerror="this.src='img/logo.png'" alt="TEMPO em Rio das Ostras" class="site-logo shrink-0" title="TEMPO em Rio das Ostras — Sistema Oficial">
        <div class="hidden sm:flex flex-col justify-center">
          <div class="flex items-center gap-2">
            <span class="text-base font-bold text-[#faf4eb] tracking-tight">Rio das Ostras</span>
            <span class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-[#143c2c] text-[#eedfcb] border border-[#dfb992]/30">Defesa Civil 24H</span>
          </div>
          <p class="text-xs font-normal text-[#a9c6b6] truncate">Portal Integrado de Meteorologia, Alerta Hidrológico & Marítimo</p>
        </div>
      </div>

      <!-- Centro: Status Ao Vivo & Relógio de Brasília -->
      <div class="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-[#0c271d] border border-[#dfb992]/25 shadow-inner">
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400 live-pulse"></span>
          <span class="text-[11px] font-semibold text-[#a9c6b6] uppercase tracking-wider">AO VIVO</span>
        </div>
        <div class="h-3.5 w-px bg-[#dfb992]/30"></div>
        <div class="flex items-center gap-1.5 font-mono text-sm font-semibold text-[#faf4eb]">
          <i data-lucide="clock" class="w-3.5 h-3.5 text-[#dfb992]"></i>
          <span id="hero-clock">--:--</span>
        </div>
      </div>"""

new_header = """  <header id="site-header" class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
      
      <!-- Marca Oficial: Logo e Título Institucional -->
      <div class="flex items-center gap-3">
        <img src="img/logo-full.png" onerror="this.src='img/logo.png'" alt="TEMPO em Rio das Ostras" class="site-logo shrink-0" title="TEMPO em Rio das Ostras — Sistema Oficial">
        <div class="hidden sm:flex flex-col justify-center">
          <div class="flex items-center gap-2">
            <span class="text-base font-bold text-[#1e293b] tracking-tight">Rio das Ostras</span>
            <span class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-[#f1f5f9] text-[#3d4f61] border border-[#e2e8f0]">Defesa Civil 24H</span>
          </div>
          <p class="text-xs font-normal text-[#64748b] truncate">Portal Integrado de Meteorologia, Alerta Hidrológico & Marítimo</p>
        </div>
      </div>

      <!-- Centro: Status Ao Vivo & Relógio de Brasília -->
      <div class="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-[#f8fafc] border border-[#e2e8f0] shadow-xs">
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-500 live-pulse"></span>
          <span class="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">AO VIVO</span>
        </div>
        <div class="h-3.5 w-px bg-[#cbd5e1]"></div>
        <div class="flex items-center gap-1.5 font-mono text-sm font-semibold text-[#1e293b]">
          <i data-lucide="clock" class="w-3.5 h-3.5 text-[#f07a53]"></i>
          <span id="hero-clock">--:--</span>
        </div>
      </div>"""

text = text.replace(old_header.replace('\r\n', '\n'), new_header.replace('\r\n', '\n'))

# 4. Alertas section
text = text.replace(
    '<section id="section-alertas-oficiais" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5">\n    <div class="modern-card card-earth p-5 sm:p-6">',
    '<section id="section-alertas-oficiais" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5">\n    <div class="modern-card p-5 sm:p-6 bg-white border border-[#e2e8f0]">'
)
text = text.replace(
    '<div class="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">',
    '<div class="w-9 h-9 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 shadow-xs">'
)
text = text.replace(
    '<h2 class="text-base sm:text-lg font-bold text-[#faf4eb] tracking-tight">',
    '<h2 class="text-base sm:text-lg font-bold text-[#1e293b] tracking-tight">'
)
text = text.replace(
    'border-b border-[#dfb992]/20 pb-3 mb-4',
    'border-b border-[#e2e8f0] pb-3 mb-4'
)
text = text.replace(
    '<span id="badge-total-alertas" class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">',
    '<span id="badge-total-alertas" class="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#f07a53]/15 text-[#d8623b] border border-[#f07a53]/30">'
)
text = text.replace(
    '<p class="text-xs font-normal text-[#eedfcb]/80 mt-0.5">',
    '<p class="text-xs font-normal text-[#64748b] mt-0.5">'
)
text = text.replace(
    '<span class="text-xs font-normal text-[#a9c6b6] flex items-center gap-1">',
    '<span class="text-xs font-normal text-[#64748b] flex items-center gap-1">'
)
text = text.replace(
    '<i data-lucide="info" class="w-3.5 h-3.5 text-[#dfb992]"></i>',
    '<i data-lucide="info" class="w-3.5 h-3.5 text-[#f07a53]"></i>'
)
text = text.replace(
    '<button id="dock-btn-avisos" class="text-xs font-bold text-[#dfb992] hover:text-[#f8d7b3] hover:underline cursor-pointer">',
    '<button id="dock-btn-avisos" class="text-xs font-bold text-[#f07a53] hover:text-[#d8623b] hover:underline cursor-pointer">'
)

# 5. Panorama Sinótico
text = text.replace(
    '<section id="section-panorama-sinotico" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5">\n    <div class="modern-card card-sage p-5 sm:p-6 space-y-4">',
    '<section id="section-panorama-sinotico" class="max-w-7xl mx-auto px-4 sm:px-6 pt-5">\n    <div class="modern-card p-5 sm:p-6 bg-white border border-[#e2e8f0] space-y-4">'
)
text = text.replace(
    '<div class="w-9 h-9 rounded-full bg-[#102e22] text-[#eedfcb] border border-[#a9c6b6]/30 flex items-center justify-center shrink-0 shadow-md">',
    '<div class="w-9 h-9 rounded-full bg-[#f1f5f9] text-[#3d4f61] border border-[#e2e8f0] flex items-center justify-center shrink-0 shadow-xs">'
)
text = text.replace(
    'border-b border-[#a9c6b6]/25 pb-3',
    'border-b border-[#e2e8f0] pb-3'
)
text = text.replace(
    '<span id="badge-periodo-sinotico" class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-[#0c261c] text-[#eedfcb] border border-[#dfb992]/30">',
    '<span id="badge-periodo-sinotico" class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-[#f1f5f9] text-[#3d4f61] border border-[#e2e8f0]">'
)
text = text.replace(
    '<button id="btn-toggle-sinopse" class="p-1.5 rounded-full border border-[#dfb992]/30 text-[#eedfcb] hover:bg-[#0c261c] cursor-pointer"',
    '<button id="btn-toggle-sinopse" class="p-1.5 rounded-full border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] cursor-pointer"'
)
text = text.replace(
    'id="sinopse-texto-completo" class="p-4 sm:p-5 rounded-2xl bg-[#092017]/85 border border-[#dfb992]/20 text-xs sm:text-sm text-[#eedfcb] leading-relaxed space-y-3.5 text-justify font-normal shadow-inner"',
    'id="sinopse-texto-completo" class="p-5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] text-sm text-[#334155] leading-relaxed space-y-3.5 text-justify font-normal shadow-xs"'
)

# 6. Previsão 3 Dias
text = text.replace(
    'btn-sand-pill text-xs py-1 px-3 cursor-pointer',
    'btn-coral-pill text-xs py-1.5 px-3.5 cursor-pointer'
)
text = text.replace(
    '<div id="sidebar-3days-list" class="grid grid-cols-1 md:grid-cols-3 gap-3.5">',
    '<div id="sidebar-3days-list" class="grid grid-cols-1 md:grid-cols-3 gap-4">'
)

# 7. Hero Card
text = text.replace(
    '<div class="w-8 h-8 rounded-full bg-[#0a2319] border border-[#dfb992]/30 text-[#dfb992] flex items-center justify-center shadow-inner">',
    '<div class="w-8 h-8 rounded-full bg-white/15 border border-white/20 text-white flex items-center justify-center shadow-xs">'
)
text = text.replace(
    '<span id="hero-alert-pill" class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">',
    '<span id="hero-alert-pill" class="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#f07a53] text-white shadow-xs">'
)
text = text.replace(
    '<span class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-[#0c271d] text-[#eedfcb] border border-[#dfb992]/20">',
    '<span class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-white/15 text-white border border-white/20">'
)
text = text.replace(
    '<span class="text-2xl font-bold text-[#dfb992]">C</span>',
    '<span class="text-2xl font-bold text-white/80">C</span>'
)
text = text.replace(
    '<span class="text-xs font-semibold text-[#eedfcb]">Sensação: 31°C</span>',
    '<span class="text-xs font-semibold text-[#d9e2ec]">Sensação: 31°C</span>'
)
text = text.replace(
    '<p id="hero-subcondition" class="text-xs sm:text-sm font-normal text-[#a9c6b6]">',
    '<p id="hero-subcondition" class="text-xs sm:text-sm font-normal text-[#d9e2ec]">'
)
text = text.replace(
    '<div id="hero-weather-icon" class="icon-medallion w-20 h-20 sm:w-24 sm:h-24 shadow-xl text-[#dfb992]">',
    '<div id="hero-weather-icon" class="icon-medallion w-20 h-20 sm:w-24 sm:h-24 bg-white/15 text-white border border-white/25 shadow-lg">'
)
text = text.replace(
    'border-t border-[#dfb992]/20',
    'border-t border-white/15'
)
text = text.replace(
    '<span id="hero-date" class="font-medium text-[#eedfcb]">Terça-feira, 20 de Outubro de 2026</span>',
    '<span id="hero-date" class="font-medium text-[#d9e2ec]">Terça-feira, 20 de Outubro de 2026</span>'
)
text = text.replace(
    '<span class="font-normal text-[#a9c6b6]">Atualização Operacional Contínua</span>',
    '<span class="font-normal text-[#d9e2ec]">Atualização Operacional Contínua</span>'
)

# 8. Tendência Horária
text = text.replace(
    '<div class="w-8 h-8 rounded-full bg-[#0a2319] border border-[#dfb992]/30 flex items-center justify-center text-[#dfb992] shadow-inner">',
    '<div class="w-8 h-8 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-[#3d4f61] shadow-xs">'
)
text = text.replace(
    '<div class="flex items-center gap-1 bg-[#092218]/90 p-1 rounded-full border border-[#dfb992]/20 overflow-x-auto scrollbar-none">',
    '<div class="flex items-center gap-1 bg-[#f1f5f9] p-1 rounded-full border border-[#e2e8f0] overflow-x-auto scrollbar-none">'
)

# 9. Radar
text = text.replace(
    '<div class="w-8 h-8 rounded-full bg-[#0a2319] border border-[#dfb992]/30 flex items-center justify-center text-[#dfb992] shadow-inner">',
    '<div class="w-8 h-8 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-[#3d4f61] shadow-xs">'
)
text = text.replace(
    'class="px-3 py-1 rounded-full text-xs font-bold bg-[#dfb992] text-[#2b180e] shadow-sm cursor-pointer transition"',
    'class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#f07a53] text-white shadow-sm cursor-pointer transition"'
)
text = text.replace(
    'class="px-3 py-1 rounded-full text-xs font-semibold bg-[#0c271d] border border-[#dfb992]/25 text-[#eedfcb] hover:bg-[#143c2c] cursor-pointer transition"',
    'class="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#e2e8f0] text-[#334155] hover:bg-[#f1f5f9] cursor-pointer transition"'
)
text = text.replace(
    'border border-[#dfb992]/25 bg-[#092017]',
    'border border-[#e2e8f0] bg-white'
)
text = text.replace(
    '<div class="p-2.5 bg-[#0a2319] border-t border-[#dfb992]/20 flex items-center justify-between gap-3 text-xs">',
    '<div class="p-2.5 bg-white border-t border-[#e2e8f0] flex items-center justify-between gap-3 text-xs">'
)
text = text.replace(
    'bg-[#dfb992] text-[#2b180e] hover:bg-[#eedfcb]',
    'bg-[#f07a53] text-white hover:bg-[#d8623b]'
)
text = text.replace(
    'bg-[#133a2b] text-[#eedfcb] hover:bg-[#1c4d39]',
    'bg-[#f1f5f9] text-[#334155] hover:bg-[#e2e8f0]'
)
text = text.replace(
    '<span id="radar-time-label" class="font-mono font-medium text-[#eedfcb] ml-1">',
    '<span id="radar-time-label" class="font-mono font-medium text-[#334155] ml-1">'
)

# 10. Jundiá
text = text.replace(
    '<div class="modern-card card-earth p-5 sm:p-6 space-y-4" id="card-telemetria-jundia">',
    '<div class="modern-card p-5 sm:p-6 bg-white border border-[#e2e8f0] space-y-4" id="card-telemetria-jundia">'
)
text = text.replace(
    '<div id="jundia-icon-box" class="w-8 h-8 rounded-full bg-[#24130c] border border-[#dfb992]/30 text-emerald-400 flex items-center justify-center shadow-inner">',
    '<div id="jundia-icon-box" class="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">'
)
text = text.replace(
    '<div class="p-4 rounded-2xl bg-[#24130c]/70 border border-[#dfb992]/25 text-center space-y-1 shadow-inner">',
    '<div class="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] text-center space-y-1 shadow-xs">'
)
text = text.replace(
    '<span class="text-[10px] uppercase font-bold text-[#eedfcb]/70 block tracking-wider">Cota Atual Registrada</span>',
    '<span class="text-[10px] uppercase font-bold text-[#64748b] block tracking-wider">Cota Atual Registrada</span>'
)
text = text.replace(
    '<span id="kpi-jundia-val" class="text-5xl font-bold font-mono text-[#faf4eb] block tracking-tight drop-shadow-md">1,91 m</span>',
    '<span id="kpi-jundia-val" class="text-5xl font-bold font-mono text-[#1e293b] block tracking-tight">1,91 m</span>'
)
text = text.replace(
    '<div class="space-y-1.5 text-xs font-medium text-[#eedfcb]">',
    '<div class="space-y-1.5 text-xs font-medium text-[#475569]">'
)
text = text.replace(
    '<div class="gauge-track mt-1.5 h-2 bg-[#1b0d07] rounded-full overflow-hidden border border-[#dfb992]/25">',
    '<div class="gauge-track mt-1.5 h-2 bg-[#f1f5f9] rounded-full overflow-hidden border border-[#e2e8f0]">'
)
text = text.replace(
    '<p id="jundia-mensagem-status" class="text-[11px] font-medium text-emerald-300 pt-1 leading-tight">',
    '<p id="jundia-mensagem-status" class="text-[11px] font-medium text-emerald-700 pt-1 leading-tight">'
)

# 11. Orla Nicho
text = text.replace(
    '<div class="grid grid-cols-3 gap-1 bg-[#092218] p-1 rounded-full border border-[#dfb992]/20 text-center" role="tablist">',
    '<div class="grid grid-cols-3 gap-1 bg-[#f1f5f9] p-1 rounded-full border border-[#e2e8f0] text-center" role="tablist">'
)
text = text.replace(
    '<div class="w-8 h-8 rounded-full bg-[#0a2319] border border-[#dfb992]/30 text-cyan-300 flex items-center justify-center shadow-inner">',
    '<div class="w-8 h-8 rounded-full bg-[#e8eef3] border border-[#cbd5e1] text-[#3d4f61] flex items-center justify-center shadow-xs">'
)

# 12. Central de Emergências (Navy Banner inspirado na foto)
old_emerg_card = """        <!-- CARD 4: TELEFONES ÚTEIS & CONTATOS DE EMERGÊNCIA -->
        <div class="modern-card card-earth p-5 sm:p-6 space-y-3.5">
          
          <div class="flex items-center gap-2 border-b border-[#dfb992]/20 pb-3">
            <div class="w-8 h-8 rounded-full bg-[#24130c] border border-[#dfb992]/30 flex items-center justify-center text-[#dfb992] shadow-inner">
              <i data-lucide="phone" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-[#faf4eb] tracking-tight">Central de Emergências</h3>
              <span class="text-xs font-normal text-[#eedfcb]/75">Atendimento 24 Horas Gratuito</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
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
          </div>

          <div class="pt-2 border-t border-[#dfb992]/20 flex items-center justify-between text-xs text-[#eedfcb]/80">
            <span>Plantão Defesa Civil</span>
            <button id="dock-btn-boletim" class="text-[#dfb992] hover:text-[#faf4eb] font-semibold cursor-pointer">
              Boletim Completo →
            </button>
          </div>

        </div>"""

new_emerg_card = """        <!-- CARD 4: TELEFONES ÚTEIS & CONTATOS DE EMERGÊNCIA (NAVY BANNER) -->
        <div class="modern-card card-navy-banner p-6 sm:p-7 space-y-4">
          
          <div class="flex items-center gap-2.5 border-b border-white/15 pb-3.5">
            <div class="w-8 h-8 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-xs">
              <i data-lucide="phone" class="w-4 h-4 text-[#f07a53]"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-white tracking-tight">Central de Emergências</h3>
              <span class="text-xs font-normal text-[#d9e2ec]">Atendimento 24 Horas Gratuito</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5 text-xs">
            <a href="tel:199" class="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 flex flex-col justify-between transition shadow-xs">
              <span class="text-[#d9e2ec] font-medium">Defesa Civil</span>
              <span class="text-2xl font-mono font-bold text-white mt-1">199</span>
            </a>
            <a href="tel:193" class="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 flex flex-col justify-between transition shadow-xs">
              <span class="text-[#d9e2ec] font-medium">Bombeiros</span>
              <span class="text-2xl font-mono font-bold text-white mt-1">193</span>
            </a>
            <a href="tel:192" class="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 flex flex-col justify-between transition shadow-xs">
              <span class="text-[#d9e2ec] font-medium">SAMU</span>
              <span class="text-2xl font-mono font-bold text-white mt-1">192</span>
            </a>
            <a href="tel:190" class="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 flex flex-col justify-between transition shadow-xs">
              <span class="text-[#d9e2ec] font-medium">Polícia Militar</span>
              <span class="text-2xl font-mono font-bold text-white mt-1">190</span>
            </a>
          </div>

          <div class="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-[#d9e2ec]">
            <span>Plantão Defesa Civil</span>
            <button id="dock-btn-boletim" class="text-[#f07a53] hover:text-white font-semibold cursor-pointer">
              Boletim Completo →
            </button>
          </div>

        </div>"""

text = text.replace(old_emerg_card.replace('\r\n', '\n'), new_emerg_card.replace('\r\n', '\n'))

# 13. Limpeza de cores residuais antigas
text = text.replace('text-[#faf4eb]', 'text-[#1e293b]')
text = text.replace('text-[#eedfcb]', 'text-[#334155]')
text = text.replace('text-[#a9c6b6]', 'text-[#64748b]')
text = text.replace('text-[#dfb992]', 'text-[#f07a53]')
text = text.replace('border-[#dfb992]/20', 'border-[#e2e8f0]')
text = text.replace('border-[#dfb992]/25', 'border-[#e2e8f0]')
text = text.replace('border-[#dfb992]/30', 'border-[#e2e8f0]')

with open(path_index, 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated index.html to Nordic Minimalist layout successfully!')
