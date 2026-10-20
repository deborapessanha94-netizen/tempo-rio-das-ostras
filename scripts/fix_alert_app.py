import os

# ==========================================
# 2. Update js/app.js
# ==========================================
app_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\app.js'
with open(app_path, 'r', encoding='utf-8') as f:
    app = f.read()

# Update getAlertBadgeAndClass
old_badge_func = """function getAlertBadgeAndClass(severidade, corNome) {
  const sev = (severidade || '').toLowerCase();
  const c = (corNome || '').toLowerCase();

  if (sev.includes('grande perigo') || c.includes('vermelho')) {
    return {
      cardClass: 'alert-card-inmet-vermelho',
      badgeHtml: '<span class="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300">Alerta Vermelho • Grande Perigo</span>',
      corNome: 'Vermelho'
    };
  } else if ((sev.includes('perigo') && !sev.includes('potencial')) || c.includes('laranja')) {
    return {
      cardClass: 'alert-card-inmet-laranja',
      badgeHtml: '<span class="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-300">Alerta Laranja • Perigo</span>',
      corNome: 'Laranja'
    };
  } else {
    return {
      cardClass: 'alert-card-inmet-amarelo',
      badgeHtml: '<span class="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">Alerta Amarelo • Perigo Potencial</span>',
      corNome: 'Amarelo'
    };
  }
}"""

new_badge_func = """function getAlertBadgeAndClass(severidade, corNome) {
  const sev = (severidade || '').toLowerCase();
  const c = (corNome || '').toLowerCase();

  if (sev.includes('grande perigo') || c.includes('vermelho')) {
    return {
      cardClass: 'alert-card-inmet-vermelho',
      badgeHtml: '<span class="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#fee2e2] text-black border border-[#dc2626]">Alerta Vermelho • Grande Perigo</span>',
      corNome: 'Vermelho'
    };
  } else if ((sev.includes('perigo') && !sev.includes('potencial')) || c.includes('laranja')) {
    return {
      cardClass: 'alert-card-inmet-laranja',
      badgeHtml: '<span class="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#ffebe4] text-black border border-[#ea580c]">Alerta Laranja • Perigo</span>',
      corNome: 'Laranja'
    };
  } else {
    return {
      cardClass: 'alert-card-inmet-amarelo',
      badgeHtml: '<span class="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#ffebe4] text-black border border-[#f97316]">Alerta Amarelo • Perigo Potencial</span>',
      corNome: 'Amarelo'
    };
  }
}"""

if old_badge_func in app:
    app = app.replace(old_badge_func, new_badge_func)
else:
    app = app.replace(old_badge_func.replace('\r\n', '\n'), new_badge_func)

# Update directAlerts sorting and card rendering in renderAlertasPrincipais
old_direct_alerts = """    const directAlerts = inmetAlerts.filter(a => a.eh_direto_ostras !== false);
    const nowIso = new Date().toISOString().slice(0, 10);

    directAlerts.forEach(a => {"""

new_direct_alerts = """    const directAlerts = inmetAlerts.filter(a => a.eh_direto_ostras !== false);
    directAlerts.sort((a, b) => {
      const tA = new Date(toIsoDate(a.data_inicio || a.inicio)).getTime() || 0;
      const tB = new Date(toIsoDate(b.data_inicio || b.inicio)).getTime() || 0;
      return tA - tB;
    });
    const nowIso = new Date().toISOString().slice(0, 10);

    directAlerts.forEach(a => {"""

if old_direct_alerts in app:
    app = app.replace(old_direct_alerts, new_direct_alerts)
else:
    app = app.replace(old_direct_alerts.replace('\r\n', '\n'), new_direct_alerts)

# Update statusBadge in renderAlertasPrincipais
old_status_badge = """      let statusBadge = isVigenteHoje 
        ? '<span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">Vigente Hoje</span>'
        : (isFuturo 
            ? `<span class="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200">Programado para ${a.inicio_formatado ? a.inicio_formatado.split(' ')[0] : '22/10'}</span>`
            : '<span class="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-zinc-100 text-zinc-600 border border-zinc-200">Encerrado</span>');"""

new_status_badge = """      let statusBadge = isVigenteHoje 
        ? '<span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#ffebe4] text-black border border-[#f97316]">Vigente Hoje</span>'
        : (isFuturo 
            ? `<span class="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-[#f1f5f9] text-black border border-[#cbd5e1]">Programado para ${a.inicio_formatado ? a.inicio_formatado.split(' ')[0] : '22/10'}</span>`
            : '<span class="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-[#f1f5f9] text-black border border-[#cbd5e1]">Encerrado</span>');"""

if old_status_badge in app:
    app = app.replace(old_status_badge, new_status_badge)
else:
    app = app.replace(old_status_badge.replace('\r\n', '\n'), new_status_badge)

# Update INMET chips in cardHtml
old_inmet_chips = """              <span class="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-zinc-100 text-zinc-800 tracking-wide">
                INMET
              </span>
              <span class="text-xs font-semibold text-zinc-600 truncate">
                ${a.id ? `Aviso nº ${a.id}` : 'Aviso Especial'}
              </span>
              ${a.eh_direto_ostras ? '<span class="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Rio das Ostras</span>' : ''}"""

new_inmet_chips = """              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-[#f1f5f9] text-black border border-[#cbd5e1] tracking-wide">
                INMET
              </span>
              <span class="text-xs font-semibold font-mono text-black truncate">
                ${a.id ? `Aviso nº ${a.id}` : 'Aviso Especial'}
              </span>
              ${a.eh_direto_ostras ? '<span class="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#eaf0f6] text-black border border-[#cbd5e1]">Rio das Ostras</span>' : ''}"""

if old_inmet_chips in app:
    app = app.replace(old_inmet_chips, new_inmet_chips)
else:
    app = app.replace(old_inmet_chips.replace('\r\n', '\n'), new_inmet_chips)

# Update card sub-box and typography
app = app.replace('<div class="p-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#334155] leading-snug space-y-1">', '<div class="p-3 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-black leading-snug space-y-1.5">')
app = app.replace('text-zinc-950 leading-tight', 'text-black font-heading leading-tight')
app = app.replace('text-zinc-500 whitespace-nowrap flex items-center gap-1 shrink-0', 'text-black font-mono font-semibold whitespace-nowrap flex items-center gap-1.5 shrink-0')
app = app.replace('<i data-lucide="clock" class="w-3 h-3 text-zinc-400"></i>', '<i data-lucide="clock" class="w-3.5 h-3.5 text-black"></i>')
app = app.replace('<strong class="font-semibold text-zinc-900">Riscos:</strong>', '<strong class="font-bold text-black">Riscos:</strong>')
app = app.replace('<strong class="font-semibold text-zinc-900">Defesa Civil 199:</strong>', '<strong class="font-bold text-black">Defesa Civil 199:</strong>')
app = app.replace('border-b border-zinc-100 pb-1.5 flex-wrap', 'border-b border-[#cbd5e1] pb-2 flex-wrap')

# Update badgeTotal in renderAlertasPrincipais
old_badgetotal = "badgeTotal.className = 'text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-amber-50 text-amber-800 border border-amber-200';"
new_badgetotal = "badgeTotal.className = 'text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#ffebe4] text-black border border-[#f97316]';"
app = app.replace(old_badgetotal, new_badgetotal)

# Update modal avisos badges
app = app.replace('bg-amber-50 text-amber-800 border border-amber-200', 'bg-[#ffebe4] text-black border border-[#f97316] font-bold')
app = app.replace('bg-blue-50 text-blue-800 border border-blue-200', 'bg-[#eaf0f6] text-black border border-[#94a3b8] font-bold')

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app)

print("Updated js/app.js successfully")
