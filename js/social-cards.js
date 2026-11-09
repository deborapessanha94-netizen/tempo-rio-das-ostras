/**
 * Gerador de Imagens para Redes Sociais (Post Feed & Stories do Instagram)
 * Sincronizado em tempo real com os valores exatos do site no momento da visualização/download.
 * Canal Oficial: @tempoemriodasostras
 *
 * v194:
 * - Card Oficial do TEMPO AGORA completo (temperatura, sensação, céu, condição, mini-mapa e 8 métricas)
 * - Padrão rigoroso de cores IDÊNTICO para Tempo Agora, Chuva e Vento
 * - Modo Escuro Oficial: #020b18, números em ciano luminoso #38bdf8, títulos em gradiente #5eead4 -> #00c2ff
 * - Modo Claro Nórdico: cerâmica #f4f1ea, cartões brancos, números em terracota #ea580c e texto preto
 * - Suporte a Post Feed (1080x1350) e Stories (1080x1920)
 * - Integração nativa com compartilhamento mobile (navigator.share / salvar na galeria)
 */

export const socialState = {
  format: 'post', // 'post' (1080x1350) ou 'story' (1080x1920)
  cardTheme: 'dark', // 'dark' (Escura Noturna Oficial) ou 'nordic' (Clara Nórdica)
  activeTab: 'tempo', // 'tempo' (Tempo Agora), 'chuva' ou 'vento'

  // Filtro padrão de estações para Chuva e Vento: APENAS ATIVAS
  filterMode: 'active', // 'active' (apenas ativas online) ou 'all' (todas as 10)

  // Estados de Chuva:
  horizon: '24h',
  horizonHours: 24.0,
  isHoje: false,
  selectedStationCodes: new Set(),
  stationFilterText: '',

  // Estados de Vento & Rajadas:
  windMetric: 'hoje', // 'hoje' (máximas do dia), '24h', 'agora'

  // Dados consolidados:
  stationsData: [],
  chipsDrawerOpen: false
};

// Pré-carregamento dos mapas de Rio das Ostras em HD
let preloadedMapLight = null;
let preloadedMapDark = null;
if (typeof Image !== 'undefined') {
  preloadedMapLight = new Image();
  preloadedMapLight.src = 'img/mapa_rj_marcado_hd.png';
  preloadedMapDark = new Image();
  preloadedMapDark.src = 'img/mapa_rj_marcado_hd_dark.png';
}

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

    const res = await fetch(`data/acumulados_estacoes.json?t=${Date.now()}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.estacoes) {
        socialState.stationsData = json.estacoes;
      }
    }
  } catch (e) {
    console.warn('[Social Cards] Aviso ao sincronizar telemetria:', e);
  }
}

export function openSocialModalTempoAgora() {
  openSocialModalWithTab('tempo');
}

export function openSocialModalChuva(horizon = '24h') {
  openSocialModalWithTab('chuva');
}

export function openSocialModalVento() {
  openSocialModalWithTab('vento');
}

export async function openSocialModalWithTab(tab = 'tempo') {
  const modal = document.getElementById('modal-social-chuva');
  if (!modal) return;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Sincroniza dados mais recentes
  syncFromLiveSiteNow(false);

  setSocialTab(tab);

  // Inicializa formato e tema
  updateFormatButtons(socialState.format);
  updateThemeButtons(socialState.cardTheme);

  renderSocialCanvas();

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

export function closeSocialModalChuva() {
  const modal = document.getElementById('modal-social-chuva');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
}

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

export function getStationRainForSocial(station, horizon, customHours) {
  if (!station) return 0.0;

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
 * Alterna entre as abas: 'tempo' (Tempo Agora), 'chuva' (Chuva) ou 'vento' (Vento & Rajadas)
 */
export function setSocialTab(tab) {
  if (tab !== 'chuva' && tab !== 'vento' && tab !== 'tempo') return;
  socialState.activeTab = tab;

  const btnTempo = document.getElementById('social-tab-btn-tempo');
  const btnChuva = document.getElementById('social-tab-btn-chuva');
  const btnVento = document.getElementById('social-tab-btn-vento');
  
  const activeClass = 'flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition whitespace-nowrap';
  const inactiveClass = 'flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#f8fafc] hover:bg-[#ffebe4] border border-[#cbd5e1] text-black cursor-pointer flex items-center justify-center gap-1.5 transition whitespace-nowrap';

  if (btnTempo) btnTempo.className = tab === 'tempo' ? activeClass : inactiveClass;
  if (btnChuva) btnChuva.className = tab === 'chuva' ? activeClass : inactiveClass;
  if (btnVento) btnVento.className = tab === 'vento' ? activeClass : inactiveClass;

  const cChuva = document.getElementById('social-controls-chuva');
  const cVento = document.getElementById('social-controls-vento');
  const cFilter = document.getElementById('social-filter-station-group');

  if (cChuva) {
    if (tab === 'chuva') cChuva.classList.remove('hidden');
    else cChuva.classList.add('hidden');
  }
  if (cVento) {
    if (tab === 'vento') cVento.classList.remove('hidden');
    else cVento.classList.add('hidden');
  }
  if (cFilter) {
    if (tab === 'tempo') cFilter.classList.add('hidden');
    else cFilter.classList.remove('hidden');
  }

  const titleEl = document.getElementById('social-modal-title');
  const subEl = document.getElementById('social-modal-subtitle');
  if (titleEl) {
    if (tab === 'tempo') titleEl.innerText = 'Exportar Card Oficial do Tempo Agora';
    else if (tab === 'vento') titleEl.innerText = 'Exportar Card Oficial de Ventos & Rajadas';
    else titleEl.innerText = 'Exportar Card Oficial de Chuva';
  }
  if (subEl) {
    if (tab === 'tempo') {
      subEl.innerText = 'Condições completas do tempo em Rio das Ostras em tempo real para Post e Stories';
    } else if (tab === 'vento') {
      subEl.innerText = 'Maiores ventos e rajadas registradas pela rede municipal em tempo real';
    } else {
      subEl.innerText = 'Acumulados da rede municipal em tempo real para Post e Stories';
    }
  }

  updateDownloadButtonLabel();
  renderSocialCanvas();
}

function updateDownloadButtonLabel() {
  const btn = document.getElementById('social-download-main-btn');
  if (!btn) return;
  const isStory = socialState.format === 'story';
  const fmtText = isStory ? 'Stories (1080x1920)' : 'Post Feed (1080x1350)';
  
  if (socialState.activeTab === 'tempo') {
    btn.innerHTML = `<i data-lucide="download" class="w-4 h-4 text-black"></i><span>Baixar Card do Tempo Agora (${fmtText})</span>`;
  } else if (socialState.activeTab === 'vento') {
    btn.innerHTML = `<i data-lucide="download" class="w-4 h-4 text-black"></i><span>Baixar Card de Ventos & Rajadas (${fmtText})</span>`;
  } else {
    btn.innerHTML = `<i data-lucide="download" class="w-4 h-4 text-black"></i><span>Baixar Card de Chuva (${fmtText})</span>`;
  }
  btn.className = 'flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs hover:bg-[#ffd9cb] active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm transition';
  
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

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
      b.el.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center gap-1.5 transition';
    } else {
      b.el.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#ffebe4] border border-[#cbd5e1] text-black cursor-pointer transition shadow-2xs flex items-center gap-1.5';
    }
  });

  renderSocialCanvas();
}

export function handleSocialHoursInput(val) {
  const parsed = parseUserQuery(val);
  if (!parsed) return;

  socialState.isHoje = parsed.isHoje;
  socialState.horizonHours = parsed.hours;
  socialState.horizon = parsed.isHoje ? 'hoje' : `${parsed.hours}h`;

  const btnHoje = document.getElementById('social-btn-toggle-hoje');
  if (btnHoje) {
    if (socialState.isHoje) {
      btnHoje.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black cursor-pointer transition shadow-xs flex items-center gap-1.5';
    } else {
      btnHoje.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#ffebe4] border border-[#cbd5e1] text-black cursor-pointer transition shadow-2xs flex items-center gap-1.5';
    }
  }

  renderSocialCanvas();
}

export function toggleSocialHoje() {
  socialState.isHoje = !socialState.isHoje;
  const inputEl = document.getElementById('social-custom-hours-input');
  const btnHoje = document.getElementById('social-btn-toggle-hoje');

  if (socialState.isHoje) {
    socialState.horizon = 'hoje';
    socialState.horizonHours = 24.0;
    if (inputEl) inputEl.value = '24';
    if (btnHoje) {
      btnHoje.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black cursor-pointer transition shadow-xs flex items-center gap-1.5';
    }
  } else {
    socialState.horizon = '24h';
    socialState.horizonHours = 24.0;
    if (inputEl) inputEl.value = '24';
    if (btnHoje) {
      btnHoje.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#ffebe4] border border-[#cbd5e1] text-black cursor-pointer transition shadow-2xs flex items-center gap-1.5';
    }
  }

  renderSocialCanvas();
}

export function setSocialHorizon(h) {
  handleSocialHoursInput(h);
}

export function setSocialCardTheme(theme) {
  if (theme !== 'dark' && theme !== 'nordic') return;
  socialState.cardTheme = theme;
  updateThemeButtons(theme);
  renderSocialCanvas();
}

function updateThemeButtons(theme) {
  const btnNordic = document.getElementById('social-theme-btn-nordic');
  const btnDark = document.getElementById('social-theme-btn-dark');

  if (btnNordic && btnDark) {
    if (theme === 'nordic') {
      btnNordic.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center gap-1 transition';
      btnDark.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center gap-1 transition';
    } else {
      btnDark.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#0284c7] border-2 border-[#38bdf8] text-white shadow-xs cursor-pointer flex items-center gap-1 transition';
      btnNordic.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center gap-1 transition';
    }
  }
}

export function setSocialStationsFilter(mode) {
  if (mode !== 'all' && mode !== 'active') return;
  socialState.filterMode = mode;

  const btnAll = document.getElementById('social-btn-filter-all');
  const btnActive = document.getElementById('social-btn-filter-active');

  if (btnAll && btnActive) {
    if (mode === 'all') {
      btnAll.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center gap-1 transition';
      btnActive.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center gap-1 transition';
    } else {
      btnActive.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#059669] text-white shadow-xs border border-[#047857] cursor-pointer flex items-center gap-1 transition';
      btnAll.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center gap-1 transition';
    }
  }

  renderSocialStationChips();
  renderSocialCanvas();
}

export function toggleSocialChipsDrawer() {
  socialState.chipsDrawerOpen = !socialState.chipsDrawerOpen;
  const drawer = document.getElementById('social-chips-drawer');
  const icon = document.getElementById('social-chips-chevron');

  if (drawer) {
    if (socialState.chipsDrawerOpen) {
      drawer.classList.remove('hidden');
      if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
      drawer.classList.add('hidden');
      if (icon) icon.style.transform = 'rotate(0deg)';
    }
  }
}

export function renderSocialStationChips() {
  const container = document.getElementById('social-station-chips');
  if (!container) return;

  let stations = (socialState.stationsData && socialState.stationsData.length > 0)
    ? [...socialState.stationsData]
    : (window.state?.acumuladosDataset?.estacoes ? [...window.state.acumuladosDataset.estacoes] : []);

  if (socialState.filterMode === 'active') {
    stations = stations.filter(s => s.online !== false);
  }

  const countEl = document.getElementById('social-selected-count');
  if (countEl) {
    const selCount = socialState.selectedStationCodes.size === 0 ? stations.length : socialState.selectedStationCodes.size;
    countEl.innerText = `${selCount} de ${stations.length} selecionadas`;
  }

  container.innerHTML = '';
  stations.forEach(st => {
    const isSelected = socialState.selectedStationCodes.size === 0 || socialState.selectedStationCodes.has(st.codigo);
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = isSelected
      ? 'px-2 py-1 rounded-lg text-[10px] font-black bg-[#ffebe4] border border-[#f07a53] text-black shadow-xs cursor-pointer transition'
      : 'px-2 py-1 rounded-lg text-[10px] font-medium bg-white text-black/60 border border-[#cbd5e1] opacity-60 cursor-pointer transition';
    chip.innerText = st.nome_curto || st.nome;
    chip.onclick = () => toggleStationSelection(st.codigo);
    container.appendChild(chip);
  });
}

export function toggleStationSelection(code) {
  if (socialState.selectedStationCodes.has(code)) {
    socialState.selectedStationCodes.delete(code);
  } else {
    socialState.selectedStationCodes.add(code);
  }
  renderSocialStationChips();
  renderSocialCanvas();
}

export function handleSocialSearch(query) {
  socialState.stationFilterText = String(query).toLowerCase().trim();
  renderSocialStationChips();
  renderSocialCanvas();
}

export async function refreshSocialStationsData() {
  const icon = document.getElementById('social-refresh-icon');
  if (icon) icon.classList.add('animate-spin');

  try {
    await syncFromLiveSiteNow(true);
    renderSocialStationChips();
    renderSocialCanvas();
  } finally {
    if (icon) icon.classList.remove('animate-spin');
  }
}

export function setSocialFormat(fmt) {
  if (fmt !== 'post' && fmt !== 'story') return;
  socialState.format = fmt;
  updateFormatButtons(fmt);
  updateDownloadButtonLabel();
  renderSocialCanvas();
}

function updateFormatButtons(fmt) {
  const btnPost = document.getElementById('social-btn-fmt-post');
  const btnStory = document.getElementById('social-btn-fmt-story');
  if (btnPost && btnStory) {
    if (fmt === 'post') {
      btnPost.className = 'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition';
      btnStory.className = 'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center justify-center gap-1.5 transition';
    } else {
      btnStory.className = 'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition';
      btnPost.className = 'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center justify-center gap-1.5 transition';
    }
  }
}

export function toggleOnlyActive() {
  const newMode = socialState.filterMode === 'active' ? 'all' : 'active';
  setSocialStationsFilter(newMode);
}

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

  if (socialState.activeTab === 'tempo') {
    renderSocialCanvasTempoAgora(canvas, ctx, width, height, isStory, isDark);
  } else if (socialState.activeTab === 'vento') {
    renderSocialCanvasVento(canvas, ctx, width, height, isStory, isDark);
  } else {
    renderSocialCanvasChuva(canvas, ctx, width, height, isStory, isDark);
  }
}

/**
 * RENDERIZADOR 1: CARD COMPLETO DO TEMPO AGORA (Post Feed & Stories)
 */
export function renderSocialCanvasTempoAgora(canvas, ctx, width, height, isStory, isDark) {
  // 1. Fundo Geral (Idêntico ao padrão dos cards)
  if (isDark) {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#020b18');
    bgGrad.addColorStop(0.5, '#041226');
    bgGrad.addColorStop(1, '#06172e');
    ctx.fillStyle = bgGrad;
  } else {
    ctx.fillStyle = '#f4f1ea';
  }
  ctx.fillRect(0, 0, width, height);

  // Extrai valores exatos em tempo real do DOM (com fallbacks seguros)
  const getTxt = (id, fallback = '') => {
    if (typeof document === 'undefined') return fallback;
    const el = document.getElementById(id);
    return el ? el.textContent.trim().replace(/\s+/g, ' ') : fallback;
  };

  const data = {
    title: 'Rio das Ostras, RJ – Tempo agora',
    estacaoAno: getTxt('hero-estacao-txt', 'Estação: Primavera'),
    subtitle: 'Região dos Lagos • Costa do Sol • Estação Telemétrica Sede',
    alertPill: getTxt('hero-alert-pill', 'Alerta Oficial Vigente Hoje'),
    temp: getTxt('sidebar-temp', '20°'),
    sensacao: getTxt('hero-sensacao', 'Sensação em Tempo Real: 20°C'),
    skyCond: getTxt('hero-sky-condition', 'Céu no Momento'),
    condTitle: getTxt('hero-condition', 'Muitas nuvens com pancadas de chuva isoladas'),
    condSub: getTxt('hero-subcondition', 'Chuva prevista: 15.9 mm • Rajadas 50 km/h na orla marítima'),
    date: getTxt('hero-date', 'Segunda-feira, 09 de Novembro de 2026'),
    syncLabel: getTxt('hero-sync-label', 'Atualização a cada 5 min (Tempo Real)'),
    chips: [
      { label: 'CHUVA PREVISTA', val: getTxt('hero-chip-chuva-val', '15.9 mm (Até 50 mm)'), sub: getTxt('hero-chip-chuva-sub', 'Pico: 20 a 30 mm/h (Alerta)'), icon: '🌧️', isCoral: true },
      { label: 'VENTO / RAJADAS', val: getTxt('sidebar-wind', '50 km/h'), sub: getTxt('hero-chip-vento-sub', 'Rajadas na orla marítima'), icon: '💨', isCoral: false },
      { label: 'UMIDADE DO AR', val: getTxt('sidebar-hum', '60% a 90%'), sub: getTxt('hero-chip-umid-sub', 'Ar Muito Úmido'), icon: '💧', isCoral: true },
      { label: 'MAR NA ORLA', val: getTxt('sidebar-sea', '1.0 a 1.0 m'), sub: getTxt('hero-chip-mar-sub', 'Atenção • Moderado'), icon: '🌊', isCoral: false },
      { label: 'PRESSÃO ATM.', val: getTxt('hero-chip-press-val', '1018 hPa'), sub: getTxt('hero-chip-press-sub', 'Estável'), icon: '⏲️', isCoral: false },
      { label: 'ÍNDICE UV', val: getTxt('hero-chip-uv-val', '8 - Muito Alto'), sub: getTxt('hero-chip-uv-sub', 'Evite sol • FPS 50+'), icon: '☀️', isCoral: true },
      { label: 'NASCER & PÔR DO SOL', val: getTxt('hero-chip-sol-val', '🌅 04:57 • 🌇 18:06'), sub: getTxt('hero-chip-sol-sub', '13h 08m de Sol'), icon: '🌄', isCoral: true },
      { label: 'FASE DA LUA', val: getTxt('hero-chip-lua-val', '🌑 Lua Nova'), sub: getTxt('hero-chip-lua-sub', 'Ilum. 0% • Noite'), icon: '🌙', isCoral: false }
    ]
  };

  // Margens e Geometria do Hero Card Central
  const margin = 55;
  const cardX = margin;
  const cardY = isStory ? 80 : 45;
  const cardW = width - margin * 2; // 970px
  const cardH = isStory ? 1700 : 1220;

  // Cartão Principal
  ctx.fillStyle = isDark ? 'rgba(10, 20, 38, 0.96)' : '#ffffff';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 24);
  ctx.fill();

  ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.35)' : '#cbd5e1';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Barra superior de destaque (Orange pill accent)
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.roundRect(cardX + 28, cardY, cardW - 56, 5, 2.5);
  ctx.fill();

  // 2. TOPO DO CARD: Ícone Pin + Título + Estação + Alerta + 24H
  const headerY = cardY + (isStory ? 45 : 36);

  // Pin Medallion
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.roundRect(cardX + 28, headerY, 44, 44, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '22px sans-serif';
  ctx.fillText('📍', cardX + 38, headerY + 31);

  // Título Principal
  const titleX = cardX + 84;
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.font = isStory ? 'bold 28px sans-serif' : 'bold 24px sans-serif';
  ctx.fillText(data.title, titleX, headerY + 24);

  // Linha 2 do Cabeçalho: Subtítulo + Badge Estação
  ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
  ctx.font = '500 14px sans-serif';
  const subTxt = data.subtitle;
  ctx.fillText(subTxt, titleX, headerY + 48);

  const subTxtWidth = ctx.measureText(subTxt).width;
  const estacaoX = titleX + subTxtWidth + 14;
  ctx.font = 'bold 12px sans-serif';
  const estacaoWidth = ctx.measureText(data.estacaoAno).width + 18;

  ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7';
  ctx.beginPath();
  ctx.roundRect(estacaoX, headerY + 34, estacaoWidth, 20, 10);
  ctx.fill();
  ctx.strokeStyle = isDark ? '#10b981' : '#86efac';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = isDark ? '#34d399' : '#15803d';
  ctx.fillText(data.estacaoAno, estacaoX + 9, headerY + 48);

  // Lado Direito do Topo: Alerta Oficial + 24H
  const rightX = cardX + cardW - 28;
  ctx.textAlign = 'right';

  // Badge 24H
  ctx.font = 'bold 12px sans-serif';
  const badge24Width = 44;
  ctx.fillStyle = isDark ? '#1e293b' : '#f1f5f9';
  ctx.beginPath();
  ctx.roundRect(rightX - badge24Width, headerY + 8, badge24Width, 28, 8);
  ctx.fill();
  ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = isDark ? '#e2e8f0' : '#0f172a';
  ctx.fillText('24H', rightX - 12, headerY + 27);

  // Badge Alerta Oficial Vigente
  const alertText = data.alertPill.toUpperCase();
  ctx.font = '900 12px sans-serif';
  const alertWidth = ctx.measureText(alertText).width + 24;
  const alertX = rightX - badge24Width - 10 - alertWidth;

  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.roundRect(alertX, headerY + 8, alertWidth, 28, 14);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(alertText, rightX - badge24Width - 22, headerY + 27);
  ctx.textAlign = 'left';

  // Linha divisória horizontal
  const div1Y = headerY + 68;
  ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(203, 213, 225, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cardX + 28, div1Y);
  ctx.lineTo(cardX + cardW - 28, div1Y);
  ctx.stroke();

  // 3. CENTRO DO CARD: Temperatura + Sensação + Céu no Momento + Mapa & Ícone
  const centerTopY = div1Y + (isStory ? 32 : 24);

  // Temperatura Gigante
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.font = isStory ? '900 84px sans-serif' : '900 70px sans-serif';
  ctx.fillText(data.temp, cardX + 28, centerTopY + (isStory ? 72 : 62));

  const tempWidth = ctx.measureText(data.temp).width;
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('C', cardX + 32 + tempWidth, centerTopY + (isStory ? 42 : 34));

  // Sensação em Tempo Real (Pill)
  const sensX = cardX + 64 + tempWidth;
  ctx.font = 'bold 14px sans-serif';
  const sensClean = data.sensacao.replace(/^Sensação em Tempo Real:\s*/i, '');
  const sensText = `🔥 Sensação em Tempo Real: ${sensClean}`;
  const sensWidth = ctx.measureText(sensText).width + 24;
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.roundRect(sensX, centerTopY + (isStory ? 20 : 14), sensWidth, 30, 15);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(sensText, sensX + 12, centerTopY + (isStory ? 41 : 34));

  // Pill "CÉU NO MOMENTO"
  const skyY = centerTopY + (isStory ? 116 : 98);
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = isDark ? 'rgba(234, 88, 12, 0.2)' : '#ffedd5';
  ctx.beginPath();
  ctx.roundRect(cardX + 28, skyY - 14, 128, 22, 6);
  ctx.fill();
  ctx.strokeStyle = isDark ? '#ea580c' : '#fdba74';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = isDark ? '#ea580c' : '#c2410c';
  ctx.fillText('👁️ CÉU NO MOMENTO', cardX + 34, skyY + 2);

  // Subtítulo do Céu
  ctx.fillStyle = isDark ? '#94a3b8' : '#334155';
  ctx.font = '600 16px sans-serif';
  ctx.fillText(data.skyCond, cardX + 166, skyY + 2);

  // Título da Condição (Grande e Destacado)
  const condY = skyY + (isStory ? 42 : 32);
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.font = isStory ? 'bold 30px sans-serif' : 'bold 23px sans-serif';
  ctx.fillText(data.condTitle, cardX + 28, condY);

  // Subcondição (Chuva prevista e rajadas na orla)
  const subcondY = condY + (isStory ? 32 : 26);
  ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
  ctx.font = '500 16px sans-serif';
  ctx.fillText(data.condSub, cardX + 28, subcondY);

  // LADO DIREITO DO CENTRO: Mini-Mapa do RJ
  const visualRightX = cardX + cardW - 28;
  const mapW = isStory ? 220 : 185;
  const mapH = isStory ? 154 : 130;
  const mapX = visualRightX - mapW;
  const mapY = centerTopY + 2;

  // Box do Mapa
  ctx.fillStyle = isDark ? '#0b1322' : '#f8fafc';
  ctx.beginPath();
  ctx.roundRect(mapX, mapY, mapW, mapH, 14);
  ctx.fill();
  ctx.strokeStyle = isDark ? '#1e293b' : '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Imagem real do Mapa do RJ
  const mapImg = (isDark ? preloadedMapDark : preloadedMapLight) ||
                 document.querySelector(isDark ? 'img[src*="mapa_rj_dark"]' : 'img[src*="mapa_rj_light"]') ||
                 document.querySelector('img[src*="mapa_rj"]');
  if (mapImg && mapImg.complete && mapImg.naturalWidth > 0) {
    ctx.drawImage(mapImg, mapX + 6, mapY + 6, mapW - 12, mapH - 12);
  }

  // Ponto de Rio das Ostras no Mapa
  const pinX = mapX + mapW * 0.788;
  const pinY = mapY + mapH * 0.60;
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.arc(pinX, pinY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tag "Rio das Ostras" sobre o mapa
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.roundRect(mapX + mapW - 88, mapY + mapH - 24, 82, 19, 4);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9.5px sans-serif';
  ctx.fillText('📍 Rio das Ostras', mapX + mapW - 84, mapY + mapH - 10);

  // Linha divisória horizontal antes da grade de métricas
  const div2Y = Math.max(subcondY + (isStory ? 30 : 20), mapY + mapH + (isStory ? 24 : 16));
  ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(203, 213, 225, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cardX + 28, div2Y);
  ctx.lineTo(cardX + cardW - 28, div2Y);
  ctx.stroke();

  // 4. GRADE DE 8 MÉTRICAS ESSENCIAIS (2 Colunas x 4 Linhas)
  const gridStartY = div2Y + (isStory ? 28 : 18);
  const colGap = 18;
  const colW = (cardW - 56 - colGap) / 2; // ~448px cada
  const rowGap = isStory ? 20 : 10;
  const metricH = isStory ? 130 : 84;

  data.chips.forEach((chip, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const chipX = cardX + 28 + col * (colW + colGap);
    const chipY = gridStartY + row * (metricH + rowGap);

    // Fundo da Célula de Métrica
    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(chipX, chipY, colW, metricH, 14);
    ctx.fill();

    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.25)' : '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Medalhão Circular do Ícone
    const iconSize = isStory ? 52 : 42;
    const iconX = chipX + 14;
    const iconY = chipY + (metricH - iconSize) / 2;

    ctx.fillStyle = chip.isCoral 
      ? (isDark ? 'rgba(234, 88, 12, 0.2)' : '#ffedd5')
      : (isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe');
    ctx.beginPath();
    ctx.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize/2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = chip.isCoral ? '#ea580c' : (isDark ? '#38bdf8' : '#0284c7');
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = isStory ? '24px sans-serif' : '19px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(chip.icon, iconX + iconSize/2, iconY + iconSize/2 + (isStory ? 8 : 6));
    ctx.textAlign = 'left';

    // Textos da Métrica
    const textX = iconX + iconSize + 14;
    const topTextY = chipY + (isStory ? 32 : 22);

    // Rótulo
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(chip.label, textX, topTextY);

    // Valor com escala dinâmica de fonte para evitar qualquer estouro
    ctx.fillStyle = isDark ? (chip.isCoral ? '#38bdf8' : '#ffffff') : '#0f172a';
    const valLen = chip.val.length;
    const valFontSize = isStory 
      ? (valLen > 24 ? 17 : (valLen > 18 ? 19 : 22)) 
      : (valLen > 24 ? 14 : (valLen > 18 ? 15 : 17));
    ctx.font = `900 ${valFontSize}px sans-serif`;
    ctx.fillText(chip.val, textX, topTextY + (isStory ? 32 : 23));

    // Subtexto
    ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
    ctx.font = isStory ? '500 13px sans-serif' : '500 12px sans-serif';
    ctx.fillText(chip.sub, textX, topTextY + (isStory ? 58 : 42));
  });

  // 5. RODAPÉ DO HERO CARD: Data Oficial + Frequência de Atualização
  const heroFooterY = cardY + cardH - (isStory ? 40 : 28);
  ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(203, 213, 225, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cardX + 28, heroFooterY - 18);
  ctx.lineTo(cardX + cardW - 28, heroFooterY - 18);
  ctx.stroke();

  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.font = isStory ? 'bold 16px sans-serif' : 'bold 14px sans-serif';
  ctx.fillText(data.date, cardX + 28, heroFooterY + 4);

  // Badge de Sincronização em Tempo Real
  ctx.textAlign = 'right';
  ctx.fillStyle = isDark ? '#38bdf8' : '#059669';
  ctx.font = isStory ? 'bold 14px sans-serif' : 'bold 12px sans-serif';
  ctx.fillText(`🟢 ${data.syncLabel}`, cardX + cardW - 28, heroFooterY + 4);
  ctx.textAlign = 'left';

  // 6. RODAPÉ EXTERNO DO POST: Marca Oficial @tempoemriodasostras
  const extFooterY = height - (isStory ? 50 : 30);
  ctx.fillStyle = isDark ? '#38bdf8' : '#ea580c';
  ctx.beginPath();
  ctx.roundRect(margin, extFooterY - 26, width - margin * 2, 2.5, 1.25);
  ctx.fill();

  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.font = isStory ? 'bold 24px sans-serif' : 'bold 20px sans-serif';
  ctx.fillText('@tempoemriodasostras', margin, extFooterY);

  ctx.textAlign = 'right';
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.font = isStory ? '500 16px sans-serif' : '500 14px sans-serif';
  ctx.fillText('Canal Oficial • Telemetria Oficial dos Bairros • Rio das Ostras - RJ', width - margin, extFooterY);
  ctx.textAlign = 'left';

  const previewImg = document.getElementById('social-preview-image');
  if (previewImg) {
    previewImg.src = canvas.toDataURL('image/png');
  }
}

/**
 * RENDERIZADOR 2: CARD OFICIAL DE CHUVA
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

  let stations = (socialState.stationsData && socialState.stationsData.length > 0)
    ? [...socialState.stationsData]
    : (window.state?.acumuladosDataset?.estacoes ? [...window.state.acumuladosDataset.estacoes] : []);

  if (socialState.filterMode === 'active') {
    stations = stations.filter(s => s.online !== false);
  }

  if (socialState.selectedStationCodes.size > 0) {
    stations = stations.filter(s => socialState.selectedStationCodes.has(s.codigo));
  }

  if (socialState.stationFilterText) {
    const query = socialState.stationFilterText;
    stations = stations.filter(s => 
      (s.nome && s.nome.toLowerCase().includes(query)) ||
      (s.bairro && s.bairro.toLowerCase().includes(query)) ||
      (s.codigo && s.codigo.toLowerCase().includes(query))
    );
  }

  const currentHours = socialState.isHoje ? 24.0 : (socialState.horizonHours || 24.0);

  const displayStations = stations.map(s => {
    const rain = getStationRainForSocial(s, socialState.horizon, currentHours);
    return {
      ...s,
      displayRain: rain
    };
  });

  // Ordenação: maiores acumulados primeiro (Jundiá fica por último se fluviométrica)
  displayStations.sort((a, b) => {
    const aIsRiver = a.categoria === 'inea';
    const bIsRiver = b.categoria === 'inea';
    if (aIsRiver && !bIsRiver) return 1;
    if (!aIsRiver && bIsRiver) return -1;
    return (b.displayRain || 0) - (a.displayRain || 0);
  });

  const leftPad = 65;
  const rightPad = width - 65;
  const topPad = isStory ? 95 : 70;

  // Barra de Destaque Vertical
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.roundRect(leftPad, topPad + 4, 9, isStory ? 82 : 72, 4.5);
  ctx.fill();

  // Título Superior
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.font = isStory ? '900 36px sans-serif' : '900 28px sans-serif';
  ctx.fillText('ACUMULADOS DE', leftPad + 24, topPad + (isStory ? 34 : 26));

  if (isDark) {
    const titleGrad = ctx.createLinearGradient(leftPad + 24, 0, leftPad + 300, 0);
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
  ctx.font = '700 20px sans-serif';
  const subText = socialState.filterMode === 'active' ? 'Estações Ativas da Rede Municipal' : 'Rede Municipal & Entorno • Telemetria Oficial';
  ctx.fillText(subText, leftPad, subY);

  ctx.textAlign = 'right';
  ctx.font = 'bold 20px monospace';
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
  const availableHeight = (footerY - 45) - startY;
  const count = displayStations.length || 1;

  const rowGap = isStory ? Math.min(22, Math.floor(availableHeight / count * 0.18)) : Math.min(14, Math.floor(availableHeight / count * 0.18));
  const rowHeight = Math.min(isStory ? 120 : 88, Math.floor((availableHeight - (count - 1) * rowGap) / count));

  displayStations.forEach((st, idx) => {
    const rowY = startY + idx * (rowHeight + rowGap);
    const isJundia = st.categoria === 'inea';
    const isOffline = st.online === false;

    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.8)' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(leftPad, rowY, width - 130, rowHeight, 14);
    ctx.fill();

    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.25)' : '#cbd5e1';
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
      ctx.font = '900 42px sans-serif';
      ctx.fillText(riverLevel, rightPad - 55, rowY + (isStory ? 44 : 34));

      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('m', rightPad - 18, rowY + (isStory ? 44 : 34));

      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('NÍVEL DO RIO • Vigilância', rightPad - 18, rowY + (isStory ? 70 : 52));
    } else {
      const rainStr = formatDec1(st.displayRain);

      ctx.fillStyle = isDark ? '#38bdf8' : '#ea580c';
      ctx.font = '900 42px sans-serif';
      ctx.fillText(rainStr, rightPad - 72, rowY + (isStory ? 44 : 34));

      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('mm', rightPad - 18, rowY + (isStory ? 44 : 34));

      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = 'bold 14px sans-serif';
      const labelText = socialState.isHoje ? 'Acumulado HOJE' : `Acumulado ${currentHours} HORAS`;
      ctx.fillText(labelText, rightPad - 18, rowY + (isStory ? 70 : 52));
    }
    ctx.textAlign = 'left';
  });

  // Rodapé Oficial
  ctx.fillStyle = isDark ? '#38bdf8' : '#ea580c';
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
 * RENDERIZADOR 3: CARD OFICIAL DE MAIORES VENTOS E RAJADAS
 */
export function renderSocialCanvasVento(canvas, ctx, width, height, isStory, isDark) {
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

  let rawStations = (socialState.stationsData && socialState.stationsData.length > 0)
    ? [...socialState.stationsData]
    : (window.state?.acumuladosDataset?.estacoes ? [...window.state.acumuladosDataset.estacoes] : []);

  const parsed = rawStations.map(st => {
    const hasAnemometer = Boolean(
      st.categoria === 'meteorologica' ||
      st.tipo === 'meteorologica' ||
      (st.codigo && (st.codigo.startsWith('IR') || st.codigo.startsWith('IC')))
    );

    let gust = 0.0;
    let sust = 0.0;
    let timeStr = '';

    if (socialState.windMetric === 'agora') {
      sust = round1(st.vento_atual, 0.0);
      gust = round1(st.rajada_atual ?? st.vento_atual, sust);
    } else {
      gust = round1(st.rajada_maxima_hoje ?? st.rajada_atual ?? st.vento_atual, 0.0);
      sust = round1(st.vento_atual, 0.0);
      timeStr = st.hora_rajada_maxima_hoje ? String(st.hora_rajada_maxima_hoje).slice(0, 5) : '';
    }

    return {
      ...st,
      hasAnemometer,
      isRiverOnly: st.categoria === 'inea',
      gust: Math.max(gust, sust),
      sust,
      time: timeStr,
      dir: st.vento_direcao || st.direcao_vento || '',
      deg: st.vento_graus
    };
  });

  let displayStations = parsed;
  if (socialState.filterMode === 'active') {
    displayStations = parsed.filter(s => s.online !== false && s.hasAnemometer);
  }

  if (socialState.selectedStationCodes.size > 0) {
    displayStations = displayStations.filter(s => socialState.selectedStationCodes.has(s.codigo));
  }

  // Ordenação decrescente pela maior rajada
  displayStations.sort((a, b) => {
    if (a.online === false && b.online !== false) return 1;
    if (a.online !== false && b.online === false) return -1;
    if (!a.hasAnemometer && b.hasAnemometer) return 1;
    if (a.hasAnemometer && !b.hasAnemometer) return -1;
    return (b.gust || 0) - (a.gust || 0);
  });

  const leftPad = 65;
  const rightPad = width - 65;
  const topPad = isStory ? 95 : 70;

  // Barra de Destaque Vertical
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.roundRect(leftPad, topPad + 4, 9, isStory ? 82 : 72, 4.5);
  ctx.fill();

  // Título Superior
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.font = isStory ? '900 36px sans-serif' : '900 28px sans-serif';
  ctx.fillText('MAIORES VENTOS E', leftPad + 24, topPad + (isStory ? 34 : 26));

  if (isDark) {
    const titleGrad = ctx.createLinearGradient(leftPad + 24, 0, leftPad + 360, 0);
    titleGrad.addColorStop(0, '#5eead4');
    titleGrad.addColorStop(1, '#00c2ff');
    ctx.fillStyle = titleGrad;
  } else {
    ctx.fillStyle = '#ea580c';
  }
  ctx.font = isStory ? '900 68px sans-serif' : '900 56px sans-serif';
  ctx.fillText('RAJADAS', leftPad + 24, topPad + (isStory ? 94 : 78));

  const now = new Date();
  const dataFormatada = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const horaFormatada = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  let metricLabel = 'MÁXIMAS DE HOJE';
  if (socialState.windMetric === '24h') metricLabel = 'ÚLTIMAS 24 HORAS';
  else if (socialState.windMetric === 'agora') metricLabel = 'TEMPO REAL (AGORA)';

  const subY = topPad + (isStory ? 148 : 122);
  ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
  ctx.font = '700 20px sans-serif';
  const subText = socialState.filterMode === 'active' ? 'Estações Ativas da Rede Municipal' : 'Rede Municipal & Entorno • Telemetria Oficial';
  ctx.fillText(subText, leftPad, subY);

  ctx.textAlign = 'right';
  ctx.font = 'bold 20px monospace';
  if (isDark) {
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${dataFormatada} • ${horaFormatada} • ${metricLabel}`, rightPad, subY);
  } else {
    const horizonSuffix = ` • ${metricLabel}`;
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

  // Linhas das estações (Idêntico ao layout de Chuva)
  const startY = subY + 36;
  const footerY = height - (isStory ? 65 : 48);
  const availableHeight = (footerY - 45) - startY;
  const count = displayStations.length || 1;

  const rowGap = isStory ? Math.min(26, Math.floor(availableHeight / count * 0.2)) : Math.min(18, Math.floor(availableHeight / count * 0.2));
  const rowHeight = Math.min(isStory ? 135 : 98, Math.floor((availableHeight - (count - 1) * rowGap) / count));

  displayStations.forEach((st, idx) => {
    const rowY = startY + idx * (rowHeight + rowGap);
    const isOffline = st.online === false;

    // Fundo do Cartão da Estação (Idêntico ao de Chuva)
    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.8)' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(leftPad, rowY, width - 130, rowHeight, 14);
    ctx.fill();

    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.25)' : '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nome da Estação (Idêntico ao de Chuva)
    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.font = isStory ? 'bold 30px sans-serif' : 'bold 24px sans-serif';
    const nameY = rowY + (isStory ? 42 : 32);
    ctx.fillText(st.nome_curto || st.nome, leftPad + 18, nameY);

    // Sublinha: Badge de Código + Bairro + Direção
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
    const locText = st.bairro ? `  ${st.bairro}` : '';
    const dirText = (st.online && st.hasAnemometer && st.dir) ? ` • Vento: ${st.dir} (${st.deg ?? 0}°)` : '';
    ctx.fillText(`${locText}${dirText}`, leftPad + 18 + badgeWidth + 4, badgeY);

    // Lado Direito: Valores de Vento no mesmo padrão da Chuva
    ctx.textAlign = 'right';
    if (isOffline) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '900 24px sans-serif';
      ctx.fillText('OFFLINE', rightPad - 18, rowY + (isStory ? 42 : 32));

      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Sem sinal recente', rightPad - 18, rowY + (isStory ? 70 : 52));
    } else if (!st.hasAnemometer) {
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(st.isRiverOnly ? 'NÍVEL DO RIO' : 'SEM ANEMÔMETRO', rightPad - 18, rowY + (isStory ? 44 : 34));

      ctx.font = '500 14px sans-serif';
      ctx.fillText(st.isRiverOnly ? 'Estação Fluviométrica' : 'Apenas Pluviômetro', rightPad - 18, rowY + (isStory ? 72 : 54));
    } else {
      const gustStr = formatDec1(st.gust);
      const sustStr = formatDec1(st.sust);

      ctx.fillStyle = isDark ? '#38bdf8' : '#ea580c';
      ctx.font = '900 42px sans-serif';
      ctx.fillText(gustStr, rightPad - 82, rowY + (isStory ? 44 : 34));

      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('km/h', rightPad - 18, rowY + (isStory ? 44 : 34));

      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = 'bold 14px sans-serif';
      const timeStr = st.time ? ` às ${st.time}` : '';
      ctx.fillText(`Rajada máx • Vento ${sustStr} km/h${timeStr}`, rightPad - 18, rowY + (isStory ? 68 : 52));
    }
    ctx.textAlign = 'left';
  });

  // Rodapé Oficial
  ctx.fillStyle = isDark ? '#38bdf8' : '#ea580c';
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

export async function downloadSocialCurrentFormat() {
  await downloadSocialFormat(socialState.format || 'post');
}

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

  if (socialState.activeTab === 'tempo') {
    fileName = `tempo_agora_${fmtName}_riodasostras.png`;
    shareTitle = 'Tempo Agora - Rio das Ostras, RJ';
    const tempText = (document.getElementById('sidebar-temp')?.textContent || '').trim();
    const condText = (document.getElementById('hero-condition')?.textContent || '').trim();
    shareText = `Condições completas do tempo agora em Rio das Ostras (${tempText} C, ${condText}). Canal Oficial @tempoemriodasostras`;
  } else if (socialState.activeTab === 'vento') {
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
      if (err.name === 'AbortError') return;
      console.warn('[Social Share] Fallback para download via Blob:', err);
    }
  }

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

// Exportações globais para o HTML
if (typeof window !== 'undefined') {
  window.socialState = socialState;
  window.openSocialModalTempoAgora = openSocialModalTempoAgora;
  window.openSocialModalChuva = openSocialModalChuva;
  window.openSocialModalVento = openSocialModalVento;
  window.openSocialModalWithTab = openSocialModalWithTab;
  window.openSocialModal = function(param) {
    if (param === 'tempo' || param === 'tempo_agora') openSocialModalTempoAgora();
    else if (param === 'vento') openSocialModalVento();
    else openSocialModalChuva(param || '24h');
  };
  window.closeSocialModalChuva = closeSocialModalChuva;
  window.setSocialTab = setSocialTab;
  window.setSocialWindMetric = setSocialWindMetric;
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
  window.renderSocialCanvasTempoAgora = renderSocialCanvasTempoAgora;
  window.renderSocialCanvasChuva = renderSocialCanvasChuva;
  window.renderSocialCanvasVento = renderSocialCanvasVento;
}
