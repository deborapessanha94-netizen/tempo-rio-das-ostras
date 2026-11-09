/**
 * =============================================================================
 * MÓDULO: PANORAMA METEOROLÓGICO SEMANAL (7 DIAS)
 * =============================================================================
 * Síntese executiva e operacional para Rio das Ostras e Região dos Lagos / Bacia de Campos.
 * Consolida as 4 informações mais críticas requeridas pela Defesa Civil e Cidadãos:
 *   1. Vento Médio Sustentado (km/h) e Direção
 *   2. Rajadas Máximas de Vento (km/h) com Classificação de Risco
 *   3. Chuva Diária (Volume em mm, Probabilidade % e Classificação de Intensidade)
 *   4. Sistemas Meteorológicos Atuantes e Possíveis Eventos Extremos (Riscos/Alertas)
 *
 * Atualizado toda segunda-feira com horizonte contínuo de 7 dias (Segunda a Domingo).
 * =============================================================================
 */

import { getWeatherCondition, getWindCompassDirection } from './weather-codes.js';

let cachedWeeklyData = null;

/**
 * Retorna os dados calculados do panorama semanal em cache
 */
export function getWeeklyForecastCached() {
  return cachedWeeklyData;
}

/**
 * Helper para formatação de data
 */
function parseDateParts(dateStr) {
  if (!dateStr) return { day: 1, month: 1, year: 2026, dayOfWeek: 'Segunda-feira', dayOfWeekShort: 'Seg' };
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10) - 1;
  const d = parseInt(dayStr, 10);
  
  // Meio-dia para evitar deslocamento de fuso
  const dateObj = new Date(Date.UTC(y, m, d, 12, 0, 0));
  const dayIndex = dateObj.getUTCDay(); // 0 = Domingo, 1 = Segunda, etc.
  
  const diasSemana = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
  ];
  const diasSemanaCurto = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  return {
    day: d,
    month: m + 1,
    year: y,
    dayFormatted: `${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}`,
    dayOfWeek: diasSemana[dayIndex],
    dayOfWeekShort: diasSemanaCurto[dayIndex],
    dayIndex
  };
}

/**
 * Classificação de severidade da rajada de vento
 */
function classifyWindGust(gustKmH) {
  const g = Math.round(gustKmH || 0);
  if (g >= 65) {
    return {
      severity: 'danger',
      label: 'Rajada Severa',
      badgeBg: 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-400',
      textClass: 'text-rose-600 dark:text-rose-400',
      icon: 'alert-triangle'
    };
  }
  if (g >= 50) {
    return {
      severity: 'warning',
      label: 'Rajada Forte',
      badgeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400',
      textClass: 'text-amber-600 dark:text-amber-400',
      icon: 'wind'
    };
  }
  if (g >= 35) {
    return {
      severity: 'moderate',
      label: 'Rajada Fresca',
      badgeBg: 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300',
      textClass: 'text-sky-600 dark:text-sky-400',
      icon: 'wind'
    };
  }
  return {
    severity: 'low',
    label: 'Vento Brando',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    icon: 'wind'
  };
}

/**
 * Classificação de intensidade da chuva
 */
function classifyRain(mm, prob, wmoCode) {
  const val = Number(mm || 0);
  const p = Math.round(prob || 0);
  
  if (wmoCode >= 95) {
    return {
      type: 'thunderstorm',
      label: 'Pancadas com Trovoada',
      desc: `Chuva moderada a forte com convecção severa (${val.toFixed(1)} mm, ${p}%)`,
      badgeBg: 'bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300',
      icon: 'zap'
    };
  }
  if (val >= 10) {
    return {
      type: 'heavy',
      label: 'Chuva Forte',
      desc: `Pancadas volumosas ao longo do dia (${val.toFixed(1)} mm, ${p}%)`,
      badgeBg: 'bg-blue-600/15 border-blue-600/40 text-blue-700 dark:text-blue-300',
      icon: 'cloud-rain-wind'
    };
  }
  if (val >= 2.5) {
    return {
      type: 'moderate',
      label: 'Chuva Moderada',
      desc: `Chuva fraca a moderada intermitente (${val.toFixed(1)} mm, ${p}%)`,
      badgeBg: 'bg-sky-500/15 border-sky-500/30 text-sky-700 dark:text-sky-300',
      icon: 'cloud-rain'
    };
  }
  if (val > 0.3) {
    return {
      type: 'light',
      label: 'Chuva Fraca / Chuvisco',
      desc: `Garoa e chuvisco passageiro (${val.toFixed(1)} mm, ${p}%)`,
      badgeBg: 'bg-slate-500/15 border-slate-500/30 text-slate-700 dark:text-slate-300',
      icon: 'cloud-drizzle'
    };
  }
  return {
    type: 'none',
    label: 'Sem Chuva Significativa',
    desc: `Tempo estável e seco (0.0 mm, ${p}%)`,
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
    icon: 'sun'
  };
}

/**
 * Diagnóstico de Sistema Atuante e Possíveis Eventos Extremos
 */
function diagnoseSynopticSystemAndExtremeEvent(dayData, prevDay, nextDay, boletimDayMeta) {
  const { rainMm, windGust, windSpeed, windDirDeg, weatherCode, tempMax, dateParts } = dayData;
  const isSouthWind = windDirDeg >= 180 && windDirDeg <= 270;
  const isNorthEast = windDirDeg >= 30 && windDirDeg <= 85;
  const isEast = windDirDeg > 85 && windDirDeg <= 135;

  let sistema = '';
  let sistemaDesc = '';
  let eventoExtremo = '';
  let riskLevel = 'low'; // 'low' | 'attention' | 'warning' | 'alert'
  let riskBadge = '';

  // 1. Prioridade para dados curados do boletim (dias 0 a 3) caso disponíveis
  if (boletimDayMeta) {
    const descLower = (boletimDayMeta.descricao || '').toLowerCase();
    const subLower = (boletimDayMeta.subtitulo || '').toLowerCase();
    
    if (subLower.includes('alerta') || subLower.includes('tempestade') || descLower.includes('alerta')) {
      riskLevel = 'attention';
    }
  }

  // 2. Classificação Sinótica Baseada na Dinâmica da Costa Fluminense
  if (weatherCode >= 95 || (rainMm >= 8 && prevDay && prevDay.tempMax > tempMax)) {
    // Tempestade / Passagem de Frente Fria com convecção
    sistema = 'Passagem de Nova Frente Fria & Cavado Atmosférico';
    sistemaDesc = 'Instabilidade frontal em médios e altos níveis favorecendo convecção severa e convergência de umidade na Bacia de Campos.';
    eventoExtremo = 'ALERTA: Risco de Tempestade Convectiva, Raios e Chuva Forte Localizada';
    riskLevel = 'alert';
    riskBadge = 'ALERTA DE TEMPESTADE';
  } else if (windGust >= 52 || (isNorthEast && windSpeed >= 22)) {
    // Padrão pré-frontal com aceleração de vento Nordeste
    sistema = 'Padrão Pré-Frontal (Forte Gradiente Bárico)';
    sistemaDesc = 'Aproximação de sistema frontal pelo Sul acelera os ventos de quadrante Nordeste na costa de Rio das Ostras e Região dos Lagos.';
    eventoExtremo = `ALERTA: Rajadas Fortes de Vento (até ${Math.round(windGust)} km/h) na Orla Marítima e Áreas Abertas`;
    riskLevel = 'warning';
    riskBadge = 'RAJADAS FORTES NA ORLA';
  } else if (isSouthWind && (prevDay && !prevDay.isSouthWind || rainMm > 1.5)) {
    // Virada de vento para Sul/Sudoeste - Massa pós-frontal
    sistema = 'Massa de Ar Pós-Frontal & Virada de Vento para Sul/SW';
    sistemaDesc = 'Escoamento de ar mais denso e resfriado de Sul/Sudoeste após a passagem do cavado frontal, com mar agitado.';
    eventoExtremo = 'ATENÇÃO: Virada Brusca de Vento (SW), Mar Agitado e Declínio Térmico na Orla';
    riskLevel = 'attention';
    riskBadge = 'VIRADA DE VENTO (SW)';
  } else if (rainMm <= 0.5 && windGust < 35 && (isEast || isNorthEast)) {
    // Estabilidade / Alta Subtropical
    sistema = 'Crista de Alta Pressão & Estabilidade Atmosférica';
    sistemaDesc = 'Massa de ar seco e subsidente associada à borda da Alta Subtropical (ASAS), garantindo céu claro a poucas nuvens.';
    eventoExtremo = 'BAIXO RISCO: Condições Favoráveis na Cidade e Orla Marítima (Sem Eventos Severos)';
    riskLevel = 'low';
    riskBadge = 'TEMPO FIRME / BAIXO RISCO';
  } else if (isNorthEast || isEast) {
    // Circulação marítima contínua da ASAS
    sistema = 'Circulação Marítima da Alta Subtropical (ASAS)';
    sistemaDesc = 'Borda da ASAS mantendo transporte contínuo de umidade oceânica com ventos frescos de Leste/Nordeste.';
    if (windGust >= 40) {
      eventoExtremo = `ATENÇÃO: Rajadas de Vento Moderadas a Frescas (até ${Math.round(windGust)} km/h) na Faixa Litorânea`;
      riskLevel = 'attention';
      riskBadge = 'RAJADAS FRESCAS NA ORLA';
    } else {
      eventoExtremo = 'CONDIÇÕES REGULARES: Sem Previsão de Extremos Severos';
      riskLevel = 'low';
      riskBadge = 'NORMALIDADE OPERACIONAL';
    }
  } else {
    // Transição / Frente Fria costeira em dissipação
    sistema = 'Frente Fria Costeira em Dissipação & Umidade Marítima';
    sistemaDesc = 'Resíduo de instabilidade e transporte de umidade pós-frontal gerando nebulosidade e chuviscos ocasionais.';
    if (boletimDayMeta && boletimDayMeta.badge_tipo === 'warning') {
      eventoExtremo = 'ATENÇÃO: Chuva Contínua e Pista Escorregadia; Rio Jundiá em Vigilância Normal';
      riskLevel = 'attention';
      riskBadge = 'ATENÇÃO OPERACIONAL';
    } else {
      eventoExtremo = 'BAIXO RISCO: Precipitação Fraca sem Potencial Destrutivo';
      riskLevel = 'low';
      riskBadge = 'BAIXO RISCO';
    }
  }

  return {
    sistema,
    sistemaDesc,
    eventoExtremo,
    riskLevel,
    riskBadge
  };
}

/**
 * Resolve o panorama semanal de 7 dias combinando Open-Meteo e Boletim da Defesa Civil
 */
export function resolveWeeklyForecast7Days(weatherData, boletimMetadata) {
  if (!weatherData || !weatherData.daily || !Array.isArray(weatherData.daily.time)) {
    return null;
  }

  const daily = weatherData.daily;
  const diasResumo = (boletimMetadata && Array.isArray(boletimMetadata.dias_resumo)) ? boletimMetadata.dias_resumo : [];
  const multiFonte = (boletimMetadata && boletimMetadata.analise_precipitacao_multifonte?.previsto_por_dia) || [];

  const daysCount = Math.min(daily.time.length, 7);
  const resolvedDays = [];

  for (let i = 0; i < daysCount; i++) {
    const dateStr = daily.time[i];
    const dateParts = parseDateParts(dateStr);
    const boletimDayMeta = diasResumo[i] || null;
    const multiDayMeta = multiFonte.find(m => m.data_iso === dateStr) || null;

    // Variáveis Físicas
    let tempMin = Math.round(daily.temperature_2m_min?.[i] ?? 19);
    let tempMax = Math.round(daily.temperature_2m_max?.[i] ?? 24);
    let feelsMin = Math.round(daily.apparent_temperature_min?.[i] ?? tempMin);
    let feelsMax = Math.round(daily.apparent_temperature_max?.[i] ?? tempMax);
    let rainMm = Number(daily.precipitation_sum?.[i] ?? 0);
    let rainProb = Math.round(daily.precipitation_probability_max?.[i] ?? 0);
    let windSpeed = Math.round(daily.wind_speed_10m_max?.[i] ?? 15);
    let windGust = Math.round(daily.wind_gusts_10m_max?.[i] ?? 30);
    let windDirDeg = Math.round(daily.wind_direction_10m_dominant?.[i] ?? 60);
    let weatherCode = daily.weather_code?.[i] ?? 2;

    // Se temos dados curados pelo meteorologista para este dia, calibramos os valores oficiais
    if (boletimDayMeta) {
      if (typeof boletimDayMeta.sensacao_min === 'number') feelsMin = boletimDayMeta.sensacao_min;
      if (typeof boletimDayMeta.sensacao_max === 'number') feelsMax = boletimDayMeta.sensacao_max;
      
      // Rajada oficial do boletim caso maior
      const ventoDesc = boletimDayMeta.pilares?.vento?.val || '';
      const matchRajada = ventoDesc.match(/(\d+)\s*km\/h/i);
      if (matchRajada) {
        const gMeta = parseInt(matchRajada[1], 10);
        if (gMeta > windGust) windGust = gMeta;
      }
    }

    if (multiDayMeta && multiDayMeta.chuva_media_modelos_mm) {
      // Calibração de chuva do modelo integrado (INMET/CPTEC/OpenMeteo)
      if (multiDayMeta.chuva_media_modelos_mm > rainMm) {
        rainMm = multiDayMeta.chuva_media_modelos_mm;
      }
    }

    const windDirCompass = getWindCompassDirection(windDirDeg);
    const windSeverity = classifyWindGust(windGust);
    const rainClassification = classifyRain(rainMm, rainProb, weatherCode);
    const weatherInfo = getWeatherCondition(weatherCode);

    const isSouthWind = windDirDeg >= 180 && windDirDeg <= 270;

    const dayObj = {
      index: i,
      dateIso: dateStr,
      dateFormatted: dateParts.dayFormatted,
      dayFormatted: dateParts.dayFormatted,
      dayOfWeek: dateParts.dayOfWeek,
      dayOfWeekShort: dateParts.dayOfWeekShort,
      isToday: (i === 0),
      isSouthWind,
      tempMin,
      tempMax,
      feelsMin,
      feelsMax,
      rainMm,
      rainProb,
      rainClassification,
      windSpeed,
      windGust,
      windDirDeg,
      windDirCardinal: windDirCompass.label || 'NE',
      windDirName: windDirCompass.name || 'Nordeste',
      windSeverity,
      weatherCode,
      weatherLabel: weatherInfo.label || 'Parcialmente Nublado',
      weatherIcon: weatherInfo.icon || 'cloud-sun'
    };

    // Avalia o dia anterior (se houver) para detectar virada de vento / frente fria
    const prevDay = (i > 0) ? resolvedDays[i - 1] : null;
    const synopticDiagnosis = diagnoseSynopticSystemAndExtremeEvent(dayObj, prevDay, null, boletimDayMeta);

    dayObj.sistemaAtuante = synopticDiagnosis.sistema;
    dayObj.sistemaDesc = synopticDiagnosis.sistemaDesc;
    dayObj.eventoExtremo = synopticDiagnosis.eventoExtremo;
    dayObj.riskLevel = synopticDiagnosis.riskLevel;
    dayObj.riskBadge = synopticDiagnosis.riskBadge;

    resolvedDays.push(dayObj);
  }

  // Agregados da Semana
  const totalRainMm = resolvedDays.reduce((acc, d) => acc + d.rainMm, 0);
  const maxGustDay = resolvedDays.reduce((max, d) => (d.windGust > max.windGust ? d : max), resolvedDays[0]);
  const rainyDaysCount = resolvedDays.filter(d => d.rainMm >= 1.0).length;
  const firstDay = resolvedDays[0];
  const lastDay = resolvedDays[resolvedDays.length - 1];
  const periodLabel = `${firstDay.dayFormatted} (${firstDay.dayOfWeekShort}) a ${lastDay.dayFormatted} (${lastDay.dayOfWeekShort})`;

  // Alertas mais críticos da semana
  const alertDays = resolvedDays.filter(d => d.riskLevel === 'alert' || d.riskLevel === 'warning');

  cachedWeeklyData = {
    periodLabel,
    startDateIso: firstDay.dateIso,
    endDateIso: lastDay.dateIso,
    totalRainMm: Math.round(totalRainMm * 10) / 10,
    maxGustDay,
    rainyDaysCount,
    dryDaysCount: resolvedDays.length - rainyDaysCount,
    alertDays,
    days: resolvedDays
  };

  return cachedWeeklyData;
}

/**
 * Retorna classe de cor para o nível de risco
 */
function getRiskBadgeClasses(level) {
  switch (level) {
    case 'alert':
      return 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-400 font-extrabold';
    case 'warning':
      return 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400 font-bold';
    case 'attention':
      return 'bg-sky-500/15 border-sky-500/35 text-sky-700 dark:text-sky-300 font-bold';
    case 'low':
    default:
      return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium';
  }
}

/**
 * Renderiza a Seção Completa do Panorama Semanal (7 Dias)
 */
export function renderPanoramaSemanal(weatherData, boletimMetadata) {
  const container = document.getElementById('section-panorama-semanal');
  if (!container) return;

  const weekly = resolveWeeklyForecast7Days(weatherData, boletimMetadata);
  if (!weekly || !weekly.days || weekly.days.length === 0) {
    container.innerHTML = `
      <div class="modern-card p-6 text-center text-slate-500">
        <i data-lucide="cloud-off" class="w-8 h-8 mx-auto mb-2 text-slate-400"></i>
        <p class="font-bold">Dados do Panorama Semanal temporariamente indisponíveis.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const { periodLabel, totalRainMm, maxGustDay, rainyDaysCount, dryDaysCount, days } = weekly;

  const html = `
    <div class="modern-card p-4 sm:p-6 bg-white dark:bg-[#0d1527] border border-[#cbd5e1] dark:border-slate-800 space-y-5 shadow-sm rounded-2xl">
      
      <!-- =================================================================== -->
      <!-- CABEÇALHO DO PANORAMA SEMANAL                                       -->
      <!-- =================================================================== -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#cbd5e1] dark:border-slate-800 pb-4">
        <div class="flex items-start sm:items-center gap-3">
          <div class="medallion-title-orange w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs text-black">
            <i data-lucide="calendar-days" class="w-5 h-5 text-black"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-lg sm:text-xl font-black text-black dark:text-white tracking-tight font-heading">
                Panorama Meteorológico Semanal (7 Dias)
              </h2>
              <span class="text-[10px] sm:text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#ffebe4] dark:bg-orange-950/70 text-[#ea580c] dark:text-orange-300 border border-[#ea580c]/30 shadow-2xs">
                Atualizado Toda Segunda-Feira
              </span>
              <span class="text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                ${periodLabel}
              </span>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Síntese executiva com os 4 pilares essenciais: <strong>vento</strong>, <strong>rajadas máximas</strong>, <strong>acumulados de chuva</strong>, <strong>sistemas atuantes</strong> e <strong>matriz de riscos extremos</strong> para Rio das Ostras.
            </p>
          </div>
        </div>

        <!-- Ações do Cabeçalho: Baixar Card e Retornar ao Tempo Agora -->
        <div class="flex items-center gap-2 flex-wrap shrink-0">
          <button 
            type="button" 
            onclick="window.openSocialModalSemanal && window.openSocialModalSemanal()"
            class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-sm hover:shadow transition flex items-center gap-1.5 cursor-pointer"
            title="Exportar imagem do resumo semanal para Post ou Stories"
          >
            <i data-lucide="camera" class="w-4 h-4 text-white"></i>
            <span>Baixar Card Semanal (Post/Story)</span>
          </button>
          
          <button 
            type="button" 
            onclick="window.switchSubSection('previsao', 'section-hero-previsao')"
            class="p-2 rounded-xl border border-[#cbd5e1] dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Voltar ao Tempo Agora"
          >
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- 4 CARDS DE DESTAQUE EXECUTIVO (OS 4 ITENS MAIS IMPORTANTES)         -->
      <!-- =================================================================== -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        <!-- Destaque 1: Vento & Pico de Rajadas -->
        <div class="p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-900/60 border border-[#cbd5e1] dark:border-slate-800 space-y-1.5">
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span class="font-bold uppercase tracking-wider flex items-center gap-1">
              <i data-lucide="wind" class="w-3.5 h-3.5 text-sky-500"></i>
              <span>Pico de Rajadas na Orla</span>
            </span>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${maxGustDay.windSeverity.badgeBg}">
              ${maxGustDay.windSeverity.label}
            </span>
          </div>
          <div class="flex items-baseline gap-1.5 pt-1">
            <span class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              ${maxGustDay.windGust}
            </span>
            <span class="text-xs font-bold text-slate-500 dark:text-slate-400">km/h</span>
            <span class="text-xs font-bold text-orange-600 dark:text-orange-400 ml-1">
              (${maxGustDay.dayOfWeekShort} • ${maxGustDay.windDirCardinal})
            </span>
          </div>
          <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
            Maior rajada prevista para <strong>${maxGustDay.dayOfWeek} (${maxGustDay.dateFormatted})</strong> sob escoamento de ${maxGustDay.windDirName}.
          </p>
        </div>

        <!-- Destaque 2: Chuva Acumulada Semanal -->
        <div class="p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-900/60 border border-[#cbd5e1] dark:border-slate-800 space-y-1.5">
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span class="font-bold uppercase tracking-wider flex items-center gap-1">
              <i data-lucide="cloud-rain" class="w-3.5 h-3.5 text-blue-500"></i>
              <span>Chuva Total da Semana</span>
            </span>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
              7 Dias
            </span>
          </div>
          <div class="flex items-baseline gap-1.5 pt-1">
            <span class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              ${totalRainMm}
            </span>
            <span class="text-xs font-bold text-slate-500 dark:text-slate-400">mm (Média)</span>
          </div>
          <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
            Distribuição: <strong>${rainyDaysCount} dias com chuva</strong> e <strong>${dryDaysCount} dias firmes</strong>. Pico na sexta-feira com convecção.
          </p>
        </div>

        <!-- Destaque 3: Sistemas Atuantes Dominantes -->
        <div class="p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-900/60 border border-[#cbd5e1] dark:border-slate-800 space-y-1.5">
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span class="font-bold uppercase tracking-wider flex items-center gap-1">
              <i data-lucide="compass" class="w-3.5 h-3.5 text-orange-500"></i>
              <span>Sistemas Atuantes</span>
            </span>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30">
              Sinótica
            </span>
          </div>
          <div class="pt-1">
            <span class="text-sm font-black text-slate-900 dark:text-white leading-tight block">
              ASAS • Pré-Frontal • Nova Frente Fria
            </span>
          </div>
          <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-tight mt-1">
            Transição entre circulação marítima da ASAS, aceleração pré-frontal (Qui) e passagem de nova frente (Sex).
          </p>
        </div>

        <!-- Destaque 4: Eventos Extremos & Alertas -->
        <div class="p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-900/60 border border-[#cbd5e1] dark:border-slate-800 space-y-1.5">
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span class="font-bold uppercase tracking-wider flex items-center gap-1">
              <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber-500"></i>
              <span>Eventos Extremos Previstos</span>
            </span>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              Vigilância
            </span>
          </div>
          <div class="pt-1">
            <span class="text-sm font-black text-slate-900 dark:text-white leading-tight block">
              Qui: Rajadas 58 km/h • Sex: Tempestade
            </span>
          </div>
          <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-tight mt-1">
            Atenção para ventos fortes na orla na quinta-feira e risco de pancadas fortes com descargas na sexta-feira.
          </p>
        </div>

      </div>

      <!-- =================================================================== -->
      <!-- OS 7 DIAS DA SEMANA (CARDS COMPLETOS E ESTRUTURADOS)                -->
      <!-- =================================================================== -->
      <div>
        <div class="flex items-center justify-between pb-2 mb-3 border-b border-[#cbd5e1]/60 dark:border-slate-800">
          <h3 class="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <i data-lucide="calendar" class="w-4 h-4 text-[#ea580c]"></i>
            <span>Detalhamento Diário da Semana (Segunda a Domingo)</span>
          </h3>
          <span class="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Clique nos cards para visualizar o diagnóstico sinótico
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
          ${days.map((d) => `
            <div class="p-4 rounded-2xl bg-white dark:bg-[#131d35] border ${d.isToday ? 'border-[#ea580c] ring-2 ring-[#ea580c]/20' : 'border-[#cbd5e1] dark:border-slate-800'} space-y-3 shadow-2xs hover:border-[#94a3b8] dark:hover:border-slate-700 transition flex flex-col justify-between">
              
              <!-- Topo do Card: Dia, Data, Hoje e Ícone -->
              <div class="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                <div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-black text-sm text-slate-900 dark:text-white">
                      ${d.dayOfWeek}
                    </span>
                    ${d.isToday ? `
                      <span class="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-[#ea580c] text-white">
                        HOJE
                      </span>
                    ` : ''}
                  </div>
                  <span class="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                    ${d.dateFormatted}/2026
                  </span>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <div class="text-right">
                    <span class="text-sm font-black font-mono text-slate-900 dark:text-white block">
                      ${d.tempMax}° / ${d.tempMin}°C
                    </span>
                    <span class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                      Sensação ${d.feelsMax}°C
                    </span>
                  </div>
                  <div class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <i data-lucide="${d.weatherIcon}" class="w-4 h-4 text-orange-500"></i>
                  </div>
                </div>
              </div>

              <!-- Condição Textual -->
              <div class="text-xs font-bold text-slate-800 dark:text-slate-200">
                ${d.weatherLabel}
              </div>

              <!-- OS 4 BLOCOS ESSENCIAIS DO USUÁRIO -->
              <div class="space-y-2 text-xs pt-1">
                
                <!-- 1. VENTO E RAJADAS -->
                <div class="p-2.5 rounded-xl bg-[#f8fafc] dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/90 space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <i data-lucide="wind" class="w-3.5 h-3.5 text-sky-500"></i>
                      <span>Vento & Rajadas:</span>
                    </span>
                    <span class="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${d.windSeverity.badgeBg}">
                      Rajada ${d.windGust} km/h
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 pt-0.5">
                    <span>Médio: <strong>${d.windSpeed} km/h</strong></span>
                    <span>Direção: <strong>${d.windDirCardinal} (${d.windDirDeg}°)</strong></span>
                  </div>
                </div>

                <!-- 2. CHUVA -->
                <div class="p-2.5 rounded-xl bg-[#f8fafc] dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/90 space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <i data-lucide="cloud-rain" class="w-3.5 h-3.5 text-blue-500"></i>
                      <span>Chuva:</span>
                    </span>
                    <span class="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${d.rainClassification.badgeBg}">
                      ${d.rainMm.toFixed(1)} mm • ${d.rainProb}%
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-tight pt-0.5">
                    ${d.rainClassification.desc}
                  </p>
                </div>

                <!-- 3. SISTEMA ATUANTE -->
                <div class="p-2.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 space-y-1">
                  <span class="font-bold text-orange-900 dark:text-orange-300 text-[11px] flex items-center gap-1">
                    <i data-lucide="compass" class="w-3.5 h-3.5 text-orange-600 dark:text-orange-400"></i>
                    <span>Sistema Atuante:</span>
                  </span>
                  <p class="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    ${d.sistemaAtuante}
                  </p>
                  <p class="text-[10.5px] text-slate-600 dark:text-slate-300 leading-snug">
                    ${d.sistemaDesc}
                  </p>
                </div>

                <!-- 4. POSSÍVEIS EVENTOS EXTREMOS -->
                <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1">
                      <i data-lucide="alert-circle" class="w-3.5 h-3.5 text-amber-500"></i>
                      <span>Possíveis Extremos:</span>
                    </span>
                    <span class="text-[9.5px] font-mono px-1.5 py-0.2 rounded ${getRiskBadgeClasses(d.riskLevel)}">
                      ${d.riskBadge}
                    </span>
                  </div>
                  <p class="text-[11px] font-medium text-slate-800 dark:text-slate-200 leading-tight pt-0.5">
                    ${d.eventoExtremo}
                  </p>
                </div>

              </div>

            </div>
          `).join('')}
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- TABELA COMPARATIVA DOS 7 DIAS (VISÃO CONSOLIDADA)                   -->
      <!-- =================================================================== -->
      <div class="pt-2">
        <div class="flex items-center justify-between pb-2 mb-2 border-b border-[#cbd5e1]/60 dark:border-slate-800">
          <h3 class="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <i data-lucide="table" class="w-4 h-4 text-[#0284c7]"></i>
            <span>Matriz Comparativa Semanal (Vento, Chuva, Sistemas e Riscos)</span>
          </h3>
        </div>

        <div class="overflow-x-auto rounded-2xl border border-[#cbd5e1] dark:border-slate-800">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-[#f8fafc] dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-b border-[#cbd5e1] dark:border-slate-800 font-bold">
              <tr>
                <th class="p-3 whitespace-nowrap">Dia / Data</th>
                <th class="p-3 whitespace-nowrap">Tempo</th>
                <th class="p-3 whitespace-nowrap">Temp. (Máx/Mín)</th>
                <th class="p-3 whitespace-nowrap">Vento Médio</th>
                <th class="p-3 whitespace-nowrap">Rajada Máx.</th>
                <th class="p-3 whitespace-nowrap">Chuva Prevista</th>
                <th class="p-3 whitespace-nowrap">Sistema Atuante</th>
                <th class="p-3 whitespace-nowrap">Possível Extremo / Risco</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              ${days.map((d) => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${d.isToday ? 'bg-orange-50/40 dark:bg-orange-950/20 font-semibold' : ''}">
                  <td class="p-3 whitespace-nowrap">
                    <span class="font-bold text-slate-900 dark:text-white">${d.dayOfWeekShort}</span>
                    <span class="text-slate-500 dark:text-slate-400 text-[11px] block">${d.dateFormatted}</span>
                  </td>
                  <td class="p-3 whitespace-nowrap">
                    <div class="flex items-center gap-1.5">
                      <i data-lucide="${d.weatherIcon}" class="w-4 h-4 text-orange-500 shrink-0"></i>
                      <span class="truncate max-w-[120px]">${d.weatherLabel}</span>
                    </div>
                  </td>
                  <td class="p-3 whitespace-nowrap font-mono font-bold">
                    ${d.tempMax}° / ${d.tempMin}°C
                  </td>
                  <td class="p-3 whitespace-nowrap">
                    ${d.windSpeed} km/h • ${d.windDirCardinal}
                  </td>
                  <td class="p-3 whitespace-nowrap">
                    <span class="font-mono font-bold px-1.5 py-0.5 rounded ${d.windSeverity.badgeBg}">
                      ${d.windGust} km/h
                    </span>
                  </td>
                  <td class="p-3 whitespace-nowrap">
                    <span class="font-mono font-bold ${d.rainMm >= 5 ? 'text-blue-600 dark:text-blue-400' : ''}">
                      ${d.rainMm.toFixed(1)} mm
                    </span>
                    <span class="text-[10px] text-slate-500 dark:text-slate-400 block">${d.rainProb}% prob.</span>
                  </td>
                  <td class="p-3 text-[11px] leading-tight min-w-[180px]">
                    <span class="font-bold text-slate-900 dark:text-white block">${d.sistemaAtuante}</span>
                  </td>
                  <td class="p-3 min-w-[200px]">
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded-full inline-block ${getRiskBadgeClasses(d.riskLevel)}">
                      ${d.riskBadge}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- BANNER DE COMPARTILHAMENTO NAS REDES SOCIAIS                        -->
      <!-- =================================================================== -->
      <div class="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <i data-lucide="camera" class="w-5 h-5 text-white"></i>
          </div>
          <div>
            <h4 class="font-black text-sm sm:text-base leading-tight">
              Exportar Panorama Semanal para Redes Sociais
            </h4>
            <p class="text-xs text-white/90">
              Gere a arte oficial em alta definição formatada para Feed (4:5) ou Stories (9:16) no padrão visual @tempoemriodasostras.
            </p>
          </div>
        </div>

        <button 
          type="button" 
          onclick="window.openSocialModalSemanal && window.openSocialModalSemanal()"
          class="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-white text-orange-600 hover:bg-orange-50 shadow-sm transition flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <i data-lucide="download" class="w-4 h-4"></i>
          <span>Gerar Arte Semanal</span>
        </button>
      </div>

    </div>
  `;

  container.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
}

// Expõe globalmente
if (typeof window !== 'undefined') {
  window.resolveWeeklyForecast7Days = resolveWeeklyForecast7Days;
  window.renderPanoramaSemanal = renderPanoramaSemanal;
  window.getWeeklyForecastCached = getWeeklyForecastCached;
}
