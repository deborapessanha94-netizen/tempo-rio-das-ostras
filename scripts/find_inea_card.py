with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

pos_start = text.find("if (st.categoria === 'inea') {", 99000)
pos_end = text.find("return `\n        <div class=\"station-card station-item-card p-4 rounded-2xl bg-white", pos_start)
if pos_end == -1:
    pos_end = text.find("// CARD DAS 9 ESTA", pos_start)

print("pos_start:", pos_start, "pos_end:", pos_end)
print("--- TARGET SLICE ---")
print(text[pos_start:pos_end])
