# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import os

img_path = r'C:/Users/debor/.gemini/antigravity/brain/ec824ae4-216a-462f-9550-50517e326bdf/.user_uploaded/media_1792994370877_00bc38b3.png'
im = Image.open(img_path).convert('RGBA')
arr = np.array(im)

rgb = arr[:, :, :3]
is_dark = (rgb[:, :, 0] < 80) & (rgb[:, :, 1] < 80) & (rgb[:, :, 2] < 80)
coords = np.argwhere(is_dark)

min_y, min_x = coords.min(axis=0)
max_y, max_x = coords.max(axis=0)

pad = 24
crop_min_x = max(0, min_x - pad)
crop_max_x = min(im.width, max_x + pad)
crop_min_y = max(0, min_y - pad)
crop_max_y = min(im.height, max_y + pad)

cropped = im.crop((crop_min_x, crop_min_y, crop_max_x, crop_max_y))
c_w, c_h = cropped.size

# High-res marked image (scale 2x with antialiasing)
scaled = cropped.resize((c_w * 2, c_h * 2), Image.Resampling.LANCZOS)
s_w, s_h = scaled.size

draw = ImageDraw.Draw(scaled)

# Pin position in 2x:
# On original cropped: 78.8% of width, 60.0% of height
pin_x = int(s_w * 0.788)
pin_y = int(s_h * 0.600)

# Outer radar rings
for r, alpha in [(36, 40), (26, 70), (18, 120), (12, 180)]:
    draw.ellipse((pin_x - r, pin_y - r, pin_x + r, pin_y + r), fill=(249, 115, 22, alpha), outline=(234, 88, 12, min(255, alpha + 60)), width=2)

# Solid core
draw.ellipse((pin_x - 6, pin_y - 6, pin_x + 6, pin_y + 6), fill=(234, 88, 12, 255), outline=(255, 255, 255, 255), width=2)

# Label card
lbl_x = pin_x + 22
lbl_y = pin_y - 38
lbl_w = 175
lbl_h = 44

# Pointer line
draw.line([(pin_x + 6, pin_y - 6), (lbl_x, lbl_y + 22)], fill=(234, 88, 12, 220), width=2)

# Rounded rectangle background
draw.rounded_rectangle((lbl_x, lbl_y, lbl_x + lbl_w, lbl_y + lbl_h), radius=8, fill=(255, 247, 237, 245), outline=(249, 115, 22, 255), width=2)

# Draw text
try:
    font_bold = ImageFont.truetype("arialbd.ttf", 15)
    font_sub = ImageFont.truetype("arial.ttf", 11)
except:
    font_bold = ImageFont.load_default()
    font_sub = ImageFont.load_default()

draw.text((lbl_x + 10, lbl_y + 6), "Rio das Ostras", fill=(15, 23, 42, 255), font=font_bold)
draw.text((lbl_x + 10, lbl_y + 24), "Costa do Sol • RJ (22°31'S)", fill=(194, 65, 12, 255), font=font_sub)

out_hd = 'img/mapa_rj_marcado_hd.png'
scaled.save(out_hd)
print(f"Saved {out_hd}: {scaled.size}")

# Copy to artifacts directory so user can preview it directly
art_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'
import shutil
shutil.copy(out_hd, os.path.join(art_dir, 'v129_mapa_rj_marcado_hd.png'))
print("Copied to artifacts v129_mapa_rj_marcado_hd.png")
