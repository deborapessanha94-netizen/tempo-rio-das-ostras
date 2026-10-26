# -*- coding: utf-8 -*-

with open('js/app.js', encoding='utf-8') as f:
    js_lines = f.readlines()

for i, line in enumerate(js_lines):
    if 'heroSyncLabel.textContent' in line:
        for j in range(max(0, i-5), min(i+5, len(js_lines))):
            print(f"js {j+1}: {repr(js_lines[j])}")
    if 'atualizacaoTxtEl.textContent' in line:
        for j in range(max(0, i-5), min(i+5, len(js_lines))):
            print(f"js {j+1}: {repr(js_lines[j])}")

with open('index.html', encoding='utf-8') as f:
    html_lines = f.readlines()

for i, line in enumerate(html_lines):
    if 'btn-open-meteogramas-card' in line:
        for j in range(max(0, i-5), min(i+15, len(html_lines))):
            print(f"html {j+1}: {repr(html_lines[j])}")
    if 'btn-open-meteogramas-boletim' in line:
        for j in range(max(0, i-15), min(i+10, len(html_lines))):
            print(f"html {j+1}: {repr(html_lines[j])}")
