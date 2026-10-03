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
        b.classList.remove('active', 'bg-[#1E88E5]', 'bg-[#1E3A8A]', 'text-white', 'shadow-sm');
        b.classList.add('text-[#94B5D6]', 'hover:text-white', 'hover:bg-[#0A254A]');
      });
      btn.classList.add('active', 'bg-[#1E88E5]', 'text-white', 'font-semibold', 'shadow-sm');
      btn.classList.remove('text-[#94B5D6]', 'hover:text-white', 'hover:bg-[#0A254A]');

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
        b.classList.remove('active', 'bg-[#1E88E5]', 'bg-[#1E3A8A]', 'text-white', 'font-medium', 'font-semibold');
        b.classList.add('text-[#94B5D6]', 'hover:text-white');
      });
      btn.classList.add('active', 'bg-[#1E88E5]', 'text-white', 'font-semibold');
      btn.classList.remove('text-[#94B5D6]', 'hover:text-white');

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

    if (state.boletimMetadata || (state.boletimData && state.boletimData.length > 0)) {
      renderBulletinDOM(state.boletimMetadata, state.boletimData);
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
 * Renderiza dinamicamente todo o Boletim Oficial (Cards da População, Tabela de Turnos, PLANCON e Sinóptica)
 */
function renderBulletinDOM(meta, rows) {
  if (!meta && (!rows || rows.length === 0)) return;

  // 1. Período e Emissão
  if (meta?.periodo) {
    const popPer = document.getElementById('meta-periodo-pop');
    const tecPer = document.getElementById('meta-periodo-tec');
    if (popPer) popPer.textContent = meta.periodo;
    if (tecPer) tecPer.textContent = meta.periodo;
  }

  if (meta?.emissao) {
    const popEmi = document.getElementById('meta-emissao-pop');
    const tecEmi = document.getElementById('meta-emissao-tec');
    if (popEmi) popEmi.textContent = meta.emissao;
    if (tecEmi) tecEmi.textContent = meta.emissao;
  }

  // 2. Informe de Alerta Oficial
  if (meta?.informe_alerta) {
    const alertaEl = document.getElementById('informe-alerta-texto');
    if (alertaEl) {
      alertaEl.innerHTML = `<strong class="text-white">Alertas Oficiais em Vigor:</strong> ${escapeHtml(meta.informe_alerta)}`;
    }
  }

  // 3. Cards Diários da População (Aba 1)
  // 3. Cards Diários da População (Aba 1)
  if (meta?.dias_resumo && Array.isArray(meta.dias_resumo) && meta.dias_resumo.length > 0) {
    const gridEl = document.getElementById('populacao-cards-grid');
    if (gridEl) {
      gridEl.innerHTML = meta.dias_resumo.map(d => {
        let badgeClass = 'bg-[#051833] text-[#94B5D6] font-semibold text-[10px] border border-[#133A66]';
        if (d.badge_tipo === 'danger') {
          badgeClass = 'bg-red-950/80 text-red-300 font-semibold text-[10px] border border-red-800';
        } else if (d.badge_tipo === 'warning') {
          badgeClass = 'bg-amber-950/80 text-amber-300 font-semibold text-[10px] border border-amber-800';
        }

        const pilares = d.pilares || {};
        const pilarKeys = Object.keys(pilares);

        const pilaresHtml = pilarKeys.map(k => {
          const p = pilares[k];
          return `
            <div class="p-2.5 rounded bg-[#051833] border border-[#10325A] flex items-center gap-2">
              <i data-lucide="${p.icon || 'circle'}" class="w-3.5 h-3.5 text-[#1E88E5] shrink-0"></i>
              <div class="min-w-0">
                <span class="text-[9px] uppercase font-semibold text-[#8DA4C4] block">${p.label || k}</span>
                <span class="text-xs font-bold text-white truncate block">${p.val || '—'}</span>
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="cemaden-card p-4 bg-[#071F3D] border border-[#133A66] rounded-lg space-y-3">
            <div class="flex items-center justify-between gap-2 border-b border-[#133A66] pb-2">
              <div>
                <span class="text-[10px] font-bold text-[#8DA4C4] uppercase tracking-wider">Previsão Oficial</span>
                <h3 class="text-sm font-bold text-white">${d.dia}</h3>
                <p class="text-[11px] text-[#94B5D6]">${d.subtitulo || ''}</p>
              </div>
              <span class="px-2 py-0.5 rounded ${badgeClass} shrink-0">
                ${d.badge || 'OFICIAL'}
              </span>
            </div>

            <p class="text-xs text-slate-200 leading-relaxed">
              ${d.descricao}
            </p>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              ${pilaresHtml}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 4. Panorama Sinótico Geral
  if (meta?.sinopse_geral) {
    const sinopseEl = document.getElementById('sinopse-content');
    if (sinopseEl) {
      const paragraphs = meta.sinopse_geral.split('\n\n').filter(p => p.trim().length > 0);
      sinopseEl.innerHTML = paragraphs.map(p => {
        if (p.includes('Cenário de Alerta Máximo') || p.includes('Alerta Máximo de Inundação')) {
          return `<p class="p-3 rounded-lg bg-[#051833] border-l-4 border-l-red-500 border border-[#133A66] text-slate-200 leading-relaxed">${p}</p>`;
        }
        return `<p class="text-slate-200 leading-relaxed">${p}</p>`;
      }).join('');
    }
  }

  // 5. Glossário Operacional
  if (meta?.glossario && Array.isArray(meta.glossario)) {
    const glossEl = document.getElementById('glossario-container');
    if (glossEl) {
      glossEl.innerHTML = meta.glossario.map(g => `
        <div class="p-2.5 rounded bg-[#051833] border border-[#133A66]">
          <strong class="text-white block text-[11px]">• ${g.termo}:</strong>
          <span class="text-[#94B5D6] text-[10px]">${g.def}</span>
        </div>
      `).join('');
    }
  }

  // 6. Tabela de 12 Turnos por Dia
  if (rows && Array.isArray(rows) && rows.length > 0) {
    const containerEl = document.getElementById('tabela-turnos-container');
    if (containerEl) {
      const grouped = {};
      rows.forEach(r => {
        const dia = r.dia_semana || 'Período';
        if (!grouped[dia]) grouped[dia] = [];
        grouped[dia].push(r);
      });

      const daysHtml = Object.keys(grouped).map(dia => {
        const dayRows = grouped[dia];
        const dataFormatada = dayRows[0]?.data_iso ? formatIsoDate(dayRows[0].data_iso) : '';
        const somaChuva = dayRows.reduce((acc, curr) => acc + (parseFloat(curr.chuva_media || curr.chuva_provavel_mm) || 0), 0);

        const rowsHtml = dayRows.map((r, idx) => {
          const bgClass = idx % 2 === 0 ? 'bg-[#071F3D]' : 'bg-[#051833]';
          const tMin = r.temp_min !== undefined ? r.temp_min : '—';
          const tMax = r.temp_max !== undefined ? r.temp_max : '—';
          const uMin = r.umid_min !== undefined ? r.umid_min : '—';
          const uMax = r.umid_max !== undefined ? r.umid_max : '—';
          const pressao = r.pressao_hpa ? `${r.pressao_hpa} hPa` : '—';
          const ventoDir = r.vento_dir || '';
          const ventoVel = r.vento_vel_media !== undefined ? `${r.vento_vel_media} km/h` : `${Math.round(((r.vento_vel_min || 0) + (r.vento_vel_max || 0)) / 2)} km/h`;
          const rajada = r.rajada_max ? ` (Raj: ${r.rajada_max} km/h)` : '';
          const chuvaVal = r.chuva_media !== undefined ? parseFloat(r.chuva_media).toFixed(1) : (r.chuva_provavel_mm ? parseFloat(r.chuva_provavel_mm).toFixed(1) : '0.0');
          const chuvaProb = r.chuva_prob ? ` (${r.chuva_prob}%)` : '';
          const marOndas = r.mar_ondas || '1.0 a 2.0 m';
          const marCond = r.mar_condicao || '';

          return `
            <tr class="${bgClass} hover:bg-[#0B2A52] transition">
              <td class="py-2.5 px-3 font-sans font-semibold text-white">${r.turno}</td>
              <td class="py-2.5 px-3 text-slate-100 font-mono">${tMin}° a ${tMax}°C</td>
              <td class="py-2.5 px-3 text-[#94B5D6] font-mono">${uMin}% a ${uMax}%</td>
              <td class="py-2.5 px-3 text-[#6C8EA8] font-mono">${pressao}</td>
              <td class="py-2.5 px-3 text-slate-200">${ventoDir} ${ventoVel}${rajada}</td>
              <td class="py-2.5 px-3 text-white font-bold font-mono">${chuvaVal} mm${chuvaProb}</td>
              <td class="py-2.5 px-3 text-[#94B5D6] font-sans">${marOndas} ${marCond ? `(${marCond})` : ''}</td>
            </tr>
          `;
        }).join('');

        return `
          <div class="space-y-1.5 pt-1.5">
            <div class="flex items-center justify-between text-xs px-1">
              <span class="font-bold text-white">${dia} ${dataFormatada ? `— ${dataFormatada}` : ''}</span>
              <span class="text-[11px] text-[#94B5D6]">Volume Oficial: <strong class="text-white font-mono">${somaChuva.toFixed(1)} mm</strong></span>
            </div>

            <div class="overflow-x-auto rounded-lg border border-[#133A66]">
              <table class="w-full text-left text-xs text-slate-200">
                <thead class="bg-[#051833] text-[#8DA4C4] uppercase text-[10px] font-semibold border-b border-[#133A66]">
                  <tr>
                    <th class="py-2.5 px-3">Turno</th>
                    <th class="py-2.5 px-3">Temperatura</th>
                    <th class="py-2.5 px-3">Umidade</th>
                    <th class="py-2.5 px-3">Pressão</th>
                    <th class="py-2.5 px-3">Vento & Rajadas</th>
                    <th class="py-2.5 px-3">Precipitação</th>
                    <th class="py-2.5 px-3">Estado do Mar</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#133A66] font-mono text-[11px]">
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }).join('');

      containerEl.innerHTML = daysHtml;
    }
  }

  // 7. PLANCON - Levantamento de Impactos por Bairro
  if (meta?.impactos_bairros && Array.isArray(meta.impactos_bairros)) {
    const planconBody = document.getElementById('plancon-table-body');
    if (planconBody) {
      planconBody.innerHTML = meta.impactos_bairros.map((item, idx) => {
        const bgClass = idx % 2 === 0 ? 'bg-[#071F3D]' : 'bg-[#051833]';

        function getBadge(val) {
          const v = String(val).toUpperCase();
          if (v.includes('MÁXIMO') || v.includes('MAXIMO')) {
            return `<span class="px-2 py-0.5 rounded bg-red-900 text-white font-bold text-[10px] border border-red-700">MÁXIMO</span>`;
          }
          if (v.includes('ALERTA')) {
            return `<span class="px-2 py-0.5 rounded bg-red-950 text-red-300 font-semibold text-[10px] border border-red-800">ALERTA</span>`;
          }
          if (v.includes('ATENÇÃO') || v.includes('ATENCAO')) {
            return `<span class="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-medium text-[10px] border border-amber-800">ATENÇÃO</span>`;
          }
          return `<span class="px-2 py-0.5 rounded bg-[#051833] text-[#94B5D6] font-medium text-[10px] border border-[#133A66]">${val || 'OBS'}</span>`;
        }

        return `
          <tr class="${bgClass} hover:bg-[#0B2A52] transition">
            <td class="py-2.5 px-3 font-semibold text-white">
              ${item.setor}
            </td>
            <td class="py-2.5 px-2 text-center">
              ${getBadge(item.risco_sab)}
            </td>
            <td class="py-2.5 px-2 text-center">
              ${getBadge(item.risco_dom)}
            </td>
            <td class="py-2.5 px-2 text-center">
              ${getBadge(item.risco_seg)}
            </td>
            <td class="py-2.5 px-3 text-slate-200 leading-snug">
              ${item.impactos}
            </td>
            <td class="py-2.5 px-3 text-slate-200 leading-snug">
              ${item.acoes}
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}

function formatIsoDate(isoStr) {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return isoStr;
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

    const kpiJundia = document.getElementById('kpi-jundia-val');
    if (kpiJundia && jundia.nivel_rio) {
      kpiJundia.textContent = `${jundia.nivel_rio} m`;
    }

    if (levelEl) levelEl.textContent = `${jundia.nivel_rio} m`;
    if (readingEl) readingEl.textContent = `Última leitura: ${jundia.ultima_leitura || 'Hoje'}`;
    if (percentEl) percentEl.textContent = `${jundia.porcentagem_calha}% da Cota de Transbordo (${jundia.cota_transborda || '2.84 m'})`;
    
    if (progressEl) {
      progressEl.style.width = `${Math.min(100, Math.max(5, jundia.porcentagem_calha))}%`;
    }

    if (statusBadge) {
      statusBadge.textContent = jundia.status || 'ALERTA MÁXIMO';
      if (jundia.status === 'TRANSBORDAMENTO' || jundia.status === 'ALERTA MÁXIMO') {
        statusBadge.className = 'px-2.5 py-1 rounded bg-red-950 text-red-300 font-bold text-xs border border-red-800';
      } else if (jundia.status === 'ALERTA') {
        statusBadge.className = 'px-2.5 py-1 rounded bg-orange-950 text-orange-300 font-bold text-xs border border-orange-800';
      } else if (jundia.status === 'ATENÇÃO') {
        statusBadge.className = 'px-2.5 py-1 rounded bg-amber-950 text-amber-300 font-medium text-xs border border-amber-800';
      } else {
        statusBadge.className = 'px-2.5 py-1 rounded bg-[#051833] text-[#94B5D6] font-medium text-xs border border-[#133A66]';
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
      let badgeBg = 'bg-[#051833] text-[#94B5D6] border-[#133A66]';
      if (st.status === 'TRANSBORDAMENTO') badgeBg = 'bg-red-950 text-red-300 border-red-800 font-semibold';
      else if (st.status === 'ALERTA' || st.status === 'ALERTA MÁXIMO') badgeBg = 'bg-red-950 text-red-300 border-red-800 font-semibold';
      else if (st.status === 'ATENÇÃO') badgeBg = 'bg-amber-950 text-amber-300 border-amber-800 font-medium';
      else if (st.status === 'NORMAL') badgeBg = 'bg-[#051833] text-[#94B5D6] border-[#133A66]';

      return `
        <div class="p-3 rounded-lg bg-[#051833] border border-[#133A66] space-y-1.5 hover:border-[#1E528E] transition">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white text-xs">${st.nome_estacao} (${st.municipio})</span>
            <span class="px-1.5 py-0.5 rounded text-[9px] border ${badgeBg}">${st.status}</span>
          </div>
          <div class="flex items-center justify-between text-xs text-[#94B5D6]">
            <span>Rio: <strong class="text-white">${st.curso_dagua}</strong></span>
            <span>Nível: <strong class="text-white font-mono">${st.nivel_rio} m</strong></span>
          </div>
          <div class="flex items-center justify-between text-[11px] text-[#6C8EA8] border-t border-[#133A66] pt-1">
            <span>Transbordo: ${st.cota_transborda || '—'}</span>
            <span>Chuva 24h: <strong class="text-white">${st.chuva_24h} mm</strong></span>
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
