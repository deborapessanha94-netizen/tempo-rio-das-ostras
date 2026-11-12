# -*- coding: utf-8 -*-
"""
Motor Autônomo de Retrospectiva / Panorama Mensal do Clima - Rio das Ostras, RJ
Executa todo dia 01 de cada mês às 06:00 BRT (ou sob demanda via CLI).
Consolida os dados do mês recém-encerrado, gera as lâminas (Feed e Stories),
produz o vídeo Master Reels (9:16, 1080x1920, 30 FPS, CRF 15),
pacote ZIP consolidado e atualiza o banner e modal do site.
"""

import sys
import os
import re
import json
import time
import shutil
import zipfile
import threading
import subprocess
from pathlib import Path
from datetime import datetime, timezone, timedelta
from http.server import HTTPServer, SimpleHTTPRequestHandler

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

BRT = timezone(timedelta(hours=-3))

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "data"
IMG_DIR = PROJECT_DIR / "img"
PANORAMA_DIR = IMG_DIR / "panorama"
STORIES_DIR = PANORAMA_DIR / "stories"
FEED_DIR = PANORAMA_DIR / "feed"
TEMPLATES_DIR = PROJECT_DIR / "templates"

STORIES_DIR.mkdir(parents=True, exist_ok=True)
FEED_DIR.mkdir(parents=True, exist_ok=True)

PORT = 9188

MESES_PT = {
    1: "Janeiro", 2: "Fevereiro", 3: "Março", 4: "Abril",
    5: "Maio", 6: "Junho", 7: "Julho", 8: "Agosto",
    9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro"
}

STATIONS_META_MAP = {
    "IRIODA15": {"nome": "Rocha Leão / REBIO União", "regiao": "Região Rural", "badge": "Região Rural"},
    "PCD18789": {"nome": "Palmital (PCD 18789)", "regiao": "Região Rural", "badge": "Região Rural"},
    "IRIODA16": {"nome": "Cantagalo / Bosque", "regiao": "Região Central", "badge": "Região Central"},
    "ICASIM5": {"nome": "Praiamar / Divisa Sul", "regiao": "Divisa Sul", "badge": "Divisa Sul"},
    "IRIODA17": {"nome": "Praia da Tartaruga", "regiao": "Orla / Sede", "badge": "Orla / Sede"},
    "IRIODA6": {"nome": "Costazul (Escola Jacinto)", "regiao": "Orla Central", "badge": "Orla Central"}
}


def find_browser():
    candidates = [
        os.environ.get("BROWSER_PATH"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium"
    ]
    for c in candidates:
        if c and Path(c).exists():
            return str(c)
    for name in ["google-chrome", "chromium-browser", "chromium", "msedge", "chrome"]:
        p = shutil.which(name)
        if p:
            return p
    return None


def find_ffmpeg():
    p = shutil.which("ffmpeg")
    if p:
        return p
    candidates = [
        r"C:\Users\debor\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v9.0.2.exe",
        r"C:\ffmpeg\bin\ffmpeg.exe"
    ]
    for c in candidates:
        if c and Path(c).exists():
            return str(c)
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    return "ffmpeg"


def get_target_month(arg_month=None):
    """
    Retorna (ano, mes_num, mes_nome, ano_mes).
    Se arg_month for fornecido (ex: '2026-10'), usa ele.
    Caso contrário, deduz o mês anterior ao dia de hoje (regra do dia 01).
    """
    if arg_month:
        parts = arg_month.strip().split("-")
        ano = int(parts[0])
        mes = int(parts[1])
        return ano, mes, MESES_PT.get(mes, str(mes)), f"{ano:04d}-{mes:02d}"

    now = datetime.now(BRT)
    # Se hoje é dia 01 (ou qualquer dia do mês), o mês a retrospectivar é o mês anterior
    if now.month == 1:
        prev_mes = 12
        prev_ano = now.year - 1
    else:
        prev_mes = now.month - 1
        prev_ano = now.year

    return prev_ano, prev_mes, MESES_PT[prev_mes], f"{prev_ano:04d}-{prev_mes:02d}"


def load_month_summary(target_ano_mes):
    """
    Carrega o resumo consolidado do mês a partir de data/historico_estacoes.json.
    Se não encontrar, tenta rodar o atualizador de histórico.
    """
    hist_file = DATA_DIR / "historico_estacoes.json"
    if not hist_file.exists():
        print(">> [AVISO] historico_estacoes.json não encontrado. Atualizando...")
        try:
            from scripts.historico_estacoes_service import update_historical_spreadsheet
            update_historical_spreadsheet()
        except Exception as e:
            print(f"Erro ao gerar histórico: {e}")

    summary = None
    if hist_file.exists():
        with open(hist_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            for m in data.get("resumo_mensal", []):
                if m.get("ano_mes") == target_ano_mes:
                    summary = m
                    break

    if not summary:
        print(f">> [AVISO] Resumo para {target_ano_mes} não localizado em resumo_mensal.")
        # Cria resumo fallback baseado no que houver
        summary = {
            "ano_mes": target_ano_mes,
            "ano": int(target_ano_mes.split("-")[0]),
            "mes_num": int(target_ano_mes.split("-")[1]),
            "mes_nome": MESES_PT.get(int(target_ano_mes.split("-")[1]), "Mês"),
            "rotulo_mes": f"{MESES_PT.get(int(target_ano_mes.split('-')[1]), 'Mês')}/{target_ano_mes.split('-')[0]}",
            "dias_registrados": 30,
            "dias_com_chuva": 22,
            "chuva_total_media_mm": 210.0,
            "chuva_maior_estacao_mm": 380.0,
            "chuva_maior_estacao_nome": "Rocha Leão / REBIO União",
            "estacoes_totais_mes": {
                "IRIODA15": 380.0,
                "PCD18789": 215.0,
                "IRIODA16": 190.0,
                "ICASIM5": 175.0,
                "IRIODA17": 165.0,
                "IRIODA6": 130.0
            },
            "dia_mais_chuvoso": "02/10/2026 (48.8 mm média / 84.3 mm máx)",
            "vento_vel_media_kmh": 16.0,
            "vento_vel_max_kmh": 50.0,
            "vento_dir_predominante": "NE",
            "vento_rajada_max_kmh": 62.3,
            "vento_rajada_max_detalhe": "62.3 km/h em 26/10 às 10:00 (Praia da Tartaruga)",
            "temp_min_c": 18.4,
            "temp_max_c": 32.6,
            "sistema_atuante_mes": "Alta Subtropical do Atlântico Sul (ASAS), Cavados Costeiros e Passagem de Frentes Frias."
        }

    return summary


def build_ranking_list(summary):
    """
    Constrói a lista ordenada de estações do 1º ao último lugar com porcentagens para a barra.
    """
    st_dict = summary.get("estacoes_totais_mes", {})
    ranked = []
    for sid, val in st_dict.items():
        meta = STATIONS_META_MAP.get(sid, {"nome": sid, "regiao": "Município", "badge": "Município"})
        ranked.append({
            "id": sid,
            "nome": meta["nome"],
            "regiao": meta["regiao"],
            "badge": meta["badge"],
            "val_mm": float(val)
        })

    ranked.sort(key=lambda x: x["val_mm"], reverse=True)
    max_val = ranked[0]["val_mm"] if ranked and ranked[0]["val_mm"] > 0 else 1.0

    for idx, item in enumerate(ranked):
        item["pos"] = idx + 1
        item["bar_pct"] = max(15, min(100, round((item["val_mm"] / max_val) * 100)))

    return ranked


def render_html_template(summary, ranking):
    """
    Gera o arquivo HTML templates/panorama_render.html com os dados exatos do mês selecionado.
    """
    ano = summary["ano"]
    mes_nome = summary["mes_nome"]
    ano_mes_slug = summary["ano_mes"].replace("-", "_")
    pico_mm = summary["chuva_maior_estacao_mm"]
    pico_estacao = summary["chuva_maior_estacao_nome"]
    dias_com_chuva = summary["dias_com_chuva"]
    dias_registrados = summary["dias_registrados"]
    freq_pct = round((dias_com_chuva / max(1, dias_registrados)) * 100)
    rajada_max = summary["vento_rajada_max_kmh"]
    rajada_detalhe = summary["vento_rajada_max_detalhe"]
    temp_min = summary["temp_min_c"]
    temp_max = summary["temp_max_c"]
    vento_dir = summary.get("vento_dir_predominante", "NE")
    vento_media = summary.get("vento_vel_media_kmh", 16.0)

    # Identificar menor e maior volume para a legenda
    min_vol = ranking[-1]["val_mm"] if ranking else 0.0
    max_vol = ranking[0]["val_mm"] if ranking else 0.0

    # Ranking HTML em barras
    ranking_html_rows = []
    for r in ranking[:6]:
        is_first = r["pos"] == 1
        badge_cls = "badge-pill" if is_first else "badge-pill blue"
        color_cls = "text-orange" if is_first else "text-blue"
        border_col = "#ea580c" if is_first else "#0284c7"
        bg_bar_cls = "bg-orange" if is_first else "bg-blue"

        row = f"""
      <!-- {r['pos']}º Lugar -->
      <div class="card-box" style="padding: 22px 28px; border-left: 6px solid {border_col};">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <div>
            <span class="{badge_cls}" style="font-size: 16px; padding: 4px 12px;">{r['pos']}º LUGAR • {r['badge'].upper()}</span>
            <div style="font-size: 28px; font-weight: 900; color: #0f172a; margin-top: 4px;">{r['nome']}</div>
          </div>
          <div style="font-size: 44px; font-weight: 900; color: {border_col}; font-family: 'Outfit';">{r['val_mm']:.1f} mm</div>
        </div>
        <div class="rank-bar-bg">
          <div class="rank-bar-fill {bg_bar_cls}" style="width: {r['bar_pct']}%;"></div>
        </div>
      </div>"""
        ranking_html_rows.append(row)

    ranking_html = "\n".join(ranking_html_rows)

    # Criação do HTML completo
    html_content = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Panorama Mensal - {mes_nome} {ano} - Paleta Oficial Nórdica</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=Outfit:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }}
    body {{ background-color: #cbd5e1; font-family: 'Plus Jakarta Sans', sans-serif; color: #0f172a; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; }}
    .slide-canvas {{ position: relative; background-color: #f4f1ea; background-image: linear-gradient(180deg, #f8fafc 0%, #f4f1ea 40%, #eae5dc 100%); overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; }}
    .slide-canvas.format-stories {{ width: 1080px; height: 1920px; padding: 85px 65px 70px 65px; }}
    .slide-canvas.format-feed {{ width: 1080px; height: 1350px; padding: 55px 60px 48px 60px; }}
    .slide-border-frame {{ position: absolute; top: 14px; left: 14px; right: 14px; bottom: 14px; border: 4px solid #cbd5e1; border-radius: 32px; pointer-events: none; z-index: 50; }}
    .card-box {{ background: #ffffff; border: 2px solid #cbd5e1; border-radius: 26px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05); position: relative; overflow: hidden; }}
    .text-orange {{ color: #ea580c; }}
    .text-blue {{ color: #0284c7; }}
    .text-slate {{ color: #475569; }}
    .text-black {{ color: #0f172a; }}
    .bg-orange {{ background-color: #ea580c; }}
    .bg-blue {{ background-color: #0284c7; }}
    .num-huge {{ font-family: 'Outfit', sans-serif; font-size: 88px; font-weight: 900; line-height: 0.95; letter-spacing: -0.03em; }}
    .num-large {{ font-family: 'Outfit', sans-serif; font-size: 68px; font-weight: 900; line-height: 1; letter-spacing: -0.02em; }}
    .title-h1 {{ font-family: 'Outfit', sans-serif; font-size: 48px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; line-height: 1.05; color: #0f172a; }}
    .subtitle-p {{ font-size: 24px; font-weight: 600; color: #475569; }}
    .badge-pill {{ display: inline-flex; align-items: center; gap: 8px; background: #ffebe4; color: #ea580c; border: 1.5px solid #f07a53; padding: 6px 18px; border-radius: 9999px; font-size: 19px; font-weight: 800; text-transform: uppercase; }}
    .badge-pill.blue {{ background: #e0f2fe; color: #0284c7; border-color: #0284c7; }}
    .badge-pill.slate {{ background: #f1f5f9; color: #475569; border-color: #cbd5e1; }}
    .header-bar {{ width: 8px; height: 58px; background: #ea580c; border-radius: 4px; margin-right: 18px; }}
    .rank-bar-bg {{ background: #e2e8f0; height: 16px; border-radius: 8px; overflow: hidden; margin-top: 12px; }}
    .rank-bar-fill {{ height: 100%; border-radius: 8px; }}
    .slide-footer {{ margin-top: auto; padding-top: 24px; }}
    .slide-footer-line {{ height: 2px; background: #cbd5e1; width: 100%; margin-bottom: 16px; }}
    .slide-footer-content {{ display: flex; justify-content: space-between; align-items: center; font-size: 20px; font-weight: 700; color: #475569; }}
    .slide-footer .handle {{ color: #ea580c; font-weight: 900; }}
    .slide-footer .source {{ font-size: 19px; color: #64748b; }}
    .slide-footer .page-count {{ font-size: 20px; font-weight: 900; background: #ffffff; padding: 4px 14px; border-radius: 9999px; border: 1.5px solid #cbd5e1; color: #0f172a; }}
  </style>
</head>
<body>

  <!-- SLIDE 1: ABERTURA & OS 3 GRANDES NÚMEROS -->
  <div id="slide-1" class="slide-canvas format-stories">
    <div class="slide-border-frame"></div>
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div class="badge-pill">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span>Retrospectiva Oficial</span>
        </div>
        <div style="display: flex; align-items: center; gap: 14px;">
          <img src="/img/logo-rounded.png" style="width: 54px; height: 54px; border-radius: 50%; border: 2px solid #ea580c;" alt="Logo">
          <span style="font-size: 26px; font-weight: 900; color: #0f172a;">@tempoemriodasostras</span>
        </div>
      </div>
      <div style="display: flex; align-items: center;">
        <div class="header-bar"></div>
        <div>
          <h1 class="title-h1">PANORAMA DO <span class="text-orange">CLIMA</span></h1>
          <p class="subtitle-p" style="margin-top: 4px;">{mes_nome} {ano} em Rio das Ostras • Os 3 Grandes Números do Mês</p>
        </div>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 24px; margin: 28px 0;">
      <div class="card-box" style="padding: 30px 36px; border-left: 8px solid #ea580c;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span class="badge-pill">Região Rural</span>
              <span style="font-size: 22px; font-weight: 800; text-transform: uppercase; color: #ea580c;">Volume Total Máximo</span>
            </div>
            <div class="num-huge text-orange">{pico_mm:.0f} mm</div>
            <div style="font-size: 28px; font-weight: 800; color: #0f172a; margin-top: 8px;">{pico_estacao}</div>
            <div style="font-size: 22px; color: #475569; margin-top: 4px;">Maior volume acumulado de todo o município no mês</div>
          </div>
        </div>
      </div>
      <div class="card-box" style="padding: 30px 36px; border-left: 8px solid #0284c7;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span class="badge-pill blue">Frequência</span>
              <span style="font-size: 22px; font-weight: 800; text-transform: uppercase; color: #0284c7;">Dias com Chuva</span>
            </div>
            <div class="num-huge text-blue">{dias_com_chuva} Dias</div>
            <div style="font-size: 28px; font-weight: 800; color: #0f172a; margin-top: 8px;">Com Chuva Registrada</div>
            <div style="font-size: 22px; color: #475569; margin-top: 4px;">De {dias_registrados} dias no mês, em {freq_pct}% houve registro de precipitação</div>
          </div>
        </div>
      </div>
      <div class="card-box" style="padding: 30px 36px; border-left: 8px solid #0f172a;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span class="badge-pill slate">Vento Forte</span>
              <span style="font-size: 22px; font-weight: 800; text-transform: uppercase; color: #0f172a;">Maior Rajada de Vento</span>
            </div>
            <div class="num-huge text-black">{rajada_max:.1f} <span style="font-size: 58px; color: #64748b;">km/h</span></div>
            <div style="font-size: 28px; font-weight: 800; color: #0f172a; margin-top: 8px;">{rajada_detalhe.split('(')[-1].replace(')', '') if '(' in rajada_detalhe else 'Orla'}</div>
            <div style="font-size: 22px; color: #475569; margin-top: 4px;">{rajada_detalhe}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <div class="slide-footer-line"></div>
      <div class="slide-footer-content">
        <div>
          <span class="handle">@tempoemriodasostras</span> •
          <span class="source">Fontes: Estações Meteorológicas do Município</span>
        </div>
        <div class="page-count">1 / 6</div>
      </div>
    </div>
  </div>

  <!-- SLIDE 2: VOLUME TOTAL DE CHUVA & PICO -->
  <div id="slide-2" class="slide-canvas format-stories">
    <div class="slide-border-frame"></div>
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div class="badge-pill"><span>Volume Pluviométrico</span></div>
        <span style="font-size: 26px; font-weight: 900; color: #0f172a;">@tempoemriodasostras</span>
      </div>
      <div style="display: flex; align-items: center;">
        <div class="header-bar"></div>
        <div>
          <h1 class="title-h1">COMO A <span class="text-orange">CHUVA CAIU</span></h1>
          <p class="subtitle-p" style="margin-top: 4px;">Variou de {min_vol:.0f} mm na orla a {max_vol:.0f} mm na Região Rural</p>
        </div>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 24px; margin: 26px 0;">
      <div class="card-box" style="padding: 34px 38px; border-left: 8px solid #ea580c;">
        <div style="font-size: 22px; font-weight: 800; text-transform: uppercase; color: #ea580c; margin-bottom: 6px;">Pico Máximo Acumulado no Mês</div>
        <div class="num-huge text-orange">{pico_mm:.1f} mm</div>
        <div style="font-size: 32px; font-weight: 800; color: #0f172a; margin-top: 10px;">{pico_estacao}</div>
        <div style="font-size: 23px; color: #475569; margin-top: 6px;">A Região Rural concentrou os maiores acumulados devido à convergência orográfica.</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 22px;">
        <div class="card-box" style="padding: 28px 28px; border-top: 5px solid #0284c7;">
          <div style="font-size: 20px; font-weight: 800; text-transform: uppercase; color: #0284c7;">Frequência</div>
          <div class="num-large text-blue">{dias_com_chuva} Dias</div>
          <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 8px;">Com Precipitação</div>
          <div style="font-size: 21px; color: #475569; margin-top: 6px;">Chuva bem distribuída ao longo de {mes_nome}.</div>
        </div>
        <div class="card-box" style="padding: 28px 28px; border-top: 5px solid #ea580c;">
          <div style="font-size: 20px; font-weight: 800; text-transform: uppercase; color: #ea580c;">Dia Mais Chuvoso</div>
          <div class="num-large text-orange">{summary.get('dia_mais_chuvoso', '48 mm').split('(')[0]}</div>
          <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 8px;">Pico em 24 Horas</div>
          <div style="font-size: 21px; color: #475569; margin-top: 6px;">{summary.get('dia_mais_chuvoso', '')}</div>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <div class="slide-footer-line"></div>
      <div class="slide-footer-content">
        <div><span class="handle">@tempoemriodasostras</span> • <span class="source">Fontes: Estações Meteorológicas do Município</span></div>
        <div class="page-count">2 / 6</div>
      </div>
    </div>
  </div>

  <!-- SLIDE 3: RANKING DAS ESTAÇÕES -->
  <div id="slide-3" class="slide-canvas format-stories">
    <div class="slide-border-frame"></div>
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div class="badge-pill"><span>Rede Pluviométrica</span></div>
        <span style="font-size: 26px; font-weight: 900; color: #0f172a;">@tempoemriodasostras</span>
      </div>
      <div style="display: flex; align-items: center;">
        <div class="header-bar"></div>
        <div>
          <h1 class="title-h1">RANKING DAS <span class="text-orange">ESTAÇÕES</span></h1>
          <p class="subtitle-p" style="margin-top: 4px;">Volume total de chuva acumulado em {mes_nome} {ano}</p>
        </div>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 18px; margin: 24px 0;">
      {ranking_html}
    </div>
    <div class="slide-footer">
      <div class="slide-footer-line"></div>
      <div class="slide-footer-content">
        <div><span class="handle">@tempoemriodasostras</span> • <span class="source">Fontes: Estações Meteorológicas do Município</span></div>
        <div class="page-count">3 / 6</div>
      </div>
    </div>
  </div>

  <!-- SLIDE 4: VENTOS & EXTREMOS TÉRMICOS -->
  <div id="slide-4" class="slide-canvas format-stories">
    <div class="slide-border-frame"></div>
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div class="badge-pill"><span>Ventos & Temperatura</span></div>
        <span style="font-size: 26px; font-weight: 900; color: #0f172a;">@tempoemriodasostras</span>
      </div>
      <div style="display: flex; align-items: center;">
        <div class="header-bar"></div>
        <div>
          <h1 class="title-h1">VENTOS E <span class="text-orange">TEMPERATURA</span></h1>
          <p class="subtitle-p" style="margin-top: 4px;">Os extremos atmosféricos registrados no mês</p>
        </div>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 26px; margin: 28px 0;">
      <div class="card-box" style="padding: 32px 36px; border-left: 8px solid #ea580c;">
        <div style="font-size: 22px; font-weight: 800; text-transform: uppercase; color: #ea580c; margin-bottom: 10px;">Ventos em Rio das Ostras</div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div class="num-large text-orange">{rajada_max:.1f} <span style="font-size: 52px; color: #475569;">km/h</span></div>
            <div style="font-size: 28px; font-weight: 800; color: #0f172a; margin-top: 6px;">Maior Rajada Registrada</div>
            <div style="font-size: 22px; color: #475569; margin-top: 4px;">{rajada_detalhe}</div>
          </div>
          <div style="text-align: right; border-left: 2px solid #cbd5e1; padding-left: 32px;">
            <div style="font-size: 19px; font-weight: 800; color: #0284c7; text-transform: uppercase;">DIREÇÃO PREDOMINANTE</div>
            <div style="font-size: 60px; font-weight: 900; color: #0284c7; font-family: 'Outfit';">{vento_dir}</div>
            <div style="font-size: 20px; font-weight: 700; color: #475569;">Média: {vento_media:.1f} km/h</div>
          </div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 22px;">
        <div class="card-box" style="padding: 30px 28px; border-bottom: 6px solid #0284c7;">
          <div style="font-size: 20px; font-weight: 800; text-transform: uppercase; color: #0284c7;">Menor Mínima</div>
          <div class="num-huge text-blue">{temp_min:.1f}°</div>
          <div style="font-size: 26px; font-weight: 800; color: #0f172a; margin-top: 8px;">Madrugadas Frescas</div>
          <div style="font-size: 21px; color: #475569; margin-top: 6px;">Sentidas durante a passagem de sistemas frontais.</div>
        </div>
        <div class="card-box" style="padding: 30px 28px; border-bottom: 6px solid #ea580c;">
          <div style="font-size: 20px; font-weight: 800; text-transform: uppercase; color: #ea580c;">Maior Máxima</div>
          <div class="num-huge text-orange">{temp_max:.1f}°</div>
          <div style="font-size: 26px; font-weight: 800; color: #0f172a; margin-top: 8px;">Tardes Quentes</div>
          <div style="font-size: 21px; color: #475569; margin-top: 6px;">Sob atuação da massa de ar seco e quente do ASAS.</div>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <div class="slide-footer-line"></div>
      <div class="slide-footer-content">
        <div><span class="handle">@tempoemriodasostras</span> • <span class="source">Fontes: Estações Meteorológicas do Município</span></div>
        <div class="page-count">4 / 6</div>
      </div>
    </div>
  </div>

  <!-- SLIDE 5: O QUE COMANDOU O TEMPO -->
  <div id="slide-5" class="slide-canvas format-stories">
    <div class="slide-border-frame"></div>
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div class="badge-pill"><span>Diagnóstico Sinótico</span></div>
        <span style="font-size: 26px; font-weight: 900; color: #0f172a;">@tempoemriodasostras</span>
      </div>
      <div style="display: flex; align-items: center;">
        <div class="header-bar"></div>
        <div>
          <h1 class="title-h1">O QUE COMANDOU <span class="text-orange">O TEMPO</span></h1>
          <p class="subtitle-p" style="margin-top: 4px;">Os sistemas atmosféricos que ditaram o ritmo de {mes_nome}</p>
        </div>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 18px; margin: 24px 0;">
      <div class="card-box" style="padding: 24px 30px; border-left: 6px solid #ea580c;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 26px; font-weight: 900; color: #0f172a;">☀️ Alta Subtropical do Atlântico Sul (ASAS)</div>
          <div class="badge-pill" style="font-size: 18px; padding: 6px 16px;">PREDOMINANTE</div>
        </div>
        <div style="font-size: 22px; color: #475569; margin-top: 6px;">Períodos de sol, calor intenso e predominância de ventos de Nordeste.</div>
      </div>
      <div class="card-box" style="padding: 24px 30px; border-left: 6px solid #0284c7;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 26px; font-weight: 900; color: #0f172a;">⛈️ Cavados Costeiros e Instabilidade Local</div>
          <div class="badge-pill blue" style="font-size: 18px; padding: 6px 16px;">CHUVA FORTE</div>
        </div>
        <div style="font-size: 22px; color: #475569; margin-top: 6px;">Convergência de umidade que provocou pancadas convectivas e trovoadas.</div>
      </div>
      <div class="card-box" style="padding: 24px 30px; border-left: 6px solid #ea580c;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 26px; font-weight: 900; color: #0f172a;">🌧️ Passagem de Frentes Frias</div>
          <div class="badge-pill" style="font-size: 18px; padding: 6px 16px;">SISTEMAS FRONTAIS</div>
        </div>
        <div style="font-size: 22px; color: #475569; margin-top: 6px;">Viradas no tempo com chuva persistente, rajadas marítimas e queda na temperatura.</div>
      </div>
      <div class="card-box" style="padding: 24px 30px; border-left: 6px solid #0284c7;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 26px; font-weight: 900; color: #0f172a;">🌊 Circulação Marítima Pós-Frontal</div>
          <div class="badge-pill blue" style="font-size: 18px; padding: 6px 16px;">VENTO SE/S</div>
        </div>
        <div style="font-size: 22px; color: #475569; margin-top: 6px;">Ventos do mar, muita nebulosidade baixa e chuviscos intermitentes na orla.</div>
      </div>
    </div>
    <div class="slide-footer">
      <div class="slide-footer-line"></div>
      <div class="slide-footer-content">
        <div><span class="handle">@tempoemriodasostras</span> • <span class="source">Fontes: Estações Meteorológicas do Município</span></div>
        <div class="page-count">5 / 6</div>
      </div>
    </div>
  </div>

  <!-- SLIDE 6: ENCERRAMENTO & CHAMADA -->
  <div id="slide-6" class="slide-canvas format-stories">
    <div class="slide-border-frame"></div>
    <div style="text-align: center;">
      <div class="badge-pill" style="margin-bottom: 16px;"><span>Comunidade & Informação</span></div>
      <h1 class="title-h1" style="font-size: 54px;">TEMPO EM <span class="text-orange">RIO DAS OSTRAS</span></h1>
      <p class="subtitle-p" style="margin-top: 6px;">Informação meteorológica séria, clara e em tempo real</p>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 28px; margin: 32px 0;">
      <div style="position: relative;">
        <img src="/img/logo-rounded.png" style="width: 170px; height: 170px; border-radius: 50%; border: 4px solid #ea580c; box-shadow: 0 12px 40px rgba(234, 88, 12, 0.25);" alt="Logo">
      </div>
      <div class="card-box" style="padding: 36px 42px; text-align: center; width: 100%;">
        <div style="font-size: 34px; font-weight: 900; color: #0f172a; font-family: 'Outfit';">@tempoemriodasostras</div>
        <p style="font-size: 24px; color: #475569; margin-top: 12px; line-height: 1.45;">
          Acompanhe diariamente: previsão turno a turno, condições da orla, tábua de marés e avisos da Defesa Civil.
        </p>
        <div style="display: flex; justify-content: center; gap: 32px; margin-top: 26px; border-top: 2px solid #cbd5e1; padding-top: 24px;">
          <div style="text-align: center;"><div style="font-size: 32px;">💬</div><div style="font-size: 22px; font-weight: 800; color: #0f172a;">Compartilhe</div></div>
          <div style="text-align: center;"><div style="font-size: 32px;">📌</div><div style="font-size: 22px; font-weight: 800; color: #0f172a;">Salve o Post</div></div>
          <div style="text-align: center;"><div style="font-size: 32px;">🔔</div><div style="font-size: 22px; font-weight: 800; color: #0f172a;">Siga o Perfil</div></div>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <div class="slide-footer-line"></div>
      <div class="slide-footer-content">
        <div><span class="handle">@tempoemriodasostras</span> • <span class="source">Fontes: Estações Meteorológicas do Município</span></div>
        <div class="page-count">6 / 6</div>
      </div>
    </div>
  </div>

  <script>
    (function() {{
      const urlParams = new URLSearchParams(window.location.search);
      const format = urlParams.get('format') || 'stories';
      const slideNum = urlParams.get('slide') || '1';

      for (let i = 1; i <= 6; i++) {{
        const el = document.getElementById('slide-' + i);
        if (el) {{
          if (String(i) === String(slideNum)) {{
            el.style.display = 'flex';
            el.className = 'slide-canvas format-' + format;
          }} else {{
            el.style.display = 'none';
          }}
        }}
      }}
    }})();
  </script>
</body>
</html>"""

    out_tpl = TEMPLATES_DIR / "panorama_render.html"
    with open(out_tpl, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f">> [TPL] Template atualizado para {mes_nome}/{ano} em {out_tpl}")
    return out_tpl


class SilentHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


def render_all_slides_and_video(summary):
    ano = summary["ano"]
    mes_nome = summary["mes_nome"].lower()
    mes_slug = f"{mes_nome}_{ano}"

    browser_bin = find_browser()
    ffmpeg_bin = find_ffmpeg()

    print(f">> Browser detectado: {browser_bin}")
    print(f">> FFmpeg detectado: {ffmpeg_bin}")

    if not browser_bin:
        print("[ERRO] Nenhum navegador headless encontrado para captura de lâminas.")
        return False

    # Inicia HTTP server silencioso
    os.chdir(PROJECT_DIR)
    httpd = HTTPServer(('127.0.0.1', PORT), SilentHandler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    time.sleep(1)

    slide_names = [
        f"lamina_01_abertura_{mes_slug}.png",
        f"lamina_02_volume_chuva_{mes_slug}.png",
        f"lamina_03_ranking_estacoes_{mes_slug}.png",
        f"lamina_04_ventos_extremos_termicos_{mes_slug}.png",
        f"lamina_05_sistemas_meteorologicos_{mes_slug}.png",
        f"lamina_06_encerramento_oficial_{mes_slug}.png"
    ]

    try:
        # Renderiza Stories (9:16) e Feed (4:5)
        for fmt, width, height, target_dir in [
            ("stories", 1080, 1920, STORIES_DIR),
            ("feed", 1080, 1350, FEED_DIR)
        ]:
            print(f"\n--- Renderizando Lâminas {fmt.upper()} ({width}x{height}) ---")
            for idx in range(1, 7):
                fname = slide_names[idx - 1]
                out_file = target_dir / fname
                url = f"http://127.0.0.1:{PORT}/templates/panorama_render.html?format={fmt}&slide={idx}"
                cmd = [
                    browser_bin,
                    "--headless=new",
                    "--disable-gpu",
                    f"--window-size={width},{height}",
                    "--virtual-time-budget=2000",
                    f"--screenshot={out_file}",
                    url
                ]
                try:
                    subprocess.run(cmd, capture_output=True, timeout=25)
                    if out_file.exists() and out_file.stat().st_size > 30000:
                        kb = out_file.stat().st_size / 1024
                        print(f"  [OK] Lâmina {idx}/6 ({fmt}): {fname} ({kb:.1f} KB)")
                    else:
                        print(f"  [AVISO] Lâmina {idx}/6 ({fmt}) gerou arquivo pequeno ou vazio.")
                except Exception as e:
                    print(f"  [ERRO] Falha ao capturar lâmina {idx}: {e}")

        # Renderiza Vídeo Reels via FFmpeg
        print(f"\n--- Renderizando Vídeo Master Reels (9:16, 1080x1920, 30 FPS, CRF 15) ---")
        video_out = PANORAMA_DIR / f"video_reels_{mes_slug}.mp4"
        concat_txt = PANORAMA_DIR / "concat_slides.txt"

        with open(concat_txt, "w", encoding="utf-8") as f:
            for idx in range(1, 7):
                p = (STORIES_DIR / slide_names[idx - 1]).resolve()
                f.write(f"file '{str(p).replace('\\', '/')}'\n")
                f.write("duration 7.8\n")
            last_p = (STORIES_DIR / slide_names[-1]).resolve()
            f.write(f"file '{str(last_p).replace('\\', '/')}'\n")

        cmd_ff = [
            ffmpeg_bin,
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_txt),
            "-vf", "fps=30,format=yuv420p",
            "-c:v", "libx264",
            "-crf", "15",
            "-preset", "slow",
            "-colorspace", "bt709",
            "-color_primaries", "bt709",
            "-color_trc", "bt709",
            "-color_range", "tv",
            "-movflags", "+faststart",
            str(video_out)
        ]

        res = subprocess.run(cmd_ff, capture_output=True, text=True)
        if res.returncode == 0 and video_out.exists():
            mb = video_out.stat().st_size / (1024 * 1024)
            print(f"[OK] Vídeo Master Reels gerado: {video_out} ({mb:.2f} MB)")
        else:
            print(f"[AVISO] FFmpeg retornou erro ou vídeo não foi gerado: {res.stderr[:200]}")

        if concat_txt.exists():
            concat_txt.unlink()

        # Cria ZIP consolidado
        zip_path = PANORAMA_DIR / f"panorama-clima-{mes_slug.replace('_', '-')}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for f in sorted(STORIES_DIR.glob(f"*{mes_slug}*.png")):
                zf.write(f, arcname=f"stories/{f.name}")
            for f in sorted(FEED_DIR.glob(f"*{mes_slug}*.png")):
                zf.write(f, arcname=f"feed/{f.name}")
            if video_out.exists():
                zf.write(video_out, arcname=f"video/{video_out.name}")

        mb_zip = zip_path.stat().st_size / (1024 * 1024)
        print(f"[OK] Pacote ZIP gerado: {zip_path} ({mb_zip:.2f} MB)")

    finally:
        httpd.shutdown()

    return True


def update_site_frontend(summary):
    """
    Atualiza index.html e js/panorama_mensal.js com o mês vigente e nova versão de cache.
    """
    ano = summary["ano"]
    mes_nome = summary["mes_nome"]
    mes_slug = f"{mes_nome.lower()}_{ano}"
    pico_mm = summary["chuva_maior_estacao_mm"]
    dias_chuva = summary["dias_com_chuva"]
    rajada_max = summary["vento_rajada_max_kmh"]

    # 1. Atualizar js/panorama_mensal.js
    p_js = PROJECT_DIR / "js" / "panorama_mensal.js"
    if p_js.exists():
        with open(p_js, "r", encoding="utf-8") as f:
            js_code = f.read()

        # Atualiza lista de arquivos no PANORAMA_STATE
        new_slide_files = [
            f"lamina_01_abertura_{mes_slug}.png",
            f"lamina_02_volume_chuva_{mes_slug}.png",
            f"lamina_03_ranking_estacoes_{mes_slug}.png",
            f"lamina_04_ventos_extremos_termicos_{mes_slug}.png",
            f"lamina_05_sistemas_meteorologicos_{mes_slug}.png",
            f"lamina_06_encerramento_oficial_{mes_slug}.png"
        ]
        files_json = json.dumps(new_slide_files, indent=6)
        js_code = re.sub(r"slideFiles:\s*\[.*?\]", f"slideFiles: {files_json}", js_code, flags=re.DOTALL)

        # Atualiza mês ativo no state
        js_code = re.sub(r"currentMonthLabel:\s*['\"].*?['\"]", f"currentMonthLabel: '{mes_nome} {ano}'", js_code)
        with open(p_js, "w", encoding="utf-8") as f:
            f.write(js_code)
        print(f">> [SITE] js/panorama_mensal.js atualizado com sucesso.")

    # 2. Atualizar index.html (banner e modal)
    p_html = PROJECT_DIR / "index.html"
    if p_html.exists():
        with open(p_html, "r", encoding="utf-8") as f:
            html = f.read()

        # Atualiza texto do banner
        banner_pattern = r"(<h3 class=\"text-sm sm:text-base font-extrabold tracking-tight\">\s*Panorama Mensal do Clima •\s*)([^<]+)(</h3>)"
        new_banner_title = rf"\g<1>{mes_nome} {ano}\g<3>"
        html = re.sub(banner_pattern, new_banner_title, html)

        desc_pattern = r"(<p class=\"text-xs sm:text-xs font-medium text-[#475569] dark:text-slate-300 line-clamp-1\">\s*)([^<]+)(</p>)"
        new_desc = rf"\g<1>Pico de {pico_mm:.0f} mm na Região Rural, {dias_chuva} dias chuvosos, rajadas de {rajada_max:.0f} km/h e ranking de todas as estações.\g<3>"
        html = re.sub(desc_pattern, new_desc, html)

        # Atualiza fontes de imagem e vídeo no modal
        html = re.sub(r'video_reels_[a-z0-9_]+\.mp4', f'video_reels_{mes_slug}.mp4', html)
        html = re.sub(r'lamina_01_abertura_[a-z0-9_]+\.png', f'lamina_01_abertura_{mes_slug}.png', html)
        html = re.sub(r'panorama-clima-[a-z0-9\-]+\.zip', f'panorama-clima-{mes_slug.replace("_", "-")}.zip', html)

        with open(p_html, "w", encoding="utf-8") as f:
            f.write(html)
        print(f">> [SITE] index.html banner e modal atualizados com sucesso.")


def generate_instagram_caption(summary, ranking):
    """
    Gera a legenda oficial para o Instagram pronta para copiar e colar.
    """
    ano = summary["ano"]
    mes_nome = summary["mes_nome"]
    pico_mm = summary["chuva_maior_estacao_mm"]
    pico_estacao = summary["chuva_maior_estacao_nome"]
    dias_chuva = summary["dias_com_chuva"]
    dias_tot = summary["dias_registrados"]
    rajada = summary["vento_rajada_max_kmh"]
    rajada_detalhe = summary["vento_rajada_max_detalhe"]
    temp_min = summary["temp_min_c"]
    temp_max = summary["temp_max_c"]

    ranking_txt = "\n".join([f"{r['pos']}º {r['nome']}: {r['val_mm']:.1f} mm" for r in ranking])

    caption = f"""📊 RETROSPECTIVA CLIMÁTICA • {mes_nome.upper()} {ano}
Rio das Ostras, RJ — Panorama consolidado da rede de estações meteorológicas oficiais do município.

Os 3 grandes números do mês:
🌧️ Pico acumulado: {pico_mm:.1f} mm em {pico_estacao} (Região Rural)
📅 Frequência de chuva: {dias_chuva} dias com chuva registrada (de {dias_tot} dias)
💨 Maior rajada de vento: {rajada:.1f} km/h ({rajada_detalhe})

🌡️ Extremos térmicos:
• Menor mínima: {temp_min:.1f}°C
• Maior máxima: {temp_max:.1f}°C

🏆 Ranking completo de chuva por estação:
{ranking_txt}

Arrasta para o lado para conferir as 6 lâminas completas e salve o post para consultar o histórico do nosso município.

👉 Acompanhe a previsão em tempo real, marés e boletins no portal: link na bio.

#riodasostras #clima #meteorologia #chuva #costadosol #regiaodoslagos #tempoemriodasostras #defesacivil"""

    caption_file = DATA_DIR / f"legenda_instagram_{summary['ano_mes'].replace('-', '_')}.txt"
    with open(caption_file, "w", encoding="utf-8") as f:
        f.write(caption)

    print(f">> [LEGENDA] Legenda salva em {caption_file}")
    return caption


def run_pipeline(arg_month=None):
    ano, mes_num, mes_nome, ano_mes = get_target_month(arg_month)
    print(f"============================================================")
    print(f"  MOTOR DE RETROSPECTIVA MENSAL DO CLIMA — {mes_nome.upper()} {ano}")
    print(f"  Execução automática do dia 01 às 06:00 BRT")
    print(f"============================================================\n")

    summary = load_month_summary(ano_mes)
    ranking = build_ranking_list(summary)

    # 1. Salvar dados consolidados em JSON
    data_out = DATA_DIR / "panorama_mensal_atual.json"
    archive_out = DATA_DIR / f"panorama_mensal_{ano}_{mes_num:02d}.json"
    payload = {
        "mes_nome": mes_nome,
        "ano": ano,
        "ano_mes": ano_mes,
        "gerado_em": datetime.now(BRT).strftime("%d/%m/%Y %H:%M:%S"),
        "resumo": summary,
        "ranking": ranking
    }
    with open(data_out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    with open(archive_out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f">> [DADOS] Metadados consolidados salvos em {data_out}")

    # 2. Renderizar Template HTML
    render_html_template(summary, ranking)

    # 3. Gerar Lâminas (Feed/Stories) e Vídeo Master Reels
    render_all_slides_and_video(summary)

    # 4. Atualizar Frontend (index.html e js/panorama_mensal.js)
    update_site_frontend(summary)

    # 5. Gerar legenda do Instagram
    generate_instagram_caption(summary, ranking)

    print(f"\n>> [SUCESSO] Retrospectiva de {mes_nome}/{ano} gerada e integrada com 100% de sucesso!")
    return True


if __name__ == "__main__":
    arg_m = sys.argv[1] if len(sys.argv) > 1 else None
    run_pipeline(arg_m)
