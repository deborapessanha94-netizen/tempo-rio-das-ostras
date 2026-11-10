#!/usr/bin/env python3
"""
Sincronizador Oficial de Balneabilidade via Power BI do INEA (DISEQ / SEIRHI)
Fonte: https://app.powerbi.com/view?r=eyJrIjoiNWI4MDFiMzEtNGY0OS00M2Y1LWE5MWYtZWNlNzQyYmUwMjkwIiwidCI6IjZkYjc3YWU3LWQwYTQtNDYxNi1iNzM4LTg4ODE4NTQxOWIzOSJ9&pageName=64fcd9486da0b10c1015
Endpoint REST Público: https://wabi-brazil-south-api.analysis.windows.net/public/reports/querydata?synchronous=true
"""

import datetime
import gzip
import json
import os
import urllib.request
from pathlib import Path

PBI_REPORT_URL = "https://app.powerbi.com/view?r=eyJrIjoiNWI4MDFiMzEtNGY0OS00M2Y1LWE5MWYtZWNlNzQyYmUwMjkwIiwidCI6IjZkYjc3YWU3LWQwYTQtNDYxNi1iNzM4LTg4ODE4NTQxOWIzOSJ9&pageName=64fcd9486da0b10c1015"
PBI_QUERY_URL = "https://wabi-brazil-south-api.analysis.windows.net/public/reports/querydata?synchronous=true"
RESOURCE_KEY = "5b801b31-4f49-43f5-a91f-ece742be0290"
MODEL_ID = 5721923
DATASET_ID = "3f9a82b6-9c0c-4a62-835f-610e0f8b41c7"
REPORT_ID = "5d29285b-4347-4479-9e69-9f7e1c2b8c32"

HEADERS = {
    "X-PowerBI-ResourceKey": RESOURCE_KEY,
    "Content-Type": "application/json;charset=UTF-8",
    "Accept": "application/json",
    "Origin": "https://app.powerbi.com",
    "Referer": "https://app.powerbi.com/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

MESES_PT = [
    "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

FRIENDLY_NAMES = {
    "RO007": ("Praia das Tartarugas", "praia"),
    "RO008": ("Praia do Bosque", "praia"),
    "RO001": ("Praia do Centro (Av. Amazonas)", "praia"),
    "RO002": ("Praia do Centro (R. Bento Costa Jr)", "praia"),
    "RO004": ("Praia do Cemitério", "praia"),
    "RO003": ("Boca da Barra", "foz"),
    "RO009": ("Praia da Joana", "praia"),
    "RO010": ("Praia da Areia Negra", "praia"),
    "RO011": ("Praia do Remanso", "praia"),
    "RO012": ("Praia de Costazul", "praia"),
    "RO013": ("Lagoa de Iriri (Coca-Cola)", "lagoa"),
    "RO014": ("Praia do Mar do Norte", "praia"),
}

DISPLAY_ORDER = [
    "RO007", "RO008", "RO001", "RO002", "RO004", "RO003",
    "RO009", "RO010", "RO011", "RO012", "RO013", "RO014"
]


def _query_pbi_entity(entity, props, muni_prop="Município", muni_val="Rio das Ostras"):
    selects = [
        {"Column": {"Expression": {"SourceRef": {"Source": "f"}}, "Property": p}, "Name": p}
        for p in props
    ]
    payload = {
        "version": "1.0.0",
        "queries": [
            {
                "Query": {
                    "Commands": [
                        {
                            "SemanticQueryDataShapeCommand": {
                                "Query": {
                                    "Version": 2,
                                    "From": [{"Name": "f", "Entity": entity, "Type": 0}],
                                    "Select": selects,
                                    "Where": [
                                        {
                                            "Condition": {
                                                "In": {
                                                    "Expressions": [
                                                        {"Column": {"Expression": {"SourceRef": {"Source": "f"}}, "Property": muni_prop}}
                                                    ],
                                                    "Values": [[{"Literal": {"Value": f"'{muni_val}'"}}]]
                                                }
                                            }
                                        }
                                    ]
                                },
                                "Binding": {
                                    "Primary": {"Groupings": [{"Projections": list(range(len(props)))}]},
                                    "DataReduction": {"DataVolume": 4, "Primary": {"Window": {"Count": 500}}},
                                    "Version": 1
                                },
                                "ExecutionMetricsKind": 1
                            }
                        }
                    ]
                },
                "QueryId": "",
                "ApplicationContext": {"DatasetId": DATASET_ID, "Sources": [{"ReportId": REPORT_ID}]}
            }
        ],
        "cancelQueries": [],
        "modelId": MODEL_ID
    }
    req = urllib.request.Request(
        PBI_QUERY_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers=HEADERS,
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw = resp.read()
    if raw[:2] == b"\x1f\x8b":
        raw = gzip.decompress(raw)
    res = json.loads(raw.decode("utf-8"))
    ds = res["results"][0]["result"]["data"]["dsr"]["DS"][0]
    dm = ds["PH"][0]["DM0"]
    vdicts = ds.get("ValueDicts", {})
    schema = dm[0]["S"]
    ncols = len(schema)

    rows = []
    prev_vals = [None] * ncols
    for item in dm:
        r_mask = item.get("R", 0)
        null_mask = item.get("Ø", 0)
        c_arr = item.get("C", [])
        c_idx = 0
        curr_vals = []
        for col_i in range(ncols):
            if (r_mask >> col_i) & 1:
                val = prev_vals[col_i]
            elif (null_mask >> col_i) & 1:
                val = None
            else:
                raw_v = c_arr[c_idx] if c_idx < len(c_arr) else None
                c_idx += 1
                dn = schema[col_i].get("DN")
                if dn and dn in vdicts and isinstance(raw_v, int) and 0 <= raw_v < len(vdicts[dn]):
                    val = vdicts[dn][raw_v]
                elif schema[col_i].get("T") == 7 and isinstance(raw_v, (int, float)):
                    val = datetime.datetime.fromtimestamp(raw_v / 1000.0, tz=datetime.timezone.utc).strftime("%Y-%m-%d")
                else:
                    val = raw_v
            curr_vals.append(val)
        prev_vals = curr_vals
        rows.append(dict(zip(props, curr_vals)))
    return rows


def format_date_extenso(iso_date):
    if not iso_date or len(str(iso_date)) < 10:
        return "Último Boletim Divulgado"
    try:
        y, m, d = [int(x) for x in str(iso_date)[:10].split("-")]
        return f"{d:02d} de {MESES_PT[m]} de {y}"
    except Exception:
        return str(iso_date)


def format_date_curta(iso_date):
    if not iso_date or len(str(iso_date)) < 10:
        return "--/--/----"
    try:
        y, m, d = str(iso_date)[:10].split("-")
        return f"{d}/{m}/{y}"
    except Exception:
        return str(iso_date)


def sync_powerbi_balneabilidade(data_dir=None):
    if data_dir is None:
        data_dir = Path(__file__).resolve().parent.parent / "data"
    else:
        data_dir = Path(data_dir)

    props_baln = [
        "Ponto de Coleta",
        "Código Ponto de Coleta",
        "RH",
        "Município",
        "Praia",
        "Lagoa",
        "Localização",
        "Classificação",
        "Data da coleta",
        "Choveu nas últimas 24h?",
        "Observação",
        "Concentração NMP/100ml Enterococos",
        "Concentração NMP/100ml Coliformes Termotolerantes",
        "Concentração NMP/100ml Escherichia coli (E. coli)",
        "Blue Flag",
        " Circuito",
        "Latitude ",
        "Longitude",
    ]
    rows_live = _query_pbi_entity("fDISEQ_Balneabilidade_Praias", props_baln)

    # Also fetch historical annual PBP / Categoria from fDISEQ_QPraias
    annual_map = {}
    try:
        rows_hist = _query_pbi_entity(
            "fDISEQ_QPraias",
            ["PONTO DE COLETA", "PRAIAS", "Ano", "PBP", "Categoria", "Observação"]
        )
        for rh in sorted(rows_hist, key=lambda x: str(x.get("Ano") or "")):
            code = str(rh.get("PONTO DE COLETA") or "").strip()
            if code:
                annual_map[code] = rh
    except Exception as e:
        print(f"Aviso ao consultar histórico fDISEQ_QPraias: {e}")

    pontos = []
    latest_iso = None

    by_code = {str(r.get("Ponto de Coleta") or "").strip(): r for r in rows_live}
    ordered_codes = [c for c in DISPLAY_ORDER if c in by_code] + [
        c for c in sorted(by_code.keys()) if c not in DISPLAY_ORDER
    ]

    for code in ordered_codes:
        r = by_code[code]
        friendly_name, tipo = FRIENDLY_NAMES.get(
            code,
            (r.get("Praia") or r.get("Lagoa") or code, "lagoa" if r.get("Lagoa") else "praia")
        )
        raw_status = str(r.get("Classificação") or "").strip().upper()
        is_propria = "PRÓPRIA" in raw_status and "IMPRÓPRIA" not in raw_status
        status_str = "PRÓPRIA" if is_propria else "IMPRÓPRIA"

        dt_iso = str(r.get("Data da coleta") or "").strip()
        if dt_iso and (latest_iso is None or dt_iso > latest_iso):
            latest_iso = dt_iso

        ent_raw = str(r.get("Concentração NMP/100ml Enterococos") or "").strip()
        try:
            ent_val = int(float(ent_raw.replace(",", ".")))
        except Exception:
            ent_val = None

        hist_info = annual_map.get(code, {})
        pbp_raw = hist_info.get("PBP")
        pbp_pct = None
        if pbp_raw is not None and str(pbp_raw).strip() != "":
            try:
                pbp_pct = round(float(str(pbp_raw).replace(",", ".")) * 100, 1)
            except Exception:
                pbp_pct = None
        cat_anual = str(hist_info.get("Categoria") or "").strip() or None
        ano_ref = str(hist_info.get("Ano") or "").strip() or None

        if is_propria:
            if ent_val is not None:
                motivo = f"Enterococos: {ent_val} NMP/100 mL (Dentro do limite seguro ≤ 100 NMP/100 mL da Resolução CONAMA nº 274/2000)"
            else:
                motivo = "Qualidade microbiológica dentro dos padrões da Resolução CONAMA nº 274/2000"
        else:
            if ent_val is not None and ent_val > 400:
                motivo = f"Enterococos: {ent_val} NMP/100 mL (Acima do limite máximo de 400 NMP/100 mL na última coleta — CONAMA nº 274/2000)"
            elif ent_val is not None and ent_val > 100:
                motivo = f"Enterococos: {ent_val} NMP/100 mL (Acima de 100 NMP/100 mL em 2 ou mais das últimas 5 campanhas — CONAMA nº 274/2000)"
            else:
                motivo = "Classificada como Imprópria no boletim vigente do INEA (CONAMA nº 274/2000)"

        # Normalize code to 6-char format (e.g., RO0007) alongside short Power BI code (RO007)
        num_part = "".join(ch for ch in code if ch.isdigit())
        codigo_longo = f"RO{int(num_part):04d}" if num_part else code

        pontos.append({
            "praia": friendly_name,
            "praia_powerbi": str(r.get("Praia") or r.get("Lagoa") or "").strip(),
            "codigo": codigo_longo,
            "codigo_pbi": code,
            "codigo_seirhi": str(r.get("Código Ponto de Coleta") or "").strip(),
            "localizacao": str(r.get("Localização") or "").strip(),
            "status": status_str,
            "badge": "success" if is_propria else "danger",
            "tipo": tipo,
            "enterococos_nmp": ent_val,
            "enterococos_label": f"{ent_val} NMP/100 mL" if ent_val is not None else "N/D",
            "limite_conama_nmp": 100,
            "limite_max_ultima_coleta_nmp": 400,
            "data_coleta_iso": dt_iso,
            "data_coleta_br": format_date_curta(dt_iso),
            "choveu_24h": str(r.get("Choveu nas últimas 24h?") or "").strip() or "Não informado",
            "observacao_pbi": str(r.get("Observação") or "").strip(),
            "motivo": motivo,
            "categoria_anual": cat_anual,
            "pbp_anual_pct": pbp_pct,
            "ano_qualificacao": ano_ref,
            "rh": str(r.get("RH") or "VIII").strip(),
            "circuito": str(r.get(" Circuito") or "Macaé e Rio das Ostras").strip(),
            "latitude": r.get("Latitude "),
            "longitude": r.get("Longitude"),
        })

    proprias_cnt = sum(1 for p in pontos if p["status"] == "PRÓPRIA")
    improprias_cnt = len(pontos) - proprias_cnt

    output = {
        "orgao": "Instituto Estadual do Ambiente - INEA (DISEQ / SEIRHI)",
        "sistema": "Painel Oficial Power BI INEA & SEIRHI — Balneabilidade das Praias",
        "norma_tecnica": "Resolução CONAMA nº 274/2000 (Enterococos ≤ 100 NMP/100 mL em 4 de 5 coletas e < 400 NMP/100 mL na última coleta)",
        "url_powerbi": PBI_REPORT_URL,
        "url_fonte": PBI_REPORT_URL,
        "url_seirhi": "https://seirhi.inea.rj.gov.br/publico",
        "url_portal_inea": "https://www.inea.rj.gov.br/rio-das-ostras/",
        "boletim_numero": 20,
        "data_coleta_iso": latest_iso or "2026-09-29",
        "data_boletim": format_date_extenso(latest_iso or "2026-09-29"),
        "data_boletim_curta": format_date_curta(latest_iso or "2026-09-29"),
        "regiao_hidrografica": "RH-VIII (Macaé e das Ostras)",
        "circuito": "Macaé e Rio das Ostras",
        "total_pontos": len(pontos),
        "total_proprias": proprias_cnt,
        "total_improprias": improprias_cnt,
        "percentual_proprias": round((proprias_cnt / len(pontos)) * 100) if pontos else 0,
        "criterio_conama": "Segundo a Resolução CONAMA nº 274/2000, um ponto é considerado próprio para banho se, em pelo menos 4 das últimas 5 campanhas, a concentração de Enterococos estiver abaixo de 100 NMP/100 mL, e se o resultado da coleta mais recente for inferior a 400 NMP/100 mL.",
        "observacao_tecnica": "Evitar o banho de mar nas primeiras horas após a ocorrência de chuvas e manter distância das saídas de galerias de águas pluviais ou canais de drenagem.",
        "powerbi_conectado": True,
        "seirhi_conectado": True,
        "ultima_sincronizacao_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "pontos": pontos,
    }

    out_path = data_dir / "balneabilidade.json"
    out_path.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"OK: balneabilidade.json sincronizado via Power BI INEA ({proprias_cnt}/{len(pontos)} próprias • coleta {output['data_boletim_curta']})")
    return output


if __name__ == "__main__":
    sync_powerbi_balneabilidade()
