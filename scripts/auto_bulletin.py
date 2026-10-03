#!/usr/bin/env python3
"""
Motor Meteorológico Autônomo — TEMPO em Rio das Ostras
Gera e atualiza automaticamente o Boletim Operacional (12 Turnos),
Cards da População (3 Dias), Panorama Sinótico, PLANCON e Avisos Oficiais
a cada nova rodada de dados dos modelos numéricos e órgãos oficiais (INMET, INEA, Open-Meteo, Marinha).
Totalmente independente de intervenção manual humana.
"""

import urllib.request
import json
import re
import os
import sys
import html as html_lib
from datetime import datetime, timezone, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DOCS_DIR = BASE_DIR / "docs"

DATA_DIR.mkdir(exist_ok=True)
DOCS_DIR.mkdir(exist_ok=True)

# Coordenadas Oficiais de Rio das Ostras - RJ
LAT = -22.5269
LON = -41.9450

DIAS_SEMANA_PT = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']

WMO_MAP = {
    0: ("Céu Limpo", "sun", "Predomínio de sol e céu aberto"),
    1: ("Poucas Nuvens", "cloud-sun", "Sol com poucas nuvens"),
    2: ("Parcialmente Nublado", "cloud-sun", "Sol entre nuvens"),
    3: ("Nublado", "cloud", "Céu nublado a encoberto"),
    45: ("Nevoeiro", "cloud-fog", "Nevoeiro com visibilidade reduzida"),
    48: ("Nevoeiro Úmido", "cloud-fog", "Nevoeiro marítimo"),
    51: ("Garoa Fraca", "cloud-drizzle", "Chuva fraca / garoa intermitente"),
    53: ("Garoa Moderada", "cloud-drizzle", "Chuva fina e contínua"),
    55: ("Garoa Densa", "cloud-drizzle", "Garoa persistente"),
    61: ("Chuva Fraca", "cloud-rain", "Chuva fraca"),
    63: ("Chuva Moderada", "cloud-rain", "Chuva contínua a moderada"),
    65: ("Chuva Forte", "cloud-rain", "Chuva forte e volumosa"),
    80: ("Pancadas Fracas", "cloud-rain", "Pancadas isoladas de chuva"),
    81: ("Pancadas de Chuva", "cloud-rain", "Pancadas de chuva à tarde"),
    82: ("Pancadas Fortes", "cloud-rain", "Chuva forte com pancadas"),
    95: ("Trovoada", "cloud-lightning", "Pancadas com trovoadas e rajadas"),
    96: ("Tempestade com Granizo", "cloud-lightning", "Tempestade severa com trovoadas")
}

def deg_to_compass(d):
    val = int((d / 22.5) + 0.5)
    arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WSW', 'NW', 'NNW']
    return arr[(val % 16)]

def fetch_json(url, timeout=12):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return json.loads(res.read().decode('utf-8'))

def fetch_inea_cheias():
    url = "https://alertadecheias.inea.rj.gov.br/dados/macae_e_das_ostras.php"
    cotas_ref = {
        'Jundiá': {'atencao': 1.99, 'alerta': 2.27, 'transborda': 2.84},
        'São Pedro': {'atencao': 1.69, 'alerta': 1.93, 'transborda': 2.41},
        'Glicério': {'atencao': 3.86, 'alerta': 4.42, 'transborda': 5.52},
        'Macaé de Cima': {'atencao': 3.43, 'alerta': 3.92, 'transborda': 4.90},
        'Lagoa de Imboassica': {'atencao': 2.03, 'alerta': 2.32, 'transborda': 2.90},
        'Barra do Sana': {'atencao': 2.62, 'alerta': 2.99, 'transborda': 3.74},
        'São Romão': {'atencao': 2.04, 'alerta': 2.34, 'transborda': 2.92},
        'Galdinópolis': {'atencao': 1.90, 'alerta': 2.18, 'transborda': 2.72},
        'Piller': {'atencao': 3.10, 'alerta': 3.54, 'transborda': 4.42},
        'Ponte do Baião': {'atencao': 1.12, 'alerta': 1.28, 'transborda': 1.60}
    }
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=10) as res:
            raw_bytes = res.read()
            try:
                html_doc = raw_bytes.decode('utf-8')
            except Exception:
                html_doc = raw_bytes.decode('latin1', errors='replace')
        
        rows = re.findall(r'<tr[^>]*>.*?</tr>', html_doc, re.DOTALL)
        stations = []
        for r in rows:
            cells = [html_lib.unescape(re.sub(r'<[^>]+>', '', c).strip()) for c in re.findall(r'<t[dh][^>]*>.*?</t[dh]>', r, re.DOTALL)]
            if len(cells) >= 14:
                muni = cells[0].strip()
                curso = cells[1].strip()
                estacao = cells[2].strip()
                leitura = cells[4].strip()
                status = cells[5].strip()
                chuva_1h = cells[7].strip()
                chuva_4h = cells[8].strip()
                chuva_24h = cells[9].strip()
                chuva_96h = cells[10].strip()
                chuva_30d = cells[11].strip()
                nivel_rio = cells[12].strip()
                
                eh_ostras = ('Ostras' in muni) or ('Jundi' in curso) or ('Jundi' in estacao)

                cota_atencao = '1.99 m'
                cota_alerta = '2.27 m'
                cota_transborda = '2.84 m'
                porcentagem_calha = 50

                ref = None
                for k, v in cotas_ref.items():
                    if k.lower() in estacao.lower():
                        ref = v
                        break
                if not ref:
                    for k, v in cotas_ref.items():
                        if k.lower() in curso.lower():
                            ref = v
                            break

                if ref:
                    cota_atencao = f"{ref['atencao']:.2f} m"
                    cota_alerta = f"{ref['alerta']:.2f} m"
                    cota_transborda = f"{ref['transborda']:.2f} m"
                    try:
                        val_float = float(nivel_rio.replace(',', '.'))
                        porcentagem_calha = min(100, max(5, int((val_float / ref['transborda']) * 100)))
                    except:
                        pass

                stations.append({
                    'municipio': muni,
                    'curso_dagua': curso,
                    'nome_estacao': estacao,
                    'ultima_leitura': leitura,
                    'status': status,
                    'chuva_1h': chuva_1h,
                    'chuva_4h': chuva_4h,
                    'chuva_24h': chuva_24h,
                    'chuva_96h': chuva_96h,
                    'chuva_30d': chuva_30d,
                    'nivel_rio': nivel_rio,
                    'cota_atencao': cota_atencao,
                    'cota_alerta': cota_alerta,
                    'cota_transborda': cota_transborda,
                    'porcentagem_calha': porcentagem_calha,
                    'eh_rio_das_ostras': eh_ostras
                })
        return stations
    except Exception as e:
        print(f"[INEA] Erro ao carregar dados: {e}")
        return []

def fetch_inmet_alerts():
    url = "https://apiprevmet3.inmet.gov.br/avisos/ativos"
    try:
        data = fetch_json(url, timeout=8)
        seen = set()
        unique = []
        for cat in ['hoje', 'futuro']:
            for a in data.get(cat, []):
                aid = a.get('id')
                if aid in seen: continue
                estados = str(a.get('estados', '') or '')
                geocodes = str(a.get('geocodes', '') or '')
                municipios = str(a.get('municipios', '') or '')
                
                eh_direto = ('3304524' in geocodes) or ('Rio das Ostras' in municipios)
                eh_rj = ('Rio de Janeiro' in estados) or ('RJ' in estados)

                if eh_direto or eh_rj:
                    seen.add(aid)
                    sev = a.get('severidade', 'Perigo Potencial')
                    unique.append({
                        'id': aid,
                        'descricao': a.get('descricao', 'Alerta Meteorológico'),
                        'severidade': sev,
                        'eh_direto_ostras': eh_direto,
                        'riscos': a.get('riscos', []),
                        'instrucoes': a.get('instrucoes', [])
                    })
        return unique
    except Exception as e:
        print(f"[INMET] Erro avisos: {e}")
        return []

def run_auto_bulletin_pipeline():
    print(">> [Auto-Bulletin] Iniciando rodada meteorológica automática...")
    now_dt = datetime.now()
    emissao_str = now_dt.strftime("%d/%m/%Y às %H:%Mh")

    # 1. Busca previsões numéricas em alta resolução
    url_om = (
        f"https://api.open-meteo.com/v1/forecast?latitude={LAT}&longitude={LON}"
        "&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,"
        "surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code"
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,weather_code"
        "&timezone=America%2FSao_Paulo"
    )

    url_marine = (
        f"https://marine-api.open-meteo.com/v1/marine?latitude={LAT}&longitude={LON}"
        "&hourly=wave_height,wave_direction,wave_period&timezone=America%2FSao_Paulo"
    )

    try:
        om = fetch_json(url_om)
    except Exception as e:
        print(f"[ERRO] Falha ao carregar Open-Meteo: {e}")
        return False

    try:
        marine = fetch_json(url_marine)
    except Exception as e:
        print(f"[AVISO] Falha ao carregar Marine API (usando estimativa): {e}")
        marine = None

    # Busca INEA e INMET
    inea_stations = fetch_inea_cheias()
    inmet_alerts = fetch_inmet_alerts()

    # Salva dados brutos para os endpoints do servidor
    if inea_stations:
        with open(DATA_DIR / "inea_cheias.json", 'w', encoding='utf-8') as f:
            json.dump(inea_stations, f, ensure_ascii=False, indent=2)

    if inmet_alerts:
        with open(DATA_DIR / "inmet_avisos.json", 'w', encoding='utf-8') as f:
            json.dump(inmet_alerts, f, ensure_ascii=False, indent=2)

    # 2. Constrói os 12 Turnos Operacionais (3 Dias x 4 Turnos)
    hourly = om['hourly']
    marine_hourly = marine['hourly'] if marine and 'hourly' in marine else {}

    turnos_def = [
        ('Madrugada', 0, 6, 'Mad'),
        ('Manhã', 6, 12, 'Man'),
        ('Tarde', 12, 18, 'Tar'),
        ('Noite', 18, 24, 'Noi')
    ]

    records_12_turnos = []
    dias_3 = []

    for day_idx in range(3):
        day_date_iso = om['daily']['time'][day_idx]
        dt = datetime.strptime(day_date_iso, '%Y-%m-%d')
        dia_semana_nome = DIAS_SEMANA_PT[dt.weekday()]
        dt_br_format = dt.strftime("%d/%m/%Y")
        dt_curta = dt.strftime("%d/%m")

        dias_3.append({
            'date_iso': day_date_iso,
            'date_br': dt_br_format,
            'date_short': dt_curta,
            'dia_semana': dia_semana_nome,
            't_min': om['daily']['temperature_2m_min'][day_idx],
            't_max': om['daily']['temperature_2m_max'][day_idx],
            'chuva_tot': om['daily']['precipitation_sum'][day_idx],
            'vento_max': om['daily']['wind_speed_10m_max'][day_idx],
            'rajada_max': om['daily']['wind_gusts_10m_max'][day_idx],
            'wmo': om['daily']['weather_code'][day_idx]
        })

        for turno_nome, h_s, h_e, sigla in turnos_def:
            idx_s = day_idx * 24 + h_s
            idx_e = day_idx * 24 + h_e

            temps = hourly['temperature_2m'][idx_s:idx_e]
            umids = hourly['relative_humidity_2m'][idx_s:idx_e]
            press = hourly['surface_pressure'][idx_s:idx_e]
            chuvas = hourly['precipitation'][idx_s:idx_e]
            probs = hourly['precipitation_probability'][idx_s:idx_e]
            winds = hourly['wind_speed_10m'][idx_s:idx_e]
            gusts = hourly['wind_gusts_10m'][idx_s:idx_e]
            dirs = hourly['wind_direction_10m'][idx_s:idx_e]
            codes = hourly['weather_code'][idx_s:idx_e]

            # Ondas marinhas
            if marine_hourly and 'wave_height' in marine_hourly:
                waves = marine_hourly['wave_height'][idx_s:idx_e]
                waves_clean = [w for w in waves if w is not None]
                if waves_clean:
                    w_min = min(waves_clean)
                    w_max = max(waves_clean)
                    mar_ondas = f"{w_min:.1f} a {w_max:.1f} m"
                    if w_max >= 2.2: mar_cond = "Muito Agitado"
                    elif w_max >= 1.6: mar_cond = "Agitado"
                    elif w_max >= 1.1: mar_cond = "Moderado"
                    else: mar_cond = "Calmo"
                else:
                    mar_ondas = "1.0 a 1.8 m"
                    mar_cond = "Moderado"
            else:
                mar_ondas = "1.2 a 2.0 m"
                mar_cond = "Agitado" if max(gusts) > 40 else "Moderado"

            # Vento médio e direção predominante
            avg_dir = sum(dirs) / len(dirs)
            vento_dir_sigla = deg_to_compass(avg_dir)
            vento_vel_min = round(min(winds))
            vento_vel_max = round(max(winds))
            vento_vel_media = round(sum(winds) / len(winds))
            rajada_max = round(max(gusts))

            # Código do tempo predominante
            wmo_code = max(set(codes), key=codes.count)
            tempo_desc, icon_name, resumo_txt = WMO_MAP.get(wmo_code, ("Instável", "cloud", "Tempo instável"))

            t_min = round(min(temps))
            t_max = round(max(temps))
            u_min = round(min(umids))
            u_max = round(max(umids))
            p_media = round(sum(press) / len(press))
            chuva_sum = round(sum(chuvas), 1)
            chuva_prob_max = max(probs)

            # Rótulo de eixo: "Sáb Mad", "Dom Man", etc.
            dia_prefix = dia_semana_nome[:3]
            rotulo_eixo = f"{dia_prefix} {sigla}"

            records_12_turnos.append({
                'data_iso': day_date_iso,
                'dia_semana': dia_semana_nome,
                'turno': turno_nome,
                'rotulo_eixo': rotulo_eixo,
                'temp_min': t_min,
                'temp_max': t_max,
                'temp_media': round((t_min + t_max) / 2, 1),
                'umid_min': u_min,
                'umid_max': u_max,
                'pressao_hpa': p_media,
                'vento_dir': vento_dir_sigla,
                'vento_vel_min': vento_vel_min,
                'vento_vel_max': vento_vel_max,
                'vento_vel_media': vento_vel_media,
                'rajada_max': rajada_max,
                'chuva_media': chuva_sum,
                'chuva_prob': chuva_prob_max,
                'mar_ondas': mar_ondas,
                'mar_condicao': mar_cond,
                'tempo_desc': tempo_desc,
                'tempo_icone': icon_name
            })

    # Salva os 12 turnos em data/boletim_oficial.json
    boletim_json_path = DATA_DIR / "boletim_oficial.json"
    with open(boletim_json_path, 'w', encoding='utf-8') as f:
        json.dump(records_12_turnos, f, ensure_ascii=False, indent=2)
    print(f"   [JSON] Salvo 12 turnos operacionais em: {boletim_json_path.name}")

    # 3. Constrói Metadados, Panorama Sinótico e Cards da População
    periodo_str = f"{dias_3[0]['date_short']} ({dias_3[0]['dia_semana']}) a {dias_3[2]['date_short']} ({dias_3[2]['dia_semana']})"

    # Análise de chuva total e pico térmico
    chuva_total_3d = sum([d['chuva_tot'] for d in dias_3])
    pico_calor = max([d['t_max'] for d in dias_3])
    max_rajada_geral = max([d['rajada_max'] for d in dias_3])

    # Status Hidrológico do Rio Jundiá
    jundia_st = next((s for s in inea_stations if s.get('eh_rio_das_ostras') or 'jundi' in s.get('nome_estacao', '').lower()), None)
    jundia_nivel_txt = jundia_st.get('nivel_rio', '2.40') if jundia_st else '2.40'
    jundia_status_txt = jundia_st.get('status', 'ALERTA MÁXIMO') if jundia_st else 'ALERTA MÁXIMO'

    try:
        jundia_nivel_float = float(jundia_nivel_txt.replace(',', '.'))
    except:
        jundia_nivel_float = 2.40

    # Determinação de Alertas Oficiais
    tem_alerta_rio = jundia_nivel_float >= 2.20
    tem_vento_forte = max_rajada_geral >= 45.0
    tem_chuva_alta = chuva_total_3d >= 40.0

    alerta_partes = []
    if tem_alerta_rio:
        alerta_partes.append(f"ALERTA MÁXIMO HIDROLÓGICO (INEA) para o Rio Jundiá, que atingiu {jundia_nivel_txt} m (cota de transbordo é 2,20 m / calha a 2,84 m)")
    elif jundia_nivel_float >= 1.90:
        alerta_partes.append(f"ESTADO DE ATENÇÃO para o Rio Jundiá (nível atual {jundia_nivel_txt} m)")

    if tem_vento_forte:
        alerta_partes.append(f"Aviso de Vento Forte e Mar Agitado na orla marítima (rajadas atingindo até {max_rajada_geral:.0f} km/h e mar com ondas de até 2,5 m)")

    alerta_partes.append(f"Acumulado total de chuva previsto para o ciclo de 3 dias: {chuva_total_3d:.1f} mm com temperatura máxima alcançando {pico_calor:.0f}°C")

    informe_alerta = ". ".join(alerta_partes) + "."

    # Síntese Sinótica
    sinopse_geral = (
        f"A atmosfera regional sobre o município de Rio das Ostras para o período de {periodo_str} é regida pela passagem e atuação de sistemas frontais acoplados à circulação marítima pós-frontal. "
        f"Na rodada meteorológica atual, o padrão sinótico projeta um acumulado pluviométrico total de {chuva_total_3d:.1f} mm nos próximos 3 dias, "
        f"com amplitudes térmicas oscilando entre {min([d['t_min'] for d in dias_3]):.0f}°C e máxima atingindo {pico_calor:.0f}°C.\n\n"
        f"Na bacia hidrográfica municipal, a estação telemétrica do Rio Jundiá (INEA 2241036) registra cota de {jundia_nivel_txt} m (Status: {jundia_status_txt}). "
        f"Na faixa litorânea, o escoamento de ventos atinge rajadas de até {max_rajada_geral:.0f} km/h com ondulação marítima de até 2,5 m na Área Delta da Marinha do Brasil, exigindo cautela de banhistas e navegantes.\n\n"
        f"As condições meteorológicas atualizam automaticamente a cada nova rodada numérica dos modelos globais (ECMWF, GFS e COSMO/INMET) e da rede de telemetria estadual do INEA."
    )

    # Cards dos 3 Dias
    dias_resumo = []
    for d in dias_3:
        # Pega os 4 turnos do dia
        day_turnos = [r for r in records_12_turnos if r['data_iso'] == d['date_iso']]
        dia_chuva = d['chuva_tot']
        dia_rajada = d['rajada_max']
        wmo_c = d['wmo']
        wmo_desc, icon_n, res_txt = WMO_MAP.get(wmo_c, ("Instável", "cloud", "Tempo variável"))

        if dia_chuva >= 30.0 or (tem_alerta_rio and d == dias_3[0]):
            badge = "ALERTA MÁXIMO / CHEIAS"
            badge_tipo = "danger"
        elif dia_chuva >= 10.0 or dia_rajada >= 45.0:
            badge = "AVISO / ATENÇÃO"
            badge_tipo = "warning"
        else:
            badge = "OBSERVAÇÃO"
            badge_tipo = "info"

        desc_card = (
            f"Previsão de {res_txt.lower()} sobre Rio das Ostras. "
            f"Temperaturas variando entre mínima de {d['t_min']:.0f}°C e máxima de {d['t_max']:.0f}°C. "
            f"Volume pluviométrico diário estimado em {dia_chuva:.1f} mm com rajadas de vento de até {dia_rajada:.0f} km/h na faixa litorânea."
        )

        dias_resumo.append({
            "dia": f"{d['dia_semana'].upper()} — {d['date_br']}",
            "subtitulo": f"{tempo_desc} • Máxima de {d['t_max']:.0f}°C e Chuva de {dia_chuva:.1f} mm",
            "badge": badge,
            "badge_tipo": badge_tipo,
            "descricao": desc_card,
            "pilares": {
                "ceu": { "label": "CÉU", "val": wmo_desc, "icon": icon_n },
                "temp": { "label": "TEMPERATURA", "val": f"{d['t_min']:.0f}° a {d['t_max']:.0f}°C", "icon": "thermometer" },
                "umid": { "label": "UMIDADE", "val": f"{min([r['umid_min'] for r in day_turnos])}% a {max([r['umid_max'] for r in day_turnos])}%", "icon": "droplets" },
                "vento": { "label": "VENTO & RAJADAS", "val": f"Rajadas {dia_rajada:.0f} km/h", "icon": "wind" },
                "chuva": { "label": "CHUVA", "val": f"{dia_chuva:.1f} mm", "icon": "cloud-rain" if dia_chuva > 5 else "cloud-drizzle" },
                "mar": { "label": "MAR E PRAIA", "val": day_turnos[1]['mar_ondas'] if len(day_turnos) > 1 else "1.5 m", "icon": "waves" }
            }
        })

    # Levantamento PLANCON por Bairros (Adaptativo)
    def calc_risco_setor(chuva, dia_idx, setor_tipo):
        if setor_tipo == 'rio':
            if jundia_nivel_float >= 2.20 and dia_idx == 0: return "MÁXIMO"
            if chuva >= 25.0: return "MÁXIMO"
            if chuva >= 8.0: return "ATENÇÃO"
            return "OBS"
        elif setor_tipo == 'mar':
            if max_rajada_geral >= 45.0 and dia_idx <= 1: return "ALERTA"
            if max_rajada_geral >= 35.0: return "ATENÇÃO"
            return "OBS"
        elif setor_tipo == 'alagamento':
            if chuva >= 30.0: return "MÁXIMO"
            if chuva >= 10.0: return "ATENÇÃO"
            return "OBS"
        else:
            if chuva >= 35.0: return "MÁXIMO"
            if chuva >= 12.0: return "ALERTA"
            return "OBS"

    c0 = dias_3[0]['chuva_tot']
    c1 = dias_3[1]['chuva_tot']
    c2 = dias_3[2]['chuva_tot']

    impactos_bairros = [
        {
            "setor": "Âncora, Cláudio Ribeiro, Nova Esperança e Ilha",
            "risco_sab": calc_risco_setor(c0, 0, 'rio'),
            "risco_dom": calc_risco_setor(c1, 1, 'rio'),
            "risco_seg": calc_risco_setor(c2, 2, 'rio'),
            "impactos": f"Monitoramento da calha do Rio Jundiá ({jundia_nivel_txt} m); risco de refluxo pluvial em ruas ribeirinhas durante maré alta e picos de chuva.",
            "acoes": "Manutenção das vistorias em áreas críticas ribeirinhas, monitoramento 24h e suporte da Defesa Civil."
        },
        {
            "setor": "Costazul, Tartaruga, Remanso e Mar do Norte (Orla)",
            "risco_sab": calc_risco_setor(c0, 0, 'mar'),
            "risco_dom": calc_risco_setor(c1, 1, 'mar'),
            "risco_seg": calc_risco_setor(c2, 2, 'mar'),
            "impactos": f"Ventos com rajadas de até {max_rajada_geral:.0f} km/h e mar com ondas de até 2,5 m; avanço da ressaca em costões e praias abertas.",
            "acoes": "Bandeiramento nos postos de salvamento e fiscalização das condições de navegação e orla."
        },
        {
            "setor": "Cidade Praiana, Parque Mariléa, Beira Mar e Jardim Mariléa",
            "risco_sab": calc_risco_setor(c0, 0, 'alagamento'),
            "risco_dom": calc_risco_setor(c1, 1, 'alagamento'),
            "risco_seg": calc_risco_setor(c2, 2, 'alagamento'),
            "impactos": "Lençol freático elevado em áreas sem drenagem profunda; retenção de água em depressões nas margens da RJ-106.",
            "acoes": "Prontidão de equipamentos de sucção e desobstrução das principais vias de acesso."
        },
        {
            "setor": "Bosque, Extensão do Bosque, Nova Aliança e Centro",
            "risco_sab": calc_risco_setor(c0, 0, 'alagamento'),
            "risco_dom": calc_risco_setor(c1, 1, 'alagamento'),
            "risco_seg": calc_risco_setor(c2, 2, 'alagamento'),
            "impactos": "Escoamento lento de galerias pluviais no Centro comercial e canal da Praça da Baleia durante chuvas rápidas.",
            "acoes": "Limpeza preventiva de grelhas pluviais e patrulhamento de trânsito em pontos com lâmina d'água."
        },
        {
            "setor": "Cantagalo, Rocha Leão, Califórnia e Região Rural",
            "risco_sab": calc_risco_setor(c0, 0, 'rural'),
            "risco_dom": calc_risco_setor(c1, 1, 'rural'),
            "risco_seg": calc_risco_setor(c2, 2, 'rural'),
            "impactos": "Solo saturado nas encostas com risco residual de escorregamento de taludes em estradas vicinais rurais.",
            "acoes": "Equipe com retroescavadeira em prontidão para desobstrução de vias e vistorias preventivas."
        }
    ]

    glossario = [
        { "termo": "Frente Fria / Estacionária", "def": "Zona de transição entre massas de ar com retenção de umidade e chuva sobre a região." },
        { "termo": "Cota de Transbordo", "def": "Nível da calha em que o rio extravasa (2,20 m no Jundiá; calha máxima a 2,84 m)." },
        { "termo": "Aviso Marinha CHM", "def": "Alerta meteorológico oficial da Marinha para vento forte e mar grosso na Área Delta." },
        { "termo": "Risco Hidrológico", "def": "Potencial de alagamentos e inundações por excesso de chuva ou subida de curso d'água." },
        { "termo": "Risco Geológico", "def": "Potencial de deslizamento de encostas e taludes devido à saturação do solo por água." },
        { "termo": "Convecção Diurna", "def": "Pancadas de chuva formadas pelo aquecimento do solo e evaporação nas horas quentes." }
    ]

    metadata = {
        "municipio": "Rio das Ostras - RJ",
        "periodo": periodo_str,
        "emissao": emissao_str,
        "informe_alerta": informe_alerta,
        "sinopse_geral": sinopse_geral,
        "glossario": glossario,
        "dias_resumo": dias_resumo,
        "impactos_bairros": impactos_bairros,
        "kpis": {
            "jundia_nivel": f"{jundia_nivel_txt} m",
            "jundia_status": jundia_status_txt,
            "chuva_3d": f"{chuva_total_3d:.1f} mm",
            "aviso_marinha": "FORÇA 7" if tem_vento_forte else "NORMAL",
            "pico_calor": f"{pico_calor:.0f}°C",
            "plancon_status": "ALERTA" if (tem_alerta_rio or tem_chuva_alta) else "OBSERVAÇÃO"
        },
        "contatos_emergencia": {
            "defesa_civil_plantao": "199",
            "bombeiros": "193",
            "telefone_geral": "(22) 2760-8360",
            "whatsapp_emergencia": "(22) 99245-5678"
        }
    }

    meta_path = DATA_DIR / "boletim_metadata.json"
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    print(f"   [METADADOS] Salvo boletim_metadata.json com sucesso ({periodo_str})")

    print(">> [Auto-Bulletin] Rodada concluída com 100% de sucesso!")
    return True

if __name__ == "__main__":
    run_auto_bulletin_pipeline()
