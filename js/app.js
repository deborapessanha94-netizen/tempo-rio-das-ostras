/**
 * Aplicação Oficial — TEMPO em Rio das Ostras
 * Sistema Municipal de Meteorologia, Boletins Operacionais e Alertas da Defesa Civil
 */

import { 
  getRioDasOstrasWeatherData, 
  getInmetForecast, 
  getInmetAlerts, 
  getIneaCheias,
  getBoletimOficialData,
  getBoletimMetadata,
  COTAS_INEA_OFICIAIS,
  RIO_DAS_OSTRAS_COORDS 
} from './api.js';

import { renderBulletinChart } from './charts.js';
import { initRadarMap } from './radar.js';

// Estado global da aplicação
const state = {
  boletimData: [],
  boletimMetadata: null,
  ineaCheias: [],
  inmetAlerts: [],
  weatherData: null,
  activeMetric: 'temperature',
  activeTab: 'tab-populacao',
  radarInitialized: false,
  isSyncing: false
};

document.addEventListener('DOMContentLoaded', () => {
  setupNavigationTabs();
  setupBulletinChartTabs();
  setupActionButtons();
  setupPWA();
  loadAllApplicationData();
  startAutoSync();
});

/**
 * Configura as Abas Principais do Sistema (Informativo, Boletim, Gráficos, Radar)
 */
function setupNavigationTabs() {
  const tabButtons = document.querySelectorAll('.nav-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      if (!targetId) return;

      state.activeTab = targetId;

      // Atualiza botões
      tabButtons.forEach(b => {
        b.classList.remove('active', 'bg-[#1E3A8A]', 'text-white', 'border-blue-600/50', 'shadow-sm');
        b.classList.add('text-slate-400', 'hover:text-slate-200', 'hover:bg-[#111C33]');
      });
      btn.classList.add('active', 'bg-[#1E3A8A]', 'text-white', 'border-blue-600/50', 'shadow-sm');
      btn.classList.remove('text-slate-400', 'hover:text-slate-200', 'hover:bg-[#111C33]');

      // Exibe aba correspondente
      tabPanes.forEach(pane => {
        if (pane.id === targetId) {
          pane.classList.remove('hidden');
        } else {
          pane.classList.add('hidden');
        }
      });

      // Ações específicas ao abrir cada aba
      if (targetId === 'tab-graficos') {
        updateBulletinChart();
      } else if (targetId === 'tab-aovivo') {
        if (!state.radarInitialized) {
          state.radarInitialized = true;
          initRadarMap('radar-map');
        }
      }

      if (window.lucide) window.lucide.createIcons();
    });
  });
}

/**
 * Configura as Sub-abas do Gráfico Oficial do Boletim (5 Variáveis)
 */
function setupBulletinChartTabs() {
  const chartButtons = document.querySelectorAll('.bulletin-tab-btn');

  chartButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      chartButtons.forEach(b => {
        b.classList.remove('active', 'bg-[#1E3A8A]', 'text-white', 'font-medium');
        b.classList.add('text-slate-400', 'hover:text-white');
      });
      btn.classList.add('active', 'bg-[#1E3A8A]', 'text-white', 'font-medium');
      btn.classList.remove('text-slate-400', 'hover:text-white');

      state.activeMetric = btn.getAttribute('data-metric') || 'temperature';
      updateBulletinChart();
    });
  });
}

/**
 * Configura botões de ação (Imprimir, Atualizar, etc.)
 */
function setupActionButtons() {
  const btnPrint = document.getElementById('btn-print-bulletin');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  const btnRefresh = document.getElementById('btn-refresh-desktop');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', async () => {
      btnRefresh.querySelector('i')?.classList.add('animate-spin');
      await loadAllApplicationData();
      btnRefresh.querySelector('i')?.classList.remove('animate-spin');
    });
  }
}

/**
 * Carrega todos os dados do sistema com redundância e tolerância a falhas
 */
async function loadAllApplicationData() {
  if (state.isSyncing) return;
  state.isSyncing = true;

  try {
    const [boletimRows, boletimMeta, ineaStations, alerts, openMeteo] = await Promise.allSettled([
      getBoletimOficialData(),
      getBoletimMetadata(),
      getIneaCheias(),
      getInmetAlerts(),
      getRioDasOstrasWeatherData()
    ]);

    if (boletimRows.status === 'fulfilled' && Array.isArray(boletimRows.value) && boletimRows.value.length > 0) {
      state.boletimData = boletimRows.value;
    }

    if (boletimMeta.status === 'fulfilled' && boletimMeta.value) {
      state.boletimMetadata = boletimMeta.value;
    }

    if (ineaStations.status === 'fulfilled' && Array.isArray(ineaStations.value) && ineaStations.value.length > 0) {
      state.ineaCheias = ineaStations.value;
      renderJundiaTelemetry(state.ineaCheias);
    }

    if (alerts.status === 'fulfilled' && Array.isArray(alerts.value)) {
      state.inmetAlerts = alerts.value;
    }

    if (openMeteo.status === 'fulfilled' && openMeteo.value) {
      state.weatherData = openMeteo.value;
    }

    // Atualiza o gráfico do boletim se a aba de gráficos estiver visível
    updateBulletinChart();

  } catch (error) {
    console.warn('Aviso durante carregamento:', error);
  } finally {
    state.isSyncing = false;
    if (window.lucide) window.lucide.createIcons();
  }
}

/**
 * Renderiza o gráfico oficial do boletim selecionado
 */
function updateBulletinChart() {
  const canvas = document.getElementById('bulletin-chart');
  if (canvas && state.boletimData && state.boletimData.length > 0) {
    renderBulletinChart(canvas, state.activeMetric, state.boletimData);
  }
}

/**
 * Renderiza a telemetria ao vivo da régua do Rio Jundiá (Estação 2241036) e bacia
 */
function renderJundiaTelemetry(stations) {
  if (!stations || stations.length === 0) return;

  // Localiza a estação do Rio Jundiá (Rio das Ostras)
  const jundia = stations.find(s => s.eh_rio_das_ostras || s.nome_estacao.toLowerCase().includes('jundi') || s.curso_dagua.toLowerCase().includes('jundi'));

  if (jundia) {
    const levelEl = document.getElementById('jundia-current-level');
    const readingEl = document.getElementById('jundia-last-reading');
    const percentEl = document.getElementById('jundia-percentage');
    const progressEl = document.getElementById('jundia-progress-bar');
    const statusBadge = document.getElementById('jundia-status-badge');

    const rain1h = document.getElementById('jundia-rain-1h');
    const rain4h = document.getElementById('jundia-rain-4h');
    const rain24h = document.getElementById('jundia-rain-24h');
    const rain96h = document.getElementById('jundia-rain-96h');
    const rain30d = document.getElementById('jundia-rain-30d');

    if (levelEl) levelEl.textContent = `${jundia.nivel_rio} m`;
    if (readingEl) readingEl.textContent = `Última leitura: ${jundia.ultima_leitura || 'Hoje'}`;
    if (percentEl) percentEl.textContent = `${jundia.porcentagem_calha}% da Cota de Transbordo (${jundia.cota_transborda || '2.84 m'})`;
    
    if (progressEl) {
      progressEl.style.width = `${Math.min(100, Math.max(5, jundia.porcentagem_calha))}%`;
    }

    if (statusBadge) {
      statusBadge.textContent = jundia.status || 'ALERTA MÁXIMO';
      if (jundia.status === 'TRANSBORDAMENTO' || jundia.status === 'ALERTA MÁXIMO') {
        statusBadge.className = 'px-2.5 py-0.5 rounded bg-red-950/80 text-red-300 font-bold text-xs border border-red-800/80';
      } else if (jundia.status === 'ALERTA') {
        statusBadge.className = 'px-2.5 py-0.5 rounded bg-orange-950/80 text-orange-300 font-bold text-xs border border-orange-800/80';
      } else if (jundia.status === 'ATENÇÃO') {
        statusBadge.className = 'px-2.5 py-0.5 rounded bg-amber-950/80 text-amber-300 font-medium text-xs border border-amber-800/80';
      } else {
        statusBadge.className = 'px-2.5 py-0.5 rounded bg-[#0C1527] text-slate-300 font-medium text-xs border border-[#1D2C48]';
      }
    }

    if (rain1h) rain1h.textContent = `${jundia.chuva_1h || '0.0'} mm`;
    if (rain4h) rain4h.textContent = `${jundia.chuva_4h || '0.0'} mm`;
    if (rain24h) rain24h.textContent = `${jundia.chuva_24h || '0.0'} mm`;
    if (rain96h) rain96h.textContent = `${jundia.chuva_96h || '0.0'} mm`;
    if (rain30d) rain30d.textContent = `${jundia.chuva_30d || '0.0'} mm`;
  }

  // Renderiza as demais estações da Bacia Hidrográfica
  const otherGrid = document.getElementById('other-stations-grid');
  if (otherGrid) {
    const others = stations.filter(s => s !== jundia);
    otherGrid.innerHTML = others.map(st => {
      let badgeBg = 'bg-[#111C33] text-slate-400 border-[#1D2C48]';
      if (st.status === 'TRANSBORDAMENTO') badgeBg = 'bg-red-950/70 text-red-300 border-red-800/60 font-semibold';
      else if (st.status === 'ALERTA' || st.status === 'ALERTA MÁXIMO') badgeBg = 'bg-red-950/70 text-red-300 border-red-800/60 font-semibold';
      else if (st.status === 'ATENÇÃO') badgeBg = 'bg-amber-950/70 text-amber-300 border-amber-800/60 font-medium';
      else if (st.status === 'NORMAL') badgeBg = 'bg-[#111C33] text-slate-400 border-[#1D2C48]';

      return `
        <div class="p-3 rounded-lg bg-[#0C1527] border border-[#1D2C48] space-y-1.5 hover:border-[#2b4066] transition">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white text-xs">${st.nome_estacao} (${st.municipio})</span>
            <span class="px-1.5 py-0.5 rounded text-[9px] border ${badgeBg}">${st.status}</span>
          </div>
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span>Rio: <strong class="text-slate-300">${st.curso_dagua}</strong></span>
            <span>Nível: <strong class="text-slate-100 font-mono">${st.nivel_rio} m</strong></span>
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-500 border-t border-[#1D2C48] pt-1">
            <span>Transbordo: ${st.cota_transborda || '—'}</span>
            <span>Chuva 24h: <strong class="text-slate-300">${st.chuva_24h} mm</strong></span>
          </div>
        </div>
      `;
    }).join('');
  }
}

/**
 * Inicia ciclo de sincronização automática silenciosa
 */
function startAutoSync() {
  setInterval(() => {
    loadAllApplicationData();
  }, 60 * 1000);
}

/**
 * PWA Service Worker Registration & Instalação no Celular
 */
let deferredPrompt = null;

function setupPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.info('Service Worker ativo 24/7:', reg.scope);
        })
        .catch(err => {
          console.warn('Service Worker erro:', err);
        });
    });
  }

  const btnDesktop = document.getElementById('btn-install-desktop');
  const modalGuide = document.getElementById('modal-install-guide');
  const btnCloseGuide = document.getElementById('btn-close-install-modal');
  const btnTrigger = document.getElementById('btn-install-prompt-trigger');

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator.standalone === true);
  if (isStandalone) {
    if (btnDesktop) btnDesktop.classList.add('hidden');
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          if (btnDesktop) btnDesktop.classList.add('hidden');
          if (modalGuide) {
            modalGuide.classList.add('hidden');
            modalGuide.classList.remove('flex');
          }
        }
        deferredPrompt = null;
      } catch (e) {
        console.warn('Prompt de instalação:', e);
      }
    } else {
      if (modalGuide) {
        modalGuide.classList.remove('hidden');
        modalGuide.classList.add('flex');
        if (window.lucide) window.lucide.createIcons();
      }
    }
  };

  if (btnDesktop) btnDesktop.addEventListener('click', handleInstallClick);
  if (btnTrigger) btnTrigger.addEventListener('click', handleInstallClick);

  if (btnCloseGuide && modalGuide) {
    btnCloseGuide.addEventListener('click', () => {
      modalGuide.classList.add('hidden');
      modalGuide.classList.remove('flex');
    });

    modalGuide.addEventListener('click', (e) => {
      if (e.target === modalGuide) {
        modalGuide.classList.add('hidden');
        modalGuide.classList.remove('flex');
      }
    });
  }

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (btnDesktop) btnDesktop.classList.add('hidden');
    if (modalGuide) {
      modalGuide.classList.add('hidden');
      modalGuide.classList.remove('flex');
    }
  });
}
