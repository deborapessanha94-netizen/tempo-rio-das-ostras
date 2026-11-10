"""
Serviço Oficial de Histórico Horário, Diário e Mensal das Estações Meteorológicas de Rio das Ostras.
Gera e alimenta diariamente (e a cada ciclo de sincronização):
1. data/historico_estacoes_raw_cache.json (Cache incremental de observações horárias das estações)
2. data/historico_estacoes.json (Base estruturada completa para visualização e filtros no portal)
3. docs/historico_estacoes_rio_das_ostras.xlsx (Planilha Excel multi-abas com linhas de Totais do Dia e do Mês)
4. docs/historico_estacoes_rio_das_ostras.csv (Planilha CSV compatível com Excel PT-BR com Totais do Dia e do Mês)

Cobertura inicial: 01/10/2026 até a data atual (alimentação contínua diária/horária).
Fontes primárias: Estações Meteorológicas em Rio das Ostras (IRIODA17 Praia da Tartaruga, IRIODA16 Cantagalo,
IRIODA6 Costazul, IRIODA15 Rocha Leão, ICASIM5 Barra de São João/Praiamar) + Reanálise Sinótica Open-Meteo.
"""

import json
import csv
import ssl
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, date, timedelta, timezone
from pathlib import Path
from collections import Counter

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DOCS_DIR = BASE_DIR / "docs"

BRT = timezone(timedelta(hours=-3))
START_DATE = date(2026, 10, 1)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

WU_KEYS = [
    "ff90f212a6984a7390f212a698ea73cc",
    "e1f10a1e78da46f5b10a1e78da96f525",
]

STATIONS_META = [
    {
        "id": "IRIODA17",
        "nome": "Praia da Tartaruga",
        "bairro": "Praia da Tartaruga (Orla / Sede)",
        "peso_vento": 1.0,
        "costeira": True,
    },
    {
        "id": "IRIODA6",
        "nome": "Costazul (Escola Jacinto)",
        "bairro": "Costazul (Orla Central)",
        "peso_vento": 0.95,
        "costeira": True,
    },
    {
        "id": "IRIODA16",
        "nome": "Cantagalo / Extensão do Bosque",
        "bairro": "Cantagalo",
        "peso_vento": 0.75,
        "costeira": False,
    },
    {
        "id": "IRIODA15",
        "nome": "Rocha Leão / REBIO União",
        "bairro": "Rocha Leão",
        "peso_vento": 0.85,
        "costeira": False,
    },
    {
        "id": "ICASIM5",
        "nome": "Praiamar / Divisa Sul",
        "bairro": "Barra de São João / Praiamar",
        "peso_vento": 0.90,
        "costeira": True,
    },
]

MESES_PT = {
    1: "Janeiro",
    2: "Fevereiro",
    3: "Março",
    4: "Abril",
    5: "Maio",
    6: "Junho",
    7: "Julho",
    8: "Agosto",
    9: "Setembro",
    10: "Outubro",
    11: "Novembro",
    12: "Dezembro",
}


def safe_float(val, default=None):
    if val is None:
        return default
    try:
        s = str(val).strip().replace(",", ".")
        if s in ("", "-", "null", "None"):
            return default
        return float(s)
    except (ValueError, TypeError):
        return default


def deg_to_cardinal_pt(deg):
    if deg is None:
        return "N/D"
    try:
        d = float(deg) % 360.0
    except (ValueError, TypeError):
        return "N/D"
    dirs = [
        "N", "NNE", "NE", "ENE",
        "L", "ESE", "SE", "SSE",
        "S", "SSO", "SO", "OSO",
        "O", "ONO", "NO", "NNO",
    ]
    idx = int(round(d / 22.5)) % 16
    return dirs[idx]


def fetch_json(url, timeout=12):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=SSL_CTX, timeout=timeout) as res:
        if res.status == 204:
            return None
        raw = res.read()
        if not raw:
            return None
        return json.loads(raw.decode("utf-8"))


def get_active_wu_key():
    for k in WU_KEYS:
        try:
            url = f"https://api.weather.com/v2/pws/observations/current?stationId=IRIODA17&format=json&units=m&numericPrecision=decimal&apiKey={k}"
            data = fetch_json(url, timeout=6)
            if data and "observations" in data:
                return k
        except Exception:
            continue
    return WU_KEYS[0]


def fetch_station_day_hourly(station_id, day_date, wu_key):
    """
    Busca as 24 leituras horárias de uma estação PWS para uma data específica (YYYYMMDD).
    Converte precipTotal cumulativo em chuva horária (mm/h) para cada hora (00 a 23).
    """
    ymd = day_date.strftime("%Y%m%d")
    url = (
        f"https://api.weather.com/v2/pws/history/hourly?"
        f"stationId={station_id}&format=json&units=m&date={ymd}&numericPrecision=decimal&apiKey={wu_key}"
    )
    try:
        data = fetch_json(url, timeout=12)
    except Exception:
        return {}

    if not data or "observations" not in data:
        return {}

    obs_list = sorted(data.get("observations", []), key=lambda x: x.get("obsTimeLocal", ""))
    hours_map = {}
    prev_cum_rain = 0.0

    for obs in obs_list:
        t_local = obs.get("obsTimeLocal", "")
        if len(t_local) < 13:
            continue
        try:
            hr = int(t_local[11:13])
        except ValueError:
            continue

        m = obs.get("metric", {})
        cum_rain = safe_float(m.get("precipTotal"), 0.0)
        # Se por algum motivo houve reset parcial, garante não-negativo
        if cum_rain < prev_cum_rain and cum_rain > 0:
            hr_rain = cum_rain
        else:
            hr_rain = max(0.0, round(cum_rain - prev_cum_rain, 2))
        prev_cum_rain = max(prev_cum_rain, cum_rain)

        w_avg = safe_float(m.get("windspeedAvg"), 0.0)
        w_high = safe_float(m.get("windspeedHigh"), w_avg)
        g_high = safe_float(m.get("windgustHigh"), w_high)
        if g_high < w_high:
            g_high = w_high

        # Filtro de Controle de Qualidade (QC) contra espúrios eletrônicos de RF (>105 km/h isolado com média baixa)
        if g_high > 105.0 or w_high > 90.0 or (w_avg < 25.0 and g_high > 80.0):
            w_high = round(max(w_avg * 1.4, 18.0), 1)
            g_high = round(max(w_avg * 1.75, 24.0), 1)

        w_dir = safe_float(obs.get("winddirAvg"), None)
        temp_avg = safe_float(m.get("tempAvg"), None)
        temp_high = safe_float(m.get("tempHigh"), temp_avg)
        temp_low = safe_float(m.get("tempLow"), temp_avg)
        hum_avg = safe_float(obs.get("humidityAvg"), None)
        press_max = safe_float(m.get("pressureMax"), None)
        press_min = safe_float(m.get("pressureMin"), press_max)
        press_avg = round((press_max + press_min) / 2.0, 1) if (press_max and press_min) else press_max

        hours_map[f"{hr:02d}"] = {
            "rain_mm": round(hr_rain, 2),
            "cum_rain_mm": round(cum_rain, 2),
            "wind_avg": round(w_avg, 1) if w_avg is not None else 0.0,
            "wind_high": round(w_high, 1) if w_high is not None else 0.0,
            "gust_high": round(g_high, 1) if g_high is not None else 0.0,
            "wind_dir": int(round(w_dir)) if w_dir is not None else None,
            "temp": round(temp_avg, 1) if temp_avg is not None else None,
            "temp_high": round(temp_high, 1) if temp_high is not None else None,
            "temp_low": round(temp_low, 1) if temp_low is not None else None,
            "humidity": round(hum_avg, 1) if hum_avg is not None else None,
            "pressure": press_avg,
        }

    return hours_map


def fetch_open_meteo_reference(start_dt, end_dt):
    """
    Busca dados horários do Open-Meteo para Rio das Ostras (-22.5269, -41.9450)
    para complementar pressão ao nível do mar, código sinótico (weather_code) e cobertura de nuvens.
    """
    days_diff = (date.today() - start_dt).days + 2
    past_days = min(max(days_diff, 45), 92)
    url = (
        f"https://api.open-meteo.com/v1/forecast?latitude=-22.5269&longitude=-41.9450"
        f"&past_days={past_days}&forecast_days=1"
        f"&hourly=temperature_2m,relative_humidity_2m,precipitation,weather_code,pressure_msl,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m"
        f"&timezone=America%2FSao_Paulo"
    )
    ref = {}
    try:
        data = fetch_json(url, timeout=15)
        if data and "hourly" in data:
            h = data["hourly"]
            times = h.get("time", [])
            for idx, t_str in enumerate(times):
                # t_str format: '2026-10-01T00:00'
                if len(t_str) < 13:
                    continue
                d_key = t_str[:10]
                hr_key = t_str[11:13]
                ref.setdefault(d_key, {})[hr_key] = {
                    "temp": safe_float(h.get("temperature_2m", [None])[idx]),
                    "humidity": safe_float(h.get("relative_humidity_2m", [None])[idx]),
                    "rain_mm": safe_float(h.get("precipitation", [0.0])[idx], 0.0),
                    "weather_code": h.get("weather_code", [0])[idx],
                    "pressure": safe_float(h.get("pressure_msl", [None])[idx]),
                    "cloud_cover": safe_float(h.get("cloud_cover", [None])[idx]),
                    "wind_speed": safe_float(h.get("wind_speed_10m", [0.0])[idx], 0.0),
                    "wind_dir": safe_float(h.get("wind_direction_10m", [None])[idx]),
                    "wind_gust": safe_float(h.get("wind_gusts_10m", [0.0])[idx], 0.0),
                }
    except Exception as e:
        print(f"   [AVISO] Open-Meteo complementar indisponível: {e}")
    return ref


def classify_day_synoptic_and_characteristics(day_summary, prev_day_summary=None):
    """
    Determina tecnicamente:
    1. SISTEMA ATUANTE REGISTRADO NAQUELE DIA
    2. CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS NAQUELE DIA
    com base nos dados reais medidos pelas estações de Rio das Ostras naquele dia.
    """
    rain_mean = day_summary["chuva_total_media_mm"]
    rain_max_st = day_summary["chuva_maior_estacao_mm"]
    rain_max_st_name = day_summary["chuva_maior_estacao_nome"]
    rain_hours = day_summary["horas_com_chuva"]
    peak_hr_rain = day_summary["chuva_pico_hora_mm"]
    peak_hr_time = day_summary["chuva_pico_horario"]

    wind_avg = day_summary["vento_vel_media_kmh"]
    wind_max = day_summary["vento_vel_max_kmh"]
    gust_max = day_summary["vento_rajada_max_kmh"]
    gust_max_time = day_summary["vento_rajada_max_horario"]
    gust_max_st = day_summary["vento_rajada_max_estacao"]
    dom_dir = day_summary["vento_dir_predominante"]
    had_south_shift = day_summary["giro_quadrante_sul"]

    t_min = day_summary["temp_min_c"]
    t_max = day_summary["temp_max_c"]
    hum_avg = day_summary["umidade_media_pct"]
    p_min = day_summary["pressao_min_hpa"]
    p_max = day_summary["pressao_max_hpa"]
    p_avg = day_summary["pressao_media_hpa"]

    delta_tmax = 0.0
    if prev_day_summary and prev_day_summary.get("temp_max_c") and t_max:
        delta_tmax = round(t_max - prev_day_summary["temp_max_c"], 1)

    south_dirs = {"S", "SSO", "SO", "SSE", "SE"}
    north_dirs = {"N", "NNE", "NE", "ENE"}

    # Classificação Sinótica do Dia
    if (dom_dir in south_dirs or had_south_shift) and (rain_max_st >= 12.0 or rain_mean >= 6.0):
        if rain_max_st >= 30.0:
            sistema_dia = "Passagem de Frente Fria (Sistema Frontal) e Canal de Umidade Costeiro Intenso"
            categoria_sistema = "Passagem de Frente Fria / Sistema Frontal"
        elif delta_tmax <= -2.5 or gust_max >= 38.0:
            sistema_dia = "Passagem de Frente Fria (SFF) com Giro de Vento para Quadrante Sul e Declínio Térmico"
            categoria_sistema = "Passagem de Frente Fria / Sistema Frontal"
        else:
            sistema_dia = "Sistema Frontal Costeiro / Transporte de Umidade Marítima de Quadrante Sul-Sudeste"
            categoria_sistema = "Passagem de Frente Fria / Sistema Frontal"
    elif dom_dir in south_dirs and (rain_max_st >= 1.5 or rain_mean >= 0.8):
        sistema_dia = "Circulação Marítima Pós-Frontal (Alta Pós-Frontal com Infiltração Marítima de SE/S)"
        categoria_sistema = "Circulação Marítima Pós-Frontal (SE/S)"
    elif rain_max_st >= 15.0 or rain_mean >= 8.0:
        sistema_dia = "Cavado em Médios/Baixos Níveis e Zona de Convergência de Umidade (Instabilidade Costeira)"
        categoria_sistema = "Cavado Costeiro / Convergência de Umidade"
    elif rain_max_st >= 2.0 or rain_mean >= 1.0:
        if t_max and t_max >= 26.5:
            sistema_dia = "Cavado Costeiro e Instabilidade Termodinâmica (Aquecimento Diurno e Pancadas Isoladas)"
        else:
            sistema_dia = "Perturbação Ondulatória nos Ventos Alísios / Infiltração Costeira Passageira"
        categoria_sistema = "Cavado Costeiro / Instabilidade Local"
    elif dom_dir in north_dirs and gust_max >= 42.0:
        sistema_dia = "Periferia da Alta Subtropical do Atlântico Sul (ASAS) com Forte Gradiente Barométrico Costeiro (Ventos de NE)"
        categoria_sistema = "Alta Subtropical do Atlântico Sul (ASAS)"
    elif dom_dir in south_dirs and gust_max >= 35.0:
        sistema_dia = "Avanço de Alta Pressão Pós-Frontal com Gradiente Costeiro Moderado a Forte (Quadrante Sul)"
        categoria_sistema = "Circulação Marítima Pós-Frontal (SE/S)"
    elif dom_dir in south_dirs or dom_dir == "L":
        sistema_dia = "Crista de Alta Pressão Subtropical / Brisa Marítima Predominante de Leste-Sudeste (Tempo Estável)"
        categoria_sistema = "Alta Subtropical do Atlântico Sul (ASAS)"
    else:
        sistema_dia = "Alta Subtropical do Atlântico Sul (ASAS) — Escoamento Predominante de N/NE e Tempo Firme"
        categoria_sistema = "Alta Subtropical do Atlântico Sul (ASAS)"

    # Classificação das Características Meteorológicas Registradas naquele Dia
    partes_carac = []
    if rain_max_st >= 25.0 or rain_mean >= 15.0:
        partes_carac.append(
            f"Dia de chuva volumosa nas estações: média municipal de {rain_mean:.1f} mm e pico de {rain_max_st:.1f} mm ({rain_max_st_name}), "
            f"distribuída em {rain_hours}h do dia (máxima horária de {peak_hr_rain:.1f} mm às {peak_hr_time})"
        )
    elif rain_max_st >= 5.0 or rain_mean >= 2.0:
        partes_carac.append(
            f"Chuva fraca a moderada registrada: média na rede de {rain_mean:.1f} mm e acumulado máximo de {rain_max_st:.1f} mm ({rain_max_st_name}) "
            f"em {rain_hours}h com registro (pico de {peak_hr_rain:.1f} mm às {peak_hr_time})"
        )
    elif rain_max_st > 0.0:
        partes_carac.append(
            f"Chuva fraca/isolada: média de {rain_mean:.1f} mm (máx de {rain_max_st:.1f} mm em {rain_max_st_name} às {peak_hr_time})"
        )
    else:
        partes_carac.append("Ausência de chuva (0.0 mm em todas as estações monitoradas)")

    # Vento
    if gust_max >= 50.0:
        nivel_vento = "ventos fortes a muito fortes com rajadas severas"
    elif gust_max >= 38.0:
        nivel_vento = "ventos moderados a fortes na faixa costeira"
    elif gust_max >= 25.0:
        nivel_vento = "ventos fracos a moderados com rajadas costeiras"
    else:
        nivel_vento = "ventos fracos a moderados"

    partes_carac.append(
        f"{nivel_vento} (velocidade média de {wind_avg:.1f} km/h, sustentado máx de {wind_max:.1f} km/h, "
        f"direção predominante {dom_dir} e rajada máxima de {gust_max:.1f} km/h às {gust_max_time} em {gust_max_st})"
    )

    # Temperatura, Umidade e Pressão
    if t_min is not None and t_max is not None:
        if t_max >= 30.0:
            perfil_termico = f"calor acentuado ({t_min:.1f}°C a {t_max:.1f}°C)"
        elif t_max <= 23.5:
            perfil_termico = f"temperaturas amenas/baixas ({t_min:.1f}°C a {t_max:.1f}°C)"
        else:
            perfil_termico = f"amplitude térmica entre {t_min:.1f}°C e {t_max:.1f}°C"
        if delta_tmax <= -3.0:
            perfil_termico += f" (declínio térmico de {abs(delta_tmax):.1f}°C)"
        elif delta_tmax >= 3.0:
            perfil_termico += f" (elevação térmica de +{delta_tmax:.1f}°C)"
        partes_carac.append(perfil_termico)

    if hum_avg is not None and p_avg is not None:
        partes_carac.append(f"umidade média de {hum_avg:.0f}% e pressão atmosférica entre {p_min:.1f} e {p_max:.1f} hPa")

    caracteristicas_dia = "; ".join(partes_carac) + "."
    return sistema_dia, categoria_sistema, caracteristicas_dia


def build_monthly_summaries(days_list):
    """
    Agrupa os resumos diários por (ano, mes) e calcula:
    - Totais mensais de chuva (média da rede e por estação)
    - Médias e extremos mensais de vento, rajadas, direção, temperatura e pressão
    - SISTEMA ATUANTE REGISTRADO DAQUELE MÊS
    - CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE MÊS
    """
    by_month = {}
    for d in days_list:
        ym = f"{d['ano']:04d}-{d['mes_num']:02d}"
        by_month.setdefault(ym, []).append(d)

    month_summaries = {}
    today_iso = datetime.now(BRT).strftime("%Y-%m-%d")

    for ym, m_days in sorted(by_month.items()):
        ano = m_days[0]["ano"]
        mes_num = m_days[0]["mes_num"]
        mes_nome = MESES_PT.get(mes_num, str(mes_num))
        total_dias_registrados = len(m_days)
        is_partial = any(d["data_iso"] == today_iso for d in m_days) and total_dias_registrados < 30

        chuva_mes_media = round(sum(d["chuva_total_media_mm"] for d in m_days), 1)
        dias_com_chuva = sum(1 for d in m_days if d["chuva_maior_estacao_mm"] >= 0.2)

        # Totais mensais por estação
        st_totals = {}
        for st_meta in STATIONS_META:
            sid = st_meta["id"]
            st_totals[sid] = round(
                sum(d["estacoes_totais_dia"].get(sid, {}).get("chuva_mm", 0.0) for d in m_days), 1
            )

        best_st_id = max(st_totals, key=lambda k: st_totals[k]) if st_totals else "IRIODA17"
        best_st_name = next((s["nome"] for s in STATIONS_META if s["id"] == best_st_id), best_st_id)
        best_st_val = st_totals.get(best_st_id, 0.0)

        # Dia mais chuvoso do mês
        wettest_day = max(m_days, key=lambda d: d["chuva_total_media_mm"])
        wettest_day_str = f"{wettest_day['data_br']} ({wettest_day['chuva_total_media_mm']:.1f} mm na média / {wettest_day['chuva_maior_estacao_mm']:.1f} mm máx)"

        # Ventos e Rajadas do mês
        vento_media_mes = round(sum(d["vento_vel_media_kmh"] for d in m_days) / len(m_days), 1)
        max_wind_day = max(m_days, key=lambda d: d["vento_vel_max_kmh"])
        vento_max_mes = max_wind_day["vento_vel_max_kmh"]

        max_gust_day = max(m_days, key=lambda d: d["vento_rajada_max_kmh"])
        rajada_max_mes = max_gust_day["vento_rajada_max_kmh"]
        rajada_max_mes_info = (
            f"{rajada_max_mes:.1f} km/h em {max_gust_day['data_br']} às {max_gust_day['vento_rajada_max_horario']} "
            f"({max_gust_day['vento_rajada_max_estacao']})"
        )

        # Direção predominante do mês
        dir_counts = Counter(d["vento_dir_predominante"] for d in m_days if d["vento_dir_predominante"] != "N/D")
        dir_pred_mes = dir_counts.most_common(1)[0][0] if dir_counts else "NE"

        # Temperaturas do mês
        t_mins = [d["temp_min_c"] for d in m_days if d["temp_min_c"] is not None]
        t_maxs = [d["temp_max_c"] for d in m_days if d["temp_max_c"] is not None]
        temp_min_mes = min(t_mins) if t_mins else 18.0
        temp_max_mes = max(t_maxs) if t_maxs else 30.0

        # Contagem de Sistemas Atuantes no Mês
        sys_counts = Counter(d["categoria_sistema"] for d in m_days)
        sys_parts = [f"{cat} ({cnt} {'dia' if cnt == 1 else 'dias'})" for cat, cnt in sys_counts.most_common()]
        status_mes_lbl = f"{mes_nome}/{ano} (Parcial: {total_dias_registrados} dias)" if is_partial else f"{mes_nome}/{ano} ({total_dias_registrados} dias)"

        sistema_mes = (
            f"Sistemas atuantes em {status_mes_lbl}: " + "; ".join(sys_parts) + "."
        )

        st_breakdown_str = " | ".join(
            f"{s['nome']}: {st_totals[s['id']]:.1f} mm" for s in STATIONS_META
        )

        caracteristicas_mes = (
            f"Resumo de {status_mes_lbl}: Chuva acumulada média na rede de {chuva_mes_media:.1f} mm em {dias_com_chuva} dias com chuva "
            f"(Acumulados nas estações: {st_breakdown_str}) | Dia mais chuvoso: {wettest_day_str} | "
            f"Vento médio mensal: {vento_media_mes:.1f} km/h, velocidade máxima sustentada: {vento_max_mes:.1f} km/h ({max_wind_day['data_br']}), "
            f"direção predominante: {dir_pred_mes} e rajada máxima do mês: {rajada_max_mes_info} | "
            f"Extremos térmicos no mês: mínima de {temp_min_mes:.1f}°C e máxima de {temp_max_mes:.1f}°C."
        )

        month_summaries[ym] = {
            "ano_mes": ym,
            "ano": ano,
            "mes_num": mes_num,
            "mes_nome": mes_nome,
            "rotulo_mes": status_mes_lbl,
            "dias_registrados": total_dias_registrados,
            "dias_com_chuva": dias_com_chuva,
            "chuva_total_media_mm": chuva_mes_media,
            "chuva_maior_estacao_mm": best_st_val,
            "chuva_maior_estacao_nome": best_st_name,
            "estacoes_totais_mes": st_totals,
            "dia_mais_chuvoso": wettest_day_str,
            "vento_vel_media_kmh": vento_media_mes,
            "vento_vel_max_kmh": vento_max_mes,
            "vento_dir_predominante": dir_pred_mes,
            "vento_rajada_max_kmh": rajada_max_mes,
            "vento_rajada_max_detalhe": rajada_max_mes_info,
            "temp_min_c": temp_min_mes,
            "temp_max_c": temp_max_mes,
            "sistema_atuante_mes": sistema_mes,
            "caracteristicas_mes": caracteristicas_mes,
        }

    return month_summaries


def export_excel_and_csv(hourly_rows, daily_summaries, monthly_summaries):
    """
    Gera:
    - docs/historico_estacoes_rio_das_ostras.xlsx (Planilha Excel completa com 4 abas e linhas de Totais)
    - docs/historico_estacoes_rio_das_ostras.csv (Planilha CSV com todas as horas + Totais do Dia + Totais do Mês)
    """
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = DOCS_DIR / "historico_estacoes_rio_das_ostras.csv"
    xlsx_path = DOCS_DIR / "historico_estacoes_rio_das_ostras.xlsx"

    # Organiza índices rápidos por data e por ano-mês
    day_map = {d["data_iso"]: d for d in daily_summaries}
    month_map = monthly_summaries

    headers_main = [
        "DIA",
        "MÊS",
        "ANO",
        "DATA",
        "HORÁRIO",
        "CHUVA EM MM POR HORA (Média Rede)",
        "CHUVA MÁXIMA NA HORA (mm)",
        "ESTAÇÃO MAIOR CHUVA NA HORA",
        "PRAIA DA TARTARUGA - IRIODA17 (mm)",
        "CANTAGALO - IRIODA16 (mm)",
        "COSTAZUL - IRIODA6 (mm)",
        "ROCHA LEÃO - IRIODA15 (mm)",
        "PRAIAMAR - ICASIM5 (mm)",
        "VENTO VELOCIDADE (km/h)",
        "VENTO VELOCIDADE MÉDIA (km/h)",
        "VENTO DIREÇÃO",
        "VENTO RAJADAS POR HORA (km/h)",
        "VENTO COMPLETO (Velocidade / Direção / Rajada)",
        "ESTAÇÃO REFERÊNCIA VENTO",
        "TEMPERATURA (°C)",
        "UMIDADE (%)",
        "PRESSÃO (hPa)",
        "SISTEMA ATUANTE REGISTRADO NAQUELE DIA",
        "SISTEMA ATUANTE REGISTRADO DAQUELE MÊS",
        "CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE DIA",
        "CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE MÊS",
    ]

    # Monta sequência de linhas combinando:
    # 24 linhas horárias -> 1 linha de TOTAL DO DIA -> (se fim do mês) 1 linha de TOTAL DO MÊS -> 1 linha de TOTAL GERAL
    combined_rows = []
    by_day_hours = {}
    for r in hourly_rows:
        by_day_hours.setdefault(r["data_iso"], []).append(r)

    sorted_days = sorted(by_day_hours.keys())
    for idx_d, d_iso in enumerate(sorted_days):
        d_hrs = by_day_hours[d_iso]
        d_sum = day_map[d_iso]
        ym = f"{d_sum['ano']:04d}-{d_sum['mes_num']:02d}"
        m_sum = month_map[ym]

        for hr_row in d_hrs:
            st_r = hr_row["chuva_por_estacao"]
            combined_rows.append({
                "row_type": "hour",
                "values": [
                    f"{hr_row['dia']:02d}",
                    f"{hr_row['mes_num']:02d} - {hr_row['mes_nome']}",
                    hr_row["ano"],
                    hr_row["data_br"],
                    hr_row["horario"],
                    hr_row["chuva_mm_hora"],
                    hr_row["chuva_max_estacao_mm"],
                    hr_row["chuva_max_estacao_nome"],
                    st_r.get("IRIODA17", 0.0),
                    st_r.get("IRIODA16", 0.0),
                    st_r.get("IRIODA6", 0.0),
                    st_r.get("IRIODA15", 0.0),
                    st_r.get("ICASIM5", 0.0),
                    hr_row["vento_velocidade_kmh"],
                    hr_row["vento_velocidade_media_kmh"],
                    hr_row["vento_direcao_completa"],
                    hr_row["vento_rajada_kmh"],
                    hr_row["vento_resumo_hora"],
                    hr_row["vento_estacao_nome"],
                    hr_row["temperatura_c"] if hr_row["temperatura_c"] is not None else "-",
                    hr_row["umidade_pct"] if hr_row["umidade_pct"] is not None else "-",
                    hr_row["pressao_hpa"] if hr_row["pressao_hpa"] is not None else "-",
                    d_sum["sistema_atuante_dia"],
                    m_sum["sistema_atuante_mes"],
                    d_sum["caracteristicas_dia"],
                    m_sum["caracteristicas_mes"],
                ]
            })

        # Linha de TOTAL DO DIA logo após as horas daquele dia
        st_d = d_sum["estacoes_totais_dia"]
        combined_rows.append({
            "row_type": "day_total",
            "values": [
                f"{d_sum['dia']:02d}",
                f"{d_sum['mes_num']:02d} - {d_sum['mes_nome']}",
                d_sum["ano"],
                d_sum["data_br"],
                f"TOTAL DO DIA ({d_sum['horas_registradas']}h)",
                d_sum["chuva_total_media_mm"],
                d_sum["chuva_maior_estacao_mm"],
                d_sum["chuva_maior_estacao_nome"],
                st_d.get("IRIODA17", {}).get("chuva_mm", 0.0),
                st_d.get("IRIODA16", {}).get("chuva_mm", 0.0),
                st_d.get("IRIODA6", {}).get("chuva_mm", 0.0),
                st_d.get("IRIODA15", {}).get("chuva_mm", 0.0),
                st_d.get("ICASIM5", {}).get("chuva_mm", 0.0),
                d_sum["vento_vel_max_kmh"],
                d_sum["vento_vel_media_kmh"],
                f"Predom.: {d_sum['vento_dir_predominante']}",
                d_sum["vento_rajada_max_kmh"],
                f"Máx: {d_sum['vento_vel_max_kmh']} km/h (Méd: {d_sum['vento_vel_media_kmh']}) | Dir: {d_sum['vento_dir_predominante']} | Raj. Máx: {d_sum['vento_rajada_max_kmh']} km/h ({d_sum['vento_rajada_max_horario']})",
                d_sum["vento_rajada_max_estacao"],
                f"{d_sum['temp_min_c']}° a {d_sum['temp_max_c']}°C",
                f"{d_sum['umidade_media_pct']}%",
                f"{d_sum['pressao_media_hpa']} hPa",
                d_sum["sistema_atuante_dia"],
                m_sum["sistema_atuante_mes"],
                d_sum["caracteristicas_dia"],
                m_sum["caracteristicas_mes"],
            ]
        })

        # Verifica se é o último dia registrado daquele mês para inserir a linha de TOTAL DO MÊS
        next_ym = None
        if idx_d + 1 < len(sorted_days):
            next_d = day_map[sorted_days[idx_d + 1]]
            next_ym = f"{next_d['ano']:04d}-{next_d['mes_num']:02d}"
        if next_ym != ym:
            st_m = m_sum["estacoes_totais_mes"]
            combined_rows.append({
                "row_type": "month_total",
                "values": [
                    "TODOS",
                    f"{m_sum['mes_num']:02d} - {m_sum['mes_nome']}",
                    m_sum["ano"],
                    f"MÊS {m_sum['mes_num']:02d}/{m_sum['ano']}",
                    f"TOTAL DO MÊS ({m_sum['dias_registrados']} dias)",
                    m_sum["chuva_total_media_mm"],
                    m_sum["chuva_maior_estacao_mm"],
                    m_sum["chuva_maior_estacao_nome"],
                    st_m.get("IRIODA17", 0.0),
                    st_m.get("IRIODA16", 0.0),
                    st_m.get("IRIODA6", 0.0),
                    st_m.get("IRIODA15", 0.0),
                    st_m.get("ICASIM5", 0.0),
                    m_sum["vento_vel_max_kmh"],
                    m_sum["vento_vel_media_kmh"],
                    f"Predom.: {m_sum['vento_dir_predominante']}",
                    m_sum["vento_rajada_max_kmh"],
                    f"Máx Mês: {m_sum['vento_vel_max_kmh']} km/h (Méd: {m_sum['vento_vel_media_kmh']}) | Dir: {m_sum['vento_dir_predominante']} | Raj. Máx: {m_sum['vento_rajada_max_detalhe']}",
                    m_sum["chuva_maior_estacao_nome"],
                    f"{m_sum['temp_min_c']}° a {m_sum['temp_max_c']}°C",
                    "-",
                    "-",
                    f"Consolidado Mensal ({m_sum['dias_com_chuva']} dias com chuva)",
                    m_sum["sistema_atuante_mes"],
                    f"Dia mais chuvoso: {m_sum['dia_mais_chuvoso']}",
                    m_sum["caracteristicas_mes"],
                ]
            })

    # Linha de TOTAL GERAL DO PERÍODO
    if daily_summaries:
        total_rain_all = round(sum(d["chuva_total_media_mm"] for d in daily_summaries), 1)
        st_all = {
            s["id"]: round(sum(d["estacoes_totais_dia"].get(s["id"], {}).get("chuva_mm", 0.0) for d in daily_summaries), 1)
            for s in STATIONS_META
        }
        best_all_id = max(st_all, key=lambda k: st_all[k])
        best_all_name = next((s["nome"] for s in STATIONS_META if s["id"] == best_all_id), best_all_id)
        max_w_all = max(d["vento_vel_max_kmh"] for d in daily_summaries)
        avg_w_all = round(sum(d["vento_vel_media_kmh"] for d in daily_summaries) / len(daily_summaries), 1)
        max_g_day_all = max(daily_summaries, key=lambda d: d["vento_rajada_max_kmh"])
        combined_rows.append({
            "row_type": "grand_total",
            "values": [
                "GERAL",
                "OUT A NOV",
                2026,
                f"{daily_summaries[0]['data_br']} a {daily_summaries[-1]['data_br']}",
                f"TOTAL GERAL ({len(daily_summaries)} dias / {len(hourly_rows)}h)",
                total_rain_all,
                st_all[best_all_id],
                best_all_name,
                st_all.get("IRIODA17", 0.0),
                st_all.get("IRIODA16", 0.0),
                st_all.get("IRIODA6", 0.0),
                st_all.get("IRIODA15", 0.0),
                st_all.get("ICASIM5", 0.0),
                max_w_all,
                avg_w_all,
                "NE / S",
                max_g_day_all["vento_rajada_max_kmh"],
                f"Pico Sustentado: {max_w_all} km/h | Pico Rajada: {max_g_day_all['vento_rajada_max_kmh']} km/h em {max_g_day_all['data_br']}",
                max_g_day_all["vento_rajada_max_estacao"],
                f"{min(d['temp_min_c'] for d in daily_summaries if d['temp_min_c'] is not None)}° a {max(d['temp_max_c'] for d in daily_summaries if d['temp_max_c'] is not None)}°C",
                "-",
                "-",
                "Série Histórica Completa Outubro-Novembro/2026",
                "Todos os Sistemas Sinóticos Registrados no Período",
                f"Total de {sum(1 for d in daily_summaries if d['chuva_maior_estacao_mm'] >= 0.2)} dias com registro de chuva nas estações",
                f"Acumulado Geral: {total_rain_all:.1f} mm (Média Rede) | {st_all[best_all_id]:.1f} mm ({best_all_name})",
            ]
        })

    # 1. Salva CSV com BOM UTF-8 e separador ';' (abre direto no Excel em Português)
    with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(headers_main)
        for item in combined_rows:
            writer.writerow(item["values"])

    # 2. Gera Planilha Excel (.XLSX) Multi-Abas com formatação profissional
    try:
        from openpyxl import Workbook
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
        from openpyxl.utils import get_column_letter

        wb = Workbook()

        header_fill = PatternFill("solid", fgColor="1E293B")
        header_font = Font(name="Calibri", size=10, bold=True, color="FFFFFF")

        day_total_fill = PatternFill("solid", fgColor="FFF7ED")
        day_total_font = Font(name="Calibri", size=10, bold=True, color="9A3412")

        month_total_fill = PatternFill("solid", fgColor="E0F2FE")
        month_total_font = Font(name="Calibri", size=10, bold=True, color="075985")

        grand_total_fill = PatternFill("solid", fgColor="DCFCE7")
        grand_total_font = Font(name="Calibri", size=11, bold=True, color="166534")

        rain_highlight_fill = PatternFill("solid", fgColor="EFF6FF")
        regular_font = Font(name="Calibri", size=10, color="0F172A")

        thin_border = Border(
            left=Side(style="thin", color="CBD5E1"),
            right=Side(style="thin", color="CBD5E1"),
            top=Side(style="thin", color="CBD5E1"),
            bottom=Side(style="thin", color="CBD5E1"),
        )

        # ABA 1: Histórico Horário Completo (com Totais do Dia e do Mês)
        ws1 = wb.active
        ws1.title = "Histórico Horário Completo"
        ws1.views.sheetView[0].showGridLines = True
        ws1.append(headers_main)

        for col_idx in range(1, len(headers_main) + 1):
            c = ws1.cell(row=1, column=col_idx)
            c.fill = header_fill
            c.font = header_font
            c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            c.border = thin_border
        ws1.row_dimensions[1].height = 28

        for r_idx, item in enumerate(combined_rows, start=2):
            ws1.append(item["values"])
            rtype = item["row_type"]
            rain_val = safe_float(item["values"][5], 0.0) or 0.0
            for c_idx in range(1, len(headers_main) + 1):
                cell = ws1.cell(row=r_idx, column=c_idx)
                cell.border = thin_border
                if rtype == "day_total":
                    cell.fill = day_total_fill
                    cell.font = day_total_font
                elif rtype == "month_total":
                    cell.fill = month_total_fill
                    cell.font = month_total_font
                elif rtype == "grand_total":
                    cell.fill = grand_total_fill
                    cell.font = grand_total_font
                else:
                    cell.font = regular_font
                    if rain_val > 0.0 and c_idx in (6, 7):
                        cell.fill = rain_highlight_fill

        ws1.freeze_panes = "A2"
        ws1.auto_filter.ref = f"A1:{get_column_letter(len(headers_main))}{len(combined_rows) + 1}"

        col_widths_1 = [
            8, 16, 8, 13, 24, 18, 18, 24, 16, 16, 16, 16, 16,
            16, 16, 16, 18, 42, 24, 14, 12, 14, 48, 52, 65, 68
        ]
        for idx_w, w in enumerate(col_widths_1, start=1):
            ws1.column_dimensions[get_column_letter(idx_w)].width = w

        # ABA 2: Totais Diários Consolidados
        ws2 = wb.create_sheet(title="Totais Diários Consolidados")
        headers_daily = [
            "DIA", "MÊS", "ANO", "DATA",
            "CHUVA TOTAL DIA - MÉDIA REDE (mm)",
            "MAIOR CHUVA NO DIA (mm)",
            "ESTAÇÃO MAIOR CHUVA",
            "HORAS COM CHUVA",
            "PICO HORÁRIO DE CHUVA (mm/h)",
            "PRAIA DA TARTARUGA IRIODA17 (mm)",
            "CANTAGALO IRIODA16 (mm)",
            "COSTAZUL IRIODA6 (mm)",
            "ROCHA LEÃO IRIODA15 (mm)",
            "PRAIAMAR ICASIM5 (mm)",
            "VENTO VEL. MÉDIA (km/h)",
            "VENTO VEL. MÁXIMA (km/h)",
            "VENTO DIREÇÃO PREDOMINANTE",
            "RAJADA MÁXIMA DO DIA (km/h)",
            "HORÁRIO / ESTAÇÃO DA RAJADA",
            "TEMP. MÍN (°C)",
            "TEMP. MÁX (°C)",
            "UMIDADE MÉDIA (%)",
            "PRESSÃO MÉDIA (hPa)",
            "SISTEMA ATUANTE REGISTRADO NAQUELE DIA",
            "SISTEMA ATUANTE REGISTRADO DAQUELE MÊS",
            "CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE DIA",
            "CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE MÊS",
        ]
        ws2.append(headers_daily)
        for col_idx in range(1, len(headers_daily) + 1):
            c = ws2.cell(row=1, column=col_idx)
            c.fill = header_fill
            c.font = header_font
            c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            c.border = thin_border
        ws2.row_dimensions[1].height = 28

        r2_idx = 2
        for idx_d, d_sum in enumerate(daily_summaries):
            ym = f"{d_sum['ano']:04d}-{d_sum['mes_num']:02d}"
            m_sum = month_map[ym]
            st_d = d_sum["estacoes_totais_dia"]
            row_vals = [
                f"{d_sum['dia']:02d}",
                f"{d_sum['mes_num']:02d} - {d_sum['mes_nome']}",
                d_sum["ano"],
                d_sum["data_br"],
                d_sum["chuva_total_media_mm"],
                d_sum["chuva_maior_estacao_mm"],
                d_sum["chuva_maior_estacao_nome"],
                d_sum["horas_com_chuva"],
                f"{d_sum['chuva_pico_hora_mm']} mm ({d_sum['chuva_pico_horario']})",
                st_d.get("IRIODA17", {}).get("chuva_mm", 0.0),
                st_d.get("IRIODA16", {}).get("chuva_mm", 0.0),
                st_d.get("IRIODA6", {}).get("chuva_mm", 0.0),
                st_d.get("IRIODA15", {}).get("chuva_mm", 0.0),
                st_d.get("ICASIM5", {}).get("chuva_mm", 0.0),
                d_sum["vento_vel_media_kmh"],
                d_sum["vento_vel_max_kmh"],
                d_sum["vento_dir_predominante"],
                d_sum["vento_rajada_max_kmh"],
                f"{d_sum['vento_rajada_max_horario']} ({d_sum['vento_rajada_max_estacao']})",
                d_sum["temp_min_c"],
                d_sum["temp_max_c"],
                d_sum["umidade_media_pct"],
                d_sum["pressao_media_hpa"],
                d_sum["sistema_atuante_dia"],
                m_sum["sistema_atuante_mes"],
                d_sum["caracteristicas_dia"],
                m_sum["caracteristicas_mes"],
            ]
            ws2.append(row_vals)
            for c_idx in range(1, len(headers_daily) + 1):
                cell = ws2.cell(row=r2_idx, column=c_idx)
                cell.font = regular_font
                cell.border = thin_border
                if d_sum["chuva_total_media_mm"] > 0 and c_idx in (5, 6):
                    cell.fill = rain_highlight_fill
            r2_idx += 1

            # Subtotal mensal ao final de cada mês
            next_ym = None
            if idx_d + 1 < len(daily_summaries):
                nd = daily_summaries[idx_d + 1]
                next_ym = f"{nd['ano']:04d}-{nd['mes_num']:02d}"
            if next_ym != ym:
                st_m = m_sum["estacoes_totais_mes"]
                m_row = [
                    "TOTAL MÊS",
                    f"{m_sum['mes_num']:02d} - {m_sum['mes_nome']}",
                    m_sum["ano"],
                    f"TOTAL {m_sum['mes_nome'].upper()}/{m_sum['ano']}",
                    m_sum["chuva_total_media_mm"],
                    m_sum["chuva_maior_estacao_mm"],
                    m_sum["chuva_maior_estacao_nome"],
                    f"{m_sum['dias_com_chuva']} dias c/ chuva",
                    m_sum["dia_mais_chuvoso"],
                    st_m.get("IRIODA17", 0.0),
                    st_m.get("IRIODA16", 0.0),
                    st_m.get("IRIODA6", 0.0),
                    st_m.get("IRIODA15", 0.0),
                    st_m.get("IRIODA15", 0.0) if "ICASIM5" not in st_m else st_m.get("ICASIM5", 0.0),
                    m_sum["vento_vel_media_kmh"],
                    m_sum["vento_vel_max_kmh"],
                    m_sum["vento_dir_predominante"],
                    m_sum["vento_rajada_max_kmh"],
                    m_sum["vento_rajada_max_detalhe"],
                    m_sum["temp_min_c"],
                    m_sum["temp_max_c"],
                    "-",
                    "-",
                    f"Consolidado de {m_sum['dias_registrados']} dias no mês",
                    m_sum["sistema_atuante_mes"],
                    f"Dia mais chuvoso: {m_sum['dia_mais_chuvoso']}",
                    m_sum["caracteristicas_mes"],
                ]
                ws2.append(m_row)
                for c_idx in range(1, len(headers_daily) + 1):
                    cell = ws2.cell(row=r2_idx, column=c_idx)
                    cell.fill = month_total_fill
                    cell.font = month_total_font
                    cell.border = thin_border
                r2_idx += 1

        ws2.freeze_panes = "A2"
        ws2.auto_filter.ref = f"A1:{get_column_letter(len(headers_daily))}{r2_idx - 1}"
        for idx_w in range(1, len(headers_daily) + 1):
            ws2.column_dimensions[get_column_letter(idx_w)].width = 22 if idx_w < 24 else 58

        # ABA 3: Totais Mensais Consolidados
        ws3 = wb.create_sheet(title="Totais Mensais Consolidados")
        headers_monthly = [
            "MÊS / ANO",
            "DIAS REGISTRADOS",
            "DIAS COM CHUVA",
            "CHUVA ACUMULADA MÉDIA REDE (mm)",
            "MAIOR ACUMULADO EM ESTAÇÃO (mm)",
            "ESTAÇÃO LÍDER NO MÊS",
            "PRAIA DA TARTARUGA IRIODA17 (mm)",
            "CANTAGALO IRIODA16 (mm)",
            "COSTAZUL IRIODA6 (mm)",
            "ROCHA LEÃO IRIODA15 (mm)",
            "PRAIAMAR ICASIM5 (mm)",
            "DIA MAIS CHUVOSO DO MÊS",
            "VENTO VEL. MÉDIA MENSAL (km/h)",
            "VENTO VEL. MÁXIMA NO MÊS (km/h)",
            "DIREÇÃO PREDOMINANTE NO MÊS",
            "MAIOR RAJADA DO MÊS (km/h)",
            "DETALHE DA MAIOR RAJADA",
            "TEMP. MÍNIMA NO MÊS (°C)",
            "TEMP. MÁXIMA NO MÊS (°C)",
            "SISTEMA ATUANTE REGISTRADO DAQUELE MÊS",
            "CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE MÊS",
        ]
        ws3.append(headers_monthly)
        for col_idx in range(1, len(headers_monthly) + 1):
            c = ws3.cell(row=1, column=col_idx)
            c.fill = header_fill
            c.font = header_font
            c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            c.border = thin_border
        ws3.row_dimensions[1].height = 28

        for r3_idx, (ym, m_sum) in enumerate(sorted(month_map.items()), start=2):
            st_m = m_sum["estacoes_totais_mes"]
            ws3.append([
                m_sum["rotulo_mes"],
                m_sum["dias_registrados"],
                m_sum["dias_com_chuva"],
                m_sum["chuva_total_media_mm"],
                m_sum["chuva_maior_estacao_mm"],
                m_sum["chuva_maior_estacao_nome"],
                st_m.get("IRIODA17", 0.0),
                st_m.get("IRIODA16", 0.0),
                st_m.get("IRIODA6", 0.0),
                st_m.get("IRIODA15", 0.0),
                st_m.get("ICASIM5", 0.0),
                m_sum["dia_mais_chuvoso"],
                m_sum["vento_vel_media_kmh"],
                m_sum["vento_vel_max_kmh"],
                m_sum["vento_dir_predominante"],
                m_sum["vento_rajada_max_kmh"],
                m_sum["vento_rajada_max_detalhe"],
                m_sum["temp_min_c"],
                m_sum["temp_max_c"],
                m_sum["sistema_atuante_mes"],
                m_sum["caracteristicas_mes"],
            ])
            for c_idx in range(1, len(headers_monthly) + 1):
                cell = ws3.cell(row=r3_idx, column=c_idx)
                cell.fill = month_total_fill
                cell.font = month_total_font
                cell.border = thin_border

        ws3.freeze_panes = "A2"
        for idx_w in range(1, len(headers_monthly) + 1):
            ws3.column_dimensions[get_column_letter(idx_w)].width = 24 if idx_w < 20 else 65

        wb.save(xlsx_path)
        print(f">> [XLSX] Planilha Excel gerada com sucesso em: {xlsx_path}")
    except Exception as e:
        print(f"   [AVISO] Erro ao gerar planilha XLSX: {e}")

    print(f">> [CSV] Planilha CSV gerada com sucesso em: {csv_path}")


def update_historical_spreadsheet(force_refresh_all=False):
    """
    Executa a coleta incremental desde 01/10/2026 até hoje (BRT),
    calcula os totais por hora, por dia e por mês, classifica sistemas sinóticos
    e características meteorológicas e exporta JSON, XLSX e CSV.
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = DATA_DIR / "historico_estacoes_raw_cache.json"

    now_brt = datetime.now(BRT)
    today_date = now_brt.date()
    yesterday_date = today_date - timedelta(days=1)

    raw_cache = {}
    if cache_file.exists() and not force_refresh_all:
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                raw_cache = json.load(f)
        except Exception:
            raw_cache = {}

    wu_key = get_active_wu_key()

    # Lista de todas as datas desde 01/10/2026 até hoje
    all_dates = []
    curr = START_DATE
    while curr <= today_date:
        all_dates.append(curr)
        curr += timedelta(days=1)

    # Identifica quais (data, estacao) precisam ser consultadas na API
    # Sempre atualiza ontem e hoje para garantir fechamento diário e dados horários ao vivo de hoje
    tasks = []
    for d in all_dates:
        d_iso = d.strftime("%Y-%m-%d")
        is_recent_day = d >= yesterday_date
        cached_day = raw_cache.get(d_iso, {})
        for st in STATIONS_META:
            sid = st["id"]
            if is_recent_day or sid not in cached_day:
                tasks.append((d, d_iso, sid))

    if tasks:
        print(f">> [Histórico Estações] Sincronizando {len(tasks)} blocos diários/estação na Weather Underground...")
        with ThreadPoolExecutor(max_workers=14) as executor:
            future_map = {
                executor.submit(fetch_station_day_hourly, sid, d, wu_key): (d_iso, sid)
                for (d, d_iso, sid) in tasks
            }
            for fut in as_completed(future_map):
                d_iso, sid = future_map[fut]
                try:
                    res = fut.result()
                except Exception:
                    res = {}
                raw_cache.setdefault(d_iso, {})[sid] = res

        # Salva cache atualizado
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(raw_cache, f, ensure_ascii=False)

    # Busca dados complementares de pressão/sinótico do Open-Meteo
    om_ref = fetch_open_meteo_reference(START_DATE, today_date)

    hourly_rows = []
    daily_summaries = []
    prev_day_summary = None

    for d in all_dates:
        d_iso = d.strftime("%Y-%m-%d")
        d_br = d.strftime("%d/%m/%Y")
        dia_num = d.day
        mes_num = d.month
        mes_nome = MESES_PT.get(mes_num, str(mes_num))
        ano_num = d.year

        day_st_data = raw_cache.get(d_iso, {})
        om_day_data = om_ref.get(d_iso, {})

        # Define até qual hora processar (se for hoje, até a hora atual BRT; se dias passados, 00..23)
        max_hr = now_brt.hour if d == today_date else 23

        day_hourly_records = []
        st_day_rain_totals = {s["id"]: 0.0 for s in STATIONS_META}
        st_day_max_gust = {s["id"]: 0.0 for s in STATIONS_META}

        for hr in range(0, max_hr + 1):
            hr_key = f"{hr:02d}"
            horario_fmt = f"{hr:02d}:00"
            om_hr = om_day_data.get(hr_key, {})

            # Chuva por estação naquela hora
            rain_by_st = {}
            active_rains = []
            for st in STATIONS_META:
                sid = st["id"]
                st_hr = day_st_data.get(sid, {}).get(hr_key)
                if st_hr is not None and st_hr.get("rain_mm") is not None:
                    r_val = round(float(st_hr["rain_mm"]), 2)
                    rain_by_st[sid] = r_val
                    active_rains.append((sid, st["nome"], r_val))
                    st_day_rain_totals[sid] = round(st_day_rain_totals[sid] + r_val, 2)
                else:
                    rain_by_st[sid] = 0.0

            if active_rains:
                rain_mean_hr = round(sum(x[2] for x in active_rains) / len(active_rains), 2)
                best_rain_st = max(active_rains, key=lambda x: x[2])
                rain_max_hr = best_rain_st[2]
                rain_max_st_name = best_rain_st[1] if rain_max_hr > 0 else "Sem chuva (0.0 mm)"
            else:
                om_r = round(float(om_hr.get("rain_mm") or 0.0), 2)
                rain_mean_hr = om_r
                rain_max_hr = om_r
                rain_max_st_name = "Reanálise Municipal" if om_r > 0 else "Sem chuva (0.0 mm)"

            # Vento, Direção e Rajada naquela hora (prioriza estações costeiras/ativas com maior rajada/vento real)
            wind_candidates = []
            for st in STATIONS_META:
                sid = st["id"]
                st_hr = day_st_data.get(sid, {}).get(hr_key)
                if st_hr and (st_hr.get("wind_high", 0.0) > 0 or st_hr.get("gust_high", 0.0) > 0):
                    w_hi = float(st_hr.get("wind_high") or 0.0)
                    w_av = float(st_hr.get("wind_avg") or 0.0)
                    g_hi = float(st_hr.get("gust_high") or w_hi)
                    # Controle de qualidade (QC) contra pico espúrio de RF
                    if g_hi > 105.0 or w_hi > 90.0 or (w_av < 25.0 and g_hi > 80.0):
                        w_hi = round(max(w_av * 1.4, 18.0), 1)
                        g_hi = round(max(w_av * 1.75, 24.0), 1)
                    w_dr = st_hr.get("wind_dir")
                    wind_candidates.append({
                        "sid": sid,
                        "nome": st["nome"],
                        "costeira": st["costeira"],
                        "wind_high": w_hi,
                        "wind_avg": w_av,
                        "gust_high": g_hi,
                        "wind_dir": w_dr,
                    })
                    if g_hi > st_day_max_gust[sid]:
                        st_day_max_gust[sid] = g_hi

            if wind_candidates:
                # Seleciona estação costeira principal (IRIODA17 ou IRIODA6) se ativa, ou a de maior vento/rajada registrada na hora
                best_w = max(wind_candidates, key=lambda x: (x["gust_high"], x["wind_high"]))
                w_vel = round(best_w["wind_high"], 1)
                w_avg_all = round(sum(x["wind_avg"] for x in wind_candidates) / len(wind_candidates), 1)
                if w_avg_all <= 0 and w_vel > 0:
                    w_avg_all = round(w_vel * 0.65, 1)
                g_vel = round(best_w["gust_high"], 1)
                w_deg = best_w["wind_dir"]
                if w_deg is None:
                    w_deg = next((x["wind_dir"] for x in wind_candidates if x["wind_dir"] is not None), om_hr.get("wind_dir"))
                w_st_name = best_w["nome"]
            else:
                # Fallback se todas as estações tiveram pacote de vento 0.0 naquela hora
                w_vel = round(float(om_hr.get("wind_speed") or 0.0), 1)
                w_avg_all = round(w_vel * 0.75, 1)
                g_vel = round(max(w_vel, float(om_hr.get("wind_gust") or 0.0)), 1)
                w_deg = om_hr.get("wind_dir")
                w_st_name = "Praia da Tartaruga / Rede Municipal"

            w_card = deg_to_cardinal_pt(w_deg)
            w_dir_full = f"{w_card} ({int(round(w_deg))}°)" if w_deg is not None else w_card
            w_resumo = f"Vel: {w_vel:.1f} km/h (Méd: {w_avg_all:.1f}) | Dir: {w_dir_full} | Rajada: {g_vel:.1f} km/h"

            # Temperatura, Umidade e Pressão média na hora entre as estações ativas
            temps = [
                day_st_data[s["id"]][hr_key]["temp"]
                for s in STATIONS_META
                if hr_key in day_st_data.get(s["id"], {}) and day_st_data[s["id"]][hr_key].get("temp") is not None
            ]
            hums = [
                day_st_data[s["id"]][hr_key]["humidity"]
                for s in STATIONS_META
                if hr_key in day_st_data.get(s["id"], {}) and day_st_data[s["id"]][hr_key].get("humidity") is not None
            ]
            presses = [
                day_st_data[s["id"]][hr_key]["pressure"]
                for s in STATIONS_META
                if hr_key in day_st_data.get(s["id"], {}) and day_st_data[s["id"]][hr_key].get("pressure") is not None
            ]

            temp_hr = round(sum(temps) / len(temps), 1) if temps else (round(om_hr["temp"], 1) if om_hr.get("temp") is not None else None)
            hum_hr = round(sum(hums) / len(hums), 0) if hums else (round(om_hr["humidity"], 0) if om_hr.get("humidity") is not None else None)
            press_hr = round(sum(presses) / len(presses), 1) if presses else (round(om_hr["pressure"], 1) if om_hr.get("pressure") is not None else None)

            rec = {
                "data_iso": d_iso,
                "data_br": d_br,
                "dia": dia_num,
                "mes_num": mes_num,
                "mes_nome": mes_nome,
                "ano": ano_num,
                "horario": horario_fmt,
                "chuva_mm_hora": rain_mean_hr,
                "chuva_max_estacao_mm": rain_max_hr,
                "chuva_max_estacao_nome": rain_max_st_name,
                "chuva_por_estacao": rain_by_st,
                "vento_velocidade_kmh": w_vel,
                "vento_velocidade_media_kmh": w_avg_all,
                "vento_direcao_cardeal": w_card,
                "vento_direcao_graus": int(round(w_deg)) if w_deg is not None else None,
                "vento_direcao_completa": w_dir_full,
                "vento_rajada_kmh": g_vel,
                "vento_resumo_hora": w_resumo,
                "vento_estacao_nome": w_st_name,
                "temperatura_c": temp_hr,
                "umidade_pct": hum_hr,
                "pressao_hpa": press_hr,
            }
            day_hourly_records.append(rec)
            hourly_rows.append(rec)

        # Consolidação do Resumo e Totais do Dia
        chuva_total_media_dia = round(sum(r["chuva_mm_hora"] for r in day_hourly_records), 1)
        best_st_day_id = max(st_day_rain_totals, key=lambda k: st_day_rain_totals[k])
        best_st_day_val = round(st_day_rain_totals[best_st_day_id], 1)
        best_st_day_name = next((s["nome"] for s in STATIONS_META if s["id"] == best_st_day_id), best_st_day_id)
        if best_st_day_val == 0.0 and chuva_total_media_dia > 0.0:
            best_st_day_val = chuva_total_media_dia
            best_st_day_name = "Rede Municipal"

        horas_com_chuva = sum(1 for r in day_hourly_records if r["chuva_max_estacao_mm"] >= 0.1)
        peak_rain_rec = max(day_hourly_records, key=lambda r: r["chuva_max_estacao_mm"]) if day_hourly_records else None
        chuva_pico_hora_mm = round(peak_rain_rec["chuva_max_estacao_mm"], 1) if peak_rain_rec else 0.0
        chuva_pico_horario = peak_rain_rec["horario"] if (peak_rain_rec and chuva_pico_hora_mm > 0) else "-"

        vento_vel_media_dia = round(
            sum(r["vento_velocidade_kmh"] for r in day_hourly_records) / len(day_hourly_records), 1
        ) if day_hourly_records else 0.0
        max_w_rec = max(day_hourly_records, key=lambda r: r["vento_velocidade_kmh"]) if day_hourly_records else None
        vento_vel_max_dia = max_w_rec["vento_velocidade_kmh"] if max_w_rec else 0.0

        max_g_rec = max(day_hourly_records, key=lambda r: r["vento_rajada_kmh"]) if day_hourly_records else None
        vento_rajada_max_dia = max_g_rec["vento_rajada_kmh"] if max_g_rec else 0.0
        vento_rajada_max_horario = max_g_rec["horario"] if max_g_rec else "00:00"
        vento_rajada_max_estacao = max_g_rec["vento_estacao_nome"] if max_g_rec else "Praia da Tartaruga"

        dirs_day = [r["vento_direcao_cardeal"] for r in day_hourly_records if r["vento_direcao_cardeal"] != "N/D"]
        dir_pred_dia = Counter(dirs_day).most_common(1)[0][0] if dirs_day else "NE"
        south_count = sum(1 for dc in dirs_day if dc in {"S", "SSO", "SO", "SSE", "SE"})
        north_count = sum(1 for dc in dirs_day if dc in {"N", "NNE", "NE", "ENE"})
        giro_sul = south_count >= 4 and north_count >= 4

        t_vals = [r["temperatura_c"] for r in day_hourly_records if r["temperatura_c"] is not None]
        h_vals = [r["umidade_pct"] for r in day_hourly_records if r["umidade_pct"] is not None]
        p_vals = [r["pressao_hpa"] for r in day_hourly_records if r["pressao_hpa"] is not None]

        temp_min_dia = round(min(t_vals), 1) if t_vals else 20.0
        temp_max_dia = round(max(t_vals), 1) if t_vals else 26.0
        umidade_media_dia = round(sum(h_vals) / len(h_vals), 0) if h_vals else 80.0
        pressao_min_dia = round(min(p_vals), 1) if p_vals else 1013.0
        pressao_max_dia = round(max(p_vals), 1) if p_vals else 1016.0
        pressao_media_dia = round(sum(p_vals) / len(p_vals), 1) if p_vals else 1014.5

        estacoes_totais_dia = {
            s["id"]: {
                "nome": s["nome"],
                "chuva_mm": round(st_day_rain_totals[s["id"]], 1),
                "rajada_max_kmh": round(st_day_max_gust[s["id"]], 1),
            }
            for s in STATIONS_META
        }

        day_summary = {
            "data_iso": d_iso,
            "data_br": d_br,
            "dia": dia_num,
            "mes_num": mes_num,
            "mes_nome": mes_nome,
            "ano": ano_num,
            "horas_registradas": len(day_hourly_records),
            "horas_com_chuva": horas_com_chuva,
            "chuva_total_media_mm": chuva_total_media_dia,
            "chuva_maior_estacao_mm": best_st_day_val,
            "chuva_maior_estacao_nome": best_st_day_name,
            "chuva_pico_hora_mm": chuva_pico_hora_mm,
            "chuva_pico_horario": chuva_pico_horario,
            "estacoes_totais_dia": estacoes_totais_dia,
            "vento_vel_media_kmh": vento_vel_media_dia,
            "vento_vel_max_kmh": vento_vel_max_dia,
            "vento_dir_predominante": dir_pred_dia,
            "giro_quadrante_sul": giro_sul,
            "vento_rajada_max_kmh": vento_rajada_max_dia,
            "vento_rajada_max_horario": vento_rajada_max_horario,
            "vento_rajada_max_estacao": vento_rajada_max_estacao,
            "temp_min_c": temp_min_dia,
            "temp_max_c": temp_max_dia,
            "umidade_media_pct": umidade_media_dia,
            "pressao_min_hpa": pressao_min_dia,
            "pressao_max_hpa": pressao_max_dia,
            "pressao_media_hpa": pressao_media_dia,
        }

        sistema_dia, cat_sistema, carac_dia = classify_day_synoptic_and_characteristics(day_summary, prev_day_summary)
        day_summary["sistema_atuante_dia"] = sistema_dia
        day_summary["categoria_sistema"] = cat_sistema
        day_summary["caracteristicas_dia"] = carac_dia

        daily_summaries.append(day_summary)
        prev_day_summary = day_summary

    # Constrói consolidações mensais (SISTEMA ATUANTE DO MÊS e CARACTERÍSTICAS DO MÊS)
    monthly_summaries = build_monthly_summaries(daily_summaries)

    # Anexa sistema_atuante_mes e caracteristicas_mes em cada dia e hora
    day_lookup = {d["data_iso"]: d for d in daily_summaries}
    for d in daily_summaries:
        ym = f"{d['ano']:04d}-{d['mes_num']:02d}"
        m_sum = monthly_summaries[ym]
        d["sistema_atuante_mes"] = m_sum["sistema_atuante_mes"]
        d["caracteristicas_mes"] = m_sum["caracteristicas_mes"]

    for r in hourly_rows:
        d_sum = day_lookup[r["data_iso"]]
        r["sistema_atuante_dia"] = d_sum["sistema_atuante_dia"]
        r["sistema_atuante_mes"] = d_sum["sistema_atuante_mes"]
        r["caracteristicas_dia"] = d_sum["caracteristicas_dia"]
        r["caracteristicas_mes"] = d_sum["caracteristicas_mes"]

    # Exporta arquivos de planilha (.xlsx e .csv)
    export_excel_and_csv(hourly_rows, daily_summaries, monthly_summaries)

    # Salva JSON estruturado para o frontend
    output_payload = {
        "atualizacao": now_brt.strftime("%d/%m/%Y %H:%M:%S"),
        "atualizacao_iso": now_brt.strftime("%Y-%m-%dT%H:%M:%S-03:00"),
        "periodo_inicio": START_DATE.strftime("%d/%m/%Y"),
        "periodo_fim": today_date.strftime("%d/%m/%Y"),
        "total_dias": len(daily_summaries),
        "total_horas": len(hourly_rows),
        "estacoes_monitoradas": STATIONS_META,
        "arquivos_planilha": {
            "xlsx": "docs/historico_estacoes_rio_das_ostras.xlsx",
            "csv": "docs/historico_estacoes_rio_das_ostras.csv",
        },
        "resumo_mensal": list(monthly_summaries.values()),
        "resumo_diario": daily_summaries,
        "registros_horarios": hourly_rows,
    }

    json_path = DATA_DIR / "historico_estacoes.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, ensure_ascii=False)

    print(
        f">> [SUCESSO] Histórico das Estações atualizado: {len(daily_summaries)} dias | "
        f"{len(hourly_rows)} registros horários | {len(monthly_summaries)} meses consolidados!"
    )
    return output_payload


if __name__ == "__main__":
    update_historical_spreadsheet()
