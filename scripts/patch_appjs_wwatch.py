# -*- coding: utf-8 -*-
"""
Patch js/app.js to integrate WaveWatch III (WW3):
1. Expand switchOrlaTab to support 'wwatch' tab
2. Expand switchMeteoTab to support 'tab-btn-wwatch-meteo' and 'tab-content-wwatch-meteo'
3. Add window.openWwatchZoom
4. Call initCptecWwatch() in initApp
5. Append initCptecWwatch() function
"""
from pathlib import Path

app_path = Path("js/app.js")
content = app_path.read_text(encoding="utf-8")

# 1. Update switchOrlaTab
target_orla_tabs = "const tabs = ['mar', 'mares', 'balnear'];"
replacement_orla_tabs = "const tabs = ['mar', 'wwatch', 'mares', 'balnear'];"

if target_orla_tabs in content:
    content = content.replace(target_orla_tabs, replacement_orla_tabs)
    print("Updated switchOrlaTab tabs array.")

target_orla_style = """        } else if (t === 'mares') {
          btn.className = 'orla-tab-btn active flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-black transition cursor-pointer bg-[#eaf0f6] border-2 border-[#6d8ba6] text-black shadow-xs';"""

replacement_orla_style = """        } else if (t === 'wwatch') {
          btn.className = 'orla-tab-btn active flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-black transition cursor-pointer bg-[#e0f2fe] border-2 border-[#0284c7] text-black shadow-xs';
        } else if (t === 'mares') {
          btn.className = 'orla-tab-btn active flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-black transition cursor-pointer bg-[#eaf0f6] border-2 border-[#6d8ba6] text-black shadow-xs';"""

if "t === 'wwatch'" not in content:
    content = content.replace(target_orla_style, replacement_orla_style)
    print("Added wwatch button active styling to switchOrlaTab.")

# 2. Update modal tab switcher in setupModalsAndDock
target_modal_vars = """  const tabInmet = document.getElementById('tab-btn-inmet-meteo');
  const tabCptec = document.getElementById('tab-btn-cptec-meteo');
  const tabProb = document.getElementById('tab-btn-prob-meteo');
  const contentInmet = document.getElementById('tab-content-inmet-meteo');
  const contentCptec = document.getElementById('tab-content-cptec-meteo');
  const contentProb = document.getElementById('tab-content-prob-meteo');"""

replacement_modal_vars = """  const tabInmet = document.getElementById('tab-btn-inmet-meteo');
  const tabCptec = document.getElementById('tab-btn-cptec-meteo');
  const tabProb = document.getElementById('tab-btn-prob-meteo');
  const tabWwatch = document.getElementById('tab-btn-wwatch-meteo');
  const contentInmet = document.getElementById('tab-content-inmet-meteo');
  const contentCptec = document.getElementById('tab-content-cptec-meteo');
  const contentProb = document.getElementById('tab-content-prob-meteo');
  const contentWwatch = document.getElementById('tab-content-wwatch-meteo');"""

if "tab-btn-wwatch-meteo" not in content:
    content = content.replace(target_modal_vars, replacement_modal_vars)
    print("Added tabWwatch and contentWwatch variables to modal setup.")

target_switch_meteo = """    const switchMeteoTab = (activeTab, activeContent) => {
      [tabInmet, tabCptec, tabProb].forEach(t => { if (t) t.className = inactiveTabClasses; });
      [contentInmet, contentCptec, contentProb].forEach(c => { if (c) c.classList.add('hidden'); });
      if (activeTab) activeTab.className = activeTabClasses;
      if (activeContent) activeContent.classList.remove('hidden');
      if (window.resetMeteoZoom) window.resetMeteoZoom();
      if (window.lucide) lucide.createIcons();
    };

    tabInmet.addEventListener('click', () => switchMeteoTab(tabInmet, contentInmet));
    tabCptec.addEventListener('click', () => switchMeteoTab(tabCptec, contentCptec));
    if (tabProb && contentProb) {
      tabProb.addEventListener('click', () => switchMeteoTab(tabProb, contentProb));
    }"""

replacement_switch_meteo = """    const switchMeteoTab = (activeTab, activeContent) => {
      [tabInmet, tabCptec, tabProb, tabWwatch].forEach(t => { if (t) t.className = inactiveTabClasses; });
      [contentInmet, contentCptec, contentProb, contentWwatch].forEach(c => { if (c) c.classList.add('hidden'); });
      if (activeTab) activeTab.className = activeTabClasses;
      if (activeContent) activeContent.classList.remove('hidden');
      if (window.resetMeteoZoom) window.resetMeteoZoom();
      if (window.lucide) lucide.createIcons();
    };

    tabInmet.addEventListener('click', () => switchMeteoTab(tabInmet, contentInmet));
    tabCptec.addEventListener('click', () => switchMeteoTab(tabCptec, contentCptec));
    if (tabProb && contentProb) {
      tabProb.addEventListener('click', () => switchMeteoTab(tabProb, contentProb));
    }
    if (tabWwatch && contentWwatch) {
      tabWwatch.addEventListener('click', () => switchMeteoTab(tabWwatch, contentWwatch));
    }"""

if "tabWwatch.addEventListener" not in content:
    content = content.replace(target_switch_meteo, replacement_switch_meteo)
    print("Added tabWwatch listener to switchMeteoTab.")

# 3. Add window.openWwatchZoom and query param handler
target_param_prob = """    if (mParam === 'prob' || mParam === 'probabilistica' || window.location.hash === '#probabilistica') {
      openMeteo();
      setTimeout(() => { if (tabProb) tabProb.click(); }, 200);
    }"""

replacement_param_prob = """    if (mParam === 'prob' || mParam === 'probabilistica' || window.location.hash === '#probabilistica') {
      openMeteo();
      setTimeout(() => { if (tabProb) tabProb.click(); }, 200);
    }
    if (mParam === 'wwatch' || mParam === 'ondas' || window.location.hash === '#wwatch') {
      openMeteo();
      setTimeout(() => { if (tabWwatch) tabWwatch.click(); }, 200);
    }"""

if "mParam === 'wwatch'" not in content:
    content = content.replace(target_param_prob, replacement_param_prob)
    print("Added wwatch hash/param handler.")

zoom_func = """
  window.openWwatchZoom = function() {
    openMeteo();
    setTimeout(() => {
      const tb = document.getElementById('tab-btn-wwatch-meteo');
      if (tb) tb.click();
    }, 150);
  };
"""

if "window.openWwatchZoom" not in content:
    idx_close_meteo = content.find("window.openMeteoModal = openMeteo;")
    if idx_close_meteo != -1:
        content = content[:idx_close_meteo] + zoom_func + content[idx_close_meteo:]
        print("Added window.openWwatchZoom function.")

# 4. Call initCptecWwatch() in initApp
target_init = "initCptecProbabilistica();"
replacement_init = """initCptecProbabilistica();
  initCptecWwatch();"""

if "initCptecWwatch();" not in content:
    content = content.replace(target_init, replacement_init, 1)
    print("Added initCptecWwatch() call in initApp.")

# 5. Append initCptecWwatch() definition at the end
wwatch_func_code = """

// ==========================================================================
// MODELAGEM NUMÉRICA DE ONDAS CPTEC/INPE: WAVEWATCH III (WW3)
// ==========================================================================
export function initCptecWwatch() {
  const mapImg = document.getElementById('img-wwatch-mapa');
  const modalImg = document.getElementById('modal-img-wwatch');
  const titleBadge = document.getElementById('badge-wwatch-title');
  const downloadBtn = document.getElementById('btn-wwatch-download');

  const btnProdAlt = document.getElementById('btn-wwatch-prod-alt');
  const btnProdPico = document.getElementById('btn-wwatch-prod-pico');
  const btnProdWindsea = document.getElementById('btn-wwatch-prod-windsea');

  const btnStep000 = document.getElementById('btn-wwatch-step-000');
  const btnStep024 = document.getElementById('btn-wwatch-step-024');
  const btnStep048 = document.getElementById('btn-wwatch-step-048');
  const btnStep072 = document.getElementById('btn-wwatch-step-072');

  const btnRegSud = document.getElementById('btn-wwatch-reg-sud');
  const btnRegBra = document.getElementById('btn-wwatch-reg-bra');

  const modalBtnAlt = document.getElementById('modal-wwatch-btn-alt');
  const modalBtnPico = document.getElementById('modal-wwatch-btn-pico');
  const modalBtnWindsea = document.getElementById('modal-wwatch-btn-windsea');

  const modalBtn000 = document.getElementById('modal-wwatch-btn-000');
  const modalBtn024 = document.getElementById('modal-wwatch-btn-024');
  const modalBtn048 = document.getElementById('modal-wwatch-btn-048');
  const modalBtn072 = document.getElementById('modal-wwatch-btn-072');

  let currentProd = 'alt_onda'; // 'alt_onda' | 'per_pico' | 'windsea'
  let currentStep = '000';     // '000' | '024' | '048' | '072'
  let currentReg = 'sud';       // 'sud' | 'bra'

  const prodTitles = {
    'alt_onda': 'Altura Significativa e Direção das Ondas',
    'per_pico': 'Período e Direção de Pico das Ondas',
    'windsea': 'Direção e Intensidade de Mar de Vento'
  };

  const stepLabels = {
    '000': 'Análise Atual (00h)',
    '024': 'Previsão +24h (Amanhã)',
    '048': 'Previsão +48h (D+2)',
    '072': 'Previsão +72h (D+3)'
  };

  const regLabels = {
    'sud': 'Costa Sudeste (RJ / Rio das Ostras)',
    'bra': 'Costa do Brasil / Atlântico'
  };

  const updateView = () => {
    const effectiveProd = (currentReg === 'bra' && currentProd !== 'alt_onda') ? 'alt_onda' : currentProd;
    const localSrc = `img/cptec/wwatch_${effectiveProd}_${currentReg}_${currentStep}h.png`;
    const remoteSrc = `https://s1.cptec.inpe.br/grafico/Modelos/Wwatch/pn/${effectiveProd}/2026/10/26/00/Wwatch_${effectiveProd}_${currentReg}_2026102600z_${currentStep}z.png`;

    const fullSrc = `${localSrc}?v=${Date.now()}`;
    if (mapImg) {
      mapImg.src = fullSrc;
      mapImg.onerror = () => { mapImg.src = remoteSrc; };
    }
    if (modalImg) {
      modalImg.src = fullSrc;
      modalImg.onerror = () => { modalImg.src = remoteSrc; };
    }
    if (titleBadge) {
      titleBadge.textContent = `${prodTitles[effectiveProd]} • ${stepLabels[currentStep]} - ${regLabels[currentReg]}`;
    }
    if (downloadBtn) {
      downloadBtn.href = localSrc;
      downloadBtn.download = `cptec_wwatch_${effectiveProd}_${currentReg}_${currentStep}h.png`;
    }

    // Toggle styling for Main Product buttons
    const activeProdClass = 'btn-wwatch-prod px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer bg-[#0284c7] text-white shadow-xs';
    const inactiveProdClass = 'btn-wwatch-prod px-3 py-1 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer';

    if (btnProdAlt) btnProdAlt.className = currentProd === 'alt_onda' ? activeProdClass : inactiveProdClass;
    if (btnProdPico) btnProdPico.className = currentProd === 'per_pico' ? activeProdClass : inactiveProdClass;
    if (btnProdWindsea) btnProdWindsea.className = currentProd === 'windsea' ? activeProdClass : inactiveProdClass;

    // Toggle styling for Modal Product buttons
    const modalActiveProd = 'px-3 py-1 rounded-lg text-xs font-bold bg-[#0284c7] text-white transition cursor-pointer';
    const modalInactiveProd = 'px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer';

    if (modalBtnAlt) modalBtnAlt.className = currentProd === 'alt_onda' ? modalActiveProd : modalInactiveProd;
    if (modalBtnPico) modalBtnPico.className = currentProd === 'per_pico' ? modalActiveProd : modalInactiveProd;
    if (modalBtnWindsea) modalBtnWindsea.className = currentProd === 'windsea' ? modalActiveProd : modalInactiveProd;

    // Toggle styling for Main Step buttons
    const activeStepClass = 'btn-wwatch-step px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer bg-slate-900 text-white';
    const inactiveStepClass = 'btn-wwatch-step px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer';

    if (btnStep000) btnStep000.className = currentStep === '000' ? activeStepClass : inactiveStepClass;
    if (btnStep024) btnStep024.className = currentStep === '024' ? activeStepClass : inactiveStepClass;
    if (btnStep048) btnStep048.className = currentStep === '048' ? activeStepClass : inactiveStepClass;
    if (btnStep072) btnStep072.className = currentStep === '072' ? activeStepClass : inactiveStepClass;

    // Toggle styling for Modal Step buttons
    const modalActiveStep = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 transition cursor-pointer';
    const modalInactiveStep = 'px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer';

    if (modalBtn000) modalBtn000.className = currentStep === '000' ? modalActiveStep : modalInactiveStep;
    if (modalBtn024) modalBtn024.className = currentStep === '024' ? modalActiveStep : modalInactiveStep;
    if (modalBtn048) modalBtn048.className = currentStep === '048' ? modalActiveStep : modalInactiveStep;
    if (modalBtn072) modalBtn072.className = currentStep === '072' ? modalActiveStep : modalInactiveStep;

    // Toggle styling for Region buttons
    const activeRegClass = 'btn-wwatch-reg px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer bg-sky-700 text-white';
    const inactiveRegClass = 'btn-wwatch-reg px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer';

    if (btnRegSud) btnRegSud.className = currentReg === 'sud' ? activeRegClass : inactiveRegClass;
    if (btnRegBra) btnRegBra.className = currentReg === 'bra' ? activeRegClass : inactiveRegClass;
  };

  // Bind Main buttons
  if (btnProdAlt) btnProdAlt.addEventListener('click', () => { currentProd = 'alt_onda'; updateView(); });
  if (btnProdPico) btnProdPico.addEventListener('click', () => { currentProd = 'per_pico'; updateView(); });
  if (btnProdWindsea) btnProdWindsea.addEventListener('click', () => { currentProd = 'windsea'; updateView(); });

  if (btnStep000) btnStep000.addEventListener('click', () => { currentStep = '000'; updateView(); });
  if (btnStep024) btnStep024.addEventListener('click', () => { currentStep = '024'; updateView(); });
  if (btnStep048) btnStep048.addEventListener('click', () => { currentStep = '048'; updateView(); });
  if (btnStep072) btnStep072.addEventListener('click', () => { currentStep = '072'; updateView(); });

  if (btnRegSud) btnRegSud.addEventListener('click', () => { currentReg = 'sud'; updateView(); });
  if (btnRegBra) btnRegBra.addEventListener('click', () => { currentReg = 'bra'; updateView(); });

  // Bind Modal buttons
  if (modalBtnAlt) modalBtnAlt.addEventListener('click', () => { currentProd = 'alt_onda'; updateView(); });
  if (modalBtnPico) modalBtnPico.addEventListener('click', () => { currentProd = 'per_pico'; updateView(); });
  if (modalBtnWindsea) modalBtnWindsea.addEventListener('click', () => { currentProd = 'windsea'; updateView(); });

  if (modalBtn000) modalBtn000.addEventListener('click', () => { currentStep = '000'; updateView(); });
  if (modalBtn024) modalBtn024.addEventListener('click', () => { currentStep = '024'; updateView(); });
  if (modalBtn048) modalBtn048.addEventListener('click', () => { currentStep = '048'; updateView(); });
  if (modalBtn072) modalBtn072.addEventListener('click', () => { currentStep = '072'; updateView(); });

  updateView();
}
"""

if "export function initCptecWwatch" not in content:
    content += wwatch_func_code
    print("Appended initCptecWwatch function.")

app_path.write_text(content, encoding="utf-8")
print("Saved patched js/app.js.")
