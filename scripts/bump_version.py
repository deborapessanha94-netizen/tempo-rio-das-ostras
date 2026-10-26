with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('css/styles.css?v=106', 'css/styles.css?v=107')
html = html.replace('js/app.js?v=134', 'js/app.js?v=135')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Bumped cache-busters to styles.css?v=107 and app.js?v=135")
