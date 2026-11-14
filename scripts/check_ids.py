with open('C:/Users/debor/.gemini/antigravity/scratch/meteorologia-app/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

ids_to_check = [
    'section-hero-previsao', 'section-graficos-tendencia', 'section-previsao-3dias', 'section-panorama-sinotico', 'section-plancon-resumo',
    'section-chuva-resumo', 'section-chuva-cards', 'section-chuva-tabela', 'section-chuva-historico',
    'card-telemetria-jundia', 'card-tabela-rio-jundia', 'section-rio-macae',
    'orla-panel-mar', 'orla-panel-mares', 'orla-panel-balnear',
    'section-alertas-oficiais', 'section-cemaden-riscos',
    'section-boletim-turnos', 'section-boletim-telefones',
    'panorama-panel-video', 'panorama-panel-feed', 'panorama-panel-stories', 'panorama-panel-legenda'
]

for my_id in ids_to_check:
    found = f'id="{my_id}"' in text or f"id='{my_id}'" in text
    print(f'{my_id}: {"FOUND" if found else "NOT FOUND"}')
