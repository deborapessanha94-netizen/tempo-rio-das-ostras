import os

html_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Make 199 button and action buttons whitespace-nowrap
html = html.replace(
    'class="btn-emergency flex items-center gap-1.5 text-xs font-extrabold"',
    'class="btn-emergency flex items-center gap-1.5 text-xs font-extrabold whitespace-nowrap"'
)
html = html.replace(
    '<span class="hidden lg:inline text-xs font-bold text-black">• Defesa Civil</span>',
    '<span class="hidden lg:inline text-xs font-bold text-black whitespace-nowrap">• Defesa Civil</span>'
)
html = html.replace(
    'class="btn-action-slate flex items-center gap-1.5 text-xs font-bold"',
    'class="btn-action-slate flex items-center gap-1.5 text-xs font-bold whitespace-nowrap"'
)
html = html.replace(
    'class="btn-action-outline flex items-center gap-1.5 text-xs font-bold cursor-pointer"',
    'class="btn-action-outline flex items-center gap-1.5 text-xs font-bold cursor-pointer whitespace-nowrap"'
)
html = html.replace(
    'class="btn-action-outline flex items-center gap-1.5 cursor-pointer text-xs font-bold"',
    'class="btn-action-outline flex items-center gap-1.5 cursor-pointer text-xs font-bold whitespace-nowrap"'
)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated index.html with whitespace-nowrap for header buttons")
