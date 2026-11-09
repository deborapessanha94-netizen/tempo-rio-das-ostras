import os

PATH = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\app.js"

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Patch inside renderDashboardUI
target1 = '''  // 4. Barras de Chuva por Turno



  renderChuvaTurnosBars(rows);
  if (window.lucide) window.lucide.createIcons();
}'''

replacement1 = '''  // 4. Barras de Chuva por Turno



  renderChuvaTurnosBars(rows);
  if (window.lucide) window.lucide.createIcons();

  // 5. Panorama Meteorológico Semanal (7 Dias)
  try {
    if (typeof renderPanoramaSemanal === 'function') {
      renderPanoramaSemanal(weather, meta);
    }
  } catch (errWeekly) {
    console.warn('[Weekly Overview] Erro ao renderizar panorama semanal:', errWeekly);
  }
}'''

if target1 in content:
    content = content.replace(target1, replacement1, 1)
    print("Patch 1 applied: renderPanoramaSemanal inside renderDashboardUI")
else:
    print("Warning: target1 not found")

# 2. Patch window.openSocialModal
target2 = '''window.openSocialModal = openSocialModalChuva;
window.openSocialModalChuva = openSocialModalChuva;'''

replacement2 = '''window.openSocialModal = function(param) {
  if (param === 'tempo' || param === 'tempo_agora') {
    if (typeof openSocialModalTempoAgora === 'function') openSocialModalTempoAgora();
    else if (window.openSocialModalTempoAgora) window.openSocialModalTempoAgora();
  } else if (param === 'vento') {
    if (typeof openSocialModalVento === 'function') openSocialModalVento();
    else if (window.openSocialModalVento) window.openSocialModalVento();
  } else if (param === 'semanal') {
    if (typeof openSocialModalSemanal === 'function') openSocialModalSemanal();
    else if (window.openSocialModalSemanal) window.openSocialModalSemanal();
  } else {
    if (typeof openSocialModalChuva === 'function') openSocialModalChuva(param || '24h');
    else if (window.openSocialModalChuva) window.openSocialModalChuva(param || '24h');
  }
};
window.openSocialModalChuva = openSocialModalChuva;
window.openSocialModalVento = openSocialModalVento;
window.openSocialModalSemanal = openSocialModalSemanal;'''

if target2 in content:
    content = content.replace(target2, replacement2, 1)
    print("Patch 2 applied: window.openSocialModal dispatcher")
else:
    print("Warning: target2 not found")

with open(PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("Patching complete for app.js")
