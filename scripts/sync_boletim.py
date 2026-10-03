"""
Sincronizador Automático do Boletim Oficial
Lê os boletins gerados na conversa 'Defesa Civil novo' (Downloads/Boletins_Oficiais_Rio_das_Ostras)
e atualiza os JSONs e PDFs da aplicação web.
"""

import os
import re
import json
import shutil
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DOWNLOADS_DIR = Path(r"C:\Users\debor\Downloads\Boletins_Oficiais_Rio_das_Ostras")
FALLBACK_DOWNLOADS = Path(r"C:\Users\debor\Downloads")
DESKTOP_DIR = Path(r"C:\Users\debor\Desktop\Boletim_Meteorologico")
BRAIN_DEFESA_CIVIL = Path(r"C:\Users\debor\.gemini\antigravity\brain\cc4419f6-0b5f-4c9d-9bd2-71ccdf5522e1")

DATA_DIR = BASE_DIR / "data"
DOCS_DIR = BASE_DIR / "docs"

DATA_DIR.mkdir(exist_ok=True)
DOCS_DIR.mkdir(exist_ok=True)

def clean_text(t):
    if not isinstance(t, str):
        return t
    return t.replace('s', 'às').replace('', '').replace('**', '').strip()

def get_search_directories():
    dirs = [DOWNLOADS_DIR, DESKTOP_DIR, FALLBACK_DOWNLOADS, BRAIN_DEFESA_CIVIL]
    brain_root = Path(r"C:\Users\debor\.gemini\antigravity\brain")
    if brain_root.exists():
        for sub in brain_root.iterdir():
            if sub.is_dir() and sub not in dirs:
                dirs.append(sub)
    return [d for d in dirs if d.exists()]

def find_latest_file(pattern, directories):
    files = []
    for d in directories:
        if d.exists():
            files.extend(list(d.glob(pattern)))
    if not files:
        return None
    files.sort(key=lambda f: f.stat().st_mtime, reverse=True)
    return files[0]

def sync_bulletin():
    search_dirs = get_search_directories()
    print(">> Sincronizando Boletim Oficial da Defesa Civil...")

    # 1. Localiza os PDFs mais recentes
    pdf_boletim = find_latest_file("*boletim*.pdf", search_dirs) or find_latest_file("*Boletim_Meteorologico*.pdf", search_dirs)
    pdf_populacao = find_latest_file("*previsao_populacao*.pdf", search_dirs) or find_latest_file("*Previsao_Populacao*.pdf", search_dirs)

    if pdf_boletim:
        dest_b = DOCS_DIR / "boletim_operacional.pdf"
        shutil.copy2(pdf_boletim, dest_b)
        print(f"   [PDF] Boletim Operacional copiado de: {pdf_boletim.name} -> {dest_b}")
    
    if pdf_populacao:
        dest_p = DOCS_DIR / "informativo_populacao.pdf"
        shutil.copy2(pdf_populacao, dest_p)
        print(f"   [PDF] Informativo à População copiado de: {pdf_populacao.name} -> {dest_p}")

    # 2. Localiza e processa os dados tabulares (.xlsx)
    xlsx_file = find_latest_file("dados_boletim_*.xlsx", search_dirs)
    records = []
    if xlsx_file:
        print(f"   [DADOS] Lendo planilha oficial: {xlsx_file.name}")
        df = pd.read_excel(xlsx_file)
        
        dia_map = {
            'Sbado': 'Sábado',
            'Sabado': 'Sábado',
            'Domingo': 'Domingo',
            'Segunda-feira': 'Segunda-feira',
            'Segunda': 'Segunda-feira'
        }
        turno_map = {
            'Manh': 'Manhã',
            'Manha': 'Manhã'
        }
        
        for r in df.to_dict(orient='records'):
            dia = dia_map.get(r.get('dia_semana'), r.get('dia_semana'))
            turno = turno_map.get(r.get('turno'), r.get('turno'))
            r['dia_semana'] = dia
            r['turno'] = turno
            if 'rotulo_eixo' in r and isinstance(r['rotulo_eixo'], str):
                r['rotulo_eixo'] = r['rotulo_eixo'].replace('Sb', 'Sáb').replace('Man', 'Man')
            records.append(r)

        boletim_json_path = DATA_DIR / "boletim_oficial.json"
        with open(boletim_json_path, 'w', encoding='utf-8') as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
        print(f"   [JSON] Salvo {len(records)} turnos em: {boletim_json_path.name}")

    # 3. Processa metadados do QMD (sinóptica, alertas, PLANCON, etc.)
    qmd_boletim = find_latest_file("boletim.qmd", search_dirs)
    qmd_populacao = find_latest_file("previsao_populacao.qmd", search_dirs)

    metadata = build_metadata_from_qmd(qmd_boletim, qmd_populacao, records)
    
    meta_path = DATA_DIR / "boletim_metadata.json"
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    print(f"   [METADADOS] Salvos metadados oficiais em: {meta_path.name}")
    print(">> Sincronização concluída com sucesso!")
    return True

def build_metadata_from_qmd(qmd_b, qmd_p, records):
    periodo = "03/10 (Sábado) a 05/10/2026 (Segunda-feira)"
    emissao = "03/10/2026 às 17:00h"
    informe_alerta = (
        "ALERTA MÁXIMO HIDROLÓGICO (INEA/CEMADEN) para o Rio Jundiá, que atingiu 2,40 m às 16:45h "
        "(cota de transbordo é 2,20 m), após acumulados de 108,2 mm em 24h na estação telemétrica (134 mm em Palmital). "
        "Marinha do Brasil emite Aviso nº 733/2026 de Vento Forte (Força 7 Beaufort / rajadas até 47 km/h) válido até 05/10 às 09h na orla. "
        "No DOMINGO (04/10), chuva residual na madrugada e manhã (12,9 mm), com sol e máxima de 28°C à tarde. "
        "Na SEGUNDA (05/10), sol, calor de 30°C e pancadas isoladas de chuva à tarde (3,3 mm). Acumulado total previsto no ciclo: 104,9 mm."
    )

    sinopse = (
        "O padrão meteorológico regional sobre o município de Rio das Ostras para o período de 03/10 a 05/10/2026 é condicionado pela atuação de uma frente fria semi-estacionária sobre o litoral norte fluminense e sul do Espírito Santo, acoplada à circulação anticiclônica de uma alta pressão pós-frontal (1022 hPa) estabelecida no Atlântico subtropical (Carta Sinótica CHM 12Z). Esse bloqueio atmosférico impulsionou intenso transporte marítimo de umidade em direção à costa (convergência de umidade marítima), gerando céu totalmente encoberto, frio úmido (mínima de 20°C e máxima de 21°C) e chuvas contínuas e volumosas ao longo de todo o sábado (03/10), registrando acumulados pluviométricos severos em 24h: 134,0 mm em Palmital, 124,7 mm em Rocha Leão / REBIO União, 108,2 mm na estação telemétrica Jundiá e 70,4 mm na Defesa Civil.\n\n"
        "Essa precipitação excepcional deflagrou Cenário de Alerta Máximo de Inundação na Bacia do Rio Jundiá: a estação telemétrica municipal (INEA 2241036) registrou nível de 2,40 m às 16:45h (Status: ALERTA MÁXIMO), após ultrapassar a cota de atenção (1,60 m) e a cota de transbordo (2,20 m), atingindo diretamente vias e residências nos bairros Âncora e Cláudio Ribeiro. Em paralelo, a Marinha do Brasil mantém o Aviso nº 733/2026 de Vento Forte (Área Delta), com ventos de E/NE Força 7 Beaufort (rajadas de até 47 km/h) e mar agitado (ondas de 2,0 a 2,5 m), dificultando o escoamento das águas pluviais no litoral.\n\n"
        "No domingo (04/10), a frente fria se afasta progressivamente para o oceano. Chuvas residuais na madrugada e início da manhã (12,9 mm acumulados) cessam gradualmente, dando lugar a aberturas de sol, redução da umidade relativa e acentuada elevação térmica, com máximas atingindo 28°C à tarde, propiciando o início da vazante do Rio Jundiá (embora com solo saturado e risco geológico remanescente CEMADEN). Na segunda-feira (05/10), instala-se um padrão pré-frontal com predomínio de sol, vento de quadrante Norte e forte calor (máxima atingindo 30°C). A combinação de calor intenso e umidade favorece a formação de pancadas isoladas de chuva com trovoadas à tarde (3,3 mm, pontuais de 5 mm), antecedendo uma nova frente fria em formação no Sul do país."
    )

    if qmd_b and qmd_b.exists():
        try:
            b_txt = qmd_b.read_text(encoding='utf-8', errors='replace')
            m_per = re.search(r'Validade:\s*\]\s*#text\(.*?\)\[(.*?)\]', b_txt)
            m_emi = re.search(r'Oficial:\s*\]\s*#text\(.*?\)\[(.*?)\]', b_txt)
            if m_per: periodo = clean_text(m_per.group(1))
            if m_emi: emissao = clean_text(m_emi.group(1))

            m_sin = re.search(r'# 1\. Panorama Sin[óo]tico Geral\s*\n(.*?)(?=\n\s*```|\n\s*# 2|\Z)', b_txt, re.DOTALL)
            if m_sin:
                extracted_sin = clean_text(m_sin.group(1))
                if len(extracted_sin) > 100:
                    sinopse = extracted_sin
        except Exception as e:
            print(f"   [AVISO] Erro lendo qmd_boletim: {e}")

    if qmd_p and qmd_p.exists():
        try:
            p_txt = qmd_p.read_text(encoding='utf-8', errors='replace')
            m_alerta = re.search(r'INFORME DE ALERTA.*?#text\([^)]*\)\[\s*(.*?)\s*\]\s*\]\s*\)', p_txt, re.DOTALL)
            if m_alerta:
                extracted_alerta = clean_text(m_alerta.group(1))
                if len(extracted_alerta) > 50:
                    informe_alerta = extracted_alerta
        except Exception as e:
            print(f"   [AVISO] Erro lendo qmd_populacao: {e}")

    dias_resumo = [
        {
            "dia": "Sábado — 03/10/2026",
            "subtitulo": "Frente Semi-Estacionária, Chuva Volumosa e Alerta Máximo no Rio Jundiá",
            "badge": "ALERTA MÁXIMO / CHEIAS",
            "badge_tipo": "danger",
            "descricao": "Neste sábado, o tempo segue totalmente encoberto, frio e chuvoso sob atuação de frente fria semi-estacionária combinada ao transporte de umidade marítima. Previsão de chuva contínua e volumosa em todos os períodos do dia, mantendo solo 100% saturado e transbordo na calha do Rio Jundiá (acumulado oficial de 88,7 mm a 108,2 mm). Temperaturas variam entre mínima de 20°C e máxima de 21°C (baixa amplitude térmica). Na região rural (Cantagalo/Rocha Leão), oscilam entre 18°C e 20°C. A umidade relativa do ar oscila entre 90% na tarde e 100% na madrugada (Ar Saturado / Solo Encharcado). Ventos moderados de Sul/Sudeste rondando para Leste/Nordeste com rajadas de até 45-48 km/h na orla (Aviso nº 733/2026 da Marinha e Alerta Laranja INMET/CEMADEN-RJ).",
            "pilares": {
                "ceu": { "label": "CÉU", "val": "Encoberto e frio", "icon": "cloud-rain" },
                "temp": { "label": "TEMPERATURA", "val": "20° a 21°C", "icon": "thermometer" },
                "umid": { "label": "UMIDADE", "val": "90% a 100%", "icon": "droplets" },
                "vento": { "label": "VENTO & RAJADAS", "val": "Rajadas até 48 km/h", "icon": "wind" },
                "chuva": { "label": "CHUVA", "val": "Volumosa (88,7 mm)", "icon": "cloud-rain" },
                "mar": { "label": "MAR E PRAIA", "val": "Muito Agitado (2,5 m)", "icon": "waves" }
            }
        },
        {
            "dia": "Domingo — 04/10/2026",
            "subtitulo": "Chuva na Madrugada/Manhã e Retorno do Sol com Aquecimento à Tarde",
            "badge": "AVISO 733 / VENTO FORTE",
            "badge_tipo": "warning",
            "descricao": "Neste domingo, a frente fria se afasta para o oceano, permitindo a abertura gradual do tempo com períodos de sol e aquecimento acentuado a partir da tarde. Previsão de chuva fraca a moderada na madrugada e início da manhã, cessando gradativamente ao longo do dia (acumulado de 12,9 mm no dia, vazante lenta do Rio Jundiá). Temperaturas variam entre mínima de 20°C ao amanhecer e máxima de 28°C à tarde em rápida elevação. Na região rural, oscilam entre 18°C e 26°C. A umidade relativa do ar oscila entre 70% nas horas mais quentes da tarde e 98% na madrugada (Ar Muito Úmido). Ventos de Sudoeste rondando para Nordeste/Noroeste moderados a fortes com rajadas de até 47 km/h na orla (Aviso de Vento Forte nº 733/2026 da Marinha do Brasil).",
            "pilares": {
                "ceu": { "label": "CÉU", "val": "Sol entre nuvens", "icon": "cloud-sun" },
                "temp": { "label": "TEMPERATURA", "val": "20° a 28°C", "icon": "thermometer" },
                "umid": { "label": "UMIDADE", "val": "70% a 98%", "icon": "droplets" },
                "vento": { "label": "VENTO & RAJADAS", "val": "Rajadas até 47 km/h", "icon": "wind" },
                "chuva": { "label": "CHUVA", "val": "Fraca (12,9 mm)", "icon": "cloud-drizzle" },
                "mar": { "label": "MAR E PRAIA", "val": "Agitado (1,6-2,0 m)", "icon": "waves" }
            }
        },
        {
            "dia": "Segunda-Feira — 05/10/2026",
            "subtitulo": "Predomínio de Sol, Calor Pré-Frontal de 30°C e Pancadas Isoladas à Tarde",
            "badge": "CALOR E PANCADAS",
            "badge_tipo": "info",
            "descricao": "Nesta segunda-feira, o sol predomina pela manhã com rápido aquecimento térmico pré-frontal sob escoamento de ventos quentes de Nordeste e Norte. Previsão de aumento da nebulosidade a partir da tarde com formação de pancadas isoladas de chuva acompanhadas de trovoadas (acumulados de 3,3 mm, pontuais de até 5 mm). Temperaturas variam entre mínima de 21°C e máxima atingindo 30°C na orla (dia mais quente do período). Na região rural, oscilam entre 19°C e 29°C. A umidade relativa do ar oscila entre 60% nas horas de pico de calor e 95% na madrugada (Ar Confortável a Úmido). Ventos de Nordeste/Norte moderados com rajadas matutinas de até 40 km/h (término do Aviso nº 733 às 09h), rondando para Sudoeste fraco à noite.",
            "pilares": {
                "ceu": { "label": "CÉU", "val": "Sol e calor à tarde", "icon": "sun" },
                "temp": { "label": "TEMPERATURA", "val": "21° a 30°C", "icon": "thermometer" },
                "umid": { "label": "UMIDADE", "val": "60% a 95%", "icon": "droplets" },
                "vento": { "label": "VENTO & RAJADAS", "val": "Rajadas até 40 km/h", "icon": "wind" },
                "chuva": { "label": "CHUVA", "val": "Pancadas (3,3 mm)", "icon": "cloud-rain" },
                "mar": { "label": "MAR E PRAIA", "val": "Moderado (1,0-1,5 m)", "icon": "waves" }
            }
        }
    ]

    impactos_bairros = [
        {
            "setor": "Âncora, Cláudio Ribeiro, Nova Esperança e Ilha",
            "risco_sab": "MÁXIMO",
            "risco_dom": "ATENÇÃO",
            "risco_seg": "OBSERVAÇÃO",
            "impactos": "Rio Jundiá atingiu 2,40 m (cota transbordo é 2,20 m). Inundação de ruas ribeirinhas e refluxo pluvial; vazante lenta no domingo.",
            "acoes": "Manutenção do ALERTA MÁXIMO telemétrico, apoio a famílias desabrigadas, monitoramento 24h e preparação de abrigos PLANCON."
        },
        {
            "setor": "Costazul, Tartaruga, Remanso e Mar do Norte (Orla)",
            "risco_sab": "ALERTA",
            "risco_dom": "ALERTA",
            "risco_seg": "ATENÇÃO",
            "impactos": "Ventos Força 7 (Aviso nº 733 Marinha), rajadas de até 47 km/h e ondas de até 2,5 m; avanço do mar sobre calçadões e ressaca costeira.",
            "acoes": "Bandeiramento vermelho nas praias, interdição preventiva de orla rochosa e fiscalização de proibição da navegação artesanal."
        },
        {
            "setor": "Cidade Praiana, Parque Mariléa, Beira Mar e Jardim Mariléa",
            "risco_sab": "MÁXIMO",
            "risco_dom": "ATENÇÃO",
            "risco_seg": "OBSERVAÇÃO",
            "impactos": "Acumulados superando 100 mm sobre lençol freático superficial; alagamento generalizado de vias sem pavimento e bacias de retenção cheias.",
            "acoes": "Operação contínua de caminhões vac-all e motobombas nos pontos críticos de drenagem da Rodovia Amaral Peixoto (RJ-106)."
        },
        {
            "setor": "Bosque, Extensão do Bosque, Nova Aliança e Centro",
            "risco_sab": "ALERTA",
            "risco_dom": "ATENÇÃO",
            "risco_seg": "OBSERVAÇÃO",
            "impactos": "Lâmina d'água em vias comerciais, refluxo no canal central da Praça da Baleia e balneabilidade imprópria no Centro (RO0002) e Boca da Barra.",
            "acoes": "Desobstrução de grelhas pluviais, sinalização de interdição para banhistas e remoção preventiva de galhos com risco sobre fiação."
        },
        {
            "setor": "Cantagalo, Rocha Leão, Califórnia e Região Rural",
            "risco_sab": "MÁXIMO",
            "risco_dom": "ALERTA",
            "risco_seg": "ATENÇÃO",
            "impactos": "Rocha Leão acumulou 124,7 mm. Saturação crítica das encostas com risco geológico remanescente (CEMADEN) de deslizamento de taludes em estradas.",
            "acoes": "Patrulha rural mecanizada com retroescavadeira em prontidão para desobstrução de acessos vicinais e vistorias de taludes suscetíveis."
        }
    ]

    glossario = [
        { "termo": "Frente Semi-Estacionária", "def": "Bloqueio que retém faixas de chuva sobre a mesma região por dias consecutivos." },
        { "termo": "Cota de Transbordo", "def": "Nível da calha em que o rio extravasa (2,20 m no Jundiá; nível atingiu 2,40 m)." },
        { "termo": "Aviso nº 733/2026 (CHM)", "def": "Alerta de vento forte Força 7 (50 a 61 km/h) na Área Delta válido até 05/10 09h." },
        { "termo": "Risco Hidrológico Muito Alto", "def": "Solo 100% saturado com extravasamento da rede de drenagem e cheia do Jundiá." },
        { "termo": "Risco Geológico Remanescente", "def": "Solo encharcado (>120 mm) com potencial de deslizamento residual (CEMADEN)." },
        { "termo": "Convecção Térmica Pré-Frontal", "def": "Pancadas de chuva isoladas com trovoadas impulsionadas pelo forte aquecimento diurno." }
    ]

    avisos_oficiais = {
        "marinha": {
            "titulo": "Marinha do Brasil — Avisos Oficiais Vigentes",
            "itens": [
                "Aviso nº 733/2026 (Área Delta - inclui Rio das Ostras): Vento Forte de E/NE Força 7 Beaufort (50 a 61 km/h em alto-mar e rajadas de até 47 km/h na costa), válido de 03/10 21h até 05/10 09h.",
                "Aviso nº 728/2026 (Área Charlie): Vento Forte até 04/10 15h.",
                "Restrições Marítimas: Proibição de navegação para embarcações de pequeno porte, suspensão da pesca artesanal e bandeiramento vermelho em todas as praias da orla municipal."
            ]
        },
        "inmet_inea_cemaden": {
            "titulo": "INMET, INEA e CEMADEN — Alertas Oficiais Vigentes",
            "itens": [
                "Alerta Máximo Hidrológico (INEA/CEMADEN): Estação Jundiá atingiu 2,40 m às 16:45h (cota transbordo: 2,20 m). Rio estabilizando com vazante lenta.",
                "Alertas INMET (Laranja/Amarelo): Chuvas intensas e declínio térmico acentuado.",
                "CEMADEN: Risco Geológico Moderado Remanescente devido ao solo saturado por mais de 120 mm em 24h em Casimiro, Rocha Leão e Palmital.",
                "Balneabilidade INEA nº 20: Praias Impróprias: Centro (RO0002), Boca da Barra e Lagoa de Iriri. Evitar banho nas primeiras horas pós-chuva."
            ]
        }
    }

    return {
        "municipio": "Rio das Ostras - RJ",
        "periodo": periodo,
        "emissao": emissao,
        "informe_alerta": informe_alerta,
        "sinopse_geral": sinopse,
        "glossario": glossario,
        "dias_resumo": dias_resumo,
        "impactos_bairros": impactos_bairros,
        "avisos_oficiais": avisos_oficiais,
        "contatos_emergencia": {
            "defesa_civil_plantao": "199",
            "bombeiros": "193",
            "telefone_geral": "(22) 2760-8360",
            "whatsapp_emergencia": "(22) 99245-5678"
        }
    }

if __name__ == "__main__":
    sync_bulletin()
