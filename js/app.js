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

  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isCurrentLight = document.documentElement.classList.contains('theme-light') || !document.documentElement.classList.contains('theme-dark');
      const newTheme = isCurrentLight ? 'dark' : 'light';
      applyTheme(newTheme);
      updateBulletinChart();
    });
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  const toggleIcon = document.getElementById('theme-toggle-icon');
  const toggleText = document.getElementById('theme-toggle-text');

  if (theme === 'dark') {
    root.classList.remove('theme-light');
    root.classList.add('theme-dark');
    localStorage.setItem('meteo_theme', 'dark');
    if (toggleIcon) toggleIcon.setAttribute('data-lucide', 'sun');
    if (toggleText) toggleText.textContent = 'Modo Claro';
  } else {
    root.classList.remove('theme-dark');
    root.classList.add('theme-light');
    localStorage.setItem('meteo_theme', 'light');
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
            <div class="theme-tile p-2.5 flex items-center gap-2">
              <i data-lucide="${p.icon || 'circle'}" class="w-3.5 h-3.5 text-[#1E88E5] shrink-0"></i>
              <div class="min-w-0">
                <span class="text-[9px] uppercase font-bold theme-text-dim block">${p.label || k}</span>
                <span class="text-xs font-bold theme-text-main truncate block font-mono">${cleanBulletinText(p.val || '—')}</span>
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
    const planconBody = document.getElementById('plancon-table-body');
    if (planconBody) {
      planconBody.innerHTML = meta.impactos_bairros.map(item => {
        function getBadge(val) {
          const v = String(val).toUpperCase();
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

        return `
          <tr>
            <td class="font-semibold theme-text-main">
              ${cleanBulletinText(item.setor)}
            </td>
            <td class="text-center">
              ${getBadge(item.risco_sab)}
            </td>
            <td class="text-center">
              ${getBadge(item.risco_dom)}
            </td>
            <td class="text-center">
              ${getBadge(item.risco_seg)}
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
