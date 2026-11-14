import re

with open('scripts/marinha_service.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Add math import
if 'import math' not in code:
    code = code.replace('import json', 'import json\nimport math', 1)

old_fn = """def generate_harmonic_tide_for_day(dt):
    \"\"\"Gera predição de maré semi-diurna caso a data não esteja no banco fixo\"\"\"
    ref_dt = datetime(2026, 10, 19, 4, 10)
    events = []
    for step in range(8):
        t_event = ref_dt + timedelta(hours=step * 6.2104)
        if t_event.date() == dt.date():
            is_high = (step % 2 == 1)
            tipo = "PREAMAR" if is_high else "BAIXA-MAR"
            alt = round(1.10 + 0.35 * (1 if is_high else -1), 2)
            events.append({
                "tipo": tipo,
                "hora": t_event.strftime("%H:%M"),
                "altura": alt,
                "rotulo": f"{'Preia-mar' if is_high else 'Baixa-mar'} ({alt:.1f} m)"
            })
    events.sort(key=lambda x: x["hora"])
    return events"""

new_fn = """def generate_harmonic_tide_for_day(dt):
    \"\"\"Gera predição astronômica de maré semi-diurna contínua para qualquer data do ano (Estação #39 Imbetiba)\"\"\"
    ref_high = datetime(2026, 10, 24, 1, 2)
    half_m2_h = 12.4206012 / 2.0  # 6.2103h
    synodic_days = 29.530588

    start_day = datetime(dt.year, dt.month, dt.day, 0, 0)
    end_day = start_day + timedelta(days=1)

    diff_h = (start_day - ref_high).total_seconds() / 3600.0
    k_start = int(diff_h / half_m2_h) - 1

    events = []
    for k in range(k_start, k_start + 7):
        t_event = ref_high + timedelta(hours=k * half_m2_h)
        if start_day <= t_event < end_day:
            is_high = (k % 2 == 0)
            tipo = "PREAMAR" if is_high else "BAIXA-MAR"
            label_prefix = "Preia-mar" if is_high else "Baixa-mar"

            days_from_ref = (t_event - ref_high).total_seconds() / 86400.0
            spring_factor = math.cos(2 * math.pi * days_from_ref / (synodic_days / 2.0))

            if is_high:
                alt = round(1.15 + 0.30 * spring_factor, 2)
            else:
                alt = round(0.30 - 0.15 * spring_factor, 2)

            events.append({
                "tipo": tipo,
                "hora": t_event.strftime("%H:%M"),
                "altura": alt,
                "rotulo": f"{label_prefix} ({alt:.1f} m)"
            })
    events.sort(key=lambda x: x["hora"])
    return events"""

assert old_fn in code, "old_fn not found in marinha_service.py"
code = code.replace(old_fn, new_fn, 1)

with open('scripts/marinha_service.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("marinha_service.py updated with robust harmonic tide generator!")
