import os

PATH = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\social-cards.js"

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

target = """      // Temperatura no canto superior direito
      ctx.textAlign = 'right';
      ctx.font = '900 22px JetBrains Mono, monospace';
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.fillText(`${d.tempMax}° / ${d.tempMin}°C`, rX + rW - 20, line1Y);

      ctx.font = '700 13.5px Inter, sans-serif';
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      const condW = ctx.measureText(`${d.tempMax}° / ${d.tempMin}°C`).width;
      ctx.fillText(d.weatherLabel, rX + rW - 20 - condW - 16, line1Y);"""

replacement = """      // Temperatura e Condição no canto superior direito (Empilhados sem sobreposição)
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = '900 23px JetBrains Mono, monospace';
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.fillText(`${d.tempMax}° / ${d.tempMin}°C`, rX + rW - 20, line1Y - 8);

      ctx.font = '700 13px Inter, sans-serif';
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      const cStoryLabel = d.weatherLabel.length > 22 ? d.weatherLabel.substring(0, 21) + '…' : d.weatherLabel;
      ctx.fillText(cStoryLabel, rX + rW - 20, line1Y + 16);"""

if target in content:
    content = content.replace(target, replacement, 1)
    with open(PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed story temp and label overlap!")
else:
    print("Error: target not found in social-cards.js")
