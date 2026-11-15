from PIL import Image

test_out = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf\test_new_dark_map.png'
im = Image.open(test_out)
w, h = im.size

# Scale to 360px wide (representative container width)
scale_w = 360
scale_h = int(h * (360 / w))
small = im.resize((scale_w, scale_h), Image.Resampling.LANCZOS)
small_out = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf\test_new_dark_map_360px.png'
small.save(small_out)
print(f"Saved {small_out}: {small.size}")
