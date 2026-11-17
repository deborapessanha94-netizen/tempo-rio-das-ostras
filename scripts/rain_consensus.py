"""
Motor de Consenso Pluviométrico Multifonte — @tempoemriodasostras
Integra de forma simétrica, transparente e contínua TODAS as fontes oficiais:
1. Open-Meteo (ECMWF / GFS horário)
2. CPTEC/INPE Meteograma Multimodel (WRF, ETA, BRAMS, BAM horário UTC->BRT)
3. CPTEC/INPE Previsão Municipal & 6 Dias
4. INMET Previsão por Turnos & Estendida (3304524) + Avisos Ativos
5. INEA Alerta de Cheias — Boletim Hidrometeorológico RH-VIII / Rio das Ostras
6. Rede de Pluviômetros Observados (CEMADEN PCD 18789, INEA 2241036, PWS)
"""

from datetime import datetime, timedelta

TURNOS_ORDER = [
    ("Madrugada", 0, 6, "Mad"),
    ("Manhã", 6, 12, "Man"),
    ("Tarde", 12, 18, "Tar"),
    ("Noite", 18, 24, "Noi"),
]


def index_openmeteo_by_brt(hourly):
    """Indexa arrays horários do Open-Meteo por (YYYY-MM-DD, hora_int)."""
    if not hourly or "time" not in hourly:
        return {}
    times = hourly.get("time", [])
    precs = hourly.get("precipitation", [])
    probs = hourly.get("precipitation_probability", [])
    temps = hourly.get("temperature_2m", [])
    umids = hourly.get("relative_humidity_2m", [])
    press = hourly.get("pressure_msl") or hourly.get("surface_pressure", [])
    winds = hourly.get("wind_speed_10m", [])
    gusts = hourly.get("wind_gusts_10m", [])
    dirs = hourly.get("wind_direction_10m", [])
    codes = hourly.get("weather_code", [])

    slot_map = {}
    for idx, ts in enumerate(times):
        if "T" not in ts:
            continue
        d_iso, h_part = ts.split("T", 1)
        try:
            h_int = int(h_part[:2])
        except ValueError:
            continue
        slot_map[(d_iso, h_int)] = {
            "prec": float(precs[idx]) if idx < len(precs) and precs[idx] is not None else 0.0,
            "prob": float(probs[idx]) if idx < len(probs) and probs[idx] is not None else 0.0,
            "temp": temps[idx] if idx < len(temps) else None,
            "umid": umids[idx] if idx < len(umids) else None,
            "press": press[idx] if idx < len(press) else None,
            "wind": winds[idx] if idx < len(winds) else None,
            "gust": gusts[idx] if idx < len(gusts) else None,
            "dir": dirs[idx] if idx < len(dirs) else None,
            "code": codes[idx] if idx < len(codes) else None,
        }
    return slot_map


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
        if "isolada" in dl or "possibilidade" in dl:
            return 1
        return 2
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


def compute_daily_rain_consensus(
    day_idx,
    day_date_iso,
    dt_br_format,
    om_slots,
    om_daily_rain_mm,
    om_daily_prob,
    mm_slots,
    cptec_hoje,
    cptec_item_next,
    inmet_dia,
    day_alerts,
    inea_prev_dia,
    obs_today_info,
):
    """
    Calcula o volume diário consensual (mm), probabilidade máxima e a distribuição
    exata entre os 4 turnos a partir de todas as fontes oficiais disponíveis.
    """
    # 1. Open-Meteo por turno e dia
    om_turn_sums = {}
    om_turn_probs = {}
    for t_name, h_s, h_e, _sig in TURNOS_ORDER:
        hrs = [om_slots.get((day_date_iso, h)) for h in range(h_s, h_e)]
        valid = [x for x in hrs if x is not None]
        om_turn_sums[t_name] = sum(x["prec"] for x in valid)
        om_turn_probs[t_name] = max((x["prob"] for x in valid), default=0.0)
    om_sum = round(sum(om_turn_sums.values()), 2) if om_turn_sums else round(float(om_daily_rain_mm or 0.0), 2)

    # 2. CPTEC Multimodel (BRT alinhado)
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
        raw_mm_sum = sum(mm_all_precs)
        if mm_hours_count < 24:
            raw_mm_sum = raw_mm_sum * (24.0 / mm_hours_count)
        mm_sum = round(raw_mm_sum, 2)
        mm_prob_day = round(max(mm_all_probs)) if mm_all_probs else 0

    # 3. CPTEC Municipal (Hoje validado por hora_atual == day_date_iso; Próximos dias por probabilidade)
    cptec_prob = None
    cptec_mun_mm = None
    cptec_hoje_valido = False
    if day_idx == 0 and cptec_hoje:
        hora_atual = str(cptec_hoje.get("hora_atual", ""))
        if hora_atual[:10] == day_date_iso:
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

    # 4. INMET Previsão (Turnos em D+0/D+1 e resumo diário em D+2..D+4)
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
            # Se é previsão geral de dia inteiro para D+2..D+4, concentra peso convectivo em Tarde/Noite
            inmet_turn_levels[t_name] = day_lvl if t_name in ("Tarde", "Noite") or day_lvl <= 1 else max(1, day_lvl - 1)

    inmet_day_level = max(inmet_turn_levels.values(), default=0)
    inmet_resumo_dia = " / ".join(
        dict.fromkeys([d for d in inmet_turn_descs.values() if d])
    ) or None

    # 5. INEA Alerta de Cheias RH-VIII / Rio das Ostras (extração real do PDF)
    inea_valid = bool(inea_prev_dia and inea_prev_dia.get("extraido_pdf") and inea_prev_dia.get("data") == dt_br_format)
    inea_ro_min = inea_prev_dia.get("chuva_min_mm") if inea_valid else None
    inea_ro_max = inea_prev_dia.get("chuva_max_mm") if inea_valid else None
    inea_bacia_max = inea_prev_dia.get("chuva_bacia_max_mm") if inea_valid else None
    inea_cond = (inea_prev_dia.get("condicao") or "") if inea_valid else ""
    inea_raios = bool(inea_prev_dia.get("tem_raios_icone") or "raios" in inea_cond.lower()) if inea_valid else False

    # 6. Síntese Numérica Contínua (Open-Meteo + CPTEC Multimodel + CPTEC Municipal)
    if has_mm_day and mm_sum is not None:
        nwp_base = 0.55 * om_sum + 0.45 * mm_sum
    else:
        nwp_base = om_sum

    if cptec_hoje_valido and cptec_mun_mm is not None and cptec_mun_mm > 0:
        nwp_base = 0.75 * nwp_base + 0.25 * cptec_mun_mm

    if (
        cptec_prob is not None
        and cptec_prob <= 10
        and inmet_day_level == 0
        and not (inea_valid and inea_ro_max is not None and inea_ro_max > 1.0)
        and not day_alerts
    ):
        nwp_base = min(nwp_base, 1.0)

    # 7. Ancoragem do INEA RH-VIII / Rio das Ostras (suave e simétrica para Hoje e Amanhã)
    consensus_mm = nwp_base
    if inea_valid and inea_ro_min is not None and inea_ro_max is not None:
        if inea_ro_min == 0 and inea_ro_max <= 1.0 and inea_bacia_max is not None and inea_bacia_max >= 10.0:
            # Orla seca (0-1 mm) mas cabeceira/bacia com chuva (1-10 mm)
            inea_target = 0.75
            w_inea = 0.25
        elif inea_ro_max <= 10.0:
            inea_target = inea_ro_min + 0.25 * (inea_ro_max - inea_ro_min)
            w_inea = 0.20
        else:
            # Faixa significativa (10-25, 25-50, 50+ mm)
            inea_target = inea_ro_min + 0.35 * (inea_ro_max - inea_ro_min)
            w_inea = 0.35

        consensus_mm = (1.0 - w_inea) * nwp_base + w_inea * inea_target
        if inea_ro_min >= 10.0:
            consensus_mm = max(consensus_mm, 0.65 * inea_ro_min)

    # 8. Consistência com previsão qualitativa do INMET (e raios no boletim INEA)
    if inmet_day_level >= 3:
        consensus_mm = max(consensus_mm, 2.2)
    elif inmet_day_level == 2:
        consensus_mm = max(consensus_mm, 1.5)
    elif inmet_day_level == 1:
        consensus_mm = max(consensus_mm, 0.6)

    if inea_raios and consensus_mm < 2.0:
        consensus_mm = max(consensus_mm, 2.0)

    # 9. Alertas Meteorológicos Oficiais INMET ativos para 3304524 (Rio das Ostras)
    if day_alerts:
        sev = day_alerts[0].get("cor_nome", "Amarelo")
        alert_floor = 30.0 if sev == "Vermelho" else (15.0 if sev == "Laranja" else 5.0)
        consensus_mm = max(consensus_mm, alert_floor)

    # 10. Garantia mínima com o acumulado já medido hoje pelos pluviômetros (apenas D+0)
    if day_idx == 0 and obs_today_info.get("media_mm", 0.0) > 0:
        consensus_mm = max(consensus_mm, float(obs_today_info["media_mm"]))

    consensus_day_mm = round(max(0.0, consensus_mm), 1)

    # 11. Probabilidade Diária Consensual
    prob_candidates = [float(om_daily_prob or max(om_turn_probs.values(), default=0.0))]
    if mm_prob_day is not None:
        prob_candidates.append(float(mm_prob_day))
    if cptec_prob is not None:
        prob_candidates.append(float(cptec_prob))
    prob_day = round(sum(prob_candidates) / len(prob_candidates))
    if inmet_day_level >= 3:
        prob_day = max(prob_day, 65)
    elif inmet_day_level == 2:
        prob_day = max(prob_day, 50)
    if day_alerts:
        prob_day = max(prob_day, 80)

    # 12. Distribui consensus_day_mm pelos 4 turnos proporcionalmente aos perfis físicos
    turn_weights = {}
    turn_probs = {}
    for t_name, _hs, _he, _sig in TURNOS_ORDER:
        om_t = om_turn_sums.get(t_name, 0.0)
        mm_t = mm_turn_sums.get(t_name, 0.0) if has_mm_day else om_t
        nwp_t = 0.55 * om_t + 0.45 * mm_t if has_mm_day else om_t

        inm_lvl = inmet_turn_levels.get(t_name, 0)
        conv_cue = 0.0
        if inm_lvl >= 3:
            conv_cue = 1.1 if t_name in ("Tarde", "Noite") else 0.4
        elif inm_lvl == 2:
            conv_cue = 0.7 if t_name in ("Tarde", "Noite") else 0.35
        elif inm_lvl == 1:
            conv_cue = 0.25

        if day_alerts and t_name == "Tarde":
            conv_cue += 1.6
        elif day_alerts and t_name == "Noite":
            conv_cue += 1.0

        om_pb = om_turn_probs.get(t_name, 0.0)
        mm_pb = mm_turn_probs.get(t_name, 0.0) if has_mm_day else om_pb
        pb_t = round((om_pb + mm_pb) / 2.0) if has_mm_day else round(om_pb)
        if inm_lvl >= 3:
            pb_t = max(pb_t, 65)
        elif inm_lvl == 2:
            pb_t = max(pb_t, 50)
        elif inm_lvl == 1:
            pb_t = max(pb_t, 35)
        if day_alerts and t_name in ("Tarde", "Noite"):
            pb_t = max(pb_t, 80 if t_name == "Tarde" else 70)

        turn_probs[t_name] = min(100, int(pb_t))
        # Peso de distribuição garante soma estrita ao dia inteiro sem concentrar tudo num turno vazio
        prob_weight = (pb_t / 100.0) * 0.15
        turn_weights[t_name] = max(0.0, nwp_t + conv_cue * 0.45 + prob_weight)

    turn_rain = {t_name: 0.0 for t_name, _, _, _ in TURNOS_ORDER}
    if consensus_day_mm > 0.0:
        w_sum = sum(turn_weights.values())
        if w_sum <= 0.0:
            turn_weights = {"Madrugada": 0.10, "Manhã": 0.20, "Tarde": 0.40, "Noite": 0.30}
            w_sum = 1.0
        raw_alloc = {k: round(consensus_day_mm * (w / w_sum), 1) for k, w in turn_weights.items()}
        diff = round(consensus_day_mm - sum(raw_alloc.values()), 1)
        if abs(diff) > 0:
            heaviest = max(turn_weights, key=turn_weights.get)
            raw_alloc[heaviest] = round(max(0.0, raw_alloc[heaviest] + diff), 1)
        turn_rain = raw_alloc

    return {
        "consensus_day_mm": consensus_day_mm,
        "consensus_prob_day": min(100, int(prob_day)),
        "turn_rain_mm": turn_rain,
        "turn_probs": turn_probs,
        "inmet_turn_descs": inmet_turn_descs,
        "fontes_dia": {
            "open_meteo_mm": round(om_sum, 1),
            "open_meteo_prob_pct": int(round(float(om_daily_prob or 0.0))),
            "cptec_multimodel_mm": round(mm_sum, 1) if mm_sum is not None else None,
            "cptec_multimodel_horas": mm_hours_count,
            "cptec_municipal_mm": cptec_mun_mm if cptec_hoje_valido else None,
            "cptec_municipal_prob_pct": int(round(cptec_prob)) if cptec_prob is not None else None,
            "cptec_municipal_valido_hoje": cptec_hoje_valido if day_idx == 0 else None,
            "inmet_resumo": inmet_resumo_dia,
            "inmet_aviso_id": day_alerts[0].get("id") if day_alerts else None,
            "inmet_aviso_cor": day_alerts[0].get("cor_nome") if day_alerts else None,
            "inea_faixa_municipio_mm": inea_prev_dia.get("faixa_municipio_mm") if inea_valid else None,
            "inea_faixa_bacia_mm": inea_prev_dia.get("faixa_chuva_mm") if inea_valid else None,
            "inea_referencia_mm": inea_prev_dia.get("chuva_referencia_mm") if inea_valid else None,
            "observado_hoje_media_mm": obs_today_info.get("media_mm") if day_idx == 0 else None,
            "observado_hoje_max_mm": obs_today_info.get("max_mm") if day_idx == 0 else None,
        },
    }
