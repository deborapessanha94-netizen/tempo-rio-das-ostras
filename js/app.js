/**
 * Aplicação Oficial — TEMPO em Rio das Ostras
 * Dashboard Meteorológico Minimalista & Defesa Civil 24H
 * Baseado no layout moderno de referência e na paleta oficial de 6 tons
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
  marinhaAvisos: null,
  acumuladosEstacoes: [],
  balneabilidade: [],
  weatherData: null,
  activeMetric: 'temperature',
  radarInitialized: false,
  isSyncing: false
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  startHeroClock();
  setupModalsAndDock();
  setupChartMetricTabs();
  setupActionButtons();
  setupPWA();
  loadAllApplicationData();
  startAutoSync();
});

/**
 * 1. Gerenciamento do Tema Oficial (Modo Claro & Modo Escuro)
 */
function initTheme() {
  const saved = localStorage.getItem('meteo_theme');
  const initialTheme = saved === 'dark' ? 'dark' : 'light';
  applyTheme(initialTheme);

  const btnLight = document.getElementById('btn-theme-light');
  const btnDark = document.getElementById('btn-theme-dark');

  if (btnLight) {
    btnLight.addEventListener('click', () => {
      applyTheme('light');
      updateBulletinChart();
    });
  }

  if (btnDark) {
    btnDark.addEventListener('click', () => {
      applyTheme('dark');
      updateBulletinChart();
    });
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  const btnLight = document.getElementById('btn-theme-light');
  const btnDark = document.getElementById('btn-theme-dark');

  if (theme === 'dark') {
    root.classList.remove('theme-light');
    root.classList.add('theme-dark', 'dark');
    localStorage.setItem('meteo_theme', 'dark');
    if (btnLight) btnLight.classList.remove('active');
    if (btnDark) btnDark.classList.add('active');
  } else {
    root.classList.remove('theme-dark', 'dark');
    root.classList.add('theme-light');
    localStorage.setItem('meteo_theme', 'light');
    if (btnLight) btnLight.classList.add('active');
    if (btnDark) btnDark.classList.remove('active');
  }

  if (window.lucide) window.lucide.createIcons();
}

/**
 * 2. Relógio Digital Dinâmico e Data Atual (Começando em HOJE)
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

      dateEl.textContent = `${diaNome}, ${diaNum} de ${mesNome} | ${ano}`;
    }
  }

  update();
  setInterval(update, 1000);
}

/**
 * 3. Gerenciamento de Modais e Barra Flutuante (Floating Dock)
 */
function setupModalsAndDock() {
  // Modal 1: Boletim Técnico
  const modalBoletim = document.getElementById('modal-boletim-tecnico');
  const btnOpenBoletim1 = document.getElementById('dock-btn-boletim');
  const btnOpenBoletim2 = document.getElementById('btn-ver-boletim-modal-1');
  const btnCloseBoletim = document.getElementById('btn-close-modal-boletim');
  const btnCloseBoletimFoot = document.getElementById('btn-close-modal-boletim-foot');

  const openBoletim = () => { if (modalBoletim) modalBoletim.classList.remove('hidden'); modalBoletim.classList.add('flex'); };
  const closeBoletim = () => { if (modalBoletim) modalBoletim.classList.add('hidden'); modalBoletim.classList.remove('flex'); };

  if (btnOpenBoletim1) btnOpenBoletim1.addEventListener('click', openBoletim);
  if (btnOpenBoletim2) btnOpenBoletim2.addEventListener('click', openBoletim);
  if (btnCloseBoletim) btnCloseBoletim.addEventListener('click', closeBoletim);
  if (btnCloseBoletimFoot) btnCloseBoletimFoot.addEventListener('click', closeBoletim);

  // Modal 2: Radar Doppler & Mapa
  const modalRadar = document.getElementById('modal-radar');
  const btnOpenRadar1 = document.getElementById('dock-btn-radar');
  const btnOpenRadar2 = document.getElementById('btn-abrir-radar-modal-1');
  const btnCloseRadar = document.getElementById('btn-close-modal-radar');
  const btnCloseRadarFoot = document.getElementById('btn-close-modal-radar-foot');

  const openRadar = () => {
    if (modalRadar) {
      modalRadar.classList.remove('hidden');
      modalRadar.classList.add('flex');
      if (!state.radarInitialized) {
        state.radarInitialized = true;
        setTimeout(() => initRadarMap('radar-map'), 150);
      }
    }
  };
  const closeRadar = () => { if (modalRadar) modalRadar.classList.add('hidden'); modalRadar.classList.remove('flex'); };

  if (btnOpenRadar1) btnOpenRadar1.addEventListener('click', openRadar);
  if (btnOpenRadar2) btnOpenRadar2.addEventListener('click', openRadar);
  if (btnCloseRadar) btnCloseRadar.addEventListener('click', closeRadar);
  if (btnCloseRadarFoot) btnCloseRadarFoot.addEventListener('click', closeRadar);

  // Modal 3: Avisos Meteorológicos
  const modalAvisos = document.getElementById('modal-avisos');
  const btnOpenAvisos = document.getElementById('dock-btn-avisos');
  const btnCloseAvisos = document.getElementById('btn-close-modal-avisos');
  const btnCloseAvisosFoot = document.getElementById('btn-close-modal-avisos-foot');

  const openAvisos = () => { if (modalAvisos) modalAvisos.classList.remove('hidden'); modalAvisos.classList.add('flex'); };
  const closeAvisos = () => { if (modalAvisos) modalAvisos.classList.add('hidden'); modalAvisos.classList.remove('flex'); };

  if (btnOpenAvisos) btnOpenAvisos.addEventListener('click', openAvisos);
  if (btnCloseAvisos) btnCloseAvisos.addEventListener('click', closeAvisos);
  if (btnCloseAvisosFoot) btnCloseAvisosFoot.addEventListener('click', closeAvisos);

  // Fechar no ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBoletim();
      closeRadar();
      closeAvisos();
    }
  });

  // Fechar ao clicar no fundo
  [modalBoletim, modalRadar, modalAvisos].forEach(m => {
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
 * 4. Alternância de Métricas no Gráfico Central (Hourly Forecast)
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
 * 5. Carrega todos os dados das fontes oficiais
 */
async function loadAllApplicationData() {
  if (state.isSyncing) return;
  state.isSyncing = true;

  try {
    const [boletimRows, boletimMeta, ineaStations, alerts, openMeteo, estacoes, balnear, marinha] = await Promise.allSettled([
      getBoletimOficialData(),
      getBoletimMetadata(),
      getIneaCheias(),
      getInmetAlerts(),
      getRioDasOstrasWeatherData(),
      getAcumuladosEstacoes(),
      getBalneabilidade(),
      getMarinhaAvisos()
    ]);

    if (boletimRows.status === 'fulfilled' && Array.isArray(boletimRows.value)) {
      state.boletimData = boletimRows.value;
    }

    if (boletimMeta.status === 'fulfilled' && boletimMeta.value) {
      state.boletimMetadata = boletimMeta.value;
    }

    if (ineaStations.status === 'fulfilled' && Array.isArray(ineaStations.value)) {
      state.ineaCheias = ineaStations.value;
      renderJundiaTelemetry(state.ineaCheias);
    }

    if (alerts.status === 'fulfilled' && Array.isArray(alerts.value)) {
      state.inmetAlerts = alerts.value;
    }

    if (marinha.status === 'fulfilled' && marinha.value) {
      state.marinhaAvisos = marinha.value;
    }

    if (estacoes.status === 'fulfilled' && Array.isArray(estacoes.value)) {
      state.acumuladosEstacoes = estacoes.value;
    }

    if (balnear.status === 'fulfilled' && Array.isArray(balnear.value)) {
      state.balneabilidade = balnear.value;
    }

    if (openMeteo.status === 'fulfilled' && openMeteo.value) {
      state.weatherData = openMeteo.value;
    }

    // Renderiza a nova interface minimalista
    renderDashboardUI(state.boletimMetadata, state.boletimData, state.weatherData);
    renderModalData(state.boletimMetadata, state.boletimData, state.inmetAlerts, state.marinhaAvisos);
    updateBulletinChart();

  } catch (error) {
    console.warn('Erro ao carregar dados:', error);
  } finally {
    state.isSyncing = false;
    if (window.lucide) window.lucide.createIcons();
  }
}

/**
 * 6. Renderização do Dashboard Minimalista (Hero, Sidebar e Cards Inferiores)
 */
function renderDashboardUI(meta, rows, weather) {
  // 1. Hero Card
  const condEl = document.getElementById('hero-condition');
  const subcondEl = document.getElementById('hero-subcondition');
  const heroAlertPill = document.getElementById('hero-alert-pill');
  const heroIcon = document.getElementById('hero-weather-icon');

  const primeiroDia = meta?.dias_resumo?.[0];
  const hojeChuva = primeiroDia?.pilares?.chuva?.val || '21,4 mm';
  const hojeVento = primeiroDia?.pilares?.vento?.val || '35 km/h';

  if (condEl) {
    condEl.textContent = primeiroDia?.subtitulo?.split('•')?.[0]?.trim() || 'Parcialmente Nublado';
  }

  if (subcondEl) {
    subcondEl.textContent = `Chuva prevista: ${hojeChuva} • ${hojeVento} na orla marítima`;
  }

  if (heroAlertPill && meta?.informe_alerta) {
    if (meta.informe_alerta.includes('ALERTA MÁXIMO') || meta.informe_alerta.includes('TRANSBORDO')) {
      heroAlertPill.textContent = 'Alerta Hidrológico';
    } else {
      heroAlertPill.textContent = 'Normalidade';
    }
  }

  // 2. Sidebar: Clima Agora
  const sideTemp = document.getElementById('sidebar-temp');
  const sideCond = document.getElementById('sidebar-cond');
  const sideWind = document.getElementById('sidebar-wind');
  const sideHum = document.getElementById('sidebar-hum');
  const sideSea = document.getElementById('sidebar-sea');
  const sideUpdated = document.getElementById('sidebar-updated-time');

  if (sideTemp && rows && rows[0]) {
    sideTemp.textContent = `${rows[0].temp_max || 28}°`;
  }

  if (sideCond && primeiroDia) {
    sideCond.textContent = primeiroDia.subtitulo?.split('•')?.[0]?.trim() || 'Parcialmente Nublado';
  }

  if (sideWind && primeiroDia) {
    sideWind.textContent = primeiroDia.pilares?.vento?.val?.replace('Rajadas ', '') || '24 km/h';
  }

  if (sideHum && primeiroDia) {
    sideHum.textContent = primeiroDia.pilares?.umid?.val || '76%';
  }

  if (sideSea && primeiroDia) {
    sideSea.textContent = primeiroDia.pilares?.mar?.val || '1.8 m';
  }

  if (sideUpdated && meta?.emissao) {
    sideUpdated.textContent = meta.emissao.split('às')[1] ? `às ${meta.emissao.split('às')[1].trim()}` : '08:00h';
  }

  // 3. Sidebar: Previsão dos Próximos 3 Dias (Começando Hoje)
  const list3d = document.getElementById('sidebar-3days-list');
  const periodTxt = document.getElementById('sidebar-period-txt');
  if (periodTxt && meta?.periodo) {
    periodTxt.textContent = meta.periodo;
  }

  if (list3d && meta?.dias_resumo && Array.isArray(meta.dias_resumo)) {
    list3d.innerHTML = meta.dias_resumo.map((d, idx) => {
      const rotulos = ['Hoje', 'Amanhã', 'Depois de amanhã'];
      const rotuloCurto = rotulos[idx] || `Dia ${idx + 1}`;
      const nomeDiaCurto = d.dia?.split('—')?.[0]?.trim() || '';
      const tempVal = d.pilares?.temp?.val?.replace(' a ', ' / ') || '28° / 21°C';
      const condTxt = d.subtitulo?.split('•')?.[0]?.trim() || 'Estável';
      const iconName = d.pilares?.ceu?.icon || 'cloud-sun';
      const chuvaVal = d.pilares?.chuva?.val || '0 mm';

      return `
        <div class="forecast-day-row p-2.5 rounded-xl border border-[#1b3554]/60 bg-[#071322]/80 space-y-2 cursor-pointer transition" onclick="this.querySelector('.pilares-collapse').classList.toggle('hidden')">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2 min-w-0">
              <i data-lucide="${iconName}" class="w-4 h-4 text-[#c0e6fd] shrink-0"></i>
              <div class="min-w-0">
                <span class="font-bold text-white block leading-tight truncate">${rotuloCurto} (${nomeDiaCurto})</span>
                <span class="text-[10px] text-[#80aad3] block truncate">${condTxt} • ${chuvaVal}</span>
              </div>
            </div>
            <div class="text-right shrink-0 pl-2">
              <span class="font-bold font-mono text-[#c0e6fd] text-xs">${tempVal}</span>
            </div>
          </div>

          <!-- Acordeão com os 6 Pilares Oficiais -->
          <div class="pilares-collapse hidden pt-2 border-t border-[#1b3554] grid grid-cols-2 gap-1.5 text-[10px]">
            <div class="p-1.5 rounded bg-[#000f22] border border-[#1b3554]">
              <span class="text-[#80aad3] font-bold block uppercase text-[8px]">Céu</span>
              <span class="text-white font-medium truncate block">${cleanBulletinText(d.pilares?.ceu?.val || '—')}</span>
            </div>
            <div class="p-1.5 rounded bg-[#000f22] border border-[#1b3554]">
              <span class="text-[#80aad3] font-bold block uppercase text-[8px]">Chuva</span>
              <span class="text-white font-medium truncate block">${cleanBulletinText(d.pilares?.chuva?.val || '—')}</span>
            </div>
            <div class="p-1.5 rounded bg-[#000f22] border border-[#1b3554]">
              <span class="text-[#80aad3] font-bold block uppercase text-[8px]">Vento</span>
              <span class="text-white font-medium truncate block">${cleanBulletinText(d.pilares?.vento?.val || '—')}</span>
            </div>
            <div class="p-1.5 rounded bg-[#000f22] border border-[#1b3554]">
              <span class="text-[#80aad3] font-bold block uppercase text-[8px]">Mar</span>
              <span class="text-white font-medium truncate block">${cleanBulletinText(d.pilares?.mar?.val || '—')}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 4. Card Inferior: Chuva por Turno
  renderChuvaTurnosBars(rows);
}

/**
 * 7. Renderiza as Barrinhas de Chuva dos Turnos no Card Inferior
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
      <div class="space-y-0.5">
        <div class="flex justify-between text-[11px]">
          <span class="font-medium theme-text-main">${r.turno}</span>
          <span class="font-mono font-bold theme-text-dim">${val.toFixed(1)} mm</span>
        </div>
        <div class="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div class="h-full rounded-full bg-[#5b86b6] transition-all" style="width: ${perc}%;"></div>
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
  const gridEl = document.getElementById('other-stations-grid');

  if (!stations || !Array.isArray(stations)) return;

  const jundiaSt = stations.find(s => s.eh_rio_das_ostras || s.nome_estacao?.toLowerCase().includes('jundi'));

  if (jundiaSt && jundiaEl) {
    jundiaEl.textContent = `${jundiaSt.nivel_rio || '2,40'} m`;
  }

  if (jundiaSt && jundiaStatusEl) {
    jundiaStatusEl.textContent = jundiaSt.status || 'Alerta Hidrológico';
  }

  if (gridEl) {
    gridEl.innerHTML = stations.slice(0, 6).map(s => `
      <div class="p-2 rounded bg-white dark:bg-[#071322] border theme-border space-y-1">
        <div class="flex justify-between items-center text-[11px] font-bold theme-text-main">
          <span class="truncate">${s.nome_estacao}</span>
          <span class="font-mono">${s.nivel_rio || '—'} m</span>
        </div>
        <div class="flex justify-between text-[10px] theme-text-muted">
          <span>${s.curso_dagua || s.municipio}</span>
          <span class="font-semibold theme-text-dim">${s.status || 'Normal'}</span>
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
  if (sinopseEl && meta?.sinopse) {
    sinopseEl.textContent = cleanBulletinText(meta.sinopse);
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
        <div class="border theme-border rounded-xl overflow-hidden">
          <div class="px-3.5 py-2 bg-[#000f22] text-[#c0e6fd] font-bold text-xs flex justify-between">
            <span>${dia.toUpperCase()} (${formatIsoDate(dataIso)})</span>
            <span class="font-mono text-[11px]">4 Turnos</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-[#f8fafc] dark:bg-[#071322] border-b theme-border text-[10px] uppercase font-bold theme-text-muted">
                <tr>
                  <th class="p-2">Turno</th>
                  <th class="p-2">Céu</th>
                  <th class="p-2">Temp</th>
                  <th class="p-2">Umid</th>
                  <th class="p-2">Chuva</th>
                  <th class="p-2">Vento</th>
                  <th class="p-2">Mar</th>
                </tr>
              </thead>
              <tbody class="divide-y theme-border">
                ${dRows.map(r => `
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td class="p-2 font-bold theme-text-main">${r.turno}</td>
                    <td class="p-2 theme-text-muted">${cleanBulletinText(r.tempo_desc || '—')}</td>
                    <td class="p-2 font-mono font-bold">${r.temp_min}° / ${r.temp_max}°C</td>
                    <td class="p-2 font-mono">${r.umid_min}% - ${r.umid_max}%</td>
                    <td class="p-2 font-mono font-bold theme-text-dim">${r.chuva_media} mm</td>
                    <td class="p-2 font-mono text-[11px]">${r.vento_dir} ${r.vento_vel_media} km/h</td>
                    <td class="p-2 text-[11px] theme-text-muted">${r.mar_ondas || '1.5 m'}</td>
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
      <div class="p-2.5 rounded border theme-border space-y-1">
        <div class="flex justify-between items-center font-bold theme-text-main">
          <span>${b.setor}</span>
          <span class="text-[9px] px-1.5 py-0.5 rounded bg-[#000f22] text-[#c0e6fd] border border-[#3f6593]/40">Monitoramento</span>
        </div>
        <p class="theme-text-muted text-[11px] leading-snug">${cleanBulletinText(b.impactos)}</p>
      </div>
    `).join('');
  }

  // Modal Avisos: INMET e Marinha
  const avisosList = document.getElementById('modal-avisos-list');
  if (avisosList) {
    let html = '';
    if (inmetAlerts && inmetAlerts.length > 0) {
      inmetAlerts.forEach(a => {
        html += `
          <div class="p-3 rounded-lg border border-[#3f6593]/40 bg-[#071322] text-white space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="font-bold text-xs text-[#c0e6fd] uppercase">${a.descricao || 'Alerta Meteorológico'}</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-[#1b3554] text-[#c0e6fd] border border-[#5b86b6]">INMET</span>
            </div>
            <p class="text-[11px] text-[#80aad3]">${cleanBulletinText(a.instrucoes?.[0] || 'Acompanhe as atualizações da Defesa Civil.')}</p>
          </div>
        `;
      });
    }

    if (marinhaAvisos && marinhaAvisos.avisos) {
      marinhaAvisos.avisos.forEach(m => {
        html += `
          <div class="p-3 rounded-lg border border-[#3f6593]/40 bg-[#071322] text-white space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="font-bold text-xs text-[#c0e6fd] uppercase">${m.titulo || 'Aviso Marítimo'}</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-[#1b3554] text-[#c0e6fd] border border-[#5b86b6]">Marinha</span>
            </div>
            <p class="text-[11px] text-[#80aad3]">${cleanBulletinText(m.texto || 'Condições de mar agitado e vento forte na costa.')}</p>
          </div>
        `;
      });
    }

    if (!html) {
      html = '<div class="p-4 text-center theme-text-muted">Nenhum aviso meteorológico severo vigente para Rio das Ostras no momento.</div>';
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
 * 11. Helpers de Formatação e PWA
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
}

function setupPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js?v=32').catch(() => {});
  }
}

function startAutoSync() {
  // Sincronização periódica a cada 15 minutos
  setInterval(loadAllApplicationData, 15 * 60 * 1000);
}
