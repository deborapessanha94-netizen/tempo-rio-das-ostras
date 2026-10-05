/**
 * Gerenciamento de gráficos interativos com Chart.js
 * Especializado para Rio das Ostras (RJ)
 */

import { calculatePrecipitableWater, getLocalHourIndex } from './api.js';

let activeChart = null;

export function renderHourlyChart(canvas, metric, hourlyData) {
  if (!canvas || !hourlyData || !hourlyData.time) return;

  if (activeChart) {
    activeChart.destroy();
    activeChart = null;
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
  activeChart = new Chart(ctx, chartConfig);
}

function buildChartConfig(metric, startIndex, count, hourlyData, labels, ctx) {
  // Gráfico de Temperatura
  if (metric === 'temperature') {
    const tempSlice = hourlyData.temperature_2m.slice(startIndex, startIndex + count);
    const appTempSlice = hourlyData.apparent_temperature.slice(startIndex, startIndex + count);

    const gradTemp = ctx.createLinearGradient(0, 0, 0, 300);
    gradTemp.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
    gradTemp.addColorStop(1, 'rgba(249, 115, 22, 0.0)');

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Temperatura (°C)',
            data: tempSlice,
            borderColor: '#f97316',
            backgroundColor: gradTemp,
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#ea580c',
            pointRadius: 3
          },
          {
            label: 'Sensação Térmica (°C)',
            data: appTempSlice,
            borderColor: '#fbbf24',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.35,
            fill: false,
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
            backgroundColor: 'rgba(56, 189, 248, 0.65)',
            borderColor: '#38bdf8',
            borderWidth: 1.5,
            borderRadius: 6,
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'Probabilidade (%)',
            data: probSlice,
            borderColor: '#818cf8',
            backgroundColor: 'rgba(129, 140, 248, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            yAxisID: 'y1',
            pointRadius: 2.5
          },
          {
            type: 'line',
            label: 'Água Precipitável VIME (mm)',
            data: pwSlice,
            borderColor: '#06b6d4',
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
            title: { display: true, text: 'Volume / Água Precipitável (mm)', color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' },
            min: 0
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Probabilidade (%)', color: '#94a3b8' },
            grid: { drawOnChartArea: false },
            ticks: { color: '#94a3b8' },
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

    const gradWind = ctx.createLinearGradient(0, 0, 0, 300);
    gradWind.addColorStop(0, 'rgba(45, 212, 191, 0.4)');
    gradWind.addColorStop(1, 'rgba(45, 212, 191, 0.0)');

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Velocidade do Vento (km/h)',
            data: windSlice,
            borderColor: '#2dd4bf',
            backgroundColor: gradWind,
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#14b8a6',
            pointRadius: 3
          },
          {
            label: 'Rajadas Máximas (km/h)',
            data: gustsSlice,
            borderColor: '#f43f5e',
            borderWidth: 2,
            borderDash: [4, 4],
            tension: 0.35,
            fill: false,
            pointBackgroundColor: '#f43f5e',
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

    const gradPress = ctx.createLinearGradient(0, 0, 0, 300);
    gradPress.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
    gradPress.addColorStop(1, 'rgba(168, 85, 247, 0.0)');

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
            borderColor: '#a855f7',
            backgroundColor: gradPress,
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#9333ea',
            pointRadius: 3
          }
        ]
      },
      options: {
        ...getCommonOptions('Pressão (hPa)'),
        scales: {
          x: getXAxisConfig(),
          y: {
            title: { display: true, text: 'Pressão (hPa)', color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' },
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

    const gradHum = ctx.createLinearGradient(0, 0, 0, 300);
    gradHum.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradHum.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Umidade Relativa (%)',
            data: humSlice,
            borderColor: '#3b82f6',
            backgroundColor: gradHum,
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#2563eb',
            pointRadius: 3
          },
          {
            label: 'Ponto de Orvalho (°C)',
            data: dewSlice,
            borderColor: '#06b6d4',
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
            title: { display: true, text: 'Umidade / Ponto de Orvalho', color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' },
            min: 0,
            max: 100
          }
        }
      }
    };
  }

  return {};
}

function isLightMode() {
  return document.documentElement.classList.contains('theme-light') || !document.documentElement.classList.contains('theme-dark');
}

function getCommonOptions(yTitle) {
  const isLight = isLightMode();
  const textColor = isLight ? '#334155' : '#cbd5e1';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)';
  const tooltipBg = isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.95)';
  const tooltipText = isLight ? '#0f172a' : '#f8fafc';
  const tooltipBorder = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)';

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
        labels: {
          color: textColor,
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '600' },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: textColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        cornerRadius: 8
      }
    },
    scales: {
      x: getXAxisConfig(),
      y: {
        title: { display: !!yTitle, text: yTitle, color: textColor },
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 11, family: "'JetBrains Mono', monospace" } }
      }
    }
  };
}

function getXAxisConfig() {
  const isLight = isLightMode();
  const textColor = isLight ? '#475569' : '#94a3b8';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)';
  return {
    grid: { color: gridColor },
    ticks: { color: textColor, maxRotation: 0, font: { size: 11, family: "'JetBrains Mono', monospace" } }
  };
}

let activeBulletinChart = null;

export function renderBulletinChart(canvas, metric, bulletinRows) {
  if (!canvas || !bulletinRows || bulletinRows.length === 0) return;

  if (activeBulletinChart) {
    activeBulletinChart.destroy();
    activeBulletinChart = null;
  }

  const ctx = canvas.getContext('2d');
  const labels = bulletinRows.map(r => `${r.dia_semana.substring(0, 3)} ${r.turno}`);

  let config = null;

  if (metric === 'temperature') {
    const tMax = bulletinRows.map(r => r.temp_max);
    const tMin = bulletinRows.map(r => r.temp_min);

    config = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Máxima (°C)',
            data: tMax,
            borderColor: '#EA580C',
            backgroundColor: 'rgba(234, 88, 12, 0.12)',
            borderWidth: 2.5,
            tension: 0.3,
            fill: '+1',
            pointBackgroundColor: '#EA580C',
            pointRadius: 4
          },
          {
            label: 'Mínima (°C)',
            data: tMin,
            borderColor: '#3f6593',
            backgroundColor: 'rgba(63, 101, 147, 0.08)',
            borderWidth: 2,
            borderDash: [4, 4],
            tension: 0.3,
            fill: false,
            pointBackgroundColor: '#3f6593',
            pointRadius: 4
          }
        ]
      },
      options: {
        ...getCommonOptions('Temperatura (°C)'),
        scales: {
          x: getXAxisConfig(),
          y: {
            min: 16,
            max: 32,
            ticks: { stepSize: 2, color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            title: { display: true, text: 'Temperatura (°C)', color: '#94a3b8' }
          }
        }
      }
    };
  } else if (metric === 'humidity') {
    const uMax = bulletinRows.map(r => r.umid_max);
    const uMin = bulletinRows.map(r => r.umid_min);

    config = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Umidade Máx (%)',
            data: uMax,
            borderColor: '#5b86b6',
            backgroundColor: 'rgba(91, 134, 182, 0.18)',
            borderWidth: 2,
            tension: 0.3,
            fill: '+1',
            pointBackgroundColor: '#3f6593',
            pointRadius: 4
          },
          {
            label: 'Umidade Mín (%)',
            data: uMin,
            borderColor: '#80aad3',
            borderWidth: 1.5,
            borderDash: [4, 4],
            tension: 0.3,
            fill: false,
            pointBackgroundColor: '#80aad3',
            pointRadius: 3.5
          }
        ]
      },
      options: {
        ...getCommonOptions('Umidade (%)'),
        scales: {
          x: getXAxisConfig(),
          y: {
            min: 50,
            max: 100,
            ticks: { stepSize: 10, color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            title: { display: true, text: 'Umidade (%)', color: '#94a3b8' }
          }
        }
      }
    };
  } else if (metric === 'pressure') {
    const pVal = bulletinRows.map(r => r.pressao_hpa);

    config = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Pressão ao Nível Médio do Mar (hPa)',
            data: pVal,
            borderColor: '#5b86b6',
            backgroundColor: 'rgba(91, 134, 182, 0.15)',
            borderWidth: 2,
            tension: 0.25,
            fill: true,
            pointBackgroundColor: '#3f6593',
            pointRadius: 4
          }
        ]
      },
      options: {
        ...getCommonOptions('Pressão (hPa)'),
        scales: {
          x: getXAxisConfig(),
          y: {
            min: 1010,
            max: 1022,
            ticks: { stepSize: 2, color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            title: { display: true, text: 'Pressão (hPa)', color: '#94a3b8' }
          }
        }
      }
    };
  } else if (metric === 'wind') {
    const vMed = bulletinRows.map(r => Math.round((r.vento_vel_min + r.vento_vel_max) / 2));
    const vRaj = bulletinRows.map(r => r.rajada_max);

    config = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Vento Médio (km/h)',
            data: vMed,
            backgroundColor: 'rgba(63, 101, 147, 0.85)',
            borderColor: '#1b3554',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            type: 'line',
            label: 'Rajada Máxima (km/h)',
            data: vRaj,
            borderColor: '#ea580c',
            borderWidth: 2,
            pointBackgroundColor: '#ea580c',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false
          }
        ]
      },
      options: {
        ...getCommonOptions('Velocidade (km/h)'),
        scales: {
          x: getXAxisConfig(),
          y: {
            min: 0,
            max: 55,
            ticks: { stepSize: 10, color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            title: { display: true, text: 'Velocidade (km/h)', color: '#94a3b8' }
          }
        }
      }
    };
  } else if (metric === 'precipitation') {
    const chTot = bulletinRows.map(r => r.chuva_media);

    config = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Precipitação Prevista (mm)',
            data: chTot,
            backgroundColor: 'rgba(91, 134, 182, 0.75)',
            borderColor: '#3f6593',
            borderWidth: 1.5,
            borderRadius: 4
          }
        ]
      },
      options: {
        ...getCommonOptions('Chuva (mm)'),
        scales: {
          x: getXAxisConfig(),
          y: {
            min: 0,
            max: 40,
            ticks: { stepSize: 10, color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            title: { display: true, text: 'Volume Previsto (mm)', color: '#94a3b8' }
          }
        }
      }
    };
  }

  if (config) {
    activeBulletinChart = new Chart(ctx, config);
  }
}

