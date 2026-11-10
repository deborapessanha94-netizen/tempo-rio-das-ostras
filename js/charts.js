/**
 * Gerenciamento de gráficos interativos com Chart.js
 * Alto Contraste + Sistema de Zoom, Divisórias Diárias e Rótulos Diretos (v201)
 * Rio das Ostras (RJ)
 */

import { calculatePrecipitableWater, getLocalHourIndex } from './api.js';

let activeChart = null;

export function renderHourlyChart(canvas, metric, hourlyData) {
  if (!canvas || !hourlyData || !hourlyData.time) return;

  if (canvas._activeChart) {
    canvas._activeChart.destroy();
    canvas._activeChart = null;
  }

  const ctx = canvas.getContext('2d');
  const startIndex = getLocalHourIndex(hourlyData.time);
  const count = 24; // 24 Horas
  const times = hourlyData.time.slice(startIndex, startIndex + count);
  const labels = times.map(t => {
    const d = new Date(t);
    return `${String(d.getHours()).padStart(2, '0')}:00`;
  });

  const chartConfig = buildChartConfig(metric, startIndex, count, hourlyData, labels, ctx);
  const instance = new Chart(ctx, chartConfig);
  canvas._activeChart = instance;
  activeChart = instance;
}

function getColors() {
  const isDark = typeof document !== 'undefined' && document.documentElement && document.documentElement.classList.contains('dark');
  if (isDark) {
    return {
      primary: '#94a3b8',        /* Slate Claro */
      secondary: '#f07a53',      /* Laranja Vibrante da Paleta */
      tertiary: '#cbd5e1',       /* Slate Médio */
      rain: '#38bdf8',           /* Azul Chuva Vibrante */
      rainFill: 'rgba(56, 189, 248, 0.45)',
      rainBorder: '#0284c7',
      barFill: 'rgba(148, 163, 184, 0.35)',
      barBorder: '#94a3b8',
      gradStart: 'rgba(148, 163, 184, 0.28)',
      gradEnd: 'rgba(148, 163, 184, 0.02)',
      text: '#f8fafc',           /* Texto Branco Puro */
      textMuted: '#cbd5e1',      /* Texto Slate Claro */
      grid: 'rgba(51, 65, 85, 0.45)' /* Linhas de grade sutis dark */
    };
  }
  return {
    primary: '#334155',        /* Cinza Escuro Slate */
    secondary: '#ea580c',      /* Laranja Vibrante da Paleta */
    tertiary: '#64748b',       /* Cinza Médio */
    rain: '#0284c7',           /* Azul Chuva */
    rainFill: 'rgba(2, 132, 199, 0.80)', /* Azul Chuva Preenchimento */
    rainBorder: '#0369a1',     /* Azul Escuro Borda */
    barFill: 'rgba(100, 116, 139, 0.45)', /* Cinza para Barras */
    barBorder: '#334155',      /* Borda Cinza */
    gradStart: 'rgba(51, 65, 85, 0.22)',  /* Gradiente Cinza Suave */
    gradEnd: 'rgba(51, 65, 85, 0.02)',
    text: '#000000',           /* Texto 100% Preto */
    textMuted: '#000000',      /* Texto 100% Preto */
    grid: 'rgba(226, 232, 240, 0.85)' /* Linhas de grade suaves */
  };
}

function buildChartConfig(metric, startIndex, count, hourlyData, labels, ctx) {
  const c = getColors();

  // Gráfico de Temperatura
  if (metric === 'temperature') {
    const tempSlice = hourlyData.temperature_2m.slice(startIndex, startIndex + count);
    const appTempSlice = hourlyData.apparent_temperature.slice(startIndex, startIndex + count);

    const gradTemp = ctx.createLinearGradient(0, 0, 0, 280);
    gradTemp.addColorStop(0, c.gradStart);
    gradTemp.addColorStop(1, c.gradEnd);

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Temperatura (°C)',
            data: tempSlice,
            borderColor: c.primary,
            backgroundColor: gradTemp,
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: c.primary,
            pointRadius: 3
          },
          {
            label: 'Sensação Térmica (°C)',
            data: appTempSlice,
            borderColor: c.secondary,
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.35,
            fill: false,
            pointBackgroundColor: c.secondary,
            pointRadius: 2
          }
        ]
      },
      options: getCommonOptions('Temperatura (°C)')
    };
  }

  // Gráfico de Precipitação & Água Precipitável (VIME)
  if (metric === 'precipitation') {
    const probSlice = hourlyData.precipitation_probability.slice(startIndex, startIndex + count);
    const rainSlice = hourlyData.precipitation.slice(startIndex, startIndex + count);
    const pwSlice = (hourlyData.dew_point_2m || []).slice(startIndex, startIndex + count).map(dp => calculatePrecipitableWater(dp));

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Volume Chuva (mm)',
            data: rainSlice,
            backgroundColor: c.rainFill,
            borderColor: c.rainBorder,
            borderWidth: 1.5,
            borderRadius: 4,
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'Probabilidade (%)',
            data: probSlice,
            borderColor: '#2563eb',
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.3,
            yAxisID: 'y1',
            pointRadius: 2.5
          },
          {
            type: 'line',
            label: 'Água Precipitável VIME (mm)',
            data: pwSlice,
            borderColor: '#0284c7',
            borderWidth: 2,
            borderDash: [4, 4],
            tension: 0.3,
            yAxisID: 'y',
            pointRadius: 2
          }
        ]
      },
      options: {
        ...getCommonOptions(''),
        scales: {
          x: getXAxisConfig(),
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Volume / Água Precipitável (mm)', color: c.text },
            grid: { color: c.grid },
            ticks: { color: c.text, font: { weight: '600' } },
            min: 0
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Probabilidade (%)', color: c.textMuted },
            grid: { drawOnChartArea: false },
            ticks: { color: c.textMuted },
            min: 0,
            max: 100
          }
        }
      }
    };
  }

  // Gráfico de Ventos & Rajadas
  if (metric === 'wind') {
    const windSlice = hourlyData.wind_speed_10m.slice(startIndex, startIndex + count);
    const gustsSlice = hourlyData.wind_gusts_10m ? hourlyData.wind_gusts_10m.slice(startIndex, startIndex + count) : [];

    const gradWind = ctx.createLinearGradient(0, 0, 0, 280);
    gradWind.addColorStop(0, c.gradStart);
    gradWind.addColorStop(1, c.gradEnd);

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Velocidade do Vento (km/h)',
            data: windSlice,
            borderColor: c.primary,
            backgroundColor: gradWind,
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: c.primary,
            pointRadius: 3
          },
          {
            label: 'Rajadas Máximas (km/h)',
            data: gustsSlice,
            borderColor: c.secondary,
            borderWidth: 2,
            borderDash: [4, 4],
            tension: 0.35,
            fill: false,
            pointBackgroundColor: c.secondary,
            pointRadius: 2
          }
        ]
      },
      options: getCommonOptions('Velocidade (km/h)')
    };
  }

  // Gráfico de Pressão Barométrica
  if (metric === 'pressure') {
    const pressureSlice = (hourlyData.pressure_msl || hourlyData.surface_pressure).slice(startIndex, startIndex + count);

    const gradPress = ctx.createLinearGradient(0, 0, 0, 280);
    gradPress.addColorStop(0, c.gradStart);
    gradPress.addColorStop(1, c.gradEnd);

    const minPress = Math.min(...pressureSlice) - 2;
    const maxPress = Math.max(...pressureSlice) + 2;

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Pressão ao Nível do Mar (hPa)',
            data: pressureSlice,
            borderColor: c.secondary,
            backgroundColor: gradPress,
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: c.secondary,
            pointBorderColor: c.primary,
            pointRadius: 3.5
          }
        ]
      },
      options: {
        ...getCommonOptions('Pressão (hPa)'),
        scales: {
          x: getXAxisConfig(),
          y: {
            title: { display: true, text: 'Pressão (hPa)', color: c.text },
            grid: { color: c.grid },
            ticks: { color: c.text, font: { weight: '600' } },
            min: Math.floor(minPress),
            max: Math.ceil(maxPress)
          }
        }
      }
    };
  }

  // Gráfico de Umidade e Ponto de Orvalho
  if (metric === 'humidity') {
    const humSlice = hourlyData.relative_humidity_2m.slice(startIndex, startIndex + count);
    const dewSlice = hourlyData.dew_point_2m ? hourlyData.dew_point_2m.slice(startIndex, startIndex + count) : [];

    const gradHum = ctx.createLinearGradient(0, 0, 0, 280);
    gradHum.addColorStop(0, c.gradStart);
    gradHum.addColorStop(1, c.gradEnd);

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Umidade Relativa (%)',
            data: humSlice,
            borderColor: c.primary,
            backgroundColor: gradHum,
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: c.primary,
            pointRadius: 3
          },
          {
            label: 'Ponto de Orvalho (°C)',
            data: dewSlice,
            borderColor: c.secondary,
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.35,
            fill: false,
            pointRadius: 2
          }
        ]
      },
      options: {
        ...getCommonOptions('Umidade (%)'),
        scales: {
          x: getXAxisConfig(),
          y: {
            title: { display: true, text: 'Umidade / Ponto de Orvalho', color: c.text },
            grid: { color: c.grid },
            ticks: { color: c.text, font: { weight: '600' } },
            min: 0,
            max: 100
          }
        }
      }
    };
  }

  return {};
}

function getCommonOptions(yTitle) {
  const c = getColors();

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          color: c.text,
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '700' },
          usePointStyle: true,
          boxWidth: 9,
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#000000',
        bodyColor: '#000000',
        borderColor: '#000000',
        borderWidth: 1.5,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        cornerRadius: 8,
        titleFont: { size: 13, weight: '700' },
        bodyFont: { size: 12, weight: '600' }
      }
    },
    scales: {
      x: getXAxisConfig(),
      y: {
        title: { display: !!yTitle, text: yTitle, color: c.text },
        grid: { color: c.grid },
        ticks: { color: c.text, font: { size: 11, family: "'JetBrains Mono', monospace", weight: '600' } }
      }
    }
  };
}

function getXAxisConfig(unCrowded = false) {
  const c = getColors();
  return {
    grid: { color: c.grid },
    ticks: {
      color: c.text,
      autoSkip: !unCrowded,
      maxTicksLimit: unCrowded ? 64 : 10,
      maxRotation: 0,
      minRotation: 0,
      padding: 6,
      font: {
        size: unCrowded ? 10.5 : 10,
        family: "'JetBrains Mono', monospace",
        weight: '700'
      }
    }
  };
}

function formatShortDateBr(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}`;
}

function formatShiftShort(turno) {
  const map = {
    'Madrugada': 'Madrug.',
    'Manhã': 'Manhã',
    'Tarde': 'Tarde',
    'Noite': 'Noite'
  };
  return map[turno] || turno;
}

/**
 * Plugin customizado para desenhar:
 * 1) Faixas alternadas sutis por dia + linha divisória vertical entre dias + selo da data no topo
 * 2) Rótulos diretos de valores sobre pontos/barras quando o zoom ou toggle de valores está ativo
 */
const bulletinEnhancerPlugin = {
  id: 'bulletinEnhancerPlugin',
  beforeDatasetsDraw(chart, args, pluginOptions) {
    if (!pluginOptions || !pluginOptions.rows || !pluginOptions.rows.length) return;
    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !scales || !scales.x) return;

    const rows = pluginOptions.rows;
    const xScale = scales.x;

    ctx.save();

    // Agrupa índices por dia (data_iso)
    const dayGroups = [];
    let currentGroup = null;
    rows.forEach((r, idx) => {
      const key = r.data_iso || r.dia_semana;
      if (!currentGroup || currentGroup.key !== key) {
        currentGroup = {
          key,
          diaSemana: r.dia_semana || '',
          shortDate: formatShortDateBr(r.data_iso),
          startIndex: idx,
          endIndex: idx
        };
        dayGroups.push(currentGroup);
      } else {
        currentGroup.endIndex = idx;
      }
    });

    const stepHalf = rows.length > 1
      ? Math.abs(xScale.getPixelForValue(1) - xScale.getPixelForValue(0)) / 2
      : (chartArea.right - chartArea.left) / 2;

    dayGroups.forEach((grp, gIdx) => {
      const xStart = Math.max(chartArea.left, xScale.getPixelForValue(grp.startIndex) - stepHalf);
      const xEnd = Math.min(chartArea.right, xScale.getPixelForValue(grp.endIndex) + stepHalf);

      // Faixa de fundo alternada sutil por dia para separar visualmente os 8 dias
      if (gIdx % 2 === 1) {
        ctx.fillStyle = 'rgba(226, 232, 240, 0.28)';
        ctx.fillRect(xStart, chartArea.top, xEnd - xStart, chartArea.bottom - chartArea.top);
      }

      // Linha divisória vertical no início de cada novo dia
      if (gIdx > 0) {
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.25;
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)';
        ctx.moveTo(xStart, chartArea.top);
        ctx.lineTo(xStart, chartArea.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Selo do Dia no topo de cada grupo diário
      const groupWidth = xEnd - xStart;
      if (groupWidth >= 56) {
        const dayShort = (grp.diaSemana || '').substring(0, 3).toUpperCase();
        const badgeText = grp.shortDate ? `${dayShort} ${grp.shortDate}` : dayShort;
        const centerX = (xStart + xEnd) / 2;
        const badgeY = chartArea.top + 11;

        ctx.font = "800 9.5px 'JetBrains Mono', monospace";
        const textWidth = ctx.measureText(badgeText).width;
        const padX = 7;
        const boxW = textWidth + padX * 2;
        const boxH = 16;

        if (boxW <= groupWidth - 4) {
          ctx.fillStyle = gIdx % 2 === 0 ? 'rgba(241, 245, 249, 0.94)' : 'rgba(226, 232, 240, 0.96)';
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(centerX - boxW / 2, badgeY - boxH / 2, boxW, boxH, 4);
          } else {
            ctx.rect(centerX - boxW / 2, badgeY - boxH / 2, boxW, boxH);
          }
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#0f172a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, centerX, badgeY + 0.5);
        }
      }
    });

    ctx.restore();
  },

  afterDatasetsDraw(chart, args, pluginOptions) {
    if (!pluginOptions || !pluginOptions.showValues) return;
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    const metric = pluginOptions.metric;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (!meta || meta.hidden) return;

      // No gráfico de Temperatura, exibe os selos de Máxima (idx 0) e Mínima (idx 1) sem sobrepor a Sensação (idx 2)
      if (metric === 'temperature' && datasetIndex === 2) {
        return;
      }

      meta.data.forEach((element, index) => {
        const rawVal = dataset.data[index];
        if (rawVal === null || rawVal === undefined || isNaN(rawVal)) return;

        const pos = element.tooltipPosition ? element.tooltipPosition() : { x: element.x, y: element.y };
        if (pos.x < chartArea.left - 4 || pos.x > chartArea.right + 4) return;

        let labelText = '';
        let yOffset = -12;
        let textColor = '#0f172a';
        let bgColor = 'rgba(255, 255, 255, 0.92)';
        let borderColor = 'rgba(148, 163, 184, 0.5)';

        if (metric === 'temperature') {
          labelText = `${rawVal}°`;
          if (datasetIndex === 0) {
            yOffset = -13;
            textColor = '#b91c1c';
            borderColor = 'rgba(220, 38, 38, 0.4)';
          } else if (datasetIndex === 1) {
            yOffset = 14;
            textColor = '#0369a1';
            borderColor = 'rgba(2, 132, 199, 0.4)';
          }
        } else if (metric === 'precipitation') {
          if (rawVal <= 0) return;
          labelText = rawVal >= 10 ? `${Math.round(rawVal)}mm` : `${Number(rawVal).toFixed(1)}mm`;
          yOffset = -11;
          textColor = '#0369a1';
          borderColor = 'rgba(2, 132, 199, 0.45)';
        } else if (metric === 'wind') {
          if (datasetIndex === 1) {
            // Rajada Máxima
            labelText = `${rawVal}`;
            yOffset = -13;
            textColor = '#c2410c';
            borderColor = 'rgba(234, 88, 12, 0.45)';
          } else {
            // Vento Médio
            labelText = `${rawVal}`;
            yOffset = -9;
            textColor = '#334155';
            borderColor = 'rgba(100, 116, 139, 0.35)';
          }
        } else if (metric === 'pressure') {
          if (datasetIndex !== 0) return;
          labelText = `${rawVal}`;
          yOffset = -13;
          textColor = '#c2410c';
          borderColor = 'rgba(234, 88, 12, 0.45)';
        } else if (metric === 'humidity') {
          labelText = `${rawVal}%`;
          if (datasetIndex === 0) {
            yOffset = -12;
            textColor = '#1e293b';
          } else {
            yOffset = 13;
            textColor = '#c2410c';
          }
        }

        if (!labelText) return;

        const targetY = Math.max(chartArea.top + 23, Math.min(chartArea.bottom - 9, pos.y + yOffset));
        ctx.font = "800 9.5px 'JetBrains Mono', monospace";
        const tw = ctx.measureText(labelText).width;
        const pw = tw + 6;
        const ph = 14;

        ctx.fillStyle = bgColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 0.85;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(pos.x - pw / 2, targetY - ph / 2, pw, ph, 3);
        } else {
          ctx.rect(pos.x - pw / 2, targetY - ph / 2, pw, ph);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.fillText(labelText, pos.x, targetY + 0.5);
      });
    });

    ctx.restore();
  }
};

let activeBulletinChart = null;

export function renderBulletinChart(canvas, metric, bulletinRows, viewOptions = {}) {
  if (!canvas || !bulletinRows || bulletinRows.length === 0) return;

  if (canvas._activeBulletinChart) {
    canvas._activeBulletinChart.destroy();
    canvas._activeBulletinChart = null;
  }

  const zoomPercent = Number(viewOptions.zoomPercent) || 175;
  const showValues = viewOptions.showValues !== undefined ? !!viewOptions.showValues : true;
  const unCrowded = zoomPercent >= 125 || bulletinRows.length <= 16;

  const ctx = canvas.getContext('2d');
  // Rótulos limpos e espaçados: linha 1 = Turno ("Madrug.", "Manhã", "Tarde", "Noite"), linha 2 = "Ter 10/11"
  const labels = bulletinRows.map(r => {
    const day3 = (r.dia_semana || '').substring(0, 3);
    const shortDt = formatShortDateBr(r.data_iso);
    const shiftShort = formatShiftShort(r.turno);
    return unCrowded ? [shiftShort, `${day3} ${shortDt}`] : `${day3} ${shiftShort}`;
  });

  const c = getColors();
  const commonOpts = getCommonOptions('');

  // Melhora o tooltip para exibir data completa, turno, condição do tempo e direção do vento
  commonOpts.plugins.tooltip.callbacks = {
    title(items) {
      if (!items || !items.length) return '';
      const idx = items[0].dataIndex;
      const r = bulletinRows[idx];
      if (!r) return '';
      const dtBr = formatShortDateBr(r.data_iso);
      return `${r.dia_semana} (${dtBr}) — ${r.turno}`;
    },
    afterBody(items) {
      if (!items || !items.length) return [];
      const idx = items[0].dataIndex;
      const r = bulletinRows[idx];
      if (!r) return [];
      const extra = [];
      if (r.tempo_desc) extra.push(`Condição: ${r.tempo_desc}`);
      if (r.vento_dir) extra.push(`Direção do Vento: ${r.vento_dir}`);
      if (metric === 'precipitation' && r.chuva_prob !== undefined) {
        extra.push(`Probabilidade de Chuva: ${r.chuva_prob}%`);
      }
      return extra;
    }
  };

  commonOpts.plugins.bulletinEnhancerPlugin = {
    rows: bulletinRows,
    metric,
    zoomPercent,
    showValues
  };

  let config = null;

  if (metric === 'temperature') {
    const isDark = typeof document !== 'undefined' && document.documentElement && document.documentElement.classList.contains('dark');
    const tMax = bulletinRows.map(r => r.temp_max);
    const tMin = bulletinRows.map(r => r.temp_min);
    const tSens = bulletinRows.map(r => (r.sensacao_termica !== undefined && r.sensacao_termica !== null) ? r.sensacao_termica : Math.round((r.temp_max + r.temp_min) / 2));

    const allVals = [...tMax, ...tMin, ...tSens].filter(v => typeof v === 'number' && !isNaN(v));
    const minVal = allVals.length > 0 ? Math.min(...allVals) : 16;
    const maxVal = allVals.length > 0 ? Math.max(...allVals) : 32;
    const yMin = Math.max(0, Math.floor(minVal / 2) * 2 - 3);
    const yMax = Math.ceil(maxVal / 2) * 2 + 4;

    config = {
      type: 'line',
      plugins: [bulletinEnhancerPlugin],
      data: {
        labels,
        datasets: [
          {
            label: 'Máxima (°C)',
            data: tMax,
            borderColor: isDark ? '#f87171' : '#dc2626',
            backgroundColor: isDark ? 'rgba(248, 113, 113, 0.12)' : 'rgba(220, 38, 38, 0.08)',
            borderWidth: 2.5,
            tension: 0.3,
            fill: 1,
            pointBackgroundColor: isDark ? '#f87171' : '#dc2626',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: unCrowded ? 5 : 4,
            pointHoverRadius: 7
          },
          {
            label: 'Mínima (°C)',
            data: tMin,
            borderColor: isDark ? '#38bdf8' : '#0284c7',
            backgroundColor: 'transparent',
            borderWidth: 2.2,
            borderDash: [4, 4],
            tension: 0.3,
            fill: false,
            pointBackgroundColor: isDark ? '#38bdf8' : '#0284c7',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: unCrowded ? 4.5 : 3.5,
            pointHoverRadius: 6.5
          },
          {
            label: 'Sensação Térmica (°C)',
            data: tSens,
            borderColor: isDark ? '#fb923c' : '#ea580c',
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            tension: 0.35,
            fill: false,
            pointBackgroundColor: isDark ? '#fb923c' : '#ea580c',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: unCrowded ? 4.5 : 4,
            pointHoverRadius: 6.5
          }
        ]
      },
      options: {
        ...commonOpts,
        layout: {
          padding: { top: 24, right: 18, bottom: 6, left: 6 }
        },
        scales: {
          x: getXAxisConfig(unCrowded),
          y: {
            min: yMin,
            max: yMax,
            ticks: {
              stepSize: 2,
              color: c.text,
              font: { weight: '600' },
              callback: (val) => val + '°C'
            },
            grid: { color: c.grid },
            title: { display: true, text: 'Temperatura & Sensação (°C)', color: c.text }
          }
        }
      }
    };

  } else if (metric === 'humidity') {
    const uMax = bulletinRows.map(r => r.umid_max);
    const uMin = bulletinRows.map(r => r.umid_min);
    const validU = [...uMax, ...uMin].filter(v => typeof v === 'number' && !isNaN(v));
    const minU = validU.length ? Math.min(...validU) : 50;
    const yMinU = Math.max(20, Math.floor(minU / 10) * 10 - 10);

    config = {
      type: 'line',
      plugins: [bulletinEnhancerPlugin],
      data: {
        labels,
        datasets: [
          {
            label: 'Umidade Máx (%)',
            data: uMax,
            borderColor: c.primary,
            backgroundColor: c.gradStart,
            borderWidth: 2.5,
            tension: 0.3,
            fill: '+1',
            pointBackgroundColor: c.primary,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: unCrowded ? 5 : 4
          },
          {
            label: 'Umidade Mín (%)',
            data: uMin,
            borderColor: c.secondary,
            borderWidth: 2,
            borderDash: [4, 4],
            tension: 0.3,
            fill: false,
            pointBackgroundColor: c.secondary,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: unCrowded ? 4.5 : 3.5
          }
        ]
      },
      options: {
        ...commonOpts,
        layout: {
          padding: { top: 24, right: 18, bottom: 6, left: 6 }
        },
        scales: {
          x: getXAxisConfig(unCrowded),
          y: {
            min: yMinU,
            max: 105,
            ticks: {
              stepSize: 10,
              color: c.text,
              font: { weight: '600' },
              callback: (val) => val <= 100 ? `${val}%` : ''
            },
            grid: { color: c.grid },
            title: { display: true, text: 'Umidade (%)', color: c.text }
          }
        }
      }
    };
  } else if (metric === 'pressure') {
    const pVal = bulletinRows.map(r => r.pressao_hpa);
    const pRef = bulletinRows.map(() => 1013);
    const validP = pVal.filter(v => typeof v === 'number' && !isNaN(v));
    const minP = validP.length ? Math.min(...validP) : 1012;
    const maxP = validP.length ? Math.max(...validP) : 1022;
    const yMinP = Math.min(1010, Math.floor(minP / 2) * 2 - 2);
    const yMaxP = Math.max(1024, Math.ceil(maxP / 2) * 2 + 2);

    const gradPressBulletin = ctx.createLinearGradient(0, 0, 0, 340);
    gradPressBulletin.addColorStop(0, 'rgba(234, 88, 12, 0.16)');
    gradPressBulletin.addColorStop(1, 'rgba(234, 88, 12, 0.01)');

    config = {
      type: 'line',
      plugins: [bulletinEnhancerPlugin],
      data: {
        labels,
        datasets: [
          {
            label: 'Pressão ao Nível Médio do Mar (hPa)',
            data: pVal,
            borderColor: '#ea580c',
            backgroundColor: gradPressBulletin,
            borderWidth: 2.8,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#ea580c',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: unCrowded ? 5 : 4.5,
            pointHoverRadius: 7
          },
          {
            label: 'Referência Normal PNM (1013 hPa)',
            data: pRef,
            borderColor: '#64748b',
            backgroundColor: 'transparent',
            borderWidth: 1.8,
            borderDash: [5, 5],
            tension: 0,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0
          }
        ]
      },
      options: {
        ...commonOpts,
        layout: {
          padding: { top: 24, right: 18, bottom: 6, left: 6 }
        },
        scales: {
          x: getXAxisConfig(unCrowded),
          y: {
            min: yMinP,
            max: yMaxP,
            ticks: {
              stepSize: 2,
              color: c.text,
              font: { weight: '600' },
              callback: (val) => `${val} hPa`
            },
            grid: { color: c.grid },
            title: { display: true, text: 'Pressão Atmosférica PNM (hPa)', color: c.text }
          }
        }
      }
    };
  } else if (metric === 'wind') {
    const vMed = bulletinRows.map(r => Math.round((r.vento_vel_min + r.vento_vel_max) / 2));
    const vRaj = bulletinRows.map(r => r.rajada_max);

    const validVals = [...vRaj, ...vMed].filter(v => typeof v === 'number' && !isNaN(v));
    const maxVal = validVals.length ? Math.max(...validVals) : 45;
    const yMax = Math.max(70, Math.ceil((maxVal + 18) / 10) * 10);

    config = {
      type: 'bar',
      plugins: [bulletinEnhancerPlugin],
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Vento Médio (km/h)',
            data: vMed,
            backgroundColor: c.barFill,
            borderColor: c.barBorder,
            borderWidth: 1.2,
            borderRadius: 4,
            maxBarThickness: unCrowded ? 34 : 20
          },
          {
            type: 'line',
            label: 'Rajada Máxima (km/h)',
            data: vRaj,
            borderColor: c.secondary,
            borderWidth: 2.5,
            pointBackgroundColor: c.secondary,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: unCrowded ? 5 : 4.5,
            pointHoverRadius: 6.5,
            tension: 0.22,
            fill: false,
            clip: false
          }
        ]
      },
      options: {
        ...commonOpts,
        clip: false,
        layout: {
          padding: {
            top: 26,
            right: 18,
            bottom: 6,
            left: 6
          }
        },
        scales: {
          x: getXAxisConfig(unCrowded),
          y: {
            min: 0,
            suggestedMax: yMax,
            max: yMax,
            ticks: { stepSize: 10, color: c.text, font: { weight: '600' } },
            grid: { color: c.grid },
            title: { display: true, text: 'Velocidade (km/h)', color: c.text }
          }
        }
      }
    };
  } else if (metric === 'precipitation') {
    const chTot = bulletinRows.map(r => r.chuva_media);
    const validCh = chTot.filter(v => typeof v === 'number' && !isNaN(v));
    const maxCh = validCh.length ? Math.max(...validCh) : 25;
    const yMaxCh = Math.max(30, Math.ceil((maxCh + 12) / 10) * 10);

    config = {
      type: 'bar',
      plugins: [bulletinEnhancerPlugin],
      data: {
        labels,
        datasets: [
          {
            label: 'Precipitação Prevista (mm)',
            data: chTot,
            backgroundColor: c.rainFill,
            borderColor: c.rainBorder,
            borderWidth: 1.5,
            borderRadius: 4,
            maxBarThickness: unCrowded ? 36 : 22
          }
        ]
      },
      options: {
        ...commonOpts,
        layout: {
          padding: {
            top: 24,
            right: 18,
            bottom: 6,
            left: 6
          }
        },
        scales: {
          x: getXAxisConfig(unCrowded),
          y: {
            min: 0,
            suggestedMax: yMaxCh,
            max: yMaxCh,
            ticks: { stepSize: 10, color: c.text, font: { weight: '600' } },
            grid: { color: c.grid },
            title: { display: true, text: 'Volume Previsto (mm)', color: c.text }
          }
        }
      }
    };
  }

  if (config) {
    const bInstance = new Chart(ctx, config);
    canvas._activeBulletinChart = bInstance;
    activeBulletinChart = bInstance;
  }
}
