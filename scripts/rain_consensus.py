"""
Motor Probabilístico Multifonte de Precipitação (Fontes Oficiais Brasileiras + Modelos Globais ECMWF/GFS/ICON)
Integra, analisa e calcula distribuição probabilística (P25 / P50 / P75 / P90 e Probabilidade %) a partir de:
1. INMET Meteograma Dinâmico COSMO 7x7km (meteograma.inmet.gov.br/3304524/dinamico)
2. INMET VIME (vime.inmet.gov.br/SE) — COSMO 2.8km SE-RJ & COSMO 7km SE (prec24h, prec2dias, PWAT, CAPE)
3. INMET Previsão por Turnos & Estendida (3304524) + Avisos Meteorológicos Ativos (avisos.inmet.gov.br)
4. CPTEC/INPE Meteograma Regional WRF (3866.png)
5. CPTEC/INPE Meteograma Multimodel Horário (WRF/ETA/BRAMS/BAM 3866.json alinhado UTC->BRT)
6. CPTEC/INPE Previsão Municipal & 6 Dias + Mapas Probabilísticos P >= 5mm
7. INEA Alerta de Cheias — Boletim Oficial RH-VIII / Rio das Ostras (analise.php) + RadarTool
8. Modelos Globais (base Windy): ECMWF IFS 9km, NOAA GFS e DWD ICON 13km
9. Rede Pluviométrica em Tempo Real (CEMADEN PCD 18789, INEA 2241036, PWS Weather Underground)
"""

from datetime import datetime, timedelta

TURNOS_ORDER = [
    ("Madrugada", 0, 6, "Mad"),
    ("Manhã", 6, 12, "Man"),
    ("Tarde", 12, 18, "Tar"),
    ("Noite", 18, 24, "Noi"),
]


def index_cptec_multimodel_brt(cptec_multi_list):
    """Converte série horária UTC do CPTEC Multimodel (3866.json) para BRT (-3h)."""
    slot_map = {}
    for row in cptec_multi_list or []:
        d_str = row.get("date")
        fcst = row.get("fcst")
        if d_str is None or fcst is None:
            continue
        try:
            base_utc = datetime.strptime(str(d_str)[:19], "%Y-%m-%d %H:%M:%S")
            dt_brt = base_utc + timedelta(hours=int(fcst) - 3)
        except Exception:
            continue
        slot_map[(dt_brt.strftime("%Y-%m-%d"), dt_brt.hour)] = row
    return slot_map


def classify_inmet_text_level(desc):
    """Classifica descrição textual do INMET em nível qualitativo de chuva (0..3)."""
    if not desc:
        return 0
    dl = desc.lower()
    if "trovoad" in dl or "tempestade" in dl or "chuva forte" in dl:
        return 3
    if "pancada" in dl:
        return 2
    if "chuva" in dl or "chuvisco" in dl or "garoa" in dl:
        return 1 if ("isolada" in dl or "possibilidade" in dl) else 2
    return 0


def compute_observed_today_rain_mm(estacoes_obs):
    """Calcula chuva média e máxima já observadas hoje (00h até agora) nas estações ativas."""
    if not estacoes_obs:
        return {"media_mm": 0.0, "max_mm": 0.0, "estacoes_ativas": 0}
    vals = []
    for st in estacoes_obs:
        if st.get("categoria") == "inea":
            continue
        v = st.get("chuva_hoje")
        ultima = str(st.get("ultima_leitura", "")).lower()
        if v is None or "offline" in ultima or "sem dados" in ultima:
            continue
        try:
            fv = float(v)
            if 0.0 <= fv <= 300.0:
                vals.append(fv)
        except (TypeError, ValueError):
            continue
    if not vals:
        return {"media_mm": 0.0, "max_mm": 0.0, "estacoes_ativas": 0}
    return {
        "media_mm": round(sum(vals) / len(vals), 1),
        "max_mm": round(max(vals), 1),
        "estacoes_ativas": len(vals),
    }


def _weighted_quantile(pairs, q):
    """Calcula quantil ponderado (0..1) sobre lista de (valor, peso)."""
    clean = [(float(v), float(w)) for v, w in pairs if v is not None and w > 0]
    if not clean:
        return 0.0
    clean.sort(key=lambda t: t[0])
    total_w = sum(w for _v, w in clean)
    target = q * total_w
    acc = 0.0
    for val, w in clean:
        acc += w
        if acc >= target:
            return val
    return clean[-1][0]


def compute_daily_rain_consensus(
    day_idx,
    day_date_iso,
    dt_br_format,
    official_extractions,
    mm_slots,
    cptec_hoje,
    cptec_item_next,
    inmet_dia,
    day_alerts,
    inea_prev_dia,
    obs_today_info,
):
    """
    Executa o cálculo probabilístico (P25, P50 consensual, P75, P90 teto e Probabilidade %)
    integrando fontes oficiais brasileiras (peso principal) e modelos globais (ECMWF IFS 9km, NOAA GFS, DWD ICON),
    distribuindo os volumes nos 4 turnos e gerando a curva horária oficial unificada.
    """
    ext = official_extractions or {}
    inmet_cosmo_met = ext.get("inmet_cosmo_meteograma", {})
    inmet_vime = ext.get("inmet_vime", {})
    cptec_wrf = ext.get("cptec_wrf", {})
    cptec_prob_p05 = ext.get("cptec_prob_p05", {})
    inea_radartool = ext.get("inea_radartool", {})
    global_models = (ext.get("global_nwp") or {}).get("models", {})
    ecmwf_mod = global_models.get("ecmwf_ifs", {})
    gfs_mod = global_models.get("gfs_seamless", {})
    icon_mod = global_models.get("icon_global", {})
    ecmwf_mm = ecmwf_mod.get("daily_mm", {}).get(day_date_iso)
    ecmwf_prob = ecmwf_mod.get("daily_prob_pct", {}).get(day_date_iso)
    ecmwf_hourly = ecmwf_mod.get("hourly_brt", {})
    gfs_mm = gfs_mod.get("daily_mm", {}).get(day_date_iso)
    gfs_prob = gfs_mod.get("daily_prob_pct", {}).get(day_date_iso)
    gfs_hourly = gfs_mod.get("hourly_brt", {})
    icon_mm = icon_mod.get("daily_mm", {}).get(day_date_iso)
    icon_prob = icon_mod.get("daily_prob_pct", {}).get(day_date_iso)
    icon_hourly = icon_mod.get("hourly_brt", {})

    # 1. INMET Meteograma COSMO 7x7km (3304524)
    cosmo_met_daily = inmet_cosmo_met.get("daily_mm", {})
    cosmo_met_hourly = inmet_cosmo_met.get("hourly_brt", {})
    cosmo_met_mm = cosmo_met_daily.get(day_date_iso)

    # 2. INMET VIME (COSMO 2.8km SE-RJ & COSMO 7km SE + PWAT + CAPE)
    vime28_mm = inmet_vime.get("daily_cosmo28_mm", {}).get(day_date_iso)
    vime28_faixa = inmet_vime.get("daily_cosmo28_faixa", {}).get(day_date_iso)
    vime7_mm = inmet_vime.get("daily_cosmo7_mm", {}).get(day_date_iso)
    vime7_faixa = inmet_vime.get("daily_cosmo7_faixa", {}).get(day_date_iso)
    vime_pwat = (inmet_vime.get("agua_precipitavel") or {}).get("rep")
    vime_pwat_faixa = (inmet_vime.get("agua_precipitavel") or {}).get("faixa")
    vime_cape = (inmet_vime.get("cape") or {}).get("rep")
    vime_cape_faixa = (inmet_vime.get("cape") or {}).get("faixa")

    # 3. CPTEC/INPE WRF (3866.png)
    wrf_daily = cptec_wrf.get("daily_mm", {})
    wrf_hourly = cptec_wrf.get("hourly_brt", {})
    wrf_mm = wrf_daily.get(day_date_iso)

    # 4. CPTEC/INPE Multimodel Horário (3866.json alinhado BRT)
    mm_turn_sums = {}
    mm_turn_probs = {}
    mm_hours_count = 0
    mm_all_precs = []
    mm_all_probs = []
    for t_name, h_s, h_e, _sig in TURNOS_ORDER:
        hrs = [mm_slots.get((day_date_iso, h)) for h in range(h_s, h_e)]
        valid = [x for x in hrs if x is not None]
        mm_hours_count += len(valid)
        p_vals = [float(x.get("prec") or 0.0) for x in valid]
        pb_vals = [float(x.get("prob_prec") or 0.0) for x in valid]
        mm_all_precs.extend(p_vals)
        mm_all_probs.extend(pb_vals)
        mm_turn_sums[t_name] = sum(p_vals)
        mm_turn_probs[t_name] = max(pb_vals, default=0.0)

    has_mm_day = mm_hours_count >= 12
    mm_sum = None
    mm_prob_day = None
    if has_mm_day:
        raw_mm = sum(mm_all_precs)
        if mm_hours_count < 24:
            raw_mm = raw_mm * (24.0 / mm_hours_count)
        mm_sum = round(raw_mm, 1)
        mm_prob_day = round(max(mm_all_probs)) if mm_all_probs else 0

    # 5. CPTEC Municipal & 6 Dias + Mapa Probabilístico P>=5mm
    cptec_prob = None
    cptec_mun_mm = None
    cptec_hoje_valido = False
    if day_idx == 0 and cptec_hoje:
        hora_atual = str(cptec_hoje.get("hora_atual", ""))
        hora_atual_brt_date = hora_atual[:10]
        if len(hora_atual) >= 13 and "T" in hora_atual:
            try:
                dt_h = datetime.strptime(hora_atual[:19], "%Y-%m-%dT%H:%M:%S")
                if hora_atual.endswith("Z"):
                    dt_h = dt_h - timedelta(hours=3)
                hora_atual_brt_date = dt_h.strftime("%Y-%m-%d")
            except ValueError:
                pass
        if hora_atual_brt_date == day_date_iso:
            cptec_hoje_valido = True
            try:
                cptec_prob = float(cptec_hoje.get("probabilidade_chuva"))
            except (TypeError, ValueError):
                pass
            try:
                cptec_mun_mm = float(cptec_hoje.get("precipitacao_acumulada"))
            except (TypeError, ValueError):
                pass
    elif cptec_item_next:
        try:
            cptec_prob = float(cptec_item_next.get("probabilidade_chuva"))
        except (TypeError, ValueError):
            pass

    cptec_p05_map = cptec_prob_p05.get(day_date_iso)

    # 6. INMET Previsão (Turnos em D+0/D+1 e resumo diário em D+2..D+4)
    has_inmet_turns = bool(inmet_dia and any(k in inmet_dia for k in ("manha", "tarde", "noite")))
    inmet_turn_descs = {}
    inmet_turn_levels = {}
    if has_inmet_turns:
        mapping = {
            "Madrugada": inmet_dia.get("manha", {}),
            "Manhã": inmet_dia.get("manha", {}),
            "Tarde": inmet_dia.get("tarde", {}),
            "Noite": inmet_dia.get("noite", {}),
        }
        for t_name, sub in mapping.items():
            desc = (sub or {}).get("resumo")
            inmet_turn_descs[t_name] = desc
            inmet_turn_levels[t_name] = classify_inmet_text_level(desc)
    else:
        day_resumo = (inmet_dia or {}).get("resumo")
        day_lvl = classify_inmet_text_level(day_resumo)
        for t_name, _hs, _he, _sig in TURNOS_ORDER:
            inmet_turn_descs[t_name] = day_resumo
            inmet_turn_levels[t_name] = day_lvl if t_name in ("Tarde", "Noite") or day_lvl <= 1 else max(1, day_lvl - 1)

    inmet_day_level = max(inmet_turn_levels.values(), default=0)
    inmet_resumo_dia = " / ".join(dict.fromkeys([d for d in inmet_turn_descs.values() if d])) or None

    # 7. INEA Alerta de Cheias RH-VIII / Rio das Ostras (extração real do PDF)
    inea_valid = bool(inea_prev_dia and inea_prev_dia.get("extraido_pdf") and inea_prev_dia.get("data") == dt_br_format)
    inea_ro_min = inea_prev_dia.get("chuva_min_mm") if inea_valid else None
    inea_ro_max = inea_prev_dia.get("chuva_max_mm") if inea_valid else None
    inea_bacia_max = inea_prev_dia.get("chuva_bacia_max_mm") if inea_valid else None
    inea_cond = (inea_prev_dia.get("condicao") or "") if inea_valid else ""
    inea_raios = bool(inea_prev_dia.get("tem_raios_icone") or "raios" in inea_cond.lower()) if inea_valid else False

    inea_target = None
    inea_weight = 0.0
    if inea_valid and inea_ro_min is not None and inea_ro_max is not None:
        if inea_ro_min == 0 and inea_ro_max <= 1.0 and inea_bacia_max is not None and inea_bacia_max >= 10.0:
            inea_target = 0.8
            inea_weight = 0.22
        elif inea_ro_max <= 10.0:
            inea_target = round(inea_ro_min + 0.25 * (inea_ro_max - inea_ro_min), 1)
            inea_weight = 0.18
        else:
            inea_target = round(inea_ro_min + 0.35 * (inea_ro_max - inea_ro_min), 1)
            inea_weight = 0.30

    # 8. Montagem do Ensemble Probabilístico (Fontes Oficiais BR + Globais ECMWF/GFS/ICON)
    model_pairs = []
    if cosmo_met_mm is not None:
        model_pairs.append((float(cosmo_met_mm), 0.25))
    if vime28_mm is not None:
        model_pairs.append((float(vime28_mm), 0.22))
    if vime7_mm is not None:
        model_pairs.append((float(vime7_mm), 0.12))
    if wrf_mm is not None:
        model_pairs.append((float(wrf_mm), 0.19))
    if mm_sum is not None:
        model_pairs.append((float(mm_sum), 0.20))
    if cptec_hoje_valido and cptec_mun_mm is not None and cptec_mun_mm > 0:
        model_pairs.append((float(cptec_mun_mm), 0.12))
    if inea_target is not None and inea_weight > 0:
        model_pairs.append((float(inea_target), inea_weight))
    if ecmwf_mm is not None:
        model_pairs.append((float(ecmwf_mm), 0.18))
    if gfs_mm is not None:
        model_pairs.append((float(gfs_mm), 0.12))
    if icon_mm is not None:
        model_pairs.append((float(icon_mm), 0.14))

    # Caso limite: herda último COSMO7 / persistência leve se nenhuma grade respondeu
    if not model_pairs:
        last_cosmo7 = list(inmet_vime.get("daily_cosmo7_mm", {}).values())
        fallback_val = float(last_cosmo7[-1]) if last_cosmo7 else 0.2
        model_pairs.append((fallback_val, 1.0))

    total_w = sum(w for _v, w in model_pairs)
    esperanca_modelos = sum(v * w for v, w in model_pairs) / total_w

    # 9. Cálculo Probabilístico da Probabilidade de Chuva (%)
    prob_signals = []
    if mm_prob_day is not None:
        prob_signals.append((float(mm_prob_day), 0.26))
    if cptec_prob is not None:
        prob_signals.append((float(cptec_prob), 0.20))
    if cptec_p05_map is not None:
        prob_signals.append((float(cptec_p05_map), 0.20))
    if ecmwf_prob is not None:
        prob_signals.append((float(ecmwf_prob), 0.14))
    if gfs_prob is not None:
        prob_signals.append((float(gfs_prob), 0.12))
    if icon_prob is not None:
        prob_signals.append((float(icon_prob), 0.10))

    inmet_prob_map = {0: 10.0, 1: 40.0, 2: 58.0, 3: 75.0}
    if inmet_resumo_dia:
        prob_signals.append((inmet_prob_map.get(inmet_day_level, 20.0), 0.24))
    if inea_valid:
        inea_prob_val = 70.0 if (inea_raios or (inea_ro_min or 0) >= 10) else (48.0 if (inea_ro_max or 0) >= 10 else 25.0)
        prob_signals.append((inea_prob_val, 0.18))

    if prob_signals:
        pw_sum = sum(w for _p, w in prob_signals)
        prob_day = sum(p * w for p, w in prob_signals) / pw_sum
    else:
        prob_day = 25.0 if esperanca_modelos >= 0.5 else 10.0

    # Modulação termodinâmica real via VIME (CAPE & Água Precipitável em D+0..D+1)
    if day_idx <= 1:
        if vime_cape is not None and vime_pwat is not None:
            if vime_cape >= 500 and vime_pwat >= 45:
                prob_day += 12.0
            elif vime_cape < 250 and vime_pwat < 35 and inmet_day_level <= 1:
                prob_day -= 5.0

    if inmet_day_level >= 3:
        prob_day = max(prob_day, 65.0)
    elif inmet_day_level == 2:
        prob_day = max(prob_day, 50.0)
    if day_alerts:
        prob_day = max(prob_day, 80.0)
    if day_idx == 0 and obs_today_info.get("media_mm", 0.0) > 0:
        prob_day = max(prob_day, 85.0)
    prob_day_int = int(round(max(5.0, min(100.0, prob_day))))

    # 10. Expectativa Probabilística P25 / P50 (Principal) / P75 / P90 (Teto)
    consensus_mm = esperanca_modelos
    if inea_valid and inea_ro_min is not None and inea_ro_min >= 10.0:
        consensus_mm = max(consensus_mm, 0.65 * inea_ro_min)

    # Coerência qualitativa com INMET Previsão e raios no boletim INEA (quando modelos de grade subestimam convecção isolada)
    if inmet_day_level >= 3:
        consensus_mm = max(consensus_mm, 2.2)
    elif inmet_day_level == 2:
        consensus_mm = max(consensus_mm, 1.5)
    elif inmet_day_level == 1:
        consensus_mm = max(consensus_mm, 0.6)

    if inea_raios and consensus_mm < 1.8:
        consensus_mm = max(consensus_mm, 1.8)

    # Alertas oficiais INMET ativos para 3304524 (Rio das Ostras)
    alert_ceil_mm = None
    if day_alerts:
        sev = day_alerts[0].get("cor_nome", "Amarelo")
        alert_floor = 30.0 if sev == "Vermelho" else (15.0 if sev == "Laranja" else 5.0)
        consensus_mm = max(consensus_mm, alert_floor)
        # Extrai teto do alerta (ex: "até 50 mm/dia")
        import re
        txt_r = " ".join(day_alerts[0].get("riscos", []) or [])
        m_d = re.search(r"(?:at[eé]|entre)?\s*(\d+)\s*(?:e|a|-)?\s*(\d+)?\s*mm/dia", txt_r, re.I)
        alert_ceil_mm = float(m_d.group(2) or m_d.group(1)) if m_d else 50.0

    # Piso físico do já observado hoje pelos pluviômetros (apenas D+0)
    if day_idx == 0 and obs_today_info.get("media_mm", 0.0) > 0:
        consensus_mm = max(consensus_mm, float(obs_today_info["media_mm"]))

    consensus_day_mm = round(max(0.0, consensus_mm), 1)
    p25_val = round(min(consensus_day_mm, _weighted_quantile(model_pairs, 0.25)), 1)
    if day_idx == 0 and obs_today_info.get("media_mm", 0.0) > 0:
        p25_val = max(p25_val, float(obs_today_info["media_mm"]))
    p75_val = round(max(consensus_day_mm, _weighted_quantile(model_pairs, 0.75)), 1)

    upper_cands = [v for v, _w in model_pairs] + [consensus_day_mm]
    if inea_valid and inea_ro_max is not None:
        upper_cands.append(float(inea_ro_max))
    if vime7_faixa and "a" in str(vime7_faixa):
        try:
            upper_cands.append(float(str(vime7_faixa).split("a")[-1].replace("mm", "").strip()))
        except ValueError:
            pass
    if alert_ceil_mm is not None:
        upper_cands.append(alert_ceil_mm)
    if day_idx == 0 and obs_today_info.get("max_mm", 0.0) > 0:
        upper_cands.append(float(obs_today_info["max_mm"]))
    p90_val = round(max(upper_cands), 1)

    # 11. Perfil horário oficial (INMET COSMO 7x7km + CPTEC WRF + CPTEC Multimodel) para os 4 turnos e 24h
    turn_rain = {t_name: 0.0 for t_name, _, _, _ in TURNOS_ORDER}
    turn_probs = {}
    raw_hour_curve = {}

    for t_name, h_s, h_e, _sig in TURNOS_ORDER:
        t_hours_weights = []
        for h in range(h_s, h_e):
            key_h = f"{day_date_iso}T{h:02d}"
            parts = []
            if key_h in cosmo_met_hourly:
                parts.append((float(cosmo_met_hourly[key_h]), 0.35))
            if key_h in wrf_hourly:
                parts.append((float(wrf_hourly[key_h]), 0.30))
            if (day_date_iso, h) in mm_slots:
                parts.append((float(mm_slots[(day_date_iso, h)].get("prec") or 0.0), 0.35))
            if key_h in ecmwf_hourly:
                parts.append((float(ecmwf_hourly[key_h]), 0.22))
            if key_h in gfs_hourly:
                parts.append((float(gfs_hourly[key_h]), 0.12))
            if key_h in icon_hourly:
                parts.append((float(icon_hourly[key_h]), 0.14))
            h_val = (sum(v * w for v, w in parts) / sum(w for _v, w in parts)) if parts else 0.0
            raw_hour_curve[h] = h_val
            t_hours_weights.append(h_val)

        inm_lvl = inmet_turn_levels.get(t_name, 0)
        conv_cue = 0.0
        if inm_lvl >= 3:
            conv_cue = 1.0 if t_name in ("Tarde", "Noite") else 0.35
        elif inm_lvl == 2:
            conv_cue = 0.65 if t_name in ("Tarde", "Noite") else 0.3
        elif inm_lvl == 1:
            conv_cue = 0.2
        if day_alerts and t_name == "Tarde":
            conv_cue += 1.5
        elif day_alerts and t_name == "Noite":
            conv_cue += 0.9

        mm_pb = mm_turn_probs.get(t_name, 0.0) if has_mm_day else float(prob_day_int)
        pb_t = round((mm_pb + prob_day_int) / 2.0)
        if inm_lvl >= 3:
            pb_t = max(pb_t, 65)
        elif inm_lvl == 2:
            pb_t = max(pb_t, 50)
        elif inm_lvl == 1:
            pb_t = max(pb_t, 35)
        if day_alerts and t_name in ("Tarde", "Noite"):
            pb_t = max(pb_t, 80 if t_name == "Tarde" else 70)
        turn_probs[t_name] = min(100, int(pb_t))

    # Soma dos pesos por turno e alocação exata de consensus_day_mm
    turn_weights = {}
    for t_name, h_s, h_e, _sig in TURNOS_ORDER:
        nwp_t = sum(raw_hour_curve.get(h, 0.0) for h in range(h_s, h_e))
        inm_lvl = inmet_turn_levels.get(t_name, 0)
        conv_cue = (1.0 if inm_lvl >= 3 else 0.65 if inm_lvl == 2 else 0.2 if inm_lvl == 1 else 0.0)
        if t_name in ("Madrugada", "Manhã") and inm_lvl >= 2:
            conv_cue *= 0.45
        if day_alerts and t_name == "Tarde":
            conv_cue += 1.4
        elif day_alerts and t_name == "Noite":
            conv_cue += 0.9
        turn_weights[t_name] = max(0.0, nwp_t + conv_cue * 0.45 + (turn_probs[t_name] / 100.0) * 0.15)

    if consensus_day_mm > 0.0:
        w_sum = sum(turn_weights.values()) or 1.0
        alloc = {k: round(consensus_day_mm * (w / w_sum), 1) for k, w in turn_weights.items()}
        diff = round(consensus_day_mm - sum(alloc.values()), 1)
        if abs(diff) > 0:
            heaviest = max(turn_weights, key=turn_weights.get)
            alloc[heaviest] = round(max(0.0, alloc[heaviest] + diff), 1)
        turn_rain = alloc

    # Distribuição horária oficial escalada para bater exatamente com os 4 turnos
    hourly_official_day = {}
    diurnal_defaults = {
        "Madrugada": [0.12, 0.16, 0.22, 0.22, 0.16, 0.12],
        "Manhã": [0.12, 0.14, 0.16, 0.18, 0.20, 0.20],
        "Tarde": [0.08, 0.14, 0.24, 0.28, 0.16, 0.10],
        "Noite": [0.24, 0.28, 0.20, 0.14, 0.08, 0.06],
    }
    for t_name, h_s, h_e, _sig in TURNOS_ORDER:
        t_mm = turn_rain[t_name]
        raw_h = [raw_hour_curve.get(h, 0.0) for h in range(h_s, h_e)]
        sum_h = sum(raw_h)
        weights_h = [v / sum_h for v in raw_h] if sum_h > 0.02 else diurnal_defaults[t_name]
        for idx_h, h in enumerate(range(h_s, h_e)):
            hourly_official_day[f"{day_date_iso}T{h:02d}"] = round(t_mm * weights_h[idx_h], 2)

    return {
        "consensus_day_mm": consensus_day_mm,
        "consensus_prob_day": prob_day_int,
        "probabilistico": {
            "p25_mm": p25_val,
            "p50_mm": consensus_day_mm,
            "p75_mm": p75_val,
            "p90_teto_mm": p90_val,
            "probabilidade_pct": prob_day_int,
            "qtd_fontes_numericas": len(model_pairs),
        },
        "turn_rain_mm": turn_rain,
        "turn_probs": turn_probs,
        "inmet_turn_descs": inmet_turn_descs,
        "hourly_official_day": hourly_official_day,
        "fontes_dia": {
            "inmet_cosmo_meteograma_mm": round(float(cosmo_met_mm), 1) if cosmo_met_mm is not None else None,
            "inmet_cosmo_rodada": inmet_cosmo_met.get("rodada_utc"),
            "inmet_vime_cosmo28_mm": round(float(vime28_mm), 1) if vime28_mm is not None else None,
            "inmet_vime_cosmo28_faixa": vime28_faixa,
            "inmet_vime_cosmo7_mm": round(float(vime7_mm), 1) if vime7_mm is not None else None,
            "inmet_vime_cosmo7_faixa": vime7_faixa,
            "inmet_vime_pwat_mm": vime_pwat,
            "inmet_vime_pwat_faixa": vime_pwat_faixa,
            "inmet_vime_cape_jkg": vime_cape,
            "inmet_vime_cape_faixa": vime_cape_faixa,
            "cptec_wrf_mm": round(float(wrf_mm), 1) if wrf_mm is not None else None,
            "cptec_multimodel_mm": mm_sum,
            "cptec_multimodel_horas": mm_hours_count,
            "cptec_municipal_mm": cptec_mun_mm if cptec_hoje_valido else None,
            "cptec_municipal_prob_pct": int(round(cptec_prob)) if cptec_prob is not None else None,
            "cptec_municipal_valido_hoje": cptec_hoje_valido if day_idx == 0 else None,
            "cptec_prob_p05_pct": cptec_p05_map,
            "inmet_resumo": inmet_resumo_dia,
            "inmet_aviso_id": day_alerts[0].get("id") if day_alerts else None,
            "inmet_aviso_cor": day_alerts[0].get("cor_nome") if day_alerts else None,
            "inea_faixa_municipio_mm": inea_prev_dia.get("faixa_municipio_mm") if inea_valid else None,
            "inea_faixa_bacia_mm": inea_prev_dia.get("faixa_chuva_mm") if inea_valid else None,
            "inea_referencia_mm": inea_prev_dia.get("chuva_referencia_mm") if inea_valid else None,
            "inea_radartool_estagio": inea_radartool.get("estagio") if day_idx == 0 else None,
            "ecmwf_ifs_mm": round(float(ecmwf_mm), 1) if ecmwf_mm is not None else None,
            "ecmwf_ifs_prob_pct": int(round(ecmwf_prob)) if ecmwf_prob is not None else None,
            "gfs_mm": round(float(gfs_mm), 1) if gfs_mm is not None else None,
            "gfs_prob_pct": int(round(gfs_prob)) if gfs_prob is not None else None,
            "icon_mm": round(float(icon_mm), 1) if icon_mm is not None else None,
            "icon_prob_pct": int(round(icon_prob)) if icon_prob is not None else None,
            "observado_hoje_media_mm": obs_today_info.get("media_mm") if day_idx == 0 else None,
            "observado_hoje_max_mm": obs_today_info.get("max_mm") if day_idx == 0 else None,
        },
    }
