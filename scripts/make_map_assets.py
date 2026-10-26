# -*- coding: utf-8 -*-
from PIL import Image
import numpy as np
import os

img_path = r'C:/Users/debor/.gemini/antigravity/brain/ec824ae4-216a-462f-9550-50517e326bdf/.user_uploaded/media_1792994370877_00bc38b3.png'
im = Image.open(img_path).convert('RGBA')
arr = np.array(im)

# Find dark line pixels
rgb = arr[:, :, :3]
is_dark = (rgb[:, :, 0] < 80) & (rgb[:, :, 1] < 80) & (rgb[:, :, 2] < 80)
coords = np.argwhere(is_dark)

min_y, min_x = coords.min(axis=0)
max_y, max_x = coords.max(axis=0)

pad = 16
crop_min_x = max(0, min_x - pad)
crop_max_x = min(im.width, max_x + pad)
crop_min_y = max(0, min_y - pad)
crop_max_y = min(im.height, max_y + pad)

cropped = im.crop((crop_min_x, crop_min_y, crop_max_x, crop_max_y))
c_arr = np.array(cropped)

# Light mode version:
# Where pixel is dark, keep dark (#0f172a, alpha=255)
# Where pixel is white (>220 in all channels), make transparent
is_white = (c_arr[:, :, 0] > 220) & (c_arr[:, :, 1] > 220) & (c_arr[:, :, 2] > 220)

light_arr = np.zeros_like(c_arr)
# Antialiased or dark pixels
for y in range(c_arr.shape[0]):
    for x in range(c_arr.shape[1]):
        r, g, b, a = c_arr[y, x]
        brightness = (int(r) + int(g) + int(b)) / 3.0
        if brightness > 230:
            light_arr[y, x] = [0, 0, 0, 0]
        else:
            # Opacity based on darkness
            alpha_val = int(255 * (1.0 - (brightness / 230.0)))
            # Pure dark slate color: #0f172a
            light_arr[y, x] = [15, 23, 42, min(255, int(alpha_val * 1.5))]

light_im = Image.fromarray(light_arr)
os.makedirs('img', exist_ok=True)
light_im.save('img/mapa_rj_light.png')
print("Saved img/mapa_rj_light.png", light_im.size)

# Dark mode version:
# Stroke color: luminous silver/white (#f1f5f9) or cyan (#38bdf8)
dark_arr = np.zeros_like(c_arr)
for y in range(c_arr.shape[0]):
    for x in range(c_arr.shape[1]):
        r, g, b, a = c_arr[y, x]
        brightness = (int(r) + int(g) + int(b)) / 3.0
        if brightness > 230:
            dark_arr[y, x] = [0, 0, 0, 0]
        else:
            alpha_val = int(255 * (1.0 - (brightness / 230.0)))
            # Luminous white-silver with slight blue tint: #e2e8f0
            dark_arr[y, x] = [226, 232, 240, min(255, int(alpha_val * 1.5))]

dark_im = Image.fromarray(dark_arr)
dark_im.save('img/mapa_rj_dark.png')
print("Saved img/mapa_rj_dark.png", dark_im.size)
