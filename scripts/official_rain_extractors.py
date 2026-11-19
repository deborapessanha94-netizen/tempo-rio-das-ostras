"""
Extratores Numéricos e Probabilísticos das Fontes Oficiais Brasileiras — @tempoemriodasostras
Lê e extrai dados reais (sem estimativas sintéticas) de:
1. INMET Meteograma COSMO 7x7km (https://meteograma.inmet.gov.br/3304524/dinamico) - 12 UTC & 00 UTC
2. INMET VIME (https://vime.inmet.gov.br/SE) - COSMO 2.8km SE-RJ & COSMO 7km SE (prec24h, prec2dias, PWAT, CAPE)
3. CPTEC/INPE WRF Meteograma (3866.png) + Mapas Probabilísticos P>=5mm (24h/48h/72h) & Tempo Severo
4. INEA RadarTool / Alerta de Cheias (status_municipios.php)
"""

import base64
from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
import re
import ssl
import urllib.request

import numpy as np
from PIL import Image, ImageOps

try:
    from scripts import inea_cheias_service as _inea_ocr
except ImportError:
    import inea_cheias_service as _inea_ocr

BRT = timezone(timedelta(hours=-3))
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
VIME_HEADERS = {**HEADERS, "Origin": "https://vime.inmet.gov.br", "Referer": "https://vime.inmet.gov.br/SE"}
CPTEC_HEADERS = {**HEADERS, "Referer": "https://www.cptec.inpe.br/"}

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

# Coordenadas pixel de Rio das Ostras (-22.5269, -41.9450) calibradas por imagem:
# VIME COSMO2P8 SE-RJ (683x680): 44W=166, 42W=498, 22S=312, Búzios=(518,442), Macaé=(532,376)
VIME_SE_RJ_POINTS = [(507, 404), (504, 404), (506, 401), (502, 406)]
# VIME COSMO7 SE (700x700): pixels continentais limpos de Rio das Ostras (entre a costa e a divisa interna)
VIME_SE_COSMO7_POINTS = [(517, 443), (519, 442), (518, 441), (520, 441)]
# CPTEC Mapa P>=5mm Brasil (1238x1602): costa leste RJ (Rio das Ostras, entre Búzios e Macaé, sem borda)
CPTEC_P05_POINTS = [(969, 1045), (968, 1046), (970, 1043), (967, 1047)]

VIME_PREC_BINS = [
    (0, 1), (1, 3), (3, 5), (5, 7), (7, 9), (9, 12), (12, 16), (16, 20),
    (20, 30), (30, 40), (40, 50), (50, 60), (60, 70), (70, 90), (90, 125), (125, 200), (200, 300),
]
VIME_PWAT_BINS = [
    (0, 4), (4, 6), (6, 8), (8, 10), (10, 12), (12, 14), (14, 16), (16, 18), (18, 20),
    (20, 25), (25, 30), (30, 35), (35, 40), (40, 45), (45, 50), (50, 55), (55, 60), (60, 80),
]
VIME_CAPE_BINS = [
    (0, 100), (100, 250), (250, 500), (500, 750), (750, 1000), (1000, 1500), (1500, 2000), (2000, 3500),
]


def _fetch_bytes(url, headers=None, timeout=14):
    req = urllib.request.Request(url, headers=headers or HEADERS)
    with urllib.request.urlopen(req, context=SSL_CTX, timeout=timeout) as r:
        return r.read()


def _fetch_json(url, headers=None, timeout=14):
    return json.loads(_fetch_bytes(url, headers=headers, timeout=timeout).decode("utf-8"))


def _ocr_stitched(crops_list):
    """Concatena recortes pequenos em faixa larga em escala de cinza para leitura limpa em Windows/Linux."""
    strips = []
    for im in crops_list:
        gray = ImageOps.autocontrast(ImageOps.grayscale(im)).convert("RGB")
        pim = gray.resize((im.width * 4, im.height * 4), Image.Resampling.BICUBIC)
        strips.append(ImageOps.expand(pim, border=24, fill=(255, 255, 255)))
    total_w = sum(s.width for s in strips) + 40
    max_h = max(s.height for s in strips)
    canvas = Image.new("RGB", (total_w, max_h), (255, 255, 255))
    x = 20
    for s in strips:
        canvas.paste(s, (x, (max_h - s.height) // 2))
        x += s.width + 20

    for psm in (7, 6):
        res = _inea_ocr._ocr_crops_tesseract({"s": (canvas, psm)})
        if res.get("s"):
            return res["s"]
    res_w = _inea_ocr._ocr_crops_windows({"s": (canvas, 7)})
    return res_w.get("s", "")


def _b64_to_pil(b64_str):
    from io import BytesIO
    raw = b64_str.split(",", 1)[1] if "," in b64_str else b64_str
    return Image.open(BytesIO(base64.b64decode(raw))).convert("RGB")


def _sample_vime_colorbar(pil_img, bins, sample_points, max_dist=55.0):
    arr = np.array(pil_img.convert("RGB"))
    h, w, _ = arr.shape
    min_req = max(5, len(bins) // 2)
    bar_candidates = []
    for ry in range(max(0, h - 28), h - 4):
        uniq = len(set(tuple(arr[ry, x]) for x in range(20, w - 20, max(10, w // 18))))
        if uniq >= min_req:
            bar_candidates.append((uniq, ry))
    if bar_candidates:
        max_uniq = max(u for u, _ in bar_candidates)
        best_rows = [ry for u, ry in bar_candidates if u >= max_uniq - 1]
        bar_y = best_rows[len(best_rows) // 2]
    else:
        bar_y = h - 16

    step = w / float(len(bins))
    palette = []
    for i, (b0, b1) in enumerate(bins):
        cx = min(w - 3, max(2, int((i + 0.5) * step)))
        patch_bar = np.median(arr[max(0, bar_y - 2):min(h, bar_y + 3), cx - 2:cx + 3], axis=(0, 1))
        palette.append((b0, b1, patch_bar))

    votes = []
    for px, py in sample_points:
        if not (0 <= px < w and 0 <= py < h):
            continue
        rgb = arr[py, px].astype(float)
        # Ignora linhas pretas de contorno/divisa para não confundir com a faixa extrema da barra
        if float(rgb.max()) < 30.0:
            continue
        # Branco puro / quase branco no mapa de precipitação representa sempre a faixa mínima (0 a 1 mm)
        if bins[0][0] == 0 and bins[0][1] <= 1 and float(rgb.min()) >= 245.0:
            votes.append((bins[0][0], bins[0][1]))
            continue
        best = min(palette, key=lambda p: float(np.linalg.norm(rgb - p[2].astype(float))))
        dist = float(np.linalg.norm(rgb - best[2].astype(float)))
        if dist <= max_dist:
            votes.append((best[0], best[1]))

    if not votes:
        return None
    votes.sort(key=lambda t: (t[0] + t[1]) / 2.0)
    b0, b1 = votes[len(votes) // 2]
    if b0 == 0 and b1 <= 1:
        rep = 0.2
    elif b1 >= 200:
        rep = float(b0)
    else:
        rep = round((b0 + b1) / 2.0, 1)
    return {"min": b0, "max": b1, "rep": rep, "faixa": f"{b0} a {b1}"}


_INMET_GLYPHS_7X5 = {
    "0": ["01110", "10010", "10001", "10001", "10001", "10010", "01110"],
    "1": ["01100", "10100", "00100", "00100", "00100", "00100", "11111"],
    "2": ["01110", "10011", "00010", "00110", "01100", "11000", "11111"],
    "3": ["01110", "10010", "00010", "00110", "00011", "10011", "11110"],
    "4": ["00010", "00110", "01010", "11010", "10010", "11110", "00010"],
    "5": ["11110", "10000", "10000", "11110", "00001", "10011", "11110"],
    "6": ["01110", "10000", "10100", "11010", "10001", "10011", "01110"],
    "7": ["11111", "00010", "00010", "00100", "00100", "01100", "01000"],
    "8": ["01110", "10010", "10010", "01110", "10010", "10010", "01111"],
    "9": ["01110", "01001", "11001", "01001", "00101", "00001", "01110"],
}


def _read_inmet_y_max_bitmap(pil_img, y_top, x_left):
    """Lê o número inteiro no topo do eixo Y do meteograma INMET pelos glifos bitmap 5x7."""
    gray = np.array(pil_img.convert("L"))
    y0 = max(0, y_top - 8)
    y1 = min(gray.shape[0], y_top + 10)
    x0 = max(0, x_left - 28)
    x1 = max(x0 + 6, x_left - 1)
    mask = gray[y0:y1, x0:x1] < 160
    r_idx = np.where(mask.any(axis=1))[0]
    if len(r_idx) == 0:
        return None
    bands = []
    s = int(r_idx[0])
    p = s
    for r in r_idx[1:]:
        ri = int(r)
        if ri > p + 2:
            bands.append((s, p))
            s = ri
        p = ri
    bands.append((s, p))
    target_r = y_top - y0
    b0, b1 = min(bands, key=lambda b: abs(((b[0] + b[1]) / 2.0) - target_r))
    if (b1 - b0 + 1) < 5:
        return None
    band_m = mask[b0:b1 + 1, :]
    c_active = np.where(band_m.any(axis=0))[0]
    if len(c_active) == 0:
        return None

    col_segs = []
    cs = int(c_active[0])
    cp = cs
    for c in c_active[1:]:
        ci = int(c)
        if ci > cp + 1:
            col_segs.append((cs, cp))
            cs = ci
        cp = ci
    col_segs.append((cs, cp))

    digits = []
    for cx0, cx1 in col_segs:
        sub_segs = [(cx0, min(cx0 + 4, cx1)), (cx0 + 5, cx1)] if (cx1 - cx0 + 1) >= 9 else [(cx0, cx1)]
        for sx0, sx1 in sub_segs:
            g = band_m[:, sx0:sx1 + 1]
            gh, gw = g.shape
            norm = np.zeros((7, 5), dtype=float)
            for rr in range(7):
                src_r = min(gh - 1, int(round(rr * (gh - 1) / 6.0))) if gh > 1 else 0
                for cc in range(5):
                    src_c = min(gw - 1, int(round(cc * (gw - 1) / 4.0))) if gw > 1 else 0
                    norm[rr, cc] = 1.0 if g[src_r, src_c] else 0.0
            best_d, best_score = None, -1e9
            for dig, rows_t in _INMET_GLYPHS_7X5.items():
                tmpl = np.array([[1.0 if ch == "1" else 0.0 for ch in r_s] for r_s in rows_t])
                inter = float((norm * tmpl).sum())
                union = float(np.maximum(norm, tmpl).sum()) or 1.0
                score = inter / union
                if score > best_score:
                    best_score = score
                    best_d = dig
            if best_d is not None and best_score >= 0.45:
                digits.append(best_d)
    if digits:
        try:
            val = float(int("".join(digits)))
            if 1.0 <= val <= 500.0:
                return val
        except ValueError:
            pass
    return None


# ==============================================================================
# 1. INMET METEOGRAMA COSMO 7x7 KM (meteograma.inmet.gov.br/3304524/dinamico)
# ==============================================================================
def _parse_cosmo_meteograma_img(pil_img, data_rodada_utc, rodada_utc):
    """Digitaliza a curva vermelha acumulada e valida cobertura mínima (>= 4 dias)."""
    arr = np.array(pil_img)
    top = arr[:260, :, :]
    gray_line = ((np.abs(top[:, :, 0].astype(int) - top[:, :, 1].astype(int)) < 15) & (top[:, :, 0] < 175) & (top[:, :, 0] > 90)).sum(axis=1)
    rows_box = np.where(gray_line > 350)[0]
    if len(rows_box) < 2:
        return None
    y_top, y_bot = int(rows_box[0]), int(rows_box[-1])

    col_dark = ((np.abs(top[y_top + 2:y_bot - 1, :, 0].astype(int) - top[y_top + 2:y_bot - 1, :, 1].astype(int)) < 15) & (top[y_top + 2:y_bot - 1, :, 0] < 180)).sum(axis=0)
    v_cols = np.where(col_dark > max(40, (y_bot - y_top) * 0.65))[0]
    if len(v_cols) < 2:
        return None
    x_left, x_right = int(v_cols[0]), int(v_cols[-1])

    # Lê y_max real (priorizando leitor bitmap 5x7 determinístico + fallback OCR) e validade do cabeçalho
    ymin_crop = pil_img.crop((max(0, x_left - 24), max(0, y_top - 8), max(20, x_left - 1), min(arr.shape[0], y_top + 10)))
    hdr_crop = pil_img.crop((180, 34, 580, 62))
    y_bmp = _read_inmet_y_max_bitmap(pil_img, y_top, x_left)
    hdr_txt = _ocr_stitched([hdr_crop])
    if y_bmp is not None:
        y_max = y_bmp
    else:
        ymax_txt = _ocr_stitched([ymin_crop])
        m_ymax = re.search(r"\b(\d{1,3})\b", ymax_txt)
        y_max = float(int(m_ymax.group(1))) if m_ymax else 7.0
    if y_max <= 0 or y_max > 500:
        y_max = 7.0

    # Validade completa obrigatória: exige início e fim separados por >= 4 dias (descarta rodadas parciais recém-iniciadas)
    dates_all = re.findall(r"(\d{2})\D+(\d{2})\D+(20\d{2})", hdr_txt)
    if len(dates_all) < 2:
        return None
    d_s, m_s, y_s = dates_all[0]
    d_e, m_e, y_e = dates_all[-1]
    try:
        dt_start_d = datetime(int(y_s), int(m_s), int(d_s), tzinfo=timezone.utc)
        dt_end_d = datetime(int(y_e), int(m_e), int(d_e), tzinfo=timezone.utc)
    except ValueError:
        return None
    if (dt_end_d - dt_start_d).days < 4:
        return None

    h0 = 12 if "12" in rodada_utc else 0
    if "cache" in rodada_utc:
        h_m = re.search(r"20\d{2}\D+(\d{2})[:\"]", hdr_txt)
        h0 = int(h_m.group(1)) if h_m else 0
    start_utc = dt_start_d.replace(hour=h0)

    end_utc = start_utc + timedelta(hours=174)  # INMET COSMO meteograma completo cobre ~174h (7d+6h)

    sub = top[y_top:y_bot + 1, x_left + 1:x_right]
    H_sub, W_sub, _ = sub.shape
    cum_vals = []
    for col in range(W_sub):
        px = sub[:, col]
        rmask = (px[:, 0] > 140) & (px[:, 1] < 80) & (px[:, 2] < 80)
        if rmask.any():
            ym = float(np.mean(np.where(rmask)[0]))
            frac = max(0.0, min(1.0, 1.0 - ym / max(1, H_sub - 1)))
            cum_vals.append(round(frac * y_max, 3))
        else:
            cum_vals.append(cum_vals[-1] if cum_vals else 0.0)

    total_hours = int((end_utc - start_utc).total_seconds() // 3600)
    hourly_brt = {}
    prev_cum = 0.0
    for h_off in range(1, total_hours + 1):
        col_idx = min(W_sub - 1, int(round((h_off / float(total_hours)) * (W_sub - 1))))
        cur_cum = max(prev_cum, cum_vals[col_idx])
        inc = max(0.0, cur_cum - prev_cum)
        dt_brt = (start_utc + timedelta(hours=h_off)).astimezone(BRT)
        hourly_brt[(dt_brt.strftime("%Y-%m-%d"), dt_brt.hour)] = round(inc, 3)
        prev_cum = cur_cum

    daily_mm = {}
    daily_hours = {}
    for (d_iso, _hr), val in hourly_brt.items():
        daily_mm[d_iso] = round(daily_mm.get(d_iso, 0.0) + val, 2)
        daily_hours[d_iso] = daily_hours.get(d_iso, 0) + 1

    clean_daily = {}
    for d_iso, val in sorted(daily_mm.items()):
        if daily_hours.get(d_iso, 0) >= 12:
            clean_daily[d_iso] = round(val, 1)

    if len(clean_daily) < 4:
        return None

    return {
        "disponivel": True,
        "fonte": "INMET Meteograma Dinâmico COSMO 7x7km (3304524)",
        "url": "https://meteograma.inmet.gov.br/3304524/dinamico",
        "rodada_utc": rodada_utc,
        "data_rodada_utc": data_rodada_utc,
        "y_max_mm": y_max,
        "daily_mm": clean_daily,
        "hourly_brt": {f"{k[0]}T{k[1]:02d}": v for k, v in hourly_brt.items()},
    }


def extract_inmet_cosmo_meteograma(img_dir, data_dir):
    """Baixa a rodada completa mais recente (12 UTC ou 00 UTC) e digitaliza a curva vermelha de chuva acumulada."""
    now_utc = datetime.now(timezone.utc)
    candidates = [
        (now_utc.strftime("%Y-%m-%d"), "12"),
        (now_utc.strftime("%Y-%m-%d"), "00"),
        ((now_utc - timedelta(days=1)).strftime("%Y-%m-%d"), "12"),
        ((now_utc - timedelta(days=1)).strftime("%Y-%m-%d"), "00"),
    ]

    cache_json = Path(data_dir) / "inmet_cosmo_cache.json"
    for d_str, rodada in candidates:
        url = f"https://apiprevmet3.inmet.gov.br/meteograma/3304524/{d_str}/{rodada}"
        try:
            payload = _fetch_json(url, timeout=12)
            b64_str = payload.get("base64") if isinstance(payload, dict) else (payload[0].get("base64") if isinstance(payload, list) and payload else None)
            if not b64_str:
                continue
            raw_b64 = b64_str.split(",", 1)[1] if "," in b64_str else b64_str
            img_bytes = base64.b64decode(raw_b64)
            if len(img_bytes) < 10000:
                continue
            out_path = Path(img_dir) / f"inmet_live_{rodada}utc.png"
            out_path.write_bytes(img_bytes)
            pil_img = Image.open(out_path).convert("RGB")
            parsed = _parse_cosmo_meteograma_img(pil_img, d_str, f"{rodada} UTC")
            if parsed:
                Path(img_dir, "meteograma_inmet.png").write_bytes(img_bytes)
                cache_json.write_text(json.dumps(parsed, ensure_ascii=False, indent=2), encoding="utf-8")
                return parsed
        except Exception:
            continue

    # Fallback para último cache completo validado em disco
    for fn in ["inmet_live_12utc.png", "inmet_live_00utc.png", "meteograma_inmet.png"]:
        fb = Path(img_dir) / fn
        if fb.exists():
            try:
                parsed = _parse_cosmo_meteograma_img(Image.open(fb).convert("RGB"), now_utc.strftime("%Y-%m-%d"), "cache")
                if parsed:
                    return parsed
            except Exception:
                pass
    if cache_json.exists():
        try:
            return json.loads(cache_json.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"disponivel": False}


# ==============================================================================
# 2. INMET VIME (vime.inmet.gov.br/SE e SE-RJ) — COSMO 2.8km & 7km, PWAT, CAPE
# ==============================================================================
def extract_inmet_vime_data(data_dir):
    """Consulta apivime.inmet.gov.br e extrai prec24h/prec2dias, água precipitável e CAPE para Rio das Ostras."""
    result = {
        "disponivel": False,
        "url": "https://vime.inmet.gov.br/SE",
        "rodada_cosmo28": None,
        "rodada_cosmo7": None,
        "daily_cosmo28_mm": {},
        "daily_cosmo28_faixa": {},
        "daily_cosmo7_mm": {},
        "daily_cosmo7_faixa": {},
        "agua_precipitavel": None,
        "cape": None,
    }

    # 2.1 COSMO 2.8km SE-RJ (alta resolução RJ)
    try:
        inits = _fetch_json("https://apivime.inmet.gov.br/inicializacao/COSMO2P8/SE-RJ/prec24h", headers=VIME_HEADERS, timeout=10)
        if inits:
            today_iso = datetime.now(BRT).strftime("%Y-%m-%d")
            # Prefere 12 UTC do dia se existir, caso contrário última inicialização disponível
            init_sig = next((x["sigla"] for x in inits if x["sigla"].startswith(today_iso) and "12:00" in x["sigla"]), inits[0]["sigla"])
            result["rodada_cosmo28"] = init_sig
            base_utc = datetime.strptime(init_sig, "%Y-%m-%dH%H:%M").replace(tzinfo=timezone.utc)

            # prec24h (Dia 0: i..i+24h)
            imgs24 = _fetch_json(f"https://apivime.inmet.gov.br/COSMO2P8/SE-RJ/prec24h/{init_sig}", headers=VIME_HEADERS, timeout=14)
            v24 = None
            if imgs24:
                s24 = _sample_vime_colorbar(_b64_to_pil(imgs24[0]["base64"]), VIME_PREC_BINS, VIME_SE_RJ_POINTS)
                if s24:
                    v24 = s24
                    d0_iso = (base_utc + timedelta(hours=12)).astimezone(BRT).strftime("%Y-%m-%d")
                    result["daily_cosmo28_mm"][d0_iso] = s24["rep"]
                    result["daily_cosmo28_faixa"][d0_iso] = f"{s24['faixa']} mm"
                    result["disponivel"] = True

            # prec2dias (último frame = +48h acumulados) -> Dia 1 = max(0, 48h - 24h)
            try:
                imgs48 = _fetch_json(f"https://apivime.inmet.gov.br/COSMO2P8/SE-RJ/prec2dias/{init_sig}", headers=VIME_HEADERS, timeout=15)
                if imgs48 and len(imgs48) >= 24:
                    s48 = _sample_vime_colorbar(_b64_to_pil(imgs48[-1]["base64"]), VIME_PREC_BINS, VIME_SE_RJ_POINTS)
                    if s48 and v24:
                        d1_iso = (base_utc + timedelta(hours=36)).astimezone(BRT).strftime("%Y-%m-%d")
                        d1_val = round(max(0.0, s48["rep"] - v24["rep"]), 1)
                        result["daily_cosmo28_mm"][d1_iso] = d1_val
                        result["daily_cosmo28_faixa"][d1_iso] = f"{max(0, s48['min'] - v24['max'])} a {max(1, s48['max'] - v24['min'])} mm"
            except Exception:
                pass

            # Água Precipitável (aguaprecT850V850 - pega frame +12h/+15h diurno/atual)
            try:
                imgs_pw = _fetch_json(f"https://apivime.inmet.gov.br/COSMO2P8/SE-RJ/aguaprecT850V850/{init_sig}", headers=VIME_HEADERS, timeout=14)
                if imgs_pw:
                    idx_pw = min(15, len(imgs_pw) - 1)
                    spw = _sample_vime_colorbar(_b64_to_pil(imgs_pw[idx_pw]["base64"]), VIME_PWAT_BINS, VIME_SE_RJ_POINTS)
                    if spw:
                        result["agua_precipitavel"] = {**spw, "unidade": "mm", "validade": imgs_pw[idx_pw].get("validade_extenso")}
            except Exception:
                pass

            # Índices CAPE & K (Kcape - pico diurno entre +12h e +21h)
            try:
                imgs_kc = _fetch_json(f"https://apivime.inmet.gov.br/COSMO2P8/SE-RJ/Kcape/{init_sig}", headers=VIME_HEADERS, timeout=14)
                if imgs_kc:
                    cape_samples = []
                    for idx_c in [min(12, len(imgs_kc) - 1), min(18, len(imgs_kc) - 1)]:
                        sc = _sample_vime_colorbar(_b64_to_pil(imgs_kc[idx_c]["base64"]), VIME_CAPE_BINS, VIME_SE_RJ_POINTS)
                        if sc:
                            cape_samples.append(sc)
                    if cape_samples:
                        best_c = max(cape_samples, key=lambda x: x["rep"])
                        result["cape"] = {**best_c, "unidade": "J/kg"}
            except Exception:
                pass
    except Exception as e:
        print(f"[VIME COSMO 2.8km SE-RJ] Aviso: {e}")

    # 2.2 COSMO 7km SE (cobertura estendida 7 dias)
    try:
        inits7 = _fetch_json("https://apivime.inmet.gov.br/inicializacao/COSMO7/SE/prec24h", headers=VIME_HEADERS, timeout=10)
        if inits7:
            today_iso = datetime.now(BRT).strftime("%Y-%m-%d")
            init7 = next((x["sigla"] for x in inits7 if x["sigla"].startswith(today_iso) and "12:00" in x["sigla"]), inits7[0]["sigla"])
            result["rodada_cosmo7"] = init7
            imgs7 = _fetch_json(f"https://apivime.inmet.gov.br/COSMO7/SE/prec24h/{init7}", headers=VIME_HEADERS, timeout=16)
            base7_utc = datetime.strptime(init7, "%Y-%m-%dH%H:%M").replace(tzinfo=timezone.utc)
            if imgs7:
                # Frames normalmente vêm a cada 3h (+24, +27, +30, ..., +168); escolhe múltiplos de 24h!
                for frame in imgs7:
                    nome = str(frame.get("nome", ""))
                    m_off = re.search(r"\+(\d+)", nome)
                    if not m_off:
                        continue
                    off_h = int(m_off.group(1))
                    if off_h % 24 != 0:
                        continue
                    s7 = _sample_vime_colorbar(_b64_to_pil(frame["base64"]), VIME_PREC_BINS, VIME_SE_COSMO7_POINTS)
                    if s7:
                        # validade +24h = acumulado das 24h anteriores terminando em validade - 12h centro
                        day_iso = (base7_utc + timedelta(hours=off_h - 12)).astimezone(BRT).strftime("%Y-%m-%d")
                        result["daily_cosmo7_mm"][day_iso] = s7["rep"]
                        result["daily_cosmo7_faixa"][day_iso] = f"{s7['faixa']} mm"
                        result["disponivel"] = True
    except Exception as e:
        print(f"[VIME COSMO 7km SE] Aviso: {e}")

    vime_path = Path(data_dir) / "inmet_vime.json"
    if result["disponivel"]:
        try:
            vime_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception:
            pass
    elif vime_path.exists():
        try:
            cached = json.loads(vime_path.read_text(encoding="utf-8"))
            if cached.get("disponivel"):
                cached["cached_fallback"] = True
                return cached
        except Exception:
            pass
    return result


# ==============================================================================
# 3. CPTEC/INPE WRF (3866.png) + PROBABILÍSTICA (P >= 5 mm)
# ==============================================================================
def extract_cptec_wrf_and_prob(img_dir):
    """Digitaliza barras horárias do Meteograma WRF (3866.png) e amostras P>=5mm dos mapas probabilísticos."""
    wrf_res = {"disponivel": False, "daily_mm": {}, "hourly_brt": {}}
    wrf_path = Path(img_dir) / "cptec" / "meteograma_cptec_3866.png"
    wrf_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        wrf_bytes = _fetch_bytes("https://s1.cptec.inpe.br/grafico/Modelos/WRF/GHT/meteogramas/PPN/3866.png", headers=CPTEC_HEADERS, timeout=15)
        if len(wrf_bytes) > 5000:
            wrf_path.write_bytes(wrf_bytes)
    except Exception:
        pass

    if wrf_path.exists():
        try:
            im_w = Image.open(wrf_path).convert("RGB")
            arr_w = np.array(im_w)
            top_w = arr_w[:200, :, :]
            bw = (top_w[:, :, 0] < 145) & (top_w[:, :, 1] < 145) & (top_w[:, :, 2] < 145)
            hlw = np.where(bw.sum(axis=1) > 350)[0]
            if len(hlw) >= 2:
                yt = int(hlw[0])
                yb_cands = [int(r) for r in hlw if r >= yt + 65]
                if yb_cands:
                    yb = yb_cands[0]
                    vlw = np.where(bw[yt:yb + 1, :].sum(axis=0) > max(40, (yb - yt) * 0.65))[0]
                    xl, xr = int(vlw[0]), int(vlw[-1])
                else:
                    xl, xr, yb = 0, 0, 0
                if xr > xl + 100:
                    ocr_w = _ocr_stitched([
                        im_w.crop((24, max(0, yt - 8), xl - 1, yt + 10)),
                        im_w.crop((190, 16, 400, 38)),
                    ])
                    m_ym = re.match(r"\s*(\d{1,3})\b", ocr_w)
                    y_max_w = float(int(m_ym.group(1))) if m_ym else 3.0
                    if y_max_w <= 0 or y_max_w > 200:
                        y_max_w = 3.0

                    # Identifica data inicial do WRF (padrão 00Z ou 12Z de hoje)
                    now_utc = datetime.now(timezone.utc)
                    start_wrf = now_utc.replace(hour=0 if now_utc.hour < 14 else 12, minute=0, second=0, microsecond=0)
                    m_dt = re.search(r"(\d{2})[/.-](\d{2})[/.-](20\d{2})", ocr_w)
                    if m_dt:
                        try:
                            start_wrf = datetime(int(m_dt.group(3)), int(m_dt.group(2)), int(m_dt.group(1)), 0, 0, tzinfo=timezone.utc)
                        except ValueError:
                            pass

                    sub_w = top_w[yt + 1:yb, xl + 1:xr]
                    Hw, Ww, _ = sub_w.shape
                    col_mm = []
                    for col in range(Ww):
                        cpx = sub_w[:, col]
                        bmask = (cpx[:, 0] < 70) & (cpx[:, 1] < 105) & (cpx[:, 2] > 190)
                        if bmask.any():
                            ymin = int(np.min(np.where(bmask)[0]))
                            frac = max(0.0, min(1.0, 1.0 - (ymin / max(1, Hw - 1))))
                            col_mm.append(round(frac * y_max_w, 3))
                        else:
                            col_mm.append(0.0)

                    hourly_brt = {}
                    daily_mm = {}
                    daily_hours = {}
                    for hh in range(168):
                        c0 = int(round((hh / 168.0) * Ww))
                        c1 = max(c0 + 1, int(round(((hh + 1) / 168.0) * Ww)))
                        val_h = max(col_mm[c0:c1]) if col_mm[c0:c1] else 0.0
                        dt_brt = (start_wrf + timedelta(hours=hh)).astimezone(BRT)
                        d_iso = dt_brt.strftime("%Y-%m-%d")
                        hourly_brt[f"{d_iso}T{dt_brt.hour:02d}"] = round(val_h, 3)
                        daily_mm[d_iso] = round(daily_mm.get(d_iso, 0.0) + val_h, 2)
                        daily_hours[d_iso] = daily_hours.get(d_iso, 0) + 1

                    wrf_res = {
                        "disponivel": True,
                        "fonte": "CPTEC/INPE Modelo Regional WRF (3866)",
                        "y_max_mmh": y_max_w,
                        "daily_mm": {d: round(v, 1) for d, v in sorted(daily_mm.items()) if daily_hours.get(d, 0) >= 12},
                        "hourly_brt": hourly_brt,
                    }
        except Exception as e:
            print(f"[CPTEC WRF Parser] Aviso: {e}")

    # Previsão Probabilística P >= 5 mm (24h, 48h, 72h)
    prob_p05_by_day = {}
    today_brt = datetime.now(BRT).date()
    for d_off, fcode in [(0, "024"), (1, "048"), (2, "072")]:
        d_iso = (today_brt + timedelta(days=d_off)).strftime("%Y-%m-%d")
        try:
            u = f"https://s1.cptec.inpe.br/grafico/Modelos/Multimodel/prob_diaria/figuras/prec/pro_bra_p05_{fcode}.png"
            out_m = Path(img_dir) / "cptec" / f"mapa_prob_p05_{fcode}.png"
            out_m.write_bytes(_fetch_bytes(u, headers=CPTEC_HEADERS, timeout=14))
            p5 = np.array(Image.open(out_m).convert("RGB"))
            # Colorbar x span: 56..989 at row 1515 -> 10% a 90%
            bar_cols = p5[1515, 56:990].astype(float)
            samples = []
            for px, py in CPTEC_P05_POINTS:
                rgb = p5[py, px]
                if rgb.max() < 45:
                    continue  # Ignora contorno preto de divisa/costa
                if rgb.min() >= 246:
                    samples.append(5)  # Região branca (< 10%)
                else:
                    dists = np.linalg.norm(bar_cols - rgb.astype(float), axis=1)
                    idx_min = int(np.argmin(dists))
                    if dists[idx_min] < 45:
                        pct = int(round(10.0 + (idx_min / max(1, len(bar_cols) - 1)) * 80.0))
                        samples.append(pct)
            if samples:
                prob_p05_by_day[d_iso] = int(round(sum(samples) / len(samples)))
        except Exception as e:
            print(f"[CPTEC Prob P05 {fcode}] Aviso: {e}")

    return {"wrf": wrf_res, "prob_p05_by_day": prob_p05_by_day}


# ==============================================================================
# 4. INEA RADARTOOL STATUS MUNICIPAL AO VIVO (radartool.inea.rj.gov.br)
# ==============================================================================
def extract_inea_radartool_status(data_dir=None):
    """Lê o estágio operacional oficial de Rio das Ostras no RadarTool / Alerta de Cheias do INEA."""
    cache_p = Path(data_dir) / "radartool_cache.json" if data_dir else None
    try:
        data = _fetch_json("https://radartool.inea.rj.gov.br/radar-tool/status_municipios.php", timeout=10)
        labels = data.get("labels", ["Vigilância", "Atenção", "Alerta", "Alerta Máximo", "Transbordamento"])
        idx = data.get("status", {}).get("RIO DAS OSTRAS")
        label = labels[idx] if (idx is not None and 0 <= int(idx) < len(labels)) else "Vigilância"
        res = {
            "disponivel": True,
            "estagio": label,
            "estagio_indice": idx,
            "atualizado_em": data.get("generated_at"),
            "url": "https://radartool.inea.rj.gov.br/radar-tool/",
        }
        if cache_p:
            try:
                cache_p.write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
            except Exception:
                pass
        return res
    except Exception as e:
        print(f"[INEA RadarTool] Aviso: {e}")
        if cache_p and cache_p.exists():
            try:
                cached = json.loads(cache_p.read_text(encoding="utf-8"))
                cached["cached_fallback"] = True
                return cached
            except Exception:
                pass
        return {"disponivel": False, "estagio": "Vigilância"}


# ==============================================================================
# 5. MODELOS GLOBAIS (BASE WINDY: ECMWF IFS 9km, NOAA GFS, DWD ICON 13km)
# ==============================================================================
def extract_global_nwp_models(data_dir=None):
    """Coleta previsões horárias e diárias individuais (chuva e ventos) de ECMWF IFS (9km), NOAA GFS e DWD ICON (13km)."""
    cache_p = Path(data_dir) / "global_nwp_models.json" if data_dir else None
    url = (
        "https://api.open-meteo.com/v1/forecast?"
        "latitude=-22.5269&longitude=-41.9450"
        "&hourly=precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,wind_direction_10m"
        "&daily=precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max"
        "&forecast_days=8&timezone=America%2FSao_Paulo"
        "&models=ecmwf_ifs,gfs_seamless,icon_global"
    )
    model_defs = {
        "ecmwf_ifs": "ECMWF IFS (9 km)",
        "gfs_seamless": "NOAA GFS (13-25 km)",
        "icon_global": "DWD ICON (13 km)",
    }
    try:
        raw = _fetch_json(url, timeout=14)
        daily = raw.get("daily", {})
        hourly = raw.get("hourly", {})
        d_times = daily.get("time", [])
        h_times = hourly.get("time", [])

        models_out = {}
        for m_key, m_label in model_defs.items():
            d_mm = {}
            d_prob = {}
            d_wind_max = {}
            d_gust_max = {}
            p_arr = daily.get(f"precipitation_sum_{m_key}", [])
            pb_arr = daily.get(f"precipitation_probability_max_{m_key}", [])
            dw_arr = daily.get(f"wind_speed_10m_max_{m_key}", [])
            dg_arr = daily.get(f"wind_gusts_10m_max_{m_key}", [])
            for idx, d_iso in enumerate(d_times):
                if idx < len(p_arr) and p_arr[idx] is not None:
                    d_mm[d_iso] = round(float(p_arr[idx]), 1)
                if idx < len(pb_arr) and pb_arr[idx] is not None:
                    d_prob[d_iso] = int(round(float(pb_arr[idx])))
                if idx < len(dw_arr) and dw_arr[idx] is not None:
                    d_wind_max[d_iso] = round(float(dw_arr[idx]), 1)
                if idx < len(dg_arr) and dg_arr[idx] is not None:
                    d_gust_max[d_iso] = round(float(dg_arr[idx]), 1)

            h_brt = {}
            h_wind_brt = {}
            h_gust_brt = {}
            h_dir_brt = {}
            hp_arr = hourly.get(f"precipitation_{m_key}", [])
            hw_arr = hourly.get(f"wind_speed_10m_{m_key}", [])
            hg_arr = hourly.get(f"wind_gusts_10m_{m_key}", [])
            hd_arr = hourly.get(f"wind_direction_10m_{m_key}", [])
            for idx, t_str in enumerate(h_times):
                if "T" not in t_str:
                    continue
                tk = t_str[:13]
                if idx < len(hp_arr) and hp_arr[idx] is not None:
                    h_brt[tk] = round(float(hp_arr[idx]), 3)
                if idx < len(hw_arr) and hw_arr[idx] is not None:
                    h_wind_brt[tk] = round(float(hw_arr[idx]), 1)
                if idx < len(hg_arr) and hg_arr[idx] is not None:
                    h_gust_brt[tk] = round(float(hg_arr[idx]), 1)
                if idx < len(hd_arr) and hd_arr[idx] is not None:
                    h_dir_brt[tk] = int(round(float(hd_arr[idx]))) % 360

            models_out[m_key] = {
                "nome": m_label,
                "daily_mm": d_mm,
                "daily_prob_pct": d_prob,
                "daily_wind_max_kmh": d_wind_max,
                "daily_gust_max_kmh": d_gust_max,
                "hourly_brt": h_brt,
                "hourly_wind_brt": h_wind_brt,
                "hourly_gust_brt": h_gust_brt,
                "hourly_dir_brt": h_dir_brt,
            }

        res = {
            "disponivel": any(bool(v["daily_mm"]) for v in models_out.values()),
            "atualizado_em": datetime.now(BRT).isoformat(timespec="seconds"),
            "models": models_out,
        }
        if cache_p and res["disponivel"]:
            try:
                cache_p.write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
            except Exception:
                pass
        return res
    except Exception as e:
        print(f"[Global NWP ECMWF/GFS/ICON] Aviso: {e}")
        if cache_p and cache_p.exists():
            try:
                cached = json.loads(cache_p.read_text(encoding="utf-8"))
                cached["cached_fallback"] = True
                return cached
            except Exception:
                pass
        return {"disponivel": False, "models": {}}


def extract_all_official_rain_sources(img_dir, data_dir):
    """Executa todos os extratores oficiais brasileiros e modelos globais (ECMWF/GFS/ICON) e consolida."""
    inmet_cosmo_met = extract_inmet_cosmo_meteograma(img_dir, data_dir)
    inmet_vime = extract_inmet_vime_data(data_dir)
    cptec_extra = extract_cptec_wrf_and_prob(img_dir)
    inea_radartool = extract_inea_radartool_status(data_dir)
    global_nwp = extract_global_nwp_models(data_dir)
    return {
        "inmet_cosmo_meteograma": inmet_cosmo_met,
        "inmet_vime": inmet_vime,
        "cptec_wrf": cptec_extra["wrf"],
        "cptec_prob_p05": cptec_extra["prob_p05_by_day"],
        "inea_radartool": inea_radartool,
        "global_nwp": global_nwp,
    }
