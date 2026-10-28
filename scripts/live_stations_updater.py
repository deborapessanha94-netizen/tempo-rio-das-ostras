# -*- coding: utf-8 -*-
"""
Serviço Contínuo de Atualização em Tempo Real das Estações (5 em 5 minutos)
Executa a cada 300 segundos consultando:
- Weather Underground (6 PWS: IRIODA17, IRIODA16, IRIODA15, ICASIM5, IRIODA6, IRIODA5)
- INEA Alerta de Cheias (Estação 2241036 / Rio Jundiá)
- CEMADEN Nacional (3 PCDs Palmital: 18788, 18789, 18790)
Atualiza data/acumulados_estacoes.json diretamente no disco.
"""
import time
import sys
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

try:
    from scripts.stations_service import collect_stations_network
except ImportError:
    from stations_service import collect_stations_network

REFRESH_INTERVAL_SECONDS = 300.0  # 5 minutos (mesmo parâmetro de clima-rio-das-ostras)

def run_loop():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Daemon iniciado: sincronizacao em tempo real de 5 em 5 minutos ({int(REFRESH_INTERVAL_SECONDS)}s).")
    sys.stdout.flush()
    while True:
        t0 = time.time()
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        try:
            print(f"[{now_str}] Coletando dados em tempo real de cada estacao (ciclo 5 min)...")
            sys.stdout.flush()
            ds = collect_stations_network()
            total = len(ds.get("estacoes", []))
            resumo = ds.get("resumo", {})
            print(f"[{now_str}] SUCESSO: {total} estacoes atualizadas! Media 24h: {resumo.get('media_chuva_24h')} mm | Maior: {resumo.get('maior_acumulado_24h')} mm")
            sys.stdout.flush()
        except Exception as e:
            print(f"[{now_str}] ERRO na coleta: {e}")
            sys.stdout.flush()

        elapsed = time.time() - t0
        sleep_sec = max(10.0, REFRESH_INTERVAL_SECONDS - elapsed)
        time.sleep(sleep_sec)

if __name__ == "__main__":
    run_loop()
