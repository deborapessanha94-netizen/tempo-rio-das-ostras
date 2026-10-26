with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('css/styles.css?v=105', 'css/styles.css?v=106')
html = html.replace('js/app.js?v=133', 'js/app.js?v=134')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Bumped cache-busters to styles.css?v=106 and app.js?v=134")
