with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('btn-close-modal-meteogramas-foot')
print("Position of btn-close-modal-meteogramas-foot:", pos)
if pos != -1:
    print(text[pos-200:pos+200])
