import type { HeatIndicesDataset } from '../services/heatIndex';
import {
  exportCanvasToPngDownload,
  formatNowBrt,
  loadImageSafe,
  roundRectPath,
  type InstagramFormat,
} from './instagramCanvasShared';

export interface ExportHeatOptions {
  heat: HeatIndicesDataset;
  format: InstagramFormat;
  darkTheme: boolean;
  siteBase?: string;
}

const HEAT_SCALE_ITEMS = [
  { label: '< 27°C', name: 'Conforto', color: '#10B981' },
  { label: '27–32°C', name: 'Cuidado', color: '#CA8A04' },
  { label: '32–36°C', name: 'Cuid. Extremo', color: '#F97316' },
  { label: '36–40°C', name: 'Alto · COR', color: '#EA580C' },
  { label: '40–44°C', name: 'Muito Alto · COR', color: '#DC2626' },
  { label: '> 44°C', name: 'Extremo · COR', color: '#991B1B' },
];

export async function exportHeatIndicesToInstagramPng(opts: ExportHeatOptions): Promise<string> {
  const { heat, format, darkTheme, siteBase = '.' } = opts;
  const stations = heat?.agora?.estacoes_tempo_real || [];
  if (!heat || !heat.agora) {
    throw new Error('Dados dos índices de calor indisponíveis para exportar.');
  }

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

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.85, H * 0.08, 60, W * 0.85, H * 0.08, W * 0.72);
  glow.addColorStop(0, darkTheme ? 'rgba(234, 88, 12, 0.14)' : 'rgba(255, 130, 68, 0.09)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const padX = 84;
  const topSafe = isStory ? 182 : 74;
  const botSafe = isStory ? 174 : 70;
  const contentW = W - padX * 2;
  let cursorY = topSafe;

  // Cabeçalho padrão @tempoemriodasostras
  const logoTargetH = isStory ? 132 : 106;
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
  const tagPadX = 38;
  const tagW = ctx.measureText(tagText).width + tagPadX * 2;
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

  cursorY += isStory ? 210 : 176;

  // Título + Pílula de data/hora atual
  const nowStr = formatNowBrt();
  const shortDate = nowStr.slice(0, 5);
  const shortTime = nowStr.slice(-5);
  const perText = `HOJE (${shortDate}) · ${shortTime}`;
  ctx.font = '700 34px "JetBrains Mono", monospace';
  const perW = ctx.measureText(perText).width + 52;
  const perH = 66;
  const perX = W - padX - perW;
  const perY = cursorY - 52;

  ctx.fillStyle = textMain;
  ctx.font = `800 ${isStory ? 74 : 64}px Inter, system-ui, sans-serif`;
  ctx.fillText('Índices de Calor • Tempo Real', padX, cursorY, Math.max(400, perX - padX - 24));

  ctx.font = '700 34px "JetBrains Mono", monospace';
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

  cursorY += isStory ? 54 : 42;

  // ============================================================================
  // FAIXA SUPERIOR: PROTOCOLO COR-RIO + MÉDIA MUNICIPAL | MAIOR PICO DO DIA
  // ============================================================================
  const summaryH = isStory ? 350 : 312;
  const hasPeakCard = Boolean(heat.agora.maior_pico_hoje);
  const sumGap = 32;
  const leftCardW = hasPeakCard ? 1050 : contentW;
  const rightCardX = padX + leftCardW + sumGap;
  const rightCardW = contentW - leftCardW - sumGap;

  // Card Esquerdo: COR + Média da Rede Municipal
  roundRectPath(ctx, padX, cursorY, leftCardW, summaryH, 28);
  ctx.fillStyle = cardBg;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = borderCol;
  ctx.stroke();

  const corHex = heat.agora.cor_hex || '#10B981';
  roundRectPath(ctx, padX, cursorY + 18, 10, summaryH - 36, 5);
  ctx.fillStyle = corHex;
  ctx.fill();

  const lcPadX = 38;
  const corBadgeText = heat.agora.cor_nivel || 'NC1';
  ctx.font = '800 32px "JetBrains Mono", monospace';
  const cbW = ctx.measureText(corBadgeText).width + 38;
  const cbH = 54;
  roundRectPath(ctx, padX + lcPadX, cursorY + 28, cbW, cbH, 14);
  ctx.fillStyle = corHex;
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(corBadgeText, padX + lcPadX + cbW / 2, cursorY + 28 + cbH / 2 + 1);
  ctx.textAlign = 'left';

  ctx.fillStyle = textMain;
  ctx.font = '800 36px Inter, system-ui, sans-serif';
  ctx.fillText(
    heat.agora.cor_nome || 'Monitoramento Térmico',
    padX + lcPadX + cbW + 22,
    cursorY + 28 + cbH / 2 + 1,
    leftCardW - lcPadX * 2 - cbW - 22
  );
  ctx.textBaseline = 'alphabetic';

  const miniStats = [
    {
      label: 'TEMPERATURA',
      val:
        heat.agora.temp_rede_c !== null && heat.agora.temp_rede_c !== undefined
          ? `${Number(heat.agora.temp_rede_c).toFixed(1)}°C`
          : '--',
      color: textMain,
    },
    {
      label: 'UMIDADE',
      val:
        heat.agora.ur_rede_pct !== null && heat.agora.ur_rede_pct !== undefined
          ? `${heat.agora.ur_rede_pct}%`
          : '--',
      color: textMain,
    },
    {
      label: 'SENSAÇÃO',
      val:
        heat.agora.sensacao_rede_c !== null && heat.agora.sensacao_rede_c !== undefined
          ? `${Number(heat.agora.sensacao_rede_c).toFixed(1)}°C`
          : '--',
      color: '#FF8244',
    },
    {
      label: 'IC MÉDIO REDE',
      val:
        heat.agora.ic_rede_c !== null && heat.agora.ic_rede_c !== undefined
          ? `${Number(heat.agora.ic_rede_c).toFixed(1)}°C`
          : '--',
      color: heat.agora.faixa_instantanea?.cor || corHex,
    },
  ];

  const msGap = 18;
  const msAreaW = leftCardW - lcPadX * 2;
  const msBoxW = (msAreaW - msGap) / 2;
  const msBoxH = isStory ? 96 : 84;
  const msStartY = cursorY + (isStory ? 112 : 102);

  miniStats.forEach((ms, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const bx = padX + lcPadX + col * (msBoxW + msGap);
    const by = msStartY + row * (msBoxH + 14);
    roundRectPath(ctx, bx, by, msBoxW, msBoxH, 16);
    ctx.fillStyle = innerBg;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = borderCol;
    ctx.stroke();

    ctx.fillStyle = textMuted;
    ctx.font = '700 24px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(ms.label, bx + 20, by + msBoxH / 2 + 1);

    ctx.fillStyle = ms.color;
    ctx.font = '800 38px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(ms.val, bx + msBoxW - 20, by + msBoxH / 2 + 1);
    ctx.textAlign = 'left';
  });
  ctx.textBaseline = 'alphabetic';

  // Card Direito: Maior Pico de IC do Dia
  const pk = heat.agora.maior_pico_hoje;
  if (pk) {
    roundRectPath(ctx, rightCardX, cursorY, rightCardW, summaryH, 28);
    ctx.fillStyle = cardBg;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = borderCol;
    ctx.stroke();

    roundRectPath(ctx, rightCardX, cursorY + 18, 10, summaryH - 36, 5);
    ctx.fillStyle = pk.cor_hex;
    ctx.fill();

    const rcPadX = 36;
    const pkBadgeText = 'MAIOR PICO DE IC DO DIA';
    ctx.font = '800 26px "JetBrains Mono", monospace';
    const pbW = ctx.measureText(pkBadgeText).width + 36;
    const pbH = 48;
    roundRectPath(ctx, rightCardX + rcPadX, cursorY + 28, pbW, pbH, 14);
    ctx.fillStyle = pk.cor_hex;
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pkBadgeText, rightCardX + rcPadX + pbW / 2, cursorY + 28 + pbH / 2 + 1);
    ctx.textAlign = 'left';

    // Valor do Pico à direita
    ctx.fillStyle = pk.cor_hex;
    ctx.font = `800 ${isStory ? 84 : 76}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(`${pk.ic_max_c.toFixed(1)}°C`, rightCardX + rightCardW - 32, cursorY + (isStory ? 148 : 134));
    ctx.textAlign = 'left';

    // Nome da estação + hora + condições no pico
    ctx.fillStyle = textMain;
    ctx.font = '800 38px Inter, system-ui, sans-serif';
    ctx.fillText(
      pk.nome,
      rightCardX + rcPadX,
      cursorY + (isStory ? 228 : 206),
      rightCardW - rcPadX - 36
    );

    const pkCond = `Às ${pk.hora}${pk.temp_c !== null ? ` · Temp ${pk.temp_c.toFixed(1)}°C` : ''}${pk.ur_pct !== null ? ` · UR ${pk.ur_pct}%` : ''}`;
    ctx.fillStyle = textMuted;
    ctx.font = '700 30px "JetBrains Mono", monospace';
    ctx.fillText(pkCond, rightCardX + rcPadX, cursorY + (isStory ? 286 : 258), rightCardW - rcPadX - 36);

    ctx.fillStyle = pk.cor_hex;
    ctx.font = '700 28px "JetBrains Mono", monospace';
    ctx.fillText(pk.faixa, rightCardX + rcPadX, cursorY + (isStory ? 324 : 286), rightCardW - rcPadX - 36);
    ctx.textBaseline = 'alphabetic';
  }

  cursorY += summaryH + (isStory ? 40 : 28);

  // ============================================================================
  // GRID PRINCIPAL DOS CARDS DAS ESTAÇÕES (Temperatura, Umidade, Sensação, IC, Pico)
  // ============================================================================
  const footerH = 92;
  const list = stations.slice(0, 6);
  const cols = list.length <= 1 ? 1 : 2;
  const rows = Math.max(1, Math.ceil(list.length / cols));
  const scalePanelH = isStory ? (rows <= 2 ? 520 : 420) : 128;
  const scaleGap = isStory ? 34 : 24;
  const maxGridH = H - botSafe - footerH - scalePanelH - scaleGap - cursorY;

  const colGap = 36;
  const rowGap = 32;
  const cardW = cols === 1 ? contentW : (contentW - colGap) / 2;
  const rawCardH = (maxGridH - rowGap * (rows - 1)) / rows;
  const cardH = isStory && rows <= 2 ? Math.min(1020, rawCardH) : rawCardH;

  if (list.length === 0) {
    roundRectPath(ctx, padX, cursorY, contentW, maxGridH, 28);
    ctx.fillStyle = cardBg;
    ctx.fill();
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = textMuted;
    ctx.font = '700 44px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Aguardando leituras ao vivo das estações de Rio das Ostras', W / 2, cursorY + maxGridH / 2);
    ctx.textAlign = 'left';
  } else {
    const scale = Math.min(1.06, Math.max(0.72, cardH / 790));

    list.forEach((st, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const isLastOdd = cols === 2 && list.length % 2 === 1 && idx === list.length - 1;
      const cx = isLastOdd ? padX + (contentW - cardW) / 2 : padX + col * (cardW + colGap);
      const cy = cursorY + row * (cardH + rowGap);

      roundRectPath(ctx, cx, cy, cardW, cardH, 28);
      ctx.fillStyle = cardBg;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = borderCol;
      ctx.stroke();

      const cPadX = Math.round(36 * scale);
      let y = cy + Math.round(48 * scale);

      // Título centralizado da estação
      ctx.fillStyle = textMain;
      ctx.font = `800 ${Math.round(42 * scale)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(st.nome, cx + cardW / 2, y, cardW - cPadX * 2);
      ctx.textAlign = 'left';

      y += Math.round(24 * scale);

      // Pílula de classificação térmica em largura total
      const pillH = Math.round(68 * scale);
      roundRectPath(ctx, cx + cPadX, y, cardW - cPadX * 2, pillH, 16);
      ctx.fillStyle = st.cor_hex;
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `800 ${Math.round(33 * scale)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(st.faixa, cx + cardW / 2, y + pillH / 2 + 1, cardW - cPadX * 2 - 24);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      y += pillH + Math.round(24 * scale);

      // Caixa interna com as linhas: Temperatura, Umidade, Sensação Térmica, IC, Pico IC, Temp máx
      const cardBotMetaH = Math.round(56 * scale);
      const boxH = cy + cardH - cardBotMetaH - y;
      const boxX = cx + cPadX;
      const boxW = cardW - cPadX * 2;
      roundRectPath(ctx, boxX, y, boxW, boxH, 20);
      ctx.fillStyle = innerBg;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = borderCol;
      ctx.stroke();

      const innerPadX = Math.round(32 * scale);
      const valX = boxX + boxW - innerPadX;
      const lblX = boxX + innerPadX;

      const icStr = st.ic_c !== null ? `${st.ic_c.toFixed(1)}°C` : '--';
      const sensStr =
        st.sensacao_c !== null && st.sensacao_c !== undefined
          ? `${st.sensacao_c.toFixed(1)}°C`
          : '--';
      const peakIcVal = st.ic_max_hoje ?? st.ic_c;
      const peakIcStr = `${peakIcVal !== null && peakIcVal !== undefined ? `${Number(peakIcVal).toFixed(1)}°C` : '--'}${
        st.hora_ic_max_hoje && st.hora_ic_max_hoje !== '--' ? ` (${st.hora_ic_max_hoje})` : ''
      }`;
      const peakTempVal = st.temp_max_hoje ?? st.temp_c;
      const peakTempStr = `${Number(peakTempVal).toFixed(1)}°C${
        st.hora_temp_max_hoje && st.hora_temp_max_hoje !== '--' ? ` (${st.hora_temp_max_hoje})` : ''
      }`;

      const metrics = [
        {
          label: 'Temperatura:',
          val: `${st.temp_c.toFixed(1)}°C`,
          lblFont: `600 ${Math.round(36 * scale)}px "JetBrains Mono", monospace`,
          valFont: `700 ${Math.round(38 * scale)}px "JetBrains Mono", monospace`,
          valColor: textMain,
          divider: false,
          dashed: false,
        },
        {
          label: 'Umidade:',
          val: `${st.ur_pct}%`,
          lblFont: `600 ${Math.round(36 * scale)}px "JetBrains Mono", monospace`,
          valFont: `700 ${Math.round(38 * scale)}px "JetBrains Mono", monospace`,
          valColor: textMain,
          divider: false,
          dashed: false,
        },
        {
          label: 'Sensação Térmica:',
          val: sensStr,
          lblFont: `600 ${Math.round(36 * scale)}px "JetBrains Mono", monospace`,
          valFont: `700 ${Math.round(38 * scale)}px "JetBrains Mono", monospace`,
          valColor: '#FF8244',
          divider: false,
          dashed: false,
        },
        {
          label: 'Índice de Calor:',
          val: icStr,
          lblFont: `700 ${Math.round(38 * scale)}px "JetBrains Mono", monospace`,
          valFont: `800 ${Math.round(46 * scale)}px "JetBrains Mono", monospace`,
          valColor: st.cor_hex,
          divider: true,
          dashed: false,
        },
        {
          label: 'Maior pico hoje:',
          val: peakIcStr,
          lblFont: `600 ${Math.round(33 * scale)}px "JetBrains Mono", monospace`,
          valFont: `700 ${Math.round(35 * scale)}px "JetBrains Mono", monospace`,
          valColor: st.cor_pico_hoje || st.cor_hex,
          divider: true,
          dashed: true,
        },
        {
          label: 'Temp. máx. hoje:',
          val: peakTempStr,
          lblFont: `600 ${Math.round(32 * scale)}px "JetBrains Mono", monospace`,
          valFont: `700 ${Math.round(34 * scale)}px "JetBrains Mono", monospace`,
          valColor: textMain,
          divider: false,
          dashed: false,
        },
      ];

      const boxPadY = Math.round(24 * scale);
      const usableH = boxH - boxPadY * 2;
      const stepY = usableH / metrics.length;

      metrics.forEach((rowItem, rIdx) => {
        const rowCenterY = y + boxPadY + stepY * (rIdx + 0.5);
        if (rowItem.divider) {
          const divY = y + boxPadY + stepY * rIdx + 2;
          ctx.strokeStyle = darkTheme ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)';
          ctx.lineWidth = 2;
          ctx.setLineDash(rowItem.dashed ? [10, 8] : []);
          ctx.beginPath();
          ctx.moveTo(lblX, divY);
          ctx.lineTo(valX, divY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.textBaseline = 'middle';
        ctx.fillStyle = textMuted;
        ctx.font = rowItem.lblFont;
        ctx.fillText(rowItem.label, lblX, rowCenterY);

        ctx.fillStyle = rowItem.valColor;
        ctx.font = rowItem.valFont;
        ctx.textAlign = 'right';
        ctx.fillText(rowItem.val, valX, rowCenterY);
        ctx.textAlign = 'left';
      });
      ctx.textBaseline = 'alphabetic';

      // Micro-rodapé do card (código + horário)
      const cardMetaY = cy + cardH - Math.round(20 * scale);
      ctx.fillStyle = textSoft;
      ctx.font = `600 ${Math.round(28 * scale)}px "JetBrains Mono", monospace`;
      ctx.fillText(st.codigo, cx + cPadX, cardMetaY);

      const obsClock =
        st.ultima_leitura && st.ultima_leitura.length >= 16
          ? st.ultima_leitura.slice(11, 16)
          : st.ultima_leitura || '--';
      ctx.textAlign = 'right';
      ctx.fillText(obsClock, cx + cardW - cPadX, cardMetaY);
      ctx.textAlign = 'left';
    });
  }

  // ============================================================================
  // PAINEL INFERIOR: ESCALA DE CALOR (E PREVISÃO PRÓXIMOS DIAS NO STORY 9:16)
  // ============================================================================
  const usedCardsH = rows * cardH + Math.max(0, rows - 1) * rowGap;
  const panelTopY = isStory
    ? Math.max(cursorY + usedCardsH + 34, H - botSafe - footerH - scalePanelH)
    : H - botSafe - footerH - scalePanelH;
  const panelRealH = H - botSafe - footerH - 22 - panelTopY;

  roundRectPath(ctx, padX, panelTopY, contentW, panelRealH, 24);
  ctx.fillStyle = cardBg;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = borderCol;
  ctx.stroke();

  if (isStory) {
    // Story 9:16: 6 faixas térmicas em grid 3x2 + resumo dos próximos dias COR
    const pPadX = 36;
    ctx.fillStyle = textMain;
    ctx.font = '800 32px Inter, system-ui, sans-serif';
    ctx.fillText('Classificação do Índice de Calor & Critério COR-Rio (NC1–NC5)', padX + pPadX, panelTopY + 52);

    const pillCols = 3;
    const pillGapX = 20;
    const pillGapY = 16;
    const pillW = (contentW - pPadX * 2 - pillGapX * 2) / pillCols;
    const pillH = 74;
    const pillsStartY = panelTopY + 80;

    HEAT_SCALE_ITEMS.forEach((item, i) => {
      const pc = i % pillCols;
      const pr = Math.floor(i / pillCols);
      const px = padX + pPadX + pc * (pillW + pillGapX);
      const py = pillsStartY + pr * (pillH + pillGapY);
      roundRectPath(ctx, px, py, pillW, pillH, 14);
      ctx.fillStyle = innerBg;
      ctx.fill();
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      roundRectPath(ctx, px + 14, py + 15, 18, pillH - 30, 8);
      ctx.fillStyle = item.color;
      ctx.fill();

      ctx.textBaseline = 'middle';
      ctx.fillStyle = textMain;
      ctx.font = '800 28px "JetBrains Mono", monospace';
      ctx.fillText(item.label, px + 46, py + pillH / 2 + 1);

      const legColor = darkTheme && item.color === '#991B1B' ? '#F87171' : item.color;
      ctx.fillStyle = legColor;
      ctx.font = '700 27px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(item.name, px + pillW - 18, py + pillH / 2 + 1);
      ctx.textAlign = 'left';
    });
    ctx.textBaseline = 'alphabetic';

    // Linha de projeção rápida dos próximos 4 dias
    const fcDays = (heat.previsao_8dias_calor || []).slice(0, 4);
    if (fcDays.length > 0) {
      const fcY = pillsStartY + 2 * (pillH + pillGapY) + 28;
      const fcH = panelTopY + panelRealH - 28 - fcY;
      if (fcH >= 110) {
        ctx.fillStyle = textMuted;
        ctx.font = '700 27px "JetBrains Mono", monospace';
        ctx.fillText('PROJEÇÃO IC MÁXIMO (PRÓXIMOS DIAS):', padX + pPadX, fcY + 26);

        const dGap = 18;
        const dW = (contentW - pPadX * 2 - dGap * (fcDays.length - 1)) / fcDays.length;
        const dBoxY = fcY + 46;
        const dBoxH = fcH - 46;
        fcDays.forEach((d, di) => {
          const dx = padX + pPadX + di * (dW + dGap);
          roundRectPath(ctx, dx, dBoxY, dW, dBoxH, 16);
          ctx.fillStyle = innerBg;
          ctx.fill();
          ctx.strokeStyle = borderCol;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.textBaseline = 'middle';
          ctx.fillStyle = textMain;
          ctx.font = '700 30px "JetBrains Mono", monospace';
          ctx.fillText(d.data_br.slice(0, 5), dx + 20, dBoxY + dBoxH * 0.30);

          ctx.fillStyle = d.cor_hex;
          ctx.font = '800 42px "JetBrains Mono", monospace';
          ctx.fillText(
            d.ic_max_c !== null ? `${d.ic_max_c.toFixed(1)}°C` : '--',
            dx + 20,
            dBoxY + dBoxH * 0.68
          );

          ctx.textAlign = 'right';
          ctx.font = '800 28px "JetBrains Mono", monospace';
          ctx.fillText(d.cor_nivel, dx + dW - 20, dBoxY + dBoxH * 0.30);
          ctx.textAlign = 'left';
        });
        ctx.textBaseline = 'alphabetic';
      }
    }
  } else {
    // Post 4:5: faixa compacta com as 6 cores em 1 linha
    const pPadX = 28;
    const itemW = (contentW - pPadX * 2 - 14 * 5) / 6;
    const itemH = panelRealH - 36;
    const py = panelTopY + 18;
    HEAT_SCALE_ITEMS.forEach((item, i) => {
      const px = padX + pPadX + i * (itemW + 14);
      roundRectPath(ctx, px, py, itemW, itemH, 14);
      ctx.fillStyle = innerBg;
      ctx.fill();
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = textMain;
      ctx.font = '800 26px "JetBrains Mono", monospace';
      ctx.fillText(item.label, px + itemW / 2, py + itemH * 0.36);

      const legColor = darkTheme && item.color === '#991B1B' ? '#F87171' : item.color;
      ctx.fillStyle = legColor;
      ctx.font = '700 24px Inter, system-ui, sans-serif';
      ctx.fillText(item.name, px + itemW / 2, py + itemH * 0.72, itemW - 16);
    });
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // Rodapé institucional
  const footY = H - botSafe - 18;
  ctx.fillStyle = textMuted;
  ctx.font = '600 34px "JetBrains Mono", monospace';
  ctx.fillText('Rio das Ostras · RJ  ·  @tempoemriodasostras', padX, footY);

  ctx.textAlign = 'right';
  ctx.fillStyle = textSoft;
  ctx.font = '500 34px "JetBrains Mono", monospace';
  ctx.fillText(nowStr, W - padX, footY);
  ctx.textAlign = 'left';

  const slugTime = `${shortDate.replace('/', '-')}_${shortTime.replace(':', 'h')}`;
  const filename = `indices-calor-${format === 'story' ? 'stories-9x16' : 'post-4x5'}-${slugTime}.png`;
  return exportCanvasToPngDownload(canvas, filename);
}
