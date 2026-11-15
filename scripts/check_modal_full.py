with open('index.legacy.html', encoding='utf-8', errors='ignore') as f:
    text = f.read()

start_marker = 'id="social-modal-chuva"'
start_idx = text.find(start_marker)
if start_idx != -1:
    # go back to <div that has this id
    div_start = text.rfind('<div', 0, start_idx)
    # find where this modal closes
    print("Found modal start at:", div_start)
    # print 3000 chars
    print(text[div_start:div_start+3000])
