# -*- coding: utf-8 -*-
with open('js/charts.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace wind config
old_wind = """  } else if (metric === 'wind') {
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
            borderColor: c.secondary,
            borderWidth: 2.5,
            pointBackgroundColor: c.secondary,
            pointBorderColor: '#ffffff',
            pointRadius: 4.5,
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
    };"""

new_wind = """  } else if (metric === 'wind') {
    const vMed = bulletinRows.map(r => Math.round((r.vento_vel_min + r.vento_vel_max) / 2));
    const vRaj = bulletinRows.map(r => r.rajada_max);

    const validVals = [...vRaj, ...vMed].filter(v => typeof v === 'number' && !isNaN(v));
    const maxVal = validVals.length ? Math.max(...validVals) : 45;
    // Garante folga superior proporcional para que as rajadas e pontos fiquem 100% visíveis sem corte
    const yMax = Math.max(60, Math.ceil((maxVal + 10) / 10) * 10);

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
            borderColor: c.secondary,
            borderWidth: 2.5,
            pointBackgroundColor: c.secondary,
            pointBorderColor: '#ffffff',
            pointRadius: 4.5,
            pointHoverRadius: 6,
            fill: false,
            clip: false
          }
        ]
      },
      options: {
        ...getCommonOptions('Velocidade (km/h)'),
        layout: {
          padding: {
            top: 15,
            right: 8,
            bottom: 4,
            left: 4
          }
        },
        scales: {
          x: getXAxisConfig(),
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
    };"""

# Normalize CRLF for match
code_norm = code.replace('\r\n', '\n')
old_wind_norm = old_wind.replace('\r\n', '\n')

if old_wind_norm in code_norm:
    code_norm = code_norm.replace(old_wind_norm, new_wind)
    print("Replaced wind chart config.")
else:
    print("Could not match old wind chart config.")

# Also update precipitation
old_precip = """  } else if (metric === 'precipitation') {
    const chTot = bulletinRows.map(r => r.chuva_media);

    config = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Precipitação Prevista (mm)',
            data: chTot,
            backgroundColor: c.rainFill,
            borderColor: c.rainBorder,
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
    };"""

new_precip = """  } else if (metric === 'precipitation') {
    const chTot = bulletinRows.map(r => r.chuva_media);
    const validCh = chTot.filter(v => typeof v === 'number' && !isNaN(v));
    const maxCh = validCh.length ? Math.max(...validCh) : 25;
    const yMaxCh = Math.max(40, Math.ceil((maxCh + 10) / 10) * 10);

    config = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Precipitação Prevista (mm)',
            data: chTot,
            backgroundColor: c.rainFill,
            borderColor: c.rainBorder,
            borderWidth: 1.5,
            borderRadius: 4
          }
        ]
      },
      options: {
        ...getCommonOptions('Chuva (mm)'),
        layout: {
          padding: {
            top: 12,
            right: 8,
            bottom: 4,
            left: 4
          }
        },
        scales: {
          x: getXAxisConfig(),
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
    };"""

old_precip_norm = old_precip.replace('\r\n', '\n')
if old_precip_norm in code_norm:
    code_norm = code_norm.replace(old_precip_norm, new_precip)
    print("Replaced precipitation chart config.")
else:
    print("Could not match old precipitation chart config.")

with open('js/charts.js', 'w', encoding='utf-8') as f:
    f.write(code_norm.replace('\n', '\r\n'))

print("Updated js/charts.js successfully.")
