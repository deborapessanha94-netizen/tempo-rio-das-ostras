import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
app_path = os.path.join(base_dir, "src", "App.tsx")

with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

target = 'className="w-full h-auto max-h-64 object-contain rounded"'
replacement = 'className="w-full h-auto max-h-72 sm:max-h-80 object-contain rounded drop-shadow-xs transition-all"'

assert target in text, "target not found"
text = text.replace(target, replacement, 1)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Updated map image className successfully!")
