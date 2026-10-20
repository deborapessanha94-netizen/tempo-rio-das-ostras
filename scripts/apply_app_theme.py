# -*- coding: utf-8 -*-
"""
Script para sincronizar os templates dinâmicos de app.js com o tema
Floresta, Terra & Areia Dourada.
"""

path_app = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\app.js'

with open(path_app, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update version registration in setupPWA
text = text.replace("sw.js?v=62", "sw.js?v=63")

# 2. Update list3d dynamic template
old_list3d_block = """    list3d.innerHTML = meta.dias_resumo.map((d, idx) => {
      const rotulos = ['Hoje', 'Amanhã', 'Depois de amanhã'];
      const rotuloCurto = rotulos[idx] || `Dia ${idx + 1}`;
      const nomeDiaCurto = d.dia ? d.dia.split(/[–\-]/)[0].trim() : '';
      const tempVal = d.pilares?.temp?.val ? d.pilares.temp.val.replace(' a ', ' / ') : '24° / 19°C';
      const condTxt = d.subtitulo ? d.subtitulo.split(/[–\-]/)[0].trim() : 'Estável';
      const iconName = d.pilares?.ceu?.icon || 'cloud-sun';
      const chuvaVal = d.pilares?.chuva?.val || '0 mm';

      return `
        <div class="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-2.5 cursor-pointer transition hover:border-zinc-300 shadow-xs" onclick="window.toggleDayCard(${idx})">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                <i data-lucide="${iconName}" class="w-4 h-4"></i>
              </div>
              <div class="min-w-0">
                <span class="font-bold text-zinc-900 text-sm block leading-tight truncate">${rotuloCurto} (${nomeDiaCurto})</span>
                <span class="text-xs font-normal text-zinc-500 block truncate">${condTxt} • ${chuvaVal}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0 pl-2">
              <span class="font-bold font-mono text-zinc-900 text-sm sm:text-base">${tempVal}</span>
              <i data-lucide="chevron-down" id="day-card-chevron-${idx}" class="w-4 h-4 text-zinc-400 transition"></i>
            </div>
          </div>

          <!-- Acordeão com os Pilares Oficiais e Informe à População -->
          <div id="day-card-collapse-${idx}" class="pilares-collapse hidden pt-2 border-t border-zinc-100 space-y-2">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Céu</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.ceu?.val || '—')}</span>
              </div>
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Chuva</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.chuva?.val || '—')}</span>
              </div>
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Vento</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.vento?.val || '—')}</span>
              </div>
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Mar</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.mar?.val || '—')}</span>
              </div>
            </div>

            ${Array.isArray(d.informe_populacao) && d.informe_populacao.length > 0 ? `
              <div class="mt-2 p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs sm:text-sm text-zinc-800 space-y-2 leading-relaxed">
                ${d.informe_populacao.map(item => `<p>${cleanBulletinText(item)}</p>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');"""

new_list3d_block = """    const cardThemes = [
      {
        cardClass: 'card-sage border border-[#a9c6b6]/35',
        medallionClass: 'icon-medallion',
        badgeText: 'text-[#dce8df]',
        iconColor: 'text-[#faf4eb]'
      },
      {
        cardClass: 'card-earth border border-[#dfb992]/35',
        medallionClass: 'icon-medallion icon-medallion-earth',
        badgeText: 'text-[#eedfcb]',
        iconColor: 'text-[#eedfcb]'
      },
      {
        cardClass: 'card-toffee border border-[#f0c598]/35',
        medallionClass: 'icon-medallion icon-medallion-sand',
        badgeText: 'text-[#fde68a]',
        iconColor: 'text-amber-200'
      }
    ];

    list3d.innerHTML = meta.dias_resumo.map((d, idx) => {
      const rotulos = ['Hoje', 'Amanhã', 'Depois de amanhã'];
      const rotuloCurto = rotulos[idx] || `Dia ${idx + 1}`;
      const nomeDiaCurto = d.dia ? d.dia.split(/[–\-]/)[0].trim() : '';
      const tempVal = d.pilares?.temp?.val ? d.pilares.temp.val.replace(' a ', ' / ') : '24° / 19°C';
      const condTxt = d.subtitulo ? d.subtitulo.split(/[–\-]/)[0].trim() : 'Estável';
      const iconName = d.pilares?.ceu?.icon || 'cloud-sun';
      const chuvaVal = d.pilares?.chuva?.val || '0 mm';
      const theme = cardThemes[idx % 3];

      return `
        <div class="p-4 rounded-2xl ${theme.cardClass} space-y-2.5 cursor-pointer transition hover:scale-[1.01] shadow-md" onclick="window.toggleDayCard(${idx})">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-3 min-w-0">
              <div class="${theme.medallionClass} w-9 h-9 shrink-0">
                <i data-lucide="${iconName}" class="w-4 h-4 ${theme.iconColor}"></i>
              </div>
              <div class="min-w-0">
                <span class="font-bold text-[#faf4eb] text-sm block leading-tight truncate">${rotuloCurto} (${nomeDiaCurto})</span>
                <span class="text-xs font-normal ${theme.badgeText} block truncate">${condTxt} • ${chuvaVal}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0 pl-2">
              <span class="font-bold font-mono text-[#faf4eb] text-sm sm:text-base">${tempVal}</span>
              <i data-lucide="chevron-down" id="day-card-chevron-${idx}" class="w-4 h-4 text-[#dfb992] transition"></i>
            </div>
          </div>

          <!-- Acordeão com os Pilares Oficiais e Informe à População -->
          <div id="day-card-collapse-${idx}" class="pilares-collapse hidden pt-3 border-t border-white/10 space-y-2.5">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2 rounded-xl bg-black/25 border border-white/10">
                <span class="text-[#a9c6b6] font-semibold block uppercase text-[10px] tracking-wider">Céu</span>
                <span class="text-[#faf4eb] font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.ceu?.val || '—')}</span>
              </div>
              <div class="p-2 rounded-xl bg-black/25 border border-white/10">
                <span class="text-[#a9c6b6] font-semibold block uppercase text-[10px] tracking-wider">Chuva</span>
                <span class="text-[#faf4eb] font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.chuva?.val || '—')}</span>
              </div>
              <div class="p-2 rounded-xl bg-black/25 border border-white/10">
                <span class="text-[#a9c6b6] font-semibold block uppercase text-[10px] tracking-wider">Vento</span>
                <span class="text-[#faf4eb] font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.vento?.val || '—')}</span>
              </div>
              <div class="p-2 rounded-xl bg-black/25 border border-white/10">
                <span class="text-[#a9c6b6] font-semibold block uppercase text-[10px] tracking-wider">Mar</span>
                <span class="text-[#faf4eb] font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.mar?.val || '—')}</span>
              </div>
            </div>

            ${Array.isArray(d.informe_populacao) && d.informe_populacao.length > 0 ? `
              <div class="mt-2 p-3 rounded-xl bg-black/30 border border-white/10 text-xs sm:text-sm text-[#eedfcb] space-y-2 leading-relaxed">
                ${d.informe_populacao.map(item => `<p>${cleanBulletinText(item)}</p>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');"""

text = text.replace(old_list3d_block.replace('\r\n', '\n'), new_list3d_block.replace('\r\n', '\n'))

# 3. Update day button classes in selectOrlaDay
old_day_btns = """      if (dk === dayKey) {
        btn.className = 'orla-day-btn active px-2.5 py-1 rounded text-xs font-bold bg-blue-600 text-white shadow-xs cursor-pointer';
      } else {
        btn.className = 'orla-day-btn px-2.5 py-1 rounded text-xs font-medium bg-white text-zinc-700 hover:bg-zinc-100 border border-blue-200 cursor-pointer';
      }"""

new_day_btns = """      if (dk === dayKey) {
        btn.className = 'orla-day-btn active px-3 py-1 rounded-full text-xs font-bold cursor-pointer';
      } else {
        btn.className = 'orla-day-btn px-3 py-1 rounded-full text-xs font-medium bg-[#133a2b] text-[#eedfcb] hover:bg-[#1c4d39] border border-[#dfb992]/25 cursor-pointer';
      }"""

text = text.replace(old_day_btns.replace('\r\n', '\n'), new_day_btns.replace('\r\n', '\n'))

# 4. Update praias list cards
old_praia_card = """      return `
        <div class="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <strong class="font-semibold text-zinc-900 text-xs">${p.nome}</strong>
              <span class="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700 font-normal">${p.tipo_orla || ''}</span>
            </div>
            <span class="text-[11px] text-zinc-500 block mt-0.5">${detalhe}</span>
            <span class="text-[10.5px] font-mono font-medium text-blue-700 block mt-0.5">Ondas: ${ondas}</span>
          </div>
          <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeClass} shrink-0 border">
            ${estado}
          </span>
        </div>
      `;"""

new_praia_card = """      return `
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

text = text.replace(old_praia_card.replace('\r\n', '\n'), new_praia_card.replace('\r\n', '\n'))

# 5. Update pontos de balneabilidade
old_balnear_card = """      return `
        <div class="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/70 flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <strong class="font-semibold text-zinc-900 text-xs">${pt.praia}</strong>
              <span class="text-[9.5px] px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-600 font-mono">${pt.codigo}</span>
            </div>
            <span class="text-[11px] text-zinc-500 block mt-0.5">${pt.localizacao}</span>
            ${motivoHtml}
          </div>
          <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeClass} shrink-0 border">
            ${pt.status}
          </span>
        </div>
      `;"""

new_balnear_card = """      return `
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

text = text.replace(old_balnear_card.replace('\r\n', '\n'), new_balnear_card.replace('\r\n', '\n'))

with open(path_app, 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated app.js templates successfully!')
