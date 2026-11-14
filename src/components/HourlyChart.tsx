import React from 'react';

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
    maxVal = Math.max(maxVal, 5);
  } else if (metric === 'temp') {
    minVal = Math.floor(minVal - 2);
    maxVal = Math.ceil(maxVal + 2);
  } else if (minVal === maxVal) {
    minVal -= 1;
    maxVal += 1;
  }

  const chartHeight = 180;
  const colWidth = 56;
  const chartWidth = Math.max(points.length * colWidth, 600);
  const paddingBottom = 40;
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
        return { line: '#FCA311', fill: 'rgba(252, 163, 17, 0.15)', text: '#FCA311' };
      case 'rain':
        return { line: '#3b82f6', fill: 'rgba(59, 130, 246, 0.25)', text: '#3b82f6' };
      case 'wind':
        return { line: '#10b981', fill: 'rgba(16, 185, 129, 0.15)', text: '#10b981' };
      case 'pressure':
        return { line: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6' };
      case 'humidity':
        return { line: '#06b6d4', fill: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4' };
      default:
        return { line: '#FCA311', fill: 'rgba(252, 163, 17, 0.15)', text: '#FCA311' };
    }
  };

  const colors = getMetricColor();

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
      <div style={{ minWidth: `${chartWidth}px` }} className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full overflow-visible"
          style={{ height: `${chartHeight}px` }}
        >
          <defs>
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
              const barHeight = Math.max(2, (chartHeight - paddingBottom) - pt.y);
              return (
                <rect
                  key={i}
                  x={pt.x - 14}
                  y={pt.y}
                  width="28"
                  height={barHeight}
                  rx="3"
                  fill={pt.val > 0 ? '#3b82f6' : 'rgba(148, 163, 184, 0.15)'}
                  className="transition-all hover:opacity-80"
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

                {/* Valor numérico no topo */}
                {showValues && (
                  <text
                    x={pt.x}
                    y={pt.y - 8}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-[10px] font-mono font-bold select-none text-slate-700 dark:text-slate-200"
                  >
                    {metric === 'rain'
                      ? pt.val.toFixed(1)
                      : Math.round(pt.val)}
                    <tspan className="text-[8px] opacity-75 font-normal">
                      {getMetricUnit()}
                    </tspan>
                  </text>
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

                {/* Data */}
                {showDayHeader && (
                  <text
                    x={pt.x}
                    y={chartHeight - paddingBottom + 30}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-[9.5px] font-mono font-semibold text-[#FCA311] select-none"
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
  );
};
