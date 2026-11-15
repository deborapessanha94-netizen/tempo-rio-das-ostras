import json

with open('data/boletim_metadata.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

for i, dia in enumerate(d.get('dias_resumo', [])):
    print(f"Day {i} ({dia.get('dia')}):")
    print('  pilares:', dia.get('pilares'))
    print('  informe_populacao count:', len(dia.get('informe_populacao', [])))
    print('  informe_populacao full:')
    for line in dia.get('informe_populacao', []):
        print(f"    - {line}")
