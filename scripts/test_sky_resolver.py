import json

with open('data/boletim_metadata.json', 'r', encoding='utf-8') as f:
    meta = json.load(f)

with open('data/inmet_previsao.json', 'r', encoding='utf-8') as f:
    inmet = json.load(f)

d0 = meta.get('dias_resumo', [])[0]
subtitulo = d0.get('subtitulo', '')
pilares_ceu = d0.get('pilares', {}).get('ceu', {}).get('val', '')
chuva_val = d0.get('pilares', {}).get('chuva', {}).get('val', '')

inmet_resumo = ""
if '3304524' in inmet:
    ro = inmet['3304524']
    first_date = list(ro.keys())[0]
    inmet_resumo = ro[first_date].get('manha', {}).get('resumo', '')

print("Input data:")
print("  d0.subtitulo:", subtitulo)
print("  d0.pilares.ceu:", pilares_ceu)
print("  d0.pilares.chuva:", chuva_val)
print("  inmet_resumo (manha):", inmet_resumo)

def resolve_sky(inmet_res, sub, ceu_val, chuva):
    combined = f"{inmet_res} {sub} {ceu_val}".lower()
    
    # 1. Trovoadas / Tempestade
    if any(k in combined for k in ['trovoada', 'tempestade', 'raios', 'temporal']):
        return {
            'icon': 'cloud-lightning',
            'sky_condition': 'Céu Carregado com Trovoadas e Raios',
            'title': 'Muitas nuvens com pancadas de chuva e trovoadas',
            'color': 'amber'
        }
    # 2. Chuva forte / moderada / pancadas
    if any(k in combined for k in ['pancadas de chuva', 'chuva forte', 'chuva moderada', 'chuva contínua']):
        return {
            'icon': 'cloud-rain',
            'sky_condition': 'Céu Encoberto com Pancadas de Chuva',
            'title': 'Nublado com Pancadas de Chuva',
            'color': 'blue'
        }
    # 3. Garoa / Chuvisco
    if any(k in combined for k in ['garoa', 'chuvisco', 'chuva fraca', 'chuva leve', 'chuva fina']):
        return {
            'icon': 'cloud-drizzle',
            'sky_condition': 'Céu Úmido com Garoa / Chuva Fina',
            'title': 'Nublado com Garoa',
            'color': 'cyan'
        }
    # 4. Sol / Ensolarado / Limpo
    if any(k in combined for k in ['ensolarado', 'céu claro', 'céu limpo', 'sol pleno']) and not any(k in combined for k in ['nuvens', 'chuva']):
        return {
            'icon': 'sun',
            'sky_condition': 'Céu Claro e Ensolarado (Sem Nuvens)',
            'title': 'Ensolarado / Céu Aberto',
            'color': 'yellow'
        }
    # 5. Parcialmente Nublado / Sol com Nuvens
    if any(k in combined for k in ['parcialmente nublado', 'sol entre nuvens', 'poucas nuvens', 'aberturas de sol', 'sol e aumento de nuvens']):
        return {
            'icon': 'cloud-sun',
            'sky_condition': 'Sol com Variação de Nuvens',
            'title': 'Parcialmente Nublado / Sol com Nuvens',
            'color': 'orange'
        }
    # 6. Encoberto / Nublado (sem chuva)
    if any(k in combined for k in ['encoberto', 'nublado', 'muitas nuvens']):
        return {
            'icon': 'cloud',
            'sky_condition': 'Céu Encoberto a Nublado (Muitas Nuvens)',
            'title': 'Encoberto / Nublado',
            'color': 'slate'
        }
    
    return {
        'icon': 'cloud-sun',
        'sky_condition': 'Tempo Variável',
        'title': 'Condição Mista',
        'color': 'slate'
    }

resolved = resolve_sky(inmet_resumo, subtitulo, pilares_ceu, chuva_val)
print("\nResolved:")
for k, v in resolved.items():
    print(f"  {k}: {v}")
