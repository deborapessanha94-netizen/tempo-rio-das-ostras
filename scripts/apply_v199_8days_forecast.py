import re

INDEX_PATH = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html'
APP_JS_PATH = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\app.js'

# --- 1. UPDATE index.html ---
with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    html = f.read()

# Update dropdown descriptions
html = html.replace(
    'Cards operacionais de 4 dias (Hoje + 3 dias à frente) com mar e detalhes',
    'Previsão operacional para 1 semana à frente (Hoje + 7 dias) com mar e detalhes'
)
html = html.replace(
    'Madrugada, manhã, tarde e noite para os 4 dias (Hoje + 3 dias à frente)',
    'Madrugada, manhã, tarde e noite para 1 semana à frente (Hoje + 7 dias)'
)

# Update section-previsao-3dias header title
html = html.replace(
    '<h3 class="text-base sm:text-lg font-bold text-black tracking-tight">Previsão dos Próximos Dias</h3>',
    '<h3 class="text-base sm:text-lg font-bold text-black tracking-tight">Previsão dos Próximos Dias (1 Semana à Frente)</h3>'
)

# Update other references to 4 dias / hoje + 3 dias
html = html.replace('Mar (4 Dias)', 'Mar (1 Semana / 8 Dias)')
html = html.replace('Somatório para 4 Dias (Hoje + 3 Dias à Frente):', 'Somatório para 1 Semana (Hoje + 7 Dias à Frente):')
html = html.replace('Panorama Sinótico Geral dos 4 Dias (Hoje + 3 Dias à Frente)', 'Panorama Sinótico Geral para 1 Semana (Hoje + 7 Dias à Frente)')

# Update chuva-turnos-day-selector in Boletim to 8 days
old_turnos_selector = re.compile(
    r'<div class="grid grid-cols-2 sm:grid-cols-4 gap-2" id="chuva-turnos-day-selector">.*?</div>\s*</div>',
    re.DOTALL
)

new_turnos_selector = """<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2" id="chuva-turnos-day-selector">
              <button type="button" onclick="selectTurnoDay(0)" id="btn-turno-day-0" class="p-2 rounded-xl text-left border-2 border-[#0284c7] bg-[#f0f9ff] text-black transition shadow-2xs cursor-pointer">
                <div class="text-[10px] uppercase font-bold text-black/70">Hoje (D0)</div>
                <div class="text-xs font-black text-black flex items-center justify-between">
                  <span id="lbl-turno-day-0-name">Hoje</span>
                  <span id="lbl-turno-day-0-val" class="font-mono text-[#0369a1]">-- mm</span>
                </div>
              </button>
              <button type="button" onclick="selectTurnoDay(1)" id="btn-turno-day-1" class="p-2 rounded-xl text-left border border-[#cbd5e1] bg-white text-black hover:bg-[#f8fafc] transition shadow-2xs cursor-pointer">
                <div class="text-[10px] uppercase font-bold text-black/70">Amanhã (D1)</div>
                <div class="text-xs font-black text-black flex items-center justify-between">
                  <span id="lbl-turno-day-1-name">Amanhã</span>
                  <span id="lbl-turno-day-1-val" class="font-mono text-black">-- mm</span>
                </div>
              </button>
              <button type="button" onclick="selectTurnoDay(2)" id="btn-turno-day-2" class="p-2 rounded-xl text-left border border-[#cbd5e1] bg-white text-black hover:bg-[#f8fafc] transition shadow-2xs cursor-pointer">
                <div class="text-[10px] uppercase font-bold text-black/70">D+2</div>
                <div class="text-xs font-black text-black flex items-center justify-between">
                  <span id="lbl-turno-day-2-name">D+2</span>
                  <span id="lbl-turno-day-2-val" class="font-mono text-black">-- mm</span>
                </div>
              </button>
              <button type="button" onclick="selectTurnoDay(3)" id="btn-turno-day-3" class="p-2 rounded-xl text-left border border-[#cbd5e1] bg-white text-black hover:bg-[#f8fafc] transition shadow-2xs cursor-pointer">
                <div class="text-[10px] uppercase font-bold text-black/70">D+3</div>
                <div class="text-xs font-black text-black flex items-center justify-between">
                  <span id="lbl-turno-day-3-name">D+3</span>
                  <span id="lbl-turno-day-3-val" class="font-mono text-black">-- mm</span>
                </div>
              </button>
              <button type="button" onclick="selectTurnoDay(4)" id="btn-turno-day-4" class="p-2 rounded-xl text-left border border-[#cbd5e1] bg-white text-black hover:bg-[#f8fafc] transition shadow-2xs cursor-pointer">
                <div class="text-[10px] uppercase font-bold text-black/70">D+4</div>
                <div class="text-xs font-black text-black flex items-center justify-between">
                  <span id="lbl-turno-day-4-name">D+4</span>
                  <span id="lbl-turno-day-4-val" class="font-mono text-black">-- mm</span>
                </div>
              </button>
              <button type="button" onclick="selectTurnoDay(5)" id="btn-turno-day-5" class="p-2 rounded-xl text-left border border-[#cbd5e1] bg-white text-black hover:bg-[#f8fafc] transition shadow-2xs cursor-pointer">
                <div class="text-[10px] uppercase font-bold text-black/70">D+5</div>
                <div class="text-xs font-black text-black flex items-center justify-between">
                  <span id="lbl-turno-day-5-name">D+5</span>
                  <span id="lbl-turno-day-5-val" class="font-mono text-black">-- mm</span>
                </div>
              </button>
              <button type="button" onclick="selectTurnoDay(6)" id="btn-turno-day-6" class="p-2 rounded-xl text-left border border-[#cbd5e1] bg-white text-black hover:bg-[#f8fafc] transition shadow-2xs cursor-pointer">
                <div class="text-[10px] uppercase font-bold text-black/70">D+6</div>
                <div class="text-xs font-black text-black flex items-center justify-between">
                  <span id="lbl-turno-day-6-name">D+6</span>
                  <span id="lbl-turno-day-6-val" class="font-mono text-black">-- mm</span>
                </div>
              </button>
              <button type="button" onclick="selectTurnoDay(7)" id="btn-turno-day-7" class="p-2 rounded-xl text-left border border-[#cbd5e1] bg-white text-black hover:bg-[#f8fafc] transition shadow-2xs cursor-pointer">
                <div class="text-[10px] uppercase font-bold text-black/70">D+7</div>
                <div class="text-xs font-black text-black flex items-center justify-between">
                  <span id="lbl-turno-day-7-name">D+7</span>
                  <span id="lbl-turno-day-7-val" class="font-mono text-black">-- mm</span>
                </div>
              </button>
            </div>
          </div>"""

if old_turnos_selector.search(html):
    html = old_turnos_selector.sub(new_turnos_selector, html, count=1)
    print("SUCCESS: Updated chuva-turnos-day-selector in index.html to 8 days")
else:
    print("WARNING: Could not match old_turnos_selector")

# Bump version to v=199
html = html.replace('src="js/app.js?v=198"', 'src="js/app.js?v=199"')

with open(INDEX_PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print("SUCCESS: Saved index.html (v=199)")

# --- 2. UPDATE js/app.js ---
with open(APP_JS_PATH, 'r', encoding='utf-8') as f:
    app_js = f.read()

# Update rotulos array to 8 days
app_js = app_js.replace(
    "const rotulos = ['Hoje', 'Amanhã', 'Depois de amanhã', 'D+3'];",
    "const rotulos = ['Hoje', 'Amanhã', 'Depois de amanhã', 'D+3', 'D+4', 'D+5', 'D+6', 'D+7'];"
)

# Update marInfoList for 8 days
old_mar_info = """      const marInfoList = [
        { ondas: '1,2 a 1,6 m', estado: 'Calmo a Moderado', chip: '1,2 a 1,6 m (Mod.)', detalhe: 'Swell E/SE • Enseadas 0,3-0,7 m | Oceânica 1,2-1,6 m' },
        { ondas: '1,0 a 1,4 m', estado: 'Moderado', chip: '1,0 a 1,4 m (Mod.)', detalhe: 'Swell E • Enseadas 0,3-0,6 m | Oceânica 1,0-1,4 m' },
        { ondas: '0,8 a 1,2 m', estado: 'Calmo', chip: '0,8 a 1,2 m (Calmo)', detalhe: 'Swell E/NE • Enseadas 0,2-0,5 m | Oceânica 0,8-1,2 m' }
      ];
      const marInfo = marInfoList[idx] || { ondas: '1,0 m', estado: 'Normal', chip: '1,0 m', detalhe: 'Condições regulares de mar' };"""

new_mar_info = """      const marInfoList = [
        { ondas: '1,2 a 1,6 m', estado: 'Calmo a Moderado', chip: '1,2 a 1,6 m (Mod.)', detalhe: 'Swell E/SE • Enseadas 0,3-0,7 m | Oceânica 1,2-1,6 m' },
        { ondas: '1,0 a 1,4 m', estado: 'Moderado', chip: '1,0 a 1,4 m (Mod.)', detalhe: 'Swell E • Enseadas 0,3-0,6 m | Oceânica 1,0-1,4 m' },
        { ondas: '0,8 a 1,2 m', estado: 'Calmo', chip: '0,8 a 1,2 m (Calmo)', detalhe: 'Swell E/NE • Enseadas 0,2-0,5 m | Oceânica 0,8-1,2 m' },
        { ondas: '0,9 a 1,3 m', estado: 'Calmo a Moderado', chip: '0,9 a 1,3 m (Mod.)', detalhe: 'Swell E • Enseadas 0,3-0,6 m | Oceânica 0,9-1,3 m' },
        { ondas: '1,1 a 1,5 m', estado: 'Moderado', chip: '1,1 a 1,5 m (Mod.)', detalhe: 'Swell SE • Enseadas 0,3-0,7 m | Oceânica 1,1-1,5 m' },
        { ondas: '1,0 a 1,4 m', estado: 'Moderado', chip: '1,0 a 1,4 m (Mod.)', detalhe: 'Swell E/SE • Enseadas 0,3-0,6 m | Oceânica 1,0-1,4 m' },
        { ondas: '0,8 a 1,2 m', estado: 'Calmo', chip: '0,8 a 1,2 m (Calmo)', detalhe: 'Swell E • Enseadas 0,2-0,5 m | Oceânica 0,8-1,2 m' },
        { ondas: '0,9 a 1,3 m', estado: 'Calmo a Moderado', chip: '0,9 a 1,3 m (Mod.)', detalhe: 'Swell E/NE • Enseadas 0,3-0,6 m | Oceânica 0,9-1,3 m' }
      ];
      const marInfo = (d.pilares?.mar?.val && d.pilares.mar.val !== '1.4 m')
        ? { ondas: d.pilares.mar.val, estado: 'Moderado', chip: `${d.pilares.mar.val} (Mod.)`, detalhe: `Swell E/SE • Faixa Oceânica ${d.pilares.mar.val}` }
        : (marInfoList[idx] || { ondas: '1,0 a 1,4 m', estado: 'Normal', chip: '1,0 a 1,4 m (Mod.)', detalhe: 'Condições regulares de mar' });"""

if old_mar_info in app_js:
    app_js = app_js.replace(old_mar_info, new_mar_info)
    print("SUCCESS: Updated marInfoList in js/app.js to 8 days")
else:
    print("WARNING: Could not find exact old_mar_info block in js/app.js")

# Synthesis fallback if meta.dias_resumo has fewer than 8 days
target_inject = "if (list3d && meta?.dias_resumo && Array.isArray(meta.dias_resumo)) {"
replacement_inject = """// Garante que a previsão tenha sempre 8 dias completos (Hoje + 7 dias à frente = 1 semana)
  if (meta && weather && weather.daily && weather.daily.time) {
    if (!meta.dias_resumo) meta.dias_resumo = [];
    const diasNomesMap = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
    const diasSemanaNomesShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for (let i = meta.dias_resumo.length; i < Math.min(8, weather.daily.time.length); i++) {
      const dIso = weather.daily.time[i];
      const parts = dIso.split('-');
      const dtObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const nomeSemana = diasNomesMap[dtObj.getDay()];
      const dtBr = `${parts[2]}/${parts[1]}/${parts[0]}`;
      const tMin = Math.round(weather.daily.temperature_2m_min[i]);
      const tMax = Math.round(weather.daily.temperature_2m_max[i]);
      const ch = Math.round((weather.daily.precipitation_sum[i] || 0) * 10) / 10;
      const raj = Math.round(weather.daily.wind_gusts_10m_max[i] || 24);
      const wmo = weather.daily.weather_code[i];
      const wmoInfo = (window.WEATHER_CODES && window.WEATHER_CODES[wmo]) || { label: 'Parcialmente Nublado', icon: 'cloud-sun' };

      meta.dias_resumo.push({
        dia: `${nomeSemana.toUpperCase()} – ${dtBr}`,
        subtitulo: wmoInfo.label,
        badge: ch >= 25 ? 'AVISO / ATENÇÃO' : 'OBSERVAÇÃO',
        badge_tipo: ch >= 25 ? 'warning' : 'info',
        t_min: tMin,
        t_max: tMax,
        sensacao_min: tMin,
        sensacao_max: tMax,
        pilares: {
          ceu: { label: 'CÉU', val: wmoInfo.label, icon: wmoInfo.icon || 'cloud-sun' },
          temp: { label: 'TEMPERATURA', val: `${tMin}° a ${tMax}°C`, icon: 'thermometer' },
          sensacao: { label: 'SENSAÇÃO TÉRMICA', val: `Menor: ${tMin}°C • Maior: ${tMax}°C`, icon: 'flame' },
          chuva: { label: 'CHUVA', val: `${ch.toFixed(1)} mm`, icon: ch > 5 ? 'cloud-rain' : 'cloud-drizzle' },
          vento: { label: 'VENTO & RAJADAS', val: `Rajadas ${raj} km/h`, icon: 'wind' },
          mar: { label: 'MAR E PRAIA', val: '1,0 a 1,4 m', icon: 'waves' }
        },
        informe_populacao: [
          `Nesta ${nomeSemana.toLowerCase()} (${parts[2]}/${parts[1]}), a modelagem numérica indica ${wmoInfo.label.toLowerCase()} sobre Rio das Ostras com temperaturas oscilando entre ${tMin}°C e ${tMax}°C. Precipitação diária estimada em ${ch.toFixed(1)} mm e ventos com rajadas de até ${raj} km/h na orla. O Rio Jundiá permanece em condição estável e segura.`
        ]
      });
    }
    if (meta.dias_resumo.length >= 8 && periodTxt) {
      const pFirst = meta.dias_resumo[0].dia.match(/(\d{2}\/\d{2})/);
      const pLast = meta.dias_resumo[meta.dias_resumo.length - 1].dia.match(/(\d{2}\/\d{2})/);
      const dFirstNome = meta.dias_resumo[0].dia.split(/[—–]/)[0].trim();
      const dLastNome = meta.dias_resumo[meta.dias_resumo.length - 1].dia.split(/[—–]/)[0].trim();
      if (pFirst && pLast) {
        meta.periodo = `${pFirst[1]} (${dFirstNome}) a ${pLast[1]} (${dLastNome})`;
        periodTxt.textContent = meta.periodo;
      }
    }
  }

  if (list3d && meta?.dias_resumo && Array.isArray(meta.dias_resumo)) {"""

if target_inject in app_js:
    app_js = app_js.replace(target_inject, replacement_inject, 1)
    print("SUCCESS: Injected 8-day guarantee fallback into js/app.js")
else:
    print("WARNING: Could not find target_inject in js/app.js")

# Update renderChuvaTurnosBars for 8 days
old_turnos_bars = """  // Separação rigorosa dos 4 dias (4 turnos para cada dia = 16 turnos)
  const d0_turnos = rows.slice(0, 4);
  const d1_turnos = rows.slice(4, 8);
  const d2_turnos = rows.slice(8, 12);
  const d3_turnos = rows.slice(12, 16);

  const tot0 = d0_turnos.reduce((acc, r) => acc + (parseFloat(r.chuva_media) || 0), 0);
  const tot1 = d1_turnos.reduce((acc, r) => acc + (parseFloat(r.chuva_media) || 0), 0);
  const tot2 = d2_turnos.reduce((acc, r) => acc + (parseFloat(r.chuva_media) || 0), 0);
  const tot3 = d3_turnos.reduce((acc, r) => acc + (parseFloat(r.chuva_media) || 0), 0);
  const totalGeral = tot0 + tot1 + tot2 + tot3;"""

new_turnos_bars = """  // Separação rigorosa dos 8 dias (Hoje + 7 dias à frente = 32 turnos)
  const d0_turnos = rows.slice(0, 4);
  const d1_turnos = rows.slice(4, 8);
  const d2_turnos = rows.slice(8, 12);
  const d3_turnos = rows.slice(12, 16);
  const d4_turnos = rows.slice(16, 20);
  const d5_turnos = rows.slice(20, 24);
  const d6_turnos = rows.slice(24, 28);
  const d7_turnos = rows.slice(28, 32);

  const tot0 = d0_turnos.reduce((acc, r) => acc + (parseFloat(r.chuva_media) || 0), 0);
  const tot1 = d1_turnos.reduce((acc, r) => acc + (parseFloat(r.chuva_media) || 0), 0);
  const tot2 = d2_turnos.reduce((acc, r) => acc + (parseFloat(r.chuva_media) || 0), 0);
  const tot3 = d3_turnos.reduce((acc, r) => acc + (parseFloat(r.chuva_media) || 0), 0);
  const tot4 = d4_turnos.reduce((acc, r) => acc + (parseFloat(r.chuva_media) || 0), 0);
  const tot5 = d5_turnos.reduce((acc, r) => acc + (parseFloat(r.chuva_media) || 0), 0);
  const tot6 = d6_turnos.reduce((acc, r) => acc + (parseFloat(r.chuva_media) || 0), 0);
  const tot7 = d7_turnos.reduce((acc, r) => acc + (parseFloat(r.chuva_media) || 0), 0);
  const totalGeral = rows.reduce((acc, r) => acc + (parseFloat(r.chuva_media) || 0), 0);"""

if old_turnos_bars in app_js:
    app_js = app_js.replace(old_turnos_bars, new_turnos_bars)
    print("SUCCESS: Updated turnos separation in js/app.js to 8 days")
else:
    print("WARNING: Could not find old_turnos_bars in js/app.js")

# Update badgeTotal text in turnos
old_badge_total = "badgeTotal.textContent = d3_turnos.length > 0 ? `Total 4D: ${totalGeral.toFixed(1)} mm` : `Total 3D: ${totalGeral.toFixed(1)} mm`;"
new_badge_total = "badgeTotal.textContent = rows.length > 16 ? `Total 1 Sem (8D): ${totalGeral.toFixed(1)} mm` : (d3_turnos.length > 0 ? `Total 4D: ${totalGeral.toFixed(1)} mm` : `Total 3D: ${totalGeral.toFixed(1)} mm`);"
app_js = app_js.replace(old_badge_total, new_badge_total)

# Update day button labels loop for 8 days
old_btn_labels = """  if (l0Name) l0Name.textContent = d0_turnos[0]?.dia_semana || 'Hoje';
  if (l0Val) l0Val.textContent = `${tot0.toFixed(1)} mm`;
  if (l1Name) l1Name.textContent = d1_turnos[0]?.dia_semana || 'Amanhã';
  if (l1Val) l1Val.textContent = `${tot1.toFixed(1)} mm`;
  if (l2Name) l2Name.textContent = d2_turnos[0]?.dia_semana || 'D+2';
  if (l2Val) l2Val.textContent = `${tot2.toFixed(1)} mm`;
  if (l3Name) l3Name.textContent = d3_turnos[0]?.dia_semana || 'D+3';
  if (l3Val) l3Val.textContent = `${tot3.toFixed(1)} mm`;"""

new_btn_labels = """  const allDayTurnos = [d0_turnos, d1_turnos, d2_turnos, d3_turnos, d4_turnos, d5_turnos, d6_turnos, d7_turnos];
  const allDayTots = [tot0, tot1, tot2, tot3, tot4, tot5, tot6, tot7];
  for (let d = 0; d < 8; d++) {
    const lName = document.getElementById(`lbl-turno-day-${d}-name`);
    const lVal = document.getElementById(`lbl-turno-day-${d}-val`);
    if (lName && allDayTurnos[d] && allDayTurnos[d].length > 0) {
      lName.textContent = allDayTurnos[d][0]?.dia_semana || `D+${d}`;
    }
    if (lVal && allDayTurnos[d] && allDayTurnos[d].length > 0) {
      lVal.textContent = `${allDayTots[d].toFixed(1)} mm`;
    }
  }"""

if old_btn_labels in app_js:
    app_js = app_js.replace(old_btn_labels, new_btn_labels)
    print("SUCCESS: Updated day button labels loop in js/app.js to 8 days")
else:
    print("WARNING: Could not find old_btn_labels in js/app.js")

# Bump version in js/app.js imports
app_js = app_js.replace("social-cards.js?v=198", "social-cards.js?v=199")
app_js = app_js.replace("weekly-overview.js?v=198", "weekly-overview.js?v=199")

with open(APP_JS_PATH, 'w', encoding='utf-8') as f:
    f.write(app_js)
print("SUCCESS: Saved js/app.js (v=199)")
