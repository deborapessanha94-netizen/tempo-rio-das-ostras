import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
app_path = os.path.join(base_dir, "src", "App.tsx")

with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace(
    "<SocialExportModal curWeather={curWeather} acumulados={acumulados} boletimMeta={boletimMeta} />",
    "<SocialExportModal openMeteo={openMeteo} acumulados={acumulados} boletimMeta={boletimMeta} />"
)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Updated App.tsx prop to openMeteo={openMeteo}")
