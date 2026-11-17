"""
Módulo de Integração com o Sistema de Alerta de Cheias do INEA (RJ)
Extrai o Boletim Hidrometeorológico Oficial diário da Sala de Situação
(https://alertadecheias.inea.rj.gov.br/analise.php) analisando diretamente
o PDF publicado (mapa RH-VIII / Rio das Ostras vs. legenda RGB, ícones,
temperaturas e texto meteorológico oficial por OCR).
"""

from collections import Counter
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import ssl
import subprocess
import tempfile
import urllib.request

BRT = timezone(timedelta(hours=-3))

INEA_ANALISE_URLS = [
    "https://alertadecheias.inea.rj.gov.br/analise.php",
    "http://alertadecheias.inea.rj.gov.br/analise.php",
]
INEA_BASE_BOLETIM_URL = "https://alertadecheias.inea.rj.gov.br/alertadecheias/boletim/"
OUTPUT_JSON = os.path.join(os.path.dirname(__file__), "..", "data", "inea_alerta_cheias_boletim.json")
OUTPUT_PDF = os.path.join(os.path.dirname(__file__), "..", "data", "inea_boletim_today.pdf")

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

LEGEND_BINS = [
    ("> 100 mm", 100.0, 150.0, 0.222, (0, 35, 125)),
    ("75 a 100 mm", 75.0, 100.0, 0.246, (0, 49, 172)),
    ("50 a 75 mm", 50.0, 75.0, 0.269, (0, 61, 212)),
    ("25 a 50 mm", 25.0, 50.0, 0.292, (35, 99, 254)),
    ("10 a 25 mm", 10.0, 25.0, 0.315, (110, 147, 253)),
    ("1 a 10 mm", 1.0, 10.0, 0.338, (192, 206, 253)),
    ("0 a 1 mm", 0.0, 1.0, 0.361, (243, 243, 243)),
]

# Pontos verificados estritamente dentro do polígono de Rio das Ostras no mapa do INEA
RO_SAMPLE_POINTS = [
    (0.756, 0.451),
    (0.761, 0.451),
    (0.766, 0.450),
    (0.760, 0.455),
    (0.764, 0.447),
    (0.755, 0.453),
]

# Pontos verificados dentro da Bacia RH-VIII (Macaé & Rio das Ostras), evitando rótulo/bordas
RH8_SAMPLE_POINTS = RO_SAMPLE_POINTS + [
    (0.735, 0.415),
    (0.748, 0.413),
    (0.762, 0.414),
    (0.776, 0.416),
    (0.788, 0.418),
    (0.793, 0.426),
    (0.784, 0.434),
    (0.705, 0.436),
    (0.715, 0.444),
    (0.730, 0.444),
    (0.695, 0.444),
]


def _now_brt():
    return datetime.now(BRT)


def fetch_latest_bulletin_info():
    """Varre a página analise.php do Alerta de Cheias e localiza o boletim diário mais recente."""
    for url in INEA_ANALISE_URLS:
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
            )
            with urllib.request.urlopen(req, context=SSL_CTX, timeout=14) as response:
                raw_bytes = response.read()
                try:
                    html = raw_bytes.decode("utf-8")
                except UnicodeDecodeError:
                    html = raw_bytes.decode("latin1", "ignore")

            matches = re.findall(
                r'<option[^>]*value=[\'"](BoletimHidrometeorologico_([0-9]{2}-[0-9]{2}-[0-9]{4})\.pdf)[\'"][^>]*>([^<]+)</option>',
                html,
                re.I,
            )
            if matches:
                filename, date_str, label = matches[0]
                return {
                    "disponivel": True,
                    "arquivo": filename,
                    "data_boletim": date_str.replace("-", "/"),
                    "label": label.strip(),
                    "url_pdf": INEA_BASE_BOLETIM_URL + filename,
                    "fonte_pagina": url,
                }
        except Exception as e:
            print(f"[AVISO] Falha ao consultar {url}: {e}")

    today_br = _now_brt().strftime("%d/%m/%Y")
    today_file = _now_brt().strftime("%d-%m-%Y")
    return {
        "disponivel": True,
        "arquivo": f"BoletimHidrometeorologico_{today_file}.pdf",
        "data_boletim": today_br,
        "label": f"Boletim Hidrometeorológico {today_br}",
        "url_pdf": f"{INEA_BASE_BOLETIM_URL}BoletimHidrometeorologico_{today_file}.pdf",
        "fonte_pagina": INEA_ANALISE_URLS[0],
    }


def download_bulletin_pdf(pdf_url, target_path):
    """Faz download do PDF oficial para análise local."""
    urls_to_try = [pdf_url]
    if pdf_url.startswith("https://"):
        urls_to_try.append("http://" + pdf_url[len("https://"):])
    for u in urls_to_try:
        try:
            req = urllib.request.Request(
                u,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
            )
            with urllib.request.urlopen(req, context=SSL_CTX, timeout=20) as response:
                pdf_bytes = response.read()
                if len(pdf_bytes) > 5000 and pdf_bytes[:4] == b"%PDF":
                    os.makedirs(os.path.dirname(target_path), exist_ok=True)
                    with open(target_path, "wb") as f:
                        f.write(pdf_bytes)
                    return len(pdf_bytes)
        except Exception as e:
            print(f"[AVISO] Falha ao baixar PDF ({u}): {e}")
    return 0


def _ocr_crops_tesseract(crops):
    """Executa OCR via Tesseract CLI (usado no Linux/Ubuntu CI ou quando instalado localmente)."""
    tess = shutil.which("tesseract")
    if not tess:
        return {}
    out = {}
    lang_list = subprocess.run([tess, "--list-langs"], capture_output=True, text=True).stdout
    lang = "por" if "por" in lang_list else "eng"
    for key, (img, psm) in crops.items():
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            p = tmp.name
        try:
            w, h = img.size
            if h < 120:
                from PIL import Image
                img = img.resize((w * 3, h * 3), Image.Resampling.LANCZOS)
            img.save(p)
            res = subprocess.run(
                [tess, p, "stdout", "-l", lang, "--psm", str(psm)],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=15,
            )
            out[key] = re.sub(r"\s+", " ", res.stdout or "").strip()
        except Exception:
            out[key] = ""
        finally:
            if os.path.exists(p):
                os.unlink(p)
    return out


def _ocr_crops_windows(crops):
    """Fallback nativo Windows.Media.Ocr em lote quando executado localmente no Windows."""
    if os.name != "nt":
        return {}
    paths = {}
    try:
        from PIL import Image
        for key, (img, _psm) in crops.items():
            w, h = img.size
            if h < 120:
                img = img.resize((w * 3, h * 3), Image.Resampling.LANCZOS)
            p = os.path.join(tempfile.gettempdir(), f"_inea_ocr_{os.getpid()}_{key}.png")
            img.convert("RGB").save(p)
            paths[key] = p
        items_ps = ", ".join([f'@{{k="{k}"; p="{v}"}}' for k, v in paths.items()])
        ps = f'''
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType=WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime]
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {{ $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' }})[0]
function Await($op, $t) {{ $m = $asTaskGeneric.MakeGenericMethod($t); $task = $m.Invoke($null, @($op)); $task.Wait(-1) | Out-Null; return $task.Result }}
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
$out = @{{}}
foreach ($it in @({items_ps})) {{
  $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($it.p)) ([Windows.Storage.StorageFile])
  $stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
  $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bmp = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $res = Await ($engine.RecognizeAsync($bmp)) ([Windows.Media.Ocr.OcrResult])
  $stream.Dispose()
  $out[$it.k] = $res.Text
}}
$out | ConvertTo-Json -Compress
'''
        raw = subprocess.check_output(
            ["powershell", "-NoProfile", "-Command", ps],
            text=True,
            encoding="utf-8",
            timeout=25,
        )
        return json.loads(raw)
    except Exception as e:
        print(f"[AVISO] OCR Windows fallback erro: {e}")
        return {}
    finally:
        for p in paths.values():
            if os.path.exists(p):
                try:
                    os.unlink(p)
                except OSError:
                    pass


def _binarize_dark(img, thresh=115):
    gray = img.convert("L")
    return gray.point(lambda p: 0 if p < thresh else 255).convert("RGB")


def _binarize_red_pub(img):
    import numpy as np
    from PIL import Image
    arr = np.array(img.convert("RGB"))
    # Texto "Publicado em ..." usa fonte vermelha sobre fundo claro
    mask = (arr[:, :, 0] > 110) & (arr[:, :, 1] < 95) & (arr[:, :, 2] < 95)
    out = np.full_like(arr, 255)
    out[mask] = (0, 0, 0)
    return Image.fromarray(out)


def _clean_temp_ocr(txt):
    if not txt:
        return None
    # OCR frequentemente lê o símbolo ° como 0 (ex: "320" -> "32", "210" -> "21")
    m = re.search(r"(\d{2,3})", txt)
    if not m:
        return None
    val = int(m.group(1)[:2])
    return val if 8 <= val <= 45 else None


def _clean_ocr_paragraph(txt):
    if not txt:
        return ""
    txt = re.sub(r"\s+", " ", txt).strip()
    # Corrige inversão ocasional da 1ª linha de OCR ("- feira, o transporte... Nesta terça")
    m_inv = re.match(
        r"^[-–]?\s*feira,\s*(.+?)\s+((?:Nesta|Na|Neste|No)\s+(?:segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo))\b(.*)$",
        txt,
        re.I,
    )
    if m_inv:
        txt = f"{m_inv.group(2)}-feira, {m_inv.group(1)}{m_inv.group(3)}"
    txt = re.sub(r"\s*-\s*feira\b", "-feira", txt)
    return txt.strip()


def _extract_date_from_ocr(txt, fallback_date_str):
    if txt:
        m = re.search(r"(\d{2})[/|1](\d{2})[/|1](20\d{2})", txt)
        if m:
            d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
            if 1 <= d <= 31 and 1 <= mo <= 12:
                return f"{d:02d}/{mo:02d}/{y}"
    return fallback_date_str


def _extract_river_sentence(body_txt):
    if not body_txt:
        return "Sem elevação expressiva prevista para os rios da bacia, mantendo monitoramento contínuo."
    sentences = re.split(r"(?<=[.!?])\s+", body_txt)
    for s in sentences:
        sl = s.lower()
        if "rio de janeiro" in sl and not any(k in sl for k in ["rios monitorados", "níveis dos rios", "niveis dos rios", "eleva", "itabapoana"]):
            continue
        if any(k in sl for k in ["níveis", "niveis", "eleva", "rios monitorados", "itabapoana", "estágio", "estagio", "alerta"]):
            if not sl.startswith("as temperaturas"):
                return s.strip()
    return "Acompanhamento hidrometeorológico contínuo nos rios da Região Hidrográfica RH-VIII."


def _classify_intensity_label(bmin, body_txt, has_lightning):
    bl = (body_txt or "").lower()
    if bmin >= 50:
        base = "Chuva Forte a Muito Forte"
    elif bmin >= 25:
        base = "Chuva Moderada a Forte"
    elif bmin >= 10:
        base = "Pancadas de Chuva Moderada" if "pancada" in bl else "Chuva Moderada"
    elif bmin >= 1:
        if "pancada" in bl:
            base = "Pancadas de Chuva Isoladas"
        elif "fraca" in bl and "moderada" in bl:
            base = "Chuva Fraca, Pontualmente Moderada"
        else:
            base = "Chuva Fraca a Pontualmente Moderada"
    else:
        base = "Pancadas Isoladas (Baixo Acumulado na Orla)" if "pancada" in bl else "Chuva Fraca / Chuvisco Isolado"

    if (has_lightning or "raios" in bl or "descarga" in bl) and "raio" not in base.lower():
        base += " com Raios"
    return base


def _parse_single_page(pil_img, page_idx, base_dt):
    """Analisa uma página do boletim INEA combinando amostragem RGB do mapa e OCR."""
    import numpy as np

    pil_rgb = pil_img.convert("RGB")
    arr = np.array(pil_rgb, dtype=np.float32)
    h, w, _ = arr.shape

    cx_leg = int(w * 0.061)
    palette = []
    for label, bmin, bmax, ny, _default_rgb in LEGEND_BINS:
        cy = int(h * ny)
        rgb = arr[cy - 3:cy + 4, cx_leg - 3:cx_leg + 4].mean(axis=(0, 1))
        palette.append((label, bmin, bmax, rgb))

    def sample_region(pts):
        hits = []
        for nx, ny in pts:
            x, y = int(w * nx), int(h * ny)
            patch = arr[y - 1:y + 2, x - 1:x + 2].mean(axis=(0, 1))
            dists = [(float(np.linalg.norm(patch - p[3])), p) for p in palette]
            best_d, best_p = min(dists, key=lambda t: t[0])
            if best_d < 42.0:
                hits.append(best_p)
        return hits

    ro_hits = sample_region(RO_SAMPLE_POINTS)
    rh8_hits = sample_region(RH8_SAMPLE_POINTS)
    if not ro_hits and rh8_hits:
        ro_hits = rh8_hits
    if not rh8_hits:
        return None, None

    ro_top_label = Counter([p[0] for p in ro_hits]).most_common(1)[0][0]
    ro_top_bin = next(p for p in palette if p[0] == ro_top_label)
    rh8_top_label = Counter([p[0] for p in rh8_hits]).most_common(1)[0][0]

    bmin_ro, bmax_ro = ro_top_bin[1], ro_top_bin[2]
    bmin_rh8 = min(p[1] for p in rh8_hits)
    bmax_rh8 = max(p[2] for p in rh8_hits)
    faixa_display = (
        ro_top_label
        if ro_top_label == rh8_top_label
        else f"{ro_top_label} (Orla) / {rh8_top_label} (Bacia RH-VIII)"
    )

    bolt_patch = arr[int(h * 0.465):int(h * 0.486), int(w * 0.835):int(w * 0.862)]
    has_lightning = int(np.sum((bolt_patch[:, :, 0] > 235) & (bolt_patch[:, :, 1] > 180) & (bolt_patch[:, :, 2] < 90))) > 25
    rain_patch = arr[int(h * 0.466):int(h * 0.485), int(w * 0.820):int(w * 0.868)]
    has_rain_icon = int(np.sum((rain_patch[:, :, 0] < 90) & (rain_patch[:, :, 1] > 200) & (rain_patch[:, :, 2] > 220))) > 20

    crops = {
        "pub": (_binarize_red_pub(pil_rgb.crop((int(w * 0.44), int(h * 0.105), int(w * 0.95), int(h * 0.145)))), 7),
        "date": (_binarize_dark(pil_rgb.crop((int(w * 0.15), int(h * 0.175), int(w * 0.86), int(h * 0.212))), 110), 7),
        "tmax": (_binarize_dark(pil_rgb.crop((int(w * 0.875), int(h * 0.448), int(w * 0.935), int(h * 0.471))), 120), 7),
        "tmin": (_binarize_dark(pil_rgb.crop((int(w * 0.875), int(h * 0.469), int(w * 0.935), int(h * 0.491))), 120), 7),
        "body": (_binarize_dark(pil_rgb.crop((int(w * 0.02), int(h * 0.640), int(w * 0.98), int(h * 0.890))), 115), 6),
    }
    ocr_res = _ocr_crops_tesseract(crops)
    if not any(ocr_res.values()):
        ocr_res = _ocr_crops_windows(crops)

    fallback_date = (base_dt + timedelta(days=page_idx)).strftime("%d/%m/%Y")
    data_prev = _extract_date_from_ocr(ocr_res.get("date", ""), fallback_date)

    pub_found = None
    if ocr_res.get("pub"):
        m_pub = re.search(r"(\d{2}/\d{2}/20\d{2}).{0,6}(\d{2}h\d{2})", ocr_res["pub"])
        if m_pub:
            pub_found = f"{m_pub.group(1)} às {m_pub.group(2)}"

    tmax_val = _clean_temp_ocr(ocr_res.get("tmax", ""))
    tmin_val = _clean_temp_ocr(ocr_res.get("tmin", ""))
    if tmax_val is not None and tmin_val is not None and tmin_val > tmax_val:
        tmax_val, tmin_val = tmin_val, tmax_val

    body_clean = _clean_ocr_paragraph(ocr_res.get("body", ""))
    intensidade = _classify_intensity_label(bmin_ro, body_clean, has_lightning)
    if not body_clean:
        body_clean = (
            f"Mapa oficial da Sala de Situação INEA indica faixa de precipitação de {faixa_display} para a Região Hidrográfica RH-VIII "
            "(Rio das Ostras e Macaé)."
        )
    rio_txt = _extract_river_sentence(body_clean)
    chuva_rep_ro = round(bmin_ro + (0.25 * (bmax_ro - bmin_ro) if bmax_ro <= 10.0 else 0.35 * (bmax_ro - bmin_ro)), 1)

    parsed_page = {
        "data": data_prev,
        "intensidade": intensidade,
        "faixa_chuva_mm": faixa_display,
        "faixa_municipio_mm": ro_top_label,
        "faixa_bacia_mm": rh8_top_label,
        "chuva_min_mm": bmin_ro,
        "chuva_max_mm": bmax_ro,
        "chuva_bacia_min_mm": bmin_rh8,
        "chuva_bacia_max_mm": bmax_rh8,
        "chuva_referencia_mm": chuva_rep_ro,
        "tem_raios_icone": has_lightning,
        "tem_chuva_icone": has_rain_icon,
        "temp_max": tmax_val,
        "temp_min": tmin_val,
        "condicao": body_clean,
        "comportamento_rios": rio_txt,
        "modelo_meteorologico": "COSMO / INMET adaptado pela Sala de Situação INEA",
        "extraido_pdf": True,
    }
    return parsed_page, pub_found


def parse_inea_bulletin_pdf(pdf_path, bulletin_date_br):
    """Extrai dados reais das páginas D+0 e D+1 do PDF oficial do INEA."""
    try:
        import numpy as np  # noqa: F401
        import pypdfium2
        from PIL import Image  # noqa: F401
    except Exception as e:
        print(f"[AVISO] Dependências de parsing de PDF indisponíveis: {e}")
        return None

    doc = pypdfium2.PdfDocument(str(pdf_path))
    if len(doc) == 0:
        return None

    try:
        base_dt = datetime.strptime(bulletin_date_br, "%d/%m/%Y")
    except Exception:
        base_dt = _now_brt()

    pages_parsed = []
    publicado_em = None
    for page_idx in range(min(2, len(doc))):
        pil_img = doc[page_idx].render(scale=2.0).to_pil()
        parsed_page, pub_found = _parse_single_page(pil_img, page_idx, base_dt)
        if parsed_page:
            pages_parsed.append(parsed_page)
        if not publicado_em and pub_found:
            publicado_em = pub_found

    if not pages_parsed:
        return None

    return {
        "publicado_em": publicado_em,
        "hoje": pages_parsed[0],
        "amanha": pages_parsed[1] if len(pages_parsed) > 1 else None,
    }


def get_hydro_forecast_summary():
    """
    Gera o resumo estruturado da previsão hidrometeorológica oficial
    do Alerta de Cheias do INEA para RH-VIII (Rio das Ostras), lendo o PDF oficial real.
    """
    info = fetch_latest_bulletin_info()
    now = _now_brt()
    d0_str = info.get("data_boletim") or now.strftime("%d/%m/%Y")
    try:
        d1_str = (datetime.strptime(d0_str, "%d/%m/%Y") + timedelta(days=1)).strftime("%d/%m/%Y")
    except Exception:
        d1_str = (now + timedelta(days=1)).strftime("%d/%m/%Y")

    pdf_size = 0
    if info.get("disponivel") and info.get("url_pdf"):
        pdf_size = download_bulletin_pdf(info["url_pdf"], OUTPUT_PDF)

    pdf_sha = None
    parsed = None
    if os.path.exists(OUTPUT_PDF) and os.path.getsize(OUTPUT_PDF) > 5000:
        raw_pdf = Path(OUTPUT_PDF).read_bytes()
        pdf_sha = hashlib.sha256(raw_pdf).hexdigest()[:16]
        parsed = parse_inea_bulletin_pdf(OUTPUT_PDF, d0_str)

    if not parsed:
        # Se o mesmo PDF já tiver sido parseado antes com sucesso, reaproveita sem inventar texto
        if os.path.exists(OUTPUT_JSON):
            try:
                prev = json.loads(Path(OUTPUT_JSON).read_text(encoding="utf-8"))
                if prev.get("fonte_pdf_sha256") == pdf_sha and prev.get("previsao_rh8", {}).get("hoje", {}).get("extraido_pdf"):
                    prev["data_coleta"] = now.strftime("%Y-%m-%d %H:%M:%S BRT")
                    prev["bulletin_info"] = info
                    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
                        json.dump(prev, f, ensure_ascii=False, indent=2)
                    return prev
            except Exception:
                pass

        parsed = {
            "publicado_em": None,
            "hoje": {
                "data": d0_str,
                "intensidade": "Aguardando leitura do boletim diário INEA",
                "faixa_chuva_mm": "Indisponível nesta coleta",
                "faixa_municipio_mm": None,
                "chuva_min_mm": None,
                "chuva_max_mm": None,
                "temp_max": None,
                "temp_min": None,
                "condicao": f"Boletim Hidrometeorológico {info.get('arquivo', '')} localizado, porém a leitura automática do mapa não pôde ser concluída nesta rodada.",
                "comportamento_rios": "Consulte a telemetria em tempo real do Rio Jundiá (estação 2241036).",
                "modelo_meteorologico": "COSMO / INMET adaptado pela Sala de Situação INEA",
                "extraido_pdf": False,
            },
            "amanha": {
                "data": d1_str,
                "intensidade": "Aguardando leitura do boletim diário INEA",
                "faixa_chuva_mm": "Indisponível nesta coleta",
                "faixa_municipio_mm": None,
                "chuva_min_mm": None,
                "chuva_max_mm": None,
                "temp_max": None,
                "temp_min": None,
                "condicao": "Sem extração confirmada para o dia seguinte nesta coleta.",
                "comportamento_rios": "Acompanhamento contínuo dos postos fluviométricos RH-VIII.",
                "modelo_meteorologico": "COSMO / INMET adaptado pela Sala de Situação INEA",
                "extraido_pdf": False,
            },
        }

    bulletin_data = {
        "orgao": "Instituto Estadual do Ambiente - INEA",
        "sistema": "Sistema de Alerta de Cheias",
        "sala_situacao": "Sala de Situação INEA",
        "titulo": "Boletim Hidrometeorológico Oficial",
        "regiao_hidrografica": "RH-VIII - Bacia dos Rios Macaé e Rio das Ostras",
        "data_coleta": now.strftime("%Y-%m-%d %H:%M:%S BRT"),
        "publicado_em": parsed.get("publicado_em"),
        "fonte_pdf_sha256": pdf_sha,
        "pdf_bytes": pdf_size or (os.path.getsize(OUTPUT_PDF) if os.path.exists(OUTPUT_PDF) else 0),
        "bulletin_info": info,
        "previsao_rh8": {
            "hoje": parsed["hoje"],
            "amanha": parsed.get("amanha"),
        },
        "contato_sala_situacao": "(21) 2334-9307",
        "url_oficial": "https://alertadecheias.inea.rj.gov.br/analise.php",
    }

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(bulletin_data, f, ensure_ascii=False, indent=2)

    return bulletin_data


if __name__ == "__main__":
    res = get_hydro_forecast_summary()
    print("Boletim INEA atualizado com sucesso:")
    print(f"Publicado em: {res.get('publicado_em')} | PDF SHA: {res.get('fonte_pdf_sha256')}")
    for k in ["hoje", "amanha"]:
        item = res["previsao_rh8"].get(k)
        if item:
            print(f"  {k.upper()} ({item['data']}): {item['faixa_chuva_mm']} | {item['temp_min']}°/{item['temp_max']}°C | {item['intensidade']}")
            print(f"    Condição: {item['condicao']}")
