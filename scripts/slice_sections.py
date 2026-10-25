with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get_lines(start, end):
    return "".join(lines[start-1:end])

# Let's locate the exact start and end line of each section
# 1. nav-tabs: L130 - L153
# 2. section-alertas-oficiais: L163 - L336
# 3. section-panorama-sinotico: L337 - L411
# 4. section-previsao-3dias: L412 - L649
# 5. Hero Card: L664 - L807
# 6. Bulletin Chart Card: L808 - L851
# 7. card-condicoes-orla: L854 - L1094
# 8. card-telemetria-jundia: L1101 - L1160
# 9. card-telefones-uteis: L1163 - L1241
# 10. card-chuva-turnos: L1244 - L1338
# 11. view-tab-chuva: L1349 - L1600

with open('scripts/extracted_sections.py', 'w', encoding='utf-8') as out:
    out.write("# Markers verification\n")

print("Checking markers...")
for i, l in enumerate(lines):
    for tag in ['id="app-main-tabs"', 'id="section-alertas-oficiais"', 'id="section-panorama-sinotico"',
                'id="section-previsao-3dias"', 'id="hero-condition"', 'id="bulletin-chart"',
                'id="card-condicoes-orla"', 'id="card-telemetria-jundia"', 'id="card-telefones-uteis"',
                'id="card-chuva-turnos"', 'id="view-tab-chuva"']:
        if tag in l:
            print(f"{tag}: L{i+1}")
