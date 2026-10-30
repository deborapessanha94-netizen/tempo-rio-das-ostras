#!/usr/bin/env python3
"""
Módulo Oficial Centralizado de Telemetria Fluvial — Rio Jundiá (INEA 2241036 / 224103620)
Fonte primária em tempo real: API Alerta de Cheias INEA/Cetrel (alertadecheias.com.br/stations/2241036)
Cotas Oficiais de Referência INEA (Estação Jundiá - Rio das Ostras):
  - Vigilância (Normal): < 1,99 m
  - Atenção:             1,99 m a 2,26 m
  - Alerta:              2,27 m a 2,83 m
  - Alerta Máximo:       >= 2,84 m (Cota de Transbordo = 2,84 m)
"""

import json
import re
import ssl
import urllib.request
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DATA_DIR = BASE_DIR / "data"

COTA_ATENCAO = 1.99
COTA_ALERTA = 2.27
COTA_TRANSBORDO = 2.84

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}


def _safe_float(val, default=None):
    if val is None:
        return default
    try:
        s = str(val).strip().replace("m", "").replace("%", "").strip().replace(",", ".")
        if s in ("", "-", "null", "None", "nan"):
            return default
        return float(s)
    except (ValueError, TypeError):
        return default


def _normalize_leitura_br(raw_dt):
    """Normaliza '29-10-2026 21:00' ou ISO '2026-10-29T21:00:00-03:00' para '29/10/2026 21:00'."""
    if not raw_dt:
        return "Hoje"
    s = str(raw_dt).strip()
    m_dash = re.match(r"^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}:\d{2})", s)
    if m_dash:
        return f"{m_dash.group(1)}/{m_dash.group(2)}/{m_dash.group(3)} {m_dash.group(4)}"
    m_iso = re.match(r"^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})", s)
    if m_iso:
        return f"{m_iso.group(3)}/{m_iso.group(2)}/{m_iso.group(1)} {m_iso.group(4)}"
    return s


def classify_jundia_level(nivel_raw, delta_m=0.0):
    """Classifica rigorosamente o nível do Rio Jundiá pelas cotas oficiais do INEA."""
    nv = _safe_float(nivel_raw, None)
    if nv is None:
        return None
    # Proteção contra leitura bruta em centímetros (ex.: 139.0 cm -> 1.39 m)
    if nv > 10.0:
        nv = round(nv / 100.0, 2)
    if nv < 0.05 or nv > 6.50:
        return None

    nv = round(nv, 2)
    if nv >= COTA_TRANSBORDO:
        status_upper = "ALERTA MÁXIMO"
        status_title = "Alerta Máximo"
    elif nv >= COTA_ALERTA:
        status_upper = "ALERTA"
        status_title = "Alerta"
    elif nv >= COTA_ATENCAO:
        status_upper = "ATENÇÃO"
        status_title = "Atenção"
    else:
        status_upper = "VIGILÂNCIA"
        status_title = "Vigilância"

    pct_calha = min(100, max(1, int(round((nv / COTA_TRANSBORDO) * 100.0))))
    margem_m = round(max(0.0, COTA_TRANSBORDO - nv), 2)

    d_val = _safe_float(delta_m, 0.0) or 0.0
    if d_val >= 0.04:
        tendencia = "Elevação"
    elif d_val <= -0.04:
        tendencia = "Vazante"
    else:
        tendencia = "Estável"

    nivel_dot = f"{nv:.2f}"
    nivel_comma = nivel_dot.replace(".", ",")
    margem_dot = f"{margem_m:.2f}"
    margem_comma = margem_dot.replace(".", ",")

    if nv >= COTA_TRANSBORDO:
        frase_sinopse = (
            f"No monitoramento hidrometeorológico, a Bacia Hidrográfica do Rio Jundiá atinge patamar crítico "
            f"de extravasamento, com a estação telemétrica municipal (INEA 2241036) registrando cota de "
            f"{nivel_comma} m (Status: {status_title}, ocupação de calha em {pct_calha}%, superando a cota "
            f"de transbordo de 2,84 m), com risco direto de inundação e refluxo pluvial nas áreas ribeirinhas."
        )
    elif nv >= COTA_ALERTA:
        frase_sinopse = (
            f"No monitoramento hidrometeorológico, a Bacia Hidrográfica do Rio Jundiá opera em nível elevado "
            f"({tendencia.lower()}), com a estação telemétrica municipal (INEA 2241036) registrando cota de "
            f"{nivel_comma} m (Status: {status_title}, ocupação de calha em {pct_calha}% e margem reduzida "
            f"de {margem_comma} m para a cota de transbordo de 2,84 m), demandando vigilância intensificada nos setores ribeirinhos."
        )
    elif nv >= COTA_ATENCAO:
        frase_sinopse = (
            f"No monitoramento hidrometeorológico, a Bacia Hidrográfica do Rio Jundiá encontra-se sob monitoramento "
            f"preventivo ({tendencia.lower()}), com a estação telemétrica municipal (INEA 2241036) registrando cota de "
            f"{nivel_comma} m (Status: {status_title}, ocupação de calha em {pct_calha}% e margem de {margem_comma} m "
            f"até a cota de transbordo de 2,84 m), exigindo acompanhamento contínuo da drenagem urbana."
        )
    else:
        if tendencia == "Vazante":
            regime_txt = "regime fluviométrico de estabilidade e vazante contínua"
        elif tendencia == "Elevação":
            regime_txt = "regime fluviométrico seguro com discreta oscilação ascendente"
        else:
            regime_txt = "regime fluviométrico de estabilidade"
        frase_sinopse = (
            f"No monitoramento hidrometeorológico, a Bacia Hidrográfica do Rio Jundiá opera em {regime_txt}, "
            f"com a estação telemétrica municipal (INEA 2241036) registrando cota de {nivel_comma} m "
            f"(Status: {status_title}, ocupação de calha em {pct_calha}% e ampla margem de segurança de "
            f"{margem_comma} m abaixo da cota de transbordo de 2,84 m), garantindo escoamento pluvial pleno nos canais urbanos."
        )

    return {
        "nivel_float": nv,
        "nivel_dot": nivel_dot,
        "nivel_comma": nivel_comma,
        "status_upper": status_upper,
        "status_title": status_title,
        "pct_calha": pct_calha,
        "margem_float": margem_m,
        "margem_dot": margem_dot,
        "margem_comma": margem_comma,
        "tendencia": tendencia,
        "badge_tech": f"Convecção Diurna • Índices CAPE / CINE • Cota INEA {nivel_comma} m ({tendencia} • {status_title})",
        "badge_estruturada": f"{status_upper} • COTA {nivel_comma} M ({tendencia.upper()})",
        "frase_sinopse": frase_sinopse,
    }


def _fetch_json(url, timeout=10):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=SSL_CTX, timeout=timeout) as res:
        return json.loads(res.read().decode("utf-8"))


def fetch_jundia_realtime(data_dir=None, save_10d=False):
    """
    Obtém a telemetria real verificada do Rio Jundiá (INEA 2241036) com redundância:
      1) https://alertadecheias.com.br/stations/2241036/full
      2) https://alertadecheias.com.br/stations/2241036/10d
      3) Snapshot local recente (inea_jundia_10d.json / acumulados_estacoes.json)
    """
    d_dir = Path(data_dir) if data_dir else DEFAULT_DATA_DIR
    result = None

    # 1. Endpoint oficial /full (tempo real a cada 15 min)
    try:
        full_json = _fetch_json("https://alertadecheias.com.br/stations/2241036/full", timeout=10)
        if isinstance(full_json, dict) and full_json.get("NIVEL_UTIMO") is not None:
            nv_now = _safe_float(full_json.get("NIVEL_UTIMO"))
            nv_45 = _safe_float(full_json.get("NIVEL_45"), nv_now)
            if nv_now is not None and nv_now > 10.0:
                nv_now = round(nv_now / 100.0, 2)
            if nv_45 is not None and nv_45 > 10.0:
                nv_45 = round(nv_45 / 100.0, 2)
            delta = (nv_now - nv_45) if (nv_now is not None and nv_45 is not None) else 0.0
            cls = classify_jundia_level(nv_now, delta)
            if cls:
                c1 = _safe_float(full_json.get("CHUVA_1H"), 0.0) or 0.0
                c4 = _safe_float(full_json.get("CHUVA_4H"), 0.0) or 0.0
                c24 = _safe_float(full_json.get("CHUVA_24H"), 0.0) or 0.0
                c96 = _safe_float(full_json.get("CHUVA_96H"), 0.0) or 0.0
                c30d = _safe_float(full_json.get("CHUVA_30D"), 0.0) or 0.0
                result = {
                    **cls,
                    "ultima_leitura": _normalize_leitura_br(full_json.get("DATA")),
                    "chuva_1h": round(c1, 1),
                    "chuva_4h": round(c4, 1),
                    "chuva_24h": round(c24, 1),
                    "chuva_96h": round(c96, 1),
                    "chuva_30d": round(c30d, 1),
                    "fonte": "alertadecheias.com.br/stations/2241036/full",
                }
    except Exception as e:
        print(f"[Jundiá Realtime] Aviso /full: {e}")

    # 2. Endpoint oficial /10d (série horária/15min; também persiste se solicitado)
    if result is None or save_10d:
        try:
            ten_json = _fetch_json("https://alertadecheias.com.br/stations/2241036/10d", timeout=12)
            if isinstance(ten_json, dict) and isinstance(ten_json.get("dados"), list) and ten_json["dados"]:
                if save_10d:
                    d_dir.mkdir(parents=True, exist_ok=True)
                    with open(d_dir / "inea_jundia_10d.json", "w", encoding="utf-8") as f:
                        json.dump(ten_json, f, ensure_ascii=False, indent=2)
                dados = ten_json["dados"]
                last_item = dados[-1]
                prev_item = dados[-4] if len(dados) >= 4 else dados[0]
                nv_last = _safe_float(last_item.get("nivel"))
                nv_prev = _safe_float(prev_item.get("nivel"), nv_last)
                if nv_last is not None and nv_last > 10.0:
                    nv_last = round(nv_last / 100.0, 2)
                if nv_prev is not None and nv_prev > 10.0:
                    nv_prev = round(nv_prev / 100.0, 2)
                delta = (nv_last - nv_prev) if (nv_last is not None and nv_prev is not None) else 0.0
                cls = classify_jundia_level(nv_last, delta)
                if result is None and cls:
                    result = {
                        **cls,
                        "ultima_leitura": _normalize_leitura_br(last_item.get("datetime_brt")),
                        "chuva_1h": round(_safe_float(last_item.get("chuva_1h"), 0.0) or 0.0, 1),
                        "chuva_4h": round(_safe_float(last_item.get("chuva_4h"), 0.0) or 0.0, 1),
                        "chuva_24h": round(_safe_float(last_item.get("chuva_24h"), 0.0) or 0.0, 1),
                        "chuva_96h": round(_safe_float(last_item.get("chuva_96h"), 0.0) or 0.0, 1),
                        "chuva_30d": round(_safe_float(last_item.get("chuva_30d"), 0.0) or 0.0, 1),
                        "historico_recente": dados[-24:],
                        "fonte": "alertadecheias.com.br/stations/2241036/10d",
                    }
                elif result is not None:
                    result["historico_recente"] = dados[-24:]
        except Exception as e:
            print(f"[Jundiá Realtime] Aviso /10d: {e}")

    # 3. Fallback local: inea_jundia_10d.json ou acumulados_estacoes.json
    if result is None:
        p_10d = d_dir / "inea_jundia_10d.json"
        if p_10d.exists():
            try:
                with open(p_10d, "r", encoding="utf-8") as f:
                    local_10d = json.load(f)
                dados = local_10d.get("dados", [])
                if dados:
                    last_item = dados[-1]
                    prev_item = dados[-4] if len(dados) >= 4 else dados[0]
                    nv_last = _safe_float(last_item.get("nivel"))
                    nv_prev = _safe_float(prev_item.get("nivel"), nv_last)
                    delta = (nv_last - nv_prev) if (nv_last is not None and nv_prev is not None) else 0.0
                    cls = classify_jundia_level(nv_last, delta)
                    if cls:
                        result = {
                            **cls,
                            "ultima_leitura": _normalize_leitura_br(last_item.get("datetime_brt")),
                            "chuva_1h": round(_safe_float(last_item.get("chuva_1h"), 0.0) or 0.0, 1),
                            "chuva_4h": round(_safe_float(last_item.get("chuva_4h"), 0.0) or 0.0, 1),
                            "chuva_24h": round(_safe_float(last_item.get("chuva_24h"), 0.0) or 0.0, 1),
                            "chuva_96h": round(_safe_float(last_item.get("chuva_96h"), 0.0) or 0.0, 1),
                            "chuva_30d": round(_safe_float(last_item.get("chuva_30d"), 0.0) or 0.0, 1),
                            "historico_recente": dados[-24:],
                            "fonte": "local/inea_jundia_10d.json",
                        }
            except Exception:
                pass

    if result is None:
        p_acc = d_dir / "acumulados_estacoes.json"
        if p_acc.exists():
            try:
                with open(p_acc, "r", encoding="utf-8") as f:
                    acc = json.load(f)
                j_st = acc.get("estacao_rio_jundia") if isinstance(acc, dict) else None
                if j_st:
                    cls = classify_jundia_level(j_st.get("nivel_rio"), 0.0)
                    if cls:
                        result = {
                            **cls,
                            "ultima_leitura": _normalize_leitura_br(j_st.get("ultima_leitura")),
                            "chuva_1h": 0.0,
                            "chuva_4h": 0.0,
                            "chuva_24h": 0.0,
                            "chuva_96h": 0.0,
                            "chuva_30d": 0.0,
                            "fonte": "local/acumulados_estacoes.json",
                        }
            except Exception:
                pass

    return result


def patch_jundia_in_text(text, j_info):
    """
    Atualiza qualquer menção de cota, status, ocupação de calha e margem do Rio Jundiá
    dentro de textos sinóticos ou resumos diários com os dados reais verificados.
    """
    if not text or not j_info:
        return text

    out = str(text)
    # 1. Substitui a frase hidrológica completa do Panorama Sinótico Geral (Parágrafo 2)
    out = re.sub(
        r"No monitoramento hidrometeorol[óo]gico,\s*a Bacia Hidrogr[áa]fica do Rio Jundi[áa][^.]*?(?:canais urbanos|setores ribeirinhos|[áa]reas ribeirinhas|drenagem urbana)\.",
        j_info["frase_sinopse"],
        out,
        flags=re.IGNORECASE | re.DOTALL,
    )

    # 2. Substitui menções curtas em resumos/cards ("cota de X.XX m (Status: ...)" ou "cota em X.XX m (Status: ...)")
    out = re.sub(
        r"(Rio Jundi[áa][^.\n]{0,60}?cota\s+(?:de|em)\s+)\d+[.,]\d+\s*m(?:\s*\(Status:\s*[^)]+\))?",
        rf"\g<1>{j_info['nivel_dot']} m (Status: {j_info['status_title']})",
        out,
        flags=re.IGNORECASE,
    )
    out = re.sub(
        r"(Rio Jundi[áa][^.\n]{0,60}?n[íi]vel\s+(?:de\s+|atual\s+|seguro\s*\()?)\d+[.,]\d+\s*m",
        rf"\g<1>{j_info['nivel_dot']} m",
        out,
        flags=re.IGNORECASE,
    )
    return out


def patch_metadata_with_jundia(metadata, j_info):
    """Sincroniza todos os campos de boletim_metadata.json com a telemetria real do Rio Jundiá."""
    if not isinstance(metadata, dict) or not j_info:
        return metadata

    nv_dot = j_info["nivel_dot"]
    nv_comma = j_info["nivel_comma"]
    st_title = j_info["status_title"]
    st_upper = j_info["status_upper"]

    if "kpis" in metadata and isinstance(metadata["kpis"], dict):
        metadata["kpis"]["jundia_nivel"] = f"{nv_dot} m"
        metadata["kpis"]["jundia_status"] = st_title

    if metadata.get("sinopse_geral"):
        metadata["sinopse_geral"] = patch_jundia_in_text(metadata["sinopse_geral"], j_info)

    if metadata.get("informe_alerta"):
        metadata["informe_alerta"] = patch_jundia_in_text(metadata["informe_alerta"], j_info)

    se = metadata.get("sinopse_estruturada")
    if isinstance(se, dict):
        o2 = se.get("ordem_2_hidrologia_costa")
        if isinstance(o2, dict):
            o2["badge"] = j_info["badge_estruturada"]
            o2["cota"] = f"{nv_dot} m"
            o2["status"] = st_title
            if o2.get("texto"):
                o2["texto"] = patch_jundia_in_text(o2["texto"], j_info)
            if isinstance(o2.get("estacoes"), list):
                for est in o2["estacoes"]:
                    if "jundi" in str(est.get("nome", "")).lower():
                        ch24_str = f"{j_info.get('chuva_24h', 0.0):.1f}".replace(".", ",")
                        est["valor"] = f"{nv_comma} m ({ch24_str} mm 24h)"

    if isinstance(metadata.get("alertas_estruturados"), list):
        for al in metadata["alertas_estruturados"]:
            if al.get("tipo") == "hidrologico" or "jundi" in str(al.get("titulo", "")).lower():
                al["status"] = st_upper
                al["badge"] = (
                    "danger"
                    if j_info["nivel_float"] >= COTA_TRANSBORDO
                    else ("warning" if j_info["nivel_float"] >= COTA_ATENCAO else "success")
                )
                al["detalhe"] = f"Cota: {nv_comma} m ({j_info['pct_calha']}% da calha • Transbordo: 2,84 m)"
                if j_info["nivel_float"] < COTA_ATENCAO:
                    al["impacto"] = (
                        f"Calha em regime seguro ({j_info['tendencia'].lower()}), com margem de "
                        f"{j_info['margem_comma']} m abaixo do transbordo. Escoamento normalizado."
                    )

    obs = metadata.get("analise_precipitacao_multifonte", {}).get("observado_recente", {})
    if isinstance(obs, dict) and isinstance(obs.get("inea_rio_jundia"), dict):
        obs["inea_rio_jundia"]["nivel_m"] = nv_dot
        obs["inea_rio_jundia"]["status"] = st_title
        obs["inea_rio_jundia"]["chuva_1h"] = j_info.get("chuva_1h", 0.0)
        obs["inea_rio_jundia"]["chuva_24h"] = j_info.get("chuva_24h", 0.0)
        obs["inea_rio_jundia"]["chuva_96h"] = j_info.get("chuva_96h", 0.0)

    if isinstance(metadata.get("dias_resumo"), list):
        for d in metadata["dias_resumo"]:
            if d.get("descricao"):
                d["descricao"] = patch_jundia_in_text(d["descricao"], j_info)
            if isinstance(d.get("informe_populacao"), list):
                d["informe_populacao"] = [patch_jundia_in_text(item, j_info) for item in d["informe_populacao"]]

    if isinstance(metadata.get("impactos_bairros"), list):
        for imp in metadata["impactos_bairros"]:
            if imp.get("impactos") and "jundi" in str(imp.get("impactos", "")).lower():
                imp["impactos"] = re.sub(
                    r"\(\d+[.,]\d+\s*m\)",
                    f"({nv_comma} m)",
                    imp["impactos"],
                )

    return metadata
