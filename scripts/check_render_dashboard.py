with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('function renderDashboardUI')
print(text[pos:pos+1600])
