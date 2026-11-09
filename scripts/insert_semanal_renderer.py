import os

PATH = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\social-cards.js"

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

target = """  const previewImg = document.getElementById('social-preview-image');
  if (previewImg) {
    previewImg.src = canvas.toDataURL('image/png');
  }
}

export async function downloadSocialCurrentFormat() {"""

renderer_code = '''  const previewImg = document.getElementById('social-preview-image');
  if (previewImg) {
    previewImg.src = canvas.toDataURL('image/png');
  }
}

/**
 * RENDERIZADOR 4: CARD DO PANORAMA SEMANAL (7 DIAS)
 * Formatos: Post Feed (1080x1350, 4:5) e Stories (1080x1920, 9:16)
 * Contém: Vento, Rajadas, Chuva, Sistemas Atuantes e Eventos Extremos
 */
export function renderSocialCanvasSemanal(canvas, ctx, width, height, isStory, isDark) {
  // 1. Fundo
  if (isDark) {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#020b18');
    bgGrad.addColorStop(0.5, '#041226');
    bgGrad.addColorStop(1, '#06172e');
    ctx.fillStyle = bgGrad;
  } else {
    ctx.fillStyle = '#f4f1ea';
  }
  ctx.fillRect(0, 0, width, height);

  // 2. Obtém dados semanais
  let weekly = null;
  if (typeof window !== 'undefined') {
    if (window.getWeeklyForecastCached) weekly = window.getWeeklyForecastCached();
    if (!weekly && window.resolveWeeklyForecast7Days && window.state) {
      weekly = window.resolveWeeklyForecast7Days(window.state.weatherData, window.state.boletimMetadata);
    }
  }

  // Fallback caso dados não estejam carregados
  if (!weekly || !weekly.days || weekly.days.length === 0) {
    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Dados do Panorama Semanal em processamento...', width / 2, height / 2);
    const pImg = document.getElementById('social-preview-image');
    if (pImg) pImg.src = canvas.toDataURL('image/png');
    return;
  }

  const { periodLabel, totalRainMm, maxGustDay, days } = weekly;

  // 3. Moldura Central
  const margin = 45;
  const cardX = margin;
  const cardY = isStory ? 70 : 35;
  const cardW = width - margin * 2;
  const cardH = height - cardY - (isStory ? 70 : 35);

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 24);
  ctx.fillStyle = isDark ? '#081325' : '#ffffff';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = isDark ? '#1e293b' : '#cbd5e1';
  ctx.stroke();

  // Barra de acento superior laranja
  ctx.beginPath();
  ctx.roundRect(cardX + 28, cardY, cardW - 56, 5, 2.5);
  ctx.fillStyle = '#ea580c';
  ctx.fill();

  // 4. Cabeçalho do Card
  const headerY = cardY + 28;
  
  // Medallion Ícone
  ctx.beginPath();
  ctx.roundRect(cardX + 28, headerY, 46, 46, 12);
  const medGrad = ctx.createLinearGradient(cardX + 28, headerY, cardX + 74, headerY + 46);
  medGrad.addColorStop(0, '#f97316');
  medGrad.addColorStop(1, '#ea580c');
  ctx.fillStyle = medGrad;
  ctx.fill();

  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🗓️', cardX + 51, headerY + 24);

  // Título e Subtítulo
  const textX = cardX + 86;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '900 23px Inter, sans-serif';
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.fillText('Rio das Ostras – Panorama Semanal (7 Dias)', textX, headerY + 2);

  ctx.font = '700 13px Inter, sans-serif';
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.fillText(`Validade: ${periodLabel} • Atualizado toda Segunda-feira`, textX, headerY + 28);

  // Badge da direita: @tempoemriodasostras
  const badgeRightX = cardX + cardW - 28;
  const tagW = 165;
  ctx.beginPath();
  ctx.roundRect(badgeRightX - tagW, headerY + 6, tagW, 28, 8);
  ctx.fillStyle = isDark ? '#1e293b' : '#ffebe4';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = isDark ? '#334155' : '#f07a53';
  ctx.stroke();

  ctx.font = '800 11px JetBrains Mono, monospace';
  ctx.fillStyle = isDark ? '#f8fafc' : '#ea580c';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('@tempoemriodasostras', badgeRightX - tagW / 2, headerY + 20);

  // 5. Faixa Executiva dos 4 Destaques (Chuva Total, Pico Rajada, Sistemas, Riscos)
  const stripY = headerY + 58;
  const stripH = isStory ? 82 : 68;
  const colW = (cardW - 56 - 24) / 4;

  const kpis = [
    { label: 'CHUVA TOTAL', val: `${totalRainMm} mm`, sub: 'Acumulado 7 dias', color: '#0284c7' },
    { label: 'MAIOR RAJADA', val: `${maxGustDay.windGust} km/h`, sub: `${maxGustDay.dayOfWeekShort} (${maxGustDay.windDirCardinal})`, color: '#ea580c' },
    { label: 'SISTEMAS PRINCIPAIS', val: 'ASAS / F. Fria', sub: 'Pré-Frontal Qui', color: '#8b5cf6' },
    { label: 'EVENTOS EXTREMOS', val: 'Qui / Sex', sub: 'Rajadas & Chuva', color: '#e11d48' }
  ];

  for (let k = 0; k < 4; k++) {
    const kX = cardX + 28 + k * (colW + 8);
    ctx.beginPath();
    ctx.roundRect(kX, stripY, colW, stripH, 12);
    ctx.fillStyle = isDark ? '#0d1829' : '#f8fafc';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = isDark ? '#1e293b' : '#cbd5e1';
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '800 10px Inter, sans-serif';
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.fillText(kpis[k].label, kX + 12, stripY + 10);

    ctx.font = '900 17px JetBrains Mono, monospace';
    ctx.fillStyle = kpis[k].color;
    ctx.fillText(kpis[k].val, kX + 12, stripY + 27);

    ctx.font = '600 10.5px Inter, sans-serif';
    ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
    ctx.fillText(kpis[k].sub, kX + 12, stripY + 48);
  }

  // 6. As 7 Linhas Diárias (Segunda a Domingo)
  const rowsStartY = stripY + stripH + (isStory ? 24 : 16);
  const totalRowsHeight = cardH - (rowsStartY - cardY) - (isStory ? 60 : 45);
  const rowH = totalRowsHeight / 7;
  const rowSpacing = isStory ? 8 : 4;
  const effectiveRowH = rowH - rowSpacing;

  for (let i = 0; i < Math.min(days.length, 7); i++) {
    const d = days[i];
    const rY = rowsStartY + i * rowH;
    const rX = cardX + 28;
    const rW = cardW - 56;

    // Fundo da Linha
    ctx.beginPath();
    ctx.roundRect(rX, rY, rW, effectiveRowH, 12);
    if (d.isToday) {
      ctx.fillStyle = isDark ? '#142038' : '#fff7ed';
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1.5;
    } else {
      ctx.fillStyle = isDark ? '#0b1626' : (i % 2 === 0 ? '#f8fafc' : '#ffffff');
      ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
      ctx.lineWidth = 1;
    }
    ctx.fill();
    ctx.stroke();

    // Coluna 1: Dia da Semana, Data e Hoje
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const col1X = rX + 14;

    ctx.font = '900 14px Inter, sans-serif';
    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.fillText(d.dayOfWeekShort.toUpperCase(), col1X, rY + (isStory ? 16 : 10));

    ctx.font = '700 11px JetBrains Mono, monospace';
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.fillText(d.dateFormatted, col1X, rY + (isStory ? 34 : 26));

    if (d.isToday) {
      ctx.beginPath();
      ctx.roundRect(col1X + 46, rY + (isStory ? 14 : 9), 36, 16, 4);
      ctx.fillStyle = '#ea580c';
      ctx.fill();
      ctx.font = '900 8.5px Inter, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HOJE', col1X + 64, rY + (isStory ? 22 : 17));
    }

    // Coluna 2: Temperatura e Céu
    const col2X = rX + 115;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '900 15px JetBrains Mono, monospace';
    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.fillText(`${d.tempMax}° / ${d.tempMin}°C`, col2X, rY + (isStory ? 16 : 10));

    ctx.font = '600 10.5px Inter, sans-serif';
    ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
    const condLabel = d.weatherLabel.length > 20 ? d.weatherLabel.substring(0, 19) + '…' : d.weatherLabel;
    ctx.fillText(condLabel, col2X, rY + (isStory ? 34 : 26));

    // Coluna 3: Vento Médio & Rajadas (Item 1 & 2 do Usuário)
    const col3X = rX + 265;
    ctx.font = '700 11px Inter, sans-serif';
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.fillText('Vento / Rajada:', col3X, rY + (isStory ? 12 : 8));

    ctx.font = '800 12px Inter, sans-serif';
    ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
    ctx.fillText(`${d.windSpeed} km/h • ${d.windDirCardinal}`, col3X, rY + (isStory ? 28 : 22));

    // Badge de Rajada
    const gustBadgeW = 100;
    const gustBadgeX = col3X + 115;
    ctx.beginPath();
    ctx.roundRect(gustBadgeX, rY + (isStory ? 18 : 12), gustBadgeW, 22, 6);
    if (d.windGust >= 50) {
      ctx.fillStyle = isDark ? '#451a03' : '#ffedd5';
      ctx.strokeStyle = '#ea580c';
    } else if (d.windGust >= 35) {
      ctx.fillStyle = isDark ? '#0c2642' : '#e0f2fe';
      ctx.strokeStyle = '#0284c7';
    } else {
      ctx.fillStyle = isDark ? '#052e16' : '#ecfdf5';
      ctx.strokeStyle = '#10b981';
    }
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 10.5px JetBrains Mono, monospace';
    ctx.fillStyle = d.windGust >= 50 ? '#ea580c' : (d.windGust >= 35 ? '#0284c7' : '#10b981');
    ctx.fillText(`Rajada ${d.windGust}k`, gustBadgeX + gustBadgeW / 2, rY + (isStory ? 29 : 23));

    // Coluna 4: Chuva Prevista (Item 3 do Usuário)
    const col4X = rX + 500;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '700 11px Inter, sans-serif';
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.fillText('Chuva Prevista:', col4X, rY + (isStory ? 12 : 8));

    ctx.font = '900 13px JetBrains Mono, monospace';
    ctx.fillStyle = d.rainMm >= 5 ? '#2563eb' : (isDark ? '#38bdf8' : '#0284c7');
    ctx.fillText(`${d.rainMm.toFixed(1)} mm`, col4X, rY + (isStory ? 28 : 22));

    ctx.font = '600 10px Inter, sans-serif';
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.fillText(`(${d.rainProb}% prob)`, col4X + 68, rY + (isStory ? 29 : 23));

    // Coluna 5: Sistema Atuante & Evento Extremo (Item 4 do Usuário)
    const col5X = rX + 625;
    ctx.font = '800 11px Inter, sans-serif';
    ctx.fillStyle = '#ea580c';
    const sisShort = d.sistemaAtuante.length > 24 ? d.sistemaAtuante.substring(0, 23) + '…' : d.sistemaAtuante;
    ctx.fillText(sisShort, col5X, rY + (isStory ? 12 : 8));

    // Badge de Risco / Extremo
    const riskBadgeW = 195;
    ctx.beginPath();
    ctx.roundRect(col5X, rY + (isStory ? 27 : 22), riskBadgeW, 19, 5);
    let fillTxt = '#059669';
    if (d.riskLevel === 'alert') {
      ctx.fillStyle = isDark ? '#4c0519' : '#ffe4e6';
      ctx.strokeStyle = '#e11d48';
      fillTxt = '#e11d48';
    } else if (d.riskLevel === 'warning') {
      ctx.fillStyle = isDark ? '#451a03' : '#ffedd5';
      ctx.strokeStyle = '#ea580c';
      fillTxt = '#c2410c';
    } else if (d.riskLevel === 'attention') {
      ctx.fillStyle = isDark ? '#082f49' : '#e0f2fe';
      ctx.strokeStyle = '#0284c7';
      fillTxt = '#0284c7';
    } else {
      ctx.fillStyle = isDark ? '#022c22' : '#f0fdf4';
      ctx.strokeStyle = '#10b981';
      fillTxt = '#059669';
    }
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 9px Inter, sans-serif';
    ctx.fillStyle = fillTxt;
    const badgeText = d.riskBadge.length > 27 ? d.riskBadge.substring(0, 26) + '…' : d.riskBadge;
    ctx.fillText(badgeText, col5X + riskBadgeW / 2, rY + (isStory ? 37 : 31));
  }

  // 7. Rodapé do Card
  const footerY = cardY + cardH - (isStory ? 35 : 22);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '700 10.5px Inter, sans-serif';
  ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
  ctx.fillText('Defesa Civil de Rio das Ostras • Modelagem Numérica ECMWF/GFS/ICON via Open-Meteo', cardX + 28, footerY);

  ctx.textAlign = 'right';
  ctx.font = '700 10.5px JetBrains Mono, monospace';
  ctx.fillText('Previsão Operacional 7 Dias', cardX + cardW - 28, footerY);
  ctx.restore();

  const previewImg = document.getElementById('social-preview-image');
  if (previewImg) {
    previewImg.src = canvas.toDataURL('image/png');
  }
}

export async function downloadSocialCurrentFormat() {'''

if target in content:
    content = content.replace(target, renderer_code, 1)
    with open(PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully inserted renderSocialCanvasSemanal into js/social-cards.js")
else:
    print("Error: target not found in js/social-cards.js")
