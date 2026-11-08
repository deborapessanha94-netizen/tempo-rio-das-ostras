/**
 * Gerador de Imagens para Redes Sociais (Post Feed & Stories do Instagram)
 * Sincronizado em tempo real com os valores exatos do site no momento da visualização/download.
 * Canal Oficial: @tempoemriodasostras
 *
 * v190:
 * - Paleta Nórdica Clara Oficial do site como padrão visual dos cards (com opção de modo noturno)
 * - Digitação direta de qualquer quantidade de horas com cálculo dinâmico na hora (sem opções fixas)
 * - Download 100% compatível com celulares (Web Share API nativa, Blob URL e helper touch-and-hold)
 */

export const socialState = {
  format: 'post', // 'post' (1080x1350) ou 'story' (1080x1920)
  cardTheme: 'nordic', // 'nordic' (Paleta Nórdica Clara Oficial) ou 'dark' (Noturna Oceânica)
  horizon: '24h',
  horizonHours: 24.0,
  isHoje: false,
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

  const dayMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:dias?|d)/i);
  if (dayMatch) {
    const dVal = parseFloat(dayMatch[1].replace(',', '.'));
    const hVal = Math.round(dVal * 24 * 10) / 10;
    const residual = clean.replace(dayMatch[0], '').trim();
    const label = Number.isInteger(hVal) ? `${hVal}H` : `${hVal.toFixed(1)}H`;
    return { isHorizon: true, hours: hVal, horizonLabel: label, stationFilter: residual };
  }

  const hourMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:h(?:oras?|rs?)?)?/i);
  if (hourMatch && hourMatch[1]) {
    const hVal = parseFloat(hourMatch[1].replace(',', '.'));
    const residual = clean.replace(hourMatch[0], '').trim();
    const label = Number.isInteger(hVal) ? `${hVal}H` : `${hVal.toFixed(1)}H`;
    return { isHorizon: true, hours: Math.max(0.1, hVal), horizonLabel: label, stationFilter: residual };
  }

  return { isHorizon: false, hours: socialState.horizonHours || 24.0, horizonLabel: (socialState.horizon || '24h').toUpperCase(), stationFilter: clean };
}

/**
 * Retorna o volume exato de chuva de uma estação para qualquer horizonte em horas,
 * calculando na hora sob demanda.
 */
export function getStationRainForSocial(station, horizon, hours) {
  if (!station) return 0.0;
  if (station.online === false) return 0.0;
  if (station.categoria === 'inea') return null;

  const h = hours || socialState.horizonHours || 24.0;
  const hRound = Math.round(h);
  const isDaily = socialState.isHoje || horizon === 'hoje' || horizon === 'diario' || horizon === 'diário';

  // 1. Se estiver consultando acumulado diário (desde 00h de hoje)
  if (isDaily) {
    return Number(station.chuva_hoje !== undefined && station.chuva_hoje !== null ? station.chuva_hoje : 0.0);
  }

  // 2. Horizontes canônicos do site
  if (hRound === 1 && station.chuva_1h != null) return Number(station.chuva_1h);
  if (hRound === 4 && station.chuva_4h != null) return Number(station.chuva_4h);
  if (hRound === 6 && station.chuva_6h != null) return Number(station.chuva_6h);
  if (hRound === 12 && station.chuva_12h != null) return Number(station.chuva_12h);
  if (hRound === 24 && station.chuva_24h != null) return Number(station.chuva_24h);
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

  // 4. Interpolação matemática contínua para qualquer número de horas digitado
  return calculateStationRain(station, h);
}

/**
 * Calcula a curva de chuva interpolada para qualquer quantidade de horas digitada pelo usuário
 */
export function calculateStationRain(station, hours) {
  if (!station || hours <= 0) return 0.0;
  if (station.online === false) return 0.0;
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
      return round1(p1.v + t * (p2.v - p1.v), 0.0);
    }
  }

  return round1(points[points.length - 1].v, 0.0);
}

/**
 * Abre o modal de exportação na Paleta Nórdica Clara Oficial
 */
export async function openSocialModalChuva(initialHorizon) {
  const modal = document.getElementById('modal-social-chuva');
  if (!modal) return;

  // Adota métrica atualmente ativa no site ou valor padrão
  const siteMetric = (typeof window !== 'undefined' && window.state?.stationsSortMetric)
    ? window.state.stationsSortMetric
    : '24h';
  const effectiveHorizon = initialHorizon || siteMetric || '24h';

  if (String(effectiveHorizon).toLowerCase() === 'hoje') {
    socialState.isHoje = true;
    socialState.horizon = 'hoje';
    socialState.horizonHours = 24.0;
  } else {
    const parsed = parseUserQuery(effectiveHorizon);
    socialState.isHoje = false;
    socialState.horizon = parsed.horizonLabel.toLowerCase();
    socialState.horizonHours = parsed.hours || 24.0;
  }

  socialState.stationFilterText = '';

  // Sincroniza input de digitação direta
  const hoursInput = document.getElementById('social-custom-hours-input');
  if (hoursInput) {
    hoursInput.value = socialState.isHoje ? '' : Math.round(socialState.horizonHours);
  }

  const btnHoje = document.getElementById('social-btn-toggle-hoje');
  if (btnHoje) {
    btnHoje.className = socialState.isHoje
      ? 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#ffebe4] text-black border-2 border-[#f07a53] shadow-xs cursor-pointer transition flex items-center gap-1.5'
      : 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#ffebe4] border border-[#cbd5e1] text-black cursor-pointer transition shadow-2xs flex items-center gap-1.5';
  }

  // Puxa snapshot em tempo real das 10 estações
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

  if (!socialState.stationsData || socialState.stationsData.length === 0) {
    await syncFromLiveSiteNow({ full: false });
  }

  if (socialState.selectedStationCodes.size === 0 && socialState.stationsData.length > 0) {
    socialState.stationsData.forEach(s => {
      if (s.codigo) socialState.selectedStationCodes.add(s.codigo);
    });
  }

  updateFormatButtons(socialState.format);
  updateCardThemeButtons(socialState.cardTheme);
  updateStationsFilterButtons();
  renderSocialStationChips();

  modal.classList.remove('hidden');
  modal.classList.add('flex');

  renderSocialCanvas();

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

/**
 * Manipula a digitação direta do horizonte de horas pelo usuário com recálculo instantâneo
 */
export function handleSocialHoursInput(val) {
  const raw = String(val || '').trim().replace(',', '.');
  const num = parseFloat(raw);
  if (isNaN(num) || num <= 0) return;

  const clamped = Math.min(96, Math.max(0.5, num));
  socialState.isHoje = false;
  socialState.horizonHours = clamped;
  socialState.horizon = Number.isInteger(clamped) ? `${clamped}h` : `${clamped.toFixed(1)}h`;

  const btnHoje = document.getElementById('social-btn-toggle-hoje');
  if (btnHoje) {
    btnHoje.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#ffebe4] border border-[#cbd5e1] text-black cursor-pointer transition shadow-2xs flex items-center gap-1.5';
  }

  renderSocialCanvas();
}

/**
 * Alterna para o cálculo de chuva acumulada hoje (desde 00h)
 */
export function toggleSocialHoje() {
  socialState.isHoje = true;
  socialState.horizon = 'hoje';
  socialState.horizonHours = 24.0;

  const hoursInput = document.getElementById('social-custom-hours-input');
  if (hoursInput) hoursInput.value = '';

  const btnHoje = document.getElementById('social-btn-toggle-hoje');
  if (btnHoje) {
    btnHoje.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#ffebe4] text-black border-2 border-[#f07a53] shadow-xs cursor-pointer transition flex items-center gap-1.5';
  }

  renderSocialCanvas();
}

/**
 * Alterna a paleta do card entre a Oficial Nórdica Clara (padrão) e Noturna
 */
export function setSocialCardTheme(theme) {
  socialState.cardTheme = theme === 'dark' ? 'dark' : 'nordic';
  updateCardThemeButtons(socialState.cardTheme);
  renderSocialCanvas();
}

function updateCardThemeButtons(theme) {
  const btnNordic = document.getElementById('social-theme-btn-nordic');
  const btnDark = document.getElementById('social-theme-btn-dark');

  const activeCls = 'px-2.5 py-1 rounded-lg text-xs font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center gap-1 transition';
  const inactiveCls = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center gap-1 transition';

  if (btnNordic && btnDark) {
    if (theme === 'dark') {
      btnDark.className = activeCls;
      btnNordic.className = inactiveCls;
    } else {
      btnNordic.className = activeCls;
      btnDark.className = inactiveCls;
    }
  }
}

export function setSocialHorizon(horizon) {
  const clean = String(horizon || '').toLowerCase();
  if (clean === 'hoje') {
    toggleSocialHoje();
    return;
  }
  const parsed = parseUserQuery(clean);
  socialState.isHoje = false;
  socialState.horizon = parsed.horizonLabel.toLowerCase();
  socialState.horizonHours = parsed.hours;

  const hoursInput = document.getElementById('social-custom-hours-input');
  if (hoursInput) hoursInput.value = Math.round(parsed.hours);

  const btnHoje = document.getElementById('social-btn-toggle-hoje');
  if (btnHoje) {
    btnHoje.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#ffebe4] border border-[#cbd5e1] text-black cursor-pointer transition shadow-2xs flex items-center gap-1.5';
  }

  renderSocialCanvas();
}

export function handleSocialSearch(query) {
  const parsed = parseUserQuery(query);
  socialState.horizon = parsed.horizonLabel.toLowerCase();
  socialState.horizonHours = parsed.hours;
  socialState.stationFilterText = parsed.stationFilter || '';
  renderSocialCanvas();
}

export function setSocialStationsFilter(mode) {
  socialState.filterMode = mode;
  updateStationsFilterButtons();

  if (mode === 'all') {
    socialState.stationsData.forEach(s => {
      if (s.codigo) socialState.selectedStationCodes.add(s.codigo);
    });
  } else if (mode === 'active') {
    socialState.selectedStationCodes.clear();
    socialState.stationsData.forEach(s => {
      if (s.codigo && s.online !== false) {
        socialState.selectedStationCodes.add(s.codigo);
      }
    });
  }

  renderSocialStationChips();
  renderSocialCanvas();
}

export function toggleStationSelection(code) {
  if (socialState.selectedStationCodes.has(code)) {
    if (socialState.selectedStationCodes.size > 1) {
      socialState.selectedStationCodes.delete(code);
    }
  } else {
    socialState.selectedStationCodes.add(code);
  }

  const total = socialState.stationsData.length;
  const activeCount = socialState.stationsData.filter(s => s.online !== false).length;
  const allSelected = socialState.stationsData.every(s => socialState.selectedStationCodes.has(s.codigo));
  const allActiveSelected = socialState.stationsData.every(s => {
    if (s.online === false) return true;
    return socialState.selectedStationCodes.has(s.codigo);
  }) && socialState.selectedStationCodes.size === activeCount;

  if (allSelected) {
    socialState.filterMode = 'all';
  } else if (allActiveSelected) {
    socialState.filterMode = 'active';
  } else {
    socialState.filterMode = 'custom';
  }

  updateStationsFilterButtons();
  renderSocialStationChips();
  renderSocialCanvas();
}

export function toggleSocialChipsDrawer() {
  const drawer = document.getElementById('social-chips-drawer');
  const chevron = document.getElementById('social-chips-chevron');
  if (!drawer) return;

  socialState.chipsDrawerOpen = !socialState.chipsDrawerOpen;
  if (socialState.chipsDrawerOpen) {
    drawer.classList.remove('hidden');
    if (chevron) chevron.style.transform = 'rotate(180deg)';
  } else {
    drawer.classList.add('hidden');
    if (chevron) chevron.style.transform = 'rotate(0deg)';
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
    if (icon) icon.classList.remove('animate-spin');
  }
}

function renderSocialStationChips() {
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
        <button type="button" onclick="toggleStationSelection('${st.codigo}')" class="px-2.5 py-1 rounded-lg text-xs font-black bg-[#ffebe4] text-black border-2 border-[#f07a53] flex items-center gap-1 cursor-pointer transition shadow-2xs hover:brightness-95">
          <span class="w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-600' : 'bg-rose-600'}"></span>
          <span>${shortName}</span>
          <span class="text-[10px] font-black text-[#ea580c]">✓</span>
        </button>
      `;
    } else {
      return `
        <button type="button" onclick="toggleStationSelection('${st.codigo}')" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1] line-through flex items-center gap-1 cursor-pointer transition opacity-70 hover:opacity-100">
          <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          <span>${shortName}</span>
        </button>
      `;
    }
  }).join('');
}

function updateStationsFilterButtons() {
  const btnAll = document.getElementById('social-btn-filter-all');
  const btnActive = document.getElementById('social-btn-filter-active');

  const activeCls = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#f07a53] text-white shadow-xs border border-[#ea580c] cursor-pointer flex items-center gap-1';
  const inactiveCls = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center gap-1';

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

  const activeCls = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition';
  const inactiveCls = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center justify-center gap-1.5 transition';

  if (btnPost && btnStory) {
    if (activeFmt === 'post') {
      btnPost.className = activeCls;
      btnStory.className = inactiveCls;
      if (dlMainBtn) {
        dlMainBtn.querySelector('span').textContent = 'Baixar Post Feed (1080x1350)';
      }
    } else {
      btnStory.className = activeCls;
      btnPost.className = inactiveCls;
      if (dlMainBtn) {
        dlMainBtn.querySelector('span').textContent = 'Baixar Stories (1080x1920)';
      }
    }
  }
}

export function toggleOnlyActive(isChecked) {
  setSocialStationsFilter(isChecked ? 'active' : 'all');
}

/**
 * Renderiza o canvas de alta resolução oficial para o Instagram.
 * Paleta Padrão: Nórdica Clara Oficial do Site (#f4f1ea, branco cerâmico, terracota #ea580c, tipografia preta legível).
 */
export function renderSocialCanvas() {
  const canvas = document.getElementById('social-export-canvas') || document.createElement('canvas');
  canvas.id = 'social-export-canvas';
  const ctx = canvas.getContext('2d');

  const isStory = socialState.format === 'story';
  const isDark = socialState.cardTheme === 'dark';
  const width = 1080;
  const height = isStory ? 1920 : 1350;

  canvas.width = width;
  canvas.height = height;

  // 1. Fundo do Card
  if (isDark) {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#020b18');
    bgGrad.addColorStop(0.45, '#041328');
    bgGrad.addColorStop(1, '#071e3b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

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
  } else {
    // Paleta Nórdica Clara Oficial do Site (#f4f1ea cerâmica com acentos quentes terracota)
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#faf8f5');
    bgGrad.addColorStop(0.4, '#f4f1ea');
    bgGrad.addColorStop(1, '#ebe6dd');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Borda perimetral sutil cerâmica
    ctx.strokeStyle = '#dfd8ce';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(16, 16, width - 32, height - 32, 24);
    ctx.stroke();
  }

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
  const currentHz = socialState.isHoje ? 'hoje' : (socialState.horizon || '24h');

  const rainStations = stations.filter(s => s.categoria !== 'inea');
  const jundiaSt = stations.find(s => s.categoria === 'inea');

  rainStations.forEach(st => {
    st._activeRainVal = getStationRainForSocial(st, currentHz, currentHours);
  });

  // Ordena rigorosamente da maior precipitação para a menor; se empatar, online primeiro
  rainStations.sort((a, b) => {
    const vA = a._activeRainVal || 0;
    const vB = b._activeRainVal || 0;
    if (vB !== vA) return vB - vA;
    const onA = a.online !== false ? 1 : 0;
    const onB = b.online !== false ? 1 : 0;
    if (onB !== onA) return onB - onA;
    return (a.nome_curto || a.nome || '').localeCompare(b.nome_curto || b.nome || '');
  });

  let displayStations = [];
  if (jundiaSt && (!socialState.stationFilterText || socialState.stationFilterText.includes('jundi') || socialState.stationFilterText.includes('inea'))) {
    displayStations = [...rainStations, jundiaSt];
  } else {
    displayStations = [...rainStations];
  }

  // 3. Cabeçalho Oficial do Card
  const topPad = isStory ? 110 : 60;
  const leftPad = 65;
  const rightPad = width - 65;

  // Barra de acento à esquerda do título
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.roundRect(leftPad, topPad, 10, isStory ? 92 : 78, 5);
  ctx.fill();

  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.font = isStory ? 'bold 36px sans-serif' : 'bold 30px sans-serif';
  ctx.fillText('ACUMULADOS DE', leftPad + 24, topPad + (isStory ? 34 : 28));

  if (isDark) {
    const titleGrad = ctx.createLinearGradient(leftPad + 24, topPad + 40, leftPad + 300, topPad + 95);
    titleGrad.addColorStop(0, '#5eead4');
    titleGrad.addColorStop(1, '#00c2ff');
    ctx.fillStyle = titleGrad;
  } else {
    ctx.fillStyle = '#ea580c';
  }
  ctx.font = isStory ? '900 68px sans-serif' : '900 56px sans-serif';
  ctx.fillText('CHUVA', leftPad + 24, topPad + (isStory ? 94 : 78));

  // Metadados do topo à direita
  const now = new Date();
  const dataFormatada = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const horaFormatada = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const horizonLabel = socialState.isHoje
    ? 'HOJE (DESDE 00H)'
    : (Number.isInteger(currentHours) ? `${currentHours} HORAS` : `${currentHours.toFixed(1)} HORAS`);

  const subY = topPad + (isStory ? 148 : 122);
  ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
  ctx.font = '700 23px sans-serif';
  const subText = socialState.filterMode === 'active' ? 'Estações Ativas da Rede Municipal' : 'Rede Municipal & Entorno • Telemetria Oficial';
  ctx.fillText(subText, leftPad, subY);

  // Pílula com Data, Hora e Horizonte
  ctx.textAlign = 'right';
  ctx.font = 'bold 22px monospace';
  if (isDark) {
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${dataFormatada} • ${horaFormatada} • ${horizonLabel}`, rightPad, subY);
  } else {
    const horizonSuffix = ` • ${horizonLabel}`;
    const suffixWidth = ctx.measureText(horizonSuffix).width;
    ctx.fillStyle = '#ea580c';
    ctx.fillText(horizonSuffix, rightPad, subY);
    ctx.fillStyle = '#0f172a';
    ctx.fillText(`${dataFormatada} • ${horaFormatada}`, rightPad - suffixWidth, subY);
  }
  ctx.textAlign = 'left';

  // Linha divisória do cabeçalho
  ctx.strokeStyle = isDark ? 'rgba(0, 194, 255, 0.3)' : '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftPad, subY + 18);
  ctx.lineTo(rightPad, subY + 18);
  ctx.stroke();

  // 4. Lista das Estações da Rede
  const listStartY = subY + 30;
  const footerY = height - (isStory ? 85 : 60);
  const availableListH = footerY - listStartY - 16;
  const numStations = Math.max(displayStations.length, 1);

  const rowHeight = isStory
    ? Math.min(148, Math.floor(availableListH / numStations))
    : Math.min(108, Math.floor(availableListH / numStations));

  const cardH = rowHeight - (isStory ? 14 : 10);
  const cardW = rightPad - leftPad;

  displayStations.forEach((st, idx) => {
    const rowY = listStartY + idx * rowHeight;
    const isJundia = st.categoria === 'inea';
    const isOnline = st.online !== false;
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

    // Container de Card Branco Cerâmico na Paleta Nórdica Clara
    if (!isDark) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(leftPad, rowY, cardW, cardH, 14);
      ctx.fill();

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // =========================================================================
    // COLUNA ESQUERDA: Nome da Estação, Badge do Código e Bairro
    // =========================================================================
    ctx.textAlign = 'left';
    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    let nameFontPx = isStory ? 28 : 23;
    ctx.font = `800 ${nameFontPx}px sans-serif`;

    const maxNameW = width * 0.58;
    while (nameFontPx > 18 && ctx.measureText(displayName).width > maxNameW) {
      nameFontPx -= 1;
      ctx.font = `800 ${nameFontPx}px sans-serif`;
    }
    ctx.fillText(displayName, leftPad + 18, rowY + (isStory ? 40 : 30));

    // Badge do Código da Estação
    ctx.font = isStory ? 'bold 15px monospace' : 'bold 13px monospace';
    const badgeW = ctx.measureText(codeStr).width + 16;
    const badgeH = isStory ? 26 : 22;
    const badgeY = rowY + (isStory ? 54 : 40);

    if (isDark) {
      ctx.fillStyle = 'rgba(2, 132, 199, 0.22)';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(leftPad + 18, badgeY, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(codeStr, leftPad + 26, badgeY + (isStory ? 18 : 15));
    } else {
      ctx.fillStyle = '#f1f5f9';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(leftPad + 18, badgeY, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0369a1';
      ctx.fillText(codeStr, leftPad + 26, badgeY + (isStory ? 18 : 15));
    }

    // Nome do bairro ao lado do badge
    if (bairroStr) {
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = isStory ? '600 16px sans-serif' : '600 14px sans-serif';
      ctx.fillText(bairroStr, leftPad + 18 + badgeW + 12, badgeY + (isStory ? 18 : 15));
    }

    // =========================================================================
    // COLUNA DIREITA: Volume de Chuva / Nível do Rio Jundiá
    // =========================================================================
    ctx.textAlign = 'right';

    if (isJundia) {
      // Estação Fluviométrica do Rio Jundiá
      const riverLevel = st.nivel_rio ? String(st.nivel_rio).replace('.', ',') : '1,40 m';

      ctx.fillStyle = '#0284c7';
      ctx.font = isStory ? '900 42px monospace' : '900 34px monospace';
      ctx.fillText(riverLevel, rightPad - 18, rowY + (isStory ? 44 : 32));

      // Subtítulo do status da calha
      const statusTxt = st.status_rio ? `NÍVEL DO RIO • ${st.status_rio}` : 'NÍVEL FLUVIAL • VIGILÂNCIA';
      ctx.fillStyle = isDark ? '#38bdf8' : '#166534';
      ctx.font = isStory ? 'bold 16px sans-serif' : 'bold 13px sans-serif';
      ctx.fillText(statusTxt, rightPad - 18, rowY + (isStory ? 70 : 54));
    } else if (!isOnline) {
      // Estação Offline
      ctx.fillStyle = '#e11d48';
      ctx.font = isStory ? '900 32px monospace' : '900 24px monospace';
      ctx.fillText('OFFLINE', rightPad - 18, rowY + (isStory ? 44 : 32));

      ctx.fillStyle = isDark ? '#94a3b8' : '#94a3b8';
      ctx.font = isStory ? 'bold 15px sans-serif' : 'bold 13px sans-serif';
      ctx.fillText('Sem sinal recente', rightPad - 18, rowY + (isStory ? 68 : 52));
    } else {
      // Estações Pluviométricas Ativas
      const rainValNum = rainVal || 0;
      const isZero = rainValNum <= 0.05;

      if (isDark) {
        ctx.fillStyle = isZero ? '#94a3b8' : '#00d2ff';
      } else {
        ctx.fillStyle = isZero ? '#64748b' : '#ea580c';
      }
      ctx.font = isStory ? '900 46px monospace' : '900 36px monospace';
      ctx.fillText(rainStr, rightPad - 18, rowY + (isStory ? 44 : 32));

      // Subtítulo descritivo alinhado à direita
      ctx.fillStyle = isDark ? '#64748b' : '#475569';
      ctx.font = isStory ? '700 15px sans-serif' : '700 13px sans-serif';
      ctx.fillText(`Acumulado ${horizonLabel}`, rightPad - 18, rowY + (isStory ? 68 : 52));
    }

    ctx.textAlign = 'left';

    // Linha divisória para tema escuro
    if (isDark) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(leftPad, rowY + rowHeight - 6);
      ctx.lineTo(rightPad, rowY + rowHeight - 6);
      ctx.stroke();
    }
  });

  // 5. Rodapé Oficial
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.roundRect(leftPad, footerY - (isStory ? 40 : 30), width - 130, 3, 1.5);
  ctx.fill();

  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.font = isStory ? 'bold 26px sans-serif' : 'bold 22px sans-serif';
  ctx.fillText('@tempoemriodasostras', leftPad, footerY);

  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.font = isStory ? '500 19px sans-serif' : '500 16px sans-serif';
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
 * Faz download ou compartilha o card garantindo 100% de compatibilidade em celulares
 */
export async function downloadSocialFormat(format) {
  if (format && (format === 'post' || format === 'story')) {
    socialState.format = format;
    updateFormatButtons(format);
  }

  renderSocialCanvas();
  await new Promise(resolve => setTimeout(resolve, 80));

  const canvas = document.getElementById('social-export-canvas');
  if (!canvas) return;

  const fmtName = socialState.format === 'story' ? 'stories' : 'post';
  const horizonName = socialState.isHoje ? 'hoje' : (socialState.horizon || '24h');
  const fileName = `acumulados_chuva_${horizonName}_${fmtName}_riodasostras.png`;

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (window.innerWidth < 1024 && navigator.maxTouchPoints > 0);

  // 1. Tenta compartilhamento nativo móvel via Web Share API (salva direto na galeria/fotos do celular)
  if (isMobile && navigator.share && navigator.canShare) {
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const file = new File([blob], fileName, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Acumulados de Chuva - Rio das Ostras',
            text: `Acumulados de Chuva da rede municipal de Rio das Ostras (${horizonName.toUpperCase()}).`
          });
          return;
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // Usuário cancelou
      console.warn('[Social Share] Fallback para download via Blob:', err);
    }
  }

  // 2. Download direto via Blob URL (suportado por Android, PC e navegadores modernos)
  canvas.toBlob(blob => {
    if (!blob) return;
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = blobUrl;
    link.rel = 'noopener';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 3000);

    // 3. Em celulares onde o download automático de blob pode ser restrito pelo navegador,
    // exibe o helper flutuante para toque e retenção ("Salvar Imagem")
    if (isMobile) {
      showMobileSaveHelper(canvas.toDataURL('image/png'), fileName);
    }
  }, 'image/png');
}

/**
 * Helper flutuante para celulares garantindo que o usuário consiga salvar em qualquer navegador móvel
 */
function showMobileSaveHelper(dataUrl, fileName) {
  let helper = document.getElementById('mobile-save-helper-modal');
  if (!helper) {
    helper = document.createElement('div');
    helper.id = 'mobile-save-helper-modal';
    helper.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fade-in';
    document.body.appendChild(helper);
  }

  helper.innerHTML = `
    <div class="max-w-md w-full bg-white rounded-2xl p-4 shadow-2xl border-2 border-[#f07a53] space-y-3 text-black">
      <div class="flex items-center justify-between pb-2 border-b border-[#cbd5e1]">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h4 class="text-sm font-black text-black">Salvar Imagem no Celular</h4>
        </div>
        <button type="button" onclick="document.getElementById('mobile-save-helper-modal').remove()" class="p-1 rounded-lg text-black hover:bg-[#e2e8f0]">
          ✕
        </button>
      </div>

      <p class="text-xs font-semibold text-black/80 leading-snug">
        💡 <strong>Dica para Celular:</strong> Se o download não iniciou automaticamente, <strong>toque e segure o dedo sobre a imagem abaixo</strong> e selecione <strong>"Salvar Imagem"</strong> ou <strong>"Fazer download da imagem"</strong>.
      </p>

      <div class="p-2 bg-[#f8fafc] rounded-xl border border-[#cbd5e1] flex justify-center max-h-[46vh] overflow-hidden">
        <img src="${dataUrl}" alt="${fileName}" class="max-h-[42vh] w-auto rounded-lg shadow-sm object-contain" />
      </div>

      <div class="flex items-center gap-2 pt-1">
        <a href="${dataUrl}" download="${fileName}" class="flex-1 py-2 rounded-xl text-xs font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black text-center shadow-xs">
          Baixar Arquivo
        </a>
        <button type="button" onclick="document.getElementById('mobile-save-helper-modal').remove()" class="px-4 py-2 rounded-xl text-xs font-bold bg-[#f1f5f9] text-black border border-[#cbd5e1]">
          Fechar
        </button>
      </div>
    </div>
  `;
}

export async function downloadSocialCard() {
  await downloadSocialCurrentFormat();
}

// Exportações globais para interação com o HTML
if (typeof window !== 'undefined') {
  window.socialState = socialState;
  window.openSocialModalChuva = openSocialModalChuva;
  window.openSocialModal = openSocialModalChuva;
  window.closeSocialModalChuva = closeSocialModalChuva;
  window.setSocialFormat = setSocialFormat;
  window.setSocialHorizon = setSocialHorizon;
  window.handleSocialHoursInput = handleSocialHoursInput;
  window.toggleSocialHoje = toggleSocialHoje;
  window.setSocialCardTheme = setSocialCardTheme;
  window.handleSocialSearch = handleSocialSearch;
  window.toggleOnlyActive = toggleOnlyActive;
  window.setSocialStationsFilter = setSocialStationsFilter;
  window.toggleStationSelection = toggleStationSelection;
  window.toggleSocialChipsDrawer = toggleSocialChipsDrawer;
  window.refreshSocialStationsData = refreshSocialStationsData;
  window.downloadSocialCurrentFormat = downloadSocialCurrentFormat;
  window.downloadSocialFormat = downloadSocialFormat;
  window.downloadSocialCard = downloadSocialCard;
  window.getStationRainForSocial = getStationRainForSocial;
  window.renderSocialCanvas = renderSocialCanvas;
}
