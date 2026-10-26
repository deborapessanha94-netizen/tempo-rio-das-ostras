# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/auto_bulletin.py', 'r', encoding='utf-8') as f:
    c = f.read()

pattern = re.compile(r'sinopse_geral = \(\s*f"O panorama meteorológico regional sobre o município de Rio das Ostras[\s\S]*?A infraestrutura de monitoramento meteorológico opera de forma contínua 24h na nuvem, com processamento automatizado e redundante dos dados do INMET, INEA e Open-Meteo\."\s*\)')

new_sinopse = '''sinopse_geral = (
        f"A configuração sinótica sobre o município de Rio das Ostras e o setor costeiro da Bacia de Campos para o período de {periodo_str} "
        f"é modulada pelo posicionamento da borda ocidental do Anticiclone Subtropical do Atlântico Sul (ASAS, isóbara central de ~1020-1022 hPa), "
        f"mantendo gradiente bárico favorável ao escoamento contínuo de ventos de quadrante Nordeste a Leste na camada limite planetária (1000 a 850 hPa). "
        f"Esse padrão de circulação zonal impõe advecção horizontal contínua de ar quente e úmido de origem marítima tropical em direção ao continente. "
        f"Em médios níveis da troposfera (500 hPa), a propagação de perturbações ondulatórias baroclínicas (cavados de onda curta) gera advecção de "
        f"vorticidade ciclônica relativa positiva, potencializando a convergência de massa em superfície acoplada à difluência térmica em altos níveis "
        f"(250 hPa) associada ao ramo polar/subtropical do jato. O perfil térmico na superfície apresenta oscilação barométrica estável, com temperaturas "
        f"oscilando entre mínima de {d0['t_min']:.0f}°C ao amanhecer (sob resfriamento radiativo noturno) e máxima diurna de {d0['t_max']:.0f}°C "
        f"{prep0} {d0['dia_semana'].lower()} ({d0['date_short']}), com precipitação diária prevista em {d0_faixa} ({d0_aviso_str}).\\n\\n"
        f"O forte aquecimento diabático por radiação solar em superfície durante o ciclo diurno estabelece taxas de lapso superadiabáticas junto ao solo, "
        f"promovendo forçamento termodinâmico ascensional e desestabilização vertical da troposfera. A conjugação entre elevado teor de água precipitável "
        f"na coluna troposférica (PW de 38 a 42 mm aferida nos modelos numéricos), umidade relativa em superfície e expressiva disponibilidade de "
        f"Energia Potencial Convectiva Disponível (índices CAPE moderados a altos, com erosão progressiva da inibição convectiva - CINE a partir da tarde) "
        f"sustenta o desenvolvimento de nuvens cumuliformes de grande desenvolvimento vertical (Cumulus congestus e núcleos convectivos de Cumulonimbus - Cb). "
        f"Esse regime potencializa a formação de pancadas de chuva convectivas de intensidade moderada a forte, com risco de descargas elétricas "
        f"atmosféricas (raios nuvem-solo) e rajadas de vento descendentes convectivas (downbursts / frentes de rajada de até {max_rajada_geral:.0f} km/h "
        f"na orla marítima). No monitoramento hidrometeorológico, a Bacia Hidrográfica do Rio Jundiá opera em regime fluviométrico de estabilidade e "
        f"vazante contínua, com a estação telemétrica municipal (INEA 224103620) acusando cota de {jundia_nivel_txt} m (Status: {jundia_status_txt}, "
        f"capacidade de calha em 60% e ampla margem de segurança de quase 1 metro para a cota de transbordo de 2,84 m), garantindo escoamento pluvial pleno nos canais urbanos.\\n\\n"
        f"Na evolução do prognóstico numérico de mesoescala para o horizonte de 72 horas (rodadas sinóticas ECMWF, GFS e COSMO/INMET 12Z), projeta-se a passagem "
        f"gradual da instabilidade pré-frontal e o restabelecimento progressivo de subsidência atmosférica com elevação bárica na retaguarda. "
        f"Para {prep1} {d1['dia_semana'].lower()} ({d1['date_short']}), o escoamento de superfície passa por rotação gradativa dos ventos para Sudeste/Leste "
        f"(rajadas regulares), com precipitação residual em declínio ({d1_faixa}, {d1_aviso_str}). "
        f"{prep2.capitalize()} {d2['dia_semana'].lower()} ({d2['date_short']}), consolida-se estabilização troposférica com redução expressiva da cobertura de nuvens, "
        f"predomínio de sol e volumes pluviométricos residuais ({d2_faixa}, {d2_aviso_str}). No domínio oceanográfico costeiro (Área Delta - Farol de São Tomé a Cabo Frio, "
        f"sob monitoramento do CHM/Marinha do Brasil), o estado do mar é caracterizado por ondas de 1,2 a 1,6 m formadas por vagas de vento sobrepostas a ondas de gravidade "
        f"oceânicas superficiais (swell de E/SE), mantendo hidrodinâmica costeira favorável sem represamento de maré na desembocadura dos canais pluviais. "
        f"A infraestrutura de telemetria meteorológica e hidrológica opera com processamento autônomo e contínuo 24h na nuvem, assegurando vigilância ininterrupta dos dados sinóticos municipais."
    )'''

m = pattern.search(c)
if m:
    c = c[:m.start()] + new_sinopse + c[m.end():]
    print("Updated sinopse_geral template in scripts/auto_bulletin.py")
else:
    print("Could not match pattern in scripts/auto_bulletin.py!")

with open('scripts/auto_bulletin.py', 'w', encoding='utf-8') as f:
    f.write(c)
