/**
 * Módulo de Radar Meteorológico ao Vivo usando Leaflet.js e RainViewer API
 * Especializado para RIO DAS OSTRAS (RJ) e Região dos Lagos / Norte Fluminense
 */

import { getRainViewerData, RIO_DAS_OSTRAS_COORDS } from './api.js';

let map = null;
let marker = null;
let radarLayers = [];
let currentFrameIndex = 0;
let animationTimer = null;
let isPlaying = false;
let radarData = null;

export async function initRadarMap(containerId = 'radar-map') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const lat = RIO_DAS_OSTRAS_COORDS.lat;
  const lon = RIO_DAS_OSTRAS_COORDS.lon;
  const cityName = 'Rio das Ostras - RJ';

  if (!map) {
    const topoLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Topo &copy; RainViewer',
      maxZoom: 18
    });

    const streetLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Ruas &copy; RainViewer',
      maxZoom: 18
    });

    const satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Satélite &copy; RainViewer',
      maxZoom: 18
    });

    const darkBaseLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Dark &copy; RainViewer',
      maxZoom: 16
    });

    map = L.map(containerId, {
      center: [lat, lon],
      zoom: 10,
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

    const customIcon = L.divIcon({
      className: 'radar-city-marker',
      html: `<div class="relative flex items-center justify-center">
              <span class="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-sky-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 bg-sky-500 border-2 border-white shadow-lg"></span>
             </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
    marker.bindPopup(`<b>${cityName}</b><br>Monitoramento de radar e massas de chuva ativo`);
  } else {
    map.setView([lat, lon], 10);
  }

  await loadRadarFrames();
}

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

  setupRadarControls();
}

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
    timeLabel.innerHTML = `<span class="inline-block w-2 h-2 rounded-full ${isLatest ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'} mr-1.5"></span> ${hours}:${minutes} ${isLatest ? '(Ao Vivo - RO)' : ''}`;
  }

  const progressBar = document.getElementById('radar-progress');
  if (progressBar && radarLayers.length > 1) {
    const pct = (index / (radarLayers.length - 1)) * 100;
    progressBar.style.width = `${pct}%`;
  }
}

function setupRadarControls() {
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
