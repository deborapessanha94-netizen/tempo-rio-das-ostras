/**
 * Gerador de Imagens para Redes Sociais (Post Feed & Stories do Instagram)
 * Sincronizado em tempo real com os valores exatos do site no momento da visualização/download.
 * Canal Oficial: @tempoemriodasostras
 *
 * v186: Remoção total de vento/rajadas das imagens de exportação (foco exclusivo em precipitação),
 * sincronização direta com as 10 estações da rede municipal e experiência móvel otimizada.
 */

let socialState = {
  format: 'post', // 'post' (1080x1350) ou 'story' (1080x1920)
  horizon: '24h',
  horizonHours: 24.0,
  filterMode: 'all', // 'all' (todas as 10) ou 'active' (apenas ativas)
  selectedStationCodes: new Set(),
  stationFilterText: '',
  stationsData: [],
  chipsDrawerOpen: false
};

function round1(val, fallback = 0.0) {
  if (val === null || val === undefined || val === '' || isNaN(Number(val))) return fallback;
  return Math.round(Number(val) * 10) / 10;
}

function formatDec1(val) {
  const num = round1(val, 0.0);
  return num.toFixed(1).replace('.', ',');
}

function isSocialModalOpen() {
  if (typeof document === 'undefined') return false;
  const modal = document.getElementById('modal-social-chuva');
  return Boolean(modal && !modal.classList.contains('hidden'));
}

/**
 * Retorna o vento e rajada da estação (mantido para compatibilidade e tabela comparativa do site)
 */
export function getStationWindAndGust(st, allStations) {
  const stationsList = allStations || socialState.stationsData || [];
  const v = round1(st?.vento_atual, 0.0);
  const r = round1(st?.rajada_atual ?? v, v);
  return {
    vento: v,
    rajada: Math.max(r, v),
    ventoStr: formatDec1(v),
    rajadaStr: formatDec1(Math.max(r, v))
  };
}

/**
 * Atualiza os dados das estações no estado social
 */
export function setSocialStationsData(data) {
  if (!data) return;
  if (Array.isArray(data)) {
    socialState.stationsData = data;
  } else if (data.estacoes && Array.isArray(data.estacoes)) {
    socialState.stationsData = data.estacoes;
  }

  if (socialState.selectedStationCodes.size === 0 && socialState.stationsData.length > 0) {
    socialState.stationsData.forEach(s => {
      if (s.codigo) socialState.selectedStationCodes.add(s.codigo);
    });
  }

  if (isSocialModalOpen()) {
    renderSocialStationChips();
    renderSocialCanvas();
  }
}

/**
 * Consulta o estado em tempo real das estações
 */
async function syncFromLiveSiteNow({ full = false } = {}) {
  // 1. Puxa imediatamente o estado ao vivo da página
  if (typeof window !== 'undefined' && typeof window.getLiveStationsForSocial === 'function') {
    const liveData = window.getLiveStationsForSocial();
    if (liveData) {
      if (Array.isArray(liveData) && liveData.length > 0) {
        socialState.stationsData = liveData;
      } else if (Array.isArray(liveData.estacoes) && liveData.estacoes.length > 0) {
        socialState.stationsData = liveData.estacoes;
      }
    }
  }

  // 2. Dispara pulso de telemetria se disponível
  if (typeof window !== 'undefined' && typeof window.syncLiveStationsTelemetry === 'function') {
    try {
      await window.syncLiveStationsTelemetry(true, !full);
      if (typeof window.getLiveStationsForSocial === 'function') {
        const refreshed = window.getLiveStationsForSocial();
        if (refreshed) {
          if (Array.isArray(refreshed) && refreshed.length > 0) {
            socialState.stationsData = refreshed;
          } else if (Array.isArray(refreshed.estacoes) && refreshed.estacoes.length > 0) {
            socialState.stationsData = refreshed.estacoes;
          }
        }
      }
      return;
    } catch (e) {
      console.warn('Aviso ao sincronizar telemetria para card social:', e);
    }
  }

  // 3. Fallback de rede
  if (!socialState.stationsData || socialState.stationsData.length === 0) {
    try {
      const res = await fetch(`./data/acumulados_estacoes.json?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) socialState.stationsData = data;
        else if (Array.isArray(data?.estacoes)) socialState.stationsData = data.estacoes;
      }
    } catch (e) {}
  }
}

/**
 * Parser inteligente de horizonte de tempo
 */
function parseUserQuery(query) {
  const clean = String(query || '').trim().toLowerCase();
  if (!clean || clean === '24h' || clean === '24') {
    return { isHorizon: true, hours: 24.0, horizonLabel: '24H', stationFilter: '' };
  }
  if (clean === 'hoje' || clean === 'diario' || clean === 'diário') {
    return { isHorizon: true, hours: 24.0, horizonLabel: 'HOJE', stationFilter: '' };
  }

  const dayMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:dias?|d\b)/i);
  if (dayMatch) {
    const dVal = parseFloat(dayMatch[1].replace(',', '.'));
    const hVal = Math.round(dVal * 24 * 10) / 10;
    const residual = clean.replace(dayMatch[0], '').trim();
    const label = Number.isInteger(hVal) ? `${hVal}H` : `${hVal.toFixed(1)}H`;
    return { isHorizon: true, hours: hVal, horizonLabel: label, stationFilter: residual };
  }

  const hourMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:h(?:oras?|rs?)?\b)?/i);
  if (hourMatch && hourMatch[1]) {
    const hVal = parseFloat(hourMatch[1].replace(',', '.'));
    const residual = clean.replace(hourMatch[0], '').trim();
    const label = Number.isInteger(hVal) ? `${hVal}H` : `${hVal.toFixed(1)}H`;
    return { isHorizon: true, hours: Math.max(0.1, hVal), horizonLabel: label, stationFilter: residual };
  }

  return { isHorizon: false, hours: socialState.horizonHours || 24.0, horizonLabel: (socialState.horizon || '24h').toUpperCase(), stationFilter: clean };
}

/**
 * Retorna o volume exato de chuva de uma estação para o horizonte ativo,
 * garantindo alinhamento perfeito com a tabela comparativa do site.
 */
export function getStationRainForSocial(station, horizon, hours) {
  if (!station) return 0.0;
  if (station.categoria === 'inea') return null; // Estação fluviométrica do Rio Jundiá exibe nível em metros

  const h = hours || 24.0;
  const hRound = Math.round(h);
  const isDaily = horizon === 'hoje' || horizon === 'diario' || horizon === 'diário';

  // 1. Se estiver consultando horizonte diário ou 24h
  if (isDaily || hRound === 24) {
    const vHoje = Number(station.chuva_hoje !== undefined && station.chuva_hoje !== null ? station.chuva_hoje : 0.0);
    const v24h = Number(station.chuva_24h !== undefined && station.chuva_24h !== null ? station.chuva_24h : 0.0);
    return Math.max(vHoje, v24h);
  }

  // 2. Horizontes canônicos do site
  if (hRound === 1 && station.chuva_1h != null) return Number(station.chuva_1h);
  if (hRound === 4 && station.chuva_4h != null) return Number(station.chuva_4h);
  if (hRound === 6 && station.chuva_6h != null) return Number(station.chuva_6h);
  if (hRound === 12 && station.chuva_12h != null) return Number(station.chuva_12h);
  if (hRound === 36 && station.chuva_36h != null) return Number(station.chuva_36h);
  if (hRound === 48 && station.chuva_48h != null) return Number(station.chuva_48h);
  if (hRound === 96 && station.chuva_96h != null) return Number(station.chuva_96h);

  // 3. Consulta ao getter oficial do site se disponível
  if (typeof window !== 'undefined' && typeof window.getStationRainForMetric === 'function') {
    const fromSite = window.getStationRainForMetric(station, `${hRound}h`);
    if (fromSite !== undefined && fromSite !== null && !isNaN(Number(fromSite)) && Number(fromSite) > 0) {
      return Number(fromSite);
    }
  }

  // 4. Interpolação suave
  return calculateStationRain(station, h);
}

/**
 * Calcula a curva de chuva interpolada para qualquer quantidade de horas
 */
export function calculateStationRain(station, hours) {
  if (!station || hours <= 0) return 0.0;
  if (station.categoria === 'inea') return 0.0;

  const c1 = Number(station.chuva_1h !== undefined && station.chuva_1h !== null ? station.chuva_1h : 0.0);
  const c4 = Number(station.chuva_4h !== undefined && station.chuva_4h !== null ? station.chuva_4h : c1);
  const c6 = Number(station.chuva_6h !== undefined && station.chuva_6h !== null ? station.chuva_6h : (c4 + (Number(station.chuva_12h || c4) - c4) * 0.33));
  const c12 = Number(station.chuva_12h !== undefined && station.chuva_12h !== null ? station.chuva_12h : c6);
  const cHoje = Number(station.chuva_hoje !== undefined && station.chuva_hoje !== null ? station.chuva_hoje : 0.0);
  const c24 = Math.max(cHoje, Number(station.chuva_24h !== undefined && station.chuva_24h !== null ? station.chuva_24h : c12));
  const c36 = Number(station.chuva_36h !== undefined && station.chuva_36h !== null ? station.chuva_36h : ((c24 + Number(station.chuva_48h || c24)) / 2));
  const c48 = Number(station.chuva_48h !== undefined && station.chuva_48h !== null ? station.chuva_48h : c36);
  const c96 = Number(station.chuva_96h !== undefined && station.chuva_96h !== null ? station.chuva_96h : c48);

  const points = [
    { h: 0.0, v: 0.0 },
    { h: 1.0, v: c1 },
    { h: 4.0, v: c4 },
    { h: 6.0, v: c6 },
    { h: 12.0, v: c12 },
    { h: 24.0, v: c24 },
    { h: 36.0, v: c36 },
    { h: 48.0, v: c48 },
    { h: 96.0, v: c96 }
  ];

  if (hours >= 96.0) return points[points.length - 1].v;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (hours >= p1.h && hours <= p2.h) {
      const span = p2.h - p1.h;
      if (span === 0) return p1.v;
      const t = (hours - p1.h) / span;
      return p1.v + t * (p2.v - p1.v);
    }
  }

  return points[points.length - 1].v;
}

/**
 * Abre o modal de exportação de imagem formatada para o Instagram
 */
export async function openSocialModalChuva(initialHorizon) {
  const modal = document.getElementById('modal-social-chuva');
  if (!modal) return;

  // Se nenhum horizonte foi passado explicitamente, adota a métrica atualmente visualizada no site
  const siteMetric = (typeof window !== 'undefined' && window.state?.stationsSortMetric)
    ? window.state.stationsSortMetric
    : '24h';
  const effectiveHorizon = initialHorizon || siteMetric || '24h';

  const parsed = parseUserQuery(effectiveHorizon);
  socialState.horizon = parsed.horizonLabel.toLowerCase();
  socialState.horizonHours = parsed.hours;
  socialState.stationFilterText = '';

  // Puxa imediatamente o snapshot das 10 estações carregadas na tela
  if (typeof window !== 'undefined' && typeof window.getLiveStationsForSocial === 'function') {
    const curLive = window.getLiveStationsForSocial();
    if (curLive) {
      if (Array.isArray(curLive) && curLive.length > 0) socialState.stationsData = curLive;
      else if (Array.isArray(curLive.estacoes) && curLive.estacoes.length > 0) socialState.stationsData = curLive.estacoes;
    }
  }

  if (!socialState.stationsData || socialState.stationsData.length === 0) {
    if (typeof window !== 'undefined' && window.state?.acumuladosDataset?.estacoes) {
      socialState.stationsData = window.state.acumuladosDataset.estacoes;
    }
  }

  // Se ainda estiver vazia, faz fallback rápido
  if (!socialState.stationsData || socialState.stationsData.length === 0) {
    await syncFromLiveSiteNow({ full: false });
  }

  // Seleciona todas as 10 estações por padrão se nenhuma estiver marcada
  if (socialState.selectedStationCodes.size === 0 && socialState.stationsData.length > 0) {
    socialState.stationsData.forEach(s => {
      if (s.codigo) socialState.selectedStationCodes.add(s.codigo);
    });
  }

  updateFormatButtons(socialState.format);
  updateHorizonButtons(socialState.horizon);
  updateActivePill(socialState.horizon);
  updateStationsFilterButtons();
  renderSocialStationChips();

  modal.classList.remove('hidden');
  modal.classList.add('flex');

  // Renderiza imediatamente o canvas para a pré-visualização carregar sem nenhum atraso
  renderSocialCanvas();

  // Executa sincronização em background sem travar a interface
  syncFromLiveSiteNow({ full: false }).then(() => {
    if (isSocialModalOpen()) {
      renderSocialStationChips();
      renderSocialCanvas();
    }
  }).catch(() => {});
}

export function closeSocialModalChuva() {
  const modal = document.getElementById('modal-social-chuva');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

export function setSocialFormat(format) {
  if (format !== 'post' && format !== 'story') return;
  socialState.format = format;
  updateFormatButtons(format);
  renderSocialCanvas();
}

export function setSocialHorizon(horizon) {
  const parsed = parseUserQuery(horizon);
  socialState.horizon = parsed.horizonLabel.toLowerCase();
  socialState.horizonHours = parsed.hours;
  socialState.stationFilterText = '';

  const searchInput = document.getElementById('social-horizon-search');
  if (searchInput) searchInput.value = socialState.horizon;

  updateHorizonButtons(socialState.horizon);
  updateActivePill(socialState.horizon);
  renderSocialCanvas();
}

export function handleSocialSearch(query) {
  const parsed = parseUserQuery(query);

  if (parsed.isHorizon) {
    socialState.horizonHours = parsed.hours;
    socialState.horizon = parsed.horizonLabel.toLowerCase();
    socialState.stationFilterText = parsed.stationFilter;
    updateHorizonButtons(socialState.horizon);
    updateActivePill(socialState.horizon);
  } else {
    socialState.stationFilterText = parsed.stationFilter;
  }

  renderSocialCanvas();
}

export function setSocialStationsFilter(mode) {
  socialState.filterMode = mode;
  socialState.selectedStationCodes.clear();

  if (mode === 'all') {
    socialState.stationsData.forEach(s => {
      if (s.codigo) socialState.selectedStationCodes.add(s.codigo);
    });
  } else if (mode === 'active') {
    socialState.stationsData.forEach(s => {
      if (s.codigo && s.online !== false) {
        socialState.selectedStationCodes.add(s.codigo);
      }
    });
  }

  updateStationsFilterButtons();
  renderSocialStationChips();
  renderSocialCanvas();
}

export function toggleStationSelection(code) {
  if (socialState.selectedStationCodes.has(code)) {
    socialState.selectedStationCodes.delete(code);
  } else {
    socialState.selectedStationCodes.add(code);
  }

  const total = socialState.stationsData.length;
  const activeCount = socialState.stationsData.filter(s => s.online !== false).length;
  if (socialState.selectedStationCodes.size === total) {
    socialState.filterMode = 'all';
  } else if (socialState.selectedStationCodes.size === activeCount && Array.from(socialState.selectedStationCodes).every(c => {
    const st = socialState.stationsData.find(s => s.codigo === c);
    return st && st.online !== false;
  })) {
    socialState.filterMode = 'active';
  } else {
    socialState.filterMode = 'custom';
  }

  updateStationsFilterButtons();
  renderSocialStationChips();
  renderSocialCanvas();
}

export function toggleSocialChipsDrawer() {
  socialState.chipsDrawerOpen = !socialState.chipsDrawerOpen;
  const drawer = document.getElementById('social-chips-drawer');
  const chevron = document.getElementById('social-chips-chevron');
  if (drawer) {
    if (socialState.chipsDrawerOpen) {
      drawer.classList.remove('hidden');
    } else {
      drawer.classList.add('hidden');
    }
  }
  if (chevron) {
    chevron.style.transform = socialState.chipsDrawerOpen ? 'rotate(180deg)' : 'rotate(0deg)';
  }
}

export async function refreshSocialStationsData() {
  const icon = document.getElementById('social-refresh-icon');
  if (icon) icon.classList.add('animate-spin');
  try {
    await syncFromLiveSiteNow({ full: true });
    renderSocialStationChips();
    renderSocialCanvas();
  } finally {
    if (icon) setTimeout(() => icon.classList.remove('animate-spin'), 400);
  }
}

export function renderSocialStationChips() {
  const container = document.getElementById('social-station-chips');
  const countEl = document.getElementById('social-selected-count');
  if (!container) return;

  const total = socialState.stationsData.length;
  const selectedCount = socialState.selectedStationCodes.size;
  if (countEl) {
    countEl.textContent = `${selectedCount} de ${total} selecionadas`;
  }

  container.innerHTML = socialState.stationsData.map(st => {
    const isSelected = socialState.selectedStationCodes.has(st.codigo);
    const shortName = st.nome_curto || (st.nome ? st.nome.replace(/\s*-\s*[A-Z0-9]+$/i, '').trim() : st.codigo);
    const isOnline = st.online !== false;

    if (isSelected) {
      return `
        <button type="button" onclick="toggleStationSelection('${st.codigo}')" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7] flex items-center gap-1 cursor-pointer transition shadow-2xs hover:brightness-125">
          <span class="w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}"></span>
          <span>${shortName}</span>
          <span class="text-[10px] opacity-75">✓</span>
        </button>
      `;
    } else {
      return `
        <button type="button" onclick="toggleStationSelection('${st.codigo}')" class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-400 border border-slate-700 line-through flex items-center gap-1 cursor-pointer transition opacity-70 hover:opacity-100">
          <span class="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
          <span>${shortName}</span>
        </button>
      `;
    }
  }).join('');
}

function updateStationsFilterButtons() {
  const btnAll = document.getElementById('social-btn-filter-all');
  const btnActive = document.getElementById('social-btn-filter-active');

  const activeCls = 'px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-md border border-orange-400/50 cursor-pointer flex items-center gap-1';
  const inactiveCls = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700 cursor-pointer flex items-center gap-1';

  if (btnAll && btnActive) {
    if (socialState.filterMode === 'all') {
      btnAll.className = activeCls;
      btnActive.className = inactiveCls;
    } else if (socialState.filterMode === 'active') {
      btnActive.className = activeCls;
      btnAll.className = inactiveCls;
    } else {
      btnAll.className = inactiveCls;
      btnActive.className = inactiveCls;
    }
  }
}

function updateFormatButtons(activeFmt) {
  const btnPost = document.getElementById('social-btn-fmt-post');
  const btnStory = document.getElementById('social-btn-fmt-story');
  const dlMainBtn = document.getElementById('social-download-main-btn');

  const activeCls = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#0284c7] to-[#00c2ff] text-white shadow-md border border-cyan-400/40 cursor-pointer flex items-center justify-center gap-1.5 transition';
  const inactiveCls = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700 cursor-pointer flex items-center justify-center gap-1.5 transition';

  if (btnPost && btnStory) {
    if (activeFmt === 'post') {
      btnPost.className = activeCls;
      btnStory.className = inactiveCls;
    } else {
      btnStory.className = activeCls;
      btnPost.className = inactiveCls;
    }
  }

  if (dlMainBtn) {
    if (activeFmt === 'story') {
      dlMainBtn.innerHTML = `
        <i data-lucide="download" class="w-4 h-4 text-white"></i>
        <span>Baixar Stories (1080x1920)</span>
      `;
    } else {
      dlMainBtn.innerHTML = `
        <i data-lucide="download" class="w-4 h-4 text-white"></i>
        <span>Baixar Post Feed (1080x1350)</span>
      `;
    }
    if (typeof window !== 'undefined' && window.lucide) {
      window.lucide.createIcons();
    }
  }
}

function updateHorizonButtons(activeHz) {
  const horizons = ['12h', '24h', '36h', '48h', '96h'];
  const activeNormalized = String(activeHz || '').toLowerCase().replace(/[^0-9h]/g, '');

  horizons.forEach(hz => {
    const btn = document.getElementById(`social-hz-btn-${hz}`);
    if (btn) {
      if (hz === activeNormalized) {
        btn.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#0284c7] text-white border border-[#38bdf8] shadow-sm cursor-pointer transition';
      } else {
        btn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700 cursor-pointer transition';
      }
    }
  });

  const btnHoje = document.getElementById('social-hz-btn-hoje');
  if (btnHoje) {
    if (activeHz === 'hoje' || activeHz === 'diario') {
      btnHoje.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#0284c7] text-white border border-[#38bdf8] shadow-sm cursor-pointer transition';
    } else {
      btnHoje.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700 cursor-pointer transition';
    }
  }
}

function updateActivePill(activeHz) {
  const pill = document.getElementById('social-active-horizon-pill');
  if (pill) {
    const label = String(activeHz || '24h').toUpperCase();
    pill.textContent = `Horizonte: ${label.includes('H') ? label : label + 'H'}`;
  }
}

export function toggleOnlyActive(isChecked) {
  setSocialStationsFilter(isChecked ? 'active' : 'all');
}

/**
 * Renderiza o canvas de alta resolução oficial para o Instagram
 * SEM vento e sem rajadas (foco exclusivo em precipitação pluvial e nível do rio).
 */
export function renderSocialCanvas() {
  const canvas = document.getElementById('social-export-canvas') || document.createElement('canvas');
  canvas.id = 'social-export-canvas';
  const ctx = canvas.getContext('2d');

  const isStory = socialState.format === 'story';
  const width = 1080;
  const height = isStory ? 1920 : 1350;

  canvas.width = width;
  canvas.height = height;

  // 1. Fundo Gradiente Oceânico Noturno Profundo
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#020b18');
  bgGrad.addColorStop(0.45, '#041328');
  bgGrad.addColorStop(1, '#071e3b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Linhas de ondas sutis no fundo
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 194, 255, 0.05)';
  ctx.lineWidth = 2;
  const numWaves = isStory ? 7 : 5;
  for (let i = 0; i < numWaves; i++) {
    ctx.beginPath();
    const yOffset = 240 + i * (isStory ? 230 : 210);
    ctx.moveTo(0, yOffset);
    ctx.bezierCurveTo(width * 0.3, yOffset - 60, width * 0.7, yOffset + 60, width, yOffset);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Filtra e Ordena as Estações Selecionadas
  let stations = [...socialState.stationsData];

  if (socialState.selectedStationCodes && socialState.selectedStationCodes.size > 0) {
    stations = stations.filter(s => socialState.selectedStationCodes.has(s.codigo));
  } else if (socialState.filterMode === 'active') {
    stations = stations.filter(s => s.online !== false);
  }

  if (socialState.stationFilterText) {
    const q = socialState.stationFilterText.toLowerCase();
    stations = stations.filter(s =>
      (s.nome && s.nome.toLowerCase().includes(q)) ||
      (s.bairro && s.bairro.toLowerCase().includes(q)) ||
      (s.codigo && s.codigo.toLowerCase().includes(q))
    );
  }

  const currentHours = socialState.horizonHours || 24.0;
  const currentHz = socialState.horizon || '24h';

  const rainStations = stations.filter(s => s.categoria !== 'inea');
  const jundiaSt = stations.find(s => s.categoria === 'inea');

  rainStations.forEach(st => {
    st._activeRainVal = getStationRainForSocial(st, currentHz, currentHours);
  });

  // Ordena rigorosamente da maior precipitação para a menor
  rainStations.sort((a, b) => (b._activeRainVal || 0) - (a._activeRainVal || 0));

  let displayStations = [];
  if (jundiaSt && (!socialState.stationFilterText || socialState.stationFilterText.includes('jundi') || socialState.stationFilterText.includes('inea'))) {
    displayStations = [...rainStations, jundiaSt];
  } else {
    displayStations = [...rainStations];
  }

  // 3. Cabeçalho Oficial do Card
  const topPad = isStory ? 115 : 65;
  const leftPad = 70;
  const rightPad = width - 70;

  // Barra de acento ciano à esquerda do título
  ctx.fillStyle = '#00d2ff';
  ctx.beginPath();
  ctx.roundRect(leftPad, topPad, 10, isStory ? 92 : 78, 5);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = isStory ? 'bold 36px sans-serif' : 'bold 30px sans-serif';
  ctx.fillText('ACUMULADOS DE', leftPad + 24, topPad + (isStory ? 34 : 28));

  const titleGrad = ctx.createLinearGradient(leftPad + 24, topPad + 40, leftPad + 300, topPad + 95);
  titleGrad.addColorStop(0, '#5eead4');
  titleGrad.addColorStop(1, '#00c2ff');
  ctx.fillStyle = titleGrad;
  ctx.font = isStory ? '900 68px sans-serif' : '900 56px sans-serif';
  ctx.fillText('CHUVA', leftPad + 24, topPad + (isStory ? 94 : 78));

  // Metadados do topo à direita
  const now = new Date();
  const dataFormatada = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const horaFormatada = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const horizonLabel = (socialState.horizon || '24h').toUpperCase().replace('H', '') + ' HORAS';

  const subY = topPad + (isStory ? 148 : 122);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 23px sans-serif';
  const subText = socialState.filterMode === 'active' ? 'Estações Ativas da Rede Municipal' : 'Rede Municipal & Entorno • Telemetria Oficial';
  ctx.fillText(subText, leftPad, subY);

  ctx.textAlign = 'right';
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`${dataFormatada} • ${horaFormatada} • ${horizonLabel}`, rightPad, subY);
  ctx.textAlign = 'left';

  // Linha divisória do cabeçalho
  ctx.strokeStyle = 'rgba(0, 194, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftPad, subY + 18);
  ctx.lineTo(rightPad, subY + 18);
  ctx.stroke();

  // 4. Lista das 10 Estações da Rede (Design de 2 Colunas sem Vento)
  const listStartY = subY + 32;
  const footerY = height - (isStory ? 85 : 60);
  const availableListH = footerY - listStartY - 20;
  const numStations = Math.max(displayStations.length, 1);

  const rowHeight = isStory
    ? Math.min(148, Math.floor(availableListH / numStations))
    : Math.min(108, Math.floor(availableListH / numStations));

  displayStations.forEach((st, idx) => {
    const rowY = listStartY + idx * rowHeight;
    const isJundia = st.categoria === 'inea';
    const rainVal = st._activeRainVal !== undefined ? st._activeRainVal : getStationRainForSocial(st, currentHz, currentHours);
    const rainStr = `${(rainVal || 0).toFixed(1).replace('.', ',')} mm`;

    let displayName = st.nome_curto || st.nome || '';
    displayName = displayName
      .replace(/defesa civil municipal\s*(\(tartaruga\))?/gi, 'Praia da Tartaruga')
      .replace(/defesa civil/gi, '')
      .replace(/\s*-\s*[A-Z0-9]+$/i, '')
      .trim();

    let codeStr = st.codigo || '';
    if (st.categoria === 'cemaden') {
      codeStr = `PCD ${st.codigo.replace(/[^0-9]/g, '')}`;
    } else if (st.categoria === 'inea') {
      codeStr = 'INEA 2241036';
    }

    const bairroStr = st.bairro ? st.bairro.split('/')[0].trim() : '';

    // =========================================================================
    // COLUNA ESQUERDA: Nome da Estação, Badge do Código e Bairro
    // =========================================================================
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    let nameFontPx = isStory ? 28 : 23;
    ctx.font = `bold ${nameFontPx}px sans-serif`;

    const maxNameW = width * 0.58;
    while (nameFontPx > 18 && ctx.measureText(displayName).width > maxNameW) {
      nameFontPx -= 1;
      ctx.font = `bold ${nameFontPx}px sans-serif`;
    }
    ctx.fillText(displayName, leftPad, rowY + (isStory ? 40 : 30));

    // Badge do Código da Estação
    ctx.font = isStory ? 'bold 15px monospace' : 'bold 13px monospace';
    const badgeW = ctx.measureText(codeStr).width + 18;
    const badgeH = isStory ? 26 : 22;
    const badgeY = rowY + (isStory ? 52 : 38);

    ctx.fillStyle = 'rgba(2, 132, 199, 0.22)';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(leftPad, badgeY, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(codeStr, leftPad + 9, badgeY + (isStory ? 18 : 15));

    // Nome do bairro ao lado do badge
    if (bairroStr) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = isStory ? '500 16px sans-serif' : '500 14px sans-serif';
      ctx.fillText(bairroStr, leftPad + badgeW + 12, badgeY + (isStory ? 18 : 15));
    }

    // =========================================================================
    // COLUNA DIREITA: Volume de Chuva / Nível do Rio Jundiá (Sem Vento/Rajadas)
    // =========================================================================
    ctx.textAlign = 'right';

    if (isJundia) {
      // Estação Fluviométrica do Rio Jundiá
      const riverLevel = st.nivel_rio ? String(st.nivel_rio).replace('.', ',') : '1,40 m';

      ctx.fillStyle = '#ffffff';
      ctx.font = isStory ? '900 42px monospace' : '900 34px monospace';
      ctx.fillText(riverLevel, rightPad, rowY + (isStory ? 44 : 32));

      // Subtítulo do status da calha
      const statusTxt = st.status_rio ? `NÍVEL DO RIO • ${st.status_rio}` : 'NÍVEL FLUVIAL • VIGILÂNCIA';
      ctx.fillStyle = '#38bdf8';
      ctx.font = isStory ? 'bold 16px sans-serif' : 'bold 13px sans-serif';
      ctx.fillText(statusTxt, rightPad, rowY + (isStory ? 70 : 54));
    } else {
      // Estações Pluviométricas: Volume em mm em destaque
      const rainValNum = rainVal || 0;
      const isZero = rainValNum <= 0.05;

      // Cor de destaque: ciano elétrico para chuva > 0, azul claro suave para 0,0 mm
      ctx.fillStyle = isZero ? '#94a3b8' : '#00d2ff';
      ctx.font = isStory ? '900 46px monospace' : '900 36px monospace';
      ctx.fillText(rainStr, rightPad, rowY + (isStory ? 44 : 32));

      // Subtítulo descritivo alinhado à direita
      ctx.fillStyle = isZero ? '#64748b' : '#38bdf8';
      ctx.font = isStory ? '600 15px sans-serif' : '600 13px sans-serif';
      ctx.fillText(`Acumulado ${horizonLabel}`, rightPad, rowY + (isStory ? 68 : 52));
    }

    ctx.textAlign = 'left';

    // Linha divisória sutil entre linhas
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftPad, rowY + rowHeight - 6);
    ctx.lineTo(rightPad, rowY + rowHeight - 6);
    ctx.stroke();
  });

  // 5. Rodapé Oficial
  ctx.fillStyle = '#00d2ff';
  ctx.beginPath();
  ctx.roundRect(leftPad, footerY - (isStory ? 40 : 30), width - 140, 2, 1);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = isStory ? 'bold 26px sans-serif' : 'bold 22px sans-serif';
  ctx.fillText('@tempoemriodasostras', leftPad, footerY);

  ctx.fillStyle = '#94a3b8';
  ctx.font = isStory ? '400 19px sans-serif' : '400 16px sans-serif';
  ctx.fillText('Fontes: Estações em tempo real dos bairros • Rio das Ostras - RJ', leftPad, footerY + (isStory ? 26 : 22));

  // Atualiza imagem de pré-visualização no modal
  const previewImg = document.getElementById('social-preview-image');
  if (previewImg) {
    previewImg.src = canvas.toDataURL('image/png');
  }
}

/**
 * Baixa diretamente o card no formato atualmente selecionado
 */
export async function downloadSocialCurrentFormat() {
  await downloadSocialFormat(socialState.format || 'post');
}

/**
 * Faz download do card no formato especificado ('post' ou 'story')
 */
export async function downloadSocialFormat(format) {
  if (format && (format === 'post' || format === 'story')) {
    socialState.format = format;
    updateFormatButtons(format);
  }

  await syncFromLiveSiteNow({ full: false });
  renderSocialCanvas();
  await new Promise(resolve => setTimeout(resolve, 50));

  const canvas = document.getElementById('social-export-canvas');
  if (!canvas) return;

  const fmtName = socialState.format === 'story' ? 'stories' : 'post';
  const horizonName = socialState.horizon || '24h';
  const fileName = `acumulados_chuva_${horizonName}_${fmtName}_riodasostras.png`;

  const link = document.createElement('a');
  link.download = fileName;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadSocialCard() {
  await downloadSocialCurrentFormat();
}

// Exportações globais para interação com o HTML
if (typeof window !== 'undefined') {
  window.openSocialModalChuva = openSocialModalChuva;
  window.openSocialModal = openSocialModalChuva;
  window.closeSocialModalChuva = closeSocialModalChuva;
  window.setSocialFormat = setSocialFormat;
  window.setSocialHorizon = setSocialHorizon;
  window.handleSocialSearch = handleSocialSearch;
  window.toggleOnlyActive = toggleOnlyActive;
  window.setSocialStationsFilter = setSocialStationsFilter;
  window.toggleStationSelection = toggleStationSelection;
  window.toggleSocialChipsDrawer = toggleSocialChipsDrawer;
  window.refreshSocialStationsData = refreshSocialStationsData;
  window.downloadSocialCard = downloadSocialCard;
  window.downloadSocialFormat = downloadSocialFormat;
  window.downloadSocialCurrentFormat = downloadSocialCurrentFormat;
  window.getStationWindAndGust = getStationWindAndGust;
  window.getStationRainForSocial = getStationRainForSocial;
}
