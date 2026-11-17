import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Download,
  Droplets,
  ExternalLink,
  Eye,
  Film,
  Flame,
  Gauge,
  Info,
  MapPin,
  Menu,
  Moon,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  Square,
  Sun,
  Sunrise,
  Thermometer,
  Umbrella,
  Waves,
  WifiOff,
  Camera,
  Smartphone,
  SunMedium,
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
  MarinhaAvisoItem,
  MarinhaAvisos,
  OpenMeteoData,
  OrlaDataset,
  SITE_BASE,
  TabuaMares,
  degToCompass,
  enrichAcumuladosWithLiveTelemetry,
  fetchMarinhaAvisosLive,
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
import { exportChartToInstagramPng, InstagramFormat } from './utils/exportChartInstagram';
import { RiverChart } from './components/RiverChart';
import { SocialExportModal } from './components/SocialExportModal';
import { PwaInstallModal } from './components/PwaInstallModal';

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

const TAB_SUBSECTIONS: Record<SectionTab, { id: string; label: string; shortLabel?: string }[]> = {
  previsao: [
    { id: 'tempo-agora', label: 'Tempo Agora', shortLabel: 'Tempo Agora' },
    { id: 'graficos', label: 'Gráficos de Tendência', shortLabel: 'Gráficos' },
    { id: 'proximos-dias', label: 'Previsão dos Próximos Dias', shortLabel: 'Próximos Dias' },
    { id: 'sinotico', label: 'Panorama Sinótico Geral', shortLabel: 'Sinótico' },
    { id: 'plancon', label: 'Plano de Contingência (PLANCON)', shortLabel: 'PLANCON' },
    { id: 'all', label: 'Ver Todas as Seções', shortLabel: 'Ver Tudo' },
  ],
  chuva: [
    { id: 'resumo', label: 'Resumo & KPIs de Chuva', shortLabel: 'Resumo' },
    { id: 'cards', label: '8 Estações da Rede', shortLabel: '8 Estações' },
    { id: 'tabela', label: 'Tabela Comparativa', shortLabel: 'Tabela' },
    { id: 'planilha', label: 'Histórico em Planilha', shortLabel: 'Planilha' },
    { id: 'all', label: 'Ver Todas as Seções', shortLabel: 'Ver Tudo' },
  ],
  rio: [
    { id: 'cota', label: 'Cota Atual & Calha do Rio', shortLabel: 'Cota Atual' },
    { id: 'historico', label: 'Histórico Telemétrico 24h & 10d', shortLabel: 'Histórico' },
    { id: 'macae', label: 'Rios da Região (Macaé & RH-VIII)', shortLabel: 'Rios Região' },
    { id: 'all', label: 'Ver Todas as Seções', shortLabel: 'Ver Tudo' },
  ],
  orla: [
    { id: 'mar', label: 'Condições do Mar & Ondas', shortLabel: 'Mar & Ondas' },
    { id: 'mares', label: 'Tábua de Marés', shortLabel: 'Marés' },
    { id: 'balnear', label: 'Balneabilidade das Praias', shortLabel: 'Balneabilidade' },
    { id: 'all', label: 'Ver Todas as Seções', shortLabel: 'Ver Tudo' },
  ],
  alertas: [
    { id: 'avisos', label: 'Alertas Meteorológicos Vigentes', shortLabel: 'Alertas' },
    { id: 'cemaden', label: 'Riscos Geo-Hidrológicos (CEMADEN)', shortLabel: 'CEMADEN' },
    { id: 'all', label: 'Ver Todas as Seções', shortLabel: 'Ver Tudo' },
  ],
  boletim: [
    { id: 'turnos', label: 'Previsão Operacional 16 Turnos', shortLabel: '16 Turnos' },
    { id: 'meteogramas', label: 'Meteogramas Numéricos', shortLabel: 'Meteogramas' },
    { id: 'telefones', label: 'Telefones Úteis & Pronta Resposta', shortLabel: 'Telefones' },
    { id: 'all', label: 'Ver Todas as Seções', shortLabel: 'Ver Tudo' },
  ],
  panorama: [
    { id: 'video', label: 'Vídeo Reels (9:16)', shortLabel: 'Vídeo' },
    { id: 'feed', label: 'Carrossel Feed (4:5)', shortLabel: 'Feed' },
    { id: 'stories', label: 'Stories / Reels (9:16)', shortLabel: 'Stories' },
    { id: 'legenda', label: 'Legenda Formatada', shortLabel: 'Legenda' },
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
  const [activeTab, setActiveTab] = useState<SectionTab>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const t = p.get('tab') as SectionTab;
      if (t && ['previsao', 'chuva', 'rio', 'orla', 'alertas', 'boletim', 'panorama'].includes(t)) return t;
    } catch {}
    return 'previsao';
  });
  const [activeSub, setActiveSub] = useState<Record<SectionTab, string>>(() => {
    const defaults: Record<SectionTab, string> = {
      previsao: 'tempo-agora',
      chuva: 'resumo',
      rio: 'cota',
      orla: 'mar',
      alertas: 'avisos',
      boletim: 'turnos',
      panorama: 'video',
    };
    try {
      const p = new URLSearchParams(window.location.search);
      const s = p.get('sub');
      const t = (p.get('tab') as SectionTab) || 'previsao';
      if (s) defaults[t] = s;
    } catch {}
    return defaults;
  });

  const [isDark, setIsDark] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const theme = p.get('theme');
      if (theme === 'dark') return true;
      if (theme === 'light') return false;
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
    } catch {}
    return false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);

  useEffect(() => {
    try {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      if (isStandalone) setIsAppInstalled(true);
    } catch {}

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

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
  const [chartMetric, setChartMetric] = useState<ChartMetric>(() => {
    try {
      const m = new URLSearchParams(window.location.search).get('metric') as ChartMetric;
      if (m && ['temp', 'rain', 'wind', 'pressure', 'humidity'].includes(m)) return m;
    } catch {}
    return 'temp';
  });
  const [horizonCount, setHorizonCount] = useState<number>(() => {
    try {
      const h = parseInt(new URLSearchParams(window.location.search).get('horizon') || '', 10);
      if (h > 0) return h;
    } catch {}
    return 192;
  });
  const [chartDayFilter, setChartDayFilter] = useState<string>(() => {
    try {
      const d = new URLSearchParams(window.location.search).get('day');
      if (d) return d;
    } catch {}
    return 'all';
  });
  const [showChartValues, setShowChartValues] = useState<boolean>(true);
  const [openChartMenu, setOpenChartMenu] = useState<'metric' | 'period' | 'instagram' | null>(null);
  const [chartExportTheme, setChartExportTheme] = useState<'auto' | 'dark' | 'light'>('auto');
  const [chartExportingFmt, setChartExportingFmt] = useState<InstagramFormat | null>(null);
  const [chartExportDone, setChartExportDone] = useState<string | null>(null);
  const chartToolbarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openChartMenu) return;
    const onDown = (ev: MouseEvent) => {
      if (chartToolbarRef.current && !chartToolbarRef.current.contains(ev.target as Node)) {
        setOpenChartMenu(null);
      }
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setOpenChartMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [openChartMenu]);

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
  const [meteoView, setMeteoView] = useState<'cptec' | 'inmet' | 'wwatch'>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const m = p.get('meteo') as 'cptec' | 'inmet' | 'wwatch';
      if (m && ['cptec', 'inmet', 'wwatch'].includes(m)) return m;
    } catch {}
    return 'cptec';
  });
  const [cemadenSubView, setCemadenSubView] = useState<'sintese' | 'nacional' | 'mapas'>('sintese');

  const [alertaFiltroLocal, setAlertaFiltroLocal] = useState<'todos' | 'ostras' | 'outros'>('todos');
  const [panoramaSlideIdx, setPanoramaSlideIdx] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const subSection = activeSub[activeTab];
  const showSub = (id: string) => subSection === 'all' || subSection === id;

  const setSubForTab = (tab: SectionTab, subId: string) => {
    setActiveSub((prev) => ({ ...prev, [tab]: subId }));
  };

  const acumuladosRef = useRef<AcumuladosDataset | null>(null);
  const lastLiveSyncMsRef = useRef<number>(0);

  useEffect(() => {
    acumuladosRef.current = acumulados;
  }, [acumulados]);

  const [syncingMarinha, setSyncingMarinha] = useState(false);

  const refreshMarinhaLive = async () => {
    setSyncingMarinha(true);
    try {
      const mLive = await fetchMarinhaAvisosLive();
      if (mLive) {
        setMarinhaAvisos(mLive);
      }
    } catch (e) {
      console.warn('Falha ao atualizar avisos da Marinha:', e);
    } finally {
      setSyncingMarinha(false);
    }
  };

  const runLiveStationsRefresh = async (quickOnly = false, forceFullHistory = false) => {
    try {
      const live = await enrichAcumuladosWithLiveTelemetry(acumuladosRef.current, {
        quickOnly,
        forceFullHistory,
      });
      if (live) {
        acumuladosRef.current = live;
        setAcumulados(live);
        lastLiveSyncMsRef.current = Date.now();
      }
    } catch (e) {
      console.warn('Falha na sincronizacao ao vivo das estacoes:', e);
    }
  };

  const fetchAll = async (forceFullHistory = false) => {
    setSyncing(true);
    try {
      const res = await loadAllLiveSiteData({ forceFullHistory });
      if (res.acumulados) {
        acumuladosRef.current = res.acumulados;
        setAcumulados(res.acumulados);
        lastLiveSyncMsRef.current = Date.now();
      }
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
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAll(false);

    // Pulso rapido de 20s para acompanhar estacoes Weather Underground em tempo real
    const fastTimer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        runLiveStationsRefresh(true, false);
      }
    }, 20_000);

    // Sincronizacao completa das janelas de chuva (WU 5m/7d + CEMADEN 96h) a cada 2 minutos
    const stationsTimer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        runLiveStationsRefresh(false, false);
      }
    }, 120_000);

    // Verificacao prioritaria a cada 60s dos Avisos Oficiais da Marinha (CHM)
    const marinhaTimer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        refreshMarinhaLive();
      }
    }, 60_000);

    // Recarga completa de snapshots oficiais (Rio Jundia, alertas INMET, Marinha, Open-Meteo) a cada 5 minutos
    const fullTimer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        fetchAll(false);
      }
    }, 300_000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastLiveSyncMsRef.current > 15_000) {
        const needFull = Date.now() - lastLiveSyncMsRef.current > 120_000;
        runLiveStationsRefresh(!needFull, false);
        refreshMarinhaLive();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    (window as any).syncLiveStationsTelemetry = async (_force = true, quickOnly = false) => {
      await runLiveStationsRefresh(Boolean(quickOnly), !quickOnly);
    };

    return () => {
      window.clearInterval(fastTimer);
      window.clearInterval(stationsTimer);
      window.clearInterval(marinhaTimer);
      window.clearInterval(fullTimer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'alertas' || activeTab === 'orla') {
      refreshMarinhaLive();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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

  const SHIFT_HOURLY_WEIGHTS: Record<string, number[]> = useMemo(() => ({
    Madrugada: [0.10, 0.15, 0.25, 0.25, 0.15, 0.10], // 00h - 05h
    Manhã:     [0.10, 0.10, 0.15, 0.20, 0.25, 0.20], // 06h - 11h
    Tarde:     [0.08, 0.12, 0.25, 0.30, 0.15, 0.10], // 12h - 17h (pico convectivo 14h-16h)
    Noite:     [0.25, 0.30, 0.20, 0.15, 0.07, 0.03], // 18h - 23h
  }), []);

  const { hourlyPoints, allHourlyPoints, chartDayOptions } = useMemo(() => {
    if (!openMeteo?.hourly) {
      return { hourlyPoints: [] as HourlyPoint[], allHourlyPoints: [] as HourlyPoint[], chartDayOptions: [] as string[] };
    }
    const allPts: HourlyPoint[] = openMeteo.hourly.time.map((t, i) => {
      const [datePart, hourPart] = t.split('T');
      const hourNum = parseInt(hourPart?.slice(0, 2) || '0', 10);

      let shiftName = 'Madrugada';
      let hourIdxInShift = hourNum;
      if (hourNum >= 18) {
        shiftName = 'Noite';
        hourIdxInShift = hourNum - 18;
      } else if (hourNum >= 12) {
        shiftName = 'Tarde';
        hourIdxInShift = hourNum - 12;
      } else if (hourNum >= 6) {
        shiftName = 'Manhã';
        hourIdxInShift = hourNum - 6;
      }

      const shiftRow = boletimOficial?.find(
        (b) => b.data_iso === datePart && (b.turno === shiftName || b.turno_label === shiftName)
      );

      let rainVal = openMeteo.hourly.precipitation[i] ?? 0;
      let rainProbVal = openMeteo.hourly.precipitation_probability[i] ?? 0;

      // Harmonização precisa com o Boletim Oficial Municipal e Alertas INMET
      if (shiftRow) {
        if (typeof shiftRow.chuva_media === 'number') {
          const w = SHIFT_HOURLY_WEIGHTS[shiftName]?.[hourIdxInShift] ?? (1 / 6);
          rainVal = Math.round(shiftRow.chuva_media * w * 10) / 10;
        }
        if (typeof shiftRow.chuva_prob === 'number') {
          rainProbVal = Math.max(rainProbVal, shiftRow.chuva_prob);
        }
      }

      const windVal = openMeteo.hourly.wind_speed_10m[i] ?? 0;
      const gustRaw = openMeteo.hourly.wind_gusts_10m?.[i];
      const windGustVal =
        typeof gustRaw === 'number' && Number.isFinite(gustRaw)
          ? Math.max(windVal, gustRaw)
          : Math.round(windVal * 1.45);
      const tempVal = openMeteo.hourly.temperature_2m[i] ?? 0;
      const apparentRaw = openMeteo.hourly.apparent_temperature?.[i];
      const apparentVal =
        typeof apparentRaw === 'number' && Number.isFinite(apparentRaw) ? apparentRaw : tempVal;

      return {
        hour: hourPart || t,
        dayLabel: formatDateBr(datePart),
        temp: tempVal,
        apparentTemp: apparentVal,
        rainMm: rainVal,
        rainProb: rainProbVal,
        windKmh: windVal,
        windGustKmh: windGustVal,
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
  }, [openMeteo, boletimOficial, SHIFT_HOURLY_WEIGHTS]);

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

  const [panoramaPreset, setPanoramaPreset] = useState<string>('nov_semana1');
  const [panoramaStart, setPanoramaStart] = useState<string>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const s = p.get('start');
      if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    } catch {}
    return '2026-11-01';
  });
  const [panoramaEnd, setPanoramaEnd] = useState<string>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const e = p.get('end');
      if (e && /^\d{4}-\d{2}-\d{2}$/.test(e)) return e;
    } catch {}
    return '2026-11-07';
  });
  const [panoramaVideoPlaying, setPanoramaVideoPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (!panoramaVideoPlaying) return;
    const interval = setInterval(() => {
      setPanoramaSlideIdx((idx) => (idx + 1) % 6);
    }, 4000);
    return () => clearInterval(interval);
  }, [panoramaVideoPlaying]);

  const mensalOutubro = historico?.resumo_mensal?.find((m) => m.ano_mes === '2026-10') || historico?.resumo_mensal?.[0];
  const mensalNovembro = historico?.resumo_mensal?.find((m) => m.ano_mes === '2026-11');
  const bannerMes = mensalNovembro || mensalOutubro;

  const panoramaData = useMemo(() => {
    const diarios = historico?.resumo_diario || [];
    if (diarios.length === 0) return null;

    const start = panoramaStart <= panoramaEnd ? panoramaStart : panoramaEnd;
    const end = panoramaStart <= panoramaEnd ? panoramaEnd : panoramaStart;

    const filtered = diarios.filter((d) => d.data_iso >= start && d.data_iso <= end);
    if (filtered.length === 0) return null;

    const totalDias = filtered.length;
    const diasComChuva = filtered.filter(
      (d) => (d.chuva_total_media_mm ?? d.media_mm ?? 0) > 0.05 || (d.horas_com_chuva ?? 0) > 0
    ).length;

    // Station totals
    const stationTotals: Record<string, { nome: string; chuva_mm: number; rajada_max_kmh: number }> = {};
    filtered.forEach((d) => {
      const ests = d.estacoes_totais_dia || {};
      Object.entries(ests).forEach(([code, info]) => {
        if (!stationTotals[code]) {
          stationTotals[code] = {
            nome: info.nome || code,
            chuva_mm: 0,
            rajada_max_kmh: 0,
          };
        }
        stationTotals[code].chuva_mm += info.chuva_mm || 0;
        if ((info.rajada_max_kmh || 0) > stationTotals[code].rajada_max_kmh) {
          stationTotals[code].rajada_max_kmh = info.rajada_max_kmh || 0;
        }
      });
    });

    const mediaMunicipal = filtered.reduce(
      (acc, d) => acc + (d.chuva_total_media_mm ?? d.media_mm ?? 0),
      0
    );

    const sortedStations = Object.entries(stationTotals)
      .map(([code, data]) => ({ code, ...data }))
      .sort((a, b) => b.chuva_mm - a.chuva_mm);

    const maiorEstacao = sortedStations[0] || {
      nome: 'Rede Municipal',
      chuva_mm: 0,
      code: 'NONE',
    };

    let maxGust = 0;
    let gustInfo = '';
    let minTemp = 999;
    let maxTemp = -999;
    const sistemasSet = new Set<string>();

    filtered.forEach((d) => {
      const g = d.vento_rajada_max_kmh || 0;
      if (g > maxGust) {
        maxGust = g;
        gustInfo = `${g.toFixed(1)} km/h em ${d.data_br || d.data_iso}${
          d.vento_rajada_max_horario ? ` às ${d.vento_rajada_max_horario}` : ''
        }${d.vento_rajada_max_estacao ? ` (${d.vento_rajada_max_estacao})` : ''}`;
      }
      if (d.temp_min_c !== undefined && d.temp_min_c !== null && d.temp_min_c < minTemp) {
        minTemp = d.temp_min_c;
      }
      if (d.temp_max_c !== undefined && d.temp_max_c !== null && d.temp_max_c > maxTemp) {
        maxTemp = d.temp_max_c;
      }
      if (d.categoria_sistema) sistemasSet.add(d.categoria_sistema);
      else if (d.sistema_atuante_dia) sistemasSet.add(d.sistema_atuante_dia);
    });

    const startParts = start.split('-');
    const endParts = end.split('-');
    const monthNames = [
      '',
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    let labelPeriodo = '';
    if (start === end) {
      labelPeriodo = `${startParts[2]}/${startParts[1]}/${startParts[0]} (Dia Único)`;
    } else if (startParts[1] === endParts[1] && startParts[0] === endParts[0]) {
      const mName = monthNames[parseInt(startParts[1], 10)];
      labelPeriodo = `${startParts[2]} a ${endParts[2]} de ${mName}/${startParts[0]} (${totalDias} dias)`;
    } else {
      labelPeriodo = `${startParts[2]}/${startParts[1]} a ${endParts[2]}/${endParts[1]}/${endParts[0]} (${totalDias} dias)`;
    }

    const isOutubroFull = start === '2026-10-01' && end === '2026-10-31';

    return {
      start,
      end,
      labelPeriodo,
      totalDias,
      diasComChuva,
      mediaMunicipal: Number(mediaMunicipal.toFixed(1)),
      maiorEstacaoNome: maiorEstacao.nome,
      maiorEstacaoChuva: Number(maiorEstacao.chuva_mm.toFixed(1)),
      rankingEstacoes: sortedStations,
      maxGust: Number(maxGust.toFixed(1)),
      gustInfo,
      minTemp: minTemp !== 999 ? Number(minTemp.toFixed(1)) : null,
      maxTemp: maxTemp !== -999 ? Number(maxTemp.toFixed(1)) : null,
      sistemas: Array.from(sistemasSet),
      diasDetalhados: filtered,
      isOutubroFull,
    };
  }, [historico, panoramaStart, panoramaEnd]);

  const panoramaCaption = useMemo(() => {
    if (!panoramaData) return 'PANORAMA CLIMÁTICO • RIO DAS OSTRAS';
    const lines = [
      `PANORAMA CLIMÁTICO • RIO DAS OSTRAS`,
      `📅 Período: ${panoramaData.labelPeriodo.toUpperCase()}`,
      ``,
      `🌧️ Média municipal de chuva: ${panoramaData.mediaMunicipal.toFixed(1)} mm`,
      `☔ Dias com registro de chuva: ${panoramaData.diasComChuva} de ${panoramaData.totalDias} dias (${((panoramaData.diasComChuva / panoramaData.totalDias) * 100).toFixed(0)}% do período)`,
      `🏆 Maior acumulado na rede: ${panoramaData.maiorEstacaoChuva.toFixed(1)} mm em ${panoramaData.maiorEstacaoNome}`,
      ``,
      `📊 Ranking por Estação Pluviométrica:`,
      ...panoramaData.rankingEstacoes.map(
        (s, i) => ` ${i + 1}. ${s.nome}: ${s.chuva_mm.toFixed(1)} mm`
      ),
      ``,
      panoramaData.maxGust > 0
        ? `💨 Vento Máximo / Rajada: ${panoramaData.gustInfo}`
        : '',
      panoramaData.minTemp && panoramaData.maxTemp
        ? `🌡️ Extremos Térmicos: Mínima de ${panoramaData.minTemp.toFixed(1)}°C e Máxima de ${panoramaData.maxTemp.toFixed(1)}°C`
        : '',
      panoramaData.sistemas.length > 0
        ? `⛅ Sistemas Meteorológicos Atuantes: ${panoramaData.sistemas.join('; ')}`
        : '',
      ``,
      `Acompanhe a cobertura oficial completa em tempo real no portal: https://tempoemriodasostras.com.br`,
      `#RioDasOstras #Meteorologia #Chuva #PrevisaoDoTempo #DefesaCivil #Clima #Novembro2026`
    ].filter(Boolean);
    return lines.join('\n');
  }, [panoramaData]);

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

  const marinhaListaAtiva = useMemo<MarinhaAvisoItem[]>(() => {
    if (!marinhaAvisos) return [];
    const baseList: MarinhaAvisoItem[] =
      marinhaAvisos.todos_avisos && marinhaAvisos.todos_avisos.length > 0
        ? marinhaAvisos.todos_avisos
        : marinhaAvisos.avisos_ativos || [];
    const nowMs = Date.now();
    return baseList.filter((av) => {
      if (!av.fim_utc) return true;
      const endMs = Date.parse(av.fim_utc);
      return Number.isNaN(endMs) || endMs > nowMs;
    });
  }, [marinhaAvisos]);

  const marinhaDeltaAtivos = useMemo(
    () => marinhaListaAtiva.filter((av) => av.eh_area_delta !== false),
    [marinhaListaAtiva]
  );

  const hasMarinhaDeltaAtivo = Boolean(
    marinhaDeltaAtivos.length > 0 || (marinhaAvisos?.aviso_ativo && (!marinhaAvisos.fim_utc || Date.parse(marinhaAvisos.fim_utc) > Date.now()))
  );

  const marHojeOrla = orla?.praias_condicoes?.[0]?.dias?.d0;
  const heroAlertStatus =
    inmetAvisos.length > 0 && hasMarinhaDeltaAtivo
      ? 'Alertas Oficiais (INMET & Marinha)'
      : inmetAvisos.length > 0
        ? 'Alerta Oficial Vigente Hoje'
        : hasMarinhaDeltaAtivo
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
      <header
        className="sticky top-0 z-40 bg-white/95 dark:bg-[#14213D]/95 backdrop-blur-sm border-b border-[#E5E5E5] dark:border-[#233354]"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        <div className="max-w-[1440px] mx-auto px-3 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FF8244] cursor-pointer"
              aria-label="Alternar menu de abas vertical"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setActiveTab('previsao');
                setSubForTab('previsao', 'tempo-agora');
              }}
              className="flex items-center shrink-0 cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8244]"
              aria-label="Início Tempo em Rio das Ostras"
            >
              <img
                src={isDark ? LOGO_DARK : LOGO_LIGHT}
                alt="TEMPO em Rio das Ostras"
                className="h-8 sm:h-11 w-auto object-contain rounded"
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
              onClick={() => fetchAll(true)}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#0B1324] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FF8244]/70 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            {!isAppInstalled && (
              <button
                onClick={() => setShowInstallModal(true)}
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs font-bold rounded-lg bg-[#FF8244] hover:bg-[#e0682a] text-[#000000] shadow-sm transition-all cursor-pointer whitespace-nowrap"
                title="Baixar Aplicativo no Celular"
              >
                <Download className="w-3.5 h-3.5 text-[#000000]" />
                <span className="hidden sm:inline">Baixar App</span>
                <span className="sm:hidden text-[11px]">App</span>
              </button>
            )}
            <button
              onClick={() => setIsDark((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#0B1324] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FF8244]/70 transition-colors cursor-pointer whitespace-nowrap"
              aria-label="Alternar tema"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-[#FF8244]" /> : <Moon className="w-3.5 h-3.5 text-[#14213D]" />}
              <span className="hidden sm:inline">{isDark ? 'Tema Claro' : 'Tema Escuro'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Shell: Left Vertical Tabs Rail + Main Content */}
      <div
        className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-8 py-4 sm:py-6 lg:py-8 flex flex-col lg:flex-row gap-5 lg:gap-8 items-start"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 0.75rem)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 0.75rem)',
        }}
      >
        {/* Banner de Baixar Aplicativo Mobile (Destacado no Topo) */}
        {!isAppInstalled && (
          <div className="w-full lg:hidden p-3.5 rounded-xl bg-gradient-to-r from-[#14213D] to-[#1E293B] border-2 border-[#FF8244] shadow-lg flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FF8244] text-[#000000] flex items-center justify-center shrink-0 shadow-md">
                <Download className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Aplicativo para Celular</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#FF8244] text-[#000000] text-[9px] font-mono font-black uppercase">Grátis</span>
                </div>
                <div className="text-[11px] text-[#E5E5E5]/80 truncate">
                  Instale na sua tela de início sem barra do navegador
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowInstallModal(true)}
              className="px-3.5 py-2 rounded-lg bg-[#FF8244] hover:bg-[#e0682a] text-[#000000] text-xs font-extrabold cursor-pointer whitespace-nowrap shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar App</span>
            </button>
          </div>
        )}

        {/* Mobile Active Tab Bar */}
        <div className="w-full lg:hidden flex items-center justify-between gap-2.5 bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl px-3.5 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <activeTabItem.icon className="w-4 h-4 text-[#FF8244] shrink-0" />
            <div className="truncate">
              <div className="text-xs font-semibold text-[#14213D] dark:text-white truncate">
                {activeTabItem.label}
              </div>
              <div className="text-[10.5px] font-mono text-slate-500 dark:text-[#E5E5E5]/70 truncate">
                {TAB_SUBSECTIONS[activeTab].find((s) => s.id === subSection)?.label}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!isAppInstalled && (
              <button
                onClick={() => setShowInstallModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-[#FF8244] text-[#000000] shadow-xs cursor-pointer whitespace-nowrap"
                title="Baixar Aplicativo no Celular"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar App</span>
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] shrink-0 cursor-pointer"
            >
              {mobileMenuOpen ? 'Ocultar' : 'Mais'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Subsections Pill Bar (Navegação horizontal rápida de sub-seções) */}
        <div className="w-full lg:hidden overflow-x-auto scrollbar-none py-1 -mt-2">
          <div className="flex items-center gap-1.5 min-w-max px-1 pr-10">
            {TAB_SUBSECTIONS[activeTab]?.map((sub) => {
              const isSubActive = subSection === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    setSubForTab(activeTab, sub.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isSubActive
                      ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-bold shadow-xs'
                      : 'bg-white dark:bg-[#14213D] text-slate-600 dark:text-[#E5E5E5]/75 border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]/50 font-medium'
                  }`}
                >
                  {sub.shortLabel || sub.label}
                </button>
              );
            })}
          </div>
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
                <span className="text-[10px] font-mono text-[#FF8244] truncate max-w-[120px]" title={boletimMeta.emissao}>
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
                          ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-semibold'
                          : 'text-slate-700 dark:text-[#E5E5E5]/85 hover:bg-slate-100 dark:hover:bg-[#0B1324]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-[#FF8244] dark:text-[#000000]' : 'text-slate-400 dark:text-[#E5E5E5]/60'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                        {item.id === 'alertas' && (inmetAvisos.length + marinhaListaAtiva.length > 0) && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold tabular-nums shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white dark:bg-[#000000]/15 dark:text-[#000000]'
                                : 'bg-[#FF8244]/15 text-[#FF8244]'
                            }`}
                          >
                            {inmetAvisos.length + marinhaListaAtiva.length}
                          </span>
                        )}
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
                                  ? 'bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#FF8244] font-semibold'
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
        <main className="flex-1 min-w-0 w-full space-y-8 pb-20 lg:pb-0">
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
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#14213D] dark:text-white">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            inmetAvisos.length > 0 || hasMarinhaDeltaAtivo ? 'bg-[#FF8244]' : 'bg-emerald-500'
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
                        <span className="font-mono text-2xl text-[#FF8244]">C</span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-[#E5E5E5]/85">
                          <Flame className="w-4 h-4 text-[#FF8244] shrink-0" />
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
                          <Eye className="w-3.5 h-3.5 text-[#FF8244]" />
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
                              <div className="text-xs font-medium text-[#FF8244] mt-1">
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
                        <CloudRain className="w-3.5 h-3.5 text-slate-400 dark:text-[#FF8244]/80 shrink-0" />
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
                        <Wind className="w-3.5 h-3.5 text-slate-400 dark:text-[#FF8244]/80 shrink-0" />
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
                        <Droplets className="w-3.5 h-3.5 text-slate-400 dark:text-[#FF8244]/80 shrink-0" />
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
                        <Waves className="w-3.5 h-3.5 text-slate-400 dark:text-[#FF8244]/80 shrink-0" />
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
                        <Gauge className="w-3.5 h-3.5 text-slate-400 dark:text-[#FF8244]/80 shrink-0" />
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
                      className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] transition-colors space-y-1 block"
                    >
                      <div className="flex items-center justify-between gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-[#E5E5E5]/65">
                        <span className="inline-flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-slate-400 dark:text-[#FF8244]/80 shrink-0" />
                          <span>Índice UV</span>
                        </span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                      </div>
                      <div className="font-mono text-sm sm:text-base font-semibold text-[#FF8244] tabular-nums leading-snug">
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
                        <Sunrise className="w-3.5 h-3.5 text-slate-400 dark:text-[#FF8244]/80 shrink-0" />
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
                        <Moon className="w-3.5 h-3.5 text-slate-400 dark:text-[#FF8244]/80 shrink-0" />
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
                      <MapPin className="w-3.5 h-3.5 text-[#FF8244] shrink-0" />
                      <span>Localização · Rio das Ostras RJ</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500 dark:text-[#E5E5E5]/65">22.52°S 41.94°W</span>
                  </div>

                  <div className="w-full rounded-lg overflow-hidden border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#0B1324] flex items-center justify-center p-2">
                    <img
                      src={`${SITE_BASE}/${isDark ? 'img/mapa_rj_marcado_hd_dark.png' : 'img/mapa_rj_marcado_hd.png'}`}
                      alt="Mapa do Estado do Rio de Janeiro com marcação de Rio das Ostras"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto max-h-72 sm:max-h-80 object-contain rounded drop-shadow-xs transition-all"
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
                      <div className="font-mono text-xs sm:text-sm font-semibold text-[#FF8244] mt-0.5 tabular-nums">
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
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-4 sm:p-7 space-y-5">
                {/* Cabeçalho do Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E5] dark:border-[#233354] pb-4">
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-[#14213D] dark:text-white">
                      Gráficos de Tendência Horária
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-0.5">
                      Evolução contínua projetada pelos modelos numéricos de alta resolução
                    </p>
                  </div>
                </div>

                {/* Barra Compacta de Menus Clicáveis (Variável | Horários | Valores | Salvar Instagram) */}
                {(() => {
                  const metricOptions: {
                    id: ChartMetric;
                    label: string;
                    desc: string;
                    Icon: React.ComponentType<{ className?: string }>;
                  }[] = [
                    { id: 'temp', label: 'Temperatura', desc: 'Mínima, Máxima e Sensação Térmica', Icon: Thermometer },
                    { id: 'rain', label: 'Chuva', desc: 'Volume mm/h e Probabilidade (%)', Icon: CloudRain },
                    { id: 'wind', label: 'Vento e Rajadas', desc: 'Vento médio, Rajadas e Direção', Icon: Wind },
                    { id: 'pressure', label: 'Pressão', desc: 'Pressão atmosférica (hPa)', Icon: Gauge },
                    { id: 'humidity', label: 'Umidade', desc: 'Umidade relativa do ar (%)', Icon: Droplets },
                  ];
                  const activeMetricOpt = metricOptions.find((m) => m.id === chartMetric) || metricOptions[0];
                  const ActiveMetricIcon = activeMetricOpt.Icon;

                  const horizonPresets = [
                    { label: '24h', count: 24 },
                    { label: '48h', count: 48 },
                    { label: '72h', count: 72 },
                    { label: '5 dias', count: 120 },
                    { label: '7 dias', count: 168 },
                  ];

                  const activeDayIdx = chartDayOptions.indexOf(chartDayFilter);
                  const activePeriodText =
                    chartDayFilter === 'all'
                      ? `Próximas ${horizonCount}h`
                      : activeDayIdx === 0
                        ? `Hoje (${chartDayFilter}) · 00:00–23:59`
                        : activeDayIdx === 1
                          ? `Amanhã (${chartDayFilter}) · 00:00–23:59`
                          : `${chartDayFilter} · 00:00–23:59`;

                  const handleExportChart = async (fmt: InstagramFormat) => {
                    const pts = displayedChartPoints.slice(
                      0,
                      chartDayFilter === 'all' ? horizonCount : displayedChartPoints.length
                    );
                    if (!pts.length) return;
                    setChartExportingFmt(fmt);
                    setChartExportDone(null);
                    try {
                      const useDark =
                        chartExportTheme === 'auto' ? isDark : chartExportTheme === 'dark';
                      await exportChartToInstagramPng({
                        points: pts,
                        metric: chartMetric,
                        periodLabel: activePeriodText,
                        format: fmt,
                        darkTheme: useDark,
                        showValues: showChartValues,
                        siteBase: SITE_BASE,
                      });
                      setChartExportDone(fmt === 'story' ? 'Stories 9:16 salvo em 2160×3840!' : 'Post 4:5 salvo em 2160×2700!');
                      window.setTimeout(() => setChartExportDone(null), 3500);
                    } catch (err) {
                      console.error('Erro ao exportar gráfico para Instagram:', err);
                    } finally {
                      setChartExportingFmt(null);
                    }
                  };

                  return (
                    <div ref={chartToolbarRef} className="relative flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Aba Clicável 1: Escolher Variável Meteorológica */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenChartMenu((v) => (v === 'metric' ? null : 'metric'))}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                              openChartMenu === 'metric'
                                ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] border-[#14213D] dark:border-[#FF8244]'
                                : 'bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-white border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]'
                            }`}
                          >
                            <ActiveMetricIcon className={`w-3.5 h-3.5 ${openChartMenu === 'metric' ? 'text-[#FF8244] dark:text-[#000000]' : 'text-[#FF8244]'}`} />
                            <span className="text-[11px] font-mono opacity-70 hidden sm:inline">Gráfico:</span>
                            <span>{activeMetricOpt.label}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openChartMenu === 'metric' ? 'rotate-180' : ''}`} />
                          </button>

                          {openChartMenu === 'metric' && (
                            <div className="absolute left-0 top-full mt-1.5 z-30 w-72 rounded-xl bg-white dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] shadow-xl p-1.5 space-y-1">
                              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#E5E5E5]/55">
                                Variável do Gráfico
                              </div>
                              {metricOptions.map((m) => {
                                const MIcon = m.Icon;
                                const active = chartMetric === m.id;
                                return (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => {
                                      setChartMetric(m.id);
                                      setOpenChartMenu(null);
                                    }}
                                    className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                                      active
                                        ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000]'
                                        : 'text-[#14213D] dark:text-[#E5E5E5] hover:bg-[#F7F8FA] dark:hover:bg-[#14213D]'
                                    }`}
                                  >
                                    <div className="flex items-start gap-2.5 min-w-0">
                                      <MIcon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-[#FF8244] dark:text-[#000000]' : 'text-[#FF8244]'}`} />
                                      <div className="min-w-0">
                                        <div className="text-xs font-semibold leading-tight">{m.label}</div>
                                        <div className={`text-[10px] leading-tight mt-0.5 ${active ? 'opacity-80' : 'text-slate-500 dark:text-[#E5E5E5]/65'}`}>
                                          {m.desc}
                                        </div>
                                      </div>
                                    </div>
                                    {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Aba Clicável 2: Escolher Horários / Dia Completo */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenChartMenu((v) => (v === 'period' ? null : 'period'))}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                              openChartMenu === 'period'
                                ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] border-[#14213D] dark:border-[#FF8244]'
                                : 'bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-white border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]'
                            }`}
                          >
                            <Clock className={`w-3.5 h-3.5 ${openChartMenu === 'period' ? 'text-[#FF8244] dark:text-[#000000]' : 'text-[#FF8244]'}`} />
                            <span>{activePeriodText}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openChartMenu === 'period' ? 'rotate-180' : ''}`} />
                          </button>

                          {openChartMenu === 'period' && (
                            <div className="absolute left-0 top-full mt-1.5 z-30 w-80 max-w-[90vw] rounded-xl bg-white dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] shadow-xl p-3 space-y-3">
                              {chartDayOptions.length > 0 && (
                                <div className="space-y-1.5">
                                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#E5E5E5]/55">
                                    Dia Completo (00:00 às 23:59)
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    {chartDayOptions.map((d, idx) => {
                                      const active = chartDayFilter === d;
                                      const label = idx === 0 ? `Hoje (${d})` : idx === 1 ? `Amanhã (${d})` : d;
                                      return (
                                        <button
                                          key={d}
                                          type="button"
                                          onClick={() => {
                                            setChartDayFilter(d);
                                            setOpenChartMenu(null);
                                          }}
                                          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold text-left transition-colors cursor-pointer flex items-center justify-between border ${
                                            active
                                              ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] border-[#14213D] dark:border-[#FF8244]'
                                              : 'bg-[#F7F8FA] dark:bg-[#14213D] text-[#14213D] dark:text-[#E5E5E5] border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]'
                                          }`}
                                        >
                                          <span className="truncate">{label}</span>
                                          {active && <Check className="w-3 h-3 shrink-0" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <div className="space-y-1.5 pt-2 border-t border-[#E5E5E5] dark:border-[#233354]">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#E5E5E5]/55">
                                  Janelas Contínuas (a partir de agora)
                                </div>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {horizonPresets.map((h) => {
                                    const active = chartDayFilter === 'all' && horizonCount === h.count;
                                    return (
                                      <button
                                        key={h.label}
                                        type="button"
                                        onClick={() => {
                                          setChartDayFilter('all');
                                          setHorizonCount(h.count);
                                          setOpenChartMenu(null);
                                        }}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold text-center transition-colors cursor-pointer border ${
                                          active
                                            ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] border-[#14213D] dark:border-[#FF8244]'
                                            : 'bg-[#F7F8FA] dark:bg-[#14213D] text-[#14213D] dark:text-[#E5E5E5] border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]'
                                        }`}
                                      >
                                        {h.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ações à direita: Valores ON/OFF + Salvar Gráfico Instagram (Stories / Post) */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowChartValues((v) => !v)}
                          className={`px-3 py-2 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                            showChartValues
                              ? 'bg-[#14213D] dark:bg-[#FF8244] border-[#14213D] dark:border-[#FF8244] text-white dark:text-[#000000]'
                              : 'bg-[#F7F8FA] dark:bg-[#0B1324] border-[#E5E5E5] dark:border-[#233354] text-slate-600 dark:text-[#E5E5E5]/75 hover:border-[#FF8244]'
                          }`}
                        >
                          Valores: {showChartValues ? 'ON' : 'OFF'}
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenChartMenu((v) => (v === 'instagram' ? null : 'instagram'))}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                              openChartMenu === 'instagram'
                                ? 'bg-[#FF8244] text-[#000000] border-[#FF8244]'
                                : 'bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-white border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]'
                            }`}
                          >
                            <Camera className={`w-3.5 h-3.5 ${openChartMenu === 'instagram' ? 'text-[#000000]' : 'text-[#FF8244]'}`} />
                            <span>Salvar Instagram</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openChartMenu === 'instagram' ? 'rotate-180' : ''}`} />
                          </button>

                          {openChartMenu === 'instagram' && (
                            <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 z-30 w-80 max-w-[90vw] rounded-xl bg-white dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] shadow-xl p-3 space-y-2.5">
                              <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E5E5E5] dark:border-[#233354]">
                                <div>
                                  <div className="text-xs font-bold text-[#14213D] dark:text-white">
                                    Exportar Gráfico em Ultra HD
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-500 dark:text-[#E5E5E5]/65">
                                    PNG sem perda · 2160px (@tempoemriodasostras)
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                                <span className="text-slate-500 dark:text-[#E5E5E5]/70">Fundo da imagem:</span>
                                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#F7F8FA] dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354]">
                                  {(
                                    [
                                      { id: 'auto', label: 'Site' },
                                      { id: 'dark', label: 'Escuro' },
                                      { id: 'light', label: 'Claro' },
                                    ] as const
                                  ).map((t) => (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onClick={() => setChartExportTheme(t.id)}
                                      className={`px-2 py-1 rounded text-[10px] font-semibold cursor-pointer transition-colors ${
                                        chartExportTheme === t.id
                                          ? 'bg-[#FF8244] text-[#000000]'
                                          : 'text-slate-600 dark:text-[#E5E5E5]/75'
                                      }`}
                                    >
                                      {t.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-1.5 pt-0.5">
                                <button
                                  type="button"
                                  disabled={chartExportingFmt !== null}
                                  onClick={() => handleExportChart('story')}
                                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#14213D] hover:border-[#FF8244] text-left transition-colors cursor-pointer disabled:opacity-60"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Smartphone className="w-4 h-4 text-[#FF8244] shrink-0" />
                                    <div>
                                      <div className="text-xs font-bold text-[#14213D] dark:text-white">
                                        {chartExportingFmt === 'story' ? 'Gerando Stories...' : 'Stories Instagram (9:16)'}
                                      </div>
                                      <div className="text-[10px] font-mono text-slate-500 dark:text-[#E5E5E5]/65">
                                        2160 × 3840 px · Alta Resolução PNG
                                      </div>
                                    </div>
                                  </div>
                                  <Download className="w-4 h-4 text-[#FF8244] shrink-0" />
                                </button>

                                <button
                                  type="button"
                                  disabled={chartExportingFmt !== null}
                                  onClick={() => handleExportChart('post')}
                                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#14213D] hover:border-[#FF8244] text-left transition-colors cursor-pointer disabled:opacity-60"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Square className="w-4 h-4 text-[#FF8244] shrink-0" />
                                    <div>
                                      <div className="text-xs font-bold text-[#14213D] dark:text-white">
                                        {chartExportingFmt === 'post' ? 'Gerando Post...' : 'Post Feed Instagram (4:5)'}
                                      </div>
                                      <div className="text-[10px] font-mono text-slate-500 dark:text-[#E5E5E5]/65">
                                        2160 × 2700 px · Alta Resolução PNG
                                      </div>
                                    </div>
                                  </div>
                                  <Download className="w-4 h-4 text-[#FF8244] shrink-0" />
                                </button>
                              </div>

                              {chartExportDone && (
                                <div className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
                                  <Check className="w-3.5 h-3.5 shrink-0" />
                                  <span>{chartExportDone}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Gráfico SVG Taller & Proporcional */}
                <HourlyChart
                  data={displayedChartPoints}
                  metric={chartMetric}
                  horizonCount={chartDayFilter === 'all' ? horizonCount : Math.max(displayedChartPoints.length, 24)}
                  showValues={showChartValues}
                  dayFilter={chartDayFilter}
                />

                {/* Resumo Estatístico do Período (Preenche a tela com proporção e dados úteis) */}
                <div className="pt-4 border-t border-[#E5E5E5] dark:border-[#233354] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60 font-bold">
                      Resumo Estatístico ({chartDayFilter === 'all' ? `${horizonCount}h Projetadas` : `${chartDayFilter} · 00:00–23:59`})
                    </h3>
                    <span className="text-[11px] font-mono text-[#FF8244]">
                      {displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : displayedChartPoints.length).length} pontos horários
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* KPI 1: Temperatura Máxima */}
                    <div className="p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-0.5">
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 font-medium">Temp. Máxima</div>
                      <div className="text-lg font-bold font-mono text-[#FF8244]">
                        {(() => {
                          const pts = displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : displayedChartPoints.length);
                          if (!pts.length) return '--';
                          const maxP = pts.reduce((prev, curr) => curr.temp > prev.temp ? curr : prev, pts[0]);
                          return `${maxP.temp.toFixed(1)}°C`;
                        })()}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-[#E5E5E5]/50 truncate">
                        {(() => {
                          const pts = displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : 24);
                          if (!pts.length) return '';
                          const maxP = pts.reduce((prev, curr) => curr.temp > prev.temp ? curr : prev, pts[0]);
                          return `às ${maxP.hour.slice(0, 5)} (${maxP.dayLabel})`;
                        })()}
                      </div>
                    </div>

                    {/* KPI 2: Temperatura Mínima */}
                    <div className="p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-0.5">
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 font-medium">Temp. Mínima</div>
                      <div className="text-lg font-bold font-mono text-blue-500 dark:text-blue-400">
                        {(() => {
                          const pts = displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : 24);
                          if (!pts.length) return '--';
                          const minP = pts.reduce((prev, curr) => curr.temp < prev.temp ? curr : prev, pts[0]);
                          return `${minP.temp.toFixed(1)}°C`;
                        })()}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-[#E5E5E5]/50 truncate">
                        {(() => {
                          const pts = displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : 24);
                          if (!pts.length) return '';
                          const minP = pts.reduce((prev, curr) => curr.temp < prev.temp ? curr : prev, pts[0]);
                          return `às ${minP.hour.slice(0, 5)} (${minP.dayLabel})`;
                        })()}
                      </div>
                    </div>

                    {/* KPI 3: Chuva Total Acumulada */}
                    <div className="p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-0.5">
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 font-medium">Chuva Total</div>
                      <div className="text-lg font-bold font-mono text-[#14213D] dark:text-white">
                        {(() => {
                          const pts = displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : 24);
                          const tot = pts.reduce((acc, p) => acc + p.rainMm, 0);
                          return `${tot.toFixed(1)} mm`;
                        })()}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-[#E5E5E5]/50 truncate">
                        {(() => {
                          const pts = displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : 24);
                          const maxR = pts.reduce((prev, curr) => curr.rainMm > prev.rainMm ? curr : prev, pts[0] || { rainMm: 0, hour: '' });
                          return maxR.rainMm > 0 ? `Pico: ${maxR.rainMm.toFixed(1)}mm (${maxR.hour.slice(0, 5)})` : 'Sem chuva prevista';
                        })()}
                      </div>
                    </div>

                    {/* KPI 4: Vento / Rajada Máxima */}
                    <div className="p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-0.5">
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 font-medium">Vento Máximo</div>
                      <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {(() => {
                          const pts = displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : 24);
                          if (!pts.length) return '--';
                          const maxW = pts.reduce((prev, curr) => curr.windKmh > prev.windKmh ? curr : prev, pts[0]);
                          return `${maxW.windKmh.toFixed(0)} km/h`;
                        })()}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-[#E5E5E5]/50 truncate">
                        {(() => {
                          const pts = displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : displayedChartPoints.length);
                          if (!pts.length) return '';
                          const maxW = pts.reduce((prev, curr) => curr.windKmh > prev.windKmh ? curr : prev, pts[0]);
                          const maxG = pts.reduce(
                            (prev, curr) => (curr.windGustKmh ?? curr.windKmh) > (prev.windGustKmh ?? prev.windKmh) ? curr : prev,
                            pts[0]
                          );
                          const gustKmh = maxG.windGustKmh ?? maxG.windKmh;
                          return `Dir: ${maxW.windDir} (${maxW.hour.slice(0, 5)}) · Rajada: ${gustKmh.toFixed(0)} km/h`;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Tabela / Detalhamento Horário Vertical (Rolagem móvel natural) */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#14213D] dark:text-white">
                        Detalhamento Hora a Hora
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/60 font-mono">
                        Rolagem vertical
                      </span>
                    </div>

                    <div className="divide-y divide-[#E5E5E5] dark:divide-[#233354] rounded-xl border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] overflow-hidden max-h-72 overflow-y-auto scrollbar-thin">
                      {displayedChartPoints.slice(0, chartDayFilter === 'all' ? Math.min(horizonCount, 24) : 24).map((pt, i) => (
                        <div key={i} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#14213D] dark:text-white w-11">
                              {pt.hour.slice(0, 5)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-[#E5E5E5]/60">
                              {pt.dayLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-[#FF8244]">
                              {pt.temp.toFixed(0)}°C
                            </span>
                            <span className={`font-mono text-[11px] ${pt.rainMm > 0 ? 'text-blue-500 font-bold' : 'text-slate-400 dark:text-[#E5E5E5]/40'}`}>
                              {pt.rainMm > 0 ? `${pt.rainMm.toFixed(1)} mm` : '0 mm'}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                              {pt.windKmh.toFixed(0)} km/h {pt.windDir}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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

                      const cardBgClass = 'bg-white dark:bg-[#0B1324] border-[#E5E5E5] dark:border-[#233354] shadow-xs';
                      const leftBorderClass = hasAlert
                        ? 'border-l-4 border-l-[#FF8244]'
                        : 'border-l-4 border-l-[#14213D] dark:border-l-[#233354]';

                      return (
                        <div
                          key={d.dia}
                          className={`p-5 rounded-xl transition-all space-y-3.5 border ${leftBorderClass} ${cardBgClass}`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Calendar className={`w-4 h-4 ${hasAlert ? 'text-[#FF8244]' : isDark ? 'text-[#FF8244]' : 'text-[#14213D]'} shrink-0`} />
                              <span className="font-display text-sm font-bold text-[#14213D] dark:text-white">
                                {d.dia}
                              </span>
                            </div>
                            {d.badge && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight border ${
                                  hasAlert
                                    ? 'bg-[#FF8244]/15 text-[#14213D] dark:text-[#FF8244] border-[#FF8244]/50'
                                    : 'bg-[#F7F8FA] dark:bg-[#14213D] text-slate-700 dark:text-[#E5E5E5]/90 border-[#E5E5E5] dark:border-[#233354]'
                                }`}
                              >
                                {hasAlert && <AlertTriangle className="w-3 h-3 text-[#FF8244]" />}
                                {d.badge}
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-semibold text-slate-600 dark:text-[#E5E5E5]/80">
                            {d.subtitulo}
                          </div>

                          {d.pilares && (
                            <div className="grid grid-cols-2 gap-2.5 text-[11px] font-mono">
                              {d.pilares.temp?.val && (
                                <div className="p-2.5 rounded-lg border bg-[#F7F8FA] dark:bg-[#14213D] border-[#E5E5E5] dark:border-[#233354]">
                                  <span className="text-slate-500 dark:text-[#E5E5E5]/70 font-bold uppercase text-[9.5px] flex items-center gap-1">
                                    <Thermometer className="w-3.5 h-3.5 text-[#FF8244]" /> Temperatura
                                  </span>
                                  <span className="font-bold text-[#14213D] dark:text-white text-xs leading-snug block mt-0.5">
                                    {d.pilares.temp.val}
                                  </span>
                                </div>
                              )}
                              {d.pilares.chuva?.val && (
                                <div className="p-2.5 rounded-lg border bg-[#F7F8FA] dark:bg-[#14213D] border-[#E5E5E5] dark:border-[#233354]">
                                  <span className="text-slate-500 dark:text-[#E5E5E5]/70 font-bold uppercase text-[9.5px] flex items-center gap-1">
                                    <CloudRain className="w-3.5 h-3.5 text-[#FF8244]" /> Chuva
                                  </span>
                                  <span className="font-bold text-[#14213D] dark:text-white text-xs leading-snug block mt-0.5">
                                    {d.pilares.chuva.val.split(' (')[0]}
                                  </span>
                                </div>
                              )}
                              {d.pilares.vento?.val && (
                                <div className="p-2.5 rounded-lg border bg-[#F7F8FA] dark:bg-[#14213D] border-[#E5E5E5] dark:border-[#233354]">
                                  <span className="text-slate-500 dark:text-[#E5E5E5]/70 font-bold uppercase text-[9.5px] flex items-center gap-1">
                                    <Wind className="w-3.5 h-3.5 text-[#FF8244]" /> Vento
                                  </span>
                                  <span className="font-bold text-[#14213D] dark:text-white text-xs leading-snug block mt-0.5">
                                    {d.pilares.vento.val}
                                  </span>
                                </div>
                              )}
                              {d.pilares.mar?.val && (
                                <div className="p-2.5 rounded-lg border bg-[#F7F8FA] dark:bg-[#14213D] border-[#E5E5E5] dark:border-[#233354]">
                                  <span className="text-slate-500 dark:text-[#E5E5E5]/70 font-bold uppercase text-[9.5px] flex items-center gap-1">
                                    <Waves className="w-3.5 h-3.5 text-[#FF8244]" /> Mar na Orla
                                  </span>
                                  <span className="font-bold text-[#14213D] dark:text-white text-xs leading-snug block mt-0.5">
                                    {d.pilares.mar.val}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {Array.isArray(d.informe_populacao) && d.informe_populacao.length > 0 ? (
                            <div className="p-3.5 rounded-lg border bg-[#F7F8FA] dark:bg-[#14213D]/60 border-[#E5E5E5] dark:border-[#233354] space-y-2.5 text-xs text-slate-700 dark:text-[#E5E5E5]/90 leading-relaxed text-justify">
                              {d.informe_populacao.map((paragrafo, pIdx) => (
                                <p key={pIdx}>
                                  {paragrafo}
                                </p>
                              ))}
                            </div>
                          ) : textoOficial ? (
                            <div className="p-3 rounded-lg border bg-[#F7F8FA] dark:bg-[#14213D]/60 border-[#E5E5E5] dark:border-[#233354]">
                              <p className="text-xs text-slate-700 dark:text-[#E5E5E5]/90 leading-relaxed text-justify">
                                {textoOficial}
                              </p>
                            </div>
                          ) : null}

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
                          <strong className="text-[#FF8244]">{Math.round(openMeteo.daily.temperature_2m_max[i])}°</strong>
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
                          <span className="text-[11px] font-mono font-bold uppercase px-3 py-1 rounded-full bg-[#FF8244]/15 text-[#14213D] dark:text-[#FF8244] border border-[#FF8244]/40">
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
                                  <span className="px-2.5 py-0.5 rounded-full bg-[#FF8244]/15 text-[#14213D] dark:text-[#FF8244] border border-[#FF8244]/40 font-bold inline-flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-[#FF8244]" />
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
                                    className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] space-y-1 text-xs"
                                  >
                                    <div className="font-bold text-[#14213D] dark:text-white">{setor.regiao}</div>
                                    <div className="font-mono text-[#14213D] dark:text-[#FF8244] font-bold">
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
                      <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full border bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#FF8244] border-[#E5E5E5] dark:border-[#233354]">
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
                            icon: Compass,
                          },
                          {
                            tag: 'Termodinâmica & Hidrometeorologia',
                            title: 'Termodinâmica Atmosférica, Instabilidade Convectiva & Resposta Hidrológica do Rio Jundiá',
                            badgeTech: 'Convecção Diurna • Índices CAPE / CINE • Telemetria INEA 2241036',
                            icon: Zap,
                          },
                          {
                            tag: 'Modelagem Numérica & Oceanografia',
                            title: 'Prognóstico Numérico de Mesoescala (ECMWF/GFS), Oceanografia Costeira & Tendência',
                            badgeTech: 'Modelos ECMWF/GFS 12Z • Swell E/SE • Área Delta CHM',
                            icon: Waves,
                          },
                        ];
                        const metaItem = metaCards[idx] || {
                          tag: `Tópico ${idx + 1}`,
                          title: `Diagnóstico Técnico — Setor ${idx + 1}`,
                          badgeTech: 'Telemetria Municipal',
                          icon: Activity,
                        };
                        const IconComponent = metaItem.icon;
                        return (
                          <div
                            key={idx}
                            className="p-4 sm:p-5 rounded-xl border border-l-4 border-l-[#14213D] dark:border-l-[#FF8244] bg-white dark:bg-[#0B1324] border-[#E5E5E5] dark:border-[#233354] shadow-xs space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E5E5E5] dark:border-[#233354]">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 bg-[#F7F8FA] dark:bg-[#14213D] text-[#14213D] dark:text-[#FF8244] border-[#E5E5E5] dark:border-[#233354]">
                                  <IconComponent className="w-3.5 h-3.5 text-[#FF8244]" />
                                  {metaItem.tag}
                                </span>
                                <h3 className="text-xs sm:text-sm font-bold text-[#14213D] dark:text-white">
                                  {metaItem.title}
                                </h3>
                              </div>
                              <span className="text-[10.5px] font-mono px-2.5 py-0.5 rounded-full border bg-[#F7F8FA] dark:bg-[#14213D] text-slate-600 dark:text-[#E5E5E5]/70 border-[#E5E5E5] dark:border-[#233354]">
                                {metaItem.badgeTech}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 dark:text-[#E5E5E5]/90 leading-relaxed text-justify">
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
                          className="p-3.5 rounded-lg border space-y-1 text-xs bg-[#F7F8FA] dark:bg-[#0B1324] border-[#E5E5E5] dark:border-[#233354]"
                        >
                          <div className="font-semibold text-[#14213D] dark:text-[#FF8244]">{g.termo}</div>
                          <div className="text-slate-600 dark:text-[#E5E5E5]/80 leading-snug">{g.def}</div>
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
                      <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#FF8244] border border-[#E5E5E5] dark:border-[#233354]">
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FF8244] transition-colors"
                    >
                      Baixar PLANCON 4.0 (PDF) <ExternalLink className="w-3 h-3 text-[#FF8244]" />
                    </a>
                    <a
                      href={PLANCON_EL_NINO_PDF_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FF8244] transition-colors"
                    >
                      PLANCON El Niño (PDF) <ExternalLink className="w-3 h-3 text-[#FF8244]" />
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
                          ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-semibold'
                          : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white font-medium'
                      }`}
                    >
                      <span>{t.label}</span>
                      {t.id === 'elnino' && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${
                            planconTab === t.id
                              ? 'bg-white/15 dark:bg-black/15 text-current'
                              : 'bg-white dark:bg-[#14213D] text-slate-600 dark:text-[#FF8244] border border-[#E5E5E5] dark:border-[#233354]'
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
                        atencao: 'bg-[#FF8244]',
                        alerta: 'bg-rose-500',
                        maximo: 'bg-rose-600',
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
                            <div className="font-mono text-sm font-semibold text-[#FF8244]">
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
                            <div className="font-display text-sm font-semibold text-[#14213D] dark:text-[#FF8244]">
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
                                <span className="font-mono text-xs text-[#FF8244]">
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
                      const dotColor = ['bg-emerald-500', 'bg-amber-400', 'bg-[#FF8244]', 'bg-rose-500'][idx % 4];
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
                        <div className="font-display text-sm font-semibold text-[#14213D] dark:text-[#FF8244]">
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
                                    ? 'bg-[#14213D] text-white border-[#14213D] dark:bg-[#FF8244] dark:text-[#000000] dark:border-[#FF8244]'
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
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#14213D] text-[#14213D] dark:text-white hover:border-[#FF8244] shrink-0 transition-colors"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5 text-[#FF8244]" />
                          Baixar PLANCON El Niño (PDF Oficial 64 pág.)
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="p-4 rounded-lg bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 font-semibold text-[#14213D] dark:text-white">
                          <AlertTriangle className="w-4 h-4 text-[#FF8244] shrink-0" />
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
                          <ShieldAlert className="w-4 h-4 text-[#FF8244]" />
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
                            <div className="pt-2 border-t border-[#E5E5E5] dark:border-[#233354] text-[11px] font-mono font-semibold text-[#FF8244]">
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
                          <Gauge className="w-4 h-4 text-[#FF8244]" />
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
                            orange: 'bg-[#FF8244]',
                            red: 'bg-rose-500',
                            purple: 'bg-rose-600',
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
                              <div className="pt-1.5 border-t border-[#E5E5E5] dark:border-[#233354] text-[10px] font-mono font-semibold text-[#FF8244]">
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
                          <Flame className="w-4 h-4 text-[#FF8244]" />
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
                            <div className="text-xs font-semibold uppercase text-[#14213D] dark:text-[#FF8244]">
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
                        <Check className="w-4 h-4 text-[#FF8244]" />
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
                        <Phone className="w-4 h-4 text-[#FF8244] shrink-0" />
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
                        <a href="tel:199" className="px-2.5 py-1 rounded bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] font-semibold text-[#14213D] dark:text-white transition-colors">
                          Defesa Civil: 199
                        </a>
                        <a href="tel:193" className="px-2.5 py-1 rounded bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] font-semibold text-[#14213D] dark:text-white transition-colors">
                          Bombeiros: 193
                        </a>
                        <a href="tel:192" className="px-2.5 py-1 rounded bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] font-semibold text-[#14213D] dark:text-white transition-colors">
                          SAMU: 192
                        </a>
                        <a href="tel:153" className="px-2.5 py-1 rounded bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] font-semibold text-[#14213D] dark:text-white transition-colors">
                          Guarda Civil: 153
                        </a>
                        <span className="px-2.5 py-1 rounded bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-white">
                          SMS Alerta Grátis: <strong className="text-[#FF8244]">Envie CEP para 40199</strong>
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
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5 align-middle" aria-hidden="true" />
                      Síntese da rede oficial no horizonte de {rainHorizonHours}h · Tempo Real: {acumulados?.atualizacao || '--'}
                    </p>
                  </div>

                  {/* Ações Rápidas: Imagens Oficiais para Redes Sociais */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => (window as any).openSocialModalChuva?.(`${rainHorizonHours}h`)}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition cursor-pointer bg-[#F7F8FA] hover:bg-slate-200 dark:bg-[#0B1324] dark:hover:bg-[#14213D] text-[#14213D] dark:text-[#E5E5E5] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] shadow-2xs active:scale-95"
                      title="Exportar imagem oficial de Acumulados de Chuva para Instagram / WhatsApp"
                    >
                      <CloudRain className="w-3.5 h-3.5 text-[#FF8244]" />
                      <span>Card de Chuva</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => (window as any).openSocialModalVento?.()}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition cursor-pointer bg-[#F7F8FA] hover:bg-slate-200 dark:bg-[#0B1324] dark:hover:bg-[#14213D] text-[#14213D] dark:text-[#E5E5E5] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] shadow-2xs active:scale-95"
                      title="Exportar imagem oficial dos Maiores Ventos e Rajadas para Instagram / WhatsApp"
                    >
                      <Wind className="w-3.5 h-3.5 text-[#FF8244]" />
                      <span>Card Ventos & Rajadas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => (window as any).openSocialModalTempoAgora?.()}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition cursor-pointer bg-[#F7F8FA] hover:bg-slate-200 dark:bg-[#0B1324] dark:hover:bg-[#14213D] text-[#14213D] dark:text-[#E5E5E5] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] shadow-2xs active:scale-95"
                      title="Exportar imagem oficial do Tempo Agora para Instagram / WhatsApp"
                    >
                      <SunMedium className="w-3.5 h-3.5 text-[#FF8244]" />
                      <span>Card Tempo Agora</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg">
                    {[1, 4, 12, 24, 36, 48, 96].map((h) => (
                      <button
                        key={h}
                        onClick={() => selectRainHorizon(h)}
                        className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                          rainHorizonHours === h
                            ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-semibold'
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
                    <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#FF8244] mt-1.5 tabular-nums">
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

            {/* Seção Oficial: Exportar Imagens de Acumulados de Chuva e Vento */}
            {showSub('resumo') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E5] dark:border-[#233354] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-[#FF8244]">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-sm sm:text-base font-bold text-[#14213D] dark:text-white">
                          Exportar Imagens Oficiais para Redes Sociais
                        </h3>
                        <span className="text-[10px] font-mono font-bold uppercase bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#FF8244] border border-[#E5E5E5] dark:border-[#233354] px-2 py-0.5 rounded-full">
                          Feed (4:5) & Stories (9:16)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-0.5">
                        Gere e baixe imagens em alta resolução com dados oficiais sincronizados da rede municipal
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Imagem de Acumulados de Chuva */}
                  <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-[#14213D] text-[#14213D] dark:text-[#FF8244] border border-[#E5E5E5] dark:border-[#233354]">
                          <CloudRain className="w-3.5 h-3.5 text-[#FF8244]" />
                          Acumulados de Chuva
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">1080px HD</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#14213D] dark:text-white mt-2">
                        Card Oficial de Acumulados
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
                        Ranking completo de chuva das {acumulados?.total_estacoes || 8} estações com barras proporcionais e total do município.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-[#E5E5E5] dark:border-[#233354]">
                      <button
                        type="button"
                        onClick={() => (window as any).openSocialModalChuva?.('24h')}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-[#14213D] hover:bg-[#1c2e54] text-white dark:bg-[#FF8244] dark:hover:bg-[#E66E30] dark:text-[#0B1324] border border-[#14213D] dark:border-[#FF8244] shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Abrir Card de Chuva</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Imagem de Maiores Ventos & Rajadas */}
                  <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-[#14213D] text-[#14213D] dark:text-[#FF8244] border border-[#E5E5E5] dark:border-[#233354]">
                          <Wind className="w-3.5 h-3.5 text-[#FF8244]" />
                          Ventos & Rajadas
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">1080px HD</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#14213D] dark:text-white mt-2">
                        Card Oficial de Ventos & Rajadas
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
                        Maiores ventos e rajadas na orla e bairros, separados da imagem de chuva para postagem oficial.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-[#E5E5E5] dark:border-[#233354]">
                      <button
                        type="button"
                        onClick={() => (window as any).openSocialModalVento?.()}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-[#14213D] hover:bg-[#1c2e54] text-white dark:bg-[#FF8244] dark:hover:bg-[#E66E30] dark:text-[#0B1324] border border-[#14213D] dark:border-[#FF8244] shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Abrir Card de Vento</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Imagem do Tempo Agora */}
                  <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-[#14213D] text-[#14213D] dark:text-[#FF8244] border border-[#E5E5E5] dark:border-[#233354]">
                          <SunMedium className="w-3.5 h-3.5 text-[#FF8244]" />
                          Tempo Agora
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">1080px HD</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#14213D] dark:text-white mt-2">
                        Card Oficial do Tempo Agora
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
                        Temperatura, sensação térmica, umidade, vento e condições costeiras em tempo real.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-[#E5E5E5] dark:border-[#233354]">
                      <button
                        type="button"
                        onClick={() => (window as any).openSocialModalTempoAgora?.()}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-[#14213D] hover:bg-[#1c2e54] text-white dark:bg-[#FF8244] dark:hover:bg-[#E66E30] dark:text-[#0B1324] border border-[#14213D] dark:border-[#FF8244] shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Abrir Card Tempo Agora</span>
                      </button>
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
                      { id: 'all', label: `Todas (${acumulados?.estacoes.length || 8})` },
                      { id: 'pws', label: `Weather Underground (${acumulados ? acumulados.estacoes.filter((s) => s.categoria === 'pws').length : 6})` },
                      { id: 'cemaden', label: `CEMADEN PCD (${acumulados ? acumulados.estacoes.filter((s) => s.categoria === 'cemaden').length : 1})` },
                      { id: 'inea', label: `INEA Cheias (${acumulados ? acumulados.estacoes.filter((s) => s.categoria === 'inea').length : 1})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setNetworkFilter(tab.id as 'all' | 'pws' | 'cemaden' | 'inea')}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          networkFilter === tab.id
                            ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-semibold'
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
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF8244]"
                      />
                    </div>
                    <button
                      onClick={handleDownloadStationsCsv}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#14213D] text-[#14213D] dark:text-white hover:border-[#FF8244] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5 text-[#FF8244]" />
                      Exportar CSV
                    </button>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-[#E5E5E5] dark:border-[#233354] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-[#E5E5E5]/80">
                      <Clock className="w-3.5 h-3.5 text-[#FF8244] shrink-0" />
                      <span>Horizonte:</span>
                    </span>

                    <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg">
                      {[1, 4, 12, 24, 36, 48, 96].map((h) => (
                        <button
                          key={h}
                          onClick={() => selectRainHorizon(h)}
                          className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                            rainHorizonHours === h
                              ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-semibold'
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
                        className="w-14 px-2 py-1 rounded-md border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] font-mono font-semibold text-center text-[#14213D] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FF8244]"
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

            {/* Sub-aba 2: 8 Estações da Rede — Cards Minimalistas */}
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
                                <span className="font-semibold text-[#14213D] dark:text-[#FF8244]">NÍVEL DO RIO</span>
                              ) : (
                                <span className={showTopBadge ? 'font-semibold text-[#FF8244]' : 'font-semibold text-[#14213D] dark:text-white'}>
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
                              <MapPin className="w-3 h-3 text-[#FF8244] shrink-0" />
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
                                      className="h-full bg-[#14213D] dark:bg-[#FF8244] rounded-full"
                                      style={{ width: `${Math.min(100, Math.max(2, calhaPct))}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-[#E5E5E5] dark:border-[#233354] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/75">
                                  <span>Atenção: {cotaAtencaoStr} · Alerta: {cotaAlertaStr}</span>
                                  <span className="font-semibold text-[#14213D] dark:text-[#FF8244] uppercase">
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
                                  <strong className="text-[#FF8244] tabular-nums">{formatMm(selectedRain)}</strong>
                                </div>
                              )}

                              {/* Janelas Principais: 24h · 36h · 48h */}
                              <div className="grid grid-cols-3 divide-x divide-[#E5E5E5] dark:divide-[#233354] text-center font-mono text-xs">
                                <div className="px-1">
                                  <span className={`text-[10px] uppercase block ${rainHorizonHours === 24 ? 'text-[#FF8244] font-semibold' : 'text-slate-500 dark:text-[#E5E5E5]/65'}`}>
                                    24 Horas
                                  </span>
                                  <strong className={`tabular-nums mt-0.5 block ${rainHorizonHours === 24 ? 'text-[#FF8244]' : 'text-[#14213D] dark:text-white'}`}>
                                    {formatMm(st.chuva_24h)}
                                  </strong>
                                </div>
                                <div className="px-1">
                                  <span className={`text-[10px] uppercase block ${rainHorizonHours === 36 ? 'text-[#FF8244] font-semibold' : 'text-slate-500 dark:text-[#E5E5E5]/65'}`}>
                                    36 Horas
                                  </span>
                                  <strong className={`tabular-nums mt-0.5 block ${rainHorizonHours === 36 ? 'text-[#FF8244]' : 'text-[#14213D] dark:text-white'}`}>
                                    {formatMm(st.chuva_36h ?? st.chuva_24h)}
                                  </strong>
                                </div>
                                <div className="px-1">
                                  <span className={`text-[10px] uppercase block ${rainHorizonHours === 48 ? 'text-[#FF8244] font-semibold' : 'text-slate-500 dark:text-[#E5E5E5]/65'}`}>
                                    48 Horas
                                  </span>
                                  <strong className={`tabular-nums mt-0.5 block ${rainHorizonHours === 48 ? 'text-[#FF8244]' : 'text-[#14213D] dark:text-white'}`}>
                                    {formatMm(st.chuva_48h)}
                                  </strong>
                                </div>
                              </div>

                              {/* Janelas Complementares: 1h · 4h · 12h · 96h */}
                              <div className="grid grid-cols-4 gap-1 pt-2.5 border-t border-[#E5E5E5] dark:border-[#233354] text-center font-mono text-[11px]">
                                <div>
                                  <span className={`text-[10px] block ${rainHorizonHours === 1 ? 'text-[#FF8244] font-semibold' : 'text-slate-500 dark:text-[#E5E5E5]/60'}`}>1h</span>
                                  <span className={`tabular-nums ${rainHorizonHours === 1 ? 'text-[#FF8244] font-semibold' : 'text-[#14213D] dark:text-white'}`}>{formatMm(st.chuva_1h)}</span>
                                </div>
                                <div>
                                  <span className={`text-[10px] block ${rainHorizonHours === 4 ? 'text-[#FF8244] font-semibold' : 'text-slate-500 dark:text-[#E5E5E5]/60'}`}>4h</span>
                                  <span className={`tabular-nums ${rainHorizonHours === 4 ? 'text-[#FF8244] font-semibold' : 'text-[#14213D] dark:text-white'}`}>{formatMm(st.chuva_4h)}</span>
                                </div>
                                <div>
                                  <span className={`text-[10px] block ${rainHorizonHours === 12 ? 'text-[#FF8244] font-semibold' : 'text-slate-500 dark:text-[#E5E5E5]/60'}`}>12h</span>
                                  <span className={`tabular-nums ${rainHorizonHours === 12 ? 'text-[#FF8244] font-semibold' : 'text-[#14213D] dark:text-white'}`}>{formatMm(st.chuva_12h)}</span>
                                </div>
                                <div>
                                  <span className={`text-[10px] block ${rainHorizonHours === 96 ? 'text-[#FF8244] font-semibold' : 'text-slate-500 dark:text-[#E5E5E5]/60'}`}>96h</span>
                                  <span className={`tabular-nums ${rainHorizonHours === 96 ? 'text-[#FF8244] font-semibold' : 'text-[#14213D] dark:text-white'}`}>{formatMm(st.chuva_96h)}</span>
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
                                    <span className="font-mono font-semibold text-[#14213D] dark:text-[#FF8244] tabular-nums shrink-0">
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
                                      <strong className="text-xs text-[#FF8244] tabular-nums">
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
                                        <strong className="text-[#FF8244] tabular-nums">
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
                              className="inline-flex items-center gap-1 text-[#14213D] dark:text-[#E5E5E5] hover:text-[#FF8244] transition-colors whitespace-nowrap shrink-0"
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

                {/* Visualização da Tabela: Mobile Cards (md:hidden) vs Desktop Table (hidden md:block) */}
                <div>
                  {/* Seletor de Horizonte Rápido no Celular */}
                  <div className="md:hidden pb-3">
                    <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 mb-1.5 font-medium">Acumulado em destaque:</div>
                    <div className="grid grid-cols-7 gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg text-center text-xs">
                      {[1, 4, 12, 24, 36, 48, 96].map((h) => (
                        <button
                          key={h}
                          onClick={() => selectRainHorizon(h)}
                          className={`py-1 rounded font-mono font-medium transition-colors cursor-pointer ${
                            rainHorizonHours === h
                              ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-bold shadow-2xs'
                              : 'text-slate-600 dark:text-[#E5E5E5]/70'
                          }`}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cards no Celular (md:hidden) */}
                  <div className="md:hidden space-y-2.5">
                    {filteredStations.map((st) => {
                      const rainVal =
                        rainHorizonHours === 1 ? st.chuva_1h :
                        rainHorizonHours === 4 ? st.chuva_4h :
                        rainHorizonHours === 12 ? st.chuva_12h :
                        rainHorizonHours === 24 ? st.chuva_24h :
                        rainHorizonHours === 36 ? st.chuva_36h :
                        rainHorizonHours === 48 ? st.chuva_48h : st.chuva_96h;

                      return (
                        <div
                          key={st.codigo}
                          className="p-3.5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-2 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-[#14213D] dark:text-white leading-snug">
                                {st.nome_curto || st.nome}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/65">
                                {st.codigo} · {st.rede} {st.bairro ? `· ${st.bairro}` : ''}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-slate-400 dark:text-[#E5E5E5]/50 block">{rainHorizonHours}h acumulado</span>
                              <span className={`text-base font-mono font-bold ${
                                rainVal && rainVal > 0 ? 'text-[#FF8244]' : 'text-slate-600 dark:text-[#E5E5E5]/80'
                              }`}>
                                {rainVal !== null && rainVal !== undefined ? `${rainVal.toFixed(1)} mm` : '--'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-[#E5E5E5]/60 dark:border-[#233354]/60 text-[10.5px] font-mono text-slate-500 dark:text-[#E5E5E5]/60">
                            <span>1h: {st.chuva_1h !== null ? `${st.chuva_1h.toFixed(1)}mm` : '--'}</span>
                            <span>24h: {st.chuva_24h !== null ? `${st.chuva_24h.toFixed(1)}mm` : '--'}</span>
                            <span>96h: {st.chuva_96h !== null ? `${st.chuva_96h.toFixed(1)}mm` : '--'}</span>
                            <span>Leitura: {st.ultima_leitura || '--'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tabela Ampla para Desktop (hidden md:block) */}
                  <div className="hidden md:block overflow-x-auto">
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
                                  rainHorizonHours === h ? 'text-[#FF8244] font-semibold underline underline-offset-4' : ''
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
                            <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 1 ? 'font-semibold text-[#FF8244]' : ''}`}>
                              {st.chuva_1h !== null ? st.chuva_1h.toFixed(1) : '--'}
                            </td>
                            <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 4 ? 'font-semibold text-[#FF8244]' : ''}`}>
                              {st.chuva_4h !== null ? st.chuva_4h.toFixed(1) : '--'}
                            </td>
                            <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 12 ? 'font-semibold text-[#FF8244]' : ''}`}>
                              {st.chuva_12h !== null ? st.chuva_12h.toFixed(1) : '--'}
                            </td>
                            <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 24 ? 'font-semibold text-[#FF8244]' : ''}`}>
                              {st.chuva_24h !== null ? st.chuva_24h.toFixed(1) : '--'}
                            </td>
                            <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 36 ? 'font-semibold text-[#FF8244]' : ''}`}>
                              {st.chuva_36h !== null && st.chuva_36h !== undefined ? st.chuva_36h.toFixed(1) : '--'}
                            </td>
                            <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 48 ? 'font-semibold text-[#FF8244]' : ''}`}>
                              {st.chuva_48h !== null ? st.chuva_48h.toFixed(1) : '--'}
                            </td>
                            <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 96 ? 'font-semibold text-[#FF8244]' : ''}`}>
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

                  <div className="w-full sm:w-auto grid grid-cols-3 sm:flex sm:items-center gap-1.5 shrink-0 pt-2 sm:pt-0">
                    {historico?.arquivos_planilha && (
                      <>
                        <a
                          href={`${SITE_BASE}/${historico.arquivos_planilha.xlsx}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1 py-2 sm:py-1.5 px-1 sm:px-3 text-[11px] sm:text-xs font-semibold rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FF8244] transition-colors text-center whitespace-nowrap shadow-2xs"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5 text-[#FF8244] shrink-0" />
                          <span>Excel</span>
                        </a>
                        <a
                          href={`${SITE_BASE}/${historico.arquivos_planilha.csv}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1 py-2 sm:py-1.5 px-1 sm:px-3 text-[11px] sm:text-xs font-semibold rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FF8244] transition-colors text-center whitespace-nowrap shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-[#FF8244] shrink-0" />
                          <span>CSV Geral</span>
                        </a>
                      </>
                    )}
                    <button
                      onClick={handleDownloadFilteredHistCsv}
                      className="inline-flex items-center justify-center gap-1 py-2 sm:py-1.5 px-1 sm:px-3 text-[11px] sm:text-xs font-semibold rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FF8244] transition-colors cursor-pointer text-center whitespace-nowrap shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-[#FF8244] shrink-0" />
                      <span>CSV Filtro</span>
                    </button>
                  </div>
                </div>

                {/* Controles de Modo e Filtros da Planilha */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="w-full sm:w-auto grid grid-cols-3 sm:flex sm:items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg">
                      {[
                        { id: 'horario', label: 'Horário', full: 'Horário Completo' },
                        { id: 'diario', label: 'Diário', full: 'Totais Diários' },
                        { id: 'mensal', label: 'Mensal', full: 'Totais Mensais' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setHistoryMode(m.id as 'horario' | 'diario' | 'mensal')}
                          className={`py-1.5 px-1 sm:px-3.5 text-[11px] sm:text-xs rounded-md transition-all cursor-pointer text-center whitespace-nowrap ${
                            historyMode === m.id
                              ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-bold shadow-xs'
                              : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white font-medium'
                          }`}
                        >
                          <span className="sm:hidden">{m.label}</span>
                          <span className="hidden sm:inline">{m.full}</span>
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
                    <div className="space-y-2 pt-3 border-t border-[#E5E5E5] dark:border-[#233354] text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select
                          value={histMonthFilter}
                          onChange={(e) => setHistMonthFilter(e.target.value)}
                          aria-label="Filtrar por mês"
                          className="w-full px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-white cursor-pointer"
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
                          className="w-full px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF8244]"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] cursor-pointer text-xs whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={histRainOnly}
                            onChange={(e) => setHistRainOnly(e.target.checked)}
                            className="accent-[#FF8244]"
                          />
                          <span>Com chuva (&gt; 0 mm)</span>
                        </label>

                        <button
                          onClick={() => setHistSortOrder((s) => (s === 'desc' ? 'asc' : 'desc'))}
                          className="px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] font-mono text-xs cursor-pointer hover:border-[#FF8244] transition-colors whitespace-nowrap"
                        >
                          {histSortOrder === 'desc' ? 'Mais Recentes ↓' : 'Cronológica ↑'}
                        </button>
                      </div>
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
                                  <div className="font-semibold text-[#FF8244] whitespace-nowrap">
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
                                <div className="font-semibold text-[#FF8244] whitespace-nowrap">
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
                              {h.data_br} · <strong className="text-[#FF8244]">{h.horario}</strong>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono text-[#14213D] dark:text-white whitespace-nowrap align-top">
                              {h.chuva_mm_hora.toFixed(1)} mm
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono align-top">
                              <div className="space-y-0.5">
                                <div className="font-semibold text-[#FF8244] whitespace-nowrap">
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                    >
                      Portal INEA Alerta de Cheias <ExternalLink className="w-3.5 h-3.5 text-[#FF8244]" />
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
                    <div className="font-mono text-2xl font-semibold text-[#FF8244] mt-1 tabular-nums">
                      {rj ? `${rj.alerta_maximo_pct.toFixed(1)}%` : '--'}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                    <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#E5E5E5]/65">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF8244]" aria-hidden="true" />
                      Cota de Atenção
                    </div>
                    <div className="font-mono text-xl font-semibold text-[#14213D] dark:text-white mt-1.5 tabular-nums">
                      {rj?.cota_atencao || '1.99 m'}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                    <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#E5E5E5]/65">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF8244]" aria-hidden="true" />
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
                            ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-semibold'
                            : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white'
                        }`}
                      >
                        Hora a hora
                      </button>
                      <button
                        onClick={() => setRiverInterval('all')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                          riverInterval === 'all'
                            ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-semibold'
                            : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white'
                        }`}
                      >
                        Todas (30 min)
                      </button>
                    </div>
                    <button
                      onClick={handleDownloadRiverCsv}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] text-[#14213D] dark:text-white cursor-pointer transition-colors"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5 text-[#FF8244]" />
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
                      <div className="text-base font-semibold text-[#FF8244] mt-0.5 tabular-nums">
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
                              ? 'bg-[#FF8244]'
                              : r.nivel >= 1.99
                                ? 'bg-[#FF8244]'
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
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF8244]" aria-hidden="true" />
                    ≥ 1,99 m Atenção
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF8244]" aria-hidden="true" />
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
                {/* Cabeçalho da Bacia */}
                <div className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 space-y-4">
                  <div className="pb-3 border-b border-[#E5E5E5] dark:border-[#233354]">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
                      Bacia Hidrográfica RH-VIII · INEA · ANA
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#14213D] dark:text-white mt-1">
                      Rios de Macaé e Região — Monitoramento Hidrológico
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-1">
                      Estações telemétricas e fluviométricas oficiais INEA e ANA na bacia RH-VIII (Macaé e das Ostras)
                    </p>
                  </div>

                  {/* Cards dos principais rios de Macaé */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      {
                        nome: 'Rio Macaé',
                        subtipo: 'Rio Principal — Foz em Macaé',
                        descricao: 'Nasce na Serra do Macaé de Cima (Nova Friburgo), percorre ~170 km e deságua no Atlântico em Macaé. Principal rio da bacia RH-VIII.',
                        estacao: 'ANA 58750000 · INEA Macaé-Foz',
                        url: 'https://telemetriainea.rj.gov.br/',
                        ana_url: 'https://www.snirh.gov.br/hidroweb/mapa',
                        icon: '🌊',
                      },
                      {
                        nome: 'Rio Macabu',
                        subtipo: 'Afluente — Bacia RH-VIII Norte',
                        descricao: 'Afluente relevante da margem esquerda do Rio Macaé. Influencia enchentes nas áreas de Carapebus e Macaé rural.',
                        estacao: 'ANA 58870000 · Carapebus',
                        url: 'https://www.snirh.gov.br/hidroweb/mapa',
                        icon: '🏞️',
                      },
                      {
                        nome: 'Rio Sana',
                        subtipo: 'Cabeceira — Serra do Macaé de Cima',
                        descricao: 'Afluente do Rio Macaé vindo da Serra Verde. Referência para previsão de cheias 12–24h à frente na parte baixa do Macaé.',
                        estacao: 'ANA 58765000 · Mury/Lumiar',
                        url: 'https://www.snirh.gov.br/hidroweb/mapa',
                        icon: '⛰️',
                      },
                      {
                        nome: 'Rio Jundiá',
                        subtipo: 'Rio das Ostras — INEA 2241036',
                        descricao: 'Corta Rio das Ostras (Cantagalo, Âncora, Cláudio Ribeiro). Monitoramento telemétrico em tempo real pelo INEA.',
                        estacao: `Sensor INEA 2241036 · Cota atual: ${rj?.nivel_rio || '--'}`,
                        url: rj?.url || 'https://telemetriainea.rj.gov.br/',
                        icon: '📡',
                        badge: rj?.status_rio,
                      },
                      {
                        nome: 'Canal das Ostras',
                        subtipo: 'Ligação Lagos-Mar · RH-VIII Sul',
                        descricao: 'Sistema lagunar costeiro que conecta as lagoas de Rio das Ostras ao mar. Sofre influência direta das marés e da precipitação local.',
                        estacao: 'Monitoramento INEA/SUBDEC',
                        url: 'https://telemetriainea.rj.gov.br/',
                        icon: '🌐',
                      },
                      {
                        nome: 'Sala de Situação INEA RH-VIII',
                        subtipo: 'Central de Monitoramento Oficial',
                        descricao: 'Sala de Situação do INEA monitora em tempo real todas as estações fluviométricas e pluviométricas da Bacia RH-VIII.',
                        estacao: 'sala.situacao@inea.rj.gov.br',
                        url: 'https://telemetriainea.rj.gov.br/',
                        icon: '🏢',
                        isLink: true,
                      },
                    ].map((rio) => (
                      <div
                        key={rio.nome}
                        className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{rio.icon}</span>
                              <span className="font-semibold text-sm text-[#14213D] dark:text-white">{rio.nome}</span>
                              {rio.badge && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#FF8244]/20 text-[#FF8244]">
                                  {rio.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/60 font-mono mt-0.5">{rio.subtipo}</div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/80 leading-relaxed">{rio.descricao}</p>
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E5E5E5] dark:border-[#233354]">
                          <span className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/60 truncate">{rio.estacao}</span>
                          {rio.url && (
                            <a
                              href={rio.url}
                              target="_blank"
                              rel="noreferrer"
                              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                            >
                              Ver <ExternalLink className="w-3 h-3 text-[#FF8244]" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Links rápidos */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { label: 'Telemetria INEA RJ', url: 'https://telemetriainea.rj.gov.br/' },
                      { label: 'HidroWeb ANA', url: 'https://www.snirh.gov.br/hidroweb/mapa' },
                      { label: 'INEA Alertas Cheias', url: 'https://www.inea.rj.gov.br/recursos-hidricos/alertas-de-cheias/' },
                      { label: 'Boletim RH-VIII', url: 'https://www.inea.rj.gov.br/recursos-hidricos/boletins-hidrologicos/' },
                    ].map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] text-[#14213D] dark:text-[#E5E5E5] transition-colors bg-white dark:bg-[#14213D]"
                      >
                        {link.label} <ExternalLink className="w-3 h-3 text-[#FF8244]" />
                      </a>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 space-y-4">
                    <div className="pb-3 border-b border-[#E5E5E5] dark:border-[#233354]">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
                        Rio Jundiá · Bacia Hidrográfica RH-VIII
                      </div>
                      <h2 className="font-display text-lg font-semibold text-[#14213D] dark:text-white mt-1">
                        Rio das Ostras • Escoamento e Influência de Marés
                      </h2>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed">
                      O Rio Jundiá corta áreas urbanas e rurais de Rio das Ostras, banhando os bairros Cantagalo, Âncora, Cláudio Ribeiro e desaguando em direção à orla costeira.
                    </p>
                    <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs space-y-1">
                      <div className="inline-flex items-center gap-1.5 font-semibold text-[#14213D] dark:text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF8244]" aria-hidden="true" />
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
                        <span className="w-2 h-2 rounded-full bg-[#FF8244] mt-1 shrink-0" aria-hidden="true" />
                        <div>
                          <div className="font-semibold text-[#14213D] dark:text-white">Atenção ({rj?.cota_atencao || '1.99 m'})</div>
                          <div className="text-slate-500 dark:text-[#E5E5E5]/70">Prontidão operacional</div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#FF8244] mt-1 shrink-0" aria-hidden="true" />
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
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                        >
                          {boletimMeta.inea_boletim_hidrometeorologico.bulletin_info.label} <ExternalLink className="w-3.5 h-3.5 text-[#FF8244]" />
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
                                <span className="font-mono text-[#14213D] dark:text-[#FF8244] font-semibold tabular-nums">
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
                      <strong className="text-[#14213D] dark:text-[#FF8244]">{orla?.mar_ondas || '--'}</strong> ({orla?.status_geral || 'Sem avisos vigentes'})
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
                            ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-semibold'
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
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF8244]" aria-hidden="true" />
                        Moderado
                      </span>
                    </div>
                    <div className="font-mono text-base font-semibold text-[#FF8244] tabular-nums">
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
                                  className={`w-1.5 h-1.5 rounded-full ${isWarn ? 'bg-[#FF8244]' : 'bg-emerald-500'}`}
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
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                      >
                        Tábua Completa CHM <ExternalLink className="w-3.5 h-3.5 text-[#FF8244]" />
                      </a>
                    )}
                    {tabuaMares?.url_avisos && (
                      <a
                        href={tabuaMares.url_avisos}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                      >
                        Avisos CHM <ExternalLink className="w-3.5 h-3.5 text-[#FF8244]" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Card Destaque: Próxima Maré */}
                {tabuaMares?.proxima_mare && (
                  <div className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0B1324] border-[#E5E5E5] dark:border-[#233354] shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-[#F7F8FA] dark:bg-[#14213D] border-[#E5E5E5] dark:border-[#233354] text-[#FF8244]">
                        {tabuaMares.proxima_mare.tipo === 'PREAMAR' ? (
                          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <ArrowDown className="w-5 h-5 stroke-[2.5]" />
                        )}
                      </div>
                      <div>
                        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/70 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#FF8244] animate-pulse"></span>
                          Próximo Evento Astronômico de Maré
                        </div>
                        <div className="text-base font-bold text-[#14213D] dark:text-white mt-0.5">
                          {tabuaMares.proxima_mare.tipo === 'PREAMAR' ? 'Preia-mar (Maré Alta)' : 'Baixa-mar (Maré Baixa)'} às{' '}
                          <span className="font-mono text-[#FF8244] font-bold">{tabuaMares.proxima_mare.hora}</span> · Cota:{' '}
                          <span className="font-mono text-[#14213D] dark:text-white font-bold">{Number(tabuaMares.proxima_mare.altura).toFixed(1).replace('.', ',')} m</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-mono px-3 py-1.5 rounded-lg border bg-[#F7F8FA] dark:bg-[#14213D] text-[#14213D] dark:text-[#E5E5E5] border-[#E5E5E5] dark:border-[#233354]">
                      Imbetiba / Rio das Ostras (#39)
                    </div>
                  </div>
                )}

                {/* Marés de Hoje (4 Indicadores Minimalistas) */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-[#14213D] dark:text-white flex items-center gap-2">
                      <Waves className="w-4 h-4 text-[#FF8244]" />
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
                            className="p-4 rounded-xl border text-center transition-all bg-white dark:bg-[#0B1324] border-[#E5E5E5] dark:border-[#233354] shadow-xs"
                          >
                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                              {isHigh ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-[#FF8244]">
                                  <ArrowUp className="w-3.5 h-3.5 text-[#FF8244] stroke-[2.5]" /> Preia-mar
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase text-slate-500 dark:text-[#E5E5E5]/70">
                                  <ArrowDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 stroke-[2.5]" /> Baixa-mar
                                </span>
                              )}
                            </div>
                            <div className="text-2xl font-bold text-[#14213D] dark:text-white tabular-nums tracking-tight">
                              {ev.hora}
                            </div>
                            <div className={`text-xs font-bold mt-1 tabular-nums ${isHigh ? 'text-[#FF8244]' : 'text-slate-500 dark:text-[#E5E5E5]/60'}`}>
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

                {/* Tábua Semanal Completa (Próximos 7 Dias) - Minimalista e Limpa */}
                {tabuaMares?.dias && tabuaMares.dias.length > 0 && (
                  <div className="pt-2 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-display text-base font-bold text-[#14213D] dark:text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#FF8244]" />
                        Tábua Semanal Completa de Marés (Próximos 7 Dias)
                      </h3>
                      <span className="text-xs font-mono text-slate-500 dark:text-[#E5E5E5]/70">
                        Estação #39 Imbetiba / Macaé e Rio das Ostras
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#0B1324] shadow-xs">
                      <table className="w-full text-xs font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#14213D]/60 text-left">
                            <th className="py-3 px-4 font-bold text-[#14213D] dark:text-white">Data / Dia</th>
                            <th className="py-3 px-3 font-bold text-[#14213D] dark:text-white text-center">1ª Maré</th>
                            <th className="py-3 px-3 font-bold text-[#14213D] dark:text-white text-center">2ª Maré</th>
                            <th className="py-3 px-3 font-bold text-[#14213D] dark:text-white text-center">3ª Maré</th>
                            <th className="py-3 px-3 font-bold text-[#14213D] dark:text-white text-center">4ª Maré</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#233354]">
                          {tabuaMares.dias.map((dia, dIdx) => (
                            <tr
                              key={dia.data_iso}
                              className={`${
                                dIdx === 0
                                  ? 'bg-[#F7F8FA]/80 dark:bg-white/[0.04] font-semibold'
                                  : 'hover:bg-[#F7F8FA]/50 dark:hover:bg-white/[0.02]'
                              } transition-colors`}
                            >
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="font-bold text-[#14213D] dark:text-white flex items-center gap-2">
                                  <span>{dia.dia_semana}</span>
                                  {dIdx === 0 && (
                                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#FF8244]/15 text-[#14213D] dark:text-[#FF8244] border border-[#FF8244]/40 font-bold">
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
                                  <td key={evIdx} className="py-3 px-3 text-center whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-mono">
                                      {isHigh ? (
                                        <ArrowUp className="w-3.5 h-3.5 text-[#FF8244] stroke-[2.5]" />
                                      ) : (
                                        <ArrowDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 stroke-[2.5]" />
                                      )}
                                      <strong className={`font-bold ${isHigh ? 'text-[#14213D] dark:text-[#FF8244]' : 'text-slate-700 dark:text-slate-200'}`}>
                                        {ev.hora}
                                      </strong>
                                      <span className={`text-[11px] ${isHigh ? 'text-slate-500 dark:text-[#E5E5E5]/70 font-medium' : 'text-slate-400 dark:text-[#E5E5E5]/50'}`}>
                                        ({Number(ev.altura).toFixed(1).replace('.', ',')} m)
                                      </span>
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
                            className="px-2.5 py-1 rounded border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#14213D] hover:border-[#FF8244] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
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
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
                      <span>{balneabilidade?.orgao || 'INEA'} · Última Amostragem: {balneabilidade?.data_amostragem || balneabilidade?.data_boletim || '10/11/2026'} · CONAMA nº 274/2000</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Sincronizado via Portal INEA
                      </span>
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#14213D] dark:text-white mt-1">
                      Balneabilidade Oficial das Praias ({balnearSummary.proprias.length} de {balnearSummary.total} Próprias — {balnearSummary.pctProprias}%)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
                      Página oficial de referência:{' '}
                      <a
                        href={balneabilidade?.url_portal_inea || 'https://www.inea.rj.gov.br/ar-agua-e-solo/balneabilidade-das-praias/'}
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-[#FF8244] text-[#14213D] dark:text-[#FF8244] font-medium transition-colors"
                      >
                        inea.rj.gov.br/ar-agua-e-solo/balneabilidade-das-praias/
                      </a>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={balneabilidade?.url_portal_inea || 'https://www.inea.rj.gov.br/ar-agua-e-solo/balneabilidade-das-praias/'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FF8244] text-[#14213D] hover:bg-[#FF8244]/90 shadow-sm transition-colors"
                    >
                      Portal Oficial INEA <ExternalLink className="w-3.5 h-3.5 text-[#14213D]" />
                    </a>
                    {balneabilidade?.url_boletim_pdf && (
                      <a
                        href={balneabilidade.url_boletim_pdf}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                      >
                        Boletim Semanal PDF <ExternalLink className="w-3 h-3 text-[#FF8244]" />
                      </a>
                    )}
                    {balneabilidade?.url_seirhi && (
                      <a
                        href={balneabilidade.url_seirhi}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                      >
                        SEIRHI INEA <ExternalLink className="w-3 h-3 text-[#FF8244]" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Resumo Próprias vs Impróprias + Critério CONAMA */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#14213D] dark:text-white">Praias Próprias para Banho</span>
                      <span className="inline-flex items-center gap-1.5 font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                        {balnearSummary.proprias.length} ({balnearSummary.pctProprias}%)
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-[#E5E5E5]/80 leading-relaxed text-[11px]">
                      {balnearSummary.proprias.map((p) => p.praia.replace('Praia ', '').replace('da ', '').replace('das ', '').replace('do ', '')).join(', ')}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#14213D] dark:text-white">Praias Impróprias / Atenção</span>
                      <span className="inline-flex items-center gap-1.5 font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        <span className="w-2 h-2 rounded-full bg-rose-500" aria-hidden="true" />
                        {balnearSummary.improprias.length} ({balnearSummary.pctImproprias}%)
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-[#E5E5E5]/80 leading-relaxed text-[11px]">
                      {balnearSummary.improprias.map((p) => `${p.praia} (${p.localizacao})`).join(' · ')}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1.5">
                    <div className="font-semibold text-[#14213D] dark:text-[#FF8244]">Critério CONAMA nº 274/2000</div>
                    <p className="text-slate-600 dark:text-[#E5E5E5]/80 leading-relaxed text-[11px]">
                      Próprio se Enterococos ≤ 100 NMP/100 mL em ao menos 4 das últimas 5 coletas e &lt; 400 NMP/100 mL na coleta mais recente.
                    </p>
                  </div>
                </div>

                {balneabilidade?.observacao_tecnica && (
                  <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs text-slate-700 dark:text-[#E5E5E5] flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#FF8244] shrink-0" />
                    <div>
                      <strong className="text-[#14213D] dark:text-white font-semibold">Recomendação Oficial do INEA:</strong> {balneabilidade.observacao_tecnica}
                    </div>
                  </div>
                )}

                {/* Mapa Oficial de Balneabilidade do INEA (Boletim Oficial PDF) */}
                <div className="p-4 sm:p-5 rounded-xl border bg-white dark:bg-[#0B1324] border-[#E5E5E5] dark:border-[#233354] shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E5E5] dark:border-[#233354]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#FF8244]" />
                        <h3 className="font-display text-sm sm:text-base font-bold text-[#14213D] dark:text-white">
                          Mapa Oficial de Balneabilidade de Rio das Ostras — INEA
                        </h3>
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Coleta: {balneabilidade?.data_amostragem || '10/11/2026'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-0.5">
                        Extrato cartográfico oficial publicado no Boletim Estadual de Balneabilidade (INEA / SEIRHI)
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`${SITE_BASE}/img/inea_mapa_balneabilidade.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                      >
                        Ampliar Imagem <ExternalLink className="w-3 h-3 text-[#FF8244]" />
                      </a>
                      {balneabilidade?.url_boletim_pdf && (
                        <a
                          href={balneabilidade.url_boletim_pdf}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FF8244] text-[#14213D] hover:bg-[#FF8244]/90 shadow-sm transition-colors"
                        >
                          Boletim PDF Completo <ExternalLink className="w-3.5 h-3.5 text-[#14213D]" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="relative flex justify-center items-center bg-slate-50 dark:bg-black/25 rounded-lg p-2 sm:p-4 border border-[#E5E5E5] dark:border-[#233354] overflow-hidden">
                    <img
                      src={`${SITE_BASE}/img/inea_mapa_balneabilidade.png`}
                      alt="Mapa Oficial de Balneabilidade de Rio das Ostras extraído do Boletim do INEA"
                      className="max-h-[580px] w-auto max-w-full object-contain rounded-md shadow-xs transition hover:scale-[1.01]"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 px-1 pt-1 gap-2">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        <strong className="text-emerald-700 dark:text-emerald-400">Verde:</strong> Própria para banho
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                        <strong className="text-rose-700 dark:text-rose-400">Vermelho:</strong> Imprópria / Não recomendada
                      </span>
                    </div>
                    <span>Fonte: Boletim Oficial de Balneabilidade do Estado do RJ — Página 13</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E5E5] dark:border-[#233354] text-[11px] uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/65">
                        <th className="py-3 pr-4 font-medium">Código INEA</th>
                        <th className="py-3 px-3 font-medium">Praia</th>
                        <th className="py-3 px-3 font-medium">Localização da Coleta</th>
                        <th className="py-3 px-3 font-medium">Última Amostragem</th>
                        <th className="py-3 pl-4 font-medium">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#233354] text-sm">
                      {(balneabilidade?.pontos ?? []).map((pt) => {
                        const isPropria = pt.status === 'PRÓPRIA';
                        return (
                          <tr key={pt.codigo_seirhi || pt.codigo} className="hover:bg-[#F7F8FA] dark:hover:bg-[#0B1324]/60 transition-colors">
                            <td className="py-3 pr-4 align-top font-mono text-xs text-slate-500 dark:text-[#E5E5E5]/70 whitespace-nowrap">{pt.codigo}</td>
                            <td className="py-3 px-3 align-top font-medium text-[#14213D] dark:text-white whitespace-nowrap">{pt.praia}</td>
                            <td className="py-3 px-3 align-top text-xs text-slate-600 dark:text-[#E5E5E5]/80">{pt.localizacao}</td>
                            <td className="py-3 px-3 align-top font-mono text-xs text-slate-500 dark:text-[#E5E5E5]/70 whitespace-nowrap">
                              {pt.data_coleta_br || balneabilidade?.data_amostragem || '10/11/2026'}
                            </td>
                            <td className="py-3 pl-4 align-top text-xs font-medium whitespace-nowrap">
                              {isPropria ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                                  PRÓPRIA
                                </span>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" aria-hidden="true" />
                                    IMPRÓPRIA
                                  </span>
                                  {pt.motivo && (
                                    <p className="text-[10px] text-slate-500 dark:text-[#E5E5E5]/60 max-w-[220px] whitespace-normal leading-tight">
                                      {pt.motivo}
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <div>
                    <h1 className="font-display text-2xl font-semibold text-[#14213D] dark:text-white">
                      Alertas Meteorológicos Oficiais Vigentes
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-1">
                      Monitoramento contínuo: Marinha do Brasil (CHM / METAREA V) &amp; Instituto Nacional de Meteorologia (INMET)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => refreshMarinhaLive()}
                    disabled={syncingMarinha}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#14213D] text-[#14213D] dark:text-white hover:border-[#FF8244] transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#FF8244] ${syncingMarinha ? 'animate-spin' : ''}`} />
                    <span>{syncingMarinha ? 'Verificando CHM...' : 'Atualizar Avisos'}</span>
                  </button>
                </div>

                {/* Banner de Garantia de Sincronia Oficial (INMET & Marinha CHM) */}
                <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs text-slate-700 dark:text-[#E5E5E5] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <Info className="w-4 h-4 text-[#FF8244] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div>
                        <strong className="text-[#14213D] dark:text-white">Sincronização Oficial em Tempo Real (INMET &amp; Marinha CHM):</strong>{' '}
                        Os avisos de mau tempo da Marinha do Brasil e os alertas do INMET seguem rigorosamente os horários originais de vigência (Brasília UTC-3).
                      </div>
                      {marinhaAvisos?.atualizacao_brt && (
                        <div className="font-mono text-[11px] text-slate-500 dark:text-[#E5E5E5]/70">
                          Última verificação Marinha CHM: <span className="text-[#14213D] dark:text-white font-semibold">{marinhaAvisos.atualizacao_brt}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 shrink-0 text-[11px]">
                    <a
                      href={marinhaAvisos?.fonte_url || 'https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-[#14213D] dark:text-[#FF8244] hover:underline"
                    >
                      Portal Marinha (CHM) <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <a
                      href="https://alertas2.inmet.gov.br/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-[#14213D] dark:text-[#FF8244] hover:underline"
                    >
                      Portal INMET Alertas <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Seletor Rápido de Localidade (INMET RJ + Marinha CHM) */}
                {(inmetAvisos.length > 0 || marinhaListaAtiva.length > 0) && (() => {
                  const inmetOstras = inmetAvisos.filter((a) => a.eh_direto_ostras !== false).length;
                  const inmetOutros = inmetAvisos.filter((a) => a.eh_direto_ostras === false).length;
                  const marDelta = marinhaListaAtiva.filter((a) => a.eh_area_delta !== false).length;
                  const marOutros = marinhaListaAtiva.filter((a) => a.eh_area_delta === false).length;
                  const totalTodos = inmetAvisos.length + marinhaListaAtiva.length;
                  const totalOstras = inmetOstras + marDelta;
                  const totalOutros = inmetOutros + marOutros;
                  return (
                    <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                      <span className="text-slate-500 dark:text-[#E5E5E5]/70 font-medium text-[11px]">
                        Visualizar abrangência:
                      </span>
                      <button
                        type="button"
                        onClick={() => setAlertaFiltroLocal('todos')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                          alertaFiltroLocal === 'todos'
                            ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-black border-[#14213D] dark:border-[#FF8244] shadow-xs'
                            : 'bg-white dark:bg-[#14213D] text-slate-700 dark:text-[#E5E5E5] border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]'
                        }`}
                      >
                        Todos os Alertas ({totalTodos})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAlertaFiltroLocal('ostras')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                          alertaFiltroLocal === 'ostras'
                            ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#0B1324] border-[#14213D] dark:border-[#FF8244] shadow-xs'
                            : 'bg-white dark:bg-[#14213D] text-slate-700 dark:text-[#E5E5E5] border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#FF8244]" />
                        Rio das Ostras &amp; Área Delta ({totalOstras})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAlertaFiltroLocal('outros')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                          alertaFiltroLocal === 'outros'
                            ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#0B1324] border-[#14213D] dark:border-[#FF8244] shadow-xs'
                            : 'bg-white dark:bg-[#14213D] text-slate-700 dark:text-[#E5E5E5] border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-[#FF8244]" />
                        Outras Regiões / Áreas ({totalOutros})
                      </button>
                    </div>
                  );
                })()}

                {/* BLOCO 1: AVISOS OFICIAIS DE MAU TEMPO DA MARINHA DO BRASIL (CHM / SMM) */}
                {(() => {
                  const nowUtcMs = Date.now();
                  const filteredMarinha = marinhaListaAtiva.filter((av) => {
                    const isDelta = av.eh_area_delta !== false;
                    if (alertaFiltroLocal === 'ostras') return isDelta;
                    if (alertaFiltroLocal === 'outros') return !isDelta;
                    return true;
                  });

                  return (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Waves className="w-4 h-4 text-[#FF8244]" />
                          <h2 className="font-display text-base sm:text-lg font-semibold text-[#14213D] dark:text-white">
                            Marinha do Brasil — Avisos de Mau Tempo (CHM / METAREA V)
                          </h2>
                        </div>
                        {marinhaAvisos?.cartas_sinoticas && (
                          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                            {marinhaAvisos.cartas_sinoticas.map((c) => (
                              <a
                                key={c.horario}
                                href={c.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#14213D] hover:border-[#FF8244] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                              >
                                Carta {c.horario} <ExternalLink className="w-3 h-3 text-[#FF8244]" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {filteredMarinha.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {filteredMarinha.map((av, idx) => {
                            const isDelta = av.eh_area_delta !== false;
                            const iniMs = av.inicio_utc ? Date.parse(av.inicio_utc) : NaN;
                            const isVigenteAgora = Number.isNaN(iniMs) ? av.status_vigencia !== 'Programado' : nowUtcMs >= iniMs;
                            const marinhaVigenciaLabel = isVigenteAgora
                              ? 'Vigente Agora'
                              : av.inicio_br
                                ? `Programado (${av.inicio_br})`
                                : 'Programado';
                            return (
                              <article
                                key={`${av.numero || 'chm'}-${idx}`}
                                className={`bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] ${
                                  isDelta
                                    ? 'border-l-4 border-l-emerald-500 shadow-xs'
                                    : 'border-l-4 border-l-amber-500/80 dark:border-l-amber-500/60 opacity-95'
                                } rounded-xl p-6 flex flex-col justify-between gap-4`}
                              >
                                <div className="space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E5E5] dark:border-[#233354]">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold uppercase bg-[#14213D] text-white dark:bg-[#0B1324] border border-[#14213D] dark:border-[#233354]">
                                        MARINHA · CHM
                                      </span>
                                      <span className="font-mono text-xs text-[#FF8244] font-semibold">
                                        Aviso nº {av.numero || '--'}
                                      </span>
                                      {isDelta ? (
                                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-white border border-[#E5E5E5] dark:border-[#233354] flex items-center gap-1">
                                          <MapPin className="w-3 h-3 text-[#FF8244] shrink-0" />
                                          Área Delta (Rio das Ostras / Bacia de Campos)
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-[#F7F8FA] dark:bg-[#0B1324] text-slate-500 dark:text-[#E5E5E5]/70 border border-[#E5E5E5] dark:border-[#233354] flex items-center gap-1">
                                          <Compass className="w-3 h-3 text-slate-400 shrink-0" />
                                          {av.area_grupo || 'Outra Área'} (Fora da Área Delta)
                                        </span>
                                      )}
                                      <span
                                        className={`px-2 py-0.5 rounded font-mono text-[10px] border ${
                                          isVigenteAgora
                                            ? 'bg-[#F7F8FA] dark:bg-[#0B1324] text-[#FF8244] border-[#FF8244]/50 font-bold'
                                            : 'bg-[#F7F8FA] dark:bg-[#0B1324] text-slate-600 dark:text-[#E5E5E5]/80 border-[#E5E5E5] dark:border-[#233354] font-medium'
                                        }`}
                                      >
                                        {marinhaVigenciaLabel}
                                      </span>
                                    </div>
                                    <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-[#FF8244]">
                                      {av.tipo}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <h3 className="font-display text-lg font-semibold text-[#14213D] dark:text-white">
                                      {av.tipo} — {av.forca || 'AVISO CHM'}
                                    </h3>
                                    {(av.inicio_br || av.fim_br) && (
                                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-600 dark:text-[#E5E5E5]/80 bg-[#F7F8FA] dark:bg-[#0B1324] px-2.5 py-1 rounded-md border border-[#E5E5E5] dark:border-[#233354]">
                                        <Clock className="w-3.5 h-3.5 text-[#FF8244]" />
                                        <span>{av.inicio_br || '--'}</span>
                                        <span className="text-slate-400">→</span>
                                        <span>{av.fim_br || '--'}</span>
                                      </span>
                                    )}
                                  </div>

                                  {isDelta ? (
                                    <div className="p-2.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs text-slate-700 dark:text-[#E5E5E5]/90 flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-[#FF8244] shrink-0" />
                                      <span>
                                        <strong className="text-[#14213D] dark:text-white">Abrangência Costeira/Oceânica:</strong> {av.area}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="p-2.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs text-slate-500 dark:text-[#E5E5E5]/70 flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0" />
                                      <span>
                                        <strong>Outra Área METAREA V:</strong> {av.area} (não atinge diretamente Rio das Ostras).
                                      </span>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                                    <div className="p-2.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                                      <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-[#E5E5E5]/60">Vento / Rajadas</div>
                                      <div className="font-mono font-semibold text-[#14213D] dark:text-white mt-0.5">{av.rajadas || '--'}</div>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                                      <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-[#E5E5E5]/60">Mar / Ondas</div>
                                      <div className="font-mono font-semibold text-[#14213D] dark:text-white mt-0.5">{av.mar_ondas || av.ondas || '--'}</div>
                                    </div>
                                  </div>

                                  <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-2 text-xs text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed">
                                    {av.restricao && (
                                      <div>
                                        <strong className="text-[#14213D] dark:text-white">Orientação Costeira:</strong> {av.restricao}
                                      </div>
                                    )}
                                    {av.texto && (
                                      <div>
                                        <strong className="text-[#14213D] dark:text-white block mb-1">Boletim Oficial Emitido pela Marinha (SMM):</strong>
                                        <div className="font-mono text-[11px] text-slate-600 dark:text-[#E5E5E5]/80 bg-white dark:bg-[#14213D]/60 p-2.5 rounded border border-[#E5E5E5] dark:border-[#233354]">
                                          {av.texto}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-[#E5E5E5] dark:border-[#233354] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/70">
                                  <span>{av.emissao ? `Emissão CHM: ${av.emissao}` : av.validade || 'SMM / Marinha do Brasil'}</span>
                                  <a
                                    href={av.fonte_url || marinhaAvisos?.fonte_url || 'https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[#14213D] dark:text-[#FF8244] hover:underline shrink-0"
                                  >
                                    Ver aviso oficial na Marinha <ExternalLink className="w-3 h-3 text-[#FF8244]" />
                                  </a>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-5 text-xs sm:text-sm text-slate-600 dark:text-[#E5E5E5]/85 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            {alertaFiltroLocal === 'outros'
                              ? 'Sem avisos de mau tempo ativos da Marinha em outras áreas no momento.'
                              : 'Sem avisos de mau tempo ativos da Marinha para a Área Delta (Rio das Ostras / Bacia de Campos) no momento.'}
                          </div>
                          <a
                            href={marinhaAvisos?.fonte_url || 'https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo'}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs text-[#14213D] dark:text-[#FF8244] hover:underline"
                          >
                            Consultar Portal CHM <ExternalLink className="w-3 h-3 text-[#FF8244]" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* BLOCO 2: AVISOS METEOROLÓGICOS OFICIAIS DO INMET */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#FF8244]" />
                    <h2 className="font-display text-base sm:text-lg font-semibold text-[#14213D] dark:text-white">
                      INMET — Avisos Meteorológicos Vigentes
                    </h2>
                  </div>
                {inmetAvisos.length > 0 ? (() => {
                  // Cálculo exato no fuso horário de Rio das Ostras / Brasília (UTC-3)
                  const nowBrt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
                  const nowMs = nowBrt.getTime();

                  const parseAlertDate = (dStr?: string, hStr?: string) => {
                    if (!dStr) return null;
                    const cleanD = dStr.split('T')[0].split(' ')[0].trim();
                    let cleanH = (hStr || (dStr.includes(' ') ? dStr.split(' ')[1] : '00:00')).replace('h', '').trim();
                    if (cleanD.includes('/')) {
                      const [dia, mes, ano] = cleanD.split('/').map(Number);
                      const [hh, mm] = cleanH.split(':').map(Number);
                      return new Date(ano, mes - 1, dia, hh || 0, mm || 0, 0);
                    } else if (cleanD.includes('-')) {
                      const [ano, mes, dia] = cleanD.split('-').map(Number);
                      const [hh, mm] = cleanH.split(':').map(Number);
                      return new Date(ano, mes - 1, dia, hh || 0, mm || 0, 0);
                    }
                    return null;
                  };

                  const getAlertTimeMs = (dStr?: string, hStr?: string) => {
                    const d = parseAlertDate(dStr, hStr);
                    return d ? d.getTime() : 0;
                  };

                  const sortedAvisos = inmetAvisos
                    .filter((av) => {
                      if (alertaFiltroLocal === 'ostras') return av.eh_direto_ostras !== false;
                      if (alertaFiltroLocal === 'outros') return av.eh_direto_ostras === false;
                      return true;
                    })
                    .slice()
                    .sort((a, b) => {
                      const startA = getAlertTimeMs(a.inicio || a.data_inicio, a.hora_inicio);
                      const startB = getAlertTimeMs(b.inicio || b.data_inicio, b.hora_inicio);
                      if (startA !== startB) return startA - startB;
                      const endA = getAlertTimeMs(a.fim || a.data_fim, a.hora_fim);
                      const endB = getAlertTimeMs(b.fim || b.data_fim, b.hora_fim);
                      if (endA !== endB) return endA - endB;
                      const ostrasA = a.eh_direto_ostras !== false ? 1 : 0;
                      const ostrasB = b.eh_direto_ostras !== false ? 1 : 0;
                      if (ostrasA !== ostrasB) return ostrasB - ostrasA;
                      return (Number(a.id) || 0) - (Number(b.id) || 0);
                    });

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {sortedAvisos.map((av) => {
                        const startDate = parseAlertDate(av.inicio || av.data_inicio, av.hora_inicio);

                        let vigenciaLabel = 'Vigente Agora';
                        let vigenciaBadgeClass = 'bg-[#F7F8FA] dark:bg-[#0B1324] text-[#FF8244] border-[#FF8244]/50 font-bold';

                        if (startDate) {
                          const startMs = startDate.getTime();
                          if (nowMs < startMs) {
                            const hTxt = av.hora_inicio ? `${av.hora_inicio}h` : '';
                            vigenciaLabel = hTxt ? `Programado (${hTxt})` : 'Programado';
                            vigenciaBadgeClass = 'bg-[#F7F8FA] dark:bg-[#0B1324] text-slate-600 dark:text-[#E5E5E5]/80 border-[#E5E5E5] dark:border-[#233354] font-medium';
                          }
                        }
                      return (
                        <article
                          key={av.id}
                          className={`bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] ${
                            av.eh_direto_ostras !== false
                              ? 'border-l-4 border-l-emerald-500 shadow-xs'
                              : 'border-l-4 border-l-amber-500/80 dark:border-l-amber-500/60 opacity-95'
                          } rounded-xl p-6 flex flex-col justify-between gap-4`}
                        >
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E5E5] dark:border-[#233354]">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold uppercase bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-white">
                                  INMET
                                </span>
                                <span className="font-mono text-xs text-[#FF8244] font-semibold">
                                  Aviso nº {av.id}
                                </span>
                                {av.eh_direto_ostras !== false ? (
                                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-white border border-[#E5E5E5] dark:border-[#233354] flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-[#FF8244] shrink-0" />
                                    Rio das Ostras (Válido no Município)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-[#F7F8FA] dark:bg-[#0B1324] text-slate-500 dark:text-[#E5E5E5]/70 border border-[#E5E5E5] dark:border-[#233354] flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-slate-400 shrink-0" />
                                    Outras Localidades do RJ (Não inclui Rio das Ostras)
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 rounded font-mono text-[10px] border ${vigenciaBadgeClass}`}
                                >
                                  {vigenciaLabel}
                                </span>
                              </div>
                              <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-[#FF8244]">
                                {av.cor_badge || 'Alerta Oficial'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <h2 className="font-display text-lg font-semibold text-[#14213D] dark:text-white">
                                {av.descricao} — {av.severidade}
                              </h2>
                              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-600 dark:text-[#E5E5E5]/80 bg-[#F7F8FA] dark:bg-[#0B1324] px-2.5 py-1 rounded-md border border-[#E5E5E5] dark:border-[#233354]">
                                <Clock className="w-3.5 h-3.5 text-[#FF8244]" />
                                <span>{av.inicio_formatado || av.inicio}</span>
                                <span className="text-slate-400">→</span>
                                <span>{av.fim_formatado || av.fim}</span>
                              </span>
                            </div>

                            {/* Destaque Explícito de Abrangência Territorial */}
                            {av.eh_direto_ostras !== false ? (
                              <div className="p-2.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs text-slate-700 dark:text-[#E5E5E5]/90 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#FF8244] shrink-0" />
                                <span>
                                  <strong className="text-[#14213D] dark:text-white">Válido em Rio das Ostras:</strong> O município está incluído diretamente no polígono de risco deste alerta oficial.
                                </span>
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs text-slate-500 dark:text-[#E5E5E5]/70 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>
                                  <strong>Apenas Outras Regiões do RJ:</strong> Este alerta NÃO abrange o município de Rio das Ostras (válido somente para outras localidades fluminenses).
                                </span>
                              </div>
                            )}

                            <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-2 text-xs text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed">
                              <div>
                                <strong className="text-[#14213D] dark:text-white">Riscos:</strong>{' '}
                                {(av.riscos || []).join(' ')}
                              </div>
                              <div>
                                <strong className="text-[#14213D] dark:text-white">Defesa Civil 199:</strong>
                                <ul className="mt-1 space-y-1 text-slate-500 dark:text-[#E5E5E5]/75">
                                  {(av.instrucoes || []).map((ins, i) => (
                                    <li key={i}>• {ins}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[#E5E5E5] dark:border-[#233354] flex items-center justify-end text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/70">
                            <a
                              href={`https://alertas2.inmet.gov.br/${av.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[#14213D] dark:text-[#FF8244] hover:underline shrink-0"
                            >
                              Ver detalhes no INMET <ExternalLink className="w-3 h-3 text-[#FF8244]" />
                            </a>
                          </div>
                        </article>
                      );
                    })}
                    </div>
                  );
                })() : (
                  <div className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 text-sm">
                    Sem avisos ativos no INMET no momento.
                  </div>
                )}
                </div>

                {boletimMeta?.alertas_estruturados && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                    {boletimMeta.alertas_estruturados.map((al) => (
                      <div
                        key={al.titulo}
                        className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-5 space-y-2"
                      >
                        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#FF8244]">{al.status}</div>
                        <div className="font-display text-base font-semibold text-[#14213D] dark:text-white">
                          {al.titulo}
                        </div>
                        <div className="text-xs font-medium text-[#FF8244]">{al.detalhe}</div>
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                      >
                        Boletim Nacional CEMADEN <ExternalLink className="w-3.5 h-3.5 text-[#FF8244]" />
                      </a>
                    )}
                    {cemadenRj?.portal_url && (
                      <a
                        href={cemadenRj.portal_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                      >
                        Painel CEMADEN-RJ <ExternalLink className="w-3.5 h-3.5 text-[#FF8244]" />
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
                          ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-semibold'
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
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#14213D] dark:text-[#FF8244]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8244]" aria-hidden="true" />
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
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#14213D] dark:text-[#FF8244]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8244]" aria-hidden="true" />
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
                                ? 'border-[#FF8244] bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#FF8244] font-semibold'
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
                              <span className="font-mono text-[#FF8244] font-semibold">{al.processo}</span>
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
                        Semana: <strong className="text-[#FF8244] tabular-nums">{boletimMeta.analise_precipitacao_multifonte.acumulado_semana_media.toFixed(1)} mm</strong>
                      </span>
                    )}
                    <button
                      onClick={() => setShowFullBoletimTable((v) => !v)}
                      className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] text-[#14213D] dark:text-[#E5E5E5] cursor-pointer transition-colors"
                    >
                      {showFullBoletimTable ? 'Ver Cards por Dia' : 'Ver Tabela Completa dos Turnos'}
                    </button>
                  </div>
                </div>

                {/* Projeção Diária de Precipitação (Hoje + 7 Dias) — Layout Desembolado em Mini-Cards */}
                {(() => {
                  const multifonte = (boletimMeta as any)?.analise_precipitacao_multifonte;
                  if (!multifonte) return null;

                  let dias: { label: string; data?: string; val: number }[] = [];
                  if (Array.isArray(multifonte.previsto_por_dia) && multifonte.previsto_por_dia.length > 0) {
                    dias = multifonte.previsto_por_dia.map((p: any, i: number) => ({
                      label: p.dia_semana ? p.dia_semana.slice(0, 3) : `Dia ${i + 1}`,
                      data: p.data_br ? p.data_br.slice(0, 5) : '',
                      val: Number(p.chuva_media_modelos_mm ?? 0),
                    }));
                  } else if (typeof multifonte.acumulado_semana_formula === 'string') {
                    const regex = /(\d+(?:\.\d+)?)\s*mm\s*\(([^)]+)\)/g;
                    let match;
                    while ((match = regex.exec(multifonte.acumulado_semana_formula)) !== null) {
                      dias.push({ label: match[2].trim(), val: parseFloat(match[1]) });
                    }
                  }

                  if (dias.length === 0) return null;

                  const totalVal =
                    typeof multifonte.acumulado_semana_media === 'number'
                      ? multifonte.acumulado_semana_media
                      : dias.reduce((acc, d) => acc + d.val, 0);

                  return (
                    <div className="p-4 rounded-xl bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] space-y-3 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[#E5E5E5] dark:border-[#233354]">
                        <div className="flex items-center gap-2">
                          <CloudRain className="w-4 h-4 text-[#FF8244] shrink-0" />
                          <div>
                            <h3 className="font-semibold text-xs text-[#14213D] dark:text-white">
                              Previsão Diária de Chuva — Hoje + 7 Dias
                            </h3>
                            <p className="text-[10px] text-slate-500 dark:text-[#E5E5E5]/70">
                              Projeção multimodelo consolidada para Rio das Ostras
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          {multifonte.acumulado_3dias_media !== undefined && (
                            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md text-[11px] bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-slate-600 dark:text-[#E5E5E5]/80">
                              Total 3 Dias: <strong className="ml-1 text-[#14213D] dark:text-white">{Number(multifonte.acumulado_3dias_media).toFixed(1)} mm</strong>
                            </span>
                          )}
                          <span className="px-3 py-1 rounded-md font-bold bg-[#FF8244]/10 dark:bg-[#FF8244]/15 text-[#FF8244] border border-[#FF8244]/40">
                            Total 7 Dias: {totalVal.toFixed(1)} mm
                          </span>
                        </div>
                      </div>

                      {/* Grade dos 8 dias totalmente desembolada */}
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {dias.map((d, idx) => {
                          const isChuvaExpressiva = d.val >= 10;
                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded-lg border text-center flex flex-col justify-between items-center transition-all bg-[#F7F8FA] dark:bg-[#0B1324] ${
                                isChuvaExpressiva
                                  ? 'border-[#FF8244]/50 text-[#14213D] dark:text-white shadow-2xs'
                                  : 'border-[#E5E5E5] dark:border-[#233354] text-slate-600 dark:text-[#E5E5E5]'
                              }`}
                            >
                              <span className="text-[11px] font-semibold text-slate-600 dark:text-[#E5E5E5]/80">
                                {d.label}
                              </span>
                              {d.data && (
                                <span className="text-[9px] font-mono text-slate-400 dark:text-[#E5E5E5]/60">
                                  {d.data}
                                </span>
                              )}
                              <div className="my-1">
                                <span
                                  className={`font-mono text-sm font-bold tabular-nums ${
                                    isChuvaExpressiva
                                      ? 'text-[#FF8244]'
                                      : d.val > 0
                                      ? 'text-[#14213D] dark:text-white'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {d.val.toFixed(1)}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400 ml-0.5">mm</span>
                              </div>
                              {isChuvaExpressiva ? (
                                <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-[#FF8244]/15 text-[#FF8244]">
                                  Moderada
                                </span>
                              ) : d.val > 0 ? (
                                <span className="text-[8px] text-slate-500 dark:text-[#E5E5E5]/70 font-medium">
                                  Leve
                                </span>
                              ) : (
                                <span className="text-[8px] text-slate-400">
                                  Sem chuva
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {!showFullBoletimTable ? (
                  <>
                    <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg overflow-x-auto">
                      {boletimDates.map((d) => (
                        <button
                          key={d.data_iso}
                          onClick={() => setSelectedBoletimDate(d.data_iso)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                            (selectedBoletimDate || boletimDates[0]?.data_iso) === d.data_iso
                              ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-semibold'
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
                          <div className="font-mono text-2xl font-semibold text-[#FF8244] tabular-nums">
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
                            <td className="py-2.5 px-3 align-top text-right text-[#FF8244] font-semibold tabular-nums whitespace-nowrap">
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


              </section>
            )}

            {showSub('meteogramas') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[#14213D] dark:text-white">
                      Meteogramas Numéricos Oficiais (CPTEC / INMET)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-0.5">
                      Séries temporais e modelagem numérica de alta resolução para Rio das Ostras (CPTEC 3866 / INMET 3304524).
                    </p>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg">
                    {[
                      { id: 'cptec', label: 'Meteograma CPTEC (3866)' },
                      { id: 'inmet', label: 'Meteograma INMET (COSMO)' },
                      { id: 'wwatch', label: 'WaveWatch III Ondas' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMeteoView(m.id as 'cptec' | 'inmet' | 'wwatch')}
                        className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                          meteoView === m.id
                            ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-semibold'
                            : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {meteoView === 'cptec' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                            CPTEC / INPE WRF · Município 3866
                          </span>
                          <span className="text-xs font-semibold text-[#14213D] dark:text-white">
                            Rio das Ostras - RJ
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/80 mt-1">
                          Meteograma numérico oficial de alta resolução horária. Evolução temporal de chuva acumulada e convectiva, temperatura do ar a 2m, ponto de orvalho, vento a 10m com rajadas, pressão ao nível do mar e cobertura de nuvens.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={`${SITE_BASE}/img/cptec/meteograma_cptec_3866.png`}
                          download="meteograma_cptec_3866_rio_das_ostras.png"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-white hover:bg-slate-50 dark:hover:bg-[#1f2f4e] transition-colors"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" /> Baixar Imagem
                        </a>
                        <a
                          href="https://previsaonumerica.cptec.inpe.br/meteograma/3866"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] hover:opacity-90 transition-opacity"
                        >
                          Portal CPTEC <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="relative rounded-xl border border-[#E5E5E5] dark:border-[#233354] bg-white p-3 flex flex-col items-center justify-center overflow-hidden">
                      <a
                        href={`${SITE_BASE}/img/cptec/meteograma_cptec_3866.png`}
                        target="_blank"
                        rel="noreferrer"
                        title="Clique para abrir em alta resolução"
                        className="block w-full text-center group cursor-zoom-in"
                      >
                        <img
                          src={`${SITE_BASE}/img/cptec/meteograma_cptec_3866.png`}
                          alt="Meteograma Numérico Oficial CPTEC/INPE - Rio das Ostras (3866)"
                          referrerPolicy="no-referrer"
                          className="w-full max-h-[800px] object-contain mx-auto rounded transition-transform group-hover:scale-[1.01]"
                        />
                      </a>
                      <div className="w-full pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 mt-2">
                        <span>Fonte: CPTEC / INPE (Modelo Numérico WRF Alta Resolução · ID 3866)</span>
                        <span className="italic">Clique na imagem para abrir em resolução cheia</span>
                      </div>
                    </div>
                  </div>
                )}

                {meteoView === 'inmet' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#F7F8FA] dark:bg-[#14213D] text-[#14213D] dark:text-[#FF8244] border border-[#E5E5E5] dark:border-[#233354]">
                            INMET COSMO 7x7km · Município 3304524
                          </span>
                          <span className="text-xs font-semibold text-[#14213D] dark:text-white">
                            Rio das Ostras - RJ
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/80 mt-1">
                          Meteograma numérico oficial INMET gerado pelo modelo regional COSMO rodada 12 UTC. Evolução temporal de chuva, temperatura do ar a 2m, ponto de orvalho, vento a 10m, pressão atmosférica e nebulosidade.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={`${SITE_BASE}/img/meteograma_inmet.png`}
                          download="meteograma_inmet_3304524_rio_das_ostras.png"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-white hover:bg-slate-50 dark:hover:bg-[#1f2f4e] transition-colors"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" /> Baixar Imagem
                        </a>
                        <a
                          href="https://meteograma.inmet.gov.br/3304524/dinamico"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] hover:opacity-90 transition-opacity"
                        >
                          Portal Dinâmico INMET <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="relative rounded-xl border border-[#E5E5E5] dark:border-[#233354] bg-white p-3 flex flex-col items-center justify-center overflow-hidden">
                      <a
                        href={`${SITE_BASE}/img/meteograma_inmet.png`}
                        target="_blank"
                        rel="noreferrer"
                        title="Clique para abrir em alta resolução"
                        className="block w-full text-center group cursor-zoom-in"
                      >
                        <img
                          src={`${SITE_BASE}/img/meteograma_inmet.png`}
                          alt="Meteograma Numérico Oficial INMET COSMO - Rio das Ostras (3304524)"
                          referrerPolicy="no-referrer"
                          className="w-full max-h-[800px] object-contain mx-auto rounded transition-transform group-hover:scale-[1.01]"
                        />
                      </a>
                      <div className="w-full pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 mt-2">
                        <span>Fonte: Instituto Nacional de Meteorologia (INMET · Modelo Regional COSMO)</span>
                        <span className="italic">Clique na imagem para abrir em resolução cheia</span>
                      </div>
                    </div>
                  </div>
                )}

                {meteoView === 'wwatch' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#F7F8FA] dark:bg-[#14213D] text-[#14213D] dark:text-[#FF8244] border border-[#E5E5E5] dark:border-[#233354]">
                            CPTEC / INPE WaveWatch III
                          </span>
                          <span className="text-xs font-semibold text-[#14213D] dark:text-white">
                            Modelagem Oceânica · Região Sudeste
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/80 mt-1">
                          Carta de modelagem marítima de altura significativa de onda (em metros) e vetores de direção do vento costeiro na Região Sudeste e bacia de Campos.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={`${SITE_BASE}/img/cptec/wwatch_alt_onda_sud_000h.png`}
                          download="wavewatch3_sudeste_rio_das_ostras.png"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-white hover:bg-slate-50 dark:hover:bg-[#1f2f4e] transition-colors"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" /> Baixar Carta
                        </a>
                        <a
                          href="https://previsaonumerica.cptec.inpe.br/"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] hover:opacity-90 transition-opacity"
                        >
                          Portal WaveWatch <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="relative rounded-xl border border-[#E5E5E5] dark:border-[#233354] bg-white p-3 flex flex-col items-center justify-center overflow-hidden">
                      <a
                        href={`${SITE_BASE}/img/cptec/wwatch_alt_onda_sud_000h.png`}
                        target="_blank"
                        rel="noreferrer"
                        title="Clique para abrir em alta resolução"
                        className="block w-full text-center group cursor-zoom-in"
                      >
                        <img
                          src={`${SITE_BASE}/img/cptec/wwatch_alt_onda_sud_000h.png`}
                          alt="Modelo WaveWatch III Altura Significativa de Onda CPTEC Sudeste"
                          referrerPolicy="no-referrer"
                          className="w-full max-h-[750px] object-contain mx-auto rounded transition-transform group-hover:scale-[1.01]"
                        />
                      </a>
                      <div className="w-full pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 mt-2">
                        <span>Fonte: CPTEC / INPE (WaveWatch III Oceânico)</span>
                        <span className="italic">Clique na imagem para abrir em resolução cheia</span>
                      </div>
                    </div>
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
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] font-mono text-sm font-semibold text-[#14213D] dark:text-white transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#FF8244]" />
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
                          className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] transition-colors flex flex-col justify-between gap-1.5"
                        >
                          <div className="font-semibold text-[#14213D] dark:text-white leading-snug">{f.nome}</div>
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/65">
                            <span>{f.tipo}</span>
                            <ExternalLink className="w-3 h-3 text-[#FF8244] shrink-0" />
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

        {/* ================= ABA 7: PANORAMA DO CLIMA ================= */}
        {activeTab === 'panorama' && (
          <div className="space-y-8">
            <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-6">
              <div className="pb-4 border-b border-[#E5E5E5] dark:border-[#233354] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF8244] animate-pulse"></span>
                    Consolidado Oficial da Rede Pluviométrica · Personalizável
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14213D] dark:text-white mt-1">
                    Panorama do Clima — {panoramaData?.labelPeriodo || 'Período Selecionado'}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-0.5">
                    Gere métricas, gráficos e retrospectivas oficiais para qualquer mês, semana ou dias agrupados de Rio das Ostras.
                  </p>
                </div>
              </div>

              {/* BARRA DE SELEÇÃO: MÊS E DIA */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* OPÇÃO 1: ESCOLHA O MÊS */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-[#14213D] dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#FF8244]" />
                      <span>Escolha o Mês:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPanoramaPreset('custom');
                          setPanoramaStart('2026-11-01');
                          setPanoramaEnd('2026-11-14');
                        }}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition cursor-pointer text-center ${
                          panoramaStart.startsWith('2026-11')
                            ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#0B1324] border-[#14213D] dark:border-[#FF8244] shadow-xs'
                            : 'bg-white dark:bg-[#14213D] text-slate-700 dark:text-[#E5E5E5] border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]'
                        }`}
                      >
                        Novembro / 2026
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPanoramaPreset('custom');
                          setPanoramaStart('2026-10-01');
                          setPanoramaEnd('2026-10-31');
                        }}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition cursor-pointer text-center ${
                          panoramaStart.startsWith('2026-10')
                            ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#0B1324] border-[#14213D] dark:border-[#FF8244] shadow-xs'
                            : 'bg-white dark:bg-[#14213D] text-slate-700 dark:text-[#E5E5E5] border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]'
                        }`}
                      >
                        Outubro / 2026
                      </button>
                    </div>
                  </div>

                  {/* OPÇÃO 2: ESCOLHA O DIA OU PERÍODO */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#14213D] dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <CalendarClock className="w-4 h-4 text-[#FF8244]" />
                        <span>Escolha o Dia ou Período:</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPanoramaPreset('custom');
                          if (panoramaStart.startsWith('2026-11')) {
                            setPanoramaStart('2026-11-01');
                            setPanoramaEnd('2026-11-14');
                          } else {
                            setPanoramaStart('2026-10-01');
                            setPanoramaEnd('2026-10-31');
                          }
                        }}
                        className="text-[11px] font-medium text-[#14213D] dark:text-[#FF8244] hover:underline cursor-pointer"
                      >
                        Mês Completo
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 whitespace-nowrap">De:</span>
                        <input
                          type="date"
                          value={panoramaStart}
                          min={panoramaStart.startsWith('2026-11') ? '2026-11-01' : '2026-10-01'}
                          max={panoramaStart.startsWith('2026-11') ? '2026-11-14' : '2026-10-31'}
                          onChange={(e) => {
                            setPanoramaPreset('custom');
                            setPanoramaStart(e.target.value);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#14213D] text-[#14213D] dark:text-white font-mono cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 whitespace-nowrap">Até:</span>
                        <input
                          type="date"
                          value={panoramaEnd}
                          min={panoramaStart.startsWith('2026-11') ? '2026-11-01' : '2026-10-01'}
                          max={panoramaStart.startsWith('2026-11') ? '2026-11-14' : '2026-10-31'}
                          onChange={(e) => {
                            setPanoramaPreset('custom');
                            setPanoramaEnd(e.target.value);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#14213D] text-[#14213D] dark:text-white font-mono cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTÕES DE CADA DIA DO MÊS ATIVO */}
                <div className="pt-3 border-t border-[#E5E5E5] dark:border-[#233354] space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-[#E5E5E5]/70">
                    <span>Clique em um dia de {panoramaStart.startsWith('2026-11') ? 'Novembro' : 'Outubro'}:</span>
                    <span className="font-mono text-slate-600 dark:text-[#E5E5E5]/80">
                      Período ativo: {panoramaStart.slice(8, 10)}/{panoramaStart.slice(5, 7)} a {panoramaEnd.slice(8, 10)}/{panoramaEnd.slice(5, 7)} ({(() => {
                        const count = panoramaData?.totalDias ?? Math.max(1, Math.round((new Date(panoramaEnd).getTime() - new Date(panoramaStart).getTime()) / 86400000) + 1);
                        return `${count} ${count === 1 ? 'dia' : 'dias'}`;
                      })()})
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {(panoramaStart.startsWith('2026-11')
                      ? Array.from({ length: 14 }, (_, i) => i + 1)
                      : Array.from({ length: 31 }, (_, i) => i + 1)
                    ).map((diaNum) => {
                      const monthPrefix = panoramaStart.startsWith('2026-11') ? '2026-11' : '2026-10';
                      const dStr = `${monthPrefix}-${String(diaNum).padStart(2, '0')}`;
                      const isSingle = panoramaStart === dStr && panoramaEnd === dStr;
                      const isInRange = dStr >= panoramaStart && dStr <= panoramaEnd;
                      return (
                        <button
                          key={diaNum}
                          type="button"
                          onClick={() => {
                            setPanoramaPreset('custom');
                            setPanoramaStart(dStr);
                            setPanoramaEnd(dStr);
                          }}
                          title={`Ver dados do dia ${diaNum}/${monthPrefix.slice(5)}/2026`}
                          className={`w-7 h-7 text-xs font-mono font-semibold rounded-md transition cursor-pointer flex items-center justify-center ${
                            isSingle
                              ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#0B1324] shadow-xs'
                              : isInRange
                              ? 'bg-[#FF8244]/25 text-[#14213D] dark:text-[#FF8244] border border-[#FF8244]/50 font-bold'
                              : 'bg-white dark:bg-[#14213D] text-slate-600 dark:text-[#E5E5E5]/70 border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]'
                          }`}
                        >
                          {diaNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* OS 4 GRANDES NÚMEROS DO PERÍODO SELECIONADO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/65">Média Municipal Acumulada</div>
                    <div className="font-mono text-3xl sm:text-4xl font-semibold text-[#14213D] dark:text-white mt-2 tabular-nums">
                      {panoramaData ? `${panoramaData.mediaMunicipal.toFixed(1)} mm` : '--'}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    Média ponderada da rede pluviométrica
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/65">Dias com Chuva no Período</div>
                    <div className="font-mono text-3xl sm:text-4xl font-semibold text-[#14213D] dark:text-white mt-2 tabular-nums">
                      {panoramaData ? `${panoramaData.diasComChuva} / ${panoramaData.totalDias}` : '--'}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {panoramaData
                      ? `${((panoramaData.diasComChuva / panoramaData.totalDias) * 100).toFixed(0)}% dos dias com precipitação`
                      : '--'}
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/65">Maior Estação do Período</div>
                    <div className="font-mono text-3xl sm:text-4xl font-semibold text-[#FF8244] mt-2 tabular-nums">
                      {panoramaData ? `${panoramaData.maiorEstacaoChuva.toFixed(1)} mm` : '--'}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 truncate" title={panoramaData?.maiorEstacaoNome}>
                    {panoramaData?.maiorEstacaoNome || '--'}
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/65">Rajada Máx & Térmica</div>
                    <div className="font-mono text-xl sm:text-2xl font-semibold text-[#14213D] dark:text-white mt-2 tabular-nums">
                      {panoramaData && panoramaData.maxGust > 0 ? `${panoramaData.maxGust} km/h` : 'Mod. a Fraco'}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {panoramaData && panoramaData.minTemp !== null
                      ? `${panoramaData.minTemp}°C a ${panoramaData.maxTemp}°C`
                      : 'Amplitude térmica normal'}
                  </div>
                </div>
              </div>

              {/* RANKING PLUVIOMÉTRICO DAS ESTAÇÕES NO PERÍODO */}
              {panoramaData && panoramaData.rankingEstacoes.length > 0 && (
                <div className="p-5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#14213D] dark:text-white">
                    <span>Ranking Pluviométrico por Estação ({panoramaData.labelPeriodo})</span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/70">6 estações monitoradas</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {panoramaData.rankingEstacoes.map((st, idx) => {
                      const maxRain = Math.max(0.1, panoramaData.maiorEstacaoChuva);
                      const pct = Math.min(100, Math.round((st.chuva_mm / maxRain) * 100));
                      return (
                        <div
                          key={st.code}
                          className="p-3 rounded-lg bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] flex flex-col justify-between gap-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-[#14213D] dark:text-white truncate">
                              <span className="font-bold text-[#FF8244] mr-1.5">{idx + 1}º</span>
                              {st.nome}
                            </span>
                            <span className="font-mono text-xs font-bold text-[#14213D] dark:text-[#FF8244] shrink-0">
                              {st.chuva_mm.toFixed(1)} mm
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#FF8244] h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {st.rajada_max_kmh > 0 && (
                            <div className="text-[10px] text-slate-500 dark:text-[#E5E5E5]/60 flex items-center justify-between">
                              <span>Rajada máxima:</span>
                              <span className="font-mono font-medium">{st.rajada_max_kmh.toFixed(1)} km/h</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* ================= SUB-ABA: VÍDEO REELS ================= */}
            {subSection === 'video' && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 flex flex-col items-center space-y-6">
                <div className="text-center max-w-lg">
                  <h2 className="font-display text-xl font-semibold text-[#14213D] dark:text-white">
                    Vídeo Reels Master (9:16) • {panoramaData?.labelPeriodo}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-1">
                    {panoramaData?.isOutubroFull
                      ? 'Renderização em alta definição com narração e dados consolidados oficiais de Outubro/2026.'
                      : `Simulador interativo em tempo real para Reels/Stories gerado com os dados de ${panoramaData?.labelPeriodo}.`}
                  </p>
                </div>

                {panoramaData?.isOutubroFull ? (
                  <div className="w-full max-w-[340px] rounded-2xl overflow-hidden border border-[#E5E5E5] dark:border-[#233354] bg-[#05080F] aspect-[9/16] shadow-xl">
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                      src={`${SITE_BASE}/img/panorama/video_reels_outubro_2026.mp4`}
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-[340px] rounded-2xl overflow-hidden border border-[#E5E5E5] dark:border-[#233354] bg-[#0B1324] aspect-[9/16] shadow-xl relative flex flex-col justify-between p-6 text-white select-none">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-[#FF8244]/20 text-[#FF8244] border border-[#FF8244]/40 font-mono text-[10px] font-bold uppercase tracking-wider">
                        RETROSPECTIVA
                      </span>
                      <span className="text-[11px] font-mono text-slate-300">@tempoemriodasostras</span>
                    </div>

                    {/* Dynamic Slide Content */}
                    <div className="space-y-4 my-auto">
                      <div>
                        <div className="text-xs font-mono text-[#FF8244] uppercase tracking-wider">PANORAMA DO CLIMA</div>
                        <h3 className="text-xl font-black text-white leading-tight mt-1">{panoramaData?.labelPeriodo}</h3>
                      </div>

                      <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
                        <div className="text-[10px] uppercase font-mono text-[#FF8244] font-bold tracking-wider">Volume Total Máximo</div>
                        <div className="text-3xl font-black text-white font-mono">{panoramaData?.maiorEstacaoChuva} mm</div>
                        <div className="text-xs font-medium text-slate-200">{panoramaData?.maiorEstacaoNome}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-[10px] text-slate-300">Média Municipal</div>
                          <div className="text-lg font-bold font-mono text-white mt-0.5">{panoramaData?.mediaMunicipal} mm</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-[10px] text-slate-300">Dias com Chuva</div>
                          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                            {panoramaData?.diasComChuva} / {panoramaData?.totalDias}
                          </div>
                        </div>
                      </div>

                      {panoramaData && panoramaData.maxGust > 0 && (
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-center">
                          <div className="text-[10px] text-slate-300">Rajada Máxima</div>
                          <div className="text-sm font-bold text-[#FF8244] font-mono">{panoramaData.gustInfo}</div>
                        </div>
                      )}
                    </div>

                    {/* Footer Controls */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs">
                        <button
                          onClick={() => setPanoramaVideoPlaying(!panoramaVideoPlaying)}
                          className="px-3 py-1 rounded-md bg-[#FF8244] text-[#000000] font-bold text-xs cursor-pointer hover:opacity-90"
                        >
                          {panoramaVideoPlaying ? 'Pausar Reels' : 'Reproduzir Reels (Auto)'}
                        </button>
                        <span className="text-[11px] font-mono text-slate-400">9:16 HD</span>
                      </div>
                    </div>
                  </div>
                )}

                {panoramaData?.isOutubroFull ? (
                  <a
                    href={`${SITE_BASE}/img/panorama/video_reels_outubro_2026.mp4`}
                    download="video_reels_outubro_2026.mp4"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] hover:opacity-90 transition-opacity"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    Baixar Vídeo Master (.MP4)
                  </a>
                ) : (
                  <button
                    onClick={handleCopyCaption}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    {copiedCaption ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedCaption ? 'Legenda e Dados Copiados!' : 'Copiar Dados do Período para Post'}
                  </button>
                )}
              </section>
            )}

            {/* ================= SUB-ABA: CARROSSEL FEED & STORIES ================= */}
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
                      className="p-2 rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] cursor-pointer transition-colors"
                      aria-label="Lâmina anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-medium text-slate-600 dark:text-[#E5E5E5]/80 px-2">
                      {panoramaSlideIdx + 1} / {PANORAMA_SLIDES.length}
                    </span>
                    <button
                      onClick={() => setPanoramaSlideIdx((i) => (i + 1) % PANORAMA_SLIDES.length)}
                      className="p-2 rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] cursor-pointer transition-colors"
                      aria-label="Próxima lâmina"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {panoramaData?.isOutubroFull ? (
                      <a
                        href={`${SITE_BASE}/img/panorama/${subSection === 'feed' ? 'feed' : 'stories'}/${PANORAMA_SLIDES[panoramaSlideIdx].file}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] hover:opacity-90 transition-opacity"
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        Baixar PNG HD
                      </a>
                    ) : (
                      <button
                        onClick={handleCopyCaption}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCaption ? 'Copiado!' : 'Copiar Texto da Lâmina'}
                      </button>
                    )}
                  </div>
                </div>

                {/* VISUALIZAÇÃO: Se for Outubro Completo mostra as imagens PNG gravadas; para qualquer outro período renderiza as Lâminas Dinâmicas */}
                {panoramaData?.isOutubroFull ? (
                  <img
                    src={`${SITE_BASE}/img/panorama/${subSection === 'feed' ? 'feed' : 'stories'}/${PANORAMA_SLIDES[panoramaSlideIdx].file}`}
                    alt={PANORAMA_SLIDES[panoramaSlideIdx].title}
                    referrerPolicy="no-referrer"
                    className="w-full max-h-[540px] object-contain rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#05080F]"
                  />
                ) : (
                  <div className="w-full flex justify-center">
                    <div
                      className={`w-full ${
                        subSection === 'feed' ? 'max-w-[480px] aspect-[4/5]' : 'max-w-[360px] aspect-[9/16]'
                      } rounded-2xl border border-[#E5E5E5] dark:border-[#233354] bg-[#0B1324] text-white p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative select-none`}
                    >
                      {/* Top Bar da Lâmina */}
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FF8244]/20 text-[#FF8244] border border-[#FF8244]/40 font-mono text-[10px] font-bold uppercase tracking-wider">
                          RETROSPECTIVA OFICIAL
                        </span>
                        <span className="text-[11px] font-mono text-slate-300">@tempoemriodasostras</span>
                      </div>

                      {/* Conteúdo Dinâmico por Índice de Lâmina */}
                      {panoramaSlideIdx === 0 && (
                        <div className="space-y-4 my-auto">
                          <div>
                            <div className="text-xs font-mono text-[#FF8244] uppercase tracking-wider font-bold">
                              PANORAMA DO CLIMA
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mt-1">
                              {panoramaData?.labelPeriodo}
                            </h3>
                            <p className="text-xs text-slate-300 mt-1">Os 3 Grandes Números do Período em Rio das Ostras</p>
                          </div>

                          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                            <div className="text-[10px] uppercase font-mono text-[#FF8244] font-bold tracking-wider">
                              Região Mais Chuvosa · Volume Máximo
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-white font-mono mt-1">
                              {panoramaData?.maiorEstacaoChuva} mm
                            </div>
                            <div className="text-xs font-semibold text-slate-200 mt-0.5">{panoramaData?.maiorEstacaoNome}</div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                              <div className="text-[10px] text-slate-300">Média Municipal</div>
                              <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                                {panoramaData?.mediaMunicipal} mm
                              </div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                              <div className="text-[10px] text-slate-300">Dias com Chuva</div>
                              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">
                                {panoramaData?.diasComChuva} / {panoramaData?.totalDias}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {panoramaSlideIdx === 1 && (
                        <div className="space-y-4 my-auto">
                          <div>
                            <div className="text-xs font-mono text-[#FF8244] uppercase tracking-wider font-bold">
                              VOLUME DE CHUVA NO PERÍODO
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mt-1">
                              {panoramaData?.mediaMunicipal} mm Acumulados
                            </h3>
                          </div>

                          <div className="p-4 rounded-xl bg-white/10 border border-white/15 space-y-2">
                            <div className="text-xs text-slate-300">Média ponderada municipal entre todas as estações</div>
                            <div className="text-sm text-white">
                              • <b>{panoramaData?.diasComChuva} dias com chuva</b> em {panoramaData?.totalDias} dias analisados (
                              {panoramaData ? ((panoramaData.diasComChuva / panoramaData.totalDias) * 100).toFixed(0) : 0}%).
                            </div>
                            <div className="text-sm text-white">
                              • Volume pico municipal: <b>{panoramaData?.maiorEstacaoChuva} mm</b> em {panoramaData?.maiorEstacaoNome}.
                            </div>
                            <div className="text-sm text-white">
                              • Taxa média diária: <b>{panoramaData ? (panoramaData.mediaMunicipal / panoramaData.totalDias).toFixed(1) : 0} mm/dia</b>.
                            </div>
                          </div>
                        </div>
                      )}

                      {panoramaSlideIdx === 2 && (
                        <div className="space-y-3 my-auto">
                          <div>
                            <div className="text-xs font-mono text-[#FF8244] uppercase tracking-wider font-bold">
                              RANKING POR ESTAÇÃO
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-white leading-tight mt-0.5">
                              Acumulado das Estações
                            </h3>
                          </div>

                          <div className="space-y-2">
                            {panoramaData?.rankingEstacoes.map((st, i) => {
                              const maxVal = Math.max(0.1, panoramaData?.maiorEstacaoChuva || 1);
                              const pct = Math.min(100, Math.round((st.chuva_mm / maxVal) * 100));
                              return (
                                <div key={st.code} className="p-2 rounded-lg bg-white/5 border border-white/10 space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-white truncate max-w-[200px]">
                                      <span className="text-[#FF8244] font-bold mr-1">{i + 1}º</span> {st.nome}
                                    </span>
                                    <span className="font-mono font-bold text-[#FF8244]">{st.chuva_mm.toFixed(1)} mm</span>
                                  </div>
                                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-[#FF8244] h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {panoramaSlideIdx === 3 && (
                        <div className="space-y-4 my-auto">
                          <div>
                            <div className="text-xs font-mono text-[#FF8244] uppercase tracking-wider font-bold">
                              VENTOS E EXTREMOS TÉRMICOS
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mt-1">
                              Comportamento da Atmosfera
                            </h3>
                          </div>

                          <div className="p-4 rounded-xl bg-white/10 border border-white/15 space-y-1">
                            <div className="text-[10px] text-slate-300 font-mono uppercase">Rajada Máxima Observada</div>
                            <div className="text-2xl sm:text-3xl font-black text-[#FF8244] font-mono">
                              {panoramaData && panoramaData.maxGust > 0 ? `${panoramaData.maxGust} km/h` : 'Ventos Normais'}
                            </div>
                            <div className="text-xs text-white">{panoramaData?.gustInfo || 'Sem ocorrência de ventania severa'}</div>
                          </div>

                          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                            <div className="text-[10px] text-slate-300 font-mono uppercase">Extremos de Temperatura</div>
                            <div className="text-xl sm:text-2xl font-black text-white font-mono">
                              {panoramaData && panoramaData.minTemp !== null
                                ? `${panoramaData.minTemp}°C a ${panoramaData.maxTemp}°C`
                                : '--'}
                            </div>
                            <div className="text-xs text-slate-300">Amplitude térmica registrada no período selecionado</div>
                          </div>
                        </div>
                      )}

                      {panoramaSlideIdx === 4 && (
                        <div className="space-y-4 my-auto">
                          <div>
                            <div className="text-xs font-mono text-[#FF8244] uppercase tracking-wider font-bold">
                              SISTEMAS METEOROLÓGICOS
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mt-1">
                              O Que Comandou o Tempo
                            </h3>
                          </div>

                          <div className="space-y-2">
                            {panoramaData && panoramaData.sistemas.length > 0 ? (
                              panoramaData.sistemas.map((sis, i) => (
                                <div key={i} className="p-3 rounded-lg bg-white/10 border border-white/15 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-[#FF8244]"></span>
                                  <span className="text-xs sm:text-sm font-semibold text-white">{sis}</span>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 rounded-lg bg-white/5 text-xs text-slate-300">
                                Sistemas de circulação marítima pós-frontal e instabilidades locais típicas da costa norte fluminense.
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {panoramaSlideIdx === 5 && (
                        <div className="space-y-4 my-auto text-center">
                          <div className="w-12 h-12 rounded-full bg-[#FF8244]/20 border border-[#FF8244]/40 flex items-center justify-center mx-auto text-[#FF8244]">
                            <Wind className="w-6 h-6" />
                          </div>

                          <div>
                            <div className="text-xs font-mono text-[#FF8244] uppercase tracking-wider font-bold">
                              ENCERRAMENTO OFICIAL
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mt-1">
                              TEMPO em Rio das Ostras
                            </h3>
                            <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                              Portal integrado de monitoramento meteorológico, alerta hidrológico e orla marítima.
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1 text-xs">
                            <div className="font-semibold text-white">Siga e Acompanhe:</div>
                            <div className="font-mono text-[#FF8244] text-sm">@tempoemriodasostras</div>
                            <div className="text-[11px] text-slate-400">tempoemriodasostras.com.br</div>
                          </div>
                        </div>
                      )}

                      {/* Bottom Bar da Lâmina */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[10px] text-slate-400 font-mono">
                        <span>Lâmina {panoramaSlideIdx + 1} de {PANORAMA_SLIDES.length}</span>
                        <span>Rede Pluviométrica de Rio das Ostras</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ================= SUB-ABA: LEGENDA FORMATADA ================= */}
            {subSection === 'legenda' && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[#14213D] dark:text-white">
                      Legenda Formatada para Feed & Reels
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-0.5">
                      Texto oficial formatado para o período selecionado ({panoramaData?.labelPeriodo}).
                    </p>
                  </div>
                  <button
                    onClick={handleCopyCaption}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCaption ? 'Legenda Copiada!' : 'Copiar Legenda'}
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
              <Wind className="w-3.5 h-3.5 text-[#FF8244]" />
              Fontes: INMET · CPTEC/INPE · Marinha (CHM) · INEA · CEMADEN · Open-Meteo
            </span>

          </div>
        </div>
      </footer>

      <PwaInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => setIsAppInstalled(true)}
      />
      <SocialExportModal openMeteo={openMeteo} acumulados={acumulados} boletimMeta={boletimMeta} />
    </div>
  );
}
