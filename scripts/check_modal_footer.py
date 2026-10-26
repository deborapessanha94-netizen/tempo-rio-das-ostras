with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('id="modal-social-chuva"')
pos_end = text.find('</div>\n  </div>\n\n</body>')
if pos_end == -1:
    pos_end = text.find('</body>')
print(text[pos_end-500:pos_end+50])
