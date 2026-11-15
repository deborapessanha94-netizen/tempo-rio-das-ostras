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

# Add padding to allow a spacious badge
pad_x_left = 30
pad_x_right = 160 # extra right margin for the label!
pad_y_top = 40
pad_y_bottom = 40

crop_min_x = max(0, min_x - pad_x_left)
crop_max_x = min(im.width, max_x + pad_x_right)
crop_min_y = max(0, min_y - pad_y_top)
crop_max_y = min(im.height, max_y + pad_y_bottom)

cropped = im.crop((crop_min_x, crop_min_y, crop_max_x, crop_max_y))
c_w, c_h = cropped.size

# High-res marked image (scale 2x)
scaled = cropped.resize((c_w * 2, c_h * 2), Image.Resampling.LANCZOS)
s_w, s_h = scaled.size

print("Cropped scaled size:", s_w, s_h)
