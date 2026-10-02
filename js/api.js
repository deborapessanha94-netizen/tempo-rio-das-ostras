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
  try {
    const res = await fetch('/api/inmet/previsao');
    if (res.ok) return await res.json();
    throw new Error('API local indisponível');
  } catch (error) {
    // Fallback para arquivo sincronizado na nuvem (GitHub Pages / 24/7)
    try {
      const dataRes = await fetch('./data/inmet_previsao.json');
      if (dataRes.ok) return await dataRes.json();
    } catch (e) {}

    // Fallback direto API INMET
    try {
      const direct = await fetch('https://apiprevmet3.inmet.gov.br/previsao/3304524');
      if (direct.ok) return await direct.json();
    } catch (e) {}
    return null;
  }
}

/**
 * Obtém os avisos meteorológicos ativos do INMET filtrados para Rio das Ostras / RJ
 */
export async function getInmetAlerts() {
  try {
    const res = await fetch('/api/inmet/avisos');
    if (res.ok) return await res.json();
    throw new Error('API local indisponível');
  } catch (error) {
    // Fallback para dados sincronizados na nuvem (GitHub Pages / 24/7)
    try {
      const dataRes = await fetch('./data/inmet_avisos.json');
      if (dataRes.ok) return await dataRes.json();
    } catch (e) {}
    return [];
  }
}

/**
 * Obtém os dados telemétricos das réguas de cheias e rios de Rio das Ostras e Macaé (INEA)
 */
export async function getIneaCheias() {
  try {
    const res = await fetch('/api/inea/cheias');
    if (res.ok) return await res.json();
    throw new Error('API local indisponível');
  } catch (error) {
    // Fallback para telemetria sincronizada na nuvem (GitHub Pages / 24/7)
    try {
      const dataRes = await fetch('./data/inea_cheias.json');
      if (dataRes.ok) return await dataRes.json();
    } catch (e) {}
    return [];
  }
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
