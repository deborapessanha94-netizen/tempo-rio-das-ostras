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
  initRadarMap('radar-map');
  loadAllApplicationData();
  startAutoSync();
});

/**
 * Gerenciamento do Tema Oficial: Modo Claro (Boletim A4) & Modo Escuro (Cemaden 24h)
 */
function initTheme() {
  const saved = localStorage.getItem('meteo_theme');
  // Padrão: Modo "Black and Gold Elegance" (#000000, #14213D, #FCA311)
  const initialTheme = saved === 'light' ? 'light' : 'dark';
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
    root.classList.add('theme-dark', 'dark');
    localStorage.setItem('meteo_theme', 'dark');
    if (btnLight) btnLight.classList.remove('active');
    if (btnDark) btnDark.classList.add('active');
    if (toggleIcon) toggleIcon.setAttribute('data-lucide', 'sun');
    if (toggleText) toggleText.textContent = 'Modo Claro';
  } else {
    root.classList.remove('theme-dark', 'dark');
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
  const topBar = document.getElementById('header-top-bar');

  // Compacta suavemente o cabeçalho ao rolar para dar mais área visual ao conteúdo
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      if (topBar && !topBar.classList.contains('header-compact')) {
        topBar.classList.add('header-compact');
      }
    } else {
      if (topBar && topBar.classList.contains('header-compact')) {
        topBar.classList.remove('header-compact');
      }
    }
  }, { passive: true });

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      if (!targetId) return;

      state.activeTab = targetId;

      // Se o usuário alternar de aba enquanto estiver no meio da página, sobe suavemente ao topo
      if (window.scrollY > 80) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Atualiza botões
      tabButtons.forEach(b => {
        b.classList.remove('active', 'bg-[#1E88E5]', 'bg-[#FCA311]', 'text-white', 'text-black', 'shadow-sm', 'shadow-md');
        b.classList.add('theme-text-muted');
      });
      btn.classList.add('active', 'bg-[#FCA311]', 'text-black', 'font-bold', 'shadow-md');
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
        b.classList.remove('active', 'bg-[#1E88E5]', 'bg-[#FCA311]', 'text-white', 'text-black', 'font-semibold', 'font-bold');
        b.classList.add('theme-text-muted');
      });
      btn.classList.add('active', 'bg-[#FCA311]', 'text-black', 'font-bold', 'shadow-sm');
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

  // 2. Quadro Oficial de Alertas da Defesa Civil (Cards Estruturados e Limpos)
  renderAlertBannerGrid(meta);

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
            <div class="theme-tile p-2.5 rounded-lg flex items-start gap-2 min-h-[58px]">
              <i data-lucide="${p.icon || 'circle'}" class="w-4 h-4 text-[#FCA311] shrink-0 mt-0.5"></i>
              <div class="min-w-0 flex-1">
                <span class="text-[9px] uppercase font-bold theme-text-dim block tracking-wider leading-none mb-1">${p.label || k}</span>
                <span class="text-xs font-bold theme-text-main block leading-snug break-words whitespace-normal">${cleanBulletinText(p.val || '—')}</span>
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

  // 4. Panorama Sinótico Geral (Estrutura Modular Executiva)
  renderSinopseContent(meta);

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
    const rain6h = document.getElementById('jundia-rain-6h');
    const rain12h = document.getElementById('jundia-rain-12h');
    const rain24h = document.getElementById('jundia-rain-24h');
    const rain36h = document.getElementById('jundia-rain-36h');
    const rain48h = document.getElementById('jundia-rain-48h');
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
    if (rain6h) rain6h.textContent = `${jundia.chuva_6h || '0.0'} mm`;
    if (rain12h) rain12h.textContent = `${jundia.chuva_12h || '0.0'} mm`;
    if (rain24h) rain24h.textContent = `${jundia.chuva_24h || '0.0'} mm`;
    if (rain36h) rain36h.textContent = `${jundia.chuva_36h || '0.0'} mm`;
    if (rain48h) rain48h.textContent = `${jundia.chuva_48h || '0.0'} mm`;
    if (rain96h) rain96h.textContent = `${jundia.chuva_96h || '0.0'} mm`;
    if (rain30d) rain30d.textContent = `${jundia.chuva_30d || '0.0'} mm`;
  }

  // Renderiza TODAS as estações monitoradas da Bacia Hidrográfica (incluindo Rio das Ostras em destaque prioritário)
  const otherGrid = document.getElementById('other-stations-grid');
  if (otherGrid) {
    const sortedStations = [...stations].sort((a, b) => {
      const aOstras = a.eh_rio_das_ostras || (a.municipio && a.municipio.toLowerCase().includes('ostras')) || a.nome_estacao.toLowerCase().includes('jundi');
      const bOstras = b.eh_rio_das_ostras || (b.municipio && b.municipio.toLowerCase().includes('ostras')) || b.nome_estacao.toLowerCase().includes('jundi');
      if (aOstras && !bOstras) return -1;
      if (!aOstras && bOstras) return 1;
      return 0;
    });

    otherGrid.innerHTML = sortedStations.map(st => {
      const isOstras = st.eh_rio_das_ostras || (st.municipio && st.municipio.toLowerCase().includes('ostras')) || st.nome_estacao.toLowerCase().includes('jundi');
      let badgeBg = 'badge-neutral-theme';
      if (st.status === 'TRANSBORDAMENTO' || st.status === 'ALERTA MÁXIMO') badgeBg = 'badge-danger-theme';
      else if (st.status === 'ALERTA') badgeBg = 'badge-danger-theme';
      else if (st.status === 'ATENÇÃO') badgeBg = 'badge-warning-theme';

      function fmtVal(v) {
        if (v === undefined || v === null || v === '') return '0.0';
        const num = parseFloat(String(v).replace(',', '.'));
        return isNaN(num) ? '0.0' : num.toFixed(1);
      }

      const c1 = fmtVal(st.chuva_1h);
      const c4 = fmtVal(st.chuva_4h);
      const c6 = fmtVal(st.chuva_6h);
      const c12 = fmtVal(st.chuva_12h);
      const c24 = fmtVal(st.chuva_24h);
      const c36 = fmtVal(st.chuva_36h);
      const c48 = fmtVal(st.chuva_48h);

      const n24 = parseFloat(c24);
      const n48 = parseFloat(c48);

      return `
        <div class="theme-tile p-3.5 space-y-2.5 transition rounded-lg ${isOstras ? 'border-2 border-red-500 shadow-md ring-2 ring-red-500/20' : 'border theme-border hover:border-[#1E528E]'}">
          <div class="flex items-center justify-between gap-2 border-b theme-tile-border pb-1.5">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-bold theme-text-main text-xs">${cleanBulletinText(st.nome_estacao)} (${cleanBulletinText(st.municipio)})</span>
              ${isOstras ? '<span class="text-[9px] font-extrabold uppercase bg-red-600 text-white px-1.5 py-0.5 rounded shadow-sm">Rio das Ostras</span>' : ''}
            </div>
            <span class="${badgeBg} text-[10px] font-bold">${cleanBulletinText(st.status)}</span>
          </div>

          <div class="grid grid-cols-2 gap-1.5 text-xs theme-text-muted">
            <div>Rio: <strong class="theme-text-main">${cleanBulletinText(st.curso_dagua)}</strong></div>
            <div class="text-right">Nível: <strong class="theme-text-main font-mono text-sm">${cleanBulletinText(st.nivel_rio)}${st.nivel_rio && st.nivel_rio !== '-' ? ' m' : ''}</strong></div>
            <div>Transbordo: <span class="font-mono theme-text-body">${cleanBulletinText(st.cota_transborda || '—')}</span></div>
            <div class="text-right">Alerta: <span class="font-mono theme-text-body">${cleanBulletinText(st.cota_alerta || '—')}</span></div>
          </div>

          <div class="pt-2 border-t theme-tile-border space-y-1.5">
            <div class="text-[10px] font-bold uppercase tracking-wider theme-text-dim flex items-center justify-between">
              <span>Acumulados de Chuva:</span>
              <span class="text-[9px] font-normal lowercase theme-text-muted">Leitura: ${cleanBulletinText(st.ultima_leitura || 'Recente')}</span>
            </div>
            <div class="grid grid-cols-4 sm:grid-cols-7 gap-1 font-mono text-center">
              <div class="p-1 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <span class="block text-[9px] theme-text-muted font-sans">1h</span>
                <span class="font-bold text-[11px] theme-text-main">${c1}</span>
              </div>
              <div class="p-1 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <span class="block text-[9px] theme-text-muted font-sans">4h</span>
                <span class="font-bold text-[11px] theme-text-main">${c4}</span>
              </div>
              <div class="p-1 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <span class="block text-[9px] theme-text-muted font-sans">6h</span>
                <span class="font-bold text-[11px] theme-text-main">${c6}</span>
              </div>
              <div class="p-1 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <span class="block text-[9px] theme-text-muted font-sans">12h</span>
                <span class="font-bold text-[11px] ${parseFloat(c12) > 0 ? 'text-amber-600' : 'theme-text-main'}">${c12}</span>
              </div>
              <div class="p-1 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <span class="block text-[9px] theme-text-muted font-sans font-bold">24h</span>
                <span class="font-bold text-[11px] ${n24 >= 50 ? 'text-red-600 font-extrabold' : (n24 >= 20 ? 'text-amber-600' : 'theme-text-main')}">${c24}</span>
              </div>
              <div class="p-1 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <span class="block text-[9px] theme-text-muted font-sans">36h</span>
                <span class="font-bold text-[11px] ${parseFloat(c36) >= 50 ? 'text-red-600 font-extrabold' : 'theme-text-main'}">${c36}</span>
              </div>
              <div class="p-1 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <span class="block text-[9px] theme-text-muted font-sans">48h</span>
                <span class="font-bold text-[11px] ${n48 >= 50 ? 'text-red-600 font-extrabold' : 'theme-text-main'}">${c48}</span>
              </div>
            </div>
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
          reg.update();
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
        <td class="text-center font-mono">${fmtRain(e.chuva_6h)}</td>
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
 * Extrai e formata datas de avisos meteorológicos e marítimos com tolerância total a formatos
 */
function formatarDataHoraAviso(val, horaFallback) {
  if (!val) return '';
  let str = String(val).trim();
  
  // Trata formato ISO (ex: 2026-10-04T00:00:00.000Z ou 2026-10-04 10:10 ou 2026-10-04)
  const matchIso = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (matchIso) {
    const [, ano, mes, dia, h, m] = matchIso;
    const hora = (h && m) ? `${h}:${m}h` : (horaFallback ? (String(horaFallback).endsWith('h') ? horaFallback : `${horaFallback}h`) : '');
    return hora ? `${dia}/${mes}/${ano} às ${hora}` : `${dia}/${mes}/${ano}`;
  }

  // Se já contiver "DD/MM/AAAA às HH:MM"
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    if (str.includes('às') && !str.endsWith('h')) {
      return `${str}h`;
    }
    if (!str.includes('às') && horaFallback) {
      const horaClean = String(horaFallback).endsWith('h') ? horaFallback : `${horaFallback}h`;
      return `${str} às ${horaClean}`;
    }
    return str;
  }

  return str;
}

function resolverInicioAviso(a) {
  if (!a) return '04/10/2026 às 00:00h';
  const val = a.inicio || a.inicio_formatado || a.data_inicio || a.start || '';
  const hora = a.hora_inicio || '';
  const fmt = formatarDataHoraAviso(val, hora);
  if (fmt) return fmt;
  if (a.emissao) return a.emissao;
  return '04/10/2026 às 10:10h';
}

function resolverFimAviso(a) {
  if (!a) return '05/10/2026 às 23:59h';
  const val = a.fim || a.fim_formatado || a.data_fim || a.end || a.validade || '';
  const hora = a.hora_fim || '';
  const fmt = formatarDataHoraAviso(val, hora);
  if (fmt) return fmt;
  return '04/10/2026 às 23:59h';
}

/**
 * Renderiza os avisos oficiais da Marinha do Brasil e do INMET garantindo datas completas e visíveis
 */
function renderAvisosDetalhados(inmetAvisos, marinha) {
  const container = document.getElementById('avisos-detalhados-container');
  if (!container) return;

  let html = '';

  // 1. Aviso Marinha CHM (Área Delta)
  if (marinha && marinha.aviso_ativo) {
    const marNum = marinha.numero || '733/2026';
    const marTipo = marinha.tipo || 'VENTO FORTE';
    const marForca = marinha.forca || 'FORÇA 7 BEAUFORT';
    const marArea = marinha.area || 'Área DELTA (Cabo Frio a Farol de São Tomé)';
    const marRaj = marinha.rajadas || 'Rajadas de até 53 km/h (28 nós)';
    const marOnd = marinha.mar_ondas || 'Ondas de 2,0 a 2,5 m (Muito Agitado)';
    
    const marInicio = marinha.inicio || marinha.inicio_formatado || '04/10/2026 às 00:00 UTC (03/10 às 21:00h BRT)';
    const marFim = marinha.fim || marinha.fim_formatado || '05/10/2026 às 12:00 UTC (05/10 às 09:00h BRT)';
    const marEmissao = marinha.emissao || '03/10/2026 às 10:00h BRT (1300Z)';
    const marValidade = marinha.validade || 'Válido de 04/10 às 00h UTC até 05/10/2026 às 09:00h BRT';

    html += `
      <div class="theme-tile p-4 border-l-4 border-l-blue-500 space-y-3 shadow-xs">
        <div class="flex items-center justify-between gap-2 border-b theme-border pb-2">
          <div class="flex items-center gap-2">
            <i data-lucide="anchor" class="w-4 h-4 text-blue-400"></i>
            <strong class="text-xs font-bold theme-text-main uppercase">MARINHA DO BRASIL • CHM</strong>
          </div>
          <span class="badge-warning-theme font-bold text-[10px]">AVISO Nº ${marNum}</span>
        </div>

        <div class="space-y-2 text-xs theme-text-body">
          <div class="font-bold text-blue-400 text-sm flex items-center gap-1.5">
            <i data-lucide="wind" class="w-4 h-4 shrink-0"></i>
            <span>${marTipo} — ${marForca}</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
            <div><strong>Área de Atuação:</strong> ${cleanBulletinText(marArea)}</div>
            <div><strong>Intensidade de Vento:</strong> ${cleanBulletinText(marRaj)}</div>
            <div class="sm:col-span-2"><strong>Condições do Mar:</strong> ${cleanBulletinText(marOnd)}</div>
          </div>

          <!-- BLOCO DE VIGÊNCIA OFICIAL E DATAS (100% GARANTIDO) -->
          <div class="p-2.5 rounded-md bg-black/40 border border-[#FCA311]/30 space-y-1 font-mono text-xs">
            <div class="flex items-center justify-between text-white flex-wrap gap-1">
              <span class="flex items-center gap-1.5">
                <i data-lucide="calendar" class="w-3.5 h-3.5 text-[#FCA311] shrink-0"></i>
                <span><strong class="text-[#FCA311]">Início da Vigência:</strong> ${cleanBulletinText(marInicio)}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-sans font-bold">Oficial CHM</span>
            </div>
            <div class="flex items-center justify-between text-white flex-wrap gap-1">
              <span class="flex items-center gap-1.5">
                <i data-lucide="clock" class="w-3.5 h-3.5 text-[#FCA311] shrink-0"></i>
                <span><strong class="text-[#FCA311]">Término / Validade:</strong> ${cleanBulletinText(marFim)}</span>
              </span>
            </div>
            <div class="flex items-center gap-1.5 text-[10px] text-[#E5E5E5] pt-1 border-t border-white/10 flex-wrap">
              <i data-lucide="file-badge" class="w-3 h-3 text-blue-400 shrink-0"></i>
              <span><strong>Emissão Oficial:</strong> ${cleanBulletinText(marEmissao)}</span>
              <span class="text-white/40">•</span>
              <span class="text-amber-300"><strong>Validade:</strong> ${cleanBulletinText(marValidade)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 2. Avisos INMET
  if (Array.isArray(inmetAvisos) && inmetAvisos.length > 0) {
    inmetAvisos.forEach(a => {
      const sevClass = a.severidade === 'Grande Perigo' ? 'border-l-red-600' : (a.severidade === 'Perigo' ? 'border-l-orange-500' : 'border-l-amber-500');
      const badgeClass = a.severidade === 'Grande Perigo' ? 'badge-danger-theme' : (a.severidade === 'Perigo' ? 'badge-warning-theme' : 'badge-warning-theme');
      
      const inicioTxt = resolverInicioAviso(a);
      const fimTxt = resolverFimAviso(a);
      const periodoTxt = `${inicioTxt} até ${fimTxt}`;

      const riscosText = Array.isArray(a.riscos) ? a.riscos.join(' • ') : (a.riscos || '');
      const instrucoesText = Array.isArray(a.instrucoes) ? a.instrucoes.join(' • ') : (a.instrucoes || '');

      html += `
        <div class="theme-tile p-4 border-l-4 ${sevClass} space-y-3 shadow-xs">
          <div class="flex items-center justify-between gap-2 border-b theme-border pb-2">
            <div class="flex items-center gap-2">
              <i data-lucide="alert-octagon" class="w-4 h-4 text-orange-500"></i>
              <strong class="text-xs font-bold theme-text-main uppercase">INMET • AVISO OFICIAL</strong>
            </div>
            <div class="flex items-center gap-1.5">
              ${a.eh_direto_ostras ? '<span class="badge-danger-theme font-bold text-[9px]">DIRETO EM RIO DAS OSTRAS</span>' : '<span class="badge-neutral-theme text-[9px]">ESTADO DO RJ</span>'}
              <span class="${badgeClass} font-bold text-[10px]">${cleanBulletinText(a.severidade || 'ALERTA')}</span>
            </div>
          </div>

          <div class="space-y-2 text-xs theme-text-body">
            <div class="font-bold text-amber-500 text-sm flex items-center gap-1.5">
              <i data-lucide="cloud-lightning" class="w-4 h-4 shrink-0"></i>
              <span>${cleanBulletinText(a.descricao || 'Alerta Meteorológico')}</span>
            </div>

            <!-- BLOCO DE VIGÊNCIA OFICIAL E DATAS (100% GARANTIDO) -->
            <div class="p-2.5 rounded-md bg-black/40 border border-[#FCA311]/30 space-y-1 font-mono text-xs">
              <div class="flex items-center justify-between text-white flex-wrap gap-1">
                <span class="flex items-center gap-1.5">
                  <i data-lucide="calendar" class="w-3.5 h-3.5 text-[#FCA311] shrink-0"></i>
                  <span><strong class="text-[#FCA311]">Início do Alerta:</strong> ${cleanBulletinText(inicioTxt)}</span>
                </span>
                <span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-sans font-bold">Oficial INMET</span>
              </div>
              <div class="flex items-center justify-between text-white flex-wrap gap-1">
                <span class="flex items-center gap-1.5">
                  <i data-lucide="clock" class="w-3.5 h-3.5 text-[#FCA311] shrink-0"></i>
                  <span><strong class="text-[#FCA311]">Término Previsto:</strong> ${cleanBulletinText(fimTxt)}</span>
                </span>
              </div>
              <div class="flex items-center gap-1.5 text-[10px] text-[#E5E5E5] pt-1 border-t border-white/10 flex-wrap">
                <i data-lucide="shield-alert" class="w-3 h-3 text-amber-400 shrink-0"></i>
                <span><strong>Período Ativo:</strong> ${cleanBulletinText(periodoTxt)}</span>
              </div>
            </div>

            ${riscosText ? `
              <div>
                <strong class="text-[#E5E5E5] block text-[11px] mb-0.5">Riscos Potenciais:</strong>
                <p class="text-[11px] theme-text-muted leading-relaxed">${cleanBulletinText(riscosText)}</p>
              </div>
            ` : ''}

            ${instrucoesText ? `
              <div>
                <strong class="text-[#E5E5E5] block text-[11px] mb-0.5">Orientações de Segurança:</strong>
                <p class="text-[11px] theme-text-muted leading-relaxed">${cleanBulletinText(instrucoesText)}</p>
              </div>
            ` : ''}

            ${a.estados ? `
              <div class="text-[10px] theme-text-dim pt-1 border-t border-white/5">
                <strong>Área de Abrangência:</strong> ${cleanBulletinText(a.estados)}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });
  }

  if (!html) {
    const hojeStr = new Date().toLocaleDateString('pt-BR');
    const agoraHora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    html = `<div class="p-3 theme-tile text-xs theme-text-muted col-span-2">Nenhum aviso meteorológico severo vigente no momento para a região (Verificado em ${hojeStr} às ${agoraHora}h).</div>`;
  }

  container.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
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

/**
 * Renderiza o Quadro Oficial de Alertas da Defesa Civil em cards estruturados e limpos
 */
function renderAlertBannerGrid(meta) {
  const gridEl = document.getElementById('informe-alerta-grid');
  if (!gridEl) return;

  // Se já houver alertas estruturados nos metadados, renderiza diretamente
  if (meta?.alertas_estruturados && Array.isArray(meta.alertas_estruturados) && meta.alertas_estruturados.length > 0) {
    gridEl.innerHTML = meta.alertas_estruturados.map(a => {
      let icon = 'alert-triangle';
      let iconColor = 'text-amber-500';
      let badgeClass = 'badge-warning-theme';

      if (a.tipo === 'hidrologico') {
        icon = 'waves';
        iconColor = 'text-red-600';
        badgeClass = a.badge === 'danger' ? 'badge-danger-theme' : 'badge-warning-theme';
      } else if (a.tipo === 'maritimo') {
        icon = 'anchor';
        iconColor = 'text-blue-600';
        badgeClass = 'badge-warning-theme';
      } else if (a.tipo === 'pluviometrico') {
        icon = 'cloud-rain';
        iconColor = 'text-orange-500';
        badgeClass = 'badge-info-theme';
      }

      return `
        <div class="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-orange-200 dark:border-orange-950/40 space-y-1 shadow-xs">
          <div class="flex items-center justify-between gap-1">
            <div class="flex items-center gap-1.5 font-bold theme-text-main">
              <i data-lucide="${icon}" class="w-4 h-4 ${iconColor} shrink-0"></i>
              <span>${cleanBulletinText(a.titulo)}</span>
            </div>
            <span class="${badgeClass} font-bold text-[10px]">${cleanBulletinText(a.status)}</span>
          </div>
          <div class="font-mono text-[11px] font-bold theme-text-main">
            ${cleanBulletinText(a.detalhe)}
          </div>
          <p class="theme-text-body text-[11px] leading-snug">
            ${cleanBulletinText(a.impacto)}
          </p>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Fallback com dados da telemetria ao vivo
  const jundiaStation = Array.isArray(state.ineaCheias) 
    ? state.ineaCheias.find(s => s.eh_rio_das_ostras || (s.nome_estacao && s.nome_estacao.toLowerCase().includes('jundi')))
    : null;
  const jundiaNivel = jundiaStation?.nivel_rio ? `${jundiaStation.nivel_rio}` : (meta?.kpis?.jundia_nivel || '2,48 m');
  const jundiaStatus = jundiaStation?.status || meta?.kpis?.jundia_status || 'ALERTA MÁXIMO';
  const isJundiaCritico = jundiaStatus.includes('MÁXIMO') || jundiaStatus.includes('ALERTA');
  const badgeJundiaClass = isJundiaCritico ? 'badge-danger-theme' : 'badge-warning-theme';

  const marinha = state.marinhaAvisos;
  const marNum = marinha?.numero || '733';
  const marRaj = marinha?.rajadas || 'Rajadas até 53 km/h';
  const marOnd = marinha?.mar_ondas || 'Ondas de 2,0 a 2,5 m';

  const chuva3d = meta?.kpis?.chuva_3d || '49,2 mm';
  const picoCalor = meta?.kpis?.pico_calor || '32°C';

  gridEl.innerHTML = `
    <!-- 1. Alerta Hidrológico -->
    <div class="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-orange-200 dark:border-orange-950/40 space-y-1 shadow-xs">
      <div class="flex items-center justify-between gap-1">
        <div class="flex items-center gap-1.5 font-bold theme-text-main">
          <i data-lucide="waves" class="w-4 h-4 text-red-600 shrink-0"></i>
          <span>Rio Jundiá (INEA)</span>
        </div>
        <span class="${badgeJundiaClass} font-bold text-[10px]">${jundiaStatus}</span>
      </div>
      <div class="font-mono text-[11px] font-bold text-red-700 dark:text-red-400">
        Cota: ${jundiaNivel} <span class="font-sans font-normal text-[10px] opacity-80">(Transbordo: 2,20 m)</span>
      </div>
      <p class="theme-text-body text-[11px] leading-snug">
        Calha sob vigilância máxima. Risco de alagamentos e refluxo nos bairros Âncora e Cláudio Ribeiro.
      </p>
    </div>

    <!-- 2. Aviso Marítimo -->
    <div class="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-orange-200 dark:border-orange-950/40 space-y-1 shadow-xs">
      <div class="flex items-center justify-between gap-1">
        <div class="flex items-center gap-1.5 font-bold theme-text-main">
          <i data-lucide="anchor" class="w-4 h-4 text-blue-600 shrink-0"></i>
          <span>Marinha do Brasil (CHM)</span>
        </div>
        <span class="badge-warning-theme font-bold text-[10px]">AVISO Nº ${marNum}</span>
      </div>
      <div class="text-[11px] font-bold text-blue-700 dark:text-blue-400">
        Vento Forte • ${marRaj}
      </div>
      <p class="theme-text-body text-[11px] leading-snug">
        ${marOnd} na Área Delta. Ressaca na orla marítima. Vigência até 05/10 às 09h.
      </p>
    </div>

    <!-- 3. Alerta Pluviométrico / Meteorológico -->
    <div class="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-orange-200 dark:border-orange-950/40 space-y-1 shadow-xs">
      <div class="flex items-center justify-between gap-1">
        <div class="flex items-center gap-1.5 font-bold theme-text-main">
          <i data-lucide="cloud-rain" class="w-4 h-4 text-orange-500 shrink-0"></i>
          <span>Previsão Pluviométrica</span>
        </div>
        <span class="badge-info-theme font-bold text-[10px]">ACUMULADO 3D</span>
      </div>
      <div class="font-mono text-[11px] font-bold text-amber-700 dark:text-amber-400">
        Total previsto: ${chuva3d} • Pico térmico: ${picoCalor}
      </div>
      <p class="theme-text-body text-[11px] leading-snug">
        Solo saturado nas encostas. Monitoramento preventivo em Cantagalo, Rocha Leão e vias vicinais.
      </p>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Renderiza o Panorama Sinótico Geral de forma modular, executiva e visualmente clara,
 * eliminando blocos densos ou textos embolados.
 */
function renderSinopseContent(meta) {
  const sinopseEl = document.getElementById('sinopse-content');
  if (!sinopseEl) return;

  // Se já houver sinopse estruturada no JSON, usa diretamente
  if (meta?.sinopse_estruturada) {
    const s = meta.sinopse_estruturada;
    const estacoesHtml = (s.hidrologia?.estacoes || []).map(est => `
      <div class="p-2 rounded theme-tile border theme-border flex flex-col">
        <span class="text-[10px] font-sans theme-text-muted">${cleanBulletinText(est.nome)}</span>
        <span class="font-bold text-red-600 dark:text-red-400 text-xs">${cleanBulletinText(est.valor)}</span>
      </div>
    `).join('');

    const evolucaoHtml = (s.evolucao || []).map(ev => `
      <div class="p-2.5 rounded theme-tile border theme-border space-y-1">
        <div class="flex items-center justify-between">
          <strong class="theme-text-main text-[11px]">${cleanBulletinText(ev.dia)}</strong>
          <span class="badge-neutral-theme text-[9px]">${cleanBulletinText(ev.badge || 'PREVISÃO')}</span>
        </div>
        <p class="theme-text-body leading-snug text-[11px]">${cleanBulletinText(ev.desc)}</p>
      </div>
    `).join('');

    sinopseEl.innerHTML = `
      <div class="space-y-3">
        <!-- 1. Sistemas Sinóticos -->
        <div class="p-3.5 rounded-lg theme-tile border border-amber-900/30 space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-1.5 border-b pb-1.5" style="border-color: rgba(252, 163, 17, 0.25);">
            <div class="flex items-center gap-2 font-bold theme-text-main text-xs">
              <i data-lucide="compass" class="w-4 h-4 text-[#FCA311]"></i>
              <span>${cleanBulletinText(s.sistemas?.titulo || 'Configuração Sinótica & Sistemas Atuantes')}</span>
            </div>
            <span class="badge-info-theme text-[10px]">${cleanBulletinText(s.sistemas?.badge || 'SISTEMA ATUANTE')}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs theme-text-body">
            <div class="flex items-start gap-1.5">
              <span class="text-[#FCA311] font-bold">•</span>
              <span><strong>Dinâmica Atmosférica:</strong> ${cleanBulletinText(s.sistemas?.dinamica || '')}</span>
            </div>
            <div class="flex items-start gap-1.5">
              <span class="text-[#FCA311] font-bold">•</span>
              <span><strong>Transporte de Umidade:</strong> ${cleanBulletinText(s.sistemas?.transporte || '')}</span>
            </div>
          </div>
        </div>

        <!-- 2. Hidrologia e Pluviometria -->
        <div class="p-3.5 rounded-lg theme-tile border-l-4 border-l-red-500 border border-red-200 dark:border-red-900/30 space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-1.5 border-b pb-1.5" style="border-color: rgba(239, 68, 68, 0.2);">
            <div class="flex items-center gap-2 font-bold theme-text-main text-xs">
              <i data-lucide="waves" class="w-4 h-4 text-red-600"></i>
              <span>${cleanBulletinText(s.hidrologia?.titulo || 'Bacia Hidrográfica do Rio Jundiá & Precipitação')}</span>
            </div>
            <span class="badge-danger-theme text-[10px]">${cleanBulletinText(s.hidrologia?.badge || 'ALERTA MÁXIMO')}</span>
          </div>
          <div class="text-xs theme-text-body space-y-2">
            <p class="leading-relaxed">
              <strong>Cenário Hidrológico:</strong> ${cleanBulletinText(s.hidrologia?.descricao || '')}
            </p>
            ${estacoesHtml ? `
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider block mb-1 theme-text-dim">Acumulados Pluviométricos Registrados nas Estações:</span>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  ${estacoesHtml}
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- 3. Condições Marítimas -->
        <div class="p-3.5 rounded-lg theme-tile border border-amber-200 dark:border-amber-900/30 space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-1.5 border-b pb-1.5" style="border-color: rgba(245, 158, 11, 0.2);">
            <div class="flex items-center gap-2 font-bold theme-text-main text-xs">
              <i data-lucide="anchor" class="w-4 h-4 text-blue-600"></i>
              <span>${cleanBulletinText(s.maritimo?.titulo || 'Condições Marítimas na Faixa Costeira (Área Delta)')}</span>
            </div>
            <span class="badge-warning-theme text-[10px]">${cleanBulletinText(s.maritimo?.badge || 'AVISO DA MARINHA')}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs theme-text-body">
            <div class="flex items-start gap-2">
              <i data-lucide="wind" class="w-4 h-4 text-blue-500 shrink-0 mt-0.5"></i>
              <div>
                <strong class="theme-text-main block">Vento & Rajadas:</strong>
                <span>${cleanBulletinText(s.maritimo?.vento || '')}</span>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <i data-lucide="waves" class="w-4 h-4 text-blue-500 shrink-0 mt-0.5"></i>
              <div>
                <strong class="theme-text-main block">Estado do Mar & Ressaca:</strong>
                <span>${cleanBulletinText(s.maritimo?.mar || '')}</span>
              </div>
            </div>
          </div>
          <div class="pt-1.5 border-t border-white/10 text-[11px] font-mono text-[#FCA311] flex items-center gap-1.5">
            <i data-lucide="clock" class="w-3.5 h-3.5 shrink-0"></i>
            <span><strong>Vigência Oficial:</strong> 04/10/2026 às 00:00 UTC até 05/10/2026 às 09:00h BRT (Aviso nº 733/2026 CHM)</span>
          </div>
        </div>

        <!-- 4. Evolução e Tendência -->
        ${evolucaoHtml ? `
          <div class="p-3.5 rounded-lg theme-tile border border-slate-200 dark:border-slate-800 space-y-2">
            <div class="flex items-center justify-between border-b pb-1.5 theme-border">
              <div class="flex items-center gap-2 font-bold theme-text-main text-xs">
                <i data-lucide="calendar-days" class="w-4 h-4 text-emerald-600"></i>
                <span>Evolução & Tendência Operacional para os Próximos Dias</span>
              </div>
              <span class="badge-neutral-theme text-[10px]">DIAS SEGUINTES</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              ${evolucaoHtml}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Fallback Dinâmico Inteligente caso não haja sinopse_estruturada
  const kpis = meta?.kpis || {};
  const dias = meta?.dias_resumo || [];
  const jundiaNivel = kpis.jundia_nivel || '2,49 m';
  const jundiaStatus = kpis.jundia_status || 'ALERTA MÁXIMO';
  const chuva3d = kpis.chuva_3d || '49,2 mm';
  const picoCalor = kpis.pico_calor || '32°C';
  const avisoMar = kpis.aviso_marinha || 'FORÇA 7';

  const d1 = dias[1] || { dia: 'Domingo (04/10)', subtitulo: 'Abertura Gradual', descricao: 'Afastamento da frente fria. Chuva fraca matinal cessando à tarde, com abertura de sol e início de vazante do Rio Jundiá.' };
  const d2 = dias[2] || { dia: 'Segunda-feira (05/10)', subtitulo: 'Calor Pré-Frontal', descricao: 'Sol e rápido aquecimento com ventos de Norte. Máxima atingindo 30° a 32°C com pancadas isoladas de chuva à tarde.' };

  sinopseEl.innerHTML = `
    <div class="space-y-3">
      <!-- 1. Sistemas Sinóticos -->
      <div class="p-3.5 rounded-lg theme-tile border border-amber-900/30 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-1.5 border-b pb-1.5" style="border-color: rgba(252, 163, 17, 0.25);">
          <div class="flex items-center gap-2 font-bold theme-text-main text-xs">
            <i data-lucide="compass" class="w-4 h-4 text-[#FCA311]"></i>
            <span>Configuração Sinótica & Sistemas Atuantes</span>
          </div>
          <span class="badge-info-theme text-[10px]">FRENTE SEMI-ESTACIONÁRIA</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs theme-text-body">
          <div class="flex items-start gap-1.5">
            <span class="text-[#FCA311] font-bold">•</span>
            <span><strong>Dinâmica de Pressão:</strong> Atuação de frente fria semi-estacionária acoplada à alta pressão pós-frontal (1022 hPa) no Atlântico (Carta Sinótica CHM 12Z).</span>
          </div>
          <div class="flex items-start gap-1.5">
            <span class="text-[#FCA311] font-bold">•</span>
            <span><strong>Transporte de Umidade:</strong> Bloqueio com convergência contínua de umidade marítima em direção à costa, acumulando <strong>${chuva3d}</strong> no ciclo e pico de <strong>${picoCalor}</strong>.</span>
          </div>
        </div>
      </div>

      <!-- 2. Hidrologia e Pluviometria -->
      <div class="p-3.5 rounded-lg theme-tile border-l-4 border-l-red-500 border border-red-200 dark:border-red-900/30 space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-1.5 border-b pb-1.5" style="border-color: rgba(239, 68, 68, 0.2);">
          <div class="flex items-center gap-2 font-bold theme-text-main text-xs">
            <i data-lucide="waves" class="w-4 h-4 text-red-600"></i>
            <span>Bacia Hidrográfica do Rio Jundiá & Precipitação Severa</span>
          </div>
          <span class="badge-danger-theme text-[10px]">${jundiaStatus} • COTA ${jundiaNivel}</span>
        </div>
        <div class="text-xs theme-text-body space-y-2">
          <p class="leading-relaxed">
            <strong>Cenário Hidrológico Crítico:</strong> Estação telemétrica municipal (INEA 2241036) acusa cota de <strong>${jundiaNivel}</strong> (transbordo em 2,20 m). Risco contínuo de alagamentos e refluxo pluvial nos bairros <strong>Âncora, Cláudio Ribeiro, Nova Esperança e Ilha</strong>.
          </p>
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider block mb-1 theme-text-dim">Acumulados Pluviométricos Severos Registrados nas PCDs:</span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div class="p-2 rounded theme-tile border theme-border flex flex-col">
                <span class="text-[10px] font-sans theme-text-muted">Palmital</span>
                <span class="font-bold text-red-600 dark:text-red-400 text-xs">134,0 mm</span>
              </div>
              <div class="p-2 rounded theme-tile border theme-border flex flex-col">
                <span class="text-[10px] font-sans theme-text-muted">Rocha Leão / REBIO</span>
                <span class="font-bold text-red-600 dark:text-red-400 text-xs">124,7 mm</span>
              </div>
              <div class="p-2 rounded theme-tile border theme-border flex flex-col">
                <span class="text-[10px] font-sans theme-text-muted">PCD Jundiá</span>
                <span class="font-bold text-red-600 dark:text-red-400 text-xs">108,2 mm</span>
              </div>
              <div class="p-2 rounded theme-tile border theme-border flex flex-col">
                <span class="text-[10px] font-sans theme-text-muted">Defesa Civil</span>
                <span class="font-bold text-amber-600 dark:text-amber-400 text-xs">70,4 mm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Condições Marítimas -->
      <div class="p-3.5 rounded-lg theme-tile border border-amber-200 dark:border-amber-900/30 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-1.5 border-b pb-1.5" style="border-color: rgba(245, 158, 11, 0.2);">
          <div class="flex items-center gap-2 font-bold theme-text-main text-xs">
            <i data-lucide="anchor" class="w-4 h-4 text-blue-600"></i>
            <span>Condições Marítimas na Faixa Costeira (Área Delta)</span>
          </div>
          <span class="badge-warning-theme text-[10px]">AVISO Nº 733/2026 (CHM)</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs theme-text-body">
          <div class="flex items-start gap-2">
            <i data-lucide="wind" class="w-4 h-4 text-blue-500 shrink-0 mt-0.5"></i>
            <div>
              <strong class="theme-text-main block">Vento Forte:</strong>
              <span>Ventos de E/NE Força 7 (${avisoMar}) com rajadas de até <strong>53 km/h</strong> na orla.</span>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <i data-lucide="waves" class="w-4 h-4 text-blue-500 shrink-0 mt-0.5"></i>
            <div>
              <strong class="theme-text-main block">Mar Agitado & Ressaca:</strong>
              <span>Ondas de <strong>2,0 a 2,5 m</strong> na Área Delta, dificultando o escoamento pluvial e gerando risco na praia.</span>
            </div>
          </div>
        </div>
        <div class="pt-1.5 border-t border-white/10 text-[11px] font-mono text-[#FCA311] flex items-center gap-1.5">
          <i data-lucide="clock" class="w-3.5 h-3.5 shrink-0"></i>
          <span><strong>Vigência Oficial:</strong> 04/10/2026 às 00:00 UTC até 05/10/2026 às 09:00h BRT (Aviso nº 733/2026 CHM)</span>
        </div>
      </div>

      <!-- 4. Evolução e Tendência -->
      <div class="p-3.5 rounded-lg theme-tile border border-slate-200 dark:border-slate-800 space-y-2">
        <div class="flex items-center justify-between border-b pb-1.5 theme-border">
          <div class="flex items-center gap-2 font-bold theme-text-main text-xs">
            <i data-lucide="calendar-days" class="w-4 h-4 text-emerald-600"></i>
            <span>Evolução & Tendência Operacional para os Próximos Dias</span>
          </div>
          <span class="badge-neutral-theme text-[10px]">DIAS SEGUINTES</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div class="p-2.5 rounded theme-tile border theme-border space-y-1">
            <div class="flex items-center justify-between">
              <strong class="theme-text-main text-[11px]">${cleanBulletinText(d1.dia)}</strong>
              <span class="badge-warning-theme text-[9px]">${cleanBulletinText(d1.badge || 'ATENÇÃO')}</span>
            </div>
            <p class="theme-text-body leading-snug text-[11px]">${cleanBulletinText(d1.descricao || '')}</p>
          </div>
          <div class="p-2.5 rounded theme-tile border theme-border space-y-1">
            <div class="flex items-center justify-between">
              <strong class="theme-text-main text-[11px]">${cleanBulletinText(d2.dia)}</strong>
              <span class="badge-info-theme text-[9px]">${cleanBulletinText(d2.badge || 'OBS')}</span>
            </div>
            <p class="theme-text-body leading-snug text-[11px]">${cleanBulletinText(d2.descricao || '')}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}
