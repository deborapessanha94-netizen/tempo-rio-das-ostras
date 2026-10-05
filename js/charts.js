/**
 * Gerenciamento de gráficos interativos com Chart.js
 * 100% Preto e Branco / Monocromático de Alto Contraste
 * Rio das Ostras (RJ)
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

function getColors() {
  return {
    primary: '#000000',
    secondary: '#27272a',
    tertiary: '#52525b',
    barFill: 'rgba(0, 0, 0, 0.85)',
    barBorder: '#000000',
    gradStart: 'rgba(0, 0, 0, 0.15)',
    gradEnd: 'rgba(0, 0, 0, 0.0)',
    text: '#000000',
    textMuted: '#27272a',
    grid: 'rgba(0, 0, 0, 0.15)'
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
            backgroundColor: c.barFill,
            borderColor: c.barBorder,
            borderWidth: 1.5,
            borderRadius: 4,
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'Probabilidade (%)',
            data: probSlice,
            borderColor: c.primary,
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
            borderColor: c.secondary,
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
            borderColor: c.primary,
            backgroundColor: gradPress,
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: c.primary,
            pointRadius: 3
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
        labels: {
          color: c.text,
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '700' },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: '#000000',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#000000',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        cornerRadius: 6,
        titleFont: { weight: '800' },
        bodyFont: { weight: '700' }
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

function getXAxisConfig() {
  const c = getColors();
  return {
    grid: { color: c.grid },
    ticks: { color: c.text, maxRotation: 0, font: { size: 11, family: "'JetBrains Mono', monospace", weight: '600' } }
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
  const c = getColors();

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
            borderColor: c.primary,
            backgroundColor: c.gradStart,
            borderWidth: 2.5,
            tension: 0.3,
            fill: '+1',
            pointBackgroundColor: c.primary,
            pointRadius: 4
          },
          {
            label: 'Mínima (°C)',
            data: tMin,
            borderColor: c.secondary,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [4, 4],
            tension: 0.3,
            fill: false,
            pointBackgroundColor: c.secondary,
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
            ticks: { stepSize: 2, color: c.text, font: { weight: '600' } },
            grid: { color: c.grid },
            title: { display: true, text: 'Temperatura (°C)', color: c.text }
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
            borderColor: c.primary,
            backgroundColor: c.gradStart,
            borderWidth: 2,
            tension: 0.3,
            fill: '+1',
            pointBackgroundColor: c.primary,
            pointRadius: 4
          },
          {
            label: 'Umidade Mín (%)',
            data: uMin,
            borderColor: c.secondary,
            borderWidth: 1.5,
            borderDash: [4, 4],
            tension: 0.3,
            fill: false,
            pointBackgroundColor: c.secondary,
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
            ticks: { stepSize: 10, color: c.text, font: { weight: '600' } },
            grid: { color: c.grid },
            title: { display: true, text: 'Umidade (%)', color: c.text }
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
            borderColor: c.primary,
            backgroundColor: c.gradStart,
            borderWidth: 2,
            tension: 0.25,
            fill: true,
            pointBackgroundColor: c.primary,
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
            ticks: { stepSize: 2, color: c.text, font: { weight: '600' } },
            grid: { color: c.grid },
            title: { display: true, text: 'Pressão (hPa)', color: c.text }
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
            backgroundColor: c.barFill,
            borderColor: c.barBorder,
            borderWidth: 1,
            borderRadius: 4
          },
          {
            type: 'line',
            label: 'Rajada Máxima (km/h)',
            data: vRaj,
            borderColor: c.primary,
            borderWidth: 2,
            pointBackgroundColor: c.primary,
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
            ticks: { stepSize: 10, color: c.text, font: { weight: '600' } },
            grid: { color: c.grid },
            title: { display: true, text: 'Velocidade (km/h)', color: c.text }
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
            backgroundColor: c.barFill,
            borderColor: c.barBorder,
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
            ticks: { stepSize: 10, color: c.text, font: { weight: '600' } },
            grid: { color: c.grid },
            title: { display: true, text: 'Volume Previsto (mm)', color: c.text }
          }
        }
      }
    };
  }

  if (config) {
    activeBulletinChart = new Chart(ctx, config);
  }
}
