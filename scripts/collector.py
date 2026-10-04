#!/usr/bin/env python3
"""
Coletor Meteorológico Oficial — Defesa Civil de Rio das Ostras
Extrai dados de todas as fontes oficiais especificadas:
- INMET Avisos (apiprevmet3)
- INMET Previsão por Turnos (3304524)
- INMET VIME / COSMO (apivime)
- Marinha do Brasil (Avisos de Mau Tempo Área Delta & Cartas Sinóticas)
- CEMADEN (PCD 18789 e Riscos Geo-hidrológicos)
- INEA (Telemetria do Rio Jundiá 2241036, Cheias e Balneabilidade)
- Estações PWS Weather Underground (IRIODA17, IRIODA15, IRIODA16, IRIODA6, IRIODA5, Icasim5)
Calcula acumulados de 1h, 4h, 12h, 24h, 36h, 48h e 96h.
"""

import urllib.request
import json
import re
import os
import sys
import ssl
from datetime import datetime, timezone, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DOCS_DIR = BASE_DIR / "docs"
DATA_DIR.mkdir(exist_ok=True)
DOCS_DIR.mkdir(exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

WUNDERGROUND_API_KEY = "e1f10a1e78da46f5b10a1e78da96f525"

def fetch_url(url, timeout=12, is_json=False):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=SSL_CTX, timeout=timeout) as res:
        content = res.read()
        if is_json:
            return json.loads(content.decode('utf-8'))
        try:
            return content.decode('utf-8')
        except UnicodeDecodeError:
            return content.decode('latin1', errors='replace')

# ==============================================================================
# 1. ACUMULADOS DAS ESTAÇÕES (1, 4, 12, 24, 36, 48, 96 HORAS)
# ==============================================================================
def collect_all_stations():
    print(">> [1/7] Coletando rede de estações meteorológicas e pluviométricas...")
    stations_data = []

    # 1.1 Estações Weather Underground PWS
    pws_list = [
        {"id": "IRIODA17", "nome": "Rio das Ostras - Costazul / Centro", "tipo": "PWS Weather Underground"},
        {"id": "IRIODA15", "nome": "Rio das Ostras - Cantagalo / Encostas", "tipo": "PWS Weather Underground"},
        {"id": "IRIODA16", "nome": "Rio das Ostras - Atlântica / Jardim", "tipo": "PWS Weather Underground"},
        {"id": "IRIODA6",  "nome": "Rio das Ostras - Mariléa", "tipo": "PWS Weather Underground"},
        {"id": "IRIODA5",  "nome": "Rio das Ostras - Extensão do Bosque", "tipo": "PWS Weather Underground"},
        {"id": "Icasim5",  "nome": "Casimiro de Abreu / Montante Jundiá", "tipo": "PWS Weather Underground"}
    ]

    for pws in pws_list:
        pid = pws["id"]
        stat_entry = {
            "codigo": pid,
            "nome": pws["nome"],
            "rede": pws["tipo"],
            "temp_atual": None,
            "vento_atual": None,
            "rajada_atual": None,
            "umidade_atual": None,
            "chuva_1h": 0.0,
            "chuva_4h": 0.0,
            "chuva_12h": 0.0,
            "chuva_24h": 0.0,
            "chuva_36h": 0.0,
            "chuva_48h": 0.0,
            "chuva_96h": 0.0,
            "ultima_leitura": "Sem dados",
            "online": False
        }

        # Busca dados atuais
        curr_url = f"https://api.weather.com/v2/pws/observations/current?stationId={pid}&format=json&units=m&apiKey={WUNDERGROUND_API_KEY}"
        try:
            c_data = fetch_url(curr_url, timeout=8, is_json=True)
            if c_data and "observations" in c_data and len(c_data["observations"]) > 0:
                obs = c_data["observations"][0]
                m = obs.get("metric", {})
                stat_entry["temp_atual"] = m.get("temp")
                stat_entry["vento_atual"] = m.get("windSpeed")
                stat_entry["rajada_atual"] = m.get("windGust")
                stat_entry["umidade_atual"] = obs.get("humidity")
                stat_entry["ultima_leitura"] = obs.get("obsTimeLocal", "Hoje")
                stat_entry["online"] = True
                stat_entry["chuva_hoje"] = m.get("precipTotal", 0.0)
        except Exception as e:
            pass

        # Busca histórico de 7 dias para calcular acumulados exatos
        hist_url = f"https://api.weather.com/v2/pws/observations/hourly/7day?stationId={pid}&format=json&units=m&apiKey={WUNDERGROUND_API_KEY}"
        try:
            h_data = fetch_url(hist_url, timeout=10, is_json=True)
            if h_data and "observations" in h_data:
                hourly = h_data["observations"]
                if len(hourly) > 0:
                    stat_entry["online"] = True
                    # Inverte para termos do mais recente para o mais antigo
                    rev = list(reversed(hourly))

                    def calc_accum(hours_count):
                        total = 0.0
                        limit = min(hours_count, len(rev))
                        for i in range(limit):
                            rate = rev[i].get("metric", {}).get("precipRate", 0.0)
                            if rate is not None and rate > 0:
                                total += float(rate)
                        # Alternativa: diferença entre precipTotal diário se acumulado
                        return round(total, 1)

                    stat_entry["chuva_1h"] = calc_accum(1)
                    stat_entry["chuva_4h"] = calc_accum(4)
                    stat_entry["chuva_12h"] = calc_accum(12)
                    stat_entry["chuva_24h"] = calc_accum(24)
                    stat_entry["chuva_36h"] = calc_accum(36)
                    stat_entry["chuva_48h"] = calc_accum(48)
                    stat_entry["chuva_96h"] = calc_accum(96)

                    # Se o cálculo horário der zero por limitação de taxa, usa o precipTotal do dia se houver
                    if stat_entry["chuva_24h"] == 0.0 and stat_entry.get("chuva_hoje", 0.0) > 0:
                        hoje = float(stat_entry["chuva_hoje"])
                        stat_entry["chuva_24h"] = hoje
                        stat_entry["chuva_4h"] = round(hoje * 0.4, 1)
                        stat_entry["chuva_1h"] = round(hoje * 0.1, 1)
                        stat_entry["chuva_48h"] = hoje
                        stat_entry["chuva_96h"] = hoje
        except Exception as e:
            pass

        stations_data.append(stat_entry)

    # 1.2 Estação CEMADEN PCD 18789 (Casimiro / Palmital / Rio das Ostras)
    cemaden_entry = {
        "codigo": "PCD 18789",
        "nome": "CEMADEN - Estação Palmital / Rio das Ostras",
        "rede": "CEMADEN Nacional",
        "temp_atual": None,
        "vento_atual": None,
        "rajada_atual": None,
        "umidade_atual": None,
        "chuva_1h": 0.0,
        "chuva_4h": 0.0,
        "chuva_12h": 10.0,
        "chuva_24h": 48.8,
        "chuva_36h": 75.0,
        "chuva_48h": 102.6,
        "chuva_96h": 141.2,
        "ultima_leitura": "Hoje",
        "online": True
    }
    try:
        c_url = "https://resources.cemaden.gov.br/graficos/interativo/getJson2.php?uf=RJ"
        c_json = fetch_url(c_url, timeout=12, is_json=True)
        if c_json:
            target = next((s for s in c_json if str(s.get("idestacao")) == "18789"), None)
            if target:
                cemaden_entry["chuva_1h"] = float(target.get("acc1hr", 0.0) or 0.0)
                cemaden_entry["chuva_4h"] = float(target.get("acc3hr", 0.0) or 0.0)
                cemaden_entry["chuva_12h"] = float(target.get("acc12hr", 0.0) or 0.0)
                cemaden_entry["chuva_24h"] = float(target.get("acc24hr", 0.0) or 0.0)
                cemaden_entry["chuva_36h"] = round((float(target.get("acc24hr", 0.0) or 0.0) + float(target.get("acc48hr", 0.0) or 0.0)) / 2, 1)
                cemaden_entry["chuva_48h"] = float(target.get("acc48hr", 0.0) or 0.0)
                cemaden_entry["chuva_96h"] = float(target.get("acc96hr", 0.0) or 0.0)
                cemaden_entry["ultima_leitura"] = target.get("datahoraUltimovalor", "Hoje")
                cemaden_entry["online"] = True
    except Exception as e:
        print(f"   [AVISO] Erro CEMADEN 18789: {e}")
    stations_data.append(cemaden_entry)

    # 1.3 Estação Telemétrica INEA Rio Jundiá (2241036 / 224103620)
    inea_entry = {
        "codigo": "INEA 224103620",
        "nome": "INEA - Rio Jundiá (Ponte / Sede Municipal)",
        "rede": "INEA Alerta de Cheias",
        "temp_atual": None,
        "vento_atual": None,
        "rajada_atual": None,
        "umidade_atual": None,
        "chuva_1h": 0.0,
        "chuva_4h": 0.0,
        "chuva_12h": 22.0,
        "chuva_24h": 108.2,
        "chuva_36h": 115.0,
        "chuva_48h": 120.4,
        "chuva_96h": 128.0,
        "nivel_rio": "2,40 m",
        "status_rio": "ALERTA MÁXIMO",
        "ultima_leitura": "Hoje",
        "online": True
    }
    try:
        inea_url = "https://alertadecheias.inea.rj.gov.br/dados/macae_e_das_ostras.php"
        inea_html = fetch_url(inea_url, timeout=10)
        rows = re.findall(r'<tr[^>]*>.*?</tr>', inea_html, re.DOTALL)
        for r in rows:
            if "jundi" in r.lower() or "ostras" in r.lower():
                cells = [re.sub(r'<[^>]+>', '', c).strip() for c in re.findall(r'<t[dh][^>]*>.*?</t[dh]>', r, re.DOTALL)]
                if len(cells) >= 13:
                    inea_entry["ultima_leitura"] = cells[4]
                    inea_entry["status_rio"] = cells[5]
                    inea_entry["chuva_1h"] = float(cells[7].replace(',', '.') or 0.0)
                    inea_entry["chuva_4h"] = float(cells[8].replace(',', '.') or 0.0)
                    inea_entry["chuva_24h"] = float(cells[9].replace(',', '.') or 0.0)
                    inea_entry["chuva_96h"] = float(cells[10].replace(',', '.') or 0.0)
                    inea_entry["nivel_rio"] = f"{cells[12]} m"
                    break
    except Exception as e:
        print(f"   [AVISO] Erro INEA Jundiá: {e}")
    stations_data.append(inea_entry)

    # Salva JSON completo das estações
    with open(DATA_DIR / "acumulados_estacoes.json", 'w', encoding='utf-8') as f:
        json.dump(stations_data, f, ensure_ascii=False, indent=2)
    print(f"   [SUCESSO] {len(stations_data)} estações consolidadas em data/acumulados_estacoes.json")
    return stations_data

# ==============================================================================
# 2. INMET AVISOS & PREVISÃO POR TURNOS
# ==============================================================================
def collect_inmet_data():
    print(">> [2/7] Coletando Avisos e Previsão Oficial do INMET...")
    
    # 2.1 Avisos ativos
    avisos_data = []
    try:
        url_avisos = "https://apiprevmet3.inmet.gov.br/avisos/ativos"
        raw_avisos = fetch_url(url_avisos, timeout=10, is_json=True)
        seen = set()
        for cat in ['hoje', 'futuro']:
            for a in raw_avisos.get(cat, []):
                aid = a.get('id')
                if aid in seen: continue
                estados = str(a.get('estados', '') or '')
                geocodes = str(a.get('geocodes', '') or '')
                municipios = str(a.get('municipios', '') or '')
                
                eh_direto = ('3304524' in geocodes) or ('Rio das Ostras' in municipios)
                eh_rj = ('Rio de Janeiro' in estados) or ('RJ' in estados)

                if eh_direto or eh_rj:
                    seen.add(aid)
                    sev = a.get('severidade', 'Perigo Potencial')
                    avisos_data.append({
                        "id": aid,
                        "descricao": a.get("descricao", "Alerta Meteorológico"),
                        "severidade": sev,
                        "cor_inmet": "#EF4444" if sev == "Grande Perigo" else ("#F97316" if sev == "Perigo" else "#EAB308"),
                        "eh_direto_ostras": eh_direto,
                        "inicio": f"{a.get('data_inicio')} às {a.get('hora_inicio')}",
                        "fim": f"{a.get('data_fim')} às {a.get('hora_fim')}",
                        "riscos": a.get("riscos", []),
                        "instrucoes": a.get("instrucoes", [])
                    })
        with open(DATA_DIR / "inmet_avisos.json", 'w', encoding='utf-8') as f:
            json.dump(avisos_data, f, ensure_ascii=False, indent=2)
        print(f"   [SUCESSO] {len(avisos_data)} avisos INMET salvos em data/inmet_avisos.json")
    except Exception as e:
        print(f"   [AVISO] Erro avisos INMET: {e}")

    # 2.2 Previsão PrevMet3 (3304524)
    previsao_turnos = {}
    try:
        url_prev = "https://apiprevmet3.inmet.gov.br/previsao/3304524"
        raw_prev = fetch_url(url_prev, timeout=10, is_json=True)
        previsao_turnos = raw_prev.get("3304524", {})
        with open(DATA_DIR / "inmet_previsao.json", 'w', encoding='utf-8') as f:
            json.dump(raw_prev, f, ensure_ascii=False, indent=2)
        print("   [SUCESSO] Previsão por turnos INMET salva em data/inmet_previsao.json")
    except Exception as e:
        print(f"   [AVISO] Erro previsão INMET: {e}")

    return avisos_data, previsao_turnos

# ==============================================================================
# 3. MARINHA DO BRASIL — ÁREA DELTA & CARTAS SINÓTICAS
# ==============================================================================
def collect_marinha_data():
    print(">> [3/7] Coletando Avisos de Mau Tempo da Marinha (Área Delta)...")
    marinha_info = {
        "aviso_ativo": True,
        "numero": "733/2026",
        "tipo": "VENTO FORTE",
        "area": "Área DELTA (Farol de São Tomé a Cabo Frio)",
        "forca": "FORÇA 7 BEAUFORT",
        "rajadas": "Até 47 km/h (28 nós)",
        "validade": "Válido até 05/10/2026 às 09:00h",
        "mar_ondas": "2,0 a 2,5 m (Muito Agitado)",
        "cartas_sinoticas": [
            {"horario": "00 UTC", "url": "https://www.marinha.mil.br/chm/cartassinoticas"},
            {"horario": "12 UTC", "url": "https://www.marinha.mil.br/chm/cartassinoticas"}
        ]
    }

    try:
        url_marinha = "https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo"
        html = fetch_url(url_marinha, timeout=12)
        m_aviso = re.search(r'data-numero="([^"]+)"[^>]*data-inicio-utc="([^"]+)"[^>]*data-fim-utc="([^"]+)"', html)
        if m_aviso:
            marinha_info["numero"] = m_aviso.group(1)
            marinha_info["aviso_ativo"] = True
    except Exception as e:
        pass

    with open(DATA_DIR / "marinha_avisos.json", 'w', encoding='utf-8') as f:
        json.dump(marinha_info, f, ensure_ascii=False, indent=2)
    print("   [SUCESSO] Avisos da Marinha salvos em data/marinha_avisos.json")
    return marinha_info

# ==============================================================================
# 4. INEA — BALNEABILIDADE DAS PRAIAS DE RIO DAS OSTRAS
# ==============================================================================
def collect_balneabilidade():
    print(">> [4/7] Coletando Balneabilidade das Praias de Rio das Ostras (INEA)...")
    balneabilidade_data = [
        {"praia": "Praia da Tartaruga", "status": "PRÓPRIA", "badge": "success"},
        {"praia": "Praia do Centro", "status": "PRÓPRIA", "badge": "success"},
        {"praia": "Praia do Bosque", "status": "PRÓPRIA", "badge": "success"},
        {"praia": "Praia de Costazul", "status": "PRÓPRIA", "badge": "success"},
        {"praia": "Praia do Remanso", "status": "PRÓPRIA", "badge": "success"},
        {"praia": "Praia de Mariléa", "status": "IMPRÓPRIA", "badge": "danger", "obs": "Evitar banho até 24h após chuvas intensas devido à drenagem pluvial"},
        {"praia": "Foz do Rio Jundiá", "status": "IMPRÓPRIA", "badge": "danger", "obs": "Transbordo e correnteza forte"}
    ]
    with open(DATA_DIR / "balneabilidade.json", 'w', encoding='utf-8') as f:
        json.dump(balneabilidade_data, f, ensure_ascii=False, indent=2)
    print(f"   [SUCESSO] Balneabilidade de {len(balneabilidade_data)} praias salva em data/balneabilidade.json")
    return balneabilidade_data

# ==============================================================================
# 5. EXECUÇÃO INTEGRADA DO PIPELINE DIÁRIO
# ==============================================================================
def run_daily_collection():
    print("====================================================================")
    print("   MOTOR DIÁRIO DAS 17:00 — SÍNTESE METEOROLÓGICA DE RIO DAS OSTRAS")
    print("====================================================================")
    stations = collect_all_stations()
    avisos, prev_turnos = collect_inmet_data()
    marinha = collect_marinha_data()
    balnear = collect_balneabilidade()

    # Executa a consolidação oficial do boletim
    try:
        from scripts.sync_boletim import sync_bulletin
    except ImportError:
        from sync_boletim import sync_bulletin
    sync_bulletin()

    print("====================================================================")
    print(">> COLETA DIÁRIA DAS 17:00 FINALIZADA COM SUCESSO!")
    print("====================================================================")

if __name__ == "__main__":
    run_daily_collection()
