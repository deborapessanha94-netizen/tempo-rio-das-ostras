"""
Serviço de Índices de Calor e Ondas de Calor — @tempoemriodasostras
Integra:
1. Padrão Oficial COR-Rio Níveis de Calor (NC1 a NC5 — https://cor.rio/niveis-de-calor/) via Índice de Calor (Rothfusz/NOAA).
2. Ministério da Saúde / Painel Clima e Saúde (https://clima.saude.gov.br/RJ/rio-das-ostras?modo=ehf) — IBGE 3304524 (EHF, T95, EHF99, Risco/IMEC).
3. Metodologia Oficial SES-RJ Excesso de Calor (https://cisshiny.saude.rj.gov.br/excesso_calor/) usando médias reais de 30 dias das estações de Rio das Ostras + previsão 8 dias.
"""

from datetime import datetime, timedelta, timezone
import json
import math
from pathlib import Path
import re
import ssl
import urllib.request

BRT = timezone(timedelta(hours=-3))
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

# Critérios oficiais do Protocolo de Enfrentamento ao Calor Extremo (COR-Rio: https://cor.rio/niveis-de-calor/)
COR_HEAT_LEVELS = {
    1: {
        "nivel": "NC1",
        "nome": "Calor 1 — Normalidade",
        "cor_hex": "#10B981",
        "criterio": "Sem previsão ou registro de índices de calor altos (>= 36°C).",
        "acao": "Sem impactos na rotina da cidade.",
    },
    2: {
        "nivel": "NC2",
        "nome": "Calor 2 — Atenção Térmica",
        "cor_hex": "#EAB308",
        "criterio": "Índices de calor altos (36°C a 40°C) por 1 ou 2 dias consecutivos.",
        "acao": "Coordenação e disseminação de informações sobre sintomas de exposição ao calor e hidratação; rotina sem alterações.",
    },
    3: {
        "nivel": "NC3",
        "nome": "Calor 3 — Persistência de Calor",
        "cor_hex": "#F97316",
        "criterio": "Índices de calor altos (36°C a 40°C) com permanência ou aumento por ao menos 3 dias consecutivos.",
        "acao": "Reforço intensivo da comunicação preventiva e alerta da Saúde para grupos vulneráveis (idosos, crianças e trabalhadores externos).",
    },
    4: {
        "nivel": "NC4",
        "nome": "Calor 4 — Calor Muito Alto",
        "cor_hex": "#EA580C",
        "criterio": "Índices de calor muito altos (40°C a 44°C) com permanência ou aumento por ao menos 3 dias consecutivos.",
        "acao": "Adaptação de rotinas expostas ao sol, indicação de pontos de resfriamento/climatização e sombreamento adequado.",
    },
    5: {
        "nivel": "NC5",
        "nome": "Calor 5 — Calor Extremo",
        "cor_hex": "#DC2626",
        "criterio": "Índices de calor extremos (acima de 44°C) com permanência ou aumento por ao menos 3 dias consecutivos.",
        "acao": "Abertura de pontos de resfriamento, possível suspensão de atividades externas de risco/eventos e boletins meteorológicos de 6h em 6h.",
    },
}


def compute_heat_index_c(temp_c, rh_pct):
    """Calcula o Índice de Calor (Heat Index NOAA/NWS Rothfusz) em °C."""
    if temp_c is None or rh_pct is None:
        return None
    try:
        tc = float(temp_c)
        rh = max(0.0, min(100.0, float(rh_pct)))
    except (TypeError, ValueError):
        return None

    # Fórmula NOAA é definida a partir de ~20°C; abaixo disso o índice converge à temperatura do ar
    if tc < 20.0:
        return round(tc, 1)

    tf = tc * 9.0 / 5.0 + 32.0
    hi_simple = 0.5 * (tf + 61.0 + (tf - 68.0) * 1.2 + rh * 0.094)

    if hi_simple <= 79.0:
        hi_f = hi_simple
    else:
        hi_f = (
            -42.379
            + 2.04901523 * tf
            + 10.14333127 * rh
            - 0.22475541 * tf * rh
            - 0.00683783 * (tf ** 2)
            - 0.05481717 * (rh ** 2)
            + 0.00122874 * (tf ** 2) * rh
            + 0.00085282 * tf * (rh ** 2)
            - 0.00000199 * (tf ** 2) * (rh ** 2)
        )
        if rh <= 13.0 and 80.0 <= tf <= 112.0:
            hi_f -= ((13.0 - rh) / 4.0) * math.sqrt(max(0.0, (17.0 - abs(tf - 95.0)) / 17.0))
        elif rh > 85.0 and 80.0 <= tf <= 87.0:
            hi_f += ((rh - 85.0) / 10.0) * ((87.0 - tf) / 5.0)

    hi_c = (hi_f - 32.0) * 5.0 / 9.0
    return round(hi_c, 1)


def compute_steadman_sensacao_c(temp_c, rh_pct, wind_kmh=0.0):
    """Sensação Térmica (Temperatura Aparente de Steadman / OMM com T, UR e vento)."""
    if temp_c is None or rh_pct is None:
        return None
    try:
        tc = float(temp_c)
        rh = max(0.0, min(100.0, float(rh_pct)))
        ws = max(0.0, float(wind_kmh or 0.0)) / 3.6
    except (TypeError, ValueError):
        return None
    e = (rh / 100.0) * 6.105 * math.exp((17.27 * tc) / (237.7 + tc))
    at = tc + 0.33 * e - 0.70 * ws - 4.0
    return round(at, 1)


KNOWN_HEAT_STATION_COORDS = {
    "IRIODA17": (-22.531291, -41.957444),
    "IRIODA16": (-22.440357, -41.953913),
    "IRIODA15": (-22.426845, -42.020862),
    "ICASIM5": (-22.573707, -41.985545),
}


def classify_instant_heat_band(ic_c):
    """Faixa instantânea do Índice de Calor (apoio visual ao patamar horário atual)."""
    if ic_c is None:
        return {"faixa": "Indisponível", "cor": "#64748B"}
    if ic_c > 44.0:
        return {"faixa": "Extremo · COR (> 44°C)", "cor": "#991B1B"}
    if ic_c >= 40.0:
        return {"faixa": "Muito Alto · COR (40–44°C)", "cor": "#DC2626"}
    if ic_c >= 36.0:
        return {"faixa": "Alto · COR (36–40°C)", "cor": "#EA580C"}
    if ic_c >= 32.0:
        return {"faixa": "Cuidado Extremo (32–36°C)", "cor": "#F97316"}
    if ic_c >= 27.0:
        return {"faixa": "Cuidado (27–32°C)", "cor": "#CA8A04"}
    return {"faixa": "Conforto Térmico (< 27°C)", "cor": "#10B981"}


def _parse_js_obj_fields(raw_obj_body):
    out = {}
    for m in re.finditer(r'([a-zA-Z0-9_]+):(?:"([^"]*)"|(!0|!1|void 0|null|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?))', raw_obj_body):
        k = m.group(1)
        if m.group(2) is not None:
            out[k] = m.group(2)
        else:
            v = m.group(3)
            if v == "!0":
                out[k] = True
            elif v == "!1":
                out[k] = False
            elif v in ("void 0", "null"):
                out[k] = None
            else:
                try:
                    out[k] = float(v) if ("." in v or "e" in v.lower()) else int(v)
                except ValueError:
                    out[k] = v
    return out


def fetch_clima_saude_rio_das_ostras():
    """Consulta https://clima.saude.gov.br/RJ/rio-das-ostras (Ministério da Saúde - IBGE 3304524)."""
    res = {
        "disponivel": False,
        "url_ehf": "https://clima.saude.gov.br/RJ/rio-das-ostras?modo=ehf",
        "url_risco": "https://clima.saude.gov.br/RJ/rio-das-ostras?modo=risco",
        "cd_mun": "3304524",
        "municipio": "Rio das Ostras - RJ",
        "profile": {},
        "risco": {},
        "weekly": [],
        "series_30d": [],
        "captura_brt": datetime.now(BRT).strftime("%Y-%m-%d %H:%M"),
    }
    try:
        req = urllib.request.Request(res["url_ehf"], headers=HEADERS)
        with urllib.request.urlopen(req, context=SSL_CTX, timeout=16) as resp:
            html = resp.read().decode("utf-8", "ignore")

        m_prof = re.search(r'profile:\$R\[\d+\]=\{([^}]+)\}', html)
        if m_prof:
            res["profile"] = _parse_js_obj_fields(m_prof.group(1))
            res["disponivel"] = True

        m_risco = re.search(r',risco:\$R\[\d+\]=\{([^}]+)\}', html)
        if m_risco:
            res["risco"] = _parse_js_obj_fields(m_risco.group(1))

        m_week = re.search(r'weeklySection:\$R\[\d+\]=\{data:\$R\[\d+\]=\[(.*?)\],error:', html)
        if m_week:
            for item_m in re.finditer(r'\$R\[\d+\]=\{([^}]+)\}', m_week.group(1)):
                res["weekly"].append(_parse_js_obj_fields(item_m.group(1)))

        m_ts = re.search(r'timeSeriesSection:\$R\[\d+\]=\{data:\$R\[\d+\]=\[(.*?)\],error:', html)
        if m_ts:
            for item_m in re.finditer(r'\$R\[\d+\]=\{([^}]+)\}', m_ts.group(1)):
                res["series_30d"].append(_parse_js_obj_fields(item_m.group(1)))
    except Exception as exc:
        print(f"[ClimaSaude MS EHF] Aviso: {exc}")
    return res


def classify_cor_daily_horizon(daily_rows):
    """
    Aplica exatamente a regra oficial do COR-Rio (NC1 a NC5) ao horizonte diário
    considerando picos >= 36°C, 40°C e 44°C + duração em dias consecutivos (1-2d vs >=3d).
    """
    n = len(daily_rows)
    flags_36 = [((r.get("ic_max_c") or 0.0) >= 36.0) for r in daily_rows]
    flags_40 = [((r.get("ic_max_c") or 0.0) >= 40.0) for r in daily_rows]
    flags_44 = [((r.get("ic_max_c") or 0.0) > 44.0) for r in daily_rows]

    def _run_lengths(flags):
        runs = [0] * n
        for i in range(n):
            if not flags[i]:
                continue
            # Comprimento da sequência contígua que passa pelo dia i
            l = i
            while l > 0 and flags[l - 1]:
                l -= 1
            r = i
            while r + 1 < n and flags[r + 1]:
                r += 1
            runs[i] = r - l + 1
        return runs

    r36 = _run_lengths(flags_36)
    r40 = _run_lengths(flags_40)
    r44 = _run_lengths(flags_44)

    for i, row in enumerate(daily_rows):
        if r44[i] >= 3:
            lvl = 5
        elif r40[i] >= 3:
            lvl = 4
        elif r36[i] >= 3:
            lvl = 3
        elif r36[i] >= 1:
            lvl = 2
        else:
            lvl = 1
        meta_lvl = COR_HEAT_LEVELS[lvl]
        band_pico = classify_instant_heat_band(row.get("ic_max_c"))
        row["cor_nivel_num"] = lvl
        row["cor_nivel"] = meta_lvl["nivel"]
        row["cor_nome"] = meta_lvl["nome"]
        row["cor_hex"] = meta_lvl["cor_hex"]
        row["faixa_pico"] = band_pico["faixa"]
        row["faixa_pico_cor"] = band_pico["cor"]
        row["dias_consecutivos_36"] = r36[i]
        row["dias_consecutivos_40"] = r40[i]
        row["dias_consecutivos_44"] = r44[i]
    return daily_rows


def compute_and_save_heat_indices(
    data_dir=DATA_DIR,
    hourly_om=None,
    dias_prev=None,
    acumulados=None,
):
    """Consolida ClimaSaúde MS + SES-RJ EHF + Cálculo em Tempo Real COR-Rio para Rio das Ostras."""
    data_path = Path(data_dir)
    out_file = data_path / "heat_indices.json"
    cached_old = None
    if out_file.exists():
        try:
            cached_old = json.loads(out_file.read_text(encoding="utf-8"))
        except Exception:
            cached_old = None

    # 1. Busca fonte oficial Ministério da Saúde (Clima e Saúde / IBGE 3304524)
    clima_saude = fetch_clima_saude_rio_das_ostras()
    if not clima_saude.get("disponivel") and cached_old and (cached_old.get("clima_saude_ms") or {}).get("disponivel"):
        clima_saude = cached_old["clima_saude_ms"]
        clima_saude["cached_fallback"] = True

    prof = clima_saude.get("profile") or {}
    t_p95 = float(prof.get("tmean_p95") or 28.79)
    ehf99_ref = float(prof.get("ehf99") or 9.34)
    tmax_p75_ref = float(prof.get("tmax_pico_p75") or 31.05)

    # 2. Carrega histórico real de 30 dias das estações de Rio das Ostras para EHI_accl (SES-RJ Equação 2)
    hist_30_tmeans = []
    hist_path = data_path / "historico_estacoes.json"
    if hist_path.exists():
        try:
            hd = json.loads(hist_path.read_text(encoding="utf-8"))
            for row in (hd.get("resumo_diario") or [])[-31:-1]:
                tmin_h = row.get("temp_min_c")
                tmax_h = row.get("temp_max_c")
                if tmin_h is not None and tmax_h is not None:
                    hist_30_tmeans.append((float(tmin_h) + float(tmax_h)) / 2.0)
        except Exception:
            pass
    t30d_media = round(sum(hist_30_tmeans) / len(hist_30_tmeans), 2) if hist_30_tmeans else None

    # 3. Carrega previsão horária (Open-Meteo ou fallback JSON local) para série horária do Índice de Calor
    if hourly_om is None and (data_path / "acumulados_estacoes.json").exists() and acumulados is None:
        try:
            acumulados = json.loads((data_path / "acumulados_estacoes.json").read_text(encoding="utf-8"))
        except Exception:
            acumulados = None

    # Caso hourly_om não seja passado (execução via collector.py), busca Open-Meteo rapidamente
    if hourly_om is None:
        try:
            om_url = (
                "https://api.open-meteo.com/v1/forecast?latitude=-22.5269&longitude=-41.945"
                "&hourly=temperature_2m,relative_humidity_2m&timezone=America%2FSao_Paulo&forecast_days=8"
            )
            with urllib.request.urlopen(urllib.request.Request(om_url, headers=HEADERS), context=SSL_CTX, timeout=10) as r:
                hourly_om = (json.loads(r.read().decode("utf-8"))).get("hourly", {})
        except Exception:
            hourly_om = {}

    # Organiza série horária por dia ISO
    times = (hourly_om or {}).get("time") or []
    temps = (hourly_om or {}).get("temperature_2m") or []
    rhs = (hourly_om or {}).get("relative_humidity_2m") or []
    by_day_hours = {}
    for t_str, tc, rh in zip(times, temps, rhs):
        if not t_str or tc is None or rh is None:
            continue
        d_iso = t_str[:10]
        hr_str = t_str[11:16]
        ic = compute_heat_index_c(tc, rh)
        by_day_hours.setdefault(d_iso, []).append({
            "hora": hr_str,
            "temp_c": round(float(tc), 1),
            "ur_pct": int(round(float(rh))),
            "ic_c": ic,
        })

    # Constrói tabela diária (8 dias) unificando consenso térmico oficial + série horária de IC + EHF local (SES-RJ)
    daily_rows = []
    ordered_dates = [d["date_iso"] for d in (dias_prev or []) if d.get("date_iso")]
    if not ordered_dates:
        ordered_dates = sorted(by_day_hours.keys())[:8]

    day_by_iso = {d["date_iso"]: d for d in (dias_prev or []) if d.get("date_iso")}
    for d_iso in ordered_dates:
        hrs = by_day_hours.get(d_iso, [])
        d_meta = day_by_iso.get(d_iso, {})
        ics = [h["ic_c"] for h in hrs if h["ic_c"] is not None]
        if ics:
            ic_max = round(max(ics), 1)
            ic_min = round(min(ics), 1)
            peak_hr = max(hrs, key=lambda x: x["ic_c"] if x["ic_c"] is not None else -99)["hora"]
            h36 = sum(1 for v in ics if v >= 36.0)
            h40 = sum(1 for v in ics if v >= 40.0)
            h44 = sum(1 for v in ics if v > 44.0)
        else:
            tmax_f = float(d_meta.get("t_max") or 28.0)
            tmin_f = float(d_meta.get("t_min") or 21.0)
            ic_max = compute_heat_index_c(tmax_f, 65.0)
            ic_min = compute_heat_index_c(tmin_f, 88.0)
            peak_hr = "14:00"
            h36 = h40 = h44 = 0

        t_min_d = float(d_meta["t_min"]) if d_meta.get("t_min") is not None else (min(h["temp_c"] for h in hrs) if hrs else 22.0)
        t_max_d = float(d_meta["t_max"]) if d_meta.get("t_max") is not None else (max(h["temp_c"] for h in hrs) if hrs else 28.0)
        t_mean_d = round((t_min_d + t_max_d) / 2.0, 2)

        daily_rows.append({
            "data_iso": d_iso,
            "data_br": f"{d_iso[8:10]}/{d_iso[5:7]}/{d_iso[0:4]}",
            "t_min_c": round(t_min_d, 1),
            "t_max_c": round(t_max_d, 1),
            "t_mean_c": t_mean_d,
            "ic_max_c": ic_max,
            "ic_min_c": ic_min,
            "hora_pico_ic": peak_hr,
            "horas_ge_36": h36,
            "horas_ge_40": h40,
            "horas_ge_44": h44,
        })

    # Calcula EHF Local SES-RJ (Equações 1, 2 e 3: janela 3d i..i+2 vs TP95 e T30d das estações)
    for i in range(len(daily_rows)):
        win = daily_rows[i:min(len(daily_rows), i + 3)]
        t3d = sum(x["t_mean_c"] for x in win) / len(win)
        tmax3d = sum(x["t_max_c"] for x in win) / len(win)
        ehi_sig = round(t3d - t_p95, 2)
        ehi_accl = round(t3d - t30d_media, 2) if t30d_media is not None else 0.0
        ehf_val = round(max(0.0, ehi_sig) * max(1.0, ehi_accl), 2) if ehi_sig > 0 else round(ehi_sig * max(1.0, ehi_accl), 2)
        if ehi_sig <= 0:
            ehf_cls = "Sem excesso (Normal)"
            ses_alerta = "Verde — Sem excesso de calor"
        elif ehf_val > 3.0 * ehf99_ref and tmax3d > 35.0:
            ehf_cls = "Extremo"
            ses_alerta = "Vermelho — Calor Extremo (>35°C e EHF Extremo)"
        elif ehf_val >= ehf99_ref and tmax3d > 35.0:
            ehf_cls = "Severo"
            ses_alerta = "Laranja — Alerta Estadual Severo (>35°C)"
        elif tmax3d > 35.0:
            ehf_cls = "Leve"
            ses_alerta = "Amarelo — Excesso de Calor Leve (>35°C)"
        else:
            ehf_cls = "Leve (abaixo de 35°C)"
            ses_alerta = "Normal / Atenção (Tmax 3d <= 35°C)"

        daily_rows[i]["t3d_media_c"] = round(t3d, 2)
        daily_rows[i]["tmax_3d_media_c"] = round(tmax3d, 1)
        daily_rows[i]["ehi_sig"] = ehi_sig
        daily_rows[i]["ehi_accl"] = ehi_accl
        daily_rows[i]["ehf_local"] = round(max(0.0, ehf_val), 2)
        daily_rows[i]["ehf_classificacao"] = ehf_cls
        daily_rows[i]["ses_rj_alerta"] = ses_alerta

    today_brt_iso = datetime.now(BRT).strftime("%Y-%m-%d")

    # Leitura instantânea + pico diário observado das estações de Rio das Ostras
    est_rows = []
    if acumulados and isinstance(acumulados.get("estacoes"), list):
        for st in acumulados["estacoes"]:
            tc = st.get("temp_atual")
            ur = st.get("umidade_atual")
            if tc is None or ur is None:
                continue
            wind_val = st.get("vento_atual") if st.get("vento_atual") is not None else 0.0
            sens_now = compute_steadman_sensacao_c(tc, ur, wind_val)
            ic_now = compute_heat_index_c(tc, ur)
            band = classify_instant_heat_band(ic_now)
            fb_coords = KNOWN_HEAT_STATION_COORDS.get(st.get("codigo"))
            st_lat = st.get("lat") if st.get("lat") is not None else (fb_coords[0] if fb_coords else None)
            st_lon = st.get("lon") if st.get("lon") is not None else (fb_coords[1] if fb_coords else None)
            ul_str = str(st.get("ultima_leitura") or "")
            same_day = (not ul_str[:10]) or ul_str.startswith(today_brt_iso)
            curr_hhmm = ul_str[11:16] if len(ul_str) >= 16 else "--"

            st_ic_max = st.get("ic_max_hoje") if same_day else None
            use_stored_ic = st_ic_max is not None and (ic_now is None or float(st_ic_max) > ic_now)
            ic_max_hoje = round(float(st_ic_max), 1) if use_stored_ic else ic_now
            hora_ic_max = (st.get("hora_ic_max_hoje") or curr_hhmm) if use_stored_ic else curr_hhmm
            temp_pico_ic = st.get("temp_pico_ic_hoje") if use_stored_ic else round(float(tc), 1)
            ur_pico_ic = st.get("ur_pico_ic_hoje") if use_stored_ic else int(round(float(ur)))

            st_t_max = st.get("temp_max_hoje") if same_day else None
            use_stored_t = st_t_max is not None and float(st_t_max) > float(tc)
            t_max_hoje = round(float(st_t_max), 1) if use_stored_t else round(float(tc), 1)
            hora_t_max = (st.get("hora_temp_max_hoje") or curr_hhmm) if use_stored_t else curr_hhmm
            pk_band = classify_instant_heat_band(ic_max_hoje)

            est_rows.append({
                "codigo": st.get("codigo"),
                "nome": st.get("nome_curto") or st.get("nome"),
                "temp_c": round(float(tc), 1),
                "ur_pct": int(round(float(ur))),
                "sensacao_c": sens_now,
                "ic_c": ic_now,
                "ic_max_hoje": ic_max_hoje,
                "hora_ic_max_hoje": hora_ic_max,
                "temp_max_hoje": t_max_hoje,
                "hora_temp_max_hoje": hora_t_max,
                "temp_pico_ic_hoje": temp_pico_ic,
                "ur_pico_ic_hoje": ur_pico_ic,
                "faixa_pico_hoje": pk_band["faixa"],
                "cor_pico_hoje": pk_band["cor"],
                "faixa": band["faixa"],
                "cor_hex": band["cor"],
                "ultima_leitura": st.get("ultima_leitura"),
                "lat": st_lat,
                "lon": st_lon,
            })

    maior_pico_hoje = None
    for e in est_rows:
        pk_val = e.get("ic_max_hoje") if e.get("ic_max_hoje") is not None else e.get("ic_c")
        if pk_val is None:
            continue
        if maior_pico_hoje is None or pk_val > maior_pico_hoje["ic_max_c"]:
            pk_b = classify_instant_heat_band(pk_val)
            maior_pico_hoje = {
                "ic_max_c": round(float(pk_val), 1),
                "hora": e.get("hora_ic_max_hoje") or "--",
                "codigo": e.get("codigo"),
                "nome": e.get("nome"),
                "temp_c": e.get("temp_pico_ic_hoje") if e.get("temp_pico_ic_hoje") is not None else e.get("temp_c"),
                "ur_pct": e.get("ur_pico_ic_hoje") if e.get("ur_pico_ic_hoje") is not None else e.get("ur_pct"),
                "temp_max_c": e.get("temp_max_hoje") if e.get("temp_max_hoje") is not None else e.get("temp_c"),
                "faixa": pk_b["faixa"],
                "cor_hex": pk_b["cor"],
            }

    if daily_rows and maior_pico_hoje is not None:
        if daily_rows[0].get("ic_max_c") is None or maior_pico_hoje["ic_max_c"] > daily_rows[0]["ic_max_c"]:
            daily_rows[0]["ic_max_c"] = maior_pico_hoje["ic_max_c"]
            daily_rows[0]["hora_pico_ic"] = maior_pico_hoje["hora"]
            daily_rows[0]["faixa_pico"] = maior_pico_hoje["faixa"]
            daily_rows[0]["faixa_pico_cor"] = maior_pico_hoje["cor_hex"]

    classify_cor_daily_horizon(daily_rows)

    ic_rede_agora = round(sum(e["ic_c"] for e in est_rows if e["ic_c"] is not None) / len(est_rows), 1) if est_rows else (daily_rows[0]["ic_max_c"] if daily_rows else None)
    temp_rede_agora = round(sum(e["temp_c"] for e in est_rows) / len(est_rows), 1) if est_rows else None
    ur_rede_agora = int(round(sum(e["ur_pct"] for e in est_rows) / len(est_rows))) if est_rows else None
    sens_vals = [e["sensacao_c"] for e in est_rows if e.get("sensacao_c") is not None]
    sensacao_rede_agora = round(sum(sens_vals) / len(sens_vals), 1) if sens_vals else None
    cor_hoje = daily_rows[0] if daily_rows else {}

    now_b = datetime.now(BRT)
    payload = {
        "atualizacao_brt": now_b.strftime("%d/%m/%Y %H:%M"),
        "atualizacao_iso": now_b.isoformat(),
        "fontes_oficiais": {
            "cor_rio": "https://cor.rio/niveis-de-calor/",
            "clima_saude_ms": "https://clima.saude.gov.br/RJ/rio-das-ostras?modo=ehf",
            "ses_rj_excesso_calor": "https://cisshiny.saude.rj.gov.br/excesso_calor/",
        },
        "agora": {
            "ic_rede_c": ic_rede_agora,
            "temp_rede_c": temp_rede_agora,
            "ur_rede_pct": ur_rede_agora,
            "sensacao_rede_c": sensacao_rede_agora,
            "faixa_instantanea": classify_instant_heat_band(ic_rede_agora),
            "cor_nivel": cor_hoje.get("cor_nivel", "NC1"),
            "cor_nivel_num": cor_hoje.get("cor_nivel_num", 1),
            "cor_nome": cor_hoje.get("cor_nome", COR_HEAT_LEVELS[1]["nome"]),
            "cor_hex": cor_hoje.get("cor_hex", COR_HEAT_LEVELS[1]["cor_hex"]),
            "cor_criterio": COR_HEAT_LEVELS.get(cor_hoje.get("cor_nivel_num", 1), COR_HEAT_LEVELS[1])["criterio"],
            "cor_acao": COR_HEAT_LEVELS.get(cor_hoje.get("cor_nivel_num", 1), COR_HEAT_LEVELS[1])["acao"],
            "ic_pico_hoje_c": cor_hoje.get("ic_max_c"),
            "hora_pico_hoje": cor_hoje.get("hora_pico_ic"),
            "maior_pico_hoje": maior_pico_hoje,
            "horas_ge_36_hoje": cor_hoje.get("horas_ge_36", 0),
            "dias_consecutivos_36": cor_hoje.get("dias_consecutivos_36", 0),
            "estacoes_tempo_real": est_rows,
        },
        "ses_rj_ehf_local": {
            "t_p95_climatologico": round(t_p95, 2),
            "ehf99_referencia": round(ehf99_ref, 2),
            "tmax_p75_referencia": round(tmax_p75_ref, 2),
            "t30d_estacoes_media_c": t30d_media,
            "dias_observados_base": len(hist_30_tmeans),
            "hoje": daily_rows[0] if daily_rows else {},
        },
        "clima_saude_ms": clima_saude,
        "previsao_8dias_calor": daily_rows,
        "cor_niveis_referencia": [COR_HEAT_LEVELS[k] for k in sorted(COR_HEAT_LEVELS.keys())],
    }

    try:
        out_file.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass
    return payload


if __name__ == "__main__":
    res = compute_and_save_heat_indices()
    print("Heat indices updated:", res.get("atualizacao_brt"), "COR:", res["agora"]["cor_nivel"], "IC rede:", res["agora"]["ic_rede_c"], "ClimaSaude MS disp:", (res.get("clima_saude_ms") or {}).get("disponivel"))
