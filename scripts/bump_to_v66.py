import os

html_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Update Alertas header
html = html.replace('border-b border-[#dfb992]/15 pb-3 mb-4', 'border-b border-[#cbd5e1] pb-3 mb-4')
html = html.replace('w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0', 'w-8 h-8 rounded-xl bg-[#ffebe4] text-black border border-[#f97316] flex items-center justify-center shrink-0 shadow-xs')
html = html.replace('<h2 class="text-base sm:text-lg font-bold text-[#1e293b] tracking-tight">', '<h2 class="text-base sm:text-lg font-bold text-black tracking-tight font-heading">')
html = html.replace('bg-[#f07a53]/15 text-[#d8623b] border border-[#f07a53]/30', 'bg-[#ffebe4] text-black border border-[#f97316]')
html = html.replace('text-xs font-bold text-[#f07a53] hover:text-[#d8623b] hover:underline cursor-pointer', 'text-xs font-bold text-black hover:underline cursor-pointer')

# Update static fallback card
html = html.replace('border-b border-[#dfb992]/15 pb-1.5', 'border-b border-[#cbd5e1] pb-2')
html = html.replace('bg-zinc-100 text-[#334155] tracking-wide', 'bg-[#f1f5f9] text-black border border-[#cbd5e1] tracking-wide')
html = html.replace('bg-emerald-50 text-emerald-700 border border-emerald-200', 'bg-[#eaf0f6] text-black border border-[#cbd5e1]')
html = html.replace('bg-amber-100 text-amber-900 border border-amber-300', 'bg-[#ffebe4] text-black border border-[#f97316]')
html = html.replace('text-sm sm:text-base font-bold text-[#1e293b] leading-tight', 'text-sm sm:text-base font-bold text-black font-heading leading-tight')

# Bump version to v66
html = html.replace('css/styles.css?v=65', 'css/styles.css?v=66')
html = html.replace('js/app.js?v=65', 'js/app.js?v=66')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

# sw.js
sw_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\sw.js'
with open(sw_path, 'r', encoding='utf-8') as f:
    sw = f.read()
sw = sw.replace("'meteo-ostras-v65'", "'meteo-ostras-v66'")
with open(sw_path, 'w', encoding='utf-8') as f:
    f.write(sw)

# js/app.js
app_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\app.js'
with open(app_path, 'r', encoding='utf-8') as f:
    app = f.read()
app = app.replace("register('./sw.js?v=65')", "register('./sw.js?v=66')")
with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app)

print("Updated index.html, sw.js, and app.js (v66) successfully")
