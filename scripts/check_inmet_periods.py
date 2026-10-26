import json
from datetime import datetime, timezone

today_str = '26/10/2026' # or current date

with open('data/inmet_previsao.json', 'r', encoding='utf-8') as f:
    inmet = json.load(f)

if '3304524' in inmet:
    ro = inmet['3304524']
    for d, periods in ro.items():
        print(f"Date: {d}")
        if isinstance(periods, dict):
            for p, pdata in periods.items():
                if isinstance(pdata, dict):
                    print(f"  {p}: resumo={pdata.get('resumo')}, cod_icone={pdata.get('cod_icone')}, temp_min={pdata.get('temp_min')}, temp_max={pdata.get('temp_max')}")
