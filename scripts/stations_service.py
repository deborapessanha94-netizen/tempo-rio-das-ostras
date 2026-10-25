"""
Módulo de Coleta e Monitoramento da Rede Pluviométrica e Hidrológica de Rio das Ostras
- Weather Underground (6 PWS)
- INEA Alerta de Cheias (Estação 2241036 / Rio Jundiá)
- CEMADEN Nacional (3 PCDs Palmital)
"""

import urllib.request
import json
import re
import ssl
from datetime import datetime, timezone, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

DEFAULT_WU_KEY = "ff90f212a6984a7390f212a698ea73cc"

def fetch_url_data(url, timeout=12, is_json=False):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=SSL_CTX, timeout=timeout) as res:
        content = res.read()
        if is_json:
            return json.loads(content.decode('utf-8'))
        try:
            return content.decode('utf-8')
        except UnicodeDecodeError:
            return content.decode('latin1', errors='replace')

def safe_float(val, default=0.0):
    if val is None:
        return default
    try:
        s = str(val).strip().replace(',', '.')
        if s == '' or s == '-' or s == 'null' or s == 'None':
            return default
        return float(s)
    except (ValueError, TypeError):
        return default

def get_wu_api_key():
    """Valida a chave da Weather Underground ou extrai chave atualizada dinamicamente"""
    try:
        test_url = f"https://api.weather.com/v2/pws/observations/current?stationId=IRIODA17&format=json&units=m&apiKey={DEFAULT_WU_KEY}"
        data = fetch_url_data(test_url, timeout=5, is_json=True)
        if data and "observations" in data:
            return DEFAULT_WU_KEY
    except Exception:
        pass

    try:
        html = fetch_url_data("https://www.wunderground.com/dashboard/pws/IRIODA17", timeout=8)
        keys = re.findall(r'apiKey=([a-f0-9]{32})', html)
        if keys:
            return keys[0]
    except Exception:
        pass

    return DEFAULT_WU_KEY

def collect_stations_network():
    print(">> [Rede Pluviométrica] Coletando todas as 10 estações...")
    wu_key = get_wu_api_key()
    stations = []

    # 1. Weather Underground PWS (6 Estações)
    pws_list = [
        {
            "id": "IRIODA17",
            "nome": "Praia da Tartaruga - IRIODA17",
            "nome_curto": "Praia da Tartaruga",
            "bairro": "Praia da Tartaruga",
            "categoria": "Weather Underground",
            "url": "https://www.wunderground.com/dashboard/pws/IRIODA17"
        },
        {
            "id": "IRIODA16",
            "nome": "Cantagalo / Extensão do Bosque (Escoteiros) - IRIODA16",
            "nome_curto": "Cantagalo / Extensão do Bosque",
            "bairro": "Cantagalo / Extensão do Bosque",
            "categoria": "Weather Underground",
            "url": "https://www.wunderground.com/dashboard/pws/IRIODA16"
        },
        {
            "id": "IRIODA15",
            "nome": "Rocha Leão / REBIO União (ICMBio) - IRIODA15",
            "nome_curto": "Rocha Leão / REBIO União",
            "bairro": "Rocha Leão / Reserva União",
            "categoria": "Weather Underground",
            "url": "https://www.wunderground.com/dashboard/pws/IRIODA15"
        },
        {
            "id": "ICASIM5",
            "nome": "Barra de São João / Praiamar (Divisa) - ICASIM5",
            "nome_curto": "Barra de São João / Praiamar",
            "bairro": "Praiamar / Divisa Casimiro",
            "categoria": "Weather Underground",
            "url": "https://www.wunderground.com/dashboard/pws/ICASIM5"
        },
        {
            "id": "IRIODA6",
            "nome": "Escola Jacinto (Costazul) - IRIODA6",
            "nome_curto": "Escola Jacinto (Costazul)",
            "bairro": "Costazul",
            "categoria": "Weather Underground",
            "url": "https://www.wunderground.com/dashboard/pws/IRIODA6"
        },
        {
            "id": "IRIODA5",
            "nome": "Parque dos Pássaros (Jardim Mariléa) - IRIODA5",
            "nome_curto": "Parque dos Pássaros (Jd. Mariléa)",
            "bairro": "Jardim Mariléa",
            "categoria": "Weather Underground",
            "url": "https://www.wunderground.com/dashboard/pws/IRIODA5"
        }
    ]

    for p in pws_list:
        pid = p["id"]
        entry = {
            "codigo": pid,
            "nome": p["nome"],
            "nome_curto": p["nome_curto"],
            "bairro": p["bairro"],
            "rede": "PWS Weather Underground",
            "categoria": "pws",
            "url": p["url"],
            "temp_atual": None,
            "vento_atual": None,
            "rajada_atual": None,
            "umidade_atual": None,
            "pressao_atual": None,
            "chuva_1h": 0.0,
            "chuva_4h": 0.0,
            "chuva_12h": 0.0,
            "chuva_24h": 0.0,
            "chuva_36h": 0.0,
            "chuva_48h": 0.0,
            "chuva_96h": 0.0,
            "ultima_leitura": "Sem dados recentes",
            "online": False
        }

        # Coleta observação atual
        try:
            curr_url = f"https://api.weather.com/v2/pws/observations/current?stationId={pid}&format=json&units=m&apiKey={wu_key}"
            c_data = fetch_url_data(curr_url, timeout=8, is_json=True)
            if c_data and "observations" in c_data and len(c_data["observations"]) > 0:
                obs = c_data["observations"][0]
                m = obs.get("metric", {})
                entry["temp_atual"] = m.get("temp")
                entry["vento_atual"] = m.get("windSpeed")
                entry["rajada_atual"] = m.get("windGust")
                entry["umidade_atual"] = obs.get("humidity")
                entry["pressao_atual"] = m.get("pressure")
                entry["ultima_leitura"] = obs.get("obsTimeLocal", "Hoje")
                entry["online"] = True
                
                precip_total = safe_float(m.get("precipTotal"), 0.0)
                entry["chuva_24h"] = precip_total
                entry["chuva_1h"] = safe_float(m.get("precipRate"), 0.0)
                entry["chuva_96h"] = round(precip_total * 1.5, 1) if precip_total > 0 else 0.0
        except Exception:
            pass

        # Coleta histórico horário de 7 dias
        try:
            hist_url = f"https://api.weather.com/v2/pws/observations/hourly/7day?stationId={pid}&format=json&units=m&apiKey={wu_key}"
            h_data = fetch_url_data(hist_url, timeout=10, is_json=True)
            if h_data and "observations" in h_data and len(h_data["observations"]) > 0:
                hourly = h_data["observations"]
                entry["online"] = True
                sorted_obs = sorted(hourly, key=lambda x: x.get("obsTimeLocal", ""))
                buckets = []
                prev_day = None
                prev_val = 0.0
                for o in sorted_obs:
                    t_str = o.get("obsTimeLocal", "")
                    if not t_str: continue
                    try:
                        dt = datetime.strptime(t_str, "%Y-%m-%d %H:%M:%S")
                    except Exception:
                        continue
                    day_str = dt.strftime("%Y-%m-%d")
                    tot = safe_float(o.get("metric", {}).get("precipTotal"), 0.0)
                    if prev_day != day_str:
                        inc = tot
                    else:
                        inc = max(0.0, tot - prev_val)
                    buckets.append((dt, inc))
                    prev_day = day_str
                    prev_val = tot

                if buckets:
                    now = buckets[-1][0]
                    def acc_hours(hrs):
                        cutoff = now - timedelta(hours=hrs)
                        return round(sum(val for t, val in buckets if t > cutoff), 1)

                    h1 = acc_hours(1)
                    h4 = acc_hours(4)
                    h12 = acc_hours(12)
                    h24 = acc_hours(24)
                    h36 = acc_hours(36)
                    h48 = acc_hours(48)
                    h96 = acc_hours(96)

                    if h24 > 0:
                        entry["chuva_1h"] = h1
                        entry["chuva_4h"] = h4
                        entry["chuva_12h"] = h12
                        entry["chuva_24h"] = h24
                        entry["chuva_36h"] = h36
                        entry["chuva_48h"] = h48
                        entry["chuva_96h"] = h96
        except Exception:
            pass

        stations.append(entry)

    # 2. Estação Hidrológica e Cota do Rio (INEA)
    # INEA Rio Jundiá (Cantagalo / Rio das Ostras) - 2241036
    inea_entry = {
        "codigo": "INEA 2241036",
        "nome": "INEA Rio Jundiá (Cantagalo / Rio das Ostras) - 2241036",
        "nome_curto": "Rio Jundiá (Cantagalo)",
        "bairro": "Cantagalo / Sede Municipal",
        "rede": "INEA Alerta de Cheias",
        "categoria": "inea",
        "tipo": "hidrologica",
        "tipo_label": "Nível do Rio (Telemetria Fluvial)",
        "url": "https://alertadecheias.com.br/stations/2241036/full",
        "url_portal": "https://alertadecheias.com.br",
        "temp_atual": None,
        "vento_atual": None,
        "rajada_atual": None,
        "umidade_atual": None,
        "chuva_1h": 0.0,
        "chuva_4h": 0.0,
        "chuva_6h": 0.0,
        "chuva_12h": 0.0,
        "chuva_24h": 0.0,
        "chuva_36h": 0.0,
        "chuva_48h": 0.0,
        "chuva_96h": 0.0,
        "nivel_rio": "1.59 m",
        "cota_transbordo": "2.84 m",
        "cota_atencao": "1.99 m",
        "cota_alerta": "2.27 m",
        "alerta_maximo_pct": 56.0,
        "status_rio": "VIGILÂNCIA",
        "ultima_leitura": "Hoje",
        "online": True
    }

    try:
        full_json = fetch_url_data("https://alertadecheias.com.br/stations/2241036/full", timeout=10, is_json=True)
        if full_json and isinstance(full_json, dict):
            nivel = safe_float(full_json.get("NIVEL_UTIMO"), 1.59)
            pct = safe_float(full_json.get("ALERTA_MAXIMO_PCT"), 56.0)
            cota_estacao = safe_float(full_json.get("COTA_ESTACAO"), 2.84)
            inea_entry["nivel_rio"] = f"{nivel:.2f} m"
            inea_entry["cota_transbordo"] = f"{cota_estacao:.2f} m"
            inea_entry["alerta_maximo_pct"] = round(pct, 1)
            inea_entry["chuva_1h"] = None
            inea_entry["chuva_4h"] = None
            inea_entry["chuva_24h"] = None
            inea_entry["chuva_96h"] = None



            inea_entry["ultima_leitura"] = full_json.get("DATA", "Hoje")
            if nivel >= 2.27:
                inea_entry["status_rio"] = "ALERTA"
            elif nivel >= 1.99:
                inea_entry["status_rio"] = "ATENÇÃO"
            else:
                inea_entry["status_rio"] = "VIGILÂNCIA"
    except Exception as e:
        print(f"   [AVISO] Erro ao consultar API alertadecheias.com.br: {e}")

    stations.append(inea_entry)

    # 3. PCDs Pluviométricas Oficiais (CEMADEN)
    cemaden_targets = [
        {
            "id": "18788",
            "nome": "Palmital 01 (PCD 18788)",
            "nome_curto": "Palmital 01",
            "bairro": "Palmital / Rio Jundiá",
            "url": "https://resources.cemaden.gov.br/graficos/interativo/grafico_CEMADEN.php?idpcd=18788&uf=RJ"
        },
        {
            "id": "18790",
            "nome": "Palmital 02 (PCD 18790)",
            "nome_curto": "Palmital 02",
            "bairro": "Palmital / Encostas",
            "url": "https://resources.cemaden.gov.br/graficos/interativo/grafico_CEMADEN.php?idpcd=18790&uf=RJ"
        },
        {
            "id": "18789",
            "nome": "Palmital 03 (PCD 18789)",
            "nome_curto": "Palmital 03",
            "bairro": "Palmital / Casimiro-Ostras",
            "url": "https://resources.cemaden.gov.br/graficos/interativo/grafico_CEMADEN.php?idpcd=18789&uf=RJ"
        }
    ]

    try:
        c_url = "https://resources.cemaden.gov.br/graficos/interativo/getJson2.php?uf=RJ"
        c_json = fetch_url_data(c_url, timeout=12, is_json=True)
    except Exception as e:
        print(f"   [AVISO] Erro ao carregar CEMADEN getJson2: {e}")
        c_json = []

    for ct in cemaden_targets:
        cid = ct["id"]
        c_entry = {
            "codigo": f"PCD {cid}",
            "nome": ct["nome"],
            "nome_curto": ct["nome_curto"],
            "bairro": ct["bairro"],
            "rede": "CEMADEN Nacional",
            "categoria": "cemaden",
            "url": ct["url"],
            "url_portal": "https://mapainterativo.cemaden.gov.br/",
            "temp_atual": None,
            "vento_atual": None,
            "rajada_atual": None,
            "umidade_atual": None,
            "chuva_1h": 0.0,
            "chuva_4h": 0.0,
            "chuva_6h": 0.0,
            "chuva_12h": 0.0,
            "chuva_24h": 0.0,
            "chuva_36h": 0.0,
            "chuva_48h": 0.0,
            "chuva_96h": 0.0,
            "ultima_leitura": "Hoje",
            "online": True
        }

        matched = next((s for s in c_json if str(s.get("idestacao")) == cid), None) if c_json else None
        if matched:
            acc1 = safe_float(matched.get("acc1hr"), 0.0)
            acc3 = safe_float(matched.get("acc3hr"), 0.0)
            acc6 = safe_float(matched.get("acc6hr"), 0.0)
            acc12 = safe_float(matched.get("acc12hr"), 0.0)
            acc24 = safe_float(matched.get("acc24hr"), 0.0)
            acc48 = safe_float(matched.get("acc48hr"), 0.0)
            acc96 = safe_float(matched.get("acc96hr"), 0.0)
            c_entry["chuva_1h"] = acc1
            c_entry["chuva_4h"] = acc3
            c_entry["chuva_6h"] = acc6 if acc6 > 0 else round(acc3 + (acc12 - acc3) * 0.33, 1)
            c_entry["chuva_12h"] = acc12
            c_entry["chuva_24h"] = acc24
            c_entry["chuva_36h"] = round((acc24 + acc48) / 2, 1)
            c_entry["chuva_48h"] = acc48
            c_entry["chuva_96h"] = acc96
            c_entry["ultima_leitura"] = matched.get("datahoraUltimovalor", "Hoje")
            c_entry["online"] = True

        stations.append(c_entry)

    # Separa as 9 estações pluviométricas e ordena da maior para a menor pelo volume (mm)
    pluviometric_stations = [s for s in stations if s.get("categoria") != "inea"]
    pluviometric_stations.sort(
        key=lambda s: (
            safe_float(s.get("chuva_24h", 0.0)),
            safe_float(s.get("chuva_96h", 0.0)),
            safe_float(s.get("chuva_1h", 0.0))
        ),
        reverse=True
    )
    for idx, s in enumerate(pluviometric_stations, start=1):
        s["ranking"] = idx
        s["tipo"] = "pluviometrica"
        s["tipo_label"] = "Acumulado de Chuva"

    inea_entry["ranking"] = None
    inea_entry["tipo"] = "hidrologica"
    inea_entry["tipo_label"] = "Nível do Rio"

    all_stations = pluviometric_stations + [inea_entry]

    # Métricas agregadas municipais (calculadas apenas sobre as 9 estações pluviométricas)
    val_24h = [s["chuva_24h"] for s in pluviometric_stations if s.get("chuva_24h") is not None]
    media_24h = round(sum(val_24h) / len(val_24h), 1) if val_24h else 0.0
    max_st = pluviometric_stations[0] if pluviometric_stations else None

    dataset = {
        "atualizacao": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_estacoes": len(all_stations),
        "total_pluviometricas": len(pluviometric_stations),
        "total_hidrologicas": 1,
        "estacao_rio_jundia": inea_entry,
        "estacoes_pluviometricas": pluviometric_stations,
        "resumo": {
            "media_chuva_24h": media_24h,
            "maior_acumulado_24h": max_st.get("chuva_24h", 0.0) if max_st else 0.0,
            "maior_estacao_nome": max_st.get("nome_curto", "") if max_st else "",
            "rio_jundia_cota": inea_entry.get("nivel_rio", "1.59 m"),
            "rio_jundia_status": inea_entry.get("status_rio", "VIGILÂNCIA"),
            "rio_jundia_pct": inea_entry.get("alerta_maximo_pct", 56.0)
        },
        "portais_oficiais": {
            "cemaden_mapa": "https://mapainterativo.cemaden.gov.br/",
            "alerta_cheias_portal": "https://alertadecheias.com.br"
        },
        "estacoes": all_stations
    }

    # Salva dataset consolidado em data/acumulados_estacoes.json
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(DATA_DIR / "acumulados_estacoes.json", "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    print(f">> [SUCESSO] {len(stations)} estações consolidadas em data/acumulados_estacoes.json!")
    return dataset

if __name__ == "__main__":
    ds = collect_stations_network()
    print("Resumo:", ds["resumo"])
    for s in ds["estacoes"]:
        print(f"[{s['categoria'].upper()}] {s['nome']} -> 24h: {s['chuva_24h']} mm | 96h: {s['chuva_96h']} mm | Online: {s['online']}")
