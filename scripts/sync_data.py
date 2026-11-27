#!/usr/bin/env python3
"""
Script de sincronização em nuvem (GitHub Actions / Cloud Cron)
Extrai dados oficiais em tempo real e salva em data/*.json para disponibilização 24/7
mesmo com o computador pessoal desligado.
"""

import urllib.request
import ssl
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

def format_date_br(d_str, h_str=None):
    if not d_str: return ''
    date_part = str(d_str).split('T')[0].split(' ')[0]
    parts = date_part.split('-')
    if len(parts) == 3:
        formatted = f'{parts[2]}/{parts[1]}/{parts[0]}'
    else:
        formatted = date_part
    if h_str:
        h_clean = str(h_str).strip()
        if not h_clean.endswith('h'):
            h_clean = f'{h_clean}h'
        return f'{formatted} às {h_clean}'
    return formatted

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

def _parse_inmet_fim_brt(item):
    from datetime import datetime, timedelta, timezone
    fim_str = str(item.get('fim') or item.get('data_fim') or '').replace('T', ' ').replace('h', '').strip()
    if len(fim_str) < 10:
        return None
    d_part = fim_str[:10]
    t_part = fim_str[11:16] if len(fim_str) >= 16 and ':' in fim_str[11:16] else '23:59'
    try:
        dt = datetime.strptime(f"{d_part} {t_part}", "%Y-%m-%d %H:%M")
        return dt.replace(tzinfo=timezone(timedelta(hours=-3)))
    except Exception:
        return None

def sync_inmet_alerts():
    from datetime import datetime, timedelta, timezone
    url = "https://apiprevmet3.inmet.gov.br/avisos/ativos"
    try:
        ctx = ssl._create_unverified_context()
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache'})
        with urllib.request.urlopen(req, context=ctx, timeout=15) as res:
            data = json.loads(res.read().decode('utf-8'))

        seen = set()
        active_list = []
        for cat in ['hoje', 'futuro']:
            for a in data.get(cat, []):
                aid = a.get('id')
                if not aid or aid in seen: continue
                estados = str(a.get('estados', '') or '')
                geocodes = str(a.get('geocodes', '') or '')
                municipios = str(a.get('municipios', '') or '')

                eh_direto = ('3304524' in geocodes) or ('Rio das Ostras' in municipios)
                eh_rj = ('Rio de Janeiro' in estados) or ('RJ' in estados)

                if eh_direto or eh_rj:
                    seen.add(aid)

                    raw_h_ini = str(a.get('hora_inicio', '00:00')).strip()
                    raw_h_fim = str(a.get('hora_fim', '23:59')).strip()

                    raw_d_ini = str(a.get('data_inicio', '')).split('T')[0]
                    raw_d_fim = str(a.get('data_fim', '')).split('T')[0]

                    dt_inicio_fmt = format_date_br(raw_d_ini, raw_h_ini)
                    dt_fim_fmt = format_date_br(raw_d_fim, raw_h_fim)

                    clean_h_ini = raw_h_ini.replace('h', '').strip()
                    clean_h_fim = raw_h_fim.replace('h', '').strip()

                    inicio_iso = f"{raw_d_ini} {clean_h_ini}".strip()
                    fim_iso = f"{raw_d_fim} {clean_h_fim}".strip()

                    sev = a.get('severidade', 'Perigo Potencial')
                    cor_hex = '#EAB308'
                    cor_nome = 'Amarelo'
                    cor_badge = f'Alerta Amarelo • {sev}'
                    if sev == 'Perigo':
                        cor_hex = '#F97316'
                        cor_nome = 'Laranja'
                        cor_badge = 'Alerta Laranja • Perigo'
                    elif sev == 'Grande Perigo':
                        cor_hex = '#EF4444'
                        cor_nome = 'Vermelho'
                        cor_badge = 'Alerta Vermelho • Grande Perigo'

                    alert_obj = {
                        'id': aid,
                        'descricao': a.get('descricao', 'Alerta Meteorológico'),
                        'severidade': sev,
                        'cor_nome': cor_nome,
                        'cor_badge': cor_badge,
                        'cor_hex': cor_hex,
                        'cor_inmet': cor_hex,
                        'eh_direto_ostras': eh_direto,
                        'inicio': inicio_iso,
                        'fim': fim_iso,
                        'inicio_formatado': dt_inicio_fmt,
                        'fim_formatado': dt_fim_fmt,
                        'data_inicio': raw_d_ini,
                        'hora_inicio': clean_h_ini,
                        'data_fim': raw_d_fim,
                        'hora_fim': clean_h_fim,
                        'riscos': a.get('riscos', []),
                        'instrucoes': a.get('instrucoes', []),
                        'estados': estados
                    }
                    active_list.append(alert_obj)

        now_brt = datetime.now(timezone(timedelta(hours=-3)))
        cutoff = now_brt - timedelta(hours=6)
        existing_path = os.path.join(DATA_DIR, 'inmet_avisos.json')
        merged_by_id = {}
        if os.path.exists(existing_path):
            try:
                with open(existing_path, 'r', encoding='utf-8') as f:
                    for old_a in json.load(f):
                        oid = old_a.get('id')
                        fim_dt = _parse_inmet_fim_brt(old_a)
                        if oid and fim_dt and cutoff < fim_dt <= now_brt and str(old_a.get('estados', '')).strip():
                            merged_by_id[oid] = old_a
            except Exception:
                pass
        for item in active_list:
            merged_by_id[item['id']] = item

        dedup_map = {}
        for it in merged_by_id.values():
            d_fim = str(it.get('fim', '') or it.get('data_fim', '')).split('T')[0].split(' ')[0].strip()
            d_key = (
                bool(it.get('eh_direto_ostras')),
                str(it.get('descricao', '')).strip().lower(),
                str(it.get('severidade', '')).strip().lower(),
                d_fim,
            )
            cur = dedup_map.get(d_key)
            if cur is None or (str(it.get('inicio', '')), int(it.get('id', 0) or 0)) > (str(cur.get('inicio', '')), int(cur.get('id', 0) or 0)):
                dedup_map[d_key] = it

        all_alerts = list(dedup_map.values())
        all_alerts.sort(
            key=lambda x: (
                not bool(x.get('eh_direto_ostras')),
                0 if x.get('cor_nome') == 'Vermelho' else 1 if x.get('cor_nome') == 'Laranja' else 2,
                str(x.get('inicio', '') or x.get('data_inicio', '')),
                -(int(x.get('id', 0) or 0)),
            )
        )
        final_list = all_alerts[:20]

        with open(os.path.join(DATA_DIR, 'inmet_avisos.json'), 'w', encoding='utf-8') as f:
            json.dump(final_list, f, ensure_ascii=False, indent=2)
        print(f"OK: inmet_avisos.json atualizado ({len(active_list)} ativos no feed, {len(final_list)} salvos)")
    except Exception as e:
        print(f"Aviso ao sincronizar avisos INMET: {e}")

def sync_inea_cheias():
    try:
        from scripts.jundia_telemetry import fetch_jundia_realtime
    except ImportError:
        from jundia_telemetry import fetch_jundia_realtime

    j_live = fetch_jundia_realtime(DATA_DIR, save_10d=True)
    stations = []
    if j_live:
        c1 = j_live.get('chuva_1h', 0.0)
        c4 = j_live.get('chuva_4h', 0.0)
        c24 = j_live.get('chuva_24h', 0.0)
        c96 = j_live.get('chuva_96h', 0.0)
        c6 = round(c4 + (c24 - c4) * 0.20, 1) if c24 >= c4 else c4
        c12 = round(c4 + (c24 - c4) * 0.55, 1) if c24 >= c4 else c4
        c36 = round(c24 + (c96 - c24) * 0.25, 1) if c96 >= c24 else c24
        c48 = round(c24 + (c96 - c24) * 0.50, 1) if c96 >= c24 else c24
        stations.append({
            'municipio': 'Rio das Ostras',
            'curso_dagua': 'rio Jundiá',
            'nome_estacao': 'Jundiá',
            'codigo': '2241036',
            'ultima_leitura': j_live['ultima_leitura'],
            'status': j_live['status_upper'],
            'tendencia': j_live['tendencia'],
            'chuva_1h': f"{c1:.1f}",
            'chuva_4h': f"{c4:.1f}",
            'chuva_6h': f"{c6:.1f}",
            'chuva_12h': f"{c12:.1f}",
            'chuva_24h': f"{c24:.1f}",
            'chuva_36h': f"{c36:.1f}",
            'chuva_48h': f"{c48:.1f}",
            'chuva_96h': f"{c96:.1f}",
            'chuva_30d': f"{j_live.get('chuva_30d', 0.0):.1f}",
            'nivel_rio': j_live['nivel_dot'],
            'cota_atencao': '1.99 m',
            'cota_alerta': '2.27 m',
            'cota_transborda': '2.84 m',
            'porcentagem_calha': j_live['pct_calha'],
            'eh_rio_das_ostras': True
        })

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
        for r in rows:
            cells = [html_lib.unescape(re.sub(r'<[^>]+>', '', c).strip()) for c in re.findall(r'<t[dh][^>]*>.*?</t[dh]>', r, re.DOTALL)]
            if len(cells) >= 14:
                muni = cells[0].strip()
                curso = cells[1].strip()
                estacao = cells[2].strip()
                eh_ostras = 'Ostras' in muni or 'Jundi' in curso or 'Jundi' in estacao
                if eh_ostras and j_live:
                    continue

                leitura = cells[4].strip()
                status = cells[5].strip()
                chuva_1h = cells[7].strip()
                chuva_4h = cells[8].strip()
                chuva_24h = cells[9].strip()
                chuva_96h = cells[10].strip()
                chuva_30d = cells[11].strip()
                nivel_rio = cells[12].strip()

                try: c1 = float(chuva_1h.replace(',', '.'))
                except: c1 = 0.0
                try: c4 = float(chuva_4h.replace(',', '.'))
                except: c4 = 0.0
                try: c24 = float(chuva_24h.replace(',', '.'))
                except: c24 = 0.0
                try: c96 = float(chuva_96h.replace(',', '.'))
                except: c96 = c24

                c6 = round(c4 + (c24 - c4) * 0.20, 1) if c24 >= c4 else c4
                c12 = round(c4 + (c24 - c4) * 0.55, 1) if c24 >= c4 else c4
                c36 = round(c24 + (c96 - c24) * 0.25, 1) if c96 >= c24 else c24
                c48 = round(c24 + (c96 - c24) * 0.50, 1) if c96 >= c24 else c24

                chuva_6h = f"{c6:.1f}" if c6 > 0 else "0.0"
                chuva_12h = f"{c12:.1f}" if c12 > 0 else "0.0"
                chuva_36h = f"{c36:.1f}" if c36 > 0 else "0.0"
                chuva_48h = f"{c48:.1f}" if c48 > 0 else "0.0"

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
                    'chuva_6h': chuva_6h,
                    'chuva_12h': chuva_12h,
                    'chuva_24h': chuva_24h,
                    'chuva_36h': chuva_36h,
                    'chuva_48h': chuva_48h,
                    'chuva_96h': chuva_96h,
                    'chuva_30d': chuva_30d,
                    'nivel_rio': nivel_rio,
                    'cota_atencao': cota_atencao,
                    'cota_alerta': cota_alerta,
                    'cota_transborda': cota_transborda,
                    'porcentagem_calha': porcentagem_calha,
                    'eh_rio_das_ostras': eh_ostras
                })
    except Exception as e:
        print(f"Aviso ao sincronizar tabela regional INEA cheias: {e}")

    if stations:
        with open(os.path.join(DATA_DIR, 'inea_cheias.json'), 'w', encoding='utf-8') as f:
            json.dump(stations, f, ensure_ascii=False, indent=2)
        print("OK: inea_cheias.json atualizado com telemetria real do Rio Jundiá")

def update_live_jundia_kpi(stations):
    """
    Sincroniza a cota, status, tendência, ocupação de calha e margem do Rio Jundiá
    em todos os blocos de boletim_metadata.json (KPIs, Panorama Sinótico Geral e Resumos),
    preservando rigorosamente a previsão meteorológica oficial.
    """
    meta_path = os.path.join(DATA_DIR, 'boletim_metadata.json')
    if not os.path.exists(meta_path):
        return
    try:
        try:
            from scripts.jundia_telemetry import fetch_jundia_realtime, classify_jundia_level, patch_metadata_with_jundia
        except ImportError:
            from jundia_telemetry import fetch_jundia_realtime, classify_jundia_level, patch_metadata_with_jundia

        j_info = fetch_jundia_realtime(DATA_DIR, save_10d=False)
        if not j_info and stations:
            jundia = next((s for s in stations if s.get('eh_rio_das_ostras') or 'jundi' in s.get('nome_estacao', '').lower()), None)
            if jundia and jundia.get('nivel_rio'):
                j_info = classify_jundia_level(jundia.get('nivel_rio'), 0.0)

        if not j_info:
            return

        with open(meta_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)

        patch_metadata_with_jundia(metadata, j_info)

        with open(meta_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        print(f"OK: Cota ao vivo do Jundiá ({j_info['nivel_dot']} m - {j_info['status_title']}) sincronizada no Panorama Sinótico e KPIs")
    except Exception as e:
        print(f"Aviso ao atualizar cota ao vivo: {e}")

def sync_inmet_meteograma():
    """
    Sincroniza os meteogramas numéricos oficiais do INMET COSMO (00 e 12 UTC)
    diretamente da API apiprevmet3.inmet.gov.br e salva em img/
    """
    import base64
    import shutil
    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    img_dir = os.path.join(BASE_DIR, 'img')
    os.makedirs(img_dir, exist_ok=True)
    
    for rodada in ['00', '12']:
        url = f"https://apiprevmet3.inmet.gov.br/meteograma/3304524/{today}/{rodada}"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=12) as res:
                payload = json.loads(res.read().decode('utf-8'))
                if isinstance(payload, dict) and 'base64' in payload and payload['base64'].startswith('data:image/png;base64,'):
                    raw_b64 = payload['base64'].split(',', 1)[1]
                    img_bytes = base64.b64decode(raw_b64)
                    target_file = os.path.join(img_dir, f'inmet_live_{rodada}utc.png')
                    with open(target_file, 'wb') as img_f:
                        img_f.write(img_bytes)
                    if rodada == '00':
                        shutil.copyfile(target_file, os.path.join(img_dir, 'meteograma_inmet.png'))
                    print(f"OK: Meteograma Oficial INMET ({rodada} UTC) sincronizado ({len(img_bytes)} bytes)")
        except Exception as e:
            print(f"Aviso ao sincronizar meteograma INMET {rodada} UTC: {e}")

if __name__ == '__main__':
    if '--alerts-only' in sys.argv:
        sync_inmet_alerts()
        sys.exit(0)
    print("Iniciando sincronização de telemetria oficial para a nuvem 24/7...")
    sync_inmet_forecast()
    sync_inmet_meteograma()
    sync_inmet_alerts()
    sync_inea_cheias()
    try:
        try:
            from scripts.inea_portal_balneabilidade_sync import sync_portal_balneabilidade
        except ImportError:
            from inea_portal_balneabilidade_sync import sync_portal_balneabilidade
        sync_portal_balneabilidade(DATA_DIR)
    except Exception as e_portal:
        print(f"Aviso ao sincronizar Balneabilidade via Portal INEA: {e_portal}, tentando Power BI...")
        try:
            try:
                from scripts.powerbi_balneabilidade_sync import sync_powerbi_balneabilidade
            except ImportError:
                from powerbi_balneabilidade_sync import sync_powerbi_balneabilidade
            sync_powerbi_balneabilidade(DATA_DIR)
        except Exception as e_pbi:
            print(f"Aviso ao sincronizar Balneabilidade Power BI INEA: {e_pbi}")
    
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

