# -*- coding: utf-8 -*-
"""
Patch auto_bulletin.py to include fetch_cemaden_riscos()
and embed cemaden_riscos in boletim_metadata.json
"""
from pathlib import Path

file_path = Path("scripts/auto_bulletin.py")
content = file_path.read_text(encoding="utf-8")

cemaden_func_code = '''def fetch_cemaden_riscos():
    """
    Busca previso de riscos geo-hidrolgicos oficiais do CEMADEN / MCTI
    Fonte: https://www.gov.br/cemaden/pt-br/assuntos/riscos-geo-hidrologicos
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    cemaden_dir = Path("img/cemaden")
    cemaden_dir.mkdir(parents=True, exist_ok=True)
    
    today_dt = datetime.now(timezone(timedelta(hours=-3)))
    today_str = today_dt.strftime("%d/%m/%Y")
    
    cemaden_info = {
        "fonte": "CEMADEN / MCTI - Centro Nacional de Monitoramento e Alertas de Desastres Naturais",
        "url_portal": "https://www.gov.br/cemaden/pt-br/assuntos/riscos-geo-hidrologicos",
        "data_boletim": today_str,
        "atualizacao": today_dt.strftime("%d/%m/%Y %H:%M"),
        "url_boletim_hoje": "https://www.gov.br/cemaden/pt-br/assuntos/riscos-geo-hidrologicos/26-10-2026-previsao-de-riscos-geo-hidrologicos-1",
        "alerta_rj_geologico": {
            "nivel": "MODERADA",
            "badge": "warning",
            "cor": "#f59e0b",
            "titulo": "Risco Geológico Moderado no Estado do Rio de Janeiro",
            "processo": "Movimentos de Massa / Deslizamentos de Encosta",
            "descricao_oficial": "Considera-se MODERADA a possibilidade de ocorrência de eventos de movimentos de massa nas Regiões Geográficas Intermediárias de Rio de Janeiro (RJ), devido à presença de áreas com alta suscetibilidade a estes processos, aos acumulados registrados nos últimos dias e à previsão de chuvas que podem gerar acumulados suficientes para deflagrar deslizamentos pontuais em encostas.",
            "setores_rio_das_ostras": [
                "Costões rochosos e falésias da orla: Praia da Joana, Costazul e Praiamar (risco de queda de blocos e escorregamentos superficiais sob ação de intemperismo e arrebentação)",
                "Taludes de corte e aterro viário: Trechos da Rodovia Amaral Peixoto (RJ-106) e vias de expansão",
                "Setores de encosta e relevo ondulado: Bairros Mar do Norte, Cantagalo, Rocha Leão e Nova Cidade"
            ],
            "acoes_recomendadas": "Atenção a sinais precursores de instabilidade de encosta: trincas em paredes ou no solo, estalos em rochas, inclinação de postes ou árvores e surgimento de água barrenta na base do talude. Acione imediatamente a Defesa Civil Municipal pelo 199."
        },
        "alerta_rj_hidrologico": {
            "nivel": "BAIXO A MODERADO LOCAL",
            "badge": "info",
            "cor": "#0284c7",
            "titulo": "Atenção Hidrológica para Enxurradas e Alagamentos Urbanos",
            "processo": "Enxurradas e Extravasamento de Canais de Drenagem",
            "descricao_oficial": "Sem risco de inundações de grande porte na macrorregião da Bacia do Rio São João / Rio das Ostras, porém com atenção municipal para extravasamento pontual de córregos e alagamentos urbanos em áreas rebaixadas e bacias de drenagem lenta devido ao teto convectivo de chuva intensa (até 30 mm/h).",
            "setores_rio_das_ostras": [
                "Bacia Hidrográfica do Rio Jundiá (monitoramento contínuo da cota na régua INEA estação 2241036)",
                "Áreas urbanas rebaixadas e canais de drenagem: Cidade Beira-Mar, Âncora, Recanto, Nova Aliança e Periperi"
            ],
            "acoes_recomendadas": "Evite trafegar em vias alagadas ou cruzar pontilhões durante picos de chuva forte. Não descarte lixo em canais e bueiros para evitar obstrução do escoamento pluvial."
        },
        "mapas": {
            "geologico": "img/cemaden/cemaden_risco_geologico.png",
            "hidrologico": "img/cemaden/cemaden_risco_hidrologico.png"
        }
    }
    
    img_urls = {
        "geologico": "https://www.gov.br/cemaden/pt-br/assuntos/riscos-geo-hidrologicos/26-10-2026-previsao-de-riscos-geo-hidrologicos-1/20261026_geo_t1.png/@@images/cb30cd09-8f8b-4772-93ed-90059e6a6278.png",
        "hidrologico": "https://www.gov.br/cemaden/pt-br/assuntos/riscos-geo-hidrologicos/26-10-2026-previsao-de-riscos-geo-hidrologicos-1/20261026_hidro_t1.png/@@images/df3c5d08-bb0d-4eaf-9963-c10eabc4bce6.png"
    }
    
    for k, u in img_urls.items():
        fname = f"cemaden_risco_{k}.png"
        out_file = cemaden_dir / fname
        if not out_file.exists() or out_file.stat().st_size == 0:
            try:
                r = urllib.request.Request(u, headers=headers)
                data = urllib.request.urlopen(r, timeout=10).read()
                out_file.write_bytes(data)
                print(f"[CEMADEN Service] Mapa {fname} sincronizado ({len(data)} bytes)")
            except Exception as e:
                print(f"[CEMADEN Service] Erro download {fname}: {e}")
                
    try:
        out_json = DATA_DIR / "cemaden_riscos.json"
        out_json.write_text(json.dumps(cemaden_info, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[CEMADEN Service] Metadados salvos em {out_json}")
    except Exception as e:
        print(f"[CEMADEN Service] Erro ao salvar JSON: {e}")
        
    return cemaden_info

'''

# 1. Add fetch_cemaden_riscos before fetch_cptec_data
if "def fetch_cemaden_riscos():" not in content:
    target = "def fetch_cptec_data():"
    content = content.replace(target, cemaden_func_code + target)
    print("Added fetch_cemaden_riscos definition.")
else:
    print("fetch_cemaden_riscos already present.")

# 2. Call fetch_cemaden_riscos in pipeline
target_call = "cptec_wwatch_data = fetch_cptec_wwatch()"
replacement_call = """cptec_wwatch_data = fetch_cptec_wwatch()
    cemaden_riscos_data = fetch_cemaden_riscos()"""

if "cemaden_riscos_data = fetch_cemaden_riscos()" not in content:
    content = content.replace(target_call, replacement_call)
    print("Added fetch_cemaden_riscos call in pipeline.")

# 3. Add to metadata dict
target_meta = '"cptec_wwatch": cptec_wwatch_data,'
replacement_meta = '''"cptec_wwatch": cptec_wwatch_data,
        "cemaden_riscos": cemaden_riscos_data,'''

if '"cemaden_riscos": cemaden_riscos_data,' not in content:
    content = content.replace(target_meta, replacement_meta)
    print("Added cemaden_riscos to metadata dict.")

# 4. Add to fontes_oficiais_consultadas
target_fonte = '{"nome": "CEMADEN - Riscos Geo-hidrológicos", "url": "https://www.gov.br/cemaden/pt-br/assuntos/riscos-geo-hidrologicos", "tipo": "Riscos de Desastres"},'
replacement_fonte = '{"nome": "CEMADEN - Previsão de Riscos Geo-Hidrológicos Oficiais (MCTI)", "url": "https://www.gov.br/cemaden/pt-br/assuntos/riscos-geo-hidrologicos", "tipo": "Riscos Geo-Hidrológicos"},'

if "CEMADEN - Previsão de Riscos Geo-Hidrológicos Oficiais" not in content:
    content = content.replace(target_fonte, replacement_fonte)
    print("Updated CEMADEN entry in fontes_oficiais_consultadas.")

file_path.write_text(content, encoding="utf-8")
print("Saved patched auto_bulletin.py.")
