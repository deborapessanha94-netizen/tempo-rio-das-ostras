"""
SEIRHI Service - Ingestão direta dos dados de balneabilidade do INEA
Fonte Oficial: Sistema Estadual de Informações sobre Recursos Hídricos (SEIRHI)
URL: https://seirhi.inea.rj.gov.br/publico
"""

import urllib.request
import ssl
import re
from datetime import datetime

SEIRHI_PUBLICO_URL = "https://seirhi.inea.rj.gov.br/publico"

def fetch_seirhi_rio_das_ostras():
    ctx = ssl._create_unverified_context()
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
    req = urllib.request.Request(SEIRHI_PUBLICO_URL, headers=headers)
    
    with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
        html = r.read().decode('utf-8', errors='ignore')
        
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.DOTALL)
    ro_data = []
    
    for row in rows:
        if 'rio das ostras' in row.lower():
            # Extract columns
            cols = re.findall(r'<td[^>]*>(.*?)</td>', row, re.DOTALL)
            clean_cols = [re.sub(r'<[^>]+>', ' ', c).strip() for c in cols]
            if len(clean_cols) >= 5:
                municipio = clean_cols[0]
                # button text may contain praia name
                praia = clean_cols[1].replace('Centro – Rio das Ostras', 'Centro')
                codigo = clean_cols[2]
                status_raw = clean_cols[3]
                data_coleta = clean_cols[4]
                
                # Determine friendly status
                if 'própria' in status_raw.lower() and 'imprópria' not in status_raw.lower():
                    status = 'PROPRIA'
                elif 'imprópria' in status_raw.lower():
                    status = 'IMPROPRIA'
                else:
                    status = status_raw
                    
                ro_data.append({
                    "praia": praia,
                    "codigo": codigo,
                    "status": status,
                    "status_original": status_raw,
                    "data_coleta": data_coleta
                })
                
    return ro_data

if __name__ == '__main__':
    data = fetch_seirhi_rio_das_ostras()
    print(f"Extraídas {len(data)} praias de Rio das Ostras do SEIRHI:")
    for item in data:
        print(f" - {item['praia']} ({item['codigo']}): {item['status']} | Coleta: {item['data_coleta']}")
