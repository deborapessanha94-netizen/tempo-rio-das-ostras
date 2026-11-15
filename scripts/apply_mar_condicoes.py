import json

MAR_TEXTOS = [
    # Dia 0: Sábado 14/11
    {
        "ondas_pilares": "0,4 a 1,6 m (Mod.)",
        "mar_texto": "Condições do mar na orla: Ondas de 0,4 a 0,7 m nas enseadas abrigadas (Praia do Bosque, Tartaruga e Centro) com águas calmas; e de 1,2 a 1,6 m em praias oceânicas de mar aberto (Costazul e Mar do Norte) com arrebentação regular sob ondulação de SE/E (Sem avisos de ressaca da Marinha do Brasil na Área Delta)."
    },
    # Dia 1: Domingo 15/11
    {
        "ondas_pilares": "0,4 a 1,8 m (Agitando)",
        "mar_texto": "Condições do mar na orla: Ondas de 0,4 a 0,7 m nas enseadas abrigadas; e de 1,2 a 1,8 m em praias de mar aberto (Costazul e Mar do Norte), com mar moderado a agitado e intensificação de vento e ondulação à noite (Aviso nº 781 da Marinha do Brasil)."
    },
    # Dia 2: Segunda 16/11
    {
        "ondas_pilares": "0,3 a 1,4 m (Mod.)",
        "mar_texto": "Condições do mar na orla: Ondas de 0,3 a 0,5 m nas enseadas abrigadas e de 1,0 a 1,4 m em praias de mar aberto (Costazul) com ondulação de E/NE e arrebentação moderada (Sem avisos de ressaca da Marinha do Brasil vigentes na Área Delta)."
    },
    # Dia 3: Terça 17/11
    {
        "ondas_pilares": "0,3 a 1,2 m (Calmo a Mod.)",
        "mar_texto": "Condições do mar na orla: Ondas de 0,3 a 0,5 m nas enseadas e de 0,8 a 1,2 m em mar aberto com swell suave de E/NE e mar calmo a moderado (Sem avisos de ressaca da Marinha do Brasil vigentes na Área Delta)."
    },
    # Dia 4: Quarta 18/11
    {
        "ondas_pilares": "0,4 a 1,3 m (Mod.)",
        "mar_texto": "Condições do mar na orla: Ondas de 0,4 a 0,6 m nas enseadas abrigadas e de 0,9 a 1,3 m em praias de mar aberto sob ondulação de E e mar moderado (Sem avisos de ressaca da Marinha do Brasil vigentes na Área Delta)."
    },
    # Dia 5: Quinta 19/11
    {
        "ondas_pilares": "0,3 a 1,1 m (Calmo)",
        "mar_texto": "Condições do mar na orla: Ondas de 0,3 a 0,5 m nas enseadas e de 0,7 a 1,1 m em mar aberto com mar predominantemente calmo a moderado (Sem avisos de ressaca da Marinha do Brasil vigentes na Área Delta)."
    },
    # Dia 6: Sexta 20/11
    {
        "ondas_pilares": "0,4 a 1,2 m (Mod.)",
        "mar_texto": "Condições do mar na orla: Ondas de 0,4 a 0,6 m nas enseadas e de 0,8 a 1,2 m em praias de mar aberto com mar moderado (Sem avisos de ressaca da Marinha do Brasil vigentes na Área Delta)."
    },
    # Dia 7: Sábado 21/11
    {
        "ondas_pilares": "0,3 a 1,1 m (Calmo)",
        "mar_texto": "Condições do mar na orla: Ondas de 0,3 a 0,5 m nas enseadas abrigadas e de 0,7 a 1,1 m em mar aberto com mar predominantemente calmo a moderado (Sem avisos de ressaca da Marinha do Brasil vigentes na Área Delta)."
    }
]

with open('data/boletim_metadata.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Update dias_resumo
for i, dia in enumerate(data.get('dias_resumo', [])):
    if i < len(MAR_TEXTOS):
        cfg = MAR_TEXTOS[i]
        # Update or add 6th paragraph
        inf = dia.get('informe_populacao', [])
        # filter out any existing sea paragraph
        inf = [p for p in inf if not (p.lower().startswith('condições do mar') or p.lower().startswith('mar na orla'))]
        inf.append(cfg['mar_texto'])
        dia['informe_populacao'] = inf
        
        # Also update pilares.mar
        if 'pilares' not in dia or not isinstance(dia['pilares'], dict):
            dia['pilares'] = {}
        dia['pilares']['mar'] = {
            "label": "MAR E PRAIA",
            "val": cfg['ondas_pilares'],
            "icon": "waves"
        }

# Update evolucao_3_dias in sinopse_estruturada
if 'sinopse_estruturada' in data and 'evolucao_3_dias' in data['sinopse_estruturada']:
    for i, dia in enumerate(data['sinopse_estruturada']['evolucao_3_dias']):
        if i < len(MAR_TEXTOS):
            cfg = MAR_TEXTOS[i]
            inf = dia.get('informe_populacao', [])
            inf = [p for p in inf if not (p.lower().startswith('condições do mar') or p.lower().startswith('mar na orla'))]
            inf.append(cfg['mar_texto'])
            dia['informe_populacao'] = inf
            if 'pilares' in dia and isinstance(dia['pilares'], dict):
                dia['pilares']['mar'] = {
                    "label": "MAR E PRAIA",
                    "val": cfg['ondas_pilares'],
                    "icon": "waves"
                }

with open('data/boletim_metadata.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("SUCCESS: Updated data/boletim_metadata.json with sea conditions for all 8 days!")
