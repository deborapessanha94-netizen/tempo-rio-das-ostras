import json

with open('data/boletim_metadata.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

d0 = data.get('dias_resumo', [])[0]
print("dias_resumo[0]:")
print(json.dumps(d0, indent=2, ensure_ascii=False))
