with open('C:/Users/debor/.gemini/antigravity/scratch/meteorologia-app/index.html', 'r', encoding='utf-8') as fp:
    html = fp.read()

idx = html.find('id="app-sidebar-nav"')
print(html[idx-10:idx+120])
