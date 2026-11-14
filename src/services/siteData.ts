export const SITE_BASE = '.';

export interface EstacaoPluvio {
  codigo: string;
  nome: string;
  nome_curto?: string;
  bairro?: string;
  rede: string;
  categoria: 'pws' | 'cemaden' | 'inea' | string;
  tipo?: string;
  tipo_label?: string;
  url?: string;
  url_portal?: string;
  temp_atual?: number | null;
  sensacao_atual?: number | null;
  umidade_atual?: number | null;
  pressao_atual?: number | null;
  uv_atual?: number | null;
  radiacao_solar?: number | null;
  vento_atual?: number | null;
  rajada_atual?: number | null;
  vento_dir_graus?: number | null;
  vento_dir_cardinal?: string | null;
  vento_max_hoje?: number | null;
  hora_vento_max_hoje?: string | null;
  rajada_max_hoje?: number | null;
  hora_rajada_max_hoje?: string | null;
  vento_max_24h?: number | null;
  rajada_max_24h?: number | null;
  chuva_hoje?: number | null;
  chuva_taxa_atual?: number | null;
  inicio_chuva_hoje?: string | null;
  chuva_1h: number | null;
  chuva_4h: number | null;
  chuva_6h?: number | null;
  chuva_12h: number | null;
  chuva_24h: number | null;
  chuva_36h?: number | null;
  chuva_48h: number | null;
  chuva_96h: number | null;
  chuva_mes?: number | null;
  nivel_rio?: string | null;
  cota_atencao?: string | null;
  cota_alerta?: string | null;
  cota_transbordo?: string | null;
  alerta_maximo_pct?: number | null;
  status_rio?: string | null;
  tendencia_rio?: string | null;
  chuva_pluvio_24h?: number | null;
  chuva_pluvio_96h?: number | null;
  ultima_leitura?: string;
  online?: boolean;
  ranking?: number | null;
}

export interface RiverHistoryPoint {
  datetime_brt: string;
  nivel: number;
  chuva: number;
  chuva_1h: number;
  chuva_24h: number;
  chuva_30d: number;
}

export interface RioJundiaData {
  codigo: string;
  nome: string;
  nome_curto: string;
  rede?: string;
  url: string;
  nivel_rio: string;
  cota_atencao: string;
  cota_alerta: string;
  cota_transbordo: string;
  alerta_maximo_pct: number;
  status_rio: string;
  tendencia_rio: string;
  chuva_pluvio_24h: number;
  chuva_pluvio_96h: number;
  ultima_leitura: string;
  historico_recente: RiverHistoryPoint[];
}

export interface AcumuladosDataset {
  atualizacao: string;
  resumo: {
    total_estacoes: number;
    estacoes_online: number;
    maior_acumulado_24h: number;
    maior_estacao_nome: string;
    media_chuva_24h: number;
    status_rede: string;
  };
  estacao_rio_jundia: RioJundiaData;
  estacoes: EstacaoPluvio[];
}

export interface BoletimTurnoRow {
  turno_label: string;
  periodo: string;
  icone: string;
  condicao_resumo: string;
  chuva_mm_est: string;
  chuva_prob_pct: number;
  temp_c: number;
  vento_dir: string;
  vento_vel_kmh: number;
  rajada_max_kmh: number;
  modelos_consenso: string;
  data_iso: string;
  turno_id: string;
}

export interface BoletimMetadata {
  emissao: string;
  periodo: string;
  autor: string;
  turno_vigente_indice: number;
  astronomia?: {
    nascer_sol?: string;
    por_sol?: string;
    fase_lua?: string;
    iluminacao_lua?: number;
    visibilidade_lua?: string;
  };
  inspecao_minuciosa_tempo_severo?: {
    hoje_inspecao?: any;
    dias_inspecionados?: any[];
  };
}

export interface InmetAviso {
  id: string;
  aviso_id?: string;
  severidade: 'Amarelo' | 'Laranja' | 'Vermelho' | string;
  tipo: string;
  titulo?: string;
  descricao: string;
  inicio: string;
  fim: string;
  riscos?: string[];
  instrucoes?: string[];
}

export interface MarinhaAvisos {
  atualizacao: string;
  area: string;
  status: string;
  avisos_ativos: Array<{
    tipo: string;
    numero: string;
    vigencia: string;
    descricao: string;
    severidade: string;
  }>;
}

export interface PraiaCondicao {
  praia: string;
  balneabilidade?: 'Propria' | 'Impropria' | string;
  mar_condicao?: string;
  altura_onda_m?: number;
  periodo_onda_s?: number;
  direcao_onda?: string;
  vento_praia?: string;
  uv_max?: number;
}

export interface OrlaDataset {
  atualizacao: string;
  fonte_marinha?: string;
  praias: PraiaCondicao[];
  boletim_ondas?: {
    altura_significativa_m: number;
    direcao_primaria: string;
    periodo_pico_s: number;
    temperatura_agua_c: number;
  };
}

export interface BalneabilidadeDataset {
  atualizacao: string;
  orgao: string;
  status_geral: string;
  pontos: Array<{
    praia: string;
    ponto: string;
    status: 'Propria' | 'Impropria' | string;
    data_coleta: string;
  }>;
}

export interface TabuaMares {
  porto: string;
  data: string;
  mares: Array<{
    hora: string;
    altura_m: number;
    tipo: 'Prevedor' | 'Baixamar' | 'Preamar' | string;
  }>;
}

export interface HistoricoEstacoesDataset {
  ano: number;
  atualizacao: string;
  resumo_mensal: Array<{
    ano_mes: string;
    rotulo_mes: string;
    chuva_total_mm: number;
    dias_com_chuva: number;
    maior_chuva_dia_mm: number;
    estacao_mais_chuvosa: string;
    vento_rajada_max_kmh?: number;
  }>;
  resumo_diario: Array<{
    data_iso: string;
    media_mm: number;
    maior_mm: number;
    estacao_maior: string;
    vento_rajada_max_kmh?: number;
    sistema_atuante?: string;
  }>;
}

export interface OpenMeteoData {
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    surface_pressure: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    uv_index_max: number[];
  };
}

async function fetchJsonSafe<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`Falha ao carregar ${url}:`, e);
    return null;
  }
}

export async function loadAllLiveSiteData() {
  const ts = Date.now();
  const [
    acumulados,
    boletimOficial,
    boletimMeta,
    inmetAvisos,
    marinhaAvisos,
    orla,
    balneabilidade,
    tabuaMares,
    historico,
    openMeteo,
  ] = await Promise.all([
    fetchJsonSafe<AcumuladosDataset>(`${SITE_BASE}/data/acumulados_estacoes.json?t=${ts}`),
    fetchJsonSafe<BoletimTurnoRow[]>(`${SITE_BASE}/data/boletim_oficial.json?t=${ts}`),
    fetchJsonSafe<BoletimMetadata>(`${SITE_BASE}/data/boletim_metadata.json?t=${ts}`),
    fetchJsonSafe<InmetAviso[]>(`${SITE_BASE}/data/inmet_avisos.json?t=${ts}`),
    fetchJsonSafe<MarinhaAvisos>(`${SITE_BASE}/data/marinha_avisos.json?t=${ts}`),
    fetchJsonSafe<OrlaDataset>(`${SITE_BASE}/data/orla_condicoes.json?t=${ts}`),
    fetchJsonSafe<BalneabilidadeDataset>(`${SITE_BASE}/data/balneabilidade.json?t=${ts}`),
    fetchJsonSafe<TabuaMares>(`${SITE_BASE}/data/tabua_mares.json?t=${ts}`),
    fetchJsonSafe<HistoricoEstacoesDataset>(`${SITE_BASE}/data/historico_estacoes.json?t=${ts}`),
    fetchJsonSafe<OpenMeteoData>(
      'https://api.open-meteo.com/v1/forecast?latitude=-22.5269&longitude=-41.945&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,precipitation,surface_pressure,relative_humidity_2m,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max&timezone=America%2FSao_Paulo&forecast_days=8'
    ),
  ]);

  return {
    acumulados,
    boletimOficial,
    boletimMeta,
    inmetAvisos,
    marinhaAvisos,
    orla,
    balneabilidade,
    tabuaMares,
    historico,
    openMeteo,
  };
}

export function degToCompass(deg: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];
  const val = Math.round(deg / 22.5);
  return directions[val % 16] || 'N';
}

export function wmoToPtBr(code: number): { desc: string; icon: string } {
  switch (code) {
    case 0:
      return { desc: 'Céu Limpo', icon: 'sun' };
    case 1:
      return { desc: 'Predomínio de Sol', icon: 'sun' };
    case 2:
      return { desc: 'Parcialmente Nublado', icon: 'cloud-sun' };
    case 3:
      return { desc: 'Nublado', icon: 'cloud' };
    case 45:
    case 48:
      return { desc: 'Nevoeiro / Névoa', icon: 'cloud-fog' };
    case 51:
    case 53:
    case 55:
      return { desc: 'Garoa / Chuvisco', icon: 'cloud-drizzle' };
    case 61:
      return { desc: 'Chuva Fraca', icon: 'cloud-rain' };
    case 63:
      return { desc: 'Chuva Moderada', icon: 'cloud-rain' };
    case 65:
      return { desc: 'Chuva Forte', icon: 'cloud-rain' };
    case 80:
    case 81:
    case 82:
      return { desc: 'Pancadas de Chuva', icon: 'cloud-rain' };
    case 95:
      return { desc: 'Trovoada / Tempestade', icon: 'cloud-lightning' };
    case 96:
    case 99:
      return { desc: 'Tempestade com Granizo', icon: 'cloud-lightning' };
    default:
      return { desc: 'Instável', icon: 'cloud-sun' };
  }
}
