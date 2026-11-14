import React from 'react';
import { RiverHistoryPoint } from '../services/siteData';

interface RiverChartProps {
  readings: RiverHistoryPoint[];
  cotaAtencaoNum: number;
  cotaAlertaNum: number;
  cotaTransbordoNum: number;
}

export const RiverChart: React.FC<RiverChartProps> = ({
  readings,
  cotaAtencaoNum,
  cotaAlertaNum,
  cotaTransbordoNum,
}) => {
  if (!readings || readings.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-400 dark:text-[#E5E5E5]/50">
        Nenhuma leitura telemétrica recente encontrada para o Rio Jundiaí.
      </div>
    );
  }

  const chartHeight = 220;
  const colWidth = Math.max(38, Math.min(60, 900 / Math.max(1, readings.length)));
  const chartWidth = Math.max(readings.length * colWidth, 700);
  const paddingTop = 30;
  const paddingBottom = 42;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const levels = readings.map((r) => r.nivel);
  const minData = Math.min(...levels);
  const maxData = Math.max(...levels);

  const minVal = Math.min(0.5, Math.floor(minData * 10) / 10);
  const maxVal = Math.max(cotaTransbordoNum + 0.25, Math.ceil(maxData * 10) / 10 + 0.1);

  const getY = (lvl: number) => {
    const ratio = (lvl - minVal) / Math.max(0.1, maxVal - minVal);
    return chartHeight - paddingBottom - ratio * innerHeight;
  };

  const pts = readings.map((r, i) => {
    const x = i * colWidth + colWidth / 2;
    const y = getY(r.nivel);
    return { x, y, r };
  });

  const pathD = pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  const areaD =
    pts.length > 0
      ? `${pathD} L ${pts[pts.length - 1].x} ${chartHeight - paddingBottom} L ${pts[0].x} ${
          chartHeight - paddingBottom
        } Z`
      : '';

  const yAtencao = getY(cotaAtencaoNum);
  const yAlerta = getY(cotaAlertaNum);
  const yTransbordo = getY(cotaTransbordoNum);

  return (
    <div className="space-y-3">
      {/* Legenda das Cotas */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span className="text-slate-600 dark:text-[#E5E5E5]/80">Atenção ({cotaAtencaoNum.toFixed(2)}m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FA824C]"></span>
          <span className="text-slate-600 dark:text-[#E5E5E5]/80">Alerta ({cotaAlertaNum.toFixed(2)}m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span className="text-slate-600 dark:text-[#E5E5E5]/80">Transbordo ({cotaTransbordoNum.toFixed(2)}m)</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
        <div style={{ minWidth: `${chartWidth}px` }} className="relative">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full overflow-visible"
            style={{ height: `${chartHeight}px` }}
          >
            <defs>
              <linearGradient id="gradient-river" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Linha Cota de Transbordo */}
            {yTransbordo >= paddingTop && (
              <g>
                <line
                  x1="0"
                  y1={yTransbordo}
                  x2={chartWidth}
                  y2={yTransbordo}
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={chartWidth - 8}
                  y={yTransbordo - 4}
                  textAnchor="end"
                  fill="#f43f5e"
                  className="text-[9.5px] font-mono font-bold select-none"
                >
                  Transbordo: {cotaTransbordoNum.toFixed(2)}m
                </text>
              </g>
            )}

            {/* Linha Cota de Alerta */}
            {yAlerta >= paddingTop && (
              <g>
                <line
                  x1="0"
                  y1={yAlerta}
                  x2={chartWidth}
                  y2={yAlerta}
                  stroke="#FA824C"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={chartWidth - 8}
                  y={yAlerta - 4}
                  textAnchor="end"
                  fill="#FA824C"
                  className="text-[9.5px] font-mono font-bold select-none"
                >
                  Alerta: {cotaAlertaNum.toFixed(2)}m
                </text>
              </g>
            )}

            {/* Linha Cota de Atenção */}
            {yAtencao >= paddingTop && (
              <g>
                <line
                  x1="0"
                  y1={yAtencao}
                  x2={chartWidth}
                  y2={yAtencao}
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={chartWidth - 8}
                  y={yAtencao - 4}
                  textAnchor="end"
                  fill="#fbbf24"
                  className="text-[9.5px] font-mono font-bold select-none"
                >
                  Atenção: {cotaAtencaoNum.toFixed(2)}m
                </text>
              </g>
            )}

            {/* Base */}
            <line
              x1="0"
              y1={chartHeight - paddingBottom}
              x2={chartWidth}
              y2={chartHeight - paddingBottom}
              stroke="currentColor"
              strokeOpacity="0.12"
            />

            {/* Área e Linha do Rio */}
            <path d={areaD} fill="url(#gradient-river)" />
            <path
              d={pathD}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Pontos de Medição */}
            {pts.map((pt, i) => {
              const dt = pt.r.datetime_brt || '';
              const datePart = dt.slice(5, 10); // MM-DD
              const hourPart = dt.slice(11, 16); // HH:MM
              const showDate = i === 0 || dt.slice(0, 10) !== pts[i - 1].r.datetime_brt.slice(0, 10);

              return (
                <g key={i}>
                  {showDate && i > 0 && (
                    <line
                      x1={i * colWidth}
                      y1={paddingTop - 10}
                      x2={i * colWidth}
                      y2={chartHeight - 10}
                      stroke="currentColor"
                      strokeOpacity="0.15"
                      strokeDasharray="2 2"
                    />
                  )}

                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="3.5"
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth="2"
                    className="transition-transform hover:scale-125"
                  />

                  {/* Valor do nível */}
                  <text
                    x={pt.x}
                    y={pt.y - 7}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-[10px] font-mono font-bold select-none text-slate-800 dark:text-slate-100"
                  >
                    {pt.r.nivel.toFixed(2)}m
                  </text>

                  {/* Hora */}
                  <text
                    x={pt.x}
                    y={chartHeight - paddingBottom + 16}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-[10px] font-mono text-slate-500 dark:text-[#E5E5E5]/70 select-none"
                  >
                    {hourPart}
                  </text>

                  {/* Data */}
                  {showDate && (
                    <text
                      x={pt.x}
                      y={chartHeight - paddingBottom + 30}
                      textAnchor="middle"
                      fill="currentColor"
                      className="text-[9.5px] font-mono font-semibold text-[#FCA311] select-none"
                    >
                      {datePart.split('-').reverse().join('/')}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
