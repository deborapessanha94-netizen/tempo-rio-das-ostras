from PIL import Image
import os

art_dir = r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf"
im = Image.open(os.path.join(art_dir, "v237_mapa_rj_dark_page.png"))

# The page is 1400x960. The map card is on the right side of the Hero section
# Roughly x from 900 to 1350, y from 100 to 500
crop_map = im.crop((880, 80, 1370, 520))
crop_out = os.path.join(art_dir, "v237_mapa_card_zoomed.png")
crop_map.save(crop_out)
print(f"Saved {crop_out}: {crop_map.size}")
