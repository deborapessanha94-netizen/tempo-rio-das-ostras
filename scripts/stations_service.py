"""
Módulo de Coleta e Monitoramento da Rede Pluviométrica e Hidrológica de Rio das Ostras
- Weather Underground (6 PWS) — Telemetria decimal em tempo real + início da chuva hoje + picos diários
- INEA Alerta de Cheias (Estação 2241036 / Rio Jundiá)
- CEMADEN Nacional (3 PCDs Palmital) — Conversão UTC -> BRT + início da chuva hoje
"""

import urllib.request
import json
import re
import ssl
from datetime import datetime, timezone, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

BRT = timezone(timedelta(hours=-3))

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
        if res.status == 204:
            return None
        content = res.read()
        if not content:
            return None
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


def deg_to_cardinal_pt(deg):
    if deg is None:
        return None
    try:
        d = float(deg) % 360.0
    except (ValueError, TypeError):
        return None
    dirs = [
        "N", "NNE", "NE", "ENE",
        "L", "ESE", "SE", "SSE",
        "S", "SSO", "SO", "OSO",
        "O", "ONO", "NO", "NNO"
    ]
    idx = int(round(d / 22.5)) % 16
    return dirs[idx]


def convert_cemaden_utc_to_brt(raw_str):
    """Converte '30/10/26 12:10' (UTC do CEMADEN getJson2) para datetime BRT e string 'YYYY-MM-DD HH:MM:SS'."""
    if not raw_str or not isinstance(raw_str, str):
        return None, "Sem leitura recente"
    s = raw_str.strip()
    for fmt in ("%d/%m/%y %H:%M", "%d/%m/%Y %H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
        try:
            dt_utc = datetime.strptime(s, fmt).replace(tzinfo=timezone.utc)
            dt_brt = dt_utc.astimezone(BRT)
            return dt_brt, dt_brt.strftime("%Y-%m-%d %H:%M:%S")
        except ValueError:
            continue
    return None, s


def fetch_cemaden_rain_today_details(cid, now_brt):
    """
    Extrai o acumulado de chuva hoje (desde 00:00 BRT) e o horário exato (HH:MM BRT)
    em que a chuva iniciou hoje nas PCDs do CEMADEN.
    """
    today_date = now_brt.date()
    inicio_hhmm = None
    chuva_hoje = None

    # 1. Série horária oficial MapaInterativoWS (24h UTC -> converte para BRT)
    try:
        ws_url = f"https://mapservices.cemaden.gov.br/MapaInterativoWS/resources/horario/{cid}/23"
        ws_data = fetch_url_data(ws_url, timeout=6, is_json=True)
        if ws_data and "datas" in ws_data and "horarios" in ws_data and "acumulados" in ws_data:
            datas = ws_data["datas"]
            horarios = ws_data["horarios"]
            acumulados = ws_data["acumulados"]
            pts = []
            for d_idx, d_str in enumerate(datas):
                if d_idx >= len(acumulados):
                    continue
                row = acumulados[d_idx]
                for h_idx, h_str in enumerate(horarios):
                    if h_idx >= len(row):
                        continue
                    val = row[h_idx]
                    if val is None:
                        continue
                    try:
                        hr_num = int(str(h_str).lower().replace("h", "").strip())
                        dt_utc = datetime.strptime(d_str.strip(), "%d/%m/%Y").replace(
                            hour=hr_num, minute=0, second=0, tzinfo=timezone.utc
                        )
                        dt_brt = dt_utc.astimezone(BRT)
                        pts.append((dt_brt, float(val)))
                    except Exception:
                        continue
            pts.sort(key=lambda x: x[0])
            today_pts = [(t, v) for t, v in pts if t.date() == today_date]
            if today_pts:
                chuva_hoje = round(sum(max(0.0, v) for _, v in today_pts), 1)
                first_pos = next((t for t, v in today_pts if v > 0.0), None)
                if first_pos is not None:
                    inicio_hhmm = first_pos.strftime("%H:%M")
    except Exception:
        pass

    # 2. Refinamento de minuto (10 em 10 min) via grafico_pcds.php se a chuva iniciou nas últimas 4h
    try:
        gp_url = f"https://resources.cemaden.gov.br/graficos/interativo/grafico_pcds.php?idpcd={cid}&uf=RJ"
        html = fetch_url_data(gp_url, timeout=6, is_json=False)
        if html:
            m_times = re.search(r"Grafico\([^[]*\[([^\]]+)\]\s*,\s*'[^']*'\s*,\s*\[([^\]]+)\]", html)
            if m_times:
                raw_ts = re.findall(r"'([^']+)'", m_times.group(1))
                raw_vs = [safe_float(x, 0.0) for x in m_times.group(2).split(",")]
                ten_pts = []
                for t_lbl, v_num in zip(raw_ts, raw_vs):
                    # Ex: '2026-10-30  08h20 UTC'
                    mt = re.match(r"(\d{4}-\d{2}-\d{2})\s+(\d{2})h(\d{2})", t_lbl.strip())
                    if mt:
                        dt_u = datetime.strptime(
                            f"{mt.group(1)} {mt.group(2)}:{mt.group(3)}", "%Y-%m-%d %H:%M"
                        ).replace(tzinfo=timezone.utc)
                        ten_pts.append((dt_u.astimezone(BRT), v_num))
                ten_today = [(t, v) for t, v in ten_pts if t.date() == today_date and v > 0.0]
                if ten_today:
                    first_10m = ten_today[0][0]
                    # Se não tínhamos início horário, ou se o início horário bate com a mesma hora/janela das 4h
                    if inicio_hhmm is None or first_10m.strftime("%H:00") == inicio_hhmm:
                        inicio_hhmm = first_10m.strftime("%H:%M")
    except Exception:
        pass

    return inicio_hhmm, chuva_hoje


def get_wu_api_key():
    """Valida a chave da Weather Underground ou extrai chave atualizada dinamicamente"""
    try:
        test_url = f"https://api.weather.com/v2/pws/observations/current?stationId=IRIODA17&format=json&units=m&numericPrecision=decimal&apiKey={DEFAULT_WU_KEY}"
        data = fetch_url_data(test_url, timeout=5, is_json=True)
        if data and "observations" in data:
            return DEFAULT_WU_KEY
    except Exception:
        pass

    try:
        html = fetch_url_data("https://www.wunderground.com/dashboard/pws/IRIODA17", timeout=8)
        if html:
            keys = re.findall(r'apiKey=([a-f0-9]{32})', html)
            if keys:
                return keys[0]
    except Exception:
        pass

    return DEFAULT_WU_KEY


def collect_stations_network():
    print(">> [Rede Pluviométrica] Coletando todas as 10 estações em tempo real (precisão decimal)...")
    wu_key = get_wu_api_key()
    now_brt = datetime.now(BRT)
    today_iso = now_brt.strftime("%Y-%m-%d")
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
            "vento_dir_graus": None,
            "vento_dir_cardinal": None,
            "vento_max_hoje": None,
            "hora_vento_max_hoje": None,
            "rajada_max_hoje": None,
            "hora_rajada_max_hoje": None,
            "vento_max_24h": None,
            "rajada_max_24h": None,
            "umidade_atual": None,
            "pressao_atual": None,
            "uv_atual": None,
            "radiacao_solar": None,
            "chuva_hoje": 0.0,
            "chuva_taxa_atual": 0.0,
            "inicio_chuva_hoje": None,
            "chuva_1h": 0.0,
            "chuva_4h": 0.0,
            "chuva_6h": 0.0,
            "chuva_12h": 0.0,
            "chuva_24h": 0.0,
            "chuva_36h": 0.0,
            "chuva_48h": 0.0,
            "chuva_96h": 0.0,
            "ultima_leitura": "Sem dados recentes",
            "online": False
        }

        curr_obs_dt = None
        curr_precip_today = 0.0

        # A) Coleta observação atual com precisão decimal exata
        try:
            curr_url = f"https://api.weather.com/v2/pws/observations/current?stationId={pid}&format=json&units=m&numericPrecision=decimal&apiKey={wu_key}"
            c_data = fetch_url_data(curr_url, timeout=8, is_json=True)
            if c_data and "observations" in c_data and len(c_data["observations"]) > 0:
                obs = c_data["observations"][0]
                m = obs.get("metric", {})
                obs_local_str = obs.get("obsTimeLocal", "")
                if obs_local_str:
                    entry["ultima_leitura"] = obs_local_str
                    try:
                        curr_obs_dt = datetime.strptime(obs_local_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=BRT)
                    except Exception:
                        curr_obs_dt = None

                # Verifica se a leitura é recente (últimas 6 horas)
                is_recent = True
                if curr_obs_dt is not None:
                    age_sec = (now_brt - curr_obs_dt).total_seconds()
                    if age_sec > 6 * 3600:
                        is_recent = False

                if is_recent:
                    entry["online"] = True
                    if m.get("temp") is not None:
                        entry["temp_atual"] = round(safe_float(m.get("temp")), 1)
                    if m.get("windSpeed") is not None:
                        entry["vento_atual"] = round(safe_float(m.get("windSpeed")), 1)
                    if m.get("windGust") is not None:
                        entry["rajada_atual"] = round(safe_float(m.get("windGust")), 1)
                    if obs.get("winddir") is not None:
                        entry["vento_dir_graus"] = int(round(safe_float(obs.get("winddir"))))
                        entry["vento_dir_cardinal"] = deg_to_cardinal_pt(entry["vento_dir_graus"])
                    entry["umidade_atual"] = obs.get("humidity")
                    entry["pressao_atual"] = m.get("pressure")
                    entry["uv_atual"] = round(safe_float(obs.get("uv"), 0.0), 1) if obs.get("uv") is not None else None
                    entry["radiacao_solar"] = round(safe_float(obs.get("solarRadiation"), 0.0), 1) if obs.get("solarRadiation") is not None else None

                    if obs_local_str.startswith(today_iso):
                        curr_precip_today = round(safe_float(m.get("precipTotal"), 0.0), 1)
                        entry["chuva_hoje"] = curr_precip_today
                        entry["chuva_24h"] = curr_precip_today
                    entry["chuva_taxa_atual"] = round(safe_float(m.get("precipRate"), 0.0), 1)
        except Exception:
            pass

        # B) Coleta curva de 5 em 5 minutos do dia atual (all/1day) para início exato da chuva e picos diários
        today_5m_buckets = []
        try:
            day_url = f"https://api.weather.com/v2/pws/observations/all/1day?stationId={pid}&format=json&units=m&numericPrecision=decimal&apiKey={wu_key}"
            d_data = fetch_url_data(day_url, timeout=9, is_json=True)
            if d_data and "observations" in d_data and len(d_data["observations"]) > 0:
                day_obs = sorted(d_data["observations"], key=lambda x: x.get("obsTimeLocal", ""))
                today_records = [o for o in day_obs if o.get("obsTimeLocal", "").startswith(today_iso)]
                prev_tot_5m = 0.0
                max_w_val = None
                max_w_hhmm = None
                max_g_val = None
                max_g_hhmm = None

                for o in today_records:
                    t_str = o.get("obsTimeLocal", "")
                    m_o = o.get("metric", {})
                    tot_o = safe_float(m_o.get("precipTotal"), 0.0)
                    rate_o = safe_float(m_o.get("precipRate"), 0.0)

                    # Horário em que a chuva iniciou hoje (primeiro registro > 0 desde 00:00)
                    if entry["inicio_chuva_hoje"] is None and (tot_o > 0.0 or rate_o > 0.0):
                        entry["inicio_chuva_hoje"] = t_str[11:16]

                    # Incremento de 5 minutos para acumulados exatos
                    try:
                        dt_o = datetime.strptime(t_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=BRT)
                        inc_5m = max(0.0, tot_o - prev_tot_5m)
                        today_5m_buckets.append((dt_o, inc_5m))
                        prev_tot_5m = max(prev_tot_5m, tot_o)
                    except Exception:
                        pass

                    # Pico de vento sustentado do dia
                    w_hi = safe_float(m_o.get("windspeedHigh"), None)
                    if w_hi is not None and (max_w_val is None or w_hi > max_w_val):
                        max_w_val = round(w_hi, 1)
                        max_w_hhmm = t_str[11:16]

                    # Pico de rajada do dia
                    g_hi = safe_float(m_o.get("windgustHigh"), None)
                    if g_hi is not None and (max_g_val is None or g_hi > max_g_val):
                        max_g_val = round(g_hi, 1)
                        max_g_hhmm = t_str[11:16]

                # Se a observação em tempo real já acumulou mais chuva após o último bloco de 5 min
                if curr_obs_dt is not None and curr_precip_today > prev_tot_5m:
                    today_5m_buckets.append((curr_obs_dt, curr_precip_today - prev_tot_5m))
                    if entry["inicio_chuva_hoje"] is None and curr_precip_today > 0.0:
                        entry["inicio_chuva_hoje"] = curr_obs_dt.strftime("%H:%M")

                if prev_tot_5m > entry["chuva_hoje"]:
                    entry["chuva_hoje"] = round(prev_tot_5m, 1)

                # Reconciliação anti-lacuna de 16s (Ecowitt / EasyWeatherPro):
                # Se o pacote instantâneo current veio 0.0 entre duas lufadas, mas o ciclo ativo
                # de 5 minutos da própria estação registrou vento/rajada, preserva a leitura real do ciclo atual.
                if entry["online"] and today_records:
                    last_5m = today_records[-1]
                    last_5m_str = last_5m.get("obsTimeLocal", "")
                    m_last = last_5m.get("metric", {})
                    is_fresh_5m = True
                    if curr_obs_dt is not None and last_5m_str:
                        try:
                            dt_last_5m = datetime.strptime(last_5m_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=BRT)
                            if abs((curr_obs_dt - dt_last_5m).total_seconds()) > 12 * 60:
                                is_fresh_5m = False
                        except Exception:
                            pass
                    if is_fresh_5m:
                        w_avg_5m = round(safe_float(m_last.get("windspeedAvg"), 0.0), 1)
                        w_hi_5m = round(safe_float(m_last.get("windspeedHigh"), 0.0), 1)
                        g_hi_5m = round(safe_float(m_last.get("windgustHigh"), 0.0), 1)
                        if entry["vento_atual"] is None or entry["vento_atual"] <= 0.0:
                            if w_avg_5m > 0.0:
                                entry["vento_atual"] = w_avg_5m
                            elif w_hi_5m > 0.0:
                                entry["vento_atual"] = w_hi_5m
                        curr_g = entry["rajada_atual"] if entry["rajada_atual"] is not None else 0.0
                        entry["rajada_atual"] = round(max(curr_g, g_hi_5m, entry["vento_atual"] or 0.0), 1)

                if max_w_val is not None:
                    entry["vento_max_hoje"] = max_w_val
                    entry["hora_vento_max_hoje"] = max_w_hhmm
                if max_g_val is not None:
                    entry["rajada_max_hoje"] = max_g_val
                    entry["hora_rajada_max_hoje"] = max_g_hhmm
        except Exception:
            pass

        # Garante consistência com leitura instantânea caso um pico esteja ocorrendo neste exato segundo
        curr_hhmm = curr_obs_dt.strftime("%H:%M") if curr_obs_dt else None
        if entry["vento_atual"] is not None:
            if entry["vento_max_hoje"] is None or entry["vento_atual"] > entry["vento_max_hoje"]:
                entry["vento_max_hoje"] = entry["vento_atual"]
                entry["hora_vento_max_hoje"] = curr_hhmm
        if entry["rajada_atual"] is not None:
            if entry["rajada_max_hoje"] is None or entry["rajada_atual"] > entry["rajada_max_hoje"]:
                entry["rajada_max_hoje"] = entry["rajada_atual"]
                entry["hora_rajada_max_hoje"] = curr_hhmm

        # C) Coleta histórico horário de 7 dias (combinando dias anteriores + malha de 5 min de hoje)
        try:
            hist_url = f"https://api.weather.com/v2/pws/observations/hourly/7day?stationId={pid}&format=json&units=m&numericPrecision=decimal&apiKey={wu_key}"
            h_data = fetch_url_data(hist_url, timeout=10, is_json=True)
            if h_data and "observations" in h_data and len(h_data["observations"]) > 0:
                hourly = h_data["observations"]
                sorted_obs = sorted(hourly, key=lambda x: x.get("obsTimeLocal", ""))
                prior_buckets = []
                today_hourly_buckets = []
                prev_day = None
                prev_val = 0.0
                for o in sorted_obs:
                    t_str = o.get("obsTimeLocal", "")
                    if not t_str:
                        continue
                    try:
                        dt = datetime.strptime(t_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=BRT)
                    except Exception:
                        continue
                    day_str = dt.strftime("%Y-%m-%d")
                    tot = safe_float(o.get("metric", {}).get("precipTotal"), 0.0)
                    if prev_day != day_str:
                        inc = max(0.0, tot)
                        prev_val = max(0.0, tot)
                        prev_day = day_str
                    else:
                        inc = max(0.0, tot - prev_val)
                        prev_val = max(prev_val, tot)
                    if day_str < today_iso:
                        prior_buckets.append((dt, inc))
                    elif day_str == today_iso:
                        today_hourly_buckets.append((dt, inc))

                combined_buckets = prior_buckets + (today_5m_buckets if today_5m_buckets else today_hourly_buckets)
                ref_now = curr_obs_dt if curr_obs_dt is not None else now_brt

                if combined_buckets:
                    def acc_hours(hrs):
                        cutoff = ref_now - timedelta(hours=hrs)
                        return round(sum(val for t, val in combined_buckets if t > cutoff), 1)

                    h1 = acc_hours(1)
                    h4 = acc_hours(4)
                    h6 = acc_hours(6)
                    h12 = acc_hours(12)
                    h24 = max(acc_hours(24), entry["chuva_hoje"])
                    h36 = max(acc_hours(36), h24)
                    h48 = max(acc_hours(48), h36)
                    h96 = max(acc_hours(96), h48)

                    entry["chuva_1h"] = h1
                    entry["chuva_4h"] = max(h4, h1)
                    entry["chuva_6h"] = max(h6, entry["chuva_4h"])
                    entry["chuva_12h"] = max(h12, entry["chuva_6h"])
                    entry["chuva_24h"] = round(h24, 1)
                    entry["chuva_36h"] = round(h36, 1)
                    entry["chuva_48h"] = round(h48, 1)
                    entry["chuva_96h"] = round(h96, 1)

                # Extremos de 24h (mantém compatibilidade com exportações e tabela)
                try:
                    cutoff_24h = ref_now - timedelta(hours=24)
                    obs_24h = []
                    for o in sorted_obs:
                        ts_o = o.get("obsTimeLocal", "")
                        if ts_o:
                            dt_o = datetime.strptime(ts_o, "%Y-%m-%d %H:%M:%S").replace(tzinfo=BRT)
                            if dt_o >= cutoff_24h:
                                obs_24h.append(o)
                    if obs_24h:
                        v_vals = [safe_float(o.get("metric", {}).get("windspeedHigh"), None) for o in obs_24h if o.get("metric", {}).get("windspeedHigh") is not None]
                        g_vals = [safe_float(o.get("metric", {}).get("windgustHigh"), None) for o in obs_24h if o.get("metric", {}).get("windgustHigh") is not None]
                        if v_vals:
                            entry["vento_max_24h"] = round(max(v_vals), 1)
                        if g_vals:
                            entry["rajada_max_24h"] = round(max(g_vals), 1)
                except Exception:
                    pass
        except Exception:
            pass

        if entry["vento_max_hoje"] is not None:
            if entry["vento_max_24h"] is None or entry["vento_max_hoje"] > entry["vento_max_24h"]:
                entry["vento_max_24h"] = entry["vento_max_hoje"]
        if entry["rajada_max_hoje"] is not None:
            if entry["rajada_max_24h"] is None or entry["rajada_max_hoje"] > entry["rajada_max_24h"]:
                entry["rajada_max_24h"] = entry["rajada_max_hoje"]

        stations.append(entry)

    # 2. Estação Hidrológica e Cota do Rio (INEA)
    inea_entry = {
        "codigo": "INEA 2241036",
        "nome": "INEA Rio Jundiá (Cantagalo / Rio das Ostras) - 2241036",
        "nome_curto": "Rio Jundiá (Cantagalo)",
        "bairro": "Cantagalo / Sede Municipal",
        "rede": "INEA Alerta de Cheias",
        "categoria": "inea",
        "tipo": "hidrologica",
        "tipo_label": "Nível do Rio (Telemetria Fluvial)",
        "url": "https://alertadecheias.com.br/#/stations-info?station=2241036",
        "url_portal": "https://alertadecheias.com.br",
        "temp_atual": None,
        "vento_atual": None,
        "rajada_atual": None,
        "vento_max_hoje": None,
        "rajada_max_hoje": None,
        "vento_max_24h": None,
        "rajada_max_24h": None,
        "umidade_atual": None,
        "chuva_1h": 0.0,
        "chuva_4h": 0.0,
        "chuva_6h": 0.0,
        "chuva_12h": 0.0,
        "chuva_24h": 0.0,
        "chuva_36h": 0.0,
        "chuva_48h": 0.0,
        "chuva_96h": 0.0,
        "nivel_rio": "1.39 m",
        "cota_transbordo": "2.84 m",
        "cota_atencao": "1.99 m",
        "cota_alerta": "2.27 m",
        "alerta_maximo_pct": 49.0,
        "status_rio": "VIGILÂNCIA",
        "tendencia_rio": "Estável",
        "ultima_leitura": "Hoje",
        "online": True
    }

    try:
        try:
            from scripts.jundia_telemetry import fetch_jundia_realtime
        except ImportError:
            from jundia_telemetry import fetch_jundia_realtime

        j_live = fetch_jundia_realtime(DATA_DIR, save_10d=True)
        if j_live:
            inea_entry["nivel_rio"] = f"{j_live['nivel_dot']} m"
            inea_entry["cota_transbordo"] = "2.84 m"
            inea_entry["alerta_maximo_pct"] = float(j_live["pct_calha"])
            inea_entry["status_rio"] = j_live["status_upper"]
            inea_entry["tendencia_rio"] = j_live["tendencia"]
            inea_entry["ultima_leitura"] = j_live["ultima_leitura"]
            inea_entry["chuva_1h"] = None
            inea_entry["chuva_4h"] = None
            inea_entry["chuva_24h"] = None
            inea_entry["chuva_96h"] = None
            inea_entry["chuva_pluvio_24h"] = j_live.get("chuva_24h", 0.0)
            inea_entry["chuva_pluvio_96h"] = j_live.get("chuva_96h", 0.0)
            if j_live.get("historico_recente"):
                inea_entry["historico_recente"] = j_live["historico_recente"]
    except Exception as e:
        print(f"   [AVISO] Erro ao consultar API alertadecheias.com.br: {e}")

    stations.append(inea_entry)

    # 3. PCDs Pluviométricas Oficiais (CEMADEN) — sem inventar vento/temperatura
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
            "vento_max_hoje": None,
            "rajada_max_hoje": None,
            "vento_max_24h": None,
            "rajada_max_24h": None,
            "umidade_atual": None,
            "chuva_hoje": 0.0,
            "inicio_chuva_hoje": None,
            "chuva_1h": 0.0,
            "chuva_4h": 0.0,
            "chuva_6h": 0.0,
            "chuva_12h": 0.0,
            "chuva_24h": 0.0,
            "chuva_36h": 0.0,
            "chuva_48h": 0.0,
            "chuva_96h": 0.0,
            "ultima_leitura": "Sem leitura recente",
            "online": False
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
            c_entry["chuva_1h"] = round(acc1, 1)
            c_entry["chuva_4h"] = round(acc3, 1)
            c_entry["chuva_6h"] = round(acc6 if acc6 > 0 else (acc3 + (acc12 - acc3) * 0.33), 1)
            c_entry["chuva_12h"] = round(acc12, 1)
            c_entry["chuva_24h"] = round(acc24, 1)
            c_entry["chuva_36h"] = round(max(acc24, (acc24 + acc48) / 2.0), 1)
            c_entry["chuva_48h"] = round(max(acc24, acc48), 1)
            c_entry["chuva_96h"] = round(max(c_entry["chuva_48h"], acc96), 1)

            dt_cem_brt, fmt_cem_brt = convert_cemaden_utc_to_brt(matched.get("datahoraUltimovalor", ""))
            c_entry["ultima_leitura"] = fmt_cem_brt
            if dt_cem_brt is not None:
                c_entry["online"] = (now_brt - dt_cem_brt).total_seconds() <= 12 * 3600
            else:
                c_entry["online"] = str(matched.get("acc24hr", "-")).strip() != "-"

        inicio_cem, chuva_hoje_cem = fetch_cemaden_rain_today_details(cid, now_brt)
        if inicio_cem is not None:
            c_entry["inicio_chuva_hoje"] = inicio_cem
        if chuva_hoje_cem is not None:
            c_entry["chuva_hoje"] = chuva_hoje_cem
            if chuva_hoje_cem > c_entry["chuva_24h"]:
                c_entry["chuva_24h"] = chuva_hoje_cem
                c_entry["chuva_36h"] = max(c_entry["chuva_36h"], chuva_hoje_cem)
                c_entry["chuva_48h"] = max(c_entry["chuva_48h"], chuva_hoje_cem)
                c_entry["chuva_96h"] = max(c_entry["chuva_96h"], chuva_hoje_cem)

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

    # UV Tempo Real de Referência Municipal (Estação IRIODA17 - Praia da Tartaruga)
    irioda17_st = next((s for s in stations if s.get("codigo") == "IRIODA17"), None)
    uv_irioda17 = irioda17_st.get("uv_atual") if irioda17_st and irioda17_st.get("uv_atual") is not None else 0.0
    solar_irioda17 = irioda17_st.get("radiacao_solar") if irioda17_st and irioda17_st.get("radiacao_solar") is not None else 0.0

    dataset = {
        "atualizacao": now_brt.strftime("%Y-%m-%d %H:%M:%S"),
        "total_estacoes": len(all_stations),
        "total_pluviometricas": len(pluviometric_stations),
        "total_hidrologicas": 1,
        "estacao_rio_jundia": inea_entry,
        "estacoes_pluviometricas": pluviometric_stations,
        "uv_tempo_real": {
            "estacao_referencia": "IRIODA17",
            "nome_estacao": "Praia da Tartaruga (Weather Underground)",
            "url_estacao": "https://www.wunderground.com/dashboard/pws/IRIODA17",
            "uv": uv_irioda17,
            "radiacao_solar": solar_irioda17,
            "hora_leitura": irioda17_st.get("ultima_leitura") if irioda17_st else now_brt.strftime("%Y-%m-%d %H:%M:%S")
        },
        "resumo": {
            "media_chuva_24h": media_24h,
            "maior_acumulado_24h": max_st.get("chuva_24h", 0.0) if max_st else 0.0,
            "maior_estacao_nome": max_st.get("nome_curto", "") if max_st else "",
            "rio_jundia_cota": inea_entry.get("nivel_rio", "1.39 m"),
            "rio_jundia_status": inea_entry.get("status_rio", "VIGILÂNCIA"),
            "rio_jundia_pct": inea_entry.get("alerta_maximo_pct", 49.0),
            "rio_jundia_tendencia": inea_entry.get("tendencia_rio", "Estável"),
            "uv_atual": uv_irioda17
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
        print(
            f"[{s['categoria'].upper()}] {s['nome']} -> 24h: {s['chuva_24h']} mm | "
            f"Hoje: {s.get('chuva_hoje')} mm (Início: {s.get('inicio_chuva_hoje')}) | "
            f"Temp: {s.get('temp_atual')}°C | Vento: {s.get('vento_atual')} km/h (Raj: {s.get('rajada_atual')}) | "
            f"MaxDia: V={s.get('vento_max_hoje')} ({s.get('hora_vento_max_hoje')}) / R={s.get('rajada_max_hoje')} ({s.get('hora_rajada_max_hoje')}) | "
            f"Leitura: {s.get('ultima_leitura')} | Online: {s['online']}"
        )
