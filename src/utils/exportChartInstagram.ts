import type { ChartMetric, HourlyPoint } from '../components/HourlyChart';

export type InstagramFormat = 'story' | 'post';

export interface ExportChartOptions {
  points: HourlyPoint[];
  metric: ChartMetric;
  periodLabel: string;
  format: InstagramFormat;
  darkTheme: boolean;
  showValues?: boolean;
  siteBase?: string;
}

interface PlotPt {
  x: number;
  y: number;
  secY: number | null;
  val: number;
  secVal: number | null;
  p: HourlyPoint;
  idx: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function getMetricMeta(metric: ChartMetric) {
  switch (metric) {
    case 'temp':
      return {
        title: 'Temperatura & Sensação',
        unit: '°C',
        shortUnit: '°',
        line: '#FF8244',
        fillTop: 'rgba(255, 130, 68, 0.38)',
        fillBot: 'rgba(255, 130, 68, 0.03)',
        secColor: '#F43F5E',
        secLabel: 'Sensação Térmica',
        primLabel: 'Temperatura (°C)',
        subRowLabel: 'Sensação',
      };
    case 'wind':
      return {
        title: 'Vento & Rajadas',
        unit: ' km/h',
        shortUnit: ' km/h',
        line: '#10B981',
        fillTop: 'rgba(16, 185, 129, 0.34)',
        fillBot: 'rgba(16, 185, 129, 0.03)',
        secColor: '#F59E0B',
        secLabel: 'Rajadas (km/h)',
        primLabel: 'Vento Médio (km/h)',
        subRowLabel: 'Vento',
      };
    case 'rain':
      return {
        title: 'Previsão de Chuva',
        unit: ' mm',
        shortUnit: ' mm',
        line: '#3B82F6',
        fillTop: 'rgba(59, 130, 246, 0.40)',
        fillBot: 'rgba(59, 130, 246, 0.04)',
        secColor: '#60A5FA',
        secLabel: '',
        primLabel: 'Chuva (mm/h)',
        subRowLabel: 'Chance',
      };
    case 'pressure':
      return {
        title: 'Pressão Atmosférica',
        unit: ' hPa',
        shortUnit: ' hPa',
        line: '#8B5CF6',
        fillTop: 'rgba(139, 92, 246, 0.36)',
        fillBot: 'rgba(139, 92, 246, 0.03)',
        secColor: '',
        secLabel: '',
        primLabel: 'Pressão (hPa)',
        subRowLabel: '',
      };
    case 'humidity':
    default:
      return {
        title: 'Umidade do Ar',
        unit: '%',
        shortUnit: '%',
        line: '#06B6D4',
        fillTop: 'rgba(6, 182, 212, 0.36)',
        fillBot: 'rgba(6, 182, 212, 0.03)',
        secColor: '',
        secLabel: '',
        primLabel: 'Umidade (%)',
        subRowLabel: '',
      };
  }
}

function computeNiceScale(
  rawMin: number,
  rawMax: number,
  metric: ChartMetric
): { yMin: number; yMax: number; ticks: number[] } {
  const zeroBased = metric === 'rain' || metric === 'wind';
  let minV = zeroBased ? 0 : rawMin;
  let maxV = rawMax;

  if (metric === 'rain') {
    maxV = Math.max(2, rawMax * 1.24);
  } else if (metric === 'wind') {
    maxV = Math.max(18, rawMax * 1.20);
  } else if (metric === 'humidity') {
    minV = Math.max(0, Math.floor((rawMin - 6) / 10) * 10);
    maxV = Math.min(100, Math.ceil((rawMax + 8) / 10) * 10);
    if (maxV - minV < 20) {
      minV = Math.max(0, minV - 10);
      maxV = Math.min(100, maxV + 10);
    }
  } else if (metric === 'pressure') {
    const pad = Math.max(2, (rawMax - rawMin) * 0.25);
    minV = Math.floor(rawMin - pad);
    maxV = Math.ceil(rawMax + pad + 1);
  } else {
    const span = Math.max(4, rawMax - minV);
    minV = Math.floor(rawMin - Math.max(2, span * 0.16));
    maxV = Math.ceil(rawMax + Math.max(3, span * 0.24));
  }

  const targetIntervals = 5;
  const roughStep = (maxV - minV) / targetIntervals;
  const candidates =
    metric === 'rain'
      ? [0.5, 1, 2, 3, 5, 10, 15, 20, 25, 50]
      : [1, 2, 3, 4, 5, 8, 10, 15, 20, 25, 30, 50];
  let step = candidates[candidates.length - 1];
  for (const c of candidates) {
    if (c >= roughStep * 0.88) {
      step = c;
      break;
    }
  }

  const yMin = zeroBased ? 0 : Math.floor(minV / step) * step;
  let yMax = Math.ceil(maxV / step) * step;
  if (yMax <= yMin) yMax = yMin + step * 4;

  const ticks: number[] = [];
  for (let v = yMin; v <= yMax + step * 0.001; v += step) {
    ticks.push(Math.round(v * 10) / 10);
  }
  if (ticks.length > 7) {
    const altStep = step * 2;
    const altTicks: number[] = [];
    const altYMax = Math.ceil(yMax / altStep) * altStep;
    for (let v = yMin; v <= altYMax + altStep * 0.001; v += altStep) {
      altTicks.push(Math.round(v * 10) / 10);
    }
    return { yMin, yMax: altYMax, ticks: altTicks };
  }

  return { yMin, yMax, ticks };
}

function traceMonotoneSpline(
  ctx: CanvasRenderingContext2D,
  pts: Array<{ x: number; y: number }>,
  moveToFirst = true
) {
  const n = pts.length;
  if (n === 0) return;
  if (moveToFirst) ctx.moveTo(pts[0].x, pts[0].y);
  if (n === 1) return;
  if (n === 2) {
    ctx.lineTo(pts[1].x, pts[1].y);
    return;
  }

  const d: number[] = [];
  const dx: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const h = Math.max(0.001, pts[i + 1].x - pts[i].x);
    dx.push(h);
    d.push((pts[i + 1].y - pts[i].y) / h);
  }

  const m: number[] = new Array(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) {
      m[i] = 0;
    } else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }

  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    const cp1x = pts[i].x + h;
    const cp1y = pts[i].y + h * m[i];
    const cp2x = pts[i + 1].x - h;
    const cp2y = pts[i + 1].y - h * m[i + 1];
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pts[i + 1].x, pts[i + 1].y);
  }
}

function rectsOverlap(a: Rect, b: Rect, gapX = 18, gapY = 12): boolean {
  return !(
    a.x + a.w + gapX <= b.x ||
    b.x + b.w + gapX <= a.x ||
    a.y + a.h + gapY <= b.y ||
    b.y + b.h + gapY <= a.y
  );
}

function pickCleanHourTickIndices(
  points: HourlyPoint[],
  getX: (i: number) => number,
  minPxSpacing: number
): number[] {
  const n = points.length;
  if (n <= 1) return n === 1 ? [0] : [];

  const getHourNum = (h: string) => {
    const m = /^(\d{1,2})/.exec(h.trim());
    return m ? Number(m[1]) : -1;
  };

  const stepHoursCandidates =
    n <= 28 ? [3, 4, 6, 12] : n <= 56 ? [6, 12] : n <= 84 ? [6, 12, 24] : [12, 24];

  for (const stepH of stepHoursCandidates) {
    const chosen: number[] = [];
    for (let i = 0; i < n; i++) {
      const hr = getHourNum(points[i].hour);
      if (hr >= 0) {
        const match = stepH === 24 ? hr === 12 : hr % stepH === 0;
        if (match) {
          if (chosen.length === 0 || getX(i) - getX(chosen[chosen.length - 1]) >= minPxSpacing) {
            chosen.push(i);
          }
        }
      }
    }
    if (chosen.length >= 4) {
      return chosen;
    }
  }

  const chosen: number[] = [0];
  for (let i = 1; i < n; i++) {
    if (getX(i) - getX(chosen[chosen.length - 1]) >= minPxSpacing) {
      chosen.push(i);
    }
  }
  return chosen;
}

export async function exportChartToInstagramPng(opts: ExportChartOptions): Promise<string> {
  const { points, metric, periodLabel, format, darkTheme, siteBase = '.' } = opts;
  if (!points || points.length === 0) {
    throw new Error('Sem dados horários para exportar.');
  }

  // Ultra-alta resolução 2x Retina nativa para Instagram
  // Stories (9:16): 2160 x 3840 | Post Feed (4:5): 2160 x 2700
  const W = 2160;
  const H = format === 'story' ? 3840 : 2700;
  const isStory = format === 'story';

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Contexto Canvas 2D indisponível.');

  if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
    try {
      await (document as any).fonts.ready;
    } catch {}
  }

  const logoSrc = darkTheme
    ? `${siteBase}/img/logo-transparent.png`
    : `${siteBase}/img/logo-dark-text.png`;
  const logoImg = await loadImageSafe(logoSrc);

  const bg = darkTheme ? '#05080F' : '#F4F6FA';
  const cardBg = darkTheme ? '#0D1526' : '#FFFFFF';
  const innerBg = darkTheme ? '#070E1C' : '#F8FAFC';
  const borderCol = darkTheme ? '#233354' : '#CBD5E1';
  const textMain = darkTheme ? '#FFFFFF' : '#14213D';
  const textMuted = darkTheme ? '#94A3B8' : '#475569';
  const textSoft = darkTheme ? '#64748B' : '#64748B';
  const meta = getMetricMeta(metric);

  // Fundo principal limpo
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.85, H * 0.10, 60, W * 0.85, H * 0.10, W * 0.72);
  glow.addColorStop(0, darkTheme ? 'rgba(255, 130, 68, 0.12)' : 'rgba(255, 130, 68, 0.08)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const padX = 84;
  const topSafe = isStory ? 186 : 76;
  const botSafe = isStory ? 184 : 74;
  const contentW = W - padX * 2;

  // ============================================================================
  // CABEÇALHO ULTRA ENXUTO — SÓ O ESSENCIAL PARA DAR DESTAQUE AO GRÁFICO
  // ============================================================================
  let cursorY = topSafe;

  // Linha superior: Logo + @tempoemriodasostras
  const logoTargetH = isStory ? 132 : 106;
  if (logoImg) {
    const ratio = logoImg.width / Math.max(1, logoImg.height);
    const targetW = logoTargetH * ratio;
    ctx.drawImage(logoImg, padX, cursorY, targetW, logoTargetH);
  } else {
    ctx.fillStyle = textMain;
    ctx.font = '800 54px Inter, system-ui, sans-serif';
    ctx.fillText('TEMPO EM RIO DAS OSTRAS', padX, cursorY + 66);
  }

  const tagText = '@tempoemriodasostras';
  ctx.font = '700 38px "JetBrains Mono", monospace';
  const tagMetrics = ctx.measureText(tagText);
  const tagPadX = 38;
  const tagW = tagMetrics.width + tagPadX * 2;
  const tagH = 72;
  const tagX = W - padX - tagW;
  const tagY = cursorY + Math.round((logoTargetH - tagH) / 2);
  roundRectPath(ctx, tagX, tagY, tagW, tagH, 36);
  ctx.fillStyle = 'rgba(255, 130, 68, 0.14)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#FF8244';
  ctx.stroke();
  ctx.fillStyle = '#FF8244';
  ctx.textBaseline = 'middle';
  ctx.fillText(tagText, tagX + tagPadX, tagY + tagH / 2 + 1);
  ctx.textBaseline = 'alphabetic';

  cursorY += isStory ? 216 : 182;

  // Título + Pílula de Período na MESMA linha limpa
  const cleanPeriod = periodLabel.replace(' · 00:00–23:59', '');
  ctx.font = '700 38px "JetBrains Mono", monospace';
  const perText = cleanPeriod.toUpperCase();
  const perW = ctx.measureText(perText).width + 56;
  const perH = 68;
  const perX = W - padX - perW;
  const perY = cursorY - 54;

  ctx.fillStyle = textMain;
  ctx.font = `800 ${isStory ? 78 : 68}px Inter, system-ui, sans-serif`;
  ctx.fillText(meta.title, padX, cursorY, Math.max(400, perX - padX - 28));

  ctx.font = '700 38px "JetBrains Mono", monospace';
  roundRectPath(ctx, perX, perY, perW, perH, 16);
  ctx.fillStyle = darkTheme ? '#14213D' : '#E2E8F0';
  ctx.fill();
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#FF8244';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(perText, perX + perW / 2, perY + perH / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  cursorY += isStory ? 54 : 44;

  // Pré-cálculo dos extremos para destacar na curva
  let minTIdx = 0;
  let maxTIdx = 0;
  let maxWIdx = 0;
  let maxGIdx = 0;
  let totalRain = 0;
  let maxRainIdx = 0;
  let minGenIdx = 0;
  let maxGenIdx = 0;

  const getMainVal = (p: HourlyPoint) => {
    if (metric === 'temp') return p.temp;
    if (metric === 'wind') return p.windKmh;
    if (metric === 'rain') return p.rainMm;
    if (metric === 'pressure') return p.pressureHpa;
    return p.humidity;
  };

  points.forEach((p, idx) => {
    if (p.temp < points[minTIdx].temp) minTIdx = idx;
    if (p.temp > points[maxTIdx].temp) maxTIdx = idx;
    if (p.windKmh > points[maxWIdx].windKmh) maxWIdx = idx;
    const gCur = p.windGustKmh ?? p.windKmh;
    const gMax = points[maxGIdx].windGustKmh ?? points[maxGIdx].windKmh;
    if (gCur > gMax) maxGIdx = idx;
    totalRain += p.rainMm || 0;
    if ((p.rainMm || 0) > (points[maxRainIdx].rainMm || 0)) maxRainIdx = idx;
    const gv = getMainVal(p);
    if (gv < getMainVal(points[minGenIdx])) minGenIdx = idx;
    if (gv > getMainVal(points[maxGenIdx])) maxGenIdx = idx;
  });

  // ============================================================================
  // CARD PRINCIPAL DO GRÁFICO (~80% DA IMAGEM DEDICADA AO GRÁFICO!)
  // ============================================================================
  const footerH = 98;
  const chartCardH = H - botSafe - footerH - cursorY;
  roundRectPath(ctx, padX, cursorY, contentW, chartCardH, 34);
  ctx.fillStyle = cardBg;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = borderCol;
  ctx.stroke();

  const innerPadX = 52;
  const legendY = cursorY + 62;

  // Legenda minimalista no topo esquerdo do gráfico
  let legX = padX + innerPadX;
  ctx.strokeStyle = meta.line;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(legX, legendY);
  ctx.lineTo(legX + 50, legendY);
  ctx.stroke();
  legX += 66;
  ctx.fillStyle = textMain;
  ctx.font = '700 38px "JetBrains Mono", monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(meta.primLabel, legX, legendY + 1);
  legX += ctx.measureText(meta.primLabel).width + 52;

  if (meta.secLabel) {
    ctx.strokeStyle = meta.secColor;
    ctx.lineWidth = 7;
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.moveTo(legX, legendY);
    ctx.lineTo(legX + 50, legendY);
    ctx.stroke();
    ctx.setLineDash([]);
    legX += 66;
    ctx.fillStyle = textMuted;
    ctx.font = '600 36px "JetBrains Mono", monospace';
    ctx.fillText(meta.secLabel, legX, legendY + 1);
  }
  ctx.textBaseline = 'alphabetic';

  // Dias (para badges no topo em horizontes multi-dias)
  type DaySeg = { label: string; start: number; end: number };
  const daySegments: DaySeg[] = [];
  points.forEach((p, idx) => {
    const last = daySegments[daySegments.length - 1];
    if (!last || last.label !== p.dayLabel) {
      daySegments.push({ label: p.dayLabel, start: idx, end: idx });
    } else {
      last.end = idx;
    }
  });
  const isMultiDay = daySegments.length > 1;
  const dayHeaderH = isMultiDay ? 86 : 16;

  // Área de plotagem ampla e arejada
  const yAxisW = metric === 'pressure' || metric === 'rain' ? 202 : 182;
  const plotFrameX = padX + innerPadX + yAxisW;
  const plotFrameY = legendY + 48;
  const plotFrameW = contentW - innerPadX * 2 - yAxisW;

  const hasSubRow = Boolean(meta.subRowLabel);
  const axisBottomH = hasSubRow ? 142 : 90;
  const plotFrameH = chartCardH - (plotFrameY - cursorY) - axisBottomH - 20;

  roundRectPath(ctx, plotFrameX, plotFrameY, plotFrameW, plotFrameH, 24);
  ctx.fillStyle = innerBg;
  ctx.fill();
  ctx.strokeStyle = darkTheme ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const plotSideMargin = points.length <= 28 ? 64 : 48;
  const dataLeftX = plotFrameX + plotSideMargin;
  const dataRightX = plotFrameX + plotFrameW - plotSideMargin;
  const dataW = Math.max(100, dataRightX - dataLeftX);

  const dataTopY = plotFrameY + dayHeaderH + 104;
  const dataBotY = plotFrameY + plotFrameH - 56;
  const dataH = Math.max(150, dataBotY - dataTopY);

  const getPxX = (i: number) =>
    points.length === 1
      ? dataLeftX + dataW / 2
      : dataLeftX + (i / (points.length - 1)) * dataW;

  if (isMultiDay) {
    daySegments.forEach((seg, sIdx) => {
      const segLeft =
        sIdx === 0 ? plotFrameX : (getPxX(seg.start - 1) + getPxX(seg.start)) / 2;
      const segRight =
        sIdx === daySegments.length - 1
          ? plotFrameX + plotFrameW
          : (getPxX(seg.end) + getPxX(seg.end + 1)) / 2;
      const segW = segRight - segLeft;

      if (sIdx % 2 === 1) {
        ctx.save();
        roundRectPath(ctx, plotFrameX, plotFrameY, plotFrameW, plotFrameH, 24);
        ctx.clip();
        ctx.fillStyle = darkTheme ? 'rgba(255,255,255,0.022)' : 'rgba(15,23,42,0.022)';
        ctx.fillRect(segLeft, plotFrameY, segW, plotFrameH);
        ctx.restore();
      }

      if (sIdx > 0) {
        ctx.strokeStyle = darkTheme ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.14)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(segLeft, plotFrameY + 12);
        ctx.lineTo(segLeft, plotFrameY + plotFrameH - 8);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const centerSegX = segLeft + segW / 2;
      if (segW >= 95) {
        ctx.fillStyle = darkTheme ? 'rgba(20, 33, 61, 0.88)' : 'rgba(226, 232, 240, 0.92)';
        const segFontPx = segW < 235 ? 30 : 34;
        ctx.font = `700 ${segFontPx}px "JetBrains Mono", monospace`;
        const dTxt = seg.label;
        const dTxtW = Math.min(segW - 18, ctx.measureText(dTxt).width + 36);
        roundRectPath(ctx, centerSegX - dTxtW / 2, plotFrameY + 14, dTxtW, 56, 14);
        ctx.fill();
        ctx.fillStyle = '#FF8244';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dTxt, centerSegX, plotFrameY + 43, dTxtW - 16);
      }
    });
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  const getSecVal = (p: HourlyPoint): number | null => {
    if (metric === 'temp') return p.apparentTemp ?? p.temp;
    if (metric === 'wind') return Math.max(p.windKmh, p.windGustKmh ?? p.windKmh);
    return null;
  };
  const primVals = points.map(getMainVal);
  const secVals = points.map(getSecVal).filter((v): v is number => v !== null);
  const scaleAll = secVals.length ? [...primVals, ...secVals] : primVals;
  const { yMin, yMax, ticks } = computeNiceScale(
    Math.min(...scaleAll),
    Math.max(...scaleAll),
    metric
  );

  const getPxY = (v: number) => {
    const r = (v - yMin) / Math.max(0.05, yMax - yMin);
    return dataBotY - r * dataH;
  };

  // Linhas horizontais de grade e escala Y
  ticks.forEach((tickVal, ti) => {
    const gy = getPxY(tickVal);
    if (gy < plotFrameY + dayHeaderH - 4 || gy > dataBotY + 8) return;

    ctx.strokeStyle = darkTheme
      ? ti === 0
        ? 'rgba(255,255,255,0.16)'
        : 'rgba(255,255,255,0.08)'
      : ti === 0
        ? 'rgba(15,23,42,0.16)'
        : 'rgba(15,23,42,0.08)';
    ctx.lineWidth = ti === 0 ? 2.5 : 2;
    ctx.setLineDash(ti === 0 ? [] : [8, 10]);
    ctx.beginPath();
    ctx.moveTo(plotFrameX + 10, gy);
    ctx.lineTo(plotFrameX + plotFrameW - 10, gy);
    ctx.stroke();
    ctx.setLineDash([]);

    const tickLabel =
      metric === 'rain'
        ? Number.isInteger(tickVal)
          ? `${tickVal} mm`
          : `${tickVal.toFixed(1)}`
        : metric === 'temp'
          ? `${Math.round(tickVal)}°`
          : metric === 'wind'
            ? `${Math.round(tickVal)}`
            : metric === 'humidity'
              ? `${Math.round(tickVal)}%`
              : `${Math.round(tickVal)}`;

    ctx.fillStyle = textMuted;
    ctx.font = '700 44px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(tickLabel, plotFrameX - 22, gy);
  });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  if (metric === 'wind' || metric === 'pressure') {
    ctx.fillStyle = textSoft;
    ctx.font = '700 32px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(metric === 'wind' ? 'km/h' : 'hPa', plotFrameX - 22, plotFrameY + 42);
    ctx.textAlign = 'left';
  }

  const plotPts: PlotPt[] = points.map((p, idx) => {
    const val = getMainVal(p);
    const secVal = getSecVal(p);
    return {
      x: getPxX(idx),
      y: getPxY(val),
      secY: secVal !== null ? getPxY(secVal) : null,
      val,
      secVal,
      p,
      idx,
    };
  });

  const showDailyAxisMode = daySegments.length >= 4;
  const dailySummaryIndices: number[] = [];
  if (showDailyAxisMode) {
    daySegments.forEach((seg) => {
      let bestIdx = Math.floor((seg.start + seg.end) / 2);
      if (metric === 'wind') {
        for (let i = seg.start; i <= seg.end; i++) {
          const gi = getSecVal(points[i]) ?? getMainVal(points[i]);
          const gb = getSecVal(points[bestIdx]) ?? getMainVal(points[bestIdx]);
          if (gi > gb) bestIdx = i;
        }
      } else {
        for (let i = seg.start; i <= seg.end; i++) {
          if (getMainVal(points[i]) > getMainVal(points[bestIdx])) bestIdx = i;
        }
      }
      dailySummaryIndices.push(bestIdx);
    });
  }

  const tickIndices = showDailyAxisMode
    ? dailySummaryIndices
    : pickCleanHourTickIndices(points, getPxX, 195);
  const tickSet = new Set(tickIndices);

  if (!showDailyAxisMode) {
    tickIndices.forEach((ti) => {
      const tx = plotPts[ti].x;
      ctx.strokeStyle = darkTheme ? 'rgba(255,255,255,0.045)' : 'rgba(15,23,42,0.045)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx, plotFrameY + dayHeaderH);
      ctx.lineTo(tx, dataBotY);
      ctx.stroke();
    });
  }

  const placedBoxes: Rect[] = [];

  const overlapsCurve = (rect: Rect): boolean => {
    if (metric === 'rain') return false;
    for (let i = 0; i < plotPts.length; i++) {
      const pt = plotPts[i];
      if (pt.x >= rect.x - 14 && pt.x <= rect.x + rect.w + 14) {
        if (pt.y >= rect.y - 10 && pt.y <= rect.y + rect.h + 10) return true;
        if (pt.secY !== null && pt.secY >= rect.y - 10 && pt.secY <= rect.y + rect.h + 10) {
          return true;
        }
      }
    }
    return false;
  };

  const canPlace = (rect: Rect, checkCurve = true, gapX = 28, gapY = 18): boolean => {
    if (
      rect.x < plotFrameX + 12 ||
      rect.x + rect.w > plotFrameX + plotFrameW - 12 ||
      rect.y < plotFrameY + dayHeaderH - 4 ||
      rect.y + rect.h > plotFrameY + plotFrameH - 8
    ) {
      return false;
    }
    if (checkCurve && overlapsCurve(rect)) return false;
    for (const b of placedBoxes) {
      if (rectsOverlap(rect, b, gapX, gapY)) return false;
    }
    return true;
  };

  const drawCalloutPill = (
    cx: number,
    anchorY: number,
    text: string,
    accent: string,
    preferBelow = false
  ): boolean => {
    ctx.font = '800 40px "JetBrains Mono", monospace';
    const tw = ctx.measureText(text).width;
    const pw = tw + 52;
    const ph = 68;

    const minLeft = plotFrameX + 14;
    const maxLeft = plotFrameX + plotFrameW - 14 - pw;
    const baseClampedX = Math.max(minLeft, Math.min(maxLeft, cx - pw / 2));

    // topY offsets relativos ao ponto âncora (ph = 68 -> acima = -(ph + 26) = -94, abaixo = +26)
    const topYOffsets = preferBelow ? [26, -94, 62, -128] : [-94, 26, -128, 62];
    const xNudges = [0, -56, 56];

    const placeAt = (cand: Rect) => {
      placedBoxes.push(cand);

      const stemTargetX = Math.max(cand.x + 14, Math.min(cand.x + cand.w - 14, cx));
      const stemStartY = cand.y + ph / 2 < anchorY ? cand.y + ph : cand.y;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cx, anchorY);
      ctx.lineTo(stemTargetX, stemStartY);
      ctx.stroke();

      roundRectPath(ctx, cand.x, cand.y, cand.w, cand.h, 20);
      ctx.fillStyle = darkTheme ? '#0D1526' : '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = accent;
      ctx.stroke();

      ctx.fillStyle = accent;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, cand.x + cand.w / 2, cand.y + cand.h / 2 + 1);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    };

    for (const checkCurve of [true, false]) {
      for (const offY of topYOffsets) {
        for (const dx of xNudges) {
          const candX = Math.max(minLeft, Math.min(maxLeft, baseClampedX + dx));
          const cand: Rect = { x: candX, y: anchorY + offY, w: pw, h: ph };
          if (canPlace(cand, checkCurve, 28, 18)) {
            placeAt(cand);
            return true;
          }
        }
      }
    }
    return false;
  };

  if (metric === 'rain') {
    const slotW = dataW / Math.max(1, points.length);
    const barW = Math.max(12, Math.min(48, slotW * 0.62));
    plotPts.forEach((pt) => {
      if (pt.val > 0) {
        const bh = Math.max(12, dataBotY - pt.y);
        const grad = ctx.createLinearGradient(0, pt.y, 0, dataBotY);
        grad.addColorStop(0, '#60A5FA');
        grad.addColorStop(1, '#2563EB');
        roundRectPath(ctx, pt.x - barW / 2, pt.y, barW, bh, 9);
        ctx.fillStyle = grad;
        ctx.fill();
      } else {
        ctx.strokeStyle = darkTheme ? 'rgba(148,163,184,0.28)' : 'rgba(100,116,139,0.28)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(pt.x - Math.min(10, barW * 0.4), dataBotY);
        ctx.lineTo(pt.x + Math.min(10, barW * 0.4), dataBotY);
        ctx.stroke();
      }
    });

    if (totalRain <= 0.01) {
      ctx.fillStyle = textSoft;
      ctx.font = '700 46px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Sem precipitação prevista neste período',
        plotFrameX + plotFrameW / 2,
        dataTopY + dataH * 0.48,
        plotFrameW - 80
      );
      ctx.textAlign = 'left';
    } else {
      const rainySorted = plotPts
        .filter((pt) => pt.val >= 0.1)
        .slice()
        .sort((a, b) => b.val - a.val);

      const hitsOtherRainBar = (rect: Rect, selfPt: PlotPt): boolean => {
        for (const other of plotPts) {
          if (other === selfPt || other.val <= 0) continue;
          const bLeft = other.x - barW / 2 - 4;
          const bRight = other.x + barW / 2 + 4;
          const bTop = other.y - 4;
          const overlapsX = rect.x < bRight && rect.x + rect.w > bLeft;
          const overlapsY = rect.y + rect.h > bTop;
          if (overlapsX && overlapsY) return true;
        }
        return false;
      };

      rainySorted.forEach((pt, rank) => {
        const txt = `${pt.val.toFixed(1)} mm`;
        if (rank === 0) {
          drawCalloutPill(pt.x, pt.y, txt, '#60A5FA', false);
        } else {
          ctx.font = '700 36px "JetBrains Mono", monospace';
          const tw = ctx.measureText(pt.val.toFixed(1)).width;
          const pw = tw + 26;
          const ph = 48;
          const cand: Rect = {
            x: Math.max(plotFrameX + 14, Math.min(plotFrameX + plotFrameW - 14 - pw, pt.x - pw / 2)),
            y: Math.max(plotFrameY + dayHeaderH + 4, pt.y - 58),
            w: pw,
            h: ph,
          };
          if (!hitsOtherRainBar(cand, pt) && canPlace(cand, false, 36, 20)) {
            placedBoxes.push(cand);
            roundRectPath(ctx, cand.x, cand.y, cand.w, cand.h, 12);
            ctx.fillStyle = darkTheme ? 'rgba(7, 14, 28, 0.88)' : 'rgba(248, 250, 252, 0.94)';
            ctx.fill();
            ctx.fillStyle = darkTheme ? '#93C5FD' : '#1D4ED8';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pt.val.toFixed(1), cand.x + cand.w / 2, cand.y + cand.h / 2 + 1);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
          }
        }
      });
    }
  } else {
    const areaGrad = ctx.createLinearGradient(0, dataTopY, 0, dataBotY);
    areaGrad.addColorStop(0, meta.fillTop);
    areaGrad.addColorStop(1, meta.fillBot);
    ctx.beginPath();
    traceMonotoneSpline(ctx, plotPts, true);
    ctx.lineTo(plotPts[plotPts.length - 1].x, dataBotY);
    ctx.lineTo(plotPts[0].x, dataBotY);
    ctx.closePath();
    ctx.fillStyle = areaGrad;
    ctx.fill();

    ctx.strokeStyle = meta.line;
    ctx.lineWidth = 9;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    traceMonotoneSpline(ctx, plotPts, true);
    ctx.stroke();

    const secCurvePts = plotPts
      .filter((pt): pt is PlotPt & { secY: number } => pt.secY !== null)
      .map((pt) => ({ x: pt.x, y: pt.secY }));
    if (secCurvePts.length > 1) {
      ctx.strokeStyle = meta.secColor;
      ctx.lineWidth = 6.5;
      ctx.setLineDash([16, 12]);
      ctx.beginPath();
      traceMonotoneSpline(ctx, secCurvePts, true);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const keyIndices = new Set<number>();
    if (metric === 'temp') {
      keyIndices.add(minTIdx);
      keyIndices.add(maxTIdx);
    } else if (metric === 'wind') {
      keyIndices.add(maxWIdx);
      keyIndices.add(maxGIdx);
    } else {
      keyIndices.add(minGenIdx);
      keyIndices.add(maxGenIdx);
    }

    plotPts.forEach((pt, i) => {
      if (!tickSet.has(i) && !keyIndices.has(i)) return;
      const isKey = keyIndices.has(i);

      if (pt.secY !== null && (tickSet.has(i) || (metric === 'wind' && i === maxGIdx))) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.secY, i === maxGIdx && metric === 'wind' ? 13 : 8, 0, Math.PI * 2);
        ctx.fillStyle = meta.secColor;
        ctx.fill();
        if (i === maxGIdx && metric === 'wind') {
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#FFFFFF';
          ctx.stroke();
        }
      }

      const isMinHighlight =
        (metric === 'temp' && i === minTIdx) || (metric !== 'temp' && metric !== 'wind' && i === minGenIdx);
      const isMaxHighlight =
        (metric === 'temp' && i === maxTIdx) ||
        (metric === 'wind' && i === maxWIdx) ||
        (metric !== 'temp' && metric !== 'wind' && i === maxGenIdx);

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isKey ? 14 : 8.5, 0, Math.PI * 2);
      ctx.fillStyle = isMinHighlight
        ? '#38BDF8'
        : isMaxHighlight
          ? metric === 'wind'
            ? '#10B981'
            : '#FF8244'
          : cardBg;
      ctx.fill();
      ctx.lineWidth = isKey ? 4.5 : 4;
      ctx.strokeStyle = isMinHighlight || (isMaxHighlight && metric === 'wind') ? '#FFFFFF' : meta.line;
      ctx.stroke();
    });

    if (metric === 'temp') {
      drawCalloutPill(
        plotPts[maxTIdx].x,
        plotPts[maxTIdx].y,
        `MÁX ${plotPts[maxTIdx].val.toFixed(1)}°`,
        '#FF8244',
        false
      );
      drawCalloutPill(
        plotPts[minTIdx].x,
        plotPts[minTIdx].y,
        `MÍN ${plotPts[minTIdx].val.toFixed(1)}°`,
        '#38BDF8',
        true
      );
    } else if (metric === 'wind') {
      const gustPt = plotPts[maxGIdx];
      drawCalloutPill(
        gustPt.x,
        gustPt.secY ?? gustPt.y,
        `RAJADA ${Math.round(gustPt.secVal ?? gustPt.val)} km/h`,
        '#F59E0B',
        false
      );
      drawCalloutPill(
        plotPts[maxWIdx].x,
        plotPts[maxWIdx].y,
        `VENTO ${Math.round(plotPts[maxWIdx].val)} km/h`,
        '#10B981',
        true
      );
    } else {
      const uSuffix = metric === 'humidity' ? '%' : '';
      drawCalloutPill(
        plotPts[maxGenIdx].x,
        plotPts[maxGenIdx].y,
        `MÁX ${Math.round(plotPts[maxGenIdx].val)}${uSuffix}`,
        '#FF8244',
        false
      );
      drawCalloutPill(
        plotPts[minGenIdx].x,
        plotPts[minGenIdx].y,
        `MÍN ${Math.round(plotPts[minGenIdx].val)}${uSuffix}`,
        meta.line,
        true
      );
    }

    const tooCloseToKey = (px: number) => {
      if (showDailyAxisMode) return false;
      for (const k of keyIndices) {
        if (Math.abs(px - plotPts[k].x) < 205) return true;
      }
      return false;
    };

    tickIndices.forEach((i) => {
      const pt = plotPts[i];
      if (keyIndices.has(i) || tooCloseToKey(pt.x)) return;

      const labelVal =
        metric === 'wind' && pt.secVal !== null
          ? `${Math.round(pt.secVal)}`
          : metric === 'temp'
            ? `${Math.round(pt.val)}°`
            : metric === 'humidity'
              ? `${Math.round(pt.val)}%`
              : `${Math.round(pt.val)}`;
      const anchorY = metric === 'wind' && pt.secY !== null ? pt.secY : pt.y;
      const col = metric === 'wind' ? '#F59E0B' : textMain;

      ctx.font = '700 38px "JetBrains Mono", monospace';
      const tw = ctx.measureText(labelVal).width;
      const pw = tw + 30;
      const ph = 52;
      const clampedX = Math.max(
        plotFrameX + 14,
        Math.min(plotFrameX + plotFrameW - 14 - pw, pt.x - pw / 2)
      );

      for (const yOff of [-74, 24, -106, 56]) {
        const cand: Rect = { x: clampedX, y: anchorY + yOff, w: pw, h: ph };
        if (canPlace(cand, true, 36, 20)) {
          placedBoxes.push(cand);
          roundRectPath(ctx, cand.x, cand.y, cand.w, cand.h, 13);
          ctx.fillStyle = darkTheme ? 'rgba(7, 14, 28, 0.86)' : 'rgba(248, 250, 252, 0.92)';
          ctx.fill();

          ctx.fillStyle = col;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelVal, cand.x + cand.w / 2, cand.y + cand.h / 2 + 1);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          break;
        }
      }
    });
  }

  // Eixo X limpo e espaçado
  const axisHourY = plotFrameY + plotFrameH + 56;
  const axisSubY = axisHourY + 54;

  if (hasSubRow) {
    ctx.fillStyle = textSoft;
    ctx.font = '700 30px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(
      showDailyAxisMode && metric === 'temp' ? 'Sens. máx' : meta.subRowLabel,
      plotFrameX - 22,
      axisSubY,
      yAxisW + innerPadX - 42
    );
    ctx.textAlign = 'left';
  }

  ctx.textAlign = 'center';
  if (showDailyAxisMode) {
    const daySlotW = Math.max(110, plotFrameW / Math.max(1, daySegments.length) - 28);
    const drawFittedDayText = (txt: string, x: number, y: number, basePx: number) => {
      let px = basePx;
      ctx.font = `700 ${px}px "JetBrains Mono", monospace`;
      while (px > 24 && ctx.measureText(txt).width > daySlotW) {
        px -= 2;
        ctx.font = `700 ${px}px "JetBrains Mono", monospace`;
      }
      ctx.fillText(txt, x, y, daySlotW);
    };

    daySegments.forEach((seg) => {
      const cx = (getPxX(seg.start) + getPxX(seg.end)) / 2;
      let dayMax = -Infinity;
      let dayMin = Infinity;
      let daySecMax = -Infinity;
      let dayRain = 0;
      let dayProb = 0;
      let dayMaxWind = -Infinity;
      let dayMaxWindDir = '';
      for (let i = seg.start; i <= seg.end; i++) {
        const p = points[i];
        const mv = getMainVal(p);
        if (mv > dayMax) {
          dayMax = mv;
          dayMaxWindDir = p.windDir;
        }
        if (mv < dayMin) dayMin = mv;
        const sv = getSecVal(p);
        if (sv !== null && sv > daySecMax) daySecMax = sv;
        dayRain += p.rainMm || 0;
        if ((p.rainProb || 0) > dayProb) dayProb = p.rainProb;
        if (p.windKmh > dayMaxWind) dayMaxWind = p.windKmh;
      }

      ctx.fillStyle = textMain;
      if (metric === 'temp') {
        drawFittedDayText(`${Math.round(dayMin)}° / ${Math.round(dayMax)}°`, cx, axisHourY, 36);
        ctx.fillStyle = '#F43F5E';
        drawFittedDayText(`${Math.round(daySecMax)}°`, cx, axisSubY, 33);
      } else if (metric === 'wind') {
        drawFittedDayText(`${Math.round(daySecMax)} km/h`, cx, axisHourY, 36);
        ctx.fillStyle = '#10B981';
        drawFittedDayText(`${Math.round(dayMaxWind)} ${dayMaxWindDir}`, cx, axisSubY, 33);
      } else if (metric === 'rain') {
        drawFittedDayText(`${dayRain.toFixed(1)} mm`, cx, axisHourY, 36);
        ctx.fillStyle = dayProb > 0 ? '#60A5FA' : textSoft;
        drawFittedDayText(`${dayProb}%`, cx, axisSubY, 33);
      } else {
        const dailyUnit = metric === 'humidity' ? '%' : '';
        drawFittedDayText(`${Math.round(dayMin)}–${Math.round(dayMax)}${dailyUnit}`, cx, axisHourY, 36);
      }
    });
  } else {
    tickIndices.forEach((i) => {
      const pt = plotPts[i];
      const hourNumStr = `${pt.p.hour.slice(0, 2)}h`;

      ctx.fillStyle = textMain;
      ctx.font = '700 42px "JetBrains Mono", monospace';
      ctx.fillText(hourNumStr, pt.x, axisHourY);

      if (metric === 'temp' && pt.secVal !== null) {
        ctx.fillStyle = '#F43F5E';
        ctx.font = '700 36px "JetBrains Mono", monospace';
        ctx.fillText(`${Math.round(pt.secVal)}°`, pt.x, axisSubY);
      } else if (metric === 'wind') {
        ctx.fillStyle = '#10B981';
        ctx.font = '700 36px "JetBrains Mono", monospace';
        ctx.fillText(`${Math.round(pt.val)} ${pt.p.windDir}`, pt.x, axisSubY);
      } else if (metric === 'rain') {
        ctx.fillStyle = pt.p.rainProb > 0 ? '#60A5FA' : textSoft;
        ctx.font = '700 35px "JetBrains Mono", monospace';
        ctx.fillText(`${pt.p.rainProb}%`, pt.x, axisSubY);
      }
    });
  }
  ctx.textAlign = 'left';

  // Assinatura discreta de rodapé em 1 linha
  const footY = H - botSafe - 18;
  ctx.fillStyle = textMuted;
  ctx.font = '600 36px "JetBrains Mono", monospace';
  ctx.fillText('Rio das Ostras · RJ  ·  @tempoemriodasostras', padX, footY);

  ctx.textAlign = 'right';
  const nowStr = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
  ctx.fillStyle = textSoft;
  ctx.font = '500 36px "JetBrains Mono", monospace';
  ctx.fillText(nowStr, W - padX, footY);
  ctx.textAlign = 'left';

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Falha ao gerar PNG.'))),
      'image/png',
      1.0
    );
  });

  const safeSlug = periodLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const filename = `grafico-${metric}-${format === 'story' ? 'stories-9x16' : 'post-4x5'}-${safeSlug || 'ro'}.png`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);

  return filename;
}
