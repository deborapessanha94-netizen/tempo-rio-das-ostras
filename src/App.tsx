import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  Calendar,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudRain,
  CloudSun,
  Compass,
  Copy,
  Droplets,
  ExternalLink,
  Eye,
  Film,
  Flame,
  Gauge,
  MapPin,
  Menu,
  Moon,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  Sun,
  Sunrise,
  Thermometer,
  Umbrella,
  Waves,
  WifiOff,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import {
  AcumuladosDataset,
  BalneabilidadeDataset,
  BoletimMetadata,
  BoletimTurnoRow,
  EstacaoPluvio,
  HistoricoEstacoesDataset,
  InmetAviso,
  MarinhaAvisos,
  OpenMeteoData,
  OrlaDataset,
  SITE_BASE,
  TabuaMares,
  degToCompass,
  loadAllLiveSiteData,
  wmoToPtBr,
} from './services/siteData';
import {
  CENTRAL_EMERGENCIAS,
  PLANCON_AREAS_VULNERAVEIS,
  PLANCON_EL_NINO,
  PLANCON_EL_NINO_PDF_URL,
  PLANCON_LIMIARES,
  PLANCON_NIVEIS_OPERACIONAIS,
  PLANCON_PDF_URL,
  PLANCON_RESPOSTA_MUNICIPAL,
  REDEC_1_MUNICIPIOS,
} from './data/planconStatic';
import { ChartMetric, HourlyChart, HourlyPoint } from './components/HourlyChart';
import { RiverChart } from './components/RiverChart';
import { CssExportModal } from './components/CssExportModal';

type SectionTab = 'previsao' | 'chuva' | 'rio' | 'orla' | 'alertas' | 'boletim' | 'panorama';
type PlanconSubTab = 'limiares' | 'bairros' | 'niveis' | 'resposta' | 'elnino';

const NAV_ITEMS: { id: SectionTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'previsao', label: 'Previsão & Tempo', icon: CloudSun },
  { id: 'chuva', label: 'Acumulados Chuva', icon: CloudRain },
  { id: 'rio', label: 'Nível do Rio', icon: Waves },
  { id: 'orla', label: 'Orla & Praias', icon: Umbrella },
  { id: 'alertas', label: 'Alertas & Sinótico', icon: ShieldAlert },
  { id: 'boletim', label: 'Boletim 16 Turnos', icon: CalendarClock },
  { id: 'panorama', label: 'Panorama Mensal', icon: Film },
];

const TAB_SUBSECTIONS: Record<SectionTab, { id: string; label: string }[]> = {
  previsao: [
    { id: 'tempo-agora', label: 'Tempo Agora' },
    { id: 'graficos', label: 'Gráficos de Tendência' },
    { id: 'proximos-dias', label: 'Previsão dos Próximos Dias' },
    { id: 'sinotico', label: 'Panorama Sinótico Geral' },
    { id: 'plancon', label: 'Plano de Contingência (PLANCON)' },
    { id: 'all', label: 'Ver Todas as Seções' },
  ],
  chuva: [
    { id: 'resumo', label: 'Resumo & KPIs de Chuva' },
    { id: 'cards', label: '10 Estações da Rede' },
    { id: 'tabela', label: 'Tabela Comparativa' },
    { id: 'planilha', label: 'Histórico em Planilha' },
    { id: 'all', label: 'Ver Todas as Seções' },
  ],
  rio: [
    { id: 'cota', label: 'Cota Atual & Calha do Rio' },
    { id: 'historico', label: 'Histórico Telemétrico 24h & 10d' },
    { id: 'macae', label: 'Rios da Região (Macaé & RH-VIII)' },
    { id: 'all', label: 'Ver Todas as Seções' },
  ],
  orla: [
    { id: 'mar', label: 'Condições do Mar & Ondas' },
    { id: 'mares', label: 'Tábua de Marés' },
    { id: 'balnear', label: 'Balneabilidade das Praias' },
    { id: 'all', label: 'Ver Todas as Seções' },
  ],
  alertas: [
    { id: 'avisos', label: 'Alertas Meteorológicos Vigentes' },
    { id: 'cemaden', label: 'Riscos Geo-Hidrológicos (CEMADEN)' },
    { id: 'all', label: 'Ver Todas as Seções' },
  ],
  boletim: [
    { id: 'turnos', label: 'Previsão Operacional 16 Turnos' },
    { id: 'meteogramas', label: 'Meteogramas Numéricos' },
    { id: 'telefones', label: 'Telefones Úteis & Pronta Resposta' },
    { id: 'all', label: 'Ver Todas as Seções' },
  ],
  panorama: [
    { id: 'video', label: 'Vídeo Reels (9:16)' },
    { id: 'feed', label: 'Carrossel Feed (4:5)' },
    { id: 'stories', label: 'Stories / Reels (9:16)' },
    { id: 'legenda', label: 'Legenda Formatada' },
  ],
};

const LOGO_LIGHT = './img/logo-dark-text.png';
const LOGO_DARK = './img/logo-transparent.png';

const PANORAMA_SLIDES = [
  { title: 'Abertura Oficial • Os 3 Grandes Números', file: 'lamina_01_abertura_outubro_2026.png' },
  { title: 'Volume Total de Chuva e Pico do Mês', file: 'lamina_02_volume_chuva_outubro_2026.png' },
  { title: 'Ranking de Chuva por Bairro / Estação', file: 'lamina_03_ranking_estacoes_outubro_2026.png' },
  { title: 'Ventos e Extremos Térmicos', file: 'lamina_04_ventos_extremos_termicos_outubro_2026.png' },
  { title: 'O Que Comandou o Tempo (Sistemas)', file: 'lamina_05_sistemas_meteorologicos_outubro_2026.png' },
  { title: 'Encerramento Oficial e Chamada de Ação', file: 'lamina_06_encerramento_oficial_outubro_2026.png' },
];

function formatDateBr(iso: string): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}`;
}

function getStationRainByHours(st: EstacaoPluvio, hours: number): number | null {
  const h = Math.max(1, Math.min(96, Math.round(hours)));
  if (h === 1) return st.chuva_1h;
  if (h === 4) return st.chuva_4h;
  if (h === 6 && st.chuva_6h !== undefined) return st.chuva_6h;
  if (h === 12) return st.chuva_12h;
  if (h === 24) return st.chuva_24h;
  if (h === 36 && st.chuva_36h !== undefined) return st.chuva_36h;
  if (h === 48) return st.chuva_48h;
  if (h === 96) return st.chuva_96h;

  const anchors: { h: number; v: number | null | undefined }[] = [
    { h: 0, v: 0 },
    { h: 1, v: st.chuva_1h },
    { h: 4, v: st.chuva_4h },
    ...(st.chuva_6h !== undefined ? [{ h: 6, v: st.chuva_6h }] : []),
    { h: 12, v: st.chuva_12h },
    { h: 24, v: st.chuva_24h },
    ...(st.chuva_36h !== undefined ? [{ h: 36, v: st.chuva_36h }] : []),
    { h: 48, v: st.chuva_48h },
    { h: 96, v: st.chuva_96h },
  ].filter((a) => a.v !== null && a.v !== undefined);

  if (anchors.length <= 1) return null;
  for (let i = 1; i < anchors.length; i++) {
    const prev = anchors[i - 1];
    const curr = anchors[i];
    if (h <= curr.h) {
      const ratio = (h - prev.h) / Math.max(1, curr.h - prev.h);
      const prevVal = Number(prev.v ?? 0);
      const currVal = Math.max(prevVal, Number(curr.v ?? 0));
      return prevVal + (currVal - prevVal) * ratio;
    }
  }
  return Number(anchors[anchors.length - 1].v ?? 0);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<SectionTab>('previsao');
  const [activeSub, setActiveSub] = useState<Record<SectionTab, string>>({
    previsao: 'tempo-agora',
    chuva: 'resumo',
    rio: 'cota',
    orla: 'mar',
    alertas: 'avisos',
    boletim: 'turnos',
    panorama: 'video',
  });

  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
    } catch {}
    return false; // Default to Light Mode or saved theme
  });
  const [isCssModalOpen, setIsCssModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live datasets
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [acumulados, setAcumulados] = useState<AcumuladosDataset | null>(null);
  const [boletimOficial, setBoletimOficial] = useState<BoletimTurnoRow[]>([]);
  const [boletimMeta, setBoletimMeta] = useState<BoletimMetadata | null>(null);
  const [inmetAvisos, setInmetAvisos] = useState<InmetAviso[]>([]);
  const [marinhaAvisos, setMarinhaAvisos] = useState<MarinhaAvisos | null>(null);
  const [orla, setOrla] = useState<OrlaDataset | null>(null);
  const [balneabilidade, setBalneabilidade] = useState<BalneabilidadeDataset | null>(null);
  const [tabuaMares, setTabuaMares] = useState<TabuaMares | null>(null);
  const [historico, setHistorico] = useState<HistoricoEstacoesDataset | null>(null);
  const [openMeteo, setOpenMeteo] = useState<OpenMeteoData | null>(null);

  // Inner controls
  const [chartMetric, setChartMetric] = useState<ChartMetric>('temp');
  const [horizonCount, setHorizonCount] = useState<number>(192);
  const [chartDayFilter, setChartDayFilter] = useState<string>('all');
  const [showChartValues, setShowChartValues] = useState<boolean>(true);
  const [planconTab, setPlanconTab] = useState<PlanconSubTab>('limiares');

  const [networkFilter, setNetworkFilter] = useState<'all' | 'pws' | 'cemaden' | 'inea'>('all');
  const [rainHorizonHours, setRainHorizonHours] = useState<number>(24);
  const [rainHorizonInput, setRainHorizonInput] = useState<string>('24');
  const selectRainHorizon = (hours: number) => {
    const clamped = Math.max(1, Math.min(96, Math.round(hours)));
    setRainHorizonHours(clamped);
    setRainHorizonInput(String(clamped));
  };
  const [stationQuery, setStationQuery] = useState('');
  const [historyMode, setHistoryMode] = useState<'horario' | 'diario' | 'mensal'>('diario');
  const [histMonthFilter, setHistMonthFilter] = useState<string>('all');
  const [histDateFilter, setHistDateFilter] = useState<string>('');
  const [histRainOnly, setHistRainOnly] = useState<boolean>(false);
  const [histSortOrder, setHistSortOrder] = useState<'desc' | 'asc'>('desc');

  const [riverInterval, setRiverInterval] = useState<'hourly' | 'all'>('all');
  const [riverDateFilter, setRiverDateFilter] = useState<string>('all');

  const [orlaDay, setOrlaDay] = useState<'d0' | 'd1' | 'd2'>('d0');

  const [selectedBoletimDate, setSelectedBoletimDate] = useState<string>('');
  const [showFullBoletimTable, setShowFullBoletimTable] = useState<boolean>(false);
  const [meteoView, setMeteoView] = useState<'prob' | 'wwatch' | 'inmet'>('prob');
  const [cemadenSubView, setCemadenSubView] = useState<'sintese' | 'nacional' | 'mapas'>('sintese');

  const [panoramaSlideIdx, setPanoramaSlideIdx] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const subSection = activeSub[activeTab];
  const showSub = (id: string) => subSection === 'all' || subSection === id;

  const setSubForTab = (tab: SectionTab, subId: string) => {
    setActiveSub((prev) => ({ ...prev, [tab]: subId }));
  };

  const fetchAll = async () => {
    setSyncing(true);
    const res = await loadAllLiveSiteData();
    if (res.acumulados) setAcumulados(res.acumulados);
    if (res.boletimOficial) {
      setBoletimOficial(res.boletimOficial);
      if (res.boletimOficial.length > 0 && !selectedBoletimDate) {
        setSelectedBoletimDate(res.boletimOficial[0].data_iso);
      }
    }
    if (res.boletimMeta) setBoletimMeta(res.boletimMeta);
    if (res.inmetAvisos) setInmetAvisos(res.inmetAvisos);
    if (res.marinhaAvisos) setMarinhaAvisos(res.marinhaAvisos);
    if (res.orla) setOrla(res.orla);
    if (res.balneabilidade) setBalneabilidade(res.balneabilidade);
    if (res.tabuaMares) setTabuaMares(res.tabuaMares);
    if (res.historico) setHistorico(res.historico);
    if (res.openMeteo) setOpenMeteo(res.openMeteo);
    setLoading(false);
    setSyncing(false);
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      try { localStorage.setItem('theme', 'dark'); } catch {}
    } else {
      root.classList.remove('dark');
      try { localStorage.setItem('theme', 'light'); } catch {}
    }
  }, [isDark]);

  const { hourlyPoints, allHourlyPoints, chartDayOptions } = useMemo(() => {
    if (!openMeteo?.hourly) {
      return { hourlyPoints: [] as HourlyPoint[], allHourlyPoints: [] as HourlyPoint[], chartDayOptions: [] as string[] };
    }
    const allPts: HourlyPoint[] = openMeteo.hourly.time.map((t, i) => {
      const [datePart, hourPart] = t.split('T');
      return {
        hour: hourPart || t,
        dayLabel: formatDateBr(datePart),
        temp: openMeteo.hourly.temperature_2m[i] ?? 0,
        rainMm: openMeteo.hourly.precipitation[i] ?? 0,
        rainProb: openMeteo.hourly.precipitation_probability[i] ?? 0,
        windKmh: openMeteo.hourly.wind_speed_10m[i] ?? 0,
        windDir: degToCompass(openMeteo.hourly.wind_direction_10m[i] ?? 0),
        pressureHpa: openMeteo.hourly.surface_pressure[i] ?? 1015,
        humidity: openMeteo.hourly.relative_humidity_2m[i] ?? 75,
      };
    });

    // Current local hour in America/Sao_Paulo (YYYY-MM-DDTHH)
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const getP = (type: string) => parts.find((p) => p.type === type)?.value || '00';
    const nowBrtHour = `${getP('year')}-${getP('month')}-${getP('day')}T${getP('hour')}`;
    const startIdx = Math.max(0, openMeteo.hourly.time.findIndex((t) => t >= nowBrtHour));
    const forwardPts = allPts.slice(startIdx, startIdx + 192);
    const days = Array.from(new Set(allPts.map((p) => p.dayLabel)));

    return { hourlyPoints: forwardPts, allHourlyPoints: allPts, chartDayOptions: days };
  }, [openMeteo]);

  const displayedChartPoints = useMemo(() => {
    if (chartDayFilter === 'all') return hourlyPoints;
    return allHourlyPoints.filter((p) => p.dayLabel === chartDayFilter);
  }, [chartDayFilter, hourlyPoints, allHourlyPoints]);

  const filteredStations = useMemo(() => {
    const list = acumulados?.estacoes ?? [];
    const filtered = list.filter((st) => {
      const matchesNet = networkFilter === 'all' || st.categoria === networkFilter;
      const q = stationQuery.trim().toLowerCase();
      const matchesQ =
        !q ||
        st.nome.toLowerCase().includes(q) ||
        (st.bairro || '').toLowerCase().includes(q) ||
        st.codigo.toLowerCase().includes(q);
      return matchesNet && matchesQ;
    });
    return filtered.slice().sort((a, b) => {
      if (a.categoria === 'inea' && b.categoria !== 'inea') return 1;
      if (b.categoria === 'inea' && a.categoria !== 'inea') return -1;
      const valA = getStationRainByHours(a, rainHorizonHours) ?? -1;
      const valB = getStationRainByHours(b, rainHorizonHours) ?? -1;
      if (valB !== valA) return valB - valA;
      return (a.nome_curto || a.nome).localeCompare(b.nome_curto || b.nome);
    });
  }, [acumulados, networkFilter, stationQuery, rainHorizonHours]);

  const rainHorizonStats = useMemo(() => {
    const pluviometricas = (acumulados?.estacoes ?? []).filter((s) => s.categoria !== 'inea');
    const vals = pluviometricas
      .map((st) => ({ st, val: getStationRainByHours(st, rainHorizonHours) }))
      .filter((item): item is { st: EstacaoPluvio; val: number } => item.val !== null);
    if (vals.length === 0) {
      return {
        avg: acumulados?.resumo.media_chuva_24h ?? null,
        maxVal: acumulados?.resumo.maior_acumulado_24h ?? null,
        maxName: acumulados?.resumo.maior_estacao_nome || '--',
      };
    }
    const sum = vals.reduce((acc, item) => acc + item.val, 0);
    const top = vals.slice().sort((a, b) => b.val - a.val)[0];
    return {
      avg: sum / vals.length,
      maxVal: top.val,
      maxName: top.val > 0 ? top.st.nome_curto || top.st.nome : 'Sem chuva registrada no período',
    };
  }, [acumulados, rainHorizonHours]);

  const riverDates = useMemo(() => {
    const raw = acumulados?.estacao_rio_jundia?.historico_recente ?? [];
    return Array.from(new Set(raw.map((r) => r.datetime_brt.slice(0, 10)))).reverse();
  }, [acumulados]);

  const displayedRiverReadings = useMemo(() => {
    const raw = acumulados?.estacao_rio_jundia?.historico_recente ?? [];
    return raw.filter((r) => {
      const matchDate = riverDateFilter === 'all' || r.datetime_brt.startsWith(riverDateFilter);
      const matchInterval = riverInterval === 'all' || r.datetime_brt.includes(':00:00');
      return matchDate && matchInterval;
    });
  }, [acumulados, riverInterval, riverDateFilter]);

  const riverDayStats = useMemo(() => {
    if (displayedRiverReadings.length === 0) return null;
    const levels = displayedRiverReadings.map((r) => r.nivel);
    const min = Math.min(...levels);
    const max = Math.max(...levels);
    const latest = displayedRiverReadings[displayedRiverReadings.length - 1];
    return {
      min,
      max,
      variation: max - min,
      rain24h: latest?.chuva_24h ?? 0,
    };
  }, [displayedRiverReadings]);

  const histMonthOptions = useMemo(() => {
    return (historico?.resumo_mensal ?? []).map((m) => ({
      ano_mes: m.ano_mes,
      rotulo: m.rotulo_mes,
    }));
  }, [historico]);

  const filteredHistDaily = useMemo(() => {
    const list = historico?.resumo_diario ?? [];
    const filtered = list.filter((d) => {
      const iso = d.data_iso || '';
      const br = d.data_br || '';
      const ym = d.ano_mes || iso.slice(0, 7) || `${br.slice(6, 10)}-${br.slice(3, 5)}`;
      if (histMonthFilter !== 'all' && ym !== histMonthFilter) return false;
      const q = histDateFilter.trim().toLowerCase();
      if (q && !br.toLowerCase().includes(q) && !iso.toLowerCase().includes(q)) return false;
      if (histRainOnly && d.chuva_total_media_mm <= 0) return false;
      return true;
    });
    return histSortOrder === 'desc' ? filtered.slice().reverse() : filtered;
  }, [historico, histMonthFilter, histDateFilter, histRainOnly, histSortOrder]);

  const filteredHistHourly = useMemo(() => {
    const list = historico?.registros_horarios ?? [];
    const filtered = list.filter((h) => {
      const ym = h.data_iso.slice(0, 7);
      if (histMonthFilter !== 'all' && ym !== histMonthFilter) return false;
      const q = histDateFilter.trim().toLowerCase();
      if (q && !h.data_br.toLowerCase().includes(q) && !h.data_iso.toLowerCase().includes(q)) return false;
      if (histRainOnly && h.chuva_mm_hora <= 0 && h.chuva_max_estacao_mm <= 0) return false;
      return true;
    });
    const ordered = histSortOrder === 'desc' ? filtered.slice().reverse() : filtered;
    return ordered.slice(0, 120);
  }, [historico, histMonthFilter, histDateFilter, histRainOnly, histSortOrder]);

  const balnearSummary = useMemo(() => {
    const pts = balneabilidade?.pontos ?? [];
    const proprias = pts.filter((p) => p.status === 'PRÓPRIA');
    const improprias = pts.filter((p) => p.status !== 'PRÓPRIA');
    const total = pts.length;
    return {
      total,
      proprias,
      improprias,
      pctProprias: total > 0 ? Math.round((proprias.length / total) * 100) : 0,
      pctImproprias: total > 0 ? Math.round((improprias.length / total) * 100) : 0,
    };
  }, [balneabilidade]);

  const boletimDates = useMemo(() => {
    const map = new Map<string, string>();
    boletimOficial.forEach((row) => {
      if (!map.has(row.data_iso)) map.set(row.data_iso, row.dia_semana);
    });
    return Array.from(map.entries()).map(([data_iso, dia_semana]) => ({ data_iso, dia_semana }));
  }, [boletimOficial]);

  const activeBoletimShifts = useMemo(() => {
    const target = selectedBoletimDate || boletimDates[0]?.data_iso || '';
    return boletimOficial.filter((r) => r.data_iso === target);
  }, [boletimOficial, selectedBoletimDate, boletimDates]);

  const handleDownloadStationsCsv = () => {
    const headers = ['Codigo', 'Estacao', 'Bairro', 'Rede', '1h', '4h', '12h', '24h', '48h', '96h'];
    const rows = filteredStations.map((s) => [
      s.codigo,
      `"${s.nome}"`,
      `"${s.bairro || ''}"`,
      `"${s.rede}"`,
      s.chuva_1h ?? '',
      s.chuva_4h ?? '',
      s.chuva_12h ?? '',
      s.chuva_24h ?? '',
      s.chuva_48h ?? '',
      s.chuva_96h ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estacoes-rio-das-ostras.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadRiverCsv = () => {
    const headers = ['Data_BRT', 'Cota_m', 'Chuva_1h_mm', 'Chuva_24h_mm', 'Chuva_30d_mm'];
    const rows = displayedRiverReadings.map((r) => [
      r.datetime_brt,
      r.nivel.toFixed(2),
      r.chuva_1h.toFixed(1),
      r.chuva_24h.toFixed(1),
      r.chuva_30d.toFixed(1),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rio-jundia-telemetria.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadFilteredHistCsv = () => {
    const headers = ['Data', 'Horas_Chuva', 'Media_mm', 'Maior_mm', 'Estacao_Maior', 'Rajada_Max_kmh', 'Sistema_Atuante'];
    const rows = filteredHistDaily.map((d) => [
      d.data_br,
      d.horas_com_chuva,
      d.chuva_total_media_mm.toFixed(1),
      d.chuva_maior_estacao_mm.toFixed(1),
      `"${d.chuva_maior_estacao_nome}"`,
      d.vento_rajada_max_kmh?.toFixed(1) ?? '',
      `"${d.sistema_atuante_dia || ''}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historico-filtrado-rio-das-ostras.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const mensalOutubro = historico?.resumo_mensal?.[0];
  const panoramaCaption = mensalOutubro
    ? `PANORAMA CLIMÁTICO • RIO DAS OSTRAS (${mensalOutubro.rotulo_mes.toUpperCase()})\n\n• Média municipal de chuva: ${mensalOutubro.chuva_total_media_mm.toFixed(1)} mm\n• Dias com registro de chuva: ${mensalOutubro.dias_com_chuva} de ${mensalOutubro.dias_registrados} dias\n• Maior acumulado na rede: ${mensalOutubro.chuva_maior_estacao_mm.toFixed(1)} mm (${mensalOutubro.chuva_maior_estacao_nome})\n\nMonitoramento completo no portal TEMPO em Rio das Ostras.`
    : 'PANORAMA CLIMÁTICO • RIO DAS OSTRAS';

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(panoramaCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch {
      setCopiedCaption(false);
    }
  };

  const rj = acumulados?.estacao_rio_jundia;
  const cemadenRj = boletimMeta?.cemaden_riscos?.cemaden_rj_tempo_real;

  const activeTabItem = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];

  // Derived real-time Tempo Agora telemetry matching official site
  const hojeDiaResumo = boletimMeta?.dias_resumo?.[0];
  const hojeInspecao =
    boletimMeta?.inspecao_minuciosa_tempo_severo?.hoje_inspecao ||
    boletimMeta?.inspecao_minuciosa_tempo_severo?.dias_inspecionados?.[0];
  const liveStationTemp = acumulados?.estacoes?.find(
    (s) => s.online !== false && s.temp_atual !== undefined && s.temp_atual !== null
  );
  const currentTempVal = liveStationTemp?.temp_atual ?? openMeteo?.current?.temperature_2m;
  const currentSensacaoVal = openMeteo?.current?.apparent_temperature ?? currentTempVal;
  const currentHumVal = liveStationTemp?.umidade_atual ?? openMeteo?.current?.relative_humidity_2m;
  const currentWindVal = openMeteo?.current?.wind_speed_10m ?? liveStationTemp?.vento_atual;
  const currentGustVal = openMeteo?.current?.wind_gusts_10m ?? liveStationTemp?.rajada_atual;
  const currentPressVal = openMeteo?.current?.surface_pressure;

  const uvVal = acumulados?.uv_tempo_real?.uv ?? 0;
  const uvLabel =
    uvVal >= 11 ? 'Extremo' : uvVal >= 8 ? 'Muito Alto' : uvVal >= 6 ? 'Alto' : uvVal >= 3 ? 'Moderado' : 'Baixo';

  const humStatusLabel =
    currentHumVal !== undefined && currentHumVal !== null
      ? currentHumVal >= 80
        ? 'Ar Muito Úmido'
        : currentHumVal <= 55
          ? 'Ar Mais Seco'
          : 'Umidade Ideal'
      : 'Monitoramento contínuo';

  const pressStatusLabel =
    currentPressVal !== undefined
      ? currentPressVal >= 1016
        ? 'Alta Pressão • Estável'
        : currentPressVal <= 1011
          ? 'Baixa Pressão'
          : 'Pressão Estável'
      : 'Monitoramento contínuo';

  const marHojeOrla = orla?.praias_condicoes?.[0]?.dias?.d0;
  const heroAlertStatus =
    inmetAvisos.length > 0
      ? 'Alerta Oficial Vigente Hoje'
      : marinhaAvisos?.aviso_ativo
        ? 'Avisos da Marinha Ativos'
        : 'Normalidade Operacional';

  const todayDateFull = useMemo(() => {
    const raw = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date());
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] text-[#14213D] dark:bg-[#05080F] dark:text-white transition-colors duration-200">
      {/* Top Bar: 3 zones (Logo | Live Sync Status | Actions) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#14213D]/95 backdrop-blur-sm border-b border-[#E5E5E5] dark:border-[#233354]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FCA311] cursor-pointer"
              aria-label="Alternar menu de abas vertical"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setActiveTab('previsao');
                setSubForTab('previsao', 'tempo-agora');
              }}
              className="flex items-center shrink-0 cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCA311]"
              aria-label="Início Tempo em Rio das Ostras"
            >
              <img
                src={isDark ? LOGO_DARK : LOGO_LIGHT}
                alt="TEMPO em Rio das Ostras"
                className="h-10 sm:h-11 w-auto object-contain rounded"
              />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 dark:text-[#E5E5E5]/75 truncate">
            <span className="font-medium text-[#14213D] dark:text-white truncate">
              Portal Integrado de Meteorologia, Alerta Hidrológico & Marítimo
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono whitespace-nowrap">
              {acumulados ? `Sync ${acumulados.atualizacao}` : 'Sincronizando...'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchAll}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#0B1324] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FCA311]/70 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              onClick={() => setIsDark((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#0B1324] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FCA311]/70 transition-colors cursor-pointer whitespace-nowrap"
              aria-label="Alternar tema"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-[#FCA311]" /> : <Moon className="w-3.5 h-3.5 text-[#14213D]" />}
              <span className="hidden sm:inline">{isDark ? 'Tema Claro' : 'Tema Escuro'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Shell: Left Vertical Tabs Rail + Main Content */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6 lg:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Mobile Active Tab Bar */}
        <div className="w-full lg:hidden flex items-center justify-between gap-3 bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <activeTabItem.icon className="w-4 h-4 text-[#FCA311] shrink-0" />
            <div className="truncate">
              <div className="text-xs font-semibold text-[#14213D] dark:text-white truncate">
                {activeTabItem.label}
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/70 truncate">
                {TAB_SUBSECTIONS[activeTab].find((s) => s.id === subSection)?.label}
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] shrink-0 cursor-pointer"
          >
            {mobileMenuOpen ? 'Ocultar Abas' : 'Abas & Seções'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Vertical Tabs Navigation Sidebar */}
        <aside
          className={`${
            mobileMenuOpen ? 'block' : 'hidden'
          } lg:block w-full lg:w-72 xl:w-76 shrink-0 lg:sticky lg:top-22`}
        >
          <nav
            aria-label="Abas principais do portal"
            className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-3 space-y-1.5"
          >
            <div className="px-3 pt-1 pb-2 flex items-center justify-between border-b border-[#E5E5E5] dark:border-[#233354]/80">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/65">
                Abas do Portal
              </span>
              {boletimMeta?.emissao && (
                <span className="text-[10px] font-mono text-[#FCA311] truncate max-w-[120px]" title={boletimMeta.emissao}>
                  {boletimMeta.emissao}
                </span>
              )}
            </div>

            <div className="space-y-1 pt-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                const subsections = TAB_SUBSECTIONS[item.id];
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        setActiveTab(item.id);
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-left text-sm transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] font-semibold'
                          : 'text-slate-700 dark:text-[#E5E5E5]/85 hover:bg-slate-100 dark:hover:bg-[#0B1324]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-[#FCA311] dark:text-[#000000]' : 'text-slate-400 dark:text-[#E5E5E5]/60'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                          isActive ? 'rotate-0 opacity-90' : '-rotate-90 opacity-50'
                        }`}
                      />
                    </button>

                    {isActive && (
                      <div className="mt-1.5 mb-2 ml-4 pl-3 border-l border-[#E5E5E5] dark:border-[#233354] space-y-1">
                        {subsections.map((sub) => {
                          const isSubActive = subSection === sub.id;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => {
                                setSubForTab(item.id, sub.id);
                                setMobileMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                                isSubActive
                                  ? 'bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#FCA311] font-semibold'
                                  : 'text-slate-600 dark:text-[#E5E5E5]/70 hover:text-[#14213D] dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-[#0B1324]/70'
                              }`}
                            >
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 w-full space-y-8">
        {activeTab === 'previsao' && showSub('tempo-agora') && mensalOutubro && (
          <div className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#FCA311] border border-[#E5E5E5] dark:border-[#233354]">
                Retrospectiva Oficial
              </span>
              <span className="font-semibold text-[#14213D] dark:text-white">
                Panorama Mensal • {mensalOutubro.rotulo_mes}
              </span>
              <span className="text-slate-600 dark:text-[#E5E5E5]/75">
                Pico de {mensalOutubro.chuva_maior_estacao_mm.toFixed(0)} mm em {mensalOutubro.chuva_maior_estacao_nome}, {mensalOutubro.dias_com_chuva} dias chuvosos
                {mensalOutubro.vento_rajada_max_kmh ? ` e rajadas de ${mensalOutubro.vento_rajada_max_kmh.toFixed(1)} km/h` : ''}.
              </span>
            </div>
            <button
              onClick={() => {
                setActiveTab('panorama');
                setSubForTab('panorama', 'video');
              }}
              className="text-xs font-medium text-[#14213D] dark:text-[#FCA311] hover:underline whitespace-nowrap cursor-pointer"
            >
              Ver Vídeo & Imagens →
            </button>
          </div>
        )}

        {activeTab === 'previsao' && showSub('tempo-agora') && boletimMeta?.informe_alerta && (
          <div className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] border-l-2 border-l-[#FCA311] rounded-xl px-5 py-4 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-[#FCA311] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-[#14213D] dark:text-[#E5E5E5] leading-relaxed">
                <span className="font-semibold text-[#14213D] dark:text-[#FCA311] mr-2">Informe Operacional:</span>
                {boletimMeta.informe_alerta}
              </div>
            </div>
            <button
              onClick={() => {
                setActiveTab('alertas');
                setSubForTab('alertas', 'avisos');
              }}
              className="text-xs font-medium text-[#14213D] dark:text-[#FCA311] hover:underline whitespace-nowrap cursor-pointer"
            >
              Ir para Alertas & Sinótico →
            </button>
          </div>
        )}

        {/* ================= ABA 1: PREVISÃO & TEMPO ================= */}
        {activeTab === 'previsao' && (
          <div className="space-y-8">
            {showSub('tempo-agora') && (
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Main Tempo Agora Card */}
                <div className="lg:col-span-8 bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  {/* Topo do Tempo Agora */}
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14213D] dark:text-white text-balance">
                          Rio das Ostras, RJ — Tempo Agora
                        </h1>
                        {boletimMeta?.astronomia?.estacao_ano && (
                          <span className="text-xs font-mono text-slate-500 dark:text-[#E5E5E5]/70">
                            Estação: {boletimMeta.astronomia.estacao_ano}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-1">
                        Região dos Lagos · Costa do Sol · Estação Telemétrica Sede
                        {boletimMeta?.periodo ? ` · Boletim: ${boletimMeta.periodo}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#14213D] dark:text-white">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            inmetAvisos.length > 0 ? 'bg-[#FCA311]' : 'bg-emerald-500'
                          }`}
                          aria-hidden="true"
                        />
                        {heroAlertStatus}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 dark:text-[#E5E5E5]/70">24H</span>
                    </div>
                  </div>

                  {/* Centro: Coluna Térmica | Coluna Condição & Destaques do Dia */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-1">
                    {/* Coluna Esquerda: Temperatura & Sensação */}
                    <div className="md:col-span-5 space-y-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-6xl font-semibold tracking-tight text-[#14213D] dark:text-white tabular-nums leading-none">
                          {currentTempVal !== undefined && currentTempVal !== null ? Math.round(currentTempVal) : '--'}°
                        </span>
                        <span className="font-mono text-2xl text-[#FCA311]">C</span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-[#E5E5E5]/85">
                          <Flame className="w-4 h-4 text-[#FCA311] shrink-0" />
                          <span>
                            Sensação agora:{' '}
                            <strong className="font-mono text-[#14213D] dark:text-white tabular-nums">
                              {currentSensacaoVal !== undefined && currentSensacaoVal !== null
                                ? `${Math.round(currentSensacaoVal)}°C`
                                : '--'}
                            </strong>
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-500 dark:text-[#E5E5E5]/70 space-y-0.5">
                          <div>
                            {hojeDiaResumo?.pilares?.temp?.val
                              ? `Faixa hoje: ${hojeDiaResumo.pilares.temp.val}`
                              : openMeteo?.daily
                                ? `Mín ${Math.round(openMeteo.daily.temperature_2m_min[0])}°C · Máx ${Math.round(openMeteo.daily.temperature_2m_max[0])}°C`
                                : ''}
                          </div>
                          {hojeDiaResumo?.sensacao_faixa && (
                            <div>Sensação prevista: {hojeDiaResumo.sensacao_faixa}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Coluna Direita: Céu no Momento, Condição e Destaques */}
                    <div className="md:col-span-7 md:border-l md:border-[#E5E5E5] dark:md:border-[#233354] md:pl-6 space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-[#FCA311]" />
                          <span className="font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/65">
                            Céu:
                          </span>
                          <span className="font-semibold text-[#14213D] dark:text-white">
                            {hojeDiaResumo?.pilares?.ceu?.val ||
                              (openMeteo?.current ? wmoToPtBr(openMeteo.current.weather_code) : 'Monitoramento ativo')}
                          </span>
                        </span>
                        {hojeDiaResumo?.pilares?.agua_precipitavel?.val && (
                          <span className="font-mono text-[11px] text-slate-500 dark:text-[#E5E5E5]/70">
                            VIME: {hojeDiaResumo.pilares.agua_precipitavel.val}
                          </span>
                        )}
                      </div>

                      {(() => {
                        const rawSub =
                          hojeDiaResumo?.subtitulo ||
                          (openMeteo?.current
                            ? wmoToPtBr(openMeteo.current.weather_code)
                            : loading
                              ? 'Carregando condição atual...'
                              : 'Monitoramento contínuo em Rio das Ostras');
                        const matchParen = rawSub.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
                        const mainCond = matchParen ? matchParen[1].trim() : rawSub;
                        const alertNote = matchParen ? matchParen[2].trim() : null;
                        return (
                          <div>
                            <h2 className="font-display text-lg sm:text-xl font-semibold text-[#14213D] dark:text-white leading-snug">
                              {mainCond}
                            </h2>
                            {alertNote && (
                              <div className="text-xs font-medium text-[#FCA311] mt-1">
                                {alertNote}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {(hojeInspecao?.chuva?.janela_critica_horaria || hojeInspecao?.vento?.horario_pico) && (
                        <div className="text-xs text-slate-600 dark:text-[#E5E5E5]/80 space-y-0.5 pt-1">
                          {hojeInspecao?.chuva?.janela_critica_horaria && (
                            <div>
                              Janela de maior atenção:{' '}
                              <span className="font-mono font-semibold text-[#14213D] dark:text-white">
                                {hojeInspecao.chuva.janela_critica_horaria}
                              </span>
                            </div>
                          )}
                          {hojeInspecao?.vento?.horario_pico && (
                            <div>
                              Pico de rajadas:{' '}
                              <span className="font-mono font-semibold text-[#14213D] dark:text-white">
                                {hojeInspecao.vento.horario_pico}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Grade Completa das 8 Métricas Essenciais (Exata do Site Oficial) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-[#E5E5E5] dark:border-[#233354]">
                    {/* 1. Chuva Prevista */}
                    <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-[#E5E5E5]/65">
                        <CloudRain className="w-3.5 h-3.5 text-slate-400 dark:text-[#FCA311]/80 shrink-0" />
                        <span>Chuva Prevista</span>
                      </div>
                      <div className="font-mono text-sm sm:text-base font-semibold text-[#14213D] dark:text-white tabular-nums leading-snug">
                        {hojeDiaResumo?.pilares?.chuva?.val
                          ? hojeDiaResumo.pilares.chuva.val.split(' (')[0]
                          : openMeteo?.daily
                            ? `${openMeteo.daily.precipitation_sum[0].toFixed(1)} mm`
                            : '--'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 leading-snug">
                        {hojeInspecao?.alerta_ativo && hojeInspecao.chuva?.taxa_horaria_pico
                          ? `Pico: ${hojeInspecao.chuva.taxa_horaria_pico}`
                          : openMeteo?.daily
                            ? `Probab.: ${openMeteo.daily.precipitation_probability_max[0]}%`
                            : `Rede 24h: ${acumulados ? acumulados.resumo.media_chuva_24h.toFixed(1) : '--'} mm`}
                      </div>
                    </div>

                    {/* 2. Vento / Rajadas */}
                    <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-[#E5E5E5]/65">
                        <Wind className="w-3.5 h-3.5 text-slate-400 dark:text-[#FCA311]/80 shrink-0" />
                        <span>Vento / Rajadas</span>
                      </div>
                      <div className="font-mono text-sm sm:text-base font-semibold text-[#14213D] dark:text-white tabular-nums leading-snug">
                        {currentWindVal !== undefined && currentWindVal !== null
                          ? `${Math.round(currentWindVal)} km/h ${
                              openMeteo?.current ? degToCompass(openMeteo.current.wind_direction_10m) : ''
                            }`
                          : '--'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 leading-snug">
                        {hojeInspecao?.alerta_ativo && hojeInspecao.vento?.rajada_faixa
                          ? `Pico: ${hojeInspecao.vento.rajada_faixa}`
                          : currentGustVal !== undefined && currentGustVal !== null
                            ? `Rajadas ${Math.round(currentGustVal)} km/h`
                            : hojeDiaResumo?.pilares?.vento?.val || 'Rajadas na orla'}
                      </div>
                    </div>

                    {/* 3. Umidade do Ar */}
                    <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-[#E5E5E5]/65">
                        <Droplets className="w-3.5 h-3.5 text-slate-400 dark:text-[#FCA311]/80 shrink-0" />
                        <span>Umidade do Ar</span>
                      </div>
                      <div className="font-mono text-sm sm:text-base font-semibold text-[#14213D] dark:text-white tabular-nums leading-snug">
                        {currentHumVal !== undefined && currentHumVal !== null
                          ? `${Math.round(currentHumVal)}%`
                          : hojeDiaResumo?.pilares?.umid?.val || '--'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 leading-snug">
                        {humStatusLabel}
                        {hojeDiaResumo?.pilares?.umid?.val ? ` (${hojeDiaResumo.pilares.umid.val})` : ''}
                      </div>
                    </div>

                    {/* 4. Mar na Orla */}
                    <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-[#E5E5E5]/65">
                        <Waves className="w-3.5 h-3.5 text-slate-400 dark:text-[#FCA311]/80 shrink-0" />
                        <span>Mar na Orla</span>
                      </div>
                      <div className="font-mono text-sm sm:text-base font-semibold text-[#14213D] dark:text-white tabular-nums leading-snug">
                        {marHojeOrla?.ondas || hojeDiaResumo?.pilares?.mar?.val || orla?.mar_ondas || '--'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 leading-snug">
                        {marHojeOrla?.estado || orla?.status_geral || 'Moderado'}
                      </div>
                    </div>

                    {/* 5. Pressão Atmosférica */}
                    <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-[#E5E5E5]/65">
                        <Gauge className="w-3.5 h-3.5 text-slate-400 dark:text-[#FCA311]/80 shrink-0" />
                        <span>Pressão Atm.</span>
                      </div>
                      <div className="font-mono text-sm sm:text-base font-semibold text-[#14213D] dark:text-white tabular-nums leading-snug">
                        {currentPressVal !== undefined ? `${Math.round(currentPressVal)} hPa` : '--'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 leading-snug">
                        {pressStatusLabel}
                      </div>
                    </div>

                    {/* 6. Índice UV (IRIODA17) */}
                    <a
                      href={acumulados?.uv_tempo_real?.url_estacao || 'https://www.wunderground.com/dashboard/pws/IRIODA17'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] transition-colors space-y-1 block"
                    >
                      <div className="flex items-center justify-between gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-[#E5E5E5]/65">
                        <span className="inline-flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-slate-400 dark:text-[#FCA311]/80 shrink-0" />
                          <span>Índice UV</span>
                        </span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                      </div>
                      <div className="font-mono text-sm sm:text-base font-semibold text-[#FCA311] tabular-nums leading-snug">
                        {acumulados?.uv_tempo_real ? `${acumulados.uv_tempo_real.uv.toFixed(0)} - ${uvLabel}` : '--'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 leading-snug">
                        {acumulados?.uv_tempo_real
                          ? `${acumulados.uv_tempo_real.estacao_referencia} (${acumulados.uv_tempo_real.radiacao_solar.toFixed(0)} W/m²)`
                          : 'Tempo real • IRIODA17'}
                      </div>
                    </a>

                    {/* 7. Nascer & Pôr do Sol */}
                    <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-[#E5E5E5]/65">
                        <Sunrise className="w-3.5 h-3.5 text-slate-400 dark:text-[#FCA311]/80 shrink-0" />
                        <span>Nascer & Pôr</span>
                      </div>
                      <div className="font-mono text-sm sm:text-base font-semibold text-[#14213D] dark:text-white tabular-nums leading-snug">
                        {boletimMeta?.astronomia
                          ? `${boletimMeta.astronomia.nascer_sol} · ${boletimMeta.astronomia.por_sol}`
                          : '--'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 leading-snug">
                        {boletimMeta?.astronomia ? `${boletimMeta.astronomia.duracao_dia} de Sol` : '--'}
                      </div>
                    </div>

                    {/* 8. Fase da Lua */}
                    <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-[#E5E5E5]/65">
                        <Moon className="w-3.5 h-3.5 text-slate-400 dark:text-[#FCA311]/80 shrink-0" />
                        <span>Fase da Lua</span>
                      </div>
                      <div className="font-mono text-sm sm:text-base font-semibold text-[#14213D] dark:text-white leading-snug">
                        {boletimMeta?.astronomia?.fase_lua || '--'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 leading-snug">
                        {boletimMeta?.astronomia?.visibilidade_lua ||
                          (boletimMeta?.astronomia?.iluminacao_lua ? `Ilum. ${boletimMeta.astronomia.iluminacao_lua}` : '--')}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé do Tempo Agora */}
                  <div className="pt-3 border-t border-[#E5E5E5] dark:border-[#233354] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#E5E5E5]/70">
                    <span className="font-semibold text-[#14213D] dark:text-white">{todayDateFull}</span>
                    <span className="font-mono">
                      Atualização em Tempo Real {acumulados ? `· Sync ${acumulados.atualizacao}` : ''}
                    </span>
                  </div>
                </div>

                {/* Mapa Geográfico RJ + KPIs Operacionais */}
                <div className="lg:col-span-4 bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 flex flex-col justify-between space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-[#E5E5E5]/80">
                      <MapPin className="w-3.5 h-3.5 text-[#FCA311] shrink-0" />
                      <span>Localização · Rio das Ostras RJ</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500 dark:text-[#E5E5E5]/65">22.52°S 41.94°W</span>
                  </div>

                  <div className="w-full rounded-lg overflow-hidden border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#0B1324] flex items-center justify-center p-2">
                    <img
                      src={`${SITE_BASE}/${isDark ? 'img/mapa_rj_marcado_hd_dark.png' : 'img/mapa_rj_marcado_hd.png'}`}
                      alt="Mapa do Estado do Rio de Janeiro com marcação de Rio das Ostras"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto max-h-64 object-contain rounded"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E5E5E5] dark:border-[#233354]">
                    <div>
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/65">Rio Jundiá (INEA)</div>
                      <div className="font-mono text-xs sm:text-sm font-semibold text-[#14213D] dark:text-white mt-0.5 tabular-nums">
                        {rj ? `${rj.nivel_rio} · ${rj.status_rio}` : boletimMeta?.kpis?.jundia_nivel || '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/65">Média Rede 24h</div>
                      <div className="font-mono text-xs sm:text-sm font-semibold text-[#14213D] dark:text-white mt-0.5 tabular-nums">
                        {acumulados ? `${acumulados.resumo.media_chuva_24h.toFixed(1)} mm` : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/65">Chuva Prev. 4 Dias</div>
                      <div className="font-mono text-xs sm:text-sm font-semibold text-[#FCA311] mt-0.5 tabular-nums">
                        {boletimMeta?.kpis?.chuva_4d || '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/65">PLANCON / Marinha</div>
                      <div className="font-mono text-xs sm:text-sm font-semibold text-[#14213D] dark:text-white mt-0.5">
                        {boletimMeta?.kpis ? `${boletimMeta.kpis.plancon_status} · ${boletimMeta.kpis.aviso_marinha}` : '--'}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {showSub('graficos') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[#14213D] dark:text-white">
                      Gráficos de Tendência Horária
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-0.5">
                      Evolução contínua projetada pelos modelos numéricos de alta resolução
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg overflow-x-auto">
                      {(
                        [
                          { id: 'temp', label: 'Temperatura' },
                          { id: 'rain', label: 'Chuva' },
                          { id: 'wind', label: 'Vento' },
                          { id: 'pressure', label: 'Pressão' },
                          { id: 'humidity', label: 'Umidade' },
                        ] as { id: ChartMetric; label: string }[]
                      ).map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setChartMetric(m.id)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            chartMetric === m.id
                              ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] font-semibold'
                              : 'text-slate-600 dark:text-[#E5E5E5]/75'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg overflow-x-auto max-w-full">
                      {[
                        { label: '24h', count: 24 },
                        { label: '48h', count: 48 },
                        { label: '72h', count: 72 },
                        { label: '96h', count: 96 },
                        { label: '120h', count: 120 },
                        { label: '144h', count: 144 },
                        { label: '168h', count: 168 },
                        { label: '192h', count: 192 },
                      ].map((h) => (
                        <button
                          key={h.label}
                          onClick={() => {
                            setChartDayFilter('all');
                            setHorizonCount(h.count);
                          }}
                          className={`px-2.5 py-1.5 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            chartDayFilter === 'all' && horizonCount === h.count
                              ? 'bg-white dark:bg-[#14213D] text-[#14213D] dark:text-[#FCA311] font-semibold'
                              : 'text-slate-500 dark:text-[#E5E5E5]/70'
                          }`}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>

                    {chartDayOptions.length > 0 && (
                      <select
                        value={chartDayFilter}
                        onChange={(e) => setChartDayFilter(e.target.value)}
                        aria-label="Filtrar dia específico no gráfico"
                        className="px-2.5 py-1.5 text-xs font-mono rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#FCA311]/50 cursor-pointer"
                      >
                        <option value="all">Todos os dias</option>
                        {chartDayOptions.map((d, idx) => (
                          <option key={d} value={d}>
                            {idx === 0 ? `Hoje (${d})` : d}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      onClick={() => setShowChartValues((v) => !v)}
                      className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                        showChartValues
                          ? 'bg-[#14213D] dark:bg-[#FCA311] border-[#14213D] dark:border-[#FCA311] text-white dark:text-[#000000] font-semibold'
                          : 'border-[#E5E5E5] dark:border-[#233354] text-slate-500 dark:text-[#E5E5E5]/70 hover:border-[#FCA311]'
                      }`}
                    >
                      Valores: {showChartValues ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                <HourlyChart
                  data={displayedChartPoints}
                  metric={chartMetric}
                  horizonCount={chartDayFilter === 'all' ? horizonCount : 24}
                  showValues={showChartValues}
                />
              </section>
            )}

            {showSub('proximos-dias') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-5">
                <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#E5E5E5] dark:border-[#233354] pb-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[#14213D] dark:text-white">
                      Previsão dos Próximos Dias (1 Semana à Frente)
                    </h2>
                    {boletimMeta?.periodo && (
                      <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-0.5">
                        {boletimMeta.periodo}
                      </p>
                    )}
                  </div>
                </div>

                {boletimMeta?.dias_resumo && boletimMeta.dias_resumo.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {boletimMeta.dias_resumo.map((d, idx) => {
                      const omMin = openMeteo?.daily?.temperature_2m_min?.[idx];
                      const omMax = openMeteo?.daily?.temperature_2m_max?.[idx];
                      const omRain = openMeteo?.daily?.precipitation_sum?.[idx];
                      const textoOficial =
                        Array.isArray(d.informe_populacao) && d.informe_populacao.length > 0
                          ? d.informe_populacao.join(' ')
                          : d.descricao;
                      const hasAlert =
                        d.badge?.toUpperCase().includes('AVISO') ||
                        d.badge?.toUpperCase().includes('ATENÇÃO') ||
                        d.badge_tipo === 'warning';

                      const cardBgClass = isDark
                        ? 'bg-[#0B1324] border-[#233354]'
                        : hasAlert
                        ? 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 border-amber-300/90 shadow-xs'
                        : 'bg-gradient-to-br from-sky-50/60 via-white to-slate-50/60 border-sky-200/80 shadow-xs';

                      const leftBorderClass = hasAlert ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-sky-500';

                      return (
                        <div
                          key={d.dia}
                          className={`p-5 rounded-xl transition-all space-y-3.5 border ${leftBorderClass} ${cardBgClass}`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Calendar className={`w-4 h-4 ${hasAlert ? (isDark ? 'text-[#FCA311]' : 'text-amber-600') : (isDark ? 'text-sky-400' : 'text-sky-600')} shrink-0`} />
                              <span className={`font-display text-sm font-bold ${isDark ? 'text-white' : 'text-[#14213D]'}`}>
                                {d.dia}
                              </span>
                            </div>
                            {d.badge && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight border ${
                                  hasAlert
                                    ? isDark
                                      ? 'bg-amber-950/60 text-[#FCA311] border-amber-700/60'
                                      : 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                                    : isDark
                                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/60'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs'
                                }`}
                              >
                                {hasAlert && <AlertTriangle className={`w-3 h-3 ${isDark ? 'text-[#FCA311]' : 'text-amber-600'}`} />}
                                {d.badge}
                              </span>
                            )}
                          </div>

                          <div className={`text-xs font-semibold ${isDark ? 'text-[#E5E5E5]/90' : 'text-slate-700'}`}>
                            {d.subtitulo}
                          </div>

                          {d.pilares && (
                            <div className="grid grid-cols-2 gap-2.5 text-[11px] font-mono">
                              {d.pilares.temp?.val && (
                                <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#14213D] border-[#233354]' : 'bg-gradient-to-br from-orange-50 to-amber-50/80 border-orange-200 shadow-2xs'}`}>
                                  <span className={`${isDark ? 'text-orange-400' : 'text-orange-700'} font-bold uppercase text-[9.5px] flex items-center gap-1`}>
                                    <Thermometer className="w-3.5 h-3.5 text-orange-500" /> Temperatura
                                  </span>
                                  <span className={`font-bold ${isDark ? 'text-white' : 'text-orange-950'} text-xs leading-snug block mt-0.5`}>
                                    {d.pilares.temp.val}
                                  </span>
                                </div>
                              )}
                              {d.pilares.chuva?.val && (
                                <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#14213D] border-[#233354]' : 'bg-gradient-to-br from-sky-50 to-blue-50/80 border-sky-200 shadow-2xs'}`}>
                                  <span className={`${isDark ? 'text-sky-400' : 'text-sky-700'} font-bold uppercase text-[9.5px] flex items-center gap-1`}>
                                    <CloudRain className="w-3.5 h-3.5 text-sky-500" /> Chuva
                                  </span>
                                  <span className={`font-bold ${isDark ? 'text-white' : 'text-sky-950'} text-xs leading-snug block mt-0.5`}>
                                    {d.pilares.chuva.val.split(' (')[0]}
                                  </span>
                                </div>
                              )}
                              {d.pilares.vento?.val && (
                                <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#14213D] border-[#233354]' : 'bg-gradient-to-br from-teal-50 to-emerald-50/80 border-teal-200 shadow-2xs'}`}>
                                  <span className={`${isDark ? 'text-teal-400' : 'text-teal-700'} font-bold uppercase text-[9.5px] flex items-center gap-1`}>
                                    <Wind className="w-3.5 h-3.5 text-teal-500" /> Vento
                                  </span>
                                  <span className={`font-bold ${isDark ? 'text-white' : 'text-teal-950'} text-xs leading-snug block mt-0.5`}>
                                    {d.pilares.vento.val}
                                  </span>
                                </div>
                              )}
                              {d.pilares.mar?.val && (
                                <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#14213D] border-[#233354]' : 'bg-gradient-to-br from-indigo-50 to-blue-50/80 border-indigo-200 shadow-2xs'}`}>
                                  <span className={`${isDark ? 'text-indigo-400' : 'text-indigo-700'} font-bold uppercase text-[9.5px] flex items-center gap-1`}>
                                    <Waves className="w-3.5 h-3.5 text-indigo-500" /> Mar na Orla
                                  </span>
                                  <span className={`font-bold ${isDark ? 'text-white' : 'text-indigo-950'} text-xs leading-snug block mt-0.5`}>
                                    {d.pilares.mar.val}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {textoOficial && (
                            <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#14213D]/60 border-[#233354]/60' : 'bg-white/80 border-slate-200/80 shadow-2xs'}`}>
                              <p className={`text-xs ${isDark ? 'text-[#E5E5E5]/90' : 'text-slate-700'} leading-relaxed text-justify`}>
                                {textoOficial}
                              </p>
                            </div>
                          )}

                          {!d.pilares && omMin !== undefined && omMax !== undefined && (
                            <div className={`pt-2 border-t ${isDark ? 'border-[#233354] text-[#E5E5E5]/75' : 'border-[#E5E5E5] text-slate-500'} flex items-center gap-4 font-mono text-xs`}>
                              <span>Mín {Math.round(omMin)}°C / Máx {Math.round(omMax)}°C</span>
                              {omRain !== undefined && <span>Chuva: {omRain.toFixed(1)} mm</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>) : (
                  <div className="divide-y divide-[#E5E5E5] dark:divide-[#233354]">
                    {openMeteo?.daily?.time?.map((iso, i) => (
                      <div key={iso} className="py-3 flex items-center justify-between text-sm font-mono">
                        <span>{formatDateBr(iso)}</span>
                        <span>Chuva: {openMeteo.daily.precipitation_sum[i].toFixed(1)} mm ({openMeteo.daily.precipitation_probability_max[i]}%)</span>
                        <span>
                          {Math.round(openMeteo.daily.temperature_2m_min[i])}° /{' '}
                          <strong className="text-[#FCA311]">{Math.round(openMeteo.daily.temperature_2m_max[i])}°</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inspeção Minuciosa de Tempo Severo (Distribuição Geográfica & Impactos) */}
                {boletimMeta?.inspecao_minuciosa_tempo_severo?.dias_inspecionados &&
                  boletimMeta.inspecao_minuciosa_tempo_severo.dias_inspecionados.length > 0 && (
                    <div className="pt-5 border-t border-[#E5E5E5] dark:border-[#233354] space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="font-display text-base font-semibold text-[#14213D] dark:text-white">
                            Inspeção Minuciosa de Tempo Severo & Distribuição Geográfica
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-0.5">
                            Detalhamento setorial (Orla, Centro e Zona Rural), comportamento hidrológico e rajadas por dia
                          </p>
                        </div>
                        {boletimMeta.inspecao_minuciosa_tempo_severo.status_geral_badge && (
                          <span className="text-[11px] font-mono font-bold uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 dark:bg-[#0B1324] dark:text-[#FCA311] dark:border-[#233354] shadow-2xs">
                            {boletimMeta.inspecao_minuciosa_tempo_severo.status_geral_badge}
                          </span>
                        )}
                      </div>

                      <div className="space-y-4">
                        {boletimMeta.inspecao_minuciosa_tempo_severo.dias_inspecionados.slice(0, 3).map((ins, i) => (
                          <div
                            key={ins.data_iso || i}
                            className="p-4 sm:p-5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="font-display text-sm font-semibold text-[#14213D] dark:text-white">
                                {ins.dia_semana} · {ins.data_br}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                                {ins.alerta_rotulo && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 dark:bg-[#14213D] dark:text-[#FCA311] dark:border-[#233354] font-bold shadow-2xs inline-flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-[#FCA311]" />
                                    {ins.alerta_rotulo}
                                  </span>
                                )}
                                {ins.chuva?.faixa_completa_txt && (
                                  <span className="text-[#14213D] dark:text-white font-semibold">
                                    {ins.chuva.faixa_completa_txt}
                                  </span>
                                )}
                              </div>
                            </div>

                            {ins.alerta_riscos && (
                              <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed">
                                {ins.alerta_riscos}
                              </p>
                            )}

                            {ins.chuva?.distribuicao_geografica && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                                {Object.values(ins.chuva.distribuicao_geografica).map((setor) => (
                                  <div
                                    key={setor.regiao}
                                    className="p-3 rounded-lg bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 dark:bg-[#14213D] border border-amber-200/80 dark:border-[#233354] shadow-2xs space-y-1 text-xs"
                                  >
                                    <div className="font-bold text-[#14213D] dark:text-white">{setor.regiao}</div>
                                    <div className="font-mono text-amber-700 dark:text-[#FCA311] font-bold">
                                      {setor.volume_estimado}
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/75 leading-snug">
                                      {setor.caracteristica}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {(ins.vento?.rotacao || ins.chuva?.hidrologia_jundia?.diagnostico) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                                {ins.vento?.rotacao && (
                                  <div className="p-3 rounded bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] space-y-1">
                                    <div className="font-semibold text-[#14213D] dark:text-white">
                                      Vento: {ins.vento.rajada_faixa || ''} ({ins.vento.horario_pico || ''})
                                    </div>
                                    <div className="text-[11px] text-slate-600 dark:text-[#E5E5E5]/80">
                                      {ins.vento.rotacao}
                                      {ins.vento.impacto_infraestrutura ? ` · ${ins.vento.impacto_infraestrutura}` : ''}
                                    </div>
                                  </div>
                                )}
                                {ins.chuva?.hidrologia_jundia?.diagnostico && (
                                  <div className="p-3 rounded bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] space-y-1">
                                    <div className="font-semibold text-[#14213D] dark:text-white">
                                      Rio Jundiá: {ins.chuva.hidrologia_jundia.cota_atual_m} m ({ins.chuva.hidrologia_jundia.status})
                                    </div>
                                    <div className="text-[11px] text-slate-600 dark:text-[#E5E5E5]/80">
                                      {ins.chuva.hidrologia_jundia.diagnostico}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </section>
            )}

            {showSub('sinotico') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-5">
                <div className="border-b border-[#E5E5E5] dark:border-[#233354] pb-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="font-display text-xl font-semibold text-[#14213D] dark:text-white">
                      Panorama Sinótico Geral
                    </h2>
                    {boletimMeta?.periodo && (
                      <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border ${
                        isDark ? 'bg-[#0B1324] text-[#FCA311] border-[#233354]' : 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                      }`}>
                        {boletimMeta.periodo}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/80 mt-1.5 leading-relaxed">
                    Diagnóstico sinótico e termodinâmico da troposfera, modelagem numérica de mesoescala (ECMWF/GFS/COSMO), hidrometeorologia da Bacia do Rio Jundiá e oceanografia costeira (Carta Sinótica CHM 12Z)
                  </p>
                </div>

                {boletimMeta?.sinopse_geral ? (
                  <div className="space-y-4">
                    {boletimMeta.sinopse_geral.split('\n\n')
                      .filter((p) => p.trim())
                      .map((paragrafo, idx) => {
                        const metaCards = [
                          {
                            tag: 'Escoamento & Dinâmica Sinótica',
                            title: 'Configuração Sinótica Regional, Campos de Pressão & Escoamento Troposférico',
                            badgeTech: 'ASAS (1020 hPa) • Cavados em 500 hPa • Advecção de Umidade',
                            borderLeft: 'border-l-blue-500',
                            cardBg: isDark ? 'bg-[#0B1324] border-[#233354]' : 'bg-gradient-to-br from-blue-50/60 via-white to-sky-50/40 border-blue-200/90 shadow-xs',
                            chipStyle: isDark ? 'bg-blue-950/60 text-blue-300 border-blue-700/60' : 'bg-blue-100 text-blue-900 border-blue-300 shadow-2xs',
                            techStyle: isDark ? 'bg-blue-950/40 text-blue-200 border-blue-800/40' : 'bg-blue-50 text-blue-800 border-blue-200',
                            icon: Compass,
                            iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
                          },
                          {
                            tag: 'Termodinâmica & Hidrometeorologia',
                            title: 'Termodinâmica Atmosférica, Instabilidade Convectiva & Resposta Hidrológica do Rio Jundiá',
                            badgeTech: 'Convecção Diurna • Índices CAPE / CINE • Telemetria INEA 2241036',
                            borderLeft: 'border-l-amber-500',
                            cardBg: isDark ? 'bg-[#0B1324] border-[#233354]' : 'bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 border-amber-200/90 shadow-xs',
                            chipStyle: isDark ? 'bg-amber-950/60 text-[#FCA311] border-amber-700/60' : 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs',
                            techStyle: isDark ? 'bg-amber-950/40 text-amber-200 border-amber-800/40' : 'bg-amber-50 text-amber-800 border-amber-200',
                            icon: Zap,
                            iconColor: isDark ? 'text-[#FCA311]' : 'text-amber-600',
                          },
                          {
                            tag: 'Modelagem Numérica & Oceanografia',
                            title: 'Prognóstico Numérico de Mesoescala (ECMWF/GFS), Oceanografia Costeira & Tendência',
                            badgeTech: 'Modelos ECMWF/GFS 12Z • Swell E/SE • Área Delta CHM',
                            borderLeft: 'border-l-teal-500',
                            cardBg: isDark ? 'bg-[#0B1324] border-[#233354]' : 'bg-gradient-to-br from-teal-50/60 via-white to-emerald-50/40 border-teal-200/90 shadow-xs',
                            chipStyle: isDark ? 'bg-teal-950/60 text-teal-300 border-teal-700/60' : 'bg-teal-100 text-teal-900 border-teal-300 shadow-2xs',
                            techStyle: isDark ? 'bg-teal-950/40 text-teal-200 border-teal-800/40' : 'bg-teal-50 text-teal-800 border-teal-200',
                            icon: Waves,
                            iconColor: isDark ? 'text-teal-400' : 'text-teal-600',
                          },
                        ];
                        const metaItem = metaCards[idx] || {
                          tag: `Tópico ${idx + 1}`,
                          title: `Diagnóstico Técnico — Setor ${idx + 1}`,
                          badgeTech: 'Telemetria Municipal',
                          borderLeft: 'border-l-[#FCA311]',
                          cardBg: isDark ? 'bg-[#0B1324] border-[#233354]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100/50 border-slate-200',
                          chipStyle: isDark ? 'bg-[#14213D] text-[#FCA311] border-[#233354]' : 'bg-slate-100 text-[#14213D] border-slate-300',
                          techStyle: isDark ? 'bg-[#0B1324] text-[#E5E5E5]/70 border-[#233354]' : 'bg-slate-50 text-slate-700 border-slate-200',
                          icon: Activity,
                          iconColor: isDark ? 'text-[#FCA311]' : 'text-[#14213D]',
                        };
                        const IconComponent = metaItem.icon;
                        return (
                          <div
                            key={idx}
                            className={`p-4 sm:p-5 rounded-xl border border-l-4 ${metaItem.borderLeft} ${metaItem.cardBg} shadow-xs space-y-3`}
                          >
                            <div className={`flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b ${isDark ? 'border-[#233354]' : 'border-slate-200/80'}`}>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[10.5px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${metaItem.chipStyle}`}>
                                  <IconComponent className={`w-3 h-3 ${metaItem.iconColor}`} />
                                  {metaItem.tag}
                                </span>
                                <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-[#14213D]'}`}>
                                  {metaItem.title}
                                </h3>
                              </div>
                              <span className={`text-[10.5px] font-mono px-2.5 py-0.5 rounded-full border ${metaItem.techStyle}`}>
                                {metaItem.badgeTech}
                              </span>
                            </div>
                            <p className={`text-xs sm:text-sm ${isDark ? 'text-[#E5E5E5]/90' : 'text-slate-700'} leading-relaxed text-justify`}>
                              {paragrafo}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-700 dark:text-[#E5E5E5]/90 leading-relaxed">
                    Carregando diagnóstico sinótico oficial...
                  </p>
                )}

                {boletimMeta?.glossario && boletimMeta.glossario.length > 0 && (
                  <div className="pt-4 border-t border-[#E5E5E5] dark:border-[#233354] space-y-3">
                    <h3 className="font-display text-sm font-semibold text-[#14213D] dark:text-white">
                      Glossário Técnico Meteorológico
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {boletimMeta.glossario.map((g) => (
                        <div
                          key={g.termo}
                          className={`p-3.5 rounded-lg border space-y-1 text-xs ${
                            isDark ? 'bg-[#0B1324] border-[#233354]' : 'bg-gradient-to-br from-slate-50 to-amber-50/30 border-slate-200'
                          }`}
                        >
                          <div className={`font-semibold ${isDark ? 'text-[#FCA311]' : 'text-amber-800'}`}>{g.termo}</div>
                          <div className={`${isDark ? 'text-[#E5E5E5]/80' : 'text-slate-600'} leading-snug`}>{g.def}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {showSub('plancon') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-semibold text-[#14213D] dark:text-white">
                        Limiares de Chuva & Impactos — PLANCON Rio das Ostras
                      </h2>
                      <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#FCA311] border border-[#E5E5E5] dark:border-[#233354]">
                        Plano Oficial 2025/2026
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-1">
                      Quantidades críticas de precipitação (mm/24h), cenários de risco, áreas vulneráveis e protocolos de resposta
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={PLANCON_PDF_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FCA311] transition-colors"
                    >
                      Baixar PLANCON 4.0 (PDF) <ExternalLink className="w-3 h-3 text-[#FCA311]" />
                    </a>
                    <a
                      href={PLANCON_EL_NINO_PDF_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FCA311] transition-colors"
                    >
                      PLANCON El Niño (PDF) <ExternalLink className="w-3 h-3 text-[#FCA311]" />
                    </a>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg">
                  {(
                    [
                      { id: 'limiares', label: 'Limiares de Chuva (mm/24h)' },
                      { id: 'bairros', label: 'Bairros & Áreas Vulneráveis' },
                      { id: 'niveis', label: 'Níveis Operacionais (R1 a R4)' },
                      { id: 'resposta', label: 'Como o Município Responde' },
                      { id: 'elnino', label: 'Riscos El Niño (2026/2027)' },
                    ] as { id: PlanconSubTab; label: string }[]
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setPlanconTab(t.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                        planconTab === t.id
                          ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] font-semibold'
                          : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white font-medium'
                      }`}
                    >
                      <span>{t.label}</span>
                      {t.id === 'elnino' && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${
                            planconTab === t.id
                              ? 'bg-white/15 dark:bg-black/15 text-current'
                              : 'bg-white dark:bg-[#14213D] text-slate-600 dark:text-[#FCA311] border border-[#E5E5E5] dark:border-[#233354]'
                          }`}
                        >
                          SUBDEC
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {planconTab === 'limiares' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {PLANCON_LIMIARES.map((l) => {
                      const dotColor = {
                        normal: 'bg-emerald-500',
                        observacao: 'bg-amber-400',
                        atencao: 'bg-[#FA824C]',
                        alerta: 'bg-rose-500',
                        maximo: 'bg-purple-500',
                      }[l.tone];

                      return (
                        <div
                          key={l.nivel}
                          className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex flex-col justify-between space-y-2.5"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                              <span className="text-xs font-semibold text-[#14213D] dark:text-white">{l.nivel}</span>
                            </div>
                            <div className="font-mono text-sm font-semibold text-[#FCA311]">
                              {l.volume}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/80 leading-relaxed">{l.impacto}</p>
                            <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 pt-0.5">
                              Geologia: {l.geologia}
                            </div>
                          </div>
                          <div className="pt-2 border-t border-[#E5E5E5] dark:border-[#233354] text-xs font-mono text-slate-500 dark:text-[#E5E5E5]/65">
                            {l.acao}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {planconTab === 'bairros' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {PLANCON_AREAS_VULNERAVEIS.map((cat) => (
                        <div
                          key={cat.categoria}
                          className="p-5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-3"
                        >
                          <div>
                            <div className="font-display text-sm font-semibold text-[#14213D] dark:text-[#FCA311]">
                              {cat.categoria}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500 dark:text-[#E5E5E5]/65 mt-0.5">
                              {cat.cobrade}
                            </div>
                          </div>
                          <div className="space-y-2.5 pt-1 border-t border-[#E5E5E5] dark:border-[#233354]">
                            {cat.locais.map((loc) => (
                              <div key={loc.titulo} className="text-xs">
                                <div className="font-semibold text-[#14213D] dark:text-white">{loc.titulo}</div>
                                <div className="text-slate-600 dark:text-[#E5E5E5]/80 mt-0.5">{loc.descricao}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {boletimMeta?.impactos_bairros && boletimMeta.impactos_bairros.length > 0 && (
                      <div className="pt-4 border-t border-[#E5E5E5] dark:border-[#233354] space-y-3">
                        <h3 className="font-display text-base font-semibold text-[#14213D] dark:text-white">
                          Impactos Operacionais por Setor / Bairro
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {boletimMeta.impactos_bairros.map((ib) => (
                            <div
                              key={ib.setor}
                              className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1.5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-semibold text-xs sm:text-sm text-[#14213D] dark:text-white">{ib.setor}</span>
                                <span className="font-mono text-xs text-[#FCA311]">
                                  {ib.risco_sab} · {ib.risco_dom} · {ib.risco_seg}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/80">{ib.impactos}</p>
                              <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70">{ib.acoes}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {planconTab === 'niveis' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PLANCON_NIVEIS_OPERACIONAIS.map((n, idx) => {
                      const dotColor = ['bg-emerald-500', 'bg-amber-400', 'bg-[#FA824C]', 'bg-rose-500'][idx % 4];
                      return (
                        <div
                          key={n.codigo}
                          className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                            <div className="font-display text-sm font-semibold text-[#14213D] dark:text-white">{n.codigo}</div>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed">{n.descricao}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {planconTab === 'resposta' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PLANCON_RESPOSTA_MUNICIPAL.map((r) => (
                      <div
                        key={r.titulo}
                        className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1.5"
                      >
                        <div className="font-display text-sm font-semibold text-[#14213D] dark:text-[#FCA311]">
                          {r.titulo}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed">{r.descricao}</p>
                      </div>
                    ))}
                  </div>
                )}

                {planconTab === 'elnino' && (
                  <div className="space-y-6">
                    {/* Cabeçalho Oficial & Comportamento do El Niño */}
                    <div className="p-5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {PLANCON_EL_NINO.badges.map((b, i) => (
                              <span
                                key={b}
                                className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded border ${
                                  i === 0
                                    ? 'bg-[#14213D] text-white border-[#14213D] dark:bg-[#FCA311] dark:text-[#000000] dark:border-[#FCA311]'
                                    : 'bg-white dark:bg-[#14213D] text-slate-600 dark:text-[#E5E5E5]/80 border-[#E5E5E5] dark:border-[#233354]'
                                }`}
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                          <h3 className="font-display text-base sm:text-lg font-semibold text-[#14213D] dark:text-white pt-1">
                            {PLANCON_EL_NINO.titulo}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/75">
                            {PLANCON_EL_NINO.subtitulo}
                          </p>
                        </div>

                        <a
                          href={PLANCON_EL_NINO_PDF_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#14213D] text-[#14213D] dark:text-white hover:border-[#FCA311] shrink-0 transition-colors"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5 text-[#FCA311]" />
                          Baixar PLANCON El Niño (PDF Oficial 64 pág.)
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="p-4 rounded-lg bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 font-semibold text-[#14213D] dark:text-white">
                          <AlertTriangle className="w-4 h-4 text-[#FCA311] shrink-0" />
                          <span>{PLANCON_EL_NINO.comportamentoTitulo}</span>
                        </div>
                        <p className="text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed text-justify">
                          {PLANCON_EL_NINO.resumo}
                        </p>
                      </div>
                    </div>

                    {/* Os 4 Principais Riscos Mapeados (COBRADE) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#14213D] dark:text-white">
                          <ShieldAlert className="w-4 h-4 text-[#FCA311]" />
                          <span>Os 4 Principais Riscos Mapeados em Rio das Ostras (Classificação COBRADE)</span>
                        </h4>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/65 hidden sm:inline">
                          Pág. 9 do PLANCON
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {PLANCON_EL_NINO.riscosCobrade.map((r) => (
                          <div
                            key={r.codigo}
                            className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-2">
                              <span className="inline-block text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-white dark:bg-[#14213D] text-slate-600 dark:text-[#E5E5E5]/80 border border-[#E5E5E5] dark:border-[#233354]">
                                {r.codigo}
                              </span>
                              <div className="font-display text-sm font-semibold text-[#14213D] dark:text-white leading-snug">
                                {r.titulo}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed">
                                {r.resumo}
                              </p>
                              <ul className="space-y-1.5 pt-2 border-t border-[#E5E5E5] dark:border-[#233354] text-[11px] text-slate-600 dark:text-[#E5E5E5]/80 leading-snug">
                                {r.bullets.map((b) => (
                                  <li key={b}>• {b}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="pt-2 border-t border-[#E5E5E5] dark:border-[#233354] text-[11px] font-mono font-semibold text-[#FCA311]">
                              {r.gatilho}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Matriz Operacional dos Níveis de Alerta do GAE / SUBDEC */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#14213D] dark:text-white">
                          <Gauge className="w-4 h-4 text-[#FCA311]" />
                          <span>Matriz Operacional dos Níveis de Alerta do GAE / SUBDEC</span>
                        </h4>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/65 hidden sm:inline">
                          Págs. 22-24, 32 e 43 do PLANCON
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {PLANCON_EL_NINO.matrizAlertaGae.map((m) => {
                          const dotColor = {
                            emerald: 'bg-emerald-500',
                            amber: 'bg-amber-400',
                            orange: 'bg-[#FA824C]',
                            red: 'bg-rose-500',
                            purple: 'bg-purple-500',
                          }[m.cor];

                          return (
                            <div
                              key={m.nivel}
                              className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex flex-col justify-between space-y-2.5"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#14213D] dark:text-white">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                                    {m.nivel}
                                  </span>
                                  <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-[#E5E5E5]/70">
                                    {m.status}
                                  </span>
                                </div>
                                <div className="font-mono text-[11px] text-[#14213D] dark:text-[#E5E5E5] space-y-0.5 pt-1.5 border-t border-[#E5E5E5] dark:border-[#233354]">
                                  <div>• Temp: {m.temp}</div>
                                  <div>• URA: {m.ura}</div>
                                  <div>• Vento: {m.vento}</div>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-[#E5E5E5]/80 pt-1.5 border-t border-[#E5E5E5] dark:border-[#233354] leading-snug">
                                  {m.descricao}
                                </p>
                              </div>
                              <div className="pt-1.5 border-t border-[#E5E5E5] dark:border-[#233354] text-[10px] font-mono font-semibold text-[#FCA311]">
                                {m.acao}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Protocolos Integrados das Secretarias Municipais (SIMDEC) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#14213D] dark:text-white">
                          <Flame className="w-4 h-4 text-[#FCA311]" />
                          <span>Protocolos Integrados das Secretarias Municipais (SIMDEC)</span>
                        </h4>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/65 hidden sm:inline">
                          Ações Articuladas
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {PLANCON_EL_NINO.protocolosSimdec.map((p) => (
                          <div
                            key={p.orgao}
                            className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-2"
                          >
                            <div className="text-xs font-semibold uppercase text-[#14213D] dark:text-[#FCA311]">
                              {p.orgao}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed">
                              {p.descricao}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Guia Rápido de Autoproteção do Cidadão */}
                    <div className="p-5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-3">
                      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#14213D] dark:text-white">
                        <Check className="w-4 h-4 text-[#FCA311]" />
                        <span>Guia Rápido de Autoproteção do Cidadão (Recomendações da Defesa Civil)</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {PLANCON_EL_NINO.guiaAutoprotecao.map((g) => (
                          <div
                            key={g.titulo}
                            className="p-4 rounded-lg bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] space-y-2"
                          >
                            <div className="text-xs font-semibold text-[#14213D] dark:text-white">
                              {g.titulo}
                            </div>
                            <ul className="space-y-1 text-xs text-slate-600 dark:text-[#E5E5E5]/85 leading-snug">
                              {g.itens.map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Canais de Emergência & Cadastro SMS 40199 */}
                    <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-[#FCA311] shrink-0" />
                        <div>
                          <div className="font-semibold text-[#14213D] dark:text-white">
                            Canais de Emergência e Alerta da Defesa Civil:
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-[#E5E5E5]/75">
                            Plantão municipal 24h para atendimento imediato de ocorrências
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 font-mono">
                        <a href="tel:199" className="px-2.5 py-1 rounded bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] font-semibold text-[#14213D] dark:text-white transition-colors">
                          Defesa Civil: 199
                        </a>
                        <a href="tel:193" className="px-2.5 py-1 rounded bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] font-semibold text-[#14213D] dark:text-white transition-colors">
                          Bombeiros: 193
                        </a>
                        <a href="tel:192" className="px-2.5 py-1 rounded bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] font-semibold text-[#14213D] dark:text-white transition-colors">
                          SAMU: 192
                        </a>
                        <a href="tel:153" className="px-2.5 py-1 rounded bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] font-semibold text-[#14213D] dark:text-white transition-colors">
                          Guarda Civil: 153
                        </a>
                        <span className="px-2.5 py-1 rounded bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-white">
                          SMS Alerta Grátis: <strong className="text-[#FCA311]">Envie CEP para 40199</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* ================= ABA 2: ACUMULADOS CHUVA ================= */}
        {activeTab === 'chuva' && (
          <div className="space-y-6">
            {/* Sub-aba 1: Resumo & KPIs */}
            {showSub('resumo') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-semibold text-[#14213D] dark:text-white">
                      Resumo Pluviométrico & Telemetria Municipal
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
                      Síntese da rede oficial no horizonte de {rainHorizonHours}h · Atualização: {acumulados?.atualizacao || '--'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg">
                    {[1, 4, 12, 24, 36, 48, 96].map((h) => (
                      <button
                        key={h}
                        onClick={() => selectRainHorizon(h)}
                        className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                          rainHorizonHours === h
                            ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] font-semibold'
                            : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white'
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                    <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/70">
                      Média Municipal ({rainHorizonHours}h)
                    </div>
                    <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#14213D] dark:text-white mt-1.5 tabular-nums">
                      {rainHorizonStats.avg !== null ? `${rainHorizonStats.avg.toFixed(1)} mm` : '--'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/65 mt-1">
                      Média ponderada nos bairros
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                    <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/70">
                      Maior Acumulado ({rainHorizonHours}h)
                    </div>
                    <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#FCA311] mt-1.5 tabular-nums">
                      {rainHorizonStats.maxVal !== null ? `${rainHorizonStats.maxVal.toFixed(1)} mm` : '--'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/65 mt-1 truncate" title={rainHorizonStats.maxName}>
                      {rainHorizonStats.maxName}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                    <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/70">Cota do Rio Jundiá</div>
                    <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#14213D] dark:text-white mt-1.5 tabular-nums">
                      {acumulados?.resumo.rio_jundia_cota || '--'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/65 mt-1">
                      {acumulados ? `${acumulados.resumo.rio_jundia_status} · Calha em ${acumulados.resumo.rio_jundia_pct.toFixed(0)}%` : ''}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                    <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/70">Pontos Monitorados</div>
                    <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#14213D] dark:text-white mt-1.5 tabular-nums">
                      {acumulados ? `${acumulados.total_estacoes} Pontos` : '--'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/65 mt-1">
                      {acumulados
                        ? `${acumulados.estacoes.filter((s) => s.categoria === 'pws').length} WU · ${
                            acumulados.estacoes.filter((s) => s.categoria === 'inea').length
                          } INEA · ${acumulados.estacoes.filter((s) => s.categoria === 'cemaden').length} CEMADEN`
                        : ''}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Barra Compartilhada de Redes + Horizonte de Tempo para Cards e Tabela */}
            {(showSub('cards') || showSub('tabela')) && (
              <div className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg">
                    {[
                      { id: 'all', label: `Todas (${acumulados?.estacoes.length || 10})` },
                      { id: 'pws', label: 'Weather Underground (6)' },
                      { id: 'cemaden', label: 'CEMADEN PCDs (3)' },
                      { id: 'inea', label: 'INEA Cheias (1)' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setNetworkFilter(tab.id as 'all' | 'pws' | 'cemaden' | 'inea')}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          networkFilter === tab.id
                            ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] font-semibold'
                            : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white font-medium'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full xl:w-auto">
                    <div className="relative flex-1 sm:w-60">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={stationQuery}
                        onChange={(e) => setStationQuery(e.target.value)}
                        placeholder="Filtrar estação ou bairro..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FCA311]"
                      />
                    </div>
                    <button
                      onClick={handleDownloadStationsCsv}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#14213D] text-[#14213D] dark:text-white hover:border-[#FCA311] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5 text-[#FCA311]" />
                      Exportar CSV
                    </button>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-[#E5E5E5] dark:border-[#233354] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-[#E5E5E5]/80">
                      <Clock className="w-3.5 h-3.5 text-[#FCA311] shrink-0" />
                      <span>Horizonte:</span>
                    </span>

                    <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg">
                      {[1, 4, 12, 24, 36, 48, 96].map((h) => (
                        <button
                          key={h}
                          onClick={() => selectRainHorizon(h)}
                          className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                            rainHorizonHours === h
                              ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] font-semibold'
                              : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white'
                          }`}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>

                    <label className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#E5E5E5]/70">
                      <span>Outro:</span>
                      <input
                        type="number"
                        min={1}
                        max={96}
                        value={rainHorizonInput}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setRainHorizonInput(raw);
                          const v = parseInt(raw, 10);
                          if (!isNaN(v) && v >= 1) {
                            setRainHorizonHours(Math.min(96, v));
                          }
                        }}
                        onBlur={() => selectRainHorizon(parseInt(rainHorizonInput, 10) || 24)}
                        aria-label="Horizonte de tempo personalizado em horas"
                        className="w-14 px-2 py-1 rounded-md border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] font-mono font-semibold text-center text-[#14213D] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FCA311]"
                      />
                      <span className="font-mono">h</span>
                    </label>
                  </div>

                  <div className="text-xs font-mono text-slate-500 dark:text-[#E5E5E5]/70">
                    Ordenado por <span className="font-semibold text-[#14213D] dark:text-white">{rainHorizonHours}h</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-aba 2: 10 Estações da Rede — Cards Minimalistas */}
            {showSub('cards') && (
              <section className="space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-semibold text-[#14213D] dark:text-white">
                      Estações da Rede Municipal & Entorno
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-0.5">
                      Acumulados ordenados pelo horizonte de {rainHorizonHours}h · {filteredStations.length} estações exibidas
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredStations.map((st, idx) => {
                    const isOnline = st.online !== false;
                    const isInea = st.categoria === 'inea';
                    const rankNum = st.ranking ?? (isInea ? null : idx + 1);
                    const selectedRain = getStationRainByHours(st, rainHorizonHours);
                    const isStandardHorizon = [1, 4, 12, 24, 36, 48, 96].includes(rainHorizonHours);
                    const formatMm = (v: number | null | undefined) =>
                      v !== null && v !== undefined ? `${Number(v).toFixed(1).replace('.', ',')} mm` : '--';
                    const formatNum1 = (v: number | null | undefined, suffix: string) =>
                      v !== null && v !== undefined ? `${Number(v).toFixed(1).replace('.', ',')}${suffix}` : '--';

                    const shortClock = (() => {
                      const raw = st.ultima_leitura || '';
                      const m = raw.match(/(\d{2}:\d{2})/);
                      return m ? m[1] : '';
                    })();

                    const extLinkLabel =
                      st.categoria === 'pws'
                        ? 'Ver no Weather Underground'
                        : st.categoria === 'cemaden'
                          ? 'Ver Gráfico no CEMADEN'
                          : st.categoria === 'inea'
                            ? 'Ver no Alerta de Cheias'
                            : 'Abrir Dashboard';

                    const hasRealTimePws =
                      !isInea &&
                      isOnline &&
                      ((st.temp_atual !== null && st.temp_atual !== undefined) ||
                        (st.vento_atual !== null && st.vento_atual !== undefined));

                    const chHoje = st.chuva_hoje ?? 0;
                    const chuvaTaxa = st.chuva_taxa_atual ?? 0;
                    const rainValForRank = getStationRainByHours(st, rainHorizonHours) ?? 0;
                    const showTopBadge = !isInea && isOnline && rankNum === 1 && rainValForRank > 0;

                    const nivelRioStr = st.nivel_rio || rj?.nivel_rio || '--';
                    const cotaTransbordoStr = st.cota_transbordo || rj?.cota_transbordo || '2,84 m';
                    const cotaAtencaoStr = st.cota_atencao || rj?.cota_atencao || '1,99 m';
                    const cotaAlertaStr = st.cota_alerta || rj?.cota_alerta || '2,27 m';
                    const calhaPct = st.alerta_maximo_pct ?? rj?.alerta_maximo_pct ?? 46;
                    const statusRioStr = st.status_rio || rj?.status_rio || 'VIGILÂNCIA';
                    const tendenciaRioStr = st.tendencia_rio || rj?.tendencia_rio || 'Estável';
                    const pluvio24 = st.chuva_pluvio_24h ?? rj?.chuva_pluvio_24h;
                    const pluvio96 = st.chuva_pluvio_96h ?? rj?.chuva_pluvio_96h;

                    const ventoMaxHoje = st.vento_max_hoje ?? st.vento_max_24h ?? st.vento_atual;
                    const rajadaMaxHoje = st.rajada_max_hoje ?? st.rajada_max_24h ?? st.rajada_atual ?? st.vento_atual;

                    return (
                      <article
                        key={st.codigo}
                        className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-5 flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-3.5">
                          {/* Cabeçalho limpo: Ranking/Categoria + Código/Rede + Ponto de Status */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-mono text-[11px] text-slate-500 dark:text-[#E5E5E5]/65 truncate">
                              {isInea ? (
                                <span className="font-semibold text-[#14213D] dark:text-[#FCA311]">NÍVEL DO RIO</span>
                              ) : (
                                <span className={showTopBadge ? 'font-semibold text-[#FCA311]' : 'font-semibold text-[#14213D] dark:text-white'}>
                                  #{rankNum}
                                  {showTopBadge ? ' MAIOR VOLUME' : ''}
                                </span>
                              )}
                              <span> · {st.codigo} · {st.rede}</span>
                            </div>

                            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-600 dark:text-[#E5E5E5]/80 shrink-0">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                              {isOnline ? 'Ativa' : 'Offline'}
                            </span>
                          </div>

                          {/* Identificação da Estação */}
                          <div>
                            <h3 className="font-display text-sm font-semibold text-[#14213D] dark:text-white leading-snug">
                              {st.nome}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
                              <MapPin className="w-3 h-3 text-[#FCA311] shrink-0" />
                              <span>{st.bairro || 'Rio das Ostras'}</span>
                            </div>
                          </div>

                          {isInea ? (
                            /* Bloco Hidrológico INEA Minimalista */
                            <div className="space-y-3 pt-3 border-t border-[#E5E5E5] dark:border-[#233354]">
                              <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-2.5">
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-[#E5E5E5]/70">
                                    Cota Atual do Rio
                                  </span>
                                  <span className="text-xl font-mono font-semibold text-[#14213D] dark:text-white tabular-nums">
                                    {nivelRioStr}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/75">
                                    <span>Ocupação: <strong className="text-[#14213D] dark:text-white">{calhaPct}%</strong></span>
                                    <span>Transbordo: <strong className="text-[#14213D] dark:text-white">{cotaTransbordoStr}</strong></span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-[#E5E5E5] dark:bg-[#233354] overflow-hidden">
                                    <div
                                      className="h-full bg-[#14213D] dark:bg-[#FCA311] rounded-full"
                                      style={{ width: `${Math.min(100, Math.max(2, calhaPct))}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-[#E5E5E5] dark:border-[#233354] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/75">
                                  <span>Atenção: {cotaAtencaoStr} · Alerta: {cotaAlertaStr}</span>
                                  <span className="font-semibold text-[#14213D] dark:text-[#FCA311] uppercase">
                                    {statusRioStr} · {tendenciaRioStr}
                                  </span>
                                </div>

                                {((pluvio24 !== undefined && pluvio24 !== null) ||
                                  (pluvio96 !== undefined && pluvio96 !== null)) && (
                                  <div className="pt-2 border-t border-[#E5E5E5] dark:border-[#233354] flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/75">
                                    <span>Pluviômetro 24h: <strong className="text-[#14213D] dark:text-white">{formatMm(pluvio24)}</strong></span>
                                    <span>96h: <strong className="text-[#14213D] dark:text-white">{formatMm(pluvio96)}</strong></span>
                                  </div>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 leading-relaxed">
                                Monitoramento fluvial contínuo em metros (m), sem interferência no ranking pluviométrico.
                              </p>
                            </div>
                          ) : (
                            /* Corpo Pluviométrico Minimalista */
                            <div className="space-y-3 pt-3 border-t border-[#E5E5E5] dark:border-[#233354]">
                              {!isStandardHorizon && (
                                <div className="flex items-center justify-between font-mono text-xs pb-2 border-b border-[#E5E5E5] dark:border-[#233354]">
                                  <span className="text-slate-500 dark:text-[#E5E5E5]/70">Horizonte ({rainHorizonHours}h)</span>
                                  <strong className="text-[#FCA311] tabular-nums">{formatMm(selectedRain)}</strong>
                                </div>
                              )}

                              {/* Janelas Principais: 24h · 36h · 48h */}
                              <div className="grid grid-cols-3 divide-x divide-[#E5E5E5] dark:divide-[#233354] text-center font-mono text-xs">
                                <div className="px-1">
                                  <span className={`text-[10px] uppercase block ${rainHorizonHours === 24 ? 'text-[#FCA311] font-semibold' : 'text-slate-500 dark:text-[#E5E5E5]/65'}`}>
                                    24 Horas
                                  </span>
                                  <strong className={`tabular-nums mt-0.5 block ${rainHorizonHours === 24 ? 'text-[#FCA311]' : 'text-[#14213D] dark:text-white'}`}>
                                    {formatMm(st.chuva_24h)}
                                  </strong>
                                </div>
                                <div className="px-1">
                                  <span className={`text-[10px] uppercase block ${rainHorizonHours === 36 ? 'text-[#FCA311] font-semibold' : 'text-slate-500 dark:text-[#E5E5E5]/65'}`}>
                                    36 Horas
                                  </span>
                                  <strong className={`tabular-nums mt-0.5 block ${rainHorizonHours === 36 ? 'text-[#FCA311]' : 'text-[#14213D] dark:text-white'}`}>
                                    {formatMm(st.chuva_36h ?? st.chuva_24h)}
                                  </strong>
                                </div>
                                <div className="px-1">
                                  <span className={`text-[10px] uppercase block ${rainHorizonHours === 48 ? 'text-[#FCA311] font-semibold' : 'text-slate-500 dark:text-[#E5E5E5]/65'}`}>
                                    48 Horas
                                  </span>
                                  <strong className={`tabular-nums mt-0.5 block ${rainHorizonHours === 48 ? 'text-[#FCA311]' : 'text-[#14213D] dark:text-white'}`}>
                                    {formatMm(st.chuva_48h)}
                                  </strong>
                                </div>
                              </div>

                              {/* Janelas Complementares: 1h · 4h · 12h · 96h */}
                              <div className="grid grid-cols-4 gap-1 pt-2.5 border-t border-[#E5E5E5] dark:border-[#233354] text-center font-mono text-[11px]">
                                <div>
                                  <span className={`text-[10px] block ${rainHorizonHours === 1 ? 'text-[#FCA311] font-semibold' : 'text-slate-500 dark:text-[#E5E5E5]/60'}`}>1h</span>
                                  <span className={`tabular-nums ${rainHorizonHours === 1 ? 'text-[#FCA311] font-semibold' : 'text-[#14213D] dark:text-white'}`}>{formatMm(st.chuva_1h)}</span>
                                </div>
                                <div>
                                  <span className={`text-[10px] block ${rainHorizonHours === 4 ? 'text-[#FCA311] font-semibold' : 'text-slate-500 dark:text-[#E5E5E5]/60'}`}>4h</span>
                                  <span className={`tabular-nums ${rainHorizonHours === 4 ? 'text-[#FCA311] font-semibold' : 'text-[#14213D] dark:text-white'}`}>{formatMm(st.chuva_4h)}</span>
                                </div>
                                <div>
                                  <span className={`text-[10px] block ${rainHorizonHours === 12 ? 'text-[#FCA311] font-semibold' : 'text-slate-500 dark:text-[#E5E5E5]/60'}`}>12h</span>
                                  <span className={`tabular-nums ${rainHorizonHours === 12 ? 'text-[#FCA311] font-semibold' : 'text-[#14213D] dark:text-white'}`}>{formatMm(st.chuva_12h)}</span>
                                </div>
                                <div>
                                  <span className={`text-[10px] block ${rainHorizonHours === 96 ? 'text-[#FCA311] font-semibold' : 'text-slate-500 dark:text-[#E5E5E5]/60'}`}>96h</span>
                                  <span className={`tabular-nums ${rainHorizonHours === 96 ? 'text-[#FCA311] font-semibold' : 'text-[#14213D] dark:text-white'}`}>{formatMm(st.chuva_96h)}</span>
                                </div>
                              </div>

                              {/* Chuva Hoje & Início da Chuva (linha limpa) */}
                              <div className="pt-2.5 border-t border-[#E5E5E5] dark:border-[#233354] flex items-center justify-between gap-2 text-[11px]">
                                {!isOnline ? (
                                  <span className="text-slate-500 dark:text-[#E5E5E5]/70">
                                    Início hoje: <strong>Sem leitura ativa</strong>
                                  </span>
                                ) : st.inicio_chuva_hoje || chHoje > 0 ? (
                                  <>
                                    <span className="text-slate-600 dark:text-[#E5E5E5]/80">
                                      Chuva hoje:{' '}
                                      <strong className="font-mono text-[#14213D] dark:text-white">
                                        {st.inicio_chuva_hoje ? `iniciou às ${st.inicio_chuva_hoje}` : 'registrada'}
                                      </strong>
                                    </span>
                                    <span className="font-mono font-semibold text-[#14213D] dark:text-[#FCA311] tabular-nums shrink-0">
                                      {formatMm(chHoje)}
                                      {chuvaTaxa > 0 ? ` (${chuvaTaxa.toFixed(1).replace('.', ',')} mm/h)` : ''}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-slate-500 dark:text-[#E5E5E5]/75">Chuva hoje: Sem registro desde 00h</span>
                                    <span className="font-mono text-slate-500 dark:text-[#E5E5E5]/70 tabular-nums">0,0 mm</span>
                                  </>
                                )}
                              </div>

                              {/* Telemetria Única em Caixa Neutra (PWS / Offline / CEMADEN) */}
                              {hasRealTimePws ? (
                                <div className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-2.5">
                                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-[#E5E5E5]/70">
                                    <span className="uppercase font-semibold text-[#14213D] dark:text-white">
                                      Tempo Real Agora
                                    </span>
                                    <span>{shortClock ? `Leitura às ${shortClock}` : 'Ao vivo'}</span>
                                  </div>

                                  <div className="grid grid-cols-4 gap-1 text-center font-mono">
                                    <div>
                                      <span className="text-[9.5px] uppercase text-slate-500 dark:text-[#E5E5E5]/65 block">Temp.</span>
                                      <strong className="text-xs text-[#14213D] dark:text-white tabular-nums">
                                        {formatNum1(st.temp_atual, '°C')}
                                      </strong>
                                    </div>
                                    <div className="border-l border-[#E5E5E5] dark:border-[#233354] pl-1">
                                      <span className="text-[9.5px] uppercase text-slate-500 dark:text-[#E5E5E5]/65 block">Sensação</span>
                                      <strong className="text-xs text-[#FCA311] tabular-nums">
                                        {formatNum1(st.sensacao_atual ?? st.temp_atual, '°C')}
                                      </strong>
                                    </div>
                                    <div className="border-l border-[#E5E5E5] dark:border-[#233354] pl-1">
                                      <span className="text-[9.5px] uppercase text-slate-500 dark:text-[#E5E5E5]/65 block">Vento</span>
                                      <strong className="text-xs text-[#14213D] dark:text-white tabular-nums">
                                        {formatNum1(st.vento_atual ?? 0, ' km/h')}
                                      </strong>
                                      {st.vento_dir_cardinal && (
                                        <span className="text-[9px] text-slate-500 dark:text-[#E5E5E5]/60 block">
                                          Dir. {st.vento_dir_cardinal}
                                        </span>
                                      )}
                                    </div>
                                    <div className="border-l border-[#E5E5E5] dark:border-[#233354] pl-1">
                                      <span className="text-[9.5px] uppercase text-slate-500 dark:text-[#E5E5E5]/65 block">Rajadas</span>
                                      <strong className="text-xs text-[#14213D] dark:text-white tabular-nums">
                                        {formatNum1(st.rajada_atual ?? st.vento_atual ?? 0, ' km/h')}
                                      </strong>
                                    </div>
                                  </div>

                                  {((st.umidade_atual !== null && st.umidade_atual !== undefined) ||
                                    (st.pressao_atual !== null && st.pressao_atual !== undefined) ||
                                    (st.uv_atual !== null && st.uv_atual !== undefined)) && (
                                    <div className="pt-2 border-t border-[#E5E5E5] dark:border-[#233354] flex flex-wrap justify-between gap-2 text-[10px] font-mono text-slate-500 dark:text-[#E5E5E5]/70">
                                      {st.umidade_atual !== null && st.umidade_atual !== undefined && (
                                        <span>Umidade: {st.umidade_atual}%</span>
                                      )}
                                      {st.pressao_atual !== null && st.pressao_atual !== undefined && (
                                        <span>Pressão: {Number(st.pressao_atual).toFixed(1)} hPa</span>
                                      )}
                                      {st.uv_atual !== null && st.uv_atual !== undefined && (
                                        <span>UV: {st.uv_atual}</span>
                                      )}
                                    </div>
                                  )}

                                  <div className="pt-2 border-t border-[#E5E5E5] dark:border-[#233354] space-y-1.5">
                                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-[#E5E5E5]/70">
                                      <span className="uppercase font-semibold text-[#14213D] dark:text-white">
                                        Extremos Hoje
                                      </span>
                                      <span>
                                        24h: {formatNum1(st.vento_max_24h, '')} / {formatNum1(st.rajada_max_24h, ' km/h')}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                                      <div>
                                        <span className="text-slate-500 dark:text-[#E5E5E5]/65">Maior Vento: </span>
                                        <strong className="text-[#14213D] dark:text-white tabular-nums">
                                          {formatNum1(ventoMaxHoje, ' km/h')}
                                        </strong>
                                        {st.hora_vento_max_hoje && (
                                          <span className="text-[10px] text-slate-500 dark:text-[#E5E5E5]/60 block">
                                            às {st.hora_vento_max_hoje}
                                          </span>
                                        )}
                                      </div>
                                      <div className="border-l border-[#E5E5E5] dark:border-[#233354] pl-2">
                                        <span className="text-slate-500 dark:text-[#E5E5E5]/65">Maior Rajada: </span>
                                        <strong className="text-[#FCA311] tabular-nums">
                                          {formatNum1(rajadaMaxHoje, ' km/h')}
                                        </strong>
                                        {st.hora_rajada_max_hoje && (
                                          <span className="text-[10px] text-slate-500 dark:text-[#E5E5E5]/60 block">
                                            às {st.hora_rajada_max_hoje}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : !isOnline ? (
                                <div className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex items-center gap-2 text-[11px] text-slate-500 dark:text-[#E5E5E5]/70">
                                  <WifiOff className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                  <span>Estação temporariamente sem transmissão em tempo real no painel da rede.</span>
                                </div>
                              ) : (
                                <div className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-[11px] text-slate-600 dark:text-[#E5E5E5]/75">
                                  PCD Pluviométrica Oficial CEMADEN · Medição exclusiva de chuva (sem sensor local de vento/temperatura).
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Rodapé discreto */}
                        <div className="pt-3 border-t border-[#E5E5E5] dark:border-[#233354] flex items-center justify-between gap-2 text-[11px] font-mono">
                          <span className="text-slate-500 dark:text-[#E5E5E5]/65 truncate">
                            {st.ultima_leitura || 'Hoje'}
                          </span>
                          {st.url && (
                            <a
                              href={st.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[#14213D] dark:text-[#E5E5E5] hover:text-[#FCA311] transition-colors whitespace-nowrap shrink-0"
                            >
                              <span>{extLinkLabel}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Sub-aba 3: Tabela Comparativa */}
            {showSub('tabela') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-5">
                <div className="pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <h2 className="font-display text-lg sm:text-xl font-semibold text-[#14213D] dark:text-white">
                    Tabela Comparativa da Rede Pluviométrica
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
                    Comparativo ordenado pelo acumulado de {rainHorizonHours}h · Atualização: {acumulados?.atualizacao || '--'}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E5E5] dark:border-[#233354] text-xs text-slate-500 dark:text-[#E5E5E5]/70">
                        <th className="py-3 pr-5 font-medium min-w-[220px]">Estação / Localidade</th>
                        <th className="py-3 px-3 font-medium whitespace-nowrap">Rede</th>
                        {[1, 4, 12, 24, 36, 48, 96].map((h) => (
                          <th key={h} className="py-3 px-2.5 font-medium text-right whitespace-nowrap">
                            <button
                              onClick={() => selectRainHorizon(h)}
                              className={`cursor-pointer hover:text-[#14213D] dark:hover:text-white ${
                                rainHorizonHours === h ? 'text-[#FCA311] font-semibold underline underline-offset-4' : ''
                              }`}
                            >
                              {h}h
                            </button>
                          </th>
                        ))}
                        <th className="py-3 pl-4 font-medium whitespace-nowrap">Leitura</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#233354] text-sm">
                      {filteredStations.map((st) => (
                        <tr key={st.codigo} className="hover:bg-[#F7F8FA] dark:hover:bg-[#0B1324]/70 transition-colors">
                          <td className="py-4 pr-5 min-w-[220px] align-top">
                            <div className="space-y-1">
                              <div className="font-medium text-[#14213D] dark:text-white leading-snug">
                                {st.nome_curto || st.nome}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/65 leading-snug">
                                {st.codigo}
                                {st.bairro ? ` · ${st.bairro}` : ''}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-3 text-xs text-slate-600 dark:text-[#E5E5E5]/80 whitespace-nowrap align-top">
                            {st.rede}
                          </td>
                          <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 1 ? 'font-semibold text-[#FCA311]' : ''}`}>
                            {st.chuva_1h !== null ? st.chuva_1h.toFixed(1) : '--'}
                          </td>
                          <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 4 ? 'font-semibold text-[#FCA311]' : ''}`}>
                            {st.chuva_4h !== null ? st.chuva_4h.toFixed(1) : '--'}
                          </td>
                          <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 12 ? 'font-semibold text-[#FCA311]' : ''}`}>
                            {st.chuva_12h !== null ? st.chuva_12h.toFixed(1) : '--'}
                          </td>
                          <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 24 ? 'font-semibold text-[#FCA311]' : ''}`}>
                            {st.chuva_24h !== null ? st.chuva_24h.toFixed(1) : '--'}
                          </td>
                          <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 36 ? 'font-semibold text-[#FCA311]' : ''}`}>
                            {st.chuva_36h !== null && st.chuva_36h !== undefined ? st.chuva_36h.toFixed(1) : '--'}
                          </td>
                          <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 48 ? 'font-semibold text-[#FCA311]' : ''}`}>
                            {st.chuva_48h !== null ? st.chuva_48h.toFixed(1) : '--'}
                          </td>
                          <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 96 ? 'font-semibold text-[#FCA311]' : ''}`}>
                            {st.chuva_96h !== null ? st.chuva_96h.toFixed(1) : '--'}
                          </td>
                          <td className="py-4 pl-4 text-xs font-mono text-slate-500 dark:text-[#E5E5E5]/70 whitespace-nowrap align-top">
                            {st.ultima_leitura || '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Sub-aba 4: Histórico Completo das Estações em Planilha */}
            {showSub('planilha') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-semibold text-[#14213D] dark:text-white">
                      Histórico Completo das Estações em Planilha
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
                      Registros horários, diários e mensais com vento, temperatura e sistemas atuantes
                      {historico ? ` · ${historico.total_dias} dias · ${historico.total_horas}h registradas` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {historico?.arquivos_planilha && (
                      <>
                        <a
                          href={`${SITE_BASE}/${historico.arquivos_planilha.xlsx}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FCA311] transition-colors whitespace-nowrap"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5 text-[#FCA311]" />
                          Excel (.XLSX)
                        </a>
                        <a
                          href={`${SITE_BASE}/${historico.arquivos_planilha.csv}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FCA311] transition-colors whitespace-nowrap"
                        >
                          Planilha Completa (.CSV)
                        </a>
                      </>
                    )}
                    <button
                      onClick={handleDownloadFilteredHistCsv}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FCA311] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Filtro Atual (.CSV)
                    </button>
                  </div>
                </div>

                {/* Controles de Modo e Filtros da Planilha */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg">
                      {[
                        { id: 'horario', label: 'Horário Completo' },
                        { id: 'diario', label: 'Totais Diários' },
                        { id: 'mensal', label: 'Totais Mensais' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setHistoryMode(m.id as 'horario' | 'diario' | 'mensal')}
                          className={`px-3.5 py-1.5 text-xs rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                            historyMode === m.id
                              ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] font-semibold'
                              : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white font-medium'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    <div className="text-xs font-mono text-slate-500 dark:text-[#E5E5E5]/70">
                      {historyMode === 'mensal'
                        ? `${historico?.resumo_mensal?.length ?? 0} meses consolidados`
                        : historyMode === 'diario'
                          ? `${filteredHistDaily.slice(0, 45).length} dias exibidos`
                          : `${filteredHistHourly.length} registros horários`}
                    </div>
                  </div>

                  {historyMode !== 'mensal' && (
                    <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-[#E5E5E5] dark:border-[#233354] text-xs">
                      <select
                        value={histMonthFilter}
                        onChange={(e) => setHistMonthFilter(e.target.value)}
                        aria-label="Filtrar por mês"
                        className="px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-white cursor-pointer"
                      >
                        <option value="all">Todos os Meses</option>
                        {histMonthOptions.map((m) => (
                          <option key={m.ano_mes} value={m.ano_mes}>
                            {m.rotulo}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={histDateFilter}
                        onChange={(e) => setHistDateFilter(e.target.value)}
                        placeholder="Buscar data (ex: 26/10)..."
                        className="w-44 px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FCA311]"
                      />

                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={histRainOnly}
                          onChange={(e) => setHistRainOnly(e.target.checked)}
                          className="accent-[#FCA311]"
                        />
                        <span>Com chuva (&gt; 0 mm)</span>
                      </label>

                      <button
                        onClick={() => setHistSortOrder((s) => (s === 'desc' ? 'asc' : 'desc'))}
                        className="px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] font-mono cursor-pointer hover:border-[#FCA311] transition-colors whitespace-nowrap"
                      >
                        {histSortOrder === 'desc' ? 'Mais Recentes ↓' : 'Cronológica ↑'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  {historyMode === 'mensal' ? (
                    <div className="space-y-6">
                      <table className="w-full min-w-[820px] text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-[#E5E5E5] dark:border-[#233354] text-xs text-slate-500 dark:text-[#E5E5E5]/70">
                            <th className="py-3 pr-4 font-medium min-w-[140px]">Mês</th>
                            <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Dias (Chuva / Reg.)</th>
                            <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Média Municipal</th>
                            <th className="py-3 px-3 font-medium text-right min-w-[160px]">Maior Estação</th>
                            <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Rajada Máx.</th>
                            <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Temp (Mín–Máx)</th>
                            <th className="py-3 pl-4 font-medium min-w-[160px]">Dia Mais Chuvoso</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#233354]">
                          {(historico?.resumo_mensal ?? []).map((m) => (
                            <tr key={m.ano_mes} className="hover:bg-[#F7F8FA] dark:hover:bg-[#0B1324]/60">
                              <td className="py-4 pr-4 font-semibold text-[#14213D] dark:text-white align-top whitespace-nowrap">
                                {m.rotulo_mes}
                              </td>
                              <td className="py-4 px-3 text-right font-mono align-top whitespace-nowrap">
                                {m.dias_com_chuva} / {m.dias_registrados}
                              </td>
                              <td className="py-4 px-3 text-right font-mono text-[#14213D] dark:text-white font-semibold align-top whitespace-nowrap">
                                {m.chuva_total_media_mm.toFixed(1)} mm
                              </td>
                              <td className="py-4 px-3 text-right font-mono align-top">
                                <div className="space-y-1">
                                  <div className="font-semibold text-[#FCA311] whitespace-nowrap">
                                    {m.chuva_maior_estacao_mm.toFixed(1)} mm
                                  </div>
                                  <div className="text-[11px] font-sans font-normal text-slate-500 dark:text-[#E5E5E5]/70 leading-snug">
                                    {m.chuva_maior_estacao_nome}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-3 text-right font-mono text-xs align-top whitespace-nowrap">
                                {m.vento_rajada_max_kmh ? `${m.vento_rajada_max_kmh.toFixed(1)} km/h` : '--'}
                              </td>
                              <td className="py-4 px-3 text-right font-mono text-xs align-top whitespace-nowrap">
                                {m.temp_min_c !== undefined && m.temp_max_c !== undefined
                                  ? `${m.temp_min_c.toFixed(1)}° – ${m.temp_max_c.toFixed(1)}°C`
                                  : '--'}
                              </td>
                              <td className="py-4 pl-4 text-xs text-slate-600 dark:text-[#E5E5E5]/80 align-top leading-snug">
                                {m.dia_mais_chuvoso || '--'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(historico?.resumo_mensal ?? []).map((m) => (
                          <div
                            key={`${m.ano_mes}-meta`}
                            className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-2 text-xs"
                          >
                            <div className="font-semibold text-[#14213D] dark:text-white">{m.rotulo_mes} — Sistemas & Características</div>
                            {m.sistema_atuante_mes && (
                              <p className="text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed">{m.sistema_atuante_mes}</p>
                            )}
                            {m.caracteristicas_mes && (
                              <p className="text-slate-500 dark:text-[#E5E5E5]/75 leading-relaxed">{m.caracteristicas_mes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : historyMode === 'diario' ? (
                    <table className="w-full min-w-[820px] text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#E5E5E5] dark:border-[#233354] text-slate-500 dark:text-[#E5E5E5]/70">
                          <th className="py-3 pr-4 font-medium min-w-[115px]">Data</th>
                          <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Média</th>
                          <th className="py-3 px-3 font-medium text-right min-w-[165px]">Pico Rede</th>
                          <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Rajada Máx</th>
                          <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Temp (Mín/Máx)</th>
                          <th className="py-3 pl-4 font-medium min-w-[220px]">Sistema Sinótico Atuante</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#233354]">
                        {filteredHistDaily.slice(0, 45).map((d) => (
                          <tr key={d.data_br} className="hover:bg-[#F7F8FA] dark:hover:bg-[#0B1324]/60">
                            <td className="py-3.5 pr-4 font-mono whitespace-nowrap align-top">
                              <div className="space-y-0.5">
                                <div className="font-semibold text-[#14213D] dark:text-white">{d.data_br}</div>
                                <div className="text-[10px] text-slate-500">{d.horas_com_chuva}h c/ chuva</div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono text-[#14213D] dark:text-white whitespace-nowrap align-top">
                              {d.chuva_total_media_mm.toFixed(1)} mm
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono align-top">
                              <div className="space-y-0.5">
                                <div className="font-semibold text-[#FCA311] whitespace-nowrap">
                                  {d.chuva_maior_estacao_mm.toFixed(1)} mm
                                </div>
                                <div className="text-[11px] font-sans text-slate-500 dark:text-[#E5E5E5]/65 leading-snug">
                                  {d.chuva_maior_estacao_nome}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap align-top">
                              <div className="space-y-0.5">
                                <div>{d.vento_rajada_max_kmh ? `${d.vento_rajada_max_kmh.toFixed(1)} km/h` : '--'}</div>
                                {d.vento_dir_predominante && (
                                  <div className="text-[10px] text-slate-500">{d.vento_dir_predominante}</div>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap align-top">
                              {d.temp_min_c !== undefined && d.temp_max_c !== undefined
                                ? `${d.temp_min_c.toFixed(1)}° / ${d.temp_max_c.toFixed(1)}°`
                                : '--'}
                            </td>
                            <td className="py-3.5 pl-4 text-slate-600 dark:text-[#E5E5E5]/80 align-top leading-relaxed">
                              <div className="font-medium text-[#14213D] dark:text-white">
                                {d.categoria_sistema || d.sistema_atuante_dia || '--'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full min-w-[880px] text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#E5E5E5] dark:border-[#233354] text-slate-500 dark:text-[#E5E5E5]/70">
                          <th className="py-3 pr-4 font-medium whitespace-nowrap min-w-[130px]">Data / Hora</th>
                          <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Chuva (mm/h)</th>
                          <th className="py-3 px-3 font-medium text-right min-w-[165px]">Pico Estação</th>
                          <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Vento / Rajada</th>
                          <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Temp / Umid / Press</th>
                          <th className="py-3 pl-4 font-medium min-w-[220px]">Sistema do Dia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#233354]">
                        {filteredHistHourly.map((h) => (
                          <tr key={`${h.data_iso}-${h.horario}`} className="hover:bg-[#F7F8FA] dark:hover:bg-[#0B1324]/60">
                            <td className="py-3.5 pr-4 font-mono whitespace-nowrap text-[#14213D] dark:text-white align-top">
                              {h.data_br} · <strong className="text-[#FCA311]">{h.horario}</strong>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono text-[#14213D] dark:text-white whitespace-nowrap align-top">
                              {h.chuva_mm_hora.toFixed(1)} mm
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono align-top">
                              <div className="space-y-0.5">
                                <div className="font-semibold text-[#FCA311] whitespace-nowrap">
                                  {h.chuva_max_estacao_mm.toFixed(1)} mm
                                </div>
                                <div className="text-[11px] font-sans text-slate-500 dark:text-[#E5E5E5]/65 leading-snug">
                                  {h.chuva_max_estacao_nome}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap align-top">
                              {h.vento_direcao_cardeal || '--'} {h.vento_velocidade_kmh?.toFixed(0) ?? '--'}/{h.vento_rajada_kmh?.toFixed(0) ?? '--'} km/h
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap align-top">
                              {h.temperatura_c?.toFixed(1) ?? '--'}°C · {h.umidade_pct ?? '--'}% · {h.pressao_hpa?.toFixed(0) ?? '--'} hPa
                            </td>
                            <td className="py-3.5 pl-4 text-[11px] text-slate-600 dark:text-[#E5E5E5]/75 align-top leading-relaxed">
                              {h.sistema_atuante_dia || '--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ================= ABA 3: NÍVEL DO RIO ================= */}
        {activeTab === 'rio' && (
          <div className="space-y-8">
            {showSub('cota') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
                      {rj?.codigo || 'INEA 2241036'} · {rj?.rede || 'INEA Alerta de Cheias'}
                    </div>
                    <h1 className="font-display text-2xl font-semibold text-[#14213D] dark:text-white mt-1">
                      Cota Atual & Calha do Rio — {rj?.nome_curto || 'Rio Jundiá (Cantagalo)'}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
                      Última leitura telemétrica oficial: {rj?.ultima_leitura || '--'} · Tendência: {rj?.tendencia_rio || '--'}
                    </p>
                  </div>

                  {rj?.url && (
                    <a
                      href={rj.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                    >
                      Portal INEA Alerta de Cheias <ExternalLink className="w-3.5 h-3.5 text-[#FCA311]" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                    <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/65">Cota Atual</div>
                    <div className="font-mono text-2xl font-semibold text-[#14213D] dark:text-white mt-1 tabular-nums">
                      {rj?.nivel_rio || '--'}
                    </div>
                    {rj?.status_rio && (
                      <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-[#E5E5E5]/75 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                        <span>{rj.status_rio}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                    <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/65">Ocupação Calha</div>
                    <div className="font-mono text-2xl font-semibold text-[#FCA311] mt-1 tabular-nums">
                      {rj ? `${rj.alerta_maximo_pct.toFixed(1)}%` : '--'}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                    <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#E5E5E5]/65">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FCA311]" aria-hidden="true" />
                      Cota de Atenção
                    </div>
                    <div className="font-mono text-xl font-semibold text-[#14213D] dark:text-white mt-1.5 tabular-nums">
                      {rj?.cota_atencao || '1.99 m'}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                    <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#E5E5E5]/65">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FA824C]" aria-hidden="true" />
                      Cota de Alerta
                    </div>
                    <div className="font-mono text-xl font-semibold text-[#14213D] dark:text-white mt-1.5 tabular-nums">
                      {rj?.cota_alerta || '2.27 m'}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                    <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#E5E5E5]/65">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" aria-hidden="true" />
                      Cota Transbordo
                    </div>
                    <div className="font-mono text-xl font-semibold text-[#14213D] dark:text-white mt-1.5 tabular-nums">
                      {rj?.cota_transbordo || '2.84 m'}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {showSub('historico') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[#14213D] dark:text-white">
                      Histórico Telemétrico 24h & Leituras INEA
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-0.5">
                      {displayedRiverReadings.length} leituras exibidas · Fonte: Sistema de Alerta de Cheias INEA-RJ
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {riverDates.length > 0 && (
                      <select
                        value={riverDateFilter}
                        onChange={(e) => setRiverDateFilter(e.target.value)}
                        aria-label="Filtrar dia da leitura do rio"
                        className="px-3 py-1.5 text-xs font-mono rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-white cursor-pointer"
                      >
                        <option value="all">Todos os dias (10d)</option>
                        {riverDates.map((d) => (
                          <option key={d} value={d}>
                            {formatDateBr(d)}
                          </option>
                        ))}
                      </select>
                    )}
                    <div className="flex items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg">
                      <button
                        onClick={() => setRiverInterval('hourly')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                          riverInterval === 'hourly'
                            ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] font-semibold'
                            : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white'
                        }`}
                      >
                        Hora a hora
                      </button>
                      <button
                        onClick={() => setRiverInterval('all')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                          riverInterval === 'all'
                            ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] font-semibold'
                            : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white'
                        }`}
                      >
                        Todas (30 min)
                      </button>
                    </div>
                    <button
                      onClick={handleDownloadRiverCsv}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] text-[#14213D] dark:text-white cursor-pointer transition-colors"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5 text-[#FCA311]" />
                      CSV
                    </button>
                  </div>
                </div>

                {/* 4 KPIs do período selecionado */}
                {riverDayStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                    <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                      <div className="text-[11px] font-sans text-slate-500 dark:text-[#E5E5E5]/65">Cota Mínima do Período</div>
                      <div className="text-base font-semibold text-[#14213D] dark:text-white mt-0.5 tabular-nums">
                        {riverDayStats.min.toFixed(2)} m
                      </div>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                      <div className="text-[11px] font-sans text-slate-500 dark:text-[#E5E5E5]/65">Cota Máxima do Período</div>
                      <div className="text-base font-semibold text-[#14213D] dark:text-white mt-0.5 tabular-nums">
                        {riverDayStats.max.toFixed(2)} m
                      </div>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                      <div className="text-[11px] font-sans text-slate-500 dark:text-[#E5E5E5]/65">Variação da Lâmina</div>
                      <div className="text-base font-semibold text-[#FCA311] mt-0.5 tabular-nums">
                        {riverDayStats.variation.toFixed(2)} m
                      </div>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                      <div className="text-[11px] font-sans text-slate-500 dark:text-[#E5E5E5]/65">Chuva Acum. 24h (Leitura)</div>
                      <div className="text-base font-semibold text-[#14213D] dark:text-white mt-0.5 tabular-nums">
                        {riverDayStats.rain24h.toFixed(1)} mm
                      </div>
                    </div>
                  </div>
                )}

                <RiverChart
                  readings={displayedRiverReadings}
                  cotaAtencaoNum={parseFloat(rj?.cota_atencao || '1.99') || 1.99}
                  cotaAlertaNum={parseFloat(rj?.cota_alerta || '2.27') || 2.27}
                  cotaTransbordoNum={parseFloat(rj?.cota_transbordo || '2.84') || 2.84}
                />

                <div className="overflow-x-auto pt-4 border-t border-[#E5E5E5] dark:border-[#233354]">
                  <table className="w-full min-w-[720px] text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#E5E5E5] dark:border-[#233354] text-[11px] uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/65">
                        <th className="py-2.5 pr-4 font-medium">Data / Horário (BRT)</th>
                        <th className="py-2.5 px-3 font-medium text-right">Cota (m)</th>
                        <th className="py-2.5 px-3 font-medium">Estágio</th>
                        <th className="py-2.5 px-3 font-medium text-right">Folga Transbordo</th>
                        <th className="py-2.5 px-3 font-medium text-right">Chuva 1h</th>
                        <th className="py-2.5 px-3 font-medium text-right">Chuva 24h</th>
                        <th className="py-2.5 pl-4 font-medium text-right">Chuva 30d</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#233354]">
                      {displayedRiverReadings.slice().reverse().slice(0, 60).map((r) => {
                        const transbordo = parseFloat(rj?.cota_transbordo || '2.84') || 2.84;
                        const folga = Math.max(0, transbordo - r.nivel);
                        const estagio =
                          r.nivel >= transbordo
                            ? 'Transbordo'
                            : r.nivel >= 2.27
                              ? 'Alerta'
                              : r.nivel >= 1.99
                                ? 'Atenção'
                                : r.nivel >= 1.5
                                  ? 'Vigilância'
                                  : 'Normal';
                        const estagioDot =
                          r.nivel >= transbordo
                            ? 'bg-rose-500'
                            : r.nivel >= 2.27
                              ? 'bg-[#FA824C]'
                              : r.nivel >= 1.99
                                ? 'bg-[#FCA311]'
                                : r.nivel >= 1.5
                                  ? 'bg-[#3A73BA]'
                                  : 'bg-emerald-500';
                        return (
                          <tr key={r.datetime_brt} className="hover:bg-[#F7F8FA] dark:hover:bg-[#0B1324]/60 transition-colors">
                            <td className="py-3 pr-4 align-top font-mono text-xs text-slate-600 dark:text-[#E5E5E5]/80 whitespace-nowrap">
                              {r.datetime_brt.replace('T', ' ').slice(0, 16)}
                            </td>
                            <td className="py-3 px-3 align-top text-right font-mono font-semibold text-[#14213D] dark:text-white tabular-nums whitespace-nowrap">
                              {r.nivel.toFixed(2)} m
                            </td>
                            <td className="py-3 px-3 align-top text-xs font-medium text-[#14213D] dark:text-[#E5E5E5] whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${estagioDot}`} aria-hidden="true" />
                                {estagio}
                              </span>
                            </td>
                            <td className="py-3 px-3 align-top text-right font-mono text-xs text-slate-600 dark:text-[#E5E5E5]/80 tabular-nums whitespace-nowrap">
                              +{folga.toFixed(2)} m
                            </td>
                            <td className="py-3 px-3 align-top text-right font-mono text-slate-600 dark:text-[#E5E5E5]/80 tabular-nums whitespace-nowrap">
                              {r.chuva_1h.toFixed(1)} mm
                            </td>
                            <td className="py-3 px-3 align-top text-right font-mono text-slate-600 dark:text-[#E5E5E5]/80 tabular-nums whitespace-nowrap">
                              {r.chuva_24h.toFixed(1)} mm
                            </td>
                            <td className="py-3 pl-4 align-top text-right font-mono tabular-nums text-slate-500 dark:text-[#E5E5E5]/65 whitespace-nowrap">
                              {r.chuva_30d.toFixed(1)} mm
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t border-[#E5E5E5] dark:border-[#233354] flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/70">
                  <span className="font-semibold text-[#14213D] dark:text-white">Escala de Cotas:</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    &lt; 1,50 m Normal
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3A73BA]" aria-hidden="true" />
                    1,50–1,98 m Vigilância
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FCA311]" aria-hidden="true" />
                    ≥ 1,99 m Atenção
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FA824C]" aria-hidden="true" />
                    ≥ 2,27 m Alerta
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" aria-hidden="true" />
                    ≥ 2,84 m Transbordo
                  </span>
                </div>
              </section>
            )}

            {showSub('macae') && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 space-y-4">
                    <div className="pb-3 border-b border-[#E5E5E5] dark:border-[#233354]">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
                        Bacia Hidrográfica RH-VIII
                      </div>
                      <h2 className="font-display text-lg font-semibold text-[#14213D] dark:text-white mt-1">
                        Macaé e das Ostras • Escoamento e Foz
                      </h2>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed">
                      O Rio Jundiá corta áreas urbanas e rurais de Rio das Ostras, banhando os bairros Cantagalo, Âncora, Cláudio Ribeiro e desaguando em direção à orla costeira.
                    </p>
                    <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs space-y-1">
                      <div className="inline-flex items-center gap-1.5 font-semibold text-[#14213D] dark:text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FCA311]" aria-hidden="true" />
                        Influência das Marés Oceânicas
                      </div>
                      <div className="text-slate-600 dark:text-[#E5E5E5]/75 leading-relaxed">
                        Em marés astronômicas altas (preamar), o refluxo das águas marinhas diminui o gradiente hidráulico do rio, desacelerando o escoamento pluvial e aumentando o tempo de retenção nos leitos.
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 space-y-4">
                    <div className="pb-3 border-b border-[#E5E5E5] dark:border-[#233354]">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
                        Sensor Telemétrico Automático INEA (2241036)
                      </div>
                      <h2 className="font-display text-lg font-semibold text-[#14213D] dark:text-white mt-1">
                        Escala Oficial de Estágios INEA
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[11px]">
                      <div className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" aria-hidden="true" />
                        <div>
                          <div className="font-semibold text-[#14213D] dark:text-white">Normal (&lt; 1,50 m)</div>
                          <div className="text-slate-500 dark:text-[#E5E5E5]/70">Calha segura · Fluxo livre</div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#3A73BA] mt-1 shrink-0" aria-hidden="true" />
                        <div>
                          <div className="font-semibold text-[#14213D] dark:text-white">Vigilância (1,50–1,98 m)</div>
                          <div className="text-slate-500 dark:text-[#E5E5E5]/70">Monitoramento contínuo</div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#FCA311] mt-1 shrink-0" aria-hidden="true" />
                        <div>
                          <div className="font-semibold text-[#14213D] dark:text-white">Atenção ({rj?.cota_atencao || '1.99 m'})</div>
                          <div className="text-slate-500 dark:text-[#E5E5E5]/70">Prontidão operacional</div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#FA824C] mt-1 shrink-0" aria-hidden="true" />
                        <div>
                          <div className="font-semibold text-[#14213D] dark:text-white">Alerta ({rj?.cota_alerta || '2.27 m'})</div>
                          <div className="text-slate-500 dark:text-[#E5E5E5]/70">Risco de alagamentos</div>
                        </div>
                      </div>
                      <div className="sm:col-span-2 p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" aria-hidden="true" />
                        <div>
                          <div className="font-semibold text-[#14213D] dark:text-white">Transbordo (≥ {rj?.cota_transbordo || '2.84 m'})</div>
                          <div className="text-slate-500 dark:text-[#E5E5E5]/70">Extravasamento da calha</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Boletim Hidrometeorológico Oficial INEA RH-VIII */}
                {boletimMeta?.inea_boletim_hidrometeorologico && (
                  <div className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                      <div>
                        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
                          {boletimMeta.inea_boletim_hidrometeorologico.sala_situacao} · {boletimMeta.inea_boletim_hidrometeorologico.regiao_hidrografica}
                        </div>
                        <h3 className="font-display text-lg font-semibold text-[#14213D] dark:text-white mt-1">
                          {boletimMeta.inea_boletim_hidrometeorologico.titulo}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-0.5 font-mono">
                          Coleta: {boletimMeta.inea_boletim_hidrometeorologico.data_coleta}
                          {boletimMeta.inea_boletim_hidrometeorologico.contato_sala_situacao
                            ? ` · Tel: ${boletimMeta.inea_boletim_hidrometeorologico.contato_sala_situacao}`
                            : ''}
                        </p>
                      </div>
                      {boletimMeta.inea_boletim_hidrometeorologico.bulletin_info?.url_pdf && (
                        <a
                          href={boletimMeta.inea_boletim_hidrometeorologico.bulletin_info.url_pdf}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                        >
                          {boletimMeta.inea_boletim_hidrometeorologico.bulletin_info.label} <ExternalLink className="w-3.5 h-3.5 text-[#FCA311]" />
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'Hoje', item: boletimMeta.inea_boletim_hidrometeorologico.previsao_rh8?.hoje },
                        { key: 'Amanhã', item: boletimMeta.inea_boletim_hidrometeorologico.previsao_rh8?.amanha },
                      ].map(
                        ({ key, item }) =>
                          item && (
                            <div
                              key={key}
                              className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-2 text-xs"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E5E5E5] dark:border-[#233354]">
                                <span className="font-semibold text-[#14213D] dark:text-white">
                                  {key} ({item.data}) — {item.intensidade}
                                </span>
                                <span className="font-mono text-[#14213D] dark:text-[#FCA311] font-semibold tabular-nums">
                                  {item.faixa_chuva_mm} · {item.temp_min}°/{item.temp_max}°C
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed">{item.condicao}</p>
                              <div className="text-[11px] font-medium text-slate-600 dark:text-[#E5E5E5]/80 pt-1">
                                <span className="text-[#14213D] dark:text-white font-semibold">Rios:</span> {item.comportamento_rios}
                              </div>
                            </div>
                          )
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* ================= ABA 4: ORLA & PRAIAS ================= */}
        {activeTab === 'orla' && (
          <div className="space-y-8">
            {showSub('mar') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
                      {orla?.fonte_marinha || 'Marinha do Brasil (CHM / SMM - Área Delta)'}
                    </div>
                    <h1 className="font-display text-2xl font-semibold text-[#14213D] dark:text-white mt-1">
                      Condições do Mar & Ondas na Orla
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-1">
                      Previsão marítima (1 Semana / 8 Dias), ondulação, swell e enseadas ·{' '}
                      <strong className="text-[#14213D] dark:text-[#FCA311]">{orla?.mar_ondas || '--'}</strong> ({orla?.status_geral || 'Sem avisos vigentes'})
                    </p>
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg">
                    {(orla?.dias_rotulos || [
                      { key: 'd0', rotulo: 'Hoje', data_br: '' },
                      { key: 'd1', rotulo: 'Amanhã', data_br: '' },
                      { key: 'd2', rotulo: 'Depois', data_br: '' },
                    ]).map((d) => (
                      <button
                        key={d.key}
                        onClick={() => setOrlaDay(d.key as 'd0' | 'd1' | 'd2')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                          orlaDay === d.key
                            ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] font-semibold'
                            : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white'
                        }`}
                      >
                        {d.rotulo} {d.data_br ? `(${d.data_br})` : ''}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#14213D] dark:text-white">Enseadas Abrigadas</span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-600 dark:text-[#E5E5E5]/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                        Calmo
                      </span>
                    </div>
                    <div className="font-mono text-base font-semibold text-[#14213D] dark:text-white tabular-nums">
                      {orla?.praias_condicoes?.find((p) => p.perfil === 'abrigada')?.dias[orlaDay]?.ondas || '0,3 a 0,7 m'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/70">
                      Tartaruga, Centro, Bosque, Cemitério e Remanso
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#14213D] dark:text-white">Orla Oceânica</span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-600 dark:text-[#E5E5E5]/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FCA311]" aria-hidden="true" />
                        Moderado
                      </span>
                    </div>
                    <div className="font-mono text-base font-semibold text-[#FCA311] tabular-nums">
                      {orla?.praias_condicoes?.find((p) => p.perfil === 'oceanica')?.dias[orlaDay]?.ondas || orla?.mar_ondas || '1,2 a 1,6 m'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/70">
                      Costazul, Joana, Areias Negras e Mar do Norte
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E5E5] dark:border-[#233354] text-[11px] uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/65">
                        <th className="py-3 pr-4 font-medium">Praia / Fisiografia</th>
                        <th className="py-3 px-3 font-medium">Estado do Mar</th>
                        <th className="py-3 px-3 font-medium text-right">Ondas</th>
                        <th className="py-3 pl-4 font-medium">Detalhamento Técnico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#233354] text-sm">
                      {(orla?.praias_condicoes ?? []).map((p) => {
                        const diaInfo = p.dias[orlaDay];
                        const isWarn = diaInfo.badge === 'warning' || diaInfo.badge === 'danger';
                        return (
                          <tr key={p.nome} className="hover:bg-[#F7F8FA] dark:hover:bg-[#0B1324]/60 transition-colors">
                            <td className="py-3.5 pr-4 align-top">
                              <div className="font-medium text-[#14213D] dark:text-white whitespace-nowrap">{p.nome}</div>
                              <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/65">{p.tipo_orla}</div>
                            </td>
                            <td className="py-3.5 px-3 align-top text-xs font-medium whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 text-[#14213D] dark:text-[#E5E5E5]">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${isWarn ? 'bg-[#FCA311]' : 'bg-emerald-500'}`}
                                  aria-hidden="true"
                                />
                                {diaInfo.estado}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 align-top text-right font-mono text-xs text-[#14213D] dark:text-white tabular-nums whitespace-nowrap">
                              {diaInfo.ondas}
                            </td>
                            <td className="py-3.5 pl-4 align-top text-xs text-slate-600 dark:text-[#E5E5E5]/80">{diaInfo.detalhe}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {showSub('mares') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
                      {tabuaMares?.orgao_oficial || 'Marinha do Brasil — Centro de Hidrografia da Marinha (CHM / DHN)'}
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#14213D] dark:text-white mt-1">
                      Tábua de Marés — {tabuaMares?.estacao || 'Terminal Marítimo de Imbetiba (Macaé - RJ)'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1 font-mono">
                      Estação CHM #{tabuaMares?.id_estacao_chm || 39} · {tabuaMares?.latitude || '-22° 23\' S'} · {tabuaMares?.longitude || '-041° 46\' W'} · {tabuaMares?.fuso || 'UTC-3 (Brasília)'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {tabuaMares?.url_oficial && (
                      <a
                        href={tabuaMares.url_oficial}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                      >
                        Tábua Completa CHM <ExternalLink className="w-3.5 h-3.5 text-[#FCA311]" />
                      </a>
                    )}
                    {tabuaMares?.url_avisos && (
                      <a
                        href={tabuaMares.url_avisos}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                      >
                        Avisos CHM <ExternalLink className="w-3.5 h-3.5 text-[#FCA311]" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Card Destaque: Próxima Maré */}
                {tabuaMares?.proxima_mare && (
                  <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-[#0B1324] border-[#233354]'
                      : 'bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-amber-50/60 border-blue-200/90 shadow-xs'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        tabuaMares.proxima_mare.tipo === 'PREAMAR'
                          ? isDark ? 'bg-amber-950/60 border-amber-700/60 text-[#FCA311]' : 'bg-orange-100 border-orange-300 text-orange-700 shadow-2xs'
                          : isDark ? 'bg-sky-950/60 border-sky-700/60 text-sky-400' : 'bg-sky-100 border-sky-300 text-sky-700 shadow-2xs'
                      }`}>
                        {tabuaMares.proxima_mare.tipo === 'PREAMAR' ? (
                          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <ArrowDown className="w-5 h-5 stroke-[2.5]" />
                        )}
                      </div>
                      <div>
                        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/70 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Próximo Evento Astronômico de Maré
                        </div>
                        <div className="text-base font-bold text-[#14213D] dark:text-white mt-0.5">
                          {tabuaMares.proxima_mare.tipo === 'PREAMAR' ? 'Preia-mar (Maré Alta)' : 'Baixa-mar (Maré Baixa)'} às{' '}
                          <span className="font-mono text-orange-600 dark:text-[#FCA311]">{tabuaMares.proxima_mare.hora}</span> · Cota:{' '}
                          <span className="font-mono">{Number(tabuaMares.proxima_mare.altura).toFixed(1).replace('.', ',')} m</span>
                        </div>
                      </div>
                    </div>
                    <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
                      isDark ? 'bg-[#14213D] text-[#FCA311] border-[#233354]' : 'bg-white text-[#14213D] border-slate-200 shadow-2xs'
                    }`}>
                      Imbetiba / Rio das Ostras (#39)
                    </div>
                  </div>
                )}

                {/* Marés de Hoje (4 Indicadores com Ícones e Cores) */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-[#14213D] dark:text-white flex items-center gap-2">
                      <Waves className="w-4 h-4 text-sky-500" />
                      Eventos de Maré de Hoje ({tabuaMares?.dias?.[0]?.dia_semana || 'Hoje'} · {tabuaMares?.dias?.[0]?.data_br || ''})
                    </h3>
                    <span className="text-xs font-mono text-slate-500 dark:text-[#E5E5E5]/70">
                      Grade Astronômica Oficial
                    </span>
                  </div>

                  {tabuaMares?.dias?.[0]?.eventos && tabuaMares.dias[0].eventos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                      {tabuaMares.dias[0].eventos.map((ev, idx) => {
                        const isHigh = ev.tipo === 'PREAMAR';
                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border text-center transition-all ${
                              isDark
                                ? 'bg-[#0B1324] border-[#233354]'
                                : isHigh
                                ? 'bg-gradient-to-br from-orange-50 to-amber-50/70 border-orange-200/90 shadow-2xs'
                                : 'bg-gradient-to-br from-sky-50 to-blue-50/70 border-sky-200/90 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                              {isHigh ? (
                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase ${
                                  isDark ? 'text-orange-400' : 'text-orange-700'
                                }`}>
                                  <ArrowUp className="w-3.5 h-3.5 text-orange-500" /> Preia-mar
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase ${
                                  isDark ? 'text-sky-400' : 'text-sky-700'
                                }`}>
                                  <ArrowDown className="w-3.5 h-3.5 text-sky-500" /> Baixa-mar
                                </span>
                              )}
                            </div>
                            <div className="text-2xl font-bold text-[#14213D] dark:text-white tabular-nums">
                              {ev.hora}
                            </div>
                            <div className={`text-xs font-bold mt-1 tabular-nums ${
                              isHigh
                                ? isDark ? 'text-[#FCA311]' : 'text-orange-900'
                                : isDark ? 'text-sky-300' : 'text-sky-900'
                            }`}>
                              {Number(ev.altura).toFixed(1).replace('.', ',')} m
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs text-slate-600 dark:text-[#E5E5E5]/80">
                      As previsões astronômicas de maré (preia-mar e baixa-mar) são calculadas pelo Centro de Hidrografia da Marinha (CHM/DHN).
                    </div>
                  )}
                </div>

                {/* Tábua Semanal Completa (Próximos 7 Dias) */}
                {tabuaMares?.dias && tabuaMares.dias.length > 0 && (
                  <div className="pt-2 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-display text-base font-bold text-[#14213D] dark:text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        Tábua Semanal Completa de Marés (Próximos 7 Dias)
                      </h3>
                      <span className="text-xs font-mono text-slate-500 dark:text-[#E5E5E5]/70">
                        Estação #39 Imbetiba / Macaé e Rio das Ostras
                      </span>
                    </div>

                    <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-[#233354] bg-[#0B1324]' : 'border-slate-200 bg-white shadow-xs'}`}>
                      <table className="w-full text-xs font-mono border-collapse">
                        <thead>
                          <tr className={`border-b ${isDark ? 'border-[#233354] bg-[#14213D]' : 'border-slate-200 bg-slate-50'} text-left`}>
                            <th className="py-3 px-4 font-bold text-[#14213D] dark:text-white">Data / Dia</th>
                            <th className="py-3 px-3 font-bold text-[#14213D] dark:text-white text-center">1ª Maré</th>
                            <th className="py-3 px-3 font-bold text-[#14213D] dark:text-white text-center">2ª Maré</th>
                            <th className="py-3 px-3 font-bold text-[#14213D] dark:text-white text-center">3ª Maré</th>
                            <th className="py-3 px-3 font-bold text-[#14213D] dark:text-white text-center">4ª Maré</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-[#233354]' : 'divide-slate-100'}`}>
                          {tabuaMares.dias.map((dia, dIdx) => (
                            <tr
                              key={dia.data_iso}
                              className={`${
                                dIdx === 0
                                  ? isDark ? 'bg-white/5 font-semibold' : 'bg-amber-50/40 font-semibold'
                                  : ''
                              } hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors`}
                            >
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="font-bold text-[#14213D] dark:text-white flex items-center gap-2">
                                  <span>{dia.dia_semana}</span>
                                  {dIdx === 0 && (
                                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-[#FCA311] dark:border-amber-700/60 font-bold">
                                      Hoje
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70">{dia.data_br}</div>
                              </td>
                              {[0, 1, 2, 3].map((evIdx) => {
                                const ev = dia.eventos[evIdx];
                                if (!ev) return <td key={evIdx} className="py-3 px-3 text-center text-slate-400">—</td>;
                                const isHigh = ev.tipo === 'PREAMAR';
                                return (
                                  <td key={evIdx} className="py-3 px-3 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold border ${
                                      isHigh
                                        ? isDark ? 'bg-orange-950/50 text-orange-300 border-orange-800/50' : 'bg-orange-50 text-orange-800 border-orange-200 shadow-2xs'
                                        : isDark ? 'bg-sky-950/50 text-sky-300 border-sky-800/50' : 'bg-sky-50 text-sky-800 border-sky-200 shadow-2xs'
                                    }`}>
                                      {isHigh ? <ArrowUp className="w-3 h-3 text-orange-500" /> : <ArrowDown className="w-3 h-3 text-sky-500" />}
                                      <strong className="text-xs">{ev.hora}</strong>
                                      <span className="opacity-90">({Number(ev.altura).toFixed(1).replace('.', ',')}m)</span>
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {marinhaAvisos && (
                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold text-[#14213D] dark:text-white">
                        {marinhaAvisos.area} · {marinhaAvisos.forca} ({marinhaAvisos.rajadas})
                      </div>
                      <div className="text-slate-600 dark:text-[#E5E5E5]/80">{marinhaAvisos.validade}</div>
                    </div>
                    {marinhaAvisos.cartas_sinoticas && (
                      <div className="flex items-center gap-2 font-mono">
                        {marinhaAvisos.cartas_sinoticas.map((c) => (
                          <a
                            key={c.horario}
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#14213D] hover:border-[#FCA311] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                          >
                            Carta {c.horario}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {showSub('balnear') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
                      {balneabilidade?.orgao || 'INEA'} · Boletim nº {balneabilidade?.boletim_numero || 20} ({balneabilidade?.data_boletim || ''}) · CONAMA nº 274/2000
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#14213D] dark:text-white mt-1">
                      Balneabilidade Oficial das Praias ({balnearSummary.proprias.length} de {balnearSummary.total} Próprias — {balnearSummary.pctProprias}%)
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {balneabilidade?.url_seirhi && (
                      <a
                        href={balneabilidade.url_seirhi}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                      >
                        SEIRHI INEA <ExternalLink className="w-3 h-3 text-[#FCA311]" />
                      </a>
                    )}
                    {balneabilidade?.url_portal_inea && (
                      <a
                        href={balneabilidade.url_portal_inea}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                      >
                        Portal INEA <ExternalLink className="w-3 h-3 text-[#FCA311]" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Resumo Próprias vs Impróprias + Critério CONAMA */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#14213D] dark:text-white">Pontos Próprios para Banho</span>
                      <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#14213D] dark:text-white tabular-nums">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                        {balnearSummary.proprias.length} ({balnearSummary.pctProprias}%)
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-[#E5E5E5]/80 leading-relaxed">
                      {balnearSummary.proprias.map((p) => p.praia.replace('Praia ', '').replace('da ', '').replace('das ', '').replace('do ', '')).join(', ')}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#14213D] dark:text-white">Pontos Impróprios / Atenção</span>
                      <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#14213D] dark:text-white tabular-nums">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" aria-hidden="true" />
                        {balnearSummary.improprias.length} ({balnearSummary.pctImproprias}%)
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-[#E5E5E5]/80 leading-relaxed">
                      {balnearSummary.improprias.map((p) => `${p.praia} (${p.localizacao})`).join(' · ')}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1.5">
                    <div className="font-semibold text-[#14213D] dark:text-[#FCA311]">Critério CONAMA nº 274/2000</div>
                    <p className="text-slate-600 dark:text-[#E5E5E5]/80 leading-relaxed">
                      Próprio se Enterococos ≤ 100 NMP/100 mL em ao menos 4 das últimas 5 coletas e &lt; 400 NMP/100 mL na coleta mais recente.
                    </p>
                  </div>
                </div>

                {balneabilidade?.observacao_tecnica && (
                  <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs text-slate-600 dark:text-[#E5E5E5]/85">
                    <strong className="text-[#14213D] dark:text-white">Recomendação Oficial do INEA:</strong> {balneabilidade.observacao_tecnica}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E5E5] dark:border-[#233354] text-[11px] uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/65">
                        <th className="py-3 pr-4 font-medium">Código INEA</th>
                        <th className="py-3 px-3 font-medium">Praia</th>
                        <th className="py-3 px-3 font-medium">Localização da Coleta</th>
                        <th className="py-3 pl-4 font-medium">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#233354] text-sm">
                      {(balneabilidade?.pontos ?? []).map((pt) => (
                        <tr key={pt.codigo_seirhi} className="hover:bg-[#F7F8FA] dark:hover:bg-[#0B1324]/60 transition-colors">
                          <td className="py-3 pr-4 align-top font-mono text-xs text-slate-500 dark:text-[#E5E5E5]/70 whitespace-nowrap">{pt.codigo}</td>
                          <td className="py-3 px-3 align-top font-medium text-[#14213D] dark:text-white whitespace-nowrap">{pt.praia}</td>
                          <td className="py-3 px-3 align-top text-xs text-slate-600 dark:text-[#E5E5E5]/80">{pt.localizacao}</td>
                          <td className="py-3 pl-4 align-top text-xs font-medium whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-[#14213D] dark:text-[#E5E5E5]">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${pt.status === 'PRÓPRIA' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                aria-hidden="true"
                              />
                              {pt.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Segurança na Orla & Navegantes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E5E5E5] dark:border-[#233354] text-xs">
                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1.5">
                    <div className="font-semibold text-[#14213D] dark:text-white">Segurança na Orla & Banhistas</div>
                    <p className="text-slate-600 dark:text-[#E5E5E5]/80 leading-relaxed">
                      Respeite sempre as bandeiras de sinalização fixadas pelos guarda-vidas. Em caso de maré alta ou ondas superiores a 1,5 metro, evite banho nas áreas de costão e canais de correntes de retorno (Costazul e Praiamar).
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1.5">
                    <div className="font-semibold text-[#14213D] dark:text-white">Apoio a Navegantes & Embarcações (Capitania dos Portos / CHM)</div>
                    <p className="text-slate-600 dark:text-[#E5E5E5]/80 leading-relaxed">
                      Pequenas embarcações e praticantes de esportes náuticos devem consultar os avisos de mau tempo da Capitania dos Portos antes de se fazer ao mar, especialmente com ventos de quadrante Sudoeste/Sul.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ================= ABA 5: ALERTAS & SINÓTICO ================= */}
        {activeTab === 'alertas' && (
          <div className="space-y-8">
            {showSub('avisos') && (
              <section className="space-y-5">
                <div className="pb-3 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <h1 className="font-display text-2xl font-semibold text-[#14213D] dark:text-white">
                    Alertas Meteorológicos Oficiais Vigentes
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-1">
                    Monitoramento contínuo: Instituto Nacional de Meteorologia (INMET) & Marinha do Brasil (CHM)
                  </p>
                </div>

                {inmetAvisos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {inmetAvisos.map((av) => {
                      const todayIso = new Date().toISOString().slice(0, 10);
                      const iniIso = (av.inicio || '').slice(0, 10);
                      const fimIso = (av.fim || '').slice(0, 10);
                      const isVigenteHoje = Boolean(iniIso && fimIso && iniIso <= todayIso && todayIso <= fimIso);
                      const isFuturo = Boolean(iniIso && iniIso > todayIso);
                      const vigenciaLabel = isVigenteHoje
                        ? 'Vigente Hoje'
                        : isFuturo
                          ? `Programado ${av.inicio_formatado ? av.inicio_formatado.slice(0, 5) : ''}`
                          : fimIso && fimIso < todayIso
                            ? 'Encerrado'
                            : 'Aviso Ativo';
                      return (
                        <article
                          key={av.id}
                          className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] border-l-2 border-l-[#FCA311] rounded-xl p-6 flex flex-col justify-between gap-4"
                        >
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E5E5] dark:border-[#233354]">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold uppercase bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-white">
                                  INMET
                                </span>
                                <span className="font-mono text-xs text-[#FCA311] font-semibold">
                                  Aviso nº {av.id}
                                </span>
                                {av.eh_direto_ostras !== false && (
                                  <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[#F7F8FA] dark:bg-[#0B1324] text-slate-600 dark:text-[#E5E5E5]/80 border border-[#E5E5E5] dark:border-[#233354]">
                                    Rio das Ostras
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold border ${
                                    isVigenteHoje
                                      ? 'bg-[#F7F8FA] dark:bg-[#0B1324] text-[#FCA311] border-[#FCA311]/50'
                                      : 'bg-[#F7F8FA] dark:bg-[#0B1324] text-slate-600 dark:text-[#E5E5E5]/75 border-[#E5E5E5] dark:border-[#233354]'
                                  }`}
                                >
                                  {vigenciaLabel}
                                </span>
                              </div>
                              <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-[#FCA311]">
                                {av.cor_badge}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <h2 className="font-display text-lg font-semibold text-[#14213D] dark:text-white">
                                {av.descricao} — {av.severidade}
                              </h2>
                              <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 dark:text-[#E5E5E5]/75">
                                <Clock className="w-3.5 h-3.5 text-[#FCA311]" />
                                {av.inicio_formatado} → {av.fim_formatado}
                              </span>
                            </div>

                            <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-2 text-xs text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed">
                              <div>
                                <strong className="text-[#14213D] dark:text-white">Riscos:</strong>{' '}
                                {av.riscos.join(' ')}
                              </div>
                              <div>
                                <strong className="text-[#14213D] dark:text-white">Defesa Civil 199:</strong>
                                <ul className="mt-1 space-y-1 text-slate-500 dark:text-[#E5E5E5]/75">
                                  {av.instrucoes.map((ins, i) => (
                                    <li key={i}>• {ins}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[#E5E5E5] dark:border-[#233354] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/70">
                            <span className="truncate max-w-md" title={av.estados || ''}>
                              {av.estados ? `Abrangência: ${av.estados.split(',').join(', ')}` : 'Área: Costa do Sol / RJ'}
                            </span>
                            <a
                              href={`https://alertas2.inmet.gov.br/${av.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[#14213D] dark:text-[#FCA311] hover:underline shrink-0"
                            >
                              Ver no INMET <ExternalLink className="w-3 h-3 text-[#FCA311]" />
                            </a>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 text-sm">
                    Sem avisos ativos no INMET no momento.
                  </div>
                )}

                {marinhaAvisos && (
                  <div className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-[#FCA311] font-semibold">
                        MARINHA DO BRASIL (CHM / SMM) · {marinhaAvisos.tipo}
                      </div>
                      <div className="font-semibold text-sm text-[#14213D] dark:text-white">
                        {marinhaAvisos.area} · {marinhaAvisos.forca} ({marinhaAvisos.rajadas})
                      </div>
                      <div className="text-slate-600 dark:text-[#E5E5E5]/80">
                        {marinhaAvisos.validade} · Ondas: {marinhaAvisos.mar_ondas}
                        {marinhaAvisos.restricao ? ` · ${marinhaAvisos.restricao}` : ''}
                      </div>
                    </div>
                    {marinhaAvisos.cartas_sinoticas && (
                      <div className="flex flex-wrap items-center gap-2 font-mono">
                        {marinhaAvisos.cartas_sinoticas.map((c) => (
                          <a
                            key={c.horario}
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] hover:border-[#FCA311] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                          >
                            Carta Sinótica {c.horario} <ExternalLink className="w-3 h-3 text-[#FCA311]" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {boletimMeta?.alertas_estruturados && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                    {boletimMeta.alertas_estruturados.map((al) => (
                      <div
                        key={al.titulo}
                        className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-5 space-y-2"
                      >
                        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#FCA311]">{al.status}</div>
                        <div className="font-display text-base font-semibold text-[#14213D] dark:text-white">
                          {al.titulo}
                        </div>
                        <div className="text-xs font-medium text-[#FCA311]">{al.detalhe}</div>
                        <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/80 leading-relaxed">{al.impacto}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {showSub('cemaden') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
                      {cemadenRj?.redec || 'REDEC 1 - Baixadas Litorâneas'} · Atualizado: {boletimMeta?.cemaden_riscos?.atualizacao || '--'}
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#14213D] dark:text-white mt-1">
                      Riscos Geo-Hidrológicos Oficiais (CEMADEN / MCTI & RJ)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-1">
                      Monitoramento integrado de deslizamentos de encostas e riscos hidrológicos no Estado do RJ e em Rio das Ostras
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {boletimMeta?.cemaden_riscos?.url_boletim_hoje && (
                      <a
                        href={boletimMeta.cemaden_riscos.url_boletim_hoje}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                      >
                        Boletim Nacional CEMADEN <ExternalLink className="w-3.5 h-3.5 text-[#FCA311]" />
                      </a>
                    )}
                    {cemadenRj?.portal_url && (
                      <a
                        href={cemadenRj.portal_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                      >
                        Painel CEMADEN-RJ <ExternalLink className="w-3.5 h-3.5 text-[#FCA311]" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Sub-abas CEMADEN */}
                <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg w-fit">
                  {[
                    { id: 'sintese', label: 'Painel Estadual RJ & REDEC 1' },
                    { id: 'nacional', label: 'Boletim Nacional (Setores Locais)' },
                    { id: 'mapas', label: 'Mapas Nacionais & Estaduais' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setCemadenSubView(t.id as 'sintese' | 'nacional' | 'mapas')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                        cemadenSubView === t.id
                          ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] font-semibold'
                          : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {cemadenSubView === 'sintese' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="p-5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-base font-semibold text-[#14213D] dark:text-white">
                            CEMADEN-RJ • Risco Hidrológico
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#14213D] dark:text-[#FCA311]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FCA311]" aria-hidden="true" />
                            {cemadenRj?.risco_hidrologico?.nivel || 'ALTO'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed">
                          {cemadenRj?.risco_hidrologico?.diagnostico}
                        </p>
                        <div className="text-xs text-slate-600 dark:text-[#E5E5E5]/80">
                          <strong className="text-[#14213D] dark:text-white">Foco Municipal:</strong> {cemadenRj?.risco_hidrologico?.foco_municipal}
                        </div>
                        {cemadenRj?.estatisticas_estaduais?.hidrologico && (
                          <div className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/70 pt-2 border-t border-[#E5E5E5] dark:border-[#233354]">
                            Estado RJ ({cemadenRj.estatisticas_estaduais.hidrologico.total_municipios} municípios):{' '}
                            {Object.entries(cemadenRj.estatisticas_estaduais.hidrologico.contagens)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' · ')}
                          </div>
                        )}
                      </div>

                      <div className="p-5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-base font-semibold text-[#14213D] dark:text-white">
                            CEMADEN-RJ • Risco Geológico
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#14213D] dark:text-[#FCA311]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FCA311]" aria-hidden="true" />
                            {cemadenRj?.risco_geologico?.nivel || 'MODERADO'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed">
                          {cemadenRj?.risco_geologico?.diagnostico}
                        </p>
                        <div className="text-xs text-slate-600 dark:text-[#E5E5E5]/80">
                          <strong className="text-[#14213D] dark:text-white">Foco Municipal:</strong> {cemadenRj?.risco_geologico?.foco_municipal}
                        </div>
                        {cemadenRj?.estatisticas_estaduais?.geologico && (
                          <div className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/70 pt-2 border-t border-[#E5E5E5] dark:border-[#233354]">
                            Estado RJ ({cemadenRj.estatisticas_estaduais.geologico.total_municipios} municípios):{' '}
                            {Object.entries(cemadenRj.estatisticas_estaduais.geologico.contagens)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' · ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E5E5E5] dark:border-[#233354]">
                      <div className="text-xs font-semibold text-[#14213D] dark:text-white mb-3">
                        REDEC 1 & Região dos Lagos — 11 Municípios Monitorados
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
                        {REDEC_1_MUNICIPIOS.map((m) => (
                          <div
                            key={m.nome}
                            className={`p-2.5 rounded-lg border ${
                              m.destaque
                                ? 'border-[#FCA311] bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#FCA311] font-semibold'
                                : 'border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] text-slate-600 dark:text-[#E5E5E5]/80'
                            }`}
                          >
                            {m.nome}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {cemadenSubView === 'nacional' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[
                      boletimMeta?.cemaden_riscos?.alerta_rj_hidrologico,
                      boletimMeta?.cemaden_riscos?.alerta_rj_geologico,
                    ].map(
                      (al) =>
                        al && (
                          <div
                            key={al.titulo}
                            className="p-5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-3 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[#FCA311] font-semibold">{al.processo}</span>
                              <span className="font-mono font-semibold text-[#14213D] dark:text-white">{al.nivel}</span>
                            </div>
                            <h3 className="font-display text-base font-semibold text-[#14213D] dark:text-white">{al.titulo}</h3>
                            <p className="text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed">{al.descricao_oficial}</p>
                            <div className="pt-2 border-t border-[#E5E5E5] dark:border-[#233354] space-y-1">
                              <div className="font-semibold text-[#14213D] dark:text-white">Setores Monitorados em Rio das Ostras:</div>
                              <ul className="space-y-1 text-slate-600 dark:text-[#E5E5E5]/80">
                                {al.setores_rio_das_ostras.map((s) => (
                                  <li key={s}>• {s}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="pt-2 border-t border-[#E5E5E5] dark:border-[#233354] text-slate-600 dark:text-[#E5E5E5]/80">
                              <strong className="text-[#14213D] dark:text-white">Ação recomendada:</strong> {al.acoes_recomendadas}
                            </div>
                          </div>
                        )
                    )}
                  </div>
                )}

                {cemadenSubView === 'mapas' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { title: 'CEMADEN-RJ • Risco Hidrológico (SVG)', src: `${SITE_BASE}/${boletimMeta?.cemaden_riscos?.mapas?.painel_rj_hidro || 'img/cemaden/cemaden_rj_hidro.svg'}` },
                      { title: 'CEMADEN-RJ • Risco Geológico (SVG)', src: `${SITE_BASE}/${boletimMeta?.cemaden_riscos?.mapas?.painel_rj_geo || 'img/cemaden/cemaden_rj_geo.svg'}` },
                      { title: 'CEMADEN Nacional • Risco Hidrológico', src: `${SITE_BASE}/${boletimMeta?.cemaden_riscos?.mapas?.hidrologico || 'img/cemaden/cemaden_risco_hidrologico.png'}` },
                      { title: 'CEMADEN Nacional • Risco Geológico', src: `${SITE_BASE}/${boletimMeta?.cemaden_riscos?.mapas?.geologico || 'img/cemaden/cemaden_risco_geologico.png'}` },
                    ].map((mp) => (
                      <div
                        key={mp.title}
                        className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-2"
                      >
                        <div className="text-xs font-semibold text-[#14213D] dark:text-white">{mp.title}</div>
                        <div className="rounded-lg overflow-hidden border border-[#E5E5E5] dark:border-[#233354] bg-white p-2">
                          <img src={mp.src} alt={mp.title} referrerPolicy="no-referrer" className="w-full h-56 object-contain" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* ================= ABA 6: BOLETIM 16 TURNOS ================= */}
        {activeTab === 'boletim' && (
          <div className="space-y-8">
            {showSub('turnos') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <div>
                    <h1 className="font-display text-2xl font-semibold text-[#14213D] dark:text-white">
                      Precipitação por Turno Operacional
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-1">
                      Distribuição estimada para os turnos do dia · Emissão: {boletimMeta?.emissao || '--'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {boletimMeta?.analise_precipitacao_multifonte?.acumulado_3dias_media !== undefined && (
                      <span className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-slate-600 dark:text-[#E5E5E5]/80">
                        Total 3D: <strong className="text-[#14213D] dark:text-white tabular-nums">{boletimMeta.analise_precipitacao_multifonte.acumulado_3dias_media.toFixed(1)} mm</strong>
                      </span>
                    )}
                    {boletimMeta?.analise_precipitacao_multifonte?.acumulado_semana_media !== undefined && (
                      <span className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-slate-600 dark:text-[#E5E5E5]/80">
                        Semana: <strong className="text-[#FCA311] tabular-nums">{boletimMeta.analise_precipitacao_multifonte.acumulado_semana_media.toFixed(1)} mm</strong>
                      </span>
                    )}
                    <button
                      onClick={() => setShowFullBoletimTable((v) => !v)}
                      className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] text-[#14213D] dark:text-[#E5E5E5] cursor-pointer transition-colors"
                    >
                      {showFullBoletimTable ? 'Ver Cards por Dia' : 'Ver Tabela Completa dos Turnos'}
                    </button>
                  </div>
                </div>

                {boletimMeta?.analise_precipitacao_multifonte?.acumulado_semana_formula && (
                  <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs font-mono text-slate-600 dark:text-[#E5E5E5]/85">
                    <span className="font-sans font-semibold text-[#14213D] dark:text-white mr-2">
                      Somatório 1 Semana (Hoje + 7 Dias):
                    </span>
                    {boletimMeta.analise_precipitacao_multifonte.acumulado_semana_formula}
                  </div>
                )}

                {!showFullBoletimTable ? (
                  <>
                    <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg overflow-x-auto">
                      {boletimDates.map((d) => (
                        <button
                          key={d.data_iso}
                          onClick={() => setSelectedBoletimDate(d.data_iso)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                            (selectedBoletimDate || boletimDates[0]?.data_iso) === d.data_iso
                              ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] font-semibold'
                              : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white'
                          }`}
                        >
                          {formatDateBr(d.data_iso)} · {d.dia_semana}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {activeBoletimShifts.map((s) => (
                        <div
                          key={`${s.data_iso}-${s.turno}`}
                          className="p-5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-2.5"
                        >
                          <div className="flex items-baseline justify-between">
                            <span className="font-semibold text-sm text-[#14213D] dark:text-white">{s.turno}</span>
                            <span className="font-mono text-xs text-slate-500 dark:text-[#E5E5E5]/65">
                              {s.temp_min}° – {s.temp_max}°C
                            </span>
                          </div>
                          <div className="font-mono text-2xl font-semibold text-[#FCA311] tabular-nums">
                            {s.chuva_media.toFixed(1)} <span className="text-xs font-normal text-slate-500">mm</span>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-[#E5E5E5]/80 space-y-0.5 font-mono">
                            <div>Prob: {s.chuva_prob ?? '--'}% · {s.taxa_horaria_txt || ''}</div>
                            <div>Vento: {s.vento_dir} {s.vento_vel_media} km/h (Raj. {s.rajada_max})</div>
                            <div>Umid: {s.umid_min}–{s.umid_max}% · {s.pressao_hpa} hPa</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#E5E5E5] dark:border-[#233354] text-[11px] uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/65">
                          <th className="py-2.5 pr-3 font-medium">Data</th>
                          <th className="py-2.5 px-3 font-medium">Turno</th>
                          <th className="py-2.5 px-3 font-medium text-right">Temp (°C)</th>
                          <th className="py-2.5 px-3 font-medium text-right">Chuva</th>
                          <th className="py-2.5 px-3 font-medium text-right">Vento / Raj.</th>
                          <th className="py-2.5 px-3 font-medium text-right">Umidade</th>
                          <th className="py-2.5 pl-3 font-medium text-right">Pressão</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#233354] font-mono">
                        {boletimOficial.map((row) => (
                          <tr key={`${row.data_iso}-${row.turno}`} className="hover:bg-[#F7F8FA] dark:hover:bg-[#0B1324]/60 transition-colors">
                            <td className="py-2.5 pr-3 align-top text-slate-600 dark:text-[#E5E5E5]/80 whitespace-nowrap">{formatDateBr(row.data_iso)}</td>
                            <td className="py-2.5 px-3 align-top font-sans font-medium text-[#14213D] dark:text-white whitespace-nowrap">{row.turno}</td>
                            <td className="py-2.5 px-3 align-top text-right tabular-nums whitespace-nowrap">{row.temp_min}–{row.temp_max}°</td>
                            <td className="py-2.5 px-3 align-top text-right text-[#FCA311] font-semibold tabular-nums whitespace-nowrap">
                              {row.chuva_media.toFixed(1)} mm ({row.chuva_prob ?? 0}%)
                            </td>
                            <td className="py-2.5 px-3 align-top text-right tabular-nums whitespace-nowrap">{row.vento_dir} {row.vento_vel_media}/{row.rajada_max}</td>
                            <td className="py-2.5 px-3 align-top text-right tabular-nums whitespace-nowrap">{row.umid_min}–{row.umid_max}%</td>
                            <td className="py-2.5 pl-3 align-top text-right tabular-nums whitespace-nowrap">{row.pressao_hpa} hPa</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Síntese Multi-Fonte de Precipitação */}
                {boletimMeta?.analise_precipitacao_multifonte && (
                  <div className="pt-5 border-t border-[#E5E5E5] dark:border-[#233354] space-y-4">
                    <div>
                      <h2 className="font-display text-base font-semibold text-[#14213D] dark:text-white">
                        Síntese Multi-Fonte de Precipitação (Observado + Modelos + Alertas INMET)
                      </h2>
                      {boletimMeta.analise_precipitacao_multifonte.metodologia && (
                        <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-0.5">
                          {boletimMeta.analise_precipitacao_multifonte.metodologia}
                        </p>
                      )}
                    </div>

                    {boletimMeta.analise_precipitacao_multifonte.observado_recente && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {boletimMeta.analise_precipitacao_multifonte.observado_recente.cemaden_pcd_18789 && (
                          <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1">
                            <div className="font-semibold text-[#14213D] dark:text-white">
                              {boletimMeta.analise_precipitacao_multifonte.observado_recente.cemaden_pcd_18789.estacao}
                            </div>
                            <div className="font-mono text-slate-600 dark:text-[#E5E5E5]/85 tabular-nums">
                              1h: {boletimMeta.analise_precipitacao_multifonte.observado_recente.cemaden_pcd_18789.chuva_1h} mm · 24h: {boletimMeta.analise_precipitacao_multifonte.observado_recente.cemaden_pcd_18789.chuva_24h} mm · 96h: {boletimMeta.analise_precipitacao_multifonte.observado_recente.cemaden_pcd_18789.chuva_96h} mm
                            </div>
                          </div>
                        )}
                        {boletimMeta.analise_precipitacao_multifonte.observado_recente.inea_rio_jundia && (
                          <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1">
                            <div className="font-semibold text-[#14213D] dark:text-white">
                              {boletimMeta.analise_precipitacao_multifonte.observado_recente.inea_rio_jundia.estacao}
                            </div>
                            <div className="font-mono text-slate-600 dark:text-[#E5E5E5]/85 tabular-nums">
                              Cota: <strong className="text-[#14213D] dark:text-[#FCA311]">{boletimMeta.analise_precipitacao_multifonte.observado_recente.inea_rio_jundia.nivel_m} m</strong> ({boletimMeta.analise_precipitacao_multifonte.observado_recente.inea_rio_jundia.status}) · 24h: {boletimMeta.analise_precipitacao_multifonte.observado_recente.inea_rio_jundia.chuva_24h} mm
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {boletimMeta.analise_precipitacao_multifonte.previsto_por_dia && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs font-mono">
                        {boletimMeta.analise_precipitacao_multifonte.previsto_por_dia.map((d) => (
                          <div
                            key={d.data_iso}
                            className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1"
                          >
                            <div className="font-semibold text-[#14213D] dark:text-white">{d.data_br.slice(0, 5)}</div>
                            <div className="text-[10px] font-sans text-slate-500">{d.dia_semana}</div>
                            <div className="text-sm font-semibold text-[#FCA311] tabular-nums">{d.chuva_media_modelos_mm.toFixed(1)} mm</div>
                            <div className="text-[10px] text-slate-500">{d.taxa_horaria_pico}</div>
                            {d.tem_alerta_inmet && (
                              <div className="text-[10px] text-slate-600 dark:text-[#FCA311] font-semibold">INMET #{d.alerta_inmet_id}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {boletimMeta.analise_precipitacao_multifonte.conclusao_sem_pontas_soltas && (
                      <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/80 leading-relaxed">
                        {boletimMeta.analise_precipitacao_multifonte.conclusao_sem_pontas_soltas}
                      </p>
                    )}
                  </div>
                )}
              </section>
            )}

            {showSub('meteogramas') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <h2 className="font-display text-lg font-semibold text-[#14213D] dark:text-white">
                    Meteogramas Numéricos Oficiais (CPTEC / INMET)
                  </h2>
                  <div className="flex items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg">
                    {[
                      { id: 'prob', label: 'CPTEC Prob. 24h' },
                      { id: 'wwatch', label: 'WaveWatch III' },
                      { id: 'inmet', label: 'INMET 3304524' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMeteoView(m.id as 'prob' | 'wwatch' | 'inmet')}
                        className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                          meteoView === m.id
                            ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] font-semibold'
                            : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {meteoView === 'prob' && (
                  <img
                    src={`${SITE_BASE}/img/cptec/mapa_prev_prob_24h_chuvaintensa.png`}
                    alt="Previsão Probabilística 24h CPTEC/INPE"
                    referrerPolicy="no-referrer"
                    className="w-full max-h-96 object-contain rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-white"
                  />
                )}
                {meteoView === 'wwatch' && (
                  <img
                    src={`${SITE_BASE}/img/cptec/wwatch_alt_onda_sud_000h.png`}
                    alt="Modelo WaveWatch III Altura Significativa de Onda CPTEC"
                    referrerPolicy="no-referrer"
                    className="w-full max-h-96 object-contain rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-white"
                  />
                )}
                {meteoView === 'inmet' && (
                  <div className="p-6 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-3">
                    <div className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-[#FCA311]">INMET COSMO · Município 3304524 (Rio das Ostras)</div>
                    <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/85">
                      Acesse o meteograma dinâmico interativo diretamente no portal oficial do INMET:
                    </p>
                    <a
                      href="https://meteograma.inmet.gov.br/3304524/dinamico"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] hover:opacity-90 transition-opacity"
                    >
                      Abrir Meteograma INMET 3304524 <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </section>
            )}

            {showSub('telefones') && (
              <section className="space-y-6">
                <div className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-4">
                  <div className="pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                    <h2 className="font-display text-lg font-semibold text-[#14213D] dark:text-white">
                      Telefones Úteis & Pronta Resposta — Central de Emergências
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-0.5">
                      Atendimento 24 horas gratuito para ocorrências em Rio das Ostras.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {CENTRAL_EMERGENCIAS.map((item) => (
                      <div
                        key={item.telefone}
                        className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="text-sm font-medium text-[#14213D] dark:text-white">{item.orgao}</div>
                          <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/70">{item.detalhe}</div>
                        </div>
                        <a
                          href={`tel:${item.telefone}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] font-mono text-sm font-semibold text-[#14213D] dark:text-white transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#FCA311]" />
                          {item.telefone}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {boletimMeta?.fontes_oficiais_consultadas && boletimMeta.fontes_oficiais_consultadas.length > 0 && (
                  <div className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-4">
                    <div className="pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                      <h3 className="font-display text-base font-semibold text-[#14213D] dark:text-white">
                        Fontes Oficiais Consultadas ({boletimMeta.fontes_oficiais_consultadas.length} Portais & APIs)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-0.5">
                        Acesso direto aos órgãos públicos e sistemas de telemetria integrados ao portal
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {boletimMeta.fontes_oficiais_consultadas.map((f) => (
                        <a
                          key={f.nome}
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] transition-colors flex flex-col justify-between gap-1.5"
                        >
                          <div className="font-semibold text-[#14213D] dark:text-white leading-snug">{f.nome}</div>
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/65">
                            <span>{f.tipo}</span>
                            <ExternalLink className="w-3 h-3 text-[#FCA311] shrink-0" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* ================= ABA 7: PANORAMA MENSAL ================= */}
        {activeTab === 'panorama' && (
          <div className="space-y-8">
            <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-6">
              <div className="pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
                  Consolidado Oficial da Rede Pluviométrica
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14213D] dark:text-white mt-1">
                  Panorama Mensal do Clima — {mensalOutubro?.rotulo_mes || 'Outubro/2026'}
                </h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-6 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                  <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/65">Média Municipal Acumulada</div>
                  <div className="font-mono text-3xl sm:text-4xl font-semibold text-[#14213D] dark:text-white mt-2 tabular-nums">
                    {mensalOutubro ? `${mensalOutubro.chuva_total_media_mm.toFixed(1)} mm` : '--'}
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                  <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/65">Dias com Chuva</div>
                  <div className="font-mono text-3xl sm:text-4xl font-semibold text-[#14213D] dark:text-white mt-2 tabular-nums">
                    {mensalOutubro ? `${mensalOutubro.dias_com_chuva} / ${mensalOutubro.dias_registrados}` : '--'}
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                  <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/65">Maior Estação do Mês</div>
                  <div className="font-mono text-3xl sm:text-4xl font-semibold text-[#FCA311] mt-2 tabular-nums">
                    {mensalOutubro ? `${mensalOutubro.chuva_maior_estacao_mm.toFixed(1)} mm` : '--'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
                    {mensalOutubro?.chuva_maior_estacao_nome || ''}
                  </div>
                </div>
              </div>
            </section>

            {subSection === 'video' && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 flex flex-col items-center space-y-5">
                <div className="text-center">
                  <h2 className="font-display text-xl font-semibold text-[#14213D] dark:text-white">
                    Vídeo Master Oficial • 1080x1920 (46.8s)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-1">
                    Renderização em alta definição pronta para Reels / Stories.
                  </p>
                </div>

                <div className="w-full max-w-[340px] rounded-2xl overflow-hidden border border-[#E5E5E5] dark:border-[#233354] bg-[#05080F] aspect-[9/16]">
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                    src={`${SITE_BASE}/img/panorama/video_reels_outubro_2026.mp4`}
                  />
                </div>

                <a
                  href={`${SITE_BASE}/img/panorama/video_reels_outubro_2026.mp4`}
                  download="video_reels_outubro_2026.mp4"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] hover:opacity-90 transition-opacity"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Baixar Vídeo Master (.MP4)
                </a>
              </section>
            )}

            {(subSection === 'feed' || subSection === 'stories') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
                      {subSection === 'feed' ? 'Carrossel Feed (4:5)' : 'Stories / Reels (9:16)'} · Lâmina {panoramaSlideIdx + 1} de {PANORAMA_SLIDES.length}
                    </div>
                    <h2 className="font-display text-lg font-semibold text-[#14213D] dark:text-white mt-0.5">
                      {PANORAMA_SLIDES[panoramaSlideIdx].title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPanoramaSlideIdx((i) => (i - 1 + PANORAMA_SLIDES.length) % PANORAMA_SLIDES.length)}
                      className="p-2 rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] cursor-pointer transition-colors"
                      aria-label="Lâmina anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPanoramaSlideIdx((i) => (i + 1) % PANORAMA_SLIDES.length)}
                      className="p-2 rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] cursor-pointer transition-colors"
                      aria-label="Próxima lâmina"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <a
                      href={`${SITE_BASE}/img/panorama/${subSection === 'feed' ? 'feed' : 'stories'}/${PANORAMA_SLIDES[panoramaSlideIdx].file}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] hover:opacity-90 transition-opacity"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      Baixar PNG HD
                    </a>
                  </div>
                </div>

                <img
                  src={`${SITE_BASE}/img/panorama/${subSection === 'feed' ? 'feed' : 'stories'}/${PANORAMA_SLIDES[panoramaSlideIdx].file}`}
                  alt={PANORAMA_SLIDES[panoramaSlideIdx].title}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-[520px] object-contain rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#05080F]"
                />
              </section>
            )}

            {subSection === 'legenda' && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <h2 className="font-display text-lg font-semibold text-[#14213D] dark:text-white">
                    Legenda Formatada para Feed & Reels
                  </h2>
                  <button
                    onClick={handleCopyCaption}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCaption ? 'Legenda Copiada' : 'Copiar Legenda'}
                  </button>
                </div>

                <pre className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs font-mono text-[#14213D] dark:text-[#E5E5E5] whitespace-pre-wrap leading-relaxed">
                  {panoramaCaption}
                </pre>
              </section>
            )}
          </div>
        )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#14213D] mt-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-[#E5E5E5]/75">
          <div>
            TEMPO em Rio das Ostras · Portal independente de monitoramento meteorológico e marítimo
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-[#FCA311]" />
              Fontes: INMET · CPTEC/INPE · Marinha (CHM) · INEA · CEMADEN · Open-Meteo
            </span>
            <button
              onClick={() => setIsCssModalOpen(true)}
              className="font-medium text-[#14213D] dark:text-[#FCA311] hover:underline cursor-pointer"
            >
              Copiar CSS do Tema
            </button>
          </div>
        </div>
      </footer>

      <CssExportModal isOpen={isCssModalOpen} onClose={() => setIsCssModalOpen(false)} />
    </div>
  );
}
