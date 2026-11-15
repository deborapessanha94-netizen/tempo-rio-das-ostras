from PIL import Image
import os

path = r'C:/Users/debor/.gemini/antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf/.user_uploaded/media_1792994370877_00bc38b3.png'
im = Image.open(path)
print("Image format:", im.format, "size:", im.size, "mode:", im.mode)
