import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  CloudRain,
  Compass,
  Droplets,
  Gauge,
  MapPin,
  Thermometer,
  Wind,
} from 'lucide-react';
import type {
  AcumuladosDataset,
  HistoricoDiaEstacao,
  HistoricoEstacoesDataset,
  HistoricoResumoDiario,
  WindRoseDataset,
} from '../services/siteData';
import { classifyRainPlancon, classifyWindPlancon } from '../services/liveRainConsensus';

export interface MergedDailyHistoryEntry extends HistoricoResumoDiario {
  is_live_today?: boolean;
  live_atualizacao?: string;
}

export interface CalendarCell {
  dayNum: number;
  dateIso: string;
}

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
const MONTHS_SHORT_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function getTodayBrtIso(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const map: Record<string, string> = {};
  parts.forEach((p) => {
    map[p.type] = p.value;
  });
  return `${map.year}-${map.month}-${map.day}`;
}

export function buildCalendarMonthGrid(year: number, month1to12: number): Array<CalendarCell | null> {
  const firstDow = new Date(Date.UTC(year, month1to12 - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
  const cells: Array<CalendarCell | null> = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  const ym = `${year}-${String(month1to12).padStart(2, '0')}`;
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      dayNum: d,
      dateIso: `${ym}-${String(d).padStart(2, '0')}`,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function normalizeHistStationKey(code?: string): string {
  if (!code) return '';
  if (code === 'PCD 18789') return 'PCD18789';
  return code;
}

function formatDateBrFromIso(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

function formatWeekdayFullPt(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(dt);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Consolida a série histórica diária (resumo_diario) e concilia o dia atual (todayIso)
 * com as estações ao vivo de `acumulados` e `liveWindRose`.
 */
export function buildMergedDailyHistoryMap(
  historico: HistoricoEstacoesDataset | null | undefined,
  acumulados?: AcumuladosDataset | null,
  liveWindRose?: WindRoseDataset | null,
  todayIsoOverride?: string
): Map<string, MergedDailyHistoryEntry> {
  const map = new Map<string, MergedDailyHistoryEntry>();
  const rows = historico?.resumo_diario ?? [];
  for (const row of rows) {
    if (!row?.data_iso) continue;
    map.set(row.data_iso, { ...row });
  }

  const todayIso = todayIsoOverride || getTodayBrtIso();
  const onlineGauges = (acumulados?.estacoes ?? []).filter(
    (s) => s && s.categoria !== 'inea' && s.online !== false
  );
  const existingToday = map.get(todayIso);

  if (existingToday || onlineGauges.length > 0) {
    const [ty, tm, td] = todayIso.split('-').map(Number);
    const baseToday: MergedDailyHistoryEntry = existingToday
      ? {
          ...existingToday,
          estacoes_totais_dia: existingToday.estacoes_totais_dia
            ? { ...existingToday.estacoes_totais_dia }
            : {},
        }
      : {
          data_iso: todayIso,
          data_br: formatDateBrFromIso(todayIso),
          dia: td,
          mes_num: tm,
          mes_nome: MONTHS_PT[(tm || 1) - 1],
          ano: ty,
          horas_registradas: 0,
          horas_com_chuva: 0,
          chuva_total_media_mm: 0,
          chuva_maior_estacao_mm: 0,
          chuva_maior_estacao_nome: 'Rede Municipal',
          chuva_pico_hora_mm: 0,
          chuva_pico_horario: '--',
          estacoes_totais_dia: {},
          vento_vel_media_kmh: 0,
          vento_vel_max_kmh: 0,
          vento_dir_predominante: '--',
          giro_quadrante_sul: false,
          vento_rajada_max_kmh: 0,
          vento_rajada_max_horario: '--',
          vento_rajada_max_estacao: 'Rede Municipal',
        };

    const stTotals: Record<string, HistoricoDiaEstacao> = {
      ...(baseToday.estacoes_totais_dia || {}),
    };

    const liveRainSamples: number[] = [];
    let bestGustVal = Number(baseToday.vento_rajada_max_kmh ?? 0);
    let bestGustHr = baseToday.vento_rajada_max_horario || '--';
    let bestGustSt = baseToday.vento_rajada_max_estacao || 'Rede Municipal';
    let bestSustVal = Number(baseToday.vento_vel_max_kmh ?? 0);

    for (const st of acumulados?.estacoes ?? []) {
      if (!st || st.categoria === 'inea') continue;
      const key = normalizeHistStationKey(st.codigo);
      if (!key) continue;
      const prevSt = stTotals[key];
      const liveRain =
        st.online !== false && st.chuva_hoje !== undefined && st.chuva_hoje !== null && Number.isFinite(st.chuva_hoje)
          ? Number(st.chuva_hoje)
          : null;
      const liveGust =
        st.online !== false &&
        (st.rajada_max_hoje ?? st.rajada_atual) !== undefined &&
        (st.rajada_max_hoje ?? st.rajada_atual) !== null
          ? Number(st.rajada_max_hoje ?? st.rajada_atual)
          : null;
      const liveSust =
        st.online !== false &&
        (st.vento_max_hoje ?? st.vento_atual) !== undefined &&
        (st.vento_max_hoje ?? st.vento_atual) !== null
          ? Number(st.vento_max_hoje ?? st.vento_atual)
          : null;

      const mergedRain = Math.round(Math.max(Number(prevSt?.chuva_mm ?? 0), liveRain ?? 0) * 10) / 10;
      const mergedGust = Math.round(Math.max(Number(prevSt?.rajada_max_kmh ?? 0), liveGust ?? 0) * 10) / 10;

      if (prevSt || liveRain !== null || liveGust !== null) {
        stTotals[key] = {
          nome: prevSt?.nome || st.nome_curto || st.nome,
          chuva_mm: mergedRain,
          rajada_max_kmh: mergedGust,
        };
      }

      if (liveRain !== null) {
        liveRainSamples.push(mergedRain);
      }
      if (liveGust !== null && liveGust > bestGustVal) {
        bestGustVal = Math.round(liveGust * 10) / 10;
        bestGustHr = st.hora_rajada_max_hoje || bestGustHr;
        bestGustSt = st.nome_curto || st.nome;
      }
      if (liveSust !== null && liveSust > bestSustVal) {
        bestSustVal = Math.round(liveSust * 10) / 10;
      }
    }

    if (liveWindRose?.rede?.periodos?.hoje) {
      const redeHoje = liveWindRose.rede.periodos.hoje;
      if (redeHoje.rajada_max_kmh > bestGustVal) {
        bestGustVal = Math.round(redeHoje.rajada_max_kmh * 10) / 10;
      }
      if (redeHoje.vel_media_kmh > 0 && (!baseToday.vento_vel_media_kmh || baseToday.vento_vel_media_kmh <= 0)) {
        baseToday.vento_vel_media_kmh = redeHoje.vel_media_kmh;
      }
      if (redeHoje.dir_predominante && (!baseToday.vento_dir_predominante || baseToday.vento_dir_predominante === '--')) {
        baseToday.vento_dir_predominante = redeHoje.dir_predominante;
      }
    }

    const stEntries = Object.values(stTotals);
    let topRainVal = Number(baseToday.chuva_maior_estacao_mm ?? 0);
    let topRainName = baseToday.chuva_maior_estacao_nome || 'Rede Municipal';
    for (const entry of stEntries) {
      if (entry.chuva_mm > topRainVal) {
        topRainVal = entry.chuva_mm;
        topRainName = entry.nome;
      }
    }

    const liveMean =
      liveRainSamples.length > 0
        ? Math.round((liveRainSamples.reduce((a, b) => a + b, 0) / liveRainSamples.length) * 10) / 10
        : 0;
    const histMean = Number(baseToday.chuva_total_media_mm ?? 0);

    baseToday.estacoes_totais_dia = stTotals;
    baseToday.chuva_total_media_mm = Math.round(Math.max(histMean, liveMean) * 10) / 10;
    baseToday.chuva_maior_estacao_mm = Math.round(topRainVal * 10) / 10;
    baseToday.chuva_maior_estacao_nome = topRainName;
    baseToday.vento_rajada_max_kmh = Math.round(bestGustVal * 10) / 10;
    baseToday.vento_rajada_max_horario = bestGustHr;
    baseToday.vento_rajada_max_estacao = bestGustSt;
    baseToday.vento_vel_max_kmh = Math.round(bestSustVal * 10) / 10;
    baseToday.is_live_today = true;
    baseToday.live_atualizacao = acumulados?.atualizacao;

    const liveRainCat =
      baseToday.chuva_maior_estacao_mm > 0.1 || baseToday.chuva_total_media_mm > 0.1
        ? `${classifyRainPlancon(Math.max(baseToday.chuva_total_media_mm, baseToday.chuva_maior_estacao_mm)).titulo}: média na rede de ${baseToday.chuva_total_media_mm.toFixed(1)} mm e maior acumulado de ${baseToday.chuva_maior_estacao_mm.toFixed(1)} mm (${baseToday.chuva_maior_estacao_nome})`
        : 'Sem registro de chuva até o momento';
    const liveWindDesc =
      baseToday.vento_rajada_max_kmh > 0
        ? `vento predominante ${baseToday.vento_dir_predominante || '--'} e rajada máxima de ${baseToday.vento_rajada_max_kmh.toFixed(1)} km/h${
            baseToday.vento_rajada_max_horario && baseToday.vento_rajada_max_horario !== '--'
              ? ` às ${baseToday.vento_rajada_max_horario}`
              : ''
          } (${baseToday.vento_rajada_max_estacao})`
        : `vento predominante ${baseToday.vento_dir_predominante || '--'}`;
    const liveThermoDesc =
      baseToday.temp_min_c !== undefined && baseToday.temp_max_c !== undefined
        ? `; temperaturas entre ${Number(baseToday.temp_min_c).toFixed(1)}°C e ${Number(baseToday.temp_max_c).toFixed(1)}°C`
        : '';
    baseToday.caracteristicas_dia = `Resumo parcial ao vivo de hoje: ${liveRainCat}; ${liveWindDesc}${liveThermoDesc}.`;

    map.set(todayIso, baseToday);
  }

  return map;
}

function getRainCellTone(mm: number, isSelected: boolean): string {
  if (isSelected) {
    return 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#0B1324] border-[#14213D] dark:border-[#FF8244] shadow-sm';
  }
  if (mm >= 50) {
    return 'bg-rose-500/15 dark:bg-rose-500/20 border-rose-400/60 dark:border-rose-400/50 text-[#14213D] dark:text-white hover:border-[#FF8244]';
  }
  if (mm >= 15) {
    return 'bg-[#FF8244]/15 dark:bg-[#FF8244]/20 border-[#FF8244]/50 text-[#14213D] dark:text-white hover:border-[#FF8244]';
  }
  if (mm >= 1) {
    return 'bg-sky-500/10 dark:bg-sky-500/15 border-sky-400/40 dark:border-sky-400/35 text-[#14213D] dark:text-white hover:border-[#FF8244]';
  }
  if (mm >= 0.2) {
    return 'bg-slate-100 dark:bg-[#0B1324] border-slate-300 dark:border-[#233354] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FF8244]';
  }
  return 'bg-[#F7F8FA] dark:bg-[#0B1324]/70 border-[#E5E5E5] dark:border-[#233354] text-slate-700 dark:text-[#E5E5E5]/85 hover:border-[#FF8244]';
}

function getRainBadgeTone(mm: number): string {
  if (mm >= 70) return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/40';
  if (mm >= 50) return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-400/40';
  if (mm >= 15) return 'bg-[#FF8244]/15 text-[#C2410C] dark:text-[#FF8244] border-[#FF8244]/40';
  if (mm >= 1) return 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-400/40';
  return 'bg-slate-200/70 dark:bg-[#1E2E52] text-slate-700 dark:text-[#E5E5E5]/80 border-slate-300 dark:border-[#2E426D]';
}

interface HistoricoCalendarSectionProps {
  historico: HistoricoEstacoesDataset | null;
  acumulados?: AcumuladosDataset | null;
  liveWindRose?: WindRoseDataset | null;
  selectedIso?: string | null;
  onSelectIso?: (iso: string) => void;
}

export const HistoricoCalendarSection: React.FC<HistoricoCalendarSectionProps> = ({
  historico,
  acumulados,
  liveWindRose,
  selectedIso: controlledIso,
  onSelectIso,
}) => {
  const todayIso = useMemo(() => getTodayBrtIso(), []);
  const dailyMap = useMemo(
    () => buildMergedDailyHistoryMap(historico, acumulados, liveWindRose, todayIso),
    [historico, acumulados, liveWindRose, todayIso]
  );

  const sortedDates = useMemo(() => Array.from(dailyMap.keys()).sort(), [dailyMap]);
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (const iso of sortedDates) set.add(iso.slice(0, 7));
    return Array.from(set).sort();
  }, [sortedDates]);

  const latestIso = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : todayIso;
  const [internalSelectedIso, setInternalSelectedIso] = useState<string>(latestIso);
  const activeSelectedIso =
    controlledIso && dailyMap.has(controlledIso)
      ? controlledIso
      : dailyMap.has(internalSelectedIso)
        ? internalSelectedIso
        : latestIso;

  const [viewMonthYm, setViewMonthYm] = useState<string>(activeSelectedIso.slice(0, 7));
  const [showHourlyRows, setShowHourlyRows] = useState<boolean>(false);

  useEffect(() => {
    if (controlledIso && dailyMap.has(controlledIso)) {
      setInternalSelectedIso(controlledIso);
      setViewMonthYm(controlledIso.slice(0, 7));
    }
  }, [controlledIso, dailyMap]);

  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(viewMonthYm)) {
      setViewMonthYm(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths, viewMonthYm]);

  const handlePickDay = (iso: string) => {
    if (!dailyMap.has(iso)) return;
    setInternalSelectedIso(iso);
    setViewMonthYm(iso.slice(0, 7));
    onSelectIso?.(iso);
  };

  const [viewYear, viewMonth] = useMemo(() => {
    const parts = viewMonthYm.split('-').map(Number);
    return [parts[0] || 2026, parts[1] || 11];
  }, [viewMonthYm]);

  const calendarCells = useMemo(() => buildCalendarMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthDays = useMemo(
    () => sortedDates.filter((iso) => iso.startsWith(viewMonthYm)).map((iso) => dailyMap.get(iso)!),
    [sortedDates, viewMonthYm, dailyMap]
  );

  const monthStats = useMemo(() => {
    if (monthDays.length === 0) return null;
    const totalMean = monthDays.reduce((s, d) => s + Number(d.chuva_total_media_mm ?? 0), 0);
    const rainyDays = monthDays.filter((d) => Number(d.chuva_total_media_mm ?? 0) > 0 || Number(d.chuva_maior_estacao_mm ?? 0) > 0).length;
    const wettestDay = monthDays.reduce(
      (best, cur) =>
        Number(cur.chuva_total_media_mm ?? 0) > Number(best.chuva_total_media_mm ?? 0) ? cur : best,
      monthDays[0]
    );
    const windiestDay = monthDays.reduce(
      (best, cur) =>
        Number(cur.vento_rajada_max_kmh ?? 0) > Number(best.vento_rajada_max_kmh ?? 0) ? cur : best,
      monthDays[0]
    );
    return {
      totalMean: Math.round(totalMean * 10) / 10,
      rainyDays,
      totalDays: monthDays.length,
      wettestDay,
      windiestDay,
    };
  }, [monthDays]);

  const selectedDay = dailyMap.get(activeSelectedIso) || null;
  const selectedMonthIdx = availableMonths.indexOf(viewMonthYm);
  const prevMonthYm = selectedMonthIdx > 0 ? availableMonths[selectedMonthIdx - 1] : null;
  const nextMonthYm =
    selectedMonthIdx >= 0 && selectedMonthIdx < availableMonths.length - 1
      ? availableMonths[selectedMonthIdx + 1]
      : null;

  const selectedStations = useMemo(() => {
    if (!selectedDay?.estacoes_totais_dia) return [];
    return Object.entries(selectedDay.estacoes_totais_dia)
      .map(([code, st]) => ({
        code,
        nome: st.nome || code,
        chuva_mm: Number(st.chuva_mm ?? 0),
        rajada_max_kmh: Number(st.rajada_max_kmh ?? 0),
      }))
      .sort((a, b) => b.chuva_mm - a.chuva_mm || b.rajada_max_kmh - a.rajada_max_kmh);
  }, [selectedDay]);

  const selectedDayHourly = useMemo(() => {
    const list = historico?.registros_horarios ?? [];
    return list.filter((r) => r.data_iso === activeSelectedIso);
  }, [historico, activeSelectedIso]);

  if (!selectedDay && sortedDates.length === 0) {
    return null;
  }

  const rainMean = Number(selectedDay?.chuva_total_media_mm ?? 0);
  const rainMaxSt = Number(selectedDay?.chuva_maior_estacao_mm ?? 0);
  const rainPlancon = classifyRainPlancon(Math.max(rainMean, rainMaxSt));
  const gustMaxDay = Number(selectedDay?.vento_rajada_max_kmh ?? 0);
  const windPlancon = classifyWindPlancon(selectedDay?.vento_vel_media_kmh, gustMaxDay);
  const maxStationRainInDay = Math.max(0.1, ...selectedStations.map((s) => s.chuva_mm));

  return (
    <section
      id="calendario-diario-chuva-vento"
      className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-5 sm:p-7 space-y-6"
    >
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E5E5E5] dark:border-[#233354]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-[#FF8244] shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-[#14213D] dark:text-white">
                Calendário Diário — Chuva, Vento &amp; Rajadas
              </h2>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-slate-600 dark:text-[#E5E5E5]/75">
                {sortedDates.length} dias registrados
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
              Escolha qualquer dia no calendário para consultar o acumulado de chuva (média e por estação), direção predominante e rajada máxima.
            </p>
          </div>
        </div>

        {/* Atalhos rápidos */}
        <div className="flex flex-wrap items-center gap-2">
          {dailyMap.has(todayIso) && (
            <button
              type="button"
              onClick={() => handlePickDay(todayIso)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                activeSelectedIso === todayIso
                  ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#0B1324] border-[#14213D] dark:border-[#FF8244]'
                  : 'bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-white border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]'
              }`}
            >
              Hoje ({formatDateBrFromIso(todayIso).slice(0, 5)})
            </button>
          )}
          {monthStats && Number(monthStats.wettestDay.chuva_total_media_mm ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => handlePickDay(monthStats.wettestDay.data_iso)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#E5E5E5] border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] transition cursor-pointer"
              title="Saltar para o dia mais chuvoso do mês exibido"
            >
              + Chuvoso: {formatDateBrFromIso(monthStats.wettestDay.data_iso).slice(0, 5)} (
              {Number(monthStats.wettestDay.chuva_total_media_mm ?? 0).toFixed(1)} mm)
            </button>
          )}
          {monthStats && Number(monthStats.windiestDay.vento_rajada_max_kmh ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => handlePickDay(monthStats.windiestDay.data_iso)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#E5E5E5] border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] transition cursor-pointer"
              title="Saltar para o dia com maior rajada no mês exibido"
            >
              Maior Rajada: {formatDateBrFromIso(monthStats.windiestDay.data_iso).slice(0, 5)} (
              {Number(monthStats.windiestDay.vento_rajada_max_kmh ?? 0).toFixed(0)} km/h)
            </button>
          )}
        </div>
      </div>

      {/* Layout Principal: Calendário à esquerda (5 cols) | Painel do Dia Selecionado à direita (7 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* CALENDÁRIO MENSAL */}
        <div className="xl:col-span-5 space-y-4">
          {/* Barra de Navegação Mensal */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
            <button
              type="button"
              disabled={!prevMonthYm}
              onClick={() => prevMonthYm && setViewMonthYm(prevMonthYm)}
              aria-label="Mês anterior"
              className={`p-1.5 rounded-lg border transition ${
                prevMonthYm
                  ? 'bg-white dark:bg-[#14213D] border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-white hover:border-[#FF8244] cursor-pointer'
                  : 'opacity-40 cursor-not-allowed border-transparent text-slate-400'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="font-display text-sm sm:text-base font-semibold text-[#14213D] dark:text-white">
                {MONTHS_PT[viewMonth - 1]} {viewYear}
              </div>
              {monthStats && (
                <div className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/65">
                  {monthStats.totalMean.toFixed(1)} mm méd. · {monthStats.rainyDays}/{monthStats.totalDays} dias c/ chuva
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!nextMonthYm}
              onClick={() => nextMonthYm && setViewMonthYm(nextMonthYm)}
              aria-label="Próximo mês"
              className={`p-1.5 rounded-lg border transition ${
                nextMonthYm
                  ? 'bg-white dark:bg-[#14213D] border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-white hover:border-[#FF8244] cursor-pointer'
                  : 'opacity-40 cursor-not-allowed border-transparent text-slate-400'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Seletor rápido de meses disponíveis */}
          {availableMonths.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {availableMonths.map((ym) => {
                const [y, m] = ym.split('-').map(Number);
                const active = ym === viewMonthYm;
                return (
                  <button
                    key={ym}
                    type="button"
                    onClick={() => {
                      setViewMonthYm(ym);
                      const firstDayInMonth = sortedDates.find((d) => d.startsWith(ym));
                      if (ym === todayIso.slice(0, 7) && dailyMap.has(todayIso)) {
                        handlePickDay(todayIso);
                      } else if (firstDayInMonth) {
                        handlePickDay(firstDayInMonth);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                      active
                        ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#0B1324] border-[#14213D] dark:border-[#FF8244] font-semibold'
                        : 'bg-[#F7F8FA] dark:bg-[#0B1324] text-slate-600 dark:text-[#E5E5E5]/75 border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]'
                    }`}
                  >
                    {MONTHS_SHORT_PT[(m || 1) - 1]}/{String(y).slice(2)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Cabeçalho Dias da Semana */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {WEEKDAYS_PT.map((wd) => (
              <div
                key={wd}
                className="text-[10.5px] font-mono uppercase tracking-wide text-slate-500 dark:text-[#E5E5E5]/60 py-1"
              >
                {wd}
              </div>
            ))}

            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="min-h-[56px] sm:min-h-[62px]" aria-hidden="true" />;
              }
              const entry = dailyMap.get(cell.dateIso);
              const isSelected = cell.dateIso === activeSelectedIso;
              const isToday = cell.dateIso === todayIso;
              if (!entry) {
                return (
                  <div
                    key={cell.dateIso}
                    className="min-h-[56px] sm:min-h-[62px] rounded-lg border border-dashed border-[#E5E5E5]/70 dark:border-[#233354]/60 p-1.5 flex flex-col justify-between opacity-40 select-none"
                  >
                    <span className="font-mono text-[11px] text-slate-400 text-left">{cell.dayNum}</span>
                    <span className="font-mono text-[9px] text-slate-400">--</span>
                  </div>
                );
              }

              const mm = Number(entry.chuva_total_media_mm ?? 0);
              const raj = Number(entry.vento_rajada_max_kmh ?? 0);
              const toneClass = getRainCellTone(mm, isSelected);

              return (
                <button
                  key={cell.dateIso}
                  type="button"
                  onClick={() => handlePickDay(cell.dateIso)}
                  aria-label={`${formatDateBrFromIso(cell.dateIso)}: chuva média ${mm.toFixed(1)} mm, rajada máxima ${raj.toFixed(0)} km/h`}
                  aria-pressed={isSelected}
                  className={`min-h-[56px] sm:min-h-[62px] rounded-lg border p-1 sm:p-1.5 flex flex-col justify-between text-left transition cursor-pointer ${toneClass}`}
                >
                  <div className="w-full flex items-center justify-between gap-0.5">
                    <span className="font-mono text-xs font-bold tabular-nums leading-none">{cell.dayNum}</span>
                    {isToday && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-[#FF8244] dark:bg-[#0B1324]' : 'bg-emerald-500'
                        }`}
                        title="Hoje (atualizado ao vivo)"
                      />
                    )}
                  </div>

                  <div className="w-full space-y-0.5 overflow-hidden">
                    <div
                      className={`font-mono text-[9.5px] sm:text-[10px] font-semibold tabular-nums tracking-tighter leading-tight whitespace-nowrap ${
                        isSelected
                          ? 'text-white dark:text-[#0B1324]'
                          : mm >= 15
                            ? 'text-[#C2410C] dark:text-[#FF8244]'
                            : mm > 0
                              ? 'text-sky-700 dark:text-sky-300'
                              : 'text-slate-400 dark:text-[#E5E5E5]/50'
                      }`}
                    >
                      {mm >= 0.1 ? mm.toFixed(1) : '0'}
                      <span className="text-[7.5px] font-normal opacity-80 ml-0.5">mm</span>
                    </div>
                    {raj >= 25 && (
                      <div
                        className={`font-mono text-[8.5px] sm:text-[9px] tabular-nums tracking-tighter leading-none whitespace-nowrap ${
                          isSelected
                            ? 'text-white/85 dark:text-[#0B1324]/80'
                            : raj >= 41
                              ? 'text-[#FF8244] font-semibold'
                              : 'text-slate-500 dark:text-[#E5E5E5]/60'
                        }`}
                      >
                        {Math.round(raj)}
                        <span className="text-[7px] font-normal opacity-80 ml-0.5">km/h</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legenda compacta */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-[10.5px] text-slate-500 dark:text-[#E5E5E5]/65">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]" />
              0 mm (seco)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-500/20 border border-sky-400/50" />
              1–14,9 mm
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#FF8244]/25 border border-[#FF8244]/60" />
              15–49,9 mm
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500/25 border border-rose-400/60" />
              ≥ 50 mm
            </span>
          </div>
        </div>

        {/* DETALHE COMPLETO DO DIA SELECIONADO */}
        {selectedDay && (
          <div className="xl:col-span-7 space-y-5 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-5 sm:p-6">
            {/* Cabeçalho do Dia */}
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg sm:text-xl font-semibold text-[#14213D] dark:text-white">
                    {formatWeekdayFullPt(selectedDay.data_iso)} — {selectedDay.data_br || formatDateBrFromIso(selectedDay.data_iso)}
                  </h3>
                  {selectedDay.is_live_today && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Ao vivo hoje
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
                  {selectedDay.horas_registradas ? `${selectedDay.horas_registradas}h monitoradas` : 'Monitoramento contínuo'}
                  {selectedDay.horas_com_chuva !== undefined ? ` · ${selectedDay.horas_com_chuva}h com chuva` : ''}
                  {selectedDay.live_atualizacao ? ` · Sync ${selectedDay.live_atualizacao}` : ''}
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${getRainBadgeTone(
                  Math.max(rainMean, rainMaxSt)
                )}`}
              >
                <CloudRain className="w-3.5 h-3.5" />
                {rainMean <= 0.1 && rainMaxSt <= 0.1 ? 'Sem chuva' : rainPlancon.titulo}
              </span>
            </div>

            {/* 4 KPIs do Dia Selecionado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 1. Chuva Média da Rede */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-slate-500 dark:text-[#E5E5E5]/65">
                  <CloudRain className="w-3.5 h-3.5 text-[#FF8244]" />
                  <span>Acumulado Médio do Dia</span>
                </div>
                <div className="font-mono text-2xl font-bold text-[#14213D] dark:text-white tabular-nums">
                  {rainMean.toFixed(1)} mm
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70">
                  {Number(selectedDay.chuva_pico_hora_mm ?? 0) > 0
                    ? `Pico horário: ${Number(selectedDay.chuva_pico_hora_mm).toFixed(1)} mm às ${selectedDay.chuva_pico_horario || '--'}`
                    : 'Sem pico horário expressivo'}
                </div>
              </div>

              {/* 2. Maior Acumulado por Estação */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-slate-500 dark:text-[#E5E5E5]/65">
                  <MapPin className="w-3.5 h-3.5 text-[#FF8244]" />
                  <span>Maior Estação no Dia</span>
                </div>
                <div className="font-mono text-2xl font-bold text-[#FF8244] tabular-nums">
                  {rainMaxSt.toFixed(1)} mm
                </div>
                <div className="text-[11px] text-slate-600 dark:text-[#E5E5E5]/75 truncate" title={selectedDay.chuva_maior_estacao_nome}>
                  {rainMaxSt > 0 ? selectedDay.chuva_maior_estacao_nome : 'Sem registro de chuva na rede'}
                </div>
              </div>

              {/* 3. Comportamento do Vento */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-slate-500 dark:text-[#E5E5E5]/65">
                  <Compass className="w-3.5 h-3.5 text-[#FF8244]" />
                  <span>Comportamento do Vento</span>
                </div>
                <div className="font-mono text-base sm:text-lg font-bold text-[#14213D] dark:text-white tabular-nums flex flex-wrap items-center gap-2">
                  <span>Predom.: {selectedDay.vento_dir_predominante || '--'}</span>
                  {selectedDay.giro_quadrante_sul && (
                    <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-400/40">
                      Giro Quadrante Sul
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 tabular-nums">
                  Média {Number(selectedDay.vento_vel_media_kmh ?? 0).toFixed(1)} km/h · Sustentado máx{' '}
                  {Number(selectedDay.vento_vel_max_kmh ?? 0).toFixed(1)} km/h
                </div>
              </div>

              {/* 4. Rajada Máxima do Dia */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-slate-500 dark:text-[#E5E5E5]/65">
                  <Wind className="w-3.5 h-3.5 text-[#FF8244]" />
                  <span>Rajada Máxima do Dia</span>
                </div>
                <div className="font-mono text-2xl font-bold text-[#14213D] dark:text-white tabular-nums">
                  {gustMaxDay > 0 ? `${gustMaxDay.toFixed(1)} km/h` : '--'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 leading-snug">
                  {gustMaxDay > 0
                    ? `${selectedDay.vento_rajada_max_estacao || 'Rede Municipal'}${
                        selectedDay.vento_rajada_max_horario ? ` às ${selectedDay.vento_rajada_max_horario}` : ''
                      } · ${windPlancon.gustTitulo} (${windPlancon.riscoLabel})`
                    : 'Sem rajada registrada'}
                </div>
              </div>
            </div>

            {/* Condições Complementares & Sinótica */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[11px] text-slate-600 dark:text-[#E5E5E5]/80">
                {selectedDay.temp_min_c !== undefined && selectedDay.temp_max_c !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-[#FF8244]" />
                    Temp.: {Number(selectedDay.temp_min_c).toFixed(1)}° – {Number(selectedDay.temp_max_c).toFixed(1)}°C
                  </span>
                )}
                {selectedDay.umidade_media_pct !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-[#FF8244]" />
                    Umid. méd.: {Math.round(Number(selectedDay.umidade_media_pct))}%
                  </span>
                )}
                {selectedDay.pressao_min_hpa !== undefined && selectedDay.pressao_max_hpa !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-[#FF8244]" />
                    Pressão: {Number(selectedDay.pressao_min_hpa).toFixed(1)}–{Number(selectedDay.pressao_max_hpa).toFixed(1)} hPa
                  </span>
                )}
              </div>

              {selectedDay.sistema_atuante_dia && (
                <div className="pt-2 border-t border-[#E5E5E5] dark:border-[#233354]">
                  <span className="font-semibold text-[#14213D] dark:text-white">Sistema atuante: </span>
                  <span className="text-slate-700 dark:text-[#E5E5E5]/85">{selectedDay.sistema_atuante_dia}</span>
                </div>
              )}

              {selectedDay.caracteristicas_dia && (
                <p className="text-slate-600 dark:text-[#E5E5E5]/75 leading-relaxed">{selectedDay.caracteristicas_dia}</p>
              )}
            </div>

            {/* Chuva & Rajada por Estação naquele Dia */}
            {selectedStations.length > 0 && (
              <div className="p-4 rounded-xl bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-[#14213D] dark:text-white">
                  <span>Acumulado e Rajada Máxima por Estação ({selectedDay.data_br || formatDateBrFromIso(selectedDay.data_iso)})</span>
                  <span className="text-[10.5px] font-mono text-slate-500 dark:text-[#E5E5E5]/65">
                    {selectedStations.length} estações
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedStations.map((st) => {
                    const pct = st.chuva_mm > 0 ? Math.max(4, Math.min(100, Math.round((st.chuva_mm / maxStationRainInDay) * 100))) : 0;
                    return (
                      <div
                        key={st.code}
                        className="p-2.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium text-[#14213D] dark:text-white truncate" title={st.nome}>
                            {st.nome}
                          </span>
                          <span className="font-mono font-bold text-[#14213D] dark:text-[#FF8244] tabular-nums shrink-0">
                            {st.chuva_mm.toFixed(1)} mm
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full bg-[#FF8244] transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-[#E5E5E5]/65">
                          <span>{st.code}</span>
                          <span>
                            {st.rajada_max_kmh > 0 ? `Rajada máx: ${st.rajada_max_kmh.toFixed(1)} km/h` : 'Pluviômetro'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Evolução Horária do Dia */}
            {selectedDayHourly.length > 0 && (
              <div className="rounded-xl bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowHourlyRows((v) => !v)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-[#14213D] dark:text-white hover:bg-[#F7F8FA] dark:hover:bg-[#0B1324]/60 transition cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#FF8244]" />
                    <span>Evolução Hora a Hora do Dia ({selectedDayHourly.length} registros)</span>
                  </span>
                  {showHourlyRows ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showHourlyRows && (
                  <div className="border-t border-[#E5E5E5] dark:border-[#233354] overflow-x-auto max-h-[340px]">
                    <table className="w-full min-w-[540px] text-left border-collapse text-[11px] font-mono">
                      <thead className="bg-[#F7F8FA] dark:bg-[#0B1324] sticky top-0 text-slate-500 dark:text-[#E5E5E5]/70">
                        <tr className="border-b border-[#E5E5E5] dark:border-[#233354]">
                          <th className="py-2 px-3">Hora</th>
                          <th className="py-2 px-2 text-right">Chuva Méd.</th>
                          <th className="py-2 px-2 text-right">Pico Est.</th>
                          <th className="py-2 px-2 text-right">Vento / Dir</th>
                          <th className="py-2 px-2 text-right">Rajada</th>
                          <th className="py-2 px-3 text-right">Temp / Umid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#233354]">
                        {selectedDayHourly.map((hr) => (
                          <tr key={hr.horario} className="hover:bg-[#F7F8FA] dark:hover:bg-[#0B1324]/50">
                            <td className="py-1.5 px-3 font-semibold text-[#14213D] dark:text-white">{hr.horario}</td>
                            <td className="py-1.5 px-2 text-right tabular-nums">
                              {Number(hr.chuva_mm_hora ?? 0).toFixed(1)} mm
                            </td>
                            <td className="py-1.5 px-2 text-right tabular-nums text-[#FF8244]">
                              {Number(hr.chuva_max_estacao_mm ?? 0).toFixed(1)} mm
                            </td>
                            <td className="py-1.5 px-2 text-right tabular-nums">
                              {hr.vento_direcao_cardeal || '--'} {Number(hr.vento_velocidade_kmh ?? 0).toFixed(0)} km/h
                            </td>
                            <td className="py-1.5 px-2 text-right tabular-nums font-semibold">
                              {Number(hr.vento_rajada_kmh ?? 0).toFixed(0)} km/h
                            </td>
                            <td className="py-1.5 px-3 text-right tabular-nums text-slate-500 dark:text-[#E5E5E5]/70">
                              {hr.temperatura_c != null ? `${Number(hr.temperatura_c).toFixed(1)}°` : '--'} ·{' '}
                              {hr.umidade_pct != null ? `${Math.round(Number(hr.umidade_pct))}%` : '--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
