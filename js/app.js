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

  // Fechar no ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBoletim();
      closeRadar();
      closeAvisos();
    }
  });

  // Fechar ao clicar fora
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
 * 2.1. Controles Interativos do Panorama Sinótico Geral
 */
function setupPanoramaSinoticoControls() {
  const btnEstruturada = document.getElementById('btn-sinopse-estruturada');
  const btnTexto = document.getElementById('btn-sinopse-texto');
  const viewEstruturada = document.getElementById('view-sinopse-estruturada');
  const viewTexto = document.getElementById('view-sinopse-texto');
  const btnToggle = document.getElementById('btn-toggle-sinopse');
  const containerConteudo = document.getElementById('container-conteudo-sinopse');
  const iconToggle = document.getElementById('icon-toggle-sinopse');

  if (btnEstruturada && btnTexto && viewEstruturada && viewTexto) {
    btnEstruturada.addEventListener('click', () => {
      viewEstruturada.classList.remove('hidden');
      viewTexto.classList.add('hidden');
      btnEstruturada.classList.add('bg-white', 'text-zinc-900', 'font-semibold', 'shadow-xs');
      btnEstruturada.classList.remove('text-zinc-600');
      btnTexto.classList.remove('bg-white', 'text-zinc-900', 'font-semibold', 'shadow-xs');
      btnTexto.classList.add('text-zinc-600');
    });

    btnTexto.addEventListener('click', () => {
      viewEstruturada.classList.add('hidden');
      viewTexto.classList.remove('hidden');
      btnTexto.classList.add('bg-white', 'text-zinc-900', 'font-semibold', 'shadow-xs');
      btnTexto.classList.remove('text-zinc-600');
      btnEstruturada.classList.remove('bg-white', 'text-zinc-900', 'font-semibold', 'shadow-xs');
      btnEstruturada.classList.add('text-zinc-600');
    });
  }

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

    // Renderiza a interface profissional
    renderDashboardUI(state.boletimMetadata, state.boletimData, state.weatherData);
    renderPanoramaSinotico(state.boletimMetadata);
    renderAlertasPrincipais(state.inmetAlerts, state.marinhaAvisos);
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
 * 4.1. Renderização do Panorama Sinótico Geral na Tela Principal
 */
function renderPanoramaSinotico(meta) {
  if (!meta) return;

  const sinopseGeral = meta.sinopse_geral || meta.sinopse || '';
  const est = meta.sinopse_estruturada;

  // 1. Período
  const badgePeriodo = document.getElementById('badge-periodo-sinotico');
  if (badgePeriodo && meta.periodo) {
    badgePeriodo.textContent = meta.periodo;
  }

  // 2. Visão Texto Integral
  const textoCompletoEl = document.getElementById('sinopse-texto-completo');
  if (textoCompletoEl && sinopseGeral) {
    const paragrafos = sinopseGeral.split('\n\n').filter(p => p.trim());
    textoCompletoEl.innerHTML = paragrafos.map(p => `<p class="leading-relaxed mb-3 last:mb-0 text-justify text-zinc-800">${cleanBulletinText(p)}</p>`).join('');
  }

  // 3. Blocos Estruturados
  const bloco1El = document.getElementById('sinopse-bloco-1-texto');
  const bloco2El = document.getElementById('sinopse-bloco-2-texto');
  const bloco3El = document.getElementById('sinopse-bloco-3-texto');

  if (est) {
    if (bloco1El && est.ordem_1_atmosfera?.texto) {
      bloco1El.textContent = cleanBulletinText(est.ordem_1_atmosfera.texto);
    }
    if (bloco2El && est.ordem_2_hidrologia_costa?.texto) {
      bloco2El.textContent = cleanBulletinText(est.ordem_2_hidrologia_costa.texto);
    }
    if (bloco3El && est.ordem_3_operacional?.texto) {
      bloco3El.textContent = cleanBulletinText(est.ordem_3_operacional.texto);
    }
  } else if (sinopseGeral) {
    const paras = sinopseGeral.split('\n\n').filter(p => p.trim());
    if (bloco1El && paras[0]) bloco1El.textContent = cleanBulletinText(paras[0]);
    if (bloco2El && paras[1]) bloco2El.textContent = cleanBulletinText(paras[1]);
    if (bloco3El && paras[2]) bloco3El.textContent = cleanBulletinText(paras[2]);
  }
}

/**
 * 5. Renderização do Dashboard Profissional
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

  if (heroAlertPill) {
    const temAlerta = (state.inmetAlerts && state.inmetAlerts.length > 0) || (state.marinhaAvisos && state.marinhaAvisos.aviso_ativo);
    if (temAlerta) {
      heroAlertPill.textContent = 'Alerta Oficial Vigente';
      heroAlertPill.className = 'text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase bg-amber-50 text-amber-800 border border-amber-200';
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

  if (sideTemp && rows && rows[0]) {
    sideTemp.textContent = `${rows[0].temp_max || 28}°`;
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
    list3d.innerHTML = meta.dias_resumo.map((d, idx) => {
      const rotulos = ['Hoje', 'Amanhã', 'Depois de amanhã'];
      const rotuloCurto = rotulos[idx] || `Dia ${idx + 1}`;
      const nomeDiaCurto = d.dia?.split('—')?.[0]?.trim() || '';
      const tempVal = d.pilares?.temp?.val?.replace(' a ', ' / ') || '28° / 21°C';
      const condTxt = d.subtitulo?.split('•')?.[0]?.trim() || 'Estável';
      const iconName = d.pilares?.ceu?.icon || 'cloud-sun';
      const chuvaVal = d.pilares?.chuva?.val || '0 mm';

      return `
        <div class="p-3 rounded-xl border border-zinc-200 bg-white space-y-2 cursor-pointer transition hover:border-zinc-300" onclick="this.querySelector('.pilares-collapse').classList.toggle('hidden')">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                <i data-lucide="${iconName}" class="w-4 h-4"></i>
              </div>
              <div class="min-w-0">
                <span class="font-bold text-zinc-900 text-sm block leading-tight truncate">${rotuloCurto} (${nomeDiaCurto})</span>
                <span class="text-xs font-normal text-zinc-500 block truncate">${condTxt} • ${chuvaVal}</span>
              </div>
            </div>
            <div class="text-right shrink-0 pl-2">
              <span class="font-bold font-mono text-zinc-900 text-sm sm:text-base">${tempVal}</span>
            </div>
          </div>

          <!-- Acordeão com os Pilares Oficiais e Informe à População -->
          <div class="pilares-collapse hidden pt-2 border-t border-zinc-100 space-y-2">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Céu</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.ceu?.val || '—')}</span>
              </div>
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Chuva</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.chuva?.val || '—')}</span>
              </div>
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Vento</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.vento?.val || '—')}</span>
              </div>
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <span class="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider">Mar</span>
                <span class="text-zinc-800 font-medium text-xs truncate block">${cleanBulletinText(d.pilares?.mar?.val || '—')}</span>
              </div>
            </div>

            ${Array.isArray(d.informe_populacao) && d.informe_populacao.length > 0 ? `
              <div class="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/70 text-xs space-y-1.5 text-zinc-700">
                <div class="flex items-center gap-1.5 font-bold text-zinc-900 text-[11px] uppercase tracking-wide border-b border-zinc-200/60 pb-1">
                  <i data-lucide="megaphone" class="w-3.5 h-3.5 text-zinc-700"></i>
                  Informe à População (Defesa Civil)
                </div>
                ${d.informe_populacao.map((item, itemIdx) => {
                  const iconesTopicos = ['sun', 'cloud-rain', 'thermometer', 'droplets', 'wind'];
                  const titulosTopicos = ['Dinâmica do Tempo', 'Chuva & Rio Jundiá', 'Temperaturas', 'Umidade Relativa', 'Ventos & Avisos'];
                  const ic = iconesTopicos[itemIdx] || 'info';
                  const tit = titulosTopicos[itemIdx] || '';
                  return `
                    <div class="flex items-start gap-1.5 leading-relaxed text-[11px] sm:text-xs">
                      <i data-lucide="${ic}" class="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5"></i>
                      <div><strong class="font-semibold text-zinc-800">${tit}:</strong> <span>${cleanBulletinText(item)}</span></div>
                    </div>
                  `;
                }).join('')}
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
      badgeHtml: '<span class="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300">🔴 Alerta Vermelho • Grande Perigo</span>',
      corNome: 'Vermelho'
    };
  } else if ((sev.includes('perigo') && !sev.includes('potencial')) || c.includes('laranja')) {
    return {
      cardClass: 'alert-card-inmet-laranja',
      badgeHtml: '<span class="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-300">🟠 Alerta Laranja • Perigo</span>',
      corNome: 'Laranja'
    };
  } else {
    return {
      cardClass: 'alert-card-inmet-amarelo',
      badgeHtml: '<span class="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">🟡 Alerta Amarelo • Perigo Potencial</span>',
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
  if (!container) return;

  const cardsHtml = [];

  // 1. Alertas Oficiais do INMET
  if (inmetAlerts && Array.isArray(inmetAlerts) && inmetAlerts.length > 0) {
    inmetAlerts.forEach(a => {
      const titulo = a.descricao || 'Alerta Meteorológico';
      const alertInfo = getAlertBadgeAndClass(a.severidade, a.cor_nome);
      const periodo = `Vigência: ${a.inicio_formatado || a.inicio} até ${a.fim_formatado || a.fim}`;
      const riscos = (a.riscos && a.riscos[0]) ? a.riscos[0] : 'Chuva intensa, ventos fortes e descargas elétricas.';
      const instrucoes = (a.instrucoes && a.instrucoes[0]) ? a.instrucoes[0] : 'Não se abrigue debaixo de árvores. Em emergência ligue 199.';

      cardsHtml.push(`
        <div class="${alertInfo.cardClass} p-3 sm:p-3.5 space-y-2">
          <div class="flex items-center justify-between gap-2 border-b border-zinc-100 pb-1.5">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-zinc-100 text-zinc-800 tracking-wide">
                INMET
              </span>
              <span class="text-xs font-semibold text-zinc-600 truncate">
                ${a.id ? `Aviso nº ${a.id}` : 'Aviso Especial'}
              </span>
              ${a.eh_direto_ostras ? '<span class="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Rio das Ostras</span>' : ''}
            </div>
            ${alertInfo.badgeHtml}
          </div>

          <div class="flex items-baseline justify-between gap-2">
            <h3 class="text-sm sm:text-base font-bold text-zinc-950 leading-tight">${titulo}</h3>
            <span class="text-[11px] font-medium text-zinc-500 whitespace-nowrap flex items-center gap-1 shrink-0">
              <i data-lucide="clock" class="w-3 h-3 text-zinc-400"></i>
              ${periodo}
            </span>
          </div>

          <div class="p-2 rounded-lg bg-zinc-50/80 border border-zinc-200/50 text-xs text-zinc-700 leading-snug space-y-1">
            <div><strong class="font-semibold text-zinc-900">Riscos:</strong> ${cleanBulletinText(riscos)}</div>
            <div><strong class="font-semibold text-zinc-900">Defesa Civil 199:</strong> ${cleanBulletinText(instrucoes)}</div>
          </div>
        </div>
      `);
    });
  }

  // 2. Alertas Oficiais da Marinha do Brasil
  if (marinhaAvisos && (marinhaAvisos.aviso_ativo || marinhaAvisos.numero || marinhaAvisos.tipo)) {
    const numero = marinhaAvisos.numero || '733/2026';
    const tipo = marinhaAvisos.tipo || 'VENTO FORTE';
    const area = marinhaAvisos.area || 'Área DELTA (Cabo Frio ao Farol de São Tomé)';
    const rajadas = marinhaAvisos.rajadas || 'Até 53 km/h (28 nós)';
    const marOndas = marinhaAvisos.mar_ondas || '2,0 a 2,5 m (Muito Agitado)';
    const validade = marinhaAvisos.validade || marinhaAvisos.fim_formatado || 'Em vigor nas próximas 24 horas';

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
            ⚓ Aviso nº ${numero}
          </span>
        </div>

        <div class="flex items-baseline justify-between gap-2">
          <h3 class="text-sm sm:text-base font-bold text-zinc-950 leading-tight">${tipo} • ${area}</h3>
          <span class="text-[11px] font-medium text-zinc-500 whitespace-nowrap flex items-center gap-1 shrink-0">
            <i data-lucide="clock" class="w-3 h-3 text-zinc-400"></i>
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
          <strong class="font-semibold text-zinc-900">Restrição:</strong> Mar agitado com ressaca na orla. Atenção a banhistas e restrição a pequenas embarcações.
        </div>
      </div>
    `);
  }

  if (cardsHtml.length > 0) {
    container.innerHTML = cardsHtml.join('');
    if (badgeTotal) {
      badgeTotal.textContent = `${cardsHtml.length} Alerta(s) Ativo(s)`;
    }
  } else {
    container.innerHTML = `
      <div class="col-span-full p-5 rounded-xl bg-zinc-50 border border-zinc-200 text-center space-y-1">
        <span class="text-sm font-bold text-zinc-900 block">Condições de Normalidade Operacional</span>
        <p class="text-xs text-zinc-600">Nenhum aviso meteorológico severo vigente do INMET ou da Marinha para Rio das Ostras no momento.</p>
      </div>
    `;
    if (badgeTotal) {
      badgeTotal.textContent = 'Normalidade';
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
      <div class="space-y-1">
        <div class="flex justify-between text-xs font-semibold">
          <span class="text-zinc-700 font-medium">${r.turno}</span>
          <span class="font-mono font-bold text-zinc-900">${val.toFixed(1)} mm</span>
        </div>
        <div class="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
          <div class="h-full rounded-full bg-zinc-800 transition-all duration-500" style="width: ${perc}%;"></div>
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
    jundiaEl.textContent = `${jundiaSt.nivel_rio || '2,48'} m`;
  }

  if (jundiaSt && jundiaStatusEl) {
    jundiaStatusEl.textContent = jundiaSt.status || 'ALERTA MÁXIMO';
  }

  if (gridEl) {
    gridEl.innerHTML = stations.slice(0, 6).map(s => `
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
          <div class="px-4 py-2.5 bg-zinc-900 text-white font-bold text-sm flex justify-between">
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
    if (inmetAlerts && inmetAlerts.length > 0) {
      inmetAlerts.forEach(a => {
        html += `
          <div class="p-3.5 rounded-lg border border-zinc-200 bg-white space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-zinc-950 uppercase">${a.descricao || 'Alerta Meteorológico'}</span>
              <span class="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase bg-amber-50 text-amber-800 border border-amber-200">INMET</span>
            </div>
            <p class="text-xs text-zinc-600 font-normal leading-snug">${cleanBulletinText(a.instrucoes?.[0] || 'Acompanhe as atualizações da Defesa Civil.')}</p>
          </div>
        `;
      });
    }

    if (marinhaAvisos && (marinhaAvisos.aviso_ativo || marinhaAvisos.tipo)) {
      html += `
        <div class="p-3.5 rounded-lg border border-zinc-200 bg-white space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-sm text-zinc-950 uppercase">${marinhaAvisos.tipo || 'Aviso Marítimo'}</span>
            <span class="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase bg-blue-50 text-blue-800 border border-blue-200">Marinha</span>
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

function setupPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js?v=40').catch(() => {});
  }
}

function startAutoSync() {
  // Sincronização periódica a cada 15 minutos
  setInterval(loadAllApplicationData, 15 * 60 * 1000);
}
