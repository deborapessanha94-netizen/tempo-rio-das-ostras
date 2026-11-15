import os

path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\src\components\HourlyChart.tsx'

content = '''import React, { useMemo } from 'react';

export type ChartMetric = 'temp' | 'rain' | 'wind' | 'pressure' | 'humidity';

export interface HourlyPoint {
  hour: string;
  dayLabel: string;
  temp: number;
  rainMm: number;
  rainProb: number;
  windKmh: number;
  windDir: string;
  pressureHpa: number;
  humidity: number;
}

interface HourlyChartProps {
  data: HourlyPoint[];
  metric: ChartMetric;
  horizonCount: number;
  showValues: boolean;
}

export const HourlyChart: React.FC<HourlyChartProps> = ({
  data,
  metric,
  horizonCount,
  showValues,
}) => {
  const points = data.slice(0, Math.max(1, horizonCount));

  const { totalRain, maxRainPt, maxProb } = useMemo(() => {
    let tot = 0;
    let maxPt: HourlyPoint | null = points[0] || null;
    let maxP = 0;
    for (const p of points) {
      const r = p.rainMm || 0;
      tot += r;
      if (!maxPt || r > (maxPt.rainMm || 0)) {
        maxPt = p;
      }
      if ((p.rainProb || 0) > maxP) {
        maxP = p.rainProb;
      }
    }
    return { totalRain: tot, maxRainPt: maxPt, maxProb: maxP };
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
  let minVal = Math.min(...values);
  let maxVal = Math.max(...values);

  if (metric === 'rain') {
    minVal = 0;
    maxVal = Math.max(2, Math.ceil(maxVal * 1.25 * 10) / 10);
  } else if (metric === 'temp') {
    minVal = Math.floor(minVal - 2);
    maxVal = Math.ceil(maxVal + 2);
  } else if (minVal === maxVal) {
    minVal -= 1;
    maxVal += 1;
  }

  const chartHeight = metric === 'rain' ? 195 : 180;
  const colWidth = 54;
  const chartWidth = Math.max(points.length * colWidth, 480);
  const paddingBottom = metric === 'rain' ? 46 : 40;
  const paddingTop = 26;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const getY = (val: number) => {
    const ratio = (val - minVal) / Math.max(0.1, maxVal - minVal);
    return chartHeight - paddingBottom - ratio * innerHeight;
  };

  const svgPoints = points.map((p, i) => {
    const x = i * colWidth + colWidth / 2;
    const y = getY(getMetricValue(p));
    return { x, y, p, val: getMetricValue(p) };
  });

  const pathD = svgPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD =
    svgPoints.length > 0
      ? `${pathD} L ${svgPoints[svgPoints.length - 1].x} ${chartHeight - paddingBottom} L ${
          svgPoints[0].x
        } ${chartHeight - paddingBottom} Z`
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

      {/* Gráfico SVG com Rolagem Horizontal Suave */}
      <div
        className="w-full overflow-x-auto pb-2 scrollbar-thin touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div style={{ minWidth: `${chartWidth}px` }} className="relative">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full overflow-visible"
            style={{ height: `${chartHeight}px` }}
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

            {/* Linhas de grade horizontal */}
            <line
              x1="0"
              y1={paddingTop}
              x2={chartWidth}
              y2={paddingTop}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeDasharray="4 4"
            />
            <line
              x1="0"
              y1={chartHeight - paddingBottom}
              x2={chartWidth}
              y2={chartHeight - paddingBottom}
              stroke="currentColor"
              strokeOpacity="0.12"
            />

            {/* Barras de Chuva ou Linha Contínua */}
            {metric === 'rain' ? (
              svgPoints.map((pt, i) => {
                if (pt.val > 0) {
                  const barHeight = Math.max(5, (chartHeight - paddingBottom) - pt.y);
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
                // Hora sem chuva: tick minimalista limpo na linha base (sem rótulo 0.0 mm poluindo a tela)
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
                {/* Área preenchida */}
                <path d={areaD} fill={`url(#gradient-${metric})`} />
                {/* Linha */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={colors.line}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Pontos */}
                {svgPoints.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r="3.5"
                    fill="#ffffff"
                    stroke={colors.line}
                    strokeWidth="2"
                    className="transition-transform hover:scale-125"
                  />
                ))}
              </>
            )}

            {/* Rótulos e Valores */}
            {svgPoints.map((pt, i) => {
              const showDayHeader =
                i === 0 || pt.p.dayLabel !== svgPoints[i - 1].p.dayLabel;

              return (
                <g key={i}>
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

                  {/* Valor numérico no topo (apenas quando > 0 para chuva, evitando poluição de 0.0mm em telas mobile) */}
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
                      ) : (
                        <text
                          x={pt.x}
                          y={pt.y - 8}
                          textAnchor="middle"
                          fill="currentColor"
                          className="text-[10px] font-mono font-bold select-none text-slate-700 dark:text-slate-200"
                        >
                          {Math.round(pt.val)}
                          <tspan className="text-[8px] opacity-75 font-normal">
                            {getMetricUnit()}
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
                    className="text-[10.5px] font-mono font-medium text-slate-500 dark:text-[#E5E5E5]/70 select-none"
                  >
                    {pt.p.hour.slice(0, 5)}
                  </text>

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
                      y={chartHeight - paddingBottom + (metric === 'rain' ? 41 : 30)}
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

      {/* Legenda Explicativa Minimalista para Chuva */}
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
'''

with open(path, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(content)
print('HourlyChart.tsx updated!')
