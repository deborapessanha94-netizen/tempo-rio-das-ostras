with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('js/app.js?v=104', 'js/app.js?v=105')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated index.html to v105!")
