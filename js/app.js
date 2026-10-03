/**
 * Aplicação Principal MeteoPulse — RIO DAS OSTRAS (RJ)
 * Sistema de Previsão, Defesa Civil, Telemetria INEA e Modelos VIME INMET
 */

import { 
  getRioDasOstrasWeatherData, 
  getInmetForecast, 
  getInmetAlerts, 
  getIneaCheias,
  calculatePrecipitableWater,
  getLocalHourIndex,
  RIO_DAS_OSTRAS_COORDS 
} from './api.js';

import { 
  getWeatherCondition, 
  getBeaufortData, 
  getWindCompassDirection, 
  getPressureInterpretation, 
  getHumidityClassification, 
  getPrecipitableWaterInterpretation 
} from './weather-codes.js';

import { renderHourlyChart } from './charts.js';
import { initRadarMap } from './radar.js';

// Estado global da aplicação
const state = {
  weatherData: null,
  inmetForecast: null,
  inmetAlerts: [],
  ineaCheias: [],
  activeMetric: 'temperature',
  currentHorizon: 0, // 0 = Hoje, 24 = +24h, 48 = +48h, 72 = +72h, 96 = +96h
  lastSyncTime: null,
  isSyncing: false,
  autoSyncIntervalMs: 60 * 1000, // Polling a cada 60 segundos para captar atualizações oficiais imediatamente
  syncTimerId: null,
  radarInitialized: false
};

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadAllRioDasOstrasData();
  startAutoSync();
});

function setupEventListeners() {
  const refreshMobile = document.getElementById('btn-refresh-data');
  const refreshDesktop = document.getElementById('btn-refresh-desktop');
  const refreshInea = document.getElementById('btn-refresh-inea');

  const triggerRefresh = async () => {
    await loadAllRioDasOstrasData(false);
  };

  if (refreshMobile) refreshMobile.addEventListener('click', triggerRefresh);
  if (refreshDesktop) refreshDesktop.addEventListener('click', triggerRefresh);
  if (refreshInea) refreshInea.addEventListener('click', triggerRefresh);

  // Filtros de Projeção Temporal (Hoje, +24h, +48h, +72h, +96h)
  const projButtons = document.querySelectorAll('.projection-btn');
  projButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      projButtons.forEach(b => {
        b.classList.remove('active', 'bg-sky-500', 'text-white', 'shadow-md');
        b.classList.add('bg-slate-800', 'text-slate-300');
      });
      btn.classList.add('active', 'bg-sky-500', 'text-white', 'shadow-md');
      btn.classList.remove('bg-slate-800', 'text-slate-300');

      state.currentHorizon = parseInt(btn.getAttribute('data-horizon') || '0', 10);
      renderHeroAndTurnos();
      renderThe5Pillars();
      renderVimePanel();
    });
  });

  // Abas do Gráfico
  const chartTabs = document.querySelectorAll('.chart-tab-btn');
  chartTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      chartTabs.forEach(t => {
        t.classList.remove('active', 'bg-sky-500', 'text-white');
        t.classList.add('text-slate-400');
      });
      tab.classList.add('active', 'bg-sky-500', 'text-white');
      tab.classList.remove('text-slate-400');

      state.activeMetric = tab.getAttribute('data-metric');
      updateChart();
    });
  });
}

/**
 * Inicia o ciclo de sincronização automática e monitoramento contínuo das fontes
 */
function startAutoSync() {
  if (state.syncTimerId) clearInterval(state.syncTimerId);

  // Intervalo recorrente de 60 segundos
  state.syncTimerId = setInterval(() => {
    loadAllRioDasOstrasData(true);
  }, state.autoSyncIntervalMs);

  // Re-sincronização imediata quando o usuário volta para a aba
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const now = new Date();
      if (!state.lastSyncTime || (now.getTime() - state.lastSyncTime.getTime()) > 45000) {
        loadAllRioDasOstrasData(false);
      }
    }
  });

  // Re-sincroniza ao recuperar conexão com a internet
  window.addEventListener('online', () => {
    loadAllRioDasOstrasData(false);
  });
}

/**
 * Carrega simultaneamente todos os dados das fontes oficiais para Rio das Ostras
 * @param {boolean} isSilent Se true, faz a atualização em segundo plano sem desarmar a interface
 */
async function loadAllRioDasOstrasData(isSilent = false) {
  if (state.isSyncing) return;
  state.isSyncing = true;

  const statusEl = document.getElementById('status-live-indicator');
  const refreshBtns = [
    document.getElementById('btn-refresh-data'), 
    document.getElementById('btn-refresh-desktop'),
    document.getElementById('btn-refresh-inea')
  ];

  if (!isSilent) {
    if (statusEl) statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-spin"></span> Sincronizando...`;
    refreshBtns.forEach(btn => btn && btn.classList.add('animate-spin'));
  }

  try {
    const prevAlertCount = Array.isArray(state.inmetAlerts) ? state.inmetAlerts.length : 0;
    const prevRiverStation = Array.isArray(state.ineaCheias) 
      ? state.ineaCheias.find(s => s.eh_rio_das_ostras) 
      : null;
    const prevRiverStatus = prevRiverStation ? (prevRiverStation.status || '') : '';
    const prevRiverLevel = prevRiverStation ? (prevRiverStation.nivel_rio || '') : '';

    const [weatherRes, inmetPrevRes, inmetAvisosRes, ineaRes] = await Promise.allSettled([
      getRioDasOstrasWeatherData(),
      getInmetForecast(),
      getInmetAlerts(),
      getIneaCheias()
    ]);

    if (weatherRes.status === 'fulfilled' && weatherRes.value) state.weatherData = weatherRes.value;
    if (inmetPrevRes.status === 'fulfilled' && inmetPrevRes.value) state.inmetForecast = inmetPrevRes.value;
    if (inmetAvisosRes.status === 'fulfilled') state.inmetAlerts = inmetAvisosRes.value || [];
    if (ineaRes.status === 'fulfilled') state.ineaCheias = ineaRes.value || [];

    state.lastSyncTime = new Date();

    // Renderiza todos os blocos especializados preservando o estado do usuário
    renderOfficialAlerts();
    renderHeroAndTurnos();
    renderVimePanel();
    renderThe5Pillars();
    renderIneaTable();
    renderHourlyTimeline();
    renderDailyForecast();
    updateChart();

    if (!state.radarInitialized) {
      await initRadarMap('radar-map');
      state.radarInitialized = true;
    }

    // Detecção de mudanças nas fontes oficiais para notificação ao usuário
    const newAlertCount = Array.isArray(state.inmetAlerts) ? state.inmetAlerts.length : 0;
    const newRiverStation = Array.isArray(state.ineaCheias) ? state.ineaCheias.find(s => s.eh_rio_das_ostras) : null;
    const newRiverStatus = newRiverStation ? (newRiverStation.status || '') : '';
    const newRiverLevel = newRiverStation ? (newRiverStation.nivel_rio || '') : '';

    if (isSilent) {
      if (newRiverLevel !== prevRiverLevel && prevRiverLevel !== '') {
        showSyncNotification(`Telemetria INEA: Nível do Rio Jundiá atualizado para ${newRiverLevel}m (Status: ${newRiverStatus}).`);
      } else if (newRiverStatus !== prevRiverStatus && prevRiverStatus !== '') {
        showSyncNotification(`Alerta Hidrológico INEA: Status Rio Jundiá alterado para ${newRiverStatus}.`);
      } else if (newAlertCount !== prevAlertCount) {
        showSyncNotification(`Atualização oficial INMET: ${newAlertCount} avisos meteorológicos ativos.`);
      }
    }

    const h = String(state.lastSyncTime.getHours()).padStart(2, '0');
    const m = String(state.lastSyncTime.getMinutes()).padStart(2, '0');
    const s = String(state.lastSyncTime.getSeconds()).padStart(2, '0');
    const timeFormatted = `${h}:${m}:${s}`;

    if (statusEl) {
      statusEl.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="font-semibold text-emerald-300">Ao Vivo: ${timeFormatted}</span>
        <span class="text-[10px] text-emerald-400/80 font-mono hidden sm:inline">• Cotas a cada 5 min</span>
      `;
      statusEl.title = `Monitoramento ativo. Cotas telemétricas e dados oficiais checados a cada 5 min. Última checagem: ${timeFormatted}`;
    }
  } catch (error) {
    console.error('Erro ao sincronizar Rio das Ostras:', error);
    if (statusEl) statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500"></span> Conexão Parcial`;
  } finally {
    state.isSyncing = false;
    refreshBtns.forEach(btn => btn && btn.classList.remove('animate-spin'));
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Exibe notificação suave na tela quando as fontes oficiais trazem dados novos
 */
function showSyncNotification(msg) {
  let toast = document.getElementById('live-update-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'live-update-toast';
    toast.className = 'fixed bottom-5 right-5 z-50 max-w-md p-3 rounded-xl bg-slate-900/95 border border-sky-500/50 shadow-2xl text-xs text-white flex items-center gap-3 transition-all duration-500 transform translate-y-2 opacity-0 pointer-events-none backdrop-blur-md';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <div class="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
      <i data-lucide="refresh-cw" class="w-4 h-4 animate-spin"></i>
    </div>
    <div class="min-w-0 flex-1">
      <span class="font-bold text-sky-300 block text-[11px] uppercase tracking-wider">Fontes Oficiais Atualizadas</span>
      <p class="text-slate-300 text-[11px] leading-tight mt-0.5">${msg}</p>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  toast.classList.remove('translate-y-2', 'opacity-0', 'pointer-events-none');
  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0', 'pointer-events-none');
  }, 6000);
}

/**
 * Formata datas no formato brasileiro por extenso
 */
function getExtensiveDate(dateObj) {
  const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  const w = weekDays[dateObj.getDay()];
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = months[dateObj.getMonth()];
  const y = dateObj.getFullYear();
  return `${w}, ${d} de ${m} de ${y}`;
}

/**
 * Renderiza o Hero Principal conforme o horizonte de projeção escolhido
 */
function renderHeroAndTurnos() {
  if (!state.weatherData) return;
  const { current, hourly, daily } = state.weatherData;

  const now = new Date();
  const horizon = state.currentHorizon;
  const dayIndex = Math.min(4, Math.floor(horizon / 24));

  // Calcula a data do horizonte projetado
  const targetDate = new Date(now.getTime() + horizon * 60 * 60 * 1000);
  const dateFormatted = getExtensiveDate(targetDate);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const heroDateEl = document.getElementById('hero-current-date');
  const heroTimeEl = document.getElementById('hero-current-time');

  if (horizon === 0) {
    if (heroDateEl) heroDateEl.textContent = `Hoje — ${dateFormatted}`;
    if (heroTimeEl) heroTimeEl.textContent = `🕒 ${timeStr} (Tempo Real)`;
  } else {
    if (heroDateEl) heroDateEl.textContent = `Projeção para +${horizon}h — ${dateFormatted}`;
    if (heroTimeEl) heroTimeEl.textContent = `🔮 Cenário Modelado D+${dayIndex}`;
  }

  // Dados de temperatura para o horizonte
  let temp, feels, minTemp, maxTemp, weatherCode;

  if (horizon === 0) {
    temp = Math.round(current.temperature_2m);
    feels = Math.round(current.apparent_temperature);
    minTemp = daily && daily.temperature_2m_min ? Math.round(daily.temperature_2m_min[0]) : temp;
    maxTemp = daily && daily.temperature_2m_max ? Math.round(daily.temperature_2m_max[0]) : temp;
    weatherCode = current.weather_code;
  } else {
    // Busca na série horária no índice correspondente ao horizonte
    const hourIdx = Math.min(hourly.time.length - 1, horizon);
    temp = Math.round(hourly.temperature_2m[hourIdx]);
    feels = Math.round(hourly.apparent_temperature[hourIdx]);
    minTemp = daily && daily.temperature_2m_min ? Math.round(daily.temperature_2m_min[dayIndex]) : temp;
    maxTemp = daily && daily.temperature_2m_max ? Math.round(daily.temperature_2m_max[dayIndex]) : temp;
    weatherCode = hourly.weather_code[hourIdx];
  }

  const cond = getWeatherCondition(weatherCode);

  // Estação INEA Rio Jundiá
  const ostrasStation = Array.isArray(state.ineaCheias) 
    ? state.ineaCheias.find(s => s.eh_rio_das_ostras || (s.municipio && s.municipio.includes('Ostras')))
    : null;

  // Refinamento de condição em Tempo Real:
  // Se o modelo numérico projetar código de tempestade (95) ou pancadas severas, mas a precipitação instantânea
  // for nula (< 0.5 mm/h) e o pluviômetro local não registrar chuva torrencial, exibe status contextualizado
  let conditionText = cond.label;
  if (horizon === 0) {
    const isCurrentRain = current.precipitation && current.precipitation >= 0.5;
    const ineaHasRain = ostrasStation && parseFloat(ostrasStation.chuva_1h) >= 0.5;
    if (weatherCode >= 95 && !isCurrentRain && !ineaHasRain) {
      conditionText = 'Instável / Risco de Temporal';
    } else if (weatherCode >= 80 && weatherCode <= 82 && !isCurrentRain && !ineaHasRain) {
      conditionText = 'Nublado / Pancadas Previstas';
    }
  }

  document.getElementById('current-temp').textContent = `${temp}°C`;
  document.getElementById('current-condition-text').textContent = conditionText;
  document.getElementById('current-feels-like').textContent = `${feels}°C`;
  document.getElementById('today-min-temp').textContent = `${minTemp}°C`;
  document.getElementById('today-max-temp').textContent = `${maxTemp}°C`;

  // Mini métricas do Hero conforme horizonte
  let precipSum = '0.0';
  let precipProb = 0;
  let windSpd = 0;
  let gusts = 0;
  let pMsl = 1015;
  let humidity = 60;
  let dewPoint = 18;

  if (horizon === 0) {
    precipSum = daily && daily.precipitation_sum ? daily.precipitation_sum[0].toFixed(1) : '0.0';
    precipProb = daily && daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0;
    windSpd = Math.round(current.wind_speed_10m || 0);
    gusts = Math.round(current.wind_gusts_10m || windSpd);
    pMsl = Math.round(current.pressure_msl || current.surface_pressure || 1015);
    humidity = Math.round(current.relative_humidity_2m);
    dewPoint = current.dew_point_2m || 18;
  } else {
    precipSum = daily && daily.precipitation_sum ? daily.precipitation_sum[dayIndex].toFixed(1) : '0.0';
    precipProb = daily && daily.precipitation_probability_max ? daily.precipitation_probability_max[dayIndex] : 0;
    const hourIdx = Math.min(hourly.time.length - 1, horizon);
    windSpd = Math.round(hourly.wind_speed_10m[hourIdx] || 0);
    gusts = Math.round(hourly.wind_gusts_10m[hourIdx] || windSpd);
    pMsl = Math.round(hourly.pressure_msl ? hourly.pressure_msl[hourIdx] : (hourly.surface_pressure[hourIdx] || 1015));
    humidity = Math.round(hourly.relative_humidity_2m[hourIdx]);
    dewPoint = hourly.dew_point_2m ? hourly.dew_point_2m[hourIdx] : 18;
  }

  // Atualização transparente da métrica de Chuva (Medição Real vs Projeção do Modelo)
  const heroPrecipSumEl = document.getElementById('hero-precip-sum');
  const heroPrecipProbEl = document.getElementById('hero-precip-prob');
  const heroPrecipProjEl = document.getElementById('hero-precip-projection');
  const heroPrecipTitleEl = document.getElementById('hero-precip-title');
  const heroPrecipBadgeEl = document.getElementById('hero-precip-badge');

  if (horizon === 0) {
    if (heroPrecipTitleEl) heroPrecipTitleEl.textContent = 'Chuva Agora';
    if (heroPrecipBadgeEl) heroPrecipBadgeEl.textContent = 'Tempo Real';

    const currentPrecipVal = current.precipitation || 0;
    if (heroPrecipSumEl) {
      if (currentPrecipVal > 0) {
        heroPrecipSumEl.textContent = `${currentPrecipVal.toFixed(1)} mm/h`;
      } else {
        heroPrecipSumEl.textContent = `0.0 mm/h`;
      }
    }

    if (heroPrecipProbEl) {
      if (ostrasStation) {
        heroPrecipProbEl.textContent = `Pluviômetro 24h: ${ostrasStation.chuva_24h || '0.0'} mm`;
      } else {
        heroPrecipProbEl.textContent = currentPrecipVal > 0 ? 'Chuva em andamento' : 'Sem chuva no momento';
      }
    }

    if (heroPrecipProjEl) {
      heroPrecipProjEl.textContent = `Projeção Modelo 24h: ${precipSum} mm (${precipProb}%)`;
    }
  } else {
    if (heroPrecipTitleEl) heroPrecipTitleEl.textContent = 'Chuva Prevista';
    if (heroPrecipBadgeEl) heroPrecipBadgeEl.textContent = `+${horizon}h`;
    if (heroPrecipSumEl) heroPrecipSumEl.textContent = `${precipSum} mm`;
    if (heroPrecipProbEl) heroPrecipProbEl.textContent = `${precipProb}% prob. acumulada`;
    if (heroPrecipProjEl) heroPrecipProjEl.textContent = `Cenário D+${dayIndex} (WRF/ECMWF)`;
  }

  const pw = calculatePrecipitableWater(dewPoint);
  document.getElementById('hero-pw-val').textContent = `${pw} mm`;

  document.getElementById('hero-wind-speed').textContent = `${windSpd} km/h`;
  document.getElementById('hero-wind-gusts').textContent = `Rajadas: ${gusts} km/h`;
  document.getElementById('hero-pressure').textContent = `${pMsl} hPa`;
  document.getElementById('hero-humidity').textContent = `${humidity}%`;
  document.getElementById('hero-dewpoint').textContent = `P.O. ${Math.round(dewPoint)}°C`;

  // Estação INEA Rio Jundiá
  if (ostrasStation) {
    const levelEl = document.getElementById('hero-river-level');
    const statusEl = document.getElementById('hero-river-status');
    const riverRainEl = document.getElementById('hero-river-rain');

    const formattedLevel = ostrasStation.nivel_rio && !isNaN(parseFloat(ostrasStation.nivel_rio))
      ? `${parseFloat(ostrasStation.nivel_rio).toFixed(2)} m`
      : `${ostrasStation.nivel_rio || '--'} m`;

    if (levelEl) levelEl.textContent = formattedLevel;
    if (statusEl) {
      const stText = ostrasStation.status || 'Vigilância';
      const isMaxAlert = stText.includes('MÁXIMO') || stText.includes('MAXIMO');
      const isOverflow = stText.includes('TRANSBORDA');
      const isAlert = stText.includes('ALERTA');
      const isAttention = stText.includes('ATEN');

      const statusColor = (isMaxAlert || isOverflow) ? 'text-rose-400 font-extrabold animate-pulse' :
                          isAlert ? 'text-orange-400 font-bold' :
                          isAttention ? 'text-amber-400 font-bold' : 'text-emerald-300 font-semibold';

      statusEl.innerHTML = `<span class="${statusColor}">${stText}</span> <span class="text-slate-400 text-[10px]">(Transbordo: ${ostrasStation.cota_transborda || '2.84 m'})</span>`;
    }
    if (riverRainEl) {
      riverRainEl.textContent = `Pluviômetro: ${ostrasStation.chuva_1h || '0'}mm (1h) / ${ostrasStation.chuva_24h || '0'}mm (24h)`;
      riverRainEl.title = `Última medição telemétrica INEA: ${ostrasStation.ultima_leitura || '--'} (atualizada a cada 5 min)`;
    }
  }

  renderInmetTurnos();
}

function renderInmetTurnos() {
  const container = document.getElementById('inmet-periods-container');
  if (!container || !state.inmetForecast || !state.inmetForecast['3304524']) {
    container.innerHTML = `<span class="text-slate-400">Dados oficiais INMET 3304524 sincronizados.</span>`;
    return;
  }

  const inmetCity = state.inmetForecast['3304524'];
  const dates = Object.keys(inmetCity);
  const dayIndex = Math.min(dates.length - 1, Math.floor(state.currentHorizon / 24));
  const dateKey = dates[dayIndex];
  const todayData = inmetCity[dateKey];

  if (!todayData) return;

  const periods = [
    { key: 'manha', label: 'Manhã', data: todayData.manha },
    { key: 'tarde', label: 'Tarde', data: todayData.tarde },
    { key: 'noite', label: 'Noite', data: todayData.noite }
  ];

  container.innerHTML = `
    <div class="w-full flex items-center justify-between text-[11px] text-sky-400 font-semibold mb-1">
      <span class="flex items-center gap-1">
        <i data-lucide="building-2" class="w-3.5 h-3.5"></i>
        Boletim INMET — Rio das Ostras (${dateKey}):
      </span>
      <a href="https://previsao.inmet.gov.br/3304524" target="_blank" class="text-slate-400 hover:text-white flex items-center gap-0.5">
        Ver boletim completo <i data-lucide="external-link" class="w-3 h-3"></i>
      </a>
    </div>
    ${periods.map(p => {
      if (!p.data) return '';
      return `
        <div class="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 shrink-0">
          <span class="font-bold text-slate-300">${p.label}:</span>
          <span class="text-slate-400">${p.data.resumo || 'Estável'}</span>
          <span class="text-sky-300 font-mono text-[10px]">Vento: ${p.data.int_vento || 'Fraco/Mod'} (${p.data.dir_vento || 'NE'})</span>
          <span class="text-amber-300 font-mono text-[10px]">Umid: ${p.data.umidade_min || '--'}% - ${p.data.umidade_max || '--'}%</span>
        </div>
      `;
    }).join('')}
  `;
}

/**
 * Renderiza alertas oficiais rigorosamente no padrão INMET (Cores Laranja e Vermelho/Amarelo)
 * Com data de início e fim, o que são, o que irão causar e instruções de segurança
 */
function renderOfficialAlerts() {
  const container = document.getElementById('official-alerts-container');
  if (!container) return;

  if (!Array.isArray(state.inmetAlerts) || state.inmetAlerts.length === 0) {
    container.innerHTML = `
      <div class="md:col-span-2 flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-300 text-xs">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i>
          </div>
          <div>
            <h4 class="font-bold text-sm text-white">Nenhum Aviso de Perigo Severo no Momento</h4>
            <p class="text-[11px] text-slate-300 mt-0.5">Condições sinóticas dentro dos parâmetros de normalidade para Rio das Ostras e Região dos Lagos.</p>
          </div>
        </div>
        <a href="https://avisos.inmet.gov.br/" target="_blank" class="text-emerald-400 hover:underline shrink-0 text-xs font-semibold flex items-center gap-1">
          Avisos INMET <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
        </a>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Gera cards compactos e organizados seguindo o padrão oficial do INMET (Laranja, Vermelho, Amarelo)
  container.innerHTML = state.inmetAlerts.map(a => {
    const sev = a.severidade || 'Perigo Potencial';
    const isRed = sev === 'Grande Perigo';
    const isOrange = sev === 'Perigo';

    // Cores oficiais do INMET
    const borderCls = isRed ? 'border-rose-500/60 bg-rose-950/25' :
                      isOrange ? 'border-orange-500/60 bg-orange-950/25' :
                      'border-amber-400/60 bg-amber-950/20';

    const badgeBg = isRed ? 'bg-rose-600 text-white' :
                    isOrange ? 'bg-orange-500 text-white' :
                    'bg-amber-400 text-slate-950 font-extrabold';

    const textHighlight = isRed ? 'text-rose-400' :
                          isOrange ? 'text-orange-400' :
                          'text-amber-400';

    const headerTitle = isRed ? 'Grande Perigo (Vermelho)' :
                        isOrange ? 'Perigo (Laranja)' :
                        'Perigo Potencial (Amarelo)';

    const iconName = a.descricao.toLowerCase().includes('chuva') ? 'cloud-rain' :
                     a.descricao.toLowerCase().includes('vento') ? 'wind' : 'zap';

    // Monta texto de riscos e instruções
    const riscosText = Array.isArray(a.riscos) ? a.riscos.join(' ') : (a.riscos || 'Risco de chuvas intensas e rajadas de vento.');
    const instrucoesList = Array.isArray(a.instrucoes) ? a.instrucoes : [a.instrucoes || 'Mantenha-se em local abrigado e evite áreas descampadas.'];

    const singleColSpan = state.inmetAlerts.length === 1 ? 'md:col-span-2' : '';

    return `
      <div class="rounded-xl border ${borderCls} p-4 backdrop-blur-md shadow-md flex flex-col justify-between transition-all hover:border-opacity-100 ${singleColSpan}">
        <div>
          <!-- Linha 1: Badges de Severidade + Município + Link Externo -->
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${badgeBg}">
                ${headerTitle}
              </span>
              ${a.eh_direto_ostras ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">📍 Rio das Ostras</span>' : '<span class="text-[10px] text-slate-400">Região RJ</span>'}
            </div>
            <a href="https://avisos.inmet.gov.br/" target="_blank" class="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition" title="Consultar no portal INMET">
              <span>INMET</span> <i data-lucide="external-link" class="w-2.5 h-2.5"></i>
            </a>
          </div>

          <!-- Linha 2: Ícone + Título + Período de Vigência -->
          <div class="flex items-start gap-2.5 mb-2.5">
            <div class="w-8 h-8 rounded-lg ${badgeBg} flex items-center justify-center shrink-0 shadow mt-0.5">
              <i data-lucide="${iconName}" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="text-sm font-bold text-white leading-tight">
                Alerta de ${a.descricao}
              </h4>
              <div class="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono mt-0.5">
                <i data-lucide="clock" class="w-3 h-3 text-slate-400 shrink-0"></i>
                <span class="truncate">${a.inicio_formatado || 'Hoje'} até ${a.fim_formatado || 'Amanhã'}</span>
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" title="Vigência Ativa"></span>
              </div>
            </div>
          </div>

          <!-- Linha 3: O que irá causar (Riscos Potenciais) -->
          <div class="p-2.5 rounded-lg bg-slate-950/70 border border-white/5 mb-2.5 text-xs">
            <div class="flex items-center gap-1 text-[11px] font-bold ${textHighlight} mb-1">
              <i data-lucide="alert-triangle" class="w-3 h-3"></i>
              <span>O que irá causar (Riscos Potenciais):</span>
            </div>
            <p class="text-slate-300 text-[11px] leading-relaxed">
              ${riscosText}
            </p>
          </div>
        </div>

        <!-- Linha 4: Instruções da Defesa Civil + Telefones de Emergência -->
        <div class="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px]">
          <div class="text-slate-300 flex items-center gap-1 truncate" title="${instrucoesList.join(' • ')}">
            <i data-lucide="shield" class="w-3 h-3 text-emerald-400 shrink-0"></i>
            <span class="truncate">${instrucoesList[0] || 'Mantenha-se em local seguro.'}</span>
          </div>
          <div class="flex items-center gap-2 text-white font-bold shrink-0 text-[10px]">
            <span class="text-amber-300">📞 199 (Defesa Civil)</span>
            <span class="text-rose-400">🚒 193 (Bombeiros)</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Renderiza o painel VIME com as 8 variáveis modeladas
 */
function renderVimePanel() {
  if (!state.weatherData) return;
  const { current, hourly, daily } = state.weatherData;

  const horizon = state.currentHorizon;
  const dayIndex = Math.min(4, Math.floor(horizon / 24));
  const hourIdx = Math.min(hourly.time.length - 1, horizon);

  const todayPrecip = horizon === 0 
    ? (daily && daily.precipitation_sum ? daily.precipitation_sum[0] : (current.precipitation || 0))
    : (daily && daily.precipitation_sum ? daily.precipitation_sum[dayIndex] : 0);

  document.getElementById('vime-precip').textContent = `${todayPrecip.toFixed(1)} mm`;

  const dewPoint = horizon === 0 ? current.dew_point_2m : hourly.dew_point_2m[hourIdx];
  const pw = calculatePrecipitableWater(dewPoint);
  const pwInterp = getPrecipitableWaterInterpretation(pw);
  document.getElementById('vime-pw').textContent = `${pw} mm`;
  document.getElementById('vime-pw-desc').textContent = pwInterp.status;

  const windKmH = Math.round(horizon === 0 ? (current.wind_speed_10m || 0) : (hourly.wind_speed_10m[hourIdx] || 0));
  const windKnots = Math.round(windKmH * 0.539957);
  document.getElementById('vime-wind').textContent = `${windKmH} km/h`;
  document.getElementById('vime-wind-knots').textContent = `${windKnots} nós (knots) a 10m`;

  const gusts = Math.round(horizon === 0 ? (current.wind_gusts_10m || windKmH) : (hourly.wind_gusts_10m[hourIdx] || windKmH));
  document.getElementById('vime-gusts').textContent = `${gusts} km/h`;

  const pMsl = Math.round(horizon === 0 ? (current.pressure_msl || current.surface_pressure || 1015) : (hourly.pressure_msl ? hourly.pressure_msl[hourIdx] : 1015));
  document.getElementById('vime-pressure').textContent = `${pMsl} hPa`;

  const temp = Math.round(horizon === 0 ? current.temperature_2m : hourly.temperature_2m[hourIdx]);
  const feels = Math.round(horizon === 0 ? current.apparent_temperature : hourly.apparent_temperature[hourIdx]);
  document.getElementById('vime-temp').textContent = `${temp}°C`;
  document.getElementById('vime-temp-feels').textContent = `Sensação: ${feels}°C`;

  const hum = Math.round(horizon === 0 ? current.relative_humidity_2m : hourly.relative_humidity_2m[hourIdx]);
  document.getElementById('vime-humidity').textContent = `${hum}%`;
  document.getElementById('vime-dew-desc').textContent = `Ponto de Orvalho: ${Math.round(dewPoint || 0)}°C`;

  const clouds = horizon === 0 ? (current.cloud_cover || 0) : (hourly.cloud_cover ? hourly.cloud_cover[hourIdx] : 0);
  document.getElementById('vime-clouds').textContent = `${clouds}%`;
}

/**
 * Renderiza os 5 Pilares Meteorológicos Detalhados de Rio das Ostras
 */
function renderThe5Pillars() {
  if (!state.weatherData) return;
  const { current, hourly, daily } = state.weatherData;

  const horizon = state.currentHorizon;
  const dayIndex = Math.min(4, Math.floor(horizon / 24));
  const hourIdx = Math.min(hourly.time.length - 1, horizon);

  // 1. Precipitação
  const currentMm = horizon === 0 ? (current.precipitation || 0).toFixed(1) : (hourly.precipitation[hourIdx] || 0).toFixed(1);
  const todaySum = daily && daily.precipitation_sum ? daily.precipitation_sum[dayIndex].toFixed(1) : '0.0';
  const todayProb = daily && daily.precipitation_probability_max ? daily.precipitation_probability_max[dayIndex] : 0;
  const dewPoint = horizon === 0 ? current.dew_point_2m : hourly.dew_point_2m[hourIdx];
  const pw = calculatePrecipitableWater(dewPoint);

  document.getElementById('precip-volume').textContent = currentMm;
  document.getElementById('precip-prob').textContent = `${todayProb}%`;
  document.getElementById('precip-today-sum').textContent = `${todaySum} mm`;
  document.getElementById('precip-pw-ref').textContent = `${pw} mm`;

  const precipBadge = document.getElementById('precip-badge');
  const precipBar = document.getElementById('precip-bar');
  const precipAdvice = document.getElementById('precip-advice');
  const sumNum = parseFloat(todaySum) || 0;
  const curNum = parseFloat(currentMm) || 0;

  const ostrasStation = Array.isArray(state.ineaCheias) 
    ? state.ineaCheias.find(s => s.eh_rio_das_ostras || (s.municipio && s.municipio.includes('Ostras')))
    : null;

  if (sumNum >= 40) {
    if (precipBadge) {
      if (curNum >= 5.0) {
        precipBadge.textContent = 'Chuva Forte em Curso';
        precipBadge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse';
      } else {
        precipBadge.textContent = 'Alerta: Pancadas Modeladas';
        precipBadge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40';
      }
    }
    if (precipBar) precipBar.style.width = '100%';
    if (precipAdvice) {
      if (curNum >= 5.0) {
        precipAdvice.textContent = `Atenção: Chuva forte caindo agora (${currentMm} mm/h). Risco de alagamentos e elevação de canais em Rio das Ostras.`;
      } else {
        const ineaInfo = ostrasStation ? `Pluviômetro INEA (Jundiá) registrou ${ostrasStation.chuva_1h || '0'}mm na última 1h e ${ostrasStation.chuva_24h || '0'}mm em 24h.` : '';
        precipAdvice.textContent = `No momento sem temporal em solo (${curNum.toFixed(1)} mm/h). O modelo numérico projeta acumulado total de até ${todaySum} mm para o período. ${ineaInfo}`;
      }
    }
  } else if (sumNum >= 20) {
    if (precipBadge) {
      precipBadge.textContent = curNum > 0 ? 'Chuva em Andamento' : 'Pancadas Previstas';
      precipBadge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40';
    }
    if (precipBar) precipBar.style.width = '70%';
    if (precipAdvice) precipAdvice.textContent = `Volume acumulado relevante previsto pelo modelo (${todaySum} mm). Acompanhe o escoamento urbano e réguas do INEA.`;
  } else if (sumNum >= 5) {
    if (precipBadge) {
      precipBadge.textContent = 'Chuva Moderada';
      precipBadge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40';
    }
    if (precipBar) precipBar.style.width = '45%';
    if (precipAdvice) precipAdvice.textContent = `Precipitação moderada prevista (${todaySum} mm). Pancadas de chuva no decorrer do período.`;
  } else if (sumNum > 0) {
    if (precipBadge) {
      precipBadge.textContent = 'Chuva Fraca / Garoa';
      precipBadge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40';
    }
    if (precipBar) precipBar.style.width = '20%';
    if (precipAdvice) precipAdvice.textContent = `Baixo volume previsto (${todaySum} mm). Chuviscos isolados sem riscos hidrológicos.`;
  } else {
    if (precipBadge) {
      precipBadge.textContent = 'Sem Chuva Prevista';
      precipBadge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700/50';
    }
    if (precipBar) precipBar.style.width = '5%';
    if (precipAdvice) precipAdvice.textContent = 'Tempo estável sem projeção de chuva para este período em Rio das Ostras.';
  }

  if (ostrasStation) {
    const riverStatusEl = document.getElementById('precip-river-status');
    if (riverStatusEl) {
      const st = ostrasStation.status || 'VIGILÂNCIA';
      riverStatusEl.textContent = st;
      const isMaxAlert = st.includes('MÁXIMO') || st.includes('MAXIMO') || st.includes('TRANSBORDA');
      const isAlert = st.includes('ALERTA');
      const isAttention = st.includes('ATEN');
      riverStatusEl.className = isMaxAlert ? 'font-extrabold text-rose-400 animate-pulse' :
                                isAlert ? 'font-bold text-orange-400' :
                                isAttention ? 'font-bold text-amber-400' : 'font-semibold text-emerald-400';
    }
  }

  // 2. Ventos & Mar
  const windSpd = Math.round(horizon === 0 ? (current.wind_speed_10m || 0) : (hourly.wind_speed_10m[hourIdx] || 0));
  const gusts = Math.round(horizon === 0 ? (current.wind_gusts_10m || windSpd) : (hourly.wind_gusts_10m[hourIdx] || windSpd));
  const dir = horizon === 0 ? (current.wind_direction_10m || 45) : (hourly.wind_direction_10m[hourIdx] || 45);
  const compass = getWindCompassDirection(dir);
  const beaufort = getBeaufortData(windSpd);

  document.getElementById('wind-speed').textContent = windSpd;
  document.getElementById('wind-gusts').textContent = `${gusts} km/h`;
  document.getElementById('wind-direction-cardinal').textContent = `${compass.name} (${Math.round(dir)}°)`;

  const needle = document.getElementById('compass-needle');
  if (needle) {
    needle.style.transform = `rotate(${dir}deg)`;
  }
  document.getElementById('wind-scale-badge').textContent = beaufort.name;
  document.getElementById('beaufort-desc').textContent = beaufort.desc;

  // 3. Pressão Atmosférica
  const p = Math.round(horizon === 0 ? (current.pressure_msl || current.surface_pressure || 1015) : (hourly.pressure_msl ? hourly.pressure_msl[hourIdx] : 1015));
  const mmhg = Math.round(p * 0.750062);
  document.getElementById('pressure-value').textContent = p;
  document.getElementById('pressure-mmhg').textContent = `(${mmhg} mmHg)`;

  let tendency = 0;
  if (hourly && hourly.surface_pressure && hourly.surface_pressure.length > 3) {
    tendency = hourly.surface_pressure[3] - hourly.surface_pressure[0];
  }
  const interp = getPressureInterpretation(p, tendency);
  document.getElementById('pressure-trend-text').textContent = interp.trendText;
  document.getElementById('pressure-status-name').textContent = interp.status;
  document.getElementById('pressure-desc').textContent = interp.description;

  const minP = 970;
  const maxP = 1040;
  const pct = Math.min(100, Math.max(0, ((p - minP) / (maxP - minP)) * 100));
  const indicator = document.getElementById('pressure-indicator');
  if (indicator) indicator.style.left = `${pct}%`;

  // 4. Umidade do Ar
  const hum = Math.round(horizon === 0 ? (current.relative_humidity_2m || 0) : (hourly.relative_humidity_2m[hourIdx] || 0));
  document.getElementById('humidity-value').textContent = hum;
  document.getElementById('dew-point-value').textContent = `${Math.round(dewPoint)}°C`;
  const humClass = getHumidityClassification(hum);
  document.getElementById('humidity-status-title').textContent = humClass.status;
  document.getElementById('humidity-desc').textContent = humClass.desc;

  // 5. Temperatura
  const temp = Math.round(horizon === 0 ? current.temperature_2m : hourly.temperature_2m[hourIdx]);
  const feels = Math.round(horizon === 0 ? current.apparent_temperature : hourly.apparent_temperature[hourIdx]);
  const minT = daily && daily.temperature_2m_min ? Math.round(daily.temperature_2m_min[dayIndex]) : temp;
  const maxT = daily && daily.temperature_2m_max ? Math.round(daily.temperature_2m_max[dayIndex]) : temp;

  document.getElementById('temp-current-val').textContent = `${temp}°C`;
  document.getElementById('temp-feels-val').textContent = `${feels}°C`;
  document.getElementById('temp-min-val').textContent = `${minT}°C`;
  document.getElementById('temp-max-val').textContent = `${maxT}°C`;
  document.getElementById('temp-range-val').textContent = `${Math.abs(maxT - minT)}°C`;

  // 6. UV Máximo
  const uvMax = daily && daily.uv_index_max ? daily.uv_index_max[dayIndex].toFixed(1) : '--';
  document.getElementById('uv-max-value').textContent = uvMax;
}

/**
 * Renderiza a Tabela Telemétrica de Rios do INEA com Cotas Explícitas
 */
function renderIneaTable() {
  const tbody = document.getElementById('inea-stations-tbody');
  if (!tbody) return;

  if (!Array.isArray(state.ineaCheias) || state.ineaCheias.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="p-4 text-center text-slate-400">Consultando réguas telemétricas e cotas do INEA...</td></tr>`;
    return;
  }

  tbody.innerHTML = state.ineaCheias.map(st => {
    const isOstras = st.eh_rio_das_ostras;
    const rowBg = isOstras ? 'bg-sky-500/15 font-medium border-l-4 border-l-sky-400' : 'hover:bg-slate-800/40';
    const statusBadges = {
      'VIGILÂNCIA': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      'VIGILANCIA': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      'ATENÇÃO': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      'ATENCAO': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      'ALERTA': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      'ALERTA MÁXIMO': 'bg-rose-500/25 text-rose-300 border-rose-500/50 font-extrabold animate-pulse',
      'ALERTA MAXIMO': 'bg-rose-500/25 text-rose-300 border-rose-500/50 font-extrabold animate-pulse',
      'TRANSBORDAMENTO': 'bg-rose-600 text-white border-rose-400 font-extrabold animate-pulse shadow-md'
    };
    const badgeCls = statusBadges[st.status] || 'bg-slate-700 text-slate-300';

    const formattedNivel = st.nivel_rio && !isNaN(parseFloat(st.nivel_rio))
      ? `${parseFloat(st.nivel_rio).toFixed(2)} m`
      : (st.nivel_rio && st.nivel_rio !== '-' ? `${st.nivel_rio} m` : '--');

    return `
      <tr class="${rowBg} transition-colors">
        <td class="p-3">
          <div class="font-bold text-white flex items-center gap-1.5 flex-wrap">
            ${isOstras ? '<span class="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>' : ''}
            <span>${st.municipio}</span>
            ${isOstras ? '<span class="px-1.5 py-0.5 rounded text-[9px] bg-sky-500/25 text-sky-200 border border-sky-400/40 font-bold">📍 Rio das Ostras</span>' : ''}
          </div>
          <span class="text-[11px] text-slate-400">${st.curso_dagua}</span>
        </td>
        <td class="p-3 font-medium text-slate-200">${st.nome_estacao}</td>
        <td class="p-3 text-[11px] font-mono">
          <span class="text-slate-200 font-semibold block">${st.ultima_leitura || '--'}</span>
          <span class="text-[9px] text-emerald-400 font-sans block">⏱️ ciclo 5 min</span>
        </td>
        <td class="p-3 text-center">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeCls}">
            ${st.status || 'VIGILÂNCIA'}
          </span>
        </td>
        <td class="p-3 text-center font-mono font-bold text-sky-300 text-sm">
          ${formattedNivel}
        </td>
        <td class="p-3 text-center font-mono text-amber-300 text-xs">
          ${st.cota_atencao || '2.00 m'}
        </td>
        <td class="p-3 text-center font-mono text-orange-400 text-xs">
          ${st.cota_alerta || '2.50 m'}
        </td>
        <td class="p-3 text-center font-mono text-rose-400 font-bold text-xs">
          ${st.cota_transborda || '3.00 m'}
        </td>
        <td class="p-3 text-center font-mono text-xs">
          ${st.chuva_1h || '0'}mm / <span class="text-slate-400">${st.chuva_24h || '0'}mm</span>
        </td>
        <td class="p-3 text-center">
          <div class="w-20 mx-auto bg-slate-800 rounded-full h-2 overflow-hidden" title="Capacidade da Calha">
            <div class="bg-gradient-to-r from-emerald-400 to-amber-500 h-2 rounded-full" style="width: ${st.porcentagem_calha || 40}%"></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Renderiza a timeline das próximas 24 horas iniciando EXATAMENTE na hora atual local
 * com volume de precipitação explícito, data, hora e acumulado das próximas 24h
 */
function renderHourlyTimeline() {
  const container = document.getElementById('hourly-forecast-container');
  if (!container || !state.weatherData || !state.weatherData.hourly) return;
  const { hourly } = state.weatherData;

  const startIndex = getLocalHourIndex(hourly.time);
  const count = 24;
  const hoursData = [];
  let total24hPrecip = 0;

  for (let i = startIndex; i < startIndex + count && i < hourly.time.length; i++) {
    const precip = hourly.precipitation ? (Number(hourly.precipitation[i]) || 0) : 0;
    total24hPrecip += precip;

    hoursData.push({
      time: hourly.time[i],
      temp: hourly.temperature_2m[i],
      code: hourly.weather_code[i],
      prob: hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0,
      precip: precip,
      wind: hourly.wind_speed_10m[i],
      isNow: i === startIndex
    });
  }

  // Atualiza indicador de volume acumulado nas PRÓXIMAS 24h
  const accumEl = document.getElementById('timeline-accum-volume');
  if (accumEl) {
    accumEl.textContent = `${total24hPrecip.toFixed(1)} mm`;
  }

  const weekShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const now = new Date();
  const todayDateNum = now.getDate();

  container.innerHTML = hoursData.map((item, idx) => {
    const d = new Date(item.time);
    const dayName = weekShort[d.getDay()];
    const dateFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const hourLabel = `${String(d.getHours()).padStart(2, '0')}:00`;
    const cond = getWeatherCondition(item.code);
    const hasRain = item.precip > 0;
    const isHeavy = item.precip >= 5.0;
    const isTomorrow = d.getDate() !== todayDateNum;

    const cardClass = item.isNow ? 'active-hour' : (isHeavy ? 'heavy-rain' : (hasRain ? 'has-rain' : ''));
    const precipBadgeStyle = isHeavy 
      ? 'bg-rose-500/25 text-rose-200 border border-rose-500/40 font-bold'
      : hasRain 
        ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40 font-bold'
        : 'text-slate-500 bg-slate-800/40 border border-slate-700/30';

    const dayBadgeHtml = item.isNow
      ? `<div class="flex items-center justify-center gap-1 mb-0.5">
           <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
           <span class="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider">AGORA</span>
         </div>`
      : `<span class="text-[10px] text-slate-400 block font-mono">${isTomorrow ? 'Amanhã' : 'Hoje'} ${dateFormatted}</span>`;

    return `
      <div class="hourly-card ${cardClass}">
        ${dayBadgeHtml}
        <span class="text-xs font-bold text-white block mb-1">${hourLabel}</span>
        <div class="my-1.5 flex justify-center text-sky-400">
          <i data-lucide="${cond.icon}" class="w-5 h-5"></i>
        </div>
        <span class="text-sm font-extrabold text-white block">${Math.round(item.temp)}°C</span>
        
        <!-- PROJEÇÃO DE VOLUME DE PRECIPITAÇÃO POR HORA -->
        <div class="mt-2 py-0.5 px-1 rounded flex items-center justify-center gap-1 text-[11px] ${precipBadgeStyle}" title="Volume previsto pelo modelo para esta hora">
          <i data-lucide="cloud-rain" class="w-3 h-3 ${hasRain ? (isHeavy ? 'text-rose-400' : 'text-sky-300') : 'text-slate-500'}"></i>
          <span>${item.precip.toFixed(1)} mm</span>
        </div>

        <!-- Probabilidade de Chuva -->
        <div class="flex items-center justify-center gap-1 text-[10px] ${item.prob > 40 ? 'text-sky-300 font-medium' : 'text-slate-400'} mt-1">
          <i data-lucide="droplet" class="w-2.5 h-2.5 text-sky-400"></i>
          <span>${item.prob}%</span>
        </div>

        <!-- Velocidade do Vento -->
        <div class="text-[10px] text-slate-400 mt-1 flex items-center justify-center gap-1">
          <i data-lucide="wind" class="w-2.5 h-2.5 text-teal-400"></i>
          <span>${Math.round(item.wind)} km/h</span>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Renderiza a previsão estendida limitada a 5 dias com volume diário em destaque
 */
function renderDailyForecast() {
  const container = document.getElementById('daily-forecast-container');
  if (!container || !state.weatherData || !state.weatherData.daily) return;
  const { daily } = state.weatherData;

  const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const fiveDays = daily.time.slice(0, 5);

  container.innerHTML = fiveDays.map((dateStr, idx) => {
    const d = new Date(dateStr + 'T12:00:00');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const monthNum = String(d.getMonth() + 1).padStart(2, '0');
    const dateDisplay = `${dayNum}/${monthNum}`;
    const dayLabel = idx === 0 ? `Hoje (${dateDisplay})` : idx === 1 ? `Amanhã (${dateDisplay})` : `${daysOfWeek[d.getDay()]} (${dateDisplay})`;

    const code = daily.weather_code[idx];
    const cond = getWeatherCondition(code);
    const minTemp = Math.round(daily.temperature_2m_min[idx]);
    const maxTemp = Math.round(daily.temperature_2m_max[idx]);
    const rainSum = daily.precipitation_sum ? daily.precipitation_sum[idx].toFixed(1) : '0.0';
    const rainProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[idx] : 0;
    const hasRain = Number(rainSum) > 0;
    let shortCond = cond.label.split('/')[0].trim();
    shortCond = shortCond
      .replace('Pancadas de Chuva Violentas', 'Chuva Forte')
      .replace('Pancadas de Chuva Moderadas', 'Chuva Moderada')
      .replace('Pancadas de Chuva Leves', 'Pancadas Leves')
      .replace('Tempestade com Raios', 'Tempestade')
      .replace('Predominantemente Limpo', 'Poucas Nuvens')
      .replace('Encoberto', 'Nublado');

    return `
      <div class="p-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800/80 transition flex items-center justify-between gap-2.5">
        <!-- Coluna 1: Ícone + Dia da Semana + Condição (nunca sobrepõe) -->
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <div class="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-sky-400 shrink-0">
            <i data-lucide="${cond.icon}" class="w-5 h-5"></i>
          </div>
          <div class="min-w-0">
            <span class="text-xs font-bold text-white block truncate leading-tight">${dayLabel}</span>
            <span class="text-[11px] text-slate-400 block truncate leading-tight mt-0.5" title="${cond.label}">${shortCond}</span>
          </div>
        </div>

        <!-- Coluna 2: Volume de Chuva e Probabilidade em Badge Separado -->
        <div class="flex flex-col items-center justify-center shrink-0 w-20 text-center">
          <div class="px-2 py-0.5 rounded-md text-[11px] font-extrabold flex items-center justify-center gap-1 ${hasRain ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30' : 'text-slate-400 bg-slate-800/40'}">
            <i data-lucide="cloud-rain" class="w-3 h-3 ${hasRain ? 'text-sky-400' : 'text-slate-500'}"></i>
            <span>${rainSum} mm</span>
          </div>
          <span class="text-[10px] text-slate-400 font-medium mt-0.5">${rainProb}% prob.</span>
        </div>

        <!-- Coluna 3: Temperaturas Min/Max com Barra -->
        <div class="flex items-center gap-1 text-xs font-semibold shrink-0">
          <span class="text-sky-300 w-5 text-right font-mono">${minTemp}°</span>
          <div class="w-10 sm:w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0">
            <div class="h-full bg-gradient-to-r from-sky-400 to-amber-400 rounded-full w-full"></div>
          </div>
          <span class="text-amber-400 w-5 text-left font-mono">${maxTemp}°</span>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function updateChart() {
  const canvas = document.getElementById('meteorology-chart');
  if (canvas && state.weatherData) {
    renderHourlyChart(canvas, state.activeMetric, state.weatherData.hourly);
  }
}
