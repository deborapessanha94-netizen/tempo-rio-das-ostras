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
  onlyActive: true,
  stationFilterText: '',
  stationsData: []
};

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
}

/**
 * Parser inteligente de busca por horizonte ou estação:
 * - Se o usuário digita números (ex: '23', '23h', '8 horas', '2 dias', '3d', '10-18'), extrai o horizonte de horas.
 * - Se digita nome de bairro/estação (ex: 'tartaruga', 'palmital'), extrai o filtro de texto.
 */
function parseUserQuery(query) {
  const clean = String(query || '').trim().toLowerCase();
  if (!clean) {
    return { isHorizon: false, hours: 24.0, horizonLabel: '24H', stationFilter: '' };
  }

  // 1. Dias (ex: '2 dias', '2d', '3 dias', '1 dia')
  const dayMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:dias?|d)/i);
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
  const hourMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:h(?:oras?|rs?)?)?/i);
  if (hourMatch && hourMatch[1]) {
    const hVal = parseFloat(hourMatch[1].replace(',', '.'));
    const residual = clean.replace(hourMatch[0], '').trim();
    const label = Number.isInteger(hVal) ? `${hVal}H` : `${hVal.toFixed(1)}H`;
    return { isHorizon: true, hours: Math.max(0.1, hVal), horizonLabel: label, stationFilter: residual };
  }

  // 4. Se não digitou número nenhum (ex: 'tartaruga', 'palmital', 'online'), pesquisa por nome da estação
  return { isHorizon: false, hours: socialState.horizonHours || 24.0, horizonLabel: (socialState.horizon || '24h').toUpperCase(), stationFilter: clean };
}

/**
 * Calcula NA HORA o volume de chuva de qualquer estação para QUALQUER horizonte de horas H (ex: 23h, 8h, 72h)
 * através da curva oficial multi-âncora de precipitação acumulada das estações.
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

  if (hours <= 0) return 0.0;
  if (hours >= 96.0) return Number(c96.toFixed(1));

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (hours >= p1.h && hours <= p2.h) {
      if (p2.h === p1.h) return Number(p1.v.toFixed(1));
      const t = (hours - p1.h) / (p2.h - p1.h);
      const val = p1.v + t * (p2.v - p1.v);
      return Number(val.toFixed(1));
    }
  }

  return Number(c24.toFixed(1));
}

/**
 * Abre o modal de exportação para redes sociais
 */
export function openSocialModalChuva(initialHorizon = '24h') {
  const modal = document.getElementById('modal-social-chuva');
  if (!modal) return;

  const parsed = parseUserQuery(initialHorizon);
  socialState.horizon = parsed.horizonLabel.toLowerCase();
  socialState.horizonHours = parsed.hours;
  socialState.stationFilterText = '';

  // Sincroniza controles da UI
  const searchInput = document.getElementById('social-horizon-search');
  if (searchInput) searchInput.value = socialState.horizon;

  const activeCheck = document.getElementById('social-filter-active-only');
  if (activeCheck) activeCheck.checked = socialState.onlyActive;

  updateHorizonButtons(socialState.horizon);
  updateActivePill(socialState.horizon);
  updateFormatButtons(socialState.format);

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
 * Manipula a busca por texto do horizonte ou estação NA HORA em tempo real
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
 * Alterna o filtro de apenas ativas
 */
export function toggleOnlyActive(isChecked) {
  socialState.onlyActive = isChecked;
  renderSocialCanvas();
}

function updateFormatButtons(activeFmt) {
  const btnPost = document.getElementById('social-btn-fmt-post');
  const btnStory = document.getElementById('social-btn-fmt-story');

  if (btnPost && btnStory) {
    if (activeFmt === 'post') {
      btnPost.className = 'px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center gap-2';
      btnStory.className = 'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#f1f5f9] border border-[#cbd5e1] text-black hover:bg-white cursor-pointer flex items-center gap-2';
    } else {
      btnStory.className = 'px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center gap-2';
      btnPost.className = 'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#f1f5f9] border border-[#cbd5e1] text-black hover:bg-white cursor-pointer flex items-center gap-2';
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
 * Renderiza o canvas de alta resolução
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
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    const yOffset = 300 + i * 280;
    ctx.moveTo(0, yOffset);
    ctx.bezierCurveTo(width * 0.3, yOffset - 80, width * 0.7, yOffset + 80, width, yOffset);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Filtra e Ordena as Estações
  let stations = [...socialState.stationsData];

  // Filtro de apenas ativas
  if (socialState.onlyActive) {
    stations = stations.filter(s => s.online !== false);
  }

  // Filtro de busca textual por nome de estação se digitado
  if (socialState.stationFilterText) {
    const q = socialState.stationFilterText.toLowerCase();
    stations = stations.filter(s => 
      (s.nome && s.nome.toLowerCase().includes(q)) ||
      (s.bairro && s.bairro.toLowerCase().includes(q)) ||
      (s.codigo && s.codigo.toLowerCase().includes(q))
    );
  }

  // Separa as estações pluviométricas (chuva) da estação hidrológica (Rio Jundiá - nível do rio)
  const rainStations = stations.filter(s => s.categoria !== 'inea');
  const jundiaSt = stations.find(s => s.categoria === 'inea');

  // Calcula o valor de chuva NA HORA para o horizonte ativo em horas
  const currentHours = socialState.horizonHours || 24.0;
  rainStations.forEach(st => {
    st._activeRainVal = calculateStationRain(st, currentHours);
  });

  // Ordena rigorosamente as estações de chuva da MAIOR para a MENOR em volume no horizonte pesquisado
  rainStations.sort((a, b) => b._activeRainVal - a._activeRainVal);

  // Limite de itens na tela para manter tipografia grande e respiração visual
  const maxItems = isStory ? 9 : 6;
  let displayStations = [];

  // Se busca textual ativa para Jundiá ou nenhuma busca restritiva, exibe Jundiá ao final com sua cota
  if (jundiaSt && (!socialState.stationFilterText || socialState.stationFilterText.includes('jundi') || socialState.stationFilterText.includes('inea'))) {
    displayStations = [...rainStations.slice(0, maxItems - 1), jundiaSt];
  } else {
    displayStations = rainStations.slice(0, maxItems);
  }

  // 3. Cabeçalho Oficial
  const topPad = isStory ? 160 : 100;
  const leftPad = 80;
  const rightPad = width - 80;

  // Barra de acento ciano à esquerda do título
  ctx.fillStyle = '#00d2ff';
  ctx.beginPath();
  ctx.roundRect(leftPad, topPad, 12, 100, 6);
  ctx.fill();

  // "ACUMULADOS DE"
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('ACUMULADOS DE', leftPad + 28, topPad + 40);

  // "CHUVA" em Ciano Elétrico Grande
  const titleGrad = ctx.createLinearGradient(leftPad + 28, topPad + 45, leftPad + 300, topPad + 105);
  titleGrad.addColorStop(0, '#5eead4');
  titleGrad.addColorStop(1, '#00c2ff');
  ctx.fillStyle = titleGrad;
  ctx.font = '900 78px sans-serif';
  ctx.fillText('CHUVA', leftPad + 28, topPad + 105);

  // Subtítulo e Carimbo de Data/Hora à Direita
  const now = new Date();
  const dataFormatada = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const horaFormatada = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const horizonLabel = socialState.horizon.toUpperCase();

  const subY = topPad + 165;
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 28px sans-serif';
  ctx.fillText('Estações com maiores registros', leftPad, subY);

  const metaTxt = `${dataFormatada} • ${horaFormatada} • ${horizonLabel}`;
  ctx.font = 'bold 26px monospace';
  ctx.fillStyle = '#94a3b8';
  const metaWidth = ctx.measureText(metaTxt).width;
  ctx.fillText(metaTxt, rightPad - metaWidth, subY);

  // Linha separadora suave
  ctx.strokeStyle = 'rgba(0, 210, 255, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftPad, subY + 25);
  ctx.lineTo(rightPad, subY + 25);
  ctx.stroke();

  // 4. Lista das Estações (Formato de Lista Limpa)
  const listStartY = subY + 55;
  const availableH = height - listStartY - (isStory ? 200 : 160);
  const rowHeight = Math.min(isStory ? 145 : 155, availableH / Math.max(displayStations.length, 1));

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
    let redeTag = 'PWS';
    let codeStr = st.codigo || '';
    if (st.categoria === 'cemaden') {
      redeTag = 'CEMADEN';
      codeStr = `PCD ${st.codigo.replace(/[^0-9]/g, '')}`;
    } else if (st.categoria === 'inea') {
      redeTag = 'INEA ALERTA DE CHEIAS • NÍVEL DO RIO';
      codeStr = 'INEA 2241036';
    } else {
      redeTag = 'WEATHER UNDERGROUND';
    }

    // A. Coluna Esquerda: Nome e Badge
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 29px sans-serif';
    ctx.fillText(displayName, leftPad, rowY + 36);

    // Badge Retangular Arredondado com o Código
    const badgeTxt = codeStr;
    ctx.font = 'bold 18px monospace';
    const badgeW = ctx.measureText(badgeTxt).width + 24;
    const badgeH = 28;
    const badgeY = rowY + 50;

    ctx.fillStyle = 'rgba(2, 132, 199, 0.2)';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(leftPad, badgeY, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(badgeTxt, leftPad + 12, badgeY + 20);

    // B. Coluna Central: Indicador Visual e Volume
    const midX = width * 0.54;
    const isJundia = st.categoria === 'inea';

    if (isJundia) {
      // Para o Rio Jundiá: NÃO é acumulado em mm, é NÍVEL DO RIO em metros com cápsula de água
      const riverLevel = st.nivel_rio ? st.nivel_rio.replace('.', ',') : '1,59 m';

      const capW = 95;
      const capH = 34;
      const capX = midX - 35;
      const capY = rowY + 39;

      const capGrad = ctx.createLinearGradient(capX, capY, capX + capW, capY);
      capGrad.addColorStop(0, '#0284c7');
      capGrad.addColorStop(1, '#00d2ff');
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.roundRect(capX, capY, capW, capH, 17);
      ctx.fill();

      // Nível do Rio em metros (ex: 1,59 m)
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px monospace';
      ctx.fillText(riverLevel, capX + capW + 20, rowY + 70);
    } else {
      // Para Estações Pluviométricas: Círculo Ciano + Volume mm
      ctx.fillStyle = '#00d2ff';
      ctx.beginPath();
      ctx.arc(midX, rowY + 56, 17, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px monospace';
      ctx.fillText(rainStr, midX + 32, rowY + 70);
    }

    // C. Coluna Direita: Pílula Informativa de Status
    const pillTxt = isJundia 
      ? `cota rio: ${st.nivel_rio || '1,59 m'}`
      : (st.vento_atual ? `vento: ${st.vento_atual} km/h` : 'ativa');
    
    ctx.font = 'bold 20px monospace';
    const pillW = ctx.measureText(pillTxt).width + 36;
    const pillH = 46;
    const pillX = rightPad - pillW;
    const pillY = rowY + 35;

    ctx.fillStyle = 'rgba(7, 30, 61, 0.85)';
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#7dd3fc';
    ctx.fillText(pillTxt, pillX + 18, pillY + 30);

    // Linha divisória suave abaixo da linha
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftPad, rowY + rowHeight - 8);
    ctx.lineTo(rightPad, rowY + rowHeight - 8);
    ctx.stroke();
  });

  // 5. Rodapé Oficial
  const footerY = height - (isStory ? 100 : 70);

  // Barra de acento ciano horizontal
  ctx.fillStyle = '#00d2ff';
  ctx.beginPath();
  ctx.roundRect(leftPad, footerY - 45, width - 160, 2, 1);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('@tempoemriodasostras', leftPad, footerY);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 20px sans-serif';
  ctx.fillText('Fontes: Estações de cada bairro • Rio das Ostras - RJ', leftPad, footerY + 28);

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
  window.downloadSocialCard = downloadSocialCard;
}
