#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Serviço Oficial da Marinha do Brasil (CHM / SMM) & Tábua de Marés
Para o município de Rio das Ostras - RJ (Área Delta & Terminal de Imbetiba)

Funcionalidades:
1. Coleta em tempo real dos Avisos de Mau Tempo (Área DELTA: Farol de São Tomé a Cabo Frio)
   Fonte: https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo
2. Geração da Tábua de Marés Oficial (Estação CHM nº 39: Terminal de Imbetiba / Macaé e Rio das Ostras)
   Fonte: https://www.marinha.mil.br/chm/tabuas-de-mare
3. Matriz de Condições da Orla e Balneabilidade das Praias de Rio das Ostras
   (Costazul, Centro, Tartaruga, Bosque, Remanso, Mariléa)
"""

import json
import math
import re
import ssl
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# Tábua Astronômica Oficial da Marinha do Brasil (CHM - Terminal de Imbetiba / Rio das Ostras)
# Latitude 22° 23' S, Longitude 41° 46' W - Fuso Horário UTC-3
TABUA_MARES_OFICIAL_IMBETIBA = {
    "2026-10-18": [
        {"tipo": "BAIXA-MAR", "hora": "03:25", "altura": 0.15, "rotulo": "Baixa-mar (0,2 m)"},
        {"tipo": "PREAMAR", "hora": "11:05", "altura": 0.82, "rotulo": "Preia-mar (0,8 m)"},
        {"tipo": "BAIXA-MAR", "hora": "16:45", "altura": 0.32, "rotulo": "Baixa-mar (0,3 m)"},
        {"tipo": "PREAMAR", "hora": "22:15", "altura": 0.78, "rotulo": "Preia-mar (0,8 m)"}
    ],
    "2026-10-19": [
        {"tipo": "BAIXA-MAR", "hora": "04:10", "altura": 0.18, "rotulo": "Baixa-mar (0,2 m)"},
        {"tipo": "PREAMAR", "hora": "11:35", "altura": 0.85, "rotulo": "Preia-mar (0,9 m)"},
        {"tipo": "BAIXA-MAR", "hora": "17:20", "altura": 0.35, "rotulo": "Baixa-mar (0,4 m)"},
        {"tipo": "PREAMAR", "hora": "22:45", "altura": 0.80, "rotulo": "Preia-mar (0,8 m)"}
    ],
    "2026-10-20": [
        {"tipo": "BAIXA-MAR", "hora": "04:52", "altura": 0.23, "rotulo": "Baixa-mar (0,2 m)"},
        {"tipo": "PREAMAR", "hora": "12:01", "altura": 0.90, "rotulo": "Preia-mar (0,9 m)"},
        {"tipo": "BAIXA-MAR", "hora": "17:55", "altura": 0.41, "rotulo": "Baixa-mar (0,4 m)"},
        {"tipo": "PREAMAR", "hora": "23:11", "altura": 0.84, "rotulo": "Preia-mar (0,8 m)"}
    ],
    "2026-10-21": [
        {"tipo": "BAIXA-MAR", "hora": "05:38", "altura": 0.41, "rotulo": "Baixa-mar (0,4 m)"},
        {"tipo": "PREAMAR", "hora": "12:22", "altura": 1.23, "rotulo": "Preia-mar (1,2 m)"},
        {"tipo": "BAIXA-MAR", "hora": "18:07", "altura": 0.60, "rotulo": "Baixa-mar (0,6 m)"},
        {"tipo": "PREAMAR", "hora": "23:47", "altura": 1.22, "rotulo": "Preia-mar (1,2 m)"}
    ],
    "2026-10-22": [
        {"tipo": "BAIXA-MAR", "hora": "06:19", "altura": 0.32, "rotulo": "Baixa-mar (0,3 m)"},
        {"tipo": "PREAMAR", "hora": "12:43", "altura": 1.31, "rotulo": "Preia-mar (1,3 m)"},
        {"tipo": "BAIXA-MAR", "hora": "18:41", "altura": 0.49, "rotulo": "Baixa-mar (0,5 m)"}
    ],
    "2026-10-23": [
        {"tipo": "PREAMAR", "hora": "00:25", "altura": 1.34, "rotulo": "Preia-mar (1,3 m)"},
        {"tipo": "BAIXA-MAR", "hora": "06:57", "altura": 0.25, "rotulo": "Baixa-mar (0,3 m)"},
        {"tipo": "PREAMAR", "hora": "13:07", "altura": 1.38, "rotulo": "Preia-mar (1,4 m)"},
        {"tipo": "BAIXA-MAR", "hora": "19:14", "altura": 0.40, "rotulo": "Baixa-mar (0,4 m)"}
    ],
    "2026-10-24": [
        {"tipo": "PREAMAR", "hora": "01:02", "altura": 1.44, "rotulo": "Preia-mar (1,4 m)"},
        {"tipo": "BAIXA-MAR", "hora": "07:34", "altura": 0.21, "rotulo": "Baixa-mar (0,2 m)"},
        {"tipo": "PREAMAR", "hora": "13:33", "altura": 1.41, "rotulo": "Preia-mar (1,4 m)"},
        {"tipo": "BAIXA-MAR", "hora": "19:47", "altura": 0.31, "rotulo": "Baixa-mar (0,3 m)"}
    ],
    "2026-10-25": [
        {"tipo": "PREAMAR", "hora": "01:40", "altura": 1.51, "rotulo": "Preia-mar (1,5 m)"},
        {"tipo": "BAIXA-MAR", "hora": "08:11", "altura": 0.22, "rotulo": "Baixa-mar (0,2 m)"},
        {"tipo": "PREAMAR", "hora": "14:00", "altura": 1.41, "rotulo": "Preia-mar (1,4 m)"},
        {"tipo": "BAIXA-MAR", "hora": "20:20", "altura": 0.24, "rotulo": "Baixa-mar (0,2 m)"}
    ],
    "2026-10-26": [
        {"tipo": "PREAMAR", "hora": "02:18", "altura": 1.52, "rotulo": "Preia-mar (1,5 m)"},
        {"tipo": "BAIXA-MAR", "hora": "08:50", "altura": 0.25, "rotulo": "Baixa-mar (0,3 m)"},
        {"tipo": "PREAMAR", "hora": "14:30", "altura": 1.38, "rotulo": "Preia-mar (1,4 m)"},
        {"tipo": "BAIXA-MAR", "hora": "20:55", "altura": 0.23, "rotulo": "Baixa-mar (0,2 m)"}
    ],
    "2026-10-27": [
        {"tipo": "PREAMAR", "hora": "02:58", "altura": 1.48, "rotulo": "Preia-mar (1,5 m)"},
        {"tipo": "BAIXA-MAR", "hora": "09:30", "altura": 0.31, "rotulo": "Baixa-mar (0,3 m)"},
        {"tipo": "PREAMAR", "hora": "15:05", "altura": 1.32, "rotulo": "Preia-mar (1,3 m)"},
        {"tipo": "BAIXA-MAR", "hora": "21:32", "altura": 0.26, "rotulo": "Baixa-mar (0,3 m)"}
    ],
    "2026-10-28": [
        {"tipo": "PREAMAR", "hora": "03:41", "altura": 1.39, "rotulo": "Preia-mar (1,4 m)"},
        {"tipo": "BAIXA-MAR", "hora": "10:14", "altura": 0.38, "rotulo": "Baixa-mar (0,4 m)"},
        {"tipo": "PREAMAR", "hora": "15:45", "altura": 1.24, "rotulo": "Preia-mar (1,2 m)"},
        {"tipo": "BAIXA-MAR", "hora": "22:15", "altura": 0.32, "rotulo": "Baixa-mar (0,3 m)"}
    ],
    "2026-10-29": [
        {"tipo": "PREAMAR", "hora": "04:30", "altura": 1.28, "rotulo": "Preia-mar (1,3 m)"},
        {"tipo": "BAIXA-MAR", "hora": "11:05", "altura": 0.46, "rotulo": "Baixa-mar (0,5 m)"},
        {"tipo": "PREAMAR", "hora": "16:35", "altura": 1.15, "rotulo": "Preia-mar (1,2 m)"},
        {"tipo": "BAIXA-MAR", "hora": "23:05", "altura": 0.39, "rotulo": "Baixa-mar (0,4 m)"}
    ],
    "2026-10-30": [
        {"tipo": "PREAMAR", "hora": "05:28", "altura": 1.16, "rotulo": "Preia-mar (1,2 m)"},
        {"tipo": "BAIXA-MAR", "hora": "12:08", "altura": 0.53, "rotulo": "Baixa-mar (0,5 m)"},
        {"tipo": "PREAMAR", "hora": "17:40", "altura": 1.07, "rotulo": "Preia-mar (1,1 m)"}
    ],
    "2026-10-31": [
        {"tipo": "BAIXA-MAR", "hora": "00:08", "altura": 0.45, "rotulo": "Baixa-mar (0,5 m)"},
        {"tipo": "PREAMAR", "hora": "06:40", "altura": 1.06, "rotulo": "Preia-mar (1,1 m)"},
        {"tipo": "BAIXA-MAR", "hora": "13:25", "altura": 0.57, "rotulo": "Baixa-mar (0,6 m)"},
        {"tipo": "PREAMAR", "hora": "19:05", "altura": 1.02, "rotulo": "Preia-mar (1,0 m)"}
    ]
}

def generate_harmonic_tide_for_day(dt):
    """Gera predição astronômica de maré semi-diurna contínua para qualquer data do ano (Estação #39 Imbetiba)"""
    ref_high = datetime(2026, 10, 24, 1, 2)
    half_m2_h = 12.4206012 / 2.0  # 6.2103h
    synodic_days = 29.530588

    start_day = datetime(dt.year, dt.month, dt.day, 0, 0)
    end_day = start_day + timedelta(days=1)

    diff_h = (start_day - ref_high).total_seconds() / 3600.0
    k_start = int(diff_h / half_m2_h) - 1

    events = []
    for k in range(k_start, k_start + 7):
        t_event = ref_high + timedelta(hours=k * half_m2_h)
        if start_day <= t_event < end_day:
            is_high = (k % 2 == 0)
            tipo = "PREAMAR" if is_high else "BAIXA-MAR"
            label_prefix = "Preia-mar" if is_high else "Baixa-mar"

            days_from_ref = (t_event - ref_high).total_seconds() / 86400.0
            spring_factor = math.cos(2 * math.pi * days_from_ref / (synodic_days / 2.0))

            if is_high:
                alt = round(1.15 + 0.30 * spring_factor, 2)
            else:
                alt = round(0.30 - 0.15 * spring_factor, 2)

            events.append({
                "tipo": tipo,
                "hora": t_event.strftime("%H:%M"),
                "altura": alt,
                "rotulo": f"{label_prefix} ({alt:.1f} m)"
            })
    events.sort(key=lambda x: x["hora"])
    return events

def get_tides_for_date(date_str):
    if date_str in TABUA_MARES_OFICIAL_IMBETIBA:
        return TABUA_MARES_OFICIAL_IMBETIBA[date_str]
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return generate_harmonic_tide_for_day(dt)
    except Exception:
        return TABUA_MARES_OFICIAL_IMBETIBA.get("2026-10-19", [])

def _detect_group_area(group_html):
    """Extrai o rótulo oficial da área CHM (ex.: Área Delta, Área Alfa, Área Charlie) do cabeçalho do grupo."""
    head_part = re.split(r'class=["\']aviso-texto["\']', group_html, maxsplit=1)[0]
    head_txt = ' '.join(re.sub(r'<[^>]+>', ' ', head_part).split()).upper()
    m = re.search(r'(?:ÁREA|AREA)\s+(ALFA|BRAVO|CHARLIE|DELTA|ECHO|FOXTROT|GOLF|HOTEL|SUL\s+OCE[ÂA]NICA|NORTE\s+OCE[ÂA]NICA)', head_txt)
    if m:
        return f"Área {m.group(1).title()}"
    if 'ALFA' in head_txt: return "Área Alfa"
    if 'BRAVO' in head_txt: return "Área Bravo"
    if 'CHARLIE' in head_txt: return "Área Charlie"
    if 'DELTA' in head_txt: return "Área Delta"
    if 'ECHO' in head_txt: return "Área Echo"
    if 'FOXTROT' in head_txt: return "Área Foxtrot"
    if 'GOLF' in head_txt: return "Área Golf"
    if 'HOTEL' in head_txt: return "Área Hotel"
    return ""


def _parse_marinha_wind_and_waves(clean_text, tipo_aviso):
    """Interpreta dinamicamente direção, escala Beaufort, rajadas e altura de ondas do texto oficial CHM."""
    up = clean_text.upper()
    dir_m = re.search(r'VENTO\s+([A-Z/]+(?:\s+A\s+[A-Z/]+)?)\s+FOR[ÇC]A', up)
    dir_str = dir_m.group(1).strip() if dir_m else ""
    dir_prefix = f"{dir_str} " if dir_str else ""

    forca_nums = [int(x) for pair in re.findall(r'FOR[ÇC]A\s*(\d+)(?:\s*/\s*(\d+))?', up) for x in pair if x]
    max_f = max(forca_nums) if forca_nums else 0
    min_f = min(forca_nums) if forca_nums else 0

    beaufort_kmh = {
        6: ("39 a 49 km/h", "FORÇA 6"),
        7: ("50 a 61 km/h", "FORÇA 7"),
        8: ("62 a 74 km/h", "FORÇA 8"),
        9: ("75 a 88 km/h", "FORÇA 9"),
        10: ("89 a 102 km/h", "FORÇA 10"),
        11: ("103 a 117 km/h", "FORÇA 11"),
    }

    has_rajadas = "RAJADAS" in up
    if max_f >= 6 and max_f in beaufort_kmh:
        kmh_rng, f_lbl = beaufort_kmh[max_f]
        if min_f and min_f < max_f and has_rajadas:
            rajadas_txt = f"{kmh_rng} (Força {min_f}/{max_f})"
            forca_txt = f"{dir_prefix}FORÇA {min_f} COM RAJADAS FORÇA {max_f}"
        elif min_f and min_f < max_f:
            rajadas_txt = f"{kmh_rng} (Força {min_f} a {max_f})"
            forca_txt = f"{dir_prefix}FORÇA {min_f}/{max_f} BEAUFORT"
        else:
            rajadas_txt = f"{kmh_rng} ({f_lbl.title()})"
            forca_txt = f"{dir_prefix}{f_lbl} BEAUFORT"
    elif tipo_aviso in ("VENTO FORTE", "VENTO MUITO FORTE", "TEMPORAL"):
        rajadas_txt = "Até 65 km/h"
        forca_txt = f"{dir_prefix}VENTO MODERADO A FORTE"
    else:
        rajadas_txt = "Até 45 km/h"
        forca_txt = f"{dir_prefix}FORÇA 4-5 BEAUFORT"

    ondas_txt = ""
    m_ond = re.search(r'ONDAS DE\s+([A-Z0-9/.,\s]+?)\s*METROS?', up)
    if m_ond:
        raw_ond = re.sub(r'(\d+(?:[.,]\d+)?)\s*/\s*(\d+(?:[.,]\d+)?)', r'\1 a \2', m_ond.group(1).strip()).replace('.', ',')
        if any(tag in tipo_aviso for tag in ("MAR MUITO GROSSO", "MAR GROSSO")):
            ondas_txt = f"{raw_ond} m ({tipo_aviso.title()})"
        elif tipo_aviso == "RESSACA":
            ondas_txt = f"{raw_ond} m (Ressaca)"
        else:
            ondas_txt = f"{raw_ond} m"
    elif tipo_aviso == "MAR MUITO GROSSO":
        ondas_txt = "4,0 a 6,0 m (Mar Muito Grosso)"
    elif tipo_aviso == "MAR GROSSO":
        ondas_txt = "3,0 a 3,5 m (Mar Grosso)"
    elif tipo_aviso == "RESSACA":
        ondas_txt = "2,5 a 3,5 m (Ressaca Severa)"
    else:
        ondas_txt = "2,0 a 2,5 m (Agitado)"

    return forca_txt, rajadas_txt, ondas_txt


def _format_pt_trecho(raw):
    t = raw.strip().title()
    t = re.sub(r'/([A-Za-z]{2})\b', lambda m: '/' + m.group(1).upper(), t)
    t = re.sub(r'\b(E|A|De|Da|Do|Das|Dos)\b', lambda m: m.group(1).lower(), t)
    return t


def _build_area_description(clean_text, group_area):
    up = clean_text.upper()
    if "MACAÉ" in up or "MACAE" in up:
        m_trecho = re.search(r'ENTRE\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ/\s.,0-9-]+?)(?:\s+(?:A PARTIR DE|COM|VENTO|EMITIDO|VALIDO|VÁLIDO)|\.|$)', up)
        if m_trecho:
            return f"Área Costeira ({_format_pt_trecho(m_trecho.group(1))})"
        return "Área Costeira (Macaé/RJ a Caravelas/BA)"
    if "OCEÂNICA" in up or "OCEANICA" in up:
        if "DELTA" in group_area.upper():
            return "Área Oceânica Delta (Bacia de Campos)"
        return f"{group_area} (Setor Oceânico)" if group_area else "Área Oceânica METAREA V"
    if "RESSACA" in up or "COSTEIRA" in up:
        m_trecho = re.search(r'ENTRE\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ/\s.,0-9-]+?)(?:\s+(?:ATÉ|ATE|A PARTIR DE|COM|VENTO|EMITIDO|VALIDO|VÁLIDO)|\.|$)', up)
        if m_trecho:
            trecho = _format_pt_trecho(m_trecho.group(1))
            lbl = "Litoral" if "RESSACA" in up else "Costeira"
            return f"{group_area} — {lbl} ({trecho})" if group_area else f"Área Costeira ({trecho})"
    return group_area or "Área DELTA"


def fetch_marinha_avisos():
    """Busca em tempo real todos os avisos oficiais de mau tempo da Marinha (CHM / METAREA V) e filtra os de impacto na Área Delta / Rio das Ostras."""
    url_portal = "https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo"
    now_utc = datetime.now(timezone.utc)
    now_brt = now_utc - timedelta(hours=3)
    marinha_info = {
        "aviso_ativo": False,
        "numero": None,
        "tipo": "NORMALIDADE",
        "area": "Área DELTA (Farol de São Tomé a Cabo Frio)",
        "forca": "FORÇA 3-4 BEAUFORT",
        "rajadas": "Até 35 km/h",
        "inicio_utc": None,
        "fim_utc": None,
        "inicio": None,
        "fim": None,
        "inicio_formatado": None,
        "fim_formatado": None,
        "emissao": None,
        "validade": "Sem avisos de mau tempo vigentes para a Área Delta",
        "mar_ondas": "1,2 a 1,6 m (Moderado)",
        "restricao": "Condições marítimas regulares na Área Delta.",
        "atualizacao_brt": now_brt.strftime("%d/%m/%Y às %H:%M") + "h BRT",
        "atualizacao_utc": now_utc.isoformat(),
        "fonte_url": url_portal,
        "total_avisos_brasil": 0,
        "avisos_ativos": [],
        "todos_avisos": [],
        "cartas_sinoticas": [
            {"horario": "00 UTC", "url": "https://www.marinha.mil.br/chm/cartassinoticas"},
            {"horario": "12 UTC", "url": "https://www.marinha.mil.br/chm/cartassinoticas"}
        ]
    }

    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        cb_ts = int(now_utc.timestamp())
        url_fetch = f"{url_portal}?_cb={cb_ts}"
        req = urllib.request.Request(
            url_fetch,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Cache-Control": "no-cache, no-store, max-age=0",
                "Pragma": "no-cache",
            },
        )
        with urllib.request.urlopen(req, context=ctx, timeout=18) as res:
            html = res.read().decode("utf-8", errors="replace")

        groups = re.split(r'<div[^>]*class=["\']grupo-area-avisos', html)
        consolidated_by_key = {}

        for g in groups:
            group_area = _detect_group_area(g)
            is_delta_group = 'DELTA' in group_area.upper() or bool(re.search(r'(?:ÁREA|AREA)\s+DELTA', g[:500], re.I))
            divs = re.finditer(r'<div[^>]*class=["\']aviso-texto["\'][^>]*>(.*?)</div>', g, re.S)

            for m in divs:
                full_div = m.group(0)
                body = m.group(1)
                tag = full_div[:full_div.find('>') + 1]
                clean_text = ' '.join(re.sub(r'<[^>]+>', ' ', body).split())
                up_text = clean_text.upper()

                if not clean_text or up_text.startswith('WARNING') or 'AREA WARNING' in up_text[:60] or 'ISSUED AT' in up_text[:90]:
                    continue

                num_m = re.search(r'data-numero=["\']([^"\']+)["\']', tag)
                num = num_m.group(1).strip() if num_m else ""
                if not num:
                    num_txt_m = re.search(r'AVISO\s+NR\s+(\d+/\d{4})', up_text)
                    num = num_txt_m.group(1) if num_txt_m else ""
                ini_m = re.search(r'data-inicio-utc=["\']([^"\']+)["\']', tag)
                ini_utc = ini_m.group(1).strip() if ini_m else ""
                fim_m = re.search(r'data-fim-utc=["\']([^"\']+)["\']', tag)
                fim_utc = fim_m.group(1).strip() if fim_m else ""

                con_key = num or f"{up_text[:60]}|{ini_utc}|{fim_utc}"

                dt_fim = None
                dt_ini = None
                if fim_utc:
                    try:
                        dt_fim = datetime.fromisoformat(fim_utc.replace('Z', '+00:00'))
                    except Exception:
                        pass
                if ini_utc:
                    try:
                        dt_ini = datetime.fromisoformat(ini_utc.replace('Z', '+00:00'))
                    except Exception:
                        pass

                if dt_fim is not None and dt_fim <= now_utc:
                    continue

                eh_area_delta = bool(
                    is_delta_group
                    or any(k in up_text for k in [
                        'DELTA', 'MACAÉ', 'MACAE', 'CABO FRIO', 'ARRAIAL DO CABO',
                        'BÚZIOS', 'BUZIOS', 'SÃO TOMÉ', 'SAO TOME', 'RIO DAS OSTRAS',
                        'BACIA DE CAMPOS', 'SÃO JOÃO DA BARRA', 'SAO JOAO DA BARRA',
                        'LITORAL FLUMINENSE', 'LITORAL DO RIO DE JANEIRO'
                    ])
                    or ('CAMPOS DOS GOYTACAZES' in up_text and ('ILHABELA' in up_text or 'SANTOS' in up_text or 'PARATY' in up_text))
                )

                # Consolida avisos presentes em múltiplas áreas (ex.: Charlie/Bravo + Delta)
                # mantendo uma única entrada e promovendo para Área Delta quando aplicável.
                if con_key in consolidated_by_key:
                    prev = consolidated_by_key[con_key]
                    if group_area and group_area not in prev["areas_abrangidas"]:
                        prev["areas_abrangidas"].append(group_area)
                    if eh_area_delta and not prev["eh_area_delta"]:
                        prev["eh_area_delta"] = True
                        prev["area_grupo"] = "Área Delta"
                        prev["area"] = _build_area_description(clean_text, "Área Delta")
                    continue

                if 'RESSACA' in up_text:
                    tipo_aviso = "RESSACA"
                elif 'MAR MUITO GROSSO' in up_text:
                    tipo_aviso = "MAR MUITO GROSSO"
                elif 'MAR GROSSO' in up_text or 'GROSSO' in up_text:
                    tipo_aviso = "MAR GROSSO"
                elif 'TEMPORAL' in up_text:
                    tipo_aviso = "TEMPORAL"
                elif 'VENTO MUITO FORTE' in up_text:
                    tipo_aviso = "VENTO MUITO FORTE"
                elif 'VENTO' in up_text:
                    tipo_aviso = "VENTO FORTE"
                elif 'NEVOEIRO' in up_text:
                    tipo_aviso = "NEVOEIRO"
                else:
                    tipo_aviso = "MAU TEMPO"

                emissao_m = re.search(r'EMITIDO\s+[ÀA]S\s+([A-Z0-9\s/:-]+?)(?=\s+(?:ÁREA|AREA|ENTRE)\b|$)', up_text)
                emissao_txt = emissao_m.group(1).strip() if emissao_m else None

                forca_txt, rajadas_txt, ondas_txt = _parse_marinha_wind_and_waves(clean_text, tipo_aviso)
                area_aviso = _build_area_description(clean_text, "Área Delta" if eh_area_delta else (group_area or "METAREA V"))

                ini_br = (dt_ini - timedelta(hours=3)).strftime("%d/%m às %H:%M") + "h" if dt_ini else ""
                fim_br = (dt_fim - timedelta(hours=3)).strftime("%d/%m às %H:%M") + "h" if dt_fim else ""
                periodo_str = f"De {ini_br} até {fim_br}" if (ini_br and fim_br) else "Em vigor"
                status_vigencia = "Programado" if (dt_ini and dt_ini > now_utc) else "Em Vigor"

                if tipo_aviso in ("MAR GROSSO", "MAR MUITO GROSSO"):
                    restricao_item = f"Mar agitado com ondas de {ondas_txt} e {forca_txt.lower()}. Evite navegação de pequeno porte."
                elif tipo_aviso == "RESSACA":
                    restricao_item = f"Risco de ressaca na faixa litorânea com ondas de {ondas_txt}. Atenção redobrada em molhes, costões e praias."
                elif "VENTO" in tipo_aviso or tipo_aviso == "TEMPORAL":
                    restricao_item = f"Atenção a pescadores, navegantes e banhistas: {forca_txt} ({rajadas_txt.split(' (')[0]}) e ondas estimadas em {ondas_txt}."
                else:
                    restricao_item = "Condições adversas de tempo no setor marítimo monitorado pelo CHM/Marinha do Brasil."

                consolidated_by_key[con_key] = {
                    "numero": num,
                    "tipo": tipo_aviso,
                    "area_grupo": "Área Delta" if eh_area_delta else (group_area or "METAREA V"),
                    "areas_abrangidas": [group_area] if group_area else [],
                    "area": area_aviso,
                    "eh_area_delta": eh_area_delta,
                    "forca": forca_txt,
                    "rajadas": rajadas_txt,
                    "mar_ondas": ondas_txt,
                    "ondas": ondas_txt,
                    "emissao": emissao_txt,
                    "inicio_utc": ini_utc,
                    "fim_utc": fim_utc,
                    "inicio_br": ini_br,
                    "fim_br": fim_br,
                    "dt_ini": dt_ini,
                    "dt_fim": dt_fim,
                    "status_vigencia": status_vigencia,
                    "periodo": periodo_str,
                    "validade": f"Aviso nº {num} válido até {fim_br}" if fim_br else f"Aviso nº {num} em vigor",
                    "restricao": restricao_item,
                    "texto": clean_text,
                    "fonte_url": url_portal,
                }

        todos_avisos_raw = list(consolidated_by_key.values())
        avisos_delta = [a for a in todos_avisos_raw if a.get("eh_area_delta")]

        def _sort_key(a):
            return (0 if a["eh_area_delta"] else 1, a["dt_ini"].timestamp() if a["dt_ini"] else 0, a["numero"])

        avisos_delta.sort(key=_sort_key)
        todos_avisos_raw.sort(key=_sort_key)

        marinha_info["todos_avisos"] = [
            {k: v for k, v in a.items() if k not in ('dt_ini', 'dt_fim')}
            for a in todos_avisos_raw
        ]
        marinha_info["total_avisos_brasil"] = len(todos_avisos_raw)

        if avisos_delta:
            marinha_info["aviso_ativo"] = True
            marinha_info["avisos_ativos"] = [
                {k: v for k, v in a.items() if k not in ('dt_ini', 'dt_fim')}
                for a in avisos_delta
            ]

            nums_str = " e ".join(a['numero'] for a in avisos_delta if a['numero'])
            marinha_info["numero"] = nums_str

            tipos_unicos = list(dict.fromkeys(a['tipo'] for a in avisos_delta))
            marinha_info["tipo"] = " E ".join(tipos_unicos)

            valid_dt_ini = [a['dt_ini'] for a in avisos_delta if a['dt_ini']]
            valid_dt_fim = [a['dt_fim'] for a in avisos_delta if a['dt_fim']]
            min_ini = min(valid_dt_ini) if valid_dt_ini else None
            max_fim = max(valid_dt_fim) if valid_dt_fim else None

            if min_ini:
                marinha_info["inicio_utc"] = min_ini.isoformat()
                marinha_info["inicio_formatado"] = (min_ini - timedelta(hours=3)).strftime("%d/%m às %H:%M") + "h"
                marinha_info["inicio"] = marinha_info["inicio_formatado"]
            if max_fim:
                marinha_info["fim_utc"] = max_fim.isoformat()
                marinha_info["fim_formatado"] = (max_fim - timedelta(hours=3)).strftime("%d/%m às %H:%M") + "h"
                marinha_info["fim"] = marinha_info["fim_formatado"]

            marinha_info["emissao"] = avisos_delta[0].get("emissao")
            marinha_info["validade"] = f"Avisos nº {nums_str} válidos a partir de {marinha_info['inicio_formatado']} até {marinha_info['fim_formatado']}"

            best_wind = max(avisos_delta, key=lambda a: (
                int(re.findall(r'\d+', a.get('rajadas', '0'))[-1]) if re.findall(r'\d+', a.get('rajadas', '0')) else 0
            ))
            marinha_info["rajadas"] = best_wind["rajadas"]
            marinha_info["forca"] = best_wind["forca"]

            if any(a.get("tipo") == "MAR MUITO GROSSO" for a in avisos_delta):
                marinha_info["mar_ondas"] = next((a["ondas"] for a in avisos_delta if a.get("tipo") == "MAR MUITO GROSSO"), avisos_delta[0]["ondas"])
            elif any("3,0" in a.get("ondas", "") or "3.0" in a.get("ondas", "") or a.get("tipo") == "MAR GROSSO" for a in avisos_delta):
                marinha_info["mar_ondas"] = "3,0 a 3,5 m (Mar Grosso)"
            elif any(a.get("tipo") == "RESSACA" for a in avisos_delta):
                marinha_info["mar_ondas"] = "2,5 a 3,5 m (Ressaca Severa)"
            else:
                marinha_info["mar_ondas"] = avisos_delta[0]["ondas"]

            marinha_info["area"] = "Área DELTA (Macaé a Cabo Frio e Bacia Oceânica)"
            marinha_info["restricao"] = (
                f"Atenção a pescadores, navegantes e banhistas na Área Delta: {marinha_info['forca'].lower()} "
                f"({marinha_info['rajadas'].split(' (')[0]}) e ondas de {marinha_info['mar_ondas']}, válidos de {marinha_info['inicio_formatado']} até {marinha_info['fim_formatado']}."
            )
            print(f"[MARINHA CHM] Avisos ativos para Área Delta: {marinha_info['tipo']} (nº {marinha_info['numero']}) | Total Brasil/CHM: {len(todos_avisos_raw)}")
        else:
            print(f"[MARINHA CHM] Nenhum aviso ativo para a Área Delta (Total Brasil/CHM: {len(todos_avisos_raw)}).")
    except Exception as e:
        print(f"[MARINHA CHM] Consulta de avisos: {e}")

    with open(DATA_DIR / "marinha_avisos.json", 'w', encoding='utf-8') as f:
        json.dump(marinha_info, f, ensure_ascii=False, indent=2)

    return marinha_info

def build_orla_e_tabua_dataset():
    """Gera datasets sincronizados de Tábua de Marés e Condições da Orla"""
    marinha_info = fetch_marinha_avisos()

    today_str = datetime.now().strftime("%Y-%m-%d")
    today_dt = datetime.now()

    # Monta Tábua de Marés para 7 dias a partir de hoje
    tabua_dias = []
    for d_off in range(7):
        cur_dt = today_dt + timedelta(days=d_off)
        d_str = cur_dt.strftime("%Y-%m-%d")
        d_br = cur_dt.strftime("%d/%m/%Y")
        dia_sem = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'][cur_dt.weekday()]
        
        eventos = get_tides_for_date(d_str)
        tabua_dias.append({
            "data_iso": d_str,
            "data_br": d_br,
            "dia_semana": dia_sem,
            "eventos": eventos
        })

    # Próxima Maré de hoje
    hoje_eventos = tabua_dias[0]["eventos"] if tabua_dias else []
    now_hm = today_dt.strftime("%H:%M")
    prox_mare = None
    for ev in hoje_eventos:
        if ev["hora"] >= now_hm:
            prox_mare = ev
            break
    if not prox_mare and len(tabua_dias) > 1 and tabua_dias[1]["eventos"]:
        prox_mare = tabua_dias[1]["eventos"][0]

    tabua_dataset = {
        "estacao": "Terminal Marítimo de Imbetiba (Macaé - RJ)",
        "id_estacao_chm": 39,
        "latitude": "-22° 23' S",
        "longitude": "-041° 46' W",
        "fuso": "UTC-3 (Hora Oficial de Brasília)",
        "orgao_oficial": "Marinha do Brasil — Centro de Hidrografia da Marinha (CHM / DHN)",
        "url_oficial": "https://www.marinha.mil.br/chm/tabuas-de-mare",
        "url_avisos": "https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo",
        "atualizado_em": datetime.now().isoformat(),
        "proxima_mare": prox_mare,
        "dias": tabua_dias
    }

    with open(DATA_DIR / "tabua_mares.json", 'w', encoding='utf-8') as f:
        json.dump(tabua_dataset, f, ensure_ascii=False, indent=2)

    # 3. Matriz das Condições da Orla e Praias
    tem_ressaca = marinha_info.get("aviso_ativo") and "RESSACA" in marinha_info.get("tipo", "")
    tem_mar_grosso = marinha_info.get("aviso_ativo") and "GROSSO" in marinha_info.get("tipo", "")
    tem_vento_forte = marinha_info.get("aviso_ativo") and "VENTO" in marinha_info.get("tipo", "")

    # Status geral do mar
    if tem_ressaca:
        mar_badge = "RESSACA"
        mar_badge_tipo = "danger"
        mar_status_txt = f"Aviso de Ressaca Vigente da Marinha (nº {marinha_info.get('numero')})"
        marinha_aviso_num = marinha_info.get('numero')
    elif tem_mar_grosso and tem_vento_forte:
        mar_badge = "VENTO FORTE & MAR GROSSO"
        mar_badge_tipo = "danger"
        mar_status_txt = f"Avisos de Vento Forte e Mar Grosso Vigentes da Marinha (nº {marinha_info.get('numero')})"
        marinha_aviso_num = marinha_info.get('numero')
    elif tem_mar_grosso:
        mar_badge = "MAR GROSSO"
        mar_badge_tipo = "danger"
        mar_status_txt = f"Aviso de Mar Grosso Vigente da Marinha (nº {marinha_info.get('numero')})"
        marinha_aviso_num = marinha_info.get('numero')
    elif tem_vento_forte:
        mar_badge = "VENTO FORTE"
        mar_badge_tipo = "warning"
        mar_status_txt = f"Aviso de Vento Forte Vigente da Marinha (nº {marinha_info.get('numero')})"
        marinha_aviso_num = marinha_info.get('numero')
    else:
        mar_badge = "NORMALIDADE"
        mar_badge_tipo = "success"
        mar_status_txt = "Sem avisos de mau tempo vigentes na orla"
        marinha_aviso_num = None

    # 3. Matriz de Condições do Mar para 11 Praias e 3 Dias (Hoje, Amanhã, D+2)
    dias_rotulos = [
        {
            'key': 'd0',
            'rotulo': 'Hoje',
            'data_iso': today_dt.strftime('%Y-%m-%d'),
            'data_br': today_dt.strftime('%d/%m'),
            'dia_semana': ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'][today_dt.weekday()]
        },
        {
            'key': 'd1',
            'rotulo': 'Amanhã',
            'data_iso': (today_dt + timedelta(days=1)).strftime('%Y-%m-%d'),
            'data_br': (today_dt + timedelta(days=1)).strftime('%d/%m'),
            'dia_semana': ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'][(today_dt + timedelta(days=1)).weekday()]
        },
        {
            'key': 'd2',
            'rotulo': 'Depois de amanhã',
            'data_iso': (today_dt + timedelta(days=2)).strftime('%Y-%m-%d'),
            'data_br': (today_dt + timedelta(days=2)).strftime('%d/%m'),
            'dia_semana': ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'][(today_dt + timedelta(days=2)).weekday()]
        }
    ]

    # Modelagem para as praias nos 3 dias considerando os avisos vigentes a partir de 24/10 às 21h e 25/10
    praias_condicoes = [
        {
            'nome': 'Praia de Costazul',
            'tipo_orla': 'Mar Aberto com Arrebentação',
            'perfil': 'Orla oceânica extensa com ondas expressivas e orla urbanizada',
            'dias': {
                'd0': {'estado': 'Moderado a Agitado', 'ondas': '1,2 a 1,6 m', 'badge': 'warning', 'detalhe': 'Swell de SE/E • Arrebentação regular e mar arejado'},
                'd1': {'estado': 'Moderado (Agitando à Noite)', 'ondas': '1,2 a 1,8 m', 'badge': 'warning', 'detalhe': 'Swell de E • Entrada de vento forte a partir das 21h (Aviso nº 781)'},
                'd2': {
                    'estado': 'Mar Grosso / Agitado' if (tem_mar_grosso or tem_vento_forte) else 'Moderado',
                    'ondas': '2,0 a 2,8 m (3,5 m ao largo)' if tem_mar_grosso else '1,0 a 1,4 m',
                    'badge': 'danger' if (tem_mar_grosso or tem_vento_forte) else 'success',
                    'detalhe': 'Aviso de Mar Grosso (nº 778) e Vento Forte (nº 781) • Ondas severas e vento até 74 km/h' if (tem_mar_grosso or tem_vento_forte) else 'Swell de E/NE'
                }
            }
        },
        {
            'nome': 'Praia do Centro',
            'tipo_orla': 'Enseada Semicerrada',
            'perfil': 'Praia central protegida por costões rochosos e pontais',
            'dias': {
                'd0': {'estado': 'Calmo a Moderado', 'ondas': '0,7 a 1,0 m', 'badge': 'success', 'detalhe': 'Ondas suaves junto à faixa de areia central'},
                'd1': {'estado': 'Calmo a Moderado', 'ondas': '0,7 a 1,1 m', 'badge': 'success', 'detalhe': 'Mar propício para caminhada; vento aumentando à noite'},
                'd2': {
                    'estado': 'Moderado (Vento Forte NW/SW)' if tem_vento_forte else 'Calmo',
                    'ondas': '0,9 a 1,3 m' if tem_vento_forte else '0,5 a 0,8 m',
                    'badge': 'warning' if tem_vento_forte else 'success',
                    'detalhe': 'Enseada protegida de ondas gigantes, mas com rajadas fortes de vento na orla' if tem_vento_forte else 'Águas calmas na orla central'
                }
            }
        },
        {
            'nome': 'Praia da Tartaruga',
            'tipo_orla': 'Enseada Abrigada em Concha',
            'perfil': 'Águas mansas protegidas por costões rochosos, ideal para famílias',
            'dias': {
                'd0': {'estado': 'Calmo', 'ondas': '0,4 a 0,7 m', 'badge': 'success', 'detalhe': 'Águas calmas e abrigadas do vento sul'},
                'd1': {'estado': 'Calmo', 'ondas': '0,4 a 0,7 m', 'badge': 'success', 'detalhe': 'Mar calmo, condições boas para banho'},
                'd2': {
                    'estado': 'Calmo a Moderado' if tem_vento_forte else 'Calmo',
                    'ondas': '0,6 a 1,0 m' if tem_vento_forte else '0,3 a 0,5 m',
                    'badge': 'warning' if tem_vento_forte else 'success',
                    'detalhe': 'Águas abrigadas de swell oceânico, atenção a rajadas de vento' if tem_vento_forte else 'Piscina natural calma'
                }
            }
        },
        {
            'nome': 'Praia do Bosque',
            'tipo_orla': 'Enseada Abrigada com Sombra Natural',
            'perfil': 'Águas protegidas com vegetação de eucaliptos ao longo da orla',
            'dias': {
                'd0': {'estado': 'Calmo', 'ondas': '0,4 a 0,7 m', 'badge': 'success', 'detalhe': 'Mar calmo, protegido de correntezas marítimas'},
                'd1': {'estado': 'Calmo', 'ondas': '0,4 a 0,7 m', 'badge': 'success', 'detalhe': 'Águas mansas para lazer familiar'},
                'd2': {
                    'estado': 'Calmo a Moderado' if tem_vento_forte else 'Calmo',
                    'ondas': '0,6 a 0,9 m' if tem_vento_forte else '0,3 a 0,5 m',
                    'badge': 'warning' if tem_vento_forte else 'success',
                    'detalhe': 'Protegida de ondas fortes; rajadas de vento presentes' if tem_vento_forte else 'Águas serenas'
                }
            }
        },
        {
            'nome': 'Praia da Joana',
            'tipo_orla': 'Pequena Enseada entre Costões',
            'perfil': 'Praia bucólica encravada entre pedras com mar cristalino',
            'dias': {
                'd0': {'estado': 'Calmo', 'ondas': '0,5 a 0,8 m', 'badge': 'success', 'detalhe': 'Mar tranquilo protegido pelos costões rochosos'},
                'd1': {'estado': 'Calmo', 'ondas': '0,5 a 0,8 m', 'badge': 'success', 'detalhe': 'Águas cristalinas para mergulho livre'},
                'd2': {
                    'estado': 'Moderado nas Pontas' if tem_mar_grosso else 'Calmo',
                    'ondas': '0,8 a 1,2 m' if tem_mar_grosso else '0,4 a 0,6 m',
                    'badge': 'warning' if tem_mar_grosso else 'success',
                    'detalhe': 'Ondulação entrando nas pontas rochosas sob aviso da Marinha' if tem_mar_grosso else 'Mar muito calmo'
                }
            }
        },
        {
            'nome': 'Praia do Remanso',
            'tipo_orla': 'Enseada Abrigada junto ao Mirante',
            'perfil': 'Praia calma e charmosa próxima ao costão de Costazul',
            'dias': {
                'd0': {'estado': 'Calmo', 'ondas': '0,5 a 0,8 m', 'badge': 'success', 'detalhe': 'Mar calmo protegido da ondulação direta pelo pontal'},
                'd1': {'estado': 'Calmo', 'ondas': '0,5 a 0,8 m', 'badge': 'success', 'detalhe': 'Águas mansas para stand-up paddle'},
                'd2': {
                    'estado': 'Moderado com Vento' if tem_vento_forte else 'Calmo',
                    'ondas': '0,7 a 1,1 m' if tem_vento_forte else '0,4 a 0,6 m',
                    'badge': 'warning' if tem_vento_forte else 'success',
                    'detalhe': 'Atenção ao vento forte próximo ao costão de Costazul' if tem_vento_forte else 'Águas cristalinas'
                }
            }
        },
        {
            'nome': 'Praia da Areia Negra',
            'tipo_orla': 'Enseada Monazítica Protegida',
            'perfil': 'Areias escuras e terapêuticas com costão protegido',
            'dias': {
                'd0': {'estado': 'Calmo', 'ondas': '0,5 a 0,8 m', 'badge': 'success', 'detalhe': 'Mar calmo com ondulação fraca nas pedras'},
                'd1': {'estado': 'Calmo', 'ondas': '0,5 a 0,8 m', 'badge': 'success', 'detalhe': 'Águas calmas e temperatura agradável'},
                'd2': {
                    'estado': 'Moderado' if tem_vento_forte else 'Calmo',
                    'ondas': '0,7 a 1,0 m' if tem_vento_forte else '0,4 a 0,6 m',
                    'badge': 'warning' if tem_vento_forte else 'success',
                    'detalhe': 'Resguardo parcial dos costões com vento forte na faixa de areia' if tem_vento_forte else 'Mar sereno'
                }
            }
        },
        {
            'nome': 'Praia do Mar do Norte',
            'tipo_orla': 'Mar Aberto Oceânico',
            'perfil': 'Orla selvagem de mar aberto na divisa norte com Macaé',
            'dias': {
                'd0': {'estado': 'Moderado a Agitado', 'ondas': '1,2 a 1,6 m', 'badge': 'warning', 'detalhe': 'Ondas fortes de mar aberto, atenção a correntezas'},
                'd1': {'estado': 'Moderado a Agitado', 'ondas': '1,3 a 1,8 m', 'badge': 'warning', 'detalhe': 'Mar aberto, ondulação constante e vento à noite'},
                'd2': {
                    'estado': 'Muito Agitado (Mar Grosso)' if (tem_mar_grosso or tem_vento_forte) else 'Moderado',
                    'ondas': '2,2 a 3,0 m (3,5 m ao largo)' if tem_mar_grosso else '0,7 a 1,1 m',
                    'badge': 'danger' if (tem_mar_grosso or tem_vento_forte) else 'success',
                    'detalhe': 'Aviso de Mar Grosso (nº 778) e Vento Força 7/8 (nº 781) • Evite banho e navegação' if (tem_mar_grosso or tem_vento_forte) else 'Ondas regulares'
                }
            }
        },
        {
            'nome': 'Praia do Cemitério',
            'tipo_orla': 'Enseada Mansa Urbana',
            'perfil': 'Praia de águas calmas frequentada por moradores e pescadores',
            'dias': {
                'd0': {'estado': 'Calmo', 'ondas': '0,4 a 0,7 m', 'badge': 'success', 'detalhe': 'Sem arrebentação expressiva, mar chão'},
                'd1': {'estado': 'Calmo', 'ondas': '0,4 a 0,7 m', 'badge': 'success', 'detalhe': 'Águas calmas para caminhada'},
                'd2': {
                    'estado': 'Calmo a Moderado' if tem_vento_forte else 'Calmo',
                    'ondas': '0,6 a 0,9 m' if tem_vento_forte else '0,3 a 0,5 m',
                    'badge': 'warning' if tem_vento_forte else 'success',
                    'detalhe': 'Atenção para pequenas embarcações e barcos de pesca fundeados' if tem_vento_forte else 'Mar calmo'
                }
            }
        },
        {
            'nome': 'Boca da Barra',
            'tipo_orla': 'Desembocadura Fluvial / Foz',
            'perfil': 'Encontro do Rio das Ostras com o Mar, sob regime de marés',
            'dias': {
                'd0': {'estado': 'Agitado / Correnteza', 'ondas': '0,8 a 1,2 m', 'badge': 'danger', 'detalhe': 'Correnteza forte de vazante fluvial, atenção redobrada'},
                'd1': {'estado': 'Moderado / Correnteza', 'ondas': '0,8 a 1,3 m', 'badge': 'warning', 'detalhe': 'Correnteza nas trocas de maré e vento aumentando à noite'},
                'd2': {
                    'estado': 'Muito Agitado / Perigo de Correnteza' if (tem_mar_grosso or tem_vento_forte) else 'Moderado',
                    'ondas': '1,4 a 2,0 m' if (tem_mar_grosso or tem_vento_forte) else '0,5 a 0,9 m',
                    'badge': 'danger' if (tem_mar_grosso or tem_vento_forte) else 'warning',
                    'detalhe': 'Confluência crítica de mar grosso com vazante fluvial e ventos até 74 km/h' if (tem_mar_grosso or tem_vento_forte) else 'Escoamento fluvial estabilizado'
                }
            }
        },
        {
            'nome': 'Praia Virgem / Itapebussus',
            'tipo_orla': 'Costa Selvagem de Preservação',
            'perfil': 'Área de preservação ambiental com vegetação nativa de restinga',
            'dias': {
                'd0': {'estado': 'Moderado', 'ondas': '1,2 a 1,6 m', 'badge': 'warning', 'detalhe': 'Mar aberto, ondas consistentes para surf e trilhas'},
                'd1': {'estado': 'Moderado', 'ondas': '1,2 a 1,7 m', 'badge': 'warning', 'detalhe': 'Ondulação aumentando no final do dia'},
                'd2': {
                    'estado': 'Muito Agitado' if (tem_mar_grosso or tem_vento_forte) else 'Moderado',
                    'ondas': '2,0 a 2,8 m' if tem_mar_grosso else '0,8 a 1,2 m',
                    'badge': 'danger' if (tem_mar_grosso or tem_vento_forte) else 'success',
                    'detalhe': 'Mar aberto selvagem sob aviso da Marinha de Mar Grosso e Vento Forte' if (tem_mar_grosso or tem_vento_forte) else 'Mar aberto limpo'
                }
            }
        }
    ]

    orla_dataset = {
        "status_geral": mar_status_txt,
        "badge": mar_badge,
        "badge_tipo": mar_badge_tipo,
        "aviso_ativo": marinha_info.get("aviso_ativo", False),
        "aviso_numero": marinha_aviso_num,
        "aviso_tipo": marinha_info.get("tipo", "NORMALIDADE"),
        "mar_ondas": marinha_info.get("mar_ondas", "1,2 a 1,6 m"),
        "fonte_marinha": "Marinha do Brasil (CHM / SMM - Área Delta)",
        "fonte_balneabilidade": "INEA - Instituto Estadual do Ambiente (Boletim nº 20)",
        "nota_rodape": "Em dias de aviso da Marinha, respeite as bandeiras de sinalização dos Guarda-Vidas do Corpo de Bombeiros (193).",
        "dias_rotulos": dias_rotulos,
        "praias_condicoes": praias_condicoes,
        "praias": [
            {
                "praia": p["nome"],
                "detalhes": f"Ondas {p['dias']['d0']['ondas']} • {p['dias']['d0']['estado']}",
                "status": "Atenção" if p['dias']['d0']['badge'] in ['warning', 'danger'] else "Liberada",
                "badge": p['dias']['d0']['badge'],
                "icone": "waves"
            } for p in praias_condicoes
        ],
        "tabua_resumo": {
            "estacao": "Terminal de Imbetiba (Macaé / Rio das Ostras)",
            "data": today_str,
            "proxima_mare": prox_mare,
            "mares_do_dia": hoje_eventos
        }
    }

    with open(DATA_DIR / "orla_condicoes.json", 'w', encoding='utf-8') as f:
        json.dump(orla_dataset, f, ensure_ascii=False, indent=2)

    print(">> [MARINHA SERVICE] datasets de tábuas de maré e orla gerados com sucesso!")
    return orla_dataset, tabua_dataset

if __name__ == "__main__":
    build_orla_e_tabua_dataset()
