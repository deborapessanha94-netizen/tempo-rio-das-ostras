import type { WindRoseDistribution, WindRoseSpeedBin, WindRoseStationSnapshot } from '../services/windRose';
import { SPEED_BINS_WIND_ROSE } from '../services/windRose';
import {
  exportCanvasToPngDownload,
  formatNowBrt,
  loadImageSafe,
  roundRectPath,
  type InstagramFormat,
} from './instagramCanvasShared';

export interface ExportWindRoseOptions {
  distribution: WindRoseDistribution;
  stationLabel: string;
  periodLabel: string;
  stations?: WindRoseStationSnapshot[];
  binsMeta?: WindRoseSpeedBin[];
  format: InstagramFormat;
  darkTheme: boolean;
  siteBase?: string;
}

export async function exportWindRoseToInstagramPng(opts: ExportWindRoseOptions): Promise<string> {
  const {
    distribution,
    stationLabel,
    periodLabel,
    stations = [],
    binsMeta = SPEED_BINS_WIND_ROSE,
    format,
    darkTheme,
    siteBase = '.',
  } = opts;

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

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.5, H * 0.42, 80, W * 0.5, H * 0.42, W * 0.65);
  glow.addColorStop(0, darkTheme ? 'rgba(14, 165, 233, 0.14)' : 'rgba(14, 165, 233, 0.08)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const padX = 84;
  const topSafe = isStory ? 180 : 74;
  const botSafe = isStory ? 174 : 70;
  const contentW = W - padX * 2;
  let cursorY = topSafe;

  // Cabeçalho
  const logoTargetH = isStory ? 126 : 100;
  if (logoImg) {
    const ratio = logoImg.width / Math.max(1, logoImg.height);
    ctx.drawImage(logoImg, padX, cursorY, logoTargetH * ratio, logoTargetH);
  } else {
    ctx.fillStyle = textMain;
    ctx.font = '800 54px Inter, system-ui, sans-serif';
    ctx.fillText('TEMPO EM RIO DAS OSTRAS', padX, cursorY + 66);
  }

  const tagText = '@tempoemriodasostras';
  ctx.font = '700 38px "JetBrains Mono", monospace';
  const tagPadX = 36;
  const tagW = ctx.measureText(tagText).width + tagPadX * 2;
  const tagH = 70;
  const tagX = W - padX - tagW;
  const tagY = cursorY + Math.round((logoTargetH - tagH) / 2);
  roundRectPath(ctx, tagX, tagY, tagW, tagH, 35);
  ctx.fillStyle = darkTheme ? 'rgba(255,130,68,0.16)' : 'rgba(255,130,68,0.13)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#FF8244';
  ctx.stroke();
  ctx.fillStyle = '#FF8244';
  ctx.fillText(tagText, tagX + tagPadX, tagY + 47);

  cursorY += logoTargetH + (isStory ? 44 : 28);

  ctx.fillStyle = textMain;
  ctx.font = `800 ${isStory ? 74 : 62}px Inter, system-ui, sans-serif`;
  ctx.fillText('ROSA DOS VENTOS • RIO DAS OSTRAS', padX, cursorY + 56);
  cursorY += isStory ? 84 : 72;

  ctx.fillStyle = '#FF8244';
  ctx.font = '700 36px "JetBrains Mono", monospace';
  ctx.fillText(`${stationLabel.toUpperCase()} · ${periodLabel.toUpperCase()}`, padX, cursorY + 32);
  cursorY += isStory ? 66 : 52;

  // Painel principal com Rosa Polar
  const roseCardH = isStory ? 1680 : 1240;
  roundRectPath(ctx, padX, cursorY, contentW, roseCardH, 36);
  ctx.fillStyle = cardBg;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = borderCol;
  ctx.stroke();

  const centerX = W / 2;
  const centerY = cursorY + (isStory ? 720 : 535);
  const rInner = isStory ? 105 : 82;
  const rOuter = isStory ? 545 : 410;
  const rLabel = isStory ? 625 : 472;

  const setores = distribution.setores || [];
  const rawMax = Math.max(10, ...setores.map((s) => s.pct || 0));
  const step = rawMax <= 16 ? 4 : rawMax <= 32 ? 8 : rawMax <= 48 ? 12 : 16;
  const maxPct = Math.ceil(rawMax / step) * step;

  // Eixos radiais
  for (const sec of setores) {
    const rad = ((sec.angulo_centro - 90) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(centerX + rInner * Math.cos(rad), centerY + rInner * Math.sin(rad));
    ctx.lineTo(centerX + (rOuter + 12) * Math.cos(rad), centerY + (rOuter + 12) * Math.sin(rad));
    ctx.strokeStyle = darkTheme ? 'rgba(255,255,255,0.14)' : 'rgba(20,33,61,0.14)';
    ctx.lineWidth = sec.idx % 4 === 0 ? 3 : 1.5;
    ctx.stroke();
  }

  // Anéis concêntricos
  for (const frac of [0.25, 0.5, 0.75, 1.0]) {
    const r = rInner + (rOuter - rInner) * frac;
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.strokeStyle = darkTheme ? 'rgba(255,255,255,0.16)' : 'rgba(20,33,61,0.16)';
    ctx.lineWidth = frac === 1 ? 3 : 2;
    ctx.stroke();

    const lblAng = ((22.5 - 90) * Math.PI) / 180;
    ctx.fillStyle = textMuted;
    ctx.font = '700 28px "JetBrains Mono", monospace';
    ctx.fillText(`${Math.round(maxPct * frac)}%`, centerX + r * Math.cos(lblAng) + 8, centerY + r * Math.sin(lblAng) - 6);
  }

  // Pétalas empilhadas
  const halfRad = (9.0 * Math.PI) / 180;
  for (const sec of setores) {
    let curR = rInner;
    const baseAng = ((sec.angulo_centro - 90) * Math.PI) / 180;
    const a1 = baseAng - halfRad;
    const a2 = baseAng + halfRad;

    sec.bins.forEach((binPct, bIdx) => {
      if (!binPct || binPct <= 0) return;
      const segLen = (binPct / maxPct) * (rOuter - rInner);
      const nextR = Math.min(rOuter + 6, curR + segLen);
      ctx.beginPath();
      ctx.arc(centerX, centerY, nextR, a1, a2, false);
      ctx.arc(centerX, centerY, curR, a2, a1, true);
      ctx.closePath();
      ctx.fillStyle = binsMeta[bIdx]?.cor_hex || SPEED_BINS_WIND_ROSE[bIdx].cor_hex;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = cardBg;
      ctx.stroke();
      curR = nextR;
    });
  }

  // Vetor resultante
  if (distribution.dir_vetorial_graus !== null && distribution.total_amostras > 0) {
    const vecRad = ((distribution.dir_vetorial_graus - 90) * Math.PI) / 180;
    const vecLen = rInner + Math.max(40, (distribution.persistencia_pct / 100) * (rOuter - rInner) * 0.88);
    const vx1 = centerX + vecLen * Math.cos(vecRad);
    const vy1 = centerY + vecLen * Math.sin(vecRad);
    ctx.beginPath();
    ctx.moveTo(centerX + rInner * Math.cos(vecRad), centerY + rInner * Math.sin(vecRad));
    ctx.lineTo(vx1, vy1);
    ctx.strokeStyle = textMain;
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(vx1, vy1, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#FF8244';
    ctx.fill();
  }

  // Miolo central
  ctx.beginPath();
  ctx.arc(centerX, centerY, rInner, 0, Math.PI * 2);
  ctx.fillStyle = innerBg;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = borderCol;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FF8244';
  ctx.font = `800 ${isStory ? 44 : 36}px Inter, system-ui, sans-serif`;
  ctx.fillText(distribution.dir_predominante || 'N/D', centerX, centerY - 6);
  ctx.fillStyle = textMuted;
  ctx.font = `700 ${isStory ? 30 : 24}px "JetBrains Mono", monospace`;
  ctx.fillText(`${distribution.dir_predominante_pct}%`, centerX, centerY + 34);

  // Rótulos 16 direções
  for (const sec of setores) {
    const rad = ((sec.angulo_centro - 90) * Math.PI) / 180;
    const isMain = sec.idx % 4 === 0;
    ctx.fillStyle = sec.idx === 0 ? '#FF8244' : isMain ? textMain : textMuted;
    ctx.font = isMain
      ? `800 ${isStory ? 44 : 36}px Inter, system-ui, sans-serif`
      : `700 ${isStory ? 30 : 25}px "JetBrains Mono", monospace`;
    ctx.fillText(sec.cardeal, centerX + rLabel * Math.cos(rad), centerY + rLabel * Math.sin(rad) + 12);
  }
  ctx.textAlign = 'left';

  // Legenda de velocidades dentro do painel
  const legY = cursorY + roseCardH - (isStory ? 150 : 120);
  const legW = contentW / binsMeta.length;
  binsMeta.forEach((bm, idx) => {
    const lx = padX + 42 + idx * legW;
    ctx.fillStyle = bm.cor_hex;
    roundRectPath(ctx, lx, legY, 34, 34, 8);
    ctx.fill();
    ctx.fillStyle = textMain;
    ctx.font = '700 30px "JetBrains Mono", monospace';
    ctx.fillText(`${bm.short_label} km/h`, lx + 46, legY + 28);
  });

  cursorY += roseCardH + (isStory ? 42 : 30);

  // 4 KPIs resumidos
  const kpiW = (contentW - 60) / 4;
  const kpiH = isStory ? 260 : 220;
  const kpis = [
    { label: 'PREDOMINANTE', val: `${distribution.dir_predominante} (${distribution.dir_predominante_pct}%)`, sub: `Vetorial: ${distribution.dir_vetorial_cardeal}` },
    { label: 'VEL. MÉDIA / MÁX', val: `${distribution.vel_media_kmh.toFixed(1)} / ${distribution.vel_max_kmh.toFixed(1)}`, sub: 'km/h sustentado' },
    { label: 'RAJADA MÁXIMA', val: `${distribution.rajada_max_kmh.toFixed(1)} km/h`, sub: `Persistência ${distribution.persistencia_pct}%` },
    { label: 'QUADRANTE SUL', val: `${distribution.quadrante_sul_pct.toFixed(1)}%`, sub: `N–L (ASAS): ${distribution.quadrante_norte_leste_pct.toFixed(1)}%` },
  ];

  kpis.forEach((k, idx) => {
    const kx = padX + idx * (kpiW + 20);
    roundRectPath(ctx, kx, cursorY, kpiW, kpiH, 24);
    ctx.fillStyle = cardBg;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = borderCol;
    ctx.stroke();

    ctx.fillStyle = textMuted;
    ctx.font = '700 26px "JetBrains Mono", monospace';
    ctx.fillText(k.label, kx + 28, cursorY + 56);

    ctx.fillStyle = idx === 2 ? '#FF8244' : textMain;
    ctx.font = `800 ${isStory ? 44 : 38}px "JetBrains Mono", monospace`;
    ctx.fillText(k.val, kx + 28, cursorY + (isStory ? 142 : 128));

    ctx.fillStyle = textMuted;
    ctx.font = '600 26px Inter, system-ui, sans-serif';
    ctx.fillText(k.sub, kx + 28, cursorY + (isStory ? 206 : 182));
  });

  cursorY += kpiH + (isStory ? 42 : 28);

  // Tira das estações (Story ou Post)
  const onlineList = stations.slice(0, isStory ? 4 : 4);
  if (onlineList.length > 0 && cursorY + 260 < H - botSafe) {
    const stH = isStory ? 260 : 210;
    const stW = (contentW - 60) / 4;
    onlineList.forEach((st, idx) => {
      const sx = padX + idx * (stW + 20);
      roundRectPath(ctx, sx, cursorY, stW, stH, 22);
      ctx.fillStyle = cardBg;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = borderCol;
      ctx.stroke();

      ctx.fillStyle = textMain;
      ctx.font = '700 28px Inter, system-ui, sans-serif';
      ctx.fillText(st.nome.slice(0, 22), sx + 24, cursorY + 52);

      ctx.fillStyle = '#FF8244';
      ctx.font = '800 38px "JetBrains Mono", monospace';
      const dirTxt = st.dir_atual_cardeal ? `${st.dir_atual_cardeal} (${st.dir_atual_graus ?? '--'}°)` : st.periodos.hoje.dir_predominante;
      ctx.fillText(dirTxt, sx + 24, cursorY + 114);

      ctx.fillStyle = textMuted;
      ctx.font = '600 26px "JetBrains Mono", monospace';
      const vTxt = st.vento_atual_kmh !== null ? `${st.vento_atual_kmh.toFixed(1)} km/h` : 'Offline';
      const gTxt = st.rajada_max_hoje_kmh !== null ? `Raj. máx ${st.rajada_max_hoje_kmh.toFixed(1)}` : '';
      ctx.fillText(`${vTxt} · ${gTxt}`, sx + 24, cursorY + (isStory ? 174 : 162));
    });
  }

  // Rodapé padrão
  const footY = H - botSafe;
  ctx.fillStyle = textMuted;
  ctx.font = '600 28px "JetBrains Mono", monospace';
  ctx.fillText(`Atualizado em ${formatNowBrt()} BRT · Série contínua diária · Tempo em Rio das Ostras`, padX, footY);

  const safeSlug = format === 'story' ? 'stories_9x16' : 'post_4x5';
  return exportCanvasToPngDownload(canvas, `rosa_dos_ventos_riodasostras_${safeSlug}.png`);
}
