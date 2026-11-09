import re

SCRIPT_PATH = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\scripts\auto_bulletin.py'

with open(SCRIPT_PATH, 'r', encoding='utf-8', errors='ignore') as f:
    code = f.read()

# 1. Update url_om with forecast_days=8
code = code.replace(
    '"&timezone=America%2FSao_Paulo"\n    )',
    '"&forecast_days=8&timezone=America%2FSao_Paulo"\n    )'
)

# 2. Update url_marine with forecast_days=8
code = code.replace(
    '"&hourly=wave_height,wave_direction,wave_period&timezone=America%2FSao_Paulo"',
    '"&hourly=wave_height,wave_direction,wave_period&forecast_days=8&timezone=America%2FSao_Paulo"'
)

# 3. Update day_idx loop to 8 days (Hoje + 7 dias à frente)
code = code.replace('for day_idx in range(4):', 'for day_idx in range(8):')

# 4. Update periodo_str to use dias_3[-1] instead of dias_3[3]
code = code.replace(
    'periodo_str = f"{dias_3[0][\'date_short\']} ({dias_3[0][\'dia_semana\']}) a {dias_3[3][\'date_short\']} ({dias_3[3][\'dia_semana\']})"',
    'periodo_str = f"{dias_3[0][\'date_short\']} ({dias_3[0][\'dia_semana\']}) a {dias_3[-1][\'date_short\']} ({dias_3[-1][\'dia_semana\']})"'
)

# 5. Update formulas in metadata summary
old_formulas = '''        "acumulado_3dias_media": round(sum(d['chuva_tot'] for d in dias_3), 1),
        "acumulado_3dias_formula": f"{dias_3[0]['chuva_tot']:.1f} mm (Hoje) + {dias_3[1]['chuva_tot']:.1f} mm (D+1) + {dias_3[2]['chuva_tot']:.1f} mm (D+2)" + (f" + {dias_3[3]['chuva_tot']:.1f} mm (D+3)" if len(dias_3) > 3 else "") + f" = {sum(d['chuva_tot'] for d in dias_3):.1f} mm",
        "acumulado_4dias_formula": f"{dias_3[0]['chuva_tot']:.1f} mm (Hoje) + {dias_3[1]['chuva_tot']:.1f} mm (D+1) + {dias_3[2]['chuva_tot']:.1f} mm (D+2)" + (f" + {dias_3[3]['chuva_tot']:.1f} mm (D+3)" if len(dias_3) > 3 else "") + f" = {sum(d['chuva_tot'] for d in dias_3):.1f} mm",
        "acumulado_4dias_media": round(sum(d['chuva_tot'] for d in dias_3), 1),'''

new_formulas = '''        "acumulado_3dias_media": round(sum(d['chuva_tot'] for d in dias_3[:3]), 1),
        "acumulado_4dias_media": round(sum(d['chuva_tot'] for d in dias_3[:4]), 1),
        "acumulado_semana_media": round(sum(d['chuva_tot'] for d in dias_3), 1),
        "acumulado_semana_formula": " + ".join([f"{d['chuva_tot']:.1f} mm ({d['dia_semana'][:3]})" for d in dias_3]) + f" = {sum(d['chuva_tot'] for d in dias_3):.1f} mm",
        "acumulado_8dias_formula": " + ".join([f"{d['chuva_tot']:.1f} mm ({d['dia_semana'][:3]})" for d in dias_3]) + f" = {sum(d['chuva_tot'] for d in dias_3):.1f} mm",
        "acumulado_8dias_media": round(sum(d['chuva_tot'] for d in dias_3), 1),'''

if old_formulas in code:
    code = code.replace(old_formulas, new_formulas)
    print("SUCCESS: Replaced formulas in metadata")
else:
    print("WARNING: Could not find exact old_formulas block")

with open(SCRIPT_PATH, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: Patched scripts/auto_bulletin.py for 8-day (1 week) forecast!")
