import { enrichAcumuladosWithLiveTelemetry } from './liveTelemetry';
import { reconcileLiveRainConsensus } from './liveRainConsensus';
import type { HeatIndicesDataset } from './heatIndex';
import type { WindRoseDataset, WindSampleRaw } from './windRose';

export { enrichAcumuladosWithLiveTelemetry };
export type { HeatIndicesDataset, WindRoseDataset, WindSampleRaw };

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
  lat?: number | null;
  lon?: number | null;
  temp_atual?: number | null;
  sensacao_atual?: number | null;
  umidade_atual?: number | null;
  temp_max_hoje?: number | null;
  hora_temp_max_hoje?: string | null;
  ic_max_hoje?: number | null;
  hora_ic_max_hoje?: string | null;
  temp_pico_ic_hoje?: number | null;
  ur_pico_ic_hoje?: number | null;
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
  vento_hoje_amostras?: WindSampleRaw[];
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

export interface UvTempoReal {
  estacao_referencia: string;
  nome_estacao: string;
  url_estacao: string;
  uv: number;
  radiacao_solar: number;
  hora_leitura: string;
}

export interface AcumuladosDataset {
  atualizacao: string;
  total_estacoes?: number;
  total_pluviometricas?: number;
  total_hidrologicas?: number;
  resumo: {
    total_estacoes?: number;
    estacoes_online?: number;
    maior_acumulado_24h: number;
    maior_estacao_nome: string;
    media_chuva_24h: number;
    status_rede?: string;
    rio_jundia_cota?: string;
    rio_jundia_status?: string;
    rio_jundia_pct?: number;
    rio_jundia_tendencia?: string;
    uv_atual?: number;
  };
  estacao_rio_jundia: RioJundiaData;
  estacoes_pluviometricas?: EstacaoPluvio[];
  uv_tempo_real?: UvTempoReal;
  portais_oficiais?: {
    cemaden_mapa?: string;
    alerta_cheias_portal?: string;
  };
  estacoes: EstacaoPluvio[];
}

export interface BoletimTurnoRow {
  turno_label?: string;
  periodo?: string;
  icone?: string;
  condicao_resumo?: string;
  chuva_mm_est?: string;
  chuva_prob_pct?: number;
  temp_c?: number;
  vento_dir?: string;
  vento_vel_kmh?: number;
  rajada_max_kmh?: number;
  modelos_consenso?: string;
  data_iso: string;
  turno_id?: string;
  turno?: string;
  dia_semana?: string;
  rotulo_eixo?: string;
  temp_min?: number;
  temp_max?: number;
  temp_media?: number;
  sensacao_termica?: number;
  umid_min?: number;
  umid_max?: number;
  pressao_hpa?: number;
  vento_vel_min?: number;
  vento_vel_max?: number;
  vento_vel_media?: number;
  rajada_max?: number;
  chuva_media?: number;
  chuva_max?: number;
  taxa_horaria_max?: number;
  taxa_horaria_txt?: string;
  alerta_tempestade?: string | null;
  chuva_faixa_turno?: string;
  chuva_prob?: number;
  mar_ondas?: string;
  mar_condicao?: string;
  indice_uv?: number;
  agua_precipitavel_mm?: number;
  tempo_desc?: string;
  tempo_icone?: string;
}

export interface BoletimMetadata {
  emissao: string;
  emissao_iso?: string;
  generation_epoch_ms?: number;
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
  [key: string]: any;
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

export interface MarinhaAvisoItem {
  numero: string;
  tipo: string;
  area_grupo?: string;
  area: string;
  eh_area_delta?: boolean;
  forca?: string;
  rajadas?: string;
  mar_ondas?: string;
  ondas?: string;
  emissao?: string | null;
  inicio_utc?: string;
  fim_utc?: string;
  inicio_br?: string;
  fim_br?: string;
  status_vigencia?: string;
  periodo?: string;
  validade?: string;
  restricao?: string;
  texto?: string;
  fonte_url?: string;
  // Compatibilidade legada
  vigencia?: string;
  descricao?: string;
  severidade?: string;
}

export interface MarinhaAvisos {
  aviso_ativo?: boolean;
  numero?: string | null;
  tipo?: string;
  area: string;
  forca?: string;
  rajadas?: string;
  inicio_utc?: string | null;
  fim_utc?: string | null;
  inicio?: string | null;
  fim?: string | null;
  inicio_formatado?: string | null;
  fim_formatado?: string | null;
  emissao?: string | null;
  validade?: string;
  mar_ondas?: string;
  restricao?: string;
  atualizacao?: string;
  atualizacao_brt?: string;
  atualizacao_utc?: string;
  fonte_url?: string;
  total_avisos_brasil?: number;
  status?: string;
  avisos_ativos: MarinhaAvisoItem[];
  todos_avisos?: MarinhaAvisoItem[];
  cartas_sinoticas?: Array<{
    horario: string;
    url: string;
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

export interface BalneabilidadePonto {
  praia: string;
  codigo?: string;
  codigo_seirhi?: string;
  localizacao?: string;
  status: 'PRÓPRIA' | 'IMPRÓPRIA' | 'Propria' | 'Impropria' | string;
  badge?: 'success' | 'danger' | string;
  tipo?: 'praia' | 'foz' | 'lagoa' | string;
  data_coleta_iso?: string;
  data_coleta_br?: string;
  motivo?: string | null;
  enterococos_label?: string;
}

export interface BalneabilidadeDataset {
  orgao?: string;
  sistema?: string;
  norma_tecnica?: string;
  url_portal_inea?: string;
  url_fonte?: string;
  url_boletim_pdf?: string;
  url_seirhi?: string;
  boletim_numero?: number;
  data_amostragem?: string;
  data_coleta_iso?: string;
  data_coleta_br?: string;
  data_boletim?: string;
  data_boletim_curta?: string;
  total_pontos?: number;
  total_proprias?: number;
  total_improprias?: number;
  percentual_proprias?: number;
  criterio_conama?: string;
  observacao_tecnica?: string;
  portal_conectado?: boolean;
  seirhi_conectado?: boolean;
  powerbi_conectado?: boolean;
  pontos: BalneabilidadePonto[];
}

export interface TabuaMaresEvento {
  tipo: 'PREAMAR' | 'BAIXA-MAR' | string;
  hora: string;
  altura: number;
  rotulo?: string;
}

export interface TabuaMaresDia {
  data_iso: string;
  data_br: string;
  dia_semana: string;
  eventos: TabuaMaresEvento[];
}

export interface TabuaMares {
  estacao?: string;
  id_estacao_chm?: number;
  latitude?: string;
  longitude?: string;
  fuso?: string;
  orgao_oficial?: string;
  url_oficial?: string;
  url_avisos?: string;
  atualizado_em?: string;
  proxima_mare?: TabuaMaresEvento | null;
  dias?: TabuaMaresDia[];
  porto?: string;
  data?: string;
  mares?: Array<{
    hora: string;
    altura_m: number;
    tipo: string;
  }>;
}

export interface HistoricoDiaEstacao {
  nome: string;
  chuva_mm: number;
  rajada_max_kmh?: number;
}

export interface HistoricoResumoDiario {
  data_iso: string;
  data_br?: string;
  dia?: number;
  mes_num?: number;
  mes_nome?: string;
  ano?: number;
  horas_registradas?: number;
  horas_com_chuva?: number;
  chuva_total_media_mm?: number;
  chuva_maior_estacao_mm?: number;
  chuva_maior_estacao_nome?: string;
  chuva_pico_hora_mm?: number;
  chuva_pico_horario?: string;
  estacoes_totais_dia?: Record<string, HistoricoDiaEstacao>;
  vento_vel_media_kmh?: number;
  vento_vel_max_kmh?: number;
  vento_dir_predominante?: string;
  giro_quadrante_sul?: boolean;
  vento_rajada_max_kmh?: number;
  vento_rajada_max_horario?: string;
  vento_rajada_max_estacao?: string;
  temp_min_c?: number;
  temp_max_c?: number;
  umidade_media_pct?: number;
  pressao_min_hpa?: number;
  pressao_max_hpa?: number;
  pressao_media_hpa?: number;
  sistema_atuante_dia?: string;
  categoria_sistema?: string;
  caracteristicas_dia?: string;
  media_mm?: number;
  maior_mm?: number;
  estacao_maior?: string;
}

export interface HistoricoResumoMensal {
  ano_mes: string;
  ano?: number;
  mes_num?: number;
  mes_nome?: string;
  rotulo_mes: string;
  dias_registrados?: number;
  dias_com_chuva: number;
  chuva_total_media_mm: number;
  chuva_maior_estacao_mm: number;
  chuva_maior_estacao_nome: string;
  estacoes_totais_mes?: Record<string, number>;
  dia_mais_chuvoso?: string;
  vento_vel_media_kmh?: number;
  vento_vel_max_kmh?: number;
  vento_dir_predominante?: string;
  vento_rajada_max_kmh?: number;
  vento_rajada_max_detalhe?: string;
  temp_min_c?: number;
  temp_max_c?: number;
  sistema_atuante_mes?: string;
  caracteristicas_mes?: string;
  chuva_total_mm?: number;
  maior_chuva_dia_mm?: number;
  estacao_mais_chuvosa?: string;
}

export interface HistoricoEstacoesDataset {
  ano?: number;
  atualizacao?: string;
  atualizacao_iso?: string;
  periodo_inicio?: string;
  periodo_fim?: string;
  total_dias?: number;
  total_horas?: number;
  estacoes_monitoradas?: Array<{ id: string; nome: string; bairro?: string; tipo?: string }>;
  arquivos_planilha?: string[];
  resumo_mensal: HistoricoResumoMensal[];
  resumo_diario: HistoricoResumoDiario[];
  registros_horarios?: any[];
}

export interface GlobalNwpDataset {
  daily?: {
    time?: string[];
    precipitation_sum_ecmwf_ifs?: Array<number | null>;
    precipitation_probability_max_ecmwf_ifs?: Array<number | null>;
    precipitation_sum_gfs_seamless?: Array<number | null>;
    precipitation_probability_max_gfs_seamless?: Array<number | null>;
    precipitation_sum_icon_global?: Array<number | null>;
    precipitation_probability_max_icon_global?: Array<number | null>;
    wind_speed_10m_max_ecmwf_ifs?: Array<number | null>;
    wind_gusts_10m_max_ecmwf_ifs?: Array<number | null>;
    wind_speed_10m_max_gfs_seamless?: Array<number | null>;
    wind_gusts_10m_max_gfs_seamless?: Array<number | null>;
    wind_speed_10m_max_icon_global?: Array<number | null>;
    wind_gusts_10m_max_icon_global?: Array<number | null>;
  };
  hourly?: {
    time?: string[];
    precipitation_ecmwf_ifs?: Array<number | null>;
    precipitation_gfs_seamless?: Array<number | null>;
    precipitation_icon_global?: Array<number | null>;
    wind_speed_10m_ecmwf_ifs?: Array<number | null>;
    wind_gusts_10m_ecmwf_ifs?: Array<number | null>;
    wind_direction_10m_ecmwf_ifs?: Array<number | null>;
    wind_speed_10m_gfs_seamless?: Array<number | null>;
    wind_gusts_10m_gfs_seamless?: Array<number | null>;
    wind_direction_10m_gfs_seamless?: Array<number | null>;
    wind_speed_10m_icon_global?: Array<number | null>;
    wind_gusts_10m_icon_global?: Array<number | null>;
    wind_direction_10m_icon_global?: Array<number | null>;
  };
}

export interface OpenMeteoData {
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation?: number;
    weather_code: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability?: number[];
    precipitation?: number[];
    surface_pressure: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    apparent_temperature?: number[];
    wind_gusts_10m?: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max: number[];
    uv_index_max: number[];
  };
}

async function fetchJsonSafe<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`Falha ao carregar ${url}:`, e);
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

const RAW_REPO_DATA_BASE =
  'https://raw.githubusercontent.com/deborapessanha94-netizen/tempo-rio-das-ostras/main';

function parseIsoMs(val?: string | null): number {
  if (!val) return 0;
  const ms = Date.parse(val);
  return Number.isNaN(ms) ? 0 : ms;
}

async function fetchLatestRepoJson<T>(
  relPath: string,
  getFreshnessMs: (item: T) => number
): Promise<T | null> {
  const ts = Date.now();
  const [localRes, rawRes] = await Promise.all([
    fetchJsonSafe<T>(`${SITE_BASE}/${relPath}?t=${ts}`),
    fetchJsonSafe<T>(`${RAW_REPO_DATA_BASE}/${relPath}?t=${ts}`),
  ]);
  if (localRes && rawRes) {
    return getFreshnessMs(rawRes) > getFreshnessMs(localRes) ? rawRes : localRes;
  }
  return rawRes || localRes;
}

export async function fetchMarinhaAvisosLive(): Promise<MarinhaAvisos | null> {
  return fetchLatestRepoJson<MarinhaAvisos>('data/marinha_avisos.json', (item) => {
    const ms = parseIsoMs(item.atualizacao_utc);
    if (ms > 0) return ms;
    return item.todos_avisos?.length || item.avisos_ativos?.length ? 1 : 0;
  });
}

export async function loadAllLiveSiteData(options: { forceFullHistory?: boolean } = {}) {
  const ts = Date.now();
  const acumuladosLivePromise = fetchLatestRepoJson<AcumuladosDataset>(
    'data/acumulados_estacoes.json',
    (item) => parseIsoMs(item.atualizacao)
  ).then(async (base) => {
    try {
      const live = await enrichAcumuladosWithLiveTelemetry(base, {
        quickOnly: false,
        forceFullHistory: Boolean(options.forceFullHistory),
      });
      return live || base;
    } catch {
      return base;
    }
  });

  const metaAndOficialPromise = (async () => {
    const [localMeta, rawMeta, localOficial, rawOficial] = await Promise.all([
      fetchJsonSafe<BoletimMetadata>(`${SITE_BASE}/data/boletim_metadata.json?t=${ts}`),
      fetchJsonSafe<BoletimMetadata>(`${RAW_REPO_DATA_BASE}/data/boletim_metadata.json?t=${ts}`),
      fetchJsonSafe<BoletimTurnoRow[]>(`${SITE_BASE}/data/boletim_oficial.json?t=${ts}`),
      fetchJsonSafe<BoletimTurnoRow[]>(`${RAW_REPO_DATA_BASE}/data/boletim_oficial.json?t=${ts}`),
    ]);
    const getMetaMs = (m: BoletimMetadata | null) =>
      m ? Number(m.generation_epoch_ms || parseIsoMs(m.emissao_iso) || 0) : 0;
    const useRaw = rawMeta !== null && (localMeta === null || getMetaMs(rawMeta) > getMetaMs(localMeta));
    return {
      boletimMeta: useRaw ? rawMeta : localMeta,
      boletimOficial: useRaw ? (rawOficial || localOficial) : (localOficial || rawOficial),
    };
  })();

  const [
    acumulados,
    metaOficial,
    inmetAvisosFile,
    marinhaAvisos,
    orla,
    balneabilidade,
    tabuaMares,
    historico,
    heatIndices,
    windRose,
    openMeteo,
    liveGlobalNwp,
    liveInmetForecastPayload,
    liveInmetAvisosRaw,
    liveCptecHoje,
    liveCptecNext,
  ] = await Promise.all([
    acumuladosLivePromise,
    metaAndOficialPromise,
    fetchJsonSafe<InmetAviso[]>(`${RAW_REPO_DATA_BASE}/data/inmet_avisos.json?t=${ts}`).then(
      (raw) => raw || fetchJsonSafe<InmetAviso[]>(`${SITE_BASE}/data/inmet_avisos.json?t=${ts}`)
    ),
    fetchMarinhaAvisosLive(),
    fetchLatestRepoJson<OrlaDataset>('data/orla_condicoes.json', (item) =>
      parseIsoMs(item.atualizacao)
    ),
    fetchLatestRepoJson<BalneabilidadeDataset>('data/balneabilidade.json', (item) =>
      parseIsoMs(item.data_coleta_iso || item.data_boletim)
    ),
    fetchLatestRepoJson<TabuaMares>('data/tabua_mares.json', (item) =>
      parseIsoMs(item.atualizado_em || item.data)
    ),
    fetchLatestRepoJson<HistoricoEstacoesDataset>('data/historico_estacoes.json', (item) =>
      parseIsoMs(item.atualizacao_iso || item.atualizacao)
    ),
    fetchLatestRepoJson<HeatIndicesDataset>('data/heat_indices.json', (item) =>
      parseIsoMs(item.atualizacao_iso)
    ),
    fetchLatestRepoJson<WindRoseDataset>('data/wind_rose.json', (item) =>
      parseIsoMs(item.atualizacao_iso)
    ),
    fetchJsonSafe<OpenMeteoData>(
      'https://api.open-meteo.com/v1/forecast?latitude=-22.5269&longitude=-41.945&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,apparent_temperature,surface_pressure,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,uv_index_max&timezone=America%2FSao_Paulo&forecast_days=8'
    ),
    fetchJsonSafe<GlobalNwpDataset>(
      'https://api.open-meteo.com/v1/forecast?latitude=-22.5269&longitude=-41.945&hourly=precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,wind_direction_10m&daily=precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max&forecast_days=8&timezone=America%2FSao_Paulo&models=ecmwf_ifs,gfs_seamless,icon_global',
      5000
    ),
    fetchJsonSafe<Record<string, any>>('https://apiprevmet3.inmet.gov.br/previsao/3304524', 4500),
    fetchJsonSafe<{ hoje?: any[]; futuro?: any[] }>('https://apiprevmet3.inmet.gov.br/avisos/ativos', 4500),
    fetchJsonSafe<Record<string, any>>('https://www.cptec.inpe.br/api/forecast-input?city=Rio%20das%20Ostras,%20RJ', 4500),
    fetchJsonSafe<Array<Record<string, any>>>('https://www.cptec.inpe.br/api/forecast-input-next-days?city=Rio%20das%20Ostras,%20RJ', 4500),
  ]);

  const reconciled = reconcileLiveRainConsensus({
    boletimMeta: metaOficial.boletimMeta,
    boletimOficial: metaOficial.boletimOficial,
    acumulados,
    inmetAvisosFile,
    liveInmetForecast: liveInmetForecastPayload?.['3304524'] ?? null,
    liveInmetAvisosRaw,
    liveCptecHoje,
    liveCptecNext,
    liveGlobalNwp,
  });

  // Harmoniza ventos/rajadas horários multi-modelo (ECMWF + ICON + GFS + CPTEC) mantendo openMeteo.current intacto
  let harmonizedOpenMeteo = openMeteo;
  if (openMeteo?.hourly?.time?.length) {
    const hTimes = openMeteo.hourly.time;
    const gH = liveGlobalNwp?.hourly;
    const gIdxMap = new Map<string, number>();
    (gH?.time || []).forEach((tk, gi) => gIdxMap.set(tk.slice(0, 13), gi));
    const backendVentoMap: Record<string, { vel_kmh?: number; rajada_kmh?: number; dir_graus?: number }> =
      (reconciled.boletimMeta as any)?.analise_precipitacao_multifonte?.perfil_horario_oficial_vento || {};

    const newW = [...openMeteo.hourly.wind_speed_10m];
    const newG = [...(openMeteo.hourly.wind_gusts_10m || [])];
    const newD = [...openMeteo.hourly.wind_direction_10m];

    for (let i = 0; i < hTimes.length; i++) {
      const hk = hTimes[i].slice(0, 13);
      const gi = gIdxMap.get(hk);
      const bv = backendVentoMap[hk];
      const wCand: Array<[number, number]> = [];
      const gCand: Array<[number, number]> = [];
      const dCand: Array<[number, number]> = [];

      if (gi !== undefined && gH) {
        const ecW = gH.wind_speed_10m_ecmwf_ifs?.[gi];
        const icW = gH.wind_speed_10m_icon_global?.[gi];
        const gfW = gH.wind_speed_10m_gfs_seamless?.[gi];
        if (ecW != null && Number.isFinite(ecW)) wCand.push([Number(ecW), 0.28]);
        else if (newW[i] != null) wCand.push([Number(newW[i]), 0.28]);
        if (icW != null && Number.isFinite(icW)) wCand.push([Number(icW), 0.24]);
        if (gfW != null && Number.isFinite(gfW)) wCand.push([Number(gfW), 0.22]);

        const ecG = gH.wind_gusts_10m_ecmwf_ifs?.[gi];
        const icG = gH.wind_gusts_10m_icon_global?.[gi];
        const gfG = gH.wind_gusts_10m_gfs_seamless?.[gi];
        if (ecG != null && Number.isFinite(ecG)) gCand.push([Number(ecG), 0.45]);
        else if (newG[i] != null) gCand.push([Number(newG[i]), 0.45]);
        if (icG != null && Number.isFinite(icG)) gCand.push([Number(icG), 0.35]);
        if (gfG != null && Number.isFinite(gfG)) gCand.push([Number(gfG), 0.20]);

        const ecD = gH.wind_direction_10m_ecmwf_ifs?.[gi];
        const icD = gH.wind_direction_10m_icon_global?.[gi];
        const gfD = gH.wind_direction_10m_gfs_seamless?.[gi];
        if (ecD != null && Number.isFinite(ecD)) dCand.push([Number(ecD), 0.40]);
        else if (newD[i] != null) dCand.push([Number(newD[i]), 0.40]);
        if (icD != null && Number.isFinite(icD)) dCand.push([Number(icD), 0.35]);
        if (gfD != null && Number.isFinite(gfD)) dCand.push([Number(gfD), 0.25]);
      }

      if (bv?.vel_kmh != null && Number.isFinite(bv.vel_kmh)) {
        wCand.push([Number(bv.vel_kmh), 0.30]);
      }
      if (wCand.length) {
        const wDen = wCand.reduce((s, p) => s + p[1], 0);
        newW[i] = Math.round((wCand.reduce((s, p) => s + p[0] * p[1], 0) / wDen) * 10) / 10;
      }
      if (gCand.length) {
        const gDen = gCand.reduce((s, p) => s + p[1], 0);
        const gAvg = gCand.reduce((s, p) => s + p[0] * p[1], 0) / gDen;
        newG[i] = Math.round(Math.max(gAvg, (newW[i] || 0) * 1.2) * 10) / 10;
      }
      if (dCand.length) {
        let sx = 0;
        let cx = 0;
        for (const [deg, wt] of dCand) {
          const rad = (deg * Math.PI) / 180;
          sx += Math.sin(rad) * wt;
          cx += Math.cos(rad) * wt;
        }
        newD[i] = Math.round((((Math.atan2(sx, cx) * 180) / Math.PI) + 360) % 360);
      }
    }

    harmonizedOpenMeteo = {
      ...openMeteo,
      hourly: {
        ...openMeteo.hourly,
        wind_speed_10m: newW,
        wind_gusts_10m: newG.length ? newG : openMeteo.hourly.wind_gusts_10m,
        wind_direction_10m: newD,
      },
    };
  }

  return {
    acumulados,
    boletimOficial: reconciled.boletimOficial,
    boletimMeta: reconciled.boletimMeta,
    inmetAvisos: reconciled.inmetAvisos,
    marinhaAvisos,
    orla,
    balneabilidade,
    tabuaMares,
    historico,
    heatIndices,
    windRose,
    openMeteo: harmonizedOpenMeteo,
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
