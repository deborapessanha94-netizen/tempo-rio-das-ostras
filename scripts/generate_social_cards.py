"""
Gerador de Imagens Oficiais para Redes Sociais - Estilo Dark Neon / Minimalista
Baseado na identidade visual de @tempoemriodasostras
Balneabilidade das Praias de Rio das Ostras (INEA / SEIRHI)

Produz:
- img/balneabilidade_stories.png (1080x1920 px - 9:16 Stories)
- img/balneabilidade_post.png (1080x1350 px - 4:5 Feed)
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

def draw_background_waves(draw, W, H):
    # Fundo azul marinho profundo
    draw.rectangle([0, 0, W, H], fill="#020b18")
    # Curvas de ondas sutis em azul escuro orgânico
    wave_color = "#05162d"
    wave_color_2 = "#081e3a"
    
    # Onda 1 (superior direita)
    draw.arc([-200, -100, W + 400, int(H * 0.45)], start=0, end=180, fill=wave_color, width=4)
    draw.arc([-100, -50, W + 200, int(H * 0.4)], start=0, end=180, fill=wave_color_2, width=2)
    
    # Onda 2 (inferior esquerda)
    draw.arc([-300, int(H * 0.6), W + 300, H + 300], start=180, end=360, fill=wave_color, width=3)
    draw.arc([-200, int(H * 0.65), W + 200, H + 200], start=180, end=360, fill=wave_color_2, width=2)

def generate_stories_card(data):
    """Gera imagem 1080x1920 px para Stories do Instagram (9:16) no estilo @tempoemriodasostras"""
    W, H = 1080, 1920
    im = Image.new("RGB", (W, H), "#020b18")
    draw = ImageDraw.Draw(im)
    font = get_fonts()

    draw_background_waves(draw, W, H)

    # Margens seguras para Stories
    pad_x = 60
    
    # Cabeçalho Principal (Y: 100 a 240)
    top_y = 110
    
    # Barra vertical ciano (#00d2ff)
    draw.rounded_rectangle([pad_x, top_y, pad_x + 9, top_y + 82], radius=4, fill="#00d2ff")

    # Título em 2 linhas
    draw.text((pad_x + 26, top_y - 4), "BALNEABILIDADE DAS", font=font(34, bold=True), fill="#ffffff")
    draw.text((pad_x + 26, top_y + 34), "PRAIAS", font=font(46, bold=True), fill="#00d2ff")

    # Subtítulo e Metadados
    pontos = data.get("pontos", [])
    proprias = [p for p in pontos if str(p.get("status", "")).upper() == "PRÓPRIA"]
    total = len(pontos) if pontos else 12
    perc = int(round((len(proprias) / total) * 100)) if total else 75

    draw.text((pad_x, top_y + 105), "Condição para Banho de Mar • Rio das Ostras", font=font(21, bold=False), fill="#cbd5e1")
    
    # Data e placar à direita
    data_str = data.get("data_boletim", "24/10/2026")
    meta_right = f"{len(proprias)}/{total} PRÓPRIAS ({perc}%)"
    draw.text((W - pad_x - 300, top_y + 105), meta_right, font=font(21, bold=True), fill="#38bdf8")

    # Linha divisória horizontal
    div_y = top_y + 145
    draw.line([(pad_x, div_y), (W - pad_x, div_y)], fill="#162a45", width=2)

    # Lista das 12 Praias (Y: 280 a 1680)
    # Espaço disponível: ~1380px para 12 praias = ~115px por linha
    curr_y = div_y + 20
    row_h = 114

    for i, p in enumerate(pontos):
        is_propria = str(p.get("status", "")).upper() == "PRÓPRIA"
        nome = clean_praia_name(p.get("praia", ""))
        cod = p.get("codigo", f"RO{i+1:04d}")
        loc = p.get("localizacao", "")[:38]
        motivo = p.get("motivo", "")

        # Coluna 1: Nome e Código (x: 60)
        draw.text((pad_x, curr_y + 8), nome, font=font(24, bold=True), fill="#ffffff")
        
        # Badge do Código (Pill ciano suave)
        cod_w = 110
        draw.rounded_rectangle([pad_x, curr_y + 44, pad_x + cod_w, curr_y + 70], radius=6, fill="#071d36", outline="#00d2ff", width=1)
        draw.text((pad_x + 10, curr_y + 48), cod, font=font(14, bold=True), fill="#38bdf8")
        
        # Subtexto de localização / órgão
        sub_text = loc if loc else "INEA Balneabilidade"
        draw.text((pad_x + cod_w + 14, curr_y + 48), sub_text[:30], font=font(14, bold=False), fill="#64748b")

        # Coluna 2: Indicador Gráfico e Status (x: 480 a 680)
        center_x = 480
        center_y = curr_y + 38
        
        if is_propria:
            # Círculo com brilho gradiente ciano / verde
            draw.ellipse([center_x - 18, center_y - 18, center_x + 18, center_y + 18], fill="#0284c7")
            draw.ellipse([center_x - 14, center_y - 14, center_x + 14, center_y + 14], fill="#00d2ff")
            draw.text((center_x + 28, center_y - 16), "PRÓPRIA", font=font(26, bold=True), fill="#ffffff")
        else:
            # Círculo com brilho coral / vermelho
            draw.ellipse([center_x - 18, center_y - 18, center_x + 18, center_y + 18], fill="#991b1b")
            draw.ellipse([center_x - 14, center_y - 14, center_x + 14, center_y + 14], fill="#ef4444")
            draw.text((center_x + 28, center_y - 16), "IMPRÓPRIA", font=font(25, bold=True), fill="#fca5a5")

        # Coluna 3: Botão Pill Contornado à Direita (x: 740 a 1020)
        pill_x1 = W - pad_x - 240
        pill_x2 = W - pad_x
        pill_y1 = curr_y + 16
        pill_y2 = curr_y + 62

        if is_propria:
            draw.rounded_rectangle([pill_x1, pill_y1, pill_x2, pill_y2], radius=10, fill="#04162e", outline="#00d2ff", width=1)
            draw.text((pill_x1 + 22, pill_y1 + 12), "liberada para banho", font=font(16, bold=False), fill="#38bdf8")
        else:
            draw.rounded_rectangle([pill_x1, pill_y1, pill_x2, pill_y2], radius=10, fill="#1c0a0a", outline="#ef4444", width=1)
            btn_txt = "evitar após chuva" if "chuva" in motivo.lower() else ("foz do rio" if "foz" in motivo.lower() else "evitar banho")
            draw.text((pill_x1 + 32, pill_y1 + 12), btn_txt, font=font(16, bold=False), fill="#fca5a5")

        # Linha divisória sutil entre linhas
        if i < len(pontos) - 1:
            draw.line([(pad_x, curr_y + row_h - 4), (W - pad_x, curr_y + row_h - 4)], fill="#0c1e34", width=1)
        
        curr_y += row_h

    # Rodapé Oficial (Y: 1720 a 1840)
    footer_y = 1750
    # Linha ciano no rodapé
    draw.rounded_rectangle([pad_x, footer_y, pad_x + 48, footer_y + 5], radius=3, fill="#00d2ff")
    draw.text((pad_x + 60, footer_y - 10), "@tempoemriodasostras", font=font(23, bold=True), fill="#ffffff")
    draw.text((pad_x, footer_y + 28), "Fontes: INEA • SEIRHI • Subsecretaria de Defesa Civil • Rio das Ostras - RJ", font=font(16, bold=False), fill="#64748b")
    draw.text((W - pad_x - 220, footer_y - 8), "EMERGÊNCIAS: 199", font=font(18, bold=True), fill="#38bdf8")

    out_path = IMG_DIR / "balneabilidade_stories.png"
    im.save(out_path, "PNG", quality=95)
    print(f"[OK] Stories Card estilo @tempoemriodasostras gerado: {out_path} ({W}x{H})")
    return out_path

def generate_post_card(data):
    """Gera imagem 1080x1350 px para Feed do Instagram (4:5 Retrato) no estilo @tempoemriodasostras"""
    W, H = 1080, 1350
    im = Image.new("RGB", (W, H), "#020b18")
    draw = ImageDraw.Draw(im)
    font = get_fonts()

    draw_background_waves(draw, W, H)

    pad_x = 55
    top_y = 80
    
    # Barra vertical ciano (#00d2ff)
    draw.rounded_rectangle([pad_x, top_y, pad_x + 8, top_y + 74], radius=4, fill="#00d2ff")

    # Título
    draw.text((pad_x + 22, top_y - 4), "BALNEABILIDADE DAS", font=font(30, bold=True), fill="#ffffff")
    draw.text((pad_x + 22, top_y + 30), "PRAIAS", font=font(42, bold=True), fill="#00d2ff")

    pontos = data.get("pontos", [])
    proprias = [p for p in pontos if str(p.get("status", "")).upper() == "PRÓPRIA"]
    total = len(pontos) if pontos else 12
    perc = int(round((len(proprias) / total) * 100)) if total else 75

    draw.text((pad_x, top_y + 92), "Condição Oficial para Banho de Mar • Rio das Ostras", font=font(18, bold=False), fill="#cbd5e1")
    meta_right = f"{len(proprias)}/{total} PRÓPRIAS ({perc}%)"
    draw.text((W - pad_x - 270, top_y + 92), meta_right, font=font(19, bold=True), fill="#38bdf8")

    div_y = top_y + 128
    draw.line([(pad_x, div_y), (W - pad_x, div_y)], fill="#162a45", width=2)

    # 12 Praias compactas (H total disponível: ~1040px)
    curr_y = div_y + 14
    row_h = 84

    for i, p in enumerate(pontos):
        is_propria = str(p.get("status", "")).upper() == "PRÓPRIA"
        nome = clean_praia_name(p.get("praia", ""))
        cod = p.get("codigo", f"RO{i+1:04d}")
        motivo = p.get("motivo", "")

        # Coluna 1: Nome e Código
        draw.text((pad_x, curr_y + 6), nome, font=font(21, bold=True), fill="#ffffff")
        
        # Badge Código
        cod_w = 95
        draw.rounded_rectangle([pad_x, curr_y + 36, pad_x + cod_w, curr_y + 58], radius=5, fill="#071d36", outline="#00d2ff", width=1)
        draw.text((pad_x + 8, curr_y + 39), cod, font=font(13, bold=True), fill="#38bdf8")
        
        loc = p.get("localizacao", "INEA")[:28]
        draw.text((pad_x + cod_w + 12, curr_y + 39), loc, font=font(13, bold=False), fill="#64748b")

        # Coluna 2: Indicador e Status
        center_x = 480
        center_y = curr_y + 30
        if is_propria:
            draw.ellipse([center_x - 14, center_y - 14, center_x + 14, center_y + 14], fill="#0284c7")
            draw.ellipse([center_x - 10, center_y - 10, center_x + 10, center_y + 10], fill="#00d2ff")
            draw.text((center_x + 22, center_y - 13), "PRÓPRIA", font=font(22, bold=True), fill="#ffffff")
        else:
            draw.ellipse([center_x - 14, center_y - 14, center_x + 14, center_y + 14], fill="#991b1b")
            draw.ellipse([center_x - 10, center_y - 10, center_x + 10, center_y + 10], fill="#ef4444")
            draw.text((center_x + 22, center_y - 13), "IMPRÓPRIA", font=font(21, bold=True), fill="#fca5a5")

        # Coluna 3: Pill à Direita
        pill_x1 = W - pad_x - 220
        pill_x2 = W - pad_x
        pill_y1 = curr_y + 10
        pill_y2 = curr_y + 48

        if is_propria:
            draw.rounded_rectangle([pill_x1, pill_y1, pill_x2, pill_y2], radius=8, fill="#04162e", outline="#00d2ff", width=1)
            draw.text((pill_x1 + 18, pill_y1 + 8), "liberada para banho", font=font(14, bold=False), fill="#38bdf8")
        else:
            draw.rounded_rectangle([pill_x1, pill_y1, pill_x2, pill_y2], radius=8, fill="#1c0a0a", outline="#ef4444", width=1)
            btn_txt = "evitar após chuva" if "chuva" in motivo.lower() else ("foz do rio" if "foz" in motivo.lower() else "evitar banho")
            draw.text((pill_x1 + 25, pill_y1 + 8), btn_txt, font=font(14, bold=False), fill="#fca5a5")

        if i < len(pontos) - 1:
            draw.line([(pad_x, curr_y + row_h - 4), (W - pad_x, curr_y + row_h - 4)], fill="#0c1e34", width=1)

        curr_y += row_h

    # Rodapé Oficial
    footer_y = H - 90
    draw.rounded_rectangle([pad_x, footer_y, pad_x + 44, footer_y + 4], radius=2, fill="#00d2ff")
    draw.text((pad_x + 55, footer_y - 10), "@tempoemriodasostras", font=font(21, bold=True), fill="#ffffff")
    draw.text((pad_x, footer_y + 24), "Fontes: INEA • SEIRHI • Subsecretaria de Defesa Civil • Rio das Ostras - RJ", font=font(15, bold=False), fill="#64748b")
    draw.text((W - pad_x - 200, footer_y - 8), "DEFESA CIVIL: 199", font=font(17, bold=True), fill="#38bdf8")

    out_path = IMG_DIR / "balneabilidade_post.png"
    im.save(out_path, "PNG", quality=95)
    print(f"[OK] Post Card estilo @tempoemriodasostras gerado: {out_path} ({W}x{H})")
    return out_path

if __name__ == '__main__':
    data = load_balneabilidade_data()
    generate_post_card(data)
    generate_stories_card(data)
