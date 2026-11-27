import type { HistoricoResumoDiario } from '../services/siteData';
import { classifyRainPlancon, classifyWindPlancon } from '../services/liveRainConsensus';
import {
  exportCanvasToPngDownload,
  formatNowBrt,
  loadImageSafe,
  roundRectPath,
} from './instagramCanvasShared';

export type CalendarExportFormat = '4k' | 'story' | 'post' | 'calendar_only';

export interface CalendarExportCell {
  dayNum: number;
  dateIso: string;
}

export interface CalendarExportStationItem {
  code: string;
  nome: string;
  chuva_mm: number;
  rajada_max_kmh: number;
  vento_max_kmh: number;
}

export interface CalendarExportDayMetrics {
  rainMean: number;
  rainMaxMm: number;
  rainMaxStation: string;
  sustMaxKmh: number;
  sustMaxStation: string;
  gustMaxKmh: number;
  gustMaxStation: string;
}

export interface CalendarMonthSummaryMetrics {
  rainyDays: number;
  totalDays: number;
  wettestDayIso?: string;
  wettestMaxMm: number;
  wettestStation?: string;
  windiestDayIso?: string;
  windiestMaxKmh: number;
  windiestStation?: string;
}

export interface ExportCalendarOptions {
  format: CalendarExportFormat;
  darkTheme: boolean;
  year: number;
  month1to12: number;
  monthLabel: string;
  cells: Array<CalendarExportCell | null>;
  dailyMap: Map<string, HistoricoResumoDiario & { is_live_today?: boolean; live_atualizacao?: string }>;
  selectedDay: (HistoricoResumoDiario & { is_live_today?: boolean; live_atualizacao?: string }) | null;
  selectedDayMetrics: CalendarExportDayMetrics;
  selectedStations: CalendarExportStationItem[];
  monthStats: CalendarMonthSummaryMetrics | null;
  todayIso: string;
  resolveDayMetrics: (
    entry?: (HistoricoResumoDiario & { is_live_today?: boolean }) | null
  ) => { rainMm: number; gustKmh: number };
  siteBase?: string;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Palette {
  dark: boolean;
  bg: string;
  cardBg: string;
  innerBg: string;
  border: string;
  textMain: string;
  textMuted: string;
  accent: string;
  rainBlue: string;
  gridBorder: string;
}

const WEEKDAYS_PT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export function getCalendarExportDimensions(format: CalendarExportFormat): {
  width: number;
  height: number;
  label: string;
} {
  switch (format) {
    case '4k':
      return { width: 3840, height: 2160, label: 'Painel Completo 4K (16:9)' };
    case 'story':
      return { width: 2160, height: 3840, label: 'Stories Instagram (9:16)' };
    case 'post':
      return { width: 2160, height: 2700, label: 'Post Feed Instagram (4:5)' };
    case 'calendar_only':
      return { width: 2160, height: 2700, label: 'Calendário Mensal Ampliado (4:5)' };
  }
}

function createPalette(dark: boolean): Palette {
  return dark
    ? {
        dark: true,
        bg: '#05080F',
        cardBg: '#0D1526',
        innerBg: '#09101E',
        border: '#233354',
        textMain: '#FFFFFF',
        textMuted: '#94A3B8',
        accent: '#FF8244',
        rainBlue: '#38BDF8',
        gridBorder: '#1E2D4A',
      }
    : {
        dark: false,
        bg: '#F4F6FA',
        cardBg: '#FFFFFF',
        innerBg: '#F8FAFC',
        border: '#CBD5E1',
        textMain: '#14213D',
        textMuted: '#475569',
        accent: '#FF8244',
        rainBlue: '#0284C7',
        gridBorder: '#E2E8F0',
      };
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxW) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxW) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  maxLines: number
): string[] {
  const words = (text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxW) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
      if (lines.length === maxLines - 1) {
        const remaining = [current, ...words.slice(i + 1)].join(' ');
        lines.push(fitText(ctx, remaining, maxW));
        return lines;
      }
    }
  }
  if (lines.length < maxLines) {
    lines.push(fitText(ctx, current, maxW));
  }
  return lines;
}

function formatBrDate(iso?: string): string {
  if (!iso || iso.length < 10) return '--/--/----';
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

function formatWeekdayFull(iso?: string): string {
  if (!iso || iso.length < 10) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const raw = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(dt);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function resolveCellColors(
  mm: number,
  isSelected: boolean,
  hasData: boolean,
  pal: Palette
): { fill: string; stroke: string; dayCol: string; mmCol: string; gustCol: string; strokeW: number } {
  if (!hasData) {
    return {
      fill: pal.dark ? 'rgba(9,16,30,0.42)' : '#F1F5F9',
      stroke: pal.gridBorder,
      dayCol: pal.dark ? 'rgba(148,163,184,0.45)' : '#94A3B8',
      mmCol: pal.dark ? 'rgba(148,163,184,0.45)' : '#94A3B8',
      gustCol: pal.textMuted,
      strokeW: 1.5,
    };
  }
  if (isSelected) {
    return pal.dark
      ? {
          fill: '#FF8244',
          stroke: '#FFFFFF',
          dayCol: '#09101E',
          mmCol: '#09101E',
          gustCol: '#14213D',
          strokeW: 4,
        }
      : {
          fill: '#14213D',
          stroke: '#FF8244',
          dayCol: '#FFFFFF',
          mmCol: '#FFB38A',
          gustCol: '#E2E8F0',
          strokeW: 4,
        };
  }
  if (mm >= 50) {
    return {
      fill: pal.dark ? 'rgba(244,63,94,0.22)' : 'rgba(244,63,94,0.14)',
      stroke: pal.dark ? 'rgba(251,113,133,0.65)' : 'rgba(225,29,72,0.55)',
      dayCol: pal.textMain,
      mmCol: pal.dark ? '#FDA4AF' : '#BE123C',
      gustCol: pal.textMuted,
      strokeW: 2,
    };
  }
  if (mm >= 15) {
    return {
      fill: pal.dark ? 'rgba(255,130,68,0.20)' : 'rgba(255,130,68,0.15)',
      stroke: pal.dark ? 'rgba(255,130,68,0.62)' : 'rgba(234,88,12,0.55)',
      dayCol: pal.textMain,
      mmCol: pal.dark ? '#FFA16C' : '#C2410C',
      gustCol: pal.textMuted,
      strokeW: 2,
    };
  }
  if (mm >= 1) {
    return {
      fill: pal.dark ? 'rgba(14,165,233,0.16)' : 'rgba(14,165,233,0.11)',
      stroke: pal.dark ? 'rgba(56,189,248,0.48)' : 'rgba(14,165,233,0.45)',
      dayCol: pal.textMain,
      mmCol: pal.rainBlue,
      gustCol: pal.textMuted,
      strokeW: 1.8,
    };
  }
  return {
    fill: pal.dark ? 'rgba(15,23,42,0.72)' : '#F8FAFC',
    stroke: pal.gridBorder,
    dayCol: pal.textMain,
    mmCol: pal.textMuted,
    gustCol: pal.textMuted,
    strokeW: 1.5,
  };
}

function drawCalendarGridPanel(
  ctx: CanvasRenderingContext2D,
  box: Rect,
  opts: ExportCalendarOptions,
  pal: Palette,
  scaleFactor = 1
) {
  const { monthLabel, cells, dailyMap, selectedDay, monthStats, todayIso, resolveDayMetrics } = opts;
  const activeIso = selectedDay?.data_iso || '';

  roundRectPath(ctx, box.x, box.y, box.w, box.h, 28 * scaleFactor);
  ctx.fillStyle = pal.cardBg;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = pal.border;
  ctx.stroke();

  const pad = Math.round(32 * scaleFactor);
  const innerX = box.x + pad;
  const innerW = box.w - pad * 2;
  let cy = box.y + pad;

  // Cabeçalho do Mês
  const monthH = Math.round(78 * scaleFactor);
  roundRectPath(ctx, innerX, cy, innerW, monthH, 16 * scaleFactor);
  ctx.fillStyle = pal.innerBg;
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = pal.border;
  ctx.stroke();

  ctx.fillStyle = pal.textMain;
  ctx.font = `800 ${Math.round(30 * scaleFactor)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(monthLabel.toUpperCase(), innerX + innerW / 2, cy + Math.round(34 * scaleFactor));

  ctx.fillStyle = pal.textMuted;
  ctx.font = `600 ${Math.round(20 * scaleFactor)}px "JetBrains Mono", monospace`;
  const mSummary = monthStats
    ? `Pico diário: ${monthStats.wettestMaxMm.toFixed(1)} mm · ${monthStats.rainyDays}/${monthStats.totalDays} dias c/ chuva`
    : 'Série Contínua Diária';
  ctx.fillText(fitText(ctx, mSummary, innerW - 36), innerX + innerW / 2, cy + Math.round(62 * scaleFactor));
  ctx.textAlign = 'left';

  cy += monthH + Math.round(22 * scaleFactor);

  // Cabeçalho dias da semana
  const gapX = Math.round(12 * scaleFactor);
  const gapY = Math.round(12 * scaleFactor);
  const cellW = (innerW - gapX * 6) / 7;
  const weekdayH = Math.round(28 * scaleFactor);

  ctx.fillStyle = pal.textMuted;
  ctx.font = `700 ${Math.round(18 * scaleFactor)}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  WEEKDAYS_PT.forEach((wd, i) => {
    const cx = innerX + i * (cellW + gapX) + cellW / 2;
    ctx.fillText(wd, cx, cy + Math.round(18 * scaleFactor));
  });
  ctx.textAlign = 'left';

  cy += weekdayH + Math.round(8 * scaleFactor);

  const legendH = Math.round(44 * scaleFactor);
  const gridAvailH = box.y + box.h - pad - legendH - cy - Math.round(12 * scaleFactor);
  const numRows = Math.max(4, Math.ceil(cells.length / 7));
  const cellH = Math.floor((gridAvailH - gapY * (numRows - 1)) / numRows);

  for (let idx = 0; idx < cells.length; idx++) {
    const cell = cells[idx];
    const row = Math.floor(idx / 7);
    const col = idx % 7;
    const x = innerX + col * (cellW + gapX);
    const y = cy + row * (cellH + gapY);

    if (!cell) {
      roundRectPath(ctx, x, y, cellW, cellH, 14 * scaleFactor);
      ctx.fillStyle = pal.dark ? 'rgba(9,16,30,0.22)' : 'rgba(241,245,249,0.55)';
      ctx.fill();
      continue;
    }

    const rec = dailyMap.get(cell.dateIso);
    const metrics = resolveDayMetrics(rec);
    const isSel = cell.dateIso === activeIso;
    const hasData = Boolean(rec);
    const colors = resolveCellColors(metrics.rainMm, isSel, hasData, pal);

    roundRectPath(ctx, x, y, cellW, cellH, 14 * scaleFactor);
    ctx.fillStyle = colors.fill;
    ctx.fill();
    ctx.lineWidth = colors.strokeW;
    ctx.strokeStyle = colors.stroke;
    ctx.stroke();

    // Número do dia
    const innerPadX = Math.round(12 * scaleFactor);
    ctx.fillStyle = colors.dayCol;
    ctx.font = `800 ${Math.round(24 * scaleFactor)}px "JetBrains Mono", monospace`;
    ctx.fillText(String(cell.dayNum), x + innerPadX, y + Math.round(30 * scaleFactor));

    if (cell.dateIso === todayIso) {
      ctx.beginPath();
      ctx.arc(x + cellW - Math.round(16 * scaleFactor), y + Math.round(20 * scaleFactor), Math.round(6 * scaleFactor), 0, Math.PI * 2);
      ctx.fillStyle = pal.accent;
      ctx.fill();
    }

    if (hasData) {
      const mmText = `${metrics.rainMm.toFixed(metrics.rainMm >= 10 || metrics.rainMm === 0 ? 1 : 1)} mm`;
      const mmFont = Math.round((cellH >= 150 ? 22 : 19) * scaleFactor);
      ctx.fillStyle = colors.mmCol;
      ctx.font = `800 ${mmFont}px "JetBrains Mono", monospace`;
      ctx.fillText(
        fitText(ctx, mmText, cellW - innerPadX * 1.6),
        x + innerPadX,
        y + Math.round(cellH * 0.62)
      );

      if (metrics.gustKmh > 0) {
        const gustCol =
          !isSel && metrics.gustKmh >= 41
            ? pal.dark
              ? '#FFA16C'
              : '#C2410C'
            : colors.gustCol;
        ctx.fillStyle = gustCol;
        ctx.font = `700 ${Math.round((cellH >= 150 ? 18 : 16) * scaleFactor)}px "JetBrains Mono", monospace`;
        ctx.fillText(
          fitText(ctx, `${Math.round(metrics.gustKmh)} km/h`, cellW - innerPadX * 1.6),
          x + innerPadX,
          y + Math.round(cellH * 0.85)
        );
      }
    } else {
      ctx.fillStyle = colors.mmCol;
      ctx.font = `600 ${Math.round(18 * scaleFactor)}px "JetBrains Mono", monospace`;
      ctx.fillText('--', x + innerPadX, y + Math.round(cellH * 0.68));
    }
  }

  // Legenda inferior
  const legY = box.y + box.h - pad - Math.round(14 * scaleFactor);
  const legItems = [
    { label: '0 mm (seco)', fill: pal.dark ? '#0F172A' : '#F8FAFC', stroke: pal.gridBorder },
    { label: '1–14,9 mm', fill: 'rgba(14,165,233,0.28)', stroke: 'rgba(14,165,233,0.75)' },
    { label: '15–49,9 mm', fill: 'rgba(255,130,68,0.28)', stroke: 'rgba(255,130,68,0.85)' },
    { label: '≥ 50 mm', fill: 'rgba(244,63,94,0.28)', stroke: 'rgba(244,63,94,0.85)' },
  ];
  let lx = innerX;
  const sw = Math.round(18 * scaleFactor);
  ctx.font = `600 ${Math.round(18 * scaleFactor)}px Inter, system-ui, sans-serif`;
  for (const item of legItems) {
    roundRectPath(ctx, lx, legY - sw + Math.round(3 * scaleFactor), sw, sw, Math.round(4 * scaleFactor));
    ctx.fillStyle = item.fill;
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = item.stroke;
    ctx.stroke();

    ctx.fillStyle = pal.textMuted;
    ctx.fillText(item.label, lx + sw + Math.round(8 * scaleFactor), legY);
    lx += sw + Math.round(28 * scaleFactor) + ctx.measureText(item.label).width;
  }
}

function drawSelectedDayBanner(
  ctx: CanvasRenderingContext2D,
  box: Rect,
  opts: ExportCalendarOptions,
  pal: Palette,
  scaleFactor = 1
) {
  const { selectedDay, selectedDayMetrics } = opts;
  if (!selectedDay) return;

  roundRectPath(ctx, box.x, box.y, box.w, box.h, 22 * scaleFactor);
  ctx.fillStyle = pal.cardBg;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = pal.border;
  ctx.stroke();

  const px = box.x + Math.round(28 * scaleFactor);
  const titleTxt = `${formatWeekdayFull(selectedDay.data_iso)} — ${selectedDay.data_br || formatBrDate(selectedDay.data_iso)}`;
  ctx.fillStyle = pal.textMain;
  ctx.font = `800 ${Math.round(30 * scaleFactor)}px Inter, system-ui, sans-serif`;
  ctx.fillText(fitText(ctx, titleTxt, box.w - Math.round(320 * scaleFactor)), px, box.y + Math.round(42 * scaleFactor));

  const subParts = [
    selectedDay.horas_registradas ? `${selectedDay.horas_registradas}h monitoradas` : 'Monitoramento contínuo',
    selectedDay.horas_com_chuva !== undefined ? `${selectedDay.horas_com_chuva}h com chuva` : '',
    selectedDay.is_live_today ? 'AO VIVO HOJE' : '',
  ].filter(Boolean);
  ctx.fillStyle = pal.textMuted;
  ctx.font = `600 ${Math.round(18 * scaleFactor)}px "JetBrains Mono", monospace`;
  ctx.fillText(fitText(ctx, subParts.join(' · '), box.w - Math.round(320 * scaleFactor)), px, box.y + Math.round(74 * scaleFactor));

  // Badge PLANCON à direita
  const rainPlancon = classifyRainPlancon(selectedDayMetrics.rainMaxMm);
  const badgeText =
    selectedDayMetrics.rainMaxMm <= 0.1 && selectedDayMetrics.rainMean <= 0.1
      ? 'Sem chuva'
      : rainPlancon.titulo;
  ctx.font = `700 ${Math.round(18 * scaleFactor)}px Inter, system-ui, sans-serif`;
  const bW = Math.min(Math.round(280 * scaleFactor), ctx.measureText(badgeText).width + Math.round(36 * scaleFactor));
  const bH = Math.round(44 * scaleFactor);
  const bX = box.x + box.w - Math.round(24 * scaleFactor) - bW;
  const bY = box.y + Math.round((box.h - bH) / 2);

  roundRectPath(ctx, bX, bY, bW, bH, bH / 2);
  ctx.fillStyle = pal.dark ? 'rgba(255,130,68,0.16)' : 'rgba(255,130,68,0.12)';
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = pal.accent;
  ctx.stroke();

  ctx.fillStyle = pal.accent;
  ctx.textAlign = 'center';
  ctx.fillText(fitText(ctx, badgeText, bW - 18), bX + bW / 2, bY + Math.round(29 * scaleFactor));
  ctx.textAlign = 'left';
}

function drawDayKpisGrid(
  ctx: CanvasRenderingContext2D,
  box: Rect,
  opts: ExportCalendarOptions,
  pal: Palette,
  cols: 2 | 4,
  scaleFactor = 1
) {
  const { selectedDay, selectedDayMetrics } = opts;
  if (!selectedDay) return;

  const rows = cols === 4 ? 1 : 2;
  const gap = Math.round(18 * scaleFactor);
  const cardW = (box.w - gap * (cols - 1)) / cols;
  const cardH = (box.h - gap * (rows - 1)) / rows;

  const windPlancon = classifyWindPlancon(
    Math.max(Number(selectedDay.vento_vel_media_kmh ?? 0), selectedDayMetrics.sustMaxKmh),
    selectedDayMetrics.gustMaxKmh
  );

  const picoHoraStr =
    Number(selectedDay.chuva_pico_hora_mm ?? 0) > 0
      ? ` · Pico ${Number(selectedDay.chuva_pico_hora_mm).toFixed(1)} mm às ${selectedDay.chuva_pico_horario || '--'}`
      : '';
  const cards = [
    {
      label: 'MAIOR REGISTRO NO DIA',
      val: `${selectedDayMetrics.rainMaxMm.toFixed(1)} mm`,
      valColor: pal.accent,
      sub: `${selectedDayMetrics.rainMaxMm > 0 ? selectedDayMetrics.rainMaxStation : 'Sem registro de chuva na rede'}${picoHoraStr}`,
    },
    {
      label: 'MÉDIA MUNICIPAL DA REDE',
      val: `${selectedDayMetrics.rainMean.toFixed(1)} mm`,
      valColor: pal.textMain,
      sub:
        selectedDay.horas_com_chuva !== undefined
          ? `${selectedDay.horas_com_chuva}h com registro de chuva`
          : 'Média entre estações',
    },
    {
      label: 'VENTO MÁXIMO (SUST.)',
      val: selectedDayMetrics.sustMaxKmh > 0 ? `${selectedDayMetrics.sustMaxKmh.toFixed(1)} km/h` : '--',
      valColor: pal.textMain,
      sub: `${
        selectedDayMetrics.sustMaxKmh > 0
          ? `${selectedDayMetrics.sustMaxStation}${
              selectedDay.vento_vel_max_horario && selectedDay.vento_vel_max_horario !== '--'
                ? ` às ${selectedDay.vento_vel_max_horario}`
                : ''
            } · `
          : ''
      }Predom.: ${selectedDay.vento_dir_predominante || '--'} · Méd.: ${Number(selectedDay.vento_vel_media_kmh ?? 0).toFixed(1)} km/h`,
    },
    {
      label: 'RAJADA MÁXIMA DO DIA',
      val: selectedDayMetrics.gustMaxKmh > 0 ? `${selectedDayMetrics.gustMaxKmh.toFixed(1)} km/h` : '--',
      valColor: selectedDayMetrics.gustMaxKmh >= 41 ? pal.accent : pal.textMain,
      sub:
        selectedDayMetrics.gustMaxKmh > 0
          ? `${selectedDayMetrics.gustMaxStation}${
              selectedDay.vento_rajada_max_horario && selectedDay.vento_rajada_max_horario !== '--'
                ? ` às ${selectedDay.vento_rajada_max_horario}`
                : ''
            } · ${windPlancon.gustTitulo} (${windPlancon.riscoLabel})`
          : 'Sem rajada registrada',
    },
  ];

  cards.forEach((c, idx) => {
    const colIdx = idx % cols;
    const rowIdx = Math.floor(idx / cols);
    const x = box.x + colIdx * (cardW + gap);
    const y = box.y + rowIdx * (cardH + gap);

    roundRectPath(ctx, x, y, cardW, cardH, 20 * scaleFactor);
    ctx.fillStyle = pal.cardBg;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = pal.border;
    ctx.stroke();

    const px = x + Math.round(24 * scaleFactor);
    const innerW = cardW - Math.round(48 * scaleFactor);

    ctx.fillStyle = pal.textMuted;
    ctx.font = `700 ${Math.round(17 * scaleFactor)}px "JetBrains Mono", monospace`;
    ctx.fillText(fitText(ctx, c.label, innerW), px, y + Math.round(36 * scaleFactor));

    ctx.fillStyle = c.valColor;
    ctx.font = `800 ${Math.round((cardH >= 200 ? 44 : 36) * scaleFactor)}px "JetBrains Mono", monospace`;
    ctx.fillText(fitText(ctx, c.val, innerW), px, y + Math.round(cardH * 0.56));

    ctx.fillStyle = pal.textMuted;
    ctx.font = `500 ${Math.round(17 * scaleFactor)}px Inter, system-ui, sans-serif`;
    const subLines = wrapText(ctx, c.sub, innerW, 2);
    subLines.forEach((line, li) => {
      ctx.fillText(line, px, y + Math.round(cardH * 0.77) + li * Math.round(21 * scaleFactor));
    });
  });
}

function drawSynopticCard(
  ctx: CanvasRenderingContext2D,
  box: Rect,
  selectedDay: HistoricoResumoDiario | null,
  pal: Palette,
  scaleFactor = 1
) {
  if (!selectedDay) return;
  roundRectPath(ctx, box.x, box.y, box.w, box.h, 20 * scaleFactor);
  ctx.fillStyle = pal.cardBg;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = pal.border;
  ctx.stroke();

  const px = box.x + Math.round(26 * scaleFactor);
  const innerW = box.w - Math.round(52 * scaleFactor);
  let cy = box.y + Math.round(38 * scaleFactor);

  const metrics: string[] = [];
  if (selectedDay.temp_min_c !== undefined && selectedDay.temp_max_c !== undefined) {
    metrics.push(`Temp.: ${Number(selectedDay.temp_min_c).toFixed(1)}° – ${Number(selectedDay.temp_max_c).toFixed(1)}°C`);
  }
  if (selectedDay.umidade_media_pct !== undefined) {
    metrics.push(`Umid. méd.: ${Math.round(Number(selectedDay.umidade_media_pct))}%`);
  }
  if (selectedDay.pressao_min_hpa !== undefined && selectedDay.pressao_max_hpa !== undefined) {
    metrics.push(`Pressão: ${Number(selectedDay.pressao_min_hpa).toFixed(1)}–${Number(selectedDay.pressao_max_hpa).toFixed(1)} hPa`);
  }
  if (metrics.length > 0) {
    ctx.fillStyle = pal.textMain;
    ctx.font = `700 ${Math.round(19 * scaleFactor)}px "JetBrains Mono", monospace`;
    ctx.fillText(fitText(ctx, metrics.join('   ·   '), innerW), px, cy);
    cy += Math.round(34 * scaleFactor);
  }

  if (selectedDay.sistema_atuante_dia) {
    ctx.fillStyle = pal.accent;
    ctx.font = `700 ${Math.round(19 * scaleFactor)}px Inter, system-ui, sans-serif`;
    const sysLines = wrapText(ctx, `Sistema atuante: ${selectedDay.sistema_atuante_dia}`, innerW, 2);
    sysLines.forEach((line) => {
      ctx.fillText(line, px, cy);
      cy += Math.round(25 * scaleFactor);
    });
    cy += Math.round(6 * scaleFactor);
  }

  if (selectedDay.caracteristicas_dia) {
    ctx.fillStyle = pal.textMuted;
    ctx.font = `500 ${Math.round(18 * scaleFactor)}px Inter, system-ui, sans-serif`;
    const maxLines = Math.max(1, Math.floor((box.y + box.h - 20 - cy) / Math.round(24 * scaleFactor)));
    const descLines = wrapText(ctx, selectedDay.caracteristicas_dia, innerW, Math.min(3, maxLines));
    descLines.forEach((line) => {
      ctx.fillText(line, px, cy);
      cy += Math.round(24 * scaleFactor);
    });
  }
}

function drawStationsPanel(
  ctx: CanvasRenderingContext2D,
  box: Rect,
  stations: CalendarExportStationItem[],
  pal: Palette,
  cols: 2 | 3,
  dateBr: string,
  scaleFactor = 1
) {
  roundRectPath(ctx, box.x, box.y, box.w, box.h, 22 * scaleFactor);
  ctx.fillStyle = pal.cardBg;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = pal.border;
  ctx.stroke();

  const pad = Math.round(24 * scaleFactor);
  const innerW = box.w - pad * 2;
  const px = box.x + pad;
  const titleY = box.y + Math.round(36 * scaleFactor);

  ctx.fillStyle = pal.textMain;
  ctx.font = `700 ${Math.round(21 * scaleFactor)}px Inter, system-ui, sans-serif`;
  ctx.fillText(`Acumulado, Vento & Rajada Máxima por Estação (${dateBr})`, px, titleY);

  ctx.fillStyle = pal.textMuted;
  ctx.font = `600 ${Math.round(17 * scaleFactor)}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'right';
  ctx.fillText(`${stations.length} estações`, box.x + box.w - pad, titleY);
  ctx.textAlign = 'left';

  const visible = stations.slice(0, 6);
  const rows = Math.max(1, Math.ceil(visible.length / cols));
  const gap = Math.round(14 * scaleFactor);
  const gridY = box.y + Math.round(54 * scaleFactor);
  const gridH = box.y + box.h - pad - gridY;
  const cardW = (innerW - gap * (cols - 1)) / cols;
  const cardH = (gridH - gap * (rows - 1)) / rows;
  const maxRain = Math.max(0.1, ...visible.map((s) => s.chuva_mm));

  visible.forEach((st, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const sx = px + col * (cardW + gap);
    const sy = gridY + row * (cardH + gap);

    roundRectPath(ctx, sx, sy, cardW, cardH, 14 * scaleFactor);
    ctx.fillStyle = pal.innerBg;
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = pal.gridBorder;
    ctx.stroke();

    const sp = Math.round(16 * scaleFactor);
    const sw = cardW - sp * 2;

    const rainLabel = `${st.chuva_mm.toFixed(1)} mm`;
    ctx.font = `800 ${Math.round(20 * scaleFactor)}px "JetBrains Mono", monospace`;
    const rLblW = ctx.measureText(rainLabel).width;
    ctx.fillStyle = pal.accent;
    ctx.textAlign = 'right';
    ctx.fillText(rainLabel, sx + cardW - sp, sy + Math.round(cardH * 0.34));
    ctx.textAlign = 'left';

    ctx.fillStyle = pal.textMain;
    ctx.font = `700 ${Math.round(19 * scaleFactor)}px Inter, system-ui, sans-serif`;
    ctx.fillText(
      fitText(ctx, st.nome, sw - rLblW - Math.round(14 * scaleFactor)),
      sx + sp,
      sy + Math.round(cardH * 0.34)
    );

    // Barra proporcional
    const barY = sy + Math.round(cardH * 0.48);
    const barH = Math.round(9 * scaleFactor);
    roundRectPath(ctx, sx + sp, barY, sw, barH, barH / 2);
    ctx.fillStyle = pal.dark ? '#1E293B' : '#E2E8F0';
    ctx.fill();
    if (st.chuva_mm > 0) {
      const pctW = Math.max(barH * 1.4, Math.min(sw, (st.chuva_mm / maxRain) * sw));
      roundRectPath(ctx, sx + sp, barY, pctW, barH, barH / 2);
      ctx.fillStyle = pal.accent;
      ctx.fill();
    }

    // Linha inferior: Código esquerda + Vento/Rajada direita
    const metaY = sy + Math.round(cardH * 0.82);
    ctx.fillStyle = pal.textMuted;
    ctx.font = `600 ${Math.round(16 * scaleFactor)}px "JetBrains Mono", monospace`;
    ctx.fillText(st.code, sx + sp, metaY);

    const windMeta =
      st.rajada_max_kmh > 0 || st.vento_max_kmh > 0
        ? `${st.vento_max_kmh > 0 ? `Vento ${st.vento_max_kmh.toFixed(1)} · ` : ''}Raj. ${st.rajada_max_kmh.toFixed(1)} km/h`
        : 'Pluviômetro';
    ctx.textAlign = 'right';
    ctx.fillText(fitText(ctx, windMeta, sw - 90 * scaleFactor), sx + cardW - sp, metaY);
    ctx.textAlign = 'left';
  });
}

export async function exportCalendarToHighResPng(
  opts: ExportCalendarOptions
): Promise<string> {
  const { format, darkTheme, monthLabel, selectedDay, selectedStations, monthStats, siteBase = '.' } = opts;
  const dims = getCalendarExportDimensions(format);
  const W = dims.width;
  const H = dims.height;

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
  const pal = createPalette(darkTheme);

  // Fundo + brilho atmosférico sutil
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.35, 100, W * 0.5, H * 0.35, W * 0.65);
  glow.addColorStop(0, darkTheme ? 'rgba(255,130,68,0.10)' : 'rgba(14,165,233,0.06)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const is4k = format === '4k';
  const isStory = format === 'story';
  const isPost = format === 'post';
  const s = is4k ? 1.25 : isStory ? 1.05 : 1.0;

  const padX = is4k ? 110 : isStory ? 84 : 78;
  const topSafe = isStory ? 156 : is4k ? 66 : 64;
  const botSafe = isStory ? 132 : is4k ? 62 : 58;
  const contentW = W - padX * 2;
  let cursorY = topSafe;

  // Cabeçalho unificado
  const logoH = is4k ? 112 : isStory ? 116 : 98;
  if (logoImg) {
    const ratio = logoImg.width / Math.max(1, logoImg.height);
    ctx.drawImage(logoImg, padX, cursorY, logoH * ratio, logoH);
  } else {
    ctx.fillStyle = pal.textMain;
    ctx.font = `800 ${Math.round(44 * s)}px Inter, system-ui, sans-serif`;
    ctx.fillText('TEMPO EM RIO DAS OSTRAS', padX, cursorY + Math.round(62 * s));
  }

  const tagText = '@tempoemriodasostras';
  ctx.font = `700 ${Math.round(30 * s)}px "JetBrains Mono", monospace`;
  const tagPadX = Math.round(30 * s);
  const tagW = ctx.measureText(tagText).width + tagPadX * 2;
  const tagH = Math.round(58 * s);
  const tagX = W - padX - tagW;
  const tagY = cursorY + Math.round((logoH - tagH) / 2);
  roundRectPath(ctx, tagX, tagY, tagW, tagH, tagH / 2);
  ctx.fillStyle = darkTheme ? 'rgba(255,130,68,0.16)' : 'rgba(255,130,68,0.12)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = pal.accent;
  ctx.stroke();
  ctx.fillStyle = pal.accent;
  ctx.fillText(tagText, tagX + tagPadX, tagY + Math.round(39 * s));

  cursorY += logoH + Math.round(24 * s);

  ctx.fillStyle = pal.textMain;
  ctx.font = `800 ${Math.round((is4k ? 48 : 54) * (is4k ? 1.15 : 1.0))}px Inter, system-ui, sans-serif`;
  ctx.fillText('CALENDÁRIO DIÁRIO — CHUVA, VENTO & RAJADAS', padX, cursorY + Math.round(42 * s));
  cursorY += Math.round(62 * s);

  const selDateLabel = selectedDay
    ? ` · DIA SELECIONADO: ${(selectedDay.data_br || formatBrDate(selectedDay.data_iso)).toUpperCase()}`
    : '';
  ctx.fillStyle = pal.accent;
  ctx.font = `700 ${Math.round(28 * (is4k ? 1.15 : 1.0))}px "JetBrains Mono", monospace`;
  ctx.fillText(`${monthLabel.toUpperCase()}${format === 'calendar_only' ? ' · MAIORES REGISTROS DAS ESTAÇÕES' : selDateLabel}`, padX, cursorY + Math.round(24 * s));
  cursorY += Math.round(50 * s);

  if (is4k) {
    // Layout 4K Widescreen lado a lado (3840x2160)
    const bodyH = H - botSafe - Math.round(42 * s) - cursorY;
    const leftW = Math.round(contentW * 0.42);
    const colGap = 44;
    const rightX = padX + leftW + colGap;
    const rightW = contentW - leftW - colGap;

    drawCalendarGridPanel(ctx, { x: padX, y: cursorY, w: leftW, h: bodyH }, opts, pal, 1.24);

    let ry = cursorY;
    const bannerH = 128;
    drawSelectedDayBanner(ctx, { x: rightX, y: ry, w: rightW, h: bannerH }, opts, pal, 1.18);
    ry += bannerH + 26;

    const kpiH = 500;
    drawDayKpisGrid(ctx, { x: rightX, y: ry, w: rightW, h: kpiH }, opts, pal, 2, 1.18);
    ry += kpiH + 26;

    const synH = 264;
    drawSynopticCard(ctx, { x: rightX, y: ry, w: rightW, h: synH }, selectedDay, pal, 1.16);
    ry += synH + 26;

    const stH = cursorY + bodyH - ry;
    drawStationsPanel(
      ctx,
      { x: rightX, y: ry, w: rightW, h: stH },
      selectedStations,
      pal,
      2,
      selectedDay?.data_br || formatBrDate(selectedDay?.data_iso),
      1.16
    );
  } else if (isStory) {
    // Stories Vertical 9:16 (2160x3840)
    const calH = 1300;
    drawCalendarGridPanel(ctx, { x: padX, y: cursorY, w: contentW, h: calH }, opts, pal, 1.15);
    cursorY += calH + 34;

    const bannerH = 120;
    drawSelectedDayBanner(ctx, { x: padX, y: cursorY, w: contentW, h: bannerH }, opts, pal, 1.12);
    cursorY += bannerH + 26;

    const kpiH = 520;
    drawDayKpisGrid(ctx, { x: padX, y: cursorY, w: contentW, h: kpiH }, opts, pal, 2, 1.12);
    cursorY += kpiH + 26;

    const synH = 300;
    drawSynopticCard(ctx, { x: padX, y: cursorY, w: contentW, h: synH }, selectedDay, pal, 1.1);
    cursorY += synH + 26;

    const stH = H - botSafe - 46 - cursorY;
    drawStationsPanel(
      ctx,
      { x: padX, y: cursorY, w: contentW, h: stH },
      selectedStations,
      pal,
      2,
      selectedDay?.data_br || formatBrDate(selectedDay?.data_iso),
      1.1
    );
  } else if (isPost) {
    // Feed Instagram 4:5 (2160x2700)
    const calH = 1140;
    drawCalendarGridPanel(ctx, { x: padX, y: cursorY, w: contentW, h: calH }, opts, pal, 1.08);
    cursorY += calH + 26;

    const bannerH = 104;
    drawSelectedDayBanner(ctx, { x: padX, y: cursorY, w: contentW, h: bannerH }, opts, pal, 1.0);
    cursorY += bannerH + 22;

    const kpiH = 440;
    drawDayKpisGrid(ctx, { x: padX, y: cursorY, w: contentW, h: kpiH }, opts, pal, 2, 1.0);
    cursorY += kpiH + 22;

    const stH = H - botSafe - 40 - cursorY;
    drawStationsPanel(
      ctx,
      { x: padX, y: cursorY, w: contentW, h: stH },
      selectedStations,
      pal,
      3,
      selectedDay?.data_br || formatBrDate(selectedDay?.data_iso),
      0.95
    );
  } else {
    // 'calendar_only' — Calendário Mensal Ampliado Ultra-HD (2160x2700)
    const sumH = 290;
    const calH = H - botSafe - 48 - sumH - 32 - cursorY;
    drawCalendarGridPanel(ctx, { x: padX, y: cursorY, w: contentW, h: calH }, opts, pal, 1.32);
    cursorY += calH + 32;

    // Resumo mensal em 4 blocos horizontais
    const sumCols = 4;
    const gap = 20;
    const sw = (contentW - gap * (sumCols - 1)) / sumCols;
    const summaryCards = [
      {
        label: 'PICO CHUVA NO MÊS',
        val: `${(monthStats?.wettestMaxMm ?? 0).toFixed(1)} mm`,
        sub: monthStats?.wettestDayIso
          ? `${formatBrDate(monthStats.wettestDayIso).slice(0, 5)} · ${monthStats.wettestStation || 'Rede'}`
          : '--',
        accentVal: true,
      },
      {
        label: 'MAIOR RAJADA NO MÊS',
        val: `${(monthStats?.windiestMaxKmh ?? 0).toFixed(1)} km/h`,
        sub: monthStats?.windiestDayIso
          ? `${formatBrDate(monthStats.windiestDayIso).slice(0, 5)} · ${monthStats.windiestStation || 'Rede'}`
          : '--',
        accentVal: false,
      },
      {
        label: 'FREQUÊNCIA DE CHUVA',
        val: `${monthStats?.rainyDays ?? 0} / ${monthStats?.totalDays ?? 0}`,
        sub: 'dias com chuva registrada',
        accentVal: false,
      },
      {
        label: `DIA ${selectedDay ? formatBrDate(selectedDay.data_iso).slice(0, 5) : '--'}`,
        val: `${opts.selectedDayMetrics.rainMaxMm.toFixed(1)} mm`,
        sub: `Sust ${opts.selectedDayMetrics.sustMaxKmh.toFixed(1)} · Raj ${opts.selectedDayMetrics.gustMaxKmh.toFixed(1)} km/h`,
        accentVal: true,
      },
    ];

    summaryCards.forEach((sc, idx) => {
      const cx = padX + idx * (sw + gap);
      roundRectPath(ctx, cx, cursorY, sw, sumH, 22);
      ctx.fillStyle = pal.cardBg;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = pal.border;
      ctx.stroke();

      const cpad = 24;
      ctx.fillStyle = pal.textMuted;
      ctx.font = '700 20px "JetBrains Mono", monospace';
      ctx.fillText(fitText(ctx, sc.label, sw - cpad * 2), cx + cpad, cursorY + 52);

      ctx.fillStyle = sc.accentVal ? pal.accent : pal.textMain;
      ctx.font = '800 44px "JetBrains Mono", monospace';
      ctx.fillText(fitText(ctx, sc.val, sw - cpad * 2), cx + cpad, cursorY + 148);

      ctx.fillStyle = pal.textMuted;
      ctx.font = '600 20px Inter, system-ui, sans-serif';
      const lines = wrapText(ctx, sc.sub, sw - cpad * 2, 2);
      lines.forEach((l, li) => {
        ctx.fillText(l, cx + cpad, cursorY + 208 + li * 28);
      });
    });
  }

  // Rodapé padrão
  ctx.fillStyle = pal.textMuted;
  ctx.font = `600 ${Math.round(24 * (is4k ? 1.15 : 1.0))}px "JetBrains Mono", monospace`;
  ctx.fillText(
    `Atualizado em ${formatNowBrt()} BRT · Maiores registros das estações (PWS/CEMADEN/INMET) · Tempo em Rio das Ostras`,
    padX,
    H - botSafe
  );

  const monthSlug = `${opts.year}-${String(opts.month1to12).padStart(2, '0')}`;
  const daySlug = selectedDay?.data_iso || monthSlug;
  const fmtSlug =
    format === '4k'
      ? 'painel_4k_3840x2160'
      : format === 'story'
        ? 'stories_9x16'
        : format === 'post'
          ? 'post_4x5'
          : 'calendario_mensal_hd';

  return exportCanvasToPngDownload(canvas, `calendario_chuva_vento_${daySlug}_${fmtSlug}.png`);
}
