# -*- coding: utf-8 -*-
path_app = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\app.js'

with open(path_app, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update version to v64
text = text.replace('sw.js?v=63', 'sw.js?v=64')

# 2. Update list3d 3-card block
start_marker = "if (list3d && meta?.dias_resumo && Array.isArray(meta.dias_resumo)) {"
end_marker = "renderChuvaTurnosBars(rows);"

s_idx = text.find(start_marker)
e_idx = text.find(end_marker, s_idx)

new_3d_code = """if (list3d && meta?.dias_resumo && Array.isArray(meta.dias_resumo)) {
    const cardThemes = [
      {
        cardClass: 'card-coral shadow-lg',
        medallionClass: 'icon-medallion bg-white/20 text-white',
        badgeText: 'text-white/90',
        titleText: 'text-white',
        tempText: 'text-white',
        iconColor: 'text-white',
        chevronColor: 'text-white/80',
        subCardBg: 'bg-black/15 border border-white/20 text-white',
        subCardLabel: 'text-white/80'
      },
      {
        cardClass: 'card-stoneware bg-white border border-[#e2e8f0] shadow-sm',
        medallionClass: 'icon-medallion bg-[#f1f5f9] text-[#3d4f61]',
        badgeText: 'text-[#64748b]',
        titleText: 'text-[#1e293b]',
        tempText: 'text-[#1e293b]',
        iconColor: 'text-[#3d4f61]',
        chevronColor: 'text-[#64748b]',
        subCardBg: 'bg-[#f8fafc] border border-[#e2e8f0] text-[#334155]',
        subCardLabel: 'text-[#64748b]'
      },
      {
        cardClass: 'card-slate shadow-lg',
        medallionClass: 'icon-medallion bg-white/15 text-white',
        badgeText: 'text-[#d9e2ec]',
        titleText: 'text-white',
        tempText: 'text-white',
        iconColor: 'text-white',
        chevronColor: 'text-white/80',
        subCardBg: 'bg-black/20 border border-white/15 text-white',
        subCardLabel: 'text-[#d9e2ec]'
      }
    ];

    list3d.innerHTML = meta.dias_resumo.map((d, idx) => {
      const rotulos = ['Hoje', 'Amanhã', 'Depois de amanhã'];
      const rotuloCurto = rotulos[idx] || `Dia ${idx + 1}`;
      const nomeDiaCurto = d.dia ? d.dia.split(/[•—\-]/)[0].trim() : '';
      const tempVal = d.pilares?.temp?.val ? d.pilares.temp.val.replace(' a ', ' / ') : '24° / 19°C';
      const condTxt = d.subtitulo ? d.subtitulo.split(/[•—\-]/)[0].trim() : 'Estável';
      const iconName = d.pilares?.ceu?.icon || 'cloud-sun';
      const chuvaVal = d.pilares?.chuva?.val || '0 mm';
      const theme = cardThemes[idx % 3];

      return `
        <div class="p-4 rounded-2xl ${theme.cardClass} space-y-2.5 cursor-pointer transition hover:scale-[1.01]" onclick="window.toggleDayCard(${idx})">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-3 min-w-0">
              <div class="${theme.medallionClass} w-9 h-9 shrink-0">
                <i data-lucide="${iconName}" class="w-4 h-4 ${theme.iconColor}"></i>
              </div>
              <div class="min-w-0">
                <span class="font-bold ${theme.titleText} text-sm block leading-tight truncate">${rotuloCurto} (${nomeDiaCurto})</span>
                <span class="text-xs font-normal ${theme.badgeText} block truncate">${condTxt} • ${chuvaVal}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0 pl-2">
              <span class="font-bold font-mono ${theme.tempText} text-sm sm:text-base">${tempVal}</span>
              <i data-lucide="chevron-down" id="day-card-chevron-${idx}" class="w-4 h-4 ${theme.chevronColor} transition"></i>
            </div>
          </div>

          <!-- Acordeão com os Pilares Oficiais e Informe à População -->
          <div id="day-card-collapse-${idx}" class="pilares-collapse hidden pt-3 border-t border-current/15 space-y-2.5">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2 rounded-xl ${theme.subCardBg}">
                <span class="${theme.subCardLabel} font-semibold block uppercase text-[10px] tracking-wider">Céu</span>
                <span class="font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.ceu?.val || '—')}</span>
              </div>
              <div class="p-2 rounded-xl ${theme.subCardBg}">
                <span class="${theme.subCardLabel} font-semibold block uppercase text-[10px] tracking-wider">Chuva</span>
                <span class="font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.chuva?.val || '—')}</span>
              </div>
              <div class="p-2 rounded-xl ${theme.subCardBg}">
                <span class="${theme.subCardLabel} font-semibold block uppercase text-[10px] tracking-wider">Vento</span>
                <span class="font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.vento?.val || '—')}</span>
              </div>
              <div class="p-2 rounded-xl ${theme.subCardBg}">
                <span class="${theme.subCardLabel} font-semibold block uppercase text-[10px] tracking-wider">Mar</span>
                <span class="font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.mar?.val || '—')}</span>
              </div>
            </div>

            ${Array.isArray(d.informe_populacao) && d.informe_populacao.length > 0 ? `
              <div class="mt-2 p-3 rounded-xl ${theme.subCardBg} text-xs sm:text-sm space-y-2 leading-relaxed">
                ${d.informe_populacao.map(item => `<p>${cleanBulletinText(item)}</p>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // 4. Barras de Chuva por Turno
  """

text = text[:s_idx] + new_3d_code + text[e_idx:]

# 3. Update day buttons in selectOrlaDay
old_day_b = """      if (dk === dayKey) {
        btn.className = 'orla-day-btn active px-3 py-1 rounded-full text-xs font-bold cursor-pointer';
      } else {
        btn.className = 'orla-day-btn px-3 py-1 rounded-full text-xs font-medium bg-[#133a2b] text-[#eedfcb] hover:bg-[#1c4d39] border border-[#dfb992]/25 cursor-pointer';
      }"""

new_day_b = """      if (dk === dayKey) {
        btn.className = 'orla-day-btn active px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#f07a53] text-white shadow-sm cursor-pointer';
      } else {
        btn.className = 'orla-day-btn px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#ffffff] text-[#475569] hover:bg-[#f1f5f9] border border-[#e2e8f0] cursor-pointer';
      }"""

text = text.replace(old_day_b.replace('\r\n', '\n'), new_day_b.replace('\r\n', '\n'))

# 4. Update praias list cards
old_praia = """      return `
        <div class="p-2.5 rounded-xl bg-[#092218]/70 border border-[#dfb992]/20 flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <strong class="font-semibold text-[#faf4eb] text-xs">${p.nome}</strong>
              <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-[#133a2b] text-[#eedfcb] font-normal border border-[#dfb992]/20">${p.tipo_orla || ''}</span>
            </div>
            <span class="text-[11px] text-[#a9c6b6] block mt-0.5">${detalhe}</span>
            <span class="text-[10.5px] font-mono font-medium text-cyan-300 block mt-0.5">Ondas: ${ondas}</span>
          </div>
          <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeClass} shrink-0 border">
            ${estado}
          </span>
        </div>
      `;"""

new_praia = """      return `
        <div class="p-3 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm flex items-start justify-between gap-2.5 transition hover:border-[#cbd5e1]">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <strong class="font-bold text-[#1e293b] text-xs">${p.nome}</strong>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#475569] font-medium border border-[#e2e8f0]">${p.tipo_orla || ''}</span>
            </div>
            <span class="text-[11px] text-[#64748b] block mt-0.5">${detalhe}</span>
            <span class="text-[11px] font-mono font-semibold text-[#3d4f61] block mt-0.5">Ondas: ${ondas}</span>
          </div>
          <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badgeClass} shrink-0">
            ${estado}
          </span>
        </div>
      `;"""

text = text.replace(old_praia.replace('\r\n', '\n'), new_praia.replace('\r\n', '\n'))

# 5. Update pontos balnear
old_balnear = """      return `
        <div class="p-2.5 rounded-xl bg-[#092218]/70 border border-[#dfb992]/20 flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <strong class="font-semibold text-[#faf4eb] text-xs">${pt.praia}</strong>
              <span class="text-[9.5px] px-1.5 py-0.2 rounded-full bg-[#133a2b] text-[#eedfcb] font-mono border border-[#dfb992]/20">${pt.codigo}</span>
            </div>
            <span class="text-[11px] text-[#a9c6b6] block mt-0.5">${pt.localizacao}</span>
            ${motivoHtml}
          </div>
          <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badgeClass} shrink-0 border">
            ${pt.status}
          </span>
        </div>
      `;"""

new_balnear = """      return `
        <div class="p-3 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm flex items-start justify-between gap-2.5 transition hover:border-[#cbd5e1]">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <strong class="font-bold text-[#1e293b] text-xs">${pt.praia}</strong>
              <span class="text-[9.5px] px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#475569] font-mono border border-[#e2e8f0]">${pt.codigo}</span>
            </div>
            <span class="text-[11px] text-[#64748b] block mt-0.5">${pt.localizacao}</span>
            ${motivoHtml}
          </div>
          <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badgeClass} shrink-0">
            ${pt.status}
          </span>
        </div>
      `;"""

text = text.replace(old_balnear.replace('\r\n', '\n'), new_balnear.replace('\r\n', '\n'))

with open(path_app, 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated app.js for Nordic Minimalist design successfully!')
