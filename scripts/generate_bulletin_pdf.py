# -*- coding: utf-8 -*-
"""
Gerador Oficial de PDFs Meteorológicos de Rio das Ostras - RJ
Gera automaticamente:
1. docs/boletim_operacional.pdf (Boletim Meteorológico Operacional - 4 Páginas)
2. docs/informativo_populacao.pdf (Informativo à População - 1 Página)
A partir dos dados de data/boletim_metadata.json e data/boletim_oficial.json.
Totalmente autônomo, multiplataforma (Windows e GitHub Actions Linux).
"""

import os
import sys
import io
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DOCS_DIR = BASE_DIR / "docs"
IMG_DIR = BASE_DIR / "img"

DOCS_DIR.mkdir(exist_ok=True)


class NumberedCanvas(canvas.Canvas):
    """Canvas com numeração de páginas dinâmica 'Página X de Y'"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 7)
        self.setFillColor(colors.HexColor("#64748b"))
        # Rodapé com número da página à direita e identificação do órgão à esquerda
        page_text = f"Página {self._pageNumber} de {page_count}"
        footer_left = "Defesa Civil Municipal de Rio das Ostras • Setor de Monitoramento e Alerta Meteorológico"
        self.drawString(1.2 * cm, 0.65 * cm, footer_left)
        self.drawRightString(A4[0] - 1.2 * cm, 0.65 * cm, page_text)
        self.restoreState()


class SinglePageCanvas(canvas.Canvas):
    """Canvas sem rodapé de página para folha única"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


def generate_charts(turnos):
    """Gera os 5 gráficos de tendência meteorológica retornando dicionário com buffers de imagem"""
    charts = {}

    labels = [t.get('rotulo_eixo', f"{t.get('dia_semana', '')[:3]} {t.get('turno', '')[:3]}") for t in turnos]
    n = len(labels)
    x = np.arange(n)

    plt.rcParams.update({
        'font.sans-serif': 'DejaVu Sans',
        'font.family': 'sans-serif',
        'figure.autolayout': True
    })

    # 1. Gráfico de Temperatura do Ar
    t_min = [t['temp_min'] for t in turnos]
    t_max = [t['temp_max'] for t in turnos]
    fig, ax = plt.subplots(figsize=(8.2, 1.85), dpi=200)
    ax.fill_between(x, t_min, t_max, color='#fee2e2', alpha=0.55)
    ax.plot(x, t_max, color='#dc2626', marker='o', markersize=4, label='Máxima (°C)', linewidth=1.3)
    ax.plot(x, t_min, color='#0284c7', marker='o', markersize=3.5, linestyle='--', label='Mínima (°C)', linewidth=1.1)
    for i in range(n):
        ax.annotate(f"{t_max[i]:.0f}°", (x[i], t_max[i]), textcoords="offset points", xytext=(0, 4), ha='center', fontsize=6.8, fontweight='bold', color='#b91c1c')
        ax.annotate(f"{t_min[i]:.0f}°", (x[i], t_min[i]), textcoords="offset points", xytext=(0, -9), ha='center', fontsize=6.5, color='#0369a1')
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=6.5)
    ax.set_ylabel("Temp (°C)", fontsize=7, color='#334155')
    ax.tick_params(axis='y', labelsize=6.5)
    ax.set_ylim(min(t_min) - 3, max(t_max) + 4)
    ax.legend(loc='upper right', fontsize=6.5, framealpha=0.85)
    ax.grid(True, linestyle=':', alpha=0.5)
    ax.set_title("1. Temperatura do Ar (°C) — Evolução por Turno", fontsize=8.2, fontweight='bold', color='#1e293b', pad=4)
    buf1 = io.BytesIO()
    plt.savefig(buf1, format='png', bbox_inches='tight', transparent=False, facecolor='white')
    plt.close(fig)
    buf1.seek(0)
    charts['temp'] = buf1

    # 2. Gráfico de Umidade Relativa do Ar
    u_min = [t['umid_min'] for t in turnos]
    u_max = [t['umid_max'] for t in turnos]
    fig, ax = plt.subplots(figsize=(8.2, 1.85), dpi=200)
    ax.fill_between(x, u_min, u_max, color='#dcfce7', alpha=0.6)
    ax.plot(x, u_max, color='#15803d', marker='o', markersize=4, label='Umid Máx (%)', linewidth=1.3)
    ax.plot(x, u_min, color='#22c55e', marker='o', markersize=3.5, linestyle='--', label='Umid Mín (%)', linewidth=1.1)
    for i in range(n):
        ax.annotate(f"{u_max[i]}%", (x[i], u_max[i]), textcoords="offset points", xytext=(0, 4), ha='center', fontsize=6.5, fontweight='bold', color='#15803d')
        ax.annotate(f"{u_min[i]}%", (x[i], u_min[i]), textcoords="offset points", xytext=(0, -9), ha='center', fontsize=6.5, color='#16a34a')
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=6.5)
    ax.set_ylabel("Umidade (%)", fontsize=7, color='#334155')
    ax.tick_params(axis='y', labelsize=6.5)
    ax.set_ylim(max(20, min(u_min) - 8), min(105, max(u_max) + 7))
    ax.legend(loc='upper right', fontsize=6.5, framealpha=0.85)
    ax.grid(True, linestyle=':', alpha=0.5)
    ax.set_title("2. Umidade Relativa do Ar (%) — Intervalo Registrado por Turno", fontsize=8.2, fontweight='bold', color='#1e293b', pad=4)
    buf2 = io.BytesIO()
    plt.savefig(buf2, format='png', bbox_inches='tight', facecolor='white')
    plt.close(fig)
    buf2.seek(0)
    charts['umid'] = buf2

    # 3. Gráfico de Pressão Atmosférica
    p_med = [t['pressao_hpa'] for t in turnos]
    fig, ax = plt.subplots(figsize=(8.2, 1.85), dpi=200)
    ax.plot(x, p_med, color='#0f766e', marker='s', markersize=4.5, linewidth=1.3, label='Pressão (hPa)')
    for i in range(n):
        ax.annotate(f"{p_med[i]}", (x[i], p_med[i]), textcoords="offset points", xytext=(0, 5), ha='center', fontsize=6.8, fontweight='bold', color='#0f766e')
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=6.5)
    ax.set_ylabel("Pressão (hPa)", fontsize=7, color='#334155')
    ax.tick_params(axis='y', labelsize=6.5)
    p_low = min(p_med) - 3
    p_high = max(p_med) + 3
    ax.set_ylim(p_low, p_high)
    ax.grid(True, linestyle=':', alpha=0.5)
    ax.set_title("3. Pressão Atmosférica ao Nível Médio do Mar (hPa) — Perfil Barométrico", fontsize=8.2, fontweight='bold', color='#1e293b', pad=4)
    buf3 = io.BytesIO()
    plt.savefig(buf3, format='png', bbox_inches='tight', facecolor='white')
    plt.close(fig)
    buf3.seek(0)
    charts['pressao'] = buf3

    # 4. Gráfico de Vento e Rajadas
    v_med = [t.get('vento_vel_media', round((t.get('vento_vel_min', 10) + t.get('vento_vel_max', 15))/2)) for t in turnos]
    v_raj = [t.get('rajada_max', 25) for t in turnos]
    v_dir = [t.get('vento_dir', 'NE') for t in turnos]
    fig, ax = plt.subplots(figsize=(8.2, 1.85), dpi=200)
    ax.bar(x - 0.15, v_med, width=0.35, color='#f87171', alpha=0.85, label='Vento Médio (km/h)')
    ax.bar(x + 0.15, v_raj, width=0.35, color='#b91c1c', alpha=0.9, label='Rajada Máx (km/h)')
    for i in range(n):
        ax.annotate(f"{v_raj[i]}\n[{v_dir[i]}]", (x[i] + 0.15, v_raj[i]), textcoords="offset points", xytext=(0, 2), ha='center', fontsize=6.0, fontweight='bold', color='#991b1b')
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=6.5)
    ax.set_ylabel("Vento (km/h)", fontsize=7, color='#334155')
    ax.tick_params(axis='y', labelsize=6.5)
    ax.set_ylim(0, max(max(v_raj) + 12, 45))
    ax.legend(loc='upper right', fontsize=6.5, framealpha=0.85)
    ax.grid(True, linestyle=':', alpha=0.5)
    ax.set_title("4. Intensidade do Vento Médio, Rajadas Máximas e Direção por Turno", fontsize=8.2, fontweight='bold', color='#1e293b', pad=4)
    buf4 = io.BytesIO()
    plt.savefig(buf4, format='png', bbox_inches='tight', facecolor='white')
    plt.close(fig)
    buf4.seek(0)
    charts['vento'] = buf4

    # 5. Gráfico de Precipitação Prevista por Turno
    ch_tot = [t.get('chuva_media', 0.0) for t in turnos]
    ch_prob = [t.get('chuva_prob', 20) for t in turnos]
    fig, ax = plt.subplots(figsize=(8.2, 1.85), dpi=200)
    bars = ax.bar(x, ch_tot, width=0.45, color='#2563eb', alpha=0.85, label='Chuva Prevista (mm)')
    for i in range(n):
        val_txt = f"{ch_tot[i]:.1f} mm\n({ch_prob[i]}%)" if ch_tot[i] > 0 else f"0.0\n({ch_prob[i]}%)"
        ax.annotate(val_txt, (x[i], ch_tot[i]), textcoords="offset points", xytext=(0, 2), ha='center', fontsize=6.0, fontweight='bold', color='#1e3a8a')
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=6.5)
    ax.set_ylabel("Chuva (mm)", fontsize=7, color='#334155')
    ax.tick_params(axis='y', labelsize=6.5)
    ax.set_ylim(0, max(max(ch_tot) * 1.45, 2.5))
    ax.grid(True, linestyle=':', alpha=0.5)
    total_prev = sum(ch_tot)
    ax.set_title(f"5. Precipitação Prevista por Turno — Total Previsto no Ciclo: {total_prev:.1f} mm", fontsize=8.2, fontweight='bold', color='#1e3a8a', pad=4)
    buf5 = io.BytesIO()
    plt.savefig(buf5, format='png', bbox_inches='tight', facecolor='white')
    plt.close(fig)
    buf5.seek(0)
    charts['chuva'] = buf5

    return charts


def build_operational_bulletin_pdf(metadata, turnos, output_path):
    """Constrói o Boletim Operacional completo de 4 páginas em padrão institucional"""
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=1.15 * cm,
        rightMargin=1.15 * cm,
        topMargin=0.85 * cm,
        bottomMargin=0.85 * cm
    )

    styles = getSampleStyleSheet()

    # Estilos customizados
    s_title_inst = ParagraphStyle('TitleInst', fontName='Helvetica-Bold', fontSize=10.5, leading=12, alignment=1, textColor=colors.HexColor('#1e3a8a'))
    s_sub_inst = ParagraphStyle('SubInst', fontName='Helvetica-Bold', fontSize=8.5, leading=10, alignment=1, textColor=colors.HexColor('#334155'))
    s_dept = ParagraphStyle('DeptInst', fontName='Helvetica', fontSize=7.2, leading=9, alignment=1, textColor=colors.HexColor('#64748b'))
    s_masthead = ParagraphStyle('Masthead', fontName='Helvetica-Bold', fontSize=11.5, leading=14, alignment=1, textColor=colors.HexColor('#1e3a8a'))
    s_meta_item = ParagraphStyle('MetaItem', fontName='Helvetica', fontSize=7.2, leading=9, textColor=colors.HexColor('#0f172a'))
    s_fontes = ParagraphStyle('Fontes', fontName='Helvetica', fontSize=6.6, leading=8.5, textColor=colors.HexColor('#64748b'))

    s_h1 = ParagraphStyle('SectionH1', fontName='Helvetica-Bold', fontSize=9.0, leading=11, textColor=colors.HexColor('#1e3a8a'), spaceBefore=4, spaceAfter=2)
    s_h2 = ParagraphStyle('SectionH2', fontName='Helvetica-Bold', fontSize=7.8, leading=9.5, textColor=colors.HexColor('#0f172a'), spaceBefore=3, spaceAfter=2)
    s_body = ParagraphStyle('BodyTextCustom', fontName='Helvetica', fontSize=6.8, leading=8.8, alignment=4, textColor=colors.HexColor('#1e293b'))
    s_glossary_title = ParagraphStyle('GlossaryTitle', fontName='Helvetica-Bold', fontSize=7.0, leading=8.5, textColor=colors.HexColor('#0f172a'))
    s_glossary_item = ParagraphStyle('GlossaryItem', fontName='Helvetica', fontSize=6.4, leading=7.8, textColor=colors.HexColor('#334155'))

    s_th = ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=6.5, leading=7.8, alignment=1, textColor=colors.white)
    s_td = ParagraphStyle('TD', fontName='Helvetica', fontSize=6.2, leading=7.4, alignment=1, textColor=colors.HexColor('#1e293b'))
    s_td_bold = ParagraphStyle('TDBold', fontName='Helvetica-Bold', fontSize=6.2, leading=7.4, alignment=1, textColor=colors.HexColor('#0f172a'))
    s_td_left = ParagraphStyle('TDLeft', fontName='Helvetica', fontSize=6.0, leading=7.2, alignment=0, textColor=colors.HexColor('#334155'))

    story = []

    # =========================================================================
    # PÁGINA 1: CABEÇALHO, SINOPSE, GLOSSÁRIO E TABELA DIA 1
    # =========================================================================

    # Cabeçalho com Logos
    logo_pref_path = str(IMG_DIR / "logo_prefeitura.png")
    logo_def_path = str(IMG_DIR / "logo_defesa_civil.png")

    img_pref = Image(logo_pref_path, width=1.85 * cm, height=1.85 * cm) if os.path.exists(logo_pref_path) else Paragraph("", styles['Normal'])
    img_def = Image(logo_def_path, width=1.85 * cm, height=1.85 * cm) if os.path.exists(logo_def_path) else Paragraph("", styles['Normal'])

    inst_text = [
        Paragraph("ESTADO DO RIO DE JANEIRO", ParagraphStyle('E', fontName='Helvetica-Bold', fontSize=7.5, leading=9, alignment=1, textColor=colors.HexColor('#64748b'))),
        Paragraph("PREFEITURA MUNICIPAL DE RIO DAS OSTRAS", s_title_inst),
        Paragraph("SUBSECRETARIA DE DEFESA CIVIL", s_sub_inst),
        Paragraph("SETOR DE MONITORAMENTO E ALERTA METEOROLÓGICO", s_dept),
    ]

    header_table = Table([[img_pref, inst_text, img_def]], colWidths=[2.2 * cm, 14.2 * cm, 2.2 * cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ('TOPPADDING', (0, 0), (-1, -1), 1),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 1.5 * mm))
    story.append(HRFlowable(width="100%", thickness=1.4, color=colors.HexColor("#1e3a8a"), spaceBefore=0, spaceAfter=2))

    # Título do Boletim
    story.append(Paragraph("B O L E T I M   M E T E O R O L Ó G I C O   O P E R A C I O N A L", s_masthead))
    story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#94a3b8"), spaceBefore=2, spaceAfter=2))

    # Barra de Metadados
    periodo_str = metadata.get('periodo', '09/10 a 11/10/2026')
    emissao_str = metadata.get('emissao', '17:00h')
    meta_table = Table([
        [
            Paragraph(f"<b>Município:</b> Rio das Ostras - RJ", s_meta_item),
            Paragraph(f"<b>Período de Validade:</b> {periodo_str}", ParagraphStyle('MC', parent=s_meta_item, alignment=1)),
            Paragraph(f"<b>Emissão Oficial:</b> {emissao_str}", ParagraphStyle('MR', parent=s_meta_item, alignment=2))
        ]
    ], colWidths=[5.5 * cm, 7.6 * cm, 5.5 * cm])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ('TOPPADDING', (0, 0), (-1, -1), 1),
    ]))
    story.append(meta_table)

    fontes_txt = "<b>Fontes Oficiais Consultadas:</b> INMET (COSMO 7x7 km e Estações Automáticas), CPTEC/INPE (WRF), ECMWF (Windy), INEA (Alerta de Cheias RH-VIII), CEMADEN-RJ e Marinha do Brasil (CHM / Cartas Sinóticas)."
    story.append(Paragraph(fontes_txt, s_fontes))
    story.append(HRFlowable(width="100%", thickness=1.2, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=3))

    # 1. Panorama Sinótico Geral
    story.append(Paragraph("1. Panorama Sinótico Geral & Dinâmica Atmosférica", s_h1))
    sinopse_full = metadata.get('sinopse_geral', '')
    sin_paragrafos = [p.strip() for p in sinopse_full.split('\n\n') if p.strip()]

    # Exibe os 2 primeiros parágrafos da sinopse na página 1
    p1_txt = sin_paragrafos[0] if len(sin_paragrafos) > 0 else sinopse_full
    p2_txt = sin_paragrafos[1] if len(sin_paragrafos) > 1 else ""

    story.append(Paragraph(p1_txt, s_body))
    if p2_txt:
        story.append(Spacer(1, 1.5 * mm))
        story.append(Paragraph(p2_txt, s_body))

    story.append(Spacer(1, 2 * mm))

    # Glossário Operacional (Caixa de 2 colunas com borda sutil)
    gloss_list = metadata.get('glossario', [])
    col1_items = []
    col2_items = []
    for idx, item in enumerate(gloss_list[:6]):
        t = item.get('termo', '')
        d = item.get('def', '')
        p_item = Paragraph(f"<b>• {t}:</b> {d}", s_glossary_item)
        if idx % 2 == 0:
            col1_items.append(p_item)
        else:
            col2_items.append(p_item)

    gloss_table = Table([
        [Paragraph("<b>Glossário Operacional de Defesa Civil:</b>", s_glossary_title), ""],
        [col1_items, col2_items]
    ], colWidths=[9.3 * cm, 9.3 * cm])
    gloss_table.setStyle(TableStyle([
        ('SPAN', (0, 0), (1, 0)),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(gloss_table)
    story.append(Spacer(1, 2.5 * mm))

    # Seção 2: Tabela de Turnos do Dia 1
    story.append(Paragraph("2. Previsão do Tempo e Condições Marítimas por Turnos", s_h1))

    # Agrupa turnos por dia
    dias_grupos = []
    curr_dia = None
    curr_list = []
    for t in turnos:
        d_iso = t.get('data_iso', '')
        if d_iso != curr_dia:
            if curr_list:
                dias_grupos.append(curr_list)
            curr_dia = d_iso
            curr_list = [t]
        else:
            curr_list.append(t)
    if curr_list:
        dias_grupos.append(curr_list)

    def format_turno_table(dia_turnos):
        first_t = dia_turnos[0]
        dia_nome = first_t.get('dia_semana', '')
        data_fmt = first_t.get('data_iso', '')
        if '-' in data_fmt:
            partes = data_fmt.split('-')
            data_fmt_br = f"{partes[2]}/{partes[1]}/{partes[0]}"
        else:
            data_fmt_br = data_fmt

        header_row = [
            Paragraph("Turno", s_th),
            Paragraph("Temperatura", s_th),
            Paragraph("Umidade", s_th),
            Paragraph("Pressão", s_th),
            Paragraph("Vento e Rajadas", s_th),
            Paragraph("Precipitação", s_th),
            Paragraph("Estado do Mar", s_th)
        ]
        rows = [header_row]
        for tr in dia_turnos:
            t_nome = tr.get('turno', '')
            temp_str = f"{tr.get('temp_min', 0)}° a {tr.get('temp_max', 0)}°C"
            umid_str = f"{tr.get('umid_min', 0)}% a {tr.get('umid_max', 0)}%"
            press_str = f"{tr.get('pressao_hpa', 1014)} hPa"
            v_dir = tr.get('vento_dir', 'NE')
            v_min = tr.get('vento_vel_min', 10)
            v_max = tr.get('vento_vel_max', 20)
            v_raj = tr.get('rajada_max', 30)
            vento_str = f"{v_dir} {v_min}-{v_max} km/h | Raj: {v_raj} km/h"
            ch_med = tr.get('chuva_media', 0.0)
            ch_prob = tr.get('chuva_prob', 10)
            chuva_str = f"{ch_med:.1f} mm ({ch_prob}%)"
            mar_ond = tr.get('mar_ondas', '1,2 a 1,6 m')
            mar_cond = tr.get('mar_condicao', 'Moderado')
            mar_str = f"{mar_ond} ({mar_cond})"

            rows.append([
                Paragraph(t_nome, s_td_bold),
                Paragraph(temp_str, s_td),
                Paragraph(umid_str, s_td),
                Paragraph(press_str, s_td),
                Paragraph(vento_str, s_td),
                Paragraph(chuva_str, s_td),
                Paragraph(mar_str, s_td),
            ])

        col_w = [2.2 * cm, 2.5 * cm, 2.2 * cm, 2.4 * cm, 4.3 * cm, 2.4 * cm, 2.6 * cm]
        tbl = Table(rows, colWidths=col_w)
        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0, 0), (-1, -1), 2.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 2),
            ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ]))
        return dia_nome, data_fmt_br, tbl

    # Tabela do Dia 1 na Página 1
    if len(dias_grupos) > 0:
        d1_nome, d1_data, tbl_d1 = format_turno_table(dias_grupos[0])
        d1_sub = metadata.get('dias_resumo', [{}])[0].get('subtitulo', '') if metadata.get('dias_resumo') else ''
        story.append(Paragraph(f"<b>{d1_nome} — {d1_data}</b> ({d1_sub})", s_h2))
        story.append(tbl_d1)

    story.append(PageBreak())

    # =========================================================================
    # PÁGINA 2: TABELAS DIA 2 E DIA 3 + PLANCON 2025/2026
    # =========================================================================
    # Tabela do Dia 2
    if len(dias_grupos) > 1:
        d2_nome, d2_data, tbl_d2 = format_turno_table(dias_grupos[1])
        d2_sub = metadata.get('dias_resumo', [{}, {}])[1].get('subtitulo', '') if len(metadata.get('dias_resumo', [])) > 1 else ''
        story.append(Paragraph(f"<b>{d2_nome} — {d2_data}</b> ({d2_sub})", s_h2))
        story.append(tbl_d2)
        story.append(Spacer(1, 2.5 * mm))

    # Tabela do Dia 3
    if len(dias_grupos) > 2:
        d3_nome, d3_data, tbl_d3 = format_turno_table(dias_grupos[2])
        d3_sub = metadata.get('dias_resumo', [{}, {}, {}])[2].get('subtitulo', '') if len(metadata.get('dias_resumo', [])) > 2 else ''
        story.append(Paragraph(f"<b>{d3_nome} — {d3_data}</b> ({d3_sub})", s_h2))
        story.append(tbl_d3)
        story.append(Spacer(1, 3 * mm))

    story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#94a3b8"), spaceBefore=1, spaceAfter=2))

    # PLANCON: Levantamento de Impactos por Bairros
    story.append(Paragraph("Levantamento de Impactos por Bairros — PLANCON 2025/2026", s_h1))
    impactos = metadata.get('impactos_bairros', [])

    d0_rot = dias_grupos[0][0].get('dia_semana', '')[:3] if len(dias_grupos) > 0 else "D0"
    d1_rot = dias_grupos[1][0].get('dia_semana', '')[:3] if len(dias_grupos) > 1 else "D1"
    d2_rot = dias_grupos[2][0].get('dia_semana', '')[:3] if len(dias_grupos) > 2 else "D2"

    plancon_header = [
        Paragraph("Setor e Bairros", s_th),
        Paragraph(f"Risco {d0_rot}", s_th),
        Paragraph(f"Risco {d1_rot}", s_th),
        Paragraph(f"Risco {d2_rot}", s_th),
        Paragraph("Impactos Esperados (PLANCON)", s_th),
        Paragraph("Ações Operacionais Imediatas", s_th)
    ]
    plancon_rows = [plancon_header]

    for item in impactos:
        setor = item.get('setor', '')
        imp = item.get('impactos', '')
        aco = item.get('acoes', '')
        r0 = item.get('risco_sab', 'OBSERVAÇÃO')
        r1 = item.get('risco_dom', 'OBSERVAÇÃO')
        r2 = item.get('risco_seg', 'OBSERVAÇÃO')

        def badge_style(val):
            bg = "#f1f5f9"
            fg = "#475569"
            if 'ATENÇÃO' in str(val).upper():
                bg = "#fef3c7"
                fg = "#b45309"
            elif 'ALERTA' in str(val).upper():
                bg = "#fee2e2"
                fg = "#b91c1c"
            return Paragraph(f"<b>{val}</b>", ParagraphStyle('B', fontName='Helvetica-Bold', fontSize=5.6, leading=6.8, alignment=1, textColor=colors.HexColor(fg)))

        plancon_rows.append([
            Paragraph(f"<b>{setor}</b>", s_td_left),
            badge_style(r0),
            badge_style(r1),
            badge_style(r2),
            Paragraph(imp, s_td_left),
            Paragraph(aco, s_td_left),
        ])

    plancon_col_w = [3.8 * cm, 1.6 * cm, 1.6 * cm, 1.6 * cm, 5.2 * cm, 4.8 * cm]
    plancon_tbl = Table(plancon_rows, colWidths=plancon_col_w)
    plancon_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(plancon_tbl)

    story.append(PageBreak())

    # =========================================================================
    # PÁGINA 3: GRÁFICOS 1, 2 E 3 + SÍNTESE HIGROTÉRMICA E BAROMÉTRICA
    # =========================================================================
    charts = generate_charts(turnos)

    story.append(Paragraph(f"3. Gráficos de Tendência Meteorológica por Variável ({periodo_str})", s_h1))
    story.append(Spacer(1, 1.5 * mm))

    # Gráfico 1: Temperatura
    img_temp = Image(charts['temp'], width=18.6 * cm, height=4.2 * cm)
    story.append(img_temp)
    story.append(Spacer(1, 1.5 * mm))

    # Gráfico 2: Umidade
    img_umid = Image(charts['umid'], width=18.6 * cm, height=4.2 * cm)
    story.append(img_umid)
    story.append(Spacer(1, 1.5 * mm))

    # Gráfico 3: Pressão
    img_press = Image(charts['pressao'], width=18.6 * cm, height=4.2 * cm)
    story.append(img_press)
    story.append(Spacer(1, 2 * mm))

    # Síntese Técnica Higrotérmica e Barométrica
    kpi_pico = metadata.get('kpis', {}).get('pico_calor', '33°C')
    t_min_val = min([t['temp_min'] for t in turnos])
    t_max_val = max([t['temp_max'] for t in turnos])
    u_min_val = min([t['umid_min'] for t in turnos])
    u_max_val = max([t['umid_max'] for t in turnos])
    p_min_val = min([t['pressao_hpa'] for t in turnos])
    p_max_val = max([t['pressao_hpa'] for t in turnos])

    sintese_higro = (
        f"<b>1. Dinâmica Higrotérmica:</b> O gradiente térmico oscila entre mínima de {t_min_val}°C ao amanhecer e pico máximo de {t_max_val}°C nas horas mais quentes da tarde. "
        f"A amplitude térmica alcança até {t_max_val - t_min_val}°C no ciclo. A umidade varia de {u_min_val}% à tarde até {u_max_val}% na madrugada.<br/>"
        f"<b>2. Perfil Barométrico:</b> A pressão atmosférica oscila entre {p_min_val} hPa e {p_max_val} hPa, caracterizando estabilidade barométrica regional com flutuação de maré barométrica diurna."
    )

    box_sintese_1 = Table([
        [Paragraph("<b>Síntese Técnica dos Indicadores Higrotérmicos e Barométricos:</b>", s_glossary_title)],
        [Paragraph(sintese_higro, s_body)]
    ], colWidths=[18.6 * cm])
    box_sintese_1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(box_sintese_1)

    story.append(PageBreak())

    # =========================================================================
    # PÁGINA 4: GRÁFICOS 4 E 5 + SÍNTESE + AVISOS OFICIAIS + RODAPÉ INSTITUCIONAL
    # =========================================================================
    # Gráfico 4: Vento e Rajadas
    img_vento = Image(charts['vento'], width=18.6 * cm, height=4.2 * cm)
    story.append(img_vento)
    story.append(Spacer(1, 1.5 * mm))

    # Gráfico 5: Precipitação
    img_chuva = Image(charts['chuva'], width=18.6 * cm, height=4.2 * cm)
    story.append(img_chuva)
    story.append(Spacer(1, 2 * mm))

    # Síntese Técnica Eólica e Pluviométrica
    v_max_raj = max([t.get('rajada_max', 30) for t in turnos])
    ch_total_3d = sum([t.get('chuva_media', 0.0) for t in turnos])
    jundia_cota = metadata.get('kpis', {}).get('jundia_nivel', '1.69 m')
    jundia_status = metadata.get('kpis', {}).get('jundia_status', 'VIGILÂNCIA')

    sintese_vento_chuva = (
        f"<b>1. Comportamento Eólico e Marítimo:</b> Escoamento predominante de Nordeste/Leste moderado com rajadas pontuais na orla alcançando até {v_max_raj} km/h durante as tardes. "
        f"Mar com ondas entre 1,2 e 1,6 m em condições normais de navegação para a Área Delta.<br/>"
        f"<b>2. Regime Pluviométrico Operacional:</b> Acumulado total previsto de {ch_total_3d:.1f} mm em 72 horas em forma de pancadas isoladas decorrentes do calor diurno. "
        f"A bacia do Rio Jundiá opera em regime seguro com cota telemétrica em {jundia_cota} (Status: {jundia_status}), sem risco de transbordamento."
    )

    box_sintese_2 = Table([
        [Paragraph("<b>Síntese Técnica da Dinâmica Eólica, Marítima e Pluviométrica:</b>", s_glossary_title)],
        [Paragraph(sintese_vento_chuva, s_body)]
    ], colWidths=[18.6 * cm])
    box_sintese_2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(box_sintese_2)
    story.append(Spacer(1, 2.5 * mm))

    # 4. Avisos Meteorológicos e Oceanográficos Oficiais
    story.append(Paragraph("4. Avisos Meteorológicos e Oceanográficos Oficiais", s_h1))

    # Box Marinha
    marinha_txt = (
        "<b>• Área Delta (São Tomé a Cabo Frio):</b> Sem avisos de mau tempo vigentes. Mar moderado com ondas de 1,2 a 1,6 m.<br/>"
        "<b>• Vento Costeiro:</b> Rajadas regulares na orla de 35 a 42 km/h associadas à circulação de brisa e convecção diurna."
    )
    # Box INMET / INEA
    alerta_meteo_detalhe = "Sem avisos meteorológicos severos vigentes para o município."
    for al in metadata.get('alertas_estruturados', []):
        if al.get('tipo') == 'meteorologico':
            alerta_meteo_detalhe = f"{al.get('status', '')}: {al.get('detalhe', '')} — {al.get('impacto', '')}"

    inmet_txt = (
        f"<b>• INMET Avisos Oficiais:</b> {alerta_meteo_detalhe}<br/>"
        f"<b>• INEA Alerta de Cheias:</b> Rio Jundiá com nível telemétrico em {jundia_cota} (Status: {jundia_status}). Escoamento plenamente normalizado."
    )

    box_marinha = Table([
        [Paragraph("<b>Marinha do Brasil (CHM) — Avisos Oficiais:</b>", ParagraphStyle('MB', fontName='Helvetica-Bold', fontSize=6.8, leading=8.2, textColor=colors.HexColor('#1e3a8a')))],
        [Paragraph(marinha_txt, s_body)]
    ], colWidths=[9.15 * cm])
    box_marinha.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#1e3a8a")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))

    box_inmet = Table([
        [Paragraph("<b>INMET, INEA e CEMADEN — Alertas Oficiais:</b>", ParagraphStyle('IB', fontName='Helvetica-Bold', fontSize=6.8, leading=8.2, textColor=colors.HexColor('#b45309')))],
        [Paragraph(inmet_txt, s_body)]
    ], colWidths=[9.15 * cm])
    box_inmet.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#d97706")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))

    avisos_grid = Table([[box_marinha, box_inmet]], colWidths=[9.3 * cm, 9.3 * cm])
    avisos_grid.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(avisos_grid)
    story.append(Spacer(1, 3 * mm))

    # Rodapé Oficial Institucional
    rodape_table = Table([
        [
            Paragraph("<b>Defesa Civil Municipal de Rio das Ostras</b><br/><font color='#94a3b8' size=6>Setor de Monitoramento e Alerta Meteorológico 24h</font>", ParagraphStyle('RF', fontName='Helvetica', fontSize=7.5, leading=9.5, textColor=colors.white)),
            Paragraph("<b>PLANTÃO DE EMERGÊNCIA: 199</b><br/><font color='#e2e8f0' size=6.5>Telefone Geral: (22) 2760-8360 / WhatsApp: (22) 99245-5678</font>", ParagraphStyle('RR', fontName='Helvetica', fontSize=8.0, leading=10, alignment=2, textColor=colors.HexColor('#f59e0b')))
        ]
    ], colWidths=[10.5 * cm, 8.1 * cm])
    rodape_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#0f172a")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(rodape_table)

    # Constrói o documento com NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"   [PDF] Boletim Operacional (4 páginas) salvo com sucesso em: {output_path}")


def build_population_informative_pdf(metadata, turnos, output_path):
    """Constrói o Informativo à População de exatamente 1 página simplificada"""
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=1.1 * cm,
        rightMargin=1.1 * cm,
        topMargin=0.65 * cm,
        bottomMargin=0.65 * cm
    )

    styles = getSampleStyleSheet()

    s_title = ParagraphStyle('T', fontName='Helvetica-Bold', fontSize=10.0, leading=12, alignment=1, textColor=colors.HexColor('#0f172a'))
    s_sub = ParagraphStyle('S', fontName='Helvetica-Bold', fontSize=8.2, leading=10, alignment=1, textColor=colors.HexColor('#1e3a8a'))
    s_dept = ParagraphStyle('D', fontName='Helvetica', fontSize=6.8, leading=8.5, alignment=1, textColor=colors.HexColor('#64748b'))
    s_box_title = ParagraphStyle('BT', fontName='Helvetica-Bold', fontSize=9.5, leading=11, alignment=1, textColor=colors.HexColor('#0f172a'))
    s_box_sub = ParagraphStyle('BS', fontName='Helvetica-Oblique', fontSize=7.0, leading=8.5, alignment=1, textColor=colors.HexColor('#334155'))
    s_meta = ParagraphStyle('M', fontName='Helvetica', fontSize=7.0, leading=8.5, textColor=colors.HexColor('#334155'))
    s_alerta = ParagraphStyle('A', fontName='Helvetica', fontSize=6.8, leading=8.5, textColor=colors.HexColor('#0f172a'))

    s_card_title = ParagraphStyle('CT', fontName='Helvetica-Bold', fontSize=7.5, leading=9.0, textColor=colors.HexColor('#0f172a'))
    s_card_topic = ParagraphStyle('CTopic', fontName='Helvetica', fontSize=6.4, leading=8.0, textColor=colors.HexColor('#1e293b'))
    s_pill_lbl = ParagraphStyle('PL', fontName='Helvetica-Bold', fontSize=5.5, leading=6.5, alignment=1, textColor=colors.HexColor('#64748b'))
    s_pill_val = ParagraphStyle('PV', fontName='Helvetica-Bold', fontSize=6.5, leading=7.8, alignment=1, textColor=colors.HexColor('#0f172a'))

    story = []

    # Cabeçalho
    logo_pref_path = str(IMG_DIR / "logo_prefeitura.png")
    logo_def_path = str(IMG_DIR / "logo_defesa_civil.png")
    img_pref = Image(logo_pref_path, width=1.6 * cm, height=1.6 * cm) if os.path.exists(logo_pref_path) else Paragraph("", styles['Normal'])
    img_def = Image(logo_def_path, width=1.6 * cm, height=1.6 * cm) if os.path.exists(logo_def_path) else Paragraph("", styles['Normal'])

    inst_text = [
        Paragraph("ESTADO DO RIO DE JANEIRO", ParagraphStyle('E', fontName='Helvetica-Bold', fontSize=7.0, leading=8.5, alignment=1, textColor=colors.HexColor('#64748b'))),
        Paragraph("PREFEITURA MUNICIPAL DE RIO DAS OSTRAS", s_title),
        Paragraph("SUBSECRETARIA DE DEFESA CIVIL", s_sub),
        Paragraph("COMUNICAÇÃO SOCIAL E ATENDIMENTO À COMUNIDADE", s_dept),
    ]

    header_table = Table([[img_pref, inst_text, img_def]], colWidths=[2.0 * cm, 14.8 * cm, 2.0 * cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ('TOPPADDING', (0, 0), (-1, -1), 1),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 1.2 * mm))

    # Box Título do Informativo
    box_t = Table([
        [Paragraph("INFORMATIVO METEOROLÓGICO À POPULAÇÃO", s_box_title)],
        [Paragraph("Previsão Operacional Simplificada — Rio das Ostras / RJ", s_box_sub)]
    ], colWidths=[18.8 * cm])
    box_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1.0, colors.HexColor("#0f172a")),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
    ]))
    story.append(box_t)
    story.append(Spacer(1, 1.2 * mm))

    # Metadados
    periodo_str = metadata.get('periodo', '12/10 a 14/10/2026')
    emissao_str = metadata.get('emissao', '17:00h')
    meta_table = Table([
        [
            Paragraph(f"<b>Localidade:</b> Rio das Ostras - RJ", s_meta),
            Paragraph(f"<b>Período:</b> {periodo_str}", ParagraphStyle('MC', parent=s_meta, alignment=1)),
            Paragraph(f"<b>Emissão Oficial:</b> {emissao_str}", ParagraphStyle('MR', parent=s_meta, alignment=2))
        ]
    ], colWidths=[5.5 * cm, 7.8 * cm, 5.5 * cm])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0.5),
        ('TOPPADDING', (0, 0), (-1, -1), 0.5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 1.2 * mm))

    # Caixa Informe de Alerta
    informe_alerta_txt = metadata.get('informe_alerta', 'Condições regulares sem riscos imediatos.')
    badge_alerta = Table([
        [
            Paragraph("<b>INFORME DE ALERTA</b>", ParagraphStyle('IA', fontName='Helvetica-Bold', fontSize=6.5, leading=7.5, alignment=1, textColor=colors.white)),
            Paragraph(f"<b>Alertas Oficiais em Vigor:</b> {informe_alerta_txt}", s_alerta)
        ]
    ], colWidths=[3.2 * cm, 15.4 * cm])
    badge_alerta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor("#0f172a")),
        ('BACKGROUND', (1, 0), (1, 0), colors.white),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#0f172a")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(badge_alerta)
    story.append(Spacer(1, 2.0 * mm))

    # 3 Cards para os 3 Dias
    dias_resumo = metadata.get('dias_resumo', [])
    for d_idx, d_obj in enumerate(dias_resumo[:3]):
        dia_rot = d_obj.get('dia', f"DIA {d_idx+1}")
        sub_rot = d_obj.get('subtitulo', '')
        badge_txt = d_obj.get('badge', 'OBSERVAÇÃO')
        badge_color = "#b45309" if "AVISO" in badge_txt or "ATENÇÃO" in badge_txt else "#475569"
        badge_border = "#d97706" if "AVISO" in badge_txt or "ATENÇÃO" in badge_txt else "#94a3b8"

        # Cabeçalho do Card
        card_header = Table([
            [
                Paragraph(f"<b>{dia_rot}</b> — <font size=6.8 color='#475569'>{sub_rot}</font>", s_card_title),
                Paragraph(f"<b>{badge_txt}</b>", ParagraphStyle('CB', fontName='Helvetica-Bold', fontSize=6.2, leading=7.2, alignment=1, textColor=colors.HexColor(badge_color)))
            ]
        ], colWidths=[15.2 * cm, 3.4 * cm])
        card_header.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
            ('TOPPADDING', (0, 0), (-1, -1), 1),
        ]))

        # 5 Tópicos do cidadão
        topicos = d_obj.get('informe_populacao', [])
        topicos_cells = []
        for top in topicos:
            topicos_cells.append([Paragraph(f"• {top}", s_card_topic)])

        topicos_table = Table(topicos_cells, colWidths=[18.4 * cm])
        topicos_table.setStyle(TableStyle([
            ('TOPPADDING', (0, 0), (-1, -1), 1),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
            ('LEFTPADDING', (0, 0), (-1, -1), 2),
            ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ]))

        # Mini tabela de indicadores
        pils = d_obj.get('pilares', {})
        ceu_v = pils.get('ceu', {}).get('val', 'Nublado')
        temp_v = pils.get('temp', {}).get('val', '20° a 30°C')
        umid_v = pils.get('umid', {}).get('val', '70% a 95%')
        vento_v = pils.get('vento', {}).get('val', 'Rajadas 35 km/h')
        chuva_v = pils.get('chuva', {}).get('val', '0.0 mm')
        mar_v = pils.get('mar', {}).get('val', '1,2 a 1,6 m')

        pills_tbl = Table([
            [
                Paragraph("CÉU", s_pill_lbl),
                Paragraph("TEMPERATURA", s_pill_lbl),
                Paragraph("UMIDADE", s_pill_lbl),
                Paragraph("VENTO & RAJADAS", s_pill_lbl),
                Paragraph("CHUVA", s_pill_lbl),
                Paragraph("MAR E PRAIA", s_pill_lbl),
            ],
            [
                Paragraph(ceu_v, s_pill_val),
                Paragraph(temp_v, s_pill_val),
                Paragraph(umid_v, s_pill_val),
                Paragraph(vento_v, s_pill_val),
                Paragraph(chuva_v, s_pill_val),
                Paragraph(mar_v, s_pill_val),
            ]
        ], colWidths=[3.0 * cm, 3.1 * cm, 3.0 * cm, 3.2 * cm, 3.0 * cm, 3.1 * cm])
        pills_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 1.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5),
        ]))

        card_wrapper = Table([
            [card_header],
            [topicos_table],
            [pills_tbl]
        ], colWidths=[18.8 * cm])
        card_wrapper.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.white),
            ('BOX', (0, 0), (-1, -1), 0.6, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0, 0), (-1, -1), 2.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 3),
            ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(card_wrapper)
        story.append(Spacer(1, 1.8 * mm))

    # Rodapé Oficial
    rodape_tbl = Table([
        [
            Paragraph("<b>Defesa Civil Municipal de Rio das Ostras</b> — Plantão Permanente 24h", ParagraphStyle('RP1', fontName='Helvetica-Bold', fontSize=7.0, leading=8.5, textColor=colors.white)),
            Paragraph("<b>EMERGÊNCIA: 199</b> | Telefone Geral: (22) 2760-8360 | WhatsApp: (22) 99245-5678", ParagraphStyle('RP2', fontName='Helvetica-Bold', fontSize=7.2, leading=8.5, alignment=2, textColor=colors.HexColor('#f59e0b')))
        ]
    ], colWidths=[9.8 * cm, 9.0 * cm])
    rodape_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#0f172a")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(rodape_tbl)

    doc.build(story, canvasmaker=SinglePageCanvas)
    print(f"   [PDF] Informativo à População (1 página) salvo com sucesso em: {output_path}")


def generate_all_bulletins():
    """Lê os JSONs oficiais e gera ambos os PDFs em docs/"""
    meta_path = DATA_DIR / "boletim_metadata.json"
    oficial_path = DATA_DIR / "boletim_oficial.json"

    if not meta_path.exists() or not oficial_path.exists():
        print(f"   [ERRO] Arquivos {meta_path.name} ou {oficial_path.name} não encontrados!")
        return False

    with open(meta_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    with open(oficial_path, 'r', encoding='utf-8') as f:
        turnos = json.load(f)

    pdf_operacional = DOCS_DIR / "boletim_operacional.pdf"
    pdf_populacao = DOCS_DIR / "informativo_populacao.pdf"

    build_operational_bulletin_pdf(metadata, turnos, pdf_operacional)
    build_population_informative_pdf(metadata, turnos, pdf_populacao)
    return True


if __name__ == "__main__":
    generate_all_bulletins()
