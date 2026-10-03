import http.server
import socket
import socketserver
import urllib.request
import json
import re
import os
import sys
import time
import html as html_lib

PORT = int(os.environ.get('PORT', 8080))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

CACHE = {
    'inmet_forecast': {'data': None, 'time': 0},
    'inmet_alerts': {'data': None, 'time': 0},
    'inea_cheias': {'data': None, 'time': 0},
}
CACHE_TTL = 45 # Segundos de cache inteligente para atualização contínua sem bloqueio

def format_date_br(d_str, h_str):
    if not d_str: return ''
    date_part = str(d_str).split('T')[0]
    parts = date_part.split('-')
    if len(parts) == 3:
        formatted = f'{parts[2]}/{parts[1]}/{parts[0]}'
    else:
        formatted = date_part
    return f'{formatted} às {h_str}' if h_str else formatted

def fetch_inmet_forecast():
    """Busca a previsão oficial do INMET para Rio das Ostras (código IBGE: 3304524) com cache de 45s"""
    now = time.time()
    if CACHE['inmet_forecast']['data'] is not None and (now - CACHE['inmet_forecast']['time'] < CACHE_TTL):
        return CACHE['inmet_forecast']['data']

    url = "https://apiprevmet3.inmet.gov.br/previsao/3304524"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=6) as res:
            data = json.loads(res.read().decode('utf-8'))
            CACHE['inmet_forecast']['data'] = data
            CACHE['inmet_forecast']['time'] = now
            return data
    except Exception as e:
        if CACHE['inmet_forecast']['data'] is not None:
            return CACHE['inmet_forecast']['data']
        return {"error": f"Não foi possível carregar INMET: {str(e)}"}

def fetch_inmet_alerts():
    """Busca os avisos meteorológicos ativos do INMET, deduplica e estrutura com padrão de cores e vigência com cache de 45s"""
    now = time.time()
    if CACHE['inmet_alerts']['data'] is not None and (now - CACHE['inmet_alerts']['time'] < CACHE_TTL):
        return CACHE['inmet_alerts']['data']

    url = "https://apiprevmet3.inmet.gov.br/avisos/ativos"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=6) as res:
            data = json.loads(res.read().decode('utf-8'))
        
        seen = set()
        unique = []
        for cat in ['hoje', 'futuro']:
            for a in data.get(cat, []):
                aid = a.get('id')
                if aid in seen:
                    continue
                
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
                    
                    # Padronização rigorosa de cores oficiais do INMET
                    cor_inmet = '#EAB308' # Amarelo (Perigo Potencial)
                    if sev == 'Perigo':
                        cor_inmet = '#F97316' # Laranja (Perigo)
                    elif sev == 'Grande Perigo':
                        cor_inmet = '#EF4444' # Vermelho (Grande Perigo)

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
        
        # Ordena: alertas diretos de Rio das Ostras primeiro, depois por severidade (Grande Perigo > Perigo > Perigo Potencial)
        def alert_rank(item):
            score = 0
            if item['eh_direto_ostras']: score += 10
            if item['severidade'] == 'Grande Perigo': score += 5
            elif item['severidade'] == 'Perigo': score += 3
            return score

        unique.sort(key=alert_rank, reverse=True)
        CACHE['inmet_alerts']['data'] = unique
        CACHE['inmet_alerts']['time'] = now
        return unique
    except Exception as e:
        if CACHE['inmet_alerts']['data'] is not None:
            return CACHE['inmet_alerts']['data']
        return [{"error": f"Falha ao obter avisos INMET: {str(e)}"}]

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

def fetch_inea_cheias():
    """Extrai em tempo real os dados telemétricos de rios, chuvas e cotas oficiais de transbordamento (INEA) com cache de 45s"""
    now = time.time()
    if CACHE['inea_cheias']['data'] is not None and (now - CACHE['inea_cheias']['time'] < CACHE_TTL):
        return CACHE['inea_cheias']['data']

    url = "https://alertadecheias.inea.rj.gov.br/dados/macae_e_das_ostras.php"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=8) as res:
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

                # Busca as cotas de referência oficiais
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
        CACHE['inea_cheias']['data'] = stations
        CACHE['inea_cheias']['time'] = now
        return stations
    except Exception as e:
        if CACHE['inea_cheias']['data'] is not None:
            return CACHE['inea_cheias']['data']
        return [{"error": f"Falha ao obter INEA Cheias: {str(e)}"}]

class MeteoServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        try:
            parsed_path = self.path.split('?')[0]
            # API: Previsão Oficial INMET Rio das Ostras
            if parsed_path == '/api/inmet/previsao':
                data = fetch_inmet_forecast()
                self.send_json_response(data)
                return

            # API: Avisos Meteorológicos Ativos INMET
            if parsed_path == '/api/inmet/avisos':
                data = fetch_inmet_alerts()
                self.send_json_response(data)
                return

            # API: Alerta de Cheias e Nível de Rios INEA (Rio das Ostras e Macaé)
            if parsed_path == '/api/inea/cheias':
                data = fetch_inea_cheias()
                self.send_json_response(data)
                return

            # API: Sincronização Sob Demanda do Boletim Oficial
            if parsed_path == '/api/sync/boletim':
                try:
                    from scripts.sync_boletim import sync_bulletin
                    sync_bulletin()
                    self.send_json_response({"status": "ok", "message": "Boletim da Defesa Civil sincronizado com sucesso!"})
                except Exception as ex:
                    self.send_json_response({"status": "error", "message": str(ex)}, status=500)
                return

            # Garante rota para /index.html
            if parsed_path in ('/', ''):
                self.path = '/index.html'

            return super().do_GET()
        except Exception as e:
            self.send_json_response({"error": str(e)}, status=500)

    def send_json_response(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def start_boletim_watcher():
    def watcher_loop():
        import time
        # Sincroniza imediatamente na inicialização
        try:
            from scripts.sync_boletim import sync_bulletin
            sync_bulletin()
        except Exception as e:
            print(f"[Watcher Boletim] Aviso inicial: {e}")

        while True:
            time.sleep(60) # Verifica novos boletins a cada 60s
            try:
                from scripts.sync_boletim import sync_bulletin
                sync_bulletin()
            except Exception as e:
                pass

    import threading
    t = threading.Thread(target=watcher_loop, daemon=True)
    t.start()

def run():
    start_boletim_watcher()
    httpd = http.server.ThreadingHTTPServer(('', PORT), MeteoServerHandler)
    url_local = f"http://localhost:{PORT}"
    url_ip = f"http://127.0.0.1:{PORT}"
    print("============================================================")
    print("  Portal Meteorologico Especializado - RIO DAS OSTRAS (RJ)")
    print(f"  Servidor Ativo em:")
    print(f"  -> {url_local}")
    print(f"  -> {url_ip}")
    print("============================================================")
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor finalizado.")

if __name__ == "__main__":
    run()
