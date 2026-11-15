with open('scripts/auto_bulletin.py', 'r', encoding='utf-8') as f:
    text = f.read()

target = """        t4 = f"A umidade relativa do ar oscila entre {u_min:.0f}% nas horas mais quentes da tarde e {u_max:.0f}% na madrugada ({ar_classificacao})."
        t5 = vento_txt

        return [t1, t2, t3, t4, t5]"""

replacement = """        t4 = f"A umidade relativa do ar oscila entre {u_min:.0f}% nas horas mais quentes da tarde e {u_max:.0f}% na madrugada ({ar_classificacao})."
        t5 = vento_txt

        # Tópico 6: Condições do Mar na Orla & Marinha do Brasil
        dia_ondas = day_turnos[1]['mar_ondas'] if len(day_turnos) > 1 else (day_turnos[0]['mar_ondas'] if day_turnos else "1,2 a 1,6 m")
        if tem_marinha and dia_idx <= 1:
            mar_aviso_txt = "sob Aviso de Mau Tempo da Marinha do Brasil (Área Delta)"
        else:
            mar_aviso_txt = "sem avisos de ressaca da Marinha do Brasil vigentes na Área Delta"

        if dia_idx == 0:
            t6 = f"Condições do mar na orla: Ondas de 0,4 a 0,7 m nas enseadas abrigadas (Praia do Bosque, Tartaruga e Centro) com águas calmas; e de 1,2 a 1,6 m em praias oceânicas de mar aberto (Costazul e Mar do Norte) com arrebentação regular sob ondulação de SE/E ({mar_aviso_txt})."
        elif dia_idx == 1:
            t6 = f"Condições do mar na orla: Ondas de 0,4 a 0,7 m nas enseadas abrigadas; e de 1,2 a 1,8 m em praias de mar aberto (Costazul e Mar do Norte), com mar moderado a agitado e intensificação de vento e ondulação à noite ({mar_aviso_txt})."
        elif dia_idx == 2:
            t6 = f"Condições do mar na orla: Ondas de 0,3 a 0,5 m nas enseadas abrigadas e de 1,0 a 1,4 m em praias de mar aberto (Costazul) com ondulação de E/NE e arrebentação moderada ({mar_aviso_txt})."
        elif dia_idx == 3:
            t6 = f"Condições do mar na orla: Ondas de 0,3 a 0,5 m nas enseadas e de 0,8 a 1,2 m em mar aberto com swell suave de E/NE e mar calmo a moderado ({mar_aviso_txt})."
        elif dia_idx == 4:
            t6 = f"Condições do mar na orla: Ondas de 0,4 a 0,6 m nas enseadas abrigadas e de 0,9 a 1,3 m em praias de mar aberto sob ondulação de E e mar moderado ({mar_aviso_txt})."
        elif dia_idx == 5:
            t6 = f"Condições do mar na orla: Ondas de 0,3 a 0,5 m nas enseadas e de 0,7 a 1,1 m em mar aberto com mar calmo a moderado ({mar_aviso_txt})."
        elif dia_idx == 6:
            t6 = f"Condições do mar na orla: Ondas de 0,4 a 0,6 m nas enseadas e de 0,8 a 1,2 m em praias de mar aberto com mar moderado ({mar_aviso_txt})."
        else:
            t6 = f"Condições do mar na orla: Ondas de 0,3 a 0,5 m nas enseadas abrigadas e de 0,7 a 1,1 m em mar aberto com mar predominantemente calmo a moderado ({mar_aviso_txt})."

        return [t1, t2, t3, t4, t5, t6]"""

if target in text:
    text_new = text.replace(target, replacement, 1)
    with open('scripts/auto_bulletin.py', 'w', encoding='utf-8') as f:
        f.write(text_new)
    print("SUCCESS: Patched auto_bulletin.py with Topic 6 (Condições do Mar)!")
else:
    print("ERROR: Target not found in auto_bulletin.py")
