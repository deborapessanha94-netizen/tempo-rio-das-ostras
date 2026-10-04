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
  activeTab: 'tab-populacao',
  radarInitialized: false,
  isSyncing: false
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupNavigationTabs();
  setupBulletinChartTabs();
  setupActionButtons();
  setupPWA();
  loadAllApplicationData();
  startAutoSync();
});

/**
 * Gerenciamento do Tema Oficial: Modo Claro (Boletim A4) & Modo Escuro (Cemaden 24h)
 */
function initTheme() {
  const saved = localStorage.getItem('meteo_theme');
  // Padrão: Modo Claro (documento/boletim técnico limpo)
  const initialTheme = saved === 'dark' ? 'dark' : 'light';
  applyTheme(initialTheme);

  const btnLight = document.getElementById('btn-theme-light');
  const btnDark = document.getElementById('btn-theme-dark');
  const toggleBtn = document.getElementById('theme-toggle-btn');

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

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isCurrentLight = document.documentElement.classList.contains('theme-light') || !document.documentElement.classList.contains('theme-dark');
      applyTheme(isCurrentLight ? 'dark' : 'light');
      updateBulletinChart();
    });
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  const btnLight = document.getElementById('btn-theme-light');
  const btnDark = document.getElementById('btn-theme-dark');
  const toggleIcon = document.getElementById('theme-toggle-icon');
  const toggleText = document.getElementById('theme-toggle-text');

  if (theme === 'dark') {
    root.classList.remove('theme-light');
    root.classList.add('theme-dark');
    localStorage.setItem('meteo_theme', 'dark');
    if (btnLight) btnLight.classList.remove('active');
    if (btnDark) btnDark.classList.add('active');
    if (toggleIcon) toggleIcon.setAttribute('data-lucide', 'sun');
    if (toggleText) toggleText.textContent = 'Modo Claro';
  } else {
    root.classList.remove('theme-dark');
    root.classList.add('theme-light');
    localStorage.setItem('meteo_theme', 'light');
    if (btnLight) btnLight.classList.add('active');
    if (btnDark) btnDark.classList.remove('active');
    if (toggleIcon) toggleIcon.setAttribute('data-lucide', 'moon');
    if (toggleText) toggleText.textContent = 'Modo Escuro';
  }

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Sanitiza textos para eliminar vazamento de sintaxe Typst ou código residual
 */
export function cleanBulletinText(str) {
  if (!str) return '';
  let clean = String(str)
    // Remove qualquer diretiva typst como [#text(...) ou #text(...)
    .replace(/\[?#text\([^)]*\)(\[.*?\])?/gi, '')
    .replace(/#text\([^)]*\)/gi, '')
    .replace(/\[|\]/g, '')
    .replace(/\\/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return escapeHtml(clean);
}

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
        b.classList.remove('active', 'bg-[#1E88E5]', 'text-white', 'shadow-sm');
        b.classList.add('theme-text-muted');
      });
      btn.classList.add('active', 'bg-[#1E88E5]', 'text-white', 'font-semibold', 'shadow-sm');
      btn.classList.remove('theme-text-muted');

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
        b.classList.remove('active', 'bg-[#1E88E5]', 'text-white', 'font-semibold');
        b.classList.add('theme-text-muted');
      });
      btn.classList.add('active', 'bg-[#1E88E5]', 'text-white', 'font-semibold');
      btn.classList.remove('theme-text-muted');

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

    if (marinha.status === 'fulfilled' && marinha.value) {
      state.marinhaAvisos = marinha.value;
    }

    if (estacoes.status === 'fulfilled' && Array.isArray(estacoes.value)) {
      state.acumuladosEstacoes = estacoes.value;
      renderEstacoesTable(state.acumuladosEstacoes);
    }

    if (balnear.status === 'fulfilled' && Array.isArray(balnear.value)) {
      state.balneabilidade = balnear.value;
      renderBalneabilidade(state.balneabilidade);
    }

    renderAvisosDetalhados(state.inmetAlerts, state.marinhaAvisos);

    if (openMeteo.status === 'fulfilled' && openMeteo.value) {
      state.weatherData = openMeteo.value;
    }

    if (state.boletimMetadata || (state.boletimData && state.boletimData.length > 0)) {
      renderBulletinDOM(state.boletimMetadata, state.boletimData);
    }

    updateBulletinChart();

  } catch (error) {
    console.warn('Aviso durante carregamento:', error);
  } finally {
    state.isSyncing = false;
    if (window.lucide) window.lucide.createIcons();
  }
}

/**
 * Renderiza dinamicamente todo o Boletim Oficial
 */
function renderBulletinDOM(meta, rows) {
  if (!meta && (!rows || rows.length === 0)) return;

  // 1. Período e Emissão
  if (meta?.periodo) {
    const topPer = document.getElementById('meta-periodo-top');
    const popPer = document.getElementById('meta-periodo-pop');
    const tecPer = document.getElementById('meta-periodo-tec');
    if (topPer) topPer.textContent = meta.periodo;
    if (popPer) popPer.textContent = meta.periodo;
    if (tecPer) tecPer.textContent = meta.periodo;
  }

  if (meta?.emissao) {
    const topEmi = document.getElementById('meta-emissao-top');
    const popEmi = document.getElementById('meta-emissao-pop');
    const tecEmi = document.getElementById('meta-emissao-tec');
    if (topEmi) topEmi.textContent = meta.emissao;
    if (popEmi) popEmi.textContent = meta.emissao;
    if (tecEmi) tecEmi.textContent = meta.emissao;
  }

  // 2. Informe de Alerta Oficial
  if (meta?.informe_alerta) {
    const alertaEl = document.getElementById('informe-alerta-texto');
    if (alertaEl) {
      const cleanAlert = cleanBulletinText(meta.informe_alerta);
      alertaEl.innerHTML = `<strong class="theme-text-main" style="color: var(--alert-title);">Alertas Oficiais em Vigor:</strong> ${cleanAlert}`;
    }
  }

  // 3. Cards Diários da População (Aba 1)
  if (meta?.dias_resumo && Array.isArray(meta.dias_resumo) && meta.dias_resumo.length > 0) {
    const gridEl = document.getElementById('populacao-cards-grid');
    if (gridEl) {
      gridEl.innerHTML = meta.dias_resumo.map(d => {
        let badgeClass = 'badge-neutral-theme';
        if (d.badge_tipo === 'danger') {
          badgeClass = 'badge-danger-theme';
        } else if (d.badge_tipo === 'warning') {
          badgeClass = 'badge-warning-theme';
        } else if (d.badge_tipo === 'info') {
          badgeClass = 'badge-info-theme';
        }

        const pilares = d.pilares || {};
        const pilarKeys = Object.keys(pilares);

        const pilaresHtml = pilarKeys.map(k => {
          const p = pilares[k];
          return `
            <div class="theme-tile p-2.5 rounded-lg flex items-start gap-2">
              <i data-lucide="${p.icon || 'circle'}" class="w-3.5 h-3.5 text-[#1E88E5] shrink-0 mt-0.5"></i>
              <div class="min-w-0 flex-1">
                <span class="text-[9px] uppercase font-bold theme-text-dim block tracking-wider leading-none mb-1">${p.label || k}</span>
                <span class="text-xs font-bold theme-text-main block leading-tight break-words">${cleanBulletinText(p.val || '—')}</span>
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="theme-card p-4 sm:p-5 space-y-3">
            <div class="flex items-center justify-between gap-2 border-b theme-border pb-2">
              <div>
                <span class="text-[10px] font-bold theme-text-dim uppercase tracking-wider">Previsão Oficial</span>
                <h3 class="text-sm font-bold theme-text-main">${d.dia}</h3>
                <p class="text-[11px] theme-text-muted">${cleanBulletinText(d.subtitulo || '')}</p>
              </div>
              <span class="${badgeClass} shrink-0">
                ${d.badge || 'OFICIAL'}
              </span>
            </div>

            <p class="text-xs theme-text-body leading-relaxed">
              ${cleanBulletinText(d.descricao)}
            </p>

            <div class="grid grid-cols-2 gap-2 pt-2">
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
        const cleanP = cleanBulletinText(p);
        if (p.includes('Cenário de Alerta Máximo') || p.includes('Alerta Máximo de Inundação')) {
          return `<p class="p-3.5 rounded-lg theme-tile border-l-4 border-l-red-500 theme-text-main leading-relaxed">${cleanP}</p>`;
        }
        return `<p class="theme-text-body leading-relaxed">${cleanP}</p>`;
      }).join('');
    }
  }

  // 5. Glossário Operacional
  if (meta?.glossario && Array.isArray(meta.glossario)) {
    const glossEl = document.getElementById('glossario-container');
    if (glossEl) {
      glossEl.innerHTML = meta.glossario.map(g => `
        <div class="p-2.5 rounded theme-tile">
          <strong class="theme-text-main block text-[11px]">• ${g.termo}:</strong>
          <span class="theme-text-muted text-[10px]">${cleanBulletinText(g.def)}</span>
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

        const rowsHtml = dayRows.map(r => {
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
            <tr>
              <td class="font-sans font-bold theme-text-main">${r.turno}</td>
              <td class="theme-text-main font-mono">${tMin}° a ${tMax}°C</td>
              <td class="theme-text-muted font-mono">${uMin}% a ${uMax}%</td>
              <td class="theme-text-dim font-mono">${pressao}</td>
              <td class="theme-text-body font-sans">${ventoDir} ${ventoVel}${rajada}</td>
              <td class="theme-text-main font-bold font-mono">${chuvaVal} mm${chuvaProb}</td>
              <td class="theme-text-muted font-sans">${marOndas} ${marCond ? `(${marCond})` : ''}</td>
            </tr>
          `;
        }).join('');

        return `
          <div class="space-y-1.5 pt-1.5">
            <div class="flex items-center justify-between text-xs px-1">
              <span class="font-bold theme-text-main">${dia} ${dataFormatada ? `— ${dataFormatada}` : ''}</span>
              <span class="text-[11px] theme-text-muted">Volume Estimado: <strong class="theme-text-main font-mono">${somaChuva.toFixed(1)} mm</strong></span>
            </div>

            <div class="overflow-x-auto">
              <table class="theme-table text-xs">
                <thead>
                  <tr>
                    <th>Turno</th>
                    <th>Temperatura</th>
                    <th>Umidade</th>
                    <th>Pressão</th>
                    <th>Vento & Rajadas</th>
                    <th>Precipitação</th>
                    <th>Estado do Mar</th>
                  </tr>
                </thead>
                <tbody class="font-mono text-[11px]">
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
    const thD0 = document.getElementById('plancon-th-d0');
    const thD1 = document.getElementById('plancon-th-d1');
    const thD2 = document.getElementById('plancon-th-d2');

    let d0Label = 'D+0';
    let d1Label = 'D+1';
    let d2Label = 'D+2';

    if (meta?.dias_resumo && meta.dias_resumo.length >= 3) {
      const getAbrev = (str) => {
        if (!str) return '';
        const m = str.match(/^(DOMINGO|SEGUNDA|TERÇA|TERCA|QUARTA|QUINTA|SEXTA|SÁBADO|SABADO)/i);
        if (m) {
          const w = m[1].toUpperCase();
          if (w.startsWith('DOM')) return 'Dom';
          if (w.startsWith('SEG')) return 'Seg';
          if (w.startsWith('TER')) return 'Ter';
          if (w.startsWith('QUA')) return 'Qua';
          if (w.startsWith('QUI')) return 'Qui';
          if (w.startsWith('SEX')) return 'Sex';
          if (w.startsWith('SÁB') || w.startsWith('SAB')) return 'Sáb';
        }
        return str.substring(0, 3);
      };
      d0Label = getAbrev(meta.dias_resumo[0]?.dia) || 'D+0';
      d1Label = getAbrev(meta.dias_resumo[1]?.dia) || 'D+1';
      d2Label = getAbrev(meta.dias_resumo[2]?.dia) || 'D+2';
    }

    if (thD0) thD0.textContent = d0Label;
    if (thD1) thD1.textContent = d1Label;
    if (thD2) thD2.textContent = d2Label;

    const planconBody = document.getElementById('plancon-table-body');
    if (planconBody) {
      planconBody.innerHTML = meta.impactos_bairros.map(item => {
        function getBadge(val) {
          const v = String(val || 'OBS').toUpperCase();
          if (v.includes('MÁXIMO') || v.includes('MAXIMO')) {
            return `<span class="badge-danger-theme">MÁXIMO</span>`;
          }
          if (v.includes('ALERTA')) {
            return `<span class="badge-danger-theme">ALERTA</span>`;
          }
          if (v.includes('ATENÇÃO') || v.includes('ATENCAO')) {
            return `<span class="badge-warning-theme">ATENÇÃO</span>`;
          }
          return `<span class="badge-neutral-theme">${val || 'OBS'}</span>`;
        }

        const r0 = item.risco_d0 ?? item.risco_sab ?? item.risco_dom ?? item.risco_seg ?? 'OBS';
        const r1 = item.risco_d1 ?? item.risco_dom ?? item.risco_seg ?? 'OBS';
        const r2 = item.risco_d2 ?? item.risco_seg ?? item.risco_ter ?? 'OBS';

        return `
          <tr>
            <td class="font-semibold theme-text-main">
              ${cleanBulletinText(item.setor)}
            </td>
            <td class="text-center">
              ${getBadge(r0)}
            </td>
            <td class="text-center">
              ${getBadge(r1)}
            </td>
            <td class="text-center">
              ${getBadge(r2)}
            </td>
            <td class="theme-text-body leading-snug">
              ${cleanBulletinText(item.impactos)}
            </td>
            <td class="theme-text-body leading-snug">
              ${cleanBulletinText(item.acoes)}
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
        statusBadge.className = 'badge-danger-theme';
      } else if (jundia.status === 'ALERTA') {
        statusBadge.className = 'badge-danger-theme';
      } else if (jundia.status === 'ATENÇÃO') {
        statusBadge.className = 'badge-warning-theme';
      } else {
        statusBadge.className = 'badge-neutral-theme';
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
      let badgeBg = 'badge-neutral-theme';
      if (st.status === 'TRANSBORDAMENTO' || st.status === 'ALERTA MÁXIMO') badgeBg = 'badge-danger-theme';
      else if (st.status === 'ALERTA') badgeBg = 'badge-danger-theme';
      else if (st.status === 'ATENÇÃO') badgeBg = 'badge-warning-theme';

      return `
        <div class="theme-tile p-3 space-y-1.5 hover:border-[#1E528E] transition">
          <div class="flex items-center justify-between">
            <span class="font-bold theme-text-main text-xs">${st.nome_estacao} (${st.municipio})</span>
            <span class="${badgeBg}">${st.status}</span>
          </div>
          <div class="flex items-center justify-between text-xs theme-text-muted">
            <span>Rio: <strong class="theme-text-main">${st.curso_dagua}</strong></span>
            <span>Nível: <strong class="theme-text-main font-mono">${st.nivel_rio} m</strong></span>
          </div>
          <div class="flex items-center justify-between text-[11px] theme-text-dim border-t theme-tile-border pt-1">
            <span>Transbordo: ${st.cota_transborda || '—'}</span>
            <span>Chuva 24h: <strong class="theme-text-main">${st.chuva_24h} mm</strong></span>
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

/**
 * Renderiza a tabela da Rede Municipal de Estações e Acumulados de Chuva (1h a 96h)
 */
function renderEstacoesTable(estacoes) {
  const tbody = document.getElementById('estacoes-table-body');
  if (!tbody || !Array.isArray(estacoes) || estacoes.length === 0) return;

  tbody.innerHTML = estacoes.map(e => {
    const isOnline = e.online;
    const statusBadge = isOnline 
      ? `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>ONLINE</span>`
      : `<span class="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">OFF</span>`;

    function fmtRain(val) {
      if (val === undefined || val === null || val === '') return '-';
      const num = parseFloat(val);
      if (isNaN(num)) return '-';
      if (num >= 50) return `<strong class="text-red-600 font-bold font-mono">${num.toFixed(1)} mm</strong>`;
      if (num >= 20) return `<span class="text-amber-600 font-semibold font-mono">${num.toFixed(1)} mm</span>`;
      return `<span class="font-mono">${num.toFixed(1)} mm</span>`;
    }

    return `
      <tr>
        <td class="font-mono font-bold theme-text-main text-[11px] whitespace-nowrap">
          ${cleanBulletinText(e.codigo)}
        </td>
        <td class="font-medium theme-text-main">
          ${cleanBulletinText(e.nome)}
        </td>
        <td class="theme-text-muted text-[10px] whitespace-nowrap">
          ${cleanBulletinText(e.rede)}
        </td>
        <td class="text-center font-mono">${fmtRain(e.chuva_1h)}</td>
        <td class="text-center font-mono">${fmtRain(e.chuva_4h)}</td>
        <td class="text-center font-mono">${fmtRain(e.chuva_12h)}</td>
        <td class="text-center font-mono font-bold bg-black/5">${fmtRain(e.chuva_24h)}</td>
        <td class="text-center font-mono">${fmtRain(e.chuva_36h)}</td>
        <td class="text-center font-mono">${fmtRain(e.chuva_48h)}</td>
        <td class="text-center font-mono font-bold">${fmtRain(e.chuva_96h)}</td>
        <td class="text-center whitespace-nowrap">${statusBadge}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Renderiza os avisos oficiais da Marinha do Brasil e do INMET
 */
function renderAvisosDetalhados(inmetAvisos, marinha) {
  const container = document.getElementById('avisos-detalhados-container');
  if (!container) return;

  let html = '';

  // Aviso Marinha CHM
  if (marinha && marinha.aviso_ativo) {
    html += `
      <div class="theme-tile p-4 border-l-4 border-l-blue-600 space-y-2">
        <div class="flex items-center justify-between gap-2 border-b theme-border pb-2">
          <div class="flex items-center gap-2">
            <i data-lucide="anchor" class="w-4 h-4 text-blue-600"></i>
            <strong class="text-xs font-bold theme-text-main uppercase">MARINHA DO BRASIL • CHM</strong>
          </div>
          <span class="badge-warning-theme font-bold">AVISO Nº ${marinha.numero || '733/2026'}</span>
        </div>
        <div class="text-xs space-y-1 theme-text-body">
          <div class="font-bold text-blue-700">${marinha.tipo || 'VENTO FORTE'} — ${marinha.forca || 'FORÇA 7'}</div>
          <div><strong>Área de Atuação:</strong> ${marinha.area || 'Área DELTA (Cabo Frio a Farol de São Tomé)'}</div>
          <div><strong>Intensidade de Vento:</strong> ${marinha.rajadas || 'Rajadas de até 47 km/h'}</div>
          <div><strong>Condições do Mar:</strong> ${marinha.mar_ondas || 'Ondas de 2,0 a 2,5 m (Muito Agitado)'}</div>
          <div class="text-[11px] theme-text-muted"><strong>Vigência Oficial:</strong> ${marinha.validade || 'Até 05/10 às 09h'}</div>
        </div>
      </div>
    `;
  }

  // Avisos INMET
  if (Array.isArray(inmetAvisos) && inmetAvisos.length > 0) {
    inmetAvisos.forEach(a => {
      const sevClass = a.severidade === 'Grande Perigo' ? 'border-l-red-600' : (a.severidade === 'Perigo' ? 'border-l-orange-500' : 'border-l-amber-500');
      const badgeClass = a.severidade === 'Grande Perigo' ? 'badge-danger-theme' : (a.severidade === 'Perigo' ? 'badge-warning-theme' : 'badge-warning-theme');
      
      const riscosText = Array.isArray(a.riscos) ? a.riscos.join(' • ') : '';
      const instrucoesText = Array.isArray(a.instrucoes) ? a.instrucoes.join(' • ') : '';

      html += `
        <div class="theme-tile p-4 border-l-4 ${sevClass} space-y-2">
          <div class="flex items-center justify-between gap-2 border-b theme-border pb-2">
            <div class="flex items-center gap-2">
              <i data-lucide="alert-octagon" class="w-4 h-4 text-orange-500"></i>
              <strong class="text-xs font-bold theme-text-main uppercase">INMET • AVISO OFICIAL</strong>
            </div>
            <span class="${badgeClass} font-bold text-[10px]">${a.severidade || 'ALERTA'}</span>
          </div>
          <div class="text-xs space-y-1 theme-text-body">
            <div class="font-bold text-amber-700">${cleanBulletinText(a.descricao)}</div>
            ${a.inicio ? `<div><strong>Início:</strong> ${a.inicio}</div>` : ''}
            ${a.fim ? `<div><strong>Término:</strong> ${a.fim}</div>` : ''}
            ${riscosText ? `<div class="text-[11px] theme-text-muted"><strong>Riscos Potenciais:</strong> ${cleanBulletinText(riscosText)}</div>` : ''}
            ${instrucoesText ? `<div class="text-[11px] theme-text-muted"><strong>Orientações:</strong> ${cleanBulletinText(instrucoesText)}</div>` : ''}
          </div>
        </div>
      `;
    });
  }

  if (!html) {
    html = `<div class="p-3 theme-tile text-xs theme-text-muted">Nenhum aviso meteorológico severo vigente no momento.</div>`;
  }

  container.innerHTML = html;
}

/**
 * Renderiza o quadro de balneabilidade das praias (INEA)
 */
function renderBalneabilidade(praias) {
  const container = document.getElementById('balneabilidade-container');
  if (!container || !Array.isArray(praias) || praias.length === 0) return;

  container.innerHTML = praias.map(p => {
    const isPropria = p.status === 'PRÓPRIA';
    const badge = isPropria 
      ? `<span class="badge-neutral-theme bg-emerald-50 text-emerald-700 border-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded">PRÓPRIA</span>`
      : `<span class="badge-danger-theme font-bold text-[10px] px-2 py-0.5 rounded">IMPRÓPRIA</span>`;

    return `
      <div class="theme-tile p-3 space-y-1.5 flex flex-col justify-between">
        <div class="space-y-0.5">
          <span class="text-xs font-bold theme-text-main block">${cleanBulletinText(p.praia)}</span>
          ${p.obs ? `<span class="text-[10px] theme-text-muted block leading-tight">${cleanBulletinText(p.obs)}</span>` : ''}
        </div>
        <div class="pt-1.5 border-t theme-tile-border flex justify-between items-center">
          <span class="text-[9px] uppercase theme-text-dim font-bold">Condição:</span>
          ${badge}
        </div>
      </div>
    `;
  }).join('');
}
