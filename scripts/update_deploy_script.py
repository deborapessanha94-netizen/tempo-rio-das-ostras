import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
deploy_script = os.path.join(base_dir, "scripts", "build_and_deploy.py")

with open(deploy_script, "r", encoding="utf-8") as f:
    text = f.read()

# bump to v234
text = text.replace("meteo-ostras-v232", "meteo-ostras-v234")

with open(deploy_script, "w", encoding="utf-8") as f:
    f.write(text)

print("Updated build_and_deploy.py to v234")
