"""
Gerador de Imagens Oficiais para Redes Sociais - Design Premium Paleta do Site
Identidade visual pessoal: @tempoemriodasostras (SEM qualquer menção à Defesa Civil)
Design em lista corrida, elegante, tipografia grande e nítida, paleta cerâmica oficial.

Produz:
- img/balneabilidade_stories.png (1080x1920 px - Stories 9:16)
- img/balneabilidade_post.png (1080x1350 px - Post Feed 4:5)
"""

import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
IMG_DIR = BASE_DIR / "img"
IMG_DIR.mkdir(parents=True, exist_ok=True)

def load_balneabilidade_data():
    json_path = DATA_DIR / "balneabilidade.json"
    if json_path.exists():
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def get_fonts():
    font_paths = [
        r"C:\Windows\Fonts\segoeuib.ttf",  # Segoe UI Bold
        r"C:\Windows\Fonts\segoeui.ttf",   # Segoe UI Regular
        r"C:\Windows\Fonts\arialbd.ttf",   # Arial Bold
        r"C:\Windows\Fonts\arial.ttf"      # Arial Regular
    ]
    bold_path = font_paths[0] if Path(font_paths[0]).exists() else (font_paths[2] if Path(font_paths[2]).exists() else None)
    reg_path = font_paths[1] if Path(font_paths[1]).exists() else (font_paths[3] if Path(font_paths[3]).exists() else None)
    
    def font(size, bold=False):
        p = bold_path if bold else reg_path
        if p:
            try:
                return ImageFont.truetype(p, int(size))
            except Exception:
                pass
        return ImageFont.load_default()
    return font

def clean_praia_name(name):
    for pref in ["Praia das ", "Praia da ", "Praia do ", "Praia de ", "Praia "]:
        if name.startswith(pref):
            return name[len(pref):]
    return name

def draw_rounded_rect(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=int(radius), fill=fill, outline=outline, width=int(width))

def draw_check_icon(draw, cx, cy, size=14, color="#15803d"):
    p1 = (cx - size * 0.45, cy)
    p2 = (cx - size * 0.1, cy + size * 0.4)
    p3 = (cx + size * 0.5, cy - size * 0.4)
    draw.line([p1, p2, p3], fill=color, width=4, joint="curve")

def draw_alert_icon(draw, cx, cy, size=14, color="#b91c1c"):
    draw.line([(cx, cy - size * 0.45), (cx, cy + size * 0.1)], fill=color, width=4)
    draw.ellipse([cx - 2, cy + size * 0.3, cx + 2, cy + size * 0.45], fill=color)

def generate_stories_card(data):
    """
    Stories 1080x1920 (9:16)
    Design em lista corrida no estilo do modelo, com paleta do site:
    Fundo #f8fafc, barra vertical coral, divisórias limpas, tipografia grande e nítida.
    """
    W, H = 1080, 1920
    im = Image.new("RGB", (W, H), "#f8fafc")
    draw = ImageDraw.Draw(im)
    font = get_fonts()

    # Faixa lateral decorativa sutil da paleta cerâmica do site
    draw.rectangle([0, 0, 14, H], fill="#f07a53") # Coral da paleta oficial do site
    draw.rectangle([14, 0, 20, H], fill="#6d8ba6") # Azul ardósia da paleta

    pad_x = 65

    # 1. Topo: Identificador Pessoal e Fonte Oficial
    top_y = 135
    draw.text((pad_x, top_y), "@tempoemriodasostras", font=font(26, bold=True), fill="#000000")
    draw.text((pad_x, top_y + 34), "Monitoramento de Meteorologia, Orla & Praias", font=font(18, bold=False), fill="#475569")
    
    # Badge INEA à direita
    badge_txt = "DADOS DO INEA"
    f_badge = font(16, bold=True)
    bbox = f_badge.getbbox(badge_txt)
    bw = (bbox[2] - bbox[0]) + 36
    draw_rounded_rect(draw, (W - pad_x - bw, top_y + 4, W - pad_x, top_y + 48), 10, fill="#ffffff", outline="#cbd5e1", width=2)
    draw.text((W - pad_x - bw + 18, top_y + 14), badge_txt, font=f_badge, fill="#000000")

    # 2. Cabeçalho Principal (Estilo idêntico ao modelo com barra vertical)
    title_y = top_y + 90
    bar_h = 102
    draw_rounded_rect(draw, (pad_x, title_y, pad_x + 9, title_y + bar_h), 4, fill="#f07a53")

    draw.text((pad_x + 26, title_y - 2), "BALNEABILIDADE DAS", font=font(34, bold=True), fill="#000000")
    draw.text((pad_x + 26, title_y + 38), "PRAIAS", font=font(52, bold=True), fill="#000000")

    data_boletim = data.get("data_boletim", "24 de Outubro de 2026")
    boletim_num = data.get("boletim_numero", 20)
    draw.text((pad_x + 26, title_y + 104), f"Boletim Oficial nº {boletim_num} • {data_boletim}", font=font(20, bold=False), fill="#475569")

    # Placar Geral de Balneabilidade
    pontos = data.get("pontos", [])
    proprias = [p for p in pontos if str(p.get("status", "")).upper() == "PRÓPRIA"]
    total = len(pontos) if pontos else 12
    perc = int(round((len(proprias) / total) * 100)) if total else 75

    placar_y = title_y + 148
    draw_rounded_rect(draw, (pad_x, placar_y, W - pad_x, placar_y + 70), 14, fill="#ffffff", outline="#6d8ba6", width=2)
    draw.text((pad_x + 28, placar_y + 12), f"{len(proprias)} DE {total} PRAIAS PRÓPRIAS PARA BANHO ({perc}%)", font=font(23, bold=True), fill="#000000")
    draw.text((pad_x + 28, placar_y + 40), "Análise microbiológica oficial divulgada pelo INEA", font=font(16, bold=False), fill="#475569")

    # 3. Lista Ponto a Ponto (Estilo Lista corrida com divisórias finas)
    list_y = placar_y + 92
    draw.text((pad_x, list_y), "CONDIÇÃO POR PONTO DE COLETA", font=font(20, bold=True), fill="#000000")
    draw.line([(pad_x, list_y + 28), (W - pad_x, list_y + 28)], fill="#cbd5e1", width=2)

    curr_y = list_y + 40
    row_h = 88

    for i, p in enumerate(pontos):
        is_propria = str(p.get("status", "")).upper() == "PRÓPRIA"
        nome = clean_praia_name(p.get("praia", ""))
        cod = p.get("codigo", "")
        loc = p.get("localizacao", "")

        # Nome da Praia (Grande e em negrito preto)
        draw.text((pad_x + 8, curr_y + 8), nome, font=font(27, bold=True), fill="#000000")
        
        # Código e Localização
        sub_desc = f"{cod} • {loc}" if loc else cod
        if len(sub_desc) > 54:
            sub_desc = sub_desc[:52] + "..."
        draw.text((pad_x + 8, curr_y + 45), sub_desc, font=font(17, bold=False), fill="#475569")

        # Badge de Status à Direita (Design limpo estilo pill)
        pill_w = 230
        pill_h = 52
        pill_x1 = W - pad_x - pill_w
        pill_x2 = W - pad_x
        pill_y1 = curr_y + 14
        pill_y2 = pill_y1 + pill_h

        if is_propria:
            draw_rounded_rect(draw, (pill_x1, pill_y1, pill_x2, pill_y2), 12, fill="#dcfce7", outline="#22c55e", width=2)
            draw_check_icon(draw, pill_x1 + 30, pill_y1 + 26, size=15, color="#15803d")
            draw.text((pill_x1 + 56, pill_y1 + 13), "PRÓPRIA", font=font(22, bold=True), fill="#14532d")
        else:
            draw_rounded_rect(draw, (pill_x1, pill_y1, pill_x2, pill_y2), 12, fill="#fee2e2", outline="#ef4444", width=2)
            draw_alert_icon(draw, pill_x1 + 30, pill_y1 + 26, size=15, color="#b91c1c")
            draw.text((pill_x1 + 56, pill_y1 + 13), "ATENÇÃO", font=font(22, bold=True), fill="#7f1d1d")

        # Linha divisória sutil entre os pontos
        draw.line([(pad_x, curr_y + row_h), (W - pad_x, curr_y + row_h)], fill="#e2e8f0", width=1)
        curr_y += row_h

    # 4. Caixa de Recomendação Oficial INEA
    rec_y = curr_y + 16
    draw_rounded_rect(draw, (pad_x, rec_y, W - pad_x, rec_y + 90), 14, fill="#ffffff", outline="#cbd5e1", width=1.5)
    draw.text((pad_x + 24, rec_y + 16), "RECOMENDAÇÃO DO INEA:", font=font(18, bold=True), fill="#000000")
    draw.text((pad_x + 24, rec_y + 44), "• Evite banho de mar nas primeiras 24h após chuvas fortes e próximo a canais.", font=font(16, bold=False), fill="#334155")
    draw.text((pad_x + 24, rec_y + 66), "• Foz de rios e lagunas fechadas costumam concentrar vazão de águas pluviais.", font=font(16, bold=False), fill="#334155")

    # 5. Rodapé Pessoal Oficial
    footer_y = rec_y + 106
    draw.text((pad_x, footer_y), "— @tempoemriodasostras", font=font(24, bold=True), fill="#000000")
    draw.text((pad_x, footer_y + 32), "Acompanhe ao vivo pelo portal: tempo-riodasostras.com.br", font=font(18, bold=False), fill="#475569")

    out_path = IMG_DIR / "balneabilidade_stories.png"
    im.save(out_path, "PNG", quality=95)
    print(f"[OK] Stories gerado com sucesso: {out_path} ({W}x{H})")
    return out_path

def generate_post_card(data):
    """
    Post Feed 1080x1350 (4:5)
    Design em lista limpa de 2 colunas equilibradas, tipografia grande, nomes completos sem cortes,
    paleta cerâmica do site com preto puro.
    """
    W, H = 1080, 1350
    im = Image.new("RGB", (W, H), "#f8fafc")
    draw = ImageDraw.Draw(im)
    font = get_fonts()

    # Faixa lateral decorativa
    draw.rectangle([0, 0, 12, H], fill="#f07a53")
    draw.rectangle([12, 0, 18, H], fill="#6d8ba6")

    pad_x = 55

    # 1. Topo Pessoal e Fonte
    top_y = 60
    draw.text((pad_x, top_y), "@tempoemriodasostras", font=font(24, bold=True), fill="#000000")
    draw.text((pad_x, top_y + 30), "Monitoramento de Meteorologia, Orla & Praias", font=font(16, bold=False), fill="#475569")
    
    badge_txt = "DADOS DO INEA"
    f_badge = font(16, bold=True)
    bbox = f_badge.getbbox(badge_txt)
    bw = (bbox[2] - bbox[0]) + 34
    draw_rounded_rect(draw, (W - pad_x - bw, top_y + 2, W - pad_x, top_y + 44), 10, fill="#ffffff", outline="#cbd5e1", width=2)
    draw.text((W - pad_x - bw + 17, top_y + 12), badge_txt, font=f_badge, fill="#000000")

    # 2. Cabeçalho Principal com Barra Vertical Coral
    title_y = top_y + 75
    bar_h = 75
    draw_rounded_rect(draw, (pad_x, title_y, pad_x + 8, title_y + bar_h), 4, fill="#f07a53")

    draw.text((pad_x + 24, title_y - 2), "BALNEABILIDADE DAS", font=font(28, bold=True), fill="#000000")
    draw.text((pad_x + 24, title_y + 30), "PRAIAS", font=font(44, bold=True), fill="#000000")

    data_boletim = data.get("data_boletim", "24 de Outubro de 2026")
    boletim_num = data.get("boletim_numero", 20)
    draw.text((pad_x + 24, title_y + 80), f"Boletim Oficial nº {boletim_num} • {data_boletim}", font=font(18, bold=False), fill="#475569")

    # Placar Resumo
    pontos = data.get("pontos", [])
    proprias = [p for p in pontos if str(p.get("status", "")).upper() == "PRÓPRIA"]
    total = len(pontos) if pontos else 12
    perc = int(round((len(proprias) / total) * 100)) if total else 75

    placar_y = title_y + 118
    draw_rounded_rect(draw, (pad_x, placar_y, W - pad_x, placar_y + 60), 12, fill="#ffffff", outline="#6d8ba6", width=2)
    draw.text((pad_x + 24, placar_y + 10), f"{len(proprias)} DE {total} PRAIAS PRÓPRIAS PARA BANHO ({perc}%)", font=font(21, bold=True), fill="#000000")
    draw.text((pad_x + 24, placar_y + 34), "Análise microbiológica oficial pelo Instituto Estadual do Ambiente (INEA)", font=font(15, bold=False), fill="#475569")

    # 3. Lista em 2 Colunas Equilibradas (6 praias em cada coluna)
    list_y = placar_y + 75
    draw.text((pad_x, list_y), "SITUAÇÃO PONTO A PONTO:", font=font(18, bold=True), fill="#000000")
    draw.line([(pad_x, list_y + 25), (W - pad_x, list_y + 25)], fill="#cbd5e1", width=2)

    col_gap = 40
    col_w = int((W - pad_x * 2 - col_gap) / 2) # ~465px
    col1_x = pad_x
    col2_x = pad_x + col_w + col_gap

    start_rows_y = list_y + 35
    row_h = 92

    # Coluna 1: 6 praias
    curr_y1 = start_rows_y
    for p in pontos[:6]:
        is_propria = str(p.get("status", "")).upper() == "PRÓPRIA"
        nome = clean_praia_name(p.get("praia", ""))
        cod = p.get("codigo", "")
        loc = p.get("localizacao", "")

        # Nome completo da praia
        draw.text((col1_x + 4, curr_y1 + 10), nome, font=font(23, bold=True), fill="#000000")
        
        # Subdescrição
        sub_desc = f"{cod} • {loc}" if loc else cod
        if len(sub_desc) > 36:
            sub_desc = sub_desc[:34] + "..."
        draw.text((col1_x + 4, curr_y1 + 42), sub_desc, font=font(15, bold=False), fill="#475569")

        # Badge mais proporcional
        b_w = 135
        b_h = 42
        bx1 = col1_x + col_w - b_w
        by1 = curr_y1 + 16
        if is_propria:
            draw_rounded_rect(draw, (bx1, by1, bx1 + b_w, by1 + b_h), 10, fill="#dcfce7", outline="#22c55e", width=2)
            draw_check_icon(draw, bx1 + 20, by1 + 21, size=12, color="#15803d")
            draw.text((bx1 + 38, by1 + 11), "PRÓPRIA", font=font(17, bold=True), fill="#14532d")
        else:
            draw_rounded_rect(draw, (bx1, by1, bx1 + b_w, by1 + b_h), 10, fill="#fee2e2", outline="#ef4444", width=2)
            draw_alert_icon(draw, bx1 + 20, by1 + 21, size=12, color="#b91c1c")
            draw.text((bx1 + 38, by1 + 11), "ATENÇÃO", font=font(17, bold=True), fill="#7f1d1d")

        draw.line([(col1_x, curr_y1 + row_h), (col1_x + col_w, curr_y1 + row_h)], fill="#e2e8f0", width=1)
        curr_y1 += row_h

    # Coluna 2: 6 praias
    curr_y2 = start_rows_y
    for p in pontos[6:]:
        is_propria = str(p.get("status", "")).upper() == "PRÓPRIA"
        nome = clean_praia_name(p.get("praia", ""))
        cod = p.get("codigo", "")
        loc = p.get("localizacao", "")

        draw.text((col2_x + 4, curr_y2 + 10), nome, font=font(23, bold=True), fill="#000000")
        
        sub_desc = f"{cod} • {loc}" if loc else cod
        if len(sub_desc) > 36:
            sub_desc = sub_desc[:34] + "..."
        draw.text((col2_x + 4, curr_y2 + 42), sub_desc, font=font(15, bold=False), fill="#475569")

        b_w = 135
        b_h = 42
        bx1 = col2_x + col_w - b_w
        by1 = curr_y2 + 16
        if is_propria:
            draw_rounded_rect(draw, (bx1, by1, bx1 + b_w, by1 + b_h), 10, fill="#dcfce7", outline="#22c55e", width=2)
            draw_check_icon(draw, bx1 + 20, by1 + 21, size=12, color="#15803d")
            draw.text((bx1 + 38, by1 + 11), "PRÓPRIA", font=font(17, bold=True), fill="#14532d")
        else:
            draw_rounded_rect(draw, (bx1, by1, bx1 + b_w, by1 + b_h), 10, fill="#fee2e2", outline="#ef4444", width=2)
            draw_alert_icon(draw, bx1 + 20, by1 + 21, size=12, color="#b91c1c")
            draw.text((bx1 + 38, by1 + 11), "ATENÇÃO", font=font(17, bold=True), fill="#7f1d1d")

        draw.line([(col2_x, curr_y2 + row_h), (col2_x + col_w, curr_y2 + row_h)], fill="#e2e8f0", width=1)
        curr_y2 += row_h

    # 4. Recomendação Oficial INEA
    rec_y = max(curr_y1, curr_y2) + 20
    draw_rounded_rect(draw, (pad_x, rec_y, W - pad_x, rec_y + 85), 12, fill="#ffffff", outline="#cbd5e1", width=1.5)
    draw.text((pad_x + 22, rec_y + 14), "RECOMENDAÇÃO DO INEA:", font=font(17, bold=True), fill="#000000")
    draw.text((pad_x + 22, rec_y + 38), "• Evite o banho de mar nas primeiras horas após chuvas e próximo a canais.", font=font(15, bold=False), fill="#334155")
    draw.text((pad_x + 22, rec_y + 58), "• Foz de rios e lagunas fechadas costumam concentrar vazão de águas pluviais.", font=font(15, bold=False), fill="#334155")

    # 5. Rodapé Pessoal Oficial
    foot_y = rec_y + 100
    draw.text((pad_x, foot_y), "— @tempoemriodasostras", font=font(22, bold=True), fill="#000000")
    draw.text((pad_x, foot_y + 28), "Acompanhe ao vivo pelo portal: tempo-riodasostras.com.br", font=font(16, bold=False), fill="#475569")

    out_path = IMG_DIR / "balneabilidade_post.png"
    im.save(out_path, "PNG", quality=95)
    print(f"[OK] Post Feed gerado com sucesso: {out_path} ({W}x{H})")
    return out_path

if __name__ == '__main__':
    data = load_balneabilidade_data()
    generate_post_card(data)
    generate_stories_card(data)
