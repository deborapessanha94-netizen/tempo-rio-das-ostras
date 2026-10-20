import os

# sw.js
sw_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\sw.js'
with open(sw_path, 'r', encoding='utf-8') as f:
    sw = f.read()
sw = sw.replace("'meteo-ostras-v64'", "'meteo-ostras-v65'")
with open(sw_path, 'w', encoding='utf-8') as f:
    f.write(sw)

# index.html
html_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()
html = html.replace('href="css/styles.css?v=64"', 'href="css/styles.css?v=65"')
html = html.replace('src="js/app.js?v=64"', 'src="js/app.js?v=65"')
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

# js/app.js
app_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\app.js'
with open(app_path, 'r', encoding='utf-8') as f:
    app = f.read()
app = app.replace("register('./sw.js?v=64')", "register('./sw.js?v=65')")
with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app)

print("Bumped cache version to v65 across sw.js, index.html, and app.js")
