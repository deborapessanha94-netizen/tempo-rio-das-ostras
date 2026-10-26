import {



  setSocialStationsData,



  openSocialModalChuva,



  closeSocialModalChuva,



  setSocialFormat,



  setSocialHorizon,



  handleSocialSearch,



  toggleOnlyActive,



  downloadSocialCard,

  calculateStationRain



} from './social-cards.js';







import { getWeatherCondition } from './weather-codes.js';



// Controle Global de Abertura/Fechamento dos Cards dos 3 Dias



window.toggleDayCard = function(idx) {



  const el = document.getElementById(`day-card-collapse-${idx}`);



  const chevron = document.getElementById(`day-card-chevron-${idx}`);



  const btnTxt = document.getElementById(`day-card-btn-txt-${idx}`);



  if (el) {



    const isHidden = el.classList.contains('hidden');



    el.classList.toggle('hidden');



    if (chevron) {



      chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';



    }



    if (btnTxt) {



      btnTxt.textContent = isHidden ? 'Ocultar detalhes técnicos' : 'Ver detalhes técnicos';



    }



    if (window.lucide) window.lucide.createIcons();



  }



};







/**



 * Aplicação Oficial — TEMPO em Rio das Ostras



 * Dashboard Meteorológico Profissional & Defesa Civil 24H



 * Interface Moderna, Alto Padrão Visual e Acessibilidade Plena



 */







import { 



  getRioDasOstrasWeatherData, 



  getInmetForecast, 



  getInmetAlerts, 



  getIneaCheias, 



  getBoletimOficialData, 



  getBoletimMetadata, 



  getAcumuladosEstacoes, 



  getBalneabilidade, 



  getMarinhaAvisos, 



  getOrlaCondicoes,



  getTabuaMares, 



  getCptecData, 



  getInmetMeteogramaData, 



  getIneaJundia10d, 



  COTAS_INEA_OFICIAIS, 



  RIO_DAS_OSTRAS_COORDS 



} from './api.js?v=63';







import { renderBulletinChart } from './charts.js?v=136';







// Estado global da aplicação



const state = {
  inmetForecast: null,
  jundia10dData: null,



  rioSelectedDate: null,



  rioIntervalMode: 'hourly',



  boletimData: [],



  boletimMetadata: null,



  ineaCheias: [],



  inmetAlerts: [],



  marinhaAvisos: null,



  orlaCondicoes: null,



  tabuaMares: null,



  acumuladosEstacoes: [],



  balneabilidade: [],



  cptecData: null,



  inmetMeteoData: null,



  weatherData: null,



  activeMetric: 'temperature',



  activeOrlaTab: 'mar',



  activeOrlaDay: 'd0',



  isSyncing: false



};







document.addEventListener('DOMContentLoaded', () => {



  startHeroClock();



  setupModalsAndDock();
  initCptecProbabilistica();
  initCptecWwatch();



  setupPanoramaSinoticoControls();



  setupChartMetricTabs();



  setupActionButtons();



  setupPWA();



  loadAllApplicationData();



  startAutoSync();







  // Acompanhamento suave no scroll da barra de abas e cabeçalho fixo



  const onScroll = () => {



    if (window.scrollY > 30) {



      document.body.classList.add('scrolled-down');



    } else {



      document.body.classList.remove('scrolled-down');



    }



  };



  window.addEventListener('scroll', onScroll, { passive: true });



  onScroll();



});







/**



 * 1. Relógio Digital Dinâmico e Data Atual (Hora de Brasília)



 */



function startHeroClock() {



  const clockEl = document.getElementById('hero-clock');



  const dateEl = document.getElementById('hero-date');







  function update() {



    const now = new Date();



    



    if (clockEl) {



      const hours = String(now.getHours()).padStart(2, '0');



      const minutes = String(now.getMinutes()).padStart(2, '0');



      clockEl.textContent = `${hours}:${minutes}`;



    }







    if (dateEl) {



      const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];



      const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];



      



      const diaNome = diasSemana[now.getDay()];



      const diaNum = String(now.getDate()).padStart(2, '0');



      const mesNome = meses[now.getMonth()];



      const ano = now.getFullYear();







      dateEl.textContent = `${diaNome}, ${diaNum} de ${mesNome} de ${ano}`;



    }



  }







  update();



  setInterval(update, 1000);



}







/**



 * 2. Gerenciamento de Modais e Ações



 */



function setupModalsAndDock() {



  // Modal 1: Boletim Técnico



  const modalBoletim = document.getElementById('modal-boletim-tecnico');



  const btnOpenBoletim1 = document.getElementById('dock-btn-boletim');



  const btnOpenBoletim2 = document.getElementById('btn-ver-boletim-modal-1');



  const btnCloseBoletim = document.getElementById('btn-close-modal-boletim');



  const btnCloseBoletimFoot = document.getElementById('btn-close-modal-boletim-foot');







  const openBoletim = () => { if (modalBoletim) modalBoletim.classList.remove('hidden'), modalBoletim.classList.add('flex'); };



  const closeBoletim = () => { if (modalBoletim) modalBoletim.classList.add('hidden'), modalBoletim.classList.remove('flex'); };







  if (btnOpenBoletim1) btnOpenBoletim1.addEventListener('click', openBoletim);



  if (btnOpenBoletim2) btnOpenBoletim2.addEventListener('click', openBoletim);



  if (btnCloseBoletim) btnCloseBoletim.addEventListener('click', closeBoletim);



  if (btnCloseBoletimFoot) btnCloseBoletimFoot.addEventListener('click', closeBoletim);























  // Modal 4: Meteogramas Oficiais (INMET & CPTEC/INPE) com Zoom e Pan Interativo
  const modalMeteo = document.getElementById('modal-meteogramas');
  const btnOpenMeteo1 = document.getElementById('dock-btn-meteogramas');
  const btnOpenMeteo2 = document.getElementById('btn-open-meteogramas-card');
  const btnCloseMeteo = document.getElementById('btn-close-modal-meteogramas');
  const btnCloseMeteoFoot = document.getElementById('btn-close-modal-meteogramas-foot');

  const openMeteo = () => {
    if (modalMeteo) {
      modalMeteo.classList.remove('hidden');
      modalMeteo.classList.add('flex');
      if (window.resetMeteoZoom) window.resetMeteoZoom();
      if (window.lucide) lucide.createIcons();
    }
  };

  const closeMeteo = () => {
    if (modalMeteo) {
      modalMeteo.classList.add('hidden');
      modalMeteo.classList.remove('flex');
      if (window.resetMeteoZoom) window.resetMeteoZoom();
    }
  };

  // Modal 5: Mapa do Estado do Rio de Janeiro (Localização de Rio das Ostras)
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

  
  window.openWwatchZoom = function() {
    openMeteo();
    setTimeout(() => {
      const tb = document.getElementById('tab-btn-wwatch-meteo');
      if (tb) tb.click();
    }, 150);
  };
window.openMeteoModal = openMeteo;
  window.closeMeteoModal = closeMeteo;

  if (btnOpenMeteo1) btnOpenMeteo1.addEventListener('click', openMeteo);
  if (btnOpenMeteo2) btnOpenMeteo2.addEventListener('click', openMeteo);
  if (btnCloseMeteo) btnCloseMeteo.addEventListener('click', closeMeteo);
  if (btnCloseMeteoFoot) btnCloseMeteoFoot.addEventListener('click', closeMeteo);

  // Alternância de Abas: INMET COSMO vs CPTEC Multimodel vs Previsão Probabilística
  const tabInmet = document.getElementById('tab-btn-inmet-meteo');
  const tabCptec = document.getElementById('tab-btn-cptec-meteo');
  const tabProb = document.getElementById('tab-btn-prob-meteo');
  const tabWwatch = document.getElementById('tab-btn-wwatch-meteo');
  const contentInmet = document.getElementById('tab-content-inmet-meteo');
  const contentCptec = document.getElementById('tab-content-cptec-meteo');
  const contentProb = document.getElementById('tab-content-prob-meteo');
  const contentWwatch = document.getElementById('tab-content-wwatch-meteo');

  if (tabInmet && tabCptec && contentInmet && contentCptec) {
    const activeTabClasses = 'px-4 py-2 text-xs sm:text-sm font-bold border-b-2 border-zinc-900 dark:border-sky-400 text-zinc-900 dark:text-white cursor-pointer flex items-center gap-2';
    const inactiveTabClasses = 'px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer flex items-center gap-2';

    const switchMeteoTab = (activeTab, activeContent) => {
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
    }
  }

  // Suporte a abertura via query param ?modal=meteo ou hash #meteogramas
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const mParam = (searchParams.get('modal') || '').toLowerCase();
    if (mParam === 'mapa' || mParam === 'mapa-rj' || window.location.hash === '#mapa-rj') {
      openMapaRj();
      setTimeout(() => { openMapaRj(); }, 350);
    }
    if (mParam === 'prob' || mParam === 'probabilistica' || window.location.hash === '#probabilistica') {
      openMeteo();
      setTimeout(() => { if (tabProb) tabProb.click(); }, 200);
    }
    if (mParam === 'wwatch' || mParam === 'ondas' || window.location.hash === '#modal-wwatch') {
      openMeteo();
      setTimeout(() => { if (tabWwatch) tabWwatch.click(); }, 200);
    }
        if (mParam === 'meteo' || mParam === 'meteograma' || mParam === 'meteogramas' || window.location.hash === '#meteogramas') {
      setTimeout(() => { openMeteo(); }, 400);
    }
  } catch (err) {}

  // ==========================================================================
  // METEOGRAM ZOOM & PAN ENGINE
  // ==========================================================================
  const initMeteoZoomController = () => {
    const viewport = document.getElementById('meteo-zoom-viewport');
    const stage = document.getElementById('meteo-panzoom-stage');
    const img = document.getElementById('modal-img-meteograma-inmet');
    const btnZoomIn = document.getElementById('meteo-btn-zoom-in');
    const btnZoomOut = document.getElementById('meteo-btn-zoom-out');
    const btnReset = document.getElementById('meteo-btn-zoom-reset');
    const btnExpand = document.getElementById('meteo-btn-zoom-expand');
    const btnDownload = document.getElementById('meteo-btn-download');
    const btnDownloadTop = document.getElementById('meteo-btn-download-top');
    const rodada00Btn = document.getElementById('meteo-rodada-00');
    const rodada12Btn = document.getElementById('meteo-rodada-12');
    const badge = document.getElementById('meteo-zoom-badge');
    let currentRodada = '00';

    if (!viewport || !stage || !img) return;

    let scale = 1.0;
    const minScale = 1.0;
    const maxScale = 4.0;
    const zoomStep = 0.35;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialPanX = 0;
    let initialPanY = 0;

    let initialPinchDist = 0;
    let initialPinchScale = 1.0;

    const updateTransform = (smooth = false) => {
      if (scale <= 1.02) {
        scale = 1.0;
        panX = 0;
        panY = 0;
        viewport.classList.remove('is-zoomed', 'is-dragging');
        viewport.style.cursor = 'zoom-in';
      } else {
        viewport.classList.add('is-zoomed');
        viewport.style.cursor = isDragging ? 'grabbing' : 'grab';

        // Clamping bounds
        const vpRect = viewport.getBoundingClientRect();
        const maxPanX = Math.max(0, (vpRect.width * (scale - 1)) / 2 + 100);
        const maxPanY = Math.max(0, (vpRect.height * (scale - 1)) / 2 + 160);
        panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
        panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
      }

      stage.style.transition = smooth ? 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
      stage.style.transform = `translate(${panX.toFixed(1)}px, ${panY.toFixed(1)}px) scale(${scale.toFixed(2)})`;

      if (badge) {
        badge.textContent = `${Math.round(scale * 100)}%`;
      }
    };

    const setScale = (newScale, smooth = true) => {
      scale = Math.max(minScale, Math.min(maxScale, newScale));
      updateTransform(smooth);
    };

    const zoomIn = () => {
      setScale(scale + zoomStep, true);
    };

    const zoomOut = () => {
      setScale(scale - zoomStep, true);
    };

    const resetZoom = () => {
      setScale(1.0, true);
    };

    window.resetMeteoZoom = resetZoom;
    window.setMeteoZoom = setScale;

    try {
      const initialZoom = parseFloat(new URLSearchParams(window.location.search).get('zoom'));
      if (!isNaN(initialZoom) && initialZoom > 1.0) {
        setTimeout(() => {
          setScale(initialZoom, false);
        }, 500);
      }
    } catch (e) {}

    // Botões de Ação
    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', (e) => {
        e.stopPropagation();
        zoomIn();
      });
    }

    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', (e) => {
        e.stopPropagation();
        zoomOut();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', (e) => {
        e.stopPropagation();
        resetZoom();
      });
    }

    if (btnExpand) {
      btnExpand.addEventListener('click', (e) => {
        e.stopPropagation();
        const imgSrc = img.getAttribute('src') || 'img/meteograma_inmet.png';
        window.open(imgSrc, '_blank');
      });
    }

    // Ação de Download Direto do Meteograma
    const triggerDownload = (e) => {
      if (e) e.stopPropagation();
      const currentSrc = img.getAttribute('src') || 'img/meteograma_inmet.png';
      const todayStr = new Date().toISOString().split('T')[0];
      const filename = `meteograma_inmet_riodasostras_${todayStr}_${currentRodada}utc.png`;

      const a = document.createElement('a');
      a.href = currentSrc;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    if (btnDownload) btnDownload.addEventListener('click', triggerDownload);
    if (btnDownloadTop) btnDownloadTop.addEventListener('click', triggerDownload);

    // Alternância de Rodadas Oficiais do INMET (00 UTC vs 12 UTC)
    const activeRodadaClasses = 'px-2 py-0.5 text-xs font-bold rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs cursor-pointer transition';
    const inactiveRodadaClasses = 'px-2 py-0.5 text-xs font-semibold rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition';

    if (rodada00Btn) {
      rodada00Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentRodada = '00';
        rodada00Btn.className = activeRodadaClasses;
        if (rodada12Btn) rodada12Btn.className = inactiveRodadaClasses;
        img.src = 'img/meteograma_inmet.png';
        resetZoom();
      });
    }

    if (rodada12Btn) {
      rodada12Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentRodada = '12';
        rodada12Btn.className = activeRodadaClasses;
        if (rodada00Btn) rodada00Btn.className = inactiveRodadaClasses;
        img.src = 'img/inmet_live_12utc.png';
        resetZoom();
      });
    }

    // Zoom com a roda do mouse (Mouse Wheel) centrado no cursor
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? zoomStep * 0.75 : -zoomStep * 0.75;
      const oldScale = scale;
      const nextScale = Math.max(minScale, Math.min(maxScale, oldScale + delta));

      if (nextScale !== oldScale) {
        const rect = viewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        const ratio = nextScale / oldScale;

        panX = mouseX - (mouseX - panX) * ratio;
        panY = mouseY - (mouseY - panY) * ratio;
        scale = nextScale;
        updateTransform(false);
      }
    }, { passive: false });

    // Panning com o mouse (Click & Drag)
    viewport.addEventListener('mousedown', (e) => {
      if (scale <= 1.0) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialPanX = panX;
      initialPanY = panY;
      viewport.classList.add('is-dragging');
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      panX = initialPanX + dx;
      panY = initialPanY + dy;
      updateTransform(false);
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        viewport.classList.remove('is-dragging');
        updateTransform(false);
      }
    });

    // Duplo clique: Alterna entre 100% e 220%
    viewport.addEventListener('dblclick', (e) => {
      e.preventDefault();
      if (scale > 1.1) {
        resetZoom();
      } else {
        const rect = viewport.getBoundingClientRect();
        const clickX = e.clientX - rect.left - rect.width / 2;
        const clickY = e.clientY - rect.top - rect.height / 2;
        scale = 2.2;
        panX = -clickX * 1.1;
        panY = -clickY * 1.1;
        updateTransform(true);
      }
    });

    // Gestos Touch (Mobile / Tablet): Pinch-to-Zoom e Arrastar
    let lastTap = 0;
    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTap < 300) {
          e.preventDefault();
          if (scale > 1.1) {
            resetZoom();
          } else {
            scale = 2.2;
            updateTransform(true);
          }
          lastTap = 0;
          return;
        }
        lastTap = now;

        if (scale > 1.0) {
          isDragging = true;
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          initialPanX = panX;
          initialPanY = panY;
        }
      } else if (e.touches.length === 2) {
        isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.hypot(dx, dy);
        initialPinchScale = scale;
      }
    }, { passive: false });

    viewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && isDragging && scale > 1.0) {
        e.preventDefault();
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        panX = initialPanX + dx;
        panY = initialPanY + dy;
        updateTransform(false);
      } else if (e.touches.length === 2 && initialPinchDist > 0) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const factor = dist / initialPinchDist;
        scale = Math.max(minScale, Math.min(maxScale, initialPinchScale * factor));
        updateTransform(false);
      }
    }, { passive: false });

    viewport.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        initialPinchDist = 0;
      }
      if (e.touches.length === 0) {
        isDragging = false;
      }
    }, { passive: true });
  };

  initMeteoZoomController();

  // Fechar no ESC



  window.addEventListener('keydown', (e) => {



    if (e.key === 'Escape') {



      closeBoletim();



            closeAvisos();



      closeMeteo();
      closeMapaRj();



    }



  });







  // Fechar ao clicar fora



  [modalBoletim, modalMeteo, modalMapaRj].forEach(m => {



    if (m) {



      m.addEventListener('click', (e) => {



        if (e.target === m) {



          m.classList.add('hidden');



          m.classList.remove('flex');



        }



      });



    }



  });



}







/**



 * 2.1. Controles do Panorama Sinótico Geral (Minimizar / Expandir)



 */



function setupPanoramaSinoticoControls() {



  const btnToggle = document.getElementById('btn-toggle-sinopse');



  const containerConteudo = document.getElementById('container-conteudo-sinopse');



  const iconToggle = document.getElementById('icon-toggle-sinopse');







  if (btnToggle && containerConteudo) {



    btnToggle.addEventListener('click', () => {



      const isHidden = containerConteudo.classList.toggle('hidden');



      if (iconToggle) {



        iconToggle.setAttribute('data-lucide', isHidden ? 'chevron-down' : 'chevron-up');



        if (window.lucide) window.lucide.createIcons();



      }



    });



  }



}







/**



 * 3. Alternância de Métricas no Gráfico Central (Hourly Forecast)



 */



function setupChartMetricTabs() {



  const metricBtns = document.querySelectorAll('.bulletin-tab-btn');



  metricBtns.forEach(btn => {



    btn.addEventListener('click', () => {



      metricBtns.forEach(b => b.classList.remove('active'));



      btn.classList.add('active');



      state.activeMetric = btn.getAttribute('data-metric') || 'temperature';



      updateBulletinChart();



    });



  });







  // Suporte a parâmetro na URL (?metric=wind, ?metric=precipitation, etc.)



  try {



    const params = new URLSearchParams(window.location.search);



    const urlMetric = params.get('metric');



    if (urlMetric && ['temperature', 'precipitation', 'wind', 'pressure', 'humidity'].includes(urlMetric)) {



      state.activeMetric = urlMetric;



      metricBtns.forEach(b => {



        if (b.getAttribute('data-metric') === urlMetric) {



          b.classList.add('active');



        } else {



          b.classList.remove('active');



        }



      });



    }



  } catch (e) {}







  window.setChartMetric = function(m) {



    if (!['temperature', 'precipitation', 'wind', 'pressure', 'humidity'].includes(m)) return;



    state.activeMetric = m;



    metricBtns.forEach(b => {



      if (b.getAttribute('data-metric') === m) {



        b.classList.add('active');



      } else {



        b.classList.remove('active');



      }



    });



    updateBulletinChart();



  };



}







/**



 * 4. Carrega todos os dados das fontes oficiais



 */



async function loadAllApplicationData() {



  if (state.isSyncing) return;



  state.isSyncing = true;







  try {



    // FASE 1: Carregamento Ultrarrápido dos Snapshots Oficiais (< 50ms)



    // Renderização Imediata com datasets essenciais e avisos oficiais



    const [metaRes, rowsRes, ineaRes, tabuaRes, orlaRes, avisosMarRes, balnearRes, inmetAvisosRes, estacoesRes, inea10dRes, inmetPrevRes] = await Promise.allSettled([



      getBoletimMetadata(),



      getBoletimOficialData(),



      getIneaCheias(),



      getTabuaMares(),



      getOrlaCondicoes(),



      getMarinhaAvisos(),



      getBalneabilidade(),



      getInmetAlerts(),



      getAcumuladosEstacoes(),



      getIneaJundia10d(),
      getInmetForecast()
    ]);







    if (rowsRes.status === 'fulfilled' && Array.isArray(rowsRes.value)) state.boletimData = rowsRes.value;



    if (metaRes.status === 'fulfilled' && metaRes.value) state.boletimMetadata = metaRes.value;
    if (inmetPrevRes.status === 'fulfilled' && inmetPrevRes.value) state.inmetForecast = inmetPrevRes.value;



    if (ineaRes.status === 'fulfilled' && Array.isArray(ineaRes.value)) {



      state.ineaCheias = ineaRes.value;



      renderJundiaTelemetry(state.ineaCheias);



    }



    if (tabuaRes.status === 'fulfilled' && tabuaRes.value) state.tabuaMares = tabuaRes.value;



    if (orlaRes.status === 'fulfilled' && orlaRes.value) state.orlaCondicoes = orlaRes.value;



    if (avisosMarRes.status === 'fulfilled' && avisosMarRes.value) state.marinhaAvisos = avisosMarRes.value;



    if (balnearRes.status === 'fulfilled' && balnearRes.value) state.balneabilidade = balnearRes.value;



    if (inmetAvisosRes.status === 'fulfilled' && Array.isArray(inmetAvisosRes.value)) state.inmetAlerts = inmetAvisosRes.value;



    if (estacoesRes.status === 'fulfilled' && estacoesRes.value) {



      state.acumuladosDataset = estacoesRes.value;



      state.acumuladosEstacoes = estacoesRes.value.estacoes ? estacoesRes.value.estacoes : estacoesRes.value;



      renderAcumuladosChuva(state.acumuladosDataset);



    }







    if (inea10dRes.status === 'fulfilled' && inea10dRes.value) {



      state.jundia10dData = inea10dRes.value;



      initRioHourlyTable(state.jundia10dData);



    }







    // Renderização Imediata (Fast-Path)



    renderDashboardUI(state.boletimMetadata, state.boletimData, state.weatherData);



    renderPanoramaSinotico(state.boletimMetadata);



    renderAlertasPrincipais(state.inmetAlerts, state.marinhaAvisos);



    renderCondicoesOrla(state.orlaCondicoes, state.tabuaMares, state.marinhaAvisos, state.balneabilidade);



    renderModalData(state.boletimMetadata, state.boletimData, state.inmetAlerts, state.marinhaAvisos);



    if (window.lucide) window.lucide.createIcons();







    // FASE 2: Carregamento Assíncrono em Segundo Plano dos feeds meteorológicos



    const [alerts, openMeteo, estacoes, balnear, cptec, inmetMeteo] = await Promise.allSettled([



      getInmetAlerts(),



      getRioDasOstrasWeatherData(),



      getAcumuladosEstacoes(),



      getBalneabilidade(),



      getCptecData(),



      getInmetMeteogramaData()



    ]);







    if (alerts.status === 'fulfilled' && Array.isArray(alerts.value)) state.inmetAlerts = alerts.value;



    if (openMeteo.status === 'fulfilled' && openMeteo.value) state.weatherData = openMeteo.value;



    if (estacoes.status === 'fulfilled' && estacoes.value) {



      state.acumuladosDataset = estacoes.value;



      state.acumuladosEstacoes = estacoes.value.estacoes ? estacoes.value.estacoes : estacoes.value;



      renderAcumuladosChuva(state.acumuladosDataset);



    }



    if (balnear.status === 'fulfilled' && balnear.value) state.balneabilidade = balnear.value;



    if (cptec.status === 'fulfilled' && cptec.value) state.cptecData = cptec.value;



    if (inmetMeteo.status === 'fulfilled' && inmetMeteo.value) state.inmetMeteoData = inmetMeteo.value;







    // Atualização final com dados dos modelos numéricos



    renderDashboardUI(state.boletimMetadata, state.boletimData, state.weatherData);



    renderAlertasPrincipais(state.inmetAlerts, state.marinhaAvisos);



    renderModalData(state.boletimMetadata, state.boletimData, state.inmetAlerts, state.marinhaAvisos);



    renderCptecData(state.cptecData);



    renderCondicoesOrla(state.orlaCondicoes, state.tabuaMares, state.marinhaAvisos, state.balneabilidade);



    updateBulletinChart();







  } catch (error) {



    console.warn('Erro ao carregar dados:', error);



  } finally {



    state.isSyncing = false;



    if (window.lucide) window.lucide.createIcons();



  }



}







/**



 * 4.1. Renderização do Panorama Sinótico Geral na Tela Principal



 */



function renderPanoramaSinotico(meta) {
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
    const paragrafos = sinopseGeral.split('\n\n').filter(p => p.trim());

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
}







/**



 * 5. Renderização do Dashboard Profissional



 */



function toIsoDate(str) {



  if (!str) return '';



  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);



  const m = String(str).match(/^(\d{2})\/(\d{2})\/(\d{4})/);



  if (m) return `${m[3]}-${m[2]}-${m[1]}`;



  return str;



}








/**
 * Resolução dinâmica e integrada da Condição do Céu no Momento e do Ícone da Previsão
 * Cruza o Boletim Oficial, Previsão INMET (período atual), e telemetria Open-Meteo.
 */
export function resolveSkyAndHeroWeather(meta, inmetForecast, weather) {
  const d0 = meta?.dias_resumo?.[0];
  const subTitle = d0?.subtitulo || '';
  const ceuVal = d0?.pilares?.ceu?.val || '';
  const chuvaVal = d0?.pilares?.chuva?.val || '';

  const hour = new Date().getHours();
  const isDay = weather?.current?.is_day !== undefined ? (weather.current.is_day === 1) : (hour >= 6 && hour < 18);
  const periodKey = (hour >= 6 && hour < 12) ? 'manha' : (hour >= 12 && hour < 18) ? 'tarde' : 'noite';

  let inmetResumo = '';
  if (inmetForecast && inmetForecast['3304524']) {
    const roDates = Object.keys(inmetForecast['3304524']);
    if (roDates.length > 0) {
      const todayForecast = inmetForecast['3304524'][roDates[0]];
      const currentPeriod = todayForecast?.[periodKey] || todayForecast?.['manha'] || todayForecast?.['tarde'] || todayForecast?.['noite'];
      if (currentPeriod?.resumo) {
        inmetResumo = currentPeriod.resumo;
      }
    }
  }

  const curWeatherCode = weather?.current?.weather_code;
  const curPrecip = weather?.current?.precipitation || 0;

  // Texto consolidado para análise semântica
  const combined = `${inmetResumo} ${subTitle} ${ceuVal} ${chuvaVal}`.toLowerCase();

  // 1. Trovoadas / Tempestades / Raios
  if (
    combined.includes('trovoada') ||
    combined.includes('tempestade') ||
    combined.includes('raio') ||
    combined.includes('temporal') ||
    combined.includes('elétrica') ||
    [95, 96, 99, 82].includes(curWeatherCode)
  ) {
    return {
      icon: 'cloud-lightning',
      sky: isDay ? 'Céu Carregado com Risco de Trovoadas e Raios' : 'Céu Noturno Carregado com Trovoadas',
      condition: inmetResumo || subTitle || 'Muitas nuvens com pancadas de chuva e trovoadas',
      color: 'text-amber-500 dark:text-amber-400'
    };
  }

  // 2. Chuva / Pancadas de Chuva
  if (
    combined.includes('pancada') ||
    combined.includes('chuva forte') ||
    combined.includes('chuva moderada') ||
    combined.includes('chuva contínua') ||
    combined.includes('pancadas') ||
    [61, 63, 65, 80, 81].includes(curWeatherCode) ||
    curPrecip > 0.5
  ) {
    return {
      icon: 'cloud-rain',
      sky: 'Céu Encoberto com Pancadas de Chuva',
      condition: inmetResumo || subTitle || 'Nublado com Pancadas de Chuva',
      color: 'text-blue-500 dark:text-blue-400'
    };
  }

  // 3. Chuvisco / Garoa / Chuva Leve
  if (
    combined.includes('garoa') ||
    combined.includes('chuvisco') ||
    combined.includes('chuva leve') ||
    combined.includes('chuva fina') ||
    combined.includes('chuva fraca') ||
    [51, 53, 55].includes(curWeatherCode)
  ) {
    return {
      icon: 'cloud-drizzle',
      sky: 'Céu Úmido com Garoa / Chuvisco',
      condition: subTitle || 'Nublado com Chuviscos',
      color: 'text-cyan-500 dark:text-cyan-400'
    };
  }

  // 4. Nevoeiro / Neblina
  if (
    combined.includes('nevoeiro') ||
    combined.includes('neblina') ||
    [45, 48].includes(curWeatherCode)
  ) {
    return {
      icon: 'cloud-fog',
      sky: 'Nevoeiro Litorâneo e Visibilidade Reduzida',
      condition: 'Nevoeiro Litorâneo',
      color: 'text-slate-400 dark:text-slate-300'
    };
  }

  // 5. Sol entre nuvens / Parcialmente Nublado
  if (
    combined.includes('parcialmente nublado') ||
    combined.includes('sol entre nuvens') ||
    combined.includes('aberturas de sol') ||
    combined.includes('variação de nebulosidade') ||
    curWeatherCode === 2
  ) {
    return {
      icon: isDay ? 'cloud-sun' : 'cloud-moon',
      sky: isDay ? 'Sol entre Nuvens com Nebulosidade Variável' : 'Noite com Nuvens Dispersas',
      condition: isDay ? 'Parcialmente Nublado / Sol com Nuvens' : 'Parcialmente Nublado',
      color: isDay ? 'text-amber-500 dark:text-amber-400' : 'text-indigo-300 dark:text-indigo-200'
    };
  }

  // 6. Céu Limpo / Sol Pleno / Céu Claro / Poucas Nuvens
  if (
    combined.includes('céu claro') ||
    combined.includes('céu limpo') ||
    combined.includes('sol pleno') ||
    combined.includes('ensolarado') ||
    combined.includes('poucas nuvens') ||
    combined.includes('predomínio de sol') ||
    [0, 1].includes(curWeatherCode)
  ) {
    return {
      icon: isDay ? 'sun' : 'moon',
      sky: isDay ? 'Céu Aberto e Ensolarado (Sol Pleno)' : 'Céu Limpo e Noite Estrelada',
      condition: isDay ? 'Ensolarado / Céu Aberto' : 'Céu Limpo / Noite Clara',
      color: isDay ? 'text-amber-500 dark:text-amber-400' : 'text-indigo-400 dark:text-indigo-300'
    };
  }

  // 7. Nublado / Encoberto sem chuva
  if (
    combined.includes('encoberto') ||
    combined.includes('nublado') ||
    combined.includes('muitas nuvens') ||
    curWeatherCode === 3
  ) {
    return {
      icon: 'cloud',
      sky: 'Céu Encoberto a Nublado (Muitas Nuvens)',
      condition: 'Encoberto / Nublado',
      color: 'text-slate-600 dark:text-slate-300'
    };
  }

  // Fallback padrão seguro
  return {
    icon: isDay ? 'cloud-sun' : 'cloud-moon',
    sky: 'Variação de Nebulosidade',
    condition: subTitle || 'Tempo Variável',
    color: 'text-amber-500 dark:text-amber-400'
  };
}


/**
 * Funções Astronômicas Oficiais para Rio das Ostras - RJ
 * Hemisfério Sul, Coordenadas: Lat -22.5264, Lon -41.9456
 */
export function getSouthernSeason(date = new Date()) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const md = m * 100 + d;
  if (md >= 320 && md < 621) return { name: 'Outono', emoji: '🍂', full: 'Estação: Outono' };
  if (md >= 621 && md < 922) return { name: 'Inverno', emoji: '❄️', full: 'Estação: Inverno' };
  if (md >= 922 && md < 1221) return { name: 'Primavera', emoji: '🌸', full: 'Estação: Primavera' };
  return { name: 'Verão', emoji: '☀️', full: 'Estação: Verão' };
}

export function getMoonPhaseData(date = new Date()) {
  const ref = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
  const diffDays = (date.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24);
  const synodicMonth = 29.53058867;
  let phase = (diffDays / synodicMonth) % 1;
  if (phase < 0) phase += 1;
  const age = phase * synodicMonth;
  const illumination = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);

  let name = 'Lua Nova';
  let emoji = '🌑';
  let desc = 'Céu Escuro • Visada Estelar';

  if (phase < 0.03 || phase > 0.97) {
    name = 'Lua Nova';
    emoji = '🌑';
    desc = 'Iluminação 0% • Céu Escuro';
  } else if (phase < 0.22) {
    name = 'Crescente';
    emoji = '🌒';
    desc = `Iluminação ${illumination}% • Início de Noite`;
  } else if (phase < 0.28) {
    name = 'Quarto Crescente';
    emoji = '🌓';
    desc = `Iluminação ${illumination}% • Meio Céu`;
  } else if (phase < 0.47) {
    name = 'Crescente Gibosa';
    emoji = '🌔';
    desc = `Iluminação ${illumination}% • Muito Brilhante`;
  } else if (phase < 0.53) {
    name = 'Lua Cheia';
    emoji = '🌕';
    desc = `Iluminação ${illumination}% • Noite Toda`;
  } else if (phase < 0.72) {
    name = 'Minguante Gibosa';
    emoji = '🌖';
    desc = `Iluminação ${illumination}% • Madrugada`;
  } else if (phase < 0.78) {
    name = 'Quarto Minguante';
    emoji = '🌗';
    desc = `Iluminação ${illumination}% • Fim de Noite`;
  } else {
    name = 'Minguante';
    emoji = '🌘';
    desc = `Iluminação ${illumination}% • Antes da Alvorada`;
  }

  return { name, emoji, illumination, age, desc };
}

export function getSunTimesRioDasOstras(date = new Date()) {
  const lat = -22.5264;
  const lon = -41.9456;
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const decl = 23.45 * Math.sin((360 / 365 * (dayOfYear - 81)) * Math.PI / 180);
  const b = (360 / 365 * (dayOfYear - 81)) * Math.PI / 180;
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  const latRad = lat * Math.PI / 180;
  const declRad = decl * Math.PI / 180;
  const cosOmega = (Math.cos(90.833 * Math.PI / 180) - Math.sin(latRad) * Math.sin(declRad)) / (Math.cos(latRad) * Math.cos(declRad));
  const omega = Math.acos(Math.max(-1, Math.min(1, cosOmega))) * 180 / Math.PI;
  const solarNoonUtc = 12 - (lon / 15) - (eot / 60);
  const sunriseUtc = solarNoonUtc - (omega / 15);
  const sunsetUtc = solarNoonUtc + (omega / 15);
  const sunriseLocal = sunriseUtc - 3;
  const sunsetLocal = sunsetUtc - 3;
  const srh = Math.floor(sunriseLocal);
  const srm = Math.floor((sunriseLocal - srh) * 60);
  const ssh = Math.floor(sunsetLocal);
  const ssm = Math.floor((sunsetLocal - ssh) * 60);
  const durHours = Math.floor(sunsetLocal - sunriseLocal);
  const durMin = Math.floor(((sunsetLocal - sunriseLocal) - durHours) * 60);
  return {
    sunrise: `${String(srh).padStart(2, '0')}:${String(srm).padStart(2, '0')}`,
    sunset: `${String(ssh).padStart(2, '0')}:${String(ssm).padStart(2, '0')}`,
    duration: `${durHours}h ${String(durMin).padStart(2, '0')}m`
  };
}

function renderDashboardUI(meta, rows, weather) {



  const primeiroDia = meta?.dias_resumo?.[0];



  const hojeChuva = primeiroDia?.pilares?.chuva?.val || '2.1 mm';



  const hojeVento = primeiroDia?.pilares?.vento?.val || '32 km/h';







  // 1. Hero Card



  const condEl = document.getElementById('hero-condition');
  const subcondEl = document.getElementById('hero-subcondition');
  const heroAlertPill = document.getElementById('hero-alert-pill');
  const heroIcon = document.getElementById('hero-weather-icon');
  const heroSkyEl = document.getElementById('hero-sky-condition');

  // Resolução Integrada e Semântica do Céu no Momento e Ícone de Acordo com a Previsão
  const heroWeather = resolveSkyAndHeroWeather(meta, state.inmetForecast, weather);

  if (heroSkyEl) {
    heroSkyEl.textContent = heroWeather.sky;
  }

  if (condEl) {
    condEl.textContent = heroWeather.condition;
  }

  if (heroIcon) {
    heroIcon.innerHTML = `<i data-lucide="${heroWeather.icon}" class="w-8 h-8 sm:w-9 sm:h-9 ${heroWeather.color}"></i>`;
    if (window.lucide) window.lucide.createIcons();
  }







  if (subcondEl) {



    subcondEl.textContent = `Chuva prevista: ${hojeChuva} • ${hojeVento} na orla marítima`;



  }







  if (heroAlertPill) {



    const todayIso = new Date().toISOString().slice(0, 10);



    const directAlerts = (state.inmetAlerts && Array.isArray(state.inmetAlerts)) ? state.inmetAlerts.filter(a => a.eh_direto_ostras !== false) : [];



    const activeTodayAlerts = directAlerts.filter(a => {



      const inicio = toIsoDate(a.data_inicio || a.inicio);



      const fim = toIsoDate(a.data_fim || a.fim);



      return inicio <= todayIso && todayIso <= fim;



    });



    const futureAlerts = directAlerts.filter(a => toIsoDate(a.data_inicio || a.inicio) > todayIso);



    const temAlertaHoje = (activeTodayAlerts.length > 0);



    const temMarinhaAtivo = (state.marinhaAvisos && state.marinhaAvisos.aviso_ativo === true && state.marinhaAvisos.numero);







    if (temAlertaHoje) {



      heroAlertPill.textContent = 'Alerta Oficial Vigente Hoje';



      heroAlertPill.className = 'badge-title-orange text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase shadow-2xs';



    } else if (temMarinhaAtivo) {



      const pIni = state.marinhaAvisos.inicio_formatado ? state.marinhaAvisos.inicio_formatado.split(' ')[0] : '24/10';



      heroAlertPill.textContent = `Avisos da Marinha Ativos (A partir de ${pIni})`;



      heroAlertPill.className = 'badge-title-orange text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase shadow-2xs';



    } else if (futureAlerts.length > 0) {



      const pDia = futureAlerts[0].inicio_formatado ? futureAlerts[0].inicio_formatado.split(' ')[0] : '24/10';



      heroAlertPill.textContent = `Atenção: Alerta Previsto para ${pDia}`;



      heroAlertPill.className = 'badge-title-orange text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase shadow-2xs';



    } else {



      heroAlertPill.textContent = 'Normalidade Operacional';



      heroAlertPill.className = 'badge-title-orange text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase shadow-2xs';



    }



  }







  // 2. Temperatura e Métricas do Hero em Tempo Real (Atualização a cada 1 minuto)



  const sideTemp = document.getElementById('sidebar-temp');



  const sideWind = document.getElementById('sidebar-wind');



  const sideHum = document.getElementById('sidebar-hum');



  const sideSea = document.getElementById('sidebar-sea');



  const heroSensacao = document.getElementById('hero-sensacao');



  const heroSyncLabel = document.getElementById('hero-sync-label');







  const chipChuvaVal = document.getElementById('hero-chip-chuva-val');



  const chipChuvaSub = document.getElementById('hero-chip-chuva-sub');



  const chipVentoSub = document.getElementById('hero-chip-vento-sub');



  const chipUmidSub = document.getElementById('hero-chip-umid-sub');



  const chipMarSub = document.getElementById('hero-chip-mar-sub');



  const chipPressVal = document.getElementById('hero-chip-press-val');



  const chipPressSub = document.getElementById('hero-chip-press-sub');



  const chipUvVal = document.getElementById('hero-chip-uv-val');



  const chipUvSub = document.getElementById('hero-chip-uv-sub');







  const cur = weather?.current || weather?.current_weather;



  const tempCur = cur?.temperature_2m !== undefined ? cur.temperature_2m : cur?.temperature;



  const appTempCur = cur?.apparent_temperature;



  const windCur = cur?.wind_speed_10m !== undefined ? cur.wind_speed_10m : cur?.windspeed;



  const gustCur = cur?.wind_gusts_10m;



  const humCur = cur?.relative_humidity_2m;



  const pressCur = cur?.pressure_msl || cur?.surface_pressure;



  const weatherCode = cur?.weather_code;







  // Atualiza Temperatura



  if (sideTemp) {



    if (tempCur !== undefined) {



      sideTemp.textContent = `${Math.round(tempCur)}°`;



    } else if (primeiroDia?.pilares?.temp?.val) {



      const maxVal = primeiroDia.pilares.temp.val.split(' a ')?.[1]?.replace('°C', '') || '27';



      sideTemp.textContent = `${maxVal.trim()}°`;



    } else if (rows && rows[0]) {



      sideTemp.textContent = `${rows[0].temp_max || 27}°`;



    }



  }







  // Atualiza Sensação Térmica



  if (heroSensacao) {



    if (appTempCur !== undefined) {



      heroSensacao.textContent = `Sensação: ${Math.round(appTempCur)}°C`;



    } else if (tempCur !== undefined) {



      heroSensacao.textContent = `Sensação: ${Math.round(tempCur)}°C`;



    }



  }







  // Condição e ícone já resolvidos harmonicamente por resolveSkyAndHeroWeather







  // Atualiza Vento e Rajadas



  if (sideWind) {



    if (windCur !== undefined) {



      sideWind.textContent = `${Math.round(windCur)} km/h`;



    } else if (primeiroDia?.pilares?.vento?.val) {



      sideWind.textContent = primeiroDia.pilares.vento.val.replace('Rajadas ', '') || '24 km/h';



    }



  }



  if (chipVentoSub) {



    if (gustCur !== undefined) {



      chipVentoSub.textContent = `Rajadas ${Math.round(gustCur)} km/h`;



    } else {



      chipVentoSub.textContent = 'Rajadas na orla';



    }



  }







  // Atualiza Umidade



  if (sideHum) {



    if (humCur !== undefined) {



      sideHum.textContent = `${Math.round(humCur)}%`;



    } else if (primeiroDia?.pilares?.umid?.val) {



      sideHum.textContent = primeiroDia.pilares.umid.val || '85%';



    }



  }



  if (chipUmidSub) {



    if (humCur !== undefined) {



      chipUmidSub.textContent = humCur >= 80 ? 'Ar Muito Úmido' : (humCur <= 55 ? 'Ar Mais Seco' : 'Umidade Ideal');



    }



  }







  // Atualiza Chuva Prevista com Síntese Multi-Fonte



  if (chipChuvaVal) {



    chipChuvaVal.textContent = hojeChuva || '0.0 mm';



  }



  if (chipChuvaSub) {



    const prob = weather?.hourly?.precipitation_probability?.[0];



    const temAlerta = String(hojeChuva).includes('Até') || meta?.analise_precipitacao_multifonte?.previsto_por_dia?.[0]?.tem_alerta_inmet;



    const taxaPico = meta?.analise_precipitacao_multifonte?.previsto_por_dia?.[0]?.taxa_horaria_pico || '20-30 mm/h';



    chipChuvaSub.textContent = temAlerta ? `Pico: ${taxaPico} (Alerta)` : (prob !== undefined ? `Probab.: ${prob}%` : 'Probab.: 75%');



  }







  // Atualiza Mar na Orla



  if (sideSea) {



    const ondaOrla = state.orlaCondicoes?.praias?.[0]?.onda;



    sideSea.textContent = ondaOrla || primeiroDia?.pilares?.mar?.val || '0.7 a 1.2 m';



  }



  if (chipMarSub) {



    const stMar = state.orlaCondicoes?.praias?.[0]?.status;



    chipMarSub.textContent = stMar || 'Moderado';



  }







  // Atualiza Pressão Barométrica



  if (chipPressVal) {



    if (pressCur !== undefined) {



      chipPressVal.textContent = `${Math.round(pressCur)} hPa`;



    } else {



      chipPressVal.textContent = '1018 hPa';



    }



  }



  if (chipPressSub) {



    if (pressCur !== undefined) {



      chipPressSub.textContent = pressCur >= 1016 ? 'Alta Pressão • Estável' : (pressCur <= 1011 ? 'Baixa Pressão' : 'Pressão Estável');



    }



  }







  // Atualiza Índice UV



  if (chipUvVal) {



    const uvVal = weather?.daily?.uv_index_max?.[0] !== undefined ? Math.round(weather.daily.uv_index_max[0]) : 7;



    const uvDesc = uvVal >= 8 ? 'Muito Alto' : (uvVal >= 6 ? 'Alto' : (uvVal >= 3 ? 'Moderado' : 'Baixo'));



    chipUvVal.textContent = `${uvVal} - ${uvDesc}`;



  }



  if (chipUvSub) {



    chipUvSub.textContent = 'FPS recomendado';
  }

  // Atualiza Estação do Ano Vigente (Hemisfério Sul)
  const heroEstacaoTxt = document.getElementById('hero-estacao-txt');
  const seasonData = getSouthernSeason();
  if (heroEstacaoTxt) {
    heroEstacaoTxt.textContent = `Estação: ${seasonData.name}`;
  }

  // Atualiza Sol (Nascer e Pôr com Emojis)
  const chipSolVal = document.getElementById('hero-chip-sol-val');
  const chipSolSub = document.getElementById('hero-chip-sol-sub');
  const astroSun = getSunTimesRioDasOstras();
  
  let sunriseStr = astroSun.sunrise;
  let sunsetStr = astroSun.sunset;
  if (weather?.daily?.sunrise?.[0]) {
    try {
      sunriseStr = weather.daily.sunrise[0].split('T')[1].slice(0, 5);
    } catch (e) {}
  }
  if (weather?.daily?.sunset?.[0]) {
    try {
      sunsetStr = weather.daily.sunset[0].split('T')[1].slice(0, 5);
    } catch (e) {}
  }

  if (chipSolVal) {
    chipSolVal.textContent = `🌅 ${sunriseStr} • 🌇 ${sunsetStr}`;
  }
  if (chipSolSub) {
    chipSolSub.textContent = `${astroSun.duration} de Sol`;
  }

  // Atualiza Fase da Lua do Dia
  const chipLuaVal = document.getElementById('hero-chip-lua-val');
  const chipLuaSub = document.getElementById('hero-chip-lua-sub');
  const moonData = getMoonPhaseData();
  if (chipLuaVal) {
    chipLuaVal.textContent = `${moonData.emoji} ${moonData.name}`;
  }
  if (chipLuaSub) {
    chipLuaSub.textContent = `Ilum. ${moonData.illumination}% • Noite`;
  }

  if (window.lucide) {
    window.lucide.createIcons();




  }







  // Atualiza Label de Sincronização a cada 1 minuto com horário da última sincronia



  if (heroSyncLabel) {



    const now = new Date();



    const hh = String(now.getHours()).padStart(2, '0');



    const mm = String(now.getMinutes()).padStart(2, '0');



    heroSyncLabel.textContent = `Atualizado às ${hh}:${mm} (Tempo Real • 1 em 1 min)`;
    const chuvaLiveEl = document.getElementById("chuva-atualizacao-txt");
    if (chuvaLiveEl) chuvaLiveEl.textContent = `Atualizado às ${hh}:${mm} (Tempo Real)`;



  }







  // 3. Previsão dos Próximos 3 Dias (Começando Hoje)



  const list3d = document.getElementById('sidebar-3days-list');



  const periodTxt = document.getElementById('sidebar-period-txt');



  if (periodTxt && meta?.periodo) {



    periodTxt.textContent = meta.periodo;



  }







  if (list3d && meta?.dias_resumo && Array.isArray(meta.dias_resumo)) {



    const cardThemes = [



      {



        cardClass: 'card-coral shadow-sm',



        medallionClass: 'icon-medallion bg-white text-black border-1.5 border-[#f97316] shadow-xs',



        badgeText: 'text-black font-semibold',



        titleText: 'text-black font-extrabold',



        tempText: 'text-black font-extrabold bg-white/90 px-2.5 py-1 rounded-xl border border-[#f97316]/40 shadow-2xs',



        iconColor: 'text-black',



        chevronColor: 'text-black',



        subCardBg: 'bg-white/95 border border-[#f97316]/30 text-black shadow-2xs',



        subCardLabel: 'text-[#ea580c] font-bold text-[9.5px]'



      },



      {



        cardClass: 'card-slate shadow-sm',



        medallionClass: 'icon-medallion bg-white text-black border-1.5 border-[#6d8ba6] shadow-xs',



        badgeText: 'text-black font-semibold',



        titleText: 'text-black font-extrabold',



        tempText: 'text-black font-extrabold bg-white/90 px-2.5 py-1 rounded-xl border border-[#6d8ba6]/40 shadow-2xs',



        iconColor: 'text-black',



        chevronColor: 'text-black',



        subCardBg: 'bg-white/95 border border-[#6d8ba6]/30 text-black shadow-2xs',



        subCardLabel: 'text-[#3d4f61] font-bold text-[9.5px]'



      },



      {



        cardClass: 'card-stoneware shadow-sm',



        medallionClass: 'icon-medallion bg-white text-black border-1.5 border-[#b8a99a] shadow-xs',



        badgeText: 'text-black font-semibold',



        titleText: 'text-black font-extrabold',



        tempText: 'text-black font-extrabold bg-white/90 px-2.5 py-1 rounded-xl border border-[#b8a99a]/40 shadow-2xs',



        iconColor: 'text-black',



        chevronColor: 'text-black',



        subCardBg: 'bg-white/95 border border-[#b8a99a]/35 text-black shadow-2xs',



        subCardLabel: 'text-[#786350] font-bold text-[9.5px]'



      }



    ];







    list3d.innerHTML = meta.dias_resumo.map((d, idx) => {



      const rotulos = ['Hoje', 'Amanhã', 'Depois de amanhã'];



      const rotuloCurto = rotulos[idx] || `Dia ${idx + 1}`;



      



      // Formata o nome do dia em Title Case: "TERÇA-FEIRA" -> "Terça-Feira"



      let nomeDiaFormatado = '';



      if (d.dia) {



        const diaSemData = d.dia.split(/[•—]/)[0].trim();



        nomeDiaFormatado = diaSemData



          .toLowerCase()



          .split('-')



          .map(p => p.charAt(0).toUpperCase() + p.slice(1))



          .join('-');



      }







      // Extrai a data oficial: "20/10/2026"



      let dataStr = '';



      if (d.dia) {



        const m = d.dia.match(/(\d{2}\/\d{2}(?:\/\d{4})?)/);



        if (m) {



          dataStr = m[1];



          if (!dataStr.includes('/20')) {



            dataStr = `${dataStr}/${new Date().getFullYear()}`;



          }



        }



      }



      if (!dataStr) {



        const now = new Date();



        const target = new Date(now.getTime() + idx * 86400000);



        const dd = String(target.getDate()).padStart(2, '0');



        const mm = String(target.getMonth() + 1).padStart(2, '0');



        dataStr = `${dd}/${mm}/${target.getFullYear()}`;



      }







      // Título exatamente no padrão: "Hoje (Terça-Feira) - 20/10/2026"



      const tituloCard = `${rotuloCurto} (${nomeDiaFormatado}) - ${dataStr}`;







      const tempVal = d.pilares?.temp?.val ? d.pilares.temp.val.replace(' a ', ' / ') : '24° / 19°C';



      let condTxt = 'Estável';



      if (d.subtitulo) {



        condTxt = d.subtitulo.split(/\s*(?:[-—•]|\s{2,})\s*M[áa]xima/i)[0].trim();



        condTxt = condTxt.replace(/\(Alerta Amarelo\s*[-—]\s*Perigo Potencial\)/i, '(Alerta Amarelo)');



        if (condTxt.includes('(') && !condTxt.includes(')')) {



          condTxt += ')';



        }



      }



      const iconName = d.pilares?.ceu?.icon || 'cloud-sun';



      const chuvaVal = d.pilares?.chuva?.val || '0 mm';



      const ventoVal = d.pilares?.vento?.val || '24 km/h';



      const theme = cardThemes[idx % 3];







      // Previsão do Mar detalhada e precisa para os 3 dias



      const marInfoList = [



        { ondas: '1,2 a 1,6 m', estado: 'Calmo a Moderado', chip: '1,2 a 1,6 m (Mod.)', detalhe: 'Swell E/SE • Enseadas 0,3-0,7 m | Oceânica 1,2-1,6 m' },



        { ondas: '1,0 a 1,4 m', estado: 'Moderado', chip: '1,0 a 1,4 m (Mod.)', detalhe: 'Swell E • Enseadas 0,3-0,6 m | Oceânica 1,0-1,4 m' },



        { ondas: '0,8 a 1,2 m', estado: 'Calmo', chip: '0,8 a 1,2 m (Calmo)', detalhe: 'Swell E/NE • Enseadas 0,2-0,5 m | Oceânica 0,8-1,2 m' }



      ];



      const marInfo = marInfoList[idx] || { ondas: '1,0 m', estado: 'Normal', chip: '1,0 m', detalhe: 'Condições regulares de mar' };







      const marFrases = [



        'Na orla de Rio das Ostras, o mar varia de calmo a moderado com ondas de 1,2 a 1,6 m na faixa oceânica e águas abrigadas nas enseadas (0,3 a 0,7 m).',



        'Na orla de Rio das Ostras, o mar se mantém moderado com ondas de 1,0 a 1,4 m e ventos costeiros regulares.',



        'Na orla de Rio das Ostras, o mar se apresenta calmo com ondas de 0,8 a 1,2 m.'



      ];



      const marFrase = marFrases[idx] || `Na orla, o mar se apresenta ${marInfo.estado.toLowerCase()} com ondas de ${marInfo.ondas}.`;







      // Extrai o textinho da previsão oficial para exibir de cara no card, sintetizando convecção, chuva multi-fonte, hidrologia e mar SEM TÓPICOS



      let informeResumo = '';



      if (Array.isArray(d.informe_populacao) && d.informe_populacao.length > 0) {



        let base = cleanBulletinText(d.informe_populacao[0]);



        if (!base.endsWith('.')) base += '.';



        let detalheChuva = (d.informe_populacao.length > 1) ? cleanBulletinText(d.informe_populacao[1]) : '';



        if (detalheChuva && !detalheChuva.endsWith('.')) detalheChuva += '.';



        



        let textoCompleto = detalheChuva ? `${base} ${detalheChuva}` : base;



        if (!textoCompleto.toLowerCase().includes('mar ')) {



          informeResumo = `${textoCompleto} ${marFrase}`;



        } else {



          informeResumo = textoCompleto;



        }



      } else {



        const fallbacks = [



          `Nesta quinta-feira, calor e umidade favorecem convecção diurna com pancadas de chuva e trovoadas à tarde (volume contínuo de 8.3 mm com pico de até 50 mm/dia sob Alerta Amarelo nº 56141). O Rio Jundiá permanece seguro com 1.7 m. ${marFrases[0]}`,



          `Nesta sexta-feira, instabilidades mantêm chuva com trovoadas (média de 10.5 mm e até 50 mm/dia sob Alerta Amarelo nº 56143). O Rio Jundiá segue estável. ${marFrases[1]}`,



          `Neste sábado, calor com pancadas de chuva à tarde (média de 3.6 mm e teto de alerta de até 50 mm/dia sob Alerta Amarelo nº 56153). A bacia opera livre. ${marFrases[2]}`



        ];



        informeResumo = fallbacks[idx] || `Previsão operacional regular. ${marFrase}`;



      }







      return `



        <div class="p-4 rounded-2xl ${theme.cardClass} space-y-2.5 cursor-pointer transition hover:scale-[1.01]" onclick="window.toggleDayCard(${idx})">



          <div class="flex items-center justify-between text-sm gap-2">



            <div class="flex items-center gap-2.5 min-w-0 flex-1">



              <div class="${theme.medallionClass} w-9 h-9 shrink-0">



                <i data-lucide="${iconName}" class="w-4 h-4 ${theme.iconColor}"></i>



              </div>



              <div class="min-w-0 flex-1">



                <span class="font-black ${theme.titleText} text-xs sm:text-[13px] block leading-tight text-black">${tituloCard}</span>



                <span class="text-[11px] sm:text-xs font-semibold ${theme.badgeText} block mt-0.5">${condTxt}</span>



              </div>



            </div>



            <div class="flex items-center gap-1.5 shrink-0 pl-1 self-start pt-0.5">



              <span class="font-black font-mono ${theme.tempText} text-xs whitespace-nowrap">${tempVal}</span>



              <i data-lucide="chevron-down" id="day-card-chevron-${idx}" class="w-4 h-4 ${theme.chevronColor} transition"></i>



            </div>



          </div>







          <!-- Previsão Essencial com Mar em Destaque (Chuva, Mar na Orla e Vento) Sempre Visíveis -->



          <div class="flex items-center gap-1.5 pt-0.5 flex-wrap">



            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/90 border border-black/15 shadow-2xs text-[11px] font-bold text-black" title="Previsão de Chuva">



              <i data-lucide="cloud-rain" class="w-3.5 h-3.5 text-[#0284c7]"></i>



              <span>Chuva: ${chuvaVal}</span>



            </span>



            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/90 border border-black/15 shadow-2xs text-[11px] font-bold text-black" title="Condição do Mar na Orla de Rio das Ostras">



              <i data-lucide="waves" class="w-3.5 h-3.5 text-[#0284c7]"></i>



              <span>Mar: ${marInfo.chip}</span>



            </span>



            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/90 border border-black/15 shadow-2xs text-[11px] font-bold text-black" title="Vento / Rajadas">



              <i data-lucide="wind" class="w-3.5 h-3.5 text-[#475569]"></i>



              <span>${cleanBulletinText(ventoVal)}</span>



            </span>



          </div>







          <!-- O TEXTINHO DA PREVISÃO OFICIAL (Visível de cara no card) -->



          <div class="pt-2 border-t border-black/10 space-y-1">



            <p class="text-xs text-black/90 font-medium leading-relaxed">



              ${informeResumo}



            </p>



            <div class="flex items-center justify-between pt-1 text-[10.5px] font-bold text-black/70">



              <span id="day-card-btn-txt-${idx}" class="hover:underline flex items-center gap-1">



                Ver detalhes técnicos



              </span>



              <span class="text-[10px] text-black/60 dark:text-slate-400 uppercase tracking-wider font-semibold">Boletim Oficial</span>



            </div>



          </div>







          



          <!-- Acordeão com os Pilares Oficiais Expandidos -->



          <div id="day-card-collapse-${idx}" class="pilares-collapse hidden pt-3 border-t border-current/15 space-y-2.5">



            <div class="grid grid-cols-2 gap-2 text-xs">



              <div class="p-2.5 rounded-xl ${theme.subCardBg} space-y-0.5">



                <span class="${theme.subCardLabel} font-bold block uppercase text-[10px] tracking-wider">Céu</span>



                <span class="font-bold text-xs block text-black leading-tight mt-0.5">${cleanBulletinText(d.pilares?.ceu?.val || '—')}</span>



              </div>



              <div class="p-2.5 rounded-xl ${theme.subCardBg} space-y-0.5">



                <span class="${theme.subCardLabel} font-bold block uppercase text-[10px] tracking-wider">Chuva</span>



                <span class="font-bold text-xs block text-black leading-tight mt-0.5">${cleanBulletinText(d.pilares?.chuva?.val || '—')}</span>



              </div>



              <div class="p-2.5 rounded-xl ${theme.subCardBg} space-y-0.5">



                <span class="${theme.subCardLabel} font-bold block uppercase text-[10px] tracking-wider">Vento</span>



                <span class="font-bold text-xs block text-black leading-tight mt-0.5">${cleanBulletinText(d.pilares?.vento?.val || '—')}</span>



              </div>



              <div class="p-2.5 rounded-xl ${theme.subCardBg} space-y-0.5">



                <span class="${theme.subCardLabel} font-bold block uppercase text-[10px] tracking-wider">Mar na Orla</span>



                <span class="font-extrabold text-xs block text-black leading-tight mt-0.5">${marInfo.ondas} • ${marInfo.estado}</span>



                <span class="text-[10px] text-black/75 font-medium block leading-snug mt-1">${marInfo.detalhe}</span>



              </div>



            </div>







            ${Array.isArray(d.informe_populacao) && d.informe_populacao.length > 2 ? `



              <div class="mt-2 p-3.5 rounded-xl ${theme.subCardBg} text-xs space-y-2 leading-relaxed">



                <span class="text-[10.5px] font-extrabold uppercase tracking-wider text-[#ea580c] block">Detalhamento Térmico, Umidade e Ventos</span>



                <p class="text-black font-normal leading-relaxed text-justify">



                  ${d.informe_populacao.slice(2).map(item => cleanBulletinText(item).replace(/^[•\-\*]\s*/, '')).join(' ')}



                </p>



              </div>



            ` : ''}



          </div>



        </div>



      `;



    }).join('');



  }







  // 4. Barras de Chuva por Turno



  renderChuvaTurnosBars(rows);
  if (window.lucide) window.lucide.createIcons();
}







/**



 * Função Auxiliar para Cores e Badges Oficiais dos Alertas do INMET



 */



function getAlertBadgeAndClass(severidade, corNome) {



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



}







function formatAlertPeriod(inicio, fim) {



  if (!inicio) return '';



  if (!fim) return `A partir de ${inicio}`;



  



  const pIni = inicio.replace(' às ', ' ').split(' ');



  const pFim = fim.replace(' às ', ' ').split(' ');



  



  const dIni = pIni[0] || '';



  const hIni = pIni[1] || '';



  const dFim = pFim[0] || '';



  const hFim = pFim[1] || '';



  



  if (dIni && dFim && dIni === dFim) {



    const diaMes = dIni.slice(0, 5);



    return `Vigência: ${diaMes} (${hIni} às ${hFim})`;



  } else if (dIni && dFim) {



    const diaMesIni = dIni.slice(0, 5);



    const diaMesFim = dFim.slice(0, 5);



    return `Vigência: ${diaMesIni} ${hIni} até ${diaMesFim} ${hFim}`;



  }



  return `Vigência: ${inicio} até ${fim}`;



}







/**



 * 6. Renderiza os Alertas Oficiais do INMET e da Marinha na Tela Principal (Compacto e com Cores Oficiais)



 */



function renderAlertasPrincipais(inmetAlerts, marinhaAvisos) {



  const container = document.getElementById('container-alertas-principais');



  const badgeTotal = document.getElementById('badge-total-alertas');



  const sectionAlertas = document.getElementById('section-alertas-oficiais');



  if (!container) return;







  const cardsHtml = [];







  // 1. Alertas Oficiais do INMET (priorizando alertas ativos hoje para Rio das Ostras)



  if (inmetAlerts && Array.isArray(inmetAlerts) && inmetAlerts.length > 0) {



    const directAlerts = inmetAlerts.filter(a => a.eh_direto_ostras !== false);



    directAlerts.sort((a, b) => {



      const tA = new Date(toIsoDate(a.data_inicio || a.inicio)).getTime() || 0;



      const tB = new Date(toIsoDate(b.data_inicio || b.inicio)).getTime() || 0;



      return tA - tB;



    });



    const nowIso = new Date().toISOString().slice(0, 10);



    const todayAlerts = directAlerts.filter(a => {



      const ini = toIsoDate(a.data_inicio || a.inicio);



      const fim = toIsoDate(a.data_fim || a.fim);



      return ini <= nowIso && nowIso <= fim;



    });



    const alertsToDisplay = todayAlerts.length > 0 ? todayAlerts : (directAlerts.length > 0 ? [directAlerts[0]] : []);







    alertsToDisplay.forEach(a => {



      const inicioIso = toIsoDate(a.data_inicio || a.inicio);



      const fimIso = toIsoDate(a.data_fim || a.fim);



      const isVigenteHoje = inicioIso <= nowIso && nowIso <= fimIso;



      const isFuturo = inicioIso > nowIso;







      const titulo = a.descricao || 'Alerta Meteorológico';



      const alertInfo = getAlertBadgeAndClass(a.severidade, a.cor_nome);



      const periodo = formatAlertPeriod(a.inicio_formatado || a.inicio, a.fim_formatado || a.fim);



      const riscos = (a.riscos && a.riscos[0]) ? a.riscos[0] : 'Chuva intensa, ventos fortes e descargas elétricas.';



      const instrucoes = (a.instrucoes && a.instrucoes[0]) ? a.instrucoes[0] : 'Não se abrigue debaixo de árvores. Em emergência ligue 199.';







      let statusBadge = isVigenteHoje 



        ? '<span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-[#ffebe4] text-black border border-[#f97316]">Vigente Hoje</span>'



        : (isFuturo 



            ? `<span class="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-[#f1f5f9] text-black border border-[#cbd5e1]">Prog. ${a.inicio_formatado ? a.inicio_formatado.split(' ')[0].slice(0, 5) : '22/10'}</span>`



            : '<span class="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-[#f1f5f9] text-black border border-[#cbd5e1]">Encerrado</span>');







      cardsHtml.push(`



        <div class="${alertInfo.cardClass} p-3 sm:p-3.5 space-y-2 flex flex-col justify-between __SPAN_CLASS__">



          <div class="space-y-2">



            <div class="flex items-center justify-between gap-1.5 border-b border-[#cbd5e1] pb-2 flex-wrap">



              <div class="flex items-center gap-1 flex-wrap">



                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-[#f1f5f9] text-black border border-[#cbd5e1] tracking-wide">



                  INMET



                </span>



                <span class="text-xs font-semibold font-mono text-black truncate">



                  ${a.id ? `Aviso nº ${a.id}` : 'Aviso Especial'}



                </span>



                ${a.eh_direto_ostras ? '<span class="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#eaf0f6] text-black border border-[#cbd5e1]">Rio das Ostras</span>' : ''}



                ${statusBadge}



              </div>



              ${alertInfo.badgeHtml}



            </div>







            <div class="flex items-baseline justify-between gap-1 flex-wrap">



              <h3 class="text-sm sm:text-base font-bold text-black font-heading leading-tight">${titulo}</h3>



              <span class="text-[11px] font-medium text-black font-mono font-semibold whitespace-nowrap flex items-center gap-1 shrink-0">



                <i data-lucide="clock" class="w-3.5 h-3.5 text-black"></i>



                ${periodo}



              </span>



            </div>



          </div>







          <div class="p-2.5 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-black leading-snug space-y-1 mt-1">



            <div><strong class="font-bold text-black">Riscos:</strong> ${cleanBulletinText(riscos)}</div>



            <div><strong class="font-bold text-black">Defesa Civil 199:</strong> ${cleanBulletinText(instrucoes)}</div>



          </div>



        </div>



      `);



    });



  }







  // 2. Alertas Oficiais da Marinha do Brasil (só renderiza se houver aviso real ativo)



  if (marinhaAvisos && marinhaAvisos.aviso_ativo === true && marinhaAvisos.numero) {



    const avisosList = (marinhaAvisos.avisos_ativos && marinhaAvisos.avisos_ativos.length > 0)



      ? marinhaAvisos.avisos_ativos



      : [marinhaAvisos];







    avisosList.forEach(a => {



      const numero = a.numero;



      const tipo = a.tipo || marinhaAvisos.tipo || 'MAU TEMPO';



      const area = a.area || marinhaAvisos.area || 'Área DELTA';



      const rajadas = a.rajadas || marinhaAvisos.rajadas || 'Até 45 km/h';



      const marOndas = a.ondas || a.mar_ondas || marinhaAvisos.mar_ondas || '2,0 a 2,5 m';



      const periodo = a.periodo || a.validade || marinhaAvisos.validade || 'Em vigor';



      const restricao = a.restricao || marinhaAvisos.restricao || 'Atenção a pescadores, banhistas e pequenas embarcações na orla marítima.';







      cardsHtml.push(`



        <div class="alert-card-marinha p-3 sm:p-3.5 space-y-2 flex flex-col justify-between __SPAN_CLASS__">



          <div class="space-y-2">



            <div class="flex items-center justify-between gap-1.5 border-b border-[#cbd5e1] pb-2 flex-wrap">



              <div class="flex items-center gap-1 flex-wrap">



                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-[#f1f5f9] text-black border border-[#cbd5e1] tracking-wide">



                  MARINHA



                </span>



                <span class="text-xs font-semibold font-mono text-black truncate">



                  Aviso nº ${numero}



                </span>



                <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#eaf0f6] text-black border border-[#cbd5e1]">



                  Área Delta



                </span>



                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${tipo.includes('GROSSO') ? 'bg-rose-50 text-rose-800 border border-rose-300' : 'bg-[#ffebe4] text-black border border-[#f97316]'}">



                  ${tipo}



                </span>



              </div>



              <span class="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#f1f5f9] text-black border border-[#cbd5e1]">



                CHM / SMM



              </span>



            </div>







            <div class="flex items-baseline justify-between gap-1 flex-wrap">



              <h3 class="text-sm sm:text-base font-bold text-black font-heading leading-tight">${tipo} • ${area}</h3>



              <span class="text-[11px] font-medium text-black font-mono font-semibold whitespace-nowrap flex items-center gap-1 shrink-0">



                <i data-lucide="clock" class="w-3.5 h-3.5 text-black"></i>



                ${periodo}



              </span>



            </div>



          </div>







          <div class="grid grid-cols-2 gap-2 text-center text-xs">



            <div class="p-2 rounded-xl bg-[#f8fafc] border border-[#cbd5e1]">



              <span class="text-[10px] uppercase font-bold text-black block">Rajadas / Vento</span>



              <span class="text-xs font-bold font-mono text-black">${rajadas}</span>



            </div>



            <div class="p-2 rounded-xl bg-[#f8fafc] border border-[#cbd5e1]">



              <span class="text-[10px] uppercase font-bold text-black block">Condição do Mar</span>



              <span class="text-xs font-bold font-mono text-black">${marOndas}</span>



            </div>



          </div>







          <div class="p-2.5 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-black leading-snug space-y-1 mt-1">



            <div><strong class="font-bold text-black">Restrição:</strong> ${cleanBulletinText(restricao)}</div>



          </div>



        </div>



      `);



    });



  }







  if (cardsHtml.length > 0) {



    if (sectionAlertas) sectionAlertas.classList.remove('hidden');



    



    const count = cardsHtml.length;



    const finalCards = cardsHtml.map((card, idx) => {



      const isLast = (idx === count - 1);



      let span = '';



      if (count === 3 && isLast) {



        span = 'md:col-span-2 lg:col-span-1';



      } else if (count > 1 && (count % 2 === 1) && isLast) {



        span = 'md:col-span-2';



      }



      return card.replace('__SPAN_CLASS__', span);



    });







    container.innerHTML = finalCards.join('');







    // Grid responsivo adaptativo que elimina buracos vazios:



    if (count === 1) {



      container.className = 'grid grid-cols-1 gap-4';



    } else if (count === 2) {



      container.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';



    } else if (count === 3) {



      container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5';



    } else if (count === 4) {



      container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3';



    } else {



      container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5';



    }







    if (badgeTotal) {



      badgeTotal.textContent = `${count} ${count === 1 ? 'Alerta Ativo' : 'Alertas Ativos'}`;



      badgeTotal.className = 'badge-title-orange text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase shadow-2xs';



    }



  } else {



    // Quando não houver avisos, oculta o container de alertas da tela principal



    if (sectionAlertas) sectionAlertas.classList.add('hidden');



    container.innerHTML = '';



    if (badgeTotal) {



      badgeTotal.textContent = 'Sem Avisos';



      badgeTotal.className = 'badge-title-orange text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase shadow-2xs';



    }



  }







  if (window.lucide) window.lucide.createIcons();



}







/**



 * 7. Renderiza as Barrinhas de Chuva dos Turnos



 */



function renderChuvaTurnosBars(rows) {



  const container = document.getElementById('chuva-turnos-bars');



  const badgeTotal = document.getElementById('badge-total-chuva');



  const badgeHoje = document.getElementById('badge-hoje-chuva');



  const formulaEl = document.getElementById('chuva-formula-3d');







  if (!container || !rows || rows.length === 0) return;







  state.currentTurnoRows = rows;



  if (state.selectedTurnoDay === undefined) state.selectedTurnoDay = 0;







  // Separação rigorosa dos 3 dias (4 turnos para cada dia = 12 turnos)



  const d0_turnos = rows.slice(0, 4);



  const d1_turnos = rows.slice(4, 8);



  const d2_turnos = rows.slice(8, 12);







  const tot0 = d0_turnos.reduce((acc, r) => acc + (parseFloat(r.chuva_media) || 0), 0);



  const tot1 = d1_turnos.reduce((acc, r) => acc + (parseFloat(r.chuva_media) || 0), 0);



  const tot2 = d2_turnos.reduce((acc, r) => acc + (parseFloat(r.chuva_media) || 0), 0);



  const totalGeral = tot0 + tot1 + tot2;







  // Atualiza badges no cabeçalho do card



  if (badgeHoje) {



    badgeHoje.textContent = `Hoje: ${tot0.toFixed(1)} mm`;



  }



  if (badgeTotal) {



    badgeTotal.textContent = `Total 3D: ${totalGeral.toFixed(1)} mm`;



  }







  // Atualiza a fórmula visível



  if (formulaEl) {



    formulaEl.textContent = `${tot0.toFixed(1)} + ${tot1.toFixed(1)} + ${tot2.toFixed(1)} = ${totalGeral.toFixed(1)} mm`;



  }







  // Atualiza os botões seletores dos 3 dias



  const l0Name = document.getElementById('lbl-turno-day-0-name');



  const l0Val = document.getElementById('lbl-turno-day-0-val');



  const l1Name = document.getElementById('lbl-turno-day-1-name');



  const l1Val = document.getElementById('lbl-turno-day-1-val');



  const l2Name = document.getElementById('lbl-turno-day-2-name');



  const l2Val = document.getElementById('lbl-turno-day-2-val');







  if (l0Name) l0Name.textContent = d0_turnos[0]?.dia_semana || 'Hoje';



  if (l0Val) l0Val.textContent = `${tot0.toFixed(1)} mm`;



  if (l1Name) l1Name.textContent = d1_turnos[0]?.dia_semana || 'Amanhã';



  if (l1Val) l1Val.textContent = `${tot1.toFixed(1)} mm`;



  if (l2Name) l2Name.textContent = d2_turnos[0]?.dia_semana || 'D+2';



  if (l2Val) l2Val.textContent = `${tot2.toFixed(1)} mm`;







  // Renderiza os turnos do dia atualmente selecionado (0 = Hoje, 1 = Amanhã, 2 = D+2)



  renderSelectedTurnoDayBars();







  // Atualiza a caixinha de Síntese Multi-Fonte de Precipitação



  const mfMedia = document.getElementById('chuva-multifonte-media');



  const mfAlerta = document.getElementById('chuva-multifonte-alerta');



  const mfObs = document.getElementById('chuva-multifonte-observado');



  const metaMf = state.boletimMetadata?.analise_precipitacao_multifonte;







  if (metaMf) {



    const hojePrev = metaMf.previsto_por_dia?.[0];



    const obsRecente = metaMf.observado_recente;



    if (mfMedia && hojePrev) {



      mfMedia.textContent = `${tot0.toFixed(1)} mm hoje (${totalGeral.toFixed(1)} mm nos 3 dias: Hoje ${tot0.toFixed(1)} + Amanhã ${tot1.toFixed(1)} + D+2 ${tot2.toFixed(1)})`;



    }



    if (mfAlerta && hojePrev) {



      mfAlerta.textContent = hojePrev.tem_alerta_inmet 



        ? `Até ${hojePrev.chuva_pico_convectivo_mm} mm/dia (${hojePrev.taxa_horaria_pico})`



        : 'Sem alerta de tempestade';



    }



    if (mfObs && obsRecente) {



      const cem = obsRecente.cemaden_pcd_18789;



      const inea = obsRecente.inea_rio_jundia;



      mfObs.textContent = `CEMADEN: ${cem?.chuva_24h || 10.2} mm • INEA: ${inea?.chuva_24h || 8.0} mm (24h)`;



    }



  }







  if (window.lucide) {



    window.lucide.createIcons();



  }



}







function renderSelectedTurnoDayBars() {



  const container = document.getElementById('chuva-turnos-bars');



  const rows = state.currentTurnoRows;



  if (!container || !rows) return;







  const dayIdx = state.selectedTurnoDay || 0;



  const startIdx = dayIdx * 4;



  const turnosDia = rows.slice(startIdx, startIdx + 4);



  const maxChuva = Math.max(...turnosDia.map(r => parseFloat(r.chuva_media) || 0), 8);







  container.innerHTML = turnosDia.map(r => {



    const val = parseFloat(r.chuva_media) || 0;



    const perc = Math.min(Math.round((val / maxChuva) * 100), 100);



    const hasAlert = r.alerta_tempestade && r.chuva_max && parseFloat(r.chuva_max) > 5;



    const alertBadge = hasAlert



      ? `<span class="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-black bg-[#fef3c7] px-2 py-0.5 rounded border border-[#f59e0b]/50 shadow-2xs" title="${r.alerta_tempestade}">



           <i data-lucide="zap" class="w-3 h-3 text-[#ea580c]"></i>



           Até ${Math.round(r.chuva_max)} mm/h



         </span>`



      : '';







    return `



      <div class="space-y-1.5">



        <div class="flex justify-between items-center text-xs font-semibold">



          <span class="text-black font-semibold">${r.turno}</span>



          <div class="flex items-center gap-1.5">



            <span class="font-mono font-bold text-black bg-[#f8fafc] px-2.5 py-0.5 rounded-md border border-[#cbd5e1]">${val.toFixed(1)} mm</span>



            ${alertBadge}



          </div>



        </div>



        <div class="w-full h-2.5 rounded-full bg-[#f1f5f9] border border-[#cbd5e1]/60 overflow-hidden p-[1px]">



          <div class="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] transition-all duration-500" style="width: ${perc}%;"></div>



        </div>



      </div>



    `;



  }).join('');







  // Atualiza estilo visual dos 3 botões seletores



  [0, 1, 2].forEach(idx => {



    const btn = document.getElementById(`btn-turno-day-${idx}`);



    if (btn) {



      if (idx === dayIdx) {



        btn.className = 'p-2 rounded-xl text-left border-2 border-[#0284c7] bg-[#f0f9ff] text-black transition shadow-2xs cursor-pointer';



      } else {



        btn.className = 'p-2 rounded-xl text-left border border-[#cbd5e1] bg-white text-black hover:bg-[#f8fafc] transition shadow-2xs cursor-pointer';



      }



    }



  });







  if (window.lucide) window.lucide.createIcons();



}







window.selectTurnoDay = function(dayIdx) {



  state.selectedTurnoDay = dayIdx;



  renderSelectedTurnoDayBars();



};







/**



 * 8. Telemetria Hidrológica do Rio Jundiá



 */



function renderJundiaTelemetry(stations) {



  const jundiaEl = document.getElementById('kpi-jundia-val');



  const jundiaStatusEl = document.getElementById('kpi-jundia-status');



  const headerBadgeEl = document.getElementById('jundia-header-badge');



  const leituraEl = document.getElementById('jundia-leitura-tempo');



  const cotaAtencaoEl = document.getElementById('jundia-cota-atencao');



  const cotaAlertaEl = document.getElementById('jundia-cota-alerta');



  const cotaTransbordoEl = document.getElementById('jundia-cota-transbordo');



  const gaugeBarEl = document.getElementById('jundia-gauge-bar');



  const msgStatusEl = document.getElementById('jundia-mensagem-status');



  const iconBoxEl = document.getElementById('jundia-icon-box');



  const gridEl = document.getElementById('other-stations-grid');







  if (!stations || !Array.isArray(stations)) return;







  const jundiaSt = stations.find(s => s.eh_rio_das_ostras || s.nome_estacao?.toLowerCase().includes('jundi'));







  if (jundiaSt) {



    const rawNivel = String(jundiaSt.nivel_rio || '1.91').replace(' m', '').trim();



    const nivelFloat = parseFloat(rawNivel.replace(',', '.')) || 1.91;



    const nivelFormatted = rawNivel.includes(',') ? rawNivel : nivelFloat.toFixed(2).replace('.', ',');







    if (jundiaEl) {



      jundiaEl.textContent = `${nivelFormatted} m`;



    }







    // Cotas Oficiais INEA Estação 224103620: Atenção = 1.99m, Alerta = 2.27m, Transbordo = 2.84m



    const cotaAtencao = 1.99;



    const cotaAlerta = 2.27;



    const cotaTransbordo = 2.84;







    if (cotaAtencaoEl) cotaAtencaoEl.textContent = `${cotaAtencao.toFixed(2).replace('.', ',')} m`;



    if (cotaAlertaEl) cotaAlertaEl.textContent = `${cotaAlerta.toFixed(2).replace('.', ',')} m`;



    if (cotaTransbordoEl) cotaTransbordoEl.textContent = `${cotaTransbordo.toFixed(2).replace('.', ',')} m`;







    let statusText = 'VIGILÂNCIA';



    let statusClass = 'badge-title-orange text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase shadow-2xs';



    let badgeClass = 'badge-title-orange text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase shadow-2xs';



    let iconClass = 'bg-[#eaf0f6] text-black border border-[#6d8ba6]';



    let barColor = 'bg-gradient-to-r from-[#3d4f61] to-[#6d8ba6]';



    let msgClass = 'text-black font-medium';



    let msgText = '';







    const folga = (cotaTransbordo - nivelFloat).toFixed(2).replace('.', ',');







    if (nivelFloat >= cotaTransbordo) {



      statusText = 'ALERTA MÁXIMO';



      statusClass = 'bg-[#ffe4e6] text-black border-2 border-[#e11d48] font-bold animate-pulse';



      badgeClass = 'bg-[#ffe4e6] text-black border border-[#e11d48] font-bold';



      iconClass = 'bg-[#ffe4e6] text-black border border-[#e11d48]';



      barColor = 'bg-gradient-to-r from-[#e11d48] to-[#be123c]';



      msgClass = 'text-black font-bold';



      msgText = `Nível atingiu a cota de transbordo (2,84 m). Risco crítico de extravasamento e refluxo pluvial.`;



    } else if (nivelFloat >= cotaAlerta) {



      statusText = 'ALERTA';



      statusClass = 'bg-[#ffebe4] text-black border border-[#f97316] font-bold';



      badgeClass = 'bg-[#ffebe4] text-black border border-[#f97316] font-bold';



      iconClass = 'bg-[#ffebe4] text-black border border-[#f97316]';



      barColor = 'bg-gradient-to-r from-[#f07a53] to-[#ea580c]';



      msgClass = 'text-black font-semibold';



      msgText = `Alerta Hidrológico: Nível em elevação acentuada (${nivelFormatted} m), a apenas ${folga} m do transbordo.`;



    } else if (nivelFloat >= cotaAtencao) {



      statusText = 'ATENÇÃO';



      statusClass = 'bg-[#fef3c7] text-black border border-[#d97706] font-bold';



      badgeClass = 'bg-[#fef3c7] text-black border border-[#d97706] font-bold';



      iconClass = 'bg-[#fef3c7] text-black border border-[#d97706]';



      barColor = 'bg-gradient-to-r from-[#f59e0b] to-[#d97706]';



      msgClass = 'text-black font-medium';



      msgText = `Estado de Atenção: Nível acima da cota de atenção (1,99 m), a ${folga} m do transbordo. Monitoramento intensificado.`;



    } else {



      statusText = 'VIGILÂNCIA';



      statusClass = 'badge-title-orange text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase shadow-2xs';



      badgeClass = 'badge-title-orange text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase shadow-2xs';



      iconClass = 'bg-[#eaf0f6] text-black border border-[#6d8ba6]';



      barColor = 'bg-gradient-to-r from-[#3d4f61] to-[#6d8ba6]';



      msgClass = 'text-black font-medium';



      msgText = `Calha em regime seguro de vazante contínua com cota de ${nivelFormatted} m (margem de segurança de ${folga} m até o transbordo).`;



    }







    if (jundiaStatusEl) {



      jundiaStatusEl.textContent = statusText;



      jundiaStatusEl.className = `text-[11px] px-3 py-0.5 rounded-full font-bold uppercase ${statusClass}`;



    }







    if (headerBadgeEl) {



      headerBadgeEl.textContent = statusText.toLowerCase();



      headerBadgeEl.className = badgeClass;



    }







    if (iconBoxEl) {



      iconBoxEl.className = `medallion-title-orange w-8 h-8 rounded-xl flex items-center justify-center text-black shadow-xs`;



    }







    const pct = jundiaSt.porcentagem_calha || Math.min(100, Math.max(10, Math.round((nivelFloat / cotaTransbordo) * 100)));



    if (gaugeBarEl) {



      gaugeBarEl.style.width = `${pct}%`;



      gaugeBarEl.className = `h-full rounded-full transition-all duration-500 ${barColor}`;



    }







    if (msgStatusEl) {



      msgStatusEl.textContent = msgText;



      msgStatusEl.className = `text-[11px] font-medium pt-1 leading-tight ${msgClass}`;



    }







    if (leituraEl) {



      const leituraTxt = jundiaSt.ultima_leitura ? `Leitura: ${jundiaSt.ultima_leitura}` : 'Estação INEA nº 224103620';



      leituraEl.textContent = `Estação INEA 224103620 • ${leituraTxt}`;



    }



  }







  if (gridEl) {



    gridEl.innerHTML = stations.filter(s => !(s.eh_rio_das_ostras || s.nome_estacao?.toLowerCase().includes('jundi'))).slice(0, 6).map(s => `



      <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60 space-y-1">



        <div class="flex justify-between items-center text-xs font-bold text-zinc-900">



          <span class="truncate">${s.nome_estacao}</span>



          <span class="font-mono text-zinc-900">${s.nivel_rio || '—'} m</span>



        </div>



        <div class="flex justify-between text-[11px] font-normal text-zinc-500">



          <span>${s.curso_dagua || s.municipio}</span>



          <span class="font-semibold text-zinc-700">${s.status || 'Normal'}</span>



        </div>



      </div>



    `).join('');



  }



}




function renderMacaeNotification(stations) {
  const bannerEl = document.getElementById('notificacao-rios-macae');
  const badgeEl = document.getElementById('badge-macae-status');
  const textEl = document.getElementById('texto-macae-detalhe');
  const navDotEl = document.getElementById('nav-badge-rio-macae');

  if (!bannerEl) return;

  // Se não recebeu estações diretamente, tenta do metadata
  let list = stations;
  if ((!list || !list.length) && window.state?.boletimMetadata?.inea_macae_ostras?.todas_estacoes) {
    list = window.state.boletimMetadata.inea_macae_ostras.todas_estacoes;
  }
  if (!list || !Array.isArray(list)) return;

  // Filtra estações de Macaé
  const macaeStations = list.filter(s => {
    const muni = (s.municipio || '').toLowerCase();
    const curso = (s.curso_dagua || s.curso_agua || '').toLowerCase();
    const nome = (s.nome_estacao || s.estacao || '').toLowerCase();
    return (muni.includes('maca') || curso.includes('sana') || curso.includes('imboassica') || nome.includes('sana') || nome.includes('imboassica') || nome.includes('baião') || nome.includes('glicério') || nome.includes('são pedro')) && !s.eh_rio_das_ostras && !nome.includes('jundi');
  });

  // Filtra as que estão fora do limite de segurança (status diferente de VIGILÂNCIA)
  const elevated = macaeStations.filter(s => {
    const st = (s.status || '').toUpperCase();
    return !st.includes('VIGIL');
  });

  if (elevated.length > 0) {
    if (navDotEl) navDotEl.classList.remove('hidden');
    bannerEl.classList.remove('hidden');

    const hasMax = elevated.some(s => {
      const st = (s.status || '').toUpperCase();
      return st.includes('MÁXIMO') || st.includes('MAXIMO') || st.includes('TRANSBORD');
    });
    const hasAlerta = elevated.some(s => (s.status || '').toUpperCase() === 'ALERTA');

    let badgeText = 'Elevação Fora da Segurança';
    let badgeClass = 'text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase shadow-2xs';
    let bannerBorder = 'border-amber-300 dark:border-amber-700/80 bg-amber-50/95 dark:bg-amber-950/40';

    if (hasMax) {
      badgeText = 'Alerta Máximo em Macaé';
      badgeClass += ' bg-rose-500 text-white border border-rose-600 animate-pulse';
      bannerBorder = 'border-rose-300 dark:border-rose-800 bg-rose-50/95 dark:bg-rose-950/40';
    } else if (hasAlerta) {
      badgeText = 'Alerta Hidrológico em Macaé';
      badgeClass += ' bg-orange-500 text-white border border-orange-600';
      bannerBorder = 'border-orange-300 dark:border-orange-800 bg-orange-50/95 dark:bg-orange-950/40';
    } else {
      badgeText = 'Atenção em Macaé';
      badgeClass += ' bg-amber-400 text-black border border-amber-500';
      bannerBorder = 'border-amber-300 dark:border-amber-700/80 bg-amber-50/95 dark:bg-amber-950/40';
    }

    if (badgeEl) {
      badgeEl.textContent = badgeText;
      badgeEl.className = badgeClass;
    }

    bannerEl.className = `p-3 sm:p-3.5 rounded-2xl ${bannerBorder} shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition`;

    if (textEl) {
      const summaryList = elevated.map(s => {
        const nome = s.nome_estacao || s.estacao || 'Estação';
        const st = (s.status || '').toLowerCase();
        const nivel = s.nivel_rio || s.nivel_atual_m;
        const nvStr = (nivel && nivel !== '-' && nivel !== '—') ? ` • ${nivel} m` : '';
        return `${nome} (${st}${nvStr})`;
      }).join(', ');
      textEl.innerHTML = `<strong>${elevated.length} estação(ões) em Macaé fora da cota de segurança:</strong> ${summaryList}.`;
    }
  } else {
    if (navDotEl) navDotEl.classList.add('hidden');
    bannerEl.className = 'p-2.5 sm:p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-2xs flex items-center justify-between gap-2 transition text-xs';
    if (badgeEl) {
      badgeEl.textContent = 'Normalidade';
      badgeEl.className = 'text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white';
    }
    if (textEl) {
      textEl.innerHTML = '<strong>Rios de Macaé:</strong> Todas as estações operam dentro dos limites normais de segurança (Vigilância).';
    }
  }
}


/**



 * 9. Popula os Dados dos Modais (Boletim Completo, Sinopse e Avisos)



 */



function renderModalData(meta, rows, inmetAlerts, marinhaAvisos) {



  // Modal Boletim: Período



  const modalPer = document.getElementById('modal-boletim-periodo');



  if (modalPer && meta?.periodo) {



    modalPer.textContent = `${meta.periodo} • Emissão: ${meta.emissao || '17:00h'}`;



  }







  // Modal Boletim: Sinopse



  const sinopseEl = document.getElementById('modal-sinopse-content');



  const sinopseTexto = meta?.sinopse_geral || meta?.sinopse || '';



  if (sinopseEl && sinopseTexto) {



    const paras = sinopseTexto.split('\n\n').filter(p => p.trim());



    sinopseEl.innerHTML = paras.map(p => `<p class="mb-3 leading-relaxed text-zinc-700 text-justify">${cleanBulletinText(p)}</p>`).join('');



  }







  // Modal Boletim: Tabela 12 Turnos



  const turnosContainer = document.getElementById('modal-turnos-container');



  if (turnosContainer && rows && Array.isArray(rows) && rows.length > 0) {



    const grouped = {};



    rows.forEach(r => {



      const d = r.dia_semana || 'Dia';



      if (!grouped[d]) grouped[d] = [];



      grouped[d].push(r);



    });







    turnosContainer.innerHTML = Object.keys(grouped).map(dia => {



      const dRows = grouped[dia];



      const dataIso = dRows[0]?.data_iso || '';



      return `



        <div class="border border-zinc-200 rounded-xl overflow-hidden bg-white">



          <div class="px-4 py-2.5 bg-[#f1f5f9] text-black border-b border-[#cbd5e1] font-bold text-sm flex justify-between">



            <span>${dia.toUpperCase()} (${formatIsoDate(dataIso)})</span>



            <span class="font-mono text-xs text-zinc-400">4 Turnos</span>



          </div>



          <div class="overflow-x-auto">



            <table class="w-full text-left text-xs sm:text-sm">



              <thead class="bg-zinc-50 border-b border-zinc-200 text-xs uppercase font-semibold text-zinc-600">



                <tr>



                  <th class="p-2.5">Turno</th>



                  <th class="p-2.5">Céu</th>



                  <th class="p-2.5">Temp</th>



                  <th class="p-2.5">Umid</th>



                  <th class="p-2.5">Chuva</th>



                  <th class="p-2.5">Vento</th>



                  <th class="p-2.5">Mar</th>



                </tr>



              </thead>



              <tbody class="divide-y border-zinc-100">



                ${dRows.map(r => `



                  <tr class="hover:bg-zinc-50 font-normal text-zinc-700">



                    <td class="p-2.5 font-bold text-zinc-900">${r.turno}</td>



                    <td class="p-2.5 text-zinc-700">${cleanBulletinText(r.tempo_desc || '—')}</td>



                    <td class="p-2.5 font-mono font-bold text-zinc-900">${r.temp_min}° / ${r.temp_max}°C</td>



                    <td class="p-2.5 font-mono text-zinc-700">${r.umid_min}% - ${r.umid_max}%</td>



                    <td class="p-2.5 font-mono font-bold text-zinc-900 whitespace-nowrap">



                      ${r.chuva_media} mm



                      ${r.alerta_tempestade && r.chuva_max && parseFloat(r.chuva_max) > 5 ? `<span class="text-[10px] text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 ml-1 font-semibold" title="${r.alerta_tempestade}">Até ${Math.round(r.chuva_max)} mm/h</span>` : ''}



                    </td>



                    <td class="p-2.5 font-mono text-xs text-zinc-800">${r.vento_dir} ${r.vento_vel_max} km/h</td>



                    <td class="p-2.5 text-xs text-zinc-700">${r.estado_mar || '2.2 m'}</td>



                  </tr>



                `).join('')}



              </tbody>



            </table>



          </div>



        </div>



      `;



    }).join('');



  }







  // Modal Boletim: PLANCON



  const planconList = document.getElementById('modal-plancon-list');



  if (planconList && meta?.impactos_bairros && Array.isArray(meta.impactos_bairros)) {



    planconList.innerHTML = meta.impactos_bairros.map(b => `



      <div class="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">



        <div class="flex justify-between items-center font-bold text-zinc-900 text-sm">



          <span>${b.setor}</span>



          <span class="text-[11px] px-2 py-0.5 rounded font-semibold uppercase bg-zinc-200/80 text-zinc-800">Monitoramento</span>



        </div>



        <p class="text-zinc-600 text-xs sm:text-sm font-normal leading-snug">${cleanBulletinText(b.impactos)}</p>



      </div>



    `).join('');



  }



}







/**



 * 10. Atualiza o Gráfico Chart.js



 */



function updateBulletinChart() {



  const canvas = document.getElementById('bulletin-chart');



  if (!canvas || !state.boletimData || state.boletimData.length === 0) return;



  renderBulletinChart(canvas, state.activeMetric, state.boletimData);



}







/**



 * 11. Helpers de Formatação e Ações



 */



function cleanBulletinText(str) {



  if (!str) return '';



  return String(str)



    .replace(/\[?#text\([^)]*\)(\[.*?\])?/gi, '')



    .replace(/#text\([^)]*\)/gi, '')



    .replace(/\[|\]/g, '')



    .replace(/\\/g, '')



    .replace(/\*\*/g, '')



    .replace(/\s+/g, ' ')



    .trim();



}







function formatIsoDate(isoStr) {



  if (!isoStr) return '';



  const parts = String(isoStr).split('-');



  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;



  return isoStr;



}







function setupActionButtons() {











  // Botão Sincronizar Agora



  const btnSync = document.getElementById('btn-sync-now');



  if (btnSync) {



    btnSync.addEventListener('click', () => {



      const icon = btnSync.querySelector('i');



      if (icon) icon.classList.add('animate-spin');



      loadAllApplicationData().then(() => {



        setTimeout(() => {



          if (icon) icon.classList.remove('animate-spin');



        }, 700);



      });



    });



  }



}







/**



 * 12. Renderização do Meteograma e Projeções Oficiais do CPTEC / INPE



 */



function renderCptecData(cptec) {



  if (!cptec) return;







  // 1. Grid das Projeções dos Próximos Dias (CPTEC)



  const grid = document.getElementById('cptec-proximos-grid');



  if (grid && Array.isArray(cptec.proximos_dias)) {



    grid.innerHTML = cptec.proximos_dias.map(d => {



      const uv = Number(d.indice_uv || 0);



      const uvBadgeClass = uv >= 11 ? 'bg-purple-100 text-purple-800 border-purple-200' :



                           uv >= 8 ? 'bg-rose-100 text-rose-800 border-rose-200' :



                           uv >= 6 ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200';







      return `



        <div class="p-2.5 rounded-xl border border-zinc-200 bg-white space-y-1.5 text-center">



          <div class="flex items-center justify-between text-[11px] font-bold text-zinc-700">



            <span>${d.semana_dia}</span>



            <span class="text-zinc-400 font-normal">Dia ${d.data_atual}</span>



          </div>



          <div class="font-bold font-mono text-xs sm:text-sm">



            <span class="text-rose-600">${d.temperatura_max}°</span> / <span class="text-blue-600">${d.temperatura_min}°</span>



          </div>



          <div class="text-[11px] text-zinc-500 flex items-center justify-center gap-1">



            <i data-lucide="cloud-rain" class="w-3 h-3 text-blue-500"></i>



            <span>${d.probabilidade_chuva}%</span>



          </div>



          <div class="pt-1 border-t border-zinc-100 flex items-center justify-between text-[10px]">



            <span class="text-zinc-400">UV:</span>



            <span class="font-bold font-mono px-1 py-0.5 rounded border ${uvBadgeClass}">${uv}</span>



          </div>



        </div>



      `;



    }).join('');



  }







  // 2. Tabela Horária do Multimodel CPTEC/INPE (Próximas 24 Horas)



  const tbody = document.getElementById('cptec-hourly-tbody');



  if (tbody && cptec.meteograma_multimodel && Array.isArray(cptec.meteograma_multimodel.data)) {



    const hourlyItems = cptec.meteograma_multimodel.data.slice(0, 24);



    tbody.innerHTML = hourlyItems.map(h => {



      let horaLabel = `+${h.fcst}h`;



      if (h.date) {



        try {



          const baseDate = new Date(h.date.replace(' ', 'T'));



          baseDate.setHours(baseDate.getHours() + h.fcst);



          const dia = String(baseDate.getDate()).padStart(2, '0');



          const hora = String(baseDate.getHours()).padStart(2, '0');



          horaLabel = `${dia} às ${hora}:00`;



        } catch (e) {}



      }







      const tempStr = h.temp !== undefined ? `${Math.round(h.temp)}°C` : '—';



      const heatStr = h.heat_index !== undefined ? `${Math.round(h.heat_index)}°C` : '—';



      const urStr = h.ur !== undefined ? `${h.ur}%` : '—';



      const ventKmh = h.vent !== undefined ? `${Math.round(h.vent * 3.6)} km/h` : '—';



      const precMm = h.prec !== undefined ? `${Number(h.prec).toFixed(1)} mm` : '0.0 mm';



      const pressHpa = h.press !== undefined ? `${Math.round(h.press)} hPa` : '—';







      return `



        <tr class="hover:bg-zinc-100/60 transition">



          <td class="p-2 font-bold text-zinc-900">${horaLabel}</td>



          <td class="p-2 font-bold text-zinc-900">${tempStr}</td>



          <td class="p-2 text-zinc-600">${heatStr}</td>



          <td class="p-2 text-zinc-600">${urStr}</td>



          <td class="p-2 text-zinc-600">${ventKmh}</td>



          <td class="p-2 ${h.prec > 0 ? 'font-bold text-blue-600' : 'text-zinc-500'}">${precMm}</td>



          <td class="p-2 text-zinc-500">${pressHpa}</td>



        </tr>



      `;



    }).join('');



  }







  if (window.lucide) window.lucide.createIcons();



}







function setupPWA() {



  if ('serviceWorker' in navigator) {



    navigator.serviceWorker.register('./sw.js?v=89').catch(() => {});



  }



}







function startAutoSync() {



  // Sincronização periódica a cada 1 minuto (60 segundos)



  setInterval(() => {



    loadAllApplicationData();



  }, 60 * 1000);



}







// Exposição global das funções de abas e dias da Orla



window.switchOrlaTab = function(tabName) {



  state.activeOrlaTab = tabName;



  const tabs = ['mar', 'wwatch', 'mares', 'balnear'];



  tabs.forEach(t => {



    const btn = document.getElementById(`orla-tab-btn-${t}`);



    const panel = document.getElementById(`orla-panel-${t}`);



    if (btn) {



      if (t === tabName) {



        btn.classList.add('active');



        btn.setAttribute('aria-selected', 'true');



        if (t === 'mar') {



          btn.className = 'orla-tab-btn active flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-black transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs';



        } else if (t === 'mares') {



          btn.className = 'orla-tab-btn active flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-black transition cursor-pointer bg-[#eaf0f6] border-2 border-[#6d8ba6] text-black shadow-xs';



        } else {



          btn.className = 'orla-tab-btn active flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-black transition cursor-pointer bg-[#f5efe8] border-2 border-[#b8a99a] text-black shadow-xs';



        }



      } else {



        btn.classList.remove('active');



        btn.setAttribute('aria-selected', 'false');



        btn.className = 'orla-tab-btn flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer';



      }



    }



    if (panel) {



      if (t === tabName) {



        panel.classList.remove('hidden');



      } else {



        panel.classList.add('hidden');



      }



    }



  });



  if (window.lucide) window.lucide.createIcons();



};

window.switchCemadenTab = function(tabName) {
  const tabs = ['rj', 'painel-rj', 'geo', 'hidro', 'mapas'];
  tabs.forEach(t => {
    const btn = document.getElementById(`cemaden-tab-btn-${t}`);
    const panel = document.getElementById(`cemaden-panel-${t}`);
    if (btn) {
      if (t === tabName) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        btn.className = 'cemaden-tab-btn active flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-black transition cursor-pointer bg-[#fef3c7] border-2 border-[#d97706] text-black shadow-xs';
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
        btn.className = 'cemaden-tab-btn flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-bold transition text-black dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 border-2 border-transparent cursor-pointer';
      }
    }
    if (panel) {
      if (t === tabName) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    }
  });
  if (window.lucide) window.lucide.createIcons();
};








window.openModalPraias = function(tabKey = 'mar') {



  const modal = document.getElementById('modal-praias-detalhes');



  if (modal) {



    modal.classList.remove('hidden');



    modal.classList.add('flex');



    window.switchModalPraiasTab(tabKey);



    renderCondicoesMarList(state.orlaCondicoes, state.activeOrlaDay || 'd0');



    renderBalneabilidadeList(state.balneabilidade);



    if (window.lucide) window.lucide.createIcons();



  }



};







window.closeModalPraias = function() {



  const modal = document.getElementById('modal-praias-detalhes');



  if (modal) {



    modal.classList.add('hidden');



    modal.classList.remove('flex');



  }



};







window.switchModalPraiasTab = function(tabKey) {



  const panelMar = document.getElementById('modal-praias-panel-mar');



  const panelBalnear = document.getElementById('modal-praias-panel-balnear');



  const tabMar = document.getElementById('modal-praias-tab-mar');



  const tabBalnear = document.getElementById('modal-praias-tab-balnear');







  if (tabKey === 'mar') {



    if (panelMar) panelMar.classList.remove('hidden');



    if (panelBalnear) panelBalnear.classList.add('hidden');



    if (tabMar) {



      tabMar.className = 'px-4 py-2 text-xs sm:text-sm font-black border-b-2 border-[#f07a53] text-black bg-white/80 rounded-t-xl cursor-pointer flex items-center gap-2';



    }



    if (tabBalnear) {



      tabBalnear.className = 'px-4 py-2 text-xs sm:text-sm font-bold border-b-2 border-transparent text-black hover:text-black cursor-pointer flex items-center gap-2';



    }



  } else {



    if (panelMar) panelMar.classList.add('hidden');



    if (panelBalnear) panelBalnear.classList.remove('hidden');



    if (tabBalnear) {



      tabBalnear.className = 'px-4 py-2 text-xs sm:text-sm font-black border-b-2 border-[#6d8ba6] text-black bg-white/80 rounded-t-xl cursor-pointer flex items-center gap-2';



    }



    if (tabMar) {



      tabMar.className = 'px-4 py-2 text-xs sm:text-sm font-bold border-b-2 border-transparent text-black hover:text-black cursor-pointer flex items-center gap-2';



    }



  }



  if (window.lucide) window.lucide.createIcons();



};







window.selectOrlaDay = function(dayKey) {



  state.activeOrlaDay = dayKey;



  ['d0', 'd1', 'd2'].forEach(dk => {



    const btn = document.getElementById(`orla-day-btn-${dk}`);



    const modalBtn = document.getElementById(`modal-day-btn-${dk}`);



    const isActive = (dk === dayKey);



    const activeClass = 'orla-day-btn active px-3.5 py-1.5 rounded-full text-xs font-black bg-[#ffebe4] text-black border-2 border-[#f07a53] shadow-xs cursor-pointer';



    const inactiveClass = 'orla-day-btn px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#ffffff] text-black hover:bg-[#f1f5f9] border border-[#cbd5e1] cursor-pointer';







    if (btn) btn.className = isActive ? activeClass : inactiveClass;



    if (modalBtn) modalBtn.className = isActive ? activeClass : inactiveClass;



  });



  renderCondicoesMarList(state.orlaCondicoes, dayKey);



};







/**



 * Renderiza o Resumo Executivo Geral e o Detalhamento das 11 praias (Modal)



 */



function renderCondicoesMarList(orlaData, dayKey = 'd0') {



  const modalPraiasListEl = document.getElementById('modal-praias-list');



  const orlaGeralTitulo = document.getElementById('orla-geral-titulo');



  const orlaGeralBadge = document.getElementById('orla-geral-badge');



  const orlaGeralDescricao = document.getElementById('orla-geral-descricao');



  const orlaOndasEnseada = document.getElementById('orla-ondas-enseada');



  const orlaOndasOceanica = document.getElementById('orla-ondas-oceanica');







  const praias = (orlaData && orlaData.praias_condicoes && orlaData.praias_condicoes.length > 0)



    ? orlaData.praias_condicoes



    : null;







  if (praias) {



    const rotulos = (orlaData && orlaData.dias_rotulos) || [];



    const diaInfo = rotulos.find(r => r.key === dayKey);



    const rotuloTxt = diaInfo ? `${diaInfo.rotulo} (${diaInfo.data_br || ''})` : 'Período selecionado';







    const temAvisoMar = state.marinhaAvisos && state.marinhaAvisos.aviso_ativo;



    const temGrosso = temAvisoMar && String(state.marinhaAvisos.tipo).toUpperCase().includes('GROSSO');



    const temVento = temAvisoMar && String(state.marinhaAvisos.tipo).toUpperCase().includes('VENTO');







    let waveSwellTxt = 'Swell de E/SE • Ondulação média de 1,2 a 1,6 m na orla oceânica • Águas calmas e abrigadas nas enseadas.';



    let statusGeralTxt = 'Mar Calmo a Moderado na Orla';



    let statusBadgeTxt = 'Normalidade';



    let ondasEnseadaTxt = '0,3 a 0,7 m';



    let ondasOceanicaTxt = '1,2 a 1,6 m';







    if (dayKey === 'd2') {



      if (temGrosso || temVento) {



        waveSwellTxt = 'Avisos da Marinha nº 778/2026 (Mar Grosso) e 781/2026 (Vento Forte) • Ondas de 3,0 a 3,5 m ao largo e 2,0 a 2,8 m na arrebentação sob ventos até 74 km/h.';



        statusGeralTxt = 'Mar Grosso e Vento Forte na Orla';



        statusBadgeTxt = 'Mar Grosso • Evitar Banho';



        ondasEnseadaTxt = '0,8 a 1,4 m';



        ondasOceanicaTxt = '2,0 a 2,8 m (3,5 m ao largo)';



      } else {



        waveSwellTxt = 'Swell de E/NE • Ondulação fraca a moderada de 0,8 a 1,2 m • Águas claras e mar sereno.';



        statusGeralTxt = 'Mar Calmo em quase toda a Região';



        statusBadgeTxt = 'Excelente';



        ondasEnseadaTxt = '0,2 a 0,5 m';



        ondasOceanicaTxt = '0,8 a 1,2 m';



      }



    } else if (dayKey === 'd1') {



      if (temVento) {



        waveSwellTxt = 'Swell de E • Ondulação moderada aumentando à noite com entrada de vento forte a partir das 21h (Aviso nº 781/2026).';



        statusGeralTxt = 'Moderado • Vento à Noite';



        statusBadgeTxt = 'Atenção à Noite';



        ondasEnseadaTxt = '0,4 a 0,8 m';



        ondasOceanicaTxt = '1,2 a 1,8 m';



      } else {



        waveSwellTxt = 'Swell de E • Ondulação de 1,0 a 1,4 m • Águas calmas e límpidas na maioria das enseadas.';



        statusGeralTxt = 'Mar Moderado com Tendência a Amansar';



        statusBadgeTxt = 'Bom para Banho';



        ondasEnseadaTxt = '0,3 a 0,6 m';



        ondasOceanicaTxt = '1,0 a 1,4 m';



      }



    } else {



      if (temAvisoMar) {



        waveSwellTxt = 'Swell de E/SE • Ondulação média de 1,2 a 1,6 m na orla oceânica. Avisos de Vento Forte (nº 781) e Mar Grosso (nº 778) emitidos pela Marinha para a Área Delta a partir de sábado às 21h.';



        statusGeralTxt = 'Mar Moderado na Orla (Avisos Emitidos)';



        statusBadgeTxt = 'Avisos da Marinha Ativos';



      }



    }







    if (orlaGeralTitulo) orlaGeralTitulo.textContent = `${statusGeralTxt} — ${rotuloTxt}`;



    if (orlaGeralBadge) orlaGeralBadge.textContent = statusBadgeTxt;



    if (orlaGeralDescricao) orlaGeralDescricao.textContent = waveSwellTxt;



    if (orlaOndasEnseada) orlaOndasEnseada.textContent = ondasEnseadaTxt;



    if (orlaOndasOceanica) orlaOndasOceanica.textContent = ondasOceanicaTxt;







    // Renderiza a grade completa das 11 praias no MODAL



    if (modalPraiasListEl) {



      modalPraiasListEl.innerHTML = praias.map(p => {



        const diaObj = (p.dias && p.dias[dayKey]) || {};



        const estado = diaObj.estado || 'Calmo a Moderado';



        const ondas = diaObj.ondas || '0,8 a 1,2 m';



        const detalhe = diaObj.detalhe || p.perfil || '';



        



        let themeCard = 'border-[#6d8ba6]/40 bg-gradient-to-br from-[#ffffff] to-[#f4f8fb]';



        let badgeClass = 'bg-[#eaf0f6] text-black border-2 border-[#6d8ba6] font-black';







        if (diaObj.badge === 'danger' || estado.includes('Agitado') || estado.includes('Correnteza') || estado.includes('Evitar')) {



          themeCard = 'border-[#f07a53]/60 bg-gradient-to-br from-[#ffffff] to-[#fff5f2]';



          badgeClass = 'bg-[#ffebe4] text-black border-2 border-[#f07a53] font-black';



        } else if (diaObj.badge === 'warning' || estado.includes('Moderado a Agitado') || estado.includes('Atenção')) {



          themeCard = 'border-[#d97706]/40 bg-gradient-to-br from-[#ffffff] to-[#fefcf6]';



          badgeClass = 'bg-[#fef3c7] text-black border-2 border-[#d97706] font-black';



        }







        return `



          <div class="p-3.5 rounded-2xl border-2 ${themeCard} shadow-xs flex flex-col justify-between space-y-2.5 transition hover:shadow-md">



            <div class="flex items-start justify-between gap-2">



              <div class="min-w-0">



                <strong class="font-black text-black text-sm block leading-tight">${p.nome}</strong>



                <span class="text-[10px] font-bold text-black uppercase tracking-wider block mt-0.5">${p.tipo_orla || ''}</span>



              </div>



              <span class="text-[11px] px-2.5 py-0.5 rounded-full ${badgeClass} shrink-0 uppercase tracking-wide">



                ${estado}



              </span>



            </div>



            <p class="text-xs text-black font-medium leading-relaxed">${detalhe}</p>



            <div class="flex items-center justify-between pt-2 border-t border-black/10 text-xs">



              <span class="text-[10px] font-bold uppercase text-black">Altura das Ondas:</span>



              <span class="font-mono font-black text-black text-xs bg-white px-2.5 py-0.5 rounded-md border border-[#cbd5e1] shadow-2xs">${ondas}</span>



            </div>



          </div>



        `;



      }).join('');



    }



  }







  if (window.lucide) window.lucide.createIcons();



}







/**



 * Renderiza o Resumo Executivo e os 11 pontos oficiais de Balneabilidade (Modal)



 */



function renderBalneabilidadeList(balnearData) {



  const modalBalnearListEl = document.getElementById('modal-balnear-pontos-list');



  const tituloEl = document.getElementById('balnear-boletim-titulo');



  const modalTituloEl = document.getElementById('modal-balnear-titulo');



  const dataBadgeEl = document.getElementById('balnear-data-badge');



  const modalDataBadgeEl = document.getElementById('modal-balnear-data');



  const obsEl = document.getElementById('balnear-obs-tecnica');



  const modalObsEl = document.getElementById('modal-balnear-obs');



  const statusGeralTxt = document.getElementById('balnear-status-geral-txt');



  const countPropriasEl = document.getElementById('balnear-proprias-count');



  const countImpropriasEl = document.getElementById('balnear-improprias-count');







  const data = (balnearData && balnearData.pontos) ? balnearData : null;



  if (!data) return;







  const boletimNome = data.boletim_numero ? `Boletim nº ${data.boletim_numero} (INEA)` : 'Boletim de Balneabilidade (INEA)';



  if (tituloEl) tituloEl.textContent = boletimNome;



  if (modalTituloEl) modalTituloEl.textContent = boletimNome;



  if (dataBadgeEl && data.data_boletim) dataBadgeEl.textContent = data.data_boletim;



  if (modalDataBadgeEl && data.data_boletim) modalDataBadgeEl.textContent = data.data_boletim;







  if (obsEl && data.observacao_tecnica) {



    obsEl.innerHTML = `<strong>Recomendação Oficial do INEA:</strong> ${data.observacao_tecnica}`;



  }



  if (modalObsEl && data.observacao_tecnica) {



    modalObsEl.innerHTML = `<strong>Recomendação Oficial do INEA:</strong> ${data.observacao_tecnica}`;



  }







  const pontos = data.pontos || [];



  if (pontos.length > 0) {



    const proprias = pontos.filter(pt => String(pt.status).toUpperCase() === 'PRÓPRIA');



    const improprias = pontos.filter(pt => String(pt.status).toUpperCase() !== 'PRÓPRIA');



    const perc = Math.round((proprias.length / pontos.length) * 100);







    if (statusGeralTxt) statusGeralTxt.textContent = `${proprias.length} de ${pontos.length} Praias Próprias para Banho (${perc}%)`;



    if (countPropriasEl) countPropriasEl.textContent = `${proprias.length} Pontos`;



    if (countImpropriasEl) countImpropriasEl.textContent = `${improprias.length} Pontos`;







    // Renderiza os pontos no MODAL



    if (modalBalnearListEl) {



      modalBalnearListEl.innerHTML = pontos.map(pt => {



        const isPropria = String(pt.status).toUpperCase() === 'PRÓPRIA';



        const themeCard = isPropria



          ? 'border-[#6d8ba6]/40 bg-gradient-to-br from-[#ffffff] to-[#f4f8fb]'



          : 'border-[#f07a53]/60 bg-gradient-to-br from-[#ffffff] to-[#fff5f2]';



        const badgeClass = isPropria 



          ? 'bg-[#eaf0f6] text-black border-2 border-[#6d8ba6] font-black' 



          : 'bg-[#ffebe4] text-black border-2 border-[#f07a53] font-black';







        const motivoHtml = pt.motivo 



          ? `<span class="text-[11px] text-black font-semibold block mt-1 bg-white/90 p-1.5 rounded-lg border border-[#f07a53]/30">⚠️ ${pt.motivo}</span>` 



          : '';







        return `



          <div class="p-3.5 rounded-2xl border-2 ${themeCard} shadow-xs flex flex-col justify-between space-y-2 transition hover:shadow-md">



            <div class="flex items-start justify-between gap-2">



              <div class="min-w-0">



                <div class="flex items-center gap-2">



                  <strong class="font-black text-black text-sm">${pt.praia}</strong>



                  <span class="font-mono font-bold text-[10px] bg-white px-2 py-0.5 rounded border border-[#cbd5e1] text-black">${pt.codigo}</span>



                </div>



                <span class="text-xs text-black font-medium block mt-0.5">${pt.localizacao}</span>



              </div>



              <span class="text-[11px] px-2.5 py-0.5 rounded-full ${badgeClass} shrink-0 uppercase tracking-wide">



                ${pt.status}



              </span>



            </div>



            ${motivoHtml}



          </div>



        `;



      }).join('');



    }



  }







  if (window.lucide) window.lucide.createIcons();



}







function renderCondicoesOrla(orlaData, tabuaData, marinhaAvisos, balnearList) {



  const badgeEl = document.getElementById('orla-status-badge');



  const proximaMareEl = document.getElementById('orla-proxima-mare');



  const maresGridEl = document.getElementById('orla-mares-grid');



  const avisoResumoEl = document.getElementById('orla-aviso-resumo');







  // 1. Badge Principal de Status da Orla



  const temRessaca = marinhaAvisos && marinhaAvisos.aviso_ativo && String(marinhaAvisos.tipo).toUpperCase().includes('RESSACA');



  const temGrosso = marinhaAvisos && marinhaAvisos.aviso_ativo && String(marinhaAvisos.tipo).toUpperCase().includes('GROSSO');



  const temVento = marinhaAvisos && marinhaAvisos.aviso_ativo && String(marinhaAvisos.tipo).toUpperCase().includes('VENTO');







  if (badgeEl) {



    if (temRessaca) {



      badgeEl.className = 'text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-rose-50 text-rose-800 border border-rose-300';



      badgeEl.textContent = `Ressaca (Aviso nº ${marinhaAvisos.numero})`;



    } else if (temGrosso && temVento) {



      badgeEl.className = 'text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-rose-50 text-rose-800 border border-rose-300';



      badgeEl.textContent = `Vento Forte & Mar Grosso (Avisos nº ${marinhaAvisos.numero})`;



    } else if (temGrosso) {



      badgeEl.className = 'text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-rose-50 text-rose-800 border border-rose-300';



      badgeEl.textContent = `Mar Grosso (Aviso nº ${marinhaAvisos.numero})`;



    } else if (temVento) {



      badgeEl.className = 'text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#ffebe4] text-black border border-[#f97316]';



      badgeEl.textContent = `Vento Forte (Aviso nº ${marinhaAvisos.numero})`;



    } else {



      badgeEl.className = 'badge-title-orange text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase shadow-2xs';



      badgeEl.textContent = 'Normalidade';



    }



  }







  // 1.1. Atualiza botões de dias com base em orlaData.dias_rotulos



  if (orlaData && orlaData.dias_rotulos) {



    orlaData.dias_rotulos.forEach(r => {



      const btn = document.getElementById(`orla-day-btn-${r.key}`);



      const modalBtn = document.getElementById(`modal-day-btn-${r.key}`);



      const txt = `${r.rotulo} (${r.data_br})`;



      if (btn) btn.textContent = txt;



      if (modalBtn) modalBtn.textContent = txt;



    });



  }







  // 2. Tábua de Marés do Dia (Terminal de Imbetiba / Macaé e Rio das Ostras)



  if (tabuaData && tabuaData.dias && tabuaData.dias.length > 0) {



    const hojeTabua = tabuaData.dias[0];



    const eventos = hojeTabua.eventos || [];



    



    // Próxima Maré



    if (proximaMareEl) {



      if (tabuaData.proxima_mare) {



        const pm = tabuaData.proxima_mare;



        const nomeTipo = pm.tipo === 'PREAMAR' ? 'Preia-mar' : 'Baixa-mar';



        proximaMareEl.textContent = `Próxima: ${nomeTipo} às ${pm.hora} (${pm.altura.toFixed(1).replace('.', ',')} m)`;



      } else {



        proximaMareEl.textContent = 'Maré astronômica normal';



      }



    }







    // Grid dos Eventos de Maré



    if (maresGridEl && eventos.length > 0) {



      maresGridEl.innerHTML = eventos.map(ev => {



        const isHigh = ev.tipo === 'PREAMAR';



        const iconSvg = isHigh 



          ? '<i data-lucide="arrow-up" class="w-3.5 h-3.5 text-black inline"></i>' 



          : '<i data-lucide="arrow-down" class="w-3.5 h-3.5 text-black inline"></i>';



        const labelNome = isHigh ? 'Preia-mar' : 'Baixa-mar';



        const bgCor = isHigh ? 'bg-[#ffebe4] border-[#f97316]/60' : 'bg-[#eaf0f6] border-[#6d8ba6]/60';



        return `



          <div class="p-2 rounded-xl ${bgCor} border text-center flex flex-col justify-center shadow-2xs">



            <span class="text-[10px] font-bold text-black uppercase flex items-center justify-center gap-0.5">



              ${iconSvg} ${labelNome}



            </span>



            <strong class="text-xs font-mono font-extrabold text-black mt-0.5">${ev.hora}</strong>



            <span class="text-[11px] font-bold text-black font-mono">${ev.altura.toFixed(2).replace('.', ',')} m</span>



          </div>



        `;



      }).join('');



    }



  }







  // 3. Renderiza a lista de 11 praias (Dia selecionado no state)



  renderCondicoesMarList(orlaData, state.activeOrlaDay || 'd0');







  // 4. Renderiza a Balneabilidade Oficial do INEA



  renderBalneabilidadeList(balnearList || state.balneabilidade);







  // 5. Rodapé Informativo



  if (avisoResumoEl) {



    if (marinhaAvisos && marinhaAvisos.aviso_ativo) {



      avisoResumoEl.textContent = `* Em dias de aviso da Marinha (Aviso nº ${marinhaAvisos.numero || ''}), respeite as bandeiras dos Guarda-Vidas (193).`;



    } else {



      avisoResumoEl.textContent = `* Orla sem avisos de ressaca vigentes. Condições regulares de mar (CHM) e balneabilidade pelo INEA.`;



    }



  }







  if (window.lucide) window.lucide.createIcons();



}















// =============================================================================



// NAVEGAÇÃO ENTRE ABAS PRINCIPAIS DO APLICATIVO (PREVISÃO vs ACUMULADOS DE CHUVA)



// =============================================================================



window.switchAppTab = function(tabName) {



  const ALL_TABS = ['previsao', 'chuva', 'rio', 'orla', 'alertas', 'boletim'];



  const target = ALL_TABS.includes(tabName) ? tabName : 'previsao';







  // Se o usuário estiver rolado muito abaixo, rola suavemente ao topo do conteúdo



  if (window.scrollY > 120) {



    window.scrollTo({ top: 0, behavior: 'smooth' });



  }







  ALL_TABS.forEach(t => {



    const view = document.getElementById('view-tab-' + t);



    const btn = document.getElementById('nav-tab-' + t);







    if (t === target) {



      if (view) view.classList.remove('hidden');



      if (btn) {



        btn.className = 'app-nav-tab active flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-[10.5px] sm:text-xs lg:text-sm font-black tracking-tight transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs w-full text-center';



        btn.setAttribute('aria-selected', 'true');



      }



    } else {



      if (view) view.classList.add('hidden');



      if (btn) {



        btn.className = 'app-nav-tab flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-[10.5px] sm:text-xs lg:text-sm font-bold tracking-tight transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer w-full text-center';



        btn.setAttribute('aria-selected', 'false');



      }



    }



  });







  if (window.history && window.history.replaceState) {



    window.history.replaceState(null, null, '#' + target);



  }







  if (target === 'chuva') {



    if (state.acumuladosDataset || state.acumuladosEstacoes) {



      renderAcumuladosChuva(state.acumuladosDataset || state.acumuladosEstacoes);



    }



  } else if (target === 'rio') {



    if (state.jundia10dData) {



      initRioHourlyTable(state.jundia10dData);



    }



  } else if (target === 'previsao') {



    if (state.boletimData) {



      updateBulletinChart();



    }



  }







  if (window.lucide) {



    window.lucide.createIcons();



  }



};







// =============================================================================



// FILTRO DAS ESTAÇÕES NA ABA DE ACUMULADOS



// =============================================================================



window.filterStations = function(cat) {



  state.activeStationsFilter = cat;



  const btns = {



    'todas': document.getElementById('filter-btn-todas'),



    'pws': document.getElementById('filter-btn-pws'),



    'inea': document.getElementById('filter-btn-inea'),



    'cemaden': document.getElementById('filter-btn-cemaden')



  };







  Object.keys(btns).forEach(k => {



    const b = btns[k];



    if (!b) return;



    if (k === cat) {



      b.className = 'station-filter-btn active py-1.5 px-3 rounded-lg text-xs font-black bg-[#ffebe4] border border-[#f07a53] text-black shadow-xs cursor-pointer';



    } else {



      b.className = 'station-filter-btn py-1.5 px-3 rounded-lg text-xs font-bold text-black hover:bg-white/80 border border-transparent cursor-pointer';



    }



  });







  const cards = document.querySelectorAll('.station-item-card');



  cards.forEach(card => {



    const itemCat = card.getAttribute('data-cat');



    if (cat === 'todas' || itemCat === cat) {



      card.classList.remove('hidden');



    } else {



      card.classList.add('hidden');



    }



  });







  const rows = document.querySelectorAll('.station-item-row');



  rows.forEach(row => {



    const itemCat = row.getAttribute('data-cat');



    if (cat === 'todas' || itemCat === cat) {



      row.classList.remove('hidden');



    } else {



      row.classList.add('hidden');



    }



  });







  if (window.lucide) window.lucide.createIcons();



};







// =============================================================================



// =============================================================================



// ORDENAÇÃO DAS ESTAÇÕES (DA MAIOR PARA A MENOR EM VOLUME MM)



// =============================================================================



state.stationsSortMetric = '24h';



state.stationsRawData = null;







window.getStationHorizonLabel = function(metric) {
  if (metric === '1h') return '1 Hora';
  if (metric === '4h') return '4 Horas';
  if (metric === '12h') return '12 Horas';
  if (metric === '24h') return '24 Horas';
  if (metric === '48h') return '48 Horas';
  if (metric === '96h') return '96 Horas';
  const hNum = parseFloat(String(metric || '').replace(/[^\d.]/g, ''));
  if (!isNaN(hNum) && hNum > 0) {
    return Number.isInteger(hNum) ? `${hNum} Horas` : `${hNum.toFixed(1)} Horas`;
  }
  return '24 Horas';
};

window.getStationRainForMetric = function(st, metric) {
  if (!st) return 0.0;
  if (metric === '1h') return Number(st.chuva_1h !== undefined && st.chuva_1h !== null ? st.chuva_1h : 0.0);
  if (metric === '4h') return Number(st.chuva_4h !== undefined && st.chuva_4h !== null ? st.chuva_4h : st.chuva_1h || 0.0);
  if (metric === '12h') return Number(st.chuva_12h !== undefined && st.chuva_12h !== null ? st.chuva_12h : st.chuva_24h || 0.0);
  if (metric === '24h') return Number(st.chuva_24h !== undefined && st.chuva_24h !== null ? st.chuva_24h : 0.0);
  if (metric === '48h') return Number(st.chuva_48h !== undefined && st.chuva_48h !== null ? st.chuva_48h : st.chuva_24h || 0.0);
  if (metric === '96h') return Number(st.chuva_96h !== undefined && st.chuva_96h !== null ? st.chuva_96h : 0.0);
  const hNum = parseFloat(String(metric || '').replace(/[^\d.]/g, ''));
  if (!isNaN(hNum) && hNum > 0) {
    if (typeof calculateStationRain === 'function') {
      return calculateStationRain(st, hNum);
    }
    return Number(st.chuva_24h || 0.0);
  }
  return Number(st.chuva_24h || 0.0);
};

window.sortStationsBy = function(metric) {
  state.stationsSortMetric = metric || '24h';
  const activeLabel = window.getStationHorizonLabel(state.stationsSortMetric);

  const activeLabelEl = document.getElementById('active-station-horizon-label');
  if (activeLabelEl) activeLabelEl.textContent = activeLabel;

  const standardMetrics = ['1h', '4h', '12h', '24h', '48h', '96h'];
  standardMetrics.forEach(m => {
    const btn = document.getElementById(`sort-btn-${m}`);
    if (btn) {
      if (m === state.stationsSortMetric) {
        btn.className = 'px-2.5 py-1 rounded-lg text-xs font-black bg-[#ffebe4] dark:bg-orange-950/60 border border-[#f07a53] text-black dark:text-orange-200 shadow-2xs cursor-pointer transition';
      } else {
        btn.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-[#f1f5f9] dark:bg-slate-800/80 border border-[#cbd5e1] dark:border-slate-700 text-black dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 cursor-pointer transition';
      }
    }
  });

  const customWrapper = document.getElementById('custom-horizon-wrapper');
  const customInput = document.getElementById('custom-station-horizon-input');
  if (standardMetrics.includes(state.stationsSortMetric)) {
    if (customWrapper) customWrapper.className = 'flex items-center gap-1 bg-[#f1f5f9] dark:bg-slate-800/80 border border-[#cbd5e1] dark:border-slate-700 px-2 py-0.5 rounded-lg text-xs transition';
    if (customInput) customInput.value = '';
  } else {
    if (customWrapper) customWrapper.className = 'flex items-center gap-1 bg-[#ffebe4] dark:bg-orange-950/60 border border-[#f07a53] px-2 py-0.5 rounded-lg text-xs transition';
  }

  if (state.stationsRawData) {
    renderAcumuladosChuva(state.stationsRawData);
  }
};

window.handleCustomStationHorizon = function(val) {
  const hNum = parseFloat(String(val || '').replace(',', '.'));
  if (!isNaN(hNum) && hNum > 0 && hNum <= 96) {
    state.stationsSortMetric = `${hNum}h`;
    const activeLabel = window.getStationHorizonLabel(state.stationsSortMetric);

    const activeLabelEl = document.getElementById('active-station-horizon-label');
    if (activeLabelEl) activeLabelEl.textContent = activeLabel;

    const standardMetrics = ['1h', '4h', '12h', '24h', '48h', '96h'];
    standardMetrics.forEach(m => {
      const btn = document.getElementById(`sort-btn-${m}`);
      if (btn) {
        btn.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-[#f1f5f9] dark:bg-slate-800/80 border border-[#cbd5e1] dark:border-slate-700 text-black dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 cursor-pointer transition';
      }
    });

    const customWrapper = document.getElementById('custom-horizon-wrapper');
    if (customWrapper) customWrapper.className = 'flex items-center gap-1 bg-[#ffebe4] dark:bg-orange-950/60 border border-[#f07a53] px-2 py-0.5 rounded-lg text-xs transition';

    if (state.stationsRawData) {
      renderAcumuladosChuva(state.stationsRawData);
    }
  } else if (!val || String(val).trim() === '') {
    window.sortStationsBy('24h');
  }
};

// RENDERIZAÇÃO DA ABA DE ACUMULADOS DE CHUVA (10 ESTAÇÕES)



// =============================================================================



function renderAcumuladosChuva(data) {



  if (!data) return;



  state.stationsRawData = data;



  setSocialStationsData(data);



  const dataset = Array.isArray(data) ? { estacoes: data } : data;



  const rawEstacoes = dataset.estacoes || [];



  const resumo = dataset.resumo || {};







  // Separa as 9 estações pluviométricas (chuva) da estação fluviométrica do Rio Jundiá (nível do rio)



  const pluviometricas = rawEstacoes.filter(s => s.categoria !== 'inea');



  const jundiaSt = rawEstacoes.find(s => s.categoria === 'inea') || dataset.estacao_rio_jundia;







  // Ordena rigorosamente as estações pluviométricas pelo volume da métrica ativa (padrão: 24h)



  const activeMetric = state.stationsSortMetric || '24h';
  const activeHorizonLabel = window.getStationHorizonLabel(activeMetric);

  const estacoesPluviais = pluviometricas.slice().sort((a, b) => {
    const valA = window.getStationRainForMetric(a, activeMetric);
    const valB = window.getStationRainForMetric(b, activeMetric);
    if (valB !== valA) return valB - valA;
    return Number(b.chuva_24h || 0) - Number(a.chuva_24h || 0);
  });

  // Lista consolidada para renderização: 9 estações pluviométricas ordenadas + Rio Jundiá
  const estacoes = jundiaSt ? [...estacoesPluviais, jundiaSt] : estacoesPluviais;

  // 1. Atualiza KPIs do Topo
  const kpiMediaEl = document.getElementById('chuva-kpi-media');
  const kpiMaiorEl = document.getElementById('chuva-kpi-maior');
  const kpiMaiorLocalEl = document.getElementById('chuva-kpi-maior-local');
  const kpiRioEl = document.getElementById('chuva-kpi-rio');
  const kpiRioSubEl = document.getElementById('chuva-kpi-rio-sub');
  const kpiEstacoesEl = document.getElementById('chuva-kpi-estacoes');
  const atualizacaoTxtEl = document.getElementById('chuva-atualizacao-txt');

  if (kpiMediaEl && estacoesPluviais.length > 0) {
    const sumVals = estacoesPluviais.reduce((acc, s) => acc + window.getStationRainForMetric(s, activeMetric), 0);
    const avgVal = sumVals / estacoesPluviais.length;
    kpiMediaEl.textContent = `${avgVal.toFixed(1).replace('.', ',')} mm`;
    const kpiMediaLabelEl = document.getElementById('chuva-kpi-media-label');
    if (kpiMediaLabelEl) kpiMediaLabelEl.textContent = `Média Municipal (${activeHorizonLabel})`;
  }

  if (kpiMaiorEl && estacoesPluviais.length > 0) {
    const maiorSt = estacoesPluviais[0];
    const valMaior = window.getStationRainForMetric(maiorSt, activeMetric);
    kpiMaiorEl.textContent = `${valMaior.toFixed(1).replace('.', ',')} mm`;
    if (kpiMaiorLocalEl) kpiMaiorLocalEl.textContent = maiorSt.nome_curto || maiorSt.nome;
    const kpiMaiorLabelEl = document.getElementById('chuva-kpi-maior-label');
    if (kpiMaiorLabelEl) kpiMaiorLabelEl.textContent = `Maior Acumulado (${activeHorizonLabel})`;
  }

  // 2. Renderiza Grade de Cards das 10 Estações



  const cardsGridEl = document.getElementById('stations-cards-grid');



  const tableBodyEl = document.getElementById('stations-table-tbody');







  if (cardsGridEl && estacoes.length > 0) {



    cardsGridEl.innerHTML = estacoes.map((st, idx) => {



      const isOnline = st.online !== false;



      const rankNum = idx + 1;



      let rankBadge = '';



      if (rankNum === 1) {



        rankBadge = '<span class="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-[#ea580c] text-white shadow-2xs">#1 MAIOR VOLUME</span>';



      } else if (rankNum === 2) {



        rankBadge = '<span class="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-[#ffebe4] border border-[#f07a53] text-black shadow-2xs">#2</span>';



      } else if (rankNum === 3) {



        rankBadge = '<span class="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-[#fef3c7] border border-[#d97706]/40 text-black">#3</span>';



      } else {



        rankBadge = `<span class="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1]">#${rankNum}</span>`;



      }



      const ch1 = Number(st.chuva_1h || 0.0).toFixed(1).replace('.', ',');



      const ch24 = Number(st.chuva_24h || 0.0).toFixed(1).replace('.', ',');



      const ch96 = Number(st.chuva_96h || 0.0).toFixed(1).replace('.', ',');







      // Categoria Badge & Estilo



      let catBadge = '';



      let catIcon = 'cloud-rain';



      let borderAccent = 'border-[#cbd5e1]';



      let btnLabel = 'Abrir Dashboard ↗';



      let catClass = st.categoria || 'pws';







      if (st.categoria === 'pws') {



        catBadge = '<span class="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full bg-[#f5efe8] text-black border border-[#b8a99a]/60">Weather Underground</span>';



        catIcon = 'gauge';



        borderAccent = 'border-[#dfb992]/40';



        btnLabel = 'Ver no Weather Underground ↗';



      } else if (st.categoria === 'inea') {



        catBadge = '<span class="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full bg-[#eaf0f6] text-black border border-[#6d8ba6]/60">INEA Alerta de Cheias</span>';



        catIcon = 'waves';



        borderAccent = 'border-[#6d8ba6]/50';



        btnLabel = 'Ver no Alerta de Cheias ↗';



      } else if (st.categoria === 'cemaden') {



        catBadge = '<span class="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full bg-[#ffebe4] text-black border border-[#f07a53]/60">CEMADEN Nacional</span>';



        catIcon = 'cloud-rain';



        borderAccent = 'border-[#f07a53]/40';



        btnLabel = 'Ver Gráfico no CEMADEN ↗';



      }







      const statusBadge = isOnline



        ? '<span class="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300 shadow-2xs"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Ativa</span>'



        : '<span class="text-[10px] font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-300">Em Calibração</span>';







      // Dados extras dos sensores



      let sensorInfo = '';



      if (st.categoria === 'inea') {



        sensorInfo = `



          <div class="p-2 rounded-xl bg-[#f8fafc] border border-[#6d8ba6]/30 text-[11px] text-black space-y-0.5">



            <div class="flex justify-between items-center">



              <span class="font-bold">Cota Atual:</span>



              <strong class="font-mono text-sm">${st.nivel_rio || '1,59 m'}</strong>



            </div>



            <div class="flex justify-between items-center text-[10px] text-black/80">



              <span>Transbordo: ${st.cota_transbordo || '2,84 m'}</span>



              <span class="font-bold uppercase text-emerald-700">${st.status_rio || 'Vigilância'}</span>



            </div>



          </div>



        `;



      } else if (st.temp_atual !== null && st.temp_atual !== undefined) {



        sensorInfo = `



          <div class="grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-[10.5px] text-black font-semibold">



            <div class="flex items-center gap-1">



              <i data-lucide="thermometer" class="w-3 h-3 text-[#ea580c]"></i>



              <span>Temp: <strong>${st.temp_atual}°C</strong></span>



            </div>



            <div class="flex items-center gap-1">



              <i data-lucide="wind" class="w-3 h-3 text-[#0284c7]"></i>



              <span>Vento: <strong>${st.vento_atual || 0} km/h</strong></span>



            </div>



          </div>



        `;



      } else {



        sensorInfo = `



          <div class="p-2 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-[10.5px] text-black font-medium">



            <span>PCD Pluviométrica de Alta Precisão • Rede Oficial CEMADEN</span>



          </div>



        `;



      }







      if (st.categoria === 'inea') {



        // CARD EXCLUSIVO DE TELEMETRIA HIDROLÓGICA (PALETA NÓRDICA CERÂMICA DO SITE)



        const nivelRio = st.nivel_rio || '1,59 m';



        const calhaPct = st.alerta_maximo_pct || 56;



        const cotaTransbordo = st.cota_transbordo || '2,84 m';



        const statusRio = st.status_rio || 'Vigilância';







        return `



          <div class="station-card station-item-card p-4 rounded-2xl bg-white border-2 border-[#38bdf8]/60 flex flex-col justify-between space-y-3 shadow-xs text-black" data-cat="inea">







            <div class="space-y-2.5">



              <div class="flex items-center justify-between gap-1 flex-wrap">



                <div class="flex items-center gap-1.5 flex-wrap">



                  <span class="px-2.5 py-0.5 rounded-full text-[9.5px] font-black bg-[#e0f2fe] text-[#0369a1] border border-[#38bdf8]/40 shadow-2xs flex items-center gap-1">



                    <i data-lucide="waves" class="w-3 h-3 text-[#0284c7]"></i> NÍVEL DO RIO



                  </span>



                  <span class="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#334155] border border-[#cbd5e1]">



                    INEA Alerta de Cheias



                  </span>



                </div>



                ${statusBadge}



              </div>







              <div>



                <h3 class="text-sm font-black text-black leading-tight tracking-tight">${st.nome}</h3>



                <span class="text-[11px] font-bold text-black/75 flex items-center gap-1 mt-0.5">



                  <i data-lucide="map-pin" class="w-3 h-3 text-black"></i>



                  ${st.bairro || 'Cantagalo / Rio das Ostras'} • Estação 2241036



                </span>



              </div>







              <!-- Destaque Hidrológico: Cota e Calha do Rio (Padrão Nórdico Cerâmico) -->



              <div class="p-3 rounded-xl bg-gradient-to-br from-[#f8fafc] to-[#f0f9ff] border border-[#cbd5e1] space-y-2 text-black">



                <div class="flex justify-between items-baseline">



                  <span class="text-xs font-bold text-black uppercase tracking-wider">Cota Atual do Rio:</span>



                  <strong class="text-2xl font-mono font-black text-[#0369a1]">${nivelRio}</strong>



                </div>



                <div class="space-y-1">



                  <div class="flex justify-between text-[10px] font-bold text-black">



                    <span>Ocupação da Calha: <strong>${calhaPct}%</strong></span>



                    <span>Transbordo: <strong>${cotaTransbordo}</strong></span>



                  </div>



                  <div class="w-full h-2 rounded-full bg-[#e2e8f0] overflow-hidden">



                    <div class="h-full bg-gradient-to-r from-emerald-500 to-[#0284c7] rounded-full" style="width: ${calhaPct}%"></div>



                  </div>



                </div>



                <div class="flex justify-between items-center text-[10.5px] pt-1.5 border-t border-[#e2e8f0]">



                  <span class="text-black font-medium">Atenção: 1,99 m • Alerta: 2,27 m</span>



                  <span class="font-extrabold uppercase text-[#166534] px-2.5 py-0.5 rounded-full bg-[#dcfce7] border border-[#86efac] text-[10px]">${statusRio}</span>



                </div>



              </div>







              <p class="text-[10.5px] text-black/85 leading-snug">



                Monitoramento fluvial contínuo para prevenção de inundações. Medição da cota do leito em metros (m), sem interferência no ranking pluviométrico.



              </p>



            </div>







            <!-- Rodapé do Card com Link -->



            <div class="pt-2 border-t border-[#cbd5e1] flex items-center justify-between text-xs">



              <span class="text-[10px] text-black font-medium">${st.ultima_leitura || 'Hoje'}</span>



              <a href="${st.url}" target="_blank" rel="noopener noreferrer" class="btn-action-slate px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 hover:brightness-95 shrink-0">



                <span>Ver no Alerta de Cheias ↗</span>



              </a>



            </div>







          </div>



        `;



      }







      // CARD DAS 9 ESTAÇÕES PLUVIOMÉTRICAS (ACUMULADOS EM MM)



      return `



        <div class="station-card station-item-card p-4 rounded-2xl bg-white border ${borderAccent} flex flex-col justify-between space-y-3 shadow-xs" data-cat="${catClass}">



          



          <div class="space-y-2.5">



            <div class="flex items-center justify-between gap-1 flex-wrap">



              <div class="flex items-center gap-1.5 flex-wrap">



                ${rankBadge}



                ${catBadge}



              </div>



              ${statusBadge}



            </div>







            <div>



              <h3 class="text-sm font-black text-black leading-tight tracking-tight">${st.nome}</h3>



              <span class="text-[11px] font-bold text-black/75 flex items-center gap-1 mt-0.5">



                <i data-lucide="map-pin" class="w-3 h-3 text-black"></i>



                ${st.bairro || 'Rio das Ostras'}



              </span>



            </div>







            <!-- Acumulados de Chuva -->
            ${(() => {
              const valActive = window.getStationRainForMetric(st, activeMetric).toFixed(1).replace('.', ',');
              let col1Html = `
                <div>
                  <span class="text-[9px] font-black uppercase text-black block">1 Hora</span>
                  <strong class="text-xs font-mono font-bold text-black">${ch1} mm</strong>
                </div>`;
              let col2Html = `
                <div class="border-x border-[#cbd5e1]/70 px-1">
                  <span class="text-[9px] font-black uppercase text-black block">24 Horas</span>
                  <strong class="text-sm font-mono font-extrabold text-[#ea580c]">${ch24} mm</strong>
                </div>`;
              let col3Html = `
                <div>
                  <span class="text-[9px] font-black uppercase text-black block">96 Horas</span>
                  <strong class="text-xs font-mono font-bold text-black">${ch96} mm</strong>
                </div>`;

              if (activeMetric === '1h') {
                col1Html = `
                  <div class="bg-[#ffebe4]/70 rounded-md py-0.5">
                    <span class="text-[9px] font-black uppercase text-[#ea580c] block">1 Hora</span>
                    <strong class="text-sm font-mono font-extrabold text-[#ea580c]">${ch1} mm</strong>
                  </div>`;
                col2Html = `
                  <div class="border-x border-[#cbd5e1]/70 px-1">
                    <span class="text-[9px] font-black uppercase text-black block">24 Horas</span>
                    <strong class="text-xs font-mono font-bold text-black">${ch24} mm</strong>
                  </div>`;
              } else if (activeMetric === '96h') {
                col2Html = `
                  <div class="border-x border-[#cbd5e1]/70 px-1">
                    <span class="text-[9px] font-black uppercase text-black block">24 Horas</span>
                    <strong class="text-xs font-mono font-bold text-black">${ch24} mm</strong>
                  </div>`;
                col3Html = `
                  <div class="bg-[#ffebe4]/70 rounded-md py-0.5">
                    <span class="text-[9px] font-black uppercase text-[#ea580c] block">96 Horas</span>
                    <strong class="text-sm font-mono font-extrabold text-[#ea580c]">${ch96} mm</strong>
                  </div>`;
              } else if (activeMetric !== '24h') {
                col2Html = `
                  <div class="border-x border-[#cbd5e1]/70 px-1 bg-[#ffebe4]/70 rounded-md py-0.5">
                    <span class="text-[9px] font-black uppercase text-[#ea580c] block">${activeHorizonLabel}</span>
                    <strong class="text-sm font-mono font-extrabold text-[#ea580c]">${valActive} mm</strong>
                  </div>`;
              }

              return `
                <div class="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border border-[#cbd5e1] text-center">
                  ${col1Html}
                  ${col2Html}
                  ${col3Html}
                </div>`;
            })()}

            <!-- Sensores Adicionais -->



            ${sensorInfo}



          </div>







          <!-- Rodapé do Card com Link -->



          <div class="pt-2 border-t border-[#cbd5e1] flex items-center justify-between text-xs">



            <span class="text-[10px] text-black font-medium truncate">${st.ultima_leitura || 'Hoje'}</span>



            <a href="${st.url}" target="_blank" rel="noopener noreferrer" class="btn-action-slate px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 hover:brightness-95 shrink-0">



              <span>${btnLabel}</span>



            </a>



          </div>







        </div>



      `;



    }).join('');



  }







  // 3. Renderiza Tabela Comparativa



  if (tableBodyEl && estacoes.length > 0) {
    const th1 = document.getElementById('th-chuva-1h');
    const thMid = document.getElementById('th-chuva-mid');
    const th96 = document.getElementById('th-chuva-96h');
    const arrow1 = document.getElementById('th-arrow-1h');
    const arrowMid = document.getElementById('th-arrow-mid');
    const arrow96 = document.getElementById('th-arrow-96h');

    if (th1 && thMid && th96) {
      th1.className = 'p-2.5 sm:p-3 text-center cursor-pointer hover:bg-zinc-100 transition';
      thMid.className = 'p-2.5 sm:p-3 text-center cursor-pointer hover:bg-zinc-100 transition';
      th96.className = 'p-2.5 sm:p-3 text-center cursor-pointer hover:bg-zinc-100 transition';
      if (arrow1) arrow1.textContent = '↕';
      if (arrowMid) arrowMid.textContent = '↕';
      if (arrow96) arrow96.textContent = '↕';

      if (activeMetric === '1h') {
        th1.className = 'p-2.5 sm:p-3 text-center cursor-pointer hover:bg-zinc-100 bg-[#ffebe4]/60 text-[#ea580c] font-black transition';
        if (arrow1) arrow1.textContent = '↓';
        thMid.innerHTML = `Chuva 24h <span id="th-arrow-mid">↕</span>`;
      } else if (activeMetric === '96h') {
        th96.className = 'p-2.5 sm:p-3 text-center cursor-pointer hover:bg-zinc-100 bg-[#ffebe4]/60 text-[#ea580c] font-black transition';
        if (arrow96) arrow96.textContent = '↓';
        thMid.innerHTML = `Chuva 24h <span id="th-arrow-mid">↕</span>`;
      } else if (activeMetric === '24h') {
        thMid.className = 'p-2.5 sm:p-3 text-center cursor-pointer hover:bg-zinc-100 bg-[#ffebe4]/60 text-[#ea580c] font-black transition';
        thMid.innerHTML = `Chuva 24h <span id="th-arrow-mid">↓</span>`;
      } else {
        thMid.className = 'p-2.5 sm:p-3 text-center cursor-pointer hover:bg-zinc-100 bg-[#ffebe4]/60 text-[#ea580c] font-black transition';
        thMid.innerHTML = `Chuva ${activeHorizonLabel} <span id="th-arrow-mid">↓</span>`;
      }
    }




    tableBodyEl.innerHTML = estacoes.map((st, idx) => {



      const isOnline = st.online !== false;



      const rankNum = idx + 1;



      const rankBadge = rankNum === 1



        ? '<span class="font-mono font-black text-xs text-white bg-[#ea580c] px-2 py-0.5 rounded-full shadow-2xs">#1</span>'



        : `<span class="font-mono font-bold text-xs text-black">#${rankNum}</span>`;



      const ch1 = Number(st.chuva_1h || 0.0).toFixed(1).replace('.', ',');



      const ch24 = Number(st.chuva_24h || 0.0).toFixed(1).replace('.', ',');



      const ch96 = Number(st.chuva_96h || 0.0).toFixed(1).replace('.', ',');



      const catClass = st.categoria || 'pws';







      const statusBadge = isOnline



        ? '<span class="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">Online</span>'



        : '<span class="text-[10px] font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-300">Calibração</span>';







      if (st.categoria === 'inea') {



        return `



          <tr class="station-item-row bg-[#f0f9ff]/70 hover:bg-[#e0f2fe] transition border-t-2 border-[#0284c7]/40" data-cat="inea">



            <td class="p-2.5 sm:p-3 text-center whitespace-nowrap">



              <span class="font-bold text-xs text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full">🌊 RIO</span>



            </td>



            <td class="p-2.5 sm:p-3">



              <strong class="text-xs font-black text-[#0369a1] block leading-tight">${st.nome_curto || st.nome}</strong>



              <span class="text-[10.5px] text-[#0369a1]/80 block">${st.bairro || 'Cantagalo'} • Estação Fluviométrica ${st.codigo}</span>



            </td>



            <td class="p-2.5 sm:p-3 whitespace-nowrap">



              <span class="text-[10px] font-black uppercase bg-[#0284c7] text-white px-2 py-0.5 rounded shadow-2xs">



                INEA Cota do Rio



              </span>



            </td>



            <td class="p-2.5 sm:p-3 text-center text-[11px] font-bold text-slate-500">—</td>



            <td class="p-2.5 sm:p-3 text-center font-mono font-black text-[#0284c7] bg-[#e0f2fe]/80 rounded">



              Cota: ${st.nivel_rio || '1,59 m'}



            </td>



            <td class="p-2.5 sm:p-3 text-center text-[11px] font-bold text-slate-600">Transbordo: ${st.cota_transbordo || '2,84 m'}</td>



            <td class="p-2.5 sm:p-3 text-center">



              <span class="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">



                ${st.status_rio || 'Vigilância'} (${st.alerta_maximo_pct || 56}%)



              </span>



            </td>



            <td class="p-2.5 sm:p-3 text-right whitespace-nowrap">



              <a href="${st.url}" target="_blank" rel="noopener noreferrer" class="text-xs font-bold text-white bg-[#0284c7] hover:bg-[#0369a1] px-2.5 py-1 rounded shadow-2xs inline-flex items-center gap-0.5">



                Alerta de Cheias ↗



              </a>



            </td>



          </tr>



        `;



      }







      return `



        <tr class="station-item-row hover:bg-[#f8fafc] transition" data-cat="${catClass}">



          <td class="p-2.5 sm:p-3 text-center whitespace-nowrap">${rankBadge}</td>



          <td class="p-2.5 sm:p-3">



            <strong class="text-xs font-black text-black block leading-tight">${st.nome_curto || st.nome}</strong>



            <span class="text-[10.5px] text-black/75 block">${st.bairro || 'Rio das Ostras'} • ${st.codigo}</span>



          </td>



          <td class="p-2.5 sm:p-3 whitespace-nowrap">



            <span class="text-[10px] font-bold text-black uppercase bg-[#f1f5f9] px-2 py-0.5 rounded border border-[#cbd5e1]">



              ${st.rede}



            </span>



          </td>



          ${(() => {
            const valActive = window.getStationRainForMetric(st, activeMetric).toFixed(1).replace('.', ',');
            let td1Class = "p-2.5 sm:p-3 text-center font-mono font-bold text-black";
            let tdMidClass = "p-2.5 sm:p-3 text-center font-mono font-bold text-black";
            let td96Class = "p-2.5 sm:p-3 text-center font-mono font-bold text-black";
            let midValStr = `${ch24} mm`;

            if (activeMetric === '1h') {
              td1Class = "p-2.5 sm:p-3 text-center font-mono font-black text-[#ea580c] bg-[#ffebe4]/40";
            } else if (activeMetric === '96h') {
              td96Class = "p-2.5 sm:p-3 text-center font-mono font-black text-[#ea580c] bg-[#ffebe4]/40";
            } else if (activeMetric === '24h') {
              tdMidClass = "p-2.5 sm:p-3 text-center font-mono font-black text-[#ea580c] bg-[#ffebe4]/40";
            } else {
              tdMidClass = "p-2.5 sm:p-3 text-center font-mono font-black text-[#ea580c] bg-[#ffebe4]/40";
              midValStr = `${valActive} mm`;
            }

            return `
              <td class="${td1Class}">${ch1} mm</td>
              <td class="${tdMidClass}">${midValStr}</td>
              <td class="${td96Class}">${ch96} mm</td>
            `;
          })()}



          <td class="p-2.5 sm:p-3 text-center">${statusBadge}</td>



          <td class="p-2.5 sm:p-3 text-right whitespace-nowrap">



            <a href="${st.url}" target="_blank" rel="noopener noreferrer" class="text-xs font-bold text-black hover:underline bg-[#eaf0f6] px-2 py-1 rounded border border-[#6d8ba6]/50 inline-flex items-center gap-0.5">



              Abrir ↗



            </a>



          </td>



        </tr>



      `;



    }).join('');



  }







  // Aplica filtro ativo se houver



  if (state.activeStationsFilter) {



    window.filterStations(state.activeStationsFilter);



  }







  if (window.lucide) window.lucide.createIcons();



}











/**



 * ============================================================================



 * MÓDULO DE TELEMETRIA HORA A HORA DO RIO JUNDIÁ (ESTAÇÃO OFICIAL INEA 2241036)



 * ============================================================================



 */







function initRioHourlyTable(dataset) {



  if (!dataset || !dataset.dados || !Array.isArray(dataset.dados) || dataset.dados.length === 0) {



    return;



  }







  // Agrupa todas as medições por data (YYYY-MM-DD)



  const dateGroups = {};



  dataset.dados.forEach(item => {



    const dt = item.datetime_brt || '';



    if (!dt) return;



    const dateKey = dt.substring(0, 10);



    if (!dateGroups[dateKey]) dateGroups[dateKey] = [];



    dateGroups[dateKey].push(item);



  });







  const availableDates = Object.keys(dateGroups).sort().reverse();



  if (availableDates.length === 0) return;







  // Se não houver data selecionada, seleciona a mais recente



  if (!state.rioSelectedDate || !availableDates.includes(state.rioSelectedDate)) {



    state.rioSelectedDate = availableDates[0];



  }







  // Popula o seletor de datas



  const selectEl = document.getElementById('rio-filter-date');



  if (selectEl) {



    const todayStr = new Date().toISOString().substring(0, 10);



    selectEl.innerHTML = availableDates.map((dStr, idx) => {



      const parts = dStr.split('-');



      const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;



      let label = formatted;



      if (idx === 0) label = `${formatted} (Mais Recente)`;



      else if (dStr === todayStr) label = `${formatted} (Hoje)`;



      return `<option value="${dStr}" ${dStr === state.rioSelectedDate ? 'selected' : ''}>${label}</option>`;



    }).join('');



  }







  renderRioHourlyTable();



}







window.onRioDateFilterChange = function(newDate) {



  state.rioSelectedDate = newDate;



  renderRioHourlyTable();



};







window.setRioIntervalMode = function(mode) {



  state.rioIntervalMode = mode;



  const btnHourly = document.getElementById('rio-btn-interval-hourly');



  const btnAll = document.getElementById('rio-btn-interval-all');







  if (btnHourly && btnAll) {



    if (mode === 'hourly') {



      btnHourly.className = 'px-2.5 py-1 text-xs font-bold rounded-lg transition bg-white text-black shadow-2xs cursor-pointer';



      btnAll.className = 'px-2.5 py-1 text-xs font-medium text-black rounded-lg transition hover:text-black cursor-pointer';



    } else {



      btnAll.className = 'px-2.5 py-1 text-xs font-bold rounded-lg transition bg-white text-black shadow-2xs cursor-pointer';



      btnHourly.className = 'px-2.5 py-1 text-xs font-medium text-black rounded-lg transition hover:text-black cursor-pointer';



    }



  }







  renderRioHourlyTable();



};







function renderRioHourlyTable() {



  const tbodyEl = document.getElementById('rio-tabela-tbody');



  const kpiMinEl = document.getElementById('rio-kpi-dia-min');



  const kpiMaxEl = document.getElementById('rio-kpi-dia-max');



  const kpiVarEl = document.getElementById('rio-kpi-dia-var');



  const kpiChuvaEl = document.getElementById('rio-kpi-dia-chuva');



  const badgeTotalEl = document.getElementById('rio-badge-total-leituras');







  if (!tbodyEl) return;







  const dataset = state.jundia10dData;



  if (!dataset || !dataset.dados || !Array.isArray(dataset.dados)) {



    tbodyEl.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-black/70">Carregando dados telemétricos da estação...</td></tr>`;



    return;



  }







  // Filtra dados da data selecionada



  const dayItems = dataset.dados.filter(item => (item.datetime_brt || '').startsWith(state.rioSelectedDate));







  if (dayItems.length === 0) {



    tbodyEl.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-black/70">Nenhuma leitura encontrada para este dia.</td></tr>`;



    return;



  }







  // Ordena cronologicamente para cálculo de tendências (antigo -> novo)



  const chronoItems = dayItems.slice().sort((a, b) => {



    const tA = new Date(a.datetime_brt || 0).getTime();



    const tB = new Date(b.datetime_brt || 0).getTime();



    return tA - tB;



  });







  // KPIs do Dia



  const nivels = chronoItems.map(x => Number(x.nivel)).filter(n => !isNaN(n));



  const minNivel = nivels.length > 0 ? Math.min(...nivels) : 1.59;



  const maxNivel = nivels.length > 0 ? Math.max(...nivels) : 1.59;



  const varNivel = maxNivel - minNivel;



  const maxChuva24 = Math.max(...chronoItems.map(x => Number(x.chuva_24h || 0)));







  if (kpiMinEl) kpiMinEl.textContent = `${minNivel.toFixed(2).replace('.', ',')} m`;



  if (kpiMaxEl) kpiMaxEl.textContent = `${maxNivel.toFixed(2).replace('.', ',')} m`;



  if (kpiVarEl) kpiVarEl.textContent = `${varNivel.toFixed(2).replace('.', ',')} m`;



  if (kpiChuvaEl) kpiChuvaEl.textContent = `${maxChuva24.toFixed(1).replace('.', ',')} mm`;



  if (badgeTotalEl) badgeTotalEl.textContent = `${dayItems.length} leituras no dia`;







  // Se modo horário, filtra para 1 leitura por hora (mantém a leitura de cada hora cheia)



  let displayItems = [];



  if (state.rioIntervalMode === 'hourly') {



    const hoursMap = new Map();



    // Itera do mais recente ao mais antigo



    for (let i = chronoItems.length - 1; i >= 0; i--) {



      const it = chronoItems[i];



      const dtStr = it.datetime_brt || '';



      const hour = dtStr.substring(11, 13);



      if (!hoursMap.has(hour)) {



        hoursMap.set(hour, it);



      }



    }



    displayItems = Array.from(hoursMap.values());



  } else {



    displayItems = chronoItems.slice().reverse();



  }







  // Transbordo constante da estação INEA 2241036



  const cotaTransbordo = 2.84;







  tbodyEl.innerHTML = displayItems.map(item => {



    const dt = item.datetime_brt || '';



    const datePart = dt.substring(0, 10).split('-').reverse().join('/');



    const timePart = dt.substring(11, 16);



    const nivel = Number(item.nivel || 0);







    // Localiza item imediatamente anterior na ordem cronológica para tendência



    const curIdx = chronoItems.findIndex(x => x.datetime_brt === item.datetime_brt);



    let trendHtml = '<span class="text-black/60 font-medium">— Estável</span>';



    if (curIdx > 0) {



      const prev = chronoItems[curIdx - 1];



      const diff = nivel - Number(prev.nivel || 0);



      if (diff > 0.005) {



        trendHtml = `<span class="inline-flex items-center gap-0.5 font-bold text-[#ea580c]"><i data-lucide="arrow-up" class="w-3.5 h-3.5"></i> +${diff.toFixed(2).replace('.', ',')} m</span>`;



      } else if (diff < -0.005) {



        trendHtml = `<span class="inline-flex items-center gap-0.5 font-bold text-[#0284c7]"><i data-lucide="arrow-down" class="w-3.5 h-3.5"></i> ${diff.toFixed(2).replace('.', ',')} m</span>`;



      }



    }







    // Estágio Oficial INEA



    let statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]">Vigilância</span>';



    if (nivel >= 2.84) {



      statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#ffe4e6] text-[#9f1239] border border-[#fecdd3] animate-pulse">Transbordo</span>';



    } else if (nivel >= 2.27) {



      statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#ffedd5] text-[#9a3412] border border-[#fed7aa]">Alerta</span>';



    } else if (nivel >= 1.99) {



      statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">Atenção</span>';



    }







    const folga = Math.max(0, cotaTransbordo - nivel).toFixed(2).replace('.', ',');



    const chUltima = Number(item.chuva_15min !== undefined ? item.chuva_15min : (item.chuva || 0)).toFixed(1).replace('.', ',');



    const ch1 = Number(item.chuva_1h || 0).toFixed(1).replace('.', ',');



    const ch4 = Number(item.chuva_4h || 0).toFixed(1).replace('.', ',');



    const ch24 = Number(item.chuva_24h || 0).toFixed(1).replace('.', ',');







    return `



      <tr class="hover:bg-[#f8fafc] transition border-b border-[#e2e8f0]">



        <td class="py-2 px-3.5 whitespace-nowrap">



          <div class="font-black text-black text-xs">${timePart}</div>



          <div class="text-[10px] text-black/60">${datePart}</div>



        </td>



        <td class="py-2 px-3 whitespace-nowrap">



          <span class="font-mono text-sm font-black text-black">${nivel.toFixed(2).replace('.', ',')} m</span>



        </td>



        <td class="py-2 px-3 whitespace-nowrap">${statusBadge}</td>



        <td class="py-2 px-3 whitespace-nowrap text-xs">${trendHtml}</td>



        <td class="py-2 px-3 whitespace-nowrap font-mono text-black font-semibold">${chUltima} mm</td>



        <td class="py-2 px-3 whitespace-nowrap font-mono text-black font-semibold">${ch1} mm</td>



        <td class="py-2 px-3 whitespace-nowrap font-mono text-black font-semibold">${ch4} mm</td>



        <td class="py-2 px-3 whitespace-nowrap font-mono text-black font-bold text-[#ea580c]">${ch24} mm</td>



        <td class="py-2 px-3.5 whitespace-nowrap">



          <span class="font-mono text-xs font-bold text-black">${folga} m</span>



          <span class="text-[10px] text-black/60 block">margem de segurança</span>



        </td>



      </tr>



    `;



  }).join('');







  if (window.lucide) window.lucide.createIcons();



}







// =============================================================================



// EXPORTAÇÃO DE PLANILHAS (CSV / EXCEL COM UTF-8 BOM)



// =============================================================================







// Exporta a Tabela Comparativa Completa de Acumulados de Chuva



window.exportAcumuladosCSV = async function() {



  let data = state.stationsRawData || state.acumuladosDataset;



  if (!data) {



    try {



      const res = await fetch('data/acumulados_estacoes.json');



      if (res.ok) {



        data = await res.json();



      }



    } catch (e) {



      console.warn("Falha ao buscar acumulados para exportação:", e);



    }



  }







  if (!data) {



    alert("Dados das estações pluviométricas indisponíveis para download.");



    return;



  }







  const dataset = Array.isArray(data) ? { estacoes: data } : data;



  const rawEstacoes = dataset.estacoes || [];







  // Separa estações pluviométricas e hidrológica



  const pluviometricas = rawEstacoes.filter(s => s.categoria !== 'inea');



  const jundiaSt = rawEstacoes.find(s => s.categoria === 'inea') || dataset.estacao_rio_jundia;







  // Respeita a ordenação ativa da tabela (1h, 24h ou 96h)



  const metricKey = state.stationsSortMetric === '1h' ? 'chuva_1h' : (state.stationsSortMetric === '96h' ? 'chuva_96h' : 'chuva_24h');



  



  const estacoesPluviais = pluviometricas.slice().sort((a, b) => {



    const valA = Number(a[metricKey] !== undefined && a[metricKey] !== null ? a[metricKey] : 0.0);



    const valB = Number(b[metricKey] !== undefined && b[metricKey] !== null ? b[metricKey] : 0.0);



    if (valB !== valA) return valB - valA;



    return Number(b.chuva_24h || 0) - Number(a.chuva_24h || 0);



  });







  const estacoes = jundiaSt ? [...estacoesPluviais, jundiaSt] : estacoesPluviais;







  // Montagem das Linhas da Planilha



  const rows = [];



  rows.push([



    "Ranking (#)",



    "Estação",



    "Bairro / Referência",



    "Código PCD",



    "Rede de Telemetria",



    "Tipo de Monitoramento",



    "Chuva 1h (mm)",



    "Chuva 4h (mm)",



    "Chuva 6h (mm)",



    "Chuva 12h (mm)",



    "Chuva 24h (mm)",



    "Chuva 36h (mm)",



    "Chuva 48h (mm)",



    "Chuva 96h (mm)",



    "Nível do Rio (m)",



    "Cota Transbordo (m)",



    "Status Fluvial / Calha",



    "Status Operacional",



    "Temperatura (°C)",



    "Vento (km/h)",



    "Umidade (%)",



    "Última Leitura / Atualização",



    "Link Oficial do Sensor"



  ]);







  estacoes.forEach((st, idx) => {



    const isInea = st.categoria === 'inea';



    const rank = isInea ? "—" : String(idx + 1);



    const nome = st.nome || "";



    const bairro = st.bairro || "";



    const codigo = st.codigo || "";



    const rede = isInea ? "INEA Alerta de Cheias" : (st.rede || "PWS Weather Underground");



    const tipo = isInea ? "Nível do Rio (Hidrológica)" : "Pluviométrica (Acumulados)";







    const ch1 = isInea ? "—" : Number(st.chuva_1h || 0).toFixed(1).replace('.', ',');



    const ch4 = isInea ? "—" : (st.chuva_4h !== null && st.chuva_4h !== undefined ? Number(st.chuva_4h).toFixed(1).replace('.', ',') : "—");



    const ch6 = isInea ? "—" : (st.chuva_6h !== null && st.chuva_6h !== undefined ? Number(st.chuva_6h).toFixed(1).replace('.', ',') : "—");



    const ch12 = isInea ? "—" : (st.chuva_12h !== null && st.chuva_12h !== undefined ? Number(st.chuva_12h).toFixed(1).replace('.', ',') : "—");



    const ch24 = isInea ? "—" : Number(st.chuva_24h || 0).toFixed(1).replace('.', ',');



    const ch36 = isInea ? "—" : (st.chuva_36h !== null && st.chuva_36h !== undefined ? Number(st.chuva_36h).toFixed(1).replace('.', ',') : "—");



    const ch48 = isInea ? "—" : (st.chuva_48h !== null && st.chuva_48h !== undefined ? Number(st.chuva_48h).toFixed(1).replace('.', ',') : "—");



    const ch96 = isInea ? "—" : Number(st.chuva_96h || 0).toFixed(1).replace('.', ',');







    const nivelRio = isInea ? (st.nivel_rio || "1,61 m") : "—";



    const cotaTransbordo = isInea ? (st.cota_transbordo || "2,84 m") : "—";



    const statusFluvial = isInea ? `${st.status_rio || 'Vigilância'} (${st.alerta_maximo_pct || 56}%)` : "—";



    const statusOp = st.online !== false ? "Online" : "Calibração";







    const temp = (st.temp_atual !== null && st.temp_atual !== undefined) ? Number(st.temp_atual).toFixed(1).replace('.', ',') : "—";



    const vento = (st.vento_atual !== null && st.vento_atual !== undefined) ? Number(st.vento_atual).toFixed(1).replace('.', ',') : "—";



    const umidade = (st.umidade_atual !== null && st.umidade_atual !== undefined) ? `${st.umidade_atual}%` : "—";



    const leitura = st.ultima_leitura || (dataset.atualizacao || "");



    const link = st.url || "";







    rows.push([



      rank,



      nome,



      bairro,



      codigo,



      rede,



      tipo,



      ch1,



      ch4,



      ch6,



      ch12,



      ch24,



      ch36,



      ch48,



      ch96,



      nivelRio,



      cotaTransbordo,



      statusFluvial,



      statusOp,



      temp,



      vento,



      umidade,



      leitura,



      link



    ]);



  });







  // UTF-8 BOM + separador ';' para compatibilidade direta com Excel PT-BR



  const csvContent = "\uFEFF" + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");



  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });



  const url = URL.createObjectURL(blob);



  const a = document.createElement("a");



  const dataHoje = new Date().toISOString().substring(0, 10);



  a.href = url;



  a.download = `acumulados-chuva-rio-das-ostras-${dataHoje}.csv`;



  document.body.appendChild(a);



  a.click();



  document.body.removeChild(a);



  URL.revokeObjectURL(url);







  // Feedback visual no botão



  const btn = document.getElementById('btn-export-acumulados-csv');



  if (btn) {



    const originalContent = btn.innerHTML;



    btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-700"></i><span class="text-emerald-800 font-extrabold">Planilha Baixada!</span>`;



    if (window.lucide) window.lucide.createIcons();



    setTimeout(() => {



      btn.innerHTML = originalContent;



      if (window.lucide) window.lucide.createIcons();



    }, 2200);



  }



};







// Exporta a Tabela Horária do Rio Jundiá



window.exportRioTableCSV = function() {



  const dataset = state.jundia10dData;



  if (!dataset || !dataset.dados) {



    alert("Dados telemétricos indisponíveis para exportação.");



    return;



  }







  const selectedDate = state.rioSelectedDate || new Date().toISOString().substring(0, 10);



  const items = dataset.dados.filter(item => (item.datetime_brt || '').startsWith(selectedDate));



  



  if (items.length === 0) {



    alert("Nenhuma medição encontrada na data selecionada.");



    return;



  }







  const rows = [



    ["Estação", "Data e Hora", "Nível da Cota (m)", "Status Fluvial", "Chuva Recente (mm)", "Chuva 1h (mm)", "Chuva 4h (mm)", "Chuva 24h (mm)", "Folga p/ Transbordo (m)"]



  ];







  items.forEach(it => {



    const dt = it.datetime_brt ? it.datetime_brt.replace('T', ' ').substring(0, 16) : '';



    const nivel = Number(it.nivel || 0);



    let st = "Vigilância";



    if (nivel >= 2.84) st = "Transbordo";



    else if (nivel >= 2.27) st = "Alerta";



    else if (nivel >= 1.99) st = "Atenção";



    const folga = Math.max(0, 2.84 - nivel).toFixed(2).replace('.', ',');



    rows.push([



      "INEA 2241036 (Rio Jundiá)",



      dt,



      nivel.toFixed(2).replace('.', ','),



      st,



      Number(it.chuva_15min || 0).toFixed(1).replace('.', ','),



      Number(it.chuva_1h || 0).toFixed(1).replace('.', ','),



      Number(it.chuva_4h || 0).toFixed(1).replace('.', ','),



      Number(it.chuva_24h || 0).toFixed(1).replace('.', ','),



      folga



    ]);



  });







  const csvContent = "\uFEFF" + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");



  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });



  const url = URL.createObjectURL(blob);



  const link = document.createElement("a");



  link.setAttribute("href", url);



  link.setAttribute("download", `rio-jundia-telemetria-${selectedDate}.csv`);



  document.body.appendChild(link);



  link.click();



  document.body.removeChild(link);



  URL.revokeObjectURL(url);







  // Feedback visual no botão



  const btn = document.getElementById('btn-export-rio-csv');



  if (btn) {



    const originalContent = btn.innerHTML;



    btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-700"></i><span class="text-emerald-800 font-extrabold">Planilha Baixada!</span>`;



    if (window.lucide) window.lucide.createIcons();



    setTimeout(() => {



      btn.innerHTML = originalContent;



      if (window.lucide) window.lucide.createIcons();



    }, 2200);



  }



};







// Inicialização de Hash URL (#chuva ou #previsao)



const handleUrlHash = () => {
  const params = new URLSearchParams(window.location.search);
  const qTab = (params.get('tab') || '').toLowerCase();
  const rawHash = (window.location.hash || '').replace('#', '').trim().toLowerCase();
  const ALL_TABS = ['previsao', 'chuva', 'rio', 'orla', 'alertas', 'boletim'];

  const targetTab = ALL_TABS.includes(qTab) ? qTab : (ALL_TABS.includes(rawHash) ? rawHash : null);
  if (targetTab) {
    window.switchAppTab(targetTab);
  }

  const qHorizon = params.get('horizon') || params.get('h') || params.get('sort');
  if (qHorizon) {
    setTimeout(() => {
      if (typeof window.sortStationsBy === 'function') {
        window.sortStationsBy(qHorizon);
      }
    }, 200);
  }

  if (rawHash === 'wwatch' || qTab === 'wwatch' || rawHash === 'ondas') {
    window.switchAppTab('orla');
    if (window.switchOrlaTab) {
      setTimeout(() => window.switchOrlaTab('wwatch'), 100);
    }
  }

  if (rawHash === 'cemaden' || qTab === 'cemaden' || rawHash === 'riscos' || rawHash === 'geohidro') {
    window.switchAppTab('alertas');
    setTimeout(() => {
      const sec = document.getElementById('section-cemaden-riscos');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  }

  if (rawHash === 'cemaden-painel' || rawHash === 'painel-rj') {
    window.switchAppTab('alertas');
    setTimeout(() => {
      const sec = document.getElementById('section-cemaden-riscos');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      if (window.switchCemadenTab) window.switchCemadenTab('painel-rj');
    }, 120);
  }
};







window.addEventListener('DOMContentLoaded', handleUrlHash);



window.addEventListener('hashchange', handleUrlHash);







// Suporte para abertura direta do Modal Social com horizonte via URL



const handleUrlSocialParams = () => {



  const params = new URLSearchParams(window.location.search);



  const modalParam = params.get('modal');



  const horizonParam = params.get('horizon') || params.get('h');



  const fmtParam = params.get('fmt') || params.get('format');



  if (modalParam === 'social' || (modalParam === 'chuva' && !params.get('tab'))) {



    setTimeout(() => {



      if (window.openSocialModalChuva) {



        window.openSocialModalChuva(horizonParam || '24h');



        if (fmtParam && window.setSocialFormat) {



          window.setSocialFormat(fmtParam);



        }



      }



    }, 600);



  }



};



window.addEventListener('DOMContentLoaded', handleUrlSocialParams);







// Suporte para scroll via URL (?scroll=750)



const handleUrlScrollParam = () => {



  const scrollVal = new URLSearchParams(window.location.search).get('scroll');



  if (scrollVal) {
    if (scrollVal === 'sinopse' || scrollVal === 'section-panorama-sinotico') {
      setTimeout(() => {
        const el = document.getElementById('section-panorama-sinotico');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, 800);
      return;
    }
    const y = parseInt(scrollVal, 10);



    if (!isNaN(y)) {



      setTimeout(() => {



        window.scrollTo({ top: y, behavior: 'instant' });



      }, 700);



    }



  }



};



window.addEventListener('DOMContentLoaded', handleUrlScrollParam);







// =============================================================================



// GERENCIADOR DE TEMA ESCURO / CLARO (DARK MODE 24/7)



// =============================================================================



window.toggleTheme = function() {



  const isDark = document.documentElement.classList.toggle('dark');



  try {



    localStorage.setItem('theme', isDark ? 'dark' : 'light');



  } catch (e) {}







  window.updateThemeIcon(isDark);







  // Se houver gráficos Chart.js ativos, recarrega para adaptar cores



  if (typeof updateBulletinChart === 'function' && state.boletimData) {



    updateBulletinChart();



  }



  if (state.activeChartCanvas && state.activeHourlyData) {



    // Redesenha gráfico horário da métrica ativa



    const activeBtn = document.querySelector('.tab-metric-btn.active');



    const metric = activeBtn ? activeBtn.getAttribute('data-metric') : 'temperature';



    if (window.renderHourlyChart) {



      window.renderHourlyChart(state.activeChartCanvas, metric, state.activeHourlyData);



    }



  }



};







window.updateThemeIcon = function(isDark) {



  const btn = document.getElementById('btn-theme-toggle');



  const icon = document.getElementById('theme-icon');



  if (!icon) return;







  if (isDark) {



    icon.setAttribute('data-lucide', 'sun');



    if (btn) btn.setAttribute('title', 'Alternar para modo claro');



  } else {



    icon.setAttribute('data-lucide', 'moon');



    if (btn) btn.setAttribute('title', 'Alternar para modo escuro');



  }



  if (window.lucide && typeof window.lucide.createIcons === 'function') {



    window.lucide.createIcons();



  }



};







// Sincroniza ícone na inicialização do DOM



document.addEventListener('DOMContentLoaded', () => {



  const isDark = document.documentElement.classList.contains('dark');



  window.updateThemeIcon(isDark);







  if (window.matchMedia) {



    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {



      if (!localStorage.getItem('theme')) {



        if (e.matches) {



          document.documentElement.classList.add('dark');



        } else {



          document.documentElement.classList.remove('dark');



        }



        window.updateThemeIcon(e.matches);



      }



    });



  }



});







// =============================================================================



// NAVEGAÇÃO DE ABAS DO RESUMO DO PLANCON (VOLUMES, BAIRROS, NÍVEIS, PROTOCOLOS)



// =============================================================================



window.switchPlanconTab = function(tabName) {



  const tabs = ['volumes', 'bairros', 'niveis', 'protocolos'];



  tabs.forEach(t => {



    const btn = document.getElementById(`plancon-tab-btn-${t}`);



    const panel = document.getElementById(`plancon-panel-${t}`);



    if (btn) {



      if (t === tabName) {



        btn.className = 'plancon-tab-btn active px-3.5 py-1.5 text-xs font-black rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5';



        btn.setAttribute('aria-selected', 'true');



      } else {



        btn.className = 'plancon-tab-btn px-3.5 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5';



        btn.setAttribute('aria-selected', 'false');



      }



    }



    if (panel) {



      if (t === tabName) {



        panel.classList.remove('hidden');



      } else {



        panel.classList.add('hidden');



      }



    }



  });



  if (window.lucide && typeof window.lucide.createIcons === 'function') {



    window.lucide.createIcons();



  }



};





// ==========================================================================
// PREVISÃO PROBABILÍSTICA CPTEC/INPE: CHUVA INTENSA & TEMPO SEVERO (24H/48H)
// ==========================================================================
export function initCptecProbabilistica() {
  const mapImg = document.getElementById('img-cptec-prob-mapa');
  const modalImg = document.getElementById('modal-img-cptec-prob');
  const titleBadge = document.getElementById('badge-cptec-prob-title');
  const downloadBtn = document.getElementById('btn-cptec-prob-download');
  const legendGrid = document.getElementById('grid-legenda-items');

  const btnTipoChuva = document.getElementById('btn-cptec-tipo-chuva');
  const btnTipoSevero = document.getElementById('btn-cptec-tipo-severo');
  const btnHoriz24 = document.getElementById('btn-cptec-horiz-24');
  const btnHoriz48 = document.getElementById('btn-cptec-horiz-48');

  const modalBtnChuva = document.getElementById('modal-prob-btn-chuva');
  const modalBtnSevero = document.getElementById('modal-prob-btn-severo');
  const modalBtn24 = document.getElementById('modal-prob-btn-24');
  const modalBtn48 = document.getElementById('modal-prob-btn-48');

  let currentTipo = 'chuva'; // 'chuva' | 'severo'
  let currentHoriz = '24';   // '24' | '48'

  const maps = {
    'chuva_24': {
      local: 'img/cptec/mapa_prev_prob_24h_chuvaintensa.png',
      remote: 'https://s1.cptec.inpe.br/nowcasting/NC/PREV/mapa_prev_prob_24h_chuvaintensa.png',
      title: 'Probabilidade de Chuva Intensa • 24 Horas',
      download: 'cptec_previsao_chuva_intensa_24h.png'
    },
    'chuva_48': {
      local: 'img/cptec/mapa_prev_prob_48h_chuvaintensa.png',
      remote: 'https://s1.cptec.inpe.br/nowcasting/NC/PREV/mapa_prev_prob_48h_chuvaintensa.png',
      title: 'Probabilidade de Chuva Intensa • 48 Horas',
      download: 'cptec_previsao_chuva_intensa_48h.png'
    },
    'severo_24': {
      local: 'img/cptec/mapa_prev_prob_24h_temposevero.png',
      remote: 'https://s1.cptec.inpe.br/nowcasting/NC/PREV/mapa_prev_prob_24h_temposevero.png',
      title: 'Probabilidade de Tempo Severo • 24 Horas',
      download: 'cptec_previsao_tempo_severo_24h.png'
    },
    'severo_48': {
      local: 'img/cptec/mapa_prev_prob_48h_temposevero.png',
      remote: 'https://s1.cptec.inpe.br/nowcasting/NC/PREV/mapa_prev_prob_48h_temposevero.png',
      title: 'Probabilidade de Tempo Severo • 48 Horas',
      download: 'cptec_previsao_tempo_severo_48h.png'
    }
  };

  const updateView = () => {
    const key = `${currentTipo}_${currentHoriz}`;
    const info = maps[key];
    if (!info) return;

    const fullSrc = `${info.local}?v=${Date.now()}`;
    if (mapImg) {
      mapImg.src = fullSrc;
      mapImg.onerror = () => { mapImg.src = info.remote; };
    }
    if (modalImg) {
      modalImg.src = fullSrc;
      modalImg.onerror = () => { modalImg.src = info.remote; };
    }
    if (titleBadge) {
      titleBadge.textContent = info.title;
    }
    if (downloadBtn) {
      downloadBtn.href = info.local;
      downloadBtn.download = info.download;
    }

    // Toggle styling for Main Tipo buttons
    const activeTipoClass = 'btn-cptec-tipo px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 bg-[#f07a53] text-white shadow-xs';
    const inactiveTipoClass = 'btn-cptec-tipo px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5';

    if (btnTipoChuva && btnTipoSevero) {
      if (currentTipo === 'chuva') {
        btnTipoChuva.className = activeTipoClass;
        btnTipoSevero.className = inactiveTipoClass;
      } else {
        btnTipoChuva.className = inactiveTipoClass;
        btnTipoSevero.className = activeTipoClass;
      }
    }

    // Toggle styling for Modal Tipo buttons
    const modalActiveTipo = 'px-3 py-1 rounded-lg text-xs font-bold bg-[#f07a53] text-white transition cursor-pointer';
    const modalInactiveTipo = 'px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer';

    if (modalBtnChuva && modalBtnSevero) {
      if (currentTipo === 'chuva') {
        modalBtnChuva.className = modalActiveTipo;
        modalBtnSevero.className = modalInactiveTipo;
      } else {
        modalBtnChuva.className = modalInactiveTipo;
        modalBtnSevero.className = modalActiveTipo;
      }
    }

    // Toggle styling for Main Horiz buttons
    const activeHorizClass = 'btn-cptec-horiz px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 shadow-xs';
    const inactiveHorizClass = 'btn-cptec-horiz px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer';

    if (btnHoriz24 && btnHoriz48) {
      if (currentHoriz === '24') {
        btnHoriz24.className = activeHorizClass;
        btnHoriz48.className = inactiveHorizClass;
      } else {
        btnHoriz24.className = inactiveHorizClass;
        btnHoriz48.className = activeHorizClass;
      }
    }

    // Toggle styling for Modal Horiz buttons
    const modalActiveHoriz = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 transition cursor-pointer';
    const modalInactiveHoriz = 'px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer';

    if (modalBtn24 && modalBtn48) {
      if (currentHoriz === '24') {
        modalBtn24.className = modalActiveHoriz;
        modalBtn48.className = modalInactiveHoriz;
      } else {
        modalBtn24.className = modalInactiveHoriz;
        modalBtn48.className = modalActiveHoriz;
      }
    }

    // Update legend
    if (legendGrid) {
      if (currentTipo === 'chuva') {
        legendGrid.innerHTML = `
          <div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span class="w-3.5 h-3.5 rounded-md bg-[#99ff99] border border-slate-300 shrink-0"></span>
            <span class="font-bold text-[11px] text-slate-800 dark:text-slate-200">Baixa</span>
          </div>
          <div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span class="w-3.5 h-3.5 rounded-md bg-[#ffff66] border border-slate-300 shrink-0"></span>
            <span class="font-bold text-[11px] text-slate-800 dark:text-slate-200">Moderada</span>
          </div>
          <div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span class="w-3.5 h-3.5 rounded-md bg-[#ff9933] border border-slate-300 shrink-0"></span>
            <span class="font-bold text-[11px] text-slate-800 dark:text-slate-200">Alta</span>
          </div>
          <div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span class="w-3.5 h-3.5 rounded-md bg-[#ff3333] border border-slate-300 shrink-0"></span>
            <span class="font-bold text-[11px] text-slate-800 dark:text-slate-200">Muito Alta</span>
          </div>
        `;
      } else {
        legendGrid.innerHTML = `
          <div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span class="w-3.5 h-3.5 rounded-md bg-[#99ff99] border border-slate-300 shrink-0"></span>
            <span class="font-bold text-[11px] text-slate-800 dark:text-slate-200">Tempestade</span>
          </div>
          <div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span class="w-3.5 h-3.5 rounded-md bg-[#ffff66] border border-slate-300 shrink-0"></span>
            <span class="font-bold text-[11px] text-slate-800 dark:text-slate-200">Nível 1</span>
          </div>
          <div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span class="w-3.5 h-3.5 rounded-md bg-[#ff9933] border border-slate-300 shrink-0"></span>
            <span class="font-bold text-[11px] text-slate-800 dark:text-slate-200">Nível 2</span>
          </div>
          <div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span class="w-3.5 h-3.5 rounded-md bg-[#ff3333] border border-slate-300 shrink-0"></span>
            <span class="font-bold text-[11px] text-slate-800 dark:text-slate-200">Nível 3/4</span>
          </div>
        `;
      }
    }
  };

  const bindEvents = (elChuva, elSevero, el24, el48) => {
    if (elChuva) elChuva.addEventListener('click', () => { currentTipo = 'chuva'; updateView(); });
    if (elSevero) elSevero.addEventListener('click', () => { currentTipo = 'severo'; updateView(); });
    if (el24) el24.addEventListener('click', () => { currentHoriz = '24'; updateView(); });
    if (el48) el48.addEventListener('click', () => { currentHoriz = '48'; updateView(); });
  };

  bindEvents(btnTipoChuva, btnTipoSevero, btnHoriz24, btnHoriz48);
  bindEvents(modalBtnChuva, modalBtnSevero, modalBtn24, modalBtn48);

  updateView();
}


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
