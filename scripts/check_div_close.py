import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
app_path = os.path.join(base_dir, "src", "App.tsx")

with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find("Resumo Pluvio")
p_close = text.find("</p>", idx)
div_close = text.find("</div>", p_close)
print(repr(text[div_close:div_close+100]))
