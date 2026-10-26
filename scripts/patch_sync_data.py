with open('scripts/sync_data.py', 'r', encoding='utf-8') as f:
    text = f.read()

meteo_func = '''def sync_inmet_meteograma():
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

'''

pos = text.find('if __name__ == \'__main__\':')
if pos != -1 and 'def sync_inmet_meteograma' not in text:
    text = text[:pos] + meteo_func + text[pos:]
    text = text.replace('sync_inmet_forecast()', 'sync_inmet_forecast()\n    sync_inmet_meteograma()')
    with open('scripts/sync_data.py', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Added sync_inmet_meteograma to scripts/sync_data.py!")
else:
    print("Already present or main not found!")
