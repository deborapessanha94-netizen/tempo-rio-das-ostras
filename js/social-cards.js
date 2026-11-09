/**
 * Gerador de Imagens para Redes Sociais (Post Feed & Stories do Instagram)
 * Sincronizado em tempo real com os valores exatos do site no momento da visualização/download.
 * Canal Oficial: @tempoemriodasostras
 *
 * v191:
 * - Imagens SEPARADAS para CHUVA e para VENTOS & RAJADAS (Duas imagens oficiais distintas)
 * - Card de Vento com ranking dos maiores ventos e maiores rajadas, direção, pódio resumo e horários
 * - Paleta Nórdica Clara Oficial (#f4f1ea) como padrão visual em todos os dispositivos
 * - Digitação direta de qualquer quantidade de horas para chuva e métricas rápidas para vento
 * - Download 100% compatível com celulares (Web Share API nativa, Blob URL e helper touch-and-hold)
 */

export const socialState = {
  format: 'post', // 'post' (1080x1350) ou 'story' (1080x1920)
  cardTheme: 'nordic', // 'nordic' (Paleta Nórdica Clara Oficial) ou 'dark' (Noturna Oceânica)
  activeTab: 'chuva', // 'chuva' (Acumulados) ou 'vento' (Maiores Ventos e Rajadas)

  // Estados de Chuva:
  horizon: '24h',
  horizonHours: 24.0,
  isHoje: false,
  filterMode: 'all', // 'all' (todas as 10) ou 'active' (apenas ativas)
  selectedStationCodes: new Set(),
  stationFilterText: '',

  // Estados de Vento & Rajadas:
  windMetric: 'hoje', // 'hoje' (máximas do dia), '24h', 'agora'
  windFilter: 'anemometer', // 'anemometer' (com sensor de vento) ou 'all' (todas as 10)

  // Dados consolidados:
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
 * Retorna o vento e rajada da estação (para uso geral e tabela comparativa do site)
 */
export function getStationWindAndGust(st, allStations) {
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
  if (isSocialModalOpen()) {
    renderSocialStationChips();
    renderSocialCanvas();
  }
}

/**
 * Sincroniza dados em tempo real a partir da memória ativa do site ou do JSON local
 */
export async function syncFromLiveSiteNow(full = false) {
  try {
    if (typeof window !== 'undefined' && typeof window.getLiveStationsForSocial === 'function') {
      const liveData = window.getLiveStationsForSocial();
      if (Array.isArray(liveData) && liveData.length > 0) {
        socialState.stationsData = liveData;
        return;
      }
    }

    if (typeof window !== 'undefined' && typeof window.syncLiveStationsTelemetry === 'function') {
      await window.syncLiveStationsTelemetry(true, !full);
      if (typeof window.getLiveStationsForSocial === 'function') {
        const refreshed = window.getLiveStationsForSocial();
        if (Array.isArray(refreshed) && refreshed.length > 0) {
          socialState.stationsData = refreshed;
          return;
        }
      }
    }

    if (typeof window !== 'undefined' && window.state && Array.isArray(window.state.stationsData) && window.state.stationsData.length > 0) {
      socialState.stationsData = window.state.stationsData;
      return;
    }

    if (typeof window !== 'undefined' && window.state?.acumuladosDataset?.estacoes) {
      socialState.stationsData = window.state.acumuladosDataset.estacoes;
      return;
    }

    const res = await fetch(`./data/acumulados_estacoes.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.estacoes)) {
        socialState.stationsData = json.estacoes;
      }
    }
  } catch (err) {
    console.warn('[SocialCards] Falha ao sincronizar dados em tempo real:', err);
  }
}

/**
 * Extrai horizonte em horas a partir de texto digitado pelo usuário
 */
export function parseUserQuery(query) {
  if (!query) return null;
  const clean = String(query).toLowerCase().trim();

  if (/^(hoje|today|00h|desde\s*00h)/i.test(clean)) {
    return { isHoje: true, hours: 24.0, label: 'Hoje (desde 00h)' };
  }

  const hourMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:horas?|h\b)/i);
  if (hourMatch) {
    const val = parseFloat(hourMatch[1].replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      return { isHoje: false, hours: val, label: `${val} horas` };
    }
  }

  const dayMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:dias?|d\b)/i);
  if (dayMatch) {
    const val = parseFloat(dayMatch[1].replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      const h = val * 24.0;
      return { isHoje: false, hours: h, label: `${h} horas` };
    }
  }

  const numOnly = clean.match(/^(\d+(?:[.,]\d+)?)$/);
  if (numOnly) {
    const val = parseFloat(numOnly[1].replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      return { isHoje: false, hours: val, label: `${val} horas` };
    }
  }

  return null;
}

/**
 * Obtém ou interpola a precipitação de uma estação para qualquer número de horas digitado
 */
export function getStationRainForSocial(station, horizon, customHours) {
  if (!station) return 0.0;

  // 1. Acumulado diário (desde 00h de hoje)
  if (socialState.isHoje || horizon === 'hoje') {
    if (station.chuva_hoje !== undefined && station.chuva_hoje !== null) {
      return round1(station.chuva_hoje, 0.0);
    }
  }

  const hrs = customHours !== undefined && customHours !== null
    ? Number(customHours)
    : (socialState.horizonHours || 24.0);

  return calculateStationRain(station, hrs);
}

/**
 * Cálculo dinâmico para qualquer quantidade de horas digitada
 */
export function calculateStationRain(station, hours) {
  if (!station) return 0.0;
  const h = Math.max(0.1, Number(hours) || 24.0);

  const hRound = Math.round(h);
  if (typeof window !== 'undefined' && typeof window.getStationRainForMetric === 'function') {
    const fromSite = window.getStationRainForMetric(station, `${hRound}h`);
    if (fromSite !== null && fromSite !== undefined && !isNaN(Number(fromSite)) && Number(fromSite) >= 0) {
      return round1(fromSite, 0.0);
    }
  }

  const keyExact = `chuva_${hRound}h`;
  if (station[keyExact] !== undefined && station[keyExact] !== null && !isNaN(Number(station[keyExact]))) {
    return round1(station[keyExact], 0.0);
  }

  const knownHorizons = [
    { h: 1, val: Number(station.chuva_1h ?? 0) },
    { h: 4, val: Number(station.chuva_4h ?? station.chuva_1h ?? 0) },
    { h: 6, val: Number(station.chuva_6h ?? station.chuva_4h ?? 0) },
    { h: 12, val: Number(station.chuva_12h ?? station.chuva_6h ?? 0) },
    { h: 24, val: Number(station.chuva_24h ?? station.chuva_hoje ?? 0) },
    { h: 36, val: Number(station.chuva_36h ?? station.chuva_24h ?? 0) },
    { h: 48, val: Number(station.chuva_48h ?? station.chuva_36h ?? 0) },
    { h: 96, val: Number(station.chuva_96h ?? station.chuva_48h ?? 0) }
  ];

  if (h <= knownHorizons[0].h) {
    const ratio = h / knownHorizons[0].h;
    return round1(knownHorizons[0].val * ratio, 0.0);
  }

  for (let i = 0; i < knownHorizons.length - 1; i++) {
    const lower = knownHorizons[i];
    const upper = knownHorizons[i + 1];
    if (h >= lower.h && h <= upper.h) {
      const frac = (h - lower.h) / (upper.h - lower.h);
      const interpolated = lower.val + (upper.val - lower.val) * frac;
      return round1(interpolated, lower.val);
    }
  }

  const last = knownHorizons[knownHorizons.length - 1];
  return round1(last.val, 0.0);
}

/**
 * Alterna entre a Aba de Chuva e a Aba de Ventos & Rajadas (Duas imagens separadas)
 */
export function setSocialTab(tab) {
  if (tab !== 'chuva' && tab !== 'vento') return;
  socialState.activeTab = tab;

  // Atualiza botões da aba no topo do modal
  const btnChuva = document.getElementById('social-tab-btn-chuva');
  const btnVento = document.getElementById('social-tab-btn-vento');
  
  if (btnChuva && btnVento) {
    if (tab === 'chuva') {
      btnChuva.className = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center justify-center gap-2 transition';
      btnVento.className = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#f8fafc] hover:bg-[#e0f2fe] border border-[#cbd5e1] text-black cursor-pointer flex items-center justify-center gap-2 transition';
    } else {
      btnVento.className = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-[#e0f2fe] border-2 border-[#0284c7] text-black shadow-xs cursor-pointer flex items-center justify-center gap-2 transition';
      btnChuva.className = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#f8fafc] hover:bg-[#ffebe4] border border-[#cbd5e1] text-black cursor-pointer flex items-center justify-center gap-2 transition';
    }
  }

  // Alterna contêineres de controles
  const cChuva = document.getElementById('social-controls-chuva');
  const cVento = document.getElementById('social-controls-vento');
  if (cChuva && cVento) {
    if (tab === 'chuva') {
      cChuva.classList.remove('hidden');
      cVento.classList.add('hidden');
    } else {
      cChuva.classList.add('hidden');
      cVento.classList.remove('hidden');
    }
  }

  // Atualiza título e subtítulo do modal
  const titleEl = document.getElementById('social-modal-title');
  const subEl = document.getElementById('social-modal-subtitle');
  if (titleEl) {
    titleEl.innerText = tab === 'chuva' ? 'Exportar Card Oficial de Chuva' : 'Exportar Card Oficial de Ventos & Rajadas';
  }
  if (subEl) {
    subEl.innerText = tab === 'chuva'
      ? 'Acumulados da rede municipal em tempo real para Post e Stories'
      : 'Maiores ventos e rajadas registradas pela rede municipal em tempo real';
  }

  // Atualiza texto do botão de download principal
  updateDownloadButtonLabel();

  // Re-renderiza o canvas com o card correspondente
  renderSocialCanvas();
}

/**
 * Atualiza o rótulo do botão de download principal com base na aba e no formato ativo
 */
function updateDownloadButtonLabel() {
  const btn = document.getElementById('social-download-main-btn');
  if (!btn) return;
  const isStory = socialState.format === 'story';
  const fmtText = isStory ? 'Stories (1080x1920)' : 'Post Feed (1080x1350)';
  
  if (socialState.activeTab === 'vento') {
    btn.innerHTML = `<i data-lucide="download" class="w-4 h-4 text-black"></i><span>Baixar Card de Ventos & Rajadas (${fmtText})</span>`;
    btn.className = 'flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black bg-[#e0f2fe] border-2 border-[#0284c7] text-black shadow-xs hover:bg-[#bae6fd] active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm transition';
  } else {
    btn.innerHTML = `<i data-lucide="download" class="w-4 h-4 text-black"></i><span>Baixar Card de Chuva (${fmtText})</span>`;
    btn.className = 'flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs hover:bg-[#ffd9cb] active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm transition';
  }
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

/**
 * Define a métrica de vento ('hoje', '24h', 'agora')
 */
export function setSocialWindMetric(metric) {
  if (!['hoje', '24h', 'agora'].includes(metric)) return;
  socialState.windMetric = metric;

  const btnHoje = document.getElementById('social-wind-btn-hoje');
  const btn24h = document.getElementById('social-wind-btn-24h');
  const btnAgora = document.getElementById('social-wind-btn-agora');

  [
    { el: btnHoje, id: 'hoje' },
    { el: btn24h, id: '24h' },
    { el: btnAgora, id: 'agora' }
  ].forEach(b => {
    if (!b.el) return;
    if (b.id === metric) {
      b.el.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#e0f2fe] border-2 border-[#0284c7] text-black shadow-xs cursor-pointer flex items-center gap-1.5 transition';
    } else {
      b.el.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#e0f2fe] border border-[#cbd5e1] text-black cursor-pointer transition shadow-2xs flex items-center gap-1.5';
    }
  });

  renderSocialCanvas();
}

/**
 * Define o filtro de estações de vento ('anemometer' ou 'all')
 */
export function setSocialWindFilter(filter) {
  if (!['anemometer', 'all'].includes(filter)) return;
  socialState.windFilter = filter;

  const btnAnem = document.getElementById('social-wind-filter-anemometer');
  const btnAll = document.getElementById('social-wind-filter-all');

  if (btnAnem && btnAll) {
    if (filter === 'anemometer') {
      btnAnem.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#0284c7] text-white shadow-xs border border-[#0369a1] cursor-pointer flex items-center gap-1';
      btnAll.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-[#eaeff2] border border-[#cbd5e1] cursor-pointer flex items-center gap-1';
    } else {
      btnAll.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#0284c7] text-white shadow-xs border border-[#0369a1] cursor-pointer flex items-center gap-1';
      btnAnem.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-[#eaeff2] border border-[#cbd5e1] cursor-pointer flex items-center gap-1';
    }
  }

  renderSocialCanvas();
}

/**
 * Abre o Modal Social focado em Chuva
 */
export async function openSocialModalChuva(initialHorizon = '24h') {
  await openSocialModalWithTab('chuva', initialHorizon);
}

/**
 * Abre o Modal Social focado em Ventos & Rajadas
 */
export async function openSocialModalVento() {
  await openSocialModalWithTab('vento', 'hoje');
}

/**
 * Abre o Modal Social configurando a aba inicial
 */
export async function openSocialModalWithTab(tab, initialHorizon = '24h') {
  const modal = document.getElementById('modal-social-chuva');
  if (!modal) return;

  await syncFromLiveSiteNow();

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';

  setSocialTab(tab || 'chuva');

  if (tab === 'chuva') {
    if (initialHorizon === 'hoje') {
      toggleSocialHoje(true);
    } else {
      const q = parseUserQuery(initialHorizon);
      if (q) {
        socialState.isHoje = q.isHoje;
        socialState.horizonHours = q.hours;
        socialState.horizon = `${Math.round(q.hours)}h`;
        const inp = document.getElementById('social-custom-hours-input');
        if (inp) inp.value = Math.round(q.hours);
      }
    }
  }

  updateFormatButtons(socialState.format || 'post');
  updateCardThemeButtons(socialState.cardTheme || 'nordic');
  updateStationsFilterButtons(socialState.filterMode || 'all');
  renderSocialStationChips();

  renderSocialCanvas();

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

/**
 * Fecha o Modal Social
 */
export function closeSocialModalChuva() {
  const modal = document.getElementById('modal-social-chuva');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = '';
}

/**
 * Define o formato do card: 'post' (1080x1350) ou 'story' (1080x1920)
 */
export function setSocialFormat(fmt) {
  if (fmt !== 'post' && fmt !== 'story') return;
  socialState.format = fmt;
  updateFormatButtons(fmt);
  updateDownloadButtonLabel();
  renderSocialCanvas();
}

/**
 * Digitação direta de horas com recálculo em tempo real
 */
export function handleSocialHoursInput(val) {
  const parsed = parseUserQuery(val);
  if (!parsed) return;

  socialState.isHoje = parsed.isHoje;
  socialState.horizonHours = parsed.hours;
  socialState.horizon = `${Math.round(parsed.hours)}h`;

  const btnHoje = document.getElementById('social-btn-toggle-hoje');
  if (btnHoje) {
    if (parsed.isHoje) {
      btnHoje.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center gap-1.5 transition';
    } else {
      btnHoje.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#ffebe4] border border-[#cbd5e1] text-black cursor-pointer transition shadow-2xs flex items-center gap-1.5';
    }
  }

  renderSocialCanvas();
}

/**
 * Alterna modo "Hoje (desde 00h)"
 */
export function toggleSocialHoje(forceTrue = false) {
  if (forceTrue) {
    socialState.isHoje = true;
  } else {
    socialState.isHoje = !socialState.isHoje;
  }

  const btnHoje = document.getElementById('social-btn-toggle-hoje');
  const inp = document.getElementById('social-custom-hours-input');

  if (socialState.isHoje) {
    if (btnHoje) {
      btnHoje.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center gap-1.5 transition';
    }
    if (inp) inp.value = '';
    socialState.horizon = 'hoje';
  } else {
    if (btnHoje) {
      btnHoje.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#ffebe4] border border-[#cbd5e1] text-black cursor-pointer transition shadow-2xs flex items-center gap-1.5';
    }
    if (inp) inp.value = '24';
    socialState.horizonHours = 24.0;
    socialState.horizon = '24h';
  }

  renderSocialCanvas();
}

/**
 * Alterna tema do card gerado (Nórdica Clara Oficial vs Noturna)
 */
export function setSocialCardTheme(theme) {
  if (theme !== 'nordic' && theme !== 'dark') return;
  socialState.cardTheme = theme;
  updateCardThemeButtons(theme);
  renderSocialCanvas();
}

export function updateCardThemeButtons(theme) {
  const btnNordic = document.getElementById('social-theme-btn-nordic');
  const btnDark = document.getElementById('social-theme-btn-dark');

  if (btnNordic && btnDark) {
    if (theme === 'nordic') {
      btnNordic.className = 'px-2.5 py-1 rounded-lg text-xs font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center gap-1 transition';
      btnDark.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center gap-1 transition';
    } else {
      btnDark.className = 'px-2.5 py-1 rounded-lg text-xs font-black bg-[#0284c7] border-2 border-[#38bdf8] text-white shadow-xs cursor-pointer flex items-center gap-1 transition';
      btnNordic.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center gap-1 transition';
    }
  }
}

export function setSocialHorizon(hz) {
  if (!hz) return;
  if (hz === 'hoje') {
    toggleSocialHoje(true);
    return;
  }
  const q = parseUserQuery(hz);
  if (q) {
    const inp = document.getElementById('social-custom-hours-input');
    if (inp) inp.value = Math.round(q.hours);
    handleSocialHoursInput(q.hours);
  }
}

export function handleSocialSearch(val) {
  socialState.stationFilterText = String(val || '').toLowerCase().trim();
  renderSocialCanvas();
}

export function setSocialStationsFilter(mode) {
  if (mode !== 'all' && mode !== 'active') return;
  socialState.filterMode = mode;
  updateStationsFilterButtons(mode);
  renderSocialCanvas();
}

export function toggleStationSelection(code) {
  if (!code) return;
  if (socialState.selectedStationCodes.has(code)) {
    socialState.selectedStationCodes.delete(code);
  } else {
    socialState.selectedStationCodes.add(code);
  }
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
    if (chevron) chevron.classList.add('rotate-180');
  } else {
    drawer.classList.add('hidden');
    if (chevron) chevron.classList.remove('rotate-180');
  }
}

export async function refreshSocialStationsData() {
  const icon = document.getElementById('social-refresh-icon');
  if (icon) icon.classList.add('animate-spin');
  try {
    await syncFromLiveSiteNow(true);
  } finally {
    if (icon) icon.classList.remove('animate-spin');
    renderSocialStationChips();
    renderSocialCanvas();
  }
}

export function renderSocialStationChips() {
  const container = document.getElementById('social-station-chips');
  const countEl = document.getElementById('social-selected-count');
  if (!container) return;

  const stations = socialState.stationsData || [];
  if (stations.length === 0) return;

  if (socialState.selectedStationCodes.size === 0) {
    stations.forEach(s => socialState.selectedStationCodes.add(s.codigo));
  }

  const selectedCount = socialState.selectedStationCodes.size;
  if (countEl) {
    countEl.innerText = `${selectedCount} de ${stations.length} selecionadas`;
  }

  container.innerHTML = stations.map(st => {
    const isSelected = socialState.selectedStationCodes.has(st.codigo);
    const bgClass = isSelected
      ? 'bg-[#ffebe4] border-[#f07a53] text-black font-black'
      : 'bg-white border-[#cbd5e1] text-black/60 font-medium';
    return `
      <button 
        type="button"
        onclick="toggleStationSelection('${st.codigo}')"
        class="px-2.5 py-1 rounded-lg text-[11px] border cursor-pointer transition flex items-center gap-1 ${bgClass}"
      >
        <span>${st.nome_curto || st.nome}</span>
        ${isSelected ? '<span class="text-[#ea580c] font-black">✓</span>' : ''}
      </button>
    `;
  }).join('');
}

export function updateStationsFilterButtons(mode) {
  const btnAll = document.getElementById('social-btn-filter-all');
  const btnActive = document.getElementById('social-btn-filter-active');
  if (btnAll && btnActive) {
    if (mode === 'all') {
      btnAll.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#f07a53] text-white shadow-xs border border-[#ea580c] cursor-pointer flex items-center gap-1';
      btnActive.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center gap-1';
    } else {
      btnActive.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#f07a53] text-white shadow-xs border border-[#ea580c] cursor-pointer flex items-center gap-1';
      btnAll.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center gap-1';
    }
  }
}

export function updateFormatButtons(fmt) {
  const btnPost = document.getElementById('social-btn-fmt-post');
  const btnStory = document.getElementById('social-btn-fmt-story');
  if (btnPost && btnStory) {
    if (fmt === 'post') {
      btnPost.className = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition';
      btnStory.className = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center justify-center gap-1.5 transition';
    } else {
      btnStory.className = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition';
      btnPost.className = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center justify-center gap-1.5 transition';
    }
  }
}

export function toggleOnlyActive() {
  const newMode = socialState.filterMode === 'active' ? 'all' : 'active';
  setSocialStationsFilter(newMode);
}

/**
 * Função principal de renderização do Canvas: direciona para Chuva ou Vento
 */
export function renderSocialCanvas() {
  const canvas = document.getElementById('social-export-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const isStory = socialState.format === 'story';
  const isDark = socialState.cardTheme === 'dark';

  const width = 1080;
  const height = isStory ? 1920 : 1350;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.clearRect(0, 0, width, height);

  if (socialState.activeTab === 'vento') {
    renderSocialCanvasVento(canvas, ctx, width, height, isStory, isDark);
  } else {
    renderSocialCanvasChuva(canvas, ctx, width, height, isStory, isDark);
  }
}

/**
 * RENDERIZADOR 1: CARD OFICIAL DE CHUVA
 */
export function renderSocialCanvasChuva(canvas, ctx, width, height, isStory, isDark) {
  // Fundo
  if (isDark) {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#020b18');
    bgGrad.addColorStop(0.4, '#06172e');
    bgGrad.addColorStop(1, '#020813');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, width - 24, height - 24);
  } else {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(0.3, '#f4f1ea');
    bgGrad.addColorStop(1, '#eae5dc');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, width - 24, height - 24);
  }

  // Coleta dados das estações
  let stations = (socialState.stationsData && socialState.stationsData.length > 0)
    ? [...socialState.stationsData]
    : (window.state?.acumuladosDataset?.estacoes ? [...window.state.acumuladosDataset.estacoes] : []);

  if (socialState.selectedStationCodes.size > 0) {
    stations = stations.filter(s => socialState.selectedStationCodes.has(s.codigo));
  }

  if (socialState.filterMode === 'active') {
    stations = stations.filter(s => s.online !== false);
  }

  if (socialState.stationFilterText) {
    const query = socialState.stationFilterText;
    stations = stations.filter(s => 
      (s.nome && s.nome.toLowerCase().includes(query)) ||
      (s.bairro && s.bairro.toLowerCase().includes(query)) ||
      (s.codigo && s.codigo.toLowerCase().includes(query))
    );
  }

  const currentHours = socialState.horizonHours || 24.0;
  const currentHz = socialState.isHoje ? 'hoje' : (socialState.horizon || '24h');

  const rainStations = stations.filter(s => s.categoria !== 'inea');
  const jundiaSt = stations.find(s => s.categoria === 'inea');

  rainStations.forEach(st => {
    st._activeRainVal = getStationRainForSocial(st, currentHz, currentHours);
  });

  // Ordena da maior para a menor precipitação
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

  // Cabeçalho
  const topPad = isStory ? 110 : 60;
  const leftPad = 65;
  const rightPad = width - 65;

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

  ctx.strokeStyle = isDark ? 'rgba(0, 194, 255, 0.3)' : '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftPad, subY + 18);
  ctx.lineTo(rightPad, subY + 18);
  ctx.stroke();

  // Linhas das estações
  const startY = subY + 36;
  const footerY = height - (isStory ? 65 : 48);
  const availableHeight = footerY - startY - (isStory ? 60 : 40);
  const count = displayStations.length || 1;

  const rowGap = isStory ? Math.min(22, Math.floor(availableHeight / count * 0.18)) : Math.min(14, Math.floor(availableHeight / count * 0.18));
  const rowHeight = Math.min(isStory ? 120 : 88, Math.floor((availableHeight - (count - 1) * rowGap) / count));

  displayStations.forEach((st, idx) => {
    const rowY = startY + idx * (rowHeight + rowGap);
    const isJundia = st.categoria === 'inea';
    const isOffline = st.online === false;

    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.75)' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(leftPad, rowY, width - 130, rowHeight, 14);
    ctx.fill();

    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.2)' : '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.font = isStory ? 'bold 30px sans-serif' : 'bold 24px sans-serif';
    const nameY = rowY + (isStory ? 42 : 32);
    ctx.fillText(st.nome_curto || st.nome, leftPad + 18, nameY);

    const badgeY = rowY + (isStory ? 74 : 54);
    const badgeText = st.codigo || '';
    ctx.font = 'bold 13px monospace';
    const badgeWidth = ctx.measureText(badgeText).width + 12;

    ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe';
    ctx.beginPath();
    ctx.roundRect(leftPad + 18, badgeY - 14, badgeWidth, 20, 6);
    ctx.fill();
    ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = isDark ? '#38bdf8' : '#0369a1';
    ctx.fillText(badgeText, leftPad + 24, badgeY);

    ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
    ctx.font = '600 15px sans-serif';
    ctx.fillText(st.bairro ? `  ${st.bairro}` : '', leftPad + 18 + badgeWidth + 4, badgeY);

    ctx.textAlign = 'right';
    if (isOffline) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '900 24px sans-serif';
      ctx.fillText('OFFLINE', rightPad - 18, rowY + (isStory ? 42 : 32));

      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Sem sinal recente', rightPad - 18, rowY + (isStory ? 70 : 52));
    } else if (isJundia) {
      const riverLevel = (st.rio_nivel !== undefined && st.rio_nivel !== null)
        ? Number(st.rio_nivel).toFixed(2).replace('.', ',')
        : '1,40';

      ctx.fillStyle = '#0284c7';
      ctx.font = '900 36px sans-serif';
      ctx.fillText(riverLevel, rightPad - 64, rowY + (isStory ? 44 : 34));

      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('m', rightPad - 18, rowY + (isStory ? 44 : 34));

      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('NÍVEL DO RIO • Vigilância', rightPad - 18, rowY + (isStory ? 72 : 54));
    } else {
      const rainVal = st._activeRainVal || 0;
      const rainStr = formatDec1(rainVal);

      ctx.fillStyle = isDark ? '#38bdf8' : '#ea580c';
      ctx.font = '900 42px sans-serif';
      ctx.fillText(rainStr, rightPad - 72, rowY + (isStory ? 44 : 34));

      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('mm', rightPad - 18, rowY + (isStory ? 44 : 34));

      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`Acumulado ${horizonLabel}`, rightPad - 18, rowY + (isStory ? 68 : 52));
    }
    ctx.textAlign = 'left';
  });

  // Rodapé Oficial
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

  const previewImg = document.getElementById('social-preview-image');
  if (previewImg) {
    previewImg.src = canvas.toDataURL('image/png');
  }
}

/**
 * RENDERIZADOR 2: CARD OFICIAL DE VENTOS & RAJADAS (SEPARADO DA CHUVA)
 */
export function renderSocialCanvasVento(canvas, ctx, width, height, isStory, isDark) {
  // Coleta dados
  const stations = (socialState.stationsData && socialState.stationsData.length > 0)
    ? socialState.stationsData
    : (window.state?.acumuladosDataset?.estacoes || []);

  const metric = socialState.windMetric || 'hoje'; // 'hoje' | '24h' | 'agora'

  const parsed = stations.map(st => {
    let gust = 0.0;
    let sust = 0.0;
    let time = '';

    if (metric === 'hoje') {
      sust = round1(st.vento_max_hoje ?? st.vento_atual, 0.0);
      gust = round1(st.rajada_max_hoje ?? st.vento_max_hoje ?? st.rajada_atual, sust);
      time = st.hora_rajada_max_hoje || st.hora_vento_max_hoje || '';
    } else if (metric === '24h') {
      sust = round1(st.vento_max_24h ?? st.vento_max_hoje ?? st.vento_atual, 0.0);
      gust = round1(st.rajada_max_24h ?? st.rajada_max_hoje ?? st.rajada_atual, sust);
      time = '24h';
    } else { // 'agora'
      sust = round1(st.vento_atual, 0.0);
      gust = round1(st.rajada_atual ?? st.vento_atual, sust);
      time = 'Agora';
    }

    const hasAnemometer = Boolean(
      st.categoria === 'meteorologica' ||
      st.tipo === 'meteorologica' ||
      (st.codigo && (st.codigo.startsWith('IR') || st.codigo.startsWith('IC')))
    );

    const isPluviometerOnly = Boolean(
      st.categoria === 'cemaden' ||
      st.categoria === 'pluviometrica' ||
      (st.codigo && st.codigo.startsWith('PCD'))
    );

    const isRiverOnly = Boolean(
      st.categoria === 'inea' ||
      st.categoria === 'hidrologica' ||
      (st.codigo && st.codigo.includes('2241036'))
    );

    const isOnline = st.online !== false;

    return {
      raw: st,
      codigo: st.codigo || '',
      nome: st.nome_curto || st.nome || '',
      bairro: st.bairro || '',
      online: isOnline,
      hasAnemometer,
      isPluviometerOnly,
      isRiverOnly,
      gust: Math.max(gust, sust),
      sust,
      time,
      dir: st.vento_dir_cardinal || '',
      deg: st.vento_dir_graus !== null && st.vento_dir_graus !== undefined ? Math.round(st.vento_dir_graus) : null
    };
  });

  // Filtragem
  let displayStations = [];
  if (socialState.windFilter === 'anemometer') {
    displayStations = parsed.filter(s => s.hasAnemometer);
  } else {
    displayStations = parsed;
  }

  // Ordenação: ativas com anemômetro ordenadas pela MAIOR RAJADA; depois offline; depois pluviômetros/rio
  displayStations.sort((a, b) => {
    const aActive = (a.online && a.hasAnemometer) ? 1 : 0;
    const bActive = (b.online && b.hasAnemometer) ? 1 : 0;
    if (bActive !== aActive) return bActive - aActive;

    if (aActive && bActive) {
      if (b.gust !== a.gust) return b.gust - a.gust;
      return b.sust - a.sust;
    }

    const aAnem = a.hasAnemometer ? 1 : 0;
    const bAnem = b.hasAnemometer ? 1 : 0;
    if (bAnem !== aAnem) return bAnem - aAnem;

    return a.nome.localeCompare(b.nome);
  });

  // Top Highlights para o Pódio Resumo
  const activeWithWind = parsed.filter(s => s.online && s.hasAnemometer && s.gust > 0);
  activeWithWind.sort((a, b) => b.gust - a.gust);

  const topGustStation = activeWithWind[0] || null;
  const topSustStation = activeWithWind.slice().sort((a, b) => b.sust - a.sust)[0] || null;

  // Background
  if (isDark) {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#020b18');
    bgGrad.addColorStop(0.4, '#06172e');
    bgGrad.addColorStop(1, '#020813');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, width - 24, height - 24);
  } else {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(0.3, '#f4f1ea');
    bgGrad.addColorStop(1, '#eae5dc');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, width - 24, height - 24);
  }

  const topPad = isStory ? 95 : 50;
  const leftPad = 65;
  const rightPad = width - 65;
  const contentWidth = rightPad - leftPad;

  // Barra de acento
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.roundRect(leftPad, topPad, 10, isStory ? 90 : 76, 5);
  ctx.fill();

  // Cabeçalho
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.font = isStory ? 'bold 34px sans-serif' : 'bold 28px sans-serif';
  ctx.fillText('MAIORES VENTOS E', leftPad + 24, topPad + (isStory ? 32 : 26));

  if (isDark) {
    const titleGrad = ctx.createLinearGradient(leftPad + 24, topPad + 40, leftPad + 360, topPad + 95);
    titleGrad.addColorStop(0, '#38bdf8');
    titleGrad.addColorStop(1, '#00c2ff');
    ctx.fillStyle = titleGrad;
  } else {
    ctx.fillStyle = '#0284c7';
  }
  ctx.font = isStory ? '900 66px sans-serif' : '900 54px sans-serif';
  ctx.fillText('RAJADAS DO DIA', leftPad + 24, topPad + (isStory ? 92 : 76));

  const now = new Date();
  const dataFormatada = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const horaFormatada = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const metricLabel = metric === 'hoje'
    ? 'MÁXIMAS DE HOJE'
    : (metric === '24h' ? 'ÚLTIMAS 24H' : 'TEMPO REAL');

  const subY = topPad + (isStory ? 142 : 118);
  ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
  ctx.font = '700 22px sans-serif';
  ctx.fillText('Rede Municipal & Entorno • Telemetria Oficial', leftPad, subY);

  ctx.textAlign = 'right';
  ctx.font = 'bold 21px monospace';
  if (isDark) {
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${dataFormatada} • ${horaFormatada} • ${metricLabel}`, rightPad, subY);
  } else {
    const horizonSuffix = ` • ${metricLabel}`;
    const suffixWidth = ctx.measureText(horizonSuffix).width;
    ctx.fillStyle = '#0284c7';
    ctx.fillText(horizonSuffix, rightPad, subY);
    ctx.fillStyle = '#0f172a';
    ctx.fillText(`${dataFormatada} • ${horaFormatada}`, rightPad - suffixWidth, subY);
  }
  ctx.textAlign = 'left';

  ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.3)' : '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftPad, subY + 16);
  ctx.lineTo(rightPad, subY + 16);
  ctx.stroke();

  // POD RESUMO (3 colunas de destaque)
  const podY = subY + 28;
  const podH = isStory ? 116 : 98;
  const podGap = 16;
  const podW = (contentWidth - 2 * podGap) / 3;

  const pods = [
    {
      title: '🌪️ MAIOR RAJADA DO DIA',
      val: topGustStation ? `${formatDec1(topGustStation.gust)}` : '--',
      unit: 'km/h',
      color: '#ea580c',
      sub: topGustStation ? `${topGustStation.nome}${topGustStation.time ? ' (' + topGustStation.time + ')' : ''}` : 'Sem registro'
    },
    {
      title: '💨 MAIOR VENTO SUSTENTADO',
      val: topSustStation ? `${formatDec1(topSustStation.sust)}` : '--',
      unit: 'km/h',
      color: '#0284c7',
      sub: topSustStation ? `${topSustStation.nome}${topSustStation.time ? ' (' + topSustStation.time + ')' : ''}` : 'Sem registro'
    },
    {
      title: '🧭 DIREÇÃO NO PICO',
      val: topGustStation && topGustStation.dir ? topGustStation.dir : '--',
      unit: topGustStation && topGustStation.deg !== null ? `(${topGustStation.deg}°)` : '',
      color: isDark ? '#38bdf8' : '#0f172a',
      sub: topGustStation ? `${topGustStation.bairro || 'Litoral Sul'}` : 'Ventos costeiros'
    }
  ];

  pods.forEach((p, i) => {
    const px = leftPad + i * (podW + podGap);

    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(px, podY, podW, podH, 14);
    ctx.fill();

    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.25)' : '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.roundRect(px, podY, podW, 4, [14, 14, 0, 0]);
    ctx.fill();

    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(p.title, px + 14, podY + 22);

    ctx.fillStyle = p.color;
    ctx.font = '900 36px sans-serif';
    ctx.fillText(p.val, px + 14, podY + 58);

    const valW = ctx.measureText(p.val).width;
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(` ${p.unit}`, px + 14 + valW, podY + 58);

    ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
    ctx.font = '600 13px sans-serif';
    ctx.fillText(p.sub, px + 14, podY + 84);
  });

  // CARDS DAS ESTAÇÕES
  const footerH = isStory ? 75 : 60;
  const startCardsY = podY + podH + (isStory ? 22 : 16);
  const availableH = height - startCardsY - footerH;
  const count = displayStations.length || 1;

  const cardGap = isStory ? Math.min(18, Math.floor(availableH / count * 0.15)) : Math.min(12, Math.floor(availableH / count * 0.15));
  const cardH = Math.min(isStory ? 140 : 105, Math.floor((availableH - (count - 1) * cardGap) / count));

  displayStations.forEach((st, idx) => {
    const cardY = startCardsY + idx * (cardH + cardGap);

    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.75)' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(leftPad, cardY, contentWidth, cardH, 14);
    ctx.fill();

    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.2)' : '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const rankX = leftPad + 14;
    const rankY = cardY + (cardH - 34) / 2;
    const isTop3 = idx < 3 && st.online && st.hasAnemometer;

    if (isTop3) {
      const colors = [
        { bg: '#fef3c7', border: '#f59e0b', text: '#b45309', label: '1º' },
        { bg: '#f1f5f9', border: '#94a3b8', text: '#334155', label: '2º' },
        { bg: '#ffedd5', border: '#ea580c', text: '#c2410c', label: '3º' }
      ][idx];
      ctx.fillStyle = colors.bg;
      ctx.beginPath();
      ctx.roundRect(rankX, rankY, 44, 34, 10);
      ctx.fill();
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = colors.text;
      ctx.font = '900 17px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(colors.label, rankX + 22, rankY + 24);
      ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = isDark ? '#1e293b' : '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(rankX, rankY, 44, 34, 10);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`#${idx + 1}`, rankX + 22, rankY + 23);
      ctx.textAlign = 'left';
    }

    const textStartX = rankX + 44 + 14;
    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.font = isStory ? 'bold 30px sans-serif' : 'bold 25px sans-serif';
    ctx.fillText(st.nome, textStartX, cardY + (cardH * 0.44));

    const sublineY = cardY + (cardH * 0.76);
    ctx.font = 'bold 13px monospace';
    const codeText = st.codigo;
    const codeW = ctx.measureText(codeText).width + 12;

    ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe';
    ctx.beginPath();
    ctx.roundRect(textStartX, sublineY - 14, codeW, 20, 6);
    ctx.fill();
    ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = isDark ? '#38bdf8' : '#0369a1';
    ctx.fillText(codeText, textStartX + 6, sublineY);

    ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
    ctx.font = '600 15px sans-serif';
    const locText = st.bairro ? `  ${st.bairro}` : '';
    const dirText = (st.online && st.hasAnemometer && st.dir) ? ` • Vento: ${st.dir} (${st.deg ?? 0}°)` : '';
    ctx.fillText(`${locText}${dirText}`, textStartX + codeW + 4, sublineY);

    const rightColX = rightPad - 16;

    if (!st.online) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ef4444';
      ctx.font = '900 24px sans-serif';
      ctx.fillText('OFFLINE', rightColX, cardY + (cardH * 0.46));

      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Sem sinal recente', rightColX, cardY + (cardH * 0.74));
      ctx.textAlign = 'left';
    } else if (!st.hasAnemometer) {
      ctx.textAlign = 'right';
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(st.isRiverOnly ? 'NÍVEL DO RIO' : 'SEM ANEMÔMETRO', rightColX, cardY + (cardH * 0.46));

      ctx.font = '500 14px sans-serif';
      ctx.fillText(st.isRiverOnly ? 'Estação Fluviométrica' : 'Apenas Pluviômetro', rightColX, cardY + (cardH * 0.74));
      ctx.textAlign = 'left';
    } else {
      ctx.textAlign = 'right';

      // 1) RAJADA MÁXIMA
      const gustStr = formatDec1(st.gust);
      ctx.fillStyle = isDark ? '#38bdf8' : '#ea580c';
      ctx.font = '900 38px sans-serif';
      ctx.fillText(gustStr, rightColX - 52, cardY + (cardH * 0.48));

      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('km/h', rightColX, cardY + (cardH * 0.48));

      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = 'bold 13px sans-serif';
      const gustLabel = st.time ? `Rajada máx às ${st.time}` : 'Rajada máxima';
      ctx.fillText(gustLabel, rightColX, cardY + (cardH * 0.78));

      // 2) VENTO SUSTENTADO
      const sustX = rightColX - 220;
      const sustStr = formatDec1(st.sust);
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = '900 32px sans-serif';
      ctx.fillText(sustStr, sustX - 48, cardY + (cardH * 0.48));

      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('km/h', sustX, cardY + (cardH * 0.48));

      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('Vento sustentado', sustX, cardY + (cardH * 0.78));

      ctx.textAlign = 'left';
    }
  });

  // RODAPÉ OFICIAL
  const footerY = height - (isStory ? 65 : 48);
  ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.4)' : '#0284c7';
  ctx.beginPath();
  ctx.roundRect(leftPad, footerY - (isStory ? 40 : 30), contentWidth, 3, 1.5);
  ctx.fill();

  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.font = isStory ? 'bold 26px sans-serif' : 'bold 22px sans-serif';
  ctx.fillText('@tempoemriodasostras', leftPad, footerY);

  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.font = isStory ? '500 19px sans-serif' : '500 16px sans-serif';
  ctx.fillText('Fontes: Estações em tempo real dos bairros • Rio das Ostras - RJ', leftPad, footerY + (isStory ? 26 : 22));

  ctx.textAlign = 'right';
  ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('TELEMETRIA OFICIAL • ANEMÔMETROS CALIBRADOS', rightPad, footerY);
  ctx.textAlign = 'left';

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
  let fileName = '';
  let shareTitle = '';
  let shareText = '';

  if (socialState.activeTab === 'vento') {
    fileName = `maiores_ventos_rajadas_${socialState.windMetric}_${fmtName}_riodasostras.png`;
    shareTitle = 'Maiores Ventos e Rajadas - Rio das Ostras';
    shareText = `Maiores ventos e rajadas registrados pela rede municipal de Rio das Ostras (${socialState.windMetric.toUpperCase()}).`;
  } else {
    const horizonName = socialState.isHoje ? 'hoje' : (socialState.horizon || '24h');
    fileName = `acumulados_chuva_${horizonName}_${fmtName}_riodasostras.png`;
    shareTitle = 'Acumulados de Chuva - Rio das Ostras';
    shareText = `Acumulados de Chuva da rede municipal de Rio das Ostras (${horizonName.toUpperCase()}).`;
  }

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
            title: shareTitle,
            text: shareText
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
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  }, 'image/png');

  // 3. Fallback adicional para iOS Safari: exibe helper com toque contínuo para salvar
  if (isMobile && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    showMobileSaveHelper(canvas.toDataURL('image/png'), fileName);
  }
}

function showMobileSaveHelper(dataUrl, fileName) {
  let overlay = document.getElementById('social-mobile-save-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'social-mobile-save-overlay';
    overlay.className = 'fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl max-w-sm w-full p-4 text-center shadow-2xl border border-[#cbd5e1] space-y-3">
        <div class="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
          <span class="text-xs font-black text-black">Salvar Imagem no Celular</span>
          <button type="button" onclick="this.closest('#social-mobile-save-overlay').remove()" class="p-1 text-black font-bold text-sm">✕</button>
        </div>
        <p class="text-xs text-black/80 font-medium">
          <strong>Toque e segure</strong> o dedo sobre a imagem abaixo e selecione <strong>"Salvar Imagem"</strong> para guardar no seu Fotos/Galeria.
        </p>
        <div class="max-h-[50vh] overflow-hidden rounded-xl border border-[#cbd5e1] flex items-center justify-center bg-[#f4f1ea]">
          <img id="social-mobile-helper-img" src="" class="max-h-[48vh] w-auto object-contain" />
        </div>
        <button type="button" onclick="this.closest('#social-mobile-save-overlay').remove()" class="w-full py-2 bg-[#f07a53] text-white rounded-xl font-black text-xs">
          Entendi, fechar
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  const img = document.getElementById('social-mobile-helper-img');
  if (img) img.src = dataUrl;
}

export async function downloadSocialCard() {
  await downloadSocialCurrentFormat();
}

// Exportações globais para interação com o HTML
if (typeof window !== 'undefined') {
  window.socialState = socialState;
  window.openSocialModalChuva = openSocialModalChuva;
  window.openSocialModalVento = openSocialModalVento;
  window.openSocialModalWithTab = openSocialModalWithTab;
  window.openSocialModal = function(param) {
    if (param === 'vento') openSocialModalVento();
    else openSocialModalChuva(param || '24h');
  };
  window.closeSocialModalChuva = closeSocialModalChuva;
  window.setSocialTab = setSocialTab;
  window.setSocialWindMetric = setSocialWindMetric;
  window.setSocialWindFilter = setSocialWindFilter;
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
  window.getStationWindAndGust = getStationWindAndGust;
  window.renderSocialCanvas = renderSocialCanvas;
  window.renderSocialCanvasChuva = renderSocialCanvasChuva;
  window.renderSocialCanvasVento = renderSocialCanvasVento;
}
