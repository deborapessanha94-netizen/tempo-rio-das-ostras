with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. body overflow-x-hidden
html = html.replace(
    '<body class="antialiased selection:bg-[#ffebe4] selection:text-black pb-12 min-h-screen bg-[#f4f6f8] text-[#1e293b]">',
    '<body class="antialiased selection:bg-[#ffebe4] selection:text-black pb-12 min-h-screen bg-[#f4f6f8] text-[#1e293b] overflow-x-hidden">'
)

# 2. hide meteogramas in header on mobile
html = html.replace(
    '<button id="dock-btn-meteogramas" class="btn-action-outline flex items-center gap-1.5 text-xs font-bold cursor-pointer whitespace-nowrap"',
    '<button id="dock-btn-meteogramas" class="hidden sm:flex btn-action-outline items-center gap-1.5 text-xs font-bold cursor-pointer whitespace-nowrap"'
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Applied mobile overflow fixes to index.html!")
