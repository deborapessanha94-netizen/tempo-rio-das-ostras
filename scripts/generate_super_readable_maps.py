from PIL import Image, ImageDraw, ImageFont
import numpy as np
import os
import shutil

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
img_path = r'C:/Users/debor/.gemini/antigravity/brain/ec824ae4-216a-462f-9550-50517e326bdf/.user_uploaded/media_1792994370877_00bc38b3.png'
art_dir = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf'

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

# High-res base image scaled 2x
scaled = cropped.resize((c_w * 2, c_h * 2), Image.Resampling.LANCZOS)
s_w, s_h = scaled.size

# Add right & bottom padding to ensure badge fits comfortably
final_w = s_w + 100
final_h = s_h + 40

s_arr = np.array(scaled)

# -------------------------------------------------------------
# 1. GENERATE DARK HD MAP (img/mapa_rj_marcado_hd_dark.png)
# -------------------------------------------------------------
dark_bg_arr = np.full((final_h, final_w, 4), [11, 19, 36, 255], dtype=np.uint8) # #0b1324

for y in range(s_arr.shape[0]):
    for x in range(s_arr.shape[1]):
        r, g, b, a = s_arr[y, x]
        brightness = (int(r) + int(g) + int(b)) / 3.0
        if brightness > 220:
            dark_bg_arr[y, x] = [11, 19, 36, 255] # Background navy
        else:
            factor = 1.0 - (brightness / 220.0)
            # Luminous high-contrast white coastline outline
            dark_bg_arr[y, x] = [
                int(11 + factor * (255 - 11)),
                int(19 + factor * (255 - 19)),
                int(36 + factor * (255 - 36)),
                255
            ]

dark_im = Image.fromarray(dark_bg_arr)
draw_dark = ImageDraw.Draw(dark_im)

pin_x = int(s_w * 0.788)
pin_y = int(s_h * 0.600)

# Radar concentric rings
for r, alpha in [(52, 45), (38, 85), (26, 145), (16, 220)]:
    draw_dark.ellipse(
        (pin_x - r, pin_y - r, pin_x + r, pin_y + r),
        fill=(249, 115, 22, alpha),
        outline=(251, 146, 60, min(255, alpha + 60)),
        width=3
    )

# Center point
draw_dark.ellipse((pin_x - 10, pin_y - 10, pin_x + 10, pin_y + 10), fill=(255, 255, 255, 255), outline=(234, 88, 12, 255), width=3)

# Large, highly legible Badge Card
lbl_w = 370
lbl_h = 104
lbl_x = pin_x + 40
lbl_y = pin_y - 32

if lbl_x + lbl_w > final_w - 15:
    lbl_x = final_w - lbl_w - 15

# Pointer connection line
draw_dark.line([(pin_x + 10, pin_y), (lbl_x, lbl_y + 52)], fill=(249, 115, 22, 255), width=4)

# Card background with rounded rectangle & double border
draw_dark.rounded_rectangle(
    (lbl_x, lbl_y, lbl_x + lbl_w, lbl_y + lbl_h),
    radius=16,
    fill=(15, 23, 42, 252), # Deep slate navy #0f172a
    outline=(249, 115, 22, 255), # Bright orange #f97316
    width=4
)

# Text fonts
try:
    font_bold = ImageFont.truetype("arialbd.ttf", 40)
    font_sub = ImageFont.truetype("arialbd.ttf", 25)
except:
    font_bold = ImageFont.load_default()
    font_sub = ImageFont.load_default()

# Orange marker pill inside card
draw_dark.rounded_rectangle(
    (lbl_x + 18, lbl_y + 18, lbl_x + 24, lbl_y + 54),
    radius=3,
    fill=(249, 115, 22, 255)
)

# Title: "Rio das Ostras" in Pure Bright White #FFFFFF (40px Bold)
draw_dark.text((lbl_x + 36, lbl_y + 14), "Rio das Ostras", fill=(255, 255, 255, 255), font=font_bold)

# Subtitle: "Costa do Sol • RJ (22°31'S)" in Solar Gold #FCA311 (25px Bold)
draw_dark.text((lbl_x + 18, lbl_y + 60), "Costa do Sol • RJ (22°31'S)", fill=(252, 163, 17, 255), font=font_sub)

out_dark = os.path.join(base_dir, 'img', 'mapa_rj_marcado_hd_dark.png')
dark_im.save(out_dark)
print(f"Saved {out_dark}: {dark_im.size}")
shutil.copy(out_dark, os.path.join(art_dir, 'v236_mapa_rj_marcado_hd_dark.png'))

# -------------------------------------------------------------
# 2. GENERATE LIGHT HD MAP (img/mapa_rj_marcado_hd.png)
# -------------------------------------------------------------
light_bg_arr = np.full((final_h, final_w, 4), [248, 250, 252, 255], dtype=np.uint8) # #f8fafc

for y in range(s_arr.shape[0]):
    for x in range(s_arr.shape[1]):
        r, g, b, a = s_arr[y, x]
        brightness = (int(r) + int(g) + int(b)) / 3.0
        if brightness > 220:
            light_bg_arr[y, x] = [248, 250, 252, 255] # Clean light background
        else:
            factor = 1.0 - (brightness / 220.0)
            # Crisp dark slate outline
            light_bg_arr[y, x] = [
                int(248 - factor * (248 - 30)),
                int(250 - factor * (250 - 41)),
                int(252 - factor * (252 - 59)),
                255
            ]

light_im = Image.fromarray(light_bg_arr)
draw_light = ImageDraw.Draw(light_im)

# Radar concentric rings
for r, alpha in [(52, 45), (38, 85), (26, 145), (16, 220)]:
    draw_light.ellipse(
        (pin_x - r, pin_y - r, pin_x + r, pin_y + r),
        fill=(234, 88, 12, alpha),
        outline=(194, 65, 12, min(255, alpha + 60)),
        width=3
    )

# Center point
draw_light.ellipse((pin_x - 10, pin_y - 10, pin_x + 10, pin_y + 10), fill=(255, 255, 255, 255), outline=(234, 88, 12, 255), width=3)

# Pointer line
draw_light.line([(pin_x + 10, pin_y), (lbl_x, lbl_y + 52)], fill=(234, 88, 12, 255), width=4)

# Card background with rounded rectangle & double border
draw_light.rounded_rectangle(
    (lbl_x, lbl_y, lbl_x + lbl_w, lbl_y + lbl_h),
    radius=16,
    fill=(255, 255, 255, 252), # Pure white #ffffff
    outline=(234, 88, 12, 255), # Warm terracotta orange #ea580c
    width=4
)

# Marker pill
draw_light.rounded_rectangle(
    (lbl_x + 18, lbl_y + 18, lbl_x + 24, lbl_y + 54),
    radius=3,
    fill=(234, 88, 12, 255)
)

# Title: "Rio das Ostras" in Deep Slate Black #0F172A (40px Bold)
draw_light.text((lbl_x + 36, lbl_y + 14), "Rio das Ostras", fill=(15, 23, 42, 255), font=font_bold)

# Subtitle: "Costa do Sol • RJ (22°31'S)" in Warm Orange #C2410C (25px Bold)
draw_light.text((lbl_x + 18, lbl_y + 60), "Costa do Sol • RJ (22°31'S)", fill=(194, 65, 12, 255), font=font_sub)

out_light = os.path.join(base_dir, 'img', 'mapa_rj_marcado_hd.png')
light_im.save(out_light)
print(f"Saved {out_light}: {light_im.size}")
shutil.copy(out_light, os.path.join(art_dir, 'v236_mapa_rj_marcado_hd_light.png'))

print("Generated both HD maps successfully with large high-contrast typography!")
