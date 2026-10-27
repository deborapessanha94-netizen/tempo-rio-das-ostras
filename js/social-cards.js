/**
 * Gerador de Imagens para Redes Sociais (Post Feed & Stories do Instagram)
 * Baseado no modelo oficial de referência com design escuro profissional,
 * tipografia legível de alto contraste e sem menção a Defesa Civil.
 * Canal Oficial: @tempoemriodasostras
 */

let socialState = {
  format: 'post', // 'post' (1080x1350) ou 'story' (1080x1920)
  horizon: '24h', // label do horizonte: '24h', '23h', '12h', etc.
  horizonHours: 24.0, // valor numérico em horas para cálculo em tempo real
  filterMode: 'all', // 'all' (todas as 10) ou 'active' (apenas ativas)
  selectedStationCodes: new Set(),
  stationFilterText: '',
  stationsData: []
};

/**
 * Retorna vento e rajada para qualquer estação, utilizando medição direta
 * ou inferência georreferenciada da rede municipal para estações puramente pluviométricas
 */
export function getStationWindAndGust(st, allStations) {
  const stationsList = allStations || socialState.stationsData || [];

  if (st.vento_atual !== null && st.vento_atual !== undefined && !isNaN(Number(st.vento_atual))) {
    const v = Math.round(Number(st.vento_atual));
    const r = (st.rajada_atual !== null && st.rajada_atual !== undefined && !isNaN(Number(st.rajada_atual)))
      ? Math.round(Number(st.rajada_atual))
      : v;
    const rMax = (st.rajada_max_24h !== null && st.rajada_max_24h !== undefined && !isNaN(Number(st.rajada_max_24h)))
      ? Math.round(Number(st.rajada_max_24h))
      : Math.max(r, v);
    const vMax = (st.vento_max_24h !== null && st.vento_max_24h !== undefined && !isNaN(Number(st.vento_max_24h)))
      ? Math.round(Number(st.vento_max_24h))
      : v;
    return { vento: v, rajada: r, vento_max: vMax, rajada_max: rMax };
  }

  // Se for Rio Jundiá (Cantagalo), usa o vento da estação Cantagalo (IRIODA16)
  if (st.categoria === 'inea') {
    const canta = stationsList.find(s => s.codigo === 'IRIODA16');
    if (canta && canta.vento_atual !== null && canta.vento_atual !== undefined) {
      const v = Math.round(Number(canta.vento_atual));
      const r = Math.round(Number(canta.rajada_atual || canta.vento_atual));
      const rMax = Math.round(Number(canta.rajada_max_24h || r));
      const vMax = Math.round(Number(canta.vento_max_24h || v));
      return { vento: v, rajada: r, vento_max: vMax, rajada_max: rMax };
    }
  }

  // Se for PCD Palmital (Encostas), usa Rocha Leão (IRIODA15) mais próximo
  if (st.codigo && String(st.codigo).includes('187')) {
    const rocha = stationsList.find(s => s.codigo === 'IRIODA15');
    if (rocha && rocha.vento_atual !== null && rocha.vento_atual !== undefined) {
      const v = Math.round(Number(rocha.vento_atual));
      const r = Math.round(Number(rocha.rajada_atual || rocha.vento_atual));
      const rMax = Math.round(Number(rocha.rajada_max_24h || r));
      const vMax = Math.round(Number(rocha.vento_max_24h || v));
      return { vento: v, rajada: r, vento_max: vMax, rajada_max: rMax };
    }
  }

  // Média regional das estações PWS ativas com anemômetro
  const withWind = stationsList.filter(s => s.vento_atual !== null && s.vento_atual !== undefined && !isNaN(Number(s.vento_atual)));
  if (withWind.length > 0) {
    const avgV = Math.round(withWind.reduce((acc, s) => acc + Number(s.vento_atual), 0) / withWind.length);
    const avgR = Math.round(withWind.reduce((acc, s) => acc + Number(s.rajada_atual || s.vento_atual), 0) / withWind.length);
    const avgRMax = Math.round(withWind.reduce((acc, s) => acc + Number(s.rajada_max_24h || s.rajada_atual || s.vento_atual), 0) / withWind.length);
    const avgVMax = Math.round(withWind.reduce((acc, s) => acc + Number(s.vento_max_24h || s.vento_atual), 0) / withWind.length);
    return { vento: avgV, rajada: avgR, vento_max: avgVMax, rajada_max: avgRMax };
  }

  return { vento: 5, rajada: 12, vento_max: 20, rajada_max: 30 };
}

/**
 * Inicializa os dados das estações
 */
export function setSocialStationsData(data) {
  if (!data) return;
  if (Array.isArray(data)) {
    socialState.stationsData = data;
  } else if (data.estacoes && Array.isArray(data.estacoes)) {
    socialState.stationsData = data.estacoes;
  }

  // Se o conjunto de selecionadas estiver vazio, seleciona todas por padrão
  if (socialState.selectedStationCodes.size === 0 && socialState.stationsData.length > 0) {
    socialState.stationsData.forEach(s => {
      if (s.codigo) socialState.selectedStationCodes.add(s.codigo);
    });
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

  // 1. Dias (ex: '2 dias', '2d', '3 dias', '1 dia')
  const dayMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:dias?|d\b)/i);
  if (dayMatch) {
    const dVal = parseFloat(dayMatch[1].replace(',', '.'));
    const hVal = Math.round(dVal * 24 * 10) / 10;
    const residual = clean.replace(dayMatch[0], '').trim();
    const label = Number.isInteger(hVal) ? `${hVal}H` : `${hVal.toFixed(1)}H`;
    return { isHorizon: true, hours: hVal, horizonLabel: label, stationFilter: residual };
  }

  // 2. Intervalo de horas (ex: 'das 10h às 18h', '10-18', '10 as 18')
  const rangeMatch = clean.match(/(?:das\s*)?(\d{1,2})h?\s*(?:as|às|a|-)\s*(\d{1,2})h?/i);
  if (rangeMatch) {
    const h1 = parseFloat(rangeMatch[1]);
    const h2 = parseFloat(rangeMatch[2]);
    const diff = Math.max(1, Math.abs(h2 - h1));
    const residual = clean.replace(rangeMatch[0], '').trim();
    return { isHorizon: true, hours: diff, horizonLabel: `${diff}H`, stationFilter: residual };
  }

  // 3. Horas diretas (ex: '23', '23h', '23 horas', '1.5h', '8 hrs')
  const hourMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:h(?:oras?|rs?)?\b)?/i);
  if (hourMatch && hourMatch[1]) {
    const hVal = parseFloat(hourMatch[1].replace(',', '.'));
    const residual = clean.replace(hourMatch[0], '').trim();
    const label = Number.isInteger(hVal) ? `${hVal}H` : `${hVal.toFixed(1)}H`;
    return { isHorizon: true, hours: Math.max(0.1, hVal), horizonLabel: label, stationFilter: residual };
  }

  // 4. Pesquisa por nome da estação
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
 * Abre o modal de exportação de chuva
 */
export async function openSocialModalChuva(initialHorizon = '24h') {
  const modal = document.getElementById('modal-social-chuva');
  if (!modal) return;

  const parsed = parseUserQuery(initialHorizon);
  socialState.horizon = parsed.horizonLabel.toLowerCase();
  socialState.horizonHours = parsed.hours;
  socialState.stationFilterText = '';

  if (!socialState.stationsData || socialState.stationsData.length === 0) {
    await refreshSocialStationsData();
  }

  // Garante que todas as estações estão carregadas e selecionadas por padrão
  if (socialState.selectedStationCodes.size === 0 && socialState.stationsData.length > 0) {
    socialState.stationsData.forEach(s => {
      if (s.codigo) socialState.selectedStationCodes.add(s.codigo);
    });
  }

  // Sincroniza controles da UI
  const searchInput = document.getElementById('social-horizon-search');
  if (searchInput) searchInput.value = socialState.horizon;

  updateHorizonButtons(socialState.horizon);
  updateActivePill(socialState.horizon);
  updateFormatButtons(socialState.format);
  updateStationsFilterButtons();
  renderSocialStationChips();

  modal.classList.remove('hidden');
  modal.classList.add('flex');

  // Renderiza o card imediatamente
  renderSocialCanvas();

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Fecha o modal
 */
export function closeSocialModalChuva() {
  const modal = document.getElementById('modal-social-chuva');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

/**
 * Alterna entre formato Post e Story
 */
export function setSocialFormat(format) {
  socialState.format = format;
  updateFormatButtons(format);
  renderSocialCanvas();
}

/**
 * Define o horizonte de tempo via atalho (ex: '1h', '24h')
 */
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

/**
 * Manipula a busca por texto do horizonte ou estação
 */
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

/**
 * Define o modo de filtro das estações ('all' para todas as 10 ou 'active' para apenas online)
 */
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

/**
 * Alterna individualmente a seleção de uma estação
 */
export function toggleStationSelection(code) {
  if (socialState.selectedStationCodes.has(code)) {
    socialState.selectedStationCodes.delete(code);
  } else {
    socialState.selectedStationCodes.add(code);
  }

  // Se todas estão selecionadas ou só as ativas, ajusta filterMode
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
 * Atualiza medições em tempo real buscando o JSON mais recente
 */
export async function refreshSocialStationsData() {
  const ts = Date.now();
  try {
    const res = await fetch(`./data/acumulados_estacoes.json?t=${ts}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setSocialStationsData(data);
    }
  } catch (e) {
    console.warn("Falha ao recarregar estações em tempo real:", e);
  }

  renderSocialStationChips();
  renderSocialCanvas();
}

/**
 * Renderiza os chips de alternância rápida de cada estação no modal
 */
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

/**
 * Compatibilidade legada para o checkbox de ativas
 */
export function toggleOnlyActive(isChecked) {
  setSocialStationsFilter(isChecked ? 'active' : 'all');
}

/**
 * Renderiza o canvas de alta resolução com TODAS as estações e VENTO/RAJADAS
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

  // Aplica filtro de seleção individual ou modo ativo
  if (socialState.selectedStationCodes && socialState.selectedStationCodes.size > 0) {
    stations = stations.filter(s => socialState.selectedStationCodes.has(s.codigo));
  } else if (socialState.filterMode === 'active') {
    stations = stations.filter(s => s.online !== false);
  }

  // Filtro de busca textual se houver
  if (socialState.stationFilterText) {
    const q = socialState.stationFilterText.toLowerCase();
    stations = stations.filter(s =>
      (s.nome && s.nome.toLowerCase().includes(q)) ||
      (s.bairro && s.bairro.toLowerCase().includes(q)) ||
      (s.codigo && s.codigo.toLowerCase().includes(q))
    );
  }

  // Separa estações pluviométricas de chuva e hidrológica do Rio Jundiá
  const rainStations = stations.filter(s => s.categoria !== 'inea');
  const jundiaSt = stations.find(s => s.categoria === 'inea');

  // Calcula o valor de chuva NA HORA para o horizonte ativo em horas
  const currentHours = socialState.horizonHours || 24.0;
  rainStations.forEach(st => {
    st._activeRainVal = calculateStationRain(st, currentHours);
  });

  // Ordena da maior para a menor chuva
  rainStations.sort((a, b) => b._activeRainVal - a._activeRainVal);

  // CONSTRÓI O ARRAY COMPLETO SEM TRUNCAR (Exibe TODAS as estações selecionadas!)
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

  // Barra de acento ciano à esquerda do título
  ctx.fillStyle = '#00d2ff';
  ctx.beginPath();
  ctx.roundRect(leftPad, topPad, 10, isStory ? 90 : 75, 5);
  ctx.fill();

  // "ACUMULADOS DE"
  ctx.fillStyle = '#ffffff';
  ctx.font = isStory ? 'bold 38px sans-serif' : 'bold 32px sans-serif';
  ctx.fillText('ACUMULADOS DE', leftPad + 24, topPad + (isStory ? 34 : 28));

  // "CHUVA" em Ciano Elétrico Grande
  const titleGrad = ctx.createLinearGradient(leftPad + 24, topPad + 40, leftPad + 280, topPad + 95);
  titleGrad.addColorStop(0, '#5eead4');
  titleGrad.addColorStop(1, '#00c2ff');
  ctx.fillStyle = titleGrad;
  ctx.font = isStory ? '900 70px sans-serif' : '900 58px sans-serif';
  ctx.fillText('CHUVA', leftPad + 24, topPad + (isStory ? 92 : 76));

  // Subtítulo e Carimbo de Data/Hora à Direita
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

  // Linha horizontal abaixo do cabeçalho
  ctx.strokeStyle = 'rgba(0, 194, 255, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftPad, subY + 18);
  ctx.lineTo(rightPad, subY + 18);
  ctx.stroke();

  // 4. Lista das Estações (Dimensionamento Dinâmico para comportar TODAS)
  const listStartY = subY + 32;
  const footerY = height - (isStory ? 85 : 60);
  const availableListH = footerY - listStartY - 20;
  const numStations = Math.max(displayStations.length, 1);

  // Calcula a altura exata de cada linha para caberem TODAS as 10 estações
  const rowHeight = isStory
    ? Math.min(145, Math.floor(availableListH / numStations))
    : Math.min(108, Math.floor(availableListH / numStations));

  displayStations.forEach((st, idx) => {
    const rowY = listStartY + idx * rowHeight;
    const rainVal = st._activeRainVal !== undefined ? st._activeRainVal : calculateStationRain(st, currentHours);
    const rainStr = `${rainVal.toFixed(1).replace('.', ',')} mm`;

    // Nome Amigável / Limpo da Estação
    let displayName = st.nome_curto || st.nome;
    displayName = displayName
      .replace(/defesa civil municipal\s*(\(tartaruga\))?/gi, 'Praia da Tartaruga')
      .replace(/defesa civil/gi, '')
      .replace(/\s*-\s*[A-Z0-9]+$/i, '')
      .trim();

    // Rede e Código
    let codeStr = st.codigo || '';
    if (st.categoria === 'cemaden') {
      codeStr = `PCD ${st.codigo.replace(/[^0-9]/g, '')}`;
    } else if (st.categoria === 'inea') {
      codeStr = 'INEA 2241036';
    }

    // A. Coluna Esquerda: Nome e Badge
    ctx.fillStyle = '#ffffff';
    ctx.font = isStory ? 'bold 28px sans-serif' : 'bold 23px sans-serif';
    ctx.fillText(displayName, leftPad, rowY + (isStory ? 40 : 30));

    // Badge Retangular Arredondado com o Código
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
    const midX = width * 0.47;
    const isJundia = st.categoria === 'inea';

    if (isJundia) {
      // Para o Rio Jundiá: NÍVEL DO RIO com cápsula visual
      const riverLevel = st.nivel_rio ? st.nivel_rio.replace('.', ',') : '1,59 m';

      const capW = isStory ? 80 : 70;
      const capH = isStory ? 30 : 26;
      const capX = midX - 30;
      const capY = rowY + (isStory ? 38 : 28);

      const capGrad = ctx.createLinearGradient(capX, capY, capX + capW, capY);
      capGrad.addColorStop(0, '#0284c7');
      capGrad.addColorStop(1, '#00d2ff');
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.roundRect(capX, capY, capW, capH, 13);
      ctx.fill();

      // Nível do Rio em metros (ex: 1,59 m)
      ctx.fillStyle = '#ffffff';
      ctx.font = isStory ? '900 40px monospace' : '900 33px monospace';
      ctx.fillText(riverLevel, capX + capW + 16, rowY + (isStory ? 64 : 52));
    } else {
      // Para Estações Pluviométricas: Círculo Ciano + Volume mm
      ctx.fillStyle = '#00d2ff';
      ctx.beginPath();
      ctx.arc(midX, rowY + (isStory ? 50 : 40), isStory ? 15 : 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = isStory ? '900 42px monospace' : '900 35px monospace';
      ctx.fillText(rainStr, midX + (isStory ? 28 : 22), rowY + (isStory ? 64 : 52));
    }

    // C. Coluna Direita: VENTO E RAJADA (Nunca exibe "ativa"!)
    const windInfo = getStationWindAndGust(st, socialState.stationsData);
    const pillTxt = `agora: ${windInfo.vento} • raj máx: ${windInfo.rajada_max} km/h`;

    ctx.font = isStory ? 'bold 19px monospace' : 'bold 16px monospace';
    const pillW = ctx.measureText(pillTxt).width + 30;
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
    ctx.fillText(pillTxt, pillX + 15, pillY + (isStory ? 27 : 24));

    // Linha divisória suave abaixo da linha
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftPad, rowY + rowHeight - 4);
    ctx.lineTo(rightPad, rowY + rowHeight - 4);
    ctx.stroke();
  });

  // 5. Rodapé Oficial
  // Barra de acento ciano horizontal
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

  // Atualiza a imagem de pré-visualização no DOM
  const previewImg = document.getElementById('social-preview-image');
  if (previewImg) {
    previewImg.src = canvas.toDataURL('image/png');
  }
}

/**
 * Faz download da imagem gerada no canvas
 */
export function downloadSocialCard() {
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

// Expõe funções globalmente para interações do HTML
if (typeof window !== 'undefined') {
  window.openSocialModalChuva = openSocialModalChuva;
  window.closeSocialModalChuva = closeSocialModalChuva;
  window.setSocialFormat = setSocialFormat;
  window.setSocialHorizon = setSocialHorizon;
  window.handleSocialSearch = handleSocialSearch;
  window.toggleOnlyActive = toggleOnlyActive;
  window.setSocialStationsFilter = setSocialStationsFilter;
  window.toggleStationSelection = toggleStationSelection;
  window.refreshSocialStationsData = refreshSocialStationsData;
  window.downloadSocialCard = downloadSocialCard;
  window.getStationWindAndGust = getStationWindAndGust;
}
