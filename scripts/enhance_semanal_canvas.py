import os

PATH = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\social-cards.js"

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

target = """  // 6. As 7 Linhas Diárias (Segunda a Domingo)
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
  }"""

enhanced_code = """  // 6. As 7 Linhas Diárias (Segunda a Domingo)
  const rowsStartY = stripY + stripH + (isStory ? 20 : 14);
  const totalRowsHeight = cardH - (rowsStartY - cardY) - (isStory ? 55 : 40);
  const rowH = totalRowsHeight / 7;
  const rowSpacing = isStory ? 10 : 5;
  const effectiveRowH = rowH - rowSpacing;

  for (let i = 0; i < Math.min(days.length, 7); i++) {
    const d = days[i];
    const rY = rowsStartY + i * rowH;
    const rX = cardX + 28;
    const rW = cardW - 56;

    // Fundo da Linha
    ctx.beginPath();
    ctx.roundRect(rX, rY, rW, effectiveRowH, 14);
    if (d.isToday) {
      ctx.fillStyle = isDark ? '#142038' : '#fff7ed';
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2;
    } else {
      ctx.fillStyle = isDark ? '#0b1626' : (i % 2 === 0 ? '#f8fafc' : '#ffffff');
      ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
      ctx.lineWidth = 1.2;
    }
    ctx.fill();
    ctx.stroke();

    if (isStory) {
      // -------------------------------------------------------------
      // LAYOUT STORIES (9:16) - 3 LINHAS ESTRUTURADAS E ESPAÇOSAS
      // -------------------------------------------------------------
      
      // LINHA 1 (Y + 16): Dia, Data, Hoje, Temperatura e Condição
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const line1Y = rY + 28;
      
      ctx.font = '900 20px Inter, sans-serif';
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.fillText(`${d.dayOfWeek.toUpperCase()} • ${d.dateFormatted}`, rX + 20, line1Y);

      if (d.isToday) {
        const dayTextWidth = ctx.measureText(`${d.dayOfWeek.toUpperCase()} • ${d.dateFormatted}`).width;
        ctx.beginPath();
        ctx.roundRect(rX + 20 + dayTextWidth + 12, line1Y - 11, 46, 22, 6);
        ctx.fillStyle = '#ea580c';
        ctx.fill();
        ctx.font = '900 11px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('HOJE', rX + 20 + dayTextWidth + 35, line1Y);
      }

      // Temperatura no canto superior direito
      ctx.textAlign = 'right';
      ctx.font = '900 22px JetBrains Mono, monospace';
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.fillText(`${d.tempMax}° / ${d.tempMin}°C`, rX + rW - 20, line1Y);

      ctx.font = '700 13.5px Inter, sans-serif';
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      const condW = ctx.measureText(`${d.tempMax}° / ${d.tempMin}°C`).width;
      ctx.fillText(d.weatherLabel, rX + rW - 20 - condW - 16, line1Y);

      // LINHA 2 (Y + 70): Os 4 Pilares - Vento/Rajadas & Chuva
      const line2Y = rY + 74;
      ctx.textAlign = 'left';
      
      // Vento e Rajada
      ctx.font = '800 14px Inter, sans-serif';
      ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
      ctx.fillText(`💨 Vento: ${d.windSpeed} km/h (${d.windDirCardinal})`, rX + 20, line2Y);

      // Badge de Rajada
      const gustW = 120;
      ctx.beginPath();
      ctx.roundRect(rX + 215, line2Y - 13, gustW, 26, 7);
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
      ctx.lineWidth = 1.2;
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = '900 12px JetBrains Mono, monospace';
      ctx.fillStyle = d.windGust >= 50 ? '#ea580c' : (d.windGust >= 35 ? '#0284c7' : '#10b981');
      ctx.fillText(`Rajada ${d.windGust} km/h`, rX + 215 + gustW / 2, line2Y);

      // Chuva
      ctx.textAlign = 'left';
      ctx.font = '800 14px Inter, sans-serif';
      ctx.fillStyle = d.rainMm >= 5 ? '#2563eb' : (isDark ? '#38bdf8' : '#0284c7');
      ctx.fillText(`🌧️ Chuva: ${d.rainMm.toFixed(1)} mm (${d.rainProb}% prob)`, rX + 365, line2Y);

      // LINHA 3 (Y + 118): Sistema Atuante & Evento Extremo
      const line3Y = rY + 118;
      ctx.font = '800 13px Inter, sans-serif';
      ctx.fillStyle = '#ea580c';
      const sisStory = d.sistemaAtuante.length > 34 ? d.sistemaAtuante.substring(0, 33) + '…' : d.sistemaAtuante;
      ctx.fillText(`🌐 ${sisStory}`, rX + 20, line3Y);

      // Badge de Risco na Linha 3 à direita
      const rBadgeW = 270;
      const rBadgeX = rX + rW - rBadgeW - 20;
      ctx.beginPath();
      ctx.roundRect(rBadgeX, line3Y - 13, rBadgeW, 26, 7);
      let rFill = '#059669';
      if (d.riskLevel === 'alert') {
        ctx.fillStyle = isDark ? '#4c0519' : '#ffe4e6';
        ctx.strokeStyle = '#e11d48';
        rFill = '#e11d48';
      } else if (d.riskLevel === 'warning') {
        ctx.fillStyle = isDark ? '#451a03' : '#ffedd5';
        ctx.strokeStyle = '#ea580c';
        rFill = '#c2410c';
      } else if (d.riskLevel === 'attention') {
        ctx.fillStyle = isDark ? '#082f49' : '#e0f2fe';
        ctx.strokeStyle = '#0284c7';
        rFill = '#0284c7';
      } else {
        ctx.fillStyle = isDark ? '#022c22' : '#f0fdf4';
        ctx.strokeStyle = '#10b981';
        rFill = '#059669';
      }
      ctx.lineWidth = 1.2;
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = '900 11px Inter, sans-serif';
      ctx.fillStyle = rFill;
      const bText = d.riskBadge.length > 30 ? d.riskBadge.substring(0, 29) + '…' : d.riskBadge;
      ctx.fillText(`⚠️ ${bText}`, rBadgeX + rBadgeW / 2, line3Y);

    } else {
      // -------------------------------------------------------------
      // LAYOUT POST FEED (4:5) - 2 LINHAS EQUILIBRADAS E LEGÍVEIS
      // -------------------------------------------------------------
      
      // LINHA 1 (Y + 24): Dia, Data, Temperatura e Céu
      const line1Y = rY + 24;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      ctx.font = '900 15px Inter, sans-serif';
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.fillText(`${d.dayOfWeekShort.toUpperCase()} • ${d.dateFormatted}`, rX + 16, line1Y);

      if (d.isToday) {
        ctx.beginPath();
        ctx.roundRect(rX + 124, line1Y - 9, 38, 18, 4);
        ctx.fillStyle = '#ea580c';
        ctx.fill();
        ctx.font = '900 9px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('HOJE', rX + 143, line1Y);
      }

      // Temperatura e Céu
      ctx.textAlign = 'left';
      ctx.font = '900 16px JetBrains Mono, monospace';
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.fillText(`${d.tempMax}° / ${d.tempMin}°C`, rX + 175, line1Y);

      ctx.font = '700 11.5px Inter, sans-serif';
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      const cLabel = d.weatherLabel.length > 18 ? d.weatherLabel.substring(0, 17) + '…' : d.weatherLabel;
      ctx.fillText(cLabel, rX + 285, line1Y);

      // Vento & Rajada na Linha 1 à direita
      ctx.font = '800 12.5px Inter, sans-serif';
      ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
      ctx.fillText(`💨 ${d.windSpeed} km/h • ${d.windDirCardinal}`, rX + 445, line1Y);

      // Badge de Rajada
      const gBadgeW = 105;
      ctx.beginPath();
      ctx.roundRect(rX + 575, line1Y - 11, gBadgeW, 22, 5);
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
      ctx.font = '900 11px JetBrains Mono, monospace';
      ctx.fillStyle = d.windGust >= 50 ? '#ea580c' : (d.windGust >= 35 ? '#0284c7' : '#10b981');
      ctx.fillText(`Rajada ${d.windGust}k`, rX + 575 + gBadgeW / 2, line1Y);

      // Chuva na Linha 1 à extrema direita
      ctx.textAlign = 'right';
      ctx.font = '900 13px JetBrains Mono, monospace';
      ctx.fillStyle = d.rainMm >= 5 ? '#2563eb' : (isDark ? '#38bdf8' : '#0284c7');
      ctx.fillText(`🌧️ ${d.rainMm.toFixed(1)} mm (${d.rainProb}%)`, rX + rW - 16, line1Y);

      // LINHA 2 (Y + 58): Sistema Atuante & Evento Extremo
      const line2Y = rY + 58;
      ctx.textAlign = 'left';
      ctx.font = '800 11.5px Inter, sans-serif';
      ctx.fillStyle = '#ea580c';
      const sisPost = d.sistemaAtuante.length > 38 ? d.sistemaAtuante.substring(0, 37) + '…' : d.sistemaAtuante;
      ctx.fillText(`🌐 ${sisPost}`, rX + 16, line2Y);

      // Badge de Risco na Linha 2 à direita
      const rBadgeW = 230;
      const rBadgeX = rX + rW - rBadgeW - 16;
      ctx.beginPath();
      ctx.roundRect(rBadgeX, line2Y - 11, rBadgeW, 22, 5);
      let rFill = '#059669';
      if (d.riskLevel === 'alert') {
        ctx.fillStyle = isDark ? '#4c0519' : '#ffe4e6';
        ctx.strokeStyle = '#e11d48';
        rFill = '#e11d48';
      } else if (d.riskLevel === 'warning') {
        ctx.fillStyle = isDark ? '#451a03' : '#ffedd5';
        ctx.strokeStyle = '#ea580c';
        rFill = '#c2410c';
      } else if (d.riskLevel === 'attention') {
        ctx.fillStyle = isDark ? '#082f49' : '#e0f2fe';
        ctx.strokeStyle = '#0284c7';
        rFill = '#0284c7';
      } else {
        ctx.fillStyle = isDark ? '#022c22' : '#f0fdf4';
        ctx.strokeStyle = '#10b981';
        rFill = '#059669';
      }
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = '900 10px Inter, sans-serif';
      ctx.fillStyle = rFill;
      const bText = d.riskBadge.length > 28 ? d.riskBadge.substring(0, 27) + '…' : d.riskBadge;
      ctx.fillText(`⚠️ ${bText}`, rBadgeX + rBadgeW / 2, line2Y);
    }
  }"""

if target in content:
    content = content.replace(target, enhanced_code, 1)
    with open(PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print("Enhanced row rendering applied successfully!")
else:
    print("Error: target not found in social-cards.js")
