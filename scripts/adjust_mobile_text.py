with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace text-[11px] with text-[10.5px] tracking-tight
html = html.replace('text-[11px] sm:text-xs lg:text-sm font-black', 'text-[10.5px] sm:text-xs lg:text-sm font-black tracking-tight')
html = html.replace('text-[11px] sm:text-xs lg:text-sm font-bold', 'text-[10.5px] sm:text-xs lg:text-sm font-bold tracking-tight')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace('text-[11px] sm:text-xs lg:text-sm font-black', 'text-[10.5px] sm:text-xs lg:text-sm font-black tracking-tight')
js = js.replace('text-[11px] sm:text-xs lg:text-sm font-bold', 'text-[10.5px] sm:text-xs lg:text-sm font-bold tracking-tight')

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Updated typography to text-[10.5px] tracking-tight")
