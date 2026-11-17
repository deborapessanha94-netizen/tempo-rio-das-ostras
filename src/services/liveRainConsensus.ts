import type {
  AcumuladosDataset,
  BoletimMetadata,
  BoletimTurnoRow,
  InmetAviso,
  OpenMeteoData,
} from './siteData';

const SHIFTS = [
  { name: 'Madrugada', startH: 0, endH: 6 },
  { name: 'Manhã', startH: 6, endH: 12 },
  { name: 'Tarde', startH: 12, endH: 18 },
  { name: 'Noite', startH: 18, endH: 24 },
] as const;

export interface RainSourceDayBreakdown {
  open_meteo_mm?: number | null;
  open_meteo_prob_pct?: number | null;
  cptec_multimodel_mm?: number | null;
  cptec_multimodel_horas?: number | null;
  cptec_municipal_mm?: number | null;
  cptec_municipal_prob_pct?: number | null;
  cptec_municipal_valido_hoje?: boolean | null;
  inmet_resumo?: string | null;
  inmet_aviso_id?: string | number | null;
  inmet_aviso_cor?: string | null;
  inea_faixa_municipio_mm?: string | null;
  inea_faixa_bacia_mm?: string | null;
  inea_referencia_mm?: number | null;
  observado_hoje_media_mm?: number | null;
  observado_hoje_max_mm?: number | null;
}

export interface LiveConsensusInputs {
  boletimMeta: (BoletimMetadata & Record<string, any>) | null;
  boletimOficial: BoletimTurnoRow[] | null;
  openMeteo: OpenMeteoData | null;
  acumulados: AcumuladosDataset | null;
  inmetAvisosFile: InmetAviso[] | null;
  liveInmetForecast: Record<string, any> | null;
  liveInmetAvisosRaw: { hoje?: any[]; futuro?: any[] } | null;
  liveCptecHoje: Record<string, any> | null;
  liveCptecNext: Array<Record<string, any>> | null;
}

export interface LiveConsensusResult {
  boletimMeta: (BoletimMetadata & Record<string, any>) | null;
  boletimOficial: BoletimTurnoRow[] | null;
  inmetAvisos: InmetAviso[] | null;
}

function formatIsoToBr(isoStr?: string | null): string {
  if (!isoStr || isoStr.length < 10) return '';
  const [dPart, tPart] = isoStr.replace('T', ' ').split(' ');
  const parts = dPart.split('-');
  if (parts.length !== 3) return isoStr;
  const hhmm = tPart ? tPart.slice(0, 5) : '';
  return hhmm ? `${parts[2]}/${parts[1]}/${parts[0]} às ${hhmm}` : `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function classifyInmetLevel(desc?: string | null): number {
  if (!desc) return 0;
  const dl = desc.toLowerCase();
  if (dl.includes('trovoad') || dl.includes('tempestade') || dl.includes('chuva forte')) return 3;
  if (dl.includes('pancada')) return 2;
  if (dl.includes('chuva') || dl.includes('chuvisco') || dl.includes('garoa')) {
    return dl.includes('isolada') || dl.includes('possibilidade') ? 1 : 2;
  }
  return 0;
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function normalizeLiveInmetAlerts(raw: { hoje?: any[]; futuro?: any[] } | null): InmetAviso[] | null {
  if (!raw || (!Array.isArray(raw.hoje) && !Array.isArray(raw.futuro))) return null;
  const seen = new Set<string>();
  const list: InmetAviso[] = [];
  for (const cat of ['hoje', 'futuro'] as const) {
    for (const a of raw[cat] || []) {
      const aid = String(a?.id ?? '');
      if (!aid || seen.has(aid)) continue;
      const estados = String(a?.estados || '');
      const geocodes = String(a?.geocodes || '');
      const municipios = String(a?.municipios || '');
      const ehDireto = geocodes.includes('3304524') || municipios.includes('Rio das Ostras');
      const ehRj = estados.includes('Rio de Janeiro') || estados.includes('RJ');
      if (!ehDireto && !ehRj) continue;
      seen.add(aid);

      const sev = String(a?.severidade || 'Perigo Potencial');
      let corNome = 'Amarelo';
      let corHex = '#EAB308';
      if (sev.toLowerCase().includes('grande perigo')) {
        corNome = 'Vermelho';
        corHex = '#DC2626';
      } else if (sev.toLowerCase().includes('perigo') && !sev.toLowerCase().includes('potencial')) {
        corNome = 'Laranja';
        corHex = '#EA580C';
      }
      const rawDIni = String(a?.data_inicio || '').split('T')[0];
      const rawHIni = String(a?.hora_inicio || '00:00').trim();
      const rawDFim = String(a?.data_fim || '').split('T')[0];
      const rawHFim = String(a?.hora_fim || '23:59').trim();
      const ini = String(a?.inicio || (rawDIni ? `${rawDIni} ${rawHIni}` : ''));
      const fim = String(a?.fim || (rawDFim ? `${rawDFim} ${rawHFim}` : ''));
      const descTxt = String(a?.descricao || 'Alerta Meteorológico');
      const avisoItem: InmetAviso & Record<string, any> = {
        id: aid,
        tipo: descTxt,
        descricao: descTxt,
        severidade: sev,
        cor_nome: corNome,
        cor_badge: `Alerta ${corNome} • ${sev}`,
        cor_hex: corHex,
        eh_direto_ostras: ehDireto,
        inicio: ini,
        fim,
        data_inicio: a?.data_inicio || ini,
        hora_inicio: a?.hora_inicio || rawHIni,
        data_fim: a?.data_fim || fim,
        hora_fim: a?.hora_fim || rawHFim,
        inicio_formatado: formatIsoToBr(ini),
        fim_formatado: formatIsoToBr(fim),
        riscos: Array.isArray(a?.riscos) ? a.riscos : [],
        instrucoes: Array.isArray(a?.instrucoes) ? a.instrucoes : [],
        estados,
        municipios,
      };
      list.push(avisoItem);
    }
  }
  const rankColor = (c?: string) => (c === 'Vermelho' ? 0 : c === 'Laranja' ? 1 : 2);
  list.sort((a: any, b: any) => {
    if (Boolean(a.eh_direto_ostras) !== Boolean(b.eh_direto_ostras)) {
      return a.eh_direto_ostras ? -1 : 1;
    }
    return rankColor(a.cor_nome) - rankColor(b.cor_nome);
  });
  return list;
}

function extractAlertMaxRain(alert: any): { taxaMin: number; taxaMax: number; diaMax: number } {
  const txt = Array.isArray(alert?.riscos) ? alert.riscos.join(' ') : String(alert?.riscos || '');
  const mH = txt.match(/(\d+)\s*(?:e|a|-)\s*(\d+)\s*mm\/h/i);
  const mDia = txt.match(/(?:at[eé]|entre)?\s*(\d+)\s*(?:e|a|-)?\s*(\d+)?\s*mm\/dia/i);
  const taxaMin = mH ? parseInt(mH[1], 10) : 20;
  const taxaMax = mH ? parseInt(mH[2], 10) : 30;
  const diaMax = mDia ? parseInt(mDia[2] || mDia[1], 10) : 50;
  return { taxaMin, taxaMax, diaMax };
}

function computeObservedHoje(acumulados: AcumuladosDataset | null): { mediaMm: number; maxMm: number; ativas: number } {
  const list = acumulados?.estacoes || [];
  const vals: number[] = [];
  for (const st of list) {
    if (st.categoria === 'inea') continue;
    const ultima = String(st.ultima_leitura || '').toLowerCase();
    if (ultima.includes('offline') || ultima.includes('sem dados')) continue;
    if (typeof st.chuva_hoje === 'number' && Number.isFinite(st.chuva_hoje) && st.chuva_hoje >= 0 && st.chuva_hoje <= 300) {
      vals.push(st.chuva_hoje);
    }
  }
  if (vals.length === 0) return { mediaMm: 0, maxMm: 0, ativas: 0 };
  const sum = vals.reduce((acc, v) => acc + v, 0);
  return {
    mediaMm: round1(sum / vals.length),
    maxMm: round1(Math.max(...vals)),
    ativas: vals.length,
  };
}

function isoToBr(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function reconcileLiveRainConsensus(inputs: LiveConsensusInputs): LiveConsensusResult {
  const liveAlerts = normalizeLiveInmetAlerts(inputs.liveInmetAvisosRaw);
  const mergedAlerts = liveAlerts !== null ? liveAlerts : inputs.inmetAvisosFile;

  const meta = inputs.boletimMeta ? structuredClone(inputs.boletimMeta) : null;
  const oficial = inputs.boletimOficial ? inputs.boletimOficial.map((r) => ({ ...r })) : null;
  if (!meta) {
    return { boletimMeta: meta, boletimOficial: oficial, inmetAvisos: mergedAlerts };
  }

  const fontesRespondedoras: string[] = [];
  if (inputs.openMeteo?.hourly) fontesRespondedoras.push('Open-Meteo');
  if (inputs.liveInmetForecast && Object.keys(inputs.liveInmetForecast).length > 0) fontesRespondedoras.push('INMET Previsão');
  if (liveAlerts !== null) fontesRespondedoras.push('INMET Avisos');
  if (inputs.liveCptecHoje) fontesRespondedoras.push('CPTEC Municipal');
  if (inputs.liveCptecNext && inputs.liveCptecNext.length > 0) fontesRespondedoras.push('CPTEC 6 Dias');
  if (meta.inea_boletim_hidrometeorologico?.previsao_rh8?.hoje?.extraido_pdf) fontesRespondedoras.push('INEA RH-VIII (PDF)');
  if (inputs.acumulados?.estacoes?.length) fontesRespondedoras.push('Estações PWS/CEMADEN');

  const multi = meta.analise_precipitacao_multifonte;
  const previstoPorDia: any[] = Array.isArray(multi?.previsto_por_dia) ? multi.previsto_por_dia : [];
  if (previstoPorDia.length === 0 || !inputs.openMeteo?.hourly) {
    if (multi) {
      multi.fontes_ao_vivo_status = {
        atualizado_em_brt: new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        }).format(new Date()),
        recalculado_ao_vivo: false,
        fontes_respondedoras: fontesRespondedoras,
        alteracoes_detectadas: [],
      };
    }
    return { boletimMeta: meta, boletimOficial: oficial, inmetAvisos: mergedAlerts };
  }

  // Index Open-Meteo hourly precipitation & probability by (dateIso, shiftName)
  const omShiftPrec: Record<string, Record<string, number>> = {};
  const omShiftProb: Record<string, Record<string, number>> = {};
  const hourly = inputs.openMeteo.hourly;
  for (let i = 0; i < (hourly.time?.length || 0); i++) {
    const t = hourly.time[i];
    if (!t || !t.includes('T')) continue;
    const [dIso, hPart] = t.split('T');
    const h = parseInt(hPart.slice(0, 2), 10);
    const shift = SHIFTS.find((s) => h >= s.startH && h < s.endH)?.name || 'Madrugada';
    omShiftPrec[dIso] ??= { Madrugada: 0, Manhã: 0, Tarde: 0, Noite: 0 };
    omShiftProb[dIso] ??= { Madrugada: 0, Manhã: 0, Tarde: 0, Noite: 0 };
    omShiftPrec[dIso][shift] += Number(hourly.precipitation?.[i] ?? 0);
    omShiftProb[dIso][shift] = Math.max(omShiftProb[dIso][shift], Number(hourly.precipitation_probability?.[i] ?? 0));
  }

  const obsHoje = computeObservedHoje(inputs.acumulados);
  const ineaRh8 = meta.inea_boletim_hidrometeorologico?.previsao_rh8;
  const alteracoes: string[] = [];

  for (let dIdx = 0; dIdx < previstoPorDia.length; dIdx++) {
    const prevDia = previstoPorDia[dIdx];
    const dateIso: string = prevDia.data_iso;
    const dateBr: string = prevDia.data_br || isoToBr(dateIso);
    const prevFontes: RainSourceDayBreakdown = { ...(prevDia.fontes || {}) };

    // 1. Open-Meteo ao vivo
    const omDailyIdx = inputs.openMeteo.daily?.time?.indexOf(dateIso) ?? -1;
    const omTurnMap = omShiftPrec[dateIso];
    const omSum = omTurnMap
      ? Math.round((omTurnMap.Madrugada + omTurnMap.Manhã + omTurnMap.Tarde + omTurnMap.Noite) * 100) / 100
      : Number(
          omDailyIdx >= 0 ? inputs.openMeteo.daily?.precipitation_sum?.[omDailyIdx] ?? prevFontes.open_meteo_mm ?? 0 : prevFontes.open_meteo_mm ?? 0
        );
    const omProbDay =
      omDailyIdx >= 0
        ? Number(inputs.openMeteo.daily?.precipitation_probability_max?.[omDailyIdx] ?? prevFontes.open_meteo_prob_pct ?? 0)
        : Number(prevFontes.open_meteo_prob_pct ?? 0);

    // 2. CPTEC Multimodel (snapshot do backend)
    const mmSum = prevFontes.cptec_multimodel_mm ?? null;
    const mmHours = Number(prevFontes.cptec_multimodel_horas ?? 0);
    const hasMmDay = mmSum !== null && mmHours >= 12;

    // 3. CPTEC Municipal (ao vivo validado)
    let cptecProb: number | null = prevFontes.cptec_municipal_prob_pct ?? null;
    let cptecMunMm: number | null = prevFontes.cptec_municipal_mm ?? null;
    let cptecValidoHoje = Boolean(prevFontes.cptec_municipal_valido_hoje);
    if (dIdx === 0 && inputs.liveCptecHoje) {
      const horaAtual = String(inputs.liveCptecHoje.hora_atual || '');
      if (horaAtual.slice(0, 10) === dateIso) {
        cptecValidoHoje = true;
        const pLive = Number(inputs.liveCptecHoje.probabilidade_chuva);
        const mLive = Number(inputs.liveCptecHoje.precipitacao_acumulada);
        if (Number.isFinite(pLive)) cptecProb = pLive;
        if (Number.isFinite(mLive)) cptecMunMm = mLive;
      } else {
        cptecValidoHoje = false;
      }
    } else if (dIdx > 0 && inputs.liveCptecNext?.length) {
      const dayNum = dateIso.slice(8, 10);
      const item = inputs.liveCptecNext.find((it) => String(it?.data_atual || '').padStart(2, '0') === dayNum);
      if (item && item.probabilidade_chuva !== undefined) {
        const pLive = Number(item.probabilidade_chuva);
        if (Number.isFinite(pLive)) cptecProb = pLive;
      }
    }

    // 4. INMET Previsão (ao vivo se disponível, senão snapshot)
    const liveInmetDia = inputs.liveInmetForecast?.[dateBr];
    const inmetTurnDescs: Record<string, string> = {};
    const inmetTurnLevels: Record<string, number> = {};
    let inmetResumoStr: string | null = prevFontes.inmet_resumo ?? null;

    if (liveInmetDia && typeof liveInmetDia === 'object') {
      const hasTurns = 'manha' in liveInmetDia || 'tarde' in liveInmetDia || 'noite' in liveInmetDia;
      if (hasTurns) {
        const mapT: Record<string, any> = {
          Madrugada: liveInmetDia.manha,
          Manhã: liveInmetDia.manha,
          Tarde: liveInmetDia.tarde,
          Noite: liveInmetDia.noite,
        };
        const descs: string[] = [];
        for (const s of SHIFTS) {
          const r = String(mapT[s.name]?.resumo || '').trim();
          inmetTurnDescs[s.name] = r;
          inmetTurnLevels[s.name] = classifyInmetLevel(r);
          if (r && !descs.includes(r)) descs.push(r);
        }
        inmetResumoStr = descs.join(' / ') || inmetResumoStr;
      } else if (liveInmetDia.resumo) {
        const r = String(liveInmetDia.resumo).trim();
        const lvl = classifyInmetLevel(r);
        for (const s of SHIFTS) {
          inmetTurnDescs[s.name] = r;
          inmetTurnLevels[s.name] = s.name === 'Tarde' || s.name === 'Noite' || lvl <= 1 ? lvl : Math.max(1, lvl - 1);
        }
        inmetResumoStr = r;
      }
    } else if (inmetResumoStr) {
      const lvl = classifyInmetLevel(inmetResumoStr);
      for (const s of SHIFTS) {
        inmetTurnDescs[s.name] = inmetResumoStr;
        inmetTurnLevels[s.name] = s.name === 'Tarde' || s.name === 'Noite' || lvl <= 1 ? lvl : Math.max(1, lvl - 1);
      }
    }
    const inmetDayLevel = Math.max(0, ...Object.values(inmetTurnLevels));

    // 5. Alertas INMET diretos (ao vivo)
    const dayAlerts = (mergedAlerts || []).filter((a: any) => {
      if (!a?.eh_direto_ostras) return false;
      const ini = String(a.inicio || '').slice(0, 10);
      const fim = String(a.fim || '').slice(0, 10);
      if (ini && fim) return ini <= dateIso && dateIso <= fim;
      return ini === dateIso;
    });

    // 6. INEA Boletim RH-VIII (extração real do PDF do backend)
    const ineaPrev =
      ineaRh8?.hoje?.extraido_pdf && ineaRh8.hoje.data === dateBr
        ? ineaRh8.hoje
        : ineaRh8?.amanha?.extraido_pdf && ineaRh8.amanha.data === dateBr
          ? ineaRh8.amanha
          : null;

    // 7. Recalcula exatamente conforme rain_consensus.py
    let nwpBase = hasMmDay && mmSum !== null ? 0.55 * omSum + 0.45 * mmSum : omSum;
    if (cptecValidoHoje && cptecMunMm !== null && cptecMunMm > 0) {
      nwpBase = 0.75 * nwpBase + 0.25 * cptecMunMm;
    }
    const ineaBmax = ineaPrev?.chuva_max_mm ?? null;
    if (
      cptecProb !== null &&
      cptecProb <= 10 &&
      inmetDayLevel === 0 &&
      !(ineaPrev && ineaBmax !== null && ineaBmax > 1.0) &&
      dayAlerts.length === 0
    ) {
      nwpBase = Math.min(nwpBase, 1.0);
    }

    let consensusMm = nwpBase;
    if (ineaPrev && ineaPrev.chuva_min_mm !== null && ineaPrev.chuva_max_mm !== null) {
      const bmin = Number(ineaPrev.chuva_min_mm);
      const bmax = Number(ineaPrev.chuva_max_mm);
      const baciaMax = ineaPrev.chuva_bacia_max_mm !== undefined ? Number(ineaPrev.chuva_bacia_max_mm) : bmax;
      let ineaTarget: number;
      let wInea: number;
      if (bmin === 0 && bmax <= 1.0 && baciaMax >= 10.0) {
        ineaTarget = 0.75;
        wInea = 0.25;
      } else if (bmax <= 10.0) {
        ineaTarget = bmin + 0.25 * (bmax - bmin);
        wInea = 0.2;
      } else {
        ineaTarget = bmin + 0.35 * (bmax - bmin);
        wInea = 0.35;
      }
      consensusMm = (1 - wInea) * nwpBase + wInea * ineaTarget;
      if (bmin >= 10.0) {
        consensusMm = Math.max(consensusMm, 0.65 * bmin);
      }
    }

    if (inmetDayLevel >= 3) consensusMm = Math.max(consensusMm, 2.2);
    else if (inmetDayLevel === 2) consensusMm = Math.max(consensusMm, 1.5);
    else if (inmetDayLevel === 1) consensusMm = Math.max(consensusMm, 0.6);

    const ineaCondLow = String(ineaPrev?.condicao || '').toLowerCase();
    if ((ineaPrev?.tem_raios_icone || ineaCondLow.includes('raios')) && consensusMm < 2.0) {
      consensusMm = Math.max(consensusMm, 2.0);
    }

    if (dayAlerts.length > 0) {
      const sev = String((dayAlerts[0] as any).cor_nome || 'Amarelo');
      const floor = sev === 'Vermelho' ? 30.0 : sev === 'Laranja' ? 15.0 : 5.0;
      consensusMm = Math.max(consensusMm, floor);
    }

    if (dIdx === 0 && obsHoje.mediaMm > 0) {
      consensusMm = Math.max(consensusMm, obsHoje.mediaMm);
    }

    const newDayMm = round1(Math.max(0, consensusMm));
    const oldDayMm = round1(Number(prevDia.chuva_media_modelos_mm ?? 0));

    // Registra alterações significativas detectadas em tempo real
    if (Math.abs(newDayMm - oldDayMm) >= 0.2) {
      alteracoes.push(`${dateBr.slice(0, 5)}: ${oldDayMm.toFixed(1)} → ${newDayMm.toFixed(1)} mm`);
    }
    const oldAlertId = prevDia.alerta_inmet_id ?? null;
    const newAlertId = dayAlerts[0]?.id ?? null;
    if (String(newAlertId || '') !== String(oldAlertId || '') && newAlertId) {
      alteracoes.push(`Novo Aviso INMET nº ${newAlertId} (${dateBr.slice(0, 5)})`);
    }

    // Atualiza breakdown das fontes e totais do dia
    const activeAlert = dayAlerts[0] as any;
    const alertLimits = activeAlert ? extractAlertMaxRain(activeAlert) : null;
    const newPicoMax = alertLimits ? alertLimits.diaMax : round1(newDayMm * 1.5);
    const newFaixaOficial = activeAlert
      ? `${newDayMm.toFixed(1)} mm (Média) • Até ${newPicoMax.toFixed(0)} mm (Alerta INMET)`
      : `${newDayMm.toFixed(1)} mm`;

    prevDia.chuva_media_modelos_mm = newDayMm;
    prevDia.chuva_pico_convectivo_mm = newPicoMax;
    prevDia.faixa_oficial = newFaixaOficial;
    prevDia.tem_alerta_inmet = Boolean(activeAlert);
    prevDia.alerta_inmet_id = activeAlert ? activeAlert.id : null;
    prevDia.taxa_horaria_pico = alertLimits ? `${alertLimits.taxaMin} a ${alertLimits.taxaMax} mm/h` : newDayMm > 0 ? '< 5 mm/h' : '0 mm/h';
    prevDia.fontes = {
      ...prevFontes,
      open_meteo_mm: round1(omSum),
      open_meteo_prob_pct: Math.round(omProbDay),
      cptec_municipal_mm: cptecValidoHoje ? cptecMunMm : null,
      cptec_municipal_prob_pct: cptecProb !== null ? Math.round(cptecProb) : null,
      cptec_municipal_valido_hoje: dIdx === 0 ? cptecValidoHoje : null,
      inmet_resumo: inmetResumoStr,
      inmet_aviso_id: activeAlert ? activeAlert.id : null,
      inmet_aviso_cor: activeAlert ? activeAlert.cor_nome : null,
      observado_hoje_media_mm: dIdx === 0 ? obsHoje.mediaMm : null,
      observado_hoje_max_mm: dIdx === 0 ? obsHoje.maxMm : null,
    };

    // Atualiza Card diário correspondente em dias_resumo
    const card = meta.dias_resumo?.[dIdx];
    if (card?.pilares?.chuva) {
      card.pilares.chuva.val = activeAlert
        ? `${newDayMm.toFixed(1)} mm (Até ${newPicoMax.toFixed(0)} mm em tempestade)`
        : `${newDayMm.toFixed(1)} mm`;
    }

    // Rebalanceia os 4 turnos em boletimOficial para somarem exatamente newDayMm
    if (oficial) {
      const dayTurnRows = oficial.filter((r) => r.data_iso === dateIso);
      if (dayTurnRows.length > 0) {
        const omT = omShiftPrec[dateIso];
        const weights: Record<string, number> = {};
        for (const r of dayTurnRows) {
          const tName = r.turno || r.turno_label || '';
          const oldVal = Number(r.chuva_media ?? 0);
          const omVal = omT?.[tName] ?? 0;
          const inmLvl = inmetTurnLevels[tName] ?? 0;
          const convBoost = inmLvl >= 3 ? (tName === 'Tarde' || tName === 'Noite' ? 0.5 : 0.2) : inmLvl === 2 ? 0.25 : 0.05;
          const alertBoost = activeAlert && tName === 'Tarde' ? 0.8 : activeAlert && tName === 'Noite' ? 0.5 : 0;
          weights[tName] = Math.max(0.01, oldVal * 0.65 + omVal * 0.35 + convBoost + alertBoost);
        }
        const wSum = Object.values(weights).reduce((a, b) => a + b, 0);
        if (newDayMm <= 0) {
          for (const r of dayTurnRows) {
            r.chuva_media = 0.0;
            r.chuva_faixa_turno = '0.0 mm';
          }
        } else {
          let running = 0;
          let heaviestRow = dayTurnRows[0];
          let maxW = -1;
          for (const r of dayTurnRows) {
            const tName = r.turno || r.turno_label || '';
            const w = weights[tName] ?? 0.25;
            if (w > maxW) {
              maxW = w;
              heaviestRow = r;
            }
            const alloc = round1(newDayMm * (w / wSum));
            r.chuva_media = alloc;
            running += alloc;
          }
          const residual = round1(newDayMm - running);
          if (Math.abs(residual) > 0) {
            heaviestRow.chuva_media = round1(Math.max(0, Number(heaviestRow.chuva_media ?? 0) + residual));
          }
          for (const r of dayTurnRows) {
            if (activeAlert && (r.turno === 'Tarde' || r.turno === 'Noite')) {
              r.chuva_faixa_turno = `${Number(r.chuva_media ?? 0).toFixed(1)} mm (pico até ${alertLimits?.taxaMax ?? 30} mm/h)`;
              r.chuva_prob = Math.max(Number(r.chuva_prob ?? 0), r.turno === 'Tarde' ? 80 : 70);
            } else {
              r.chuva_faixa_turno = `${Number(r.chuva_media ?? 0).toFixed(1)} mm`;
            }
          }
        }
      }
    }
  }

  // Recalcula acumulados de 3d, 4d e 8d com 100% de coerência matemática
  const vals = previstoPorDia.map((d) => Number(d.chuva_media_modelos_mm ?? 0));
  const sum3d = round1(vals.slice(0, 3).reduce((a, b) => a + b, 0));
  const sum4d = round1(vals.slice(0, 4).reduce((a, b) => a + b, 0));
  const sum8d = round1(vals.reduce((a, b) => a + b, 0));

  multi.acumulado_3dias_media = sum3d;
  multi.acumulado_4dias_media = sum4d;
  multi.acumulado_semana_media = sum8d;
  multi.acumulado_8dias_media = sum8d;
  multi.dias_somados = vals;
  const formulaStr =
    previstoPorDia.map((d) => `${Number(d.chuva_media_modelos_mm ?? 0).toFixed(1)} mm (${String(d.dia_semana || '').slice(0, 3)})`).join(' + ') +
    ` = ${sum8d.toFixed(1)} mm`;
  multi.acumulado_semana_formula = formulaStr;
  multi.acumulado_8dias_formula = formulaStr;
  multi.observado_hoje_estacoes = {
    media_mm: obsHoje.mediaMm,
    max_mm: obsHoje.maxMm,
    estacoes_ativas: obsHoje.ativas,
  };
  multi.fontes_ao_vivo_status = {
    atualizado_em_brt: new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }).format(new Date()),
    recalculado_ao_vivo: alteracoes.length > 0,
    fontes_respondedoras: fontesRespondedoras,
    alteracoes_detectadas: alteracoes,
  };

  if (meta.kpis) {
    meta.kpis.chuva_3d = `${sum3d.toFixed(1)} mm`;
    meta.kpis.chuva_4d = `${sum4d.toFixed(1)} mm`;
    meta.kpis.chuva_8d = `${sum8d.toFixed(1)} mm`;
  }

  return { boletimMeta: meta, boletimOficial: oficial, inmetAvisos: mergedAlerts };
}
