# -*- coding: utf-8 -*-
path_app = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\app.js'

with open(path_app, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, l in enumerate(lines):
    if 'list3d.innerHTML = meta.dias_resumo.map' in l:
        start_idx = i
    if start_idx != -1 and 'renderChuvaTurnosBars(rows);' in l:
        end_idx = i
        break

print('Found list3d lines:', start_idx, end_idx)

replacement = """    const cardThemes = [
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
      const nomeDiaCurto = d.dia ? d.dia.split(/[•—\-]/)[0].trim() : '';
      const tempVal = d.pilares?.temp?.val ? d.pilares.temp.val.replace(' a ', ' / ') : '24° / 19°C';
      const condTxt = d.subtitulo ? d.subtitulo.split(/[•—\-]/)[0].trim() : 'Estável';
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
    }).join('');
  }
"""

new_lines = lines[:start_idx] + [replacement] + lines[end_idx:]

with open(path_app, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Updated app.js 3-day cards successfully!')
