/**
 * Gerador de Imagens para Redes Sociais (Post Feed & Stories do Instagram)
 * Sincronizado em tempo real com os valores exatos do site no momento da visualização/download.
 * Canal Oficial: @tempoemriodasostras
 */

let socialState = {
  format: 'post', // 'post' (1080x1350) ou 'story' (1080x1920)
  horizon: '24h',
  horizonHours: 24.0,
  filterMode: 'all', // 'all' (todas as 10) ou 'active' (apenas ativas)
  selectedStationCodes: new Set(),
  stationFilterText: '',
  stationsData: []
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

function buildWindResult(vRaw, rRaw, vMaxRaw, rMaxRaw) {
  const v = round1(vRaw, 0.0);
  const r = round1(rRaw !== null && rRaw !== undefined ? rRaw : v, v);
  const vMax = round1(vMaxRaw !== null && vMaxRaw !== undefined ? vMaxRaw : v, v);
  const rMax = round1(rMaxRaw !== null && rMaxRaw !== undefined ? rMaxRaw : Math.max(r, v), Math.max(r, v));
  return {
    vento: v,
    rajada: Math.max(r, v),
    ventoStr: formatDec1(v),
    rajadaStr: formatDec1(Math.max(r, v)),
    vento_max: vMax,
    rajada_max: rMax
  };
}

/**
 * Retorna o VENTO e a RAJADA EM TEMPO REAL (com precisão decimal idêntica aos cards do site)
 * no exato momento em que o usuário está visualizando/baixando a imagem.
 */
export function getStationWindAndGust(st, allStations) {
  const stationsList = allStations || socialState.stationsData || [];

  // 1. Estação PWS online com medição direta em tempo real no site
  if (st && st.online !== false && st.vento_atual !== null && st.vento_atual !== undefined && !isNaN(Number(st.vento_atual))) {
    const rawRMax = (st.rajada_max_hoje !== null && st.rajada_max_hoje !== undefined) ? st.rajada_max_hoje : st.rajada_max_24h;
    const rawVMax = (st.vento_max_hoje !== null && st.vento_max_hoje !== undefined) ? st.vento_max_hoje : st.vento_max_24h;
    return buildWindResult(st.vento_atual, st.rajada_atual, rawVMax, rawRMax);
  }

  // 2. Rio Jundiá (Cantagalo): espelha o vento em tempo real da estação de Cantagalo (IRIODA16)
  if (st && st.categoria === 'inea') {
    const canta = stationsList.find(s => s.codigo === 'IRIODA16' && s.online !== false && s.vento_atual !== null && s.vento_atual !== undefined);
    if (canta) {
      return buildWindResult(canta.vento_atual, canta.rajada_atual, canta.vento_max_hoje ?? canta.vento_max_24h, canta.rajada_max_hoje ?? canta.rajada_max_24h);
    }
  }

  // 3. PCDs CEMADEN Palmital (sem anemômetro físico): espelha o vento em tempo real da estação vizinha Rocha Leão (IRIODA15)
  if (st && (st.categoria === 'cemaden' || (st.codigo && String(st.codigo).includes('187')))) {
    const rocha = stationsList.find(s => s.codigo === 'IRIODA15' && s.online !== false && s.vento_atual !== null && s.vento_atual !== undefined);
    if (rocha) {
      return buildWindResult(rocha.vento_atual, rocha.rajada_atual, rocha.vento_max_hoje ?? rocha.vento_max_24h, rocha.rajada_max_hoje ?? rocha.rajada_max_24h);
    }
  }

  // 4. Estação costeira/urbana temporariamente em calibração (ex: IRIODA5 - Jd. Mariléa): usa vizinha ativa mais próxima (Costazul IRIODA6 ou Tartaruga IRIODA17)
  const coastalNeighbor = stationsList.find(s => (s.codigo === 'IRIODA6' || s.codigo === 'IRIODA17') && s.online !== false && s.vento_atual !== null && s.vento_atual !== undefined);
  if (coastalNeighbor) {
    return buildWindResult(
      coastalNeighbor.vento_atual,
      coastalNeighbor.rajada_atual,
      coastalNeighbor.vento_max_hoje ?? coastalNeighbor.vento_max_24h,
      coastalNeighbor.rajada_max_hoje ?? coastalNeighbor.rajada_max_24h
    );
  }

  // 5. Fallback: média em tempo real das estações PWS ativas do site
  const withWind = stationsList.filter(s => s.online !== false && s.vento_atual !== null && s.vento_atual !== undefined && !isNaN(Number(s.vento_atual)));
  if (withWind.length > 0) {
    const avgV = withWind.reduce((acc, s) => acc + Number(s.vento_atual), 0) / withWind.length;
    const avgR = withWind.reduce((acc, s) => acc + Number(s.rajada_atual ?? s.vento_atual), 0) / withWind.length;
    return buildWindResult(avgV, avgR, avgV, avgR);
  }

  return buildWindResult(0.0, 0.0, 0.0, 0.0);
}

/**
 * Atualiza os dados das estações no estado social (e re-renderiza ao vivo se o modal estiver aberto)
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
 * Consulta imediatamente o estado em tempo real já atualizado do site (e dispara pulso rápido nas estações)
 * para garantir que tanto a pré-visualização quanto o PNG baixado reflitam o momento exato do download.
 */
async function syncFromLiveSiteNow({ full = false } = {}) {
  // 1. Puxa imediatamente o estado ao vivo já carregado na tela do site
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

  // 2. Dispara consulta em tempo real às estações (rápida ~180ms para download ou completa para botão Atualizar)
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
      console.warn('Aviso ao sincronizar telemetria ao vivo para card social:', e);
    }
  }

  // 3. Fallback apenas se a lista ainda estiver vazia
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
 * Parser inteligente de busca por horizonte ou estação
 */
function parseUserQuery(query) {
  const clean = String(query || '').trim().toLowerCase();
  if (!clean) {
    return { isHorizon: false, hours: 24.0, horizonLabel: '24H', stationFilter: '' };
  }

  const dayMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:dias?|d\b)/i);
  if (dayMatch) {
    const dVal = parseFloat(dayMatch[1].replace(',', '.'));
    const hVal = Math.round(dVal * 24 * 10) / 10;
    const residual = clean.replace(dayMatch[0], '').trim();
    const label = Number.isInteger(hVal) ? `${hVal}H` : `${hVal.toFixed(1)}H`;
    return { isHorizon: true, hours: hVal, horizonLabel: label, stationFilter: residual };
  }

  const rangeMatch = clean.match(/(?:das\s*)?(\d{1,2})h?\s*(?:as|às|a|-)\s*(\d{1,2})h?/i);
  if (rangeMatch) {
    const h1 = parseFloat(rangeMatch[1]);
    const h2 = parseFloat(rangeMatch[2]);
    const diff = Math.max(1, Math.abs(h2 - h1));
    const residual = clean.replace(rangeMatch[0], '').trim();
    return { isHorizon: true, hours: diff, horizonLabel: `${diff}H`, stationFilter: residual };
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
 * Calcula NA HORA o volume de chuva de qualquer estação para QUALQUER horizonte de horas
 */
export function calculateStationRain(station, hours) {
  if (hours <= 0) return 0.0;

  const c1 = Number(station.chuva_1h !== undefined && station.chuva_1h !== null ? station.chuva_1h : 0.0);
  const c4 = Number(station.chuva_4h !== undefined && station.chuva_4h !== null ? station.chuva_4h : c1);
  const c6 = Number(station.chuva_6h !== undefined && station.chuva_6h !== null ? station.chuva_6h : (c4 + (Number(station.chuva_12h || c4) - c4) * 0.33));
  const c12 = Number(station.chuva_12h !== undefined && station.chuva_12h !== null ? station.chuva_12h : c6);
  const c24 = Number(station.chuva_24h !== undefined && station.chuva_24h !== null ? station.chuva_24h : c12);
  const c36 = Number(station.chuva_36h !== undefined && station.chuva_36h !== null ? station.chuva_36h : c24);
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
 * Abre o modal de exportação de chuva já consultando os dados ao vivo do site
 */
export async function openSocialModalChuva(initialHorizon = '24h') {
  const modal = document.getElementById('modal-social-chuva');
  if (!modal) return;

  const parsed = parseUserQuery(initialHorizon);
  socialState.horizon = parsed.horizonLabel.toLowerCase();
  socialState.horizonHours = parsed.hours;
  socialState.stationFilterText = '';

  // Puxa imediatamente o snapshot ao vivo atual da página antes mesmo de abrir
  if (typeof window !== 'undefined' && typeof window.getLiveStationsForSocial === 'function') {
    const curLive = window.getLiveStationsForSocial();
    if (curLive) {
      if (Array.isArray(curLive) && curLive.length > 0) socialState.stationsData = curLive;
      else if (Array.isArray(curLive.estacoes) && curLive.estacoes.length > 0) socialState.stationsData = curLive.estacoes;
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

  const searchInput = document.getElementById('social-horizon-search');
  if (searchInput) searchInput.value = socialState.horizon;

  updateHorizonButtons(socialState.horizon);
  updateActivePill(socialState.horizon);
  updateFormatButtons(socialState.format);
  updateStationsFilterButtons();
  renderSocialStationChips();

  modal.classList.remove('hidden');
  modal.classList.add('flex');

  renderSocialCanvas();

  const previewContainer = document.getElementById('social-preview-container');
  if (previewContainer) {
    previewContainer.scrollTop = 0;
  }

  if (window.lucide) window.lucide.createIcons();

  // Confirma leitura fresquíssima em background (~180ms) e atualiza o preview
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
  socialState.format = format;
  updateFormatButtons(format);
  renderSocialCanvas();
  const previewContainer = document.getElementById('social-preview-container');
  if (previewContainer) {
    previewContainer.scrollTop = 0;
  }
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

/**
 * Botão "Atualizar" do modal: consulta diretamente a telemetria em tempo real do site (sem sobrescrever com JSON estático antigo)
 */
export async function refreshSocialStationsData() {
  await syncFromLiveSiteNow({ full: true });
  renderSocialStationChips();
  renderSocialCanvas();
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
    const shortName = st.nome_curto || st.nome.replace(/\s*-\s*[A-Z0-9]+$/i, '').trim();
    const isOnline = st.online !== false;

    if (isSelected) {
      return `
        <button type="button" onclick="toggleStationSelection('${st.codigo}')" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#e0f2fe] text-[#0369a1] border border-[#38bdf8] flex items-center gap-1 cursor-pointer transition shadow-2xs hover:brightness-95">
          <span class="w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
          <span>${shortName}</span>
          <span class="text-[10px] opacity-75">✓</span>
        </button>
      `;
    } else {
      return `
        <button type="button" onclick="toggleStationSelection('${st.codigo}')" class="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1] line-through flex items-center gap-1 cursor-pointer transition opacity-70 hover:opacity-100">
          <span class="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
          <span>${shortName}</span>
        </button>
      `;
    }
  }).join('');
}

function updateStationsFilterButtons() {
  const btnAll = document.getElementById('social-btn-filter-all');
  const btnActive = document.getElementById('social-btn-filter-active');

  if (btnAll && btnActive) {
    if (socialState.filterMode === 'all') {
      btnAll.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#f07a53] text-white border border-[#ea580c] shadow-xs cursor-pointer flex items-center gap-1';
      btnActive.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f1f5f9] text-black hover:bg-white border border-[#cbd5e1] cursor-pointer flex items-center gap-1';
    } else if (socialState.filterMode === 'active') {
      btnActive.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#f07a53] text-white border border-[#ea580c] shadow-xs cursor-pointer flex items-center gap-1';
      btnAll.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f1f5f9] text-black hover:bg-white border border-[#cbd5e1] cursor-pointer flex items-center gap-1';
    } else {
      btnAll.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f1f5f9] text-black hover:bg-white border border-[#cbd5e1] cursor-pointer flex items-center gap-1';
      btnActive.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f1f5f9] text-black hover:bg-white border border-[#cbd5e1] cursor-pointer flex items-center gap-1';
    }
  }
}

function updateFormatButtons(activeFmt) {
  const btnPost = document.getElementById('social-btn-fmt-post');
  const btnStory = document.getElementById('social-btn-fmt-story');

  if (btnPost && btnStory) {
    if (activeFmt === 'post') {
      btnPost.className = 'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center gap-1.5';
      btnStory.className = 'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-[#f1f5f9] border border-[#cbd5e1] text-black hover:bg-white cursor-pointer flex items-center gap-1.5';
    } else {
      btnStory.className = 'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center gap-1.5';
      btnPost.className = 'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-[#f1f5f9] border border-[#cbd5e1] text-black hover:bg-white cursor-pointer flex items-center gap-1.5';
    }
  }
}

function updateHorizonButtons(activeHz) {
  const horizons = ['1h', '4h', '12h', '24h', '48h', '96h'];
  horizons.forEach(hz => {
    const btn = document.getElementById(`social-hz-btn-${hz}`);
    if (btn) {
      if (hz === activeHz) {
        btn.className = 'px-2.5 py-1 rounded-lg text-xs font-black bg-[#f07a53] text-white border border-[#ea580c] shadow-xs cursor-pointer';
      } else {
        btn.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-[#f1f5f9] text-black hover:bg-white border border-[#cbd5e1] cursor-pointer';
      }
    }
  });
}

function updateActivePill(activeHz) {
  const pill = document.getElementById('social-active-horizon-pill');
  if (pill) {
    pill.textContent = `Horizonte: ${activeHz.toUpperCase()}`;
  }
}

export function toggleOnlyActive(isChecked) {
  setSocialStationsFilter(isChecked ? 'active' : 'all');
}

/**
 * Renderiza o canvas de alta resolução com TODAS as estações selecionadas
 * e os valores REAIS de VENTO e RAJADAS do exato momento (sincronizados com os cards do site).
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
  bgGrad.addColorStop(0.5, '#041328');
  bgGrad.addColorStop(1, '#071e3b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Linhas de ondas sutis no fundo
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 194, 255, 0.05)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    const yOffset = 260 + i * 270;
    ctx.moveTo(0, yOffset);
    ctx.bezierCurveTo(width * 0.3, yOffset - 70, width * 0.7, yOffset + 70, width, yOffset);
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

  const rainStations = stations.filter(s => s.categoria !== 'inea');
  const jundiaSt = stations.find(s => s.categoria === 'inea');

  const currentHours = socialState.horizonHours || 24.0;
  rainStations.forEach(st => {
    st._activeRainVal = calculateStationRain(st, currentHours);
  });

  rainStations.sort((a, b) => b._activeRainVal - a._activeRainVal);

  let displayStations = [];
  if (jundiaSt && (!socialState.stationFilterText || socialState.stationFilterText.includes('jundi') || socialState.stationFilterText.includes('inea'))) {
    displayStations = [...rainStations, jundiaSt];
  } else {
    displayStations = [...rainStations];
  }

  // 3. Cabeçalho Oficial
  const topPad = isStory ? 120 : 65;
  const leftPad = 70;
  const rightPad = width - 70;

  ctx.fillStyle = '#00d2ff';
  ctx.beginPath();
  ctx.roundRect(leftPad, topPad, 10, isStory ? 90 : 75, 5);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = isStory ? 'bold 38px sans-serif' : 'bold 32px sans-serif';
  ctx.fillText('ACUMULADOS DE', leftPad + 24, topPad + (isStory ? 34 : 28));

  const titleGrad = ctx.createLinearGradient(leftPad + 24, topPad + 40, leftPad + 280, topPad + 95);
  titleGrad.addColorStop(0, '#5eead4');
  titleGrad.addColorStop(1, '#00c2ff');
  ctx.fillStyle = titleGrad;
  ctx.font = isStory ? '900 70px sans-serif' : '900 58px sans-serif';
  ctx.fillText('CHUVA', leftPad + 24, topPad + (isStory ? 92 : 76));

  const now = new Date();
  const dataFormatada = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const horaFormatada = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const horizonLabel = (socialState.horizon || '24h').toUpperCase();

  const subY = topPad + (isStory ? 145 : 120);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 24px sans-serif';
  const subText = socialState.filterMode === 'active' ? 'Estações Ativas com Maiores Registros' : 'Todas as Estações da Rede Municipal';
  ctx.fillText(subText, leftPad, subY);

  const metaRight = `${dataFormatada} • ${horaFormatada} • ${horizonLabel}`;
  ctx.font = 'bold 22px monospace';
  const metaW = ctx.measureText(metaRight).width;
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(metaRight, rightPad - metaW, subY);

  ctx.strokeStyle = 'rgba(0, 194, 255, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftPad, subY + 18);
  ctx.lineTo(rightPad, subY + 18);
  ctx.stroke();

  // 4. Lista das Estações
  const listStartY = subY + 32;
  const footerY = height - (isStory ? 85 : 60);
  const availableListH = footerY - listStartY - 20;
  const numStations = Math.max(displayStations.length, 1);

  const rowHeight = isStory
    ? Math.min(145, Math.floor(availableListH / numStations))
    : Math.min(108, Math.floor(availableListH / numStations));

  const midX = Math.round(width * 0.435);

  displayStations.forEach((st, idx) => {
    const rowY = listStartY + idx * rowHeight;
    const rainVal = st._activeRainVal !== undefined ? st._activeRainVal : calculateStationRain(st, currentHours);
    const rainStr = `${rainVal.toFixed(1).replace('.', ',')} mm`;

    let displayName = st.nome_curto || st.nome;
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

    // A. Coluna Esquerda: Nome e Badge
    ctx.fillStyle = '#ffffff';
    let nameFontPx = isStory ? 26 : 22;
    ctx.font = `bold ${nameFontPx}px sans-serif`;
    const maxNameW = midX - leftPad - 28;
    while (nameFontPx > 17 && ctx.measureText(displayName).width > maxNameW) {
      nameFontPx -= 1;
      ctx.font = `bold ${nameFontPx}px sans-serif`;
    }
    ctx.fillText(displayName, leftPad, rowY + (isStory ? 40 : 30));

    const badgeTxt = codeStr;
    ctx.font = isStory ? 'bold 16px monospace' : 'bold 14px monospace';
    const badgeW = ctx.measureText(badgeTxt).width + 20;
    const badgeH = isStory ? 26 : 22;
    const badgeY = rowY + (isStory ? 52 : 40);

    ctx.fillStyle = 'rgba(2, 132, 199, 0.2)';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(leftPad, badgeY, badgeW, badgeH, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(badgeTxt, leftPad + 10, badgeY + (isStory ? 18 : 15));

    // B. Coluna Central: Indicador Visual e Volume
    const isJundia = st.categoria === 'inea';
    let midColEndX = midX + 180;

    if (isJundia) {
      const riverLevel = st.nivel_rio ? String(st.nivel_rio).replace('.', ',') : '1,40 m';

      const capW = isStory ? 74 : 64;
      const capH = isStory ? 28 : 24;
      const capX = midX - 18;
      const capY = rowY + (isStory ? 38 : 28);

      const capGrad = ctx.createLinearGradient(capX, capY, capX + capW, capY);
      capGrad.addColorStop(0, '#0284c7');
      capGrad.addColorStop(1, '#00d2ff');
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.roundRect(capX, capY, capW, capH, 12);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = isStory ? '900 38px monospace' : '900 32px monospace';
      const rTxtX = capX + capW + 14;
      ctx.fillText(riverLevel, rTxtX, rowY + (isStory ? 63 : 51));
      midColEndX = rTxtX + ctx.measureText(riverLevel).width;
    } else {
      ctx.fillStyle = '#00d2ff';
      ctx.beginPath();
      ctx.arc(midX, rowY + (isStory ? 50 : 40), isStory ? 14 : 11.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = isStory ? '900 39px monospace' : '900 34px monospace';
      const rainTxtX = midX + (isStory ? 25 : 21);
      ctx.fillText(rainStr, rainTxtX, rowY + (isStory ? 63 : 51));
      midColEndX = rainTxtX + ctx.measureText(rainStr).width;
    }

    // C. Coluna Direita: VENTO E RAJADAS EM TEMPO REAL (idêntico aos valores atualizados do site)
    const windInfo = getStationWindAndGust(st, socialState.stationsData);
    const pillTxt = `vento: ${windInfo.ventoStr} • rajadas: ${windInfo.rajadaStr} km/h`;

    let pillFontPx = isStory ? 17.5 : 15.5;
    ctx.font = `bold ${pillFontPx}px monospace`;
    let pillW = ctx.measureText(pillTxt).width + 26;
    const maxPillW = Math.max(220, rightPad - (midColEndX + 18));
    while (pillFontPx > 12.5 && pillW > maxPillW) {
      pillFontPx -= 0.5;
      ctx.font = `bold ${pillFontPx}px monospace`;
      pillW = ctx.measureText(pillTxt).width + 24;
    }

    const pillH = isStory ? 42 : 36;
    const pillX = rightPad - pillW;
    const pillY = rowY + (isStory ? 32 : 24);

    ctx.fillStyle = 'rgba(7, 30, 61, 0.9)';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#7dd3fc';
    ctx.fillText(pillTxt, pillX + 12, pillY + (isStory ? 27 : 23.5));

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftPad, rowY + rowHeight - 4);
    ctx.lineTo(rightPad, rowY + rowHeight - 4);
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
  ctx.fillText('Fontes: Estações de cada bairro • Rio das Ostras - RJ', leftPad, footerY + (isStory ? 26 : 22));

  const previewImg = document.getElementById('social-preview-image');
  if (previewImg) {
    previewImg.src = canvas.toDataURL('image/png');
  }
}

/**
 * Faz download da imagem sincronizando antes com os valores reais do site naquele exato momento
 */
export async function downloadSocialCard() {
  await syncFromLiveSiteNow({ full: false });
  renderSocialCanvas();

  const canvas = document.getElementById('social-export-canvas');
  if (!canvas) return;

  const fmtName = socialState.format === 'story' ? 'story' : 'post';
  const horizonName = socialState.horizon;
  const fileName = `acumulados_chuva_${horizonName}_${fmtName}_riodasostras.png`;

  const link = document.createElement('a');
  link.download = fileName;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Baixa diretamente o card no formato especificado ('post' ou 'story'),
 * consultando primeiro os ventos e rajadas em tempo real atualizados no site.
 */
export async function downloadSocialFormat(format) {
  if (format && (format === 'post' || format === 'story')) {
    socialState.format = format;
    updateFormatButtons(format);
  }
  await syncFromLiveSiteNow({ full: false });
  renderSocialCanvas();
  await new Promise(resolve => setTimeout(resolve, 40));

  const canvas = document.getElementById('social-export-canvas');
  if (!canvas) return;

  const fmtName = socialState.format === 'story' ? 'story' : 'post';
  const horizonName = socialState.horizon;
  const fileName = `acumulados_chuva_${horizonName}_${fmtName}_riodasostras.png`;

  const link = document.createElement('a');
  link.download = fileName;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

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
  window.refreshSocialStationsData = refreshSocialStationsData;
  window.downloadSocialCard = downloadSocialCard;
  window.downloadSocialFormat = downloadSocialFormat;
  window.getStationWindAndGust = getStationWindAndGust;
}
