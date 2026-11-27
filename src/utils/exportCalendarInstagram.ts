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
  monthMeanTotalMm: number;
  monthMaxStationTotalMm: number;
  monthMaxStationName: string;
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
        textMuted: '#CBD5E1',
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
        textMuted: '#334155',
        accent: '#FF8244',
        rainBlue: '#0284C7',
        gridBorder: '#CBD5E1',
      };
}

function shortenStationLabel(name?: string): string {
  if (!name) return 'Rede';
  return name
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\/\s*REBIO União/i, '')
    .replace(/\s*\/\s*Extensão do Bosque/i, '')
    .replace(/\s*\/\s*Divisa Sul/i, '')
    .replace(/\s*\/\s*Escola Jacinto/i, '')
    .trim();
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
          strokeW: 5,
        }
      : {
          fill: '#14213D',
          stroke: '#FF8244',
          dayCol: '#FFFFFF',
          mmCol: '#FFB38A',
          gustCol: '#F1F5F9',
          strokeW: 5,
        };
  }
  if (mm >= 50) {
    return {
      fill: pal.dark ? 'rgba(244,63,94,0.24)' : 'rgba(244,63,94,0.14)',
      stroke: pal.dark ? 'rgba(251,113,133,0.72)' : 'rgba(225,29,72,0.58)',
      dayCol: pal.textMain,
      mmCol: pal.dark ? '#FDA4AF' : '#BE123C',
      gustCol: pal.textMuted,
      strokeW: 2.2,
    };
  }
  if (mm >= 15) {
    return {
      fill: pal.dark ? 'rgba(255,130,68,0.22)' : 'rgba(255,130,68,0.16)',
      stroke: pal.dark ? 'rgba(255,130,68,0.68)' : 'rgba(234,88,12,0.58)',
      dayCol: pal.textMain,
      mmCol: pal.dark ? '#FFA16C' : '#C2410C',
      gustCol: pal.textMuted,
      strokeW: 2.2,
    };
  }
  if (mm >= 1) {
    return {
      fill: pal.dark ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.12)',
      stroke: pal.dark ? 'rgba(56,189,248,0.55)' : 'rgba(14,165,233,0.48)',
      dayCol: pal.textMain,
      mmCol: pal.rainBlue,
      gustCol: pal.textMuted,
      strokeW: 2,
    };
  }
  return {
    fill: pal.dark ? 'rgba(15,23,42,0.72)' : '#F8FAFC',
    stroke: pal.gridBorder,
    dayCol: pal.textMain,
    mmCol: pal.textMuted,
    gustCol: pal.textMuted,
    strokeW: 1.8,
  };
}

function drawCalendarGridPanel(
  ctx: CanvasRenderingContext2D,
  box: Rect,
  opts: ExportCalendarOptions,
  pal: Palette,
  uiScale = 1
) {
  const { monthLabel, cells, dailyMap, selectedDay, monthStats, todayIso, resolveDayMetrics } = opts;
  const activeIso = selectedDay?.data_iso || '';

  roundRectPath(ctx, box.x, box.y, box.w, box.h, Math.round(28 * uiScale));
  ctx.fillStyle = pal.cardBg;
  ctx.fill();
  ctx.lineWidth = 2.8;
  ctx.strokeStyle = pal.border;
  ctx.stroke();

  const pad = Math.round(24 * uiScale);
  const innerX = box.x + pad;
  const innerW = box.w - pad * 2;
  let cy = box.y + pad;

  // Cabeçalho do Mês com Acumulado Total e Dia Mais Chuvoso em fontes grandes
  const monthH = Math.round(134 * uiScale);
  roundRectPath(ctx, innerX, cy, innerW, monthH, Math.round(16 * uiScale));
  ctx.fillStyle = pal.innerBg;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = pal.border;
  ctx.stroke();

  ctx.fillStyle = pal.textMain;
  ctx.font = `800 ${Math.round(34 * uiScale)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(monthLabel.toUpperCase(), innerX + innerW / 2, cy + Math.round(42 * uiScale));

  const mMaxTotal = Number(monthStats?.monthMaxStationTotalMm ?? 0);
  const mMeanTotal = Number(monthStats?.monthMeanTotalMm ?? 0);
  const mMaxStShort = shortenStationLabel(monthStats?.monthMaxStationName);
  const totalTxt = monthStats
    ? `Acumulado mês: ${mMaxTotal.toFixed(1)} mm máx (${mMaxStShort}) · Méd.: ${mMeanTotal.toFixed(1)} mm`
    : 'Acumulado no mês: --';
  ctx.fillStyle = pal.accent;
  ctx.font = `800 ${Math.round(23.5 * uiScale)}px Inter, system-ui, sans-serif`;
  ctx.fillText(fitText(ctx, totalTxt, innerW - 24), innerX + innerW / 2, cy + Math.round(80 * uiScale));

  const wetStShort = shortenStationLabel(monthStats?.wettestStation);
  const wetDayTxt = monthStats?.wettestDayIso
    ? `${formatBrDate(monthStats.wettestDayIso).slice(0, 5)} (${monthStats.wettestMaxMm.toFixed(1)} mm · ${wetStShort})`
    : '--';
  const wetSummary = monthStats
    ? `Dia mais chuvoso: ${wetDayTxt} · ${monthStats.rainyDays}/${monthStats.totalDays}d c/ chuva`
    : 'Série Contínua Diária';
  ctx.fillStyle = pal.textMuted;
  ctx.font = `700 ${Math.round(22 * uiScale)}px Inter, system-ui, sans-serif`;
  ctx.fillText(fitText(ctx, wetSummary, innerW - 24), innerX + innerW / 2, cy + Math.round(115 * uiScale));
  ctx.textAlign = 'left';

  cy += monthH + Math.round(18 * uiScale);

  // Cabeçalho dias da semana
  const gapX = Math.round(10 * uiScale);
  const gapY = Math.round(10 * uiScale);
  const cellW = (innerW - gapX * 6) / 7;
  const weekdayH = Math.round(32 * uiScale);

  ctx.fillStyle = pal.textMuted;
  ctx.font = `800 ${Math.round(22 * uiScale)}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  WEEKDAYS_PT.forEach((wd, i) => {
    const cx = innerX + i * (cellW + gapX) + cellW / 2;
    ctx.fillText(wd, cx, cy + Math.round(22 * uiScale));
  });
  ctx.textAlign = 'left';

  cy += weekdayH + Math.round(8 * uiScale);

  const legendH = Math.round(44 * uiScale);
  const gridAvailH = box.y + box.h - pad - legendH - cy - Math.round(10 * uiScale);
  const numRows = Math.max(4, Math.ceil(cells.length / 7));
  const cellH = Math.floor((gridAvailH - gapY * (numRows - 1)) / numRows);

  // Escala responsiva da célula de calendário
  const dayFont = Math.min(Math.round(cellH * 0.24), Math.round(cellW * 0.23), Math.round(36 * uiScale));
  const mmFont = Math.min(Math.round(cellH * 0.22), Math.round(cellW * 0.20), Math.round(33 * uiScale));
  const gustFont = Math.min(Math.round(cellH * 0.175), Math.round(cellW * 0.165), Math.round(25 * uiScale));

  for (let idx = 0; idx < cells.length; idx++) {
    const cell = cells[idx];
    const row = Math.floor(idx / 7);
    const col = idx % 7;
    const x = innerX + col * (cellW + gapX);
    const y = cy + row * (cellH + gapY);

    if (!cell) {
      roundRectPath(ctx, x, y, cellW, cellH, Math.round(14 * uiScale));
      ctx.fillStyle = pal.dark ? 'rgba(9,16,30,0.22)' : 'rgba(241,245,249,0.55)';
      ctx.fill();
      continue;
    }

    const rec = dailyMap.get(cell.dateIso);
    const metrics = resolveDayMetrics(rec);
    const isSel = cell.dateIso === activeIso;
    const hasData = Boolean(rec);
    const colors = resolveCellColors(metrics.rainMm, isSel, hasData, pal);

    roundRectPath(ctx, x, y, cellW, cellH, Math.round(14 * uiScale));
    ctx.fillStyle = colors.fill;
    ctx.fill();
    ctx.lineWidth = colors.strokeW;
    ctx.strokeStyle = colors.stroke;
    ctx.stroke();

    const innerPadX = Math.round(11 * uiScale);
    const textMaxW = cellW - innerPadX * 1.4;
    ctx.fillStyle = colors.dayCol;
    ctx.font = `800 ${dayFont}px "JetBrains Mono", monospace`;
    ctx.fillText(String(cell.dayNum), x + innerPadX, y + dayFont + Math.round(8 * uiScale));

    if (cell.dateIso === todayIso) {
      ctx.beginPath();
      ctx.arc(
        x + cellW - Math.round(16 * uiScale),
        y + Math.round(dayFont * 0.55 + 8 * uiScale),
        Math.round(7 * uiScale),
        0,
        Math.PI * 2
      );
      ctx.fillStyle = pal.accent;
      ctx.fill();
    }

    if (hasData) {
      const mmText = `${metrics.rainMm.toFixed(1)} mm`;
      ctx.fillStyle = colors.mmCol;
      ctx.font = `800 ${mmFont}px "JetBrains Mono", monospace`;
      ctx.fillText(fitText(ctx, mmText, textMaxW), x + innerPadX, y + Math.round(cellH * 0.65));

      if (metrics.gustKmh > 0) {
        const gustCol =
          !isSel && metrics.gustKmh >= 41
            ? pal.dark
              ? '#FFA16C'
              : '#C2410C'
            : colors.gustCol;
        ctx.fillStyle = gustCol;
        ctx.font = `700 ${gustFont}px "JetBrains Mono", monospace`;
        ctx.fillText(
          fitText(ctx, `${Math.round(metrics.gustKmh)} km/h`, textMaxW),
          x + innerPadX,
          y + Math.round(cellH * 0.89)
        );
      }
    } else {
      ctx.fillStyle = colors.mmCol;
      ctx.font = `700 ${mmFont}px "JetBrains Mono", monospace`;
      ctx.fillText('--', x + innerPadX, y + Math.round(cellH * 0.68));
    }
  }

  // Legenda inferior maior e mais nítida
  const legY = box.y + box.h - pad - Math.round(10 * uiScale);
  const legItems = [
    { label: '0 mm (seco)', fill: pal.dark ? '#0F172A' : '#F8FAFC', stroke: pal.gridBorder },
    { label: '1–14,9 mm', fill: 'rgba(14,165,233,0.28)', stroke: 'rgba(14,165,233,0.75)' },
    { label: '15–49,9 mm', fill: 'rgba(255,130,68,0.28)', stroke: 'rgba(255,130,68,0.85)' },
    { label: '≥ 50 mm', fill: 'rgba(244,63,94,0.28)', stroke: 'rgba(244,63,94,0.85)' },
  ];
  let lx = innerX;
  const sw = Math.round(22 * uiScale);
  ctx.font = `700 ${Math.round(21 * uiScale)}px Inter, system-ui, sans-serif`;
  for (const item of legItems) {
    roundRectPath(ctx, lx, legY - sw + Math.round(3 * uiScale), sw, sw, Math.round(5 * uiScale));
    ctx.fillStyle = item.fill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = item.stroke;
    ctx.stroke();

    ctx.fillStyle = pal.textMuted;
    ctx.fillText(item.label, lx + sw + Math.round(8 * uiScale), legY);
    lx += sw + Math.round(24 * uiScale) + ctx.measureText(item.label).width;
  }
}

function drawSelectedDayBanner(
  ctx: CanvasRenderingContext2D,
  box: Rect,
  opts: ExportCalendarOptions,
  pal: Palette,
  uiScale = 1
) {
  const { selectedDay, selectedDayMetrics } = opts;
  if (!selectedDay) return;

  roundRectPath(ctx, box.x, box.y, box.w, box.h, Math.round(22 * uiScale));
  ctx.fillStyle = pal.cardBg;
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = pal.border;
  ctx.stroke();

  const rainPlancon = classifyRainPlancon(selectedDayMetrics.rainMaxMm);
  const badgeText =
    selectedDayMetrics.rainMaxMm <= 0.1 && selectedDayMetrics.rainMean <= 0.1
      ? 'Sem chuva'
      : rainPlancon.titulo;
  ctx.font = `800 ${Math.round(23 * uiScale)}px Inter, system-ui, sans-serif`;
  const bW = Math.min(Math.round(340 * uiScale), ctx.measureText(badgeText).width + Math.round(44 * uiScale));
  const bH = Math.round(54 * uiScale);
  const bX = box.x + box.w - Math.round(24 * uiScale) - bW;
  const bY = box.y + Math.round((box.h - bH) / 2);

  roundRectPath(ctx, bX, bY, bW, bH, bH / 2);
  ctx.fillStyle = pal.dark ? 'rgba(255,130,68,0.18)' : 'rgba(255,130,68,0.14)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = pal.accent;
  ctx.stroke();

  ctx.fillStyle = pal.accent;
  ctx.textAlign = 'center';
  ctx.fillText(fitText(ctx, badgeText, bW - 20), bX + bW / 2, bY + Math.round(35 * uiScale));
  ctx.textAlign = 'left';

  const px = box.x + Math.round(28 * uiScale);
  const availLeftW = bX - px - Math.round(18 * uiScale);
  const titleTxt = `${formatWeekdayFull(selectedDay.data_iso)} — ${selectedDay.data_br || formatBrDate(selectedDay.data_iso)}`;
  ctx.fillStyle = pal.textMain;
  ctx.font = `800 ${Math.round(36 * uiScale)}px Inter, system-ui, sans-serif`;
  ctx.fillText(fitText(ctx, titleTxt, availLeftW), px, box.y + Math.round(50 * uiScale));

  const subParts = [
    selectedDay.horas_registradas ? `${selectedDay.horas_registradas}h monitoradas` : 'Monitoramento contínuo',
    selectedDay.horas_com_chuva !== undefined ? `${selectedDay.horas_com_chuva}h com chuva` : '',
    selectedDay.is_live_today ? 'AO VIVO HOJE' : '',
  ].filter(Boolean);
  ctx.fillStyle = pal.textMuted;
  ctx.font = `700 ${Math.round(22 * uiScale)}px "JetBrains Mono", monospace`;
  ctx.fillText(fitText(ctx, subParts.join(' · '), availLeftW), px, box.y + Math.round(86 * uiScale));
}

function drawDayKpisGrid(
  ctx: CanvasRenderingContext2D,
  box: Rect,
  opts: ExportCalendarOptions,
  pal: Palette,
  cols: 2 | 4,
  uiScale = 1
) {
  const { selectedDay, selectedDayMetrics } = opts;
  if (!selectedDay) return;

  const rows = cols === 4 ? 1 : 2;
  const gap = Math.round(16 * uiScale);
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
      sub: `${selectedDayMetrics.rainMaxMm > 0 ? selectedDayMetrics.rainMaxStation : 'Sem registro na rede'}${picoHoraStr}`,
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
          ? `${shortenStationLabel(selectedDayMetrics.sustMaxStation)}${
              selectedDay.vento_vel_max_horario && selectedDay.vento_vel_max_horario !== '--'
                ? ` às ${selectedDay.vento_vel_max_horario}`
                : ''
            } · `
          : ''
      }Pred.: ${selectedDay.vento_dir_predominante || '--'} · Méd.: ${Number(selectedDay.vento_vel_media_kmh ?? 0).toFixed(1)}`,
    },
    {
      label: 'RAJADA MÁXIMA DO DIA',
      val: selectedDayMetrics.gustMaxKmh > 0 ? `${selectedDayMetrics.gustMaxKmh.toFixed(1)} km/h` : '--',
      valColor: selectedDayMetrics.gustMaxKmh >= 41 ? pal.accent : pal.textMain,
      sub:
        selectedDayMetrics.gustMaxKmh > 0
          ? `${shortenStationLabel(selectedDayMetrics.gustMaxStation)}${
              selectedDay.vento_rajada_max_horario && selectedDay.vento_rajada_max_horario !== '--'
                ? ` às ${selectedDay.vento_rajada_max_horario}`
                : ''
            } · ${windPlancon.gustTitulo}`
          : 'Sem rajada registrada',
    },
  ];

  const lblFont = Math.round(21 * uiScale);
  const valFont = Math.min(Math.round(cardH * 0.27), Math.round(54 * uiScale));
  const subFont = Math.round(21 * uiScale);

  cards.forEach((c, idx) => {
    const colIdx = idx % cols;
    const rowIdx = Math.floor(idx / cols);
    const x = box.x + colIdx * (cardW + gap);
    const y = box.y + rowIdx * (cardH + gap);

    roundRectPath(ctx, x, y, cardW, cardH, Math.round(20 * uiScale));
    ctx.fillStyle = pal.cardBg;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = pal.border;
    ctx.stroke();

    const px = x + Math.round(24 * uiScale);
    const innerW = cardW - Math.round(48 * uiScale);

    ctx.fillStyle = pal.textMuted;
    ctx.font = `800 ${lblFont}px "JetBrains Mono", monospace`;
    ctx.fillText(fitText(ctx, c.label, innerW), px, y + Math.round(cardH * 0.22));

    ctx.fillStyle = c.valColor;
    ctx.font = `800 ${valFont}px "JetBrains Mono", monospace`;
    ctx.fillText(fitText(ctx, c.val, innerW), px, y + Math.round(cardH * 0.56));

    ctx.fillStyle = pal.textMuted;
    ctx.font = `600 ${subFont}px Inter, system-ui, sans-serif`;
    const subLines = wrapText(ctx, c.sub, innerW, 2);
    subLines.forEach((line, li) => {
      ctx.fillText(line, px, y + Math.round(cardH * 0.77) + li * Math.round(subFont * 1.22));
    });
  });
}

function drawSynopticCard(
  ctx: CanvasRenderingContext2D,
  box: Rect,
  selectedDay: HistoricoResumoDiario | null,
  pal: Palette,
  uiScale = 1
) {
  if (!selectedDay) return;
  roundRectPath(ctx, box.x, box.y, box.w, box.h, Math.round(20 * uiScale));
  ctx.fillStyle = pal.cardBg;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = pal.border;
  ctx.stroke();

  const px = box.x + Math.round(26 * uiScale);
  const innerW = box.w - Math.round(52 * uiScale);
  const lineH = Math.round(30 * uiScale);
  let cy = box.y + Math.round(38 * uiScale);

  const metrics: string[] = [];
  if (selectedDay.temp_min_c !== undefined && selectedDay.temp_max_c !== undefined) {
    metrics.push(`Temp.: ${Number(selectedDay.temp_min_c).toFixed(1)}°–${Number(selectedDay.temp_max_c).toFixed(1)}°C`);
  }
  if (selectedDay.umidade_media_pct !== undefined) {
    metrics.push(`Umid.: ${Math.round(Number(selectedDay.umidade_media_pct))}%`);
  }
  if (selectedDay.pressao_min_hpa !== undefined && selectedDay.pressao_max_hpa !== undefined) {
    metrics.push(`Press.: ${Number(selectedDay.pressao_min_hpa).toFixed(1)}–${Number(selectedDay.pressao_max_hpa).toFixed(1)} hPa`);
  }
  if (metrics.length > 0) {
    ctx.fillStyle = pal.textMain;
    ctx.font = `700 ${Math.round(23 * uiScale)}px "JetBrains Mono", monospace`;
    ctx.fillText(fitText(ctx, metrics.join(' · '), innerW), px, cy);
    cy += Math.round(36 * uiScale);
  }

  if (selectedDay.sistema_atuante_dia) {
    ctx.fillStyle = pal.accent;
    ctx.font = `700 ${Math.round(23 * uiScale)}px Inter, system-ui, sans-serif`;
    const sysLines = wrapText(ctx, `Sistema: ${selectedDay.sistema_atuante_dia}`, innerW, 2);
    sysLines.forEach((line) => {
      ctx.fillText(line, px, cy);
      cy += lineH;
    });
    cy += Math.round(4 * uiScale);
  }

  if (selectedDay.caracteristicas_dia) {
    ctx.fillStyle = pal.textMuted;
    ctx.font = `500 ${Math.round(21 * uiScale)}px Inter, system-ui, sans-serif`;
    const bodyLH = Math.round(28 * uiScale);
    const maxLines = Math.max(1, Math.floor((box.y + box.h - 14 - cy) / bodyLH));
    const descLines = wrapText(ctx, selectedDay.caracteristicas_dia, innerW, Math.min(3, maxLines));
    descLines.forEach((line) => {
      ctx.fillText(line, px, cy);
      cy += bodyLH;
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
  uiScale = 1
) {
  roundRectPath(ctx, box.x, box.y, box.w, box.h, Math.round(22 * uiScale));
  ctx.fillStyle = pal.cardBg;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = pal.border;
  ctx.stroke();

  const pad = Math.round(22 * uiScale);
  const innerW = box.w - pad * 2;
  const px = box.x + pad;
  const titleY = box.y + Math.round(38 * uiScale);

  ctx.fillStyle = pal.textMain;
  ctx.font = `800 ${Math.round(25 * uiScale)}px Inter, system-ui, sans-serif`;
  ctx.fillText(
    fitText(ctx, `Maiores Registros por Estação (${dateBr})`, innerW - 180 * uiScale),
    px,
    titleY
  );

  ctx.fillStyle = pal.textMuted;
  ctx.font = `700 ${Math.round(21 * uiScale)}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'right';
  ctx.fillText(`${stations.length} estações`, box.x + box.w - pad, titleY);
  ctx.textAlign = 'left';

  const visible = stations.slice(0, 6);
  const rows = Math.max(1, Math.ceil(visible.length / cols));
  const gap = Math.round(14 * uiScale);
  const gridY = box.y + Math.round(58 * uiScale);
  const gridH = box.y + box.h - pad - gridY;
  const cardW = (innerW - gap * (cols - 1)) / cols;
  const cardH = (gridH - gap * (rows - 1)) / rows;
  const maxRain = Math.max(0.1, ...visible.map((s) => s.chuva_mm));

  const nameFont = cols === 3 ? Math.round(22 * uiScale) : Math.round(25 * uiScale);
  const valFont = cols === 3 ? Math.round(23 * uiScale) : Math.round(26 * uiScale);
  const metaFont = cols === 3 ? Math.round(19 * uiScale) : Math.round(22 * uiScale);

  visible.forEach((st, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const sx = px + col * (cardW + gap);
    const sy = gridY + row * (cardH + gap);

    roundRectPath(ctx, sx, sy, cardW, cardH, Math.round(14 * uiScale));
    ctx.fillStyle = pal.innerBg;
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = pal.gridBorder;
    ctx.stroke();

    const sp = Math.round(16 * uiScale);
    const sw = cardW - sp * 2;

    const rainLabel = `${st.chuva_mm.toFixed(1)} mm`;
    ctx.font = `800 ${valFont}px "JetBrains Mono", monospace`;
    const rLblW = ctx.measureText(rainLabel).width;
    ctx.fillStyle = pal.accent;
    ctx.textAlign = 'right';
    ctx.fillText(rainLabel, sx + cardW - sp, sy + Math.round(cardH * 0.36));
    ctx.textAlign = 'left';

    ctx.fillStyle = pal.textMain;
    ctx.font = `700 ${nameFont}px Inter, system-ui, sans-serif`;
    ctx.fillText(
      fitText(ctx, st.nome, sw - rLblW - Math.round(12 * uiScale)),
      sx + sp,
      sy + Math.round(cardH * 0.36)
    );

    // Barra proporcional
    const barY = sy + Math.round(cardH * 0.50);
    const barH = Math.round(11 * uiScale);
    roundRectPath(ctx, sx + sp, barY, sw, barH, barH / 2);
    ctx.fillStyle = pal.dark ? '#1E293B' : '#E2E8F0';
    ctx.fill();
    if (st.chuva_mm > 0) {
      const pctW = Math.max(barH * 1.4, Math.min(sw, (st.chuva_mm / maxRain) * sw));
      roundRectPath(ctx, sx + sp, barY, pctW, barH, barH / 2);
      ctx.fillStyle = pal.accent;
      ctx.fill();
    }

    // Linha inferior com fonte ampla e nítida
    const metaY = sy + Math.round(cardH * 0.85);
    ctx.fillStyle = pal.textMuted;
    ctx.font = `700 ${metaFont}px "JetBrains Mono", monospace`;
    const codeW = ctx.measureText(st.code).width;
    ctx.fillText(st.code, sx + sp, metaY);

    const windMeta =
      st.rajada_max_kmh > 0 || st.vento_max_kmh > 0
        ? `${st.vento_max_kmh > 0 ? `V:${st.vento_max_kmh.toFixed(1)} · ` : ''}R:${st.rajada_max_kmh.toFixed(1)} km/h`
        : 'Pluviômetro';
    ctx.textAlign = 'right';
    ctx.fillText(
      fitText(ctx, windMeta, sw - codeW - Math.round(10 * uiScale)),
      sx + cardW - sp,
      metaY
    );
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

  // Escala proporcional real à largura de destino (3840px ~ 1.48x, 2160px ~ 1.0x)
  const hs = is4k ? 1.48 : isStory ? 1.08 : 1.04;

  const padX = is4k ? 96 : 68;
  const topSafe = isStory ? 148 : is4k ? 58 : 56;
  const botSafe = isStory ? 116 : is4k ? 54 : 52;
  const contentW = W - padX * 2;
  let cursorY = topSafe;

  // Cabeçalho principal com letras grandes
  const logoH = is4k ? 136 : isStory ? 124 : 108;
  if (logoImg) {
    const ratio = logoImg.width / Math.max(1, logoImg.height);
    ctx.drawImage(logoImg, padX, cursorY, logoH * ratio, logoH);
  } else {
    ctx.fillStyle = pal.textMain;
    ctx.font = `800 ${Math.round(52 * hs)}px Inter, system-ui, sans-serif`;
    ctx.fillText('TEMPO EM RIO DAS OSTRAS', padX, cursorY + Math.round(72 * hs));
  }

  const tagText = '@tempoemriodasostras';
  ctx.font = `700 ${Math.round(32 * hs)}px "JetBrains Mono", monospace`;
  const tagPadX = Math.round(28 * hs);
  const tagW = ctx.measureText(tagText).width + tagPadX * 2;
  const tagH = Math.round(62 * hs);
  const tagX = W - padX - tagW;
  const tagY = cursorY + Math.round((logoH - tagH) / 2);
  roundRectPath(ctx, tagX, tagY, tagW, tagH, tagH / 2);
  ctx.fillStyle = darkTheme ? 'rgba(255,130,68,0.16)' : 'rgba(255,130,68,0.12)';
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = pal.accent;
  ctx.stroke();
  ctx.fillStyle = pal.accent;
  ctx.fillText(tagText, tagX + tagPadX, tagY + Math.round(42 * hs));

  cursorY += logoH + Math.round(20 * hs);

  ctx.fillStyle = pal.textMain;
  ctx.font = `800 ${Math.round(54 * hs)}px Inter, system-ui, sans-serif`;
  ctx.fillText(
    fitText(ctx, 'CALENDÁRIO DIÁRIO — CHUVA, VENTO & RAJADAS', contentW),
    padX,
    cursorY + Math.round(44 * hs)
  );
  cursorY += Math.round(62 * hs);

  const selDateLabel = selectedDay
    ? ` · DIA SELECIONADO: ${(selectedDay.data_br || formatBrDate(selectedDay.data_iso)).toUpperCase()}`
    : '';
  ctx.fillStyle = pal.accent;
  ctx.font = `800 ${Math.round(30 * hs)}px "JetBrains Mono", monospace`;
  ctx.fillText(
    fitText(
      ctx,
      `${monthLabel.toUpperCase()}${format === 'calendar_only' ? ' · MAIORES REGISTROS DAS ESTAÇÕES' : selDateLabel}`,
      contentW
    ),
    padX,
    cursorY + Math.round(26 * hs)
  );
  cursorY += Math.round(48 * hs);

  if (is4k) {
    // Painel 4K (3840x2160) com escalas maiores e leitura imediata
    const bodyH = H - botSafe - 62 - cursorY;
    const leftW = Math.round(contentW * 0.46);
    const colGap = 42;
    const rightX = padX + leftW + colGap;
    const rightW = contentW - leftW - colGap;

    drawCalendarGridPanel(ctx, { x: padX, y: cursorY, w: leftW, h: bodyH }, opts, pal, 1.38);

    let ry = cursorY;
    const bannerH = 148;
    drawSelectedDayBanner(ctx, { x: rightX, y: ry, w: rightW, h: bannerH }, opts, pal, 1.36);
    ry += bannerH + 24;

    const kpiH = 510;
    drawDayKpisGrid(ctx, { x: rightX, y: ry, w: rightW, h: kpiH }, opts, pal, 2, 1.34);
    ry += kpiH + 24;

    const synH = 266;
    drawSynopticCard(ctx, { x: rightX, y: ry, w: rightW, h: synH }, selectedDay, pal, 1.32);
    ry += synH + 24;

    const stH = cursorY + bodyH - ry;
    drawStationsPanel(
      ctx,
      { x: rightX, y: ry, w: rightW, h: stH },
      selectedStations,
      pal,
      2,
      selectedDay?.data_br || formatBrDate(selectedDay?.data_iso),
      1.32
    );
  } else if (isStory) {
    // Stories Vertical 9:16 (2160x3840)
    const calH = 1380;
    drawCalendarGridPanel(ctx, { x: padX, y: cursorY, w: contentW, h: calH }, opts, pal, 1.24);
    cursorY += calH + 28;

    const bannerH = 134;
    drawSelectedDayBanner(ctx, { x: padX, y: cursorY, w: contentW, h: bannerH }, opts, pal, 1.2);
    cursorY += bannerH + 24;

    const kpiH = 530;
    drawDayKpisGrid(ctx, { x: padX, y: cursorY, w: contentW, h: kpiH }, opts, pal, 2, 1.22);
    cursorY += kpiH + 24;

    const synH = 290;
    drawSynopticCard(ctx, { x: padX, y: cursorY, w: contentW, h: synH }, selectedDay, pal, 1.18);
    cursorY += synH + 24;

    const stH = H - botSafe - 56 - cursorY;
    drawStationsPanel(
      ctx,
      { x: padX, y: cursorY, w: contentW, h: stH },
      selectedStations,
      pal,
      2,
      selectedDay?.data_br || formatBrDate(selectedDay?.data_iso),
      1.18
    );
  } else if (isPost) {
    // Feed Instagram 4:5 (2160x2700)
    const calH = 1130;
    drawCalendarGridPanel(ctx, { x: padX, y: cursorY, w: contentW, h: calH }, opts, pal, 1.12);
    cursorY += calH + 22;

    const bannerH = 118;
    drawSelectedDayBanner(ctx, { x: padX, y: cursorY, w: contentW, h: bannerH }, opts, pal, 1.08);
    cursorY += bannerH + 20;

    const kpiH = 446;
    drawDayKpisGrid(ctx, { x: padX, y: cursorY, w: contentW, h: kpiH }, opts, pal, 2, 1.1);
    cursorY += kpiH + 20;

    const stH = H - botSafe - 50 - cursorY;
    drawStationsPanel(
      ctx,
      { x: padX, y: cursorY, w: contentW, h: stH },
      selectedStations,
      pal,
      3,
      selectedDay?.data_br || formatBrDate(selectedDay?.data_iso),
      1.04
    );
  } else {
    // 'calendar_only' — Calendário Mensal Ampliado Ultra-HD (2160x2700)
    const sumH = 340;
    const calH = H - botSafe - 56 - sumH - 28 - cursorY;
    drawCalendarGridPanel(ctx, { x: padX, y: cursorY, w: contentW, h: calH }, opts, pal, 1.38);
    cursorY += calH + 28;

    const sumCols = 4;
    const gap = 20;
    const sw = (contentW - gap * (sumCols - 1)) / sumCols;
    const summaryCards = [
      {
        label: 'ACUMULADO NO MÊS',
        val: `${(monthStats?.monthMaxStationTotalMm ?? 0).toFixed(1)} mm`,
        sub: `${shortenStationLabel(monthStats?.monthMaxStationName)} · Méd.: ${(monthStats?.monthMeanTotalMm ?? 0).toFixed(1)} mm`,
        accentVal: true,
      },
      {
        label: 'DIA MAIS CHUVOSO',
        val: monthStats?.wettestDayIso ? formatBrDate(monthStats.wettestDayIso).slice(0, 5) : '--',
        sub: `${(monthStats?.wettestMaxMm ?? 0).toFixed(1)} mm · ${shortenStationLabel(monthStats?.wettestStation)}`,
        accentVal: false,
      },
      {
        label: 'MAIOR RAJADA MÊS',
        val: `${(monthStats?.windiestMaxKmh ?? 0).toFixed(1)} km/h`,
        sub: monthStats?.windiestDayIso
          ? `${formatBrDate(monthStats.windiestDayIso).slice(0, 5)} · ${shortenStationLabel(monthStats.windiestStation)}`
          : '--',
        accentVal: false,
      },
      {
        label: `DIA ${selectedDay ? formatBrDate(selectedDay.data_iso).slice(0, 5) : '--'} (${monthStats?.rainyDays ?? 0}/${monthStats?.totalDays ?? 0}d)`,
        val: `${opts.selectedDayMetrics.rainMaxMm.toFixed(1)} mm`,
        sub: `Sust ${opts.selectedDayMetrics.sustMaxKmh.toFixed(1)} · Raj ${opts.selectedDayMetrics.gustMaxKmh.toFixed(1)} km/h`,
        accentVal: true,
      },
    ];

    summaryCards.forEach((sc, idx) => {
      const cx = padX + idx * (sw + gap);
      roundRectPath(ctx, cx, cursorY, sw, sumH, 24);
      ctx.fillStyle = pal.cardBg;
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = pal.border;
      ctx.stroke();

      const cpad = 24;
      ctx.fillStyle = pal.textMuted;
      ctx.font = '800 24px "JetBrains Mono", monospace';
      ctx.fillText(fitText(ctx, sc.label, sw - cpad * 2), cx + cpad, cursorY + 56);

      ctx.fillStyle = sc.accentVal ? pal.accent : pal.textMain;
      ctx.font = '800 58px "JetBrains Mono", monospace';
      ctx.fillText(fitText(ctx, sc.val, sw - cpad * 2), cx + cpad, cursorY + 174);

      ctx.fillStyle = pal.textMuted;
      ctx.font = '700 25px Inter, system-ui, sans-serif';
      const lines = wrapText(ctx, sc.sub, sw - cpad * 2, 2);
      lines.forEach((l, li) => {
        ctx.fillText(l, cx + cpad, cursorY + 246 + li * 34);
      });
    });
  }

  // Rodapé grande e nítido com crédito oficial
  ctx.fillStyle = pal.textMuted;
  ctx.font = `700 ${is4k ? 38 : 28}px Inter, system-ui, sans-serif`;
  const footerTxt = `Fonte: Dados retirados das estações meteorológicas da Defesa Civil de Rio das Ostras · Atualizado em ${formatNowBrt()} BRT`;
  ctx.fillText(fitText(ctx, footerTxt, contentW), padX, H - botSafe);

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
