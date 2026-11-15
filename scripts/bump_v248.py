p = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\scripts\build_and_deploy.py'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('meteo-ostras-v247', 'meteo-ostras-v248')

with open(p, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(c)
print('build_and_deploy.py bumped to v248!')
