import type { AcumuladosDataset, OpenMeteoData } from './siteData';

export interface WindSampleRaw {
  dt_iso: string;
  hora_min: string;
  dir_graus: number;
  vel_kmh: number;
  rajada_kmh: number;
}

export type WindRosePeriodKey = 'hoje' | '7d' | '30d' | 'mes_atual' | 'historico';

export interface WindRoseSpeedBin {
  id: string;
  label: string;
  short_label: string;
  min_kmh: number;
  max_kmh: number | null;
  cor_hex: string;
}

export interface WindRoseSector {
  idx: number;
  cardeal: string;
  angulo_centro: number;
  total_count: number;
  pct: number;
  vel_media_kmh: number;
  rajada_max_kmh: number;
  bins: number[];
  bins_count: number[];
}

export interface WindRoseDistribution {
  total_amostras: number;
  amostras_validas_dir: number;
  calmas_sem_dir_count: number;
  calmo_pct: number;
  vel_media_kmh: number;
  vel_max_kmh: number;
  rajada_max_kmh: number;
  dir_predominante: string;
  dir_predominante_deg: number | null;
  dir_predominante_pct: number;
  dir_vetorial_graus: number | null;
  dir_vetorial_cardeal: string;
  persistencia_pct: number;
  quadrante_sul_pct: number;
  quadrante_norte_leste_pct: number;
  setores: WindRoseSector[];
}

export interface WindRoseCompactState {
  sec_bins: number[][];
  sec_vel_sum: number[];
  sec_gust_max: number[];
  calmas_sem_dir: number;
  total: number;
  u_sum: number;
  v_sum: number;
  vel_sum: number;
  vel_max: number;
  rajada_max: number;
}

export interface WindRoseStationSnapshot {
  codigo: string;
  nome: string;
  bairro: string;
  costeira: boolean;
  online: boolean;
  ultima_leitura: string | null;
  vento_atual_kmh: number | null;
  rajada_atual_kmh: number | null;
  dir_atual_graus: number | null;
  dir_atual_cardeal: string | null;
  vento_max_hoje_kmh: number | null;
  rajada_max_hoje_kmh: number | null;
  periodos: Record<WindRosePeriodKey, WindRoseDistribution>;
  base_sem_hoje?: Record<'7d' | '30d' | 'mes_atual' | 'historico', WindRoseCompactState>;
}

export interface WindRoseDailyEntry {
  data_iso: string;
  data_br: string;
  amostras: number;
  dir_predominante: string;
  dir_vetorial_graus: number | null;
  dir_vetorial_cardeal: string;
  persistencia_pct: number;
  vel_media_kmh: number;
  vel_max_kmh: number;
  rajada_max_kmh: number;
  quadrante_sul_pct: number;
  quadrante_norte_leste_pct: number;
  regime: string;
}

export interface WindRoseForecastDay {
  data_iso: string;
  data_br: string;
  dia_semana: string;
  dir_predominante: string;
  dir_vetorial_graus: number | null;
  persistencia_pct: number;
  vel_min_kmh: number;
  vel_media_kmh: number;
  vel_max_kmh: number;
  rajada_max_kmh: number;
  quadrante_sul_pct: number;
  plancon_risco: string;
}

export interface WindRoseDataset {
  atualizacao_brt: string;
  atualizacao_iso: string;
  data_referencia_iso: string;
  mes_referencia: string;
  periodo_inicio: string;
  periodo_fim: string;
  total_dias_serie: number;
  total_horas_serie: number;
  faixas_velocidade: WindRoseSpeedBin[];
  setores_referencia: string[];
  rede: {
    periodos: Record<WindRosePeriodKey, WindRoseDistribution>;
    base_sem_hoje?: Record<'7d' | '30d' | 'mes_atual' | 'historico', WindRoseCompactState>;
  };
  estacoes: WindRoseStationSnapshot[];
  serie_diaria: WindRoseDailyEntry[];
  previsao: {
    fontes: string;
    hoje: WindRoseDistribution;
    prox_3d: WindRoseDistribution;
    prox_7d: WindRoseDistribution;
    dias: WindRoseForecastDay[];
  };
}

export const SECTORS_16_PT = [
  'N', 'NNE', 'NE', 'ENE',
  'L', 'ESE', 'SE', 'SSE',
  'S', 'SSO', 'SO', 'OSO',
  'O', 'ONO', 'NO', 'NNO',
];

export const SPEED_BINS_WIND_ROSE: WindRoseSpeedBin[] = [
  { id: 'lt5', label: 'Aragem / Calma (< 5 km/h)', short_label: '< 5', min_kmh: 0, max_kmh: 5, cor_hex: '#94A3B8' },
  { id: '5_12', label: 'Brisa Leve (5–12 km/h)', short_label: '5–12', min_kmh: 5, max_kmh: 12, cor_hex: '#10B981' },
  { id: '12_20', label: 'Brisa Moderada (12–20 km/h)', short_label: '12–20', min_kmh: 12, max_kmh: 20, cor_hex: '#0EA5E9' },
  { id: '20_30', label: 'Vento Fresco (20–30 km/h)', short_label: '20–30', min_kmh: 20, max_kmh: 30, cor_hex: '#F59E0B' },
  { id: 'ge30', label: 'Forte / Atenção (≥ 30 km/h)', short_label: '≥ 30', min_kmh: 30, max_kmh: null, cor_hex: '#EF4444' },
];

const NORTH_EAST_SECTORS = new Set([0, 1, 2, 3, 4]);
const SOUTH_SECTORS = new Set([6, 7, 8, 9, 10]);
const DIAS_SEMANA_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function degToCardinal16Pt(deg: number | null | undefined): string {
  if (deg === null || deg === undefined || !Number.isFinite(Number(deg))) return 'N/D';
  const norm = ((Number(deg) % 360) + 360) % 360;
  return SECTORS_16_PT[Math.round(norm / 22.5) % 16] || 'N';
}

function getBrtDatePartsNow(): { dateIso: string; brtStr: string; hhmm: string; mesRef: string; brShort: string } {
  const d = new Date(Date.now() - 3 * 3600 * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return {
    dateIso: `${yyyy}-${mm}-${dd}`,
    brShort: `${dd}/${mm}/${yyyy}`,
    brtStr: `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`,
    hhmm: `${hh}:${mi}`,
    mesRef: `${MESES_PT[d.getUTCMonth()]}/${yyyy}`,
  };
}

function speedBinIdx(velKmh: number): number {
  if (velKmh < 5) return 0;
  if (velKmh < 12) return 1;
  if (velKmh < 20) return 2;
  if (velKmh < 30) return 3;
  return 4;
}

function applyWindQc(velAvg: number, gustVal: number | null | undefined): { v: number; g: number } {
  let v = Math.max(0, Number(velAvg || 0));
  if (v > 90) v = 0;
  let g = gustVal !== null && gustVal !== undefined && Number.isFinite(Number(gustVal)) ? Math.max(v, Number(gustVal)) : v;
  if (g > 105 || (v < 25 && g > 80)) {
    g = Math.round(Math.max(v * 1.75, 24) * 10) / 10;
  }
  return {
    v: Math.round(v * 10) / 10,
    g: Math.round(g * 10) / 10,
  };
}

export function classifyWindPlanconLabel(gustKmh: number): string {
  if (gustKmh > 75) return 'Muito Alto';
  if (gustKmh >= 56) return 'Risco Alto';
  if (gustKmh >= 41) return 'Risco Moderado';
  return 'Risco Baixo';
}

function classifyDailyRegime(nlPct: number, sulPct: number, total: number): string {
  if (total <= 0) return 'Sem leituras';
  if (sulPct >= 45) return 'Giro Frontal / Marítimo Sul (S–SE–SO)';
  if (nlPct >= 45 && sulPct < 25) return 'Alísios / ASAS (N–NE–L)';
  if (sulPct >= 25 && nlPct >= 25) return 'Giro de Vento / Transição Frontal';
  if (nlPct >= 30) return 'Escoamento Litoral / Brisa N–L';
  return 'Brisa Continental / Cavado Local';
}

export class WindRoseAccumulatorTs {
  secBins: number[][] = Array.from({ length: 16 }, () => [0, 0, 0, 0, 0]);
  secVelSum: number[] = Array(16).fill(0);
  secGustMax: number[] = Array(16).fill(0);
  calmasSemDir = 0;
  total = 0;
  uSum = 0;
  vSum = 0;
  velSum = 0;
  velMax = 0;
  rajadaMax = 0;

  static fromCompactState(st: WindRoseCompactState | undefined): WindRoseAccumulatorTs {
    const acc = new WindRoseAccumulatorTs();
    if (!st) return acc;
    acc.secBins = st.sec_bins.map((r) => [...r]);
    acc.secVelSum = [...st.sec_vel_sum];
    acc.secGustMax = [...st.sec_gust_max];
    acc.calmasSemDir = st.calmas_sem_dir || 0;
    acc.total = st.total || 0;
    acc.uSum = st.u_sum || 0;
    acc.vSum = st.v_sum || 0;
    acc.velSum = st.vel_sum || 0;
    acc.velMax = st.vel_max || 0;
    acc.rajadaMax = st.rajada_max || 0;
    return acc;
  }

  addSample(
    dirDeg: number | null | undefined,
    velKmh: number | null | undefined,
    gustKmh?: number | null,
    includeCalm = false
  ): void {
    if (velKmh === null || velKmh === undefined || !Number.isFinite(Number(velKmh))) return;
    const { v, g } = applyWindQc(Number(velKmh), gustKmh);
    if (!includeCalm && v < 0.5 && g < 1.0) {
      this.calmasSemDir += 1;
      this.total += 1;
      return;
    }
    if (dirDeg === null || dirDeg === undefined || !Number.isFinite(Number(dirDeg))) {
      this.calmasSemDir += 1;
      this.total += 1;
      return;
    }

    const deg = ((Number(dirDeg) % 360) + 360) % 360;
    const secIdx = Math.round(deg / 22.5) % 16;
    const binIdx = speedBinIdx(v);

    this.total += 1;
    this.secBins[secIdx][binIdx] += 1;
    this.secVelSum[secIdx] += v;
    if (g > this.secGustMax[secIdx]) this.secGustMax[secIdx] = g;

    const rad = (deg * Math.PI) / 180;
    const wVec = v > 0.05 ? v : 0.5;
    this.uSum += wVec * Math.sin(rad);
    this.vSum += wVec * Math.cos(rad);
    this.velSum += v;
    if (v > this.velMax) this.velMax = v;
    if (g > this.rajadaMax) this.rajadaMax = g;
  }

  toDistribution(): WindRoseDistribution {
    const denom = Math.max(1, this.total);
    const validDir = this.total - this.calmasSemDir;
    const setores: WindRoseSector[] = [];
    let lt5Total = this.calmasSemDir;
    let nlCount = 0;
    let sulCount = 0;

    for (let idx = 0; idx < 16; idx++) {
      const counts = this.secBins[idx];
      const cTot = counts[0] + counts[1] + counts[2] + counts[3] + counts[4];
      lt5Total += counts[0];
      if (NORTH_EAST_SECTORS.has(idx)) nlCount += cTot;
      if (SOUTH_SECTORS.has(idx)) sulCount += cTot;

      setores.push({
        idx,
        cardeal: SECTORS_16_PT[idx],
        angulo_centro: Math.round(idx * 22.5 * 10) / 10,
        total_count: cTot,
        pct: this.total > 0 ? Math.round((cTot * 1000) / denom) / 10 : 0,
        vel_media_kmh: cTot > 0 ? Math.round((this.secVelSum[idx] / cTot) * 10) / 10 : 0,
        rajada_max_kmh: Math.round(this.secGustMax[idx] * 10) / 10,
        bins: counts.map((c) => (this.total > 0 ? Math.round((c * 10000) / denom) / 100 : 0)),
        bins_count: [...counts],
      });
    }

    let predSec: WindRoseSector | null = null;
    if (validDir > 0) {
      for (const s of setores) {
        if (
          !predSec ||
          s.total_count > predSec.total_count ||
          (s.total_count === predSec.total_count && s.vel_media_kmh > predSec.vel_media_kmh)
        ) {
          predSec = s;
        }
      }
    }

    const dirPred = predSec && predSec.total_count > 0 ? predSec.cardeal : 'N/D';
    const dirPredDeg = predSec && predSec.total_count > 0 ? predSec.angulo_centro : null;
    const dirPredPct = predSec && predSec.total_count > 0 ? predSec.pct : 0;

    const vecMag = Math.hypot(this.uSum, this.vSum);
    let dirVecDeg: number | null = null;
    let dirVecCard = 'N/D';
    let persist = 0;

    if (validDir > 0 && vecMag > 1e-6) {
      dirVecDeg = Math.round(((Math.atan2(this.uSum, this.vSum) * 180) / Math.PI + 360) % 360) % 360;
      dirVecCard = degToCardinal16Pt(dirVecDeg);
      const scalarSum = this.velSum > 0.1 ? this.velSum : validDir * 0.5;
      persist = Math.min(100, Math.round((vecMag * 1000) / scalarSum) / 10);
    }

    const validDenom = Math.max(1, validDir);
    return {
      total_amostras: this.total,
      amostras_validas_dir: validDir,
      calmas_sem_dir_count: this.calmasSemDir,
      calmo_pct: this.total > 0 ? Math.round((lt5Total * 1000) / denom) / 10 : 0,
      vel_media_kmh: validDir > 0 ? Math.round((this.velSum / validDenom) * 10) / 10 : 0,
      vel_max_kmh: Math.round(this.velMax * 10) / 10,
      rajada_max_kmh: Math.round(this.rajadaMax * 10) / 10,
      dir_predominante: dirPred,
      dir_predominante_deg: dirPredDeg,
      dir_predominante_pct: dirPredPct,
      dir_vetorial_graus: dirVecDeg,
      dir_vetorial_cardeal: dirVecCard,
      persistencia_pct: persist,
      quadrante_sul_pct: validDir > 0 ? Math.round((sulCount * 1000) / validDenom) / 10 : 0,
      quadrante_norte_leste_pct: validDir > 0 ? Math.round((nlCount * 1000) / validDenom) / 10 : 0,
      setores,
    };
  }
}

function collapseTodaySamplesToHourly(samples: WindSampleRaw[]): { dir_graus: number | null; vel_kmh: number; rajada_kmh: number }[] {
  const buckets = new Map<string, WindSampleRaw[]>();
  for (const s of samples) {
    const hh = String(s.hora_min || '').slice(0, 2);
    if (hh.length === 2) {
      const grp = buckets.get(hh) || [];
      grp.push(s);
      buckets.set(hh, grp);
    }
  }
  const out: { dir_graus: number | null; vel_kmh: number; rajada_kmh: number }[] = [];
  for (const grp of buckets.values()) {
    let uSum = 0;
    let vSum = 0;
    let velSum = 0;
    let gMax = 0;
    let validDirs = 0;
    for (const s of grp) {
      const vel = Number(s.vel_kmh || 0);
      const gust = Number(s.rajada_kmh || vel);
      velSum += vel;
      if (gust > gMax) gMax = gust;
      if (Number.isFinite(s.dir_graus)) {
        const w = vel > 0.2 ? vel : 0.2;
        const rad = (s.dir_graus * Math.PI) / 180;
        uSum += w * Math.sin(rad);
        vSum += w * Math.cos(rad);
        validDirs += 1;
      }
    }
    const avgVel = Math.round((velSum / grp.length) * 10) / 10;
    const avgDir =
      validDirs > 0 && Math.hypot(uSum, vSum) > 1e-6
        ? Math.round(((Math.atan2(uSum, vSum) * 180) / Math.PI + 360) % 360) % 360
        : null;
    out.push({ dir_graus: avgDir, vel_kmh: avgVel, rajada_kmh: Math.round(gMax * 10) / 10 });
  }
  return out;
}

function buildForecastFromOpenMeteo(openMeteo: OpenMeteoData, todayIso: string): WindRoseDataset['previsao'] | null {
  const h = openMeteo?.hourly;
  if (!h?.time?.length || !h.wind_speed_10m?.length || !h.wind_direction_10m?.length) return null;

  const d0Ms = Date.parse(`${todayIso}T12:00:00Z`);
  const addDaysIso = (off: number) => {
    const dt = new Date(d0Ms + off * 86400_000);
    return dt.toISOString().slice(0, 10);
  };
  const d3Iso = addDaysIso(2);
  const d7Iso = addDaysIso(6);

  const accHoje = new WindRoseAccumulatorTs();
  const acc3d = new WindRoseAccumulatorTs();
  const acc7d = new WindRoseAccumulatorTs();
  const byDay = new Map<string, { acc: WindRoseAccumulatorTs; vels: number[] }>();

  for (let i = 0; i < h.time.length; i++) {
    const dIso = String(h.time[i] || '').slice(0, 10);
    if (!dIso || dIso < todayIso || dIso > d7Iso) continue;
    const vel = Number(h.wind_speed_10m[i]);
    const dir = Number(h.wind_direction_10m[i]);
    const gust = h.wind_gusts_10m?.[i] !== undefined && h.wind_gusts_10m?.[i] !== null ? Number(h.wind_gusts_10m[i]) : vel;
    if (!Number.isFinite(vel) || !Number.isFinite(dir)) continue;

    let entry = byDay.get(dIso);
    if (!entry) {
      entry = { acc: new WindRoseAccumulatorTs(), vels: [] };
      byDay.set(dIso, entry);
    }
    entry.acc.addSample(dir, vel, gust, true);
    entry.vels.push(vel);

    if (dIso === todayIso) accHoje.addSample(dir, vel, gust, true);
    if (dIso <= d3Iso) acc3d.addSample(dir, vel, gust, true);
    acc7d.addSample(dir, vel, gust, true);
  }

  const dias: WindRoseForecastDay[] = [];
  for (let off = 0; off < 7; off++) {
    const dIso = addDaysIso(off);
    const entry = byDay.get(dIso);
    if (!entry || entry.acc.total === 0) continue;
    const dist = entry.acc.toDistribution();
    const dtObj = new Date(`${dIso}T12:00:00Z`);
    const parts = dIso.split('-');
    dias.push({
      data_iso: dIso,
      data_br: `${parts[2]}/${parts[1]}/${parts[0]}`,
      dia_semana: DIAS_SEMANA_PT[dtObj.getUTCDay()] || '',
      dir_predominante: dist.dir_predominante,
      dir_vetorial_graus: dist.dir_vetorial_graus,
      persistencia_pct: dist.persistencia_pct,
      vel_min_kmh: Math.round(Math.min(...entry.vels) * 10) / 10,
      vel_media_kmh: dist.vel_media_kmh,
      vel_max_kmh: dist.vel_max_kmh,
      rajada_max_kmh: dist.rajada_max_kmh,
      quadrante_sul_pct: dist.quadrante_sul_pct,
      plancon_risco: classifyWindPlanconLabel(dist.rajada_max_kmh),
    });
  }

  return {
    fontes: 'ECMWF IFS 9km + NOAA GFS + DWD ICON 13km (Ao Vivo)',
    hoje: accHoje.toDistribution(),
    prox_3d: acc3d.toDistribution(),
    prox_7d: acc7d.toDistribution(),
    dias,
  };
}

/**
 * Reconcilia `data/wind_rose.json` em tempo real no navegador usando as leituras vivas das estações WU
 * (`acumulados.estacoes[].vento_hoje_amostras`) e a previsão horária harmonizada do Open-Meteo/ECMWF/GFS/ICON.
 */
export function recomputeLiveWindRose(
  base: WindRoseDataset | null,
  acumulados: AcumuladosDataset | null,
  openMeteo: OpenMeteoData | null
): WindRoseDataset | null {
  if (!base && !acumulados && !openMeteo) return null;
  const nowParts = getBrtDatePartsNow();
  const todayIso = nowParts.dateIso;

  const liveStationsByCode = new Map<string, NonNullable<AcumuladosDataset['estacoes']>[number]>();
  for (const st of acumulados?.estacoes || []) {
    const code = String(st.codigo || '').trim();
    if (code) liveStationsByCode.set(code, st);
  }

  // Atualiza previsão de 7 dias sempre que Open-Meteo harmonizado estiver disponível
  const liveForecast = openMeteo ? buildForecastFromOpenMeteo(openMeteo, todayIso) : null;

  if (!base) {
    const redeHojeAcc = new WindRoseAccumulatorTs();
    const estacoesOut: WindRoseStationSnapshot[] = [];
    for (const [code, st] of liveStationsByCode.entries()) {
      if (st.categoria !== 'pws') continue;
      const samples = (st.vento_hoje_amostras || []).filter((s) => s.dt_iso === todayIso);
      const stAcc = new WindRoseAccumulatorTs();
      for (const s of samples) {
        stAcc.addSample(s.dir_graus, s.vel_kmh, s.rajada_kmh);
        redeHojeAcc.addSample(s.dir_graus, s.vel_kmh, s.rajada_kmh);
      }
      if (samples.length === 0 && st.online && st.vento_dir_graus !== null && st.vento_dir_graus !== undefined) {
        stAcc.addSample(st.vento_dir_graus, st.vento_atual ?? 0, st.rajada_atual ?? st.vento_atual ?? 0);
        redeHojeAcc.addSample(st.vento_dir_graus, st.vento_atual ?? 0, st.rajada_atual ?? st.vento_atual ?? 0);
      }
      const dist = stAcc.toDistribution();
      estacoesOut.push({
        codigo: code,
        nome: st.nome_curto || st.nome,
        bairro: st.bairro || st.nome,
        costeira: code === 'IRIODA17' || code === 'IRIODA6' || code === 'ICASIM5',
        online: Boolean(st.online),
        ultima_leitura: st.ultima_leitura || null,
        vento_atual_kmh: st.vento_atual ?? null,
        rajada_atual_kmh: st.rajada_atual ?? null,
        dir_atual_graus: st.vento_dir_graus ?? null,
        dir_atual_cardeal: st.vento_dir_cardinal ?? null,
        vento_max_hoje_kmh: st.vento_max_hoje ?? null,
        rajada_max_hoje_kmh: st.rajada_max_hoje ?? null,
        periodos: { hoje: dist, '7d': dist, '30d': dist, mes_atual: dist, historico: dist },
      });
    }
    const redeDist = redeHojeAcc.toDistribution();
    const fallbackPrevisao = liveForecast || {
      fontes: 'Open-Meteo / NWP',
      hoje: redeDist,
      prox_3d: redeDist,
      prox_7d: redeDist,
      dias: [],
    };
    return {
      atualizacao_brt: nowParts.brtStr,
      atualizacao_iso: new Date().toISOString(),
      data_referencia_iso: todayIso,
      mes_referencia: nowParts.mesRef,
      periodo_inicio: nowParts.brShort,
      periodo_fim: nowParts.brShort,
      total_dias_serie: 1,
      total_horas_serie: redeDist.total_amostras,
      faixas_velocidade: SPEED_BINS_WIND_ROSE,
      setores_referencia: SECTORS_16_PT,
      rede: {
        periodos: { hoje: redeDist, '7d': redeDist, '30d': redeDist, mes_atual: redeDist, historico: redeDist },
      },
      estacoes: estacoesOut,
      serie_diaria:
        redeDist.total_amostras > 0
          ? [
              {
                data_iso: todayIso,
                data_br: nowParts.brShort,
                amostras: redeDist.total_amostras,
                dir_predominante: redeDist.dir_predominante,
                dir_vetorial_graus: redeDist.dir_vetorial_graus,
                dir_vetorial_cardeal: redeDist.dir_vetorial_cardeal,
                persistencia_pct: redeDist.persistencia_pct,
                vel_media_kmh: redeDist.vel_media_kmh,
                vel_max_kmh: redeDist.vel_max_kmh,
                rajada_max_kmh: redeDist.rajada_max_kmh,
                quadrante_sul_pct: redeDist.quadrante_sul_pct,
                quadrante_norte_leste_pct: redeDist.quadrante_norte_leste_pct,
                regime: classifyDailyRegime(redeDist.quadrante_norte_leste_pct, redeDist.quadrante_sul_pct, redeDist.amostras_validas_dir),
              },
            ]
          : [],
      previsao: fallbackPrevisao,
    };
  }

  const sameDay = base.data_referencia_iso === todayIso;
  const hasAnyLiveTodaySamples = Array.from(liveStationsByCode.values()).some(
    (st) => st.categoria === 'pws' && ((st.vento_hoje_amostras || []).some((s) => s.dt_iso === todayIso) || st.online)
  );

  if (!hasAnyLiveTodaySamples && sameDay) {
    return {
      ...base,
      ...(liveForecast ? { previsao: liveForecast } : {}),
    };
  }

  const redeHojeAcc = new WindRoseAccumulatorTs();
  const redeTodayHourlyPts: { dir_graus: number | null; vel_kmh: number; rajada_kmh: number }[] = [];

  const updatedEstacoes: WindRoseStationSnapshot[] = base.estacoes.map((stSnap) => {
    const liveSt = liveStationsByCode.get(stSnap.codigo);
    if (!liveSt) return stSnap;

    const todaySamples = (liveSt.vento_hoje_amostras || []).filter((s) => s.dt_iso === todayIso);
    const stHojeAcc = new WindRoseAccumulatorTs();

    if (todaySamples.length > 0) {
      for (const s of todaySamples) {
        stHojeAcc.addSample(s.dir_graus, s.vel_kmh, s.rajada_kmh);
        redeHojeAcc.addSample(s.dir_graus, s.vel_kmh, s.rajada_kmh);
      }
      const collapsed = collapseTodaySamplesToHourly(todaySamples);
      for (const ch of collapsed) {
        redeTodayHourlyPts.push(ch);
      }
    } else if (liveSt.online && liveSt.vento_dir_graus !== null && liveSt.vento_dir_graus !== undefined) {
      const vNow = Number(liveSt.vento_atual ?? 0);
      const gNow = Number(liveSt.rajada_atual ?? vNow);
      stHojeAcc.addSample(liveSt.vento_dir_graus, vNow, gNow);
      redeHojeAcc.addSample(liveSt.vento_dir_graus, vNow, gNow);
      redeTodayHourlyPts.push({ dir_graus: liveSt.vento_dir_graus, vel_kmh: vNow, rajada_kmh: gNow });
    } else if (sameDay && stSnap.periodos.hoje.total_amostras > 0) {
      return {
        ...stSnap,
        online: Boolean(liveSt.online),
        ultima_leitura: liveSt.ultima_leitura || stSnap.ultima_leitura,
      };
    }

    const useLiveHoje = stHojeAcc.total > 0;
    const hojeDist = useLiveHoje ? stHojeAcc.toDistribution() : sameDay ? stSnap.periodos.hoje : new WindRoseAccumulatorTs().toDistribution();

    const updatedPeriods = { ...stSnap.periodos, hoje: hojeDist };
    if (sameDay && stSnap.base_sem_hoje && todaySamples.length > 0) {
      const stHourlyToday = collapseTodaySamplesToHourly(todaySamples);
      for (const pk of ['7d', '30d', 'mes_atual', 'historico'] as const) {
        const baseAcc = WindRoseAccumulatorTs.fromCompactState(stSnap.base_sem_hoje[pk]);
        for (const ch of stHourlyToday) {
          baseAcc.addSample(ch.dir_graus, ch.vel_kmh, ch.rajada_kmh);
        }
        updatedPeriods[pk] = baseAcc.toDistribution();
      }
    }

    return {
      ...stSnap,
      online: Boolean(liveSt.online),
      ultima_leitura: liveSt.ultima_leitura || stSnap.ultima_leitura,
      vento_atual_kmh: liveSt.vento_atual ?? stSnap.vento_atual_kmh,
      rajada_atual_kmh: liveSt.rajada_atual ?? stSnap.rajada_atual_kmh,
      dir_atual_graus: liveSt.vento_dir_graus ?? stSnap.dir_atual_graus,
      dir_atual_cardeal: liveSt.vento_dir_cardinal ?? stSnap.dir_atual_cardeal,
      vento_max_hoje_kmh: liveSt.vento_max_hoje ?? stSnap.vento_max_hoje_kmh,
      rajada_max_hoje_kmh: liveSt.rajada_max_hoje ?? stSnap.rajada_max_hoje_kmh,
      periodos: updatedPeriods,
    };
  });

  const redePeriods = { ...base.rede.periodos };
  if (redeHojeAcc.total > 0) {
    redePeriods.hoje = redeHojeAcc.toDistribution();
  } else if (!sameDay) {
    redePeriods.hoje = new WindRoseAccumulatorTs().toDistribution();
  }

  if (sameDay && base.rede.base_sem_hoje && redeTodayHourlyPts.length > 0) {
    for (const pk of ['7d', '30d', 'mes_atual', 'historico'] as const) {
      const baseAcc = WindRoseAccumulatorTs.fromCompactState(base.rede.base_sem_hoje[pk]);
      for (const ch of redeTodayHourlyPts) {
        baseAcc.addSample(ch.dir_graus, ch.vel_kmh, ch.rajada_kmh);
      }
      redePeriods[pk] = baseAcc.toDistribution();
    }
  }

  // Atualiza entrada de hoje em serie_diaria
  const serieDiaria = [...base.serie_diaria];
  if (redeTodayHourlyPts.length > 0) {
    const todayDailyAcc = new WindRoseAccumulatorTs();
    for (const ch of redeTodayHourlyPts) {
      todayDailyAcc.addSample(ch.dir_graus, ch.vel_kmh, ch.rajada_kmh);
    }
    const td = todayDailyAcc.toDistribution();
    if (td.total_amostras > 0) {
      const todayRow: WindRoseDailyEntry = {
        data_iso: todayIso,
        data_br: nowParts.brShort,
        amostras: td.total_amostras,
        dir_predominante: td.dir_predominante,
        dir_vetorial_graus: td.dir_vetorial_graus,
        dir_vetorial_cardeal: td.dir_vetorial_cardeal,
        persistencia_pct: td.persistencia_pct,
        vel_media_kmh: td.vel_media_kmh,
        vel_max_kmh: td.vel_max_kmh,
        rajada_max_kmh: td.rajada_max_kmh,
        quadrante_sul_pct: td.quadrante_sul_pct,
        quadrante_norte_leste_pct: td.quadrante_norte_leste_pct,
        regime: classifyDailyRegime(td.quadrante_norte_leste_pct, td.quadrante_sul_pct, td.amostras_validas_dir),
      };
      const existingIdx = serieDiaria.findIndex((r) => r.data_iso === todayIso);
      if (existingIdx >= 0) {
        serieDiaria[existingIdx] = todayRow;
      } else {
        serieDiaria.push(todayRow);
        if (serieDiaria.length > 35) serieDiaria.shift();
      }
    }
  }

  return {
    ...base,
    atualizacao_brt: nowParts.brtStr,
    data_referencia_iso: todayIso,
    periodo_fim: nowParts.brShort,
    mes_referencia: nowParts.mesRef,
    rede: {
      ...base.rede,
      periodos: redePeriods,
    },
    estacoes: updatedEstacoes,
    serie_diaria: serieDiaria,
    previsao: liveForecast || base.previsao,
  };
}
