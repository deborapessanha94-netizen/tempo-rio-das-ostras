import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { HeatStationReading } from '../services/heatIndex';

interface HeatStationsMapProps {
  stations: HeatStationReading[];
  isDark: boolean;
}

function escapeHtml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createHeatPinIcon(icValue: number | null, fillHex: string): L.DivIcon {
  const label = icValue !== null && Number.isFinite(icValue) ? `${icValue.toFixed(1)}°` : '--';
  const html = `
    <div style="position:relative;width:54px;height:62px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.38));">
      <svg viewBox="0 0 54 64" width="54" height="62" style="display:block;overflow:visible;">
        <path d="M27 2 C13.2 2 2 13.2 2 27 C2 43.2 27 61 27 61 C27 61 52 43.2 52 27 C52 13.2 40.8 2 27 2 Z"
              fill="${escapeHtml(fillHex)}"
              stroke="#FFFFFF"
              stroke-width="2.6" />
        <circle cx="27" cy="25" r="19" fill="rgba(0,0,0,0.12)" />
        <text x="27" y="29"
              text-anchor="middle"
              font-family="JetBrains Mono, ui-monospace, monospace"
              font-size="13.5"
              font-weight="800"
              fill="#FFFFFF">${escapeHtml(label)}</text>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'heat-station-pin-icon',
    html,
    iconSize: [54, 62],
    iconAnchor: [27, 60],
    popupAnchor: [0, -54],
  });
}

export const HeatStationsMap: React.FC<HeatStationsMapProps> = ({ stations, isDark }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const lastFittedKeyRef = useRef<string>('');

  const mappableStations = useMemo(
    () =>
      stations.filter(
        (s) =>
          s.lat !== null &&
          s.lat !== undefined &&
          s.lon !== null &&
          s.lon !== undefined &&
          Number.isFinite(Number(s.lat)) &&
          Number.isFinite(Number(s.lon))
      ),
    [stations]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center: [-22.495, -41.975],
      zoom: 11,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            map.invalidateSize({ animate: false });
          })
        : null;
    if (ro) ro.observe(el);

    const timer = window.setTimeout(() => {
      map.invalidateSize({ animate: false });
    }, 150);

    return () => {
      window.clearTimeout(timer);
      if (ro) ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
      lastFittedKeyRef.current = '';
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (mappableStations.length === 0) return;

    const latLngs: L.LatLngExpression[] = [];
    mappableStations.forEach((st) => {
      const lat = Number(st.lat);
      const lon = Number(st.lon);
      latLngs.push([lat, lon]);

      const icText = st.ic_c !== null && Number.isFinite(st.ic_c) ? `${st.ic_c.toFixed(1)}°C` : '--';
      const popupHtml = `
        <div style="min-width:190px;font-family:Inter,system-ui,sans-serif;color:#14213D;">
          <div style="font-weight:700;font-size:13px;text-align:center;margin-bottom:6px;">${escapeHtml(st.nome)}</div>
          <div style="background:${escapeHtml(st.cor_hex)};color:#FFFFFF;font-weight:700;font-size:11px;text-align:center;padding:3px 8px;border-radius:6px;margin-bottom:8px;">
            ${escapeHtml(st.faixa)}
          </div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.55;">
            <div style="display:flex;justify-content:space-between;gap:12px;">
              <span style="color:#475569;">Temperatura:</span>
              <strong>${st.temp_c.toFixed(1)}°C</strong>
            </div>
            <div style="display:flex;justify-content:space-between;gap:12px;">
              <span style="color:#475569;">Umidade:</span>
              <strong>${st.ur_pct}%</strong>
            </div>
            <div style="display:flex;justify-content:space-between;gap:12px;">
              <span style="color:#475569;">Índice de Calor:</span>
              <strong style="color:${escapeHtml(st.cor_hex)};">${escapeHtml(icText)}</strong>
            </div>
          </div>
          <div style="margin-top:6px;padding-top:4px;border-top:1px solid #E2E8F0;font-size:10px;color:#64748B;display:flex;justify-content:space-between;">
            <span>${escapeHtml(st.codigo)}</span>
            <span>${escapeHtml((st.ultima_leitura || '').slice(11, 16) || st.ultima_leitura || '')}</span>
          </div>
        </div>
      `;

      const marker = L.marker([lat, lon], {
        icon: createHeatPinIcon(st.ic_c, st.cor_hex),
        title: `${st.nome} — IC ${icText}`,
      });
      marker.bindPopup(popupHtml);
      marker.addTo(group);
    });

    const fitKey = mappableStations.map((s) => s.codigo).sort().join('|');
    if (fitKey !== lastFittedKeyRef.current) {
      lastFittedKeyRef.current = fitKey;
      if (latLngs.length === 1) {
        map.setView(latLngs[0], 13);
      } else {
        map.fitBounds(L.latLngBounds(latLngs), { padding: [44, 44], maxZoom: 13 });
      }
    }
  }, [mappableStations]);

  return (
    <div className="rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] p-3 sm:p-4 space-y-2.5">
      <div className="flex items-center justify-center relative">
        <h4 className="font-display text-sm sm:text-base font-bold text-[#14213D] dark:text-white text-center">
          Mapa das Estações
        </h4>
        <span className="hidden sm:inline-block absolute right-0 text-[10px] font-mono text-slate-400 dark:text-[#E5E5E5]/60">
          Clique no pino para detalhes
        </span>
      </div>

      <style>{`
        .heat-station-pin-icon { background: transparent !important; border: none !important; }
        .heat-leaflet-dark .leaflet-tile-pane { filter: brightness(0.86) contrast(1.06); }
      `}</style>

      <div
        className={`relative isolate z-0 w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-[#E5E5E5] dark:border-[#233354] bg-slate-100 dark:bg-[#0D1526] ${
          isDark ? 'heat-leaflet-dark' : ''
        }`}
      >
        <div ref={containerRef} className="w-full h-full" />
        {mappableStations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 dark:text-[#E5E5E5]/70 pointer-events-none">
            Aguardando coordenadas das estações ativas...
          </div>
        )}
      </div>
    </div>
  );
};
