# Test script to preview the new minimalist Vento card matching Chuva's exact color pattern
import json

d = json.load(open('data/acumulados_estacoes.json', encoding='utf-8'))
stations = d['estacoes']
active_wind = [s for s in stations if s.get('online') and (s.get('categoria') == 'meteorologica' or s.get('codigo', '').startswith(('IR', 'IC')))]
print("Active wind stations count:", len(active_wind))
for s in active_wind:
    print(s['codigo'], s['nome_curto'], 'raj_max:', s.get('rajada_max_hoje'), 'v_max:', s.get('vento_max_hoje'), 'hora:', s.get('hora_rajada_max_hoje'))
