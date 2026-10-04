/**
 * Módulo Avançado de Radar Meteorológico & Estação Multivariáveis (RJ)
 * Cobre Precipitação, Ventos com Rajadas, Pressão com Isobaras e Radar Doppler
 * Especializado para o Estado do Rio de Janeiro e Bacia de Rio das Ostras
 */

import { getRainViewerData, RIO_DAS_OSTRAS_COORDS } from './api.js';

// Coordenadas Centrais Estratégicas
const RJ_CENTER = { lat: -22.50, lon: -42.80, zoom: 8 };
const RO_CENTER = { lat: -22.527, lon: -41.945, zoom: 11 };

// Radares Oficiais do Estado do RJ
const RJ_RADARS = [
  {
    nome: 'Radar Pico do Couto (REDEMET / DECEA)',
    coords: [-22.463, -43.298],
    alcanceKm: 250,
    cor: '#1E88E5',
    detalhes: 'Banda S • 100% de cobertura do Estado do RJ, Região Serrana e Baixada'
  },
  {
    nome: 'Radar Macaé (INEA / Petrobras)',
    coords: [-22.376, -41.786],
    alcanceKm: 120,
    cor: '#0D9488',
    detalhes: 'Banda X/C • Foco na Bacia dos Rios Macaé e Ostras e Litoral Norte'
  },
  {
    nome: 'Radar Sumaré / Guaratiba (AlertaRio)',
    coords: [-22.951, -43.238],
    alcanceKm: 150,
    cor: '#7C3AED',
    detalhes: 'Banda C • Região Metropolitana, Baía de Guanabara e Costa Verde'
  }
];

let map = null;
let markerRO = null;
let radarCircles = [];
let radarLayers = [];
let currentFrameIndex = 0;
let animationTimer = null;
let isPlaying = false;
let radarData = null;

let currentMode = 'windy'; // 'windy' | 'doppler'
let currentLayer = 'radar'; // 'radar' | 'rain' | 'wind' | 'pressure' | 'satellite' | 'waves'
let currentScope = 'rj';   // 'rj' | 'ro'

/**
 * Inicialização completa da estação de radar e camadas
 */
export async function initRadarMap(containerId = 'radar-map') {
  setupInteractiveControls();
  await initLeafletRadar(containerId);
}

export async function initRadarModule() {
  await initRadarMap('radar-map');
}

/**
 * Configura os botões de alternância de modo, variáveis e enquadramento geográfico
 */
function setupInteractiveControls() {
  // 1. Alternador de Modo (Multivariáveis vs Doppler)
  const btnModeMulti = document.getElementById('btn-mode-multivariable');
  const btnModeDoppler = document.getElementById('btn-mode-doppler');
  const windyWrapper = document.getElementById('windy-wrapper');
  const leafletWrapper = document.getElementById('leaflet-wrapper');

  if (btnModeMulti && !btnModeMulti.dataset.bound) {
    btnModeMulti.dataset.bound = 'true';
    btnModeMulti.addEventListener('click', () => {
      currentMode = 'windy';
      btnModeMulti.classList.add('bg-[#1E88E5]', 'text-white', 'font-bold', 'shadow-xs');
      btnModeMulti.classList.remove('theme-text-muted', 'font-medium');
      btnModeDoppler.classList.remove('bg-[#1E88E5]', 'text-white', 'font-bold', 'shadow-xs');
      btnModeDoppler.classList.add('theme-text-muted', 'font-medium');

      if (windyWrapper) windyWrapper.classList.remove('hidden');
      if (leafletWrapper) leafletWrapper.classList.add('hidden');
      updateWindyIframe();
    });
  }

  if (btnModeDoppler && !btnModeDoppler.dataset.bound) {
    btnModeDoppler.dataset.bound = 'true';
    btnModeDoppler.addEventListener('click', () => {
      currentMode = 'doppler';
      btnModeDoppler.classList.add('bg-[#1E88E5]', 'text-white', 'font-bold', 'shadow-xs');
      btnModeDoppler.classList.remove('theme-text-muted', 'font-medium');
      btnModeMulti.classList.remove('bg-[#1E88E5]', 'text-white', 'font-bold', 'shadow-xs');
      btnModeMulti.classList.add('theme-text-muted', 'font-medium');

      if (leafletWrapper) leafletWrapper.classList.remove('hidden');
      if (windyWrapper) windyWrapper.classList.add('hidden');

      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 150);
    });
  }

  // 2. Alternador de Camadas (Precipitação, Vento, Pressão, Radar, Satélite, Ondas)
  const layerButtons = document.querySelectorAll('.layer-switch-btn');
  layerButtons.forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', () => {
      const selectedLayer = btn.getAttribute('data-layer');
      if (!selectedLayer) return;

      currentLayer = selectedLayer;

      // Atualiza botões
      layerButtons.forEach(b => {
        b.classList.remove('active', 'bg-[#1E88E5]', 'text-white', 'font-semibold');
        b.classList.add('theme-text-muted', 'font-medium');
      });
      btn.classList.add('active', 'bg-[#1E88E5]', 'text-white', 'font-semibold');
      btn.classList.remove('theme-text-muted', 'font-medium');

      // Se estiver no modo Doppler e selecionar uma camada que não é radar de chuva,
      // alterna automaticamente para o visualizador multivariáveis para mostrar com fidelidade
      if (currentMode === 'doppler' && selectedLayer !== 'radar') {
        if (btnModeMulti) btnModeMulti.click();
      } else {
        updateWindyIframe();
      }
    });
  });

  // 3. Alternador de Enquadramento Geográfico (Todo o RJ vs Rio das Ostras)
  const btnScopeRj = document.getElementById('btn-scope-rj');
  const btnScopeRo = document.getElementById('btn-scope-ro');

  if (btnScopeRj && !btnScopeRj.dataset.bound) {
    btnScopeRj.dataset.bound = 'true';
    btnScopeRj.addEventListener('click', () => {
      currentScope = 'rj';
      btnScopeRj.classList.add('bg-[#1E88E5]/15', 'text-[#1E88E5]', 'font-bold');
      btnScopeRj.classList.remove('theme-text-muted', 'font-medium');
      btnScopeRo.classList.remove('bg-[#1E88E5]/15', 'text-[#1E88E5]', 'font-bold');
      btnScopeRo.classList.add('theme-text-muted', 'font-medium');

      if (map) map.setView([RJ_CENTER.lat, RJ_CENTER.lon], RJ_CENTER.zoom);
      updateWindyIframe();
    });
  }

  if (btnScopeRo && !btnScopeRo.dataset.bound) {
    btnScopeRo.dataset.bound = 'true';
    btnScopeRo.addEventListener('click', () => {
      currentScope = 'ro';
      btnScopeRo.classList.add('bg-[#1E88E5]/15', 'text-[#1E88E5]', 'font-bold');
      btnScopeRo.classList.remove('theme-text-muted', 'font-medium');
      btnScopeRj.classList.remove('bg-[#1E88E5]/15', 'text-[#1E88E5]', 'font-bold');
      btnScopeRj.classList.add('theme-text-muted', 'font-medium');

      if (map) map.setView([RO_CENTER.lat, RO_CENTER.lon], RO_CENTER.zoom);
      updateWindyIframe();
    });
  }

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Atualiza o Iframe do Windy com a variável e o centro selecionados
 */
function updateWindyIframe() {
  const iframe = document.getElementById('windy-iframe');
  if (!iframe) return;

  const lat = currentScope === 'ro' ? RO_CENTER.lat : RJ_CENTER.lat;
  const lon = currentScope === 'ro' ? RO_CENTER.lon : RJ_CENTER.lon;
  const zoom = currentScope === 'ro' ? 10 : 8;

  let overlay = 'radar';
  let product = 'radar';

  if (currentLayer === 'rain') {
    overlay = 'rain';
    product = 'ecmwf';
  } else if (currentLayer === 'wind') {
    overlay = 'wind';
    product = 'ecmwf';
  } else if (currentLayer === 'pressure') {
    overlay = 'pressure';
    product = 'ecmwf';
  } else if (currentLayer === 'satellite') {
    overlay = 'satellite';
    product = 'satellite';
  } else if (currentLayer === 'waves') {
    overlay = 'waves';
    product = 'ecmwf';
  } else {
    overlay = 'radar';
    product = 'radar';
  }

  const targetSrc = `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km%2Fh&zoom=${zoom}&overlay=${overlay}&product=${product}&level=surface&lat=${lat}&lon=${lon}&detailLat=-22.527&detailLon=-41.945&marker=true&pressure=true&message=true`;

  if (iframe.src !== targetSrc) {
    iframe.src = targetSrc;
  }

  // Atualiza título da legenda ativa
  const titles = {
    radar: 'Radar Meteorológico (Ecos de Chuva no RJ)',
    rain: 'Precipitação Acumulada & Taxa de Chuva',
    wind: 'Campo de Vento & Rajadas em Tempo Real',
    pressure: 'Pressão Atmosférica ao Nível do Mar & Isobaras',
    satellite: 'Satélite Meteorológico GOES-16 (Nuvens)',
    waves: 'Ondulação Marítima & Swell (Área Delta)'
  };

  const titleEl = document.getElementById('active-layer-title');
  if (titleEl) {
    titleEl.textContent = titles[currentLayer] || 'Radar Meteorológico RJ';
  }
}

/**
 * Inicializa o Mapa Leaflet com os Radares e o histórico Doppler do RainViewer
 */
async function initLeafletRadar(containerId = 'radar-map') {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!map) {
    const topoLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Topo',
      maxZoom: 18
    });

    const streetLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Ruas',
      maxZoom: 18
    });

    const satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Satélite HD',
      maxZoom: 18
    });

    const darkBaseLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Modo Escuro',
      maxZoom: 16
    });

    // Centraliza no centro do Estado do RJ por padrão com visão ampla
    map = L.map(containerId, {
      center: [RJ_CENTER.lat, RJ_CENTER.lon],
      zoom: RJ_CENTER.zoom,
      layers: [topoLayer],
      zoomControl: true
    });

    const baseMaps = {
      "🗺️ Relevo / Topográfico": topoLayer,
      "🏙️ Ruas e Rodovias": streetLayer,
      "🛰️ Satélite HD": satLayer,
      "🌑 Modo Escuro": darkBaseLayer
    };

    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

    // 1. Marcador com Pulso em Rio das Ostras
    const customIconRO = L.divIcon({
      className: 'radar-city-marker',
      html: `<div class="relative flex items-center justify-center">
              <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-500 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 bg-[#1E88E5] border-2 border-white shadow-lg"></span>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    markerRO = L.marker([RIO_DAS_OSTRAS_COORDS.lat, RIO_DAS_OSTRAS_COORDS.lon], { icon: customIconRO }).addTo(map);
    markerRO.bindPopup(`
      <div class="text-xs space-y-1">
        <strong class="text-sm font-bold block text-blue-700">Rio das Ostras - RJ</strong>
        <p class="text-slate-600">Centro de Monitoramento Hidrológico da Bacia do Rio Jundiá e Costa Marítima.</p>
        <span class="inline-block bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">DEFESA CIVIL ATIVA</span>
      </div>
    `);

    // Raio municipal de vigilância de Rio das Ostras (20 km)
    L.circle([RIO_DAS_OSTRAS_COORDS.lat, RIO_DAS_OSTRAS_COORDS.lon], {
      color: '#1E88E5',
      fillColor: '#1E88E5',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '4, 4',
      radius: 20000
    }).addTo(map);

    // 2. Marcadores e Raios dos Radares Oficiais do RJ
    RJ_RADARS.forEach(radar => {
      const radarIcon = L.divIcon({
        className: 'radar-station-marker',
        html: `<div class="p-1 rounded-full bg-white shadow-md border" style="border-color: ${radar.cor};">
                <div class="w-3 h-3 rounded-full" style="background-color: ${radar.cor};"></div>
               </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const m = L.marker(radar.coords, { icon: radarIcon }).addTo(map);
      m.bindPopup(`
        <div class="text-xs space-y-1">
          <strong class="font-bold block" style="color: ${radar.cor};">${radar.nome}</strong>
          <p class="text-slate-600">${radar.detalhes}</p>
          <span class="text-[10px] font-bold text-slate-500">Alcance Operacional: ${radar.alcanceKm} km</span>
        </div>
      `);

      // Círculo de cobertura do radar
      const c = L.circle(radar.coords, {
        color: radar.cor,
        fillColor: radar.cor,
        fillOpacity: 0.03,
        weight: 1,
        dashArray: '3, 6',
        radius: radar.alcanceKm * 1000
      }).addTo(map);
      radarCircles.push(c);
    });

  } else {
    map.setView([RJ_CENTER.lat, RJ_CENTER.lon], RJ_CENTER.zoom);
  }

  await loadRadarFrames();
}

/**
 * Carrega os quadros de radar do RainViewer cobrindo o Estado do RJ
 */
async function loadRadarFrames() {
  radarData = await getRainViewerData();
  if (!radarData || !radarData.radar || !radarData.radar.past) return;

  radarLayers.forEach(layer => map.removeLayer(layer));
  radarLayers = [];

  const host = radarData.host || 'https://tilecache.rainviewer.com';
  const pastFrames = radarData.radar.past;

  pastFrames.forEach((frame, idx) => {
    const tileUrl = `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
    const layer = L.tileLayer(tileUrl, {
      opacity: 0,
      zIndex: 10 + idx,
      maxNativeZoom: 7,
      maxZoom: 18
    });
    layer.addTo(map);
    radarLayers.push({ layer, time: frame.time });
  });

  if (radarLayers.length > 0) {
    currentFrameIndex = radarLayers.length - 1;
    showFrame(currentFrameIndex);
  }

  setupRadarPlaybackControls();
}

/**
 * Exibe o quadro de radar correspondente ao índice
 */
function showFrame(index) {
  if (index < 0 || index >= radarLayers.length) return;

  radarLayers.forEach((item, i) => {
    item.layer.setOpacity(i === index ? 0.75 : 0);
  });

  currentFrameIndex = index;

  const timeLabel = document.getElementById('radar-time-label');
  if (timeLabel && radarLayers[index]) {
    const date = new Date(radarLayers[index].time * 1000);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const isLatest = index === radarLayers.length - 1;
    timeLabel.innerHTML = `
      <span class="inline-block w-2.5 h-2.5 rounded-full ${isLatest ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'} mr-1.5"></span>
      <span>${hours}:${minutes} (Horário de Brasília)</span>
      ${isLatest ? '<span class="ml-1.5 text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold uppercase">Ao Vivo</span>' : ''}
    `;
  }

  const progressBar = document.getElementById('radar-progress');
  if (progressBar && radarLayers.length > 1) {
    const pct = (index / (radarLayers.length - 1)) * 100;
    progressBar.style.width = `${pct}%`;
  }
}

/**
 * Configura botões de controle de playback do radar
 */
function setupRadarPlaybackControls() {
  const playBtn = document.getElementById('radar-play-btn');
  const prevBtn = document.getElementById('radar-prev-btn');
  const nextBtn = document.getElementById('radar-next-btn');

  if (playBtn && !playBtn.dataset.bound) {
    playBtn.dataset.bound = 'true';
    playBtn.addEventListener('click', togglePlayRadar);
  }

  if (prevBtn && !prevBtn.dataset.bound) {
    prevBtn.dataset.bound = 'true';
    prevBtn.addEventListener('click', () => {
      pauseRadar();
      let prev = currentFrameIndex - 1;
      if (prev < 0) prev = radarLayers.length - 1;
      showFrame(prev);
    });
  }

  if (nextBtn && !nextBtn.dataset.bound) {
    nextBtn.dataset.bound = 'true';
    nextBtn.addEventListener('click', () => {
      pauseRadar();
      let next = (currentFrameIndex + 1) % radarLayers.length;
      showFrame(next);
    });
  }
}

function togglePlayRadar() {
  if (isPlaying) {
    pauseRadar();
  } else {
    playRadar();
  }
}

function playRadar() {
  if (radarLayers.length === 0) return;
  isPlaying = true;
  const playBtn = document.getElementById('radar-play-btn');
  if (playBtn) playBtn.innerHTML = `<i data-lucide="pause" class="w-4 h-4"></i>`;
  if (window.lucide) window.lucide.createIcons();

  clearInterval(animationTimer);
  animationTimer = setInterval(() => {
    let next = (currentFrameIndex + 1) % radarLayers.length;
    showFrame(next);
  }, 750);
}

function pauseRadar() {
  isPlaying = false;
  clearInterval(animationTimer);
  const playBtn = document.getElementById('radar-play-btn');
  if (playBtn) playBtn.innerHTML = `<i data-lucide="play" class="w-4 h-4"></i>`;
  if (window.lucide) window.lucide.createIcons();
}
