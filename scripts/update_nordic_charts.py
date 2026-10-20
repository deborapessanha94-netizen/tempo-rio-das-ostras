# -*- coding: utf-8 -*-
path_charts = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\charts.js'

with open(path_charts, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace getColors
old_get_colors = """function getColors() {
  return {
    primary: '#48bb78',       /* Emerald / Folha verde orgânica */
    secondary: '#e2ba94',     /* Areia Dourada Quente */
    tertiary: '#d4a373',      /* Caramelo Bronze */
    barFill: 'rgba(72, 187, 120, 0.75)',
    barBorder: '#48bb78',
    gradStart: 'rgba(72, 187, 120, 0.35)',
    gradEnd: 'rgba(72, 187, 120, 0.02)',
    text: '#faf4eb',          /* Marfim Champagne */
    textMuted: '#a9c6b6',     /* Sálvia Claro */
    grid: 'rgba(223, 185, 146, 0.14)' /* Grade em areia sutil */
  };
}"""

new_get_colors = """function getColors() {
  return {
    primary: '#3d4f61',       /* Nordic Slate Denim */
    secondary: '#f07a53',     /* Warm Coral Orange */
    tertiary: '#64748b',      /* Slate Gray */
    barFill: 'rgba(61, 79, 97, 0.75)',
    barBorder: '#3d4f61',
    gradStart: 'rgba(61, 79, 97, 0.25)',
    gradEnd: 'rgba(61, 79, 97, 0.02)',
    text: '#1e293b',          /* Slate Dark */
    textMuted: '#64748b',     /* Slate Muted */
    grid: 'rgba(226, 232, 240, 0.85)' /* Linhas de grade suaves */
  };
}"""

text = text.replace(old_get_colors.replace('\r\n', '\n'), new_get_colors.replace('\r\n', '\n'))

# Tooltip
old_tooltip = """      tooltip: {
        backgroundColor: '#12392b',
        titleColor: '#faf4eb',
        bodyColor: '#eedfcb',
        borderColor: 'rgba(223, 185, 146, 0.35)',"""

new_tooltip = """      tooltip: {
        backgroundColor: '#273441',
        titleColor: '#ffffff',
        bodyColor: '#f1f5f9',
        borderColor: '#3d4f61',"""

text = text.replace(old_tooltip.replace('\r\n', '\n'), new_tooltip.replace('\r\n', '\n'))

with open(path_charts, 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated charts.js for Nordic Minimalist theme successfully!')
