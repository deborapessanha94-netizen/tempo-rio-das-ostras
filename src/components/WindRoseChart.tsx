import React, { useMemo, useState } from 'react';
import type { WindRoseDistribution, WindRoseSector, WindRoseSpeedBin } from '../services/windRose';
import { SPEED_BINS_WIND_ROSE } from '../services/windRose';

interface WindRoseChartProps {
  distribution: WindRoseDistribution;
  binsMeta?: WindRoseSpeedBin[];
  isDark?: boolean;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

function polarToXY(degFromNorth: number, radius: number): [number, number] {
  const rad = ((degFromNorth - 90) * Math.PI) / 180;
  return [radius * Math.cos(rad), radius * Math.sin(rad)];
}

function annularWedgePath(
  centerDeg: number,
  halfWidthDeg: number,
  rInner: number,
  rOuter: number
): string {
  const a1 = centerDeg - halfWidthDeg;
  const a2 = centerDeg + halfWidthDeg;
  const [x1i, y1i] = polarToXY(a1, rInner);
  const [x2i, y2i] = polarToXY(a2, rInner);
  const [x1o, y1o] = polarToXY(a1, rOuter);
  const [x2o, y2o] = polarToXY(a2, rOuter);

  return [
    `M ${x1i.toFixed(2)} ${y1i.toFixed(2)}`,
    `L ${x1o.toFixed(2)} ${y1o.toFixed(2)}`,
    `A ${rOuter.toFixed(2)} ${rOuter.toFixed(2)} 0 0 1 ${x2o.toFixed(2)} ${y2o.toFixed(2)}`,
    `L ${x2i.toFixed(2)} ${y2i.toFixed(2)}`,
    `A ${rInner.toFixed(2)} ${rInner.toFixed(2)} 0 0 0 ${x1i.toFixed(2)} ${y1i.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export const WindRoseChart: React.FC<WindRoseChartProps> = ({
  distribution,
  binsMeta = SPEED_BINS_WIND_ROSE,
  isDark = false,
  title,
  subtitle,
  compact = false,
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const setores = distribution?.setores || [];
  const rInnerBase = 34;
  const rOuterMax = 186;
  const labelRadius = 212;

  const maxSectorPct = useMemo(() => {
    const rawMax = Math.max(10, ...setores.map((s) => s.pct || 0));
    const step = rawMax <= 16 ? 4 : rawMax <= 32 ? 8 : rawMax <= 48 ? 12 : 16;
    return Math.ceil(rawMax / step) * step;
  }, [setores]);

  const rings = useMemo(() => {
    return [0.25, 0.5, 0.75, 1.0].map((frac) => ({
      frac,
      pctLabel: `${Math.round(maxSectorPct * frac)}%`,
      r: rInnerBase + (rOuterMax - rInnerBase) * frac,
    }));
  }, [maxSectorPct]);

  const activeSector: WindRoseSector | null = useMemo(() => {
    if (activeIdx !== null && setores[activeIdx]) return setores[activeIdx];
    if (!setores.length) return null;
    return setores.reduce((best, cur) => (cur.pct > best.pct ? cur : best), setores[0]);
  }, [activeIdx, setores]);

  const ringStroke = isDark ? 'rgba(255,255,255,0.11)' : 'rgba(20,33,61,0.12)';
  const axisStroke = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(20,33,61,0.16)';
  const labelColor = isDark ? '#CBD5E1' : '#334155';
  const cardinalColor = isDark ? '#FFFFFF' : '#14213D';
  const centerFill = isDark ? '#0B1324' : '#F8FAFC';

  const vecDeg = distribution.dir_vetorial_graus;
  const vecR =
    vecDeg !== null && distribution.total_amostras > 0
      ? rInnerBase + Math.max(18, ((distribution.persistencia_pct || 0) / 100) * (rOuterMax - rInnerBase) * 0.88)
      : 0;

  return (
    <div className="space-y-3">
      {(title || subtitle) && (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          {title && (
            <h3 className="text-sm sm:text-base font-display font-semibold text-[#14213D] dark:text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <span className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/70">
              {subtitle}
            </span>
          )}
        </div>
      )}

      <div className={`w-full mx-auto ${compact ? 'max-w-[330px]' : 'max-w-[440px]'}`}>
        <svg
          viewBox="-246 -246 492 492"
          className="w-full h-auto overflow-visible select-none"
          role="img"
          aria-label={`Rosa dos Ventos: direção predominante ${distribution.dir_predominante}`}
        >
          {/* Eixos cardeais e colaterais */}
          {setores.map((sec) => {
            const [xOut, yOut] = polarToXY(sec.angulo_centro, rOuterMax + 4);
            const [xIn, yIn] = polarToXY(sec.angulo_centro, rInnerBase);
            const isMain = sec.idx % 4 === 0;
            return (
              <line
                key={`axis-${sec.idx}`}
                x1={xIn}
                y1={yIn}
                x2={xOut}
                y2={yOut}
                stroke={axisStroke}
                strokeWidth={isMain ? 1.15 : 0.65}
                strokeDasharray={isMain ? undefined : '2 3'}
              />
            );
          })}

          {/* Anéis concêntricos de frequência percentual */}
          {rings.map((ring) => (
            <g key={`ring-${ring.frac}`}>
              <circle
                cx={0}
                cy={0}
                r={ring.r}
                fill="none"
                stroke={ringStroke}
                strokeWidth={ring.frac === 1 ? 1.25 : 0.9}
                strokeDasharray={ring.frac === 1 ? undefined : '3 3'}
              />
              {(() => {
                const [lx, ly] = polarToXY(22.5, ring.r);
                return (
                  <text
                    x={lx + 3}
                    y={ly - 3}
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="600"
                    fill={isDark ? '#94A3B8' : '#64748B'}
                  >
                    {ring.pctLabel}
                  </text>
                );
              })()}
            </g>
          ))}

          {/* Pétalas empilhadas por faixa de velocidade (km/h) */}
          {setores.map((sec) => {
            const isHighlighted = activeIdx === sec.idx;
            let curR = rInnerBase;
            const totalWedgeR =
              rInnerBase + Math.min(1, (sec.pct || 0) / maxSectorPct) * (rOuterMax - rInnerBase);
            const halfW = 9.0;

            return (
              <g
                key={`sec-${sec.idx}`}
                className="cursor-pointer transition-opacity"
                style={{ opacity: activeIdx !== null && !isHighlighted ? 0.48 : 1 }}
                onMouseEnter={() => setActiveIdx(sec.idx)}
                onMouseLeave={() => setActiveIdx(null)}
                onClick={() => setActiveIdx((prev) => (prev === sec.idx ? null : sec.idx))}
              >
                {/* Hit area invisível para facilitar hover/tap mesmo em setores menores */}
                <path
                  d={annularWedgePath(sec.angulo_centro, 10.6, rInnerBase, rOuterMax + 10)}
                  fill="transparent"
                />

                {sec.bins.map((binPct, bIdx) => {
                  if (!binPct || binPct <= 0) return null;
                  const segLen = (binPct / maxSectorPct) * (rOuterMax - rInnerBase);
                  const nextR = Math.min(rOuterMax + 2, curR + segLen);
                  const d = annularWedgePath(sec.angulo_centro, halfW, curR, nextR);
                  const color = binsMeta[bIdx]?.cor_hex || SPEED_BINS_WIND_ROSE[bIdx].cor_hex;
                  curR = nextR;
                  return (
                    <path
                      key={`sec-${sec.idx}-bin-${bIdx}`}
                      d={d}
                      fill={color}
                      fillOpacity={0.92}
                      stroke={isDark ? '#0B1324' : '#FFFFFF'}
                      strokeWidth={0.8}
                    />
                  );
                })}

                {isHighlighted && sec.pct > 0 && (
                  <path
                    d={annularWedgePath(sec.angulo_centro, halfW + 0.8, rInnerBase, totalWedgeR)}
                    fill="none"
                    stroke="#FF8244"
                    strokeWidth={2}
                  />
                )}
              </g>
            );
          })}

          {/* Vetor Resultante (origem média ponderada pela velocidade) */}
          {vecDeg !== null && vecR > rInnerBase + 6 && (
            <g className="pointer-events-none">
              {(() => {
                const [vx0, vy0] = polarToXY(vecDeg, rInnerBase + 2);
                const [vx1, vy1] = polarToXY(vecDeg, vecR);
                const [axL, ayL] = polarToXY(vecDeg - 8, vecR - 11);
                const [axR, ayR] = polarToXY(vecDeg + 8, vecR - 11);
                return (
                  <>
                    <line
                      x1={vx0}
                      y1={vy0}
                      x2={vx1}
                      y2={vy1}
                      stroke={isDark ? '#FFFFFF' : '#14213D'}
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeOpacity={0.85}
                    />
                    <polygon
                      points={`${vx1.toFixed(1)},${vy1.toFixed(1)} ${axL.toFixed(1)},${ayL.toFixed(1)} ${axR.toFixed(1)},${ayR.toFixed(1)}`}
                      fill="#FF8244"
                      stroke={isDark ? '#0B1324' : '#FFFFFF'}
                      strokeWidth={1}
                    />
                  </>
                );
              })()}
            </g>
          )}

          {/* Miolo central: predominância ou setor focado */}
          <circle
            cx={0}
            cy={0}
            r={rInnerBase}
            fill={centerFill}
            stroke={isDark ? '#334155' : '#CBD5E1'}
            strokeWidth={1.6}
          />
          <text
            x={0}
            y={-5}
            textAnchor="middle"
            fontSize="13"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight="800"
            fill="#FF8244"
          >
            {distribution.dir_predominante || 'N/D'}
          </text>
          <text
            x={0}
            y={11}
            textAnchor="middle"
            fontSize="9.5"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="600"
            fill={isDark ? '#94A3B8' : '#475569'}
          >
            {distribution.total_amostras > 0 ? `${distribution.dir_predominante_pct}%` : '0'}
          </text>

          {/* Rótulos dos 16 pontos cardeais/colaterais */}
          {setores.map((sec) => {
            const [lx, ly] = polarToXY(sec.angulo_centro, labelRadius);
            const isMain = sec.idx % 4 === 0;
            const isNorth = sec.idx === 0;
            const isSelected = activeSector?.idx === sec.idx;
            return (
              <text
                key={`lbl-${sec.idx}`}
                x={lx}
                y={ly + 4}
                textAnchor="middle"
                fontSize={isMain ? '14' : '10.5'}
                fontFamily={isMain ? 'Inter, system-ui, sans-serif' : 'JetBrains Mono, monospace'}
                fontWeight={isMain || isSelected ? '800' : '600'}
                fill={
                  isNorth || isSelected
                    ? '#FF8244'
                    : isMain
                      ? cardinalColor
                      : labelColor
                }
                className="cursor-pointer"
                onClick={() => setActiveIdx((prev) => (prev === sec.idx ? null : sec.idx))}
              >
                {sec.cardeal}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Inspetor do setor selecionado/predominante */}
      {activeSector && (
        <div className="rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] px-3.5 py-2.5 text-xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000]">
                {activeSector.cardeal} ({activeSector.angulo_centro}°)
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/70">
                {activeIdx !== null ? 'Setor selecionado' : 'Setor predominante'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-[#14213D] dark:text-white">
              <span>
                Freq.: <strong>{activeSector.pct.toFixed(1)}%</strong> ({activeSector.total_count}×)
              </span>
              <span>
                Média: <strong>{activeSector.vel_media_kmh.toFixed(1)} km/h</strong>
              </span>
              <span>
                Rajada máx: <strong className="text-[#FF8244]">{activeSector.rajada_max_kmh.toFixed(1)} km/h</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E5E5E5]/70 dark:border-[#233354]">
            {binsMeta.map((bm, bIdx) => (
              <span
                key={bm.id}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-600 dark:text-[#E5E5E5]/80"
              >
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: bm.cor_hex }}
                />
                <span>{bm.short_label} km/h:</span>
                <strong className="text-[#14213D] dark:text-white">
                  {(activeSector.bins[bIdx] || 0).toFixed(1)}%
                </strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
