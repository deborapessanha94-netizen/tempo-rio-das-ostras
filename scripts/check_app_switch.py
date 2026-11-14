with open('C:/Users/debor/.gemini/antigravity/scratch/meteorologia-app/index.html', 'r', encoding='utf-8') as fp:
    html = fp.read()

for sid in ['section-hero-previsao', 'section-graficos-tendencia', 'section-previsao-3dias', 'section-panorama-sinotico', 'section-plancon-resumo']:
    idx = html.find(f'id="{sid}"')
    if idx != -1:
        start = html.rfind('<', 0, idx)
        end = html.find('>', idx) + 1
        print(repr(html[start:end]))
