import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "src", "App.tsx"), "r", encoding="utf-8") as f:
    text = f.read()

ids_to_check = [
    'sidebar-temp', 'hero-sensacao', 'hero-sky-condition', 'hero-condition',
    'hero-subcondition', 'hero-chip-chuva-val', 'hero-chip-chuva-sub',
    'sidebar-wind', 'hero-chip-vento-sub', 'sidebar-hum', 'hero-chip-umid-sub',
    'sidebar-sea', 'hero-chip-mar-sub', 'hero-chip-press-val', 'hero-chip-uv-val',
    'hero-chip-sol-val', 'hero-chip-lua-val'
]

for my_id in ids_to_check:
    found = ('id="' + my_id + '"') in text or ("id='" + my_id + "'") in text
    print(f"{my_id} in App.tsx: {found}")
