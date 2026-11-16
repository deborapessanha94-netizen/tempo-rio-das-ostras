import React, { useEffect } from 'react';
import {
  Camera,
  X,
  SunMedium,
  CloudRain,
  Wind,
  CalendarDays,
  Square,
  Smartphone,
  Layers,
  CheckCircle2,
  RefreshCw,
  Clock,
  Calendar,
  ChevronDown,
  Gauge,
  Trophy,
  Eye,
  Download,
} from 'lucide-react';
import type { OpenMeteoData, AcumuladosDataset, BoletimMetadata } from '../services/siteData';

interface SocialExportModalProps {
  openMeteo?: OpenMeteoData | null;
  acumulados?: AcumuladosDataset | null;
  boletimMeta?: BoletimMetadata | null;
}

export const SocialExportModal: React.FC<SocialExportModalProps> = ({
  openMeteo,
  acumulados,
  boletimMeta,
}) => {
  // Sync live state to window so canvas drawing always has the freshest values
  useEffect(() => {
    const win = window as any;
    if (!win.state) win.state = {};
    if (acumulados) {
      win.state.acumuladosDataset = acumulados;
      win.state.stationsData = acumulados.estacoes || [];
      if (win.socialState) {
        win.socialState.stationsData = acumulados.estacoes || [];
      }
    }
    if (openMeteo) {
      win.state.weatherData = openMeteo;
    }
    if (boletimMeta) {
      win.state.boletimMetadata = boletimMeta;
    }
    win.getLiveStationsForSocial = () => acumulados?.estacoes || [];
  }, [openMeteo, acumulados, boletimMeta]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const win = window as any;
        if (typeof win.closeSocialModalChuva === 'function') {
          win.closeSocialModalChuva();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      const win = window as any;
      if (typeof win.closeSocialModalChuva === 'function') {
        win.closeSocialModalChuva();
      }
    }
  };

  const curTemp = openMeteo?.current?.temperature_2m;
  const curSensacao = openMeteo?.current?.apparent_temperature ?? curTemp;
  const curHum = openMeteo?.current?.relative_humidity_2m;
  const curWind = openMeteo?.current?.wind_speed_10m;
  const curGust = openMeteo?.current?.wind_gusts_10m ?? curWind;
  const curPress = openMeteo?.current?.surface_pressure;

  return (
    <>
      {/* Hidden DOM bridge for real-time sensor text queried by canvas renderer */}
      <div id="social-telemetry-bridge" className="hidden" aria-hidden="true">
        <span id="sidebar-temp">{curTemp !== undefined ? `${Math.round(curTemp)}°C` : '23°C'}</span>
        <span id="hero-sensacao">{curSensacao !== undefined ? `Sensação em Tempo Real: ${Math.round(curSensacao)}°C` : '23°C'}</span>
        <span id="hero-sky-condition">Céu no Momento</span>
        <span id="hero-condition">{boletimMeta?.sinopse_geral || 'Tempo Estável em Rio das Ostras'}</span>
        <span id="hero-subcondition">{boletimMeta?.tendencia_proximos_dias || 'Monitoramento costeiro em tempo real'}</span>
        <span id="hero-chip-chuva-val">{acumulados ? `${(acumulados.resumo.media_chuva_24h || 0).toFixed(1)} mm` : '0.0 mm'}</span>
        <span id="hero-chip-chuva-sub">Estimativa rede municipal</span>
        <span id="sidebar-wind">{curWind !== undefined ? `${Math.round(curWind)} km/h` : '15 km/h'}</span>
        <span id="hero-chip-vento-sub">{curGust !== undefined ? `Rajada máx: ${Math.round(curGust)} km/h` : 'Rajadas na orla marítima'}</span>
        <span id="sidebar-hum">{curHum !== undefined ? `${Math.round(curHum)}%` : '65%'}</span>
        <span id="hero-chip-umid-sub">Umidade relativa do ar</span>
        <span id="sidebar-sea">0,9 a 1,2 m</span>
        <span id="hero-chip-mar-sub">Ondas na orla marítima</span>
        <span id="hero-chip-press-val">{curPress !== undefined ? `${Math.round(curPress)} hPa` : '1016 hPa'}</span>
        <span id="hero-chip-press-sub">Pressão ao nível do mar</span>
        <span id="hero-chip-uv-val">3 - Moderado</span>
        <span id="hero-chip-uv-sub">Índice Ultravioleta</span>
        <span id="hero-chip-sol-val">04:58 — 18:15</span>
        <span id="hero-chip-sol-sub">Luz solar diária</span>
        <span id="hero-chip-lua-val">Lua Crescente</span>
        <span id="hero-chip-lua-sub">Fase lunar atual</span>
      </div>

      {/* MODAL: EXPORTAR IMAGEM PARA INSTAGRAM (POST 4:5 & STORIES 9:16) */}
      <div
        id="modal-social-chuva"
        onClick={handleBackdropClick}
        className="fixed inset-0 z-50 hidden items-center justify-center p-2 sm:p-4 modal-backdrop bg-black/60 backdrop-blur-xs"
      >
        <div
          className="modern-card max-w-4xl w-full max-h-[96vh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden bg-white text-black border border-[#cbd5e1]"
          style={{ borderTop: '4px solid #f07a53' }}
        >
          {/* Cabeçalho do Modal */}
          <div className="px-4 py-3 bg-[#f8fafc] text-black flex items-center justify-between border-b border-[#cbd5e1] gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-black bg-[#ffebe4] border border-[#f07a53]/40 shadow-xs shrink-0">
                <Camera className="w-4 h-4 text-[#ea580c]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 id="social-modal-title" className="text-sm sm:text-base font-black text-black leading-tight truncate">
                    Exportar Card Oficial Diário
                  </h3>
                  <span className="text-[10px] font-mono font-black uppercase bg-[#ffebe4] text-[#ea580c] border border-[#f07a53] px-2 py-0.5 rounded-full shrink-0">
                    @tempoemriodasostras
                  </span>
                </div>
                <span id="social-modal-subtitle" className="text-[11px] text-black font-semibold hidden sm:inline">
                  Acumulados da rede municipal em tempo real para Post e Stories
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => (window as any).closeSocialModalChuva?.()}
              className="p-2 rounded-xl text-black hover:bg-[#e2e8f0] cursor-pointer transition shrink-0"
              title="Fechar modal"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>

          {/* Abas Superiores: Tempo Agora vs Chuva vs Ventos & Rajadas vs Panorama Semanal */}
          <div className="px-3 sm:px-4 py-2 bg-white border-b border-[#cbd5e1] flex items-center gap-1.5 sm:gap-2 shrink-0 overflow-x-auto">
            <button
              type="button"
              id="social-tab-btn-tempo"
              onClick={() => (window as any).setSocialTab?.('tempo')}
              className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition whitespace-nowrap"
            >
              <SunMedium className="w-4 h-4 text-[#ea580c]" />
              <span>Tempo Agora</span>
            </button>
            <button
              type="button"
              id="social-tab-btn-chuva"
              onClick={() => (window as any).setSocialTab?.('chuva')}
              className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#f8fafc] hover:bg-[#ffebe4] border border-[#cbd5e1] text-black cursor-pointer flex items-center justify-center gap-1.5 transition whitespace-nowrap"
            >
              <CloudRain className="w-4 h-4 text-[#ea580c]" />
              <span>Chuva</span>
            </button>
            <button
              type="button"
              id="social-tab-btn-vento"
              onClick={() => (window as any).setSocialTab?.('vento')}
              className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#f8fafc] hover:bg-[#e0f2fe] border border-[#cbd5e1] text-black cursor-pointer flex items-center justify-center gap-1.5 transition whitespace-nowrap"
            >
              <Wind className="w-4 h-4 text-[#0284c7]" />
              <span>Ventos & Rajadas</span>
            </button>
            <button
              type="button"
              id="social-tab-btn-semanal"
              onClick={() => (window as any).setSocialTab?.('semanal')}
              className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#f8fafc] hover:bg-[#e0f2fe] border border-[#cbd5e1] text-black cursor-pointer flex items-center justify-center gap-1.5 transition whitespace-nowrap"
            >
              <CalendarDays className="w-4 h-4 text-[#0284c7]" />
              <span>Panorama Semanal</span>
            </button>
          </div>

          {/* Barra de Controles e Filtros Rápidos */}
          <div className="p-3 sm:p-4 bg-[#f8fafc] border-b border-[#cbd5e1] space-y-2.5 text-xs shrink-0">
            {/* Linha 1: Formato, Tema e Filtro de Estações */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Formato: Post Feed vs Story */}
                <div className="flex items-center gap-1.5 p-1 bg-[#eaeff2] rounded-2xl border border-[#cbd5e1] shadow-xs" role="tablist">
                  <button
                    type="button"
                    id="social-btn-fmt-post"
                    onClick={() => (window as any).setSocialFormat?.('post')}
                    className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition"
                  >
                    <Square className="w-3.5 h-3.5 text-black" />
                    <span>Post Feed (4:5)</span>
                  </button>
                  <button
                    type="button"
                    id="social-btn-fmt-story"
                    onClick={() => (window as any).setSocialFormat?.('story')}
                    className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center justify-center gap-1.5 transition"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-black" />
                    <span>Stories (9:16)</span>
                  </button>
                </div>

                {/* Tema: Clara vs Escura */}
                <div className="flex items-center gap-1 bg-[#eaeff2] p-1 rounded-2xl border border-[#cbd5e1] shadow-xs">
                  <button
                    type="button"
                    id="social-theme-btn-nordic"
                    onClick={() => (window as any).setSocialCardTheme?.('nordic')}
                    className="px-3 py-1.5 rounded-xl text-xs font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center gap-1 transition"
                    title="Paleta Clara Oficial"
                  >
                    <span>Clara</span>
                  </button>
                  <button
                    type="button"
                    id="social-theme-btn-dark"
                    onClick={() => (window as any).setSocialCardTheme?.('dark')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center gap-1 transition"
                    title="Paleta Escura Noturna Oficial"
                  >
                    <span>Escura</span>
                  </button>
                </div>
              </div>

              {/* Filtro de Estações (Todas vs Apenas Ativas + Atualizar) */}
              <div id="social-filter-station-group" className="flex items-center justify-between sm:justify-end gap-1.5 w-full lg:w-auto">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    id="social-btn-filter-all"
                    onClick={() => (window as any).setSocialStationsFilter?.('all')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-[#ffebe4] border border-[#cbd5e1] cursor-pointer flex items-center gap-1 transition"
                    title="Exibe todas as estações"
                  >
                    <Layers className="w-3.5 h-3.5 text-black" />
                    <span id="social-filter-all-label">Todas</span>
                  </button>
                  <button
                    type="button"
                    id="social-btn-filter-active"
                    onClick={() => (window as any).setSocialStationsFilter?.('active')}
                    className="px-3 py-1.5 rounded-xl text-xs font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs cursor-pointer flex items-center gap-1 transition"
                    title="Exibe exclusivamente estações ativas com dados em tempo real"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#ea580c]" />
                    <span>Apenas Ativas</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => (window as any).refreshSocialStationsData?.()}
                  className="p-2 rounded-xl bg-white text-black hover:bg-[#eaeff2] border border-[#cbd5e1] cursor-pointer transition flex items-center justify-center shadow-xs"
                  title="Atualizar dados em tempo real"
                >
                  <RefreshCw id="social-refresh-icon" className="w-3.5 h-3.5 text-black" />
                </button>
              </div>
            </div>

            {/* Linha 2: Controles Específicos da Chuva */}
            <div id="social-controls-chuva" className="space-y-2.5">
              <div className="flex items-center justify-between gap-2.5 flex-wrap pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <label htmlFor="social-custom-hours-input" className="text-xs font-black text-black shrink-0 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#ea580c]" />
                    <span>Digite o horizonte:</span>
                  </label>
                  <div className="flex items-center gap-1.5 bg-white border-2 border-[#cbd5e1] focus-within:border-[#f07a53] px-3 py-1.5 rounded-xl shadow-xs transition">
                    <input
                      type="number"
                      id="social-custom-hours-input"
                      min="1"
                      max="96"
                      step="1"
                      defaultValue="24"
                      placeholder="24"
                      className="w-14 sm:w-16 bg-transparent text-sm font-black font-mono text-black outline-hidden text-center"
                      onInput={(e: any) => (window as any).handleSocialHoursInput?.(e.target.value)}
                      onChange={(e) => (window as any).handleSocialHoursInput?.(e.target.value)}
                      title="Digite qualquer quantidade de horas (ex: 3, 6, 12, 24, 48, 96...)"
                    />
                    <span className="text-xs font-black text-black/80">horas</span>
                  </div>
                  <button
                    type="button"
                    id="social-btn-toggle-hoje"
                    onClick={() => (window as any).toggleSocialHoje?.()}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#ffebe4] border border-[#cbd5e1] text-black cursor-pointer transition shadow-2xs flex items-center gap-1.5"
                    title="Calcular acumulado desde 00:00 de hoje"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#ea580c]" />
                    <span>Hoje (desde 00h)</span>
                  </button>
                </div>

                {/* Drawer Recolhível de Seleção de Estações */}
                <button
                  type="button"
                  onClick={() => (window as any).toggleSocialChipsDrawer?.()}
                  className="text-[11px] font-black text-[#ea580c] hover:text-[#c2410c] flex items-center gap-1 cursor-pointer py-1.5 px-3 rounded-xl bg-[#ffebe4]/70 hover:bg-[#ffebe4] border border-[#f07a53]/40 transition shrink-0 shadow-2xs"
                >
                  <span id="social-selected-count">{acumulados?.estacoes?.length || 8} de {acumulados?.estacoes?.length || 8} selecionadas</span>
                  <ChevronDown id="social-chips-chevron" className="w-3.5 h-3.5 text-[#ea580c] transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Linha 2: Controles Específicos do Vento & Rajadas */}
            <div id="social-controls-vento" className="space-y-2.5 hidden">
              <div className="flex items-center justify-between gap-2.5 flex-wrap pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-black shrink-0 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-[#0284c7]" />
                    <span>Métrica de Vento:</span>
                  </span>
                  <button
                    type="button"
                    id="social-wind-btn-hoje"
                    onClick={() => (window as any).setSocialWindMetric?.('hoje')}
                    className="px-3 py-1.5 rounded-xl text-xs font-black bg-[#e0f2fe] border-2 border-[#0284c7] text-black shadow-xs cursor-pointer flex items-center gap-1.5 transition"
                    title="Maiores rajadas e ventos registrados hoje desde 00h"
                  >
                    <Trophy className="w-3.5 h-3.5 text-[#0284c7]" />
                    <span>Hoje (Máximas do Dia)</span>
                  </button>
                  <button
                    type="button"
                    id="social-wind-btn-24h"
                    onClick={() => (window as any).setSocialWindMetric?.('24h')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#e0f2fe] border border-[#cbd5e1] text-black cursor-pointer transition shadow-2xs flex items-center gap-1.5"
                    title="Maiores rajadas nas últimas 24 horas"
                  >
                    <span>Últimas 24h</span>
                  </button>
                  <button
                    type="button"
                    id="social-wind-btn-agora"
                    onClick={() => (window as any).setSocialWindMetric?.('agora')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#e0f2fe] border border-[#cbd5e1] text-black cursor-pointer transition shadow-2xs flex items-center gap-1.5"
                    title="Velocidade e rajada instantânea agora"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Tempo Real (Agora)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Recolhível: Chips das Estações */}
            <div id="social-chips-drawer" className="hidden pt-2 border-t border-[#cbd5e1] max-h-32 overflow-y-auto">
              <div id="social-station-chips" className="flex items-center gap-1.5 flex-wrap">
                {/* Gerado dinamicamente via JS */}
              </div>
            </div>
          </div>

          {/* Pré-visualização do Card em Alta Resolução */}
          <div
            id="social-preview-container"
            className="flex-1 overflow-y-auto p-2 sm:p-4 bg-[#f4f6f8] flex flex-col items-center justify-center min-h-[220px] max-h-[50vh] sm:max-h-[56vh] border-y border-[#cbd5e1]"
          >
            <div className="relative max-w-full max-h-full my-auto flex items-center justify-center p-1.5 sm:p-2 bg-white rounded-2xl shadow-md border border-[#cbd5e1]">
              <img
                id="social-preview-image"
                src=""
                alt="Pré-visualização do Card Oficial para Instagram"
                className="max-h-[44vh] sm:max-h-[50vh] w-auto max-w-full rounded-xl shadow-md border border-[#cbd5e1] object-contain transition duration-150"
              />
            </div>
            <p className="text-[11px] font-black text-black mt-2 flex items-center gap-1.5 shrink-0">
              <Eye className="w-3.5 h-3.5 text-[#f07a53]" />
              <span>Resolução oficial 1080px • Sincronizado com a rede municipal</span>
            </p>
          </div>

          {/* Rodapé de Ações do Modal */}
          <div className="px-4 py-3 bg-[#f8fafc] border-t border-[#cbd5e1] flex items-center justify-between gap-3 text-xs flex-wrap shrink-0">
            <span className="text-black font-bold hidden sm:inline">
              Canal Oficial: <strong className="text-black font-black">@tempoemriodasostras</strong>
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => (window as any).closeSocialModalChuva?.()}
                className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition border border-slate-300 hover:bg-slate-200 text-black"
              >
                Fechar
              </button>
              <button
                type="button"
                id="social-download-main-btn"
                onClick={() => (window as any).downloadSocialCurrentFormat?.()}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs hover:bg-[#ffd9cb] active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm transition"
              >
                <Download className="w-4 h-4 text-black" />
                <span>Baixar Post Feed (1080x1350)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Oculto para Renderização em Alta Definição */}
      <canvas id="social-export-canvas" className="hidden"></canvas>
    </>
  );
};
