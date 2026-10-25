with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def print_around(line_num, delta=4):
    print(f"\n--- Around Line {line_num} ---")
    for idx in range(max(0, line_num - delta), min(len(lines), line_num + delta)):
        print(f"L{idx+1}: {lines[idx].rstrip()}")

print_around(163) # section-alertas-oficiais starts
print_around(336) # section-alertas ends, panorama starts
print_around(411) # panorama ends, previsao 3dias starts
print_around(650) # previsao 3dias ends, main starts
print_around(853) # chart card ends, orla starts
print_around(1095) # orla ends, aside starts
print_around(1160) # jundia ends, telefones starts
print_around(1242) # telefones ends, turnos starts
print_around(1342) # turnos ends, main ends, view-tab-previsao ends
print_around(1601) # view-tab-chuva ends, footer starts
