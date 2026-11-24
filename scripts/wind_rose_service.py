"""
Serviço de Rosa dos Ventos — Rio das Ostras, RJ.
Consolida observações horárias históricas e em tempo real das estações locais (Orla e Interior)
+ previsão horária multi-modelo (ECMWF IFS 9km, NOAA GFS e DWD ICON 13km), gerando
distribuições polares em 16 setores direcionais e 5 faixas de velocidade (km/h) para:
  - Hoje (Tempo Real 5 min), 7 dias, 30 dias, Mês Atual e Série Histórica Completa (01/10/2026+)
  - Série diária (evolução e giro dos ventos nos últimos 35 dias, atualizada diariamente)
  - Rosa Prevista (7 dias à frente por modelo/consenso)
Grava o dataset estruturado em `data/wind_rose.json`.
"""

import json
import math
import ssl
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, date, timedelta, timezone
from pathlib import Path

try:
    from scripts.historico_estacoes_service import (
        BRT,
        DATA_DIR,
        MESES_PT,
        START_DATE,
        WU_KEYS,
        deg_to_cardinal_pt,
        safe_float,
    )
except ImportError:
    try:
        from historico_estacoes_service import (
            BRT,
            DATA_DIR,
            MESES_PT,
            START_DATE,
            WU_KEYS,
            deg_to_cardinal_pt,
            safe_float,
        )
    except ImportError:
        BASE_DIR = Path(__file__).resolve().parent.parent
        DATA_DIR = BASE_DIR / "data"
        BRT = timezone(timedelta(hours=-3))
        START_DATE = date(2026, 10, 1)
        WU_KEYS = [
            "ff90f212a6984a7390f212a698ea73cc",
            "e1f10a1e78da46f5b10a1e78da96f525",
        ]
        MESES_PT = {
            1: "Janeiro", 2: "Fevereiro", 3: "Março", 4: "Abril",
            5: "Maio", 6: "Junho", 7: "Julho", 8: "Agosto",
            9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro",
        }

        def safe_float(val, default=None):
            if val is None:
                return default
            try:
                return float(str(val).strip().replace(",", "."))
            except (TypeError, ValueError):
                return default

        def deg_to_cardinal_pt(deg):
            if deg is None:
                return "N/D"
            try:
                d = float(deg) % 360.0
            except (TypeError, ValueError):
                return "N/D"
            dirs = ["N", "NNE", "NE", "ENE", "L", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"]
            return dirs[int(round(d / 22.5)) % 16]


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

SECTORS_16_PT = [
    "N", "NNE", "NE", "ENE",
    "L", "ESE", "SE", "SSE",
    "S", "SSO", "SO", "OSO",
    "O", "ONO", "NO", "NNO",
]

WIND_STATIONS = [
    {"id": "IRIODA17", "nome": "Praia da Tartaruga", "bairro": "Praia da Tartaruga (Orla / Sede)", "costeira": True},
    {"id": "ICASIM5", "nome": "Praiamar / Divisa Sul", "bairro": "Barra de São João / Praiamar (Orla Sul)", "costeira": True},
    {"id": "IRIODA6", "nome": "Costazul (Escola Jacinto)", "bairro": "Costazul (Orla Central)", "costeira": True},
    {"id": "IRIODA16", "nome": "Cantagalo / Extensão do Bosque", "bairro": "Cantagalo (Interior)", "costeira": False},
    {"id": "IRIODA15", "nome": "Rocha Leão / REBIO União", "bairro": "Rocha Leão (Serra / Interior)", "costeira": False},
]

SPEED_BINS = [
    {"id": "lt5", "label": "Aragem / Calma (< 5 km/h)", "short_label": "< 5", "min_kmh": 0.0, "max_kmh": 5.0, "cor_hex": "#94A3B8"},
    {"id": "5_12", "label": "Brisa Leve (5–12 km/h)", "short_label": "5–12", "min_kmh": 5.0, "max_kmh": 12.0, "cor_hex": "#10B981"},
    {"id": "12_20", "label": "Brisa Moderada (12–20 km/h)", "short_label": "12–20", "min_kmh": 12.0, "max_kmh": 20.0, "cor_hex": "#0EA5E9"},
    {"id": "20_30", "label": "Vento Fresco (20–30 km/h)", "short_label": "20–30", "min_kmh": 20.0, "max_kmh": 30.0, "cor_hex": "#F59E0B"},
    {"id": "ge30", "label": "Forte / Atenção (≥ 30 km/h)", "short_label": "≥ 30", "min_kmh": 30.0, "max_kmh": None, "cor_hex": "#EF4444"},
]

NORTH_EAST_SECTORS = {0, 1, 2, 3, 4}    # N, NNE, NE, ENE, L
SOUTH_SECTORS = {6, 7, 8, 9, 10}        # SE, SSE, S, SSO, SO
DIAS_SEMANA_PT = {0: "Segunda", 1: "Terça", 2: "Quarta", 3: "Quinta", 4: "Sexta", 5: "Sábado", 6: "Domingo"}


def _speed_bin_idx(vel_kmh: float) -> int:
    if vel_kmh < 5.0:
        return 0
    if vel_kmh < 12.0:
        return 1
    if vel_kmh < 20.0:
        return 2
    if vel_kmh < 30.0:
        return 3
    return 4


def _apply_wind_qc(vel_avg: float, gust_val: float | None) -> tuple[float, float]:
    """Filtra espúrios eletrônicos de RF mantendo rajadas físicas consistentes."""
    v = max(0.0, float(vel_avg or 0.0))
    if v > 90.0:
        v = 0.0
    g = max(v, float(gust_val)) if gust_val is not None else v
    if g > 105.0 or (v < 25.0 and g > 80.0):
        g = round(max(v * 1.75, 24.0), 1)
    return round(v, 1), round(g, 1)


def _classify_wind_plancon_label(gust_kmh: float) -> str:
    if gust_kmh > 75.0:
        return "Muito Alto"
    if gust_kmh >= 56.0:
        return "Risco Alto"
    if gust_kmh >= 41.0:
        return "Risco Moderado"
    return "Risco Baixo"


def _classify_daily_regime(nl_pct: float, sul_pct: float, total: int) -> str:
    if total <= 0:
        return "Sem leituras"
    if sul_pct >= 45.0:
        return "Giro Frontal / Marítimo Sul (S–SE–SO)"
    if nl_pct >= 45.0 and sul_pct < 25.0:
        return "Alísios / ASAS (N–NE–L)"
    if sul_pct >= 25.0 and nl_pct >= 25.0:
        return "Giro de Vento / Transição Frontal"
    if nl_pct >= 30.0:
        return "Escoamento Litoral / Brisa N–L"
    return "Brisa Continental / Cavado Local"


class WindRoseAccumulator:
    """Acumulador vetorial e direcional de 16 setores × 5 faixas de velocidade."""

    def __init__(self):
        self.sec_bins = [[0, 0, 0, 0, 0] for _ in range(16)]
        self.sec_vel_sum = [0.0] * 16
        self.sec_gust_max = [0.0] * 16
        self.calmas_sem_dir = 0
        self.total = 0
        self.u_sum = 0.0
        self.v_sum = 0.0
        self.vel_sum = 0.0
        self.vel_max = 0.0
        self.rajada_max = 0.0

    def add_sample(self, dir_deg: float | None, vel_kmh: float | None, gust_kmh: float | None = None, include_calm: bool = False):
        if vel_kmh is None:
            return
        v, g = _apply_wind_qc(vel_kmh, gust_kmh)
        if not include_calm and v < 0.5 and g < 1.0:
            self.calmas_sem_dir += 1
            self.total += 1
            return
        if dir_deg is None or not math.isfinite(float(dir_deg)):
            self.calmas_sem_dir += 1
            self.total += 1
            return

        deg = float(dir_deg) % 360.0
        sec_idx = int(round(deg / 22.5)) % 16
        bin_idx = _speed_bin_idx(v)

        self.total += 1
        self.sec_bins[sec_idx][bin_idx] += 1
        self.sec_vel_sum[sec_idx] += v
        if g > self.sec_gust_max[sec_idx]:
            self.sec_gust_max[sec_idx] = g

        rad = math.radians(deg)
        w_vec = v if v > 0.05 else 0.5
        self.u_sum += w_vec * math.sin(rad)
        self.v_sum += w_vec * math.cos(rad)
        self.vel_sum += v
        if v > self.vel_max:
            self.vel_max = v
        if g > self.rajada_max:
            self.rajada_max = g

    def merge(self, other: "WindRoseAccumulator"):
        self.calmas_sem_dir += other.calmas_sem_dir
        self.total += other.total
        self.u_sum += other.u_sum
        self.v_sum += other.v_sum
        self.vel_sum += other.vel_sum
        self.vel_max = max(self.vel_max, other.vel_max)
        self.rajada_max = max(self.rajada_max, other.rajada_max)
        for s in range(16):
            self.sec_vel_sum[s] += other.sec_vel_sum[s]
            self.sec_gust_max[s] = max(self.sec_gust_max[s], other.sec_gust_max[s])
            for b in range(5):
                self.sec_bins[s][b] += other.sec_bins[s][b]

    def to_compact_state(self) -> dict:
        return {
            "sec_bins": [row[:] for row in self.sec_bins],
            "sec_vel_sum": [round(x, 2) for x in self.sec_vel_sum],
            "sec_gust_max": [round(x, 1) for x in self.sec_gust_max],
            "calmas_sem_dir": self.calmas_sem_dir,
            "total": self.total,
            "u_sum": round(self.u_sum, 3),
            "v_sum": round(self.v_sum, 3),
            "vel_sum": round(self.vel_sum, 2),
            "vel_max": round(self.vel_max, 1),
            "rajada_max": round(self.rajada_max, 1),
        }

    def to_distribution(self) -> dict:
        denom = max(1, self.total)
        valid_dir = self.total - self.calmas_sem_dir
        setores = []
        lt5_total = self.calmas_sem_dir
        nl_count = 0
        sul_count = 0

        for idx in range(16):
            counts = self.sec_bins[idx]
            c_tot = sum(counts)
            lt5_total += counts[0]
            if idx in NORTH_EAST_SECTORS:
                nl_count += c_tot
            if idx in SOUTH_SECTORS:
                sul_count += c_tot
            setores.append({
                "idx": idx,
                "cardeal": SECTORS_16_PT[idx],
                "angulo_centro": round(idx * 22.5, 1),
                "total_count": c_tot,
                "pct": round(c_tot * 100.0 / denom, 1) if self.total > 0 else 0.0,
                "vel_media_kmh": round(self.sec_vel_sum[idx] / c_tot, 1) if c_tot > 0 else 0.0,
                "rajada_max_kmh": round(self.sec_gust_max[idx], 1),
                "bins": [round(c * 100.0 / denom, 2) if self.total > 0 else 0.0 for c in counts],
                "bins_count": counts[:],
            })

        pred_sec = max(setores, key=lambda s: (s["total_count"], s["vel_media_kmh"])) if valid_dir > 0 else None
        if pred_sec and pred_sec["total_count"] > 0:
            dir_pred = pred_sec["cardeal"]
            dir_pred_deg = pred_sec["angulo_centro"]
            dir_pred_pct = pred_sec["pct"]
        else:
            dir_pred = "N/D"
            dir_pred_deg = None
            dir_pred_pct = 0.0

        vec_mag = math.hypot(self.u_sum, self.v_sum)
        if valid_dir > 0 and vec_mag > 1e-6:
            dir_vec_deg = int(round((math.degrees(math.atan2(self.u_sum, self.v_sum)) + 360.0) % 360.0)) % 360
            dir_vec_card = deg_to_cardinal_pt(dir_vec_deg)
            scalar_sum = self.vel_sum if self.vel_sum > 0.1 else float(valid_dir) * 0.5
            persist = min(100.0, round(vec_mag * 100.0 / scalar_sum, 1))
        else:
            dir_vec_deg = None
            dir_vec_card = "N/D"
            persist = 0.0

        valid_denom = max(1, valid_dir)
        return {
            "total_amostras": self.total,
            "amostras_validas_dir": valid_dir,
            "calmas_sem_dir_count": self.calmas_sem_dir,
            "calmo_pct": round(lt5_total * 100.0 / denom, 1) if self.total > 0 else 0.0,
            "vel_media_kmh": round(self.vel_sum / valid_denom, 1) if valid_dir > 0 else 0.0,
            "vel_max_kmh": round(self.vel_max, 1),
            "rajada_max_kmh": round(self.rajada_max, 1),
            "dir_predominante": dir_pred,
            "dir_predominante_deg": dir_pred_deg,
            "dir_predominante_pct": dir_pred_pct,
            "dir_vetorial_graus": dir_vec_deg,
            "dir_vetorial_cardeal": dir_vec_card,
            "persistencia_pct": persist,
            "quadrante_sul_pct": round(sul_count * 100.0 / valid_denom, 1) if valid_dir > 0 else 0.0,
            "quadrante_norte_leste_pct": round(nl_count * 100.0 / valid_denom, 1) if valid_dir > 0 else 0.0,
            "setores": setores,
        }


def _fetch_json_safe(url: str, timeout: int = 8):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=SSL_CTX, timeout=timeout) as r:
            if r.status == 204:
                return None
            raw = r.read()
            return json.loads(raw.decode("utf-8")) if raw else None
    except Exception:
        return None


def _fetch_wu_station_live_bundle(station_id: str, wu_keys: list[str], today_iso: str) -> dict:
    """Busca em paralelo hourly/7day e all/1day de uma estação WU para garantir cobertura completa dos últimos 7 dias e hoje."""
    result = {"hourly": {}, "today_samples": [], "current": None}
    for key in wu_keys:
        url_7d = (
            f"https://api.weather.com/v2/pws/observations/hourly/7day?"
            f"stationId={station_id}&format=json&units=m&numericPrecision=decimal&apiKey={key}"
        )
        url_1d = (
            f"https://api.weather.com/v2/pws/observations/all/1day?"
            f"stationId={station_id}&format=json&units=m&numericPrecision=decimal&apiKey={key}"
        )
        d7 = _fetch_json_safe(url_7d, timeout=8)
        d1 = _fetch_json_safe(url_1d, timeout=8)
        if d7 is None and d1 is None:
            continue

        for obs in (d7 or {}).get("observations") or []:
            t_loc = str(obs.get("obsTimeLocal") or "")
            if len(t_loc) < 13:
                continue
            d_iso = t_loc[:10]
            hr = t_loc[11:13]
            m = obs.get("metric") or {}
            w_avg, g_hi = _apply_wind_qc(
                safe_float(m.get("windspeedAvg"), 0.0) or 0.0,
                safe_float(m.get("windgustHigh"), None),
            )
            w_dir = safe_float(obs.get("winddirAvg"), None)
            result["hourly"].setdefault(d_iso, {})[hr] = {
                "wind_avg": w_avg,
                "gust_high": g_hi,
                "wind_dir": int(round(w_dir)) if w_dir is not None else None,
            }

        for obs in (d1 or {}).get("observations") or []:
            t_loc = str(obs.get("obsTimeLocal") or "")
            if not t_loc.startswith(today_iso) or len(t_loc) < 16:
                continue
            m = obs.get("metric") or {}
            w_avg, g_hi = _apply_wind_qc(
                safe_float(m.get("windspeedAvg"), 0.0) or 0.0,
                safe_float(m.get("windgustHigh"), None),
            )
            w_dir = safe_float(obs.get("winddirAvg"), None)
            if w_dir is None:
                continue
            sample = {
                "dt_iso": t_loc[:10],
                "hora_min": t_loc[11:16],
                "dir_graus": int(round(w_dir)) % 360,
                "vel_kmh": w_avg,
                "rajada_kmh": g_hi,
            }
            result["today_samples"].append(sample)
            result["current"] = sample

        break
    return result


def _collapse_samples_to_hourly(samples: list[dict]) -> dict[str, dict]:
    """Agrega amostras de 5 minutos em médias vetoriais horárias ('00'..'23') para comparação justa em séries multidia."""
    buckets: dict[str, list[dict]] = {}
    for s in samples:
        hh = str(s.get("hora_min") or "")[:2]
        if len(hh) == 2 and hh.isdigit():
            buckets.setdefault(hh, []).append(s)

    out = {}
    for hh, grp in buckets.items():
        u_sum, v_sum, vel_sum = 0.0, 0.0, 0.0
        g_max = 0.0
        valid_dirs = 0
        for s in grp:
            vel = float(s.get("vel_kmh") or 0.0)
            gust = float(s.get("rajada_kmh") or vel)
            deg = s.get("dir_graus")
            g_max = max(g_max, gust)
            vel_sum += vel
            if deg is not None:
                w = vel if vel > 0.2 else 0.2
                rad = math.radians(float(deg))
                u_sum += w * math.sin(rad)
                v_sum += w * math.cos(rad)
                valid_dirs += 1
        avg_vel = round(vel_sum / len(grp), 1)
        avg_dir = (
            int(round((math.degrees(math.atan2(u_sum, v_sum)) + 360.0) % 360.0)) % 360
            if valid_dirs > 0 and math.hypot(u_sum, v_sum) > 1e-6
            else None
        )
        out[hh] = {"wind_avg": avg_vel, "gust_high": round(g_max, 1), "wind_dir": avg_dir}
    return out


def _build_forecast_section(
    today_date: date,
    open_meteo_hourly: dict | None,
    global_nwp: dict | None,
) -> dict:
    """Constrói Rosa dos Ventos Prevista para Hoje, Próximos 3 Dias e 7 Dias (ECMWF + ICON + GFS / Open-Meteo)."""
    slots: dict[str, tuple[float, float, float]] = {}

    if open_meteo_hourly and open_meteo_hourly.get("time"):
        times = open_meteo_hourly.get("time") or []
        ws = open_meteo_hourly.get("wind_speed_10m") or []
        gs = open_meteo_hourly.get("wind_gusts_10m") or []
        ds = open_meteo_hourly.get("wind_direction_10m") or []
        for idx, t_str in enumerate(times):
            if not t_str or idx >= len(ws) or idx >= len(ds):
                continue
            w = safe_float(ws[idx], None)
            d = safe_float(ds[idx], None)
            g = safe_float(gs[idx], w) if idx < len(gs) else w
            if w is None or d is None:
                continue
            slots[str(t_str)[:13]] = (float(d), float(w), float(g or w))
    elif global_nwp and isinstance(global_nwp.get("models"), dict):
        mods = global_nwp["models"]
        ec = mods.get("ecmwf_ifs") or {}
        ic = mods.get("icon_global") or {}
        gf = mods.get("gfs_seamless") or {}
        all_keys = sorted(set((ec.get("hourly_dir_brt") or {}).keys()) | set((ic.get("hourly_dir_brt") or {}).keys()) | set((gf.get("hourly_dir_brt") or {}).keys()))
        for hk in all_keys:
            w_parts, g_parts, d_parts = [], [], []
            for mod, wt_w, wt_d in ((ec, 0.42, 0.40), (ic, 0.33, 0.35), (gf, 0.25, 0.25)):
                wv = safe_float((mod.get("hourly_wind_brt") or {}).get(hk), None)
                gv = safe_float((mod.get("hourly_gust_brt") or {}).get(hk), None)
                dv = safe_float((mod.get("hourly_dir_brt") or {}).get(hk), None)
                if wv is not None:
                    w_parts.append((wv, wt_w))
                if gv is not None:
                    g_parts.append((gv, wt_w))
                if dv is not None:
                    d_parts.append((dv, wt_d))
            if w_parts and d_parts:
                w_val = sum(v * w for v, w in w_parts) / sum(w for _, w in w_parts)
                g_val = (sum(v * w for v, w in g_parts) / sum(w for _, w in g_parts)) if g_parts else w_val * 1.25
                sx = sum(math.sin(math.radians(dg)) * wt for dg, wt in d_parts)
                cx = sum(math.cos(math.radians(dg)) * wt for dg, wt in d_parts)
                d_val = (math.degrees(math.atan2(sx, cx)) + 360.0) % 360.0
                slots[hk] = (round(d_val, 1), round(w_val, 1), round(max(g_val, w_val), 1))

    today_iso = today_date.strftime("%Y-%m-%d")
    d3_end_iso = (today_date + timedelta(days=2)).strftime("%Y-%m-%d")
    d7_end_iso = (today_date + timedelta(days=6)).strftime("%Y-%m-%d")

    acc_hoje = WindRoseAccumulator()
    acc_3d = WindRoseAccumulator()
    acc_7d = WindRoseAccumulator()
    by_day: dict[str, WindRoseAccumulator] = {}

    for hk, (d_deg, vel, gust) in sorted(slots.items()):
        d_iso = hk[:10]
        if d_iso < today_iso or d_iso > d7_end_iso:
            continue
        by_day.setdefault(d_iso, WindRoseAccumulator()).add_sample(d_deg, vel, gust, include_calm=True)
        if d_iso == today_iso:
            acc_hoje.add_sample(d_deg, vel, gust, include_calm=True)
        if today_iso <= d_iso <= d3_end_iso:
            acc_3d.add_sample(d_deg, vel, gust, include_calm=True)
        acc_7d.add_sample(d_deg, vel, gust, include_calm=True)

    dias_out = []
    for off in range(7):
        d_cur = today_date + timedelta(days=off)
        d_iso = d_cur.strftime("%Y-%m-%d")
        d_acc = by_day.get(d_iso)
        if not d_acc or d_acc.total == 0:
            continue
        dist = d_acc.to_distribution()
        # Velocidade mínima horária do dia
        day_vels = [vel for hk, (_dg, vel, _g) in slots.items() if hk[:10] == d_iso]
        dias_out.append({
            "data_iso": d_iso,
            "data_br": d_cur.strftime("%d/%m/%Y"),
            "dia_semana": DIAS_SEMANA_PT.get(d_cur.weekday(), ""),
            "dir_predominante": dist["dir_predominante"],
            "dir_vetorial_graus": dist["dir_vetorial_graus"],
            "persistencia_pct": dist["persistencia_pct"],
            "vel_min_kmh": round(min(day_vels), 1) if day_vels else dist["vel_media_kmh"],
            "vel_media_kmh": dist["vel_media_kmh"],
            "vel_max_kmh": dist["vel_max_kmh"],
            "rajada_max_kmh": dist["rajada_max_kmh"],
            "quadrante_sul_pct": dist["quadrante_sul_pct"],
            "plancon_risco": _classify_wind_plancon_label(dist["rajada_max_kmh"]),
        })

    return {
        "fontes": "ECMWF IFS 9km + NOAA GFS + DWD ICON 13km",
        "hoje": acc_hoje.to_distribution(),
        "prox_3d": acc_3d.to_distribution(),
        "prox_7d": acc_7d.to_distribution(),
        "dias": dias_out,
    }


def compute_and_save_wind_rose(
    data_dir=DATA_DIR,
    open_meteo_hourly: dict | None = None,
    acumulados: dict | None = None,
    global_nwp: dict | None = None,
    fetch_live_wu: bool = True,
) -> dict:
    """
    Calcula e salva `data/wind_rose.json` combinando histórico horário desde 01/10/2026,
    atualizações horárias/5min das estações WU e previsão multi-modelo de vento/rajada.
    """
    data_path = Path(data_dir)
    data_path.mkdir(parents=True, exist_ok=True)
    now_brt = datetime.now(BRT)
    today_date = now_brt.date()
    today_iso = today_date.strftime("%Y-%m-%d")

    raw_cache_path = data_path / "historico_estacoes_raw_cache.json"
    raw_cache = {}
    if raw_cache_path.exists():
        try:
            raw_cache = json.loads(raw_cache_path.read_text(encoding="utf-8"))
        except Exception:
            raw_cache = {}

    if acumulados is None and (data_path / "acumulados_estacoes.json").exists():
        try:
            acumulados = json.loads((data_path / "acumulados_estacoes.json").read_text(encoding="utf-8"))
        except Exception:
            acumulados = {}

    if global_nwp is None and (data_path / "global_nwp_models.json").exists():
        try:
            global_nwp = json.loads((data_path / "global_nwp_models.json").read_text(encoding="utf-8"))
        except Exception:
            global_nwp = {}

    # Indexa leituras atuais de acumulados_estacoes.json por código
    acum_by_id = {}
    for st in (acumulados or {}).get("estacoes") or []:
        cid = str(st.get("codigo") or "").strip()
        if not cid and " - " in str(st.get("nome") or ""):
            cid = str(st["nome"]).split(" - ")[-1].strip()
        if cid:
            acum_by_id[cid] = st

    # Busca incremental rápida (hourly/7day + all/1day) em paralelo para preencher lacunas recentes e hoje em 5 min
    today_5m_by_station: dict[str, list[dict]] = {st["id"]: [] for st in WIND_STATIONS}
    live_curr_by_station: dict[str, dict | None] = {st["id"]: None for st in WIND_STATIONS}

    if fetch_live_wu:
        with ThreadPoolExecutor(max_workers=5) as ex:
            futs = {
                ex.submit(_fetch_wu_station_live_bundle, st["id"], WU_KEYS, today_iso): st["id"]
                for st in WIND_STATIONS
            }
            for fut in as_completed(futs):
                sid = futs[fut]
                try:
                    bundle = fut.result()
                except Exception:
                    bundle = None
                if not bundle:
                    continue
                for d_iso, hrs_map in (bundle.get("hourly") or {}).items():
                    day_slot = raw_cache.setdefault(d_iso, {})
                    st_slot = day_slot.setdefault(sid, {})
                    if isinstance(st_slot, dict):
                        for hr, vals in hrs_map.items():
                            # Atualiza hora se ausente no cache ou se for dia recente (últimos 7 dias)
                            if hr not in st_slot or st_slot[hr].get("wind_dir") is None or d_iso >= (today_date - timedelta(days=2)).strftime("%Y-%m-%d"):
                                existing = dict(st_slot.get(hr) or {})
                                existing.update(vals)
                                st_slot[hr] = existing
                today_5m_by_station[sid] = bundle.get("today_samples") or []
                live_curr_by_station[sid] = bundle.get("current")

                # Colapsa amostras 5-min de hoje em horas cheias caso hourly/7day ainda não tenha fechado a última hora
                if today_5m_by_station[sid]:
                    collapsed = _collapse_samples_to_hourly(today_5m_by_station[sid])
                    st_today = raw_cache.setdefault(today_iso, {}).setdefault(sid, {})
                    for hh, cvals in collapsed.items():
                        if hh not in st_today or st_today[hh].get("wind_dir") is None:
                            st_today[hh] = cvals

    # Janelas temporais exatas
    d7_start_iso = (today_date - timedelta(days=6)).strftime("%Y-%m-%d")
    d30_start_iso = (today_date - timedelta(days=29)).strftime("%Y-%m-%d")
    month_start_iso = today_date.strftime("%Y-%m-01")
    hist_start_iso = START_DATE.strftime("%Y-%m-%d")

    all_dates = sorted(d for d in raw_cache.keys() if hist_start_iso <= d <= today_iso)
    if today_iso not in all_dates:
        all_dates.append(today_iso)

    rede_period_acc = {k: WindRoseAccumulator() for k in ("hoje", "7d", "30d", "mes_atual", "historico")}
    rede_base_acc = {k: WindRoseAccumulator() for k in ("7d", "30d", "mes_atual", "historico")}

    st_period_acc = {st["id"]: {k: WindRoseAccumulator() for k in ("hoje", "7d", "30d", "mes_atual", "historico")} for st in WIND_STATIONS}
    st_base_acc = {st["id"]: {k: WindRoseAccumulator() for k in ("7d", "30d", "mes_atual", "historico")} for st in WIND_STATIONS}

    daily_acc_map: dict[str, WindRoseAccumulator] = {}
    unique_station_hours = 0

    for d_iso in all_dates:
        day_acc = WindRoseAccumulator()
        day_stations = raw_cache.get(d_iso, {})
        for st in WIND_STATIONS:
            sid = st["id"]
            st_hours = day_stations.get(sid) if isinstance(day_stations, dict) else {}
            if not isinstance(st_hours, dict):
                continue
            for hr, obs in st_hours.items():
                if not isinstance(obs, dict):
                    continue
                vel = safe_float(obs.get("wind_avg"), None)
                gust = safe_float(obs.get("gust_high"), vel)
                deg = safe_float(obs.get("wind_dir"), None)
                if vel is None:
                    continue
                unique_station_hours += 1
                day_acc.add_sample(deg, vel, gust)

                # Multidia (granularidade estritamente 1h/estação para não enviesar dias)
                for p_key, p_start in (("7d", d7_start_iso), ("30d", d30_start_iso), ("mes_atual", month_start_iso), ("historico", hist_start_iso)):
                    if d_iso >= p_start:
                        rede_period_acc[p_key].add_sample(deg, vel, gust)
                        st_period_acc[sid][p_key].add_sample(deg, vel, gust)
                        if d_iso < today_iso:
                            rede_base_acc[p_key].add_sample(deg, vel, gust)
                            st_base_acc[sid][p_key].add_sample(deg, vel, gust)

                # Para "hoje", se a estação não tem série 5-min ao vivo, usa as leituras horárias de hoje
                if d_iso == today_iso and not today_5m_by_station[sid]:
                    rede_period_acc["hoje"].add_sample(deg, vel, gust)
                    st_period_acc[sid]["hoje"].add_sample(deg, vel, gust)

        if day_acc.total > 0:
            daily_acc_map[d_iso] = day_acc

    # Popula horizonte "hoje" com resolução 5-min quando disponível + leitura atual ao vivo
    for st in WIND_STATIONS:
        sid = st["id"]
        samples_5m = today_5m_by_station[sid]
        if samples_5m:
            for s in samples_5m:
                rede_period_acc["hoje"].add_sample(s["dir_graus"], s["vel_kmh"], s["rajada_kmh"])
                st_period_acc[sid]["hoje"].add_sample(s["dir_graus"], s["vel_kmh"], s["rajada_kmh"])
        elif sid in acum_by_id and acum_by_id[sid].get("online") and acum_by_id[sid].get("vento_dir_graus") is not None:
            ast_obj = acum_by_id[sid]
            v_now = safe_float(ast_obj.get("vento_atual"), 0.0) or 0.0
            g_now = safe_float(ast_obj.get("rajada_atual"), v_now)
            d_now = safe_float(ast_obj.get("vento_dir_graus"), None)
            rede_period_acc["hoje"].add_sample(d_now, v_now, g_now)
            st_period_acc[sid]["hoje"].add_sample(d_now, v_now, g_now)

    # Garante dia de hoje na série diária mesmo antes de fechar horas cheias
    if today_iso not in daily_acc_map and rede_period_acc["hoje"].total > 0:
        daily_acc_map[today_iso] = rede_period_acc["hoje"]

    # Série diária dos últimos 35 dias
    recent_days_iso = sorted(daily_acc_map.keys())[-35:]
    serie_diaria = []
    for d_iso in recent_days_iso:
        dist = daily_acc_map[d_iso].to_distribution()
        dt_obj = datetime.strptime(d_iso, "%Y-%m-%d").date()
        serie_diaria.append({
            "data_iso": d_iso,
            "data_br": dt_obj.strftime("%d/%m/%Y"),
            "amostras": dist["total_amostras"],
            "dir_predominante": dist["dir_predominante"],
            "dir_vetorial_graus": dist["dir_vetorial_graus"],
            "dir_vetorial_cardeal": dist["dir_vetorial_cardeal"],
            "persistencia_pct": dist["persistencia_pct"],
            "vel_media_kmh": dist["vel_media_kmh"],
            "vel_max_kmh": dist["vel_max_kmh"],
            "rajada_max_kmh": dist["rajada_max_kmh"],
            "quadrante_sul_pct": dist["quadrante_sul_pct"],
            "quadrante_norte_leste_pct": dist["quadrante_norte_leste_pct"],
            "regime": _classify_daily_regime(
                dist["quadrante_norte_leste_pct"],
                dist["quadrante_sul_pct"],
                dist["amostras_validas_dir"],
            ),
        })

    # Snapshots individuais por estação
    estacoes_out = []
    for st in WIND_STATIONS:
        sid = st["id"]
        a_obj = acum_by_id.get(sid) or {}
        c_live = live_curr_by_station.get(sid)
        online = bool(a_obj.get("online")) or bool(c_live)
        v_now = safe_float(a_obj.get("vento_atual"), c_live["vel_kmh"] if c_live else None)
        g_now = safe_float(a_obj.get("rajada_atual"), c_live["rajada_kmh"] if c_live else None)
        d_now = safe_float(a_obj.get("vento_dir_graus"), c_live["dir_graus"] if c_live else None)
        d_card = a_obj.get("vento_dir_cardinal") or (deg_to_cardinal_pt(d_now) if d_now is not None else None)
        if not a_obj.get("online") and c_live:
            v_now, g_now = c_live["vel_kmh"], c_live["rajada_kmh"]
            d_now, d_card = c_live["dir_graus"], deg_to_cardinal_pt(c_live["dir_graus"])

        st_hoje_dist = st_period_acc[sid]["hoje"].to_distribution()
        estacoes_out.append({
            "codigo": sid,
            "nome": st["nome"],
            "bairro": st["bairro"],
            "costeira": st["costeira"],
            "online": online,
            "ultima_leitura": a_obj.get("ultima_leitura") or (f"{c_live['dt_iso']} {c_live['hora_min']}" if c_live else None),
            "vento_atual_kmh": round(v_now, 1) if v_now is not None else None,
            "rajada_atual_kmh": round(g_now, 1) if g_now is not None else None,
            "dir_atual_graus": int(round(d_now)) if d_now is not None else None,
            "dir_atual_cardeal": d_card,
            "vento_max_hoje_kmh": safe_float(a_obj.get("vento_max_hoje"), st_hoje_dist["vel_max_kmh"] if st_hoje_dist["total_amostras"] else None),
            "rajada_max_hoje_kmh": safe_float(a_obj.get("rajada_max_hoje"), st_hoje_dist["rajada_max_kmh"] if st_hoje_dist["total_amostras"] else None),
            "periodos": {k: st_period_acc[sid][k].to_distribution() for k in ("hoje", "7d", "30d", "mes_atual", "historico")},
            "base_sem_hoje": {k: st_base_acc[sid][k].to_compact_state() for k in ("7d", "30d", "mes_atual", "historico")},
        })

    previsao = _build_forecast_section(today_date, open_meteo_hourly, global_nwp)

    payload = {
        "atualizacao_brt": now_brt.strftime("%d/%m/%Y %H:%M:%S"),
        "atualizacao_iso": now_brt.strftime("%Y-%m-%dT%H:%M:%S-03:00"),
        "data_referencia_iso": today_iso,
        "mes_referencia": f"{MESES_PT.get(today_date.month, today_date.month)}/{today_date.year}",
        "periodo_inicio": START_DATE.strftime("%d/%m/%Y"),
        "periodo_fim": today_date.strftime("%d/%m/%Y"),
        "total_dias_serie": len(all_dates),
        "total_horas_serie": unique_station_hours,
        "faixas_velocidade": SPEED_BINS,
        "setores_referencia": SECTORS_16_PT,
        "rede": {
            "periodos": {k: rede_period_acc[k].to_distribution() for k in ("hoje", "7d", "30d", "mes_atual", "historico")},
            "base_sem_hoje": {k: rede_base_acc[k].to_compact_state() for k in ("7d", "30d", "mes_atual", "historico")},
        },
        "estacoes": estacoes_out,
        "serie_diaria": serie_diaria,
        "previsao": previsao,
    }

    out_path = data_path / "wind_rose.json"
    out_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    p_hist = payload["rede"]["periodos"]["historico"]
    p_hoje = payload["rede"]["periodos"]["hoje"]
    print(
        f">> [Rosa dos Ventos] Atualizado data/wind_rose.json ({out_path.stat().st_size // 1024} KB): "
        f"Hoje={p_hoje['dir_predominante']} ({p_hoje['total_amostras']} leituras) | "
        f"Série {len(all_dates)}d={p_hist['dir_predominante']} ({p_hist['total_amostras']} est-h)"
    )
    return payload


if __name__ == "__main__":
    compute_and_save_wind_rose()
