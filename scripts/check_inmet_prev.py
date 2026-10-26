import json

with open('data/inmet_previsao.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# INMET previsao has geocode keys, e.g. '3304524'
print("Keys:", list(data.keys()))
if '3304524' in data:
    ro = data['3304524']
    print("Dates in 3304524:", list(ro.keys()))
    first_date = list(ro.keys())[0]
    print(f"Date {first_date}:", json.dumps(ro[first_date], indent=2, ensure_ascii=False))
