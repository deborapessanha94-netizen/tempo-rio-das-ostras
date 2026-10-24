"""
Gerador de Imagens Oficiais para Redes Sociais - Paleta Cerâmica Oficial do Site
100% Focado na página pessoal @tempoemriodasostras (SEM Defesa Civil)
Tipografia GRANDE, legível, alto contraste (#000000) e formato em lista limpo.

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
                return ImageFont.truetype(p, size)
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

def draw_check_icon(draw, cx, cy, size=15, color="#15803d"):
    p1 = (cx - size * 0.45, cy)
    p2 = (cx - size * 0.1, cy + size * 0.4)
    p3 = (cx + size * 0.5, cy - size * 0.4)
    draw.line([p1, p2, p3], fill=color, width=4, joint="curve")

def draw_alert_icon(draw, cx, cy, size=15, color="#b91c1c"):
    draw.line([(cx, cy - size * 0.45), (cx, cy + size * 0.1)], fill=color, width=4)
    draw.ellipse([cx - 2, cy + size * 0.3, cx + 2, cy + size * 0.45], fill=color)

def generate_stories_card(data):
    """
    Stories 1080x1920 (9:16)
    Paleta Cerâmica do Site: Tons de #f8fafc, #ffffff, #eaf0f6, #6d8ba6, #000000
    Texto GRANDE e nítido em lista ponto a ponto.
    """
    W, H = 1080, 1920
    im = Image.new("RGB", (W, H), "#f1f5f9") # Fundo cerâmico suave
    draw = ImageDraw.Draw(im)
    font = get_fonts()

    # Container Branco Cerâmico Principal com margens seguras do Instagram Stories
    pad_x = 44
    card_y1 = 100
    card_y2 = H - 90
    draw_rounded_rect(draw, (pad_x, card_y1, W - pad_x, card_y2), 32, fill="#ffffff", outline="#94a3b8", width=3)

    # 1. Topo Institucional da Página
    header_h = 100
    draw_rounded_rect(draw, (pad_x + 24, card_y1 + 24, W - pad_x - 24, card_y1 + header_h), 18, fill="#eaf0f6", outline="#6d8ba6", width=2)
    draw.text((pad_x + 48, card_y1 + 40), "@tempoemriodasostras", font=font(28, bold=True), fill="#000000")
    draw.text((pad_x + 48, card_y1 + 76), "Monitoramento de Meteorologia, Orla & Praias", font=font(18, bold=False), fill="#000000")
    
    # Badge INEA Oficial à direita
    draw_rounded_rect(draw, (W - pad_x - 260, card_y1 + 40, W - pad_x - 48, card_y1 + 92), 12, fill="#ffffff", outline="#6d8ba6", width=2)
    draw.text((W - pad_x - 240, card_y1 + 52), "DADOS OFICIAIS INEA", font=font(16, bold=True), fill="#000000")

    # 2. Título do Boletim e Placar de Praias
    title_y = card_y1 + 135
    draw.text((pad_x + 28, title_y), "BALNEABILIDADE DAS PRAIAS", font=font(40, bold=True), fill="#000000")
    
    data_boletim = data.get("data_boletim", "Outubro de 2026")
    boletim_num = data.get("boletim_numero", 20)
    draw.text((pad_x + 28, title_y + 48), f"Boletim Oficial nº {boletim_num}  •  {data_boletim}", font=font(22, bold=False), fill="#000000")

    # Placar Destaque
    pontos = data.get("pontos", [])
    proprias = [p for p in pontos if str(p.get("status", "")).upper() == "PRÓPRIA"]
    improprias = [p for p in pontos if str(p.get("status", "")).upper() != "PRÓPRIA"]
    total = len(pontos) if pontos else 12
    perc = int(round((len(proprias) / total) * 100)) if total else 75

    placar_y = title_y + 90
    draw_rounded_rect(draw, (pad_x + 24, placar_y, W - pad_x - 24, placar_y + 88), 18, fill="#eaf2f8", outline="#6d8ba6", width=2)
    draw.text((pad_x + 50, placar_y + 16), f"{len(proprias)} DE {total} PRAIAS PRÓPRIAS PARA BANHO ({perc}%)", font=font(28, bold=True), fill="#000000")
    draw.text((pad_x + 50, placar_y + 54), "Condições avaliadas por análise microbiológica oficial pelo INEA", font=font(18, bold=False), fill="#000000")

    # 3. Lista das 12 Praias (Cards em Lista)
    list_y = placar_y + 105
    draw.text((pad_x + 28, list_y), "SITUAÇÃO PONTO A PONTO:", font=font(22, bold=True), fill="#000000")
    list_y += 34

    row_h = 75
    for i, p in enumerate(pontos):
        is_propria = str(p.get("status", "")).upper() == "PRÓPRIA"
        nome = clean_praia_name(p.get("praia", ""))
        cod = p.get("codigo", f"RO{i+1:04d}")
        loc = p.get("localizacao", "")[:40]
        motivo = p.get("motivo", "")

        card_bg = "#ffffff"
        card_border = "#86efac" if is_propria else "#fca5a5"
        card_w = W - (pad_x + 24) * 2

        # Card de cada praia
        draw_rounded_rect(draw, (pad_x + 24, list_y, W - pad_x - 24, list_y + row_h - 8), 14, fill=card_bg, outline=card_border, width=2)

        # Ícone de Status (Verde ou Vermelho com símbolo nítido)
        icon_bg = "#dcfce7" if is_propria else "#fee2e2"
        icon_border = "#22c55e" if is_propria else "#ef4444"
        draw_rounded_rect(draw, (pad_x + 36, list_y + 10, pad_x + 84, list_y + row_h - 18), 10, fill=icon_bg, outline=icon_border, width=1.5)
        if is_propria:
            draw_check_icon(draw, pad_x + 60, list_y + (row_h - 8) / 2, size=16, color="#15803d")
        else:
            draw_alert_icon(draw, pad_x + 60, list_y + (row_h - 8) / 2, size=16, color="#b91c1c")

        # Nome da Praia (PRETO GRANDE)
        draw.text((pad_x + 98, list_y + 11), nome, font=font(24, bold=True), fill="#000000")
        
        # Localização e Código
        loc_text = f"{cod} • {loc}" if loc else cod
        draw.text((pad_x + 98, list_y + 40), loc_text[:46], font=font(16, bold=False), fill="#000000")

        # Badge Grande de Status à Direita
        badge_w = 175
        badge_h = 42
        badge_x1 = W - pad_x - 24 - badge_w - 12
        badge_x2 = W - pad_x - 24 - 12
        badge_y1 = list_y + 12
        badge_y2 = badge_y1 + badge_h

        badge_bg = "#dcfce7" if is_propria else "#fee2e2"
        badge_border = "#22c55e" if is_propria else "#ef4444"
        badge_txt = "PRÓPRIA" if is_propria else "IMPRÓPRIA"
        text_color = "#000000"

        draw_rounded_rect(draw, (badge_x1, badge_y1, badge_x2, badge_y2), 10, fill=badge_bg, outline=badge_border, width=2)
        draw.text((badge_x1 + 32, badge_y1 + 10), badge_txt, font=font(20, bold=True), fill=text_color)

        list_y += row_h

    # 4. Caixa de Recomendação Oficial do INEA
    rec_y = list_y + 10
    draw_rounded_rect(draw, (pad_x + 24, rec_y, W - pad_x - 24, rec_y + 92), 16, fill="#fffbeb", outline="#fcd34d", width=2)
    draw.text((pad_x + 44, rec_y + 14), "RECOMENDAÇÃO TÉCNICA OFICIAL DO INEA:", font=font(18, bold=True), fill="#000000")
    draw.text((pad_x + 44, rec_y + 42), "• Evite o banho de mar nas primeiras horas após a ocorrência de chuvas fortes.", font=font(17, bold=False), fill="#000000")
    draw.text((pad_x + 44, rec_y + 66), "• Não tome banho próximo a galerias de águas pluviais, canais ou foz de rios.", font=font(17, bold=False), fill="#000000")

    # 5. Rodapé da Imagem
    foot_y = rec_y + 110
    draw_rounded_rect(draw, (pad_x + 24, foot_y, W - pad_x - 24, foot_y + 70), 16, fill="#eaf0f6", outline="#6d8ba6", width=2)
    draw.text((pad_x + 48, foot_y + 22), "Acompanhe ao vivo pelo portal:", font=font(18, bold=False), fill="#000000")
    draw.text((pad_x + 320, foot_y + 18), "tempo-riodasostras.com.br", font=font(24, bold=True), fill="#000000")

    out_path = IMG_DIR / "balneabilidade_stories.png"
    im.save(out_path, "PNG", quality=95)
    print(f"[OK] Stories gerado na paleta cerâmica: {out_path} ({W}x{H})")
    return out_path

def generate_post_card(data):
    """
    Post Feed 1080x1350 (4:5)
    Paleta Cerâmica do Site: Letras Pretas Grandes, Legibilidade Absoluta, Sem Defesa Civil
    """
    W, H = 1080, 1350
    im = Image.new("RGB", (W, H), "#f1f5f9")
    draw = ImageDraw.Draw(im)
    font = get_fonts()

    pad_x = 36
    card_y1 = 36
    card_y2 = H - 36
    draw_rounded_rect(draw, (pad_x, card_y1, W - pad_x, card_y2), 26, fill="#ffffff", outline="#94a3b8", width=3)

    # 1. Topo
    header_h = 80
    draw_rounded_rect(draw, (pad_x + 20, card_y1 + 18, W - pad_x - 20, card_y1 + header_h), 14, fill="#eaf0f6", outline="#6d8ba6", width=2)
    draw.text((pad_x + 40, card_y1 + 30), "@tempoemriodasostras", font=font(25, bold=True), fill="#000000")
    draw.text((pad_x + 40, card_y1 + 58), "Monitoramento de Praias & Balneabilidade", font=font(16, bold=False), fill="#000000")
    
    draw_rounded_rect(draw, (W - pad_x - 240, card_y1 + 30, W - pad_x - 36, card_y1 + 72), 10, fill="#ffffff", outline="#6d8ba6", width=1.5)
    draw.text((W - pad_x - 222, card_y1 + 40), "DADOS DO INEA", font=font(16, bold=True), fill="#000000")

    # 2. Título e Placar
    title_y = card_y1 + 106
    draw.text((pad_x + 22, title_y), "BALNEABILIDADE DAS PRAIAS", font=font(34, bold=True), fill="#000000")
    data_boletim = data.get("data_boletim", "Outubro de 2026")
    boletim_num = data.get("boletim_numero", 20)
    draw.text((pad_x + 22, title_y + 42), f"Boletim Oficial nº {boletim_num}  •  {data_boletim}", font=font(19, bold=False), fill="#000000")

    pontos = data.get("pontos", [])
    proprias = [p for p in pontos if str(p.get("status", "")).upper() == "PRÓPRIA"]
    improprias = [p for p in pontos if str(p.get("status", "")).upper() != "PRÓPRIA"]
    total = len(pontos) if pontos else 12
    perc = int(round((len(proprias) / total) * 100)) if total else 75

    placar_y = title_y + 78
    draw_rounded_rect(draw, (pad_x + 20, placar_y, W - pad_x - 20, placar_y + 68), 14, fill="#eaf2f8", outline="#6d8ba6", width=2)
    draw.text((pad_x + 40, placar_y + 12), f"{len(proprias)} DE {total} PRAIAS PRÓPRIAS PARA BANHO ({perc}%)", font=font(24, bold=True), fill="#000000")
    draw.text((pad_x + 40, placar_y + 40), "Condições oficiais divulgadas pelo Instituto Estadual do Ambiente (INEA)", font=font(16, bold=False), fill="#000000")

    # 3. Lista de Praias (2 Colunas bem distribuídas com letras grandes)
    col1_x = pad_x + 20
    col_w = (W - pad_x * 2 - 50) / 2
    col2_x = col1_x + col_w + 10
    list_y = placar_y + 86

    # 6 Praias na coluna 1
    curr_y1 = list_y
    for p in pontos[:6]:
        is_propria = str(p.get("status", "")).upper() == "PRÓPRIA"
        nome = clean_praia_name(p.get("praia", ""))
        cod = p.get("codigo", "")

        border_c = "#86efac" if is_propria else "#fca5a5"
        draw_rounded_rect(draw, (col1_x, curr_y1, col1_x + col_w, curr_y1 + 72), 12, fill="#ffffff", outline=border_c, width=2)
        
        # Ícone
        icon_bg = "#dcfce7" if is_propria else "#fee2e2"
        draw_rounded_rect(draw, (col1_x + 10, curr_y1 + 10, col1_x + 50, curr_y1 + 62), 8, fill=icon_bg)
        if is_propria:
            draw_check_icon(draw, col1_x + 30, curr_y1 + 36, size=15, color="#15803d")
        else:
            draw_alert_icon(draw, col1_x + 30, curr_y1 + 36, size=15, color="#b91c1c")

        # Texto
        draw.text((col1_x + 60, curr_y1 + 10), nome[:22], font=font(22, bold=True), fill="#000000")
        draw.text((col1_x + 60, curr_y1 + 38), cod, font=font(16, bold=False), fill="#000000")

        # Badge
        badge_bg = "#dcfce7" if is_propria else "#fee2e2"
        badge_border = "#22c55e" if is_propria else "#ef4444"
        badge_txt = "PRÓPRIA" if is_propria else "ATENÇÃO"
        draw_rounded_rect(draw, (col1_x + col_w - 120, curr_y1 + 16, col1_x + col_w - 10, curr_y1 + 56), 8, fill=badge_bg, outline=badge_border, width=1.5)
        draw.text((col1_x + col_w - 108, curr_y1 + 24), badge_txt, font=font(17, bold=True), fill="#000000")

        curr_y1 += 80

    # 6 Praias na coluna 2
    curr_y2 = list_y
    for p in pontos[6:]:
        is_propria = str(p.get("status", "")).upper() == "PRÓPRIA"
        nome = clean_praia_name(p.get("praia", ""))
        cod = p.get("codigo", "")

        border_c = "#86efac" if is_propria else "#fca5a5"
        draw_rounded_rect(draw, (col2_x, curr_y2, col2_x + col_w, curr_y2 + 72), 12, fill="#ffffff", outline=border_c, width=2)
        
        icon_bg = "#dcfce7" if is_propria else "#fee2e2"
        draw_rounded_rect(draw, (col2_x + 10, curr_y2 + 10, col2_x + 50, curr_y2 + 62), 8, fill=icon_bg)
        if is_propria:
            draw_check_icon(draw, col2_x + 30, curr_y2 + 36, size=15, color="#15803d")
        else:
            draw_alert_icon(draw, col2_x + 30, curr_y2 + 36, size=15, color="#b91c1c")

        draw.text((col2_x + 60, curr_y2 + 10), nome[:22], font=font(22, bold=True), fill="#000000")
        draw.text((col2_x + 60, curr_y2 + 38), cod, font=font(16, bold=False), fill="#000000")

        badge_bg = "#dcfce7" if is_propria else "#fee2e2"
        badge_border = "#22c55e" if is_propria else "#ef4444"
        badge_txt = "PRÓPRIA" if is_propria else "ATENÇÃO"
        draw_rounded_rect(draw, (col2_x + col_w - 120, curr_y2 + 16, col2_x + col_w - 10, curr_y2 + 56), 8, fill=badge_bg, outline=badge_border, width=1.5)
        draw.text((col2_x + col_w - 108, curr_y2 + 24), badge_txt, font=font(17, bold=True), fill="#000000")

        curr_y2 += 80

    # 4. Recomendação Oficial INEA
    rec_y = max(curr_y1, curr_y2) + 12
    draw_rounded_rect(draw, (pad_x + 20, rec_y, W - pad_x - 20, rec_y + 82), 14, fill="#fffbeb", outline="#fcd34d", width=2)
    draw.text((pad_x + 38, rec_y + 12), "RECOMENDAÇÃO OFICIAL DO INEA:", font=font(18, bold=True), fill="#000000")
    draw.text((pad_x + 38, rec_y + 38), "• Evite banho de mar nas primeiras horas após chuvas e próximo a canais de drenagem.", font=font(16, bold=False), fill="#000000")
    draw.text((pad_x + 38, rec_y + 58), "• Foz de rios e lagunas fechadas costumam concentrar vazão de águas pluviais.", font=font(16, bold=False), fill="#000000")

    # 5. Rodapé
    foot_y = rec_y + 96
    draw_rounded_rect(draw, (pad_x + 20, foot_y, W - pad_x - 20, foot_y + 64), 14, fill="#eaf0f6", outline="#6d8ba6", width=2)
    draw.text((pad_x + 40, foot_y + 20), "Acompanhe ao vivo pelo portal:", font=font(18, bold=False), fill="#000000")
    draw.text((pad_x + 320, foot_y + 16), "tempo-riodasostras.com.br", font=font(24, bold=True), fill="#000000")

    out_path = IMG_DIR / "balneabilidade_post.png"
    im.save(out_path, "PNG", quality=95)
    print(f"[OK] Post gerado na paleta cerâmica: {out_path} ({W}x{H})")
    return out_path

if __name__ == '__main__':
    data = load_balneabilidade_data()
    generate_post_card(data)
    generate_stories_card(data)
