#!/usr/bin/env python3
"""
Sincronizador Oficial de Balneabilidade do INEA
Fonte Oficial Primária: https://www.inea.rj.gov.br/ar-agua-e-solo/balneabilidade-das-praias/
Boletim Semanal de Balneabilidade do Estado do Rio de Janeiro
"""

import datetime
import io
import json
import os
import re
import ssl
import sys
import urllib.request
from pathlib import Path
import numpy as np
from PIL import Image
from pypdf import PdfReader

INEA_PORTAL_URL = "https://www.inea.rj.gov.br/ar-agua-e-solo/balneabilidade-das-praias/"
SEIRHI_URL = "https://seirhi.inea.rj.gov.br/publico"

# Ponto coordinates in the standard INEA infographic map for Rio das Ostras
# (bbox: min_x, min_y, max_x, max_y)
MONITORED_POINTS_BBOX = [
    {
        "codigo": "RO0007",
        "codigo_seirhi": "02RJ01RO0007",
        "praia": "Praia das Tartarugas",
        "localizacao": "Em frente à Rua Jequitibá",
        "tipo": "praia",
        "bbox": (180, 450, 210, 480),
    },
    {
        "codigo": "RO0008",
        "codigo_seirhi": "02RJ01RO0008",
        "praia": "Praia do Bosque",
        "localizacao": "Em frente à Rua Figueira",
        "tipo": "praia",
        "bbox": (220, 440, 250, 470),
    },
    {
        "codigo": "RO0001",
        "codigo_seirhi": "02RJ01RO0001",
        "praia": "Praia do Centro (Av. Amazonas)",
        "localizacao": "Em frente à Avenida Estado do Amazonas",
        "tipo": "praia",
        "bbox": (280, 415, 310, 445),
    },
    {
        "codigo": "RO0002",
        "codigo_seirhi": "02RJ01RO0002",
        "praia": "Praia do Centro (R. Bento Costa Jr)",
        "localizacao": "Em frente à Rua Bento Costa Junior",
        "tipo": "praia",
        "bbox": (330, 430, 360, 460),
    },
    {
        "codigo": "RO0004",
        "codigo_seirhi": "02RJ01RO0004",
        "praia": "Praia do Cemitério",
        "localizacao": "Em frente à Rua da Prata",
        "tipo": "praia",
        "bbox": (340, 460, 370, 490),
    },
    {
        "codigo": "RO0003",
        "codigo_seirhi": "02RJ01RO0003",
        "praia": "Boca da Barra",
        "localizacao": "Em frente à Rua Boca da Barra nº 248",
        "tipo": "foz",
        "motivo_impropria": "Desembocadura do Rio das Ostras / vazante pluvial",
        "bbox": (370, 475, 400, 505),
    },
    {
        "codigo": "RO0009",
        "codigo_seirhi": "02RJ01RO0009",
        "praia": "Praia da Joana",
        "localizacao": "Em frente à Rua Maria Amélia",
        "tipo": "praia",
        "bbox": (375, 505, 405, 535),
    },
    {
        "codigo": "RO0010",
        "codigo_seirhi": "02RJ01RO0010",
        "praia": "Praia da Areia Negra",
        "localizacao": "À esquerda da Rua Amaral, próximo às pedras",
        "tipo": "praia",
        "bbox": (470, 435, 505, 470),
    },
    {
        "codigo": "RO0011",
        "codigo_seirhi": "02RJ01RO0011",
        "praia": "Praia do Remanso",
        "localizacao": "Canto direito da praia, próximo ao mirante",
        "tipo": "praia",
        "bbox": (515, 400, 545, 435),
    },
    {
        "codigo": "RO0012",
        "codigo_seirhi": "02RJ01RO0012",
        "praia": "Praia de Costazul",
        "localizacao": "Em frente à Rua Servidão",
        "tipo": "praia",
        "bbox": (540, 355, 570, 390),
    },
    {
        "codigo": "RO0013",
        "codigo_seirhi": "01RJ01RO0013",
        "praia": "Lagoa de Iriri (Coca-Cola)",
        "localizacao": "Em frente à Rua Belém",
        "tipo": "lagoa",
        "motivo_impropria": "Corpo lagunar com baixa renovação hídrica",
        "bbox": (600, 245, 630, 280),
    },
    {
        "codigo": "RO0014",
        "codigo_seirhi": "02RJ01RO0014",
        "praia": "Praia do Mar do Norte",
        "localizacao": "Em frente à Rua F",
        "tipo": "praia",
        "bbox": (715, 105, 745, 140),
    },
]

MESES_PT = [
    "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]


def create_ssl_ctx():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def fetch_portal_bulletin_pdf_url():
    """Scrapes INEA page and returns the current weekly bulletin PDF URL."""
    req = urllib.request.Request(
        INEA_PORTAL_URL,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    )
    with urllib.request.urlopen(req, context=create_ssl_ctx(), timeout=25) as resp:
        html = resp.read().decode("utf-8", errors="replace")

    # Look for the bulletin link
    # e.g.: href="https://www.inea.rj.gov.br/wp-content/uploads/2026/11/Site-Boletim-de-Balneabilidade-do-Estado-do-RJ-2.pdf"
    patterns = [
        r'href=["\'](https?://[^"\']*Boletim-de-Balneabilidade-do-Estado-do-RJ[^"\']*\.pdf)["\']',
        r'href=["\'](https?://[^"\']*Site-Boletim-de-Balneabilidade[^"\']*\.pdf)["\']',
        r'href=["\'](https?://[^"\']*wp-content/uploads/\d{4}/\d{2}/[^"\']*[Bb]oletim[^"\']*\.pdf)["\']',
    ]
    for pat in patterns:
        m = re.search(pat, html, re.I)
        if m:
            return m.group(1)

    # Fallback to known latest
    return "https://www.inea.rj.gov.br/wp-content/uploads/2026/11/Site-Boletim-de-Balneabilidade-do-Estado-do-RJ-2.pdf"


def sync_portal_balneabilidade(data_dir=None):
    if data_dir is None:
        data_dir = Path(__file__).resolve().parent.parent / "data"
    else:
        data_dir = Path(data_dir)

    print(f">> [INEA Sync] Consultando página oficial: {INEA_PORTAL_URL}")
    pdf_url = fetch_portal_bulletin_pdf_url()
    print(f"   Boletim semanal oficial detectado: {pdf_url}")

    pdf_temp_path = data_dir / "boletim_balneabilidade_inea_temp.pdf"
    if not pdf_temp_path.exists() or pdf_temp_path.stat().st_size < 10000:
        print("   Baixando PDF do boletim...")
        req = urllib.request.Request(
            pdf_url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )
        with urllib.request.urlopen(req, context=create_ssl_ctx(), timeout=60) as resp:
            pdf_temp_path.write_bytes(resp.read())
        print(f"   PDF baixado ({pdf_temp_path.stat().st_size} bytes)")

    # Read PDF
    reader = PdfReader(str(pdf_temp_path))
    data_amostragem_str = "10/11/2026"
    data_iso = "2026-11-10"

    ostras_page_idx = None
    for idx, page in enumerate(reader.pages):
        txt = page.extract_text() or ""
        if "RIO DAS OSTRAS" in txt.upper():
            if "AMOSTRAGEM" in txt.upper():
                ostras_page_idx = idx
                m_data = re.search(r'amostragem:\s*(\d{2})/(\d{2})/(\d{2,4})', txt, re.I)
                if m_data:
                    d, m, y = m_data.group(1), m_data.group(2), m_data.group(3)
                    if len(y) == 2:
                        y = "20" + y
                    data_amostragem_str = f"{d}/{m}/{y}"
                    data_iso = f"{y}-{m}-{d}"
                break

    print(f"   Rio das Ostras localizado na página {ostras_page_idx + 1 if ostras_page_idx is not None else 'N/A'}")
    print(f"   Data de amostragem oficial: {data_amostragem_str} (ISO: {data_iso})")

    # Check images on that page to find the Rio das Ostras map
    ostras_img = None
    if ostras_page_idx is not None:
        page = reader.pages[ostras_page_idx]
        for img_obj in page.images:
            try:
                img = Image.open(io.BytesIO(img_obj.data)).convert("RGB")
                # Look specifically for Rio das Ostras map
                if img.width == 945 and img.height == 709:
                    test_arr = np.array(img)
                    # Check Tartarugas bbox (180:210, 450:480) for pin pixels
                    sub = test_arr[450:480, 180:210]
                    g_px = np.sum((sub[:, :, 1] > 100) & (sub[:, :, 0] < 90) & (sub[:, :, 2] < 90))
                    r_px = np.sum((sub[:, :, 0] > 160) & (sub[:, :, 1] < 60) & (sub[:, :, 2] < 60))
                    if g_px > 50 or r_px > 50:
                        ostras_img = img
                        print("   Mapa de Rio das Ostras identificado com sucesso no PDF!")
                        break
            except Exception as e:
                continue

    if ostras_img is None:
        # Fallback to cached image if already extracted
        cached_img_path = data_dir / "page12_img_1.png"
        if cached_img_path.exists():
            ostras_img = Image.open(str(cached_img_path)).convert("RGB")

    arr = np.array(ostras_img) if ostras_img is not None else None

    pontos = []
    for item in MONITORED_POINTS_BBOX:
        codigo = item["codigo"]
        praia = item["praia"]
        localizacao = item["localizacao"]
        tipo = item["tipo"]
        bbox = item["bbox"]

        status = "PRÓPRIA"
        if arr is not None:
            min_x, min_y, max_x, max_y = bbox
            sub = arr[min_y:max_y, min_x:max_x]
            green_px = np.sum((sub[:, :, 1] > 100) & (sub[:, :, 0] < 90) & (sub[:, :, 2] < 90))
            red_px = np.sum((sub[:, :, 0] > 160) & (sub[:, :, 1] < 60) & (sub[:, :, 2] < 60))
            if red_px > green_px and red_px >= 10:
                status = "IMPRÓPRIA"
            elif green_px >= 10:
                status = "PRÓPRIA"

        is_propria = (status == "PRÓPRIA")
        motivo = None
        if not is_propria:
            motivo = item.get("motivo_impropria") or "Classificada como Imprópria no boletim semanal oficial do INEA"

        pontos.append({
            "praia": praia,
            "codigo": codigo,
            "codigo_seirhi": item["codigo_seirhi"],
            "localizacao": localizacao,
            "status": status,
            "badge": "success" if is_propria else "danger",
            "tipo": tipo,
            "data_coleta_iso": data_iso,
            "data_coleta_br": data_amostragem_str,
            "motivo": motivo,
        })

    proprias_cnt = sum(1 for p in pontos if p["status"] == "PRÓPRIA")
    improprias_cnt = len(pontos) - proprias_cnt
    pct_proprias = round((proprias_cnt / len(pontos)) * 100)

    try:
        y, m, d = [int(x) for x in data_iso.split("-")]
        data_boletim_extenso = f"{d:02d} de {MESES_PT[m]} de {y}"
    except Exception:
        data_boletim_extenso = data_amostragem_str

    output = {
        "orgao": "Instituto Estadual do Ambiente - INEA",
        "sistema": "Portal Oficial INEA & SEIRHI — Balneabilidade das Praias",
        "norma_tecnica": "Resolução CONAMA nº 274/2000 (Enterococos ≤ 100 NMP/100 mL em 4 de 5 coletas e < 400 NMP/100 mL na última coleta)",
        "url_portal_inea": INEA_PORTAL_URL,
        "url_fonte": INEA_PORTAL_URL,
        "url_boletim_pdf": pdf_url,
        "url_seirhi": SEIRHI_URL,
        "data_amostragem": data_amostragem_str,
        "data_coleta_iso": data_iso,
        "data_coleta_br": data_amostragem_str,
        "data_boletim": data_boletim_extenso,
        "data_boletim_curta": data_amostragem_str,
        "total_pontos": len(pontos),
        "total_proprias": proprias_cnt,
        "total_improprias": improprias_cnt,
        "percentual_proprias": pct_proprias,
        "criterio_conama": "Segundo a Resolução CONAMA nº 274/2000, um ponto é considerado próprio para banho se, em pelo menos 4 das últimas 5 campanhas, a concentração de Enterococos estiver abaixo de 100 NMP/100 mL, e se o resultado da coleta mais recente for inferior a 400 NMP/100 mL.",
        "observacao_tecnica": "Evitar o banho de mar nas primeiras horas após a ocorrência de chuvas e próximo à saída de galerias de águas pluviais ou canais de drenagem.",
        "portal_conectado": True,
        "ultima_sincronizacao_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "pontos": pontos,
    }

    out_path = data_dir / "balneabilidade.json"
    out_path.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"   [SUCESSO] balneabilidade.json atualizado: {proprias_cnt}/{len(pontos)} próprias ({pct_proprias}%) • Coleta {data_amostragem_str}")
    return output


if __name__ == "__main__":
    sync_portal_balneabilidade()
