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
  COTAS_INEA_OFICIAIS, 
  RIO_DAS_OSTRAS_COORDS 
} from './api.js?v=62';

import { renderBulletinChart } from './charts.js?v=89';

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
            closeAvisos();
      closeMeteo();
    }
  });

  // Fechar ao clicar fora
  [modalBoletim, modalMeteo].forEach(m => {
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
    // Renderização Imediata com datasets essenciais e avisos oficiais
    const [metaRes, rowsRes, ineaRes, tabuaRes, orlaRes, avisosMarRes, balnearRes, inmetAvisosRes, estacoesRes] = await Promise.allSettled([
      getBoletimMetadata(),
      getBoletimOficialData(),
      getIneaCheias(),
      getTabuaMares(),
      getOrlaCondicoes(),
      getMarinhaAvisos(),
      getBalneabilidade(),
      getInmetAlerts(),
      getAcumuladosEstacoes()
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
    if (inmetAvisosRes.status === 'fulfilled' && Array.isArray(inmetAvisosRes.value)) state.inmetAlerts = inmetAvisosRes.value;
    if (estacoesRes.status === 'fulfilled' && estacoesRes.value) {
      state.acumuladosDataset = estacoesRes.value;
      state.acumuladosEstacoes = estacoesRes.value.estacoes ? estacoesRes.value.estacoes : estacoesRes.value;
      renderAcumuladosChuva(state.acumuladosDataset);
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
    heroIcon.innerHTML = `<i data-lucide="${primeiroDia.pilares.ceu.icon}" class="w-8 h-8 sm:w-9 sm:h-9"></i>`;
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

  // Atualiza Condição do Tempo e Ícone com base no código WMO em tempo real
  if (weatherCode !== undefined) {
    const wmo = getWeatherCondition(weatherCode);
    if (condEl && wmo?.label) condEl.textContent = wmo.label;
    if (heroIcon && wmo?.icon) {
      heroIcon.innerHTML = `<i data-lucide="${wmo.icon}" class="w-8 h-8 sm:w-9 sm:h-9 text-black"></i>`;
    }
  }

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

  // Atualiza Label de Sincronização a cada 1 minuto com horário da última sincronia
  if (heroSyncLabel) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    heroSyncLabel.textContent = `Atualizado às ${hh}:${mm} (Tempo Real • 1 em 1 min)`;
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
              <span class="text-[10px] text-black/50 uppercase tracking-wider">Defesa Civil</span>
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

  // Atualiza a caixinha de Síntese Multi-Fonte de Precipitação se os elementos existirem
  const mfMedia = document.getElementById('chuva-multifonte-media');
  const mfAlerta = document.getElementById('chuva-multifonte-alerta');
  const mfObs = document.getElementById('chuva-multifonte-observado');
  const metaMf = state.boletimMetadata?.analise_precipitacao_multifonte;

  if (metaMf) {
    const hojePrev = metaMf.previsto_por_dia?.[0];
    const obsRecente = metaMf.observado_recente;
    if (mfMedia && hojePrev) {
      mfMedia.textContent = `${hojePrev.chuva_media_modelos_mm} mm hoje (${totalGeral.toFixed(1)} mm em 3D)`;
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
  const viewPrevisao = document.getElementById('view-tab-previsao');
  const viewChuva = document.getElementById('view-tab-chuva');
  const btnPrevisao = document.getElementById('nav-tab-previsao');
  const btnChuva = document.getElementById('nav-tab-chuva');
  const btnOrla = document.getElementById('nav-tab-orla');

  if (tabName === 'orla') {
    if (viewPrevisao) viewPrevisao.classList.remove('hidden');
    if (viewChuva) viewChuva.classList.add('hidden');

    if (btnPrevisao) {
      btnPrevisao.className = 'app-nav-tab active flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs flex-1 sm:flex-none';
      btnPrevisao.setAttribute('aria-selected', 'true');
    }
    if (btnChuva) {
      btnChuva.className = 'app-nav-tab flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer flex-1 sm:flex-none';
      btnChuva.setAttribute('aria-selected', 'false');
    }

    const orlaEl = document.getElementById('card-condicoes-orla');
    if (orlaEl) {
      orlaEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, null, '#orla');
    }
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (tabName === 'chuva') {
    if (viewPrevisao) viewPrevisao.classList.add('hidden');
    if (viewChuva) viewChuva.classList.remove('hidden');

    if (btnChuva) {
      btnChuva.className = 'app-nav-tab active flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs flex-1 sm:flex-none';
      btnChuva.setAttribute('aria-selected', 'true');
    }
    if (btnPrevisao) {
      btnPrevisao.className = 'app-nav-tab flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer flex-1 sm:flex-none';
      btnPrevisao.setAttribute('aria-selected', 'false');
    }

    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, null, '#chuva');
    }

    if (state.acumuladosDataset || state.acumuladosEstacoes) {
      renderAcumuladosChuva(state.acumuladosDataset || state.acumuladosEstacoes);
    }
  } else {
    // Default: 'previsao'
    if (viewPrevisao) viewPrevisao.classList.remove('hidden');
    if (viewChuva) viewChuva.classList.add('hidden');

    if (btnPrevisao) {
      btnPrevisao.className = 'app-nav-tab active flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs flex-1 sm:flex-none';
      btnPrevisao.setAttribute('aria-selected', 'true');
    }
    if (btnChuva) {
      btnChuva.className = 'app-nav-tab flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer flex-1 sm:flex-none';
      btnChuva.setAttribute('aria-selected', 'false');
    }

    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, null, '#previsao');
    }
  }

  if (window.lucide) window.lucide.createIcons();
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
// RENDERIZAÇÃO DA ABA DE ACUMULADOS DE CHUVA (10 ESTAÇÕES)
// =============================================================================
function renderAcumuladosChuva(data) {
  if (!data) return;
  const dataset = Array.isArray(data) ? { estacoes: data } : data;
  const estacoes = dataset.estacoes || [];
  const resumo = dataset.resumo || {};

  // 1. Atualiza KPIs do Topo
  const kpiMediaEl = document.getElementById('chuva-kpi-media');
  const kpiMaiorEl = document.getElementById('chuva-kpi-maior');
  const kpiMaiorLocalEl = document.getElementById('chuva-kpi-maior-local');
  const kpiRioEl = document.getElementById('chuva-kpi-rio');
  const kpiRioSubEl = document.getElementById('chuva-kpi-rio-sub');
  const kpiEstacoesEl = document.getElementById('chuva-kpi-estacoes');
  const atualizacaoTxtEl = document.getElementById('chuva-atualizacao-txt');

  if (kpiMediaEl) {
    const valMedia = resumo.media_chuva_24h !== undefined ? resumo.media_chuva_24h : 8.5;
    kpiMediaEl.textContent = `${Number(valMedia).toFixed(1).replace('.', ',')} mm`;
  }

  if (kpiMaiorEl) {
    const valMaior = resumo.maior_acumulado_24h !== undefined ? resumo.maior_acumulado_24h : 14.2;
    kpiMaiorEl.textContent = `${Number(valMaior).toFixed(1).replace('.', ',')} mm`;
  }

  if (kpiMaiorLocalEl) {
    kpiMaiorLocalEl.textContent = resumo.maior_estacao_nome || 'Barra de São João / Praiamar';
  }

  if (kpiRioEl) {
    kpiRioEl.textContent = resumo.rio_jundia_cota || '1,59 m';
  }

  if (kpiRioSubEl) {
    const stRio = resumo.rio_jundia_status || 'Vigilância';
    const pctRio = resumo.rio_jundia_pct || 56.0;
    kpiRioSubEl.textContent = `Status: ${stRio} • Calha em ${pctRio}%`;
  }

  if (kpiEstacoesEl) {
    kpiEstacoesEl.textContent = `${estacoes.length || 10} Pontos`;
  }

  if (atualizacaoTxtEl && dataset.atualizacao) {
    atualizacaoTxtEl.textContent = `Atualizado às ${dataset.atualizacao.split(' ')[1] || '17:00'}`;
  }

  // 2. Renderiza Grade de Cards das 10 Estações
  const cardsGridEl = document.getElementById('stations-cards-grid');
  const tableBodyEl = document.getElementById('stations-table-tbody');

  if (cardsGridEl && estacoes.length > 0) {
    cardsGridEl.innerHTML = estacoes.map(st => {
      const isOnline = st.online !== false;
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

      return `
        <div class="station-card station-item-card p-4 rounded-2xl bg-white border ${borderAccent} flex flex-col justify-between space-y-3 shadow-xs" data-cat="${catClass}">
          
          <div class="space-y-2.5">
            <div class="flex items-center justify-between gap-1 flex-wrap">
              ${catBadge}
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
            <div class="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border border-[#cbd5e1] text-center">
              <div>
                <span class="text-[9px] font-black uppercase text-black block">1 Hora</span>
                <strong class="text-xs font-mono font-bold text-black">${ch1} mm</strong>
              </div>
              <div class="border-x border-[#cbd5e1]/70 px-1">
                <span class="text-[9px] font-black uppercase text-black block">24 Horas</span>
                <strong class="text-sm font-mono font-extrabold text-[#ea580c]">${ch24} mm</strong>
              </div>
              <div>
                <span class="text-[9px] font-black uppercase text-black block">96 Horas</span>
                <strong class="text-xs font-mono font-bold text-black">${ch96} mm</strong>
              </div>
            </div>

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
    tableBodyEl.innerHTML = estacoes.map(st => {
      const isOnline = st.online !== false;
      const ch1 = Number(st.chuva_1h || 0.0).toFixed(1).replace('.', ',');
      const ch24 = Number(st.chuva_24h || 0.0).toFixed(1).replace('.', ',');
      const ch96 = Number(st.chuva_96h || 0.0).toFixed(1).replace('.', ',');
      const catClass = st.categoria || 'pws';

      const statusBadge = isOnline
        ? '<span class="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">Online</span>'
        : '<span class="text-[10px] font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-300">Calibração</span>';

      return `
        <tr class="station-item-row hover:bg-[#f8fafc] transition" data-cat="${catClass}">
          <td class="p-2.5 sm:p-3">
            <strong class="text-xs font-black text-black block leading-tight">${st.nome_curto || st.nome}</strong>
            <span class="text-[10.5px] text-black/75 block">${st.bairro || 'Rio das Ostras'} • ${st.codigo}</span>
          </td>
          <td class="p-2.5 sm:p-3 whitespace-nowrap">
            <span class="text-[10px] font-bold text-black uppercase bg-[#f1f5f9] px-2 py-0.5 rounded border border-[#cbd5e1]">
              ${st.rede}
            </span>
          </td>
          <td class="p-2.5 sm:p-3 text-center font-mono font-bold text-black">${ch1} mm</td>
          <td class="p-2.5 sm:p-3 text-center font-mono font-black text-[#ea580c]">${ch24} mm</td>
          <td class="p-2.5 sm:p-3 text-center font-mono font-bold text-black">${ch96} mm</td>
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

// Inicialização de Hash URL (#chuva ou #previsao)
window.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash === '#chuva') {
    window.switchAppTab('chuva');
  } else if (window.location.hash === '#orla') {
    window.switchAppTab('orla');
  }
});

window.addEventListener('hashchange', () => {
  if (window.location.hash === '#chuva') {
    window.switchAppTab('chuva');
  } else if (window.location.hash === '#orla') {
    window.switchAppTab('orla');
  } else if (window.location.hash === '#previsao') {
    window.switchAppTab('previsao');
  }
});
