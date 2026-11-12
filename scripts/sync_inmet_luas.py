import sys
import re
import json
import math
import urllib.request
from pathlib import Path
from datetime import datetime, timezone, timedelta

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

URL_INMET_LUAS = "https://portal.inmet.gov.br/paginas/luas"
BRT = timezone(timedelta(hours=-3))

MONTHS_MAP = {
    "jan": 1, "fev": 2, "mar": 3, "abr": 4, "mai": 5, "jun": 6,
    "jul": 7, "ago": 8, "set": 9, "out": 10, "nov": 11, "dez": 12
}

PHASE_COLUMNS = ["Nova", "Crescente", "Cheia", "Minguante"]
PHASE_NAMES = {
    "Nova": "Lua Nova",
    "Crescente": "Quarto Crescente",
    "Cheia": "Lua Cheia",
    "Minguante": "Quarto Minguante"
}
PHASE_EMOJIS = {
    "Nova": "🌑",
    "Crescente": "🌓",
    "Cheia": "🌕",
    "Minguante": "🌗"
}


def fetch_and_parse_inmet_luas(out_path="data/fases_lua_inmet.json"):
    html = ""
    try:
        req = urllib.request.Request(
            URL_INMET_LUAS,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"[AVISO] Falha ao consultar {URL_INMET_LUAS}: {e}")
        # Try local fallback if available
        for p in ["scratch_inmet_luas.html", "../scratch_inmet_luas.html"]:
            if Path(p).exists():
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        html = f.read()
                        break
                except Exception:
                    pass

    tbl_match = re.search(r"<table[^>]*>(.*?)</table>", html, re.DOTALL | re.IGNORECASE)
    if not tbl_match:
        print("[ERRO] Tabela de luas não encontrada na página do INMET.")
        return None

    tbl = tbl_match.group(1)
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", tbl, re.DOTALL | re.IGNORECASE)
    if not rows:
        return None

    events = []
    for r in rows[1:]:
        cols = [
            re.sub(r"<[^>]+>", "", c).strip()
            for c in re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", r, re.DOTALL | re.IGNORECASE)
        ]
        if len(cols) < 4:
            continue
        for col_idx, text in enumerate(cols[:4]):
            if not text or text == "--":
                continue
            m = re.match(r"(\d{2})\s+([A-Za-z]{3})\s+(\d{4})\s*-\s*(\d{2}):(\d{2})", text)
            if m:
                dd, mes_str, yyyy, hh, mm = m.groups()
                mes_num = MONTHS_MAP.get(mes_str.lower(), 1)
                iso_str = f"{yyyy}-{mes_num:02d}-{int(dd):02d}T{hh}:{mm}:00-03:00"
                p_key = PHASE_COLUMNS[col_idx]
                events.append({
                    "fase_chave": p_key,
                    "fase_nome": PHASE_NAMES.get(p_key, p_key),
                    "emoji": PHASE_EMOJIS.get(p_key, "🌓"),
                    "data_br": f"{dd}/{mes_num:02d}/{yyyy}",
                    "hora": f"{hh}:{mm}",
                    "timestamp_iso": iso_str,
                    "ano": int(yyyy),
                    "mes": mes_num,
                    "dia": int(dd),
                    "texto_original": text
                })

    events.sort(key=lambda x: x["timestamp_iso"])

    payload = {
        "fonte": "Instituto Nacional de Meteorologia (INMET) / IAG-USP",
        "url": URL_INMET_LUAS,
        "ano": 2026,
        "fuso": "UTC-3 (Horário de Brasília)",
        "total_eventos": len(events),
        "fases_astronomicas": events,
        "atualizado_em": datetime.now(BRT).strftime("%d/%m/%Y %H:%M:%S")
    }

    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f">> [SUCESSO] Fases da Lua INMET sincronizadas: {len(events)} eventos salvos em {out_path}")
    return payload


def calculate_inmet_moon_phase(dt=None, json_path="data/fases_lua_inmet.json"):
    """
    Calcula a fase da lua exata e iluminação com base no calendário astronômico oficial do INMET.
    """
    if dt is None:
        dt = datetime.now(BRT)
    elif dt.tzinfo is None:
        dt = dt.replace(tzinfo=BRT)

    events = None
    if Path(json_path).exists():
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                d = json.load(f)
                events = d.get("fases_astronomicas", [])
        except Exception:
            pass

    if not events:
        # Tenta sincronizar
        res = fetch_and_parse_inmet_luas(json_path)
        if res:
            events = res.get("fases_astronomicas", [])

    if not events:
        return {
            "name": "Crescente",
            "emoji": "🌒",
            "illumination": 14,
            "desc": "Ilum. ~14% • Céu Noturno",
            "val_text": "🌒 Crescente",
            "sub_text": "Ilum. ~14% • Noite"
        }

    # Converter timestamps em datetimes
    parsed_events = []
    for e in events:
        try:
            e_dt = datetime.fromisoformat(e["timestamp_iso"])
            parsed_events.append((e_dt, e))
        except Exception:
            continue

    parsed_events.sort(key=lambda x: x[0])

    # Encontrar evento anterior e seguinte
    prev_dt, prev_ev = None, None
    next_dt, next_ev = None, None

    for e_dt, ev in parsed_events:
        if e_dt <= dt:
            prev_dt, prev_ev = e_dt, ev
        elif e_dt > dt and next_ev is None:
            next_dt, next_ev = e_dt, ev
            break

    # Se estiver exatamente no mesmo dia do evento principal (janela de 12 horas)
    if prev_dt and abs((dt - prev_dt).total_seconds()) < 12 * 3600:
        is_exact = True
        name = prev_ev["fase_nome"]
        emoji = prev_ev["emoji"]
        illum = 0 if prev_ev["fase_chave"] == "Nova" else (100 if prev_ev["fase_chave"] == "Cheia" else 50)
        sub_text = f"Hoje às {prev_ev['hora']} • Ilum. {illum}%"
        return {
            "name": name,
            "emoji": emoji,
            "illumination": illum,
            "val_text": f"{emoji} {name}",
            "sub_text": sub_text,
            "prev_event": prev_ev,
            "next_event": next_ev,
            "fonte": "INMET / IAG-USP"
        }

    if not prev_ev or not next_ev:
        # Fallback se fora do intervalo de datas
        return {
            "name": "Crescente",
            "emoji": "🌒",
            "illumination": 14,
            "val_text": "🌒 Crescente",
            "sub_text": "Ilum. ~14% • Noite",
            "fonte": "INMET / IAG-USP"
        }

    total_sec = (next_dt - prev_dt).total_seconds()
    elapsed_sec = (dt - prev_dt).total_seconds()
    f = max(0.0, min(1.0, elapsed_sec / total_sec))

    quadrant_map = {
        ("Nova", "Crescente"): ("Crescente", "🌒", 0.0, math.pi / 2),
        ("Crescente", "Cheia"): ("Crescente Gibosa", "🌔", math.pi / 2, math.pi),
        ("Cheia", "Minguante"): ("Minguante Gibosa", "🌖", math.pi, 3 * math.pi / 2),
        ("Minguante", "Nova"): ("Minguante", "🌘", 3 * math.pi / 2, 2 * math.pi),
    }

    key = (prev_ev["fase_chave"], next_ev["fase_chave"])
    quad_info = quadrant_map.get(key, ("Crescente", "🌒", 0.0, math.pi / 2))
    name, emoji, th0, th1 = quad_info
    theta = th0 + f * (th1 - th0)
    illumination = round((1 - math.cos(theta)) / 2 * 100)

    # Formatar rótulo e subtítulo
    next_day_month = f"{next_ev['dia']:02d}/{next_ev['mes']:02d}"
    val_text = f"{emoji} {name}"
    sub_text = f"Ilum. {illumination}% • Próx: {next_ev['fase_nome'].replace('Lua ', '')} ({next_day_month})"

    return {
        "name": name,
        "emoji": emoji,
        "illumination": illumination,
        "val_text": val_text,
        "sub_text": sub_text,
        "prev_event": prev_ev,
        "next_event": next_ev,
        "fonte": "INMET / IAG-USP"
    }


if __name__ == "__main__":
    fetch_and_parse_inmet_luas()
    res = calculate_inmet_moon_phase()
    print(">> [TESTE CÁLCULO INMET]:", json.dumps(res, indent=2, ensure_ascii=False))
