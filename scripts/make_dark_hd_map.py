# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import os

img_path = r'C:/Users/debor/.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf\.user_uploaded\media_1792994370877_00bc38b3.png'
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

# High-res marked image (scale 2x)
scaled = cropped.resize((c_w * 2, c_h * 2), Image.Resampling.LANCZOS)
s_w, s_h = scaled.size

s_arr = np.array(scaled)
# Convert dark lines to luminous silver/cyan #e2e8f0, and white to dark navy #0d1527
dark_bg_arr = np.zeros_like(s_arr)

for y in range(s_arr.shape[0]):
    for x in range(s_arr.shape[1]):
        r, g, b, a = s_arr[y, x]
        brightness = (int(r) + int(g) + int(b)) / 3.0
        if brightness > 220:
            # Dark navy background #0d1527
            dark_bg_arr[y, x] = [13, 21, 39, 255]
        else:
            factor = 1.0 - (brightness / 220.0)
            # Luminous line: #e2e8f0
            dark_bg_arr[y, x] = [
                int(13 + factor * (226 - 13)),
                int(21 + factor * (232 - 21)),
                int(39 + factor * (240 - 39)),
                255
            ]

dark_im = Image.fromarray(dark_bg_arr)
draw = ImageDraw.Draw(dark_im)

pin_x = int(s_w * 0.788)
pin_y = int(s_h * 0.600)

for r, alpha in [(36, 40), (26, 75), (18, 130), (12, 190)]:
    draw.ellipse((pin_x - r, pin_y - r, pin_x + r, pin_y + r), fill=(249, 115, 22, alpha), outline=(251, 146, 60, min(255, alpha + 60)), width=2)

draw.ellipse((pin_x - 6, pin_y - 6, pin_x + 6, pin_y + 6), fill=(249, 115, 22, 255), outline=(255, 255, 255, 255), width=2)

lbl_x = pin_x + 22
lbl_y = pin_y - 38
lbl_w = 175
lbl_h = 44

draw.line([(pin_x + 6, pin_y - 6), (lbl_x, lbl_y + 22)], fill=(251, 146, 60, 240), width=2)
draw.rounded_rectangle((lbl_x, lbl_y, lbl_x + lbl_w, lbl_y + lbl_h), radius=8, fill=(19, 29, 53, 245), outline=(249, 115, 22, 255), width=2)

try:
    font_bold = ImageFont.truetype("arialbd.ttf", 15)
    font_sub = ImageFont.truetype("arial.ttf", 11)
except:
    font_bold = ImageFont.load_default()
    font_sub = ImageFont.load_default()

draw.text((lbl_x + 10, lbl_y + 6), "Rio das Ostras", fill=(255, 255, 255, 255), font=font_bold)
draw.text((lbl_x + 10, lbl_y + 24), "Costa do Sol • RJ (22°31'S)", fill=(251, 146, 60, 255), font=font_sub)

out_dark = 'img/mapa_rj_marcado_hd_dark.png'
dark_im.save(out_dark)
print(f"Saved {out_dark}: {dark_im.size}")

art_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'
import shutil
shutil.copy(out_dark, os.path.join(art_dir, 'v129_mapa_rj_marcado_hd_dark.png'))
print("Copied to artifacts v129_mapa_rj_marcado_hd_dark.png")
