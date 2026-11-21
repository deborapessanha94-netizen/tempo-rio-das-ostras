import type { AcumuladosDataset, BoletimMetadata, OpenMeteoData } from './siteData';

export interface CorHeatLevelSpec {
  nivel: 'NC1' | 'NC2' | 'NC3' | 'NC4' | 'NC5';
  nome: string;
  cor_hex: string;
  criterio: string;
  acao: string;
}

export const COR_HEAT_LEVELS: Record<number, CorHeatLevelSpec> = {
  1: {
    nivel: 'NC1',
    nome: 'Calor 1 — Normalidade',
    cor_hex: '#10B981',
    criterio: 'Sem previsão ou registro de índices de calor altos (>= 36°C).',
    acao: 'Sem impactos na rotina da cidade.',
  },
  2: {
    nivel: 'NC2',
    nome: 'Calor 2 — Atenção Térmica',
    cor_hex: '#EAB308',
    criterio: 'Índices de calor altos (36°C a 40°C) por 1 ou 2 dias consecutivos.',
    acao: 'Coordenação e disseminação de informações sobre sintomas de exposição ao calor e hidratação; rotina sem alterações.',
  },
  3: {
    nivel: 'NC3',
    nome: 'Calor 3 — Persistência de Calor',
    cor_hex: '#F97316',
    criterio: 'Índices de calor altos (36°C a 40°C) com permanência ou aumento por ao menos 3 dias consecutivos.',
    acao: 'Reforço intensivo da comunicação preventiva e alerta da Saúde para grupos vulneráveis (idosos, crianças e trabalhadores externos).',
  },
  4: {
    nivel: 'NC4',
    nome: 'Calor 4 — Calor Muito Alto',
    cor_hex: '#EA580C',
    criterio: 'Índices de calor muito altos (40°C a 44°C) com permanência ou aumento por ao menos 3 dias consecutivos.',
    acao: 'Adaptação de rotinas expostas ao sol, indicação de pontos de resfriamento/climatização e sombreamento adequado.',
  },
  5: {
    nivel: 'NC5',
    nome: 'Calor 5 — Calor Extremo',
    cor_hex: '#DC2626',
    criterio: 'Índices de calor extremos (acima de 44°C) com permanência ou aumento por ao menos 3 dias consecutivos.',
    acao: 'Abertura de pontos de resfriamento, possível suspensão de atividades externas de risco/eventos e boletins meteorológicos de 6h em 6h.',
  },
};

export interface HeatIndexDayRow {
  data_iso: string;
  data_br: string;
  t_min_c: number;
  t_max_c: number;
  t_mean_c: number;
  ic_max_c: number | null;
  ic_min_c: number | null;
  hora_pico_ic: string;
  horas_ge_36: number;
  horas_ge_40: number;
  horas_ge_44: number;
  faixa_pico: string;
  faixa_pico_cor: string;
  cor_nivel_num: number;
  cor_nivel: string;
  cor_nome: string;
  cor_hex: string;
  dias_consecutivos_36: number;
  dias_consecutivos_40: number;
  dias_consecutivos_44: number;
  t3d_media_c?: number;
  tmax_3d_media_c?: number;
  ehi_sig?: number;
  ehi_accl?: number;
  ehf_local?: number;
  ehf_classificacao?: string;
  ses_rj_alerta?: string;
}

export interface HeatStationReading {
  codigo: string;
  nome: string;
  temp_c: number;
  ur_pct: number;
  ic_c: number | null;
  faixa: string;
  cor_hex: string;
  ultima_leitura?: string;
  lat?: number | null;
  lon?: number | null;
}

const KNOWN_HEAT_STATION_COORDS: Record<string, { lat: number; lon: number }> = {
  IRIODA17: { lat: -22.531291, lon: -41.957444 },
  IRIODA16: { lat: -22.440357, lon: -41.953913 },
  IRIODA15: { lat: -22.426845, lon: -42.020862 },
  ICASIM5: { lat: -22.573707, lon: -41.985545 },
};

export interface HeatIndicesDataset {
  atualizacao_brt: string;
  atualizacao_iso: string;
  fontes_oficiais: {
    cor_rio: string;
    clima_saude_ms: string;
    ses_rj_excesso_calor: string;
  };
  agora: {
    ic_rede_c: number | null;
    temp_rede_c?: number | null;
    ur_rede_pct?: number | null;
    ic_openmeteo_c?: number | null;
    faixa_instantanea: { faixa: string; cor: string };
    cor_nivel: string;
    cor_nivel_num: number;
    cor_nome: string;
    cor_hex: string;
    cor_criterio: string;
    cor_acao: string;
    ic_pico_hoje_c: number | null;
    hora_pico_hoje: string;
    horas_ge_36_hoje: number;
    dias_consecutivos_36: number;
    estacoes_tempo_real: HeatStationReading[];
  };
  ses_rj_ehf_local: {
    t_p95_climatologico: number;
    ehf99_referencia: number;
    tmax_p75_referencia: number;
    t30d_estacoes_media_c: number | null;
    dias_observados_base: number;
    hoje: Partial<HeatIndexDayRow>;
  };
  clima_saude_ms: {
    disponivel: boolean;
    url_ehf?: string;
    url_risco?: string;
    cd_mun?: string;
    municipio?: string;
    captura_brt?: string;
    profile?: Record<string, any>;
    risco?: Record<string, any>;
    weekly?: Array<Record<string, any>>;
    series_30d?: Array<Record<string, any>>;
  };
  previsao_8dias_calor: HeatIndexDayRow[];
  cor_niveis_referencia: CorHeatLevelSpec[];
}

export function computeRothfuszHeatIndexC(tempC?: number | null, rhPct?: number | null): number | null {
  if (tempC === null || tempC === undefined || rhPct === null || rhPct === undefined) return null;
  const tc = Number(tempC);
  const rh = Math.max(0, Math.min(100, Number(rhPct)));
  if (!Number.isFinite(tc) || !Number.isFinite(rh)) return null;
  if (tc < 20) return Math.round(tc * 10) / 10;

  const tf = (tc * 9) / 5 + 32;
  const hiSimple = 0.5 * (tf + 61 + (tf - 68) * 1.2 + rh * 0.094);
  let hiF: number;

  if ((hiSimple + tf) / 2 < 80) {
    hiF = hiSimple;
  } else {
    hiF =
      -42.379 +
      2.04901523 * tf +
      10.14333127 * rh -
      0.22475541 * tf * rh -
      0.00683783 * tf * tf -
      0.05481717 * rh * rh +
      0.00122874 * tf * tf * rh +
      0.00085282 * tf * rh * rh -
      0.00000199 * tf * tf * rh * rh;

    if (rh < 13 && tf >= 80 && tf <= 112) {
      hiF -= ((13 - rh) / 4) * Math.sqrt(Math.max(0, (17 - Math.abs(tf - 95)) / 17));
    } else if (rh > 85 && tf >= 80 && tf <= 87) {
      hiF += ((rh - 85) / 10) * ((87 - tf) / 5);
    }
  }
  const hiC = ((hiF - 32) * 5) / 9;
  return Math.round(hiC * 10) / 10;
}

export function classifyInstantHeatBand(icC?: number | null): { faixa: string; cor: string } {
  if (icC === null || icC === undefined || !Number.isFinite(icC)) {
    return { faixa: 'Indisponível', cor: '#64748B' };
  }
  if (icC > 44) return { faixa: 'Extremo · COR (> 44°C)', cor: '#991B1B' };
  if (icC >= 40) return { faixa: 'Muito Alto · COR (40–44°C)', cor: '#DC2626' };
  if (icC >= 36) return { faixa: 'Alto · COR (36–40°C)', cor: '#EA580C' };
  if (icC >= 32) return { faixa: 'Cuidado Extremo (32–36°C)', cor: '#F97316' };
  if (icC >= 27) return { faixa: 'Cuidado (27–32°C)', cor: '#CA8A04' };
  return { faixa: 'Conforto Térmico (< 27°C)', cor: '#10B981' };
}

function runLengths(flags: boolean[]): number[] {
  const n = flags.length;
  const out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (!flags[i]) continue;
    let l = i;
    while (l > 0 && flags[l - 1]) l--;
    let r = i;
    while (r + 1 < n && flags[r + 1]) r++;
    out[i] = r - l + 1;
  }
  return out;
}

export function recomputeLiveHeatIndices(params: {
  baseHeat?: HeatIndicesDataset | null;
  acumulados?: AcumuladosDataset | null;
  openMeteo?: OpenMeteoData | null;
  boletimMeta?: (BoletimMetadata & Record<string, any>) | null;
}): HeatIndicesDataset | null {
  const base: HeatIndicesDataset | null =
    params.baseHeat || (params.boletimMeta?.indices_calor as HeatIndicesDataset | undefined) || null;

  // 1. Estações em tempo real (Weather Underground / CEMADEN 20s)
  const estRows: HeatStationReading[] = [];
  for (const st of params.acumulados?.estacoes || []) {
    if (st.temp_atual == null || st.umidade_atual == null) continue;
    const tc = Number(st.temp_atual);
    const ur = Math.round(Number(st.umidade_atual));
    if (!Number.isFinite(tc) || !Number.isFinite(ur)) continue;
    const ic = computeRothfuszHeatIndexC(tc, ur);
    const band = classifyInstantHeatBand(ic);
    const coords = KNOWN_HEAT_STATION_COORDS[st.codigo];
    const latNum = st.lat !== null && st.lat !== undefined && Number.isFinite(Number(st.lat)) ? Number(st.lat) : coords?.lat ?? null;
    const lonNum = st.lon !== null && st.lon !== undefined && Number.isFinite(Number(st.lon)) ? Number(st.lon) : coords?.lon ?? null;
    estRows.push({
      codigo: st.codigo,
      nome: st.nome_curto || st.nome,
      temp_c: Math.round(tc * 10) / 10,
      ur_pct: ur,
      ic_c: ic,
      faixa: band.faixa,
      cor_hex: band.cor,
      ultima_leitura: st.ultima_leitura,
      lat: latNum,
      lon: lonNum,
    });
  }

  const omIcNow =
    params.openMeteo?.current?.temperature_2m != null && params.openMeteo?.current?.relative_humidity_2m != null
      ? computeRothfuszHeatIndexC(
          params.openMeteo.current.temperature_2m,
          params.openMeteo.current.relative_humidity_2m
        )
      : null;

  // 2. Série horária ao vivo (Open-Meteo) para recalcular o pico/horas >= 36°C dos 8 dias
  const omByDay = new Map<string, Array<{ hora: string; tc: number; rh: number; ic: number }>>();
  const hTimes = params.openMeteo?.hourly?.time || [];
  const hTemps = params.openMeteo?.hourly?.temperature_2m || [];
  const hRhs = params.openMeteo?.hourly?.relative_humidity_2m || [];
  for (let i = 0; i < hTimes.length; i++) {
    const tStr = hTimes[i];
    const tc = hTemps[i];
    const rh = hRhs[i];
    if (!tStr || tc == null || rh == null) continue;
    const dIso = tStr.slice(0, 10);
    const ic = computeRothfuszHeatIndexC(tc, rh);
    if (ic === null) continue;
    if (!omByDay.has(dIso)) omByDay.set(dIso, []);
    omByDay.get(dIso)!.push({ hora: tStr.slice(11, 16), tc: Number(tc), rh: Math.round(Number(rh)), ic });
  }

  const baseDays: HeatIndexDayRow[] = base?.previsao_8dias_calor?.length
    ? base.previsao_8dias_calor.map((d) => ({ ...d }))
    : Array.from(omByDay.keys())
        .slice(0, 8)
        .map((dIso) => ({
          data_iso: dIso,
          data_br: `${dIso.slice(8, 10)}/${dIso.slice(5, 7)}/${dIso.slice(0, 4)}`,
          t_min_c: 21,
          t_max_c: 29,
          t_mean_c: 25,
          ic_max_c: null,
          ic_min_c: null,
          hora_pico_ic: '14:00',
          horas_ge_36: 0,
          horas_ge_40: 0,
          horas_ge_44: 0,
          faixa_pico: 'Conforto Térmico (< 27°C)',
          faixa_pico_cor: '#10B981',
          cor_nivel_num: 1,
          cor_nivel: 'NC1',
          cor_nome: COR_HEAT_LEVELS[1].nome,
          cor_hex: COR_HEAT_LEVELS[1].cor_hex,
          dias_consecutivos_36: 0,
          dias_consecutivos_40: 0,
          dias_consecutivos_44: 0,
        }));

  // Atualiza métricas horárias se Open-Meteo ao vivo estiver mais completo
  for (const row of baseDays) {
    const hrs = omByDay.get(row.data_iso);
    if (hrs && hrs.length >= 12) {
      let best = hrs[0];
      let minIc = hrs[0].ic;
      let h36 = 0;
      let h40 = 0;
      let h44 = 0;
      for (const h of hrs) {
        if (h.ic > best.ic) best = h;
        if (h.ic < minIc) minIc = h.ic;
        if (h.ic >= 36) h36++;
        if (h.ic >= 40) h40++;
        if (h.ic > 44) h44++;
      }
      row.ic_max_c = best.ic;
      row.ic_min_c = minIc;
      row.hora_pico_ic = best.hora;
      row.horas_ge_36 = h36;
      row.horas_ge_40 = h40;
      row.horas_ge_44 = h44;
      const bPico = classifyInstantHeatBand(best.ic);
      row.faixa_pico = bPico.faixa;
      row.faixa_pico_cor = bPico.cor;
    }
  }

  // Reaplica classificação oficial do COR (NC1..NC5) sobre o horizonte atualizado
  const r36 = runLengths(baseDays.map((d) => (d.ic_max_c ?? 0) >= 36));
  const r40 = runLengths(baseDays.map((d) => (d.ic_max_c ?? 0) >= 40));
  const r44 = runLengths(baseDays.map((d) => (d.ic_max_c ?? 0) > 44));
  for (let i = 0; i < baseDays.length; i++) {
    const lvl = r44[i] >= 3 ? 5 : r40[i] >= 3 ? 4 : r36[i] >= 3 ? 3 : r36[i] >= 1 ? 2 : 1;
    const spec = COR_HEAT_LEVELS[lvl];
    baseDays[i].cor_nivel_num = lvl;
    baseDays[i].cor_nivel = spec.nivel;
    baseDays[i].cor_nome = spec.nome;
    baseDays[i].cor_hex = spec.cor_hex;
    baseDays[i].dias_consecutivos_36 = r36[i];
    baseDays[i].dias_consecutivos_40 = r40[i];
    baseDays[i].dias_consecutivos_44 = r44[i];
  }

  const validStations = estRows.filter((s) => s.ic_c !== null);
  const icRede = validStations.length
    ? Math.round((validStations.reduce((acc, s) => acc + (s.ic_c || 0), 0) / validStations.length) * 10) / 10
    : omIcNow ?? base?.agora?.ic_rede_c ?? null;
  const tempRede = validStations.length
    ? Math.round((validStations.reduce((acc, s) => acc + s.temp_c, 0) / validStations.length) * 10) / 10
    : params.openMeteo?.current?.temperature_2m ?? null;
  const urRede = validStations.length
    ? Math.round(validStations.reduce((acc, s) => acc + s.ur_pct, 0) / validStations.length)
    : params.openMeteo?.current?.relative_humidity_2m ?? null;

  const hojeRow = baseDays[0];
  const lvlHoje = hojeRow?.cor_nivel_num || 1;
  const specHoje = COR_HEAT_LEVELS[lvlHoje] || COR_HEAT_LEVELS[1];

  return {
    atualizacao_brt:
      base?.atualizacao_brt ||
      new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date()),
    atualizacao_iso: base?.atualizacao_iso || new Date().toISOString(),
    fontes_oficiais: base?.fontes_oficiais || {
      cor_rio: 'https://cor.rio/niveis-de-calor/',
      clima_saude_ms: 'https://clima.saude.gov.br/RJ/rio-das-ostras?modo=ehf',
      ses_rj_excesso_calor: 'https://cisshiny.saude.rj.gov.br/excesso_calor/',
    },
    agora: {
      ic_rede_c: icRede,
      temp_rede_c: tempRede,
      ur_rede_pct: urRede,
      ic_openmeteo_c: omIcNow,
      faixa_instantanea: classifyInstantHeatBand(icRede),
      cor_nivel: specHoje.nivel,
      cor_nivel_num: lvlHoje,
      cor_nome: specHoje.nome,
      cor_hex: specHoje.cor_hex,
      cor_criterio: specHoje.criterio,
      cor_acao: specHoje.acao,
      ic_pico_hoje_c: hojeRow?.ic_max_c ?? base?.agora?.ic_pico_hoje_c ?? null,
      hora_pico_hoje: hojeRow?.hora_pico_ic ?? base?.agora?.hora_pico_hoje ?? '--',
      horas_ge_36_hoje: hojeRow?.horas_ge_36 ?? 0,
      dias_consecutivos_36: hojeRow?.dias_consecutivos_36 ?? 0,
      estacoes_tempo_real: estRows.length ? estRows : base?.agora?.estacoes_tempo_real || [],
    },
    ses_rj_ehf_local: base?.ses_rj_ehf_local || {
      t_p95_climatologico: 28.79,
      ehf99_referencia: 9.34,
      tmax_p75_referencia: 31.05,
      t30d_estacoes_media_c: null,
      dias_observados_base: 0,
      hoje: hojeRow || {},
    },
    clima_saude_ms: base?.clima_saude_ms || { disponivel: false },
    previsao_8dias_calor: baseDays,
    cor_niveis_referencia: base?.cor_niveis_referencia || [1, 2, 3, 4, 5].map((k) => COR_HEAT_LEVELS[k]),
  };
}
