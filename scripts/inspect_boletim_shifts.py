import json

with open('data/boletim_oficial.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

dates = sorted(list(set(r['data_iso'] for r in d)))
print("Dates in boletim_oficial:", dates)
for date in dates:
    day_rows = [r for r in d if r['data_iso'] == date]
    total_rain = sum(r.get('chuva_media', 0) for r in day_rows)
    shifts_summary = [f"{r.get('turno')}: {r.get('chuva_media', 0):.1f}mm ({r.get('chuva_prob', 0)}%)" for r in day_rows]
    print(f"{date} ({day_rows[0].get('dia_semana')}): total={total_rain:.1f}mm -> {', '.join(shifts_summary)}")
