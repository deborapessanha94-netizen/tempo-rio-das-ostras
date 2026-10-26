import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('Alternância de Abas: INMET COSMO vs CPTEC Multimodel')
if pos != -1:
    print(text[pos:pos+1500])
