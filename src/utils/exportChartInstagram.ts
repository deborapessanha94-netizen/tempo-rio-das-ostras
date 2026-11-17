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
        title: 'Temperatura & Sensação Térmica',
        subtitle: 'Mínima, Máxima e Sensação Térmica horária (°C)',
        unit: '°C',
        shortUnit: '°',
        line: '#FF8244',
        fillTop: 'rgba(255, 130, 68, 0.34)',
        fillBot: 'rgba(255, 130, 68, 0.02)',
        secColor: '#F43F5E',
        secLabel: 'Sensação Térmica (°C)',
        primLabel: 'Temperatura (°C)',
        subRowLabel: 'Sensação (°C)',
      };
    case 'wind':
      return {
        title: 'Vento Médio & Rajadas',
        subtitle: 'Velocidade sustentada, rajadas máximas e direção (km/h)',
        unit: ' km/h',
        shortUnit: ' km/h',
        line: '#10B981',
        fillTop: 'rgba(16, 185, 129, 0.30)',
        fillBot: 'rgba(16, 185, 129, 0.02)',
        secColor: '#F59E0B',
        secLabel: 'Rajadas Máximas (km/h)',
        primLabel: 'Vento Médio (km/h)',
        subRowLabel: 'Vento & Dir.',
      };
    case 'rain':
      return {
        title: 'Previsão de Chuva Horária',
        subtitle: 'Volume horário estimado (mm/h) e probabilidade (%)',
        unit: ' mm',
        shortUnit: ' mm',
        line: '#3B82F6',
        fillTop: 'rgba(59, 130, 246, 0.38)',
        fillBot: 'rgba(59, 130, 246, 0.04)',
        secColor: '#60A5FA',
        secLabel: '',
        primLabel: 'Chuva (mm/h)',
        subRowLabel: 'Chance (%)',
      };
    case 'pressure':
      return {
        title: 'Pressão Atmosférica',
        subtitle: 'Tendência horária ao nível da superfície (hPa)',
        unit: ' hPa',
        shortUnit: ' hPa',
        line: '#8B5CF6',
        fillTop: 'rgba(139, 92, 246, 0.32)',
        fillBot: 'rgba(139, 92, 246, 0.02)',
        secColor: '',
        secLabel: '',
        primLabel: 'Pressão (hPa)',
        subRowLabel: '',
      };
    case 'humidity':
      return {
        title: 'Umidade Relativa do Ar',
        subtitle: 'Oscilação horária da umidade atmosférica (%)',
        unit: '%',
        shortUnit: '%',
        line: '#06B6D4',
        fillTop: 'rgba(6, 182, 212, 0.32)',
        fillBot: 'rgba(6, 182, 212, 0.02)',
        secColor: '',
        secLabel: '',
        primLabel: 'Umidade (%)',
        subRowLabel: '',
      };
  }
}

/**
 * Calcula escala limpa com degraus inteiros/decimais legíveis e folga superior para callouts.
 */
function computeNiceScale(
  rawMin: number,
  rawMax: number,
  metric: ChartMetric
): { yMin: number; yMax: number; ticks: number[] } {
  const zeroBased = metric === 'rain' || metric === 'wind';
  let minV = zeroBased ? 0 : rawMin;
  let maxV = rawMax;

  if (metric === 'rain') {
    maxV = Math.max(2, rawMax * 1.25);
  } else if (metric === 'wind') {
    maxV = Math.max(18, rawMax * 1.22);
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
    // temp
    const span = Math.max(4, rawMax - rawMin);
    minV = Math.floor(rawMin - Math.max(2, span * 0.18));
    maxV = Math.ceil(rawMax + Math.max(3, span * 0.26));
  }

  const targetIntervals = 4;
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
  // Garante no máximo 6 linhas de grade para visual arejado
  if (ticks.length > 6) {
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

/**
 * Traça uma curva cúbica monótona (Fritsch-Carlson) passando por todos os pontos sem overshooting.
 */
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

function rectsOverlap(a: Rect, b: Rect, gapX = 16, gapY = 10): boolean {
  return !(
    a.x + a.w + gapX <= b.x ||
    b.x + b.w + gapX <= a.x ||
    a.y + a.h + gapY <= b.y ||
    b.y + b.h + gapY <= a.y
  );
}

/**
 * Seleciona os índices limpos de hora no eixo X garantindo distância horizontal mínima generosa.
 */
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

  // Para horizontes muito longos (> 84h, ex. 5-7 dias), prioriza meio-dia (12h) de cada dia
  // ou passo de 12h quando couber com folga.
  const stepHoursCandidates =
    n <= 28 ? [3, 4, 6, 12] : n <= 56 ? [6, 12] : n <= 84 ? [6, 12, 24] : [12, 24];

  for (const stepH of stepHoursCandidates) {
    const chosen: number[] = [];
    for (let i = 0; i < n; i++) {
      const hr = getHourNum(points[i].hour);
      if (hr >= 0) {
        const match =
          stepH === 24
            ? hr === 12
            : hr % stepH === 0;
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

  // Fallback uniforme caso horários sejam irregulares
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

  // Paleta alinhada ao portal
  const bg = darkTheme ? '#05080F' : '#F4F6FA';
  const cardBg = darkTheme ? '#0D1526' : '#FFFFFF';
  const innerBg = darkTheme ? '#070E1C' : '#F8FAFC';
  const borderCol = darkTheme ? '#233354' : '#CBD5E1';
  const textMain = darkTheme ? '#FFFFFF' : '#14213D';
  const textMuted = darkTheme ? '#94A3B8' : '#475569';
  const textSoft = darkTheme ? '#64748B' : '#64748B';
  const meta = getMetricMeta(metric);

  // Fundo principal com brilho atmosférico discreto
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.82, H * 0.12, 60, W * 0.82, H * 0.12, W * 0.72);
  glow.addColorStop(0, darkTheme ? 'rgba(255, 130, 68, 0.14)' : 'rgba(255, 130, 68, 0.10)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const padX = 110;
  const topSafe = isStory ? 200 : 96;
  const botSafe = isStory ? 210 : 90;
  const contentW = W - padX * 2;

  // Cabeçalho Institucional
  let cursorY = topSafe;
  if (logoImg) {
    const targetH = isStory ? 126 : 102;
    const ratio = logoImg.width / Math.max(1, logoImg.height);
    const targetW = targetH * ratio;
    ctx.drawImage(logoImg, padX, cursorY, targetW, targetH);
  } else {
    ctx.fillStyle = textMain;
    ctx.font = '800 52px Inter, system-ui, sans-serif';
    ctx.fillText('TEMPO EM RIO DAS OSTRAS', padX, cursorY + 58);
  }

  // Badge @tempoemriodasostras + Local à direita
  const tagText = '@tempoemriodasostras';
  ctx.font = '700 30px "JetBrains Mono", monospace';
  const tagMetrics = ctx.measureText(tagText);
  const tagPadX = 32;
  const tagW = tagMetrics.width + tagPadX * 2;
  const tagH = 62;
  const tagX = W - padX - tagW;
  const tagY = cursorY + 6;
  roundRectPath(ctx, tagX, tagY, tagW, tagH, 31);
  ctx.fillStyle = 'rgba(255, 130, 68, 0.16)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#FF8244';
  ctx.stroke();
  ctx.fillStyle = '#FF8244';
  ctx.textBaseline = 'middle';
  ctx.fillText(tagText, tagX + tagPadX, tagY + tagH / 2 + 2);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = textMuted;
  ctx.font = '600 26px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('RIO DAS OSTRAS · RJ (22.52°S 41.94°W)', W - padX, tagY + tagH + 42);
  ctx.textAlign = 'left';

  cursorY += isStory ? 185 : 148;

  // Pílula de Período Selecionado + Título Principal
  const pillLbl = `PREVISÃO HORÁRIA · ${periodLabel.toUpperCase()}`;
  ctx.font = '700 27px "JetBrains Mono", monospace';
  const pillW = Math.min(contentW, ctx.measureText(pillLbl).width + 56);
  roundRectPath(ctx, padX, cursorY, pillW, 54, 14);
  ctx.fillStyle = darkTheme ? '#14213D' : '#E2E8F0';
  ctx.fill();
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#FF8244';
  ctx.textBaseline = 'middle';
  ctx.fillText(pillLbl, padX + 28, cursorY + 28);

  cursorY += isStory ? 124 : 108;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = textMain;
  ctx.font = `800 ${isStory ? 72 : 60}px Inter, system-ui, sans-serif`;
  ctx.fillText(meta.title, padX, cursorY);

  cursorY += isStory ? 52 : 44;
  ctx.fillStyle = textMuted;
  ctx.font = `500 ${isStory ? 33 : 29}px Inter, system-ui, sans-serif`;
  ctx.fillText(meta.subtitle, padX, cursorY);

  cursorY += isStory ? 60 : 44;

  // Cálculo dos KPIs do período
  let minTIdx = 0;
  let maxTIdx = 0;
  let minFIdx = 0;
  let maxFIdx = 0;
  let maxWIdx = 0;
  let maxGIdx = 0;
  let totalRain = 0;
  let maxRainIdx = 0;
  let maxProb = 0;
  let minGenIdx = 0;
  let maxGenIdx = 0;
  let genSum = 0;

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

    const fCur = p.apparentTemp ?? p.temp;
    const fMin = points[minFIdx].apparentTemp ?? points[minFIdx].temp;
    const fMax = points[maxFIdx].apparentTemp ?? points[maxFIdx].temp;
    if (fCur < fMin) minFIdx = idx;
    if (fCur > fMax) maxFIdx = idx;

    if (p.windKmh > points[maxWIdx].windKmh) maxWIdx = idx;
    const gCur = p.windGustKmh ?? p.windKmh;
    const gMax = points[maxGIdx].windGustKmh ?? points[maxGIdx].windKmh;
    if (gCur > gMax) maxGIdx = idx;

    totalRain += p.rainMm || 0;
    if ((p.rainMm || 0) > (points[maxRainIdx].rainMm || 0)) maxRainIdx = idx;
    if ((p.rainProb || 0) > maxProb) maxProb = p.rainProb;

    const gv = getMainVal(p);
    genSum += gv;
    if (gv < getMainVal(points[minGenIdx])) minGenIdx = idx;
    if (gv > getMainVal(points[maxGenIdx])) maxGenIdx = idx;
  });

  type KpiCard = { label: string; value: string; sub: string; accent: string };
  let kpis: KpiCard[];

  if (metric === 'temp') {
    const fMinV = points[minFIdx].apparentTemp ?? points[minFIdx].temp;
    const fMaxV = points[maxFIdx].apparentTemp ?? points[maxFIdx].temp;
    kpis = [
      {
        label: 'TEMPERATURA MÍNIMA',
        value: `${points[minTIdx].temp.toFixed(1)}°C`,
        sub: `às ${points[minTIdx].hour.slice(0, 5)} (${points[minTIdx].dayLabel})`,
        accent: '#38BDF8',
      },
      {
        label: 'TEMPERATURA MÁXIMA',
        value: `${points[maxTIdx].temp.toFixed(1)}°C`,
        sub: `às ${points[maxTIdx].hour.slice(0, 5)} (${points[maxTIdx].dayLabel})`,
        accent: '#FF8244',
      },
      {
        label: 'SENSAÇÃO TÉRMICA',
        value: `${Math.round(fMinV)}° a ${Math.round(fMaxV)}°C`,
        sub: `pico às ${points[maxFIdx].hour.slice(0, 5)} (${points[maxFIdx].dayLabel})`,
        accent: '#F43F5E',
      },
    ];
  } else if (metric === 'wind') {
    const avgWind = points.reduce((s, p) => s + p.windKmh, 0) / points.length;
    const maxG = points[maxGIdx].windGustKmh ?? points[maxGIdx].windKmh;
    kpis = [
      {
        label: 'VENTO MÁXIMO',
        value: `${points[maxWIdx].windKmh.toFixed(0)} km/h`,
        sub: `Dir. ${points[maxWIdx].windDir} às ${points[maxWIdx].hour.slice(0, 5)}`,
        accent: '#10B981',
      },
      {
        label: 'RAJADA MÁXIMA',
        value: `${maxG.toFixed(0)} km/h`,
        sub: `pico às ${points[maxGIdx].hour.slice(0, 5)} (${points[maxGIdx].dayLabel})`,
        accent: '#F59E0B',
      },
      {
        label: 'MÉDIA NO PERÍODO',
        value: `${avgWind.toFixed(0)} km/h`,
        sub: `${points.length} horas analisadas`,
        accent: textMain,
      },
    ];
  } else if (metric === 'rain') {
    kpis = [
      {
        label: 'ACUMULADO PREVISTO',
        value: `${totalRain.toFixed(1)} mm`,
        sub: `${points.length}h contínuas analisadas`,
        accent: '#3B82F6',
      },
      {
        label: 'PICO HORÁRIO',
        value: `${(points[maxRainIdx].rainMm || 0).toFixed(1)} mm/h`,
        sub:
          (points[maxRainIdx].rainMm || 0) > 0
            ? `às ${points[maxRainIdx].hour.slice(0, 5)} (${points[maxRainIdx].dayLabel})`
            : 'Sem precipitação prevista',
        accent: '#60A5FA',
      },
      {
        label: 'PROBABILIDADE MÁX.',
        value: `${maxProb}%`,
        sub: 'Máxima chance no intervalo',
        accent: textMain,
      },
    ];
  } else {
    const u = metric === 'pressure' ? ' hPa' : '%';
    const avgVal = genSum / points.length;
    kpis = [
      {
        label: metric === 'pressure' ? 'PRESSÃO MÍNIMA' : 'UMIDADE MÍNIMA',
        value: `${Math.round(getMainVal(points[minGenIdx]))}${u}`,
        sub: `às ${points[minGenIdx].hour.slice(0, 5)} (${points[minGenIdx].dayLabel})`,
        accent: meta.line,
      },
      {
        label: metric === 'pressure' ? 'PRESSÃO MÁXIMA' : 'UMIDADE MÁXIMA',
        value: `${Math.round(getMainVal(points[maxGenIdx]))}${u}`,
        sub: `às ${points[maxGenIdx].hour.slice(0, 5)} (${points[maxGenIdx].dayLabel})`,
        accent: '#FF8244',
      },
      {
        label: 'MÉDIA NO PERÍODO',
        value: `${Math.round(avgVal)}${u}`,
        sub: `${points.length} horas analisadas`,
        accent: textMain,
      },
    ];
  }

  // 3 Cards KPI espaçados e limpos
  const gapKpi = 28;
  const cardW = (contentW - gapKpi * 2) / 3;
  const cardH = isStory ? 228 : 192;
  kpis.forEach((k, idx) => {
    const cx = padX + idx * (cardW + gapKpi);
    roundRectPath(ctx, cx, cursorY, cardW, cardH, 26);
    ctx.fillStyle = cardBg;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = borderCol;
    ctx.stroke();

    roundRectPath(ctx, cx + 32, cursorY + 32, 66, 8, 4);
    ctx.fillStyle = k.accent;
    ctx.fill();

    ctx.fillStyle = textMuted;
    ctx.font = '700 24px "JetBrains Mono", monospace';
    ctx.fillText(k.label, cx + 32, cursorY + 84);

    ctx.fillStyle = k.accent;
    ctx.font = `800 ${isStory ? 52 : 46}px "JetBrains Mono", monospace`;
    ctx.fillText(k.value, cx + 32, cursorY + (isStory ? 152 : 138));

    ctx.fillStyle = textSoft;
    ctx.font = '500 23px Inter, system-ui, sans-serif';
    ctx.fillText(k.sub, cx + 32, cursorY + cardH - 28, cardW - 64);
  });

  cursorY += cardH + (isStory ? 54 : 38);

  // ============================================================================
  // CARD DO GRÁFICO — DESIGN EDITORIAL AREJADO & ZERO SOBREPOSIÇÃO
  // ============================================================================
  const footerReserve = isStory ? 200 : 156;
  const chartCardH = H - botSafe - footerReserve - cursorY;
  roundRectPath(ctx, padX, cursorY, contentW, chartCardH, 34);
  ctx.fillStyle = cardBg;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = borderCol;
  ctx.stroke();

  const innerPadX = 60;
  const cardHeaderY = cursorY + 56;
  ctx.fillStyle = textMain;
  ctx.font = '700 30px "JetBrains Mono", monospace';
  ctx.fillText('TENDÊNCIA AO LONGO DO PERÍODO', padX + innerPadX, cardHeaderY + 8);

  // Legenda limpa à direita (sem risco de encostar no título à esquerda)
  let legendRightX = padX + contentW - innerPadX;
  ctx.textAlign = 'right';
  if (meta.secLabel) {
    ctx.fillStyle = textMuted;
    ctx.font = '600 25px "JetBrains Mono", monospace';
    const secW = ctx.measureText(meta.secLabel).width;
    ctx.fillText(meta.secLabel, legendRightX, cardHeaderY + 8);
    ctx.strokeStyle = meta.secColor;
    ctx.lineWidth = 6;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(legendRightX - secW - 56, cardHeaderY);
    ctx.lineTo(legendRightX - secW - 14, cardHeaderY);
    ctx.stroke();
    ctx.setLineDash([]);
    legendRightX = legendRightX - secW - 90;
  }
  ctx.fillStyle = textMuted;
  ctx.font = '600 25px "JetBrains Mono", monospace';
  const primW = ctx.measureText(meta.primLabel).width;
  ctx.fillText(meta.primLabel, legendRightX, cardHeaderY + 8);
  ctx.strokeStyle = meta.line;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(legendRightX - primW - 56, cardHeaderY);
  ctx.lineTo(legendRightX - primW - 14, cardHeaderY);
  ctx.stroke();
  ctx.textAlign = 'left';

  // Agrupamento de dias (para cabeçalho segmentado limpo no topo quando houver > 1 dia)
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
  const dayHeaderH = isMultiDay ? 62 : 14;

  // Dimensões da área de plotagem com calha dedicada do eixo Y à esquerda
  const yAxisW = metric === 'pressure' ? 128 : 108;
  const plotFrameX = padX + innerPadX + yAxisW;
  const plotFrameY = cardHeaderY + 46;
  const plotFrameW = contentW - innerPadX * 2 - yAxisW;

  const hasSubRow = Boolean(meta.subRowLabel);
  const axisBottomH = hasSubRow ? 124 : 84;
  const plotFrameH = chartCardH - (plotFrameY - cursorY) - axisBottomH - 28;

  // Fundo interno sutil da área gráfica
  roundRectPath(ctx, plotFrameX, plotFrameY, plotFrameW, plotFrameH, 22);
  ctx.fillStyle = innerBg;
  ctx.fill();
  ctx.strokeStyle = darkTheme ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Calha interna da área de dados (afasta primeiro e último ponto das bordas!)
  const plotSideMargin = points.length <= 28 ? 58 : 44;
  const dataLeftX = plotFrameX + plotSideMargin;
  const dataRightX = plotFrameX + plotFrameW - plotSideMargin;
  const dataW = Math.max(100, dataRightX - dataLeftX);

  const dataTopY = plotFrameY + dayHeaderH + 46; // espaço livre p/ pílula MÁX no topo
  const dataBotY = plotFrameY + plotFrameH - 26;
  const dataH = Math.max(120, dataBotY - dataTopY);

  const getPxX = (i: number) =>
    points.length === 1
      ? dataLeftX + dataW / 2
      : dataLeftX + (i / (points.length - 1)) * dataW;

  // Faixas sutis alternadas por dia e divisores verticais quando multi-dia
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
        roundRectPath(ctx, plotFrameX, plotFrameY, plotFrameW, plotFrameH, 22);
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

      // Badge do Dia centralizada na faixa superior do dia
      const centerSegX = segLeft + segW / 2;
      if (segW >= 95) {
        ctx.fillStyle = darkTheme ? 'rgba(20, 33, 61, 0.85)' : 'rgba(226, 232, 240, 0.9)';
        ctx.font = '700 22px "JetBrains Mono", monospace';
        const dTxt = seg.label;
        const dTxtW = Math.min(segW - 18, ctx.measureText(dTxt).width + 28);
        roundRectPath(ctx, centerSegX - dTxtW / 2, plotFrameY + 14, dTxtW, 38, 12);
        ctx.fill();
        ctx.fillStyle = '#FF8244';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dTxt, centerSegX, plotFrameY + 34, dTxtW - 14);
      }
    });
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // Escala Y limpa
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

  // Linhas horizontais de grade e rótulos na calha esquerda (zero contato com o gráfico!)
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
    ctx.font = '700 24px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(tickLabel, plotFrameX - 18, gy);
  });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Unidade sutil no topo da calha Y para vento/pressão
  if (metric === 'wind' || metric === 'pressure') {
    ctx.fillStyle = textSoft;
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(metric === 'wind' ? 'km/h' : 'hPa', plotFrameX - 18, plotFrameY + 28);
    ctx.textAlign = 'left';
  }

  // Pré-computa pontos plotados
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

  // Ticks limpos de hora espaçados com no mínimo 155px entre si.
  // Quando houver 4+ dias (>= 96h), exibimos 1 marcador centralizado por dia em vez de repetir "00h".
  const showDailyAxisMode = daySegments.length >= 4;
  const dailySummaryIndices: number[] = [];
  if (showDailyAxisMode) {
    daySegments.forEach((seg) => {
      let bestIdx = Math.floor((seg.start + seg.end) / 2);
      if (metric === 'temp' || metric === 'rain' || metric === 'pressure' || metric === 'humidity') {
        for (let i = seg.start; i <= seg.end; i++) {
          if (getMainVal(points[i]) > getMainVal(points[bestIdx])) bestIdx = i;
        }
      } else if (metric === 'wind') {
        for (let i = seg.start; i <= seg.end; i++) {
          const gi = getSecVal(points[i]) ?? getMainVal(points[i]);
          const gb = getSecVal(points[bestIdx]) ?? getMainVal(points[bestIdx]);
          if (gi > gb) bestIdx = i;
        }
      }
      dailySummaryIndices.push(bestIdx);
    });
  }

  const tickIndices = showDailyAxisMode
    ? dailySummaryIndices
    : pickCleanHourTickIndices(points, getPxX, 155);
  const tickSet = new Set(tickIndices);

  // Linhas verticais guias muito sutis nas horas marcadas
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

  // ============================================================================
  // DESENHO DA SÉRIE (BARRAS LIMPAS OU CURVA SUAVE MONÓTONA)
  // ============================================================================
  const placedBoxes: Rect[] = [];

  const overlapsCurve = (rect: Rect): boolean => {
    if (metric === 'rain') return false;
    for (let i = 0; i < plotPts.length; i++) {
      const pt = plotPts[i];
      if (pt.x >= rect.x - 12 && pt.x <= rect.x + rect.w + 12) {
        if (pt.y >= rect.y - 8 && pt.y <= rect.y + rect.h + 8) return true;
        if (pt.secY !== null && pt.secY >= rect.y - 8 && pt.secY <= rect.y + rect.h + 8) {
          return true;
        }
      }
    }
    return false;
  };

  const canPlace = (rect: Rect, checkCurve = true, gapX = 22, gapY = 12): boolean => {
    if (
      rect.x < plotFrameX + 10 ||
      rect.x + rect.w > plotFrameX + plotFrameW - 10 ||
      rect.y < plotFrameY + dayHeaderH - 8 ||
      rect.y + rect.h > dataBotY - 4
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
    ctx.font = '800 24px "JetBrains Mono", monospace';
    const tw = ctx.measureText(text).width;
    const pw = tw + 34;
    const ph = 44;

    const offsets = preferBelow ? [44, -64, 72, -92] : [-64, 42, -92, 72];
    const minLeft = plotFrameX + 14;
    const maxLeft = plotFrameX + plotFrameW - 14 - pw;
    const clampedX = Math.max(minLeft, Math.min(maxLeft, cx - pw / 2));

    for (const offY of offsets) {
      const topY = offY < 0 ? anchorY + offY : anchorY + offY - ph / 2;
      const cand: Rect = { x: clampedX, y: topY, w: pw, h: ph };
      if (canPlace(cand, true, 24, 14)) {
        placedBoxes.push(cand);

        // Haste sutil conectando o ponto à pílula
        const stemStartY = topY + ph / 2 < anchorY ? topY + ph : topY;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx, anchorY);
        ctx.lineTo(cx, stemStartY);
        ctx.stroke();

        // Pílula contrastante
        roundRectPath(ctx, cand.x, cand.y, cand.w, cand.h, 14);
        ctx.fillStyle = darkTheme ? '#0D1526' : '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = accent;
        ctx.stroke();

        ctx.fillStyle = accent;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, cand.x + cand.w / 2, cand.y + cand.h / 2 + 1);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        return true;
      }
    }
    return false;
  };

  if (metric === 'rain') {
    const slotW = dataW / Math.max(1, points.length);
    const barW = Math.max(10, Math.min(44, slotW * 0.62));
    plotPts.forEach((pt) => {
      if (pt.val > 0) {
        const bh = Math.max(10, dataBotY - pt.y);
        const grad = ctx.createLinearGradient(0, pt.y, 0, dataBotY);
        grad.addColorStop(0, '#60A5FA');
        grad.addColorStop(1, '#2563EB');
        roundRectPath(ctx, pt.x - barW / 2, pt.y, barW, bh, 8);
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
      ctx.font = '600 28px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Sem precipitação prevista neste intervalo',
        plotFrameX + plotFrameW / 2,
        dataTopY + dataH * 0.48
      );
      ctx.textAlign = 'left';
    } else {
      // Ordena barras com chuva da maior para a menor para rotular apenas picos sem colisão
      const rainySorted = plotPts
        .filter((pt) => pt.val >= 0.1)
        .slice()
        .sort((a, b) => b.val - a.val);

      rainySorted.forEach((pt, rank) => {
        const txt = `${pt.val.toFixed(1)} mm`;
        if (rank === 0) {
          drawCalloutPill(pt.x, pt.y, txt, '#60A5FA', false);
        } else {
          ctx.font = '700 22px "JetBrains Mono", monospace';
          const tw = ctx.measureText(pt.val.toFixed(1)).width;
          const pw = tw + 16;
          const ph = 28;
          const cand: Rect = {
            x: Math.max(plotFrameX + 14, Math.min(plotFrameX + plotFrameW - 14 - pw, pt.x - pw / 2)),
            y: Math.max(plotFrameY + dayHeaderH + 4, pt.y - 38),
            w: pw,
            h: ph,
          };
          if (canPlace(cand, false, 30, 14)) {
            placedBoxes.push(cand);
            ctx.fillStyle = darkTheme ? '#93C5FD' : '#1D4ED8';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pt.val.toFixed(1), cand.x + cand.w / 2, cand.y + cand.h / 2);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
          }
        }
      });
    }
  } else {
    // Área preenchida suave sob a curva principal
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

    // Curva principal suave
    ctx.strokeStyle = meta.line;
    ctx.lineWidth = 7;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    traceMonotoneSpline(ctx, plotPts, true);
    ctx.stroke();

    // Curva secundária tracejada suave (Sensação Térmica ou Rajadas)
    const secCurvePts = plotPts
      .filter((pt): pt is PlotPt & { secY: number } => pt.secY !== null)
      .map((pt) => ({ x: pt.x, y: pt.secY }));
    if (secCurvePts.length > 1) {
      ctx.strokeStyle = meta.secColor;
      ctx.lineWidth = 5;
      ctx.setLineDash([14, 10]);
      ctx.beginPath();
      traceMonotoneSpline(ctx, secCurvePts, true);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Marcadores discretos apenas nos ticks limpos (zero amontoado de bolinhas!)
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
        ctx.arc(pt.x, pt.secY, i === maxGIdx && metric === 'wind' ? 10 : 6, 0, Math.PI * 2);
        ctx.fillStyle = meta.secColor;
        ctx.fill();
        if (i === maxGIdx && metric === 'wind') {
          ctx.lineWidth = 3.5;
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
      ctx.arc(pt.x, pt.y, isKey ? 10.5 : 6.5, 0, Math.PI * 2);
      ctx.fillStyle = isMinHighlight
        ? '#38BDF8'
        : isMaxHighlight
          ? metric === 'wind'
            ? '#10B981'
            : '#FF8244'
          : cardBg;
      ctx.fill();
      ctx.lineWidth = isKey ? 4 : 3.5;
      ctx.strokeStyle = isMinHighlight || (isMaxHighlight && metric === 'wind') ? '#FFFFFF' : meta.line;
      ctx.stroke();
    });

    // 1) Pílulas âncoras prioritárias (MÁX / MÍN / Pico de Rajada)
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

    // 2) Rótulos secundários leves nos ticks/picos espaçados (apenas se não houver colisão!)
    const tooCloseToKey = (px: number) => {
      if (showDailyAxisMode) return false; // Em 4–7 dias, canPlace 2D evita colisão vertical/horizontal com pílulas
      for (const k of keyIndices) {
        if (Math.abs(px - plotPts[k].x) < 145) return true;
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

      ctx.font = '700 22px "JetBrains Mono", monospace';
      const tw = ctx.measureText(labelVal).width;
      const pw = tw + 18;
      const ph = 30;
      const clampedX = Math.max(
        plotFrameX + 14,
        Math.min(plotFrameX + plotFrameW - 14 - pw, pt.x - pw / 2)
      );

      for (const yOff of [-40, 20, -64]) {
        const cand: Rect = { x: clampedX, y: anchorY + yOff, w: pw, h: ph };
        if (canPlace(cand, true, 32, 16)) {
          placedBoxes.push(cand);
          // Fundo discreto translúcido para nunca misturar com a linha de grade
          roundRectPath(ctx, cand.x, cand.y, cand.w, cand.h, 8);
          ctx.fillStyle = darkTheme ? 'rgba(7, 14, 28, 0.85)' : 'rgba(248, 250, 252, 0.90)';
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

  // ============================================================================
  // EIXO X AREJADO (HORAS + SUB-LINHA ÚNICA LIMPA)
  // ============================================================================
  const axisHourY = plotFrameY + plotFrameH + 42;
  const axisSubY = axisHourY + 38;

  if (hasSubRow) {
    ctx.fillStyle = textSoft;
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(showDailyAxisMode && metric === 'temp' ? 'Sens. máx' : meta.subRowLabel, plotFrameX - 18, axisSubY);
    ctx.textAlign = 'left';
  }

  ctx.textAlign = 'center';
  if (showDailyAxisMode) {
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
      ctx.font = '700 24px "JetBrains Mono", monospace';
      if (metric === 'temp') {
        ctx.fillText(`${Math.round(dayMin)}° / ${Math.round(dayMax)}°`, cx, axisHourY);
        ctx.fillStyle = '#F43F5E';
        ctx.font = '700 22px "JetBrains Mono", monospace';
        ctx.fillText(`${Math.round(daySecMax)}°`, cx, axisSubY);
      } else if (metric === 'wind') {
        ctx.fillText(`${Math.round(daySecMax)} km/h`, cx, axisHourY);
        ctx.fillStyle = '#10B981';
        ctx.font = '700 22px "JetBrains Mono", monospace';
        ctx.fillText(`${Math.round(dayMaxWind)} ${dayMaxWindDir}`, cx, axisSubY);
      } else if (metric === 'rain') {
        ctx.fillText(`${dayRain.toFixed(1)} mm`, cx, axisHourY);
        ctx.fillStyle = dayProb > 0 ? '#60A5FA' : textSoft;
        ctx.font = '700 21px "JetBrains Mono", monospace';
        ctx.fillText(`${dayProb}%`, cx, axisSubY);
      } else {
        ctx.fillText(`${Math.round(dayMin)}–${Math.round(dayMax)}${meta.shortUnit}`, cx, axisHourY);
      }
    });
  } else {
    tickIndices.forEach((i) => {
      const pt = plotPts[i];
      const hourNumStr = `${pt.p.hour.slice(0, 2)}h`;

      ctx.fillStyle = textMain;
      ctx.font = '700 24px "JetBrains Mono", monospace';
      ctx.fillText(hourNumStr, pt.x, axisHourY);

      if (metric === 'temp' && pt.secVal !== null) {
        ctx.fillStyle = '#F43F5E';
        ctx.font = '700 22px "JetBrains Mono", monospace';
        ctx.fillText(`${Math.round(pt.secVal)}°`, pt.x, axisSubY);
      } else if (metric === 'wind') {
        ctx.fillStyle = '#10B981';
        ctx.font = '700 22px "JetBrains Mono", monospace';
        ctx.fillText(`${Math.round(pt.val)} ${pt.p.windDir}`, pt.x, axisSubY);
      } else if (metric === 'rain') {
        ctx.fillStyle = pt.p.rainProb > 0 ? '#60A5FA' : textSoft;
        ctx.font = '700 21px "JetBrains Mono", monospace';
        ctx.fillText(`${pt.p.rainProb}%`, pt.x, axisSubY);
      }
    });
  }
  ctx.textAlign = 'left';

  // Nota discreta no canto inferior do card apenas explicando unidade/fuso
  ctx.fillStyle = textSoft;
  ctx.font = '500 20px "JetBrains Mono", monospace';
  ctx.fillText(
    showDailyAxisMode
      ? `Resumo diário (mín/máx) · Horário de Brasília (BRT)`
      : isMultiDay
        ? `Horário de Brasília (BRT) · ${points.length}h divididas por dia`
        : `Horário de Brasília (BRT) · ${points.length}h contínuas (${points[0].hour.slice(0, 2)}h às ${points[points.length - 1].hour.slice(0, 2)}h59)`,
    padX + innerPadX,
    cursorY + chartCardH - 22
  );

  // Rodapé Institucional
  const footY = H - botSafe - (isStory ? 90 : 66);
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padX, footY - 38);
  ctx.lineTo(W - padX, footY - 38);
  ctx.stroke();

  ctx.fillStyle = textMain;
  ctx.font = '700 28px Inter, system-ui, sans-serif';
  ctx.fillText('Portal Integrado · Tempo em Rio das Ostras', padX, footY + 6);

  ctx.fillStyle = textMuted;
  ctx.font = '500 23px "JetBrains Mono", monospace';
  ctx.fillText('Fontes: Open-Meteo · INMET · CPTEC/INPE · Marinha (CHM) · INEA · CEMADEN', padX, footY + 44);

  ctx.textAlign = 'right';
  const nowStr = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
  ctx.fillStyle = '#FF8244';
  ctx.font = '700 25px "JetBrains Mono", monospace';
  ctx.fillText(`${W}×${H} px · ${nowStr}`, W - padX, footY + 18);
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
