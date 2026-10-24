"""
Gerador de Imagens Oficiais para Redes Sociais (Instagram Post e Stories)
Balneabilidade das Praias de Rio das Ostras (INEA / SEIRHI)
Produz:
- img/balneabilidade_post.png (1080x1080 px - Feed)
- img/balneabilidade_stories.png (1080x1920 px - Stories)
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
                return ImageFont.truetype(p, size)
            except Exception:
                pass
        return ImageFont.load_default()
    return font

def draw_rounded_rect(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=int(radius), fill=fill, outline=outline, width=int(width))

def draw_check_icon(draw, cx, cy, size=14, color="#ffffff"):
    # Desenha um V vetorial perfeito
    p1 = (cx - size * 0.45, cy)
    p2 = (cx - size * 0.1, cy + size * 0.4)
    p3 = (cx + size * 0.5, cy - size * 0.4)
    draw.line([p1, p2, p3], fill=color, width=3, joint="curve")

def draw_alert_icon(draw, cx, cy, size=14, color="#ffffff"):
    # Desenha um ponto de exclamação vetorial
    draw.line([(cx, cy - size * 0.45), (cx, cy + size * 0.1)], fill=color, width=3)
    draw.ellipse([cx - 2, cy + size * 0.3, cx + 2, cy + size * 0.45], fill=color)

def clean_praia_name(name):
    # Remove prefixo redundante "Praia da", "Praia do", "Praia de", "Praia das"
    for pref in ["Praia das ", "Praia da ", "Praia do ", "Praia de ", "Praia "]:
        if name.startswith(pref):
            return name[len(pref):]
    return name

def generate_post_card(data):
    """Gera imagem 1080x1080 px para Feed do Instagram"""
    W, H = 1080, 1080
    im = Image.new("RGB", (W, H), "#f1f5f9")
    draw = ImageDraw.Draw(im)
    font = get_fonts()

    # Container principal
    draw_rounded_rect(draw, (28, 28, W - 28, H - 28), 24, fill="#ffffff", outline="#94a3b8", width=3)

    # Faixa superior institucional
    draw_rounded_rect(draw, (48, 48, W - 48, 128), 16, fill="#eaf2f8", outline="#6d8ba6", width=2)
    draw.text((70, 64), "PREFEITURA DE RIO DAS OSTRAS  •  DEFESA CIVIL", font=font(21, bold=True), fill="#000000")
    draw.text((70, 92), "SISTEMA INTEGRADO DE MONITORAMENTO METEOROLÓGICO & ORLA", font=font(15, bold=False), fill="#334155")
    
    # Badge INEA / SEIRHI
    draw_rounded_rect(draw, (W - 270, 64, W - 68, 110), 12, fill="#ffffff", outline="#6d8ba6", width=2)
    draw.text((W - 250, 75), "DADOS OFICIAIS INEA", font=font(16, bold=True), fill="#000000")

    # Título do Boletim
    draw.text((48, 150), "BOLETIM DE BALNEABILIDADE DAS PRAIAS", font=font(33, bold=True), fill="#000000")
    
    data_boletim = data.get("data_boletim", "Outubro de 2026")
    boletim_num = data.get("boletim_numero", 20)
    draw.text((48, 192), f"Condição Oficial das Praias  •  Boletim nº {boletim_num}  •  {data_boletim}", font=font(19, bold=False), fill="#475569")

    # Contagem de Praias
    pontos = data.get("pontos", [])
    proprias = [p for p in pontos if str(p.get("status", "")).upper() == "PRÓPRIA"]
    improprias = [p for p in pontos if str(p.get("status", "")).upper() != "PRÓPRIA"]
    total = len(pontos) if pontos else 12
    perc = int(round((len(proprias) / total) * 100)) if total else 75

    # Banner de Destaque
    draw_rounded_rect(draw, (48, 226, W - 48, 298), 16, fill="#eaf0f6", outline="#6d8ba6", width=2)
    draw.text((70, 242), f"{len(proprias)} DE {total} PRAIAS PRÓPRIAS PARA BANHO ({perc}%)", font=font(24, bold=True), fill="#000000")
    draw.text((70, 270), "Status favorável na maioria dos pontos avaliados pelo laboratório do INEA", font=font(16, bold=False), fill="#334155")

    # Grade com 2 Colunas Balanceadas (6 praias em cada coluna para caber todas as 12 perfeitamente)
    col1_x = 48
    col2_x = 548
    col_w = 484
    y_start = 314

    # Metade 1: Primeiras 6 Praias Próprias
    draw_rounded_rect(draw, (col1_x, y_start, col1_x + col_w, y_start + 40), 10, fill="#dcfce7", outline="#86efac", width=2)
    draw.text((col1_x + 14, y_start + 10), f"PRAIAS PRÓPRIAS (GRUPO 1)", font=font(17, bold=True), fill="#14532d")

    curr_y = y_start + 48
    for p in proprias[:6]:
        draw_rounded_rect(draw, (col1_x, curr_y, col1_x + col_w, curr_y + 44), 8, fill="#ffffff", outline="#cbd5e1", width=1)
        # Ícone vetorial
        draw_rounded_rect(draw, (col1_x + 8, curr_y + 8, col1_x + 36, curr_y + 36), 6, fill="#16a34a")
        draw_check_icon(draw, col1_x + 22, curr_y + 22, size=13)
        # Nome
        nome = clean_praia_name(p.get("praia", ""))
        draw.text((col1_x + 44, curr_y + 11), nome[:28], font=font(18, bold=True), fill="#000000")
        # Badge
        draw_rounded_rect(draw, (col1_x + col_w - 95, curr_y + 8, col1_x + col_w - 8, curr_y + 36), 6, fill="#dcfce7", outline="#86efac", width=1)
        draw.text((col1_x + col_w - 85, curr_y + 12), "PRÓPRIA", font=font(14, bold=True), fill="#15803d")
        curr_y += 50

    # Coluna 2: Restante das Próprias + Impróprias
    draw_rounded_rect(draw, (col2_x, y_start, col2_x + col_w, y_start + 40), 10, fill="#fef2f2", outline="#fca5a5", width=2)
    draw.text((col2_x + 14, y_start + 10), f"DEMAIS PONTOS & ATENÇÃO", font=font(17, bold=True), fill="#7f1d1d")

    curr_y2 = y_start + 48
    # 3 Praias Próprias restantes
    for p in proprias[6:]:
        draw_rounded_rect(draw, (col2_x, curr_y2, col2_x + col_w, curr_y2 + 44), 8, fill="#ffffff", outline="#cbd5e1", width=1)
        draw_rounded_rect(draw, (col2_x + 8, curr_y2 + 8, col2_x + 36, curr_y2 + 36), 6, fill="#16a34a")
        draw_check_icon(draw, col2_x + 22, curr_y2 + 22, size=13)
        nome = clean_praia_name(p.get("praia", ""))
        draw.text((col2_x + 44, curr_y2 + 11), nome[:28], font=font(18, bold=True), fill="#000000")
        draw_rounded_rect(draw, (col2_x + col_w - 95, curr_y2 + 8, col2_x + col_w - 8, curr_y2 + 36), 6, fill="#dcfce7", outline="#86efac", width=1)
        draw.text((col2_x + col_w - 85, curr_y2 + 12), "PRÓPRIA", font=font(14, bold=True), fill="#15803d")
        curr_y2 += 50

    # 3 Praias Impróprias / Atenção
    for p in improprias:
        draw_rounded_rect(draw, (col2_x, curr_y2, col2_x + col_w, curr_y2 + 44), 8, fill="#ffffff", outline="#fca5a5", width=1)
        draw_rounded_rect(draw, (col2_x + 8, curr_y2 + 8, col2_x + 36, curr_y2 + 36), 6, fill="#dc2626")
        draw_alert_icon(draw, col2_x + 22, curr_y2 + 22, size=13)
        nome = clean_praia_name(p.get("praia", ""))
        draw.text((col2_x + 44, curr_y2 + 11), nome[:24], font=font(17, bold=True), fill="#000000")
        draw_rounded_rect(draw, (col2_x + col_w - 105, curr_y2 + 8, col2_x + col_w - 8, curr_y2 + 36), 6, fill="#fee2e2", outline="#fca5a5", width=1)
        draw.text((col2_x + col_w - 98, curr_y2 + 12), "ATENÇÃO", font=font(13, bold=True), fill="#b91c1c")
        curr_y2 += 50

    # Caixa Informativa de Recomendação do INEA
    rec_y = 665
    draw_rounded_rect(draw, (48, rec_y, W - 48, rec_y + 115), 14, fill="#fffbeb", outline="#fcd34d", width=2)
    draw.text((68, rec_y + 14), "RECOMENDAÇÃO TÉCNICA OFICIAL (INEA & DEFESA CIVIL):", font=font(17, bold=True), fill="#78350f")
    draw.text((68, rec_y + 42), "• Evite o banho de mar nas primeiras 24h a 48h após chuvas fortes na orla costeira.", font=font(16, bold=False), fill="#92400e")
    draw.text((68, rec_y + 70), "• Não tome banho próximo a galerias de drenagem, saídas pluviais ou foz do Rio das Ostras.", font=font(16, bold=False), fill="#92400e")

    # Cartão de Segurança Guarda-Vidas
    sec_y = 795
    draw_rounded_rect(draw, (48, sec_y, W - 48, sec_y + 85), 14, fill="#f8fafc", outline="#cbd5e1", width=1)
    draw.text((68, sec_y + 16), "SEGURANÇA NA PRAIA:", font=font(16, bold=True), fill="#000000")
    draw.text((68, sec_y + 42), "Respeite as bandeiras de sinalização e orientações dos Guarda-Vidas Municipais.", font=font(16, bold=False), fill="#334155")
    draw_rounded_rect(draw, (W - 240, sec_y + 18, W - 68, sec_y + 68), 10, fill="#e11d48")
    draw.text((W - 222, sec_y + 30), "SALVAMAR: 193", font=font(17, bold=True), fill="#ffffff")

    # Rodapé Oficial
    footer_y = 900
    draw_rounded_rect(draw, (48, footer_y, W - 48, footer_y + 130), 16, fill="#0f172a")
    draw.text((70, footer_y + 22), "CONSULTE EM TEMPO REAL AS CONDIÇÕES METEOROLÓGICAS E DA ORLA:", font=font(15, bold=True), fill="#94a3b8")
    draw.text((70, footer_y + 52), "tempo-riodasostras.com.br", font=font(28, bold=True), fill="#38bdf8")
    draw.text((70, footer_y + 92), "Dados Oficiais: INEA • SEIRHI • Marinha do Brasil • Defesa Civil Municipal", font=font(14, bold=False), fill="#64748b")
    draw.text((W - 310, footer_y + 54), "DEFESA CIVIL: 199", font=font(22, bold=True), fill="#ffffff")

    output_path = IMG_DIR / "balneabilidade_post.png"
    im.save(output_path, "PNG", quality=95)
    print(f"[OK] Post Card gerado em: {output_path} ({W}x{H})")
    return output_path

def generate_stories_card(data):
    """Gera imagem 1080x1920 px para Stories do Instagram (9:16)"""
    W, H = 1080, 1920
    im = Image.new("RGB", (W, H), "#0b132b") # Azul escuro profundo e nobre
    draw = ImageDraw.Draw(im)
    font = get_fonts()

    # Container Central em estilo Card Cerâmico
    card_x1, card_y1 = 36, 120
    card_x2, card_y2 = W - 36, H - 120
    draw_rounded_rect(draw, (card_x1, card_y1, card_x2, card_y2), 32, fill="#ffffff", outline="#6d8ba6", width=4)

    # Topo Institucional
    draw_rounded_rect(draw, (card_x1 + 28, card_y1 + 28, card_x2 - 28, card_y1 + 120), 18, fill="#f1f5f9", outline="#cbd5e1", width=2)
    draw.text((card_x1 + 48, card_y1 + 44), "PREFEITURA DE RIO DAS OSTRAS", font=font(22, bold=True), fill="#000000")
    draw.text((card_x1 + 48, card_y1 + 76), "SUBSECRETARIA DE DEFESA CIVIL • MONITORAMENTO DA ORLA", font=font(15, bold=False), fill="#475569")

    # Selo INEA
    draw_rounded_rect(draw, (card_x2 - 240, card_y1 + 44, card_x2 - 45, card_y1 + 102), 12, fill="#ffffff", outline="#6d8ba6", width=2)
    draw.text((card_x2 - 222, card_y1 + 62), "DADOS DO INEA", font=font(16, bold=True), fill="#000000")

    # Título Principal do Story
    draw.text((card_x1 + 32, card_y1 + 150), "BOLETIM DE BALNEABILIDADE", font=font(38, bold=True), fill="#000000")
    
    data_boletim = data.get("data_boletim", "Outubro de 2026")
    boletim_num = data.get("boletim_numero", 20)
    draw.text((card_x1 + 32, card_y1 + 204), f"Condição das Praias para Banho • Boletim nº {boletim_num}", font=font(22, bold=False), fill="#475569")
    draw.text((card_x1 + 32, card_y1 + 240), f"Atualizado em: {data_boletim}", font=font(21, bold=True), fill="#0284c7")

    # Contagem de Praias
    pontos = data.get("pontos", [])
    proprias = [p for p in pontos if str(p.get("status", "")).upper() == "PRÓPRIA"]
    improprias = [p for p in pontos if str(p.get("status", "")).upper() != "PRÓPRIA"]
    total = len(pontos) if pontos else 12
    perc = int(round((len(proprias) / total) * 100)) if total else 75

    # Card Grande de Status Score
    score_y = card_y1 + 288
    draw_rounded_rect(draw, (card_x1 + 32, score_y, card_x2 - 32, score_y + 118), 20, fill="#eaf2f8", outline="#6d8ba6", width=2)
    draw.text((card_x1 + 55, score_y + 20), f"{perc}% DAS PRAIAS PRÓPRIAS", font=font(31, bold=True), fill="#000000")
    draw.text((card_x1 + 55, score_y + 64), f"{len(proprias)} de {total} pontos avaliados estão próprios para banho em Rio das Ostras", font=font(18, bold=False), fill="#334155")

    # Lista Detalhada das Praias (12 Praias Verticais)
    list_y = score_y + 142
    draw.text((card_x1 + 32, list_y), "SITUAÇÃO PONTO A PONTO:", font=font(22, bold=True), fill="#000000")
    list_y += 36

    for p in pontos:
        is_prop = str(p.get("status", "")).upper() == "PRÓPRIA"
        bg_color = "#f0fdf4" if is_prop else "#fef2f2"
        border_col = "#86efac" if is_prop else "#fca5a5"
        text_badge_bg = "#16a34a" if is_prop else "#dc2626"
        badge_txt = "PRÓPRIA" if is_prop else "IMPRÓPRIA"

        draw_rounded_rect(draw, (card_x1 + 32, list_y, card_x2 - 32, list_y + 56), 12, fill=bg_color, outline=border_col, width=1)
        
        # Ícone vetorial
        draw_rounded_rect(draw, (card_x1 + 44, list_y + 10, card_x1 + 80, list_y + 46), 8, fill=text_badge_bg)
        if is_prop:
            draw_check_icon(draw, card_x1 + 62, list_y + 28, size=13)
        else:
            draw_alert_icon(draw, card_x1 + 62, list_y + 28, size=13)

        # Nome e Local
        nome = clean_praia_name(p.get("praia", ""))
        draw.text((card_x1 + 94, list_y + 8), nome[:28], font=font(20, bold=True), fill="#000000")
        loc = p.get("localizacao", "")[:42]
        draw.text((card_x1 + 94, list_y + 31), loc, font=font(14, bold=False), fill="#64748b")

        # Badge
        draw_rounded_rect(draw, (card_x2 - 165, list_y + 11, card_x2 - 44, list_y + 45), 8, fill=text_badge_bg)
        draw.text((card_x2 - 150, list_y + 17), badge_txt, font=font(15, bold=True), fill="#ffffff")

        list_y += 62

    # Caixa de Dica e Segurança
    rec_y = list_y + 10
    draw_rounded_rect(draw, (card_x1 + 32, rec_y, card_x2 - 32, rec_y + 115), 16, fill="#fffbeb", outline="#fcd34d", width=2)
    draw.text((card_x1 + 48, rec_y + 16), "DICAS IMPORTANTES PARA BANHISTAS:", font=font(18, bold=True), fill="#78350f")
    draw.text((card_x1 + 48, rec_y + 44), "• Evite entrar no mar após chuvas fortes e próximo a canais pluviais.", font=font(16, bold=False), fill="#92400e")
    draw.text((card_x1 + 48, rec_y + 72), "• Respeite sempre as bandeiras e orientações dos Guarda-Vidas (193).", font=font(16, bold=False), fill="#92400e")

    # Rodapé do Story
    footer_y = rec_y + 130
    draw_rounded_rect(draw, (card_x1 + 32, footer_y, card_x2 - 32, footer_y + 74), 16, fill="#0f172a")
    draw.text((card_x1 + 52, footer_y + 24), "ACOMPANHE AO VIVO: tempo-riodasostras.com.br", font=font(20, bold=True), fill="#38bdf8")

    output_path = IMG_DIR / "balneabilidade_stories.png"
    im.save(output_path, "PNG", quality=95)
    print(f"[OK] Stories Card gerado em: {output_path} ({W}x{H})")
    return output_path

if __name__ == '__main__':
    data = load_balneabilidade_data()
    generate_post_card(data)
    generate_stories_card(data)
