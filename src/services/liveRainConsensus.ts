import type {
  AcumuladosDataset,
  BoletimMetadata,
  BoletimTurnoRow,
  GlobalNwpDataset,
  InmetAviso,
} from './siteData';

const SHIFTS = [
  { name: 'Madrugada', startH: 0, endH: 6 },
  { name: 'Manhã', startH: 6, endH: 12 },
  { name: 'Tarde', startH: 12, endH: 18 },
  { name: 'Noite', startH: 18, endH: 24 },
] as const;

export interface RainSourceDayBreakdown {
  inmet_cosmo_meteograma_mm?: number | null;
  inmet_cosmo_rodada?: string | null;
  inmet_vime_cosmo28_mm?: number | null;
  inmet_vime_cosmo28_faixa?: string | null;
  inmet_vime_cosmo7_mm?: number | null;
  inmet_vime_cosmo7_faixa?: string | null;
  inmet_vime_pwat_mm?: number | null;
  inmet_vime_pwat_faixa?: string | null;
  inmet_vime_cape_jkg?: number | null;
  inmet_vime_cape_faixa?: string | null;
  cptec_wrf_mm?: number | null;
  cptec_multimodel_mm?: number | null;
  cptec_multimodel_horas?: number | null;
  cptec_municipal_mm?: number | null;
  cptec_municipal_prob_pct?: number | null;
  cptec_municipal_valido_hoje?: boolean | null;
  cptec_prob_p05_pct?: number | null;
  inmet_resumo?: string | null;
  inmet_aviso_id?: string | number | null;
  inmet_aviso_cor?: string | null;
  inea_faixa_municipio_mm?: string | null;
  inea_faixa_bacia_mm?: string | null;
  inea_referencia_mm?: number | null;
  inea_radartool_estagio?: string | null;
  ecmwf_ifs_mm?: number | null;
  ecmwf_ifs_prob_pct?: number | null;
  gfs_mm?: number | null;
  gfs_prob_pct?: number | null;
  icon_mm?: number | null;
  icon_prob_pct?: number | null;
  observado_hoje_media_mm?: number | null;
  observado_hoje_max_mm?: number | null;
}

export interface ProbabilisticRainStats {
  p25_mm: number;
  p50_mm: number;
  p75_mm: number;
  p90_teto_mm: number;
  probabilidade_pct: number;
  qtd_fontes_numericas: number;
}

export interface LiveConsensusInputs {
  boletimMeta: (BoletimMetadata & Record<string, any>) | null;
  boletimOficial: BoletimTurnoRow[] | null;
  acumulados: AcumuladosDataset | null;
  inmetAvisosFile: InmetAviso[] | null;
  liveInmetForecast: Record<string, any> | null;
  liveInmetAvisosRaw: { hoje?: any[]; futuro?: any[] } | null;
  liveCptecHoje: Record<string, any> | null;
  liveCptecNext: Array<Record<string, any>> | null;
  liveGlobalNwp?: GlobalNwpDataset | null;
}

export interface LiveConsensusResult {
  boletimMeta: (BoletimMetadata & Record<string, any>) | null;
  boletimOficial: BoletimTurnoRow[] | null;
  inmetAvisos: InmetAviso[] | null;
}

function formatIsoToBr(isoStr?: string | null): string {
  if (!isoStr || isoStr.length < 10) return '';
  const [dPart, tPart] = isoStr.replace('T', ' ').split(' ');
  const parts = dPart.split('-');
  if (parts.length !== 3) return isoStr;
  const hhmm = tPart ? tPart.slice(0, 5) : '';
  return hhmm ? `${parts[2]}/${parts[1]}/${parts[0]} às ${hhmm}` : `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function classifyInmetLevel(desc?: string | null): number {
  if (!desc) return 0;
  const dl = desc.toLowerCase();
  if (dl.includes('trovoad') || dl.includes('tempestade') || dl.includes('chuva forte')) return 3;
  if (dl.includes('pancada')) return 2;
  if (dl.includes('chuva') || dl.includes('chuvisco') || dl.includes('garoa')) {
    return dl.includes('isolada') || dl.includes('possibilidade') ? 1 : 2;
  }
  return 0;
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function classifyRainIntensityLabel(chuvaMm: number, hasAlert: boolean, alertColor?: string | null): string {
  const sev = String(alertColor || '').toLowerCase();
  if (chuvaMm >= 50 || sev === 'vermelho') return 'Chuva muito forte';
  if (chuvaMm >= 25 || sev === 'laranja') return 'Chuva forte';
  if (chuvaMm >= 5 || hasAlert) return 'Chuva moderada';
  if (chuvaMm >= 1.0) return 'Chuva fraca';
  if (chuvaMm >= 0.2) return 'Chuva muito fraca';
  return 'Sem chuva significativa';
}

function weightedQuantiles(samples: Array<[number, number]>): {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
} {
  const valid = samples
    .filter(([v, w]) => Number.isFinite(v) && Number.isFinite(w) && w > 0)
    .map(([v, w]) => [Math.max(0, v), w] as [number, number])
    .sort((a, b) => a[0] - b[0]);

  if (valid.length === 0) return { p25: 0, p50: 0, p75: 0, p90: 0 };
  if (valid.length === 1) {
    const v = valid[0][0];
    return { p25: v, p50: v, p75: v, p90: v };
  }

  const totalW = valid.reduce((acc, [, w]) => acc + w, 0);
  const qAt = (q: number) => {
    const target = q * totalW;
    let cum = 0;
    for (const [val, w] of valid) {
      cum += w;
      if (cum >= target) return val;
    }
    return valid[valid.length - 1][0];
  };

  return {
    p25: qAt(0.25),
    p50: qAt(0.5),
    p75: qAt(0.75),
    p90: qAt(0.9),
  };
}

function normalizeLiveInmetAlerts(raw: { hoje?: any[]; futuro?: any[] } | null): InmetAviso[] | null {
  if (!raw || (!Array.isArray(raw.hoje) && !Array.isArray(raw.futuro))) return null;
  const seen = new Set<string>();
  const list: InmetAviso[] = [];
  for (const cat of ['hoje', 'futuro'] as const) {
    for (const a of raw[cat] || []) {
      const aid = String(a?.id ?? '');
      if (!aid || seen.has(aid)) continue;
      const estados = String(a?.estados || '');
      const geocodes = String(a?.geocodes || '');
      const municipios = String(a?.municipios || '');
      const ehDireto = geocodes.includes('3304524') || municipios.includes('Rio das Ostras');
      const ehRj = estados.includes('Rio de Janeiro') || estados.includes('RJ');
      if (!ehDireto && !ehRj) continue;
      seen.add(aid);

      const sev = String(a?.severidade || 'Perigo Potencial');
      let corNome = 'Amarelo';
      let corHex = '#EAB308';
      if (sev.toLowerCase().includes('grande perigo')) {
        corNome = 'Vermelho';
        corHex = '#DC2626';
      } else if (sev.toLowerCase().includes('perigo') && !sev.toLowerCase().includes('potencial')) {
        corNome = 'Laranja';
        corHex = '#EA580C';
      }
      const rawDIni = String(a?.data_inicio || '').split('T')[0];
      const rawHIni = String(a?.hora_inicio || '00:00').trim();
      const rawDFim = String(a?.data_fim || '').split('T')[0];
      const rawHFim = String(a?.hora_fim || '23:59').trim();
      const ini = String(a?.inicio || (rawDIni ? `${rawDIni} ${rawHIni}` : ''));
      const fim = String(a?.fim || (rawDFim ? `${rawDFim} ${rawHFim}` : ''));
      const descTxt = String(a?.descricao || 'Alerta Meteorológico');
      const avisoItem: InmetAviso & Record<string, any> = {
        id: aid,
        tipo: descTxt,
        descricao: descTxt,
        severidade: sev,
        cor_nome: corNome,
        cor_badge: `Alerta ${corNome} • ${sev}`,
        cor_hex: corHex,
        eh_direto_ostras: ehDireto,
        inicio: ini,
        fim,
        data_inicio: a?.data_inicio || ini,
        hora_inicio: a?.hora_inicio || rawHIni,
        data_fim: a?.data_fim || fim,
        hora_fim: a?.hora_fim || rawHFim,
        inicio_formatado: formatIsoToBr(ini),
        fim_formatado: formatIsoToBr(fim),
        riscos: Array.isArray(a?.riscos) ? a.riscos : [],
        instrucoes: Array.isArray(a?.instrucoes) ? a.instrucoes : [],
        estados,
        municipios,
      };
      list.push(avisoItem);
    }
  }
  const rankColor = (c?: string) => (c === 'Vermelho' ? 0 : c === 'Laranja' ? 1 : 2);
  list.sort((a: any, b: any) => {
    if (Boolean(a.eh_direto_ostras) !== Boolean(b.eh_direto_ostras)) {
      return a.eh_direto_ostras ? -1 : 1;
    }
    return rankColor(a.cor_nome) - rankColor(b.cor_nome);
  });
  return list;
}

function extractAlertMaxRain(alert: any): { taxaMin: number; taxaMax: number; diaMax: number } {
  const txt = Array.isArray(alert?.riscos) ? alert.riscos.join(' ') : String(alert?.riscos || '');
  const mH = txt.match(/(\d+)\s*(?:e|a|-)\s*(\d+)\s*mm\/h/i);
  const mDia = txt.match(/(?:at[eé]|entre)?\s*(\d+)\s*(?:e|a|-)?\s*(\d+)?\s*mm\/dia/i);
  const taxaMin = mH ? parseInt(mH[1], 10) : 20;
  const taxaMax = mH ? parseInt(mH[2], 10) : 30;
  const diaMax = mDia ? parseInt(mDia[2] || mDia[1], 10) : 50;
  return { taxaMin, taxaMax, diaMax };
}

function computeObservedHoje(acumulados: AcumuladosDataset | null): { mediaMm: number; maxMm: number; ativas: number } {
  const list = acumulados?.estacoes || [];
  const vals: number[] = [];
  for (const st of list) {
    if (st.categoria === 'inea') continue;
    const ultima = String(st.ultima_leitura || '').toLowerCase();
    if (ultima.includes('offline') || ultima.includes('sem dados')) continue;
    if (typeof st.chuva_hoje === 'number' && Number.isFinite(st.chuva_hoje) && st.chuva_hoje >= 0 && st.chuva_hoje <= 300) {
      vals.push(st.chuva_hoje);
    }
  }
  if (vals.length === 0) return { mediaMm: 0, maxMm: 0, ativas: 0 };
  const sum = vals.reduce((acc, v) => acc + v, 0);
  return {
    mediaMm: round1(sum / vals.length),
    maxMm: round1(Math.max(...vals)),
    ativas: vals.length,
  };
}

function isoToBr(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function reconcileLiveRainConsensus(inputs: LiveConsensusInputs): LiveConsensusResult {
  const liveAlerts = normalizeLiveInmetAlerts(inputs.liveInmetAvisosRaw);
  const mergedAlerts = liveAlerts !== null ? liveAlerts : inputs.inmetAvisosFile;

  const meta = inputs.boletimMeta ? structuredClone(inputs.boletimMeta) : null;
  const oficial = inputs.boletimOficial ? inputs.boletimOficial.map((r) => ({ ...r })) : null;
  if (!meta) {
    return { boletimMeta: meta, boletimOficial: oficial, inmetAvisos: mergedAlerts };
  }

  const multi = meta.analise_precipitacao_multifonte;
  const previstoPorDia: any[] = Array.isArray(multi?.previsto_por_dia) ? multi.previsto_por_dia : [];

  const liveGlobalDaily = inputs.liveGlobalNwp?.daily;
  const liveGlobalHourly = inputs.liveGlobalNwp?.hourly;
  const hasLiveEcmwf = Boolean(liveGlobalDaily?.precipitation_sum_ecmwf_ifs?.some((v) => v !== null && v !== undefined));
  const hasLiveGfs = Boolean(liveGlobalDaily?.precipitation_sum_gfs_seamless?.some((v) => v !== null && v !== undefined));
  const hasLiveIcon = Boolean(liveGlobalDaily?.precipitation_sum_icon_global?.some((v) => v !== null && v !== undefined));

  const fontesRespondedoras: string[] = [];
  if (
    previstoPorDia.some((p) => p?.fontes?.inmet_cosmo_meteograma_mm !== null && p?.fontes?.inmet_cosmo_meteograma_mm !== undefined) ||
    Object.keys(multi?.inmet_cosmo_meteograma_info?.daily_mm || {}).length > 0
  ) {
    fontesRespondedoras.push('INMET COSMO 7km');
  }
  if (
    meta.vime_inmet?.disponivel ||
    multi?.vime_inmet?.disponivel ||
    previstoPorDia.some((p) => p?.fontes?.inmet_vime_cosmo28_mm !== undefined || p?.fontes?.inmet_vime_cosmo7_mm !== undefined)
  ) {
    fontesRespondedoras.push('INMET VIME 2.8km/7km');
  }
  if (inputs.liveInmetForecast && Object.keys(inputs.liveInmetForecast).length > 0) {
    fontesRespondedoras.push('INMET Previsão (Ao Vivo)');
  }
  if (liveAlerts !== null) fontesRespondedoras.push('INMET Avisos (Ao Vivo)');
  if (
    previstoPorDia.some((p) => p?.fontes?.cptec_wrf_mm !== null && p?.fontes?.cptec_wrf_mm !== undefined) ||
    Object.keys(multi?.cptec_wrf_prob_info?.wrf_daily_mm || {}).length > 0
  ) {
    fontesRespondedoras.push('CPTEC WRF / Prob.');
  }
  if (previstoPorDia.some((p) => Number(p?.fontes?.cptec_multimodel_horas ?? 0) >= 12)) {
    fontesRespondedoras.push('CPTEC Multimodel');
  }
  if (inputs.liveCptecHoje) fontesRespondedoras.push('CPTEC Municipal (Ao Vivo)');
  if (inputs.liveCptecNext && inputs.liveCptecNext.length > 0) fontesRespondedoras.push('CPTEC 6 Dias (Ao Vivo)');
  if (meta.inea_boletim_hidrometeorologico?.previsao_rh8?.hoje?.extraido_pdf) {
    fontesRespondedoras.push('INEA RH-VIII (PDF)');
  }
  if (meta.inea_radartool?.disponivel || multi?.inea_radartool?.disponivel) {
    fontesRespondedoras.push('INEA RadarTool');
  }
  if (hasLiveEcmwf || previstoPorDia.some((p) => p?.fontes?.ecmwf_ifs_mm !== null && p?.fontes?.ecmwf_ifs_mm !== undefined)) {
    fontesRespondedoras.push('ECMWF IFS 9km');
  }
  if (hasLiveGfs || previstoPorDia.some((p) => p?.fontes?.gfs_mm !== null && p?.fontes?.gfs_mm !== undefined)) {
    fontesRespondedoras.push('NOAA GFS');
  }
  if (hasLiveIcon || previstoPorDia.some((p) => p?.fontes?.icon_mm !== null && p?.fontes?.icon_mm !== undefined)) {
    fontesRespondedoras.push('DWD ICON 13km');
  }
  if (inputs.acumulados?.estacoes?.length) fontesRespondedoras.push('CEMADEN/INEA/PWS');

  if (previstoPorDia.length === 0) {
    if (multi) {
      multi.fontes_ao_vivo_status = {
        atualizado_em_brt: new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        }).format(new Date()),
        recalculado_ao_vivo: false,
        fontes_respondedoras: fontesRespondedoras,
        alteracoes_detectadas: [],
      };
    }
    return { boletimMeta: meta, boletimOficial: oficial, inmetAvisos: mergedAlerts };
  }

  // Indexa série horária ao vivo de ECMWF / GFS / ICON por dia-hora
  const globalHourlyShiftMap: Record<string, Record<string, number>> = {};
  if (liveGlobalHourly?.time?.length) {
    for (let i = 0; i < liveGlobalHourly.time.length; i++) {
      const t = liveGlobalHourly.time[i];
      if (!t || !t.includes('T')) continue;
      const [dIso, hPart] = t.split('T');
      const h = parseInt(hPart.slice(0, 2), 10);
      const shift = SHIFTS.find((s) => h >= s.startH && h < s.endH)?.name || 'Madrugada';
      const eVal = Number(liveGlobalHourly.precipitation_ecmwf_ifs?.[i] ?? 0);
      const gVal = Number(liveGlobalHourly.precipitation_gfs_seamless?.[i] ?? 0);
      const icVal = Number(liveGlobalHourly.precipitation_icon_global?.[i] ?? 0);
      const blend = (eVal * 0.22 + gVal * 0.12 + icVal * 0.14) / 0.48;
      globalHourlyShiftMap[dIso] ??= { Madrugada: 0, Manhã: 0, Tarde: 0, Noite: 0 };
      globalHourlyShiftMap[dIso][shift] += blend;
    }
  }

  const perfilHoraOficial: Record<string, number> = multi?.perfil_horario_oficial_chuva || {};
  const obsHoje = computeObservedHoje(inputs.acumulados);
  const ineaRh8 = meta.inea_boletim_hidrometeorologico?.previsao_rh8;
  const alteracoes: string[] = [];

  for (let dIdx = 0; dIdx < previstoPorDia.length; dIdx++) {
    const prevDia = previstoPorDia[dIdx];
    const dateIso: string = prevDia.data_iso;
    const dateBr: string = prevDia.data_br || isoToBr(dateIso);
    const prevFontes: RainSourceDayBreakdown = { ...(prevDia.fontes || {}) };

    // 1. Fontes numéricas brasileiras persistidas do backend
    const cosmoMm =
      prevFontes.inmet_cosmo_meteograma_mm !== undefined && prevFontes.inmet_cosmo_meteograma_mm !== null
        ? Number(prevFontes.inmet_cosmo_meteograma_mm)
        : null;
    const vime28Mm =
      prevFontes.inmet_vime_cosmo28_mm !== undefined && prevFontes.inmet_vime_cosmo28_mm !== null
        ? Number(prevFontes.inmet_vime_cosmo28_mm)
        : null;
    const vime7Mm =
      prevFontes.inmet_vime_cosmo7_mm !== undefined && prevFontes.inmet_vime_cosmo7_mm !== null
        ? Number(prevFontes.inmet_vime_cosmo7_mm)
        : null;
    const wrfMm =
      prevFontes.cptec_wrf_mm !== undefined && prevFontes.cptec_wrf_mm !== null
        ? Number(prevFontes.cptec_wrf_mm)
        : null;
    const mmSum =
      prevFontes.cptec_multimodel_mm !== undefined && prevFontes.cptec_multimodel_mm !== null
        ? Number(prevFontes.cptec_multimodel_mm)
        : null;
    const mmHours = Number(prevFontes.cptec_multimodel_horas ?? 0);
    const hasMmDay = mmSum !== null && mmHours >= 12;
    const p05Pct =
      prevFontes.cptec_prob_p05_pct !== undefined && prevFontes.cptec_prob_p05_pct !== null
        ? Number(prevFontes.cptec_prob_p05_pct)
        : null;
    const pwatVal =
      prevFontes.inmet_vime_pwat_mm !== undefined && prevFontes.inmet_vime_pwat_mm !== null
        ? Number(prevFontes.inmet_vime_pwat_mm)
        : null;
    const capeVal =
      prevFontes.inmet_vime_cape_jkg !== undefined && prevFontes.inmet_vime_cape_jkg !== null
        ? Number(prevFontes.inmet_vime_cape_jkg)
        : null;

    // 2. Modelos Globais (base Windy): ECMWF IFS 9km, NOAA GFS, DWD ICON 13km (ao vivo se disponível, senão backend)
    const gIdx = liveGlobalDaily?.time?.indexOf(dateIso) ?? -1;
    const readG = (arr?: Array<number | null>, fallback?: number | null): number | null => {
      if (gIdx >= 0 && arr && arr[gIdx] !== null && arr[gIdx] !== undefined && Number.isFinite(Number(arr[gIdx]))) {
        return Number(arr[gIdx]);
      }
      return fallback !== undefined && fallback !== null ? Number(fallback) : null;
    };
    const ecmwfMm = readG(liveGlobalDaily?.precipitation_sum_ecmwf_ifs, prevFontes.ecmwf_ifs_mm);
    const ecmwfProb = readG(liveGlobalDaily?.precipitation_probability_max_ecmwf_ifs, prevFontes.ecmwf_ifs_prob_pct);
    const gfsMm = readG(liveGlobalDaily?.precipitation_sum_gfs_seamless, prevFontes.gfs_mm);
    const gfsProb = readG(liveGlobalDaily?.precipitation_probability_max_gfs_seamless, prevFontes.gfs_prob_pct);
    const iconMm = readG(liveGlobalDaily?.precipitation_sum_icon_global, prevFontes.icon_mm);
    const iconProb = readG(liveGlobalDaily?.precipitation_probability_max_icon_global, prevFontes.icon_prob_pct);

    // 3. CPTEC Municipal & 6 Dias ao vivo
    let cptecProb: number | null = prevFontes.cptec_municipal_prob_pct ?? null;
    let cptecMunMm: number | null = prevFontes.cptec_municipal_mm ?? null;
    let cptecValidoHoje = Boolean(prevFontes.cptec_municipal_valido_hoje);
    if (dIdx === 0 && inputs.liveCptecHoje) {
      const horaAtual = String(inputs.liveCptecHoje.hora_atual || '');
      let horaAtualBrtIso = horaAtual.slice(0, 10);
      if (horaAtual.length >= 13 && horaAtual.includes('T')) {
        const parsedMs = Date.parse(horaAtual);
        if (Number.isFinite(parsedMs)) {
          horaAtualBrtIso = new Date(parsedMs - 3 * 3600_000).toISOString().slice(0, 10);
        }
      }
      if (horaAtualBrtIso === dateIso) {
        cptecValidoHoje = true;
        const pLive = Number(inputs.liveCptecHoje.probabilidade_chuva);
        const mLive = Number(inputs.liveCptecHoje.precipitacao_acumulada);
        if (Number.isFinite(pLive)) cptecProb = pLive;
        if (Number.isFinite(mLive)) cptecMunMm = mLive;
      } else {
        cptecValidoHoje = false;
      }
    } else if (dIdx > 0 && inputs.liveCptecNext?.length) {
      const dayNum = dateIso.slice(8, 10);
      const item = inputs.liveCptecNext.find((it) => String(it?.data_atual || '').padStart(2, '0') === dayNum);
      if (item && item.probabilidade_chuva !== undefined) {
        const pLive = Number(item.probabilidade_chuva);
        if (Number.isFinite(pLive)) cptecProb = pLive;
      }
    }

    // 4. INMET Previsão (ao vivo se disponível, senão snapshot)
    const liveInmetDia = inputs.liveInmetForecast?.[dateBr];
    const inmetTurnDescs: Record<string, string> = {};
    const inmetTurnLevels: Record<string, number> = {};
    let inmetResumoStr: string | null = prevFontes.inmet_resumo ?? null;

    if (liveInmetDia && typeof liveInmetDia === 'object') {
      const hasTurns = 'manha' in liveInmetDia || 'tarde' in liveInmetDia || 'noite' in liveInmetDia;
      if (hasTurns) {
        const mapT: Record<string, any> = {
          Madrugada: liveInmetDia.manha,
          Manhã: liveInmetDia.manha,
          Tarde: liveInmetDia.tarde,
          Noite: liveInmetDia.noite,
        };
        const descs: string[] = [];
        for (const s of SHIFTS) {
          const r = String(mapT[s.name]?.resumo || '').trim();
          inmetTurnDescs[s.name] = r;
          inmetTurnLevels[s.name] = classifyInmetLevel(r);
          if (r && !descs.includes(r)) descs.push(r);
        }
        inmetResumoStr = descs.join(' / ') || inmetResumoStr;
      } else if (liveInmetDia.resumo) {
        const r = String(liveInmetDia.resumo).trim();
        const lvl = classifyInmetLevel(r);
        for (const s of SHIFTS) {
          inmetTurnDescs[s.name] = r;
          inmetTurnLevels[s.name] = s.name === 'Tarde' || s.name === 'Noite' || lvl <= 1 ? lvl : Math.max(1, lvl - 1);
        }
        inmetResumoStr = r;
      }
    } else if (inmetResumoStr) {
      const lvl = classifyInmetLevel(inmetResumoStr);
      for (const s of SHIFTS) {
        inmetTurnDescs[s.name] = inmetResumoStr;
        inmetTurnLevels[s.name] = s.name === 'Tarde' || s.name === 'Noite' || lvl <= 1 ? lvl : Math.max(1, lvl - 1);
      }
    }
    const inmetDayLevel = Math.max(0, ...Object.values(inmetTurnLevels));

    // 5. Alertas INMET diretos (ao vivo)
    const dayAlerts = (mergedAlerts || []).filter((a: any) => {
      if (!a?.eh_direto_ostras) return false;
      const ini = String(a.inicio || '').slice(0, 10);
      const fim = String(a.fim || '').slice(0, 10);
      if (ini && fim) return ini <= dateIso && dateIso <= fim;
      return ini === dateIso;
    });

    // 6. INEA Boletim RH-VIII (extração real do PDF do backend)
    const ineaPrev =
      ineaRh8?.hoje?.extraido_pdf && ineaRh8.hoje.data === dateBr
        ? ineaRh8.hoje
        : ineaRh8?.amanha?.extraido_pdf && ineaRh8.amanha.data === dateBr
          ? ineaRh8.amanha
          : null;

    // 7. Amostragem Ponderada Probabilística (Fontes BR + ECMWF/GFS/ICON, pesos idênticos ao Python)
    const samples: Array<[number, number]> = [];
    if (cosmoMm !== null) samples.push([cosmoMm, 0.25]);
    if (vime28Mm !== null) samples.push([vime28Mm, 0.22]);
    if (vime7Mm !== null) samples.push([vime7Mm, 0.12]);
    if (wrfMm !== null) samples.push([wrfMm, 0.19]);
    if (hasMmDay && mmSum !== null) samples.push([mmSum, 0.2]);
    if (dIdx === 0 && cptecValidoHoje && cptecMunMm !== null && cptecMunMm > 0) {
      samples.push([cptecMunMm, 0.12]);
    }

    let ineaTargetMm: number | null = prevFontes.inea_referencia_mm ?? null;
    let ineaW = 0.0;
    if (ineaPrev && ineaPrev.chuva_min_mm !== null && ineaPrev.chuva_max_mm !== null) {
      const bmin = Number(ineaPrev.chuva_min_mm);
      const bmax = Number(ineaPrev.chuva_max_mm);
      const baciaMax = ineaPrev.chuva_bacia_max_mm !== undefined ? Number(ineaPrev.chuva_bacia_max_mm) : bmax;
      if (bmin === 0 && bmax <= 1.0 && baciaMax >= 10.0) {
        ineaTargetMm = 0.8;
        ineaW = 0.22;
      } else if (bmax <= 10.0) {
        ineaTargetMm = bmin + 0.25 * (bmax - bmin);
        ineaW = 0.18;
      } else {
        ineaTargetMm = bmin + 0.35 * (bmax - bmin);
        ineaW = 0.3;
      }
      samples.push([ineaTargetMm, ineaW]);
    } else if (ineaTargetMm !== null) {
      samples.push([ineaTargetMm, 0.18]);
    }

    if (ecmwfMm !== null) samples.push([ecmwfMm, 0.18]);
    if (gfsMm !== null) samples.push([gfsMm, 0.12]);
    if (iconMm !== null) samples.push([iconMm, 0.14]);

    if (samples.length === 0) {
      const fallbackBase = Number(prevDia.chuva_media_modelos_mm ?? 0);
      samples.push([fallbackBase, 1.0]);
    }

    const totalW = samples.reduce((acc, [, w]) => acc + w, 0) || 1;
    const esperancaModelos = samples.reduce((acc, [v, w]) => acc + v * w, 0) / totalW;
    const qRaw = weightedQuantiles(samples);

    let p25 = qRaw.p25;
    let p50 = esperancaModelos;
    let p75 = qRaw.p75;
    let p90 = Math.max(qRaw.p90, p75);

    if (ineaPrev && ineaPrev.chuva_min_mm !== null && Number(ineaPrev.chuva_min_mm) >= 10) {
      p50 = Math.max(p50, 0.65 * Number(ineaPrev.chuva_min_mm));
    }

    if (inmetDayLevel >= 3) p50 = Math.max(p50, 2.2);
    else if (inmetDayLevel === 2) p50 = Math.max(p50, 1.5);
    else if (inmetDayLevel === 1) p50 = Math.max(p50, 0.6);

    const ineaCondLow = String(ineaPrev?.condicao || '').toLowerCase();
    if ((ineaPrev?.tem_raios_icone || ineaCondLow.includes('raios')) && p50 < 1.8) {
      p50 = Math.max(p50, 1.8);
    }

    for (const [val] of samples) {
      p90 = Math.max(p90, val);
    }
    if (hasIneaTenMmCeiling(ineaPrev)) {
      p90 = Math.max(p90, Number(ineaPrev.chuva_max_mm));
    }

    if (dayAlerts.length > 0) {
      const sev = String((dayAlerts[0] as any).cor_nome || 'Amarelo');
      const floor = sev === 'Vermelho' ? 30.0 : sev === 'Laranja' ? 15.0 : 5.0;
      p50 = Math.max(p50, floor);
      p75 = Math.max(p75, p50);
      const alertLimits = extractAlertMaxRain(dayAlerts[0]);
      p90 = Math.max(p90, alertLimits.diaMax);
    }

    if (dIdx === 0 && obsHoje.mediaMm > 0) {
      p50 = Math.max(p50, obsHoje.mediaMm);
      p25 = Math.max(p25, obsHoje.mediaMm);
      p75 = Math.max(p75, p50);
      p90 = Math.max(p90, obsHoje.maxMm);
    }

    p25 = round1(Math.min(p25, p50));
    p50 = round1(Math.max(0, p50));
    p75 = round1(Math.max(p50, p75));
    p90 = round1(Math.max(p75, p90));

    // Probabilidade condicional combinada
    const probSignals: Array<[number, number]> = [];
    if (cptecProb !== null) probSignals.push([cptecProb, 0.2]);
    if (p05Pct !== null) probSignals.push([p05Pct, 0.2]);
    if (ecmwfProb !== null) probSignals.push([ecmwfProb, 0.14]);
    if (gfsProb !== null) probSignals.push([gfsProb, 0.12]);
    if (iconProb !== null) probSignals.push([iconProb, 0.1]);
    if (inmetResumoStr) {
      const inmetProbMap: Record<number, number> = { 0: 10, 1: 40, 2: 58, 3: 75 };
      probSignals.push([inmetProbMap[inmetDayLevel] ?? 20, 0.24]);
    }
    if (ineaPrev) {
      const ineaP = ineaPrev.tem_raios_icone || Number(ineaPrev.chuva_min_mm ?? 0) >= 10 ? 70 : Number(ineaPrev.chuva_max_mm ?? 0) >= 10 ? 48 : 25;
      probSignals.push([ineaP, 0.18]);
    }

    let probPct =
      probSignals.length > 0
        ? probSignals.reduce((acc, [v, w]) => acc + v * w, 0) / probSignals.reduce((acc, [, w]) => acc + w, 0)
        : Math.round(100 * (samples.filter(([v]) => v >= 0.3).reduce((acc, [, w]) => acc + w, 0) / totalW));

    if (dIdx <= 1 && pwatVal !== null && capeVal !== null) {
      if (capeVal >= 500 && pwatVal >= 45) probPct += 12;
      else if (capeVal < 250 && pwatVal < 35 && inmetDayLevel <= 1) probPct -= 5;
    }
    if (inmetDayLevel >= 3) probPct = Math.max(probPct, 65);
    else if (inmetDayLevel === 2) probPct = Math.max(probPct, 50);
    if (dayAlerts.length > 0) probPct = Math.max(probPct, 80);
    if (dIdx === 0 && obsHoje.mediaMm > 0) probPct = Math.max(probPct, 85);
    probPct = Math.max(5, Math.min(100, Math.round(probPct)));

    const oldDayMm = round1(Number(prevDia.chuva_media_modelos_mm ?? 0));
    if (Math.abs(p50 - oldDayMm) >= 0.2) {
      alteracoes.push(`${dateBr.slice(0, 5)}: ${oldDayMm.toFixed(1)} → ${p50.toFixed(1)} mm`);
    }
    const oldAlertId = prevDia.alerta_inmet_id ?? null;
    const newAlertId = dayAlerts[0]?.id ?? null;
    if (String(newAlertId || '') !== String(oldAlertId || '') && newAlertId) {
      alteracoes.push(`Novo Aviso INMET nº ${newAlertId} (${dateBr.slice(0, 5)})`);
    }

    const activeAlert = dayAlerts[0] as any;
    const alertLimits = activeAlert ? extractAlertMaxRain(activeAlert) : null;
    const newPicoMax = alertLimits ? Math.max(alertLimits.diaMax, p90) : p90;
    const newFaixaOficial = activeAlert
      ? `${p50.toFixed(1)} mm (P50) • Faixa ${p25.toFixed(1)}–${p90.toFixed(1)} mm • Até ${newPicoMax.toFixed(0)} mm (Alerta INMET)`
      : `${p50.toFixed(1)} mm (P50) • P25–P90: ${p25.toFixed(1)}–${p90.toFixed(1)} mm (${probPct}%)`;

    const probStats: ProbabilisticRainStats = {
      p25_mm: p25,
      p50_mm: p50,
      p75_mm: p75,
      p90_teto_mm: p90,
      probabilidade_pct: probPct,
      qtd_fontes_numericas: samples.length,
    };

    const rainIntensityLabel = classifyRainIntensityLabel(p50, Boolean(activeAlert), activeAlert?.cor_nome);
    prevDia.intensidade_chuva = rainIntensityLabel;
    prevDia.chuva_media_modelos_mm = p50;
    prevDia.chuva_p25_mm = p25;
    prevDia.chuva_p50_mm = p50;
    prevDia.chuva_p75_mm = p75;
    prevDia.chuva_p90_teto_mm = p90;
    prevDia.probabilistico = probStats;
    prevDia.chuva_pico_convectivo_mm = newPicoMax;
    prevDia.faixa_oficial = newFaixaOficial;
    prevDia.chuva_prob_pct = probPct;
    prevDia.tem_alerta_inmet = Boolean(activeAlert);
    prevDia.alerta_inmet_id = activeAlert ? activeAlert.id : null;
    prevDia.taxa_horaria_pico = alertLimits ? `${alertLimits.taxaMin} a ${alertLimits.taxaMax} mm/h` : p50 > 0 ? '< 5 mm/h' : '0 mm/h';
    prevDia.fontes = {
      ...prevFontes,
      ecmwf_ifs_mm: ecmwfMm !== null ? round1(ecmwfMm) : null,
      ecmwf_ifs_prob_pct: ecmwfProb !== null ? Math.round(ecmwfProb) : null,
      gfs_mm: gfsMm !== null ? round1(gfsMm) : null,
      gfs_prob_pct: gfsProb !== null ? Math.round(gfsProb) : null,
      icon_mm: iconMm !== null ? round1(iconMm) : null,
      icon_prob_pct: iconProb !== null ? Math.round(iconProb) : null,
      cptec_municipal_mm: cptecValidoHoje ? cptecMunMm : null,
      cptec_municipal_prob_pct: cptecProb !== null ? Math.round(cptecProb) : null,
      cptec_municipal_valido_hoje: dIdx === 0 ? cptecValidoHoje : null,
      inmet_resumo: inmetResumoStr,
      inmet_aviso_id: activeAlert ? activeAlert.id : null,
      inmet_aviso_cor: activeAlert ? activeAlert.cor_nome : null,
      inea_referencia_mm: ineaTargetMm !== null ? round1(ineaTargetMm) : prevFontes.inea_referencia_mm ?? null,
      observado_hoje_media_mm: dIdx === 0 ? obsHoje.mediaMm : null,
      observado_hoje_max_mm: dIdx === 0 ? obsHoje.maxMm : null,
    };

    const card = meta.dias_resumo?.[dIdx];
    if (card) {
      card.intensidade_chuva = rainIntensityLabel;
    }
    if (card?.pilares?.chuva) {
      card.pilares.chuva.val = activeAlert
        ? `${p50.toFixed(1)} mm (${probPct}% • P25–P90: ${p25.toFixed(1)}–${p90.toFixed(1)} mm • Teto ${newPicoMax.toFixed(0)} mm)`
        : `${p50.toFixed(1)} mm (${probPct}% • P25–P90: ${p25.toFixed(1)}–${p90.toFixed(1)} mm)`;
    }
    if (card && Array.isArray(card.informe_populacao) && card.informe_populacao.length >= 2 && Math.abs(p50 - oldDayMm) >= 0.2) {
      const oldP2 = String(card.informe_populacao[1] || '');
      const updatedP2 = oldP2
        .replace(
          /\((?:consenso(?: P50)? de|m[eé]dia de|acumulado (?:estimado|previsto) de)\s+\d+(?:[.,]\d+)?\s*mm(?:[^)]*)\)/i,
          `(consenso de ${p50.toFixed(1)} mm no dia; probabilidade de ${probPct}%)`
        );
      card.informe_populacao[1] = updatedP2;
    }

    // Rebalanceia os 4 turnos em boletimOficial combinando perfil oficial + globais ao vivo
    if (oficial) {
      const dayTurnRows = oficial.filter((r) => r.data_iso === dateIso);
      if (dayTurnRows.length > 0) {
        const shiftHourSum: Record<string, number> = {};
        for (const s of SHIFTS) {
          let hSum = 0;
          for (let h = s.startH; h < s.endH; h++) {
            const key = `${dateIso}T${String(h).padStart(2, '0')}`;
            hSum += Number(perfilHoraOficial[key] ?? 0);
          }
          const gShiftVal = Number(globalHourlyShiftMap[dateIso]?.[s.name] ?? 0);
          shiftHourSum[s.name] = gShiftVal > 0 ? hSum * 0.65 + gShiftVal * 0.35 : hSum;
        }

        const weights: Record<string, number> = {};
        for (const r of dayTurnRows) {
          const tName = r.turno || r.turno_label || '';
          const oldVal = Number(r.chuva_media ?? 0);
          const offHVal = Number(shiftHourSum[tName] ?? 0);
          const inmLvl = inmetTurnLevels[tName] ?? 0;
          const convBoost = inmLvl >= 3 ? (tName === 'Tarde' || tName === 'Noite' ? 0.5 : 0.2) : inmLvl === 2 ? 0.25 : 0.05;
          const alertBoost = activeAlert && tName === 'Tarde' ? 0.8 : activeAlert && tName === 'Noite' ? 0.5 : 0;
          weights[tName] = Math.max(0.01, oldVal * 0.5 + offHVal * 0.5 + convBoost + alertBoost);
        }
        const wSum = Object.values(weights).reduce((a, b) => a + b, 0);
        if (p50 <= 0) {
          for (const r of dayTurnRows) {
            r.chuva_media = 0.0;
            r.chuva_faixa_turno = '0.0 mm';
          }
        } else {
          let running = 0;
          let heaviestRow = dayTurnRows[0];
          let maxW = -1;
          for (const r of dayTurnRows) {
            const tName = r.turno || r.turno_label || '';
            const w = weights[tName] ?? 0.25;
            if (w > maxW) {
              maxW = w;
              heaviestRow = r;
            }
            const alloc = round1(p50 * (w / wSum));
            r.chuva_media = alloc;
            running += alloc;
          }
          const residual = round1(p50 - running);
          if (Math.abs(residual) > 0) {
            heaviestRow.chuva_media = round1(Math.max(0, Number(heaviestRow.chuva_media ?? 0) + residual));
          }
          for (const r of dayTurnRows) {
            if (activeAlert && (r.turno === 'Tarde' || r.turno === 'Noite')) {
              r.chuva_faixa_turno = `${Number(r.chuva_media ?? 0).toFixed(1)} mm (pico até ${alertLimits?.taxaMax ?? 30} mm/h)`;
              r.chuva_prob = Math.max(Number(r.chuva_prob ?? 0), r.turno === 'Tarde' ? 80 : 70);
            } else {
              r.chuva_faixa_turno = `${Number(r.chuva_media ?? 0).toFixed(1)} mm`;
            }
          }
        }
      }
    }
  }

  const vals = previstoPorDia.map((d) => Number(d.chuva_media_modelos_mm ?? 0));
  const sum3d = round1(vals.slice(0, 3).reduce((a, b) => a + b, 0));
  const sum4d = round1(vals.slice(0, 4).reduce((a, b) => a + b, 0));
  const sum8d = round1(vals.reduce((a, b) => a + b, 0));

  multi.acumulado_3dias_media = sum3d;
  multi.acumulado_4dias_media = sum4d;
  multi.acumulado_semana_media = sum8d;
  multi.acumulado_8dias_media = sum8d;
  multi.dias_somados = vals;
  const formulaStr =
    previstoPorDia
      .map((d) => `${Number(d.chuva_media_modelos_mm ?? 0).toFixed(1)} mm (${String(d.dia_semana || '').slice(0, 3)})`)
      .join(' + ') + ` = ${sum8d.toFixed(1)} mm`;
  multi.acumulado_semana_formula = formulaStr;
  multi.acumulado_8dias_formula = formulaStr;
  multi.observado_hoje_estacoes = {
    media_mm: obsHoje.mediaMm,
    max_mm: obsHoje.maxMm,
    estacoes_ativas: obsHoje.ativas,
  };
  multi.fontes_ao_vivo_status = {
    atualizado_em_brt: new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }).format(new Date()),
    recalculado_ao_vivo: alteracoes.length > 0,
    fontes_respondedoras: fontesRespondedoras,
    alteracoes_detectadas: alteracoes,
  };

  if (meta.kpis) {
    meta.kpis.chuva_3d = `${sum3d.toFixed(1)} mm`;
    meta.kpis.chuva_4d = `${sum4d.toFixed(1)} mm`;
    meta.kpis.chuva_8d = `${sum8d.toFixed(1)} mm`;
  }

  return {
    boletimMeta: meta,
    boletimOficial: oficial,
    inmetAvisos: mergedAlerts,
  };
}

function hasIneaTenMmCeiling(ineaPrev: any): boolean {
  return Boolean(ineaPrev && ineaPrev.chuva_max_mm !== undefined && ineaPrev.chuva_max_mm !== null && Number(ineaPrev.chuva_max_mm) >= 10);
}
