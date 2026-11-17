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
        line: '#FF8244',
        fillTop: 'rgba(255, 130, 68, 0.36)',
        fillBot: 'rgba(255, 130, 68, 0.02)',
        secColor: '#F43F5E',
        secLabel: 'Sensação Térmica (°C)',
        primLabel: 'Temperatura (°C)',
      };
    case 'wind':
      return {
        title: 'Vento Médio & Rajadas',
        subtitle: 'Velocidade sustentada, rajadas máximas e direção (km/h)',
        unit: ' km/h',
        line: '#10B981',
        fillTop: 'rgba(16, 185, 129, 0.34)',
        fillBot: 'rgba(16, 185, 129, 0.02)',
        secColor: '#F59E0B',
        secLabel: 'Rajadas Máximas (km/h)',
        primLabel: 'Vento Médio (km/h)',
      };
    case 'rain':
      return {
        title: 'Previsão de Chuva Horária',
        subtitle: 'Volume horário estimado (mm/h) e probabilidade (%)',
        unit: ' mm',
        line: '#3B82F6',
        fillTop: 'rgba(59, 130, 246, 0.40)',
        fillBot: 'rgba(59, 130, 246, 0.04)',
        secColor: '#60A5FA',
        secLabel: 'Probabilidade (%)',
        primLabel: 'Chuva (mm/h)',
      };
    case 'pressure':
      return {
        title: 'Pressão Atmosférica',
        subtitle: 'Tendência horária ao nível da superfície (hPa)',
        unit: ' hPa',
        line: '#8B5CF6',
        fillTop: 'rgba(139, 92, 246, 0.34)',
        fillBot: 'rgba(139, 92, 246, 0.02)',
        secColor: '',
        secLabel: '',
        primLabel: 'Pressão (hPa)',
      };
    case 'humidity':
      return {
        title: 'Umidade Relativa do Ar',
        subtitle: 'Oscilação horária da umidade atmosférica (%)',
        unit: '%',
        line: '#06B6D4',
        fillTop: 'rgba(6, 182, 212, 0.34)',
        fillBot: 'rgba(6, 182, 212, 0.02)',
        secColor: '',
        secLabel: '',
        primLabel: 'Umidade (%)',
      };
  }
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

  // Garante fontes web carregadas quando disponíveis
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

  const glow = ctx.createRadialGradient(W * 0.82, H * 0.12, 60, W * 0.82, H * 0.12, W * 0.7);
  glow.addColorStop(0, darkTheme ? 'rgba(255, 130, 68, 0.14)' : 'rgba(255, 130, 68, 0.10)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Margem externa segura (respeita safe-zones de Stories e borda elegante em Post)
  const padX = 110;
  const topSafe = isStory ? 210 : 100;
  const botSafe = isStory ? 220 : 95;
  const contentW = W - padX * 2;

  // Cabeçalho Institucional
  let cursorY = topSafe;
  if (logoImg) {
    const targetH = isStory ? 130 : 106;
    const ratio = logoImg.width / Math.max(1, logoImg.height);
    const targetW = targetH * ratio;
    ctx.drawImage(logoImg, padX, cursorY, targetW, targetH);
  } else {
    ctx.fillStyle = textMain;
    ctx.font = '800 54px Inter, system-ui, sans-serif';
    ctx.fillText('TEMPO EM RIO DAS OSTRAS', padX, cursorY + 62);
  }

  // Badge @tempoemriodasostras + Local à direita
  const tagText = '@tempoemriodasostras';
  ctx.font = '700 32px "JetBrains Mono", monospace';
  const tagMetrics = ctx.measureText(tagText);
  const tagPadX = 34;
  const tagW = tagMetrics.width + tagPadX * 2;
  const tagH = 66;
  const tagX = W - padX - tagW;
  const tagY = cursorY + 8;
  roundRectPath(ctx, tagX, tagY, tagW, tagH, 33);
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
  ctx.font = '600 28px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('RIO DAS OSTRAS · RJ (22.52°S 41.94°W)', W - padX, tagY + tagH + 46);
  ctx.textAlign = 'left';

  cursorY += isStory ? 195 : 155;

  // Pílula de Período Selecionado + Título Principal
  const pillLbl = `PREVISÃO HORÁRIA · ${periodLabel.toUpperCase()}`;
  ctx.font = '700 28px "JetBrains Mono", monospace';
  const pillW = Math.min(contentW, ctx.measureText(pillLbl).width + 58);
  roundRectPath(ctx, padX, cursorY, pillW, 56, 14);
  ctx.fillStyle = darkTheme ? '#14213D' : '#E2E8F0';
  ctx.fill();
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#FF8244';
  ctx.textBaseline = 'middle';
  ctx.fillText(pillLbl, padX + 29, cursorY + 29);

  cursorY += isStory ? 115 : 96;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = textMain;
  ctx.font = `800 ${isStory ? 74 : 62}px Inter, system-ui, sans-serif`;
  ctx.fillText(meta.title, padX, cursorY);

  cursorY += isStory ? 54 : 46;
  ctx.fillStyle = textMuted;
  ctx.font = `500 ${isStory ? 34 : 30}px Inter, system-ui, sans-serif`;
  ctx.fillText(meta.subtitle, padX, cursorY);

  cursorY += isStory ? 65 : 46;

  // Estatísticas principais do período (3 cards grandes e legíveis)
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
        sub: `${points.length} pontos horários analisados`,
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
        sub: `${points.length} pontos horários`,
        accent: textMain,
      },
    ];
  }

  const gapKpi = 30;
  const cardW = (contentW - gapKpi * 2) / 3;
  const cardH = isStory ? 235 : 196;
  kpis.forEach((k, idx) => {
    const cx = padX + idx * (cardW + gapKpi);
    roundRectPath(ctx, cx, cursorY, cardW, cardH, 28);
    ctx.fillStyle = cardBg;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = borderCol;
    ctx.stroke();

    // Accent strip on left top
    roundRectPath(ctx, cx + 32, cursorY + 34, 68, 8, 4);
    ctx.fillStyle = k.accent;
    ctx.fill();

    ctx.fillStyle = textMuted;
    ctx.font = '700 25px "JetBrains Mono", monospace';
    ctx.fillText(k.label, cx + 32, cursorY + 86);

    ctx.fillStyle = k.accent;
    ctx.font = `800 ${isStory ? 54 : 46}px "JetBrains Mono", monospace`;
    ctx.fillText(k.value, cx + 32, cursorY + (isStory ? 156 : 140));

    ctx.fillStyle = textSoft;
    ctx.font = '500 24px Inter, system-ui, sans-serif';
    ctx.fillText(k.sub, cx + 32, cursorY + cardH - 30);
  });

  cursorY += cardH + (isStory ? 60 : 44);

  // Card Principal do Gráfico em Ultra Resolução
  const footerReserve = isStory ? 210 : 165;
  const chartCardH = H - botSafe - footerReserve - cursorY;
  roundRectPath(ctx, padX, cursorY, contentW, chartCardH, 36);
  ctx.fillStyle = cardBg;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = borderCol;
  ctx.stroke();

  // Cabeçalho do card gráfico + Legenda
  const innerPadX = 64;
  const cardInnerTop = cursorY + 56;
  ctx.fillStyle = textMain;
  ctx.font = '700 32px "JetBrains Mono", monospace';
  ctx.fillText(`EVOLUÇÃO HORÁRIA · ${points.length} PONTOS`, padX + innerPadX, cardInnerTop + 10);

  // Legenda à direita
  let legendRightX = padX + contentW - innerPadX;
  ctx.textAlign = 'right';
  if (meta.secLabel) {
    ctx.fillStyle = textMuted;
    ctx.font = '600 26px "JetBrains Mono", monospace';
    const secW = ctx.measureText(meta.secLabel).width;
    ctx.fillText(meta.secLabel, legendRightX, cardInnerTop + 8);
    ctx.strokeStyle = meta.secColor;
    ctx.lineWidth = 6;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(legendRightX - secW - 58, cardInnerTop);
    ctx.lineTo(legendRightX - secW - 14, cardInnerTop);
    ctx.stroke();
    ctx.setLineDash([]);
    legendRightX = legendRightX - secW - 96;
  }
  ctx.fillStyle = textMuted;
  ctx.font = '600 26px "JetBrains Mono", monospace';
  const primW = ctx.measureText(meta.primLabel).width;
  ctx.fillText(meta.primLabel, legendRightX, cardInnerTop + 8);
  ctx.strokeStyle = meta.line;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(legendRightX - primW - 58, cardInnerTop);
  ctx.lineTo(legendRightX - primW - 14, cardInnerTop);
  ctx.stroke();
  ctx.textAlign = 'left';

  // Caixa interna de plotagem
  const plotX = padX + innerPadX + 18;
  const plotY = cardInnerTop + 88;
  const plotW = contentW - innerPadX * 2 - 36;
  const axisSubH = metric === 'wind' ? 175 : metric === 'temp' ? 140 : metric === 'rain' ? 135 : 105;
  const plotH = chartCardH - (plotY - cursorY) - axisSubH - 44;

  // Fundo sutil da área de plotagem
  roundRectPath(ctx, plotX - 18, plotY - 28, plotW + 36, plotH + 40, 22);
  ctx.fillStyle = innerBg;
  ctx.fill();

  const getSecVal = (p: HourlyPoint): number | null => {
    if (metric === 'temp') return p.apparentTemp ?? p.temp;
    if (metric === 'wind') return Math.max(p.windKmh, p.windGustKmh ?? p.windKmh);
    return null;
  };

  const primVals = points.map(getMainVal);
  const secVals = points.map(getSecVal).filter((v): v is number => v !== null);
  const scaleAll = secVals.length ? [...primVals, ...secVals] : primVals;
  let yMin = Math.min(...scaleAll);
  let yMax = Math.max(...scaleAll);
  if (metric === 'rain') {
    yMin = 0;
    yMax = Math.max(2, Math.ceil(yMax * 1.25 * 10) / 10);
  } else if (metric === 'temp') {
    yMin = Math.floor(yMin - 3);
    yMax = Math.ceil(yMax + 4);
  } else if (metric === 'wind') {
    yMin = 0;
    yMax = Math.max(15, Math.ceil(yMax * 1.2));
  } else if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }

  const getPxY = (v: number) => {
    const r = (v - yMin) / Math.max(0.1, yMax - yMin);
    return plotY + plotH - r * plotH;
  };
  const colW = plotW / points.length;
  const getPxX = (i: number) => plotX + colW * i + colW / 2;

  // Linhas horizontais de grade + rótulos Mín / Méd / Máx
  [1.0, 0.5, 0.0].forEach((frac, li) => {
    const gy = plotY + plotH * (1 - frac);
    const val = yMin + (yMax - yMin) * frac;
    ctx.strokeStyle = darkTheme ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.10)';
    ctx.lineWidth = 2;
    ctx.setLineDash(li === 2 ? [] : [10, 10]);
    ctx.beginPath();
    ctx.moveTo(plotX, gy);
    ctx.lineTo(plotX + plotW, gy);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = textSoft;
    ctx.font = '700 24px "JetBrains Mono", monospace';
    const lblPrefix = li === 0 ? 'Máx: ' : li === 2 ? 'Mín: ' : '';
    ctx.fillText(
      `${lblPrefix}${val.toFixed(metric === 'rain' ? 1 : 0)}${meta.unit.trim()}`,
      plotX + 6,
      gy - 10
    );
  });

  // Divisores verticais de mudança de dia
  points.forEach((p, i) => {
    if (i > 0 && p.dayLabel !== points[i - 1].dayLabel) {
      const lx = plotX + colW * i;
      ctx.strokeStyle = darkTheme ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.15)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(lx, plotY - 12);
      ctx.lineTo(lx, plotY + plotH + 10);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  // Série principal + secundária
  if (metric === 'rain') {
    const barW = Math.max(12, Math.min(48, colW * 0.56));
    points.forEach((p, i) => {
      const px = getPxX(i);
      const py = getPxY(p.rainMm || 0);
      const baseY = plotY + plotH;
      if ((p.rainMm || 0) > 0) {
        const bh = Math.max(12, baseY - py);
        const grad = ctx.createLinearGradient(0, py, 0, baseY);
        grad.addColorStop(0, '#3B82F6');
        grad.addColorStop(1, '#1D4ED8');
        roundRectPath(ctx, px - barW / 2, py, barW, bh, 8);
        ctx.fillStyle = grad;
        ctx.fill();
      } else {
        ctx.strokeStyle = darkTheme ? 'rgba(148,163,184,0.35)' : 'rgba(100,116,139,0.35)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(px - 8, baseY);
        ctx.lineTo(px + 8, baseY);
        ctx.stroke();
      }
    });
  } else {
    // Área sob curva principal
    const areaGrad = ctx.createLinearGradient(0, plotY, 0, plotY + plotH);
    areaGrad.addColorStop(0, meta.fillTop);
    areaGrad.addColorStop(1, meta.fillBot);
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = getPxX(i);
      const y = getPxY(getMainVal(p));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(getPxX(points.length - 1), plotY + plotH);
    ctx.lineTo(getPxX(0), plotY + plotH);
    ctx.closePath();
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Linha principal
    ctx.strokeStyle = meta.line;
    ctx.lineWidth = 6.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = getPxX(i);
      const y = getPxY(getMainVal(p));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Linha secundária tracejada (Sensação Térmica ou Rajadas)
    if (secVals.length > 0) {
      ctx.strokeStyle = meta.secColor;
      ctx.lineWidth = 5;
      ctx.setLineDash([14, 10]);
      ctx.beginPath();
      points.forEach((p, i) => {
        const sv = getSecVal(p);
        if (sv === null) return;
        const x = getPxX(i);
        const y = getPxY(sv);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Pontos (espaçados em multi-dias longos para evitar poluição visual)
    const dotStep = points.length <= 48 ? 1 : points.length <= 96 ? 2 : 3;
    points.forEach((p, i) => {
      const isKey =
        (metric === 'temp' && (i === minTIdx || i === maxTIdx)) ||
        (metric === 'wind' && (i === maxWIdx || i === maxGIdx));
      if (i % dotStep !== 0 && !isKey) return;

      const x = getPxX(i);
      const sv = getSecVal(p);
      if (sv !== null) {
        const sy = getPxY(sv);
        ctx.beginPath();
        ctx.arc(x, sy, isKey ? 7 : 5.5, 0, Math.PI * 2);
        ctx.fillStyle = meta.secColor;
        ctx.fill();
      }

      const y = getPxY(getMainVal(p));
      const isMinT = metric === 'temp' && i === minTIdx;
      const isMaxT = metric === 'temp' && i === maxTIdx;
      ctx.beginPath();
      ctx.arc(x, y, isMinT || isMaxT ? 10 : 7.5, 0, Math.PI * 2);
      ctx.fillStyle = isMinT ? '#38BDF8' : isMaxT ? '#FF8244' : '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = isMinT ? '#FFFFFF' : meta.line;
      ctx.stroke();
    });
  }

  // Passo inteligente dos rótulos numéricos e de horas para nunca embolar em nenhum horizonte (24h até 7d)
  const labelStep =
    points.length <= 28
      ? 1
      : points.length <= 52
        ? 2
        : points.length <= 80
          ? 3
          : points.length <= 125
            ? 5
            : 6;

  ctx.textAlign = 'center';
  points.forEach((p, i) => {
    const x = getPxX(i);
    const sv = getSecVal(p);
    const y = getPxY(getMainVal(p));
    const showCol = i % labelStep === 0 || (metric === 'temp' && (i === minTIdx || i === maxTIdx)) || (metric === 'wind' && i === maxGIdx);
    const isDayStart = i === 0 || p.dayLabel !== points[i - 1].dayLabel;

    // Rótulos superiores
    if (metric === 'temp') {
      if (i === maxTIdx) {
        ctx.fillStyle = '#FF8244';
        ctx.font = '800 22px "JetBrains Mono", monospace';
        ctx.fillText('MÁX', x, y - 52);
      } else if (i === minTIdx) {
        ctx.fillStyle = '#38BDF8';
        ctx.font = '800 22px "JetBrains Mono", monospace';
        ctx.fillText('MÍN', x, y - 52);
      }
      if (i % labelStep === 0 || i === maxTIdx || i === minTIdx) {
        ctx.fillStyle = textMain;
        ctx.font = '700 25px "JetBrains Mono", monospace';
        ctx.fillText(`${Math.round(p.temp)}°`, x, y - 22);
      }
    } else if (metric === 'wind') {
      if (sv !== null && (i % labelStep === 0 || i === maxGIdx)) {
        const sy = getPxY(sv);
        ctx.fillStyle = '#F59E0B';
        ctx.font = `${i === maxGIdx ? '800 27px' : '700 24px'} "JetBrains Mono", monospace`;
        ctx.fillText(`${Math.round(sv)}`, x, sy - 20);
      }
    } else if (metric === 'rain') {
      if ((p.rainMm || 0) > 0 && (i % labelStep === 0 || i === maxRainIdx)) {
        ctx.fillStyle = darkTheme ? '#60A5FA' : '#2563EB';
        ctx.font = '700 24px "JetBrains Mono", monospace';
        ctx.fillText(`${p.rainMm.toFixed(1)}`, x, Math.min(y - 16, plotY + plotH - 22));
      }
    } else if (showCol) {
      ctx.fillStyle = textMain;
      ctx.font = `700 ${points.length <= 28 && metric === 'pressure' ? 21 : 24}px "JetBrains Mono", monospace`;
      ctx.fillText(`${Math.round(getMainVal(p))}`, x, y - 20);
    }

    // Linha de Hora
    const axisBaseY = plotY + plotH + 46;
    if (i % labelStep === 0) {
      ctx.fillStyle = textMuted;
      ctx.font = '600 23px "JetBrains Mono", monospace';
      ctx.fillText(p.hour.slice(0, 5), x, axisBaseY);

      if (metric === 'temp' && sv !== null) {
        ctx.fillStyle = '#F43F5E';
        ctx.font = '700 23px "JetBrains Mono", monospace';
        ctx.fillText(`${Math.round(sv)}°`, x, axisBaseY + 34);
      } else if (metric === 'wind') {
        ctx.fillStyle = '#10B981';
        ctx.font = '700 24px "JetBrains Mono", monospace';
        ctx.fillText(`${Math.round(p.windKmh)}`, x, axisBaseY + 34);

        ctx.fillStyle = textSoft;
        ctx.font = '600 20px "JetBrains Mono", monospace';
        ctx.fillText(p.windDir, x, axisBaseY + 64);
      } else if (metric === 'rain' && p.rainProb > 0) {
        ctx.fillStyle = '#3B82F6';
        ctx.font = '700 22px "JetBrains Mono", monospace';
        ctx.fillText(`${p.rainProb}%`, x, axisBaseY + 34);
      }
    }

    if (isDayStart) {
      const dateOffset =
        metric === 'wind' ? 102 : metric === 'temp' || metric === 'rain' ? 72 : 38;
      ctx.fillStyle = '#FF8244';
      ctx.font = '700 24px "JetBrains Mono", monospace';
      ctx.fillText(p.dayLabel, x, axisBaseY + dateOffset);
    }
  });
  ctx.textAlign = 'left';

  // Legenda descritiva das sub-linhas dentro do card do gráfico
  ctx.fillStyle = textSoft;
  ctx.font = '500 24px "JetBrains Mono", monospace';
  const noteY = cursorY + chartCardH - 26;
  if (metric === 'temp') {
    ctx.fillText('Valores acima da linha: Temperatura (°C)  ·  Valores em rosa abaixo das horas: Sensação Térmica (°C)', padX + innerPadX, noteY);
  } else if (metric === 'wind') {
    ctx.fillText('Números em âmbar (topo): Rajadas (km/h)  ·  Números em verde (base): Vento médio (km/h) & direção', padX + innerPadX, noteY);
  } else if (metric === 'rain') {
    ctx.fillText('Barras: Volume horário previsto (mm/h)  ·  Percentual em azul abaixo das horas: Probabilidade de chuva (%)', padX + innerPadX, noteY);
  }

  // Rodapé Institucional
  const footY = H - botSafe - (isStory ? 95 : 70);
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padX, footY - 40);
  ctx.lineTo(W - padX, footY - 40);
  ctx.stroke();

  ctx.fillStyle = textMain;
  ctx.font = '700 28px Inter, system-ui, sans-serif';
  ctx.fillText('Portal Integrado · Tempo em Rio das Ostras', padX, footY + 6);

  ctx.fillStyle = textMuted;
  ctx.font = '500 24px "JetBrains Mono", monospace';
  ctx.fillText('Fontes: Open-Meteo · INMET · CPTEC/INPE · Marinha (CHM) · INEA · CEMADEN', padX, footY + 46);

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
  ctx.font = '700 26px "JetBrains Mono", monospace';
  ctx.fillText(`${W}×${H} px · ${nowStr}`, W - padX, footY + 18);
  ctx.textAlign = 'left';

  // Trigger download em PNG sem perda (qualidade máxima nativa 2160px)
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
