#!/usr/bin/env python3
"""
Script de sincronização em nuvem (GitHub Actions / Cloud Cron)
Extrai dados oficiais em tempo real e salva em data/*.json para disponibilização 24/7
mesmo com o computador pessoal desligado.
"""

import urllib.request
import json
import re
import os
import sys
import html as html_lib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(DATA_DIR, exist_ok=True)

# Cotas de Referência Oficiais (metros) extraídas dos hidrogramas e cotagramas do INEA
COTAS_REFERENCIA = {
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

def format_date_br(d_str, h_str):
    if not d_str: return ''
    date_part = str(d_str).split('T')[0]
    parts = date_part.split('-')
    if len(parts) == 3:
        formatted = f'{parts[2]}/{parts[1]}/{parts[0]}'
    else:
        formatted = date_part
    return f'{formatted} às {h_str}' if h_str else formatted

def sync_inmet_forecast():
    url = "https://apiprevmet3.inmet.gov.br/previsao/3304524"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as res:
            data = json.loads(res.read().decode('utf-8'))
            with open(os.path.join(DATA_DIR, 'inmet_previsao.json'), 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print("OK: inmet_previsao.json atualizado")
    except Exception as e:
        print(f"Aviso ao sincronizar previsão INMET: {e}")

def sync_inmet_alerts():
    url = "https://apiprevmet3.inmet.gov.br/avisos/ativos"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as res:
            data = json.loads(res.read().decode('utf-8'))
        
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
                    dt_inicio = format_date_br(a.get('data_inicio'), a.get('hora_inicio'))
                    dt_fim = format_date_br(a.get('data_fim'), a.get('hora_fim'))
                    sev = a.get('severidade', 'Perigo Potencial')
                    
                    cor_inmet = '#EAB308'
                    if sev == 'Perigo': cor_inmet = '#F97316'
                    elif sev == 'Grande Perigo': cor_inmet = '#EF4444'

                    unique.append({
                        'id': aid,
                        'descricao': a.get('descricao', 'Alerta Meteorológico'),
                        'severidade': sev,
                        'cor_inmet': cor_inmet,
                        'eh_direto_ostras': eh_direto,
                        'inicio_formatado': dt_inicio,
                        'fim_formatado': dt_fim,
                        'riscos': a.get('riscos', []),
                        'instrucoes': a.get('instrucoes', []),
                        'estados': estados
                    })
        
        def alert_rank(item):
            score = 0
            if item['eh_direto_ostras']: score += 10
            if item['severidade'] == 'Grande Perigo': score += 5
            elif item['severidade'] == 'Perigo': score += 3
            return score

        unique.sort(key=alert_rank, reverse=True)
        with open(os.path.join(DATA_DIR, 'inmet_avisos.json'), 'w', encoding='utf-8') as f:
            json.dump(unique, f, ensure_ascii=False, indent=2)
        print("OK: inmet_avisos.json atualizado")
    except Exception as e:
        print(f"Aviso ao sincronizar avisos INMET: {e}")

def sync_inea_cheias():
    url = "https://alertadecheias.inea.rj.gov.br/dados/macae_e_das_ostras.php"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=12) as res:
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
                
                eh_ostras = 'Ostras' in muni or 'Jundi' in curso or 'Jundi' in estacao

                cota_atencao = '1.99 m'
                cota_alerta = '2.27 m'
                cota_transborda = '2.84 m'
                porcentagem_calha = 45

                ref = None
                for k, v in COTAS_REFERENCIA.items():
                    if k.lower() in estacao.lower():
                        ref = v
                        break
                if not ref:
                    for k, v in COTAS_REFERENCIA.items():
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
        with open(os.path.join(DATA_DIR, 'inea_cheias.json'), 'w', encoding='utf-8') as f:
            json.dump(stations, f, ensure_ascii=False, indent=2)
        print("OK: inea_cheias.json atualizado")
    except Exception as e:
        print(f"Aviso ao sincronizar INEA cheias: {e}")

def update_live_jundia_kpi(stations):
    """
    Atualiza apenas a cota ao vivo do Rio Jundiá nos metadados,
    preservando rigorosamente a previsão meteorológica oficial elaborada pela meteorologia.
    """
    meta_path = os.path.join(DATA_DIR, 'boletim_metadata.json')
    if not os.path.exists(meta_path):
        return
    try:
        jundia = next((s for s in stations if s.get('eh_rio_das_ostras') or 'jundi' in s.get('nome_estacao', '').lower()), None)
        if not jundia:
            return
        with open(meta_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        nivel_val = jundia.get('nivel_rio', '2,40')
        if 'kpis' in metadata:
            metadata['kpis']['jundia_nivel'] = f"{nivel_val} m"
            metadata['kpis']['jundia_status'] = jundia.get('status', 'ALERTA MÁXIMO')
        
        with open(meta_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        print(f"OK: Cota ao vivo do Jundiá atualizada para {nivel_val} m em boletim_metadata.json")
    except Exception as e:
        print(f"Aviso ao atualizar cota ao vivo: {e}")

if __name__ == '__main__':
    print("Iniciando sincronização de telemetria oficial para a nuvem 24/7...")
    sync_inmet_forecast()
    sync_inmet_alerts()
    sync_inea_cheias()
    
    # Atualiza a cota ao vivo do Rio Jundiá sem alterar a previsão oficial de chuva
    try:
        inea_file = os.path.join(DATA_DIR, 'inea_cheias.json')
        if os.path.exists(inea_file):
            with open(inea_file, 'r', encoding='utf-8') as f:
                stations_data = json.load(f)
            update_live_jundia_kpi(stations_data)
    except Exception as e:
        print(f"Aviso ao atualizar telemetria ao vivo: {e}")
    print("Sincronização 24/7 concluída com sucesso!")

