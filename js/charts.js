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

function getCommonOptions(yTitle) {
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
          color: '#cbd5e1',
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255, 255, 255, 0.1)',
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
        title: { display: !!yTitle, text: yTitle, color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
        ticks: { color: '#94a3b8', font: { size: 11 } }
      }
    }
  };
}

function getXAxisConfig() {
  return {
    grid: { color: 'rgba(255, 255, 255, 0.04)' },
    ticks: { color: '#94a3b8', maxRotation: 0, font: { size: 11 } }
  };
}
