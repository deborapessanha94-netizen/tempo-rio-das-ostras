with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('styles.css?v=96', 'styles.css?v=97')
text = text.replace('app.js?v=124', 'app.js?v=125')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Bumped cache-busters to v97 and v125")
