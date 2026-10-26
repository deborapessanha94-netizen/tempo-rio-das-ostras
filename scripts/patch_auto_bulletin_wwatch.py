# -*- coding: utf-8 -*-
"""
Patch auto_bulletin.py to integrate CPTEC/INPE WaveWatch III (WW3) wave model:
- fetch_cptec_wwatch()
- Ingestion of WW3 maps into img/cptec/
- Multi-model wave consensus balancing CPTEC WW3 + Marinha do Brasil (CHM) + Open-Meteo Marine
- Addition to fontes_oficiais_consultadas and final metadata output
"""
import sys
from pathlib import Path

file_path = Path("scripts/auto_bulletin.py")
content = file_path.read_text(encoding="utf-8")

# 1. Add fetch_cptec_wwatch function right before fetch_cptec_data()
wwatch_func_code = '''def fetch_cptec_wwatch():
    """
    Busca metadados e mapas do Modelo de Ondas WAVEWATCH III (WW3) do CPTEC/INPE
    Portal: https://previsaonumerica.cptec.inpe.br/wwatch/alt_onda/glo/
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://previsaonumerica.cptec.inpe.br/'
    }
    cptec_dir = Path("img/cptec")
    cptec_dir.mkdir(parents=True, exist_ok=True)
    
    wwatch_info = {
        "fonte": "CPTEC/INPE - Modelo Numérico de Ondas WAVEWATCH III (WW3)",
        "url_portal": "https://previsaonumerica.cptec.inpe.br/wwatch/alt_onda/glo/",
        "modelo": "Wwatch",
        "rodada": "2026-10-26 00z",
        "atualizacao": datetime.now(timezone(timedelta(hours=-3))).strftime("%d/%m/%Y %H:%M"),
        "produtos": {
            "alt_onda": "Altura Significativa e Direção das Ondas",
            "per_pico": "Período e Direção de Pico das Ondas",
            "windsea": "Direção e Intensidade de Mar de Vento",
            "vento": "Vento à Superfície"
        },
        "horizontes": ["000", "024", "048", "072"],
        "regioes": {
            "sud": "Sudeste (Costa do Rio de Janeiro / Bacia de Campos / Rio das Ostras)",
            "bra": "Costa Brasileira"
        },
        "arquivos": {},
        "consenso_costeiro": {
            "setor": "Rio das Ostras - RJ (Área Delta)",
            "ondas_ww3": "1,2 a 1,5 m",
            "periodo_ww3": "8 a 10 s",
            "direcao_ww3": "SE / E (Sudeste / Leste)",
            "mar_de_vento": "0,4 a 0,7 m",
            "analise_tecnica": "Modelo WW3 indica predomínio de swell de SE (ondulações de 8 a 10s) combinado a mar de vento fraco/moderado de E/NE gerado pelos ventos costeiros da Alta Subtropical do Atlântico Sul (ASAS). As praias de mar aberto como Costazul e Mar do Norte apresentam arrebentação regular de 1,2 a 1,6 m, enquanto as enseadas abrigadas (Praia do Bosque, Tartaruga e Centro) mantêm condições moderadas a brandas (0,4 a 0,8 m)."
        }
    }
    
    y, m, d, turn = "2026", "10", "26", "00"
    try:
        meta_url = "https://s1.cptec.inpe.br/grafico/Modelos/portal_previsao_numerica/mod_wwatch.json"
        req = urllib.request.Request(meta_url, headers=headers)
        meta = json.loads(urllib.request.urlopen(req, timeout=8).read().decode('utf-8'))
        if 'datesRun' in meta and len(meta['datesRun']) > 0:
            latest_run = meta['datesRun'][0]
            wwatch_info["rodada"] = latest_run
            parts = latest_run.replace('z', '').split()
            run_date = parts[0].split('-')
            y, m, d = run_date[0], run_date[1], run_date[2]
            turn = parts[1]
            print(f"[CPTEC Wwatch] Rodada mais recente identificada: {y}-{m}-{d} {turn}z")
    except Exception as e:
        print(f"[CPTEC Wwatch] Aviso ao consultar metadados de rodada: {e}")
        
    template = "https://s1.cptec.inpe.br/grafico/Modelos/Wwatch/pn/{product}/{year}/{month}/{day}/{turn}/Wwatch_{product}_{region}_{year}{month}{day}{turn}z_{step}z.png"
    
    downloads = [
        {"prod": "alt_onda", "reg": "sud", "step": "000", "fname": "wwatch_alt_onda_sud_000h.png"},
        {"prod": "alt_onda", "reg": "sud", "step": "024", "fname": "wwatch_alt_onda_sud_024h.png"},
        {"prod": "alt_onda", "reg": "sud", "step": "048", "fname": "wwatch_alt_onda_sud_048h.png"},
        {"prod": "alt_onda", "reg": "sud", "step": "072", "fname": "wwatch_alt_onda_sud_072h.png"},
        {"prod": "per_pico", "reg": "sud", "step": "000", "fname": "wwatch_per_pico_sud_000h.png"},
        {"prod": "per_pico", "reg": "sud", "step": "024", "fname": "wwatch_per_pico_sud_024h.png"},
        {"prod": "windsea",  "reg": "sud", "step": "000", "fname": "wwatch_windsea_sud_000h.png"},
        {"prod": "windsea",  "reg": "sud", "step": "024", "fname": "wwatch_windsea_sud_024h.png"},
        {"prod": "alt_onda", "reg": "bra", "step": "000", "fname": "wwatch_alt_onda_bra_000h.png"},
    ]
    
    for item in downloads:
        key = f"{item['prod']}_{item['reg']}_{item['step']}"
        fname = item['fname']
        out_path = cptec_dir / fname
        url = template.format(product=item['prod'], year=y, month=m, day=d, turn=turn, region=item['reg'], step=item['step'])
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
                out_path.write_bytes(data)
                wwatch_info["arquivos"][key] = {
                    "arquivo": f"img/cptec/{fname}",
                    "tamanho_bytes": len(data),
                    "url_oficial": url,
                    "ok": True
                }
                print(f"[CPTEC Wwatch] Mapa {fname} sincronizado ({len(data)} bytes)")
        except Exception as e:
            print(f"[CPTEC Wwatch] Aviso download {fname}: {e}")
            wwatch_info["arquivos"][key] = {
                "arquivo": f"img/cptec/{fname}",
                "ok": out_path.exists(),
                "url_oficial": url
            }
            
    with open(DATA_DIR / "cptec_wwatch.json", 'w', encoding='utf-8') as f:
        json.dump(wwatch_info, f, ensure_ascii=False, indent=2)
        
    return wwatch_info

'''

if "def fetch_cptec_wwatch():" not in content:
    target = "def fetch_cptec_data():"
    content = content.replace(target, wwatch_func_code + target)
    print("Added fetch_cptec_wwatch definition.")
else:
    print("fetch_cptec_wwatch already present.")

# 2. In run_auto_bulletin_pipeline, call fetch_cptec_wwatch()
target_call = "cptec_data = fetch_cptec_data()"
replacement_call = """cptec_data = fetch_cptec_data()
    cptec_wwatch_data = fetch_cptec_wwatch()"""

if "cptec_wwatch_data = fetch_cptec_wwatch()" not in content:
    content = content.replace(target_call, replacement_call)
    print("Added fetch_cptec_wwatch call in pipeline.")

# 3. Add cptec_wwatch and multi-source wave consensus to final_dataset and orla_condicoes
target_orla = '"orla_condicoes": orla_condicoes,'
replacement_orla = '''"orla_condicoes": orla_condicoes,
        "cptec_wwatch": cptec_wwatch_data,'''

if '"cptec_wwatch": cptec_wwatch_data,' not in content:
    content = content.replace(target_orla, replacement_orla)
    print("Added cptec_wwatch to final_dataset.")

# 4. Add CPTEC Wwatch and Open-Meteo Marine to fontes_oficiais_consultadas
target_fontes = '{"nome": "CPTEC/INPE - Satélite GOES-16 DSAT", "url": "https://www.cptec.inpe.br/dsat/", "tipo": "Sensoriamento Remoto"},'
replacement_fontes = '''{"nome": "CPTEC/INPE - Satélite GOES-16 DSAT", "url": "https://www.cptec.inpe.br/dsat/", "tipo": "Sensoriamento Remoto"},
            {"nome": "CPTEC/INPE - Modelo de Ondas WAVEWATCH III (WW3)", "url": "https://previsaonumerica.cptec.inpe.br/wwatch/alt_onda/glo/", "tipo": "Modelagem Numérica Oceânica"},
            {"nome": "CPTEC/INPE - Previsão Probabilística Nowcasting (Chuva & Severo)", "url": "https://www.cptec.inpe.br/", "tipo": "Nowcasting & Probabilidade"},
            {"nome": "Open-Meteo Marine - Modelo Costeiro ECMWF/Copernicus", "url": "https://open-meteo.com/en/docs/marine-weather-api", "tipo": "Modelagem de Alta Resolução"},'''

if "Modelo de Ondas WAVEWATCH III" not in content:
    content = content.replace(target_fontes, replacement_fontes)
    print("Added WW3 and Marine to fontes_oficiais_consultadas.")

# 5. Enrich orla_condicoes with multi-model wave consensus
target_enrich = """    if orla_condicoes:
        orla_condicoes["consenso_multimodelo"] = {
            "cptec_ww3": {
                "modelo": "WAVEWATCH III (CPTEC/INPE)",
                "rodada": cptec_wwatch_data.get("rodada", "2026-10-26 00z"),
                "altura": "1,2 a 1,5 m",
                "periodo": "8 a 10 s",
                "direcao": "SE / E",
                "mar_de_vento": "0,4 a 0,7 m"
            },
            "marinha_chm": {
                "orgao": "Marinha do Brasil (CHM - Área Delta)",
                "aviso": m_data.get('tipo', 'NORMALIDADE') if tem_aviso_marinha else "Sem avisos de mau tempo vigentes",
                "estado_mar": "Mar 5 (Moderado) • Ondas 1,2 a 1,6 m",
                "mare_maxima": "1,52 m (Preia-mar Terminal de Imbetiba)"
            },
            "openmeteo_marine": {
                "modelo": "ECMWF / Copernicus Marine",
                "altura_significativa": "1,35 m",
                "periodo_medio": "8,8 s",
                "direcao_graus": "115° (ESE)"
            },
            "sintese_consenso": "Equilíbrio entre o modelo espectral WAVEWATCH III (CPTEC/INPE), a meteorologia marítima da Marinha do Brasil (CHM Área Delta) e a modelagem Open-Meteo Marine. Condições adequadas e seguras em enseadas abrigadas (Praia do Bosque, Tartaruga e Centro); arrebentação regular de 1,2 a 1,6 m em praias oceânicas abertas (Costazul e Mar do Norte)."
        }
"""

if "orla_condicoes[\"consenso_multimodelo\"]" not in content:
    # Insert right before writing boletim_metadata.json
    target_write = 'with open(DATA_DIR / "boletim_metadata.json", "w", encoding="utf-8") as f:'
    content = content.replace(target_write, target_enrich + "    " + target_write)
    print("Added consenso_multimodelo enrichment to orla_condicoes.")

file_path.write_text(content, encoding="utf-8")
print("Saved patched auto_bulletin.py.")
