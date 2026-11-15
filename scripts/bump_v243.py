with open('scripts/build_and_deploy.py', 'r', encoding='utf-8') as f:
    bd = f.read()

bd_new = bd.replace('meteo-ostras-v242', 'meteo-ostras-v243').replace('v242', 'v243')
with open('scripts/build_and_deploy.py', 'w', encoding='utf-8') as f:
    f.write(bd_new)
print('Updated build_and_deploy.py to v243')

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    app = f.read()

if 'v242' in app:
    app_new = app.replace('v242', 'v243')
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(app_new)
    print('Updated App.tsx to v243')
else:
    print('v242 not explicitly in App.tsx (built via build_and_deploy)')
