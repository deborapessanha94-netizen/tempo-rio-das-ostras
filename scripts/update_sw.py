with open("sw.js", "r", encoding="utf-8") as f:
    text = f.read()

target = "'./data/balneabilidade.json',"
addition = "'./data/balneabilidade.json',\n  './img/inea_mapa_balneabilidade.png',"

if "'./img/inea_mapa_balneabilidade.png'" not in text:
    text = text.replace(target, addition)
    with open("sw.js", "w", encoding="utf-8") as f:
        f.write(text)
    print("Added image to sw.js")
else:
    print("Already in sw.js")
