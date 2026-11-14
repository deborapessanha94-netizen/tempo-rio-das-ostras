with open('C:/Users/debor/.gemini/antigravity/scratch/meteorologia-app/js/app.js', 'r', encoding='utf-8') as fp:
    lines = fp.readlines()

for i in range(9460, 9510):
    print(f'{i+1}: {lines[i]}', end='')
