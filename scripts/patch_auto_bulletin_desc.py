p = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\scripts\auto_bulletin.py'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()
target = '''        informe_pop = gerar_informe_populacao_5_topicos(
            d_idx, d, day_turnos, jundia_nivel_txt, jundia_status_txt, tem_aviso_marinha, inmet_alerts
        )'''
repl = '''        informe_pop = gerar_informe_populacao_5_topicos(
            d_idx, d, day_turnos, jundia_nivel_txt, jundia_status_txt, tem_aviso_marinha, inmet_alerts
        )
        if informe_pop and len(informe_pop) >= 6:
            desc_card = f"{desc_card} {informe_pop[-1]}"'''

target_crlf = target.replace('\n', '\r\n')
repl_crlf = repl.replace('\n', '\r\n')

if target in c:
    c = c.replace(target, repl)
elif target_crlf in c:
    c = c.replace(target_crlf, repl_crlf)

with open(p, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(c)
print('auto_bulletin.py updated!')
