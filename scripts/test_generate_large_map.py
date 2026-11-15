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

# Scale 2x with Lanczos
scaled = cropped.resize((c_w * 2, c_h * 2), Image.Resampling.LANCZOS)
s_w, s_h = scaled.size

# Expand canvas slightly (pad 40 on right and bottom) to give plenty of breathing room
final_w = s_w + 80
final_h = s_h + 40

s_arr = np.array(scaled)
dark_bg_arr = np.full((final_h, final_w, 4), [11, 19, 36, 255], dtype=np.uint8)

# Paste the inverted map into dark canvas
for y in range(s_arr.shape[0]):
    for x in range(s_arr.shape[1]):
        r, g, b, a = s_arr[y, x]
        brightness = (int(r) + int(g) + int(b)) / 3.0
        if brightness > 220:
            dark_bg_arr[y, x] = [11, 19, 36, 255] # Navy background #0b1324
        else:
            factor = 1.0 - (brightness / 220.0)
            # Crisp luminous silver-white line
            dark_bg_arr[y, x] = [
                int(11 + factor * (255 - 11)),
                int(19 + factor * (255 - 19)),
                int(36 + factor * (255 - 36)),
                255
            ]

dark_im = Image.fromarray(dark_bg_arr)
draw = ImageDraw.Draw(dark_im)

pin_x = int(s_w * 0.788)
pin_y = int(s_h * 0.600)

# 1. Pulsing radar rings
for r, alpha in [(48, 45), (36, 80), (26, 140), (16, 210)]:
    draw.ellipse((pin_x - r, pin_y - r, pin_x + r, pin_y + r), fill=(249, 115, 22, alpha), outline=(251, 146, 60, min(255, alpha + 50)), width=3)

# Center point
draw.ellipse((pin_x - 9, pin_y - 9, pin_x + 9, pin_y + 9), fill=(255, 255, 255, 255), outline=(234, 88, 12, 255), width=3)

# 2. Large, highly legible Badge Card
lbl_w = 330
lbl_h = 88
# Position card in the open ocean area (slightly right and below the pin, or right and centered)
lbl_x = pin_x + 35
lbl_y = pin_y - 20

# If right edge exceeds canvas, shift left slightly
if lbl_x + lbl_w > final_w - 15:
    lbl_x = final_w - lbl_w - 15

# Pointer connection
draw.line([(pin_x + 10, pin_y), (lbl_x, lbl_y + 44)], fill=(249, 115, 22, 255), width=3)

# Card background with rounded rectangle & double border
draw.rounded_rectangle(
    (lbl_x, lbl_y, lbl_x + lbl_w, lbl_y + lbl_h),
    radius=14,
    fill=(15, 23, 42, 250), # Deep slate navy #0f172a
    outline=(249, 115, 22, 255), # Bright orange #f97316
    width=3
)

# Text fonts
try:
    font_bold = ImageFont.truetype("arialbd.ttf", 34)
    font_sub = ImageFont.truetype("arialbd.ttf", 22)
except:
    font_bold = ImageFont.load_default()
    font_sub = ImageFont.load_default()

# Pin icon / bullet
draw.ellipse((lbl_x + 20, lbl_y + 24, lbl_x + 32, lbl_y + 36), fill=(249, 115, 22, 255))

# Title: "Rio das Ostras" (Pure White #FFFFFF, 34px bold)
draw.text((lbl_x + 42, lbl_y + 12), "Rio das Ostras", fill=(255, 255, 255, 255), font=font_bold)

# Subtitle: "Costa do Sol • RJ (22°31'S)" (Solar Gold #FCA311, 22px bold)
draw.text((lbl_x + 22, lbl_y + 50), "Costa do Sol • RJ (22°31'S)", fill=(252, 163, 17, 255), font=font_sub)

test_out = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf\test_new_dark_map.png'
dark_im.save(test_out)
print(f"Saved {test_out}: {dark_im.size}")
