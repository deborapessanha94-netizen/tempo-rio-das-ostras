# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'function renderPanoramaSinotico\(meta\) \{[\s\S]*?\n\}', re.MULTILINE)

new_func = '''function renderPanoramaSinotico(meta) {
  if (!meta) return;

  const sinopseGeral = meta.sinopse_geral || meta.sinopse || '';

  // 1. Período
  const badgePeriodo = document.getElementById('badge-periodo-sinotico');
  if (badgePeriodo && meta.periodo) {
    badgePeriodo.textContent = meta.periodo;
  }

  // 2. Texto Integral Oficial em Cartões Nórdicos Estruturados
  const textoCompletoEl = document.getElementById('sinopse-texto-completo');
  if (textoCompletoEl && sinopseGeral) {
    const paragrafos = sinopseGeral.split('\\n\\n').filter(p => p.trim());

    const sectionMetadata = [
      {
        title: 'Configuração Sinótica Regional, Campos de Pressão & Escoamento Troposférico',
        tag: 'Escoamento & Dinâmica Sinótica',
        badgeClass: 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 shadow-2xs',
        badgeTech: 'ASAS (1020 hPa) • Cavados em 500 hPa • Advecção de Umidade',
        icon: 'compass'
      },
      {
        title: 'Termodinâmica Atmosférica, Instabilidade Convectiva & Resposta Hidrológica do Rio Jundiá',
        tag: 'Termodinâmica & Hidrometeorologia',
        badgeClass: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-2xs',
        badgeTech: 'Convecção Diurna • Índices CAPE / CINE • Cota INEA 1.82 m (Vazante)',
        icon: 'cloud-lightning'
      },
      {
        title: 'Prognóstico Numérico de Mesoescala (ECMWF/GFS), Oceanografia Costeira & Tendência',
        tag: 'Modelagem Numérica & Oceanografia',
        badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs',
        badgeTech: 'Modelos ECMWF/GFS 12Z • Swell E/SE • Área Delta CHM',
        icon: 'cpu'
      }
    ];

    textoCompletoEl.innerHTML = paragrafos.map((p, idx) => {
      const metaItem = sectionMetadata[idx] || {
        title: `Diagnóstico Técnico — Setor ${idx + 1}`,
        tag: `Tópico ${idx + 1}`,
        badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs',
        badgeTech: 'Telemetria Municipal',
        icon: 'file-text'
      };

      return `
        <div class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131d35] border border-[#cbd5e1] dark:border-slate-800 shadow-2xs space-y-3 transition hover:border-[#94a3b8] dark:hover:border-slate-700">
          <div class="flex items-center justify-between gap-2 border-b border-[#e2e8f0] dark:border-slate-800 pb-2.5 flex-wrap">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10.5px] font-bold uppercase px-2.5 py-0.5 rounded-full ${metaItem.badgeClass} flex items-center gap-1.5 tracking-wider">
                <i data-lucide="${metaItem.icon}" class="w-3.5 h-3.5 text-current"></i>
                <span>${metaItem.tag}</span>
              </span>
              <h3 class="text-xs sm:text-[13px] font-bold text-black dark:text-white leading-tight">${metaItem.title}</h3>
            </div>
            <span class="text-[9.5px] sm:text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/80 font-mono">
              ${metaItem.badgeTech}
            </span>
          </div>
          <p class="leading-relaxed text-justify text-xs sm:text-sm text-black dark:text-slate-200 font-normal">
            ${cleanBulletinText(p)}
          </p>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }
}'''

m = pattern.search(content)
if m:
    content = content[:m.start()] + new_func + content[m.end():]
    print("Replaced renderPanoramaSinotico in js/app.js")
else:
    print("Could not match renderPanoramaSinotico pattern!")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Finished updating js/app.js")
