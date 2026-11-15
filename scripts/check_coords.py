from PIL import Image
import numpy as np

path = r'C:/Users/debor/.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf/.user_uploaded/media_1792994370877_00bc38b3.png'
im = Image.open(path).convert('RGBA')
arr = np.array(im)

rgb = arr[:, :, :3]
is_dark = (rgb[:, :, 0] < 80) & (rgb[:, :, 1] < 80) & (rgb[:, :, 2] < 80)
coords = np.argwhere(is_dark)

min_y, min_x = coords.min(axis=0)
max_y, max_x = coords.max(axis=0)

print(f"Borders: x=[{min_x}, {max_x}], y=[{min_y}, {max_y}]")
print(f"Image size: {im.size}")
