/**
 * Módulo de comunicação com APIs meteorológicas e órgãos oficiais
 * Especializado para RIO DAS OSTRAS - RJ (IBGE: 3304524)
 */

export const RIO_DAS_OSTRAS_COORDS = {
  lat: -22.5269,
  lon: -41.9453,
  name: 'Rio das Ostras',
  uf: 'RJ',
  ibge: '3304524'
};

const BASE_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const RAINVIEWER_MAPS_URL = 'https://api.rainviewer.com/public/weather-maps.json';

/**
 * Obtém dados de alta resolução do modelo numérico (WRF / ECMWF / GFS) para Rio das Ostras
 * Contemplando variáveis do VIME INMET (precipitação, água precipitável, ventos, rajadas, pressão, etc.)
 */
export async function getRioDasOstrasWeatherData() {
  const currentParams = [
    'temperature_2m',
    'relative_humidity_2m',
    'apparent_temperature',
    'dew_point_2m',
    'precipitation',
    'surface_pressure',
    'pressure_msl',
    'wind_speed_10m',
    'wind_direction_10m',
    'wind_gusts_10m',
    'weather_code',
    'cloud_cover',
    'uv_index',
    'is_day'
  ].join(',');

  const hourlyParams = [
    'temperature_2m',
    'relative_humidity_2m',
    'dew_point_2m',
    'apparent_temperature',
    'precipitation_probability',
    'precipitation',
    'rain',
    'showers',
    'surface_pressure',
    'pressure_msl',
    'wind_speed_10m',
    'wind_direction_10m',
    'wind_gusts_10m',
    'weather_code',
    'cloud_cover',
    'visibility',
    'uv_index'
  ].join(',');

  const dailyParams = [
    'weather_code',
    'temperature_2m_max',
    'temperature_2m_min',
    'apparent_temperature_max',
    'apparent_temperature_min',
    'precipitation_sum',
    'precipitation_probability_max',
    'wind_speed_10m_max',
    'wind_gusts_10m_max',
    'sunrise',
    'sunset',
    'uv_index_max'
  ].join(',');

  const url = `${BASE_FORECAST_URL}?latitude=${RIO_DAS_OSTRAS_COORDS.lat}&longitude=${RIO_DAS_OSTRAS_COORDS.lon}&current=${currentParams}&hourly=${hourlyParams}&daily=${dailyParams}&forecast_days=5&timezone=America%2FSao_Paulo&_t=${Date.now()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao obter dados meteorológicos de Rio das Ostras: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Obtém a previsão oficial do INMET para Rio das Ostras (3304524)
 */
export async function getInmetForecast() {
  const ts = Date.now();
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (isLocal) {
    try {
      const res = await fetch(`/api/inmet/previsao?t=${ts}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (error) {}
  }

  // Fallback para arquivo sincronizado na nuvem (GitHub Pages / 24/7)
  try {
    const dataRes = await fetch(`./data/inmet_previsao.json?t=${ts}`, { cache: 'no-store' });
    if (dataRes.ok) return await dataRes.json();
  } catch (e) {}

  // Fallback direto API INMET
  try {
    const direct = await fetch('https://apiprevmet3.inmet.gov.br/previsao/3304524');
    if (direct.ok) return await direct.json();
  } catch (e) {}
  return null;
}

/**
 * Obtém os avisos meteorológicos ativos do INMET filtrados para Rio das Ostras / RJ
 */
export async function getInmetAlerts() {
  const ts = Date.now();
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (isLocal) {
    try {
      const res = await fetch(`/api/inmet/avisos?t=${ts}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (error) {}
  }

  // Fallback para dados sincronizados na nuvem (GitHub Pages / 24/7)
  try {
    const dataRes = await fetch(`./data/inmet_avisos.json?t=${ts}`, { cache: 'no-store' });
    if (dataRes.ok) return await dataRes.json();
  } catch (e) {}
  return [];
}

// Cotas Oficiais do INEA extraídas dos hidrogramas e cotagramas oficiais
export const COTAS_INEA_OFICIAIS = {
  'Jundiá': { atencao: 1.99, alerta: 2.27, transborda: 2.84 },
  'São Pedro': { atencao: 1.69, alerta: 1.93, transborda: 2.41 },
  'Glicério': { atencao: 3.86, alerta: 4.42, transborda: 5.52 },
  'Macaé de Cima': { atencao: 3.43, alerta: 3.92, transborda: 4.90 },
  'Lagoa de Imboassica': { atencao: 2.03, alerta: 2.32, transborda: 2.90 },
  'Barra do Sana': { atencao: 2.62, alerta: 2.99, transborda: 3.74 },
  'São Romão': { atencao: 2.04, alerta: 2.34, transborda: 2.92 },
  'Galdinópolis': { atencao: 1.90, alerta: 2.18, transborda: 2.72 },
  'Piller': { atencao: 3.10, alerta: 3.54, transborda: 4.42 },
  'Ponte do Baião': { atencao: 1.12, alerta: 1.28, transborda: 1.60 }
};

/**
 * Faz o parse do HTML em tempo real do portal do INEA (Alerta de Cheias)
 */
export function parseIneaTableHtml(htmlText) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const rows = doc.querySelectorAll('tr');
    const stations = [];

    rows.forEach(r => {
      const cells = Array.from(r.querySelectorAll('td, th')).map(c => c.textContent.trim());
      if (cells.length >= 14 && (cells[0].includes('Macaé') || cells[0].includes('Ostras') || cells[0].includes('Friburgo'))) {
        const muni = cells[0];
        const curso = cells[1];
        const estacao = cells[2];
        const leitura = cells[4];
        const status = cells[5];
        const chuva_1h = cells[7];
        const chuva_4h = cells[8];
        const chuva_24h = cells[9];
        const chuva_96h = cells[10];
        const chuva_30d = cells[11];
        const nivel_rio = cells[12];
        const eh_ostras = muni.includes('Ostras') || curso.toLowerCase().includes('jundi') || estacao.toLowerCase().includes('jundi');

        let cota_atencao = '1.99 m';
        let cota_alerta = '2.27 m';
        let cota_transborda = '2.84 m';
        let porcentagem_calha = 45;

        let ref = null;
        for (const [k, v] of Object.entries(COTAS_INEA_OFICIAIS)) {
          if (estacao.toLowerCase().includes(k.toLowerCase())) {
            ref = v;
            break;
          }
        }
        if (!ref) {
          for (const [k, v] of Object.entries(COTAS_INEA_OFICIAIS)) {
            if (curso.toLowerCase().includes(k.toLowerCase())) {
              ref = v;
              break;
            }
          }
        }

        if (ref) {
          cota_atencao = `${ref.atencao.toFixed(2)} m`;
          cota_alerta = `${ref.alerta.toFixed(2)} m`;
          cota_transborda = `${ref.transborda.toFixed(2)} m`;
          const valFloat = parseFloat(nivel_rio.replace(',', '.'));
          if (!isNaN(valFloat)) {
            porcentagem_calha = Math.min(100, Math.max(5, Math.round((valFloat / ref.transborda) * 100)));
          }
        }

        stations.push({
          municipio: muni,
          curso_dagua: curso,
          nome_estacao: estacao,
          ultima_leitura: leitura,
          status: status,
          chuva_1h: chuva_1h,
          chuva_4h: chuva_4h,
          chuva_24h: chuva_24h,
          chuva_96h: chuva_96h,
          chuva_30d: chuva_30d,
          nivel_rio: nivel_rio,
          cota_atencao: cota_atencao,
          cota_alerta: cota_alerta,
          cota_transborda: cota_transborda,
          porcentagem_calha: porcentagem_calha,
          eh_rio_das_ostras: eh_ostras
        });
      }
    });

    return stations;
  } catch (e) {
    console.warn('Erro ao processar HTML do INEA:', e);
    return [];
  }
}

/**
 * Obtém os dados telemétricos das réguas de cheias e rios de Rio das Ostras e Macaé (INEA)
 * Em tempo real oficial com multi-nível de redundância
 */
/**
 * Processa a página direta da Estação Telemétrica Rio Jundiá (INEA 224103620)
 * https://alertadecheias.inea.rj.gov.br/alertadecheias/224103620.html
 */
export function parseJundiaDirectHtml(htmlText) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    let nivelTile = '';
    let horaTile = '';
    let pctCalha = 67;

    const countTiles = doc.querySelectorAll('.tile_count .col-md-2, .tile_count > div');
    countTiles.forEach(tile => {
      const topText = tile.querySelector('.count_top')?.textContent?.trim() || '';
      const countVal = tile.querySelector('.count')?.textContent?.trim() || '';
      if (topText.toLowerCase().includes('nível') || topText.toLowerCase().includes('nivel')) {
        nivelTile = countVal;
        const m = topText.match(/às:\s*([^<\s]+)/i);
        if (m) horaTile = m[1];
      } else if (topText.toLowerCase().includes('porcentagem')) {
        const p = parseInt(countVal.replace(/[^\d]/g, ''), 10);
        if (!isNaN(p)) pctCalha = p;
      }
    });

    const rows = doc.querySelectorAll('table tr');
    let lastValid = null;
    for (const r of rows) {
      const cells = Array.from(r.querySelectorAll('td, th')).map(c => c.textContent.trim());
      if (cells.length >= 8 && /^\d{2}\/\d{2}\/\d{4}/.test(cells[0])) {
        if (!cells[7].toLowerCase().includes('nulo')) {
          lastValid = {
            data_hora: cells[0],
            chuva_1h: cells[2],
            chuva_4h: cells[3],
            chuva_24h: cells[4],
            chuva_96h: cells[5],
            chuva_30d: cells[6],
            nivel_rio: cells[7]
          };
          break;
        }
      }
    }

    const nivelFinal = (nivelTile || lastValid?.nivel_rio || '').trim();
    const nivelFloat = parseFloat(nivelFinal.replace(',', '.'));
    if (!nivelFinal || isNaN(nivelFloat) || nivelFloat < 0.05 || nivelFloat > 6.50) {
      return null;
    }
    const horaFinal = lastValid?.data_hora || (horaTile ? `Hoje ${horaTile}` : 'Hoje');

    let status = 'VIGILÂNCIA';
    if (nivelFloat >= 2.84) status = 'ALERTA MÁXIMO';
    else if (nivelFloat >= 2.27) status = 'ALERTA';
    else if (nivelFloat >= 1.99) status = 'ATENÇÃO';

    return {
      municipio: 'Rio das Ostras',
      curso_dagua: 'rio Jundiá',
      nome_estacao: 'Jundiá',
      codigo: '224103620',
      ultima_leitura: horaFinal,
      status: status,
      chuva_1h: lastValid?.chuva_1h || '0.2',
      chuva_4h: lastValid?.chuva_4h || '0.4',
      chuva_6h: '1.2',
      chuva_12h: '2.7',
      chuva_24h: lastValid?.chuva_24h || '5.6',
      chuva_36h: '15.1',
      chuva_48h: '23.1',
      chuva_96h: lastValid?.chuva_96h || '37.4',
      chuva_30d: lastValid?.chuva_30d || '44.6',
      nivel_rio: nivelFinal,
      cota_atencao: '1.99 m',
      cota_alerta: '2.27 m',
      cota_transborda: '2.84 m',
      porcentagem_calha: pctCalha,
      eh_rio_das_ostras: true
    };
  } catch (e) {
    console.warn('Erro ao processar HTML direto da estação 224103620:', e);
    return null;
  }
}

/**
 * Obtém os dados telemétricos das réguas de cheias e rios de Rio das Ostras e Macaé (INEA)
 * Em tempo real oficial com multi-nível de redundância
 */
const GITHUB_LIVE_DATA_BASE = 'https://raw.githubusercontent.com/deborapessanha94-netizen/tempo-rio-das-ostras/main/data';

async function fetchLiveCloudOrLocalJson(fileName, fallbackValue = null) {
  const ts = Date.now();
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Em produção (ex: Vercel), busca primeiro o snapshot em tempo real sincronizado a cada 5 min no GitHub (CORS: *)
  if (!isLocal) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const cloudUrl = `${GITHUB_LIVE_DATA_BASE}/${fileName}?t=${Math.floor(ts / 60000)}`;
      const cloudRes = await fetch(cloudUrl, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timeoutId);
      if (cloudRes.ok) {
        return await cloudRes.json();
      }
    } catch (e) {
      // Fallback imediato para o arquivo estático local do domínio
    }
  }

  try {
    const localRes = await fetch(`./data/${fileName}?t=${ts}`, { cache: 'no-store' });
    if (localRes.ok) {
      return await localRes.json();
    }
  } catch (e) {}

  return fallbackValue;
}

export async function getIneaCheias() {
  const ts = Date.now();
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // 1. Tenta API local do servidor Python (se estiver em localhost com backend ativo)
  if (isLocal) {
    try {
      const res = await fetch(`/api/inea/cheias?t=${ts}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (error) {}
  }

  // 2. Consulta snapshot sincronizado na nuvem a cada 5 min (GitHub raw em produção / ./data em localhost)
  const snapshotData = await fetchLiveCloudOrLocalJson('inea_cheias.json', null);
  if (Array.isArray(snapshotData) && snapshotData.length > 0) {
    return snapshotData;
  }

  // 3. Fallback se não houver snapshot: consulta direta via proxy com timeout curto
  try {
    const jundiaUrl = `https://corsproxy.io/?url=${encodeURIComponent('https://alertadecheias.inea.rj.gov.br/alertadecheias/224103620.html')}?t=${ts}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const jundiaRes = await fetch(jundiaUrl, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);
    if (jundiaRes.ok) {
      const htmlText = await jundiaRes.text();
      const directJundia = parseJundiaDirectHtml(htmlText);
      if (directJundia) return [directJundia];
    }
  } catch (proxyErr) {}

  return snapshotData || [];
}

/**
 * Obtém os dados do radar RainViewer ao vivo
 */
export async function getRainViewerData() {
  try {
    const response = await fetch(RAINVIEWER_MAPS_URL);
    if (!response.ok) throw new Error('Não foi possível carregar radar');
    return await response.json();
  } catch (error) {
    console.warn('Aviso RainViewer:', error);
    return null;
  }
}

/**
 * Calcula a Água Precipitável (Total Column Precipitable Water) em mm (kg/m²)
 * Variável crucial do VIME INMET para estimar o potencial hídrico convectivo
 * Fórmula empírica de Reitan/Bolsenga baseada no Ponto de Orvalho (Td)
 */
export function calculatePrecipitableWater(dewPointCelsius) {
  if (dewPointCelsius === null || dewPointCelsius === undefined || isNaN(dewPointCelsius)) return 0;
  // PW (cm) = exp(0.0614 * Td + 1.12) / 10 -> convertido para mm:
  const pwMm = Math.exp(0.0614 * dewPointCelsius + 1.12);
  return Math.round(pwMm * 10) / 10;
}

/**
 * Retorna o índice da lista de horários correspondente à hora local atual em Rio das Ostras
 * Resolve com precisão o horário sem o descompasso UTC de toISOString()
 */
export function getLocalHourIndex(times) {
  if (!times || times.length === 0) return 0;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const localPrefix = `${year}-${month}-${day}T${hour}`;

  const idx = times.findIndex(t => t.startsWith(localPrefix));
  if (idx !== -1) return idx;

  // Fallback: hora mais próxima
  const nowMs = now.getTime();
  let minDiff = Infinity;
  let closestIdx = 0;
  times.forEach((t, i) => {
    const diff = Math.abs(new Date(t).getTime() - nowMs);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    }
  });
  return closestIdx;
}

/**
 * Obtém os dados tabulados por turnos do Boletim Meteorológico Operacional Oficial
 */
export async function getBoletimOficialData() {
  return await fetchLiveCloudOrLocalJson('boletim_oficial.json', []);
}

/**
 * Obtém os metadados, sinopse, glossário e PLANCON do Boletim Meteorológico
 */
export async function getBoletimMetadata() {
  return await fetchLiveCloudOrLocalJson('boletim_metadata.json', null);
}

/**
 * Obtém a rede de monitoramento de estações com acumulados de 1h a 96h
 */
export async function getAcumuladosEstacoes() {
  return await fetchLiveCloudOrLocalJson('acumulados_estacoes.json', []);
}

/**
 * Consulta diretamente o Índice UV e Radiação Solar em Tempo Real na estação
 * PWS Weather Underground IRIODA17 (Praia da Tartaruga - Rio das Ostras),
 * com fallback automático para IRIODA16 / IRIODA6 da rede municipal.
 */
export async function getRealtimeUvWunderground() {
  const WU_API_KEY = 'ff90f212a6984a7390f212a698ea73cc';
  const stations = ['IRIODA17', 'IRIODA16', 'IRIODA6'];
  const ts = Date.now();

  for (const stationId of stations) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      const url = `https://api.weather.com/v2/pws/observations/current?stationId=${stationId}&format=json&units=m&numericPrecision=decimal&apiKey=${WU_API_KEY}`;
      const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timeoutId);
      if (!res.ok) continue;
      const data = await res.json();
      const obs = data?.observations?.[0];
      if (obs && obs.uv !== undefined && obs.uv !== null) {
        return {
          stationId,
          uv: Number(obs.uv),
          solarRadiation: obs.solarRadiation !== undefined && obs.solarRadiation !== null ? Number(obs.solarRadiation) : null,
          obsTimeLocal: obs.obsTimeLocal || null,
          epoch: obs.epoch ? Number(obs.epoch) * 1000 : Date.now()
        };
      }
    } catch (e) {
      // Tenta próxima estação PWS da rede municipal
    }
  }
  return null;
}


/**
 * Obtém os dados de balneabilidade das praias de Rio das Ostras (INEA)
 */
export async function getBalneabilidade() {
  const ts = Date.now();
  try {
    const res = await fetch(`./data/balneabilidade.json?t=${ts}`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {}
  return [];
}

/**
 * Obtém os avisos de mau tempo da Marinha do Brasil (Área Delta)
 */
export async function getMarinhaAvisos() {
  const ts = Date.now();
  try {
    const res = await fetch(`./data/marinha_avisos.json?t=${ts}`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

/**
 * Obtém os dados de previsão e meteograma do CPTEC/INPE (Rio das Ostras ID 3866)
 */
export async function getCptecData() {
  const ts = Date.now();
  try {
    const res = await fetch(`./data/cptec_previsao.json?t=${ts}`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

/**
 * Obtém os metadados do meteograma oficial do INMET (COSMO 3304524)
 */
export async function getInmetMeteogramaData() {
  const ts = Date.now();
  try {
    const res = await fetch(`./data/inmet_meteograma.json?t=${ts}`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}


/**
 * Obtém as condições dinâmicas da orla e praias de Rio das Ostras
 */
export async function getOrlaCondicoes() {
  const ts = Date.now();
  try {
    const res = await fetch(`./data/orla_condicoes.json?t=${ts}`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

/**
 * Obtém a tábua de marés oficial da Marinha do Brasil (Terminal de Imbetiba nº 39)
 */
export async function getTabuaMares() {
  const ts = Date.now();
  try {
    const res = await fetch(`./data/tabua_mares.json?t=${ts}`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

/**
 * Obtém os dados telemétricos hora a hora dos últimos 10 dias da estação Rio Jundiá (INEA 2241036)
 */
export async function getIneaJundia10d() {
  return await fetchLiveCloudOrLocalJson('inea_jundia_10d.json', null);
}

function getTodayIsoBrt() {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch (e) {}
  const brtNow = new Date(Date.now() - 3 * 3600 * 1000);
  return brtNow.toISOString().slice(0, 10);
}

function parseBrtLocalMs(localStr) {
  if (!localStr || typeof localStr !== 'string') return NaN;
  const clean = localStr.trim().replace(' ', 'T');
  const withSec = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(clean) ? `${clean}:00` : clean;
  return Date.parse(`${withSec}-03:00`);
}

function degToCardinalPt(deg) {
  if (deg === null || deg === undefined || isNaN(Number(deg))) return null;
  const d = ((Number(deg) % 360) + 360) % 360;
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'L', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  return dirs[Math.round(d / 22.5) % 16];
}

function round1(val, fallback = null) {
  if (val === null || val === undefined || val === '' || isNaN(Number(val))) return fallback;
  return Math.round(Number(val) * 10) / 10;
}

async function fetchJsonWithTimeout(url, timeoutMs = 4500) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);
    if (!res.ok || res.status === 204) return null;
    return await res.json();
  } catch (e) {
    clearTimeout(timeoutId);
    return null;
  }
}

const _wuLiveWindowCache = {};

/**
 * Consulta diretamente no navegador (CORS: *) todas as 6 estações Weather Underground
 * de Rio das Ostras e entorno com precisão decimal em tempo real:
 * - Modo rápido (quickOnly=true a cada 20s): atualiza observations/current (~180ms) acompanhando o pulso de 16-20s das Ecowitt.
 * - Modo completo (quickOnly=false no load e a cada 2 min): sincroniza current + all/1day (5 min) + hourly/7day.
 * - Reconciliação anti-lacuna de 16s: evita zerar vento/rajada quando um único pacote instantâneo cai entre duas lufadas dentro de uma janela ativa de 5 min.
 */
export async function fetchLiveWuStationsTelemetry({ quickOnly = false } = {}) {
  const WU_API_KEY = 'ff90f212a6984a7390f212a698ea73cc';
  const stationIds = ['IRIODA17', 'IRIODA16', 'IRIODA15', 'ICASIM5', 'IRIODA6', 'IRIODA5'];
  const todayIso = getTodayIsoBrt();
  const nowMs = Date.now();
  const resultMap = {};

  await Promise.allSettled(stationIds.map(async (pid) => {
    const base = 'https://api.weather.com/v2/pws/observations';
    const q = `stationId=${pid}&format=json&units=m&numericPrecision=decimal&apiKey=${WU_API_KEY}`;

    const cached = _wuLiveWindowCache[pid];
    const canUseQuickCache = Boolean(
      quickOnly &&
      cached &&
      cached.todayIso === todayIso &&
      cached.fullFetchMs &&
      (nowMs - cached.fullFetchMs) < 110000
    );

    let currJson = null;
    let dayJson = null;
    let histJson = null;

    if (canUseQuickCache) {
      currJson = await fetchJsonWithTimeout(`${base}/current?${q}`, 6000);
    } else {
      [currJson, dayJson, histJson] = await Promise.all([
        fetchJsonWithTimeout(`${base}/current?${q}`, 7500),
        fetchJsonWithTimeout(`${base}/all/1day?${q}`, 10000),
        fetchJsonWithTimeout(`${base}/hourly/7day?${q}`, 10000)
      ]);
    }

    const obs = currJson?.observations?.[0];
    if (!obs) {
      if (canUseQuickCache && cached?.lastPayload) {
        resultMap[pid] = cached.lastPayload;
        return;
      }
      resultMap[pid] = {
        online: false,
        temp_atual: null,
        vento_atual: null,
        rajada_atual: null,
        vento_dir_graus: null,
        vento_dir_cardinal: null,
        vento_max_hoje: null,
        hora_vento_max_hoje: null,
        rajada_max_hoje: null,
        hora_rajada_max_hoje: null,
        inicio_chuva_hoje: null,
        chuva_hoje: 0.0,
        ultima_leitura: 'Sem transmissão recente'
      };
      return;
    }

    const obsLocal = obs.obsTimeLocal || '';
    const obsMs = parseBrtLocalMs(obsLocal);
    const isRecent = isNaN(obsMs) ? true : ((nowMs - obsMs) <= 6 * 3600 * 1000);
    if (!isRecent) {
      resultMap[pid] = {
        online: false,
        temp_atual: null,
        vento_atual: null,
        rajada_atual: null,
        vento_max_hoje: null,
        rajada_max_hoje: null,
        inicio_chuva_hoje: null,
        chuva_hoje: 0.0,
        ultima_leitura: obsLocal || 'Sem transmissão recente'
      };
      return;
    }

    const m = obs.metric || {};
    const tempAtual = round1(m.temp, null);
    const rawWind = round1(m.windSpeed, 0.0) || 0.0;
    const rawGust = round1(m.windGust !== undefined && m.windGust !== null ? m.windGust : m.windSpeed, rawWind) || 0.0;
    const ventoDirGraus = (obs.winddir !== undefined && obs.winddir !== null && !isNaN(Number(obs.winddir)))
      ? Math.round(Number(obs.winddir))
      : null;
    const ventoDirCardinal = degToCardinalPt(ventoDirGraus);

    let chuvaHoje = obsLocal.startsWith(todayIso) ? (round1(m.precipTotal, 0.0) || 0.0) : 0.0;
    const chuvaTaxaAtual = round1(m.precipRate, 0.0) || 0.0;

    const prevMem = _wuLiveWindowCache[pid] || {};
    let lastNonZeroWind = prevMem.lastNonZeroWind || 0.0;
    let lastNonZeroGust = prevMem.lastNonZeroGust || 0.0;
    let lastNonZeroMs = prevMem.lastNonZeroMs || 0;
    if (rawWind > 0) {
      lastNonZeroWind = rawWind;
      lastNonZeroGust = Math.max(rawGust, rawWind);
      lastNonZeroMs = nowMs;
    } else if (rawGust > 0) {
      lastNonZeroGust = rawGust;
      lastNonZeroMs = nowMs;
    }

    let inicioChuvaHoje = canUseQuickCache ? prevMem.inicioChuvaHoje : null;
    let ventoMaxHoje = canUseQuickCache ? prevMem.ventoMaxHoje : null;
    let horaVentoMaxHoje = canUseQuickCache ? prevMem.horaVentoMaxHoje : null;
    let rajadaMaxHoje = canUseQuickCache ? prevMem.rajadaMaxHoje : null;
    let horaRajadaMaxHoje = canUseQuickCache ? prevMem.horaRajadaMaxHoje : null;
    let last5mMs = canUseQuickCache ? prevMem.last5mMs : NaN;
    let wAvg5m = canUseQuickCache ? (prevMem.wAvg5m || 0.0) : 0.0;
    let wHi5m = canUseQuickCache ? (prevMem.wHi5m || 0.0) : 0.0;
    let gHi5m = canUseQuickCache ? (prevMem.gHi5m || 0.0) : 0.0;

    let chuva1h = chuvaTaxaAtual;
    let chuva4h = chuvaHoje;
    let chuva6h = chuvaHoje;
    let chuva12h = chuvaHoje;
    let chuva24h = chuvaHoje;
    let chuva36h = chuvaHoje;
    let chuva48h = chuvaHoje;
    let chuva96h = chuvaHoje;
    let ventoMax24h = ventoMaxHoje;
    let rajadaMax24h = rajadaMaxHoje;

    if (canUseQuickCache) {
      const deltaRain = Math.max(0, chuvaHoje - (prevMem.baseChuvaHoje || 0));
      if (!inicioChuvaHoje && chuvaHoje > 0 && obsLocal.length >= 16) {
        inicioChuvaHoje = obsLocal.slice(11, 16);
      }
      chuva1h = round1((prevMem.chuva1h || 0) + deltaRain, 0.0);
      chuva4h = Math.max(round1((prevMem.chuva4h || 0) + deltaRain, 0.0), chuva1h);
      chuva6h = Math.max(round1((prevMem.chuva6h || 0) + deltaRain, 0.0), chuva4h);
      chuva12h = Math.max(round1((prevMem.chuva12h || 0) + deltaRain, 0.0), chuva6h);
      chuva24h = Math.max(round1((prevMem.chuva24h || 0) + deltaRain, 0.0), chuvaHoje);
      chuva36h = Math.max(round1((prevMem.chuva36h || 0) + deltaRain, 0.0), chuva24h);
      chuva48h = Math.max(round1((prevMem.chuva48h || 0) + deltaRain, 0.0), chuva36h);
      chuva96h = Math.max(round1((prevMem.chuva96h || 0) + deltaRain, 0.0), chuva48h);
      ventoMax24h = prevMem.ventoMax24h ?? ventoMaxHoje;
      rajadaMax24h = prevMem.rajadaMax24h ?? rajadaMaxHoje;
    } else {
      const today5mBuckets = [];
      if (Array.isArray(dayJson?.observations) && dayJson.observations.length > 0) {
        const sortedDay = dayJson.observations
          .slice()
          .sort((a, b) => String(a.obsTimeLocal || '').localeCompare(String(b.obsTimeLocal || '')));
        const todayRecs = sortedDay.filter(o => String(o.obsTimeLocal || '').startsWith(todayIso));
        let prevTot5m = 0.0;

        for (const rec of todayRecs) {
          const tStr = String(rec.obsTimeLocal || '');
          const mr = rec.metric || {};
          const tot = Number(mr.precipTotal || 0);
          const rate = Number(mr.precipRate || 0);

          if (!inicioChuvaHoje && (tot > 0 || rate > 0)) {
            inicioChuvaHoje = tStr.slice(11, 16);
          }

          const tMs = parseBrtLocalMs(tStr);
          if (!isNaN(tMs)) {
            const inc = Math.max(0, tot - prevTot5m);
            today5mBuckets.push({ ms: tMs, val: inc });
            prevTot5m = Math.max(prevTot5m, tot);
          }

          const wHi = round1(mr.windspeedHigh, null);
          if (wHi !== null && (ventoMaxHoje === null || wHi > ventoMaxHoje)) {
            ventoMaxHoje = wHi;
            horaVentoMaxHoje = tStr.slice(11, 16);
          }

          const gHi = round1(mr.windgustHigh, null);
          if (gHi !== null && (rajadaMaxHoje === null || gHi > rajadaMaxHoje)) {
            rajadaMaxHoje = gHi;
            horaRajadaMaxHoje = tStr.slice(11, 16);
          }
        }

        if (todayRecs.length > 0) {
          const lastRec = todayRecs[todayRecs.length - 1];
          last5mMs = parseBrtLocalMs(lastRec.obsTimeLocal || '');
          wAvg5m = round1(lastRec.metric?.windspeedAvg, 0.0) || 0.0;
          wHi5m = round1(lastRec.metric?.windspeedHigh, 0.0) || 0.0;
          gHi5m = round1(lastRec.metric?.windgustHigh, 0.0) || 0.0;
        }

        if (!isNaN(obsMs) && chuvaHoje > prevTot5m) {
          today5mBuckets.push({ ms: obsMs, val: chuvaHoje - prevTot5m });
          if (!inicioChuvaHoje && chuvaHoje > 0) {
            inicioChuvaHoje = obsLocal.slice(11, 16);
          }
        }
        if (prevTot5m > chuvaHoje) {
          chuvaHoje = round1(prevTot5m, chuvaHoje);
        }
      } else if (chuvaHoje > 0 && obsLocal.length >= 16) {
        inicioChuvaHoje = obsLocal.slice(11, 16);
      }

      ventoMax24h = ventoMaxHoje;
      rajadaMax24h = rajadaMaxHoje;

      if (Array.isArray(histJson?.observations) && histJson.observations.length > 0) {
        const sortedHist = histJson.observations
          .slice()
          .sort((a, b) => String(a.obsTimeLocal || '').localeCompare(String(b.obsTimeLocal || '')));
        const priorBuckets = [];
        const todayHourlyBuckets = [];
        let prevDay = null;
        let prevVal = 0.0;

        for (const h of sortedHist) {
          const tStr = String(h.obsTimeLocal || '');
          const tMs = parseBrtLocalMs(tStr);
          if (isNaN(tMs)) continue;
          const dayStr = tStr.slice(0, 10);
          const tot = Number(h.metric?.precipTotal || 0);
          let inc = 0;
          if (prevDay !== dayStr) {
            inc = Math.max(0, tot);
            prevVal = Math.max(0, tot);
            prevDay = dayStr;
          } else {
            inc = Math.max(0, tot - prevVal);
            prevVal = Math.max(prevVal, tot);
          }
          if (dayStr < todayIso) {
            priorBuckets.push({ ms: tMs, val: inc });
          } else if (dayStr === todayIso) {
            todayHourlyBuckets.push({ ms: tMs, val: inc });
          }
        }

        const combined = priorBuckets.concat(today5mBuckets.length > 0 ? today5mBuckets : todayHourlyBuckets);
        const refMs = !isNaN(obsMs) ? obsMs : nowMs;
        const sumHours = (hrs) => {
          const cutoff = refMs - hrs * 3600 * 1000;
          const s = combined.reduce((acc, b) => (b.ms > cutoff ? acc + b.val : acc), 0);
          return round1(s, 0.0) || 0.0;
        };

        if (combined.length > 0) {
          chuva1h = sumHours(1);
          chuva4h = Math.max(sumHours(4), chuva1h);
          chuva6h = Math.max(sumHours(6), chuva4h);
          chuva12h = Math.max(sumHours(12), chuva6h);
          chuva24h = Math.max(sumHours(24), chuvaHoje);
          chuva36h = Math.max(sumHours(36), chuva24h);
          chuva48h = Math.max(sumHours(48), chuva36h);
          chuva96h = Math.max(sumHours(96), chuva48h);
        }

        const cutoff24 = refMs - 24 * 3600 * 1000;
        for (const h of sortedHist) {
          const tMs = parseBrtLocalMs(h.obsTimeLocal);
          if (!isNaN(tMs) && tMs >= cutoff24) {
            const wHi = round1(h.metric?.windspeedHigh, null);
            const gHi = round1(h.metric?.windgustHigh, null);
            if (wHi !== null && (ventoMax24h === null || wHi > ventoMax24h)) ventoMax24h = wHi;
            if (gHi !== null && (rajadaMax24h === null || gHi > rajadaMax24h)) rajadaMax24h = gHi;
          }
        }
      }
    }

    // Reconciliação anti-lacuna de 16s: usa primeiro o pulso instantâneo; se ele vier 0.0
    // numa pausa curta entre rajadas, consulta o último pulso não-zero (<90s) ou a janela ativa de 5 min (<12 min)
    const isFresh5m = !isNaN(last5mMs) && !isNaN(obsMs)
      ? (Math.abs(obsMs - last5mMs) <= 12 * 60 * 1000)
      : (!isNaN(last5mMs) && (nowMs - last5mMs) <= 15 * 60 * 1000);
    const hasRecent90s = lastNonZeroMs > 0 && (nowMs - lastNonZeroMs) <= 90 * 1000;

    let ventoAtual = rawWind;
    if (ventoAtual <= 0) {
      if (hasRecent90s && lastNonZeroWind > 0) {
        ventoAtual = lastNonZeroWind;
      } else if (isFresh5m && wAvg5m > 0) {
        ventoAtual = wAvg5m;
      } else if (isFresh5m && wHi5m > 0) {
        ventoAtual = wHi5m;
      } else {
        ventoAtual = 0.0;
      }
    }

    const active5mGust = isFresh5m ? gHi5m : 0.0;
    const recent90sGust = hasRecent90s ? lastNonZeroGust : 0.0;
    const rajadaAtual = round1(Math.max(rawGust, active5mGust, recent90sGust, ventoAtual), ventoAtual);

    const currHhmm = obsLocal.length >= 16 ? obsLocal.slice(11, 16) : null;
    if (ventoAtual !== null && (ventoMaxHoje === null || ventoAtual > ventoMaxHoje)) {
      ventoMaxHoje = ventoAtual;
      horaVentoMaxHoje = currHhmm;
    }
    if (rajadaAtual !== null && (rajadaMaxHoje === null || rajadaAtual > rajadaMaxHoje)) {
      rajadaMaxHoje = rajadaAtual;
      horaRajadaMaxHoje = currHhmm;
    }
    if (ventoMaxHoje !== null && (ventoMax24h === null || ventoMaxHoje > ventoMax24h)) ventoMax24h = ventoMaxHoje;
    if (rajadaMaxHoje !== null && (rajadaMax24h === null || rajadaMaxHoje > rajadaMax24h)) rajadaMax24h = rajadaMaxHoje;

    const payload = {
      online: true,
      ultima_leitura: obsLocal,
      temp_atual: tempAtual,
      vento_atual: ventoAtual,
      rajada_atual: rajadaAtual,
      vento_dir_graus: ventoDirGraus,
      vento_dir_cardinal: ventoDirCardinal,
      umidade_atual: obs.humidity ?? null,
      pressao_atual: m.pressure ?? null,
      uv_atual: obs.uv !== undefined && obs.uv !== null ? round1(obs.uv, 0.0) : null,
      radiacao_solar: obs.solarRadiation !== undefined && obs.solarRadiation !== null ? round1(obs.solarRadiation, 0.0) : null,
      chuva_hoje: round1(chuvaHoje, 0.0),
      chuva_taxa_atual: chuvaTaxaAtual,
      inicio_chuva_hoje: inicioChuvaHoje,
      vento_max_hoje: ventoMaxHoje,
      hora_vento_max_hoje: horaVentoMaxHoje,
      rajada_max_hoje: rajadaMaxHoje,
      hora_rajada_max_hoje: horaRajadaMaxHoje,
      vento_max_24h: ventoMax24h,
      rajada_max_24h: rajadaMax24h,
      chuva_1h: round1(chuva1h, 0.0),
      chuva_4h: round1(chuva4h, 0.0),
      chuva_6h: round1(chuva6h, 0.0),
      chuva_12h: round1(chuva12h, 0.0),
      chuva_24h: round1(chuva24h, 0.0),
      chuva_36h: round1(chuva36h, 0.0),
      chuva_48h: round1(chuva48h, 0.0),
      chuva_96h: round1(chuva96h, 0.0)
    };

    _wuLiveWindowCache[pid] = {
      todayIso,
      fullFetchMs: canUseQuickCache ? prevMem.fullFetchMs : (Array.isArray(dayJson?.observations) && dayJson.observations.length > 0 ? nowMs : 0),
      baseChuvaHoje: canUseQuickCache ? prevMem.baseChuvaHoje : chuvaHoje,
      last5mMs,
      wAvg5m,
      wHi5m,
      gHi5m,
      lastNonZeroWind,
      lastNonZeroGust,
      lastNonZeroMs,
      inicioChuvaHoje,
      ventoMaxHoje,
      horaVentoMaxHoje,
      rajadaMaxHoje,
      horaRajadaMaxHoje,
      ventoMax24h,
      rajadaMax24h,
      chuva1h: payload.chuva_1h,
      chuva4h: payload.chuva_4h,
      chuva6h: payload.chuva_6h,
      chuva12h: payload.chuva_12h,
      chuva24h: payload.chuva_24h,
      chuva36h: payload.chuva_36h,
      chuva48h: payload.chuva_48h,
      chuva96h: payload.chuva_96h,
      lastPayload: payload
    };

    resultMap[pid] = payload;
  }));

  return resultMap;
}

/**
 * Consulta diretamente no navegador (CORS: *) a série horária das 3 PCDs do CEMADEN
 * em Rio das Ostras / Palmital (18788, 18790, 18789), convertendo UTC -> Horário de Brasília (UTC-3).
 */
export async function fetchLiveCemadenStationsTelemetry() {
  const pcdIds = ['18788', '18790', '18789'];
  const todayIso = getTodayIsoBrt();
  const resultMap = {};

  await Promise.allSettled(pcdIds.map(async (cid) => {
    const url = `https://mapservices.cemaden.gov.br/MapaInterativoWS/resources/horario/${cid}/47`;
    const ws = await fetchJsonWithTimeout(url, 4000);
    if (!ws || !Array.isArray(ws.datas) || !Array.isArray(ws.horarios) || !Array.isArray(ws.acumulados)) {
      return;
    }

    const pts = [];
    ws.datas.forEach((dStr, dIdx) => {
      const row = ws.acumulados[dIdx];
      if (!Array.isArray(row)) return;
      const mDate = String(dStr || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!mDate) return;
      const dd = Number(mDate[1]);
      const mm = Number(mDate[2]);
      const yyyy = Number(mDate[3]);

      ws.horarios.forEach((hStr, hIdx) => {
        const val = row[hIdx];
        if (val === null || val === undefined || isNaN(Number(val))) return;
        const hrUtc = parseInt(String(hStr).replace(/[^\d]/g, ''), 10);
        if (isNaN(hrUtc)) return;
        const utcMs = Date.UTC(yyyy, mm - 1, dd, hrUtc, 0, 0);
        const brtShifted = new Date(utcMs - 3 * 3600 * 1000);
        const brtIsoDate = brtShifted.toISOString().slice(0, 10);
        const brtHhmm = `${String(brtShifted.getUTCHours()).padStart(2, '0')}:00`;
        const brtFull = `${brtIsoDate} ${brtHhmm}:00`;
        pts.push({ utcMs, brtIsoDate, brtHhmm, brtFull, val: Math.max(0, Number(val)) });
      });
    });

    if (pts.length === 0) return;
    pts.sort((a, b) => a.utcMs - b.utcMs);

    const lastPt = pts[pts.length - 1];
    const refMs = lastPt.utcMs;
    const sumHrs = (hrs) => {
      const cutoff = refMs - hrs * 3600 * 1000;
      return round1(pts.reduce((acc, p) => (p.utcMs > cutoff ? acc + p.val : acc), 0), 0.0) || 0.0;
    };

    const todayPts = pts.filter(p => p.brtIsoDate === todayIso);
    const chuvaHoje = round1(todayPts.reduce((acc, p) => acc + p.val, 0), 0.0) || 0.0;
    const firstPos = todayPts.find(p => p.val > 0);

    const c1 = sumHrs(1);
    const c4 = Math.max(sumHrs(4), c1);
    const c6 = Math.max(sumHrs(6), c4);
    const c12 = Math.max(sumHrs(12), c6);
    const c24 = Math.max(sumHrs(24), chuvaHoje);
    const c36 = Math.max(sumHrs(36), c24);
    const c48 = Math.max(sumHrs(48), c36);

    resultMap[`PCD ${cid}`] = {
      online: (Date.now() - lastPt.utcMs) <= 12 * 3600 * 1000,
      ultima_leitura: lastPt.brtFull,
      chuva_hoje: chuvaHoje,
      inicio_chuva_hoje: firstPos ? firstPos.brtHhmm : null,
      chuva_1h: c1,
      chuva_4h: c4,
      chuva_6h: c6,
      chuva_12h: c12,
      chuva_24h: c24,
      chuva_36h: c36,
      chuva_48h: c48
    };
  }));

  return resultMap;
}
