import os

# ==========================================
# 1. Update js/app.js
# ==========================================
app_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\app.js'
with open(app_path, 'r', encoding='utf-8') as f:
    app = f.read()

old_sinopse_func = """function renderPanoramaSinotico(meta) {
  if (!meta) return;

  const sinopseGeral = meta.sinopse_geral || meta.sinopse || '';

  // 1. Período
  const badgePeriodo = document.getElementById('badge-periodo-sinotico');
  if (badgePeriodo && meta.periodo) {
    badgePeriodo.textContent = meta.periodo;
  }

  // 2. Texto Integral Oficial
  const textoCompletoEl = document.getElementById('sinopse-texto-completo');
  if (textoCompletoEl && sinopseGeral) {
    const paragrafos = sinopseGeral.split('\\n\\n').filter(p => p.trim());
    textoCompletoEl.innerHTML = paragrafos.map(p => `<p class="leading-relaxed text-justify text-zinc-800">${cleanBulletinText(p)}</p>`).join('');
  }
}"""

new_sinopse_func = """function renderPanoramaSinotico(meta) {
  if (!meta) return;

  const sinopseGeral = meta.sinopse_geral || meta.sinopse || '';

  // 1. Período
  const badgePeriodo = document.getElementById('badge-periodo-sinotico');
  if (badgePeriodo && meta.periodo) {
    badgePeriodo.textContent = meta.periodo;
  }

  // 2. Texto Integral Oficial em Cartões Nórdicos Cerâmicos Estruturados
  const textoCompletoEl = document.getElementById('sinopse-texto-completo');
  if (textoCompletoEl && sinopseGeral) {
    const paragrafos = sinopseGeral.split('\\n\\n').filter(p => p.trim());
    
    const sectionMetadata = [
      {
        tag: 'Dinâmica Atmosférica & Temperatura',
        badgeClass: 'bg-[#eaf0f6] text-black border border-[#94a3b8]',
        icon: 'cloud-sun'
      },
      {
        tag: 'Hidrografia, Rio Jundiá & Faixa Litorânea',
        badgeClass: 'bg-[#ffebe4] text-black border border-[#f97316]',
        icon: 'waves'
      },
      {
        tag: 'Tendência dos Próximos Dias & PLANCON',
        badgeClass: 'bg-[#f1f5f9] text-black border border-[#cbd5e1]',
        icon: 'calendar-clock'
      }
    ];

    textoCompletoEl.innerHTML = paragrafos.map((p, idx) => {
      const metaItem = sectionMetadata[idx] || {
        tag: `Tópico ${idx + 1}`,
        badgeClass: 'bg-[#f1f5f9] text-black border border-[#cbd5e1]',
        icon: 'file-text'
      };

      return `
        <div class="p-4 sm:p-5 rounded-2xl bg-white border border-[#cbd5e1] shadow-2xs space-y-2.5 transition hover:border-[#94a3b8]">
          <div class="flex items-center gap-2 border-b border-[#e2e8f0] pb-2">
            <span class="text-[10.5px] font-bold uppercase px-2.5 py-0.5 rounded-full ${metaItem.badgeClass} flex items-center gap-1.5 tracking-wider">
              <i data-lucide="${metaItem.icon}" class="w-3.5 h-3.5 text-black"></i>
              <span>${metaItem.tag}</span>
            </span>
          </div>
          <p class="leading-relaxed text-justify text-sm text-black font-normal">${cleanBulletinText(p)}</p>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }
}"""

if old_sinopse_func in app:
    app = app.replace(old_sinopse_func, new_sinopse_func)
else:
    app = app.replace(old_sinopse_func.replace('\r\n', '\n'), new_sinopse_func)

# Bump version in app.js
app = app.replace("register('./sw.js?v=67')", "register('./sw.js?v=68')")

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app)

print("Updated js/app.js successfully")
