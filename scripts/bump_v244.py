with open('scripts/build_and_deploy.py', 'r', encoding='utf-8') as f:
    text = f.read()

text_new = text.replace('meteo-ostras-v243', 'meteo-ostras-v244').replace('v243', 'v244')
with open('scripts/build_and_deploy.py', 'w', encoding='utf-8') as f:
    f.write(text_new)

print("Updated build_and_deploy.py to v244")
