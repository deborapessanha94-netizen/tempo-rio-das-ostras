import type { AcumuladosDataset, EstacaoPluvio } from './siteData';

const KNOWN_WU_KEYS = [
  'ff90f212a6984a7390f212a698ea73cc',
  'e1f10a1e78da46f5b10a1e78da96f525',
];

let activeWuKeyIndex = 0;

interface StationSeedMeta {
  codigo: string;
  nome: string;
  nome_curto: string;
  bairro: string;
  rede: string;
  categoria: 'pws' | 'cemaden';
  url: string;
  url_portal?: string;
}

const PWS_CATALOG: StationSeedMeta[] = [
  {
    codigo: 'IRIODA17',
    nome: 'Praia da Tartaruga - IRIODA17',
    nome_curto: 'Praia da Tartaruga',
    bairro: 'Praia da Tartaruga',
    rede: 'PWS Weather Underground',
    categoria: 'pws',
    url: 'https://www.wunderground.com/dashboard/pws/IRIODA17',
  },
  {
    codigo: 'IRIODA16',
    nome: 'Cantagalo / Extensão do Bosque (Escoteiros) - IRIODA16',
    nome_curto: 'Cantagalo / Extensão do Bosque',
    bairro: 'Cantagalo / Extensão do Bosque',
    rede: 'PWS Weather Underground',
    categoria: 'pws',
    url: 'https://www.wunderground.com/dashboard/pws/IRIODA16',
  },
  {
    codigo: 'IRIODA15',
    nome: 'Rocha Leão / REBIO União (ICMBio) - IRIODA15',
    nome_curto: 'Rocha Leão / REBIO União',
    bairro: 'Rocha Leão / Reserva União',
    rede: 'PWS Weather Underground',
    categoria: 'pws',
    url: 'https://www.wunderground.com/dashboard/pws/IRIODA15',
  },
  {
    codigo: 'ICASIM5',
    nome: 'Barra de São João / Praiamar (Divisa) - ICASIM5',
    nome_curto: 'Barra de São João / Praiamar',
    bairro: 'Praiamar / Divisa Casimiro',
    rede: 'PWS Weather Underground',
    categoria: 'pws',
    url: 'https://www.wunderground.com/dashboard/pws/ICASIM5',
  },
  {
    codigo: 'IRIODA6',
    nome: 'Escola Jacinto (Costazul) - IRIODA6',
    nome_curto: 'Escola Jacinto (Costazul)',
    bairro: 'Costazul',
    rede: 'PWS Weather Underground',
    categoria: 'pws',
    url: 'https://www.wunderground.com/dashboard/pws/IRIODA6',
  },
  {
    codigo: 'IRIODA5',
    nome: 'Parque dos Pássaros (Jardim Mariléa) - IRIODA5',
    nome_curto: 'Parque dos Pássaros (Jd. Mariléa)',
    bairro: 'Jardim Mariléa',
    rede: 'PWS Weather Underground',
    categoria: 'pws',
    url: 'https://www.wunderground.com/dashboard/pws/IRIODA5',
  },
];

const CEMADEN_CATALOG: (StationSeedMeta & { cid: string })[] = [
  {
    cid: '18788',
    codigo: 'PCD 18788',
    nome: 'Palmital 01 (PCD 18788)',
    nome_curto: 'Palmital 01',
    bairro: 'Palmital / Rio Jundiá',
    rede: 'CEMADEN Nacional',
    categoria: 'cemaden',
    url: 'https://resources.cemaden.gov.br/graficos/interativo/grafico_CEMADEN.php?idpcd=18788&uf=RJ',
    url_portal: 'https://mapainterativo.cemaden.gov.br/',
  },
  {
    cid: '18790',
    codigo: 'PCD 18790',
    nome: 'Palmital 02 (PCD 18790)',
    nome_curto: 'Palmital 02',
    bairro: 'Palmital / Encostas',
    rede: 'CEMADEN Nacional',
    categoria: 'cemaden',
    url: 'https://resources.cemaden.gov.br/graficos/interativo/grafico_CEMADEN.php?idpcd=18790&uf=RJ',
    url_portal: 'https://mapainterativo.cemaden.gov.br/',
  },
  {
    cid: '18789',
    codigo: 'PCD 18789',
    nome: 'Palmital 03 (PCD 18789)',
    nome_curto: 'Palmital 03',
    bairro: 'Palmital / Casimiro-Ostras',
    rede: 'CEMADEN Nacional',
    categoria: 'cemaden',
    url: 'https://resources.cemaden.gov.br/graficos/interativo/grafico_CEMADEN.php?idpcd=18789&uf=RJ',
    url_portal: 'https://mapainterativo.cemaden.gov.br/',
  },
];

type FetchOutcome<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'empty' }
  | { kind: 'auth_error' }
  | { kind: 'error' };

async function fetchJsonSafeTimeout<T>(url: string, timeoutMs = 6500): Promise<FetchOutcome<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    if (res.status === 204) return { kind: 'empty' };
    if (res.status === 401 || res.status === 403) return { kind: 'auth_error' };
    if (!res.ok) return { kind: 'error' };
    const data = (await res.json()) as T;
    return { kind: 'ok', data };
  } catch {
    clearTimeout(timer);
    return { kind: 'error' };
  }
}

function getBrtParts(ms: number) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(new Date(ms));
    const get = (t: string) => parts.find((p) => p.type === t)?.value || '00';
    const hourRaw = get('hour');
    const hour = hourRaw === '24' ? '00' : hourRaw;
    return {
      dateIso: `${get('year')}-${get('month')}-${get('day')}`,
      hhmm: `${hour}:${get('minute')}`,
      full: `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`,
    };
  } catch {
    const d = new Date(ms - 3 * 3600 * 1000);
    const iso = d.toISOString();
    return {
      dateIso: iso.slice(0, 10),
      hhmm: iso.slice(11, 16),
      full: `${iso.slice(0, 10)} ${iso.slice(11, 19)}`,
    };
  }
}

function parseBrtMs(str?: string | null): number {
  if (!str || typeof str !== 'string') return NaN;
  const s = str.trim();
  const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?/);
  if (isoMatch) {
    return Date.parse(`${isoMatch[1]}T${isoMatch[2]}:${isoMatch[3] || '00'}-03:00`);
  }
  const brMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})[ ](\d{2}:\d{2})(?::(\d{2}))?/);
  if (brMatch) {
    return Date.parse(`${brMatch[3]}-${brMatch[2]}-${brMatch[1]}T${brMatch[4]}:${brMatch[5] || '00'}-03:00`);
  }
  return NaN;
}

function parseWuObsMs(obs: any): number {
  if (typeof obs?.epoch === 'number' && Number.isFinite(obs.epoch)) {
    return obs.epoch * 1000;
  }
  if (obs?.obsTimeUtc) {
    const utcMs = Date.parse(String(obs.obsTimeUtc));
    if (!Number.isNaN(utcMs)) return utcMs;
  }
  return parseBrtMs(obs?.obsTimeLocal);
}

function round1(val: unknown): number | null;
function round1(val: unknown, fallback: number): number;
function round1(val: unknown, fallback: number | null = null): number | null {
  if (val === null || val === undefined || val === '') return fallback;
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.round(n * 10) / 10;
}

function degToCardinalPt(deg: number | null): string | null {
  if (deg === null || !Number.isFinite(deg)) return null;
  const norm = ((deg % 360) + 360) % 360;
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'L', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  return dirs[Math.round(norm / 22.5) % 16];
}

interface WuStationCache {
  todayIso: string;
  fullFetchMs: number;
  hourlyFetchMs: number;
  histObs: any[];
  baseChuvaHoje: number;
  baseAcc: {
    h1: number;
    h4: number;
    h6: number;
    h12: number;
    h24: number;
    h36: number;
    h48: number;
    h96: number;
  };
  inicioChuvaHoje: string | null;
  ventoMaxHoje: number | null;
  horaVentoMaxHoje: string | null;
  rajadaMaxHoje: number | null;
  horaRajadaMaxHoje: string | null;
  ventoMax24h: number | null;
  rajadaMax24h: number | null;
  last5mMs: number;
  wAvg5m: number;
  wHi5m: number;
  gHi5m: number;
  lastNonZeroWind: number;
  lastNonZeroGust: number;
  lastNonZeroMs: number;
}

const wuCache: Record<string, WuStationCache> = {};

interface CemadenCacheEntry {
  fetchedAtMs: number;
  patch: Partial<EstacaoPluvio>;
}

const cemadenCache: Record<string, CemadenCacheEntry> = {};

async function fetchWuEndpointWithKeyFallback<T>(buildUrl: (key: string) => string, timeoutMs: number): Promise<FetchOutcome<T>> {
  const firstKey = KNOWN_WU_KEYS[activeWuKeyIndex];
  const res = await fetchJsonSafeTimeout<T>(buildUrl(firstKey), timeoutMs);
  if (res.kind === 'auth_error' && KNOWN_WU_KEYS.length > 1) {
    const nextIdx = (activeWuKeyIndex + 1) % KNOWN_WU_KEYS.length;
    activeWuKeyIndex = nextIdx;
    return fetchJsonSafeTimeout<T>(buildUrl(KNOWN_WU_KEYS[nextIdx]), timeoutMs);
  }
  return res;
}

async function fetchWuStationLive(
  pid: string,
  options: { quickOnly: boolean; forceFullHistory: boolean }
): Promise<Partial<EstacaoPluvio> | null> {
  const nowMs = Date.now();
  const todayIso = getBrtParts(nowMs).dateIso;
  const prev = wuCache[pid];

  const canUseQuickWindow = Boolean(
    options.quickOnly &&
      !options.forceFullHistory &&
      prev &&
      prev.todayIso === todayIso &&
      prev.fullFetchMs > 0 &&
      nowMs - prev.fullFetchMs < 115_000
  );

  const canReuseHourly = Boolean(
    !options.forceFullHistory &&
      prev &&
      prev.todayIso === todayIso &&
      prev.hourlyFetchMs > 0 &&
      nowMs - prev.hourlyFetchMs < 10 * 60 * 1000
  );

  const base = 'https://api.weather.com/v2/pws/observations';
  const makeUrl = (path: string) => (key: string) =>
    `${base}/${path}?stationId=${pid}&format=json&units=m&numericPrecision=decimal&apiKey=${key}`;

  let currRes: FetchOutcome<{ observations?: any[] }>;
  let dayRes: FetchOutcome<{ observations?: any[] }> = { kind: 'error' };
  let histRes: FetchOutcome<{ observations?: any[] }> = { kind: 'error' };

  if (canUseQuickWindow) {
    currRes = await fetchWuEndpointWithKeyFallback(makeUrl('current'), 5500);
  } else if (canReuseHourly) {
    [currRes, dayRes] = await Promise.all([
      fetchWuEndpointWithKeyFallback(makeUrl('current'), 6500),
      fetchWuEndpointWithKeyFallback(makeUrl('all/1day'), 8500),
    ]);
    histRes = { kind: 'ok', data: { observations: prev.histObs } };
  } else {
    [currRes, dayRes, histRes] = await Promise.all([
      fetchWuEndpointWithKeyFallback(makeUrl('current'), 6500),
      fetchWuEndpointWithKeyFallback(makeUrl('all/1day'), 8500),
      fetchWuEndpointWithKeyFallback(makeUrl('hourly/7day'), 8500),
    ]);
  }

  // If every single network call failed (e.g. client offline/timeout), do not overwrite base snapshot
  if (
    currRes.kind === 'error' &&
    (canUseQuickWindow || (dayRes.kind === 'error' && histRes.kind === 'error'))
  ) {
    return null;
  }

  const dayObs: any[] = dayRes.kind === 'ok' && Array.isArray(dayRes.data?.observations) ? dayRes.data.observations : [];
  const histObs: any[] =
    histRes.kind === 'ok' && Array.isArray(histRes.data?.observations)
      ? histRes.data.observations
      : canReuseHourly && prev
        ? prev.histObs
        : [];

  const currObs = currRes.kind === 'ok' ? currRes.data?.observations?.[0] ?? null : null;
  let obs = currObs;

  if (!obs && dayObs.length > 0) {
    const todayDayRecs = dayObs
      .filter((o) => String(o?.obsTimeLocal || '').startsWith(todayIso))
      .sort((a, b) => String(a?.obsTimeLocal || '').localeCompare(String(b?.obsTimeLocal || '')));
    if (todayDayRecs.length > 0) {
      obs = todayDayRecs[todayDayRecs.length - 1];
    }
  }

  const obsMs = obs ? parseWuObsMs(obs) : NaN;
  const obsLocal: string = obs?.obsTimeLocal || (Number.isFinite(obsMs) ? getBrtParts(obsMs).full : '');
  const isRecent = obs ? (Number.isFinite(obsMs) ? nowMs - obsMs <= 6 * 3600 * 1000 : true) : false;

  // Offline / stale > 6h: clear instant sensors, still compute multi-day history if available
  if (!obs || !isRecent) {
    let c1 = 0;
    let c4 = 0;
    let c6 = 0;
    let c12 = 0;
    let c24 = 0;
    let c36 = 0;
    let c48 = 0;
    let c96 = 0;
    let ventoMax24h: number | null = null;
    let rajadaMax24h: number | null = null;

    if (histObs.length > 0) {
      const sortedHist = histObs
        .slice()
        .sort((a, b) => String(a?.obsTimeLocal || '').localeCompare(String(b?.obsTimeLocal || '')));
      const buckets: { ms: number; val: number }[] = [];
      let prevDay: string | null = null;
      let prevVal = 0;
      for (const h of sortedHist) {
        const tMs = parseWuObsMs(h);
        if (!Number.isFinite(tMs)) continue;
        const dayStr = String(h?.obsTimeLocal || '').slice(0, 10) || getBrtParts(tMs).dateIso;
        const tot = Math.max(0, Number(h?.metric?.precipTotal || 0));
        let inc = 0;
        if (prevDay !== dayStr) {
          inc = tot;
          prevVal = tot;
          prevDay = dayStr;
        } else {
          inc = Math.max(0, tot - prevVal);
          prevVal = Math.max(prevVal, tot);
        }
        buckets.push({ ms: tMs, val: inc });
        if (tMs >= nowMs - 24 * 3600 * 1000) {
          const wHi = round1(h?.metric?.windspeedHigh);
          const gHi = round1(h?.metric?.windgustHigh);
          if (wHi !== null && (ventoMax24h === null || wHi > ventoMax24h)) ventoMax24h = wHi;
          if (gHi !== null && (rajadaMax24h === null || gHi > rajadaMax24h)) rajadaMax24h = gHi;
        }
      }
      const sumHrs = (hrs: number) => {
        const cutoff = nowMs - hrs * 3600 * 1000;
        return round1(buckets.reduce((s, b) => (b.ms > cutoff ? s + b.val : s), 0), 0);
      };
      c1 = sumHrs(1);
      c4 = Math.max(sumHrs(4), c1);
      c6 = Math.max(sumHrs(6), c4);
      c12 = Math.max(sumHrs(12), c6);
      c24 = Math.max(sumHrs(24), c12);
      c36 = Math.max(sumHrs(36), c24);
      c48 = Math.max(sumHrs(48), c36);
      c96 = Math.max(sumHrs(96), c48);
    }

    return {
      online: false,
      ultima_leitura: obsLocal || 'Offline / Sem dados recentes',
      temp_atual: null,
      sensacao_atual: null,
      vento_atual: null,
      rajada_atual: null,
      vento_dir_graus: null,
      vento_dir_cardinal: null,
      umidade_atual: null,
      pressao_atual: null,
      uv_atual: null,
      radiacao_solar: null,
      vento_max_hoje: null,
      hora_vento_max_hoje: null,
      rajada_max_hoje: null,
      hora_rajada_max_hoje: null,
      vento_max_24h: ventoMax24h,
      rajada_max_24h: rajadaMax24h,
      chuva_hoje: 0,
      chuva_taxa_atual: 0,
      inicio_chuva_hoje: null,
      chuva_1h: c1,
      chuva_4h: c4,
      chuva_6h: c6,
      chuva_12h: c12,
      chuva_24h: c24,
      chuva_36h: c36,
      chuva_48h: c48,
      chuva_96h: c96,
    };
  }

  // Online reading
  const m = obs.metric || {};
  const tFallbackAvg = currObs ? m.temp : m.tempAvg ?? m.temp;
  const tempAtual = round1(tFallbackAvg);
  const heatRaw = currObs ? m.heatIndex : m.heatindexAvg ?? m.heatIndex;
  const chillRaw = currObs ? m.windChill : m.windchillAvg ?? m.windChill;
  const heatIdx = round1(heatRaw);
  const windChill = round1(chillRaw);

  let sensacaoAtual: number | null = null;
  if (heatIdx !== null && (tempAtual === null || tempAtual >= 20.0)) {
    sensacaoAtual = heatIdx;
  } else if (windChill !== null && (tempAtual === null || tempAtual <= 15.0)) {
    sensacaoAtual = windChill;
  } else if (heatIdx !== null) {
    sensacaoAtual = heatIdx;
  } else if (tempAtual !== null) {
    sensacaoAtual = tempAtual;
  }

  const rawWind = round1(currObs ? m.windSpeed : m.windspeedAvg ?? m.windSpeed, 0);
  const rawGust = round1(
    currObs ? m.windGust ?? m.windSpeed : m.windgustHigh ?? m.windGust ?? m.windSpeed,
    rawWind
  );
  const dirRaw = obs.winddir ?? obs.winddirAvg;
  const ventoDirGraus = dirRaw !== undefined && dirRaw !== null && Number.isFinite(Number(dirRaw))
    ? Math.round(Number(dirRaw))
    : null;
  const ventoDirCardinal = degToCardinalPt(ventoDirGraus);

  let chuvaHoje = obsLocal.startsWith(todayIso) ? round1(m.precipTotal, 0) : 0;
  const chuvaTaxaAtual = round1(m.precipRate, 0);

  let lastNonZeroWind = prev?.lastNonZeroWind ?? 0;
  let lastNonZeroGust = prev?.lastNonZeroGust ?? 0;
  let lastNonZeroMs = prev?.lastNonZeroMs ?? 0;
  if (rawWind > 0) {
    lastNonZeroWind = rawWind;
    lastNonZeroGust = Math.max(rawGust, rawWind);
    lastNonZeroMs = nowMs;
  } else if (rawGust > 0) {
    lastNonZeroGust = rawGust;
    lastNonZeroMs = nowMs;
  }

  let inicioChuvaHoje: string | null = canUseQuickWindow ? prev.inicioChuvaHoje : null;
  let ventoMaxHoje: number | null = canUseQuickWindow ? prev.ventoMaxHoje : null;
  let horaVentoMaxHoje: string | null = canUseQuickWindow ? prev.horaVentoMaxHoje : null;
  let rajadaMaxHoje: number | null = canUseQuickWindow ? prev.rajadaMaxHoje : null;
  let horaRajadaMaxHoje: string | null = canUseQuickWindow ? prev.horaRajadaMaxHoje : null;
  let last5mMs: number = canUseQuickWindow ? prev.last5mMs : NaN;
  let wAvg5m = canUseQuickWindow ? prev.wAvg5m : 0;
  let wHi5m = canUseQuickWindow ? prev.wHi5m : 0;
  let gHi5m = canUseQuickWindow ? prev.gHi5m : 0;
  let ventoMax24h: number | null = ventoMaxHoje;
  let rajadaMax24h: number | null = rajadaMaxHoje;

  let baseAcc = {
    h1: chuvaTaxaAtual,
    h4: chuvaHoje,
    h6: chuvaHoje,
    h12: chuvaHoje,
    h24: chuvaHoje,
    h36: chuvaHoje,
    h48: chuvaHoje,
    h96: chuvaHoje,
  };
  let baseChuvaHoje = chuvaHoje;

  let chuva1h = baseAcc.h1;
  let chuva4h = baseAcc.h4;
  let chuva6h = baseAcc.h6;
  let chuva12h = baseAcc.h12;
  let chuva24h = baseAcc.h24;
  let chuva36h = baseAcc.h36;
  let chuva48h = baseAcc.h48;
  let chuva96h = baseAcc.h96;

  if (canUseQuickWindow && prev) {
    // Delta uses immutable baseChuvaHoje and baseAcc recorded on the last full sync (zero double-counting)
    const deltaRain = Math.max(0, chuvaHoje - prev.baseChuvaHoje);
    baseChuvaHoje = prev.baseChuvaHoje;
    baseAcc = prev.baseAcc;

    if (!inicioChuvaHoje && chuvaHoje > 0 && obsLocal.length >= 16) {
      inicioChuvaHoje = obsLocal.slice(11, 16);
    }

    chuva1h = round1(prev.baseAcc.h1 + deltaRain, 0);
    chuva4h = Math.max(round1(prev.baseAcc.h4 + deltaRain, 0), chuva1h);
    chuva6h = Math.max(round1(prev.baseAcc.h6 + deltaRain, 0), chuva4h);
    chuva12h = Math.max(round1(prev.baseAcc.h12 + deltaRain, 0), chuva6h);
    chuva24h = Math.max(round1(prev.baseAcc.h24 + deltaRain, 0), chuvaHoje);
    chuva36h = Math.max(round1(prev.baseAcc.h36 + deltaRain, 0), chuva24h);
    chuva48h = Math.max(round1(prev.baseAcc.h48 + deltaRain, 0), chuva36h);
    chuva96h = Math.max(round1(prev.baseAcc.h96 + deltaRain, 0), chuva48h);
    ventoMax24h = prev.ventoMax24h ?? ventoMaxHoje;
    rajadaMax24h = prev.rajadaMax24h ?? rajadaMaxHoje;
  } else {
    const today5mBuckets: { ms: number; val: number }[] = [];

    if (dayObs.length > 0) {
      const sortedDay = dayObs
        .slice()
        .sort((a, b) => String(a?.obsTimeLocal || '').localeCompare(String(b?.obsTimeLocal || '')));
      const todayRecs = sortedDay.filter((o) => String(o?.obsTimeLocal || '').startsWith(todayIso));
      let prevTot5m = 0;

      for (const rec of todayRecs) {
        const tStr = String(rec?.obsTimeLocal || '');
        const mr = rec?.metric || {};
        const tot = Math.max(0, Number(mr.precipTotal || 0));
        const rate = Math.max(0, Number(mr.precipRate || 0));

        if (!inicioChuvaHoje && (tot > 0 || rate > 0) && tStr.length >= 16) {
          inicioChuvaHoje = tStr.slice(11, 16);
        }

        const tMs = parseWuObsMs(rec);
        if (Number.isFinite(tMs)) {
          const inc = Math.max(0, tot - prevTot5m);
          today5mBuckets.push({ ms: tMs, val: inc });
          prevTot5m = Math.max(prevTot5m, tot);
        }

        const wHi = round1(mr.windspeedHigh);
        if (wHi !== null && (ventoMaxHoje === null || wHi > ventoMaxHoje)) {
          ventoMaxHoje = wHi;
          horaVentoMaxHoje = tStr.length >= 16 ? tStr.slice(11, 16) : null;
        }

        const gHi = round1(mr.windgustHigh);
        if (gHi !== null && (rajadaMaxHoje === null || gHi > rajadaMaxHoje)) {
          rajadaMaxHoje = gHi;
          horaRajadaMaxHoje = tStr.length >= 16 ? tStr.slice(11, 16) : null;
        }
      }

      if (todayRecs.length > 0) {
        const lastRec = todayRecs[todayRecs.length - 1];
        last5mMs = parseWuObsMs(lastRec);
        wAvg5m = round1(lastRec?.metric?.windspeedAvg, 0);
        wHi5m = round1(lastRec?.metric?.windspeedHigh, 0);
        gHi5m = round1(lastRec?.metric?.windgustHigh, 0);
      }

      if (Number.isFinite(obsMs) && chuvaHoje > prevTot5m) {
        today5mBuckets.push({ ms: obsMs, val: chuvaHoje - prevTot5m });
        if (!inicioChuvaHoje && chuvaHoje > 0 && obsLocal.length >= 16) {
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

    const priorBuckets: { ms: number; val: number }[] = [];
    const todayHourlyBuckets: { ms: number; val: number }[] = [];
    const refMs = Number.isFinite(obsMs) ? obsMs : nowMs;

    if (histObs.length > 0) {
      const sortedHist = histObs
        .slice()
        .sort((a, b) => String(a?.obsTimeLocal || '').localeCompare(String(b?.obsTimeLocal || '')));
      let prevDay: string | null = null;
      let prevVal = 0;

      for (const h of sortedHist) {
        const tMs = parseWuObsMs(h);
        if (!Number.isFinite(tMs)) continue;
        const dayStr = String(h?.obsTimeLocal || '').slice(0, 10) || getBrtParts(tMs).dateIso;
        const tot = Math.max(0, Number(h?.metric?.precipTotal || 0));
        let inc = 0;
        if (prevDay !== dayStr) {
          inc = tot;
          prevVal = tot;
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

      const cutoff24 = refMs - 24 * 3600 * 1000;
      for (const h of sortedHist) {
        const tMs = parseWuObsMs(h);
        if (Number.isFinite(tMs) && tMs >= cutoff24) {
          const wHi = round1(h?.metric?.windspeedHigh);
          const gHi = round1(h?.metric?.windgustHigh);
          if (wHi !== null && (ventoMax24h === null || wHi > ventoMax24h)) ventoMax24h = wHi;
          if (gHi !== null && (rajadaMax24h === null || gHi > rajadaMax24h)) rajadaMax24h = gHi;
        }
      }
    }

    const combined = priorBuckets.concat(today5mBuckets.length > 0 ? today5mBuckets : todayHourlyBuckets);
    if (combined.length > 0) {
      const sumHours = (hrs: number) => {
        const cutoff = refMs - hrs * 3600 * 1000;
        return round1(
          combined.reduce((acc, b) => (b.ms > cutoff ? acc + b.val : acc), 0),
          0
        );
      };
      chuva1h = sumHours(1);
      chuva4h = Math.max(sumHours(4), chuva1h);
      chuva6h = Math.max(sumHours(6), chuva4h);
      chuva12h = Math.max(sumHours(12), chuva6h);
      chuva24h = Math.max(sumHours(24), chuvaHoje);
      chuva36h = Math.max(sumHours(36), chuva24h);
      chuva48h = Math.max(sumHours(48), chuva36h);
      chuva96h = Math.max(sumHours(96), chuva48h);
    }

    baseChuvaHoje = chuvaHoje;
    baseAcc = {
      h1: chuva1h,
      h4: chuva4h,
      h6: chuva6h,
      h12: chuva12h,
      h24: chuva24h,
      h36: chuva36h,
      h48: chuva48h,
      h96: chuva96h,
    };
  }

  // Reconciliação anti-lacuna 16s Ecowitt / EasyWeatherPro
  const isFresh5m =
    Number.isFinite(last5mMs) && Number.isFinite(obsMs)
      ? Math.abs(obsMs - last5mMs) <= 12 * 60 * 1000
      : Number.isFinite(last5mMs) && nowMs - last5mMs <= 15 * 60 * 1000;
  const hasRecent90s = lastNonZeroMs > 0 && nowMs - lastNonZeroMs <= 90 * 1000;

  let ventoAtual = rawWind;
  if (ventoAtual <= 0) {
    if (hasRecent90s && lastNonZeroWind > 0) ventoAtual = lastNonZeroWind;
    else if (isFresh5m && wAvg5m > 0) ventoAtual = wAvg5m;
    else if (isFresh5m && wHi5m > 0) ventoAtual = wHi5m;
  }

  const active5mGust = isFresh5m ? gHi5m : 0;
  const recent90sGust = hasRecent90s ? lastNonZeroGust : 0;
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

  const fullSucceeded = !canUseQuickWindow && (dayRes.kind === 'ok' || dayRes.kind === 'empty');
  const hourlySucceeded = !canUseQuickWindow && !canReuseHourly && (histRes.kind === 'ok' || histRes.kind === 'empty');

  wuCache[pid] = {
    todayIso,
    fullFetchMs: canUseQuickWindow ? prev!.fullFetchMs : fullSucceeded ? nowMs : prev?.fullFetchMs ?? 0,
    hourlyFetchMs: canReuseHourly ? prev!.hourlyFetchMs : hourlySucceeded ? nowMs : prev?.hourlyFetchMs ?? 0,
    histObs,
    baseChuvaHoje,
    baseAcc,
    inicioChuvaHoje,
    ventoMaxHoje,
    horaVentoMaxHoje,
    rajadaMaxHoje,
    horaRajadaMaxHoje,
    ventoMax24h,
    rajadaMax24h,
    last5mMs,
    wAvg5m,
    wHi5m,
    gHi5m,
    lastNonZeroWind,
    lastNonZeroGust,
    lastNonZeroMs,
  };

  return {
    online: true,
    ultima_leitura: obsLocal,
    temp_atual: tempAtual,
    sensacao_atual: sensacaoAtual,
    vento_atual: ventoAtual,
    rajada_atual: rajadaAtual,
    vento_dir_graus: ventoDirGraus,
    vento_dir_cardinal: ventoDirCardinal,
    umidade_atual: obs.humidity !== undefined && obs.humidity !== null ? Number(obs.humidity) : null,
    pressao_atual: m.pressure !== undefined && m.pressure !== null ? Number(m.pressure) : null,
    uv_atual: obs.uv !== undefined && obs.uv !== null
      ? round1(obs.uv, 0)
      : obs.uvHigh !== undefined && obs.uvHigh !== null
        ? round1(obs.uvHigh, 0)
        : null,
    radiacao_solar: obs.solarRadiation !== undefined && obs.solarRadiation !== null
      ? round1(obs.solarRadiation, 0)
      : obs.solarRadiationHigh !== undefined && obs.solarRadiationHigh !== null
        ? round1(obs.solarRadiationHigh, 0)
        : null,
    chuva_hoje: round1(chuvaHoje, 0),
    chuva_taxa_atual: chuvaTaxaAtual,
    inicio_chuva_hoje: inicioChuvaHoje,
    vento_max_hoje: ventoMaxHoje,
    hora_vento_max_hoje: horaVentoMaxHoje,
    rajada_max_hoje: rajadaMaxHoje,
    hora_rajada_max_hoje: horaRajadaMaxHoje,
    vento_max_24h: ventoMax24h,
    rajada_max_24h: rajadaMax24h,
    chuva_1h: round1(chuva1h, 0),
    chuva_4h: round1(chuva4h, 0),
    chuva_6h: round1(chuva6h, 0),
    chuva_12h: round1(chuva12h, 0),
    chuva_24h: round1(chuva24h, 0),
    chuva_36h: round1(chuva36h, 0),
    chuva_48h: round1(chuva48h, 0),
    chuva_96h: round1(chuva96h, 0),
  };
}

interface CemadenWsResponse {
  datas?: string[];
  horarios?: string[];
  acumulados?: (number | null)[][];
}

async function fetchCemadenStationLive(
  cid: string,
  baseStation: EstacaoPluvio | undefined,
  options: { forceRefresh: boolean }
): Promise<Partial<EstacaoPluvio> | null> {
  const nowMs = Date.now();
  const cached = cemadenCache[cid];
  if (!options.forceRefresh && cached && nowMs - cached.fetchedAtMs < 90_000) {
    return cached.patch;
  }

  const url = `https://mapservices.cemaden.gov.br/MapaInterativoWS/resources/horario/${cid}/96?t=${nowMs}`;
  const res = await fetchJsonSafeTimeout<CemadenWsResponse>(url, 7000);
  if (res.kind !== 'ok' || !Array.isArray(res.data?.datas) || !Array.isArray(res.data?.horarios) || !Array.isArray(res.data?.acumulados)) {
    return cached?.patch ?? null;
  }

  const pts: { utcMs: number; brtIsoDate: string; brtHhmm: string; brtFull: string; val: number }[] = [];
  const { datas, horarios, acumulados } = res.data;

  datas.forEach((dStr, dIdx) => {
    const row = acumulados[dIdx];
    if (!Array.isArray(row)) return;
    const mDate = String(dStr || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!mDate) return;
    const dd = Number(mDate[1]);
    const mm = Number(mDate[2]);
    const yyyy = Number(mDate[3]);

    horarios.forEach((hStr, hIdx) => {
      const rawVal = row[hIdx];
      if (rawVal === null || rawVal === undefined) return;
      const numVal = Number(rawVal);
      if (!Number.isFinite(numVal)) return;
      const hrUtc = parseInt(String(hStr).replace(/[^\d]/g, ''), 10);
      if (!Number.isFinite(hrUtc)) return;
      const utcMs = Date.UTC(yyyy, mm - 1, dd, hrUtc, 0, 0);
      const brt = getBrtParts(utcMs);
      pts.push({
        utcMs,
        brtIsoDate: brt.dateIso,
        brtHhmm: brt.hhmm,
        brtFull: brt.full,
        val: Math.max(0, numVal),
      });
    });
  });

  if (pts.length === 0) return cached?.patch ?? null;
  pts.sort((a, b) => a.utcMs - b.utcMs);

  const todayIso = getBrtParts(nowMs).dateIso;
  const lastPt = pts[pts.length - 1];
  const refMs = nowMs - lastPt.utcMs <= 2 * 3600 * 1000 ? lastPt.utcMs : nowMs;

  const sumHrs = (hrs: number) => {
    const cutoff = refMs - hrs * 3600 * 1000;
    return round1(
      pts.reduce((acc, p) => (p.utcMs > cutoff ? acc + p.val : acc), 0),
      0
    );
  };

  const todayPts = pts.filter((p) => p.brtIsoDate === todayIso);
  const chuvaHoje = round1(
    todayPts.reduce((acc, p) => acc + p.val, 0),
    0
  );
  const firstPos = todayPts.find((p) => p.val > 0);

  const c1 = sumHrs(1);
  const c4 = Math.max(sumHrs(4), c1);
  const c6 = Math.max(sumHrs(6), c4);
  const c12 = Math.max(sumHrs(12), c6);
  const c24 = Math.max(sumHrs(24), chuvaHoje);
  const c36 = Math.max(sumHrs(36), c24);
  const c48 = Math.max(sumHrs(48), c36);
  const c96 = Math.max(sumHrs(96), c48);

  const baseReadingMs = parseBrtMs(baseStation?.ultima_leitura);
  const keepBaseReading =
    Number.isFinite(baseReadingMs) &&
    baseReadingMs > lastPt.utcMs &&
    nowMs - baseReadingMs <= 30 * 60 * 1000;
  const latestActivityMs = keepBaseReading ? baseReadingMs : lastPt.utcMs;

  const patch: Partial<EstacaoPluvio> = {
    online: nowMs - latestActivityMs <= 12 * 3600 * 1000,
    ultima_leitura: keepBaseReading ? baseStation!.ultima_leitura : lastPt.brtFull,
    chuva_hoje: chuvaHoje,
    inicio_chuva_hoje: firstPos ? firstPos.brtHhmm : null,
    chuva_1h: c1,
    chuva_4h: c4,
    chuva_6h: c6,
    chuva_12h: c12,
    chuva_24h: c24,
    chuva_36h: c36,
    chuva_48h: c48,
    chuva_96h: c96,
  };

  cemadenCache[cid] = { fetchedAtMs: nowMs, patch };
  return patch;
}

function buildStationSkeleton(meta: StationSeedMeta): EstacaoPluvio {
  return {
    codigo: meta.codigo,
    nome: meta.nome,
    nome_curto: meta.nome_curto,
    bairro: meta.bairro,
    rede: meta.rede,
    categoria: meta.categoria,
    url: meta.url,
    url_portal: meta.url_portal,
    temp_atual: null,
    sensacao_atual: null,
    umidade_atual: null,
    pressao_atual: null,
    uv_atual: null,
    radiacao_solar: null,
    vento_atual: null,
    rajada_atual: null,
    vento_dir_graus: null,
    vento_dir_cardinal: null,
    vento_max_hoje: null,
    hora_vento_max_hoje: null,
    rajada_max_hoje: null,
    hora_rajada_max_hoje: null,
    vento_max_24h: null,
    rajada_max_24h: null,
    chuva_hoje: 0,
    chuva_taxa_atual: 0,
    inicio_chuva_hoje: null,
    chuva_1h: 0,
    chuva_4h: 0,
    chuva_6h: 0,
    chuva_12h: 0,
    chuva_24h: 0,
    chuva_36h: 0,
    chuva_48h: 0,
    chuva_96h: 0,
    ultima_leitura: 'Carregando...',
    online: false,
  };
}

let inFlightLiveSync: Promise<AcumuladosDataset | null> | null = null;

export async function enrichAcumuladosWithLiveTelemetry(
  base: AcumuladosDataset | null,
  options: { quickOnly?: boolean; forceFullHistory?: boolean } = {}
): Promise<AcumuladosDataset | null> {
  if (!base && PWS_CATALOG.length === 0) return null;

  // Deduplicate concurrent calls cleanly
  if (inFlightLiveSync) {
    return inFlightLiveSync;
  }

  const run = async (): Promise<AcumuladosDataset | null> => {
    const quickOnly = Boolean(options.quickOnly);
    const forceFullHistory = Boolean(options.forceFullHistory);
    const existingList = Array.isArray(base?.estacoes) ? base!.estacoes : [];
    const byCode = new Map<string, EstacaoPluvio>();
    existingList.forEach((st) => {
      if (st?.codigo) byCode.set(st.codigo, st);
    });

    const pwsPromises = PWS_CATALOG.map(async (meta) => ({
      meta,
      patch: await fetchWuStationLive(meta.codigo, { quickOnly, forceFullHistory }),
    }));

    // On quick 20s pulse, reuse CEMADEN cache (no extra network hit) unless expired or missing
    const cemadenPromises = CEMADEN_CATALOG.map(async (meta) => ({
      meta,
      patch: await fetchCemadenStationLive(meta.cid, byCode.get(meta.codigo), {
        forceRefresh: !quickOnly || forceFullHistory,
      }),
    }));

    const [pwsResults, cemResults] = await Promise.all([
      Promise.all(pwsPromises),
      Promise.all(cemadenPromises),
    ]);

    let updatedCount = 0;

    for (const { meta, patch } of pwsResults) {
      const seed = byCode.get(meta.codigo) || buildStationSkeleton(meta);
      if (patch) {
        updatedCount++;
        byCode.set(meta.codigo, { ...seed, ...patch });
      } else if (!byCode.has(meta.codigo)) {
        byCode.set(meta.codigo, seed);
      }
    }

    for (const { meta, patch } of cemResults) {
      const seed = byCode.get(meta.codigo) || buildStationSkeleton(meta);
      if (patch) {
        updatedCount++;
        byCode.set(meta.codigo, { ...seed, ...patch });
      } else if (!byCode.has(meta.codigo)) {
        byCode.set(meta.codigo, seed);
      }
    }

    if (updatedCount === 0) {
      return base;
    }

    const mergedAll = Array.from(byCode.values());
    const ineaStation =
      mergedAll.find((s) => s.categoria === 'inea') ||
      (base?.estacao_rio_jundia ? ({ ...base.estacao_rio_jundia, categoria: 'inea' } as unknown as EstacaoPluvio) : null);

    const pluviometricas = mergedAll
      .filter((s) => s.categoria !== 'inea')
      .sort((a, b) => {
        const a24 = Number(a.chuva_24h ?? 0);
        const b24 = Number(b.chuva_24h ?? 0);
        if (b24 !== a24) return b24 - a24;
        const aOn = a.online ? 1 : 0;
        const bOn = b.online ? 1 : 0;
        if (bOn !== aOn) return bOn - aOn;
        const a96 = Number(a.chuva_96h ?? 0);
        const b96 = Number(b.chuva_96h ?? 0);
        if (b96 !== a96) return b96 - a96;
        const a1 = Number(a.chuva_1h ?? 0);
        const b1 = Number(b.chuva_1h ?? 0);
        if (b1 !== a1) return b1 - a1;
        return (a.nome_curto || a.nome).localeCompare(b.nome_curto || b.nome);
      })
      .map((s, idx) => ({
        ...s,
        ranking: idx + 1,
        tipo: s.tipo || 'pluviometrica',
        tipo_label: s.tipo_label || 'Acumulado de Chuva',
      }));

    const finalStations: EstacaoPluvio[] = ineaStation
      ? [...pluviometricas, { ...ineaStation, ranking: null }]
      : pluviometricas;

    const vals24 = pluviometricas
      .map((s) => s.chuva_24h)
      .filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v));
    const media24 = vals24.length > 0 ? round1(vals24.reduce((a, b) => a + b, 0) / vals24.length, 0) : 0;
    const maxVal = vals24.length > 0 ? Math.max(...vals24) : 0;
    const topSt = maxVal > 0 ? pluviometricas.find((s) => (s.chuva_24h ?? 0) === maxVal) : null;

    const irioda17 = byCode.get('IRIODA17');
    const nowBrtFull = getBrtParts(Date.now()).full;
    const uvLive = irioda17?.online && irioda17.uv_atual !== null && irioda17.uv_atual !== undefined
      ? irioda17.uv_atual
      : base?.uv_tempo_real?.uv ?? 0;
    const solarLive = irioda17?.online && irioda17.radiacao_solar !== null && irioda17.radiacao_solar !== undefined
      ? irioda17.radiacao_solar
      : base?.uv_tempo_real?.radiacao_solar ?? 0;

    return {
      ...(base || ({} as AcumuladosDataset)),
      atualizacao: nowBrtFull,
      total_estacoes: finalStations.length,
      total_pluviometricas: pluviometricas.length,
      total_hidrologicas: ineaStation ? 1 : 0,
      estacao_rio_jundia: base?.estacao_rio_jundia as AcumuladosDataset['estacao_rio_jundia'],
      estacoes_pluviometricas: pluviometricas,
      uv_tempo_real: {
        estacao_referencia: 'IRIODA17',
        nome_estacao: 'Praia da Tartaruga (Weather Underground)',
        url_estacao: 'https://www.wunderground.com/dashboard/pws/IRIODA17',
        uv: uvLive,
        radiacao_solar: solarLive,
        hora_leitura: irioda17?.online && irioda17.ultima_leitura ? irioda17.ultima_leitura : nowBrtFull,
      },
      resumo: {
        ...(base?.resumo || ({} as AcumuladosDataset['resumo'])),
        total_estacoes: finalStations.length,
        estacoes_online: finalStations.filter((s) => s.online).length,
        media_chuva_24h: media24,
        maior_acumulado_24h: maxVal,
        maior_estacao_nome: topSt ? topSt.nome_curto || topSt.nome : 'Sem registro de chuva',
        uv_atual: uvLive,
      },
      estacoes: finalStations,
    };
  };

  inFlightLiveSync = run().finally(() => {
    inFlightLiveSync = null;
  });
  return inFlightLiveSync;
}
