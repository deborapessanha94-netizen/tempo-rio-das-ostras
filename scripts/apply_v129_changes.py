# -*- coding: utf-8 -*-
"""
Script to apply v129 changes:
1. index.html:
   - Add #btn-hero-mapa-rj next to #hero-weather-icon in Hero Card.
   - Add #modal-mapa-rj right after #modal-meteogramas.
   - Bump styles.css?v=100 -> ?v=101
   - Bump app.js?v=128 -> ?v=129
2. css/styles.css:
   - Add modal styling and constraints for #modal-mapa-rj.
3. js/app.js:
   - Add open/close listeners for #modal-mapa-rj.
   - Register in Escape listener and outside-click array.
"""
import sys

def update_index_html():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Update Hero Card icon section
    old_hero_icon = '''            <div class="flex items-center justify-center sm:justify-end shrink-0">



              <div id="hero-weather-icon" class="icon-medallion w-14 h-14 sm:w-16 sm:h-16 bg-white dark:bg-[#192439] text-black dark:text-white border-2 border-[#f07a53] shadow-sm">
                <i data-lucide="cloud-lightning" class="w-8 h-8 sm:w-9 sm:h-9 text-amber-500 dark:text-amber-400"></i>
              </div>



            </div>'''

    new_hero_icon = '''            <div class="flex items-center gap-2.5 sm:gap-3.5 justify-center sm:justify-end shrink-0 flex-wrap">

              <!-- Mini-Mapa Interativo do RJ com Localização de Rio das Ostras -->
              <button id="btn-hero-mapa-rj" type="button" class="group relative flex items-center p-1 sm:p-1.5 rounded-2xl bg-white/95 dark:bg-[#131d35]/95 border border-[#cbd5e1] dark:border-slate-800 hover:border-[#f07a53] dark:hover:border-[#f07a53] shadow-xs hover:shadow-md transition cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#f07a53]/40" title="Ver localização geográfica de Rio das Ostras no Mapa do Estado do RJ">
                <div class="relative w-28 sm:w-36 aspect-[571/413] overflow-hidden rounded-xl bg-slate-50/80 dark:bg-[#0b1322] border border-slate-200/90 dark:border-slate-800/90 flex items-center justify-center p-0.5">
                  <!-- Contorno do RJ (Light & Dark) -->
                  <img src="img/mapa_rj_light.png" alt="Mapa do Estado do Rio de Janeiro" class="w-full h-full object-contain dark:hidden transition-transform duration-300 group-hover:scale-105 pointer-events-none">
                  <img src="img/mapa_rj_dark.png" alt="Mapa do Estado do Rio de Janeiro" class="w-full h-full object-contain hidden dark:block transition-transform duration-300 group-hover:scale-105 pointer-events-none">
                  
                  <!-- Ponto Pulsante Indicando Rio das Ostras (78.8% X, 60.0% Y) -->
                  <div class="absolute" style="left: 78.8%; top: 60.0%; transform: translate(-50%, -50%); pointer-events: none;">
                    <span class="relative flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-80"></span>
                      <span class="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-orange-600 border border-white dark:border-slate-900 shadow-xs"></span>
                    </span>
                  </div>

                  <!-- Tag Rio das Ostras -->
                  <span class="absolute bottom-1 right-1 px-1 sm:px-1.5 py-0.5 rounded text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-tight bg-orange-500/95 dark:bg-orange-600/95 text-white shadow-xs pointer-events-none flex items-center gap-0.5">
                    <i data-lucide="map-pin" class="w-2 h-2 sm:w-2.5 sm:h-2.5"></i>
                    <span>Rio das Ostras</span>
                  </span>

                  <!-- Badge Superior RJ & Ícone Zoom -->
                  <span class="absolute top-1 left-1 px-1 py-0.5 rounded text-[7px] sm:text-[7.5px] font-bold text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 pointer-events-none flex items-center gap-0.5 group-hover:text-orange-600 transition">
                    <i data-lucide="maximize-2" class="w-2 h-2 text-orange-600 dark:text-orange-400"></i>
                    <span>RJ</span>
                  </span>
                </div>
              </button>

              <!-- Medalhão do Ícone Meteorológico da Previsão -->
              <div id="hero-weather-icon" class="icon-medallion w-14 h-14 sm:w-16 sm:h-16 bg-white dark:bg-[#192439] text-black dark:text-white border-2 border-[#f07a53] shadow-sm">
                <i data-lucide="cloud-lightning" class="w-8 h-8 sm:w-9 sm:h-9 text-amber-500 dark:text-amber-400"></i>
              </div>

            </div>'''

    if old_hero_icon not in html:
        print("ERROR: old_hero_icon not found in index.html!")
        return False
    html = html.replace(old_hero_icon, new_hero_icon)

    # 2. Add Modal for Mapa RJ right before Instagram modal
    anchor = '<!-- MODAL: EXPORTAR IMAGEM PARA INSTAGRAM'
    if anchor not in html:
        print("ERROR: Instagram modal anchor not found in index.html!")
        return False

    modal_mapa_rj_html = '''  <!-- ========================================================================= -->
  <!-- MODAL: MAPA DO ESTADO DO RIO DE JANEIRO COM RIO DAS OSTRAS                -->
  <!-- ========================================================================= -->
  <div id="modal-mapa-rj" class="fixed inset-0 z-50 hidden items-center justify-center p-3 sm:p-5 modal-backdrop">
    <div class="modern-card max-w-3xl w-full min-w-0 max-h-[92vh] flex flex-col shadow-2xl overflow-hidden bg-white dark:bg-[#0f172a] border border-[#cbd5e1] dark:border-slate-800 text-black dark:text-white" style="border-top: 4px solid #f07a53 !important;">
      
      <!-- Cabeçalho do Modal -->
      <div class="px-4 sm:px-6 py-3.5 bg-[#f8fafc] dark:bg-[#131d35] flex items-center justify-between border-b border-[#cbd5e1] dark:border-slate-800 shrink-0">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-2xs shrink-0">
            <i data-lucide="map-pin" class="w-4 h-4"></i>
          </div>
          <div class="min-w-0">
            <h3 class="text-sm sm:text-base font-bold text-black dark:text-white leading-tight truncate">Localização Geográfica • Rio das Ostras</h3>
            <span class="text-[11px] sm:text-xs text-[#64748b] dark:text-slate-400 font-normal block truncate">Estado do Rio de Janeiro • Região das Baixadas Litorâneas</span>
          </div>
        </div>
        <button id="btn-close-modal-mapa-rj" type="button" class="p-1.5 rounded-lg text-[#64748b] hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition shrink-0" title="Fechar">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Conteúdo do Modal -->
      <div class="p-4 sm:p-6 overflow-y-auto space-y-4">
        <!-- Visualizador de Imagem do Mapa HD -->
        <div class="relative w-full rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 p-2 sm:p-4 flex items-center justify-center shadow-xs overflow-hidden">
          <img src="img/mapa_rj_marcado_hd.png" alt="Mapa do Estado do Rio de Janeiro com marcação de Rio das Ostras" class="w-full max-h-[58vh] object-contain rounded-xl dark:hidden shadow-xs">
          <img src="img/mapa_rj_marcado_hd_dark.png" alt="Mapa do Estado do Rio de Janeiro com marcação de Rio das Ostras" class="w-full max-h-[58vh] object-contain rounded-xl hidden dark:block shadow-xs">
        </div>

        <!-- Ficha Técnica Geográfica -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
            <span class="block text-[10px] font-bold text-[#64748b] dark:text-slate-400 uppercase tracking-wider">Latitude / Longitude</span>
            <span class="block text-xs font-black text-black dark:text-white mt-0.5">22° 31' S • 41° 56' O</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
            <span class="block text-[10px] font-bold text-[#64748b] dark:text-slate-400 uppercase tracking-wider">Região Geográfica</span>
            <span class="block text-xs font-black text-black dark:text-white mt-0.5">Baixadas Litorâneas</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
            <span class="block text-[10px] font-bold text-[#64748b] dark:text-slate-400 uppercase tracking-wider">Municípios Limítrofes</span>
            <span class="block text-xs font-black text-black dark:text-white mt-0.5">Macaé & Casimiro</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
            <span class="block text-[10px] font-bold text-[#64748b] dark:text-slate-400 uppercase tracking-wider">Faixa Costeira</span>
            <span class="block text-xs font-black text-black dark:text-white mt-0.5">Oceano Atlântico</span>
          </div>
        </div>
      </div>

      <!-- Rodapé do Modal -->
      <div class="px-4 sm:px-6 py-3 bg-[#f8fafc] dark:bg-[#131d35] border-t border-[#cbd5e1] dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <a href="img/mapa_rj_marcado_hd.png" download="mapa_rio_de_janeiro_rio_das_ostras.png" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-black dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-orange-500 transition shadow-2xs">
          <i data-lucide="download" class="w-3.5 h-3.5 text-orange-600 dark:text-orange-400"></i>
          <span>Baixar Imagem HD</span>
        </a>
        <button id="btn-close-modal-mapa-rj-foot" type="button" class="px-4 py-1.5 rounded-full font-semibold btn-action-outline cursor-pointer text-xs">
          Fechar
        </button>
      </div>

    </div>
  </div>

  '''

    # Split before the banner separator preceding Instagram modal
    idx = html.find(anchor)
    # Find the comment banner right before it
    banner_start = html.rfind('<!-- ===', 0, idx)
    if banner_start != -1:
        html = html[:banner_start] + modal_mapa_rj_html + html[banner_start:]
    else:
        html = html[:idx] + modal_mapa_rj_html + html[idx:]

    # 3. Bump cache-busters
    html = html.replace('href="css/styles.css?v=100"', 'href="css/styles.css?v=101"')
    html = html.replace('src="js/app.js?v=128"', 'src="js/app.js?v=129"')

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("index.html updated successfully!")
    return True

def update_css():
    with open('css/styles.css', 'r', encoding='utf-8') as f:
        css = f.read()

    new_css_rules = '''
/* ========================================================================= */
/* MODAL: MAPA DO ESTADO DO RIO DE JANEIRO (RIO DAS OSTRAS)                  */
/* ========================================================================= */
#modal-mapa-rj .modern-card {
  max-width: min(52rem, calc(100vw - 1.5rem)) !important;
  width: 100% !important;
  margin: auto !important;
}

html.dark #modal-mapa-rj .modern-card {
  background-color: #0d1527 !important;
  border-color: #1e293b !important;
  color: #f1f5f9 !important;
}

html.dark #modal-mapa-rj .bg-[#f8fafc] {
  background-color: #111a30 !important;
  border-color: #1e293b !important;
}

html.dark #modal-mapa-rj .bg-white {
  background-color: #0d1527 !important;
}

html.dark #modal-mapa-rj .border-b,
html.dark #modal-mapa-rj .border-t,
html.dark #modal-mapa-rj .border-[#cbd5e1] {
  border-color: #1e293b !important;
}

html.dark #modal-mapa-rj h3 {
  color: #f8fafc !important;
}
'''
    if '#modal-mapa-rj' not in css:
        css += new_css_rules
        with open('css/styles.css', 'w', encoding='utf-8') as f:
            f.write(css)
        print("css/styles.css updated successfully!")
    else:
        print("css/styles.css already contains #modal-mapa-rj rules.")
    return True

def update_js():
    with open('js/app.js', 'r', encoding='utf-8') as f:
        js = f.read()

    # 1. Add modal 5 definition right before window.openMeteoModal
    target_meteo_export = "  window.openMeteoModal = openMeteo;"
    modal_5_code = '''  // Modal 5: Mapa do Estado do Rio de Janeiro (Localização de Rio das Ostras)
  const modalMapaRj = document.getElementById('modal-mapa-rj');
  const btnOpenMapaRj = document.getElementById('btn-hero-mapa-rj');
  const btnCloseMapaRj = document.getElementById('btn-close-modal-mapa-rj');
  const btnCloseMapaRjFoot = document.getElementById('btn-close-modal-mapa-rj-foot');

  const openMapaRj = () => {
    if (modalMapaRj) {
      modalMapaRj.classList.remove('hidden');
      modalMapaRj.classList.add('flex');
      if (window.lucide) lucide.createIcons();
    }
  };

  const closeMapaRj = () => {
    if (modalMapaRj) {
      modalMapaRj.classList.add('hidden');
      modalMapaRj.classList.remove('flex');
    }
  };

  window.openMapaRjModal = openMapaRj;
  window.closeMapaRjModal = closeMapaRj;

  if (btnOpenMapaRj) btnOpenMapaRj.addEventListener('click', openMapaRj);
  if (btnCloseMapaRj) btnCloseMapaRj.addEventListener('click', closeMapaRj);
  if (btnCloseMapaRjFoot) btnCloseMapaRjFoot.addEventListener('click', closeMapaRj);

'''
    if "const modalMapaRj" not in js:
        if target_meteo_export in js:
            js = js.replace(target_meteo_export, modal_5_code + target_meteo_export)
            print("Modal 5 handlers added to js/app.js!")
        else:
            print("ERROR: target_meteo_export not found in js/app.js")
            return False

    # 2. Add modal query param / hash support for ?modal=mapa or #mapa-rj
    query_target = "if (mParam === 'meteo' || mParam === 'meteograma' || mParam === 'meteogramas' || window.location.hash === '#meteogramas') {"
    query_replacement = """if (mParam === 'mapa' || mParam === 'mapa-rj' || window.location.hash === '#mapa-rj') {
      setTimeout(() => { openMapaRj(); }, 350);
    }
    if (mParam === 'meteo' || mParam === 'meteograma' || mParam === 'meteogramas' || window.location.hash === '#meteogramas') {"""
    if "openMapaRj();" not in js and query_target in js:
        js = js.replace(query_target, query_replacement)

    # 3. Add to Escape listener
    esc_target = "      closeMeteo();"
    esc_replacement = """      closeMeteo();
      closeMapaRj();"""
    if "closeMapaRj();" not in js:
        js = js.replace(esc_target, esc_replacement)

    # 4. Add to outside-click listener
    click_target = "  [modalBoletim, modalMeteo].forEach(m => {"
    click_replacement = "  [modalBoletim, modalMeteo, modalMapaRj].forEach(m => {"
    if click_target in js:
        js = js.replace(click_target, click_replacement)

    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("js/app.js updated successfully!")
    return True

if __name__ == '__main__':
    ok1 = update_index_html()
    ok2 = update_css()
    ok3 = update_js()
    if ok1 and ok2 and ok3:
        print("ALL UPDATES COMPLETED SUCCESSFULLY!")
    else:
        print("FAILED!")
        sys.exit(1)
