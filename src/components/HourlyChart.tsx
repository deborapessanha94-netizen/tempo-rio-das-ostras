import React, { useEffect, useMemo, useRef } from 'react';

export type ChartMetric = 'temp' | 'rain' | 'wind' | 'pressure' | 'humidity';

export interface HourlyPoint {
  hour: string;
  dayLabel: string;
  temp: number;
  apparentTemp?: number;
  rainMm: number;
  rainProb: number;
  windKmh: number;
  windGustKmh?: number;
  windDir: string;
  pressureHpa: number;
  humidity: number;
}

interface HourlyChartProps {
  data: HourlyPoint[];
  metric: ChartMetric;
  horizonCount: number;
  showValues: boolean;
  dayFilter?: string;
}

export const HourlyChart: React.FC<HourlyChartProps> = ({
  data,
  metric,
  horizonCount,
  showValues,
  dayFilter = 'all',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isSingleDay =
    dayFilter !== 'all' ||
    (data.length > 0 &&
      data.length <= 24 &&
      horizonCount <= 24 &&
      data.every((p) => p.dayLabel === data[0].dayLabel));
  const effectiveCount = isSingleDay ? data.length : Math.max(1, horizonCount);
  const points = data.slice(0, Math.max(1, effectiveCount));

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [dayFilter, horizonCount, points.length]);

  const {
    totalRain,
    maxRainPt,
    maxProb,
    minTempInfo,
    maxTempInfo,
    minFeelsInfo,
    maxFeelsInfo,
    maxWindInfo,
    maxGustInfo,
  } = useMemo(() => {
    let tot = 0;
    let maxPt: HourlyPoint | null = points[0] || null;
    let maxP = 0;

    let minTIdx = 0;
    let maxTIdx = 0;
    let minFIdx = 0;
    let maxFIdx = 0;
    let maxWIdx = 0;
    let maxGIdx = 0;

    points.forEach((p, idx) => {
      const r = p.rainMm || 0;
      tot += r;
      if (!maxPt || r > (maxPt.rainMm || 0)) maxPt = p;
      if ((p.rainProb || 0) > maxP) maxP = p.rainProb;

      if (p.temp < points[minTIdx].temp) minTIdx = idx;
      if (p.temp > points[maxTIdx].temp) maxTIdx = idx;

      const fCur = p.apparentTemp ?? p.temp;
      const fMin = points[minFIdx].apparentTemp ?? points[minFIdx].temp;
      const fMax = points[maxFIdx].apparentTemp ?? points[maxFIdx].temp;
      if (fCur < fMin) minFIdx = idx;
      if (fCur > fMax) maxFIdx = idx;

      if (p.windKmh > points[maxWIdx].windKmh) maxWIdx = idx;
      const gCur = p.windGustKmh ?? p.windKmh;
      const gMax = points[maxGIdx].windGustKmh ?? points[maxGIdx].windKmh;
      if (gCur > gMax) maxGIdx = idx;
    });

    const safePt = (idx: number) => points[idx] || null;
    const minTP = safePt(minTIdx);
    const maxTP = safePt(maxTIdx);
    const minFP = safePt(minFIdx);
    const maxFP = safePt(maxFIdx);
    const maxWP = safePt(maxWIdx);
    const maxGP = safePt(maxGIdx);

    return {
      totalRain: tot,
      maxRainPt: maxPt,
      maxProb: maxP,
      minTempInfo: minTP ? { idx: minTIdx, val: minTP.temp, hour: minTP.hour.slice(0, 5) } : null,
      maxTempInfo: maxTP ? { idx: maxTIdx, val: maxTP.temp, hour: maxTP.hour.slice(0, 5) } : null,
      minFeelsInfo: minFP ? { idx: minFIdx, val: minFP.apparentTemp ?? minFP.temp, hour: minFP.hour.slice(0, 5) } : null,
      maxFeelsInfo: maxFP ? { idx: maxFIdx, val: maxFP.apparentTemp ?? maxFP.temp, hour: maxFP.hour.slice(0, 5) } : null,
      maxWindInfo: maxWP ? { idx: maxWIdx, val: maxWP.windKmh, dir: maxWP.windDir, hour: maxWP.hour.slice(0, 5) } : null,
      maxGustInfo: maxGP ? { idx: maxGIdx, val: maxGP.windGustKmh ?? maxGP.windKmh, hour: maxGP.hour.slice(0, 5) } : null,
    };
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-400 dark:text-[#E5E5E5]/50">
        Nenhum dado horário disponível para o filtro selecionado.
      </div>
    );
  }

  const getMetricValue = (p: HourlyPoint): number => {
    switch (metric) {
      case 'temp':
        return p.temp;
      case 'rain':
        return p.rainMm;
      case 'wind':
        return p.windKmh;
      case 'pressure':
        return p.pressureHpa;
      case 'humidity':
        return p.humidity;
      default:
        return p.temp;
    }
  };

  const getSecondaryValue = (p: HourlyPoint): number | null => {
    if (metric === 'temp') return p.apparentTemp ?? p.temp;
    if (metric === 'wind') return Math.max(p.windKmh, p.windGustKmh ?? p.windKmh);
    return null;
  };

  const getMetricUnit = (): string => {
    switch (metric) {
      case 'temp':
        return '°C';
      case 'rain':
        return 'mm';
      case 'wind':
        return 'km/h';
      case 'pressure':
        return 'hPa';
      case 'humidity':
        return '%';
      default:
        return '';
    }
  };

  const values = points.map(getMetricValue);
  const secondaryValues = points
    .map(getSecondaryValue)
    .filter((v): v is number => v !== null);
  const allScaleValues = secondaryValues.length > 0 ? [...values, ...secondaryValues] : values;

  let minVal = Math.min(...allScaleValues);
  let maxVal = Math.max(...allScaleValues);

  if (metric === 'rain') {
    minVal = 0;
    maxVal = Math.max(2, Math.ceil(maxVal * 1.25 * 10) / 10);
  } else if (metric === 'temp') {
    minVal = Math.floor(minVal - 3);
    maxVal = Math.ceil(maxVal + 4);
  } else if (metric === 'wind') {
    minVal = 0;
    maxVal = Math.max(15, Math.ceil(maxVal * 1.18));
  } else if (minVal === maxVal) {
    minVal -= 1;
    maxVal += 1;
  }

  const chartHeight =
    metric === 'wind' ? 236 : metric === 'temp' ? 232 : metric === 'rain' ? 220 : 210;
  const colWidth = isSingleDay ? 42 : 54;
  const chartWidth = Math.max(points.length * colWidth, 480);
  const paddingBottom =
    metric === 'wind' ? 66 : metric === 'temp' ? 58 : metric === 'rain' ? 48 : 42;
  const paddingTop = metric === 'temp' || metric === 'wind' ? 38 : 30;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const getY = (val: number) => {
    const ratio = (val - minVal) / Math.max(0.1, maxVal - minVal);
    return chartHeight - paddingBottom - ratio * innerHeight;
  };

  const svgPoints = points.map((p, i) => {
    const x = i * colWidth + colWidth / 2;
    const primaryVal = getMetricValue(p);
    const secVal = getSecondaryValue(p);
    return {
      x,
      y: getY(primaryVal),
      secY: secVal !== null ? getY(secVal) : null,
      p,
      val: primaryVal,
      secVal,
    };
  });

  const pathD = svgPoints.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  const areaD =
    svgPoints.length > 0
      ? `${pathD} L ${svgPoints[svgPoints.length - 1].x} ${chartHeight - paddingBottom} L ${
          svgPoints[0].x
        } ${chartHeight - paddingBottom} Z`
      : '';

  const secPathD =
    secondaryValues.length > 0
      ? svgPoints.reduce(
          (acc, pt, i) =>
            pt.secY === null
              ? acc
              : i === 0 || !acc
                ? `M ${pt.x} ${pt.secY}`
                : `${acc} L ${pt.x} ${pt.secY}`,
          ''
        )
      : '';

  const getMetricColor = () => {
    switch (metric) {
      case 'temp':
        return { line: '#FF8244', fill: 'rgba(255, 130, 68, 0.15)', text: '#FF8244' };
      case 'rain':
        return { line: '#3b82f6', fill: 'rgba(59, 130, 246, 0.25)', text: '#3b82f6' };
      case 'wind':
        return { line: '#10b981', fill: 'rgba(16, 185, 129, 0.15)', text: '#10b981' };
      case 'pressure':
        return { line: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6' };
      case 'humidity':
        return { line: '#06b6d4', fill: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4' };
      default:
        return { line: '#FF8244', fill: 'rgba(255, 130, 68, 0.15)', text: '#FF8244' };
    }
  };

  const colors = getMetricColor();

  return (
    <div className="w-full space-y-2">
      {/* Resumo do Período para Temperatura (Mínima, Máxima e Sensação Térmica) */}
      {metric === 'temp' && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#F7F8FA] dark:bg-[#0B1324] rounded-lg border border-[#E5E5E5] dark:border-[#233354]">
          <div className="flex flex-wrap items-center gap-2">
            {minTempInfo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono text-xs font-semibold border border-sky-500/20">
                Mínima: <strong className="font-bold">{minTempInfo.val.toFixed(1)}°C</strong> ({minTempInfo.hour})
              </span>
            )}
            {maxTempInfo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FF8244]/15 text-[#FF8244] font-mono text-xs font-semibold border border-[#FF8244]/30">
                Máxima: <strong className="font-bold">{maxTempInfo.val.toFixed(1)}°C</strong> ({maxTempInfo.hour})
              </span>
            )}
            {minFeelsInfo && maxFeelsInfo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-xs font-semibold border border-rose-500/20">
                Sensação Térmica:{' '}
                <strong className="font-bold">
                  {Math.round(minFeelsInfo.val)}° a {Math.round(maxFeelsInfo.val)}°C
                </strong>{' '}
                (pico {maxFeelsInfo.hour})
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/75">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-[#FF8244] inline-block" />
              Temp (°C)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 border-t-2 border-dashed border-rose-500 inline-block" />
              Sensação (°C)
            </span>
          </div>
        </div>
      )}

      {/* Resumo do Período para Vento (Vento Sustentado e Rajadas) */}
      {metric === 'wind' && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#F7F8FA] dark:bg-[#0B1324] rounded-lg border border-[#E5E5E5] dark:border-[#233354]">
          <div className="flex flex-wrap items-center gap-2">
            {maxWindInfo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold border border-emerald-500/20">
                Vento máx: <strong className="font-bold">{maxWindInfo.val.toFixed(0)} km/h</strong> ({maxWindInfo.dir} às {maxWindInfo.hour})
              </span>
            )}
            {maxGustInfo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs font-semibold border border-amber-500/25">
                Rajada máx: <strong className="font-bold">{maxGustInfo.val.toFixed(0)} km/h</strong> (às {maxGustInfo.hour})
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/75">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
              Vento médio
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 border-t-2 border-dashed border-amber-500 inline-block" />
              Rajadas
            </span>
          </div>
        </div>
      )}

      {/* Resumo do Período para Chuva (Mobile & Desktop) */}
      {metric === 'rain' && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#F7F8FA] dark:bg-[#0B1324] rounded-lg border border-[#E5E5E5] dark:border-[#233354]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-xs font-semibold border border-blue-500/20">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Total no período: <strong className="font-bold">{totalRain.toFixed(1)} mm</strong>
            </span>
            {maxRainPt && maxRainPt.rainMm > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-[#14213D] text-slate-700 dark:text-[#E5E5E5] font-mono text-[11px] border border-[#E5E5E5] dark:border-[#233354]">
                Pico: <strong className="text-blue-600 dark:text-blue-400">{maxRainPt.rainMm.toFixed(1)} mm/h</strong> às {maxRainPt.hour.slice(0, 5)}
              </span>
            )}
            {maxProb > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-[#14213D] text-slate-700 dark:text-[#E5E5E5] font-mono text-[11px] border border-[#E5E5E5] dark:border-[#233354]">
                Prob. máxima: <strong className="text-blue-600 dark:text-blue-400">{maxProb}%</strong>
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-[#E5E5E5]/50 font-sans hidden sm:inline">
            Role para os lados para navegar pelos horários →
          </span>
        </div>
      )}

      {/* Indicador de Ciclo Diário Completo ou Rolagem Multi-Dias */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[#FF8244]/10 border border-[#FF8244]/25 text-[#14213D] dark:text-[#FF8244] text-xs font-semibold">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FF8244] animate-pulse shrink-0" />
          {isSingleDay ? (
            <>
              <span className="hidden md:inline">
                Dia completo ({points[0]?.dayLabel}): 00:00 às 23:59 ({points.length}h contínuas)
              </span>
              <span className="md:hidden">
                Dia {points[0]?.dayLabel}: 00:00 às 23:59 — deslize p/ os lados →
              </span>
            </>
          ) : (
            <span>Deslize o gráfico para os lados para ver as {points.length} horas →</span>
          )}
        </span>
        <span className="font-mono text-[10px] bg-[#FF8244] text-[#000000] px-2 py-0.5 rounded font-black uppercase shrink-0">
          {isSingleDay ? '00:00–23:59' : `${horizonCount}h`}
        </span>
      </div>

      {/* Gráfico SVG (Dia completo 00:00–23:59 encaixado em tela ampla e rolável no mobile) */}
      <div
        ref={scrollContainerRef}
        className="w-full overflow-x-auto pb-2 scrollbar-thin touch-pan-x rounded-lg"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div style={{ minWidth: isSingleDay ? '760px' : `${chartWidth}px` }} className="relative">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className={isSingleDay ? 'w-full h-auto min-h-[205px] overflow-visible' : 'w-full overflow-visible'}
            style={isSingleDay ? undefined : { height: `${chartHeight}px` }}
          >
            <defs>
              <linearGradient id="gradient-rain-bar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
              <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.line} stopOpacity="0.35" />
                <stop offset="100%" stopColor={colors.line} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Linha do Topo (Máximo) */}
            <line
              x1="0"
              y1={paddingTop}
              x2={chartWidth}
              y2={paddingTop}
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeDasharray="4 4"
            />
            <text
              x="6"
              y={paddingTop - 5}
              className="text-[10px] font-mono font-bold fill-slate-500 dark:fill-[#E5E5E5]/70"
            >
              Máx: {maxVal.toFixed(metric === 'rain' ? 1 : 0)}{getMetricUnit()}
            </text>

            {/* Linha Central de Referência */}
            <line
              x1="0"
              y1={paddingTop + innerHeight / 2}
              x2={chartWidth}
              y2={paddingTop + innerHeight / 2}
              stroke="currentColor"
              strokeOpacity="0.07"
              strokeDasharray="3 3"
            />
            <text
              x="6"
              y={paddingTop + innerHeight / 2 - 4}
              className="text-[9px] font-mono fill-slate-400 dark:fill-[#E5E5E5]/40"
            >
              {((maxVal + minVal) / 2).toFixed(metric === 'rain' ? 1 : 0)}{getMetricUnit()}
            </text>

            {/* Linha da Base (Mínimo) */}
            <line
              x1="0"
              y1={chartHeight - paddingBottom}
              x2={chartWidth}
              y2={chartHeight - paddingBottom}
              stroke="currentColor"
              strokeOpacity="0.15"
            />
            <text
              x="6"
              y={chartHeight - paddingBottom - 4}
              className="text-[10px] font-mono font-bold fill-slate-500 dark:fill-[#E5E5E5]/70"
            >
              Mín: {minVal.toFixed(metric === 'rain' ? 1 : 0)}{getMetricUnit()}
            </text>

            {/* Barras de Chuva ou Linhas */}
            {metric === 'rain' ? (
              svgPoints.map((pt, i) => {
                if (pt.val > 0) {
                  const barHeight = Math.max(5, chartHeight - paddingBottom - pt.y);
                  return (
                    <rect
                      key={i}
                      x={pt.x - 13}
                      y={pt.y}
                      width="26"
                      height={barHeight}
                      rx="4"
                      fill="url(#gradient-rain-bar)"
                      className="transition-all hover:opacity-90"
                    />
                  );
                }
                return (
                  <line
                    key={i}
                    x1={pt.x - 5}
                    y1={chartHeight - paddingBottom}
                    x2={pt.x + 5}
                    y2={chartHeight - paddingBottom}
                    stroke="currentColor"
                    strokeOpacity="0.25"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                );
              })
            ) : (
              <>
                {/* Área preenchida da curva principal */}
                <path d={areaD} fill={`url(#gradient-${metric})`} />
                {/* Curva principal */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={colors.line}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Curva secundária tracejada: Sensação Térmica (temp) ou Rajadas (wind) */}
                {secPathD && (
                  <path
                    d={secPathD}
                    fill="none"
                    stroke={metric === 'temp' ? '#F43F5E' : '#F59E0B'}
                    strokeWidth="2"
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.9}
                  />
                )}
                {/* Pontos secundários (Sensação Térmica / Rajadas) */}
                {secPathD &&
                  svgPoints.map((pt, i) =>
                    pt.secY !== null ? (
                      <circle
                        key={`sec-${i}`}
                        cx={pt.x}
                        cy={pt.secY}
                        r="2.4"
                        fill={metric === 'temp' ? '#F43F5E' : '#F59E0B'}
                      />
                    ) : null
                  )}
                {/* Pontos principais (Temperatura / Vento / Pressão / Umidade) */}
                {svgPoints.map((pt, i) => {
                  const isMinTemp = metric === 'temp' && minTempInfo?.idx === i;
                  const isMaxTemp = metric === 'temp' && maxTempInfo?.idx === i;
                  return (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r={isMinTemp || isMaxTemp ? '4.5' : '3.5'}
                      fill={isMinTemp ? '#38BDF8' : isMaxTemp ? '#FF8244' : '#ffffff'}
                      stroke={isMinTemp ? '#ffffff' : colors.line}
                      strokeWidth="2"
                      className="transition-transform hover:scale-125"
                    />
                  );
                })}
              </>
            )}

            {/* Rótulos e Valores sem sobreposição */}
            {svgPoints.map((pt, i) => {
              const showDayHeader = i === 0 || pt.p.dayLabel !== svgPoints[i - 1].p.dayLabel;
              const isMinTemp = metric === 'temp' && minTempInfo?.idx === i;
              const isMaxTemp = metric === 'temp' && maxTempInfo?.idx === i;
              const isMaxGust = metric === 'wind' && maxGustInfo?.idx === i;

              const tooltipText =
                metric === 'temp' && pt.secVal !== null
                  ? `${pt.p.hour.slice(0, 5)} (${pt.p.dayLabel}) — Temp: ${pt.val.toFixed(1)}°C · Sensação: ${pt.secVal.toFixed(1)}°C`
                  : metric === 'wind' && pt.secVal !== null
                    ? `${pt.p.hour.slice(0, 5)} (${pt.p.dayLabel}) — Vento: ${pt.val.toFixed(0)} km/h ${pt.p.windDir} · Rajadas: ${pt.secVal.toFixed(0)} km/h`
                    : `${pt.p.hour.slice(0, 5)} (${pt.p.dayLabel}) — ${pt.val.toFixed(metric === 'rain' ? 1 : 0)} ${getMetricUnit()}`;

              return (
                <g key={i}>
                  <title>{tooltipText}</title>

                  {/* Linha vertical divisora de dia */}
                  {showDayHeader && i > 0 && (
                    <line
                      x1={i * colWidth}
                      y1={paddingTop - 10}
                      x2={i * colWidth}
                      y2={chartHeight - 10}
                      stroke="currentColor"
                      strokeOpacity="0.18"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Tag destacada apenas no ponto único de MÍN / MÁX (Temperatura) */}
                  {isMaxTemp && (
                    <text
                      x={pt.x}
                      y={showValues ? pt.y - 20 : pt.y - 10}
                      textAnchor="middle"
                      fill="#FF8244"
                      className="text-[8px] font-mono font-black tracking-wide select-none"
                    >
                      MÁX
                    </text>
                  )}
                  {isMinTemp && !isMaxTemp && (
                    <text
                      x={pt.x}
                      y={showValues ? pt.y - 20 : pt.y - 10}
                      textAnchor="middle"
                      fill="#38BDF8"
                      className="text-[8px] font-mono font-black tracking-wide select-none"
                    >
                      MÍN
                    </text>
                  )}

                  {/* Valores numéricos principais */}
                  {showValues && (
                    <>
                      {metric === 'rain' ? (
                        pt.val > 0 ? (
                          <text
                            x={pt.x}
                            y={Math.min(pt.y - 7, chartHeight - paddingBottom - 10)}
                            textAnchor="middle"
                            fill="#2563EB"
                            className="text-[10px] font-mono font-bold select-none dark:text-[#60A5FA]"
                          >
                            {pt.val.toFixed(1)}
                            <tspan className="text-[8px] opacity-75 font-normal">
                              {getMetricUnit()}
                            </tspan>
                          </text>
                        ) : null
                      ) : metric === 'wind' ? (
                        /* No Vento: Rajadas em âmbar ficam acima da curva superior (zero colisão com vento médio) */
                        pt.secY !== null && pt.secVal !== null ? (
                          <text
                            x={pt.x}
                            y={pt.secY - 8}
                            textAnchor="middle"
                            fill="#F59E0B"
                            className={`${isMaxGust ? 'text-[10.5px]' : 'text-[9.5px]'} font-mono font-bold select-none`}
                          >
                            {Math.round(pt.secVal)}
                          </text>
                        ) : null
                      ) : (
                        <text
                          x={pt.x}
                          y={pt.y - 8}
                          textAnchor="middle"
                          fill="currentColor"
                          className={`${isSingleDay && metric === 'pressure' ? 'text-[8.5px]' : 'text-[10px]'} font-mono font-bold select-none text-slate-700 dark:text-slate-200`}
                        >
                          {Math.round(pt.val)}
                          <tspan className="text-[8px] opacity-75 font-normal">
                            {metric === 'temp' ? '°' : getMetricUnit()}
                          </tspan>
                        </text>
                      )}
                    </>
                  )}

                  {/* Hora */}
                  <text
                    x={pt.x}
                    y={chartHeight - paddingBottom + 16}
                    textAnchor="middle"
                    fill="currentColor"
                    className={`${isSingleDay ? 'text-[9.5px]' : 'text-[10.5px]'} font-mono font-medium text-slate-500 dark:text-[#E5E5E5]/70 select-none`}
                  >
                    {pt.p.hour.slice(0, 5)}
                  </text>

                  {/* Sub-linha alinhada abaixo das horas para Sensação Térmica (Temperatura) */}
                  {metric === 'temp' && showValues && pt.secVal !== null && (
                    <text
                      x={pt.x}
                      y={chartHeight - paddingBottom + 29}
                      textAnchor="middle"
                      fill="#F43F5E"
                      className="text-[9px] font-mono font-semibold opacity-95 select-none"
                    >
                      {Math.round(pt.secVal)}°
                    </text>
                  )}

                  {/* Sub-linha alinhada abaixo das horas para Vento Médio + Direção (Vento) */}
                  {metric === 'wind' && showValues && (
                    <>
                      <text
                        x={pt.x}
                        y={chartHeight - paddingBottom + 29}
                        textAnchor="middle"
                        fill="#10B981"
                        className="text-[9.5px] font-mono font-bold select-none"
                      >
                        {Math.round(pt.val)}
                      </text>
                      <text
                        x={pt.x}
                        y={chartHeight - paddingBottom + 41}
                        textAnchor="middle"
                        fill="currentColor"
                        className="text-[8px] font-mono text-slate-400 dark:text-[#E5E5E5]/55 select-none"
                      >
                        {pt.p.windDir}
                      </text>
                    </>
                  )}

                  {/* Probabilidade de Chuva (%) */}
                  {metric === 'rain' && pt.p.rainProb > 0 && (
                    <text
                      x={pt.x}
                      y={chartHeight - paddingBottom + 28}
                      textAnchor="middle"
                      fill="#3B82F6"
                      className="text-[9px] font-mono font-semibold opacity-90 select-none"
                    >
                      {pt.p.rainProb}%
                    </text>
                  )}

                  {/* Data */}
                  {showDayHeader && (
                    <text
                      x={pt.x}
                      y={
                        chartHeight -
                        paddingBottom +
                        (metric === 'wind'
                          ? showValues
                            ? 55
                            : 32
                          : metric === 'temp'
                            ? showValues
                              ? 44
                              : 31
                            : metric === 'rain'
                              ? 41
                              : 30)
                      }
                      textAnchor="middle"
                      fill="currentColor"
                      className="text-[9.5px] font-mono font-semibold text-[#FF8244] select-none"
                    >
                      {pt.p.dayLabel}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legenda Explicativa Minimalista */}
      {metric === 'temp' && (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-1 pt-2 border-t border-[#E5E5E5]/60 dark:border-[#233354]/60 text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/70">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-[#FF8244] inline-block rounded-full" />
            Temperatura (°C · topo do ponto)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 border-t-2 border-dashed border-rose-500 inline-block" />
            <span className="text-rose-500 font-bold">Sensação Térmica</span> (°C · linha rosa abaixo das horas)
          </span>
          <span className="flex items-center gap-2">
            <span className="text-sky-400 font-bold">● MÍN</span>
            <span className="text-[#FF8244] font-bold">● MÁX</span>
          </span>
        </div>
      )}

      {metric === 'wind' && (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-1 pt-2 border-t border-[#E5E5E5]/60 dark:border-[#233354]/60 text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/70">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 border-t-2 border-dashed border-amber-500 inline-block" />
            <span className="text-amber-500 font-bold">Rajadas</span> (km/h · linha superior)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-emerald-500 inline-block rounded-full" />
            <span className="text-emerald-500 font-bold">Vento médio</span> (km/h · abaixo das horas)
          </span>
          <span className="flex items-center gap-1.5 text-slate-400 dark:text-[#E5E5E5]/55">
            Direção cardeal por hora abaixo do vento
          </span>
        </div>
      )}

      {metric === 'rain' && (
        <div className="flex flex-wrap items-center justify-center gap-5 mt-2 pt-2 border-t border-[#E5E5E5]/60 dark:border-[#233354]/60 text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/70">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 rounded-sm bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] inline-block" />
            Volume previsto (mm/h)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-[#3B82F6] font-bold">85%</span>
            Probabilidade de chuva
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-400 dark:bg-slate-600 inline-block rounded-full" />
            Sem chuva (0 mm)
          </span>
        </div>
      )}
    </div>
  );
};
