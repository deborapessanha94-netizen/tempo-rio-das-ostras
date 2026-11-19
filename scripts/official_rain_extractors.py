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
from concurrent.futures import ThreadPoolExecutor, as_completed
import ssl
import time
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
VIME_SE_RJ_POINTS = [
    (507, 404), (504, 404), (506, 401), (502, 406),
    (505, 403), (503, 402), (508, 402), (501, 404), (504, 406),
]
# VIME COSMO7 SE (700x700): pixels continentais limpos de Rio das Ostras (entre a costa e a divisa interna)
VIME_SE_COSMO7_POINTS = [
    (517, 443), (519, 442), (518, 441), (520, 441),
    (516, 442), (515, 443), (516, 440), (518, 443), (514, 442),
]
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
# ==============================================================================
# 2. INMET VIME (COSMO 2.8km SE-RJ + COSMO 7km SE — EXTRAÇÃO INTEGRAL)
# ==============================================================================
_VIME_BINS = {
    "prec24h":     [(0,1),(1,3),(3,5),(5,7),(7,9),(9,12),(12,16),(16,20),(20,30),(30,40),(40,50),(50,60),(60,70),(70,90),(90,125),(125,200),(200,300)],
    "prec1h":      [(0,1),(1,3),(3,5),(5,7),(7,9),(9,11),(11,13),(13,15),(15,17),(17,19),(19,21),(21,23),(23,25),(25,35),(35,50),(50,70)],
    "prevento10m": [(0,0.5),(0.5,1),(1,2),(2,3),(3,4),(4,5),(5,6),(6,7),(7,8),(8,9),(9,10),(10,12),(12,15),(15,20),(20,25),(25,30),(30,40),(40,50)],
    "prec3h6h":    [(0,1),(1,3),(3,5),(5,7),(7,9),(9,12),(12,16),(16,20),(20,30),(30,40),(40,50),(50,60),(60,70),(70,80),(80,100),(100,150),(150,250)],
    "prec7dias":   [(0,1),(1,3),(3,7),(7,10),(10,20),(20,30),(30,40),(40,50),(50,60),(60,70),(70,80),(80,100),(100,150),(150,200),(200,300),(300,400),(400,600)],
    "rajada":      [(14,17),(17,20),(20,24),(24,28),(28,32),(32,36),(36,40),(40,44),(44,50)],
    "tmax_c28":    [(4,6)] + [(x,x+2) for x in range(6,42,2)] + [(42,46)],
    "tmin_c28":    [(-4,-2)] + [(x,x+2) for x in range(-2,36,2)] + [(36,40)],
    "t2m_c28":     [(-8,-6)] + [(x,x+2) for x in range(-6,40,2)] + [(40,44)],
    "tmax_c7":     [(-10,-6),(-6,-2),(-2,2),(2,6),(6,10)] + [(x,x+2) for x in range(10,44,2)] + [(44,48)],
    "tmin_c7":     [(-10,-6)] + [(x,x+2) for x in range(-6,42,2)] + [(42,46)],
    "ur":          [(0,10)] + [(x,x+5) for x in range(10,95,5)] + [(95,100)],
    "kcape":       [(0,100),(100,250),(250,500),(500,750),(750,1000),(1000,1500),(1500,2000),(2000,3500)],
    "kshow":       [(-6,-5),(-5,-4),(-4,-3),(-3,-2),(-2,-1),(-1,0),(0,5)],
    "totals":      [(30,44),(44,50),(50,53),(53,56),(56,60),(60,68)],
    "pwat":        [(0,4),(4,6),(6,8),(8,10),(10,12),(12,14),(14,16),(16,18),(18,20),(20,25),(25,30),(30,35),(35,40),(40,45),(45,50),(50,55),(55,60),(60,80)],
    "nuvem_tot":   [(0,55),(55,60),(60,70),(70,80),(80,90),(90,100)],
    "nuvem_lvl":   [(-1,0),(0,55),(55,60),(60,70),(70,80),(80,90),(90,100)],
    "cisal_lo":    [(-5,0),(0,5),(5,10),(10,15),(15,20),(20,25),(25,30),(30,40)],
    "cisal_hi":    [(0,20),(20,25),(25,30),(30,35),(35,40),(40,45),(45,50),(50,55),(55,60),(60,75)],
    "jato200":     [(-1,0),(0,30),(30,40),(40,50),(50,60),(60,70),(70,80),(80,90),(90,120)],
    "omega":       [(-3.0,-2.0),(-2.0,-1.2),(-1.2,-1.0),(-1.0,-0.8),(-0.8,-0.6),(-0.6,-0.4),(-0.4,0.3),(0.3,0.5),(0.5,0.7),(0.7,1.0),(1.0,2.0)],
    "ur_lvl_c28":  [(0,70),(70,80),(80,90),(90,95),(95,100)],
    "ur_lvl_c7":   [(-1,0),(0,50),(50,70),(70,80),(80,90),(90,100)],
    "tend_press":  [(-45,-35),(-35,-25),(-25,-16),(-16,-10),(-10,-6),(-6,-2),(-2,2),(2,4),(4,6),(6,8),(8,12),(12,16),(16,24)],
    "tend_tsup":   [(-20,-16),(-16,-14),(-14,-12),(-12,-10),(-10,-8),(-8,-6),(-6,-4),(-4,-2),(-2,2),(2,4),(4,6),(6,8),(8,10),(10,12),(12,14),(14,16),(16,20)],
    "tend_t850":   [(-16,-12),(-12,-10),(-10,-8),(-8,-6),(-6,-4),(-4,-2),(-2,2),(2,4),(4,6),(6,8),(8,10),(10,12),(12,16),(16,20)],
    "tend_geop":   [(-330,-240),(-240,-210),(-210,-180),(-180,-150),(-150,-120),(-120,-90),(-90,-60),(-60,-30),(-30,30),(30,60),(60,90),(90,120),(120,150),(150,180),(180,210),(210,240),(240,330)],
    "vort500":     [(-14,-11),(-11,-8),(-8,-5),(-5,-2),(-2,2),(2,5),(5,8),(8,11),(11,14),(14,20)],
    "vort850":     [(-18,-14),(-14,-10),(-10,-6),(-6,-2),(-2,2),(2,6),(6,10),(10,14),(14,18),(18,24)],
}


def _fetch_vime_json_retry(url, timeout=16, retries=3):
    last_err = None
    for att in range(retries):
        try:
            return _fetch_json(url, headers=VIME_HEADERS, timeout=timeout)
        except Exception as exc:
            last_err = exc
            if att < retries - 1:
                time.sleep(0.9 + 0.8 * att)
    raise last_err


def _sample_vime_var_bar(
    img_rgb,
    bins,
    base_points,
    white_min_bin=False,
    allow_white_bin=False,
    max_dist=44.0,
    bar_x1_override=None,
    base_size=(700, 700),
    skip_neutral_grey=True,
    grey_patch_check=False,
):
    """Lê a barra de cores inferior dos mapas VIME com filtragem de barbelas cinzas/linhas costeiras."""
    arr = np.array(img_rgb.convert("RGB"))
    h, w, _ = arr.shape
    ymid = 514 if h == 530 else max(4, h - 16)
    bx1 = bar_x1_override if bar_x1_override else w
    step = float(bx1) / float(len(bins))
    palette = []
    for i, (b0, b1) in enumerate(bins):
        cx = min(w - 3, max(2, int(round((i + 0.5) * step))))
        patch = np.median(arr[max(0, ymid - 2):min(h, ymid + 3), max(0, cx - 2):min(w, cx + 3)], axis=(0, 1))
        palette.append((b0, b1, patch.astype(float)))

    sx = w / float(base_size[0])
    sy = h / float(base_size[1])
    pts = [(int(round(px * sx)), int(round(py * sy))) for px, py in base_points]

    votes = []
    for px, py in pts:
        if not (0 <= px < w and 0 <= py < h):
            continue
        if grey_patch_check:
            # Em escalas de cinza (Nebulosidade), usa mediana 3x3 filtrando traços escuros de contorno/barbelas
            block = arr[max(0, py - 1):min(h, py + 2), max(0, px - 1):min(w, px + 2)].reshape(-1, 3)
            clean_px = [p for p in block if int(p.max()) >= 55]
            if len(clean_px) < 4:
                continue
            rgb = np.median(np.array(clean_px, dtype=float), axis=0)
        else:
            rgb = arr[py, px].astype(float)

        if float(rgb.max()) < 45.0:
            continue
        if float(rgb.min()) >= 244.0:
            if isinstance(white_min_bin, tuple):
                votes.append(white_min_bin)
            elif white_min_bin:
                votes.append(bins[0])
            elif allow_white_bin:
                best = min(palette, key=lambda p: float(np.linalg.norm(rgb - p[2])))
                if float(np.linalg.norm(rgb - best[2])) <= max_dist:
                    votes.append((best[0], best[1]))
            continue
        if skip_neutral_grey and (float(rgb.max()) - float(rgb.min())) < 18.0 and float(rgb.mean()) < 165.0:
            continue

        best = min(palette, key=lambda p: float(np.linalg.norm(rgb - p[2])))
        if float(np.linalg.norm(rgb - best[2])) <= max_dist:
            votes.append((best[0], best[1]))

    if not votes:
        return None
    votes.sort(key=lambda t: (t[0] + t[1]) / 2.0)
    b0, b1 = votes[len(votes) // 2]
    if isinstance(white_min_bin, tuple) and (b0, b1) == white_min_bin:
        rep = 0.0 if b1 <= 30 else round((b0 + b1) / 2.0, 2)
    elif white_min_bin == "zero" and (b0, b1) == bins[0]:
        rep = 0.0
    elif white_min_bin is True and (b0, b1) == bins[0]:
        rep = 0.2 if (b1 <= 1.0 and bins[0][0] == 0) else round((b0 + b1) / 2.0, 2)
    else:
        rep = round((b0 + b1) / 2.0, 2)
    return {"min": b0, "max": b1, "rep": rep, "faixa": f"{b0} a {b1}"}


def _assign_vime_day_brt(base_utc, off_h, is_interval_h=0):
    dt_valid = base_utc + timedelta(hours=off_h)
    if is_interval_h > 0:
        dt_ref = dt_valid - timedelta(hours=is_interval_h / 2.0)
    else:
        dt_ref = dt_valid
    dt_brt = dt_ref.astimezone(BRT)
    return dt_brt.strftime("%Y-%m-%d"), dt_brt.hour, dt_brt.strftime("%Y-%m-%dT%H:00")


def _brt_turn_key(hour_brt):
    if 0 <= hour_brt < 6:
        return "madrugada"
    if 6 <= hour_brt < 12:
        return "manha"
    if 12 <= hour_brt < 18:
        return "tarde"
    return "noite"


def extract_inmet_vime_data(data_dir):
    """Consulta apivime.inmet.gov.br (COSMO 2.8km SE-RJ + COSMO 7km SE) e extrai TODAS as variáveis dos mapas para Rio das Ostras."""
    vime_path = Path(data_dir) / "inmet_vime.json"
    cached = None
    if vime_path.exists():
        try:
            cached = json.loads(vime_path.read_text(encoding="utf-8"))
        except Exception:
            cached = None

    init_c28 = None
    init_c7 = None
    try:
        inits28 = _fetch_vime_json_retry("https://apivime.inmet.gov.br/inicializacao/COSMO2P8/SE-RJ/prec24h", timeout=10, retries=2)
        if inits28:
            init_c28 = max(inits28, key=lambda x: str(x.get("sigla", "")))["sigla"]
    except Exception:
        pass
    try:
        inits7 = _fetch_vime_json_retry("https://apivime.inmet.gov.br/inicializacao/COSMO7/SE/prec24h", timeout=10, retries=2)
        if inits7:
            init_c7 = max(inits7, key=lambda x: str(x.get("sigla", "")))["sigla"]
    except Exception:
        pass

    if (
        isinstance(cached, dict)
        and cached.get("disponivel")
        and cached.get("vime_schema_version") == 3
        and isinstance(cached.get("daily_vime_vars"), dict)
        and len(cached["daily_vime_vars"]) >= 5
        and (not init_c28 or cached.get("rodada_cosmo28") == init_c28)
        and (not init_c7 or cached.get("rodada_cosmo7") == init_c7)
    ):
        return cached

    result = {
        "vime_schema_version": 3,
        "disponivel": False,
        "url": "https://vime.inmet.gov.br/SE",
        "atualizado_em_brt": datetime.now(BRT).strftime("%Y-%m-%d %H:%M"),
        "rodada_cosmo28": init_c28,
        "rodada_cosmo7": init_c7,
        "daily_cosmo28_mm": {},
        "daily_cosmo28_faixa": {},
        "daily_cosmo28_prec1h_mm": {},
        "hourly_cosmo28_mm": {},
        "hourly_cosmo28_vars": {},
        "daily_cosmo7_mm": {},
        "daily_cosmo7_faixa": {},
        "daily_cosmo7_prec6h_mm": {},
        "daily_cosmo7_prec3h_mm": {},
        "turn_cosmo7_prec_mm": {},
        "agua_precipitavel": None,
        "cape": None,
        "daily_vime_vars": {},
        "resumo_variaveis_extraidas": {},
    }

    # Especificações completas de todos os parâmetros escalares sombreados do VIME:
    # (model, area, param, bins_key, wmin, allow_white, interval_h, skip_grey, grey_patch)
    specs = []
    if init_c28:
        specs.extend([
            ("COSMO2P8", "SE-RJ", "prec24h",          "prec24h",     "zero",   False, 24, False, False),
            ("COSMO2P8", "SE-RJ", "prec2dias",        "prec24h",     "zero",   False, 48, False, False),
            ("COSMO2P8", "SE-RJ", "prec1h",           "prec1h",      "zero",   False, 1,  False, False),
            ("COSMO2P8", "SE-RJ", "prevento10m",      "prevento10m", "zero",   False, 1,  True,  False),
            ("COSMO2P8", "SE-RJ", "Rajada10m",        "rajada",      (0, 14),  False, 0,  True,  False),
            ("COSMO2P8", "SE-RJ", "T2m",              "t2m_c28",     False,    True,  0,  True,  False),
            ("COSMO2P8", "SE-RJ", "TempMaxima",       "tmax_c28",    False,    True,  1,  True,  False),
            ("COSMO2P8", "SE-RJ", "TempMinima",       "tmin_c28",    False,    True,  1,  True,  False),
            ("COSMO2P8", "SE-RJ", "UR2m",             "ur",          False,    True,  0,  True,  False),
            ("COSMO2P8", "SE-RJ", "Kcape",            "kcape",       True,     False, 0,  True,  False),
            ("COSMO2P8", "SE-RJ", "Kshow",            "kshow",       False,    True,  0,  True,  False),
            ("COSMO2P8", "SE-RJ", "TotalsLifted",     "totals",      True,     False, 0,  True,  False),
            ("COSMO2P8", "SE-RJ", "aguaprecT850V850", "pwat",        False,    True,  0,  True,  False),
            ("COSMO2P8", "SE-RJ", "VTUR850",          "ur_lvl_c28",  (0, 70),  False, 0,  True,  False),
            ("COSMO2P8", "SE-RJ", "VTUR700",          "ur_lvl_c28",  (0, 70),  False, 0,  True,  False),
            ("COSMO2P8", "SE-RJ", "VTUR500",          "ur_lvl_c28",  (0, 70),  False, 0,  True,  False),
            ("COSMO2P8", "SE-RJ", "VTUR925",          "ur_lvl_c28",  (0, 70),  False, 0,  True,  False),
            ("COSMO2P8", "SE-RJ", "V200Cisal250500",  "cisal_hi",    (0, 20),  True,  0,  True,  False),
        ])
    if init_c7:
        specs.extend([
            ("COSMO7", "SE", "prec24h",               "prec24h",    "zero",   False, 24, False, False),
            ("COSMO7", "SE", "prec7dias",             "prec7dias",  "zero",   False, 0,  False, False),
            ("COSMO7", "SE", "Prec6hPressV10m",       "prec3h6h",   "zero",   False, 6,  True,  False),
            ("COSMO7", "SE", "Prec3hPressV10m",       "prec3h6h",   "zero",   False, 3,  True,  False),
            ("COSMO7", "SE", "Rajada10m",             "rajada",     (0, 14),  False, 0,  True,  False),
            ("COSMO7", "SE", "T2mPress",              "tmax_c7",    False,    True,  0,  True,  False),
            ("COSMO7", "SE", "TempMaximaV10m",        "tmax_c7",    False,    True,  3,  True,  False),
            ("COSMO7", "SE", "TempMinimaV10m",        "tmin_c7",    False,    True,  3,  True,  False),
            ("COSMO7", "SE", "UR2mV10m",              "ur",         False,    True,  0,  True,  False),
            ("COSMO7", "SE", "Kcape",                 "kcape",      True,     False, 0,  True,  False),
            ("COSMO7", "SE", "Kshow",                 "kshow",      False,    True,  0,  True,  False),
            ("COSMO7", "SE", "TotalsLifted",          "totals",     True,     False, 0,  True,  False),
            ("COSMO7", "SE", "aguaprecT850V850",      "pwat",       False,    True,  0,  True,  False),
            ("COSMO7", "SE", "NuvemTotalOmegaGeo700", "nuvem_tot",  True,     False, 0,  False, True),
            ("COSMO7", "SE", "NuvemBaixaGeoTemp850",  "nuvem_lvl",  (0, 55),  False, 0,  False, True),
            ("COSMO7", "SE", "NuvemMediaGeoTemp500",  "nuvem_lvl",  (0, 55),  False, 0,  False, True),
            ("COSMO7", "SE", "NuvemAltaV200j",        "nuvem_lvl",  (0, 55),  False, 0,  False, True),
            ("COSMO7", "SE", "O850Geo500",            "omega",      False,    True,  0,  True,  False),
            ("COSMO7", "SE", "V500Cisal700950",       "cisal_lo",   False,    True,  0,  True,  False),
            ("COSMO7", "SE", "V200Cisal250500",       "cisal_hi",   (0, 20),  True,  0,  True,  False),
            ("COSMO7", "SE", "V200j",                 "jato200",    (0, 30),  False, 0,  True,  False),
            ("COSMO7", "SE", "VTUR850",               "ur_lvl_c7",  (0, 50),  False, 0,  True,  False),
            ("COSMO7", "SE", "VTUR700",               "ur_lvl_c7",  (0, 50),  False, 0,  True,  False),
            ("COSMO7", "SE", "VTUR500",               "ur_lvl_c7",  (0, 50),  False, 0,  True,  False),
            ("COSMO7", "SE", "VTUR925",               "ur_lvl_c7",  (0, 50),  False, 0,  True,  False),
            ("COSMO7", "SE", "tendpress",             "tend_press", False,    True,  0,  True,  False),
            ("COSMO7", "SE", "tendTsup",              "tend_tsup",  False,    True,  0,  True,  False),
            ("COSMO7", "SE", "tendT850",              "tend_t850",  False,    True,  0,  True,  False),
            ("COSMO7", "SE", "tendgeop",              "tend_geop",  False,    True,  0,  True,  False),
            ("COSMO7", "SE", "VortGeo500",            "vort500",    False,    True,  0,  True,  False),
            ("COSMO7", "SE", "VortGeo850",            "vort850",    False,    True,  0,  True,  False),
        ])

    def _run_param(spec):
        mod, area, par, bkey, wmin, awhite, int_h, skip_g, g_patch = spec
        sig = init_c28 if mod == "COSMO2P8" else init_c7
        base_u = datetime.strptime(sig, "%Y-%m-%dH%H:%M").replace(tzinfo=timezone.utc)
        pts = VIME_SE_RJ_POINTS if mod == "COSMO2P8" else VIME_SE_COSMO7_POINTS
        b_sz = (683, 680) if mod == "COSMO2P8" else (700, 700)
        x1_ovr = 621 if (mod == "COSMO7" and par == "Rajada10m") else None
        bins = _VIME_BINS[bkey]
        frames = _fetch_vime_json_retry(f"https://apivime.inmet.gov.br/{mod}/{area}/{par}/{sig}", timeout=16, retries=3)
        rows = []
        for f in (frames or []):
            nome = str(f.get("nome", ""))
            m = re.search(r"\+(\d+)", nome)
            if not m or not f.get("base64"):
                continue
            off_h = int(m.group(1))
            if par == "prec24h" and mod == "COSMO7" and off_h % 24 != 0:
                continue
            if par == "prec2dias" and mod == "COSMO2P8" and off_h not in (24, 48):
                continue
            sample = _sample_vime_var_bar(
                _b64_to_pil(f["base64"]),
                bins,
                pts,
                white_min_bin=wmin,
                allow_white_bin=awhite,
                bar_x1_override=x1_ovr,
                base_size=b_sz,
                skip_neutral_grey=skip_g,
                grey_patch_check=g_patch,
            )
            if not sample:
                continue
            day_iso, hr_brt, iso_hr = _assign_vime_day_brt(base_u, off_h, is_interval_h=int_h)
            rows.append({
                "off_h": off_h,
                "day_iso": day_iso,
                "hr_brt": hr_brt,
                "iso_hr": iso_hr,
                "validade": f.get("validade_extenso"),
                **sample,
            })
        return mod, par, rows

    raw_by_mod_par = {}
    if specs:
        with ThreadPoolExecutor(max_workers=3) as ex:
            futs = {ex.submit(_run_param, s): (s[0], s[2]) for s in specs}
            for fut in as_completed(futs):
                mod, par = futs[fut]
                try:
                    m, p, rows = fut.result()
                    if rows:
                        raw_by_mod_par[(m, p)] = rows
                        result["disponivel"] = True
                except Exception as exc:
                    print(f"[VIME {mod}/{par}] Aviso: {exc}")

    # Consolida COSMO2P8 precip24h / prec2dias / hourly prec1h
    c28_p24 = raw_by_mod_par.get(("COSMO2P8", "prec24h"), [])
    v24_rep = c28_p24[0] if c28_p24 else None
    if v24_rep:
        result["daily_cosmo28_mm"][v24_rep["day_iso"]] = v24_rep["rep"]
        result["daily_cosmo28_faixa"][v24_rep["day_iso"]] = f"{v24_rep['faixa']} mm"
    c28_p48 = raw_by_mod_par.get(("COSMO2P8", "prec2dias"), [])
    if c28_p48 and v24_rep:
        last48 = max(c28_p48, key=lambda x: x["off_h"])
        if last48["off_h"] >= 36:
            d1_iso = (datetime.strptime(init_c28, "%Y-%m-%dH%H:%M").replace(tzinfo=timezone.utc) + timedelta(hours=36)).astimezone(BRT).strftime("%Y-%m-%d")
            d1_val = round(max(0.0, last48["rep"] - v24_rep["rep"]), 1)
            result["daily_cosmo28_mm"][d1_iso] = d1_val
            result["daily_cosmo28_faixa"][d1_iso] = f"{max(0, last48['min'] - v24_rep['max'])} a {max(1, last48['max'] - v24_rep['min'])} mm"

    p1h_map = {r["iso_hr"]: r for r in raw_by_mod_par.get(("COSMO2P8", "prec1h"), [])}
    pv10_map = {r["iso_hr"]: r for r in raw_by_mod_par.get(("COSMO2P8", "prevento10m"), [])}
    day_1h_counts = {}
    for iso_hr, r1 in sorted(p1h_map.items()):
        v = r1["rep"]
        if v == 0.0:
            rp = pv10_map.get(iso_hr)
            if rp and 0.4 <= rp["rep"] <= 1.0:
                v = 0.6
        d_iso = r1["day_iso"]
        result["hourly_cosmo28_mm"][iso_hr] = round(v, 2)
        result["daily_cosmo28_prec1h_mm"][d_iso] = round(result["daily_cosmo28_prec1h_mm"].get(d_iso, 0.0) + v, 1)
        day_1h_counts[d_iso] = day_1h_counts.get(d_iso, 0) + 1
    # Mantém apenas dias completos (>=12h) no acumulado horário COSMO2P8 se menor que 12h pode complementar
    for d_iso in list(result["daily_cosmo28_prec1h_mm"].keys()):
        if day_1h_counts.get(d_iso, 0) < 10 and d_iso not in result["daily_cosmo28_mm"]:
            del result["daily_cosmo28_prec1h_mm"][d_iso]

    # Séries horárias auxiliares COSMO2P8 para enriquecimento de boletim/tooltip
    for par_name, fld in [("T2m", "temp_c"), ("UR2m", "ur_pct"), ("Rajada10m", "rajada_ms")]:
        for r in raw_by_mod_par.get(("COSMO2P8", par_name), []):
            result["hourly_cosmo28_vars"].setdefault(r["iso_hr"], {})[fld] = r["rep"]

    # Consolida COSMO7 prec24h / prec6h (turnos e dia civil BRT) / prec3h
    for r in raw_by_mod_par.get(("COSMO7", "prec24h"), []):
        result["daily_cosmo7_mm"][r["day_iso"]] = r["rep"]
        result["daily_cosmo7_faixa"][r["day_iso"]] = f"{r['faixa']} mm"

    for r in raw_by_mod_par.get(("COSMO7", "Prec6hPressV10m"), []):
        d_iso = r["day_iso"]
        tk = _brt_turn_key(r["hr_brt"])
        result["daily_cosmo7_prec6h_mm"][d_iso] = round(result["daily_cosmo7_prec6h_mm"].get(d_iso, 0.0) + r["rep"], 1)
        t_dict = result["turn_cosmo7_prec_mm"].setdefault(d_iso, {"madrugada": 0.0, "manha": 0.0, "tarde": 0.0, "noite": 0.0})
        t_dict[tk] = round(t_dict.get(tk, 0.0) + r["rep"], 1)

    for r in raw_by_mod_par.get(("COSMO7", "Prec3hPressV10m"), []):
        d_iso = r["day_iso"]
        result["daily_cosmo7_prec3h_mm"][d_iso] = round(result["daily_cosmo7_prec3h_mm"].get(d_iso, 0.0) + r["rep"], 1)

    # Retrocompatibilidade raiz: agua_precipitavel & cape
    pw_src = raw_by_mod_par.get(("COSMO2P8", "aguaprecT850V850")) or raw_by_mod_par.get(("COSMO7", "aguaprecT850V850")) or []
    if pw_src:
        best_pw = min(pw_src, key=lambda x: abs(x["off_h"] - 15))
        result["agua_precipitavel"] = {
            "min": best_pw["min"], "max": best_pw["max"], "rep": best_pw["rep"],
            "faixa": best_pw["faixa"], "unidade": "mm", "validade": best_pw.get("validade"),
        }
    kc_src = raw_by_mod_par.get(("COSMO2P8", "Kcape")) or raw_by_mod_par.get(("COSMO7", "Kcape")) or []
    if kc_src:
        day0_kc = sorted({r["day_iso"] for r in kc_src})[0]
        kc_today = [r for r in kc_src if r["day_iso"] == day0_kc] or kc_src[:4]
        best_c = max(kc_today, key=lambda x: x["rep"])
        result["cape"] = {"min": best_c["min"], "max": best_c["max"], "rep": best_c["rep"], "faixa": best_c["faixa"], "unidade": "J/kg"}

    # Agrega TODAS as variáveis por dia civil BRT em daily_vime_vars[day_iso]
    by_day = {}
    for (mod, par), rows in raw_by_mod_par.items():
        for r in rows:
            by_day.setdefault(r["day_iso"], {}).setdefault((mod, par), []).append(r)

    def _agg(bucket, mod, par, mode):
        rows = bucket.get((mod, par), [])
        if not rows:
            return None
        vals = [x["rep"] for x in rows]
        if mode == "min":
            return round(min(vals), 2)
        if mode == "max":
            return round(max(vals), 2)
        if mode == "mean":
            return round(sum(vals) / len(vals), 2)
        if mode == "sum":
            return round(sum(vals), 1)
        if mode == "peak_row":
            return max(rows, key=lambda x: x["rep"])
        return None

    for d_iso in sorted(by_day.keys()):
        b = by_day[d_iso]
        dv = {}
        # 1. Temperatura (prioriza T2m 2.8km em D+0/D+1 quando tiver >=12 frames; caso contrário T2mPress COSMO7)
        t2_c28 = b.get(("COSMO2P8", "T2m"), [])
        t2_c7 = b.get(("COSMO7", "T2mPress"), [])
        if len(t2_c28) >= 12:
            dv["fonte_termica"] = "COSMO2P8"
            dv["temp_min_c"] = round(min(x["rep"] for x in t2_c28), 1)
            dv["temp_max_c"] = round(max(x["rep"] for x in t2_c28), 1)
            dv["t2m_media_c"] = round(sum(x["rep"] for x in t2_c28) / len(t2_c28), 1)
        elif t2_c7:
            dv["fonte_termica"] = "COSMO7"
            dv["temp_min_c"] = round(min(x["rep"] for x in t2_c7), 1)
            dv["temp_max_c"] = round(max(x["rep"] for x in t2_c7), 1)
            dv["t2m_media_c"] = round(sum(x["rep"] for x in t2_c7) / len(t2_c7), 1)

        tmax_map = _agg(b, "COSMO2P8", "TempMaxima", "max")
        if tmax_map is None:
            tmax_map = _agg(b, "COSMO7", "TempMaximaV10m", "max")
        tmin_map = _agg(b, "COSMO2P8", "TempMinima", "min")
        if tmin_map is None:
            tmin_map = _agg(b, "COSMO7", "TempMinimaV10m", "min")
        if tmax_map is not None:
            dv["tmax_mapa_c"] = round(tmax_map, 1)
            dv.setdefault("temp_max_c", round(tmax_map, 1))
        if tmin_map is not None:
            dv["tmin_mapa_c"] = round(tmin_map, 1)
            dv.setdefault("temp_min_c", round(tmin_map, 1))

        # 2. Umidade 2m + níveis (925, 850, 700, 500 hPa)
        ur_c28 = b.get(("COSMO2P8", "UR2m"), [])
        ur_c7 = b.get(("COSMO7", "UR2mV10m"), [])
        ur_rows = ur_c28 if len(ur_c28) >= 12 else ur_c7
        if ur_rows:
            dv["ur_min_pct"] = int(round(min(x["rep"] for x in ur_rows)))
            dv["ur_max_pct"] = int(round(max(x["rep"] for x in ur_rows)))
            dv["ur_media_pct"] = int(round(sum(x["rep"] for x in ur_rows) / len(ur_rows)))
        for lvl, k in [("VTUR925", "ur925_max_pct"), ("VTUR850", "ur850_max_pct"), ("VTUR700", "ur700_max_pct"), ("VTUR500", "ur500_max_pct")]:
            v = _agg(b, "COSMO2P8", lvl, "max")
            if v is None:
                v = _agg(b, "COSMO7", lvl, "max")
            if v is not None:
                dv[k] = int(round(v))

        # 3. Rajada máxima em 10m (0..13 m/s = sem rajada severa >=50.4 km/h; >=14 m/s = valor real da barra)
        rj28 = _agg(b, "COSMO2P8", "Rajada10m", "max")
        rj7 = _agg(b, "COSMO7", "Rajada10m", "max")
        rj_vals = [v for v in (rj28, rj7) if v is not None]
        if rj_vals:
            rj_ms = round(max(rj_vals), 1)
            dv["rajada_max_ms"] = rj_ms
            dv["rajada_max_kmh"] = round(rj_ms * 3.6, 1) if rj_ms >= 14.0 else 0.0

        # 4. Precipitações (1h, 3h, 6h, 24h) + turnos COSMO7
        if d_iso in result["daily_cosmo28_prec1h_mm"]:
            dv["prec1h_sum_mm"] = result["daily_cosmo28_prec1h_mm"][d_iso]
        p1h_max = _agg(b, "COSMO2P8", "prec1h", "max")
        if p1h_max is not None:
            dv["prec1h_max_mm"] = round(p1h_max, 1)
        if d_iso in result["daily_cosmo7_prec3h_mm"]:
            dv["prec3h_sum_mm"] = result["daily_cosmo7_prec3h_mm"][d_iso]
        if d_iso in result["daily_cosmo7_prec6h_mm"]:
            dv["prec6h_sum_mm"] = result["daily_cosmo7_prec6h_mm"][d_iso]
        if d_iso in result["daily_cosmo28_mm"]:
            dv["prec24h_cosmo28_mm"] = result["daily_cosmo28_mm"][d_iso]
        if d_iso in result["daily_cosmo7_mm"]:
            dv["prec24h_cosmo7_mm"] = result["daily_cosmo7_mm"][d_iso]
        if d_iso in result["turn_cosmo7_prec_mm"]:
            dv["turnos_prec_mm"] = result["turn_cosmo7_prec_mm"][d_iso]

        # 5. Instabilidade e Água Precipitável
        pw_rows = b.get(("COSMO2P8", "aguaprecT850V850"), []) or b.get(("COSMO7", "aguaprecT850V850"), [])
        if pw_rows:
            pk_pw = max(pw_rows, key=lambda x: x["rep"])
            dv["pwat_min_mm"] = round(min(x["rep"] for x in pw_rows), 1)
            dv["pwat_max_mm"] = round(pk_pw["rep"], 1)
            dv["pwat_media_mm"] = round(sum(x["rep"] for x in pw_rows) / len(pw_rows), 1)
            dv["pwat_faixa"] = f"{pk_pw['min']} a {pk_pw['max']} mm"

        kc_rows = b.get(("COSMO2P8", "Kcape"), []) or b.get(("COSMO7", "Kcape"), [])
        if kc_rows:
            pk_kc = max(kc_rows, key=lambda x: x["rep"])
            dv["cape_max_jkg"] = int(round(pk_kc["rep"]))
            dv["cape_faixa"] = f"{pk_kc['min']} a {pk_kc['max']} J/kg"

        ks = _agg(b, "COSMO2P8", "Kshow", "min")
        if ks is None:
            ks = _agg(b, "COSMO7", "Kshow", "min")
        if ks is not None:
            dv["showalter_min"] = round(ks, 1)

        tt = _agg(b, "COSMO2P8", "TotalsLifted", "max")
        if tt is None:
            tt = _agg(b, "COSMO7", "TotalsLifted", "max")
        if tt is not None:
            dv["total_totals_max"] = round(tt, 1)

        # 6. Nebulosidade, Movimento Vertical (Ômega), Cisalhamento, Jato 200 e Tendências Sinóticas (COSMO7)
        nt_mean = _agg(b, "COSMO7", "NuvemTotalOmegaGeo700", "mean")
        nt_max = _agg(b, "COSMO7", "NuvemTotalOmegaGeo700", "max")
        if nt_mean is not None:
            dv["nuvem_total_media_pct"] = int(round(nt_mean))
            dv["nuvem_total_max_pct"] = int(round(nt_max))
        for pcol, key in [("NuvemBaixaGeoTemp850", "nuvem_baixa_max_pct"), ("NuvemMediaGeoTemp500", "nuvem_media_max_pct"), ("NuvemAltaV200j", "nuvem_alta_max_pct")]:
            nv = _agg(b, "COSMO7", pcol, "max")
            if nv is not None:
                dv[key] = int(round(nv))

        om_min = _agg(b, "COSMO7", "O850Geo500", "min")
        om_max = _agg(b, "COSMO7", "O850Geo500", "max")
        if om_min is not None:
            dv["omega850_min_pas"] = round(om_min, 2)
            dv["omega850_max_pas"] = round(om_max, 2)

        c79 = _agg(b, "COSMO7", "V500Cisal700950", "max")
        if c79 is not None:
            dv["cisal_700_950_max_ms"] = round(c79, 1)

        c25 = _agg(b, "COSMO2P8", "V200Cisal250500", "max")
        c25_7 = _agg(b, "COSMO7", "V200Cisal250500", "max")
        c25_vals = [x for x in (c25, c25_7) if x is not None]
        if c25_vals:
            dv["cisal_250_500_max_ms"] = round(max(c25_vals), 1)

        j200 = _agg(b, "COSMO7", "V200j", "max")
        if j200 is not None:
            dv["jato200_max_ms"] = round(j200, 1)

        tp_min = _agg(b, "COSMO7", "tendpress", "min")
        tp_max = _agg(b, "COSMO7", "tendpress", "max")
        if tp_min is not None:
            dv["tend_press_min_hpa"] = round(tp_min, 1)
            dv["tend_press_max_hpa"] = round(tp_max, 1)

        tts_min = _agg(b, "COSMO7", "tendTsup", "min")
        tts_max = _agg(b, "COSMO7", "tendTsup", "max")
        if tts_min is not None:
            dv["tend_t2m_min_c"] = round(tts_min, 1)
            dv["tend_t2m_max_c"] = round(tts_max, 1)

        tt8_min = _agg(b, "COSMO7", "tendT850", "min")
        tt8_max = _agg(b, "COSMO7", "tendT850", "max")
        if tt8_min is not None:
            dv["tend_t850_min_c"] = round(tt8_min, 1)
            dv["tend_t850_max_c"] = round(tt8_max, 1)

        tg_min = _agg(b, "COSMO7", "tendgeop", "min")
        if tg_min is not None:
            dv["tend_geop500_min_mgp"] = round(tg_min, 1)

        v5_min = _agg(b, "COSMO7", "VortGeo500", "min")
        if v5_min is not None:
            dv["vort500_min"] = round(v5_min, 1)
        v8_min = _agg(b, "COSMO7", "VortGeo850", "min")
        if v8_min is not None:
            dv["vort850_min"] = round(v8_min, 1)

        dv["parametros_lidos"] = len(b)
        result["daily_vime_vars"][d_iso] = dv

    result["resumo_variaveis_extraidas"] = {
        "cosmo2p8_parametros": sorted([p for (m, p) in raw_by_mod_par.keys() if m == "COSMO2P8"]),
        "cosmo7_parametros": sorted([p for (m, p) in raw_by_mod_par.keys() if m == "COSMO7"]),
        "total_endpoints_lidos": len(raw_by_mod_par),
        "dias_cobertos": sorted(result["daily_vime_vars"].keys()),
    }

    if result["disponivel"]:
        try:
            vime_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception:
            pass
    elif cached and cached.get("disponivel"):
        cached["cached_fallback"] = True
        return cached
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



# ==============================================================================
# 6. DETECÇÃO DE RAIOS EM TEMPO REAL VIA SATÉLITE (NOAA GOES-19 GLM-L2-LCFA)
# ==============================================================================
def _azimuth_cardinal_br(dlat, dlon):
    import math
    ang = (math.degrees(math.atan2(dlon * math.cos(math.radians(-22.5269)), dlat)) + 360.0) % 360.0
    dirs = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"]
    return dirs[int((ang + 22.5) // 45) % 8]


def extract_goes_glm_lightning(data_dir=None, window_minutes=20, radius_km=50.0):
    """Lê descargas elétricas reais detectadas pelo sensor GLM do satélite GOES-19 (NOAA S3)."""
    import io
    import math
    import xml.etree.ElementTree as ET

    now_u = datetime.now(timezone.utc)
    now_b = now_u.astimezone(BRT)
    res = {
        "disponivel": False,
        "fonte": "NOAA GOES-19 GLM-L2-LCFA (Satélite Geoestacionário)",
        "captura_utc": now_u.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "captura_brt": now_b.strftime("%Y-%m-%d %H:%M"),
        "janela_minutos": int(window_minutes),
        "raio_busca_km": int(radius_km),
        "raios_25km": 0,
        "raios_50km": 0,
        "dist_min_km": None,
        "dir_min": None,
        "ultimo_raio_brt": None,
        "ultimo_raio_iso": None,
        "atividade_ativa": False,
    }
    try:
        import h5py
    except ImportError:
        return res

    target_lat, target_lon = -22.5269, -41.9450
    max_granules = max(15, int(window_minutes * 3))
    cache_p = Path(data_dir) / "glm_granules_cache.json" if data_dir else None
    gran_cache = {}
    if cache_p and cache_p.exists():
        try:
            gran_cache = json.loads(cache_p.read_text(encoding="utf-8"))
        except Exception:
            gran_cache = {}

    try:
        keys = []
        hours_check = sorted({
            (now_u.replace(minute=0, second=0, microsecond=0) - timedelta(hours=h))
            for h in (1, 0)
        })
        for dt_h in hours_check:
            y, j, hh = dt_h.strftime("%Y"), dt_h.strftime("%j"), dt_h.strftime("%H")
            list_url = f"https://noaa-goes19.s3.amazonaws.com/?list-type=2&prefix=GLM-L2-LCFA/{y}/{j}/{hh}/"
            req = urllib.request.Request(list_url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=10, context=SSL_CTX) as resp:
                root = ET.fromstring(resp.read())
            for el in root.findall(".//{http://s3.amazonaws.com/doc/2006-03-01/}Key"):
                if el.text and el.text.endswith(".nc"):
                    keys.append(el.text)
        keys = sorted(keys)[-max_granules:]
        if not keys:
            return res

        # Atualiza cache somente dos grânulos novos (20s cada)
        missing = [k for k in keys if k not in gran_cache]

        def _fetch_gran(k):
            g_url = f"https://noaa-goes19.s3.amazonaws.com/{k}"
            req_g = urllib.request.Request(g_url, headers=HEADERS)
            with urllib.request.urlopen(req_g, timeout=12, context=SSL_CTX) as rg:
                raw = rg.read()
            fname = k.split("/")[-1]
            t_str = fname.split("_s")[1][:13]
            dt_g_u = datetime.strptime(t_str, "%Y%j%H%M%S").replace(tzinfo=timezone.utc)
            pts = []
            with h5py.File(io.BytesIO(raw), "r") as ds:
                if "flash_lat" not in ds:
                    return k, []
                lats = np.array(ds["flash_lat"][:])
                lons = np.array(ds["flash_lon"][:])
                qflags = np.array(ds["flash_quality_flag"][:]) if "flash_quality_flag" in ds else np.zeros(len(lats))
                for la, lo, qf in zip(lats, lons, qflags):
                    if int(qf) != 0:
                        continue
                    fla, flo = float(la), float(lo)
                    if abs(fla - target_lat) > 1.2 or abs(flo - target_lon) > 1.2:
                        continue
                    p1, p2 = math.radians(fla), math.radians(target_lat)
                    dp, dl = math.radians(target_lat - fla), math.radians(target_lon - flo)
                    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
                    dist_km = round(2.0 * 6371.0 * math.asin(min(1.0, math.sqrt(a))), 1)
                    if dist_km <= max(60.0, float(radius_km)):
                        pts.append([
                            dt_g_u.isoformat(),
                            round(fla, 4),
                            round(flo, 4),
                            dist_km,
                            _azimuth_cardinal_br(fla - target_lat, flo - target_lon),
                        ])
            return k, pts

        if missing:
            with ThreadPoolExecutor(max_workers=6) as ex:
                for fut in [ex.submit(_fetch_gran, mk) for mk in missing]:
                    try:
                        k_res, pts_res = fut.result()
                        gran_cache[k_res] = pts_res
                    except Exception:
                        pass

        # Prune cache para manter no máximo últimos 90 grânulos
        trimmed = {k: gran_cache[k] for k in sorted(gran_cache.keys())[-90:] if k in gran_cache}
        if cache_p:
            try:
                cache_p.write_text(json.dumps(trimmed, ensure_ascii=False), encoding="utf-8")
            except Exception:
                pass

        flashes = []
        for k in keys:
            for item in trimmed.get(k, []):
                if item[3] <= radius_km:
                    flashes.append(item)

        res["disponivel"] = True
        cnt_50 = len(flashes)
        cnt_25 = sum(1 for f in flashes if f[3] <= 25.0)
        res["raios_25km"] = cnt_25
        res["raios_50km"] = cnt_50
        if flashes:
            closest = min(flashes, key=lambda x: x[3])
            latest = max(flashes, key=lambda x: x[0])
            dt_lat_brt = datetime.fromisoformat(latest[0]).astimezone(BRT)
            res["dist_min_km"] = closest[3]
            res["dir_min"] = closest[4]
            res["ultimo_raio_iso"] = dt_lat_brt.isoformat()
            res["ultimo_raio_brt"] = dt_lat_brt.strftime("%H:%M")
        res["atividade_ativa"] = bool(cnt_25 >= 1 or cnt_50 >= 2)
    except Exception as exc:
        print(f"[GOES-19 GLM Raios] Aviso: {exc}")
    return res


def extract_all_official_rain_sources(img_dir, data_dir):
    """Executa todos os extratores oficiais brasileiros e modelos globais (ECMWF/GFS/ICON) e consolida."""
    inmet_cosmo_met = extract_inmet_cosmo_meteograma(img_dir, data_dir)
    inmet_vime = extract_inmet_vime_data(data_dir)
    cptec_extra = extract_cptec_wrf_and_prob(img_dir)
    inea_radartool = extract_inea_radartool_status(data_dir)
    global_nwp = extract_global_nwp_models(data_dir)
    goes_glm_raios = extract_goes_glm_lightning(data_dir)
    return {
        "inmet_cosmo_meteograma": inmet_cosmo_met,
        "inmet_vime": inmet_vime,
        "cptec_wrf": cptec_extra["wrf"],
        "cptec_prob_p05": cptec_extra["prob_p05_by_day"],
        "inea_radartool": inea_radartool,
        "global_nwp": global_nwp,
        "atividade_raios": goes_glm_raios,
    }
