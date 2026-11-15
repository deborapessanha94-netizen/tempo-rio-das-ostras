import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
app_path = os.path.join(base_dir, "src", "App.tsx")

with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find("Resumo Pluvio")
print("Found at idx:", idx)
if idx != -1:
    print(repr(text[idx-50:idx+250]))
