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
    'cloud_cover'
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

  const url = `${BASE_FORECAST_URL}?latitude=${RIO_DAS_OSTRAS_COORDS.lat}&longitude=${RIO_DAS_OSTRAS_COORDS.lon}&current=${currentParams}&hourly=${hourlyParams}&daily=${dailyParams}&forecast_days=5&timezone=America%2FSao_Paulo`;

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
export async function getIneaCheias() {
  const ts = Date.now();
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // 1. Tenta API local do servidor Python (se estiver em localhost)
  if (isLocal) {
    try {
      const res = await fetch(`/api/inea/cheias?t=${ts}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (error) {}
  }

  // 2. Consulta em tempo real diretamente do portal do INEA via proxy CORS de alta velocidade
  try {
    const ineaLiveUrl = `https://corsproxy.io/?url=${encodeURIComponent('https://alertadecheias.inea.rj.gov.br/dados/macae_e_das_ostras.php')}?t=${ts}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const liveRes = await fetch(ineaLiveUrl, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);
    if (liveRes.ok) {
      const htmlText = await liveRes.text();
      const parsed = parseIneaTableHtml(htmlText);
      if (parsed.length > 0) {
        return parsed;
      }
    }
  } catch (proxyErr) {
    console.info('Proxy ao vivo INEA ocupado, acionando snapshot sincronizado...');
  }

  // 3. Fallback de alta disponibilidade: snapshot oficial sincronizado na nuvem (GitHub Pages)
  try {
    const dataRes = await fetch(`./data/inea_cheias.json?t=${ts}`, { cache: 'no-store' });
    if (dataRes.ok) {
      const data = await dataRes.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}

  return [];
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
  const ts = Date.now();
  try {
    const res = await fetch(`./data/boletim_oficial.json?t=${ts}`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {}
  return [];
}

/**
 * Obtém os metadados, sinopse, glossário e PLANCON do Boletim Meteorológico
 */
export async function getBoletimMetadata() {
  const ts = Date.now();
  try {
    const res = await fetch(`./data/boletim_metadata.json?t=${ts}`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

