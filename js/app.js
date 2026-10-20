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
  COTAS_INEA_OFICIAIS, 
  RIO_DAS_OSTRAS_COORDS 
} from './api.js?v=62';

import { renderBulletinChart } from './charts.js?v=62';
import { initRadarMap } from './radar.js?v=62';

// Estado global da aplicação
const state = {
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
  radarInitialized: false,
  isSyncing: false
};

document.addEventListener('DOMContentLoaded', () => {
  startHeroClock();
  setupModalsAndDock();
  setupPanoramaSinoticoControls();
  setupChartMetricTabs();
  setupActionButtons();
  setupPWA();
  loadAllApplicationData();
  startAutoSync();

  // Inicializa o Radar Meteorológico Doppler na tela principal após breve intervalo
  setTimeout(() => {
    if (!state.radarInitialized) {
      state.radarInitialized = true;
      initRadarMap('radar-map');
    }
  }, 400);
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

  // Modal 2: Radar Expandido
  const modalRadar = document.getElementById('modal-radar');
  const btnOpenRadar1 = document.getElementById('dock-btn-radar');
  const btnOpenRadar2 = document.getElementById('btn-abrir-radar-modal-1');
  const btnCloseRadar = document.getElementById('btn-close-modal-radar');
  const btnCloseRadarFoot = document.getElementById('btn-close-modal-radar-foot');

  const openRadar = () => {
    if (modalRadar) {
      modalRadar.classList.remove('hidden');
      modalRadar.classList.add('flex');
    }
  };
  const closeRadar = () => { if (modalRadar) modalRadar.classList.add('hidden'), modalRadar.classList.remove('flex'); };

  if (btnOpenRadar1) btnOpenRadar1.addEventListener('click', openRadar);
  if (btnOpenRadar2) btnOpenRadar2.addEventListener('click', openRadar);
  if (btnCloseRadar) btnCloseRadar.addEventListener('click', closeRadar);
  if (btnCloseRadarFoot) btnCloseRadarFoot.addEventListener('click', closeRadar);

  // Modal 3: Avisos Meteorológicos
  const modalAvisos = document.getElementById('modal-avisos');
  const btnOpenAvisos = document.getElementById('dock-btn-avisos');
  const btnCloseAvisos = document.getElementById('btn-close-modal-avisos');
  const btnCloseAvisosFoot = document.getElementById('btn-close-modal-avisos-foot');

  const openAvisos = () => { if (modalAvisos) modalAvisos.classList.remove('hidden'), modalAvisos.classList.add('flex'); };
  const closeAvisos = () => { if (modalAvisos) modalAvisos.classList.add('hidden'), modalAvisos.classList.remove('flex'); };

  if (btnOpenAvisos) btnOpenAvisos.addEventListener('click', openAvisos);
  if (btnCloseAvisos) btnCloseAvisos.addEventListener('click', closeAvisos);
  if (btnCloseAvisosFoot) btnCloseAvisosFoot.addEventListener('click', closeAvisos);

  // Modal 4: Meteogramas Oficiais (INMET & CPTEC/INPE)
  const modalMeteo = document.getElementById('modal-meteogramas');
  const btnOpenMeteo1 = document.getElementById('dock-btn-meteogramas');
  const btnOpenMeteo2 = document.getElementById('btn-open-meteogramas-card');
  const btnCloseMeteo = document.getElementById('btn-close-modal-meteogramas');
  const btnCloseMeteoFoot = document.getElementById('btn-close-modal-meteogramas-foot');

  const openMeteo = () => { if (modalMeteo) modalMeteo.classList.remove('hidden'), modalMeteo.classList.add('flex'); };
  const closeMeteo = () => { if (modalMeteo) modalMeteo.classList.add('hidden'), modalMeteo.classList.remove('flex'); };

  if (btnOpenMeteo1) btnOpenMeteo1.addEventListener('click', openMeteo);
  if (btnOpenMeteo2) btnOpenMeteo2.addEventListener('click', openMeteo);
  if (btnCloseMeteo) btnCloseMeteo.addEventListener('click', closeMeteo);
  if (btnCloseMeteoFoot) btnCloseMeteoFoot.addEventListener('click', closeMeteo);

  // Alternância de Abas: INMET COSMO vs CPTEC Multimodel
  const tabInmet = document.getElementById('tab-btn-inmet-meteo');
  const tabCptec = document.getElementById('tab-btn-cptec-meteo');
  const contentInmet = document.getElementById('tab-content-inmet-meteo');
  const contentCptec = document.getElementById('tab-content-cptec-meteo');

  if (tabInmet && tabCptec && contentInmet && contentCptec) {
    tabInmet.addEventListener('click', () => {
      tabInmet.className = 'px-4 py-2 text-xs sm:text-sm font-bold border-b-2 border-zinc-900 text-zinc-900 cursor-pointer flex items-center gap-2';
      tabCptec.className = 'px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 border-transparent text-zinc-500 hover:text-zinc-900 cursor-pointer flex items-center gap-2';
      contentInmet.classList.remove('hidden');
      contentCptec.classList.add('hidden');
    });

    tabCptec.addEventListener('click', () => {
      tabCptec.className = 'px-4 py-2 text-xs sm:text-sm font-bold border-b-2 border-zinc-900 text-zinc-900 cursor-pointer flex items-center gap-2';
      tabInmet.className = 'px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 border-transparent text-zinc-500 hover:text-zinc-900 cursor-pointer flex items-center gap-2';
      contentCptec.classList.remove('hidden');
      contentInmet.classList.add('hidden');
    });
  }

  // Fechar no ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBoletim();
      closeRadar();
      closeAvisos();
      closeMeteo();
    }
  });

  // Fechar ao clicar fora
  [modalBoletim, modalRadar, modalAvisos, modalMeteo].forEach(m => {
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
}

/**
 * 4. Carrega todos os dados das fontes oficiais
 */
async function loadAllApplicationData() {
  if (state.isSyncing) return;
  state.isSyncing = true;

  try {
    // FASE 1: Carregamento Ultrarrápido dos Snapshots Oficiais (< 50ms)
    // Renderiza a interface instantaneamente sem nenhum bloqueio
    const [metaRes, rowsRes, ineaRes, tabuaRes, orlaRes, avisosMarRes, balnearRes] = await Promise.allSettled([
      getBoletimMetadata(),
      getBoletimOficialData(),
      getIneaCheias(),
      getTabuaMares(),
      getOrlaCondicoes(),
      getMarinhaAvisos(),
      getBalneabilidade()
    ]);

    if (rowsRes.status === 'fulfilled' && Array.isArray(rowsRes.value)) state.boletimData = rowsRes.value;
    if (metaRes.status === 'fulfilled' && metaRes.value) state.boletimMetadata = metaRes.value;
    if (ineaRes.status === 'fulfilled' && Array.isArray(ineaRes.value)) {
      state.ineaCheias = ineaRes.value;
      renderJundiaTelemetry(state.ineaCheias);
    }
    if (tabuaRes.status === 'fulfilled' && tabuaRes.value) state.tabuaMares = tabuaRes.value;
    if (orlaRes.status === 'fulfilled' && orlaRes.value) state.orlaCondicoes = orlaRes.value;
    if (avisosMarRes.status === 'fulfilled' && avisosMarRes.value) state.marinhaAvisos = avisosMarRes.value;
    if (balnearRes.status === 'fulfilled' && balnearRes.value) state.balneabilidade = balnearRes.value;

    // Renderização Imediata (Fast-Path)
    renderDashboardUI(state.boletimMetadata, state.boletimData, state.weatherData);
    renderPanoramaSinotico(state.boletimMetadata);
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
    if (estacoes.status === 'fulfilled' && Array.isArray(estacoes.value)) state.acumuladosEstacoes = estacoes.value;
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

  // 2. Texto Integral Oficial em Cartões Nórdicos Cerâmicos Estruturados
  const textoCompletoEl = document.getElementById('sinopse-texto-completo');
  if (textoCompletoEl && sinopseGeral) {
    const paragrafos = sinopseGeral.split('\n\n').filter(p => p.trim());
    
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

function renderDashboardUI(meta, rows, weather) {
  const primeiroDia = meta?.dias_resumo?.[0];
  const hojeChuva = primeiroDia?.pilares?.chuva?.val || '2.1 mm';
  const hojeVento = primeiroDia?.pilares?.vento?.val || '32 km/h';

  // 1. Hero Card
  const condEl = document.getElementById('hero-condition');
  const subcondEl = document.getElementById('hero-subcondition');
  const heroAlertPill = document.getElementById('hero-alert-pill');
  const heroIcon = document.getElementById('hero-weather-icon');
  if (heroIcon && primeiroDia?.pilares?.ceu?.icon) {
    heroIcon.innerHTML = `<i data-lucide="${primeiroDia.pilares.ceu.icon}" class="w-12 h-12 sm:w-14 sm:h-14"></i>`;
  }

  if (condEl) {
    condEl.textContent = primeiroDia?.subtitulo?.split('•')?.[0]?.trim() || 'Parcialmente Nublado';
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
    const temAlertaHoje = (activeTodayAlerts.length > 0) || (state.marinhaAvisos && state.marinhaAvisos.aviso_ativo === true && state.marinhaAvisos.numero);

    if (temAlertaHoje) {
      heroAlertPill.textContent = 'Alerta Oficial Vigente Hoje';
      heroAlertPill.className = 'text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase bg-[#ffebe4] text-black border border-[#f97316] font-bold';
    } else if (futureAlerts.length > 0) {
      const pDia = futureAlerts[0].inicio_formatado ? futureAlerts[0].inicio_formatado.split(' ')[0] : '22/10';
      heroAlertPill.textContent = `Atenção: Alerta Previsto para ${pDia}`;
      heroAlertPill.className = 'text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase bg-[#eaf0f6] text-black border border-[#94a3b8] font-bold';
    } else {
      heroAlertPill.textContent = 'Normalidade Operacional';
      heroAlertPill.className = 'text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200';
    }
  }

  // 2. Temperatura e Métricas do Hero
  const sideTemp = document.getElementById('sidebar-temp');
  const sideWind = document.getElementById('sidebar-wind');
  const sideHum = document.getElementById('sidebar-hum');
  const sideSea = document.getElementById('sidebar-sea');

  if (sideTemp) {
    if (weather && weather.current_weather && weather.current_weather.temperature !== undefined) {
      sideTemp.textContent = `${Math.round(weather.current_weather.temperature)}°`;
    } else if (primeiroDia?.pilares?.temp?.val) {
      const maxVal = primeiroDia.pilares.temp.val.split(' a ')?.[1]?.replace('°C', '') || '27';
      sideTemp.textContent = `${maxVal.trim()}°`;
    } else if (rows && rows[0]) {
      sideTemp.textContent = `${rows[0].temp_max || 27}°`;
    }
  }

  if (sideWind && primeiroDia) {
    sideWind.textContent = primeiroDia.pilares?.vento?.val?.replace('Rajadas ', '') || '24 km/h';
  }

  if (sideHum && primeiroDia) {
    sideHum.textContent = primeiroDia.pilares?.umid?.val || '85%';
  }

  if (sideSea && primeiroDia) {
    sideSea.textContent = primeiroDia.pilares?.mar?.val || '2.2 m';
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
      const nomeDiaCurto = d.dia ? d.dia.split(/[•—\-]/)[0].trim() : '';
      const tempVal = d.pilares?.temp?.val ? d.pilares.temp.val.replace(' a ', ' / ') : '24° / 19°C';
      const condTxt = d.subtitulo ? d.subtitulo.split(/[•—\-]/)[0].trim() : 'Estável';
      const iconName = d.pilares?.ceu?.icon || 'cloud-sun';
      const chuvaVal = d.pilares?.chuva?.val || '0 mm';
      const theme = cardThemes[idx % 3];

      return `
        <div class="p-4 rounded-2xl ${theme.cardClass} space-y-2.5 cursor-pointer transition hover:scale-[1.01]" onclick="window.toggleDayCard(${idx})">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-3 min-w-0">
              <div class="${theme.medallionClass} w-9 h-9 shrink-0">
                <i data-lucide="${iconName}" class="w-4 h-4 ${theme.iconColor}"></i>
              </div>
              <div class="min-w-0">
                <span class="font-bold ${theme.titleText} text-sm block leading-tight truncate">${rotuloCurto} (${nomeDiaCurto})</span>
                <span class="text-xs font-normal ${theme.badgeText} block truncate">${condTxt} • ${chuvaVal}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0 pl-2">
              <span class="font-bold font-mono ${theme.tempText} text-sm sm:text-base">${tempVal}</span>
              <i data-lucide="chevron-down" id="day-card-chevron-${idx}" class="w-4 h-4 ${theme.chevronColor} transition"></i>
            </div>
          </div>

          <!-- Acordeão com os Pilares Oficiais e Informe à População -->
          <div id="day-card-collapse-${idx}" class="pilares-collapse hidden pt-3 border-t border-current/15 space-y-2.5">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2 rounded-xl ${theme.subCardBg}">
                <span class="${theme.subCardLabel} font-semibold block uppercase text-[10px] tracking-wider">Céu</span>
                <span class="font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.ceu?.val || '—')}</span>
              </div>
              <div class="p-2 rounded-xl ${theme.subCardBg}">
                <span class="${theme.subCardLabel} font-semibold block uppercase text-[10px] tracking-wider">Chuva</span>
                <span class="font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.chuva?.val || '—')}</span>
              </div>
              <div class="p-2 rounded-xl ${theme.subCardBg}">
                <span class="${theme.subCardLabel} font-semibold block uppercase text-[10px] tracking-wider">Vento</span>
                <span class="font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.vento?.val || '—')}</span>
              </div>
              <div class="p-2 rounded-xl ${theme.subCardBg}">
                <span class="${theme.subCardLabel} font-semibold block uppercase text-[10px] tracking-wider">Mar</span>
                <span class="font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.mar?.val || '—')}</span>
              </div>
            </div>

            ${Array.isArray(d.informe_populacao) && d.informe_populacao.length > 0 ? `
              <div class="mt-2 p-3 rounded-xl ${theme.subCardBg} text-xs sm:text-sm space-y-2 leading-relaxed">
                ${d.informe_populacao.map(item => `<p>${cleanBulletinText(item)}</p>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // 4. Barras de Chuva por Turno
  renderChuvaTurnosBars(rows);
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

/**
 * 6. Renderiza os Alertas Oficiais do INMET e da Marinha na Tela Principal (Compacto e com Cores Oficiais)
 */
function renderAlertasPrincipais(inmetAlerts, marinhaAvisos) {
  const container = document.getElementById('container-alertas-principais');
  const badgeTotal = document.getElementById('badge-total-alertas');
  const sectionAlertas = document.getElementById('section-alertas-oficiais');
  if (!container) return;

  const cardsHtml = [];

  // 1. Alertas Oficiais do INMET (filtrando apenas vigentes para Rio das Ostras e Litoral Norte)
  if (inmetAlerts && Array.isArray(inmetAlerts) && inmetAlerts.length > 0) {
    const directAlerts = inmetAlerts.filter(a => a.eh_direto_ostras !== false);
    directAlerts.sort((a, b) => {
      const tA = new Date(toIsoDate(a.data_inicio || a.inicio)).getTime() || 0;
      const tB = new Date(toIsoDate(b.data_inicio || b.inicio)).getTime() || 0;
      return tA - tB;
    });
    const nowIso = new Date().toISOString().slice(0, 10);

    directAlerts.forEach(a => {
      const inicioIso = toIsoDate(a.data_inicio || a.inicio);
      const fimIso = toIsoDate(a.data_fim || a.fim);
      const isVigenteHoje = inicioIso <= nowIso && nowIso <= fimIso;
      const isFuturo = inicioIso > nowIso;

      const titulo = a.descricao || 'Alerta Meteorológico';
      const alertInfo = getAlertBadgeAndClass(a.severidade, a.cor_nome);
      const periodo = `Vigência: ${a.inicio_formatado || a.inicio} até ${a.fim_formatado || a.fim}`;
      const riscos = (a.riscos && a.riscos[0]) ? a.riscos[0] : 'Chuva intensa, ventos fortes e descargas elétricas.';
      const instrucoes = (a.instrucoes && a.instrucoes[0]) ? a.instrucoes[0] : 'Não se abrigue debaixo de árvores. Em emergência ligue 199.';

      let statusBadge = isVigenteHoje 
        ? '<span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#ffebe4] text-black border border-[#f97316]">Vigente Hoje</span>'
        : (isFuturo 
            ? `<span class="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-[#f1f5f9] text-black border border-[#cbd5e1]">Programado para ${a.inicio_formatado ? a.inicio_formatado.split(' ')[0] : '22/10'}</span>`
            : '<span class="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-[#f1f5f9] text-black border border-[#cbd5e1]">Encerrado</span>');

      cardsHtml.push(`
        <div class="${alertInfo.cardClass} p-3 sm:p-3.5 space-y-2">
          <div class="flex items-center justify-between gap-2 border-b border-[#cbd5e1] pb-2 flex-wrap">
            <div class="flex items-center gap-1.5 flex-wrap">
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

          <div class="flex items-baseline justify-between gap-2 flex-wrap">
            <h3 class="text-sm sm:text-base font-bold text-black font-heading leading-tight">${titulo}</h3>
            <span class="text-[11px] font-medium text-black font-mono font-semibold whitespace-nowrap flex items-center gap-1.5 shrink-0">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-black"></i>
              ${periodo}
            </span>
          </div>

          <div class="p-3 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-black leading-snug space-y-1.5">
            <div><strong class="font-bold text-black">Riscos:</strong> ${cleanBulletinText(riscos)}</div>
            <div><strong class="font-bold text-black">Defesa Civil 199:</strong> ${cleanBulletinText(instrucoes)}</div>
          </div>
        </div>
      `);
    });
  }

  // 2. Alertas Oficiais da Marinha do Brasil (só renderiza se houver aviso real ativo)
  if (marinhaAvisos && marinhaAvisos.aviso_ativo === true && marinhaAvisos.numero) {
    const numero = marinhaAvisos.numero;
    const tipo = marinhaAvisos.tipo || 'VENTO FORTE / RESSACA';
    const area = marinhaAvisos.area || 'Área DELTA (Cabo Frio ao Farol de São Tomé)';
    const rajadas = marinhaAvisos.rajadas || 'Ventos fortes na orla';
    const marOndas = marinhaAvisos.mar_ondas || 'Mar agitado';
    const validade = marinhaAvisos.validade || marinhaAvisos.fim_formatado || 'Em vigor nas próximas 24 horas';
    const restricao = marinhaAvisos.restricao || 'Atenção a pescadores, banhistas e pequenas embarcações na orla marítima.';

    cardsHtml.push(`
      <div class="alert-card-marinha p-3 sm:p-3.5 space-y-2">
        <div class="flex items-center justify-between gap-2 border-b border-zinc-100 pb-1.5">
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-zinc-100 text-zinc-800 tracking-wide">
              MARINHA
            </span>
            <span class="text-xs font-semibold text-zinc-600 truncate">
              Capitania dos Portos / CHM
            </span>
          </div>
          <span class="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
            Aviso nº ${numero}
          </span>
        </div>

        <div class="flex items-baseline justify-between gap-2">
          <h3 class="text-sm sm:text-base font-bold text-black font-heading leading-tight">${tipo} • ${area}</h3>
          <span class="text-[11px] font-medium text-black font-mono font-semibold whitespace-nowrap flex items-center gap-1.5 shrink-0">
            <i data-lucide="clock" class="w-3.5 h-3.5 text-black"></i>
            ${validade}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-center text-xs">
          <div class="p-1.5 rounded-md bg-zinc-50/80 border border-zinc-200/50">
            <span class="text-[10px] uppercase font-semibold text-zinc-500 block">Rajadas</span>
            <span class="text-xs font-bold font-mono text-zinc-900">${rajadas}</span>
          </div>
          <div class="p-1.5 rounded-md bg-zinc-50/80 border border-zinc-200/50">
            <span class="text-[10px] uppercase font-semibold text-zinc-500 block">Mar</span>
            <span class="text-xs font-bold font-mono text-zinc-900">${marOndas}</span>
          </div>
        </div>

        <div class="p-2 rounded-lg bg-zinc-50/80 border border-zinc-200/50 text-xs text-zinc-700 leading-snug">
          <strong class="font-semibold text-zinc-900">Restrição:</strong> ${cleanBulletinText(restricao)}
        </div>
      </div>
    `);
  }

  if (cardsHtml.length > 0) {
    if (sectionAlertas) sectionAlertas.classList.remove('hidden');
    container.innerHTML = cardsHtml.join('');
    container.className = cardsHtml.length === 1 ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4';
    if (badgeTotal) {
      badgeTotal.textContent = `${cardsHtml.length} ${cardsHtml.length === 1 ? 'Alerta Ativo' : 'Alertas Ativos'}`;
      badgeTotal.className = 'text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#ffebe4] text-black border border-[#f97316]';
    }
  } else {
    // Quando não houver avisos, oculta o container de alertas da tela principal
    if (sectionAlertas) sectionAlertas.classList.add('hidden');
    container.innerHTML = '';
    if (badgeTotal) {
      badgeTotal.textContent = 'Sem Avisos';
      badgeTotal.className = 'text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200';
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

  if (!container || !rows || rows.length === 0) return;

  const totalGeral = rows.reduce((acc, r) => acc + (parseFloat(r.chuva_media) || 0), 0);
  if (badgeTotal) {
    badgeTotal.textContent = `Total 3D: ${totalGeral.toFixed(1)} mm`;
  }

  // Pega os 4 turnos do primeiro dia (Hoje)
  const turnosHoje = rows.slice(0, 4);
  const maxChuva = Math.max(...turnosHoje.map(r => parseFloat(r.chuva_media) || 0), 10);

  container.innerHTML = turnosHoje.map(r => {
    const val = parseFloat(r.chuva_media) || 0;
    const perc = Math.min(Math.round((val / maxChuva) * 100), 100);

    return `
      <div class="space-y-1.5">
        <div class="flex justify-between items-center text-xs font-semibold">
          <span class="text-black font-semibold">${r.turno}</span>
          <span class="font-mono font-bold text-black bg-[#f8fafc] px-2.5 py-0.5 rounded-md border border-[#cbd5e1]">${val.toFixed(1)} mm</span>
        </div>
        <div class="w-full h-2.5 rounded-full bg-[#f1f5f9] border border-[#cbd5e1]/60 overflow-hidden p-[1px]">
          <div class="h-full rounded-full bg-gradient-to-r from-[#f07a53] to-[#ea580c] transition-all duration-500" style="width: ${perc}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

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
    let statusClass = 'bg-[#eaf0f6] text-black border border-[#6d8ba6] font-bold';
    let badgeClass = 'bg-[#eaf0f6] text-black border border-[#6d8ba6] font-bold';
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
      statusClass = 'bg-[#eaf0f6] text-black border border-[#6d8ba6] font-bold';
      badgeClass = 'bg-[#eaf0f6] text-black border border-[#6d8ba6] font-bold';
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
      headerBadgeEl.className = `text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${badgeClass}`;
    }

    if (iconBoxEl) {
      iconBoxEl.className = `w-8 h-8 rounded-xl border flex items-center justify-center ${iconClass}`;
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
                    <td class="p-2.5 font-mono font-bold text-zinc-900">${r.chuva_media} mm</td>
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

  // Modal Avisos: INMET e Marinha
  const avisosList = document.getElementById('modal-avisos-list');
  if (avisosList) {
    let html = '';
    const inmetAtivos = (inmetAlerts && Array.isArray(inmetAlerts)) ? inmetAlerts.filter(a => a.eh_direto_ostras !== false) : [];
    if (inmetAtivos.length > 0) {
      inmetAtivos.forEach(a => {
        html += `
          <div class="p-3.5 rounded-lg border border-zinc-200 bg-white space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-zinc-950 uppercase">${a.descricao || 'Alerta Meteorológico'}</span>
              <span class="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase bg-[#ffebe4] text-black border border-[#f97316] font-bold">INMET</span>
            </div>
            <p class="text-xs text-zinc-600 font-normal leading-snug">${cleanBulletinText(a.instrucoes?.[0] || 'Acompanhe as atualizações da Defesa Civil.')}</p>
          </div>
        `;
      });
    }

    if (marinhaAvisos && marinhaAvisos.aviso_ativo === true && marinhaAvisos.numero) {
      html += `
        <div class="p-3.5 rounded-lg border border-zinc-200 bg-white space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-sm text-zinc-950 uppercase">${marinhaAvisos.tipo || 'Aviso Marítimo'}</span>
            <span class="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase bg-[#eaf0f6] text-black border border-[#94a3b8] font-bold">Marinha • Aviso nº ${marinhaAvisos.numero}</span>
          </div>
          <p class="text-xs text-zinc-600 font-normal leading-snug">${cleanBulletinText(marinhaAvisos.validade || 'Condições de mar agitado e vento forte na costa.')}</p>
        </div>
      `;
    }

    if (!html) {
      html = '<div class="p-4 text-center font-medium text-zinc-500 text-sm">Nenhum aviso meteorológico severo vigente para Rio das Ostras no momento.</div>';
    }

    avisosList.innerHTML = html;
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
  // Botão Instalar App
  const btnInstall = document.getElementById('btn-install-desktop');
  const modalInstall = document.getElementById('modal-install-guide');
  const btnCloseInstall = document.getElementById('btn-close-install-modal');

  if (btnInstall && modalInstall) {
    btnInstall.addEventListener('click', () => {
      modalInstall.classList.remove('hidden');
      modalInstall.classList.add('flex');
    });
  }

  if (btnCloseInstall && modalInstall) {
    btnCloseInstall.addEventListener('click', () => {
      modalInstall.classList.add('hidden');
      modalInstall.classList.remove('flex');
    });
  }

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
    navigator.serviceWorker.register('./sw.js?v=73').catch(() => {});
  }
}

function startAutoSync() {
  // Sincronização periódica a cada 15 minutos
  setInterval(loadAllApplicationData, 15 * 60 * 1000);
}

// Exposição global das funções de abas e dias da Orla
window.switchOrlaTab = function(tabName) {
  state.activeOrlaTab = tabName;
  const tabs = ['mar', 'mares', 'balnear'];
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

    let waveSwellTxt = 'Swell de E/SE • Ondulação média de 1,2 a 1,6 m na orla oceânica • Águas calmas e abrigadas nas enseadas.';
    let statusGeralTxt = 'Mar Calmo a Moderado na Orla';
    let statusBadgeTxt = 'Normalidade';
    let ondasEnseadaTxt = '0,3 a 0,7 m';
    let ondasOceanicaTxt = '1,2 a 1,6 m';

    if (dayKey === 'd1') {
      waveSwellTxt = 'Swell de E • Ondulação mais branda de 1,0 a 1,4 m • Águas calmas e límpidas na maioria das enseadas.';
      statusGeralTxt = 'Mar Moderado com Tendência a Amansar';
      statusBadgeTxt = 'Bom para Banho';
      ondasEnseadaTxt = '0,3 a 0,6 m';
      ondasOceanicaTxt = '1,0 a 1,4 m';
    } else if (dayKey === 'd2') {
      waveSwellTxt = 'Swell de E/NE • Ondulação fraca a moderada de 0,8 a 1,2 m • Águas claras e mar sereno em toda a faixa de enseadas.';
      statusGeralTxt = 'Mar Calmo em quase toda a Região';
      statusBadgeTxt = 'Excelente';
      ondasEnseadaTxt = '0,2 a 0,5 m';
      ondasOceanicaTxt = '0,8 a 1,2 m';
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
  const temVento = marinhaAvisos && marinhaAvisos.aviso_ativo && String(marinhaAvisos.tipo).toUpperCase().includes('VENTO');

  if (badgeEl) {
    if (temRessaca) {
      badgeEl.className = 'text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase bg-rose-50 text-rose-800 border border-rose-200';
      badgeEl.textContent = `Ressaca (Aviso nº ${marinhaAvisos.numero})`;
    } else if (temVento) {
      badgeEl.className = 'text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase bg-[#ffebe4] text-black border border-[#f97316] font-bold';
      badgeEl.textContent = `Vento Forte (Aviso nº ${marinhaAvisos.numero})`;
    } else {
      badgeEl.className = 'text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200';
      badgeEl.textContent = 'Normalidade';
    }
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
