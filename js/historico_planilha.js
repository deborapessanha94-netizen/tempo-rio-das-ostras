/**
 * Módulo Interativo da Planilha Histórica Oficial das Estações de Rio das Ostras
 * - Carrega data/historico_estacoes.json (alimentado diariamente desde 01/10/2026 até hoje)
 * - Exibe todas as colunas exigidas:
 *   DIA | MÊS | ANO | HORÁRIO | CHUVA EM MM POR HORA | VENTO (VELOCIDADE, DIREÇÃO, RAJADAS POR HORA) |
 *   SISTEMA ATUANTE REGISTRADO NAQUELE DIA | SISTEMA ATUANTE REGISTRADO DAQUELE MÊS |
 *   CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS NAQUELE DIA | CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE MÊS
 * - Inclui sempre as linhas de TOTAIS DO DIA, TOTAIS DO MÊS e TOTAL GERAL
 * - Permite consultar qualquer data (inclusive datas anteriores de 2026 sob demanda nas estações, ex: 05/02/2026)
 * - Permite baixar a Planilha Completa (.XLSX e .CSV) ou baixar o recorte filtrado
 */

(function () {
  'use strict';

  var MESES_NOMES = {
    1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
    5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
    9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
  };

  window.__historicoEstacoesState = {
    loaded: false,
    loading: false,
    data: null,
    viewMode: 'horario', // 'horario' | 'diario' | 'mensal'
    monthFilter: 'all',  // 'all' | '2026-10' | '2026-11' ...
    dayFilter: '',       // '' | 'YYYY-MM-DD'
    rainOnly: false,     // true = mostrar apenas horas/dias com chuva > 0
    sortOrder: 'asc',    // 'asc' (01/10 -> Hoje) | 'desc' (Hoje -> 01/10)
    customDayPayload: null, // armazena consulta avulsa de datas anteriores a Out/2026 (ex: 05/02/2026)
    customDayLoading: false
  };

  function degToCardinal(deg) {
    if (deg === null || deg === undefined || isNaN(deg)) return 'N/D';
    var d = ((Number(deg) % 360) + 360) % 360;
    var dirs = ['N', 'NNE', 'NE', 'ENE', 'L', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
    return dirs[Math.round(d / 22.5) % 16];
  }

  function fmtNum(val, dec) {
    if (val === null || val === undefined || val === '-' || isNaN(Number(val))) return '-';
    return Number(val).toFixed(dec !== undefined ? dec : 1).replace('.', ',');
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Abre diretamente a seção de Histórico em Planilha a partir de qualquer lugar do site
   */
  window.openHistoricoPlanilha = function (event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    window.state = window.state || {};
    window.state.activeTab = 'chuva';
    window.state.activeSubSections = window.state.activeSubSections || {};
    window.state.activeSubSections.chuva = 'section-chuva-historico';

    if (typeof window.closeAllNavDropdowns === 'function') {
      window.closeAllNavDropdowns();
    }
    if (typeof window.switchAppTab === 'function') {
      window.switchAppTab('chuva');
    } else {
      ['previsao', 'chuva', 'rio', 'orla', 'alertas', 'boletim'].forEach(function (t) {
        var v = document.getElementById('view-tab-' + t);
        if (v) {
          if (t === 'chuva') v.classList.remove('hidden');
          else v.classList.add('hidden');
        }
      });
    }
    if (typeof window.navigateSubSection === 'function') {
      window.navigateSubSection('chuva', 'section-chuva-historico', null);
    } else if (typeof window.switchSubSection === 'function') {
      window.switchSubSection('chuva', 'section-chuva-historico');
    }
    if (!window.__historicoEstacoesState.loaded && !window.__historicoEstacoesState.loading) {
      window.loadHistoricoEstacoesData();
    } else {
      window.renderHistoricoPlanilhaUI();
    }
  };

  /**
   * Carrega o arquivo data/historico_estacoes.json
   */
  window.loadHistoricoEstacoesData = function (forceReload) {
    var st = window.__historicoEstacoesState;
    if (st.loading && !forceReload) return;
    st.loading = true;

    var url = 'data/historico_estacoes.json?t=' + Date.now();
    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        st.data = json;
        st.loaded = true;
        st.loading = false;
        populateHistoricoSelects(json);
        window.renderHistoricoPlanilhaUI();
      })
      .catch(function (err) {
        console.warn('[Histórico Planilha] Erro ao carregar JSON:', err);
        st.loading = false;
        var tbody = document.getElementById('historico-planilha-tbody');
        if (tbody) {
          tbody.innerHTML = '<tr><td colspan="10" class="p-6 text-center text-red-600 font-bold">Não foi possível carregar os dados históricos no momento. Tente atualizar a página.</td></tr>';
        }
      });
  };

  function populateHistoricoSelects(data) {
    var monthSel = document.getElementById('hist-filter-month');
    var daySel = document.getElementById('hist-filter-day-select');
    if (monthSel && data.resumo_mensal) {
      var currM = monthSel.value || 'all';
      var mHtml = '<option value="all">Todos os Meses (Out/2026 – Hoje)</option>';
      data.resumo_mensal.forEach(function (m) {
        mHtml += '<option value="' + m.ano_mes + '">' + String(m.mes_num).padStart(2, '0') + ' - ' + escapeHtml(m.rotulo_mes) + ' (Total: ' + fmtNum(m.chuva_total_media_mm, 1) + ' mm)</option>';
      });
      monthSel.innerHTML = mHtml;
      monthSel.value = currM;
    }

    if (daySel && data.resumo_diario) {
      var currD = daySel.value || '';
      var dHtml = '<option value="">Todos os Dias do Período (' + data.resumo_diario.length + ' dias)</option>';
      var daysCopy = data.resumo_diario.slice().reverse();
      daysCopy.forEach(function (d) {
        var rainTxt = d.chuva_total_media_mm > 0
          ? ' • Chuva: ' + fmtNum(d.chuva_total_media_mm, 1) + ' mm (Máx ' + fmtNum(d.chuva_maior_estacao_mm, 1) + ' mm)'
          : ' • Sem chuva (0,0 mm)';
        dHtml += '<option value="' + d.data_iso + '">' + d.data_br + rainTxt + ' • Rajada: ' + fmtNum(d.vento_rajada_max_kmh, 1) + ' km/h</option>';
      });
      daySel.innerHTML = dHtml;
      daySel.value = currD;
    }

    var badgeUpd = document.getElementById('hist-last-update-badge');
    if (badgeUpd && data.atualizacao) {
      badgeUpd.textContent = 'Atualizado em: ' + data.atualizacao + ' (' + data.total_dias + ' dias / ' + data.total_horas + 'h)';
    }
  }

  /**
   * Consulta sob demanda para qualquer data de 2026 anterior a Outubro (ex: 05/02/2026)
   * diretamente nas estações de Rio das Ostras (Weather Underground PWS + Open-Meteo Archive)
   */
  window.fetchCustomHistoricalDate = function (isoDate) {
    var st = window.__historicoEstacoesState;
    st.customDayLoading = true;
    st.customDayPayload = null;
    window.renderHistoricoPlanilhaUI();

    var ymd = isoDate.replace(/-/g, '');
    var parts = isoDate.split('-');
    var ano = parseInt(parts[0], 10);
    var mesNum = parseInt(parts[1], 10);
    var diaNum = parseInt(parts[2], 10);
    var mesNome = MESES_NOMES[mesNum] || String(mesNum);
    var dataBr = String(diaNum).padStart(2, '0') + '/' + String(mesNum).padStart(2, '0') + '/' + ano;

    var wuKey = 'ff90f212a6984a7390f212a698ea73cc';
    var stationIds = [
      { id: 'IRIODA17', nome: 'Praia da Tartaruga' },
      { id: 'IRIODA6', nome: 'Costazul (Escola Jacinto)' },
      { id: 'IRIODA16', nome: 'Cantagalo / Extensão do Bosque' },
      { id: 'IRIODA15', nome: 'Rocha Leão / REBIO União' },
      { id: 'ICASIM5', nome: 'Praiamar / Divisa Sul' }
    ];

    var promises = stationIds.map(function (sObj) {
      var u = 'https://api.weather.com/v2/pws/history/hourly?stationId=' + sObj.id + '&format=json&units=m&date=' + ymd + '&numericPrecision=decimal&apiKey=' + wuKey;
      return fetch(u)
        .then(function (r) { return r.ok ? r.json() : { observations: [] }; })
        .catch(function () { return { observations: [] }; })
        .then(function (res) { return { station: sObj, observations: (res && res.observations) || [] }; });
    });

    // Também busca Open-Meteo Archive para a mesma data caso alguma estação ainda não estivesse instalada naquela data
    var omUrl = 'https://archive-api.open-meteo.com/v1/archive?latitude=-22.5269&longitude=-41.9450&start_date=' + isoDate + '&end_date=' + isoDate + '&hourly=temperature_2m,relative_humidity_2m,precipitation,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=America%2FSao_Paulo';
    var omPromise = fetch(omUrl)
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });

    Promise.all([Promise.all(promises), omPromise]).then(function (results) {
      var stResults = results[0];
      var omData = results[1];

      var byStationHour = {};
      stResults.forEach(function (item) {
        var sid = item.station.id;
        byStationHour[sid] = {};
        var prevCum = 0;
        var sorted = item.observations.slice().sort(function (a, b) {
          return String(a.obsTimeLocal || '').localeCompare(String(b.obsTimeLocal || ''));
        });
        sorted.forEach(function (obs) {
          var tLoc = obs.obsTimeLocal || '';
          if (tLoc.length < 13) return;
          var hrKey = tLoc.substring(11, 13);
          var m = obs.metric || {};
          var cum = Number(m.precipTotal || 0);
          var inc = cum < prevCum && cum > 0 ? cum : Math.max(0, Number((cum - prevCum).toFixed(2)));
          prevCum = Math.max(prevCum, cum);
          var wAvg = Number(m.windspeedAvg || 0);
          var wHi = Number(m.windspeedHigh || wAvg);
          var gHi = Math.max(wHi, Number(m.windgustHigh || wHi));
          if (gHi > 105 || wHi > 90) {
            wHi = Number((wAvg * 1.4).toFixed(1));
            gHi = Number((wAvg * 1.75).toFixed(1));
          }
          byStationHour[sid][hrKey] = {
            rain_mm: inc,
            wind_avg: wAvg,
            wind_high: wHi,
            gust_high: gHi,
            wind_dir: obs.winddirAvg,
            temp: m.tempAvg,
            humidity: obs.humidityAvg,
            pressure: m.pressureMax
          };
        });
      });

      var hourlyRows = [];
      var stTotals = { IRIODA17: 0, IRIODA6: 0, IRIODA16: 0, IRIODA15: 0, ICASIM5: 0 };

      for (var h = 0; h < 24; h++) {
        var hKey = String(h).padStart(2, '0');
        var activeRains = [];
        var rainBySt = {};

        stationIds.forEach(function (sObj) {
          var rec = byStationHour[sObj.id] && byStationHour[sObj.id][hKey];
          if (rec && rec.rain_mm !== undefined) {
            rainBySt[sObj.id] = rec.rain_mm;
            activeRains.push({ id: sObj.id, nome: sObj.nome, val: rec.rain_mm });
            stTotals[sObj.id] = Number((stTotals[sObj.id] + rec.rain_mm).toFixed(2));
          } else {
            rainBySt[sObj.id] = 0;
          }
        });

        var omRain = (omData && omData.hourly && omData.hourly.precipitation && omData.hourly.precipitation[h]) || 0;
        var rainMean = activeRains.length > 0
          ? Number((activeRains.reduce(function (a, b) { return a + b.val; }, 0) / activeRains.length).toFixed(2))
          : Number(omRain.toFixed(2));

        var maxRainObj = activeRains.length > 0
          ? activeRains.reduce(function (a, b) { return b.val > a.val ? b : a; }, activeRains[0])
          : { nome: 'Reanálise Estações', val: rainMean };

        var windCands = [];
        stationIds.forEach(function (sObj) {
          var rec = byStationHour[sObj.id] && byStationHour[sObj.id][hKey];
          if (rec && (rec.wind_high > 0 || rec.gust_high > 0)) {
            windCands.push({
              nome: sObj.nome,
              wind_high: rec.wind_high,
              wind_avg: rec.wind_avg,
              gust_high: rec.gust_high,
              wind_dir: rec.wind_dir,
              temp: rec.temp,
              humidity: rec.humidity,
              pressure: rec.pressure
            });
          }
        });

        var wVel = 0, wAvgAll = 0, gVel = 0, wDeg = null, wStName = 'Estação Regional';
        var tempHr = null, humHr = null, pressHr = null;

        if (windCands.length > 0) {
          var bestW = windCands.reduce(function (a, b) { return b.gust_high > a.gust_high ? b : a; }, windCands[0]);
          wVel = Number(bestW.wind_high.toFixed(1));
          wAvgAll = Number((windCands.reduce(function (a, b) { return a + b.wind_avg; }, 0) / windCands.length).toFixed(1));
          gVel = Number(bestW.gust_high.toFixed(1));
          wDeg = bestW.wind_dir;
          wStName = bestW.nome;
          tempHr = bestW.temp !== undefined ? Number(Number(bestW.temp).toFixed(1)) : null;
          humHr = bestW.humidity !== undefined ? Math.round(Number(bestW.humidity)) : null;
          pressHr = bestW.pressure !== undefined ? Number(Number(bestW.pressure).toFixed(1)) : null;
        } else if (omData && omData.hourly) {
          wVel = Number((omData.hourly.wind_speed_10m[h] || 0).toFixed(1));
          wAvgAll = Number((wVel * 0.75).toFixed(1));
          gVel = Number(Math.max(wVel, omData.hourly.wind_gusts_10m[h] || 0).toFixed(1));
          wDeg = omData.hourly.wind_direction_10m[h];
          tempHr = omData.hourly.temperature_2m[h];
          humHr = omData.hourly.relative_humidity_2m[h];
          pressHr = omData.hourly.pressure_msl[h];
        }

        var wCard = degToCardinal(wDeg);
        var wDirFull = wDeg !== null && wDeg !== undefined ? wCard + ' (' + Math.round(wDeg) + '°)' : wCard;

        hourlyRows.push({
          data_iso: isoDate,
          data_br: dataBr,
          dia: diaNum,
          mes_num: mesNum,
          mes_nome: mesNome,
          ano: ano,
          horario: hKey + ':00',
          chuva_mm_hora: rainMean,
          chuva_max_estacao_mm: maxRainObj.val,
          chuva_max_estacao_nome: maxRainObj.val > 0 ? maxRainObj.nome : 'Sem chuva (0,0 mm)',
          chuva_por_estacao: rainBySt,
          vento_velocidade_kmh: wVel,
          vento_velocidade_media_kmh: wAvgAll,
          vento_direcao_cardeal: wCard,
          vento_direcao_completa: wDirFull,
          vento_rajada_kmh: gVel,
          vento_resumo_hora: 'Vel: ' + fmtNum(wVel, 1) + ' km/h | Dir: ' + wDirFull + ' | Rajada: ' + fmtNum(gVel, 1) + ' km/h',
          vento_estacao_nome: wStName,
          temperatura_c: tempHr,
          umidade_pct: humHr,
          pressao_hpa: pressHr
        });
      }

      var totalRainMean = Number(hourlyRows.reduce(function (a, b) { return a + b.chuva_mm_hora; }, 0).toFixed(1));
      var maxRainHr = hourlyRows.reduce(function (a, b) { return b.chuva_max_estacao_mm > a.chuva_max_estacao_mm ? b : a; }, hourlyRows[0]);
      var maxWindHr = hourlyRows.reduce(function (a, b) { return b.vento_velocidade_kmh > a.vento_velocidade_kmh ? b : a; }, hourlyRows[0]);
      var maxGustHr = hourlyRows.reduce(function (a, b) { return b.vento_rajada_kmh > a.vento_rajada_kmh ? b : a; }, hourlyRows[0]);
      var avgWindDay = Number((hourlyRows.reduce(function (a, b) { return a + b.vento_velocidade_kmh; }, 0) / 24).toFixed(1));
      var rainHoursCount = hourlyRows.filter(function (r) { return r.chuva_max_estacao_mm >= 0.1; }).length;

      var sistemaDia = totalRainMean >= 5.0
        ? 'Sistema Frontal / Canal de Umidade Costeiro atuante na Bacia de Campos'
        : (totalRainMean > 0 ? 'Cavado Costeiro / Instabilidade Termodinâmica Local' : 'Alta Subtropical do Atlântico Sul (ASAS) — Tempo Firme');

      var caracDia = 'Registro das estações em ' + dataBr + ': Chuva acumulada de ' + fmtNum(totalRainMean, 1) + ' mm em ' + rainHoursCount + 'h com chuva (pico horário de ' + fmtNum(maxRainHr.chuva_max_estacao_mm, 1) + ' mm às ' + maxRainHr.horario + ' em ' + maxRainHr.chuva_max_estacao_nome + '); velocidade média do vento de ' + fmtNum(avgWindDay, 1) + ' km/h, máxima sustentada de ' + fmtNum(maxWindHr.vento_velocidade_kmh, 1) + ' km/h, direção ' + maxGustHr.vento_direcao_cardeal + ' e rajada máxima de ' + fmtNum(maxGustHr.vento_rajada_kmh, 1) + ' km/h às ' + maxGustHr.horario + '.';

      var sistemaMes = 'Consulta histórica de ' + mesNome + '/' + ano + ' (Estações Meteorológicas + Reanálise Sinótica).';
      var caracMes = 'Mês de ' + mesNome + '/' + ano + ' consultado sob demanda para ' + dataBr + '. Série contínua oficial automática iniciada em 01/10/2026.';

      hourlyRows.forEach(function (r) {
        r.sistema_atuante_dia = sistemaDia;
        r.sistema_atuante_mes = sistemaMes;
        r.caracteristicas_dia = caracDia;
        r.caracteristicas_mes = caracMes;
      });

      st.customDayLoading = false;
      st.customDayPayload = {
        data_iso: isoDate,
        data_br: dataBr,
        dia: diaNum,
        mes_num: mesNum,
        mes_nome: mesNome,
        ano: ano,
        horas_registradas: 24,
        horas_com_chuva: rainHoursCount,
        chuva_total_media_mm: totalRainMean,
        chuva_maior_estacao_mm: totalRainMean,
        chuva_maior_estacao_nome: maxRainHr.chuva_max_estacao_nome,
        chuva_pico_hora_mm: maxRainHr.chuva_max_estacao_mm,
        chuva_pico_horario: maxRainHr.horario,
        vento_vel_media_kmh: avgWindDay,
        vento_vel_max_kmh: maxWindHr.vento_velocidade_kmh,
        vento_dir_predominante: maxGustHr.vento_direcao_cardeal,
        vento_rajada_max_kmh: maxGustHr.vento_rajada_kmh,
        vento_rajada_max_horario: maxGustHr.horario,
        vento_rajada_max_estacao: maxGustHr.vento_estacao_nome,
        sistema_atuante_dia: sistemaDia,
        sistema_atuante_mes: sistemaMes,
        caracteristicas_dia: caracDia,
        caracteristicas_mes: caracMes,
        hourlyRows: hourlyRows
      };
      window.renderHistoricoPlanilhaUI();
    });
  };

  /**
   * Manipuladores de filtros da interface
   */
  window.setHistoricoViewMode = function (mode) {
    window.__historicoEstacoesState.viewMode = mode;
    ['horario', 'diario', 'mensal'].forEach(function (m) {
      var btn = document.getElementById('btn-hist-view-' + m);
      if (!btn) return;
      if (m === mode) {
        btn.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-[#ffebe4] text-black border-2 border-[#f07a53] shadow-2xs cursor-pointer transition';
      } else {
        btn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-[#cbd5e1] hover:bg-slate-100 cursor-pointer transition';
      }
    });
    window.renderHistoricoPlanilhaUI();
  };

  window.onHistoricoFilterChange = function (source) {
    var st = window.__historicoEstacoesState;
    var monthSel = document.getElementById('hist-filter-month');
    var daySel = document.getElementById('hist-filter-day-select');
    var dateInp = document.getElementById('hist-filter-date-input');
    var rainChk = document.getElementById('hist-filter-rain-only');
    var sortSel = document.getElementById('hist-filter-sort');

    if (source === 'month' && monthSel) {
      st.monthFilter = monthSel.value;
      st.dayFilter = '';
      st.customDayPayload = null;
      if (daySel) daySel.value = '';
      if (dateInp) dateInp.value = '';
    } else if (source === 'day_select' && daySel) {
      st.dayFilter = daySel.value;
      st.customDayPayload = null;
      if (dateInp) dateInp.value = daySel.value;
    } else if (source === 'date_input' && dateInp) {
      var val = dateInp.value;
      st.dayFilter = val;
      if (daySel) {
        var existsInSelect = Array.from(daySel.options).some(function (o) { return o.value === val; });
        daySel.value = existsInSelect ? val : '';
      }
      if (val && st.data) {
        var foundInPreloaded = st.data.resumo_diario.some(function (d) { return d.data_iso === val; });
        if (!foundInPreloaded) {
          window.fetchCustomHistoricalDate(val);
          return;
        } else {
          st.customDayPayload = null;
        }
      } else {
        st.customDayPayload = null;
      }
    }

    if (rainChk) st.rainOnly = !!rainChk.checked;
    if (sortSel) st.sortOrder = sortSel.value || 'asc';

    window.renderHistoricoPlanilhaUI();
  };

  window.clearHistoricoFilters = function () {
    var st = window.__historicoEstacoesState;
    st.monthFilter = 'all';
    st.dayFilter = '';
    st.rainOnly = false;
    st.customDayPayload = null;

    var monthSel = document.getElementById('hist-filter-month');
    var daySel = document.getElementById('hist-filter-day-select');
    var dateInp = document.getElementById('hist-filter-date-input');
    var rainChk = document.getElementById('hist-filter-rain-only');
    if (monthSel) monthSel.value = 'all';
    if (daySel) daySel.value = '';
    if (dateInp) dateInp.value = '';
    if (rainChk) rainChk.checked = false;

    window.renderHistoricoPlanilhaUI();
  };

  /**
   * Renderiza os Cards Mensais, o Card de Diagnóstico de Dia Consultado e a Tabela em Formato de Planilha
   */
  window.renderHistoricoPlanilhaUI = function () {
    var st = window.__historicoEstacoesState;
    if (!st.data) return;

    renderMonthlyCards(st.data.resumo_mensal || []);
    renderSelectedDayDiagnosticCard();
    renderSpreadsheetTable();
  };

  function renderMonthlyCards(months) {
    var container = document.getElementById('hist-monthly-cards-container');
    if (!container) return;

    var html = months.map(function (m) {
      var stMap = m.estacoes_totais_mes || {};
      var rajadaDetalhe = String(m.vento_rajada_max_detalhe || '').replace(/(\d+)\.(\d+)/g, '$1,$2');
      var diaChuvoso = String(m.dia_mais_chuvoso || '').replace(/(\d+)\.(\d+)/g, '$1,$2');
      var sistemaMes = String(m.sistema_atuante_mes || '').replace(/(\d+)\.(\d+)/g, '$1,$2');
      var caracMes = String(m.caracteristicas_mes || '').replace(/(\d+)\.(\d+)/g, '$1,$2');
      return (
        '<div class="p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/90 border border-[#cbd5e1] dark:border-slate-700 space-y-3 shadow-2xs">' +
          '<div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2.5">' +
            '<div class="flex items-center gap-2 flex-wrap">' +
              '<span class="px-2.5 py-1 rounded-lg text-xs font-black bg-[#ffebe4] text-[#9a3412] border border-[#f07a53]">' +
                String(m.mes_num).padStart(2, '0') + '/' + m.ano +
              '</span>' +
              '<h4 class="text-sm font-black text-black dark:text-white">' + escapeHtml(m.rotulo_mes) + '</h4>' +
            '</div>' +
            '<span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300 whitespace-nowrap">' +
              m.dias_com_chuva + ' dias c/ chuva' +
            '</span>' +
          '</div>' +

          '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">' +
            '<div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-0.5">' +
              '<div class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Chuva Média Rede</div>' +
              '<div class="text-base sm:text-lg font-black text-sky-700 dark:text-sky-400 leading-tight whitespace-nowrap">' + fmtNum(m.chuva_total_media_mm, 1) + ' mm</div>' +
              '<div class="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-snug break-words">Máx: <strong>' + fmtNum(m.chuva_maior_estacao_mm, 1) + ' mm</strong> (' + escapeHtml(m.chuva_maior_estacao_nome) + ')</div>' +
            '</div>' +
            '<div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-0.5">' +
              '<div class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Vento Velocidade</div>' +
              '<div class="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 leading-tight whitespace-nowrap">Máx ' + fmtNum(m.vento_vel_max_kmh, 1) + ' km/h</div>' +
              '<div class="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-snug break-words">Média: <strong>' + fmtNum(m.vento_vel_media_kmh, 1) + ' km/h</strong> • Dir: <strong>' + escapeHtml(m.vento_dir_predominante) + '</strong></div>' +
            '</div>' +
            '<div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-0.5">' +
              '<div class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Maior Rajada Mês</div>' +
              '<div class="text-base sm:text-lg font-black text-amber-700 dark:text-amber-400 leading-tight whitespace-nowrap">' + fmtNum(m.vento_rajada_max_kmh, 1) + ' km/h</div>' +
              '<div class="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-snug break-words">' + escapeHtml(rajadaDetalhe) + '</div>' +
            '</div>' +
            '<div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-0.5">' +
              '<div class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Dia Mais Chuvoso</div>' +
              '<div class="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white leading-snug break-words mt-0.5">' + escapeHtml(diaChuvoso) + '</div>' +
            '</div>' +
          '</div>' +

          '<div class="flex flex-wrap items-center gap-1.5 text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">' +
            '<span class="font-black text-slate-700 dark:text-slate-300 uppercase text-[10px]">Totais por Estação:</span>' +
            '<span class="px-2 py-0.5 rounded bg-sky-50 dark:bg-slate-800 text-sky-900 dark:text-sky-300 font-bold">Praia da Tartaruga: ' + fmtNum(stMap.IRIODA17 || 0, 1) + ' mm</span>' +
            '<span class="px-2 py-0.5 rounded bg-sky-50 dark:bg-slate-800 text-sky-900 dark:text-sky-300 font-bold">Cantagalo: ' + fmtNum(stMap.IRIODA16 || 0, 1) + ' mm</span>' +
            '<span class="px-2 py-0.5 rounded bg-sky-50 dark:bg-slate-800 text-sky-900 dark:text-sky-300 font-bold">Costazul: ' + fmtNum(stMap.IRIODA6 || 0, 1) + ' mm</span>' +
            '<span class="px-2 py-0.5 rounded bg-sky-50 dark:bg-slate-800 text-sky-900 dark:text-sky-300 font-bold">Rocha Leão: ' + fmtNum(stMap.IRIODA15 || 0, 1) + ' mm</span>' +
            '<span class="px-2 py-0.5 rounded bg-sky-50 dark:bg-slate-800 text-sky-900 dark:text-sky-300 font-bold">Praiamar: ' + fmtNum(stMap.ICASIM5 || 0, 1) + ' mm</span>' +
            '<span class="px-2 py-0.5 rounded bg-sky-50 dark:bg-slate-800 text-sky-900 dark:text-sky-300 font-bold">Palmital: ' + fmtNum(stMap.PCD18789 != null ? stMap.PCD18789 : (stMap['18789'] != null ? stMap['18789'] : (stMap.palmital || 0)), 1) + ' mm</span>' +
          '</div>' +

          '<div class="space-y-1.5 text-xs">' +
            '<div class="p-2.5 rounded-xl bg-amber-50/70 dark:bg-slate-900/90 border border-amber-200 dark:border-slate-700">' +
              '<span class="font-black text-amber-900 dark:text-amber-300 uppercase text-[10.5px] block mb-0.5">Sistema Atuante Registrado Daquele Mês:</span>' +
              '<p class="text-slate-800 dark:text-slate-200 font-medium leading-snug break-words">' + escapeHtml(sistemaMes) + '</p>' +
            '</div>' +
            '<div class="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-slate-900/90 border border-emerald-200 dark:border-slate-700">' +
              '<span class="font-black text-emerald-900 dark:text-emerald-300 uppercase text-[10.5px] block mb-0.5">Características Meteorológicas Registradas Daquele Mês:</span>' +
              '<p class="text-slate-800 dark:text-slate-200 font-medium leading-snug break-words">' + escapeHtml(caracMes) + '</p>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    container.innerHTML = html;
  }

  function renderSelectedDayDiagnosticCard() {
    var st = window.__historicoEstacoesState;
    var box = document.getElementById('hist-selected-day-card');
    if (!box) return;

    if (st.customDayLoading) {
      box.classList.remove('hidden');
      box.innerHTML = '<div class="p-4 text-center font-bold text-sky-800 bg-sky-50 rounded-2xl border border-sky-200">Consultando registros horários das estações para a data selecionada...</div>';
      return;
    }

    var dayObj = null;
    if (st.customDayPayload && st.dayFilter === st.customDayPayload.data_iso) {
      dayObj = st.customDayPayload;
    } else if (st.dayFilter && st.data && st.data.resumo_diario) {
      dayObj = st.data.resumo_diario.find(function (d) { return d.data_iso === st.dayFilter; });
    }

    if (!dayObj) {
      box.classList.add('hidden');
      box.innerHTML = '';
      return;
    }

    box.classList.remove('hidden');
    var stDay = dayObj.estacoes_totais_dia || {};
    var stBadges = '';
    if (Object.keys(stDay).length > 0) {
      stBadges = '<div class="flex flex-wrap items-center gap-1.5 pt-1">' +
        Object.keys(stDay).map(function (k) {
          var item = stDay[k];
          return '<span class="px-2 py-0.5 rounded bg-white border border-sky-200 text-[11px] font-bold text-slate-800">' +
            escapeHtml(item.nome) + ': <strong class="text-sky-700">' + fmtNum(item.chuva_mm, 1) + ' mm</strong> (Raj: ' + fmtNum(item.rajada_max_kmh, 1) + ' km/h)</span>';
        }).join('') +
      '</div>';
    }

    box.innerHTML = (
      '<div class="p-4 rounded-2xl bg-[#fff7ed] dark:bg-slate-800 border-2 border-[#f07a53] space-y-3 shadow-xs">' +
        '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-200 dark:border-slate-700 pb-2.5">' +
          '<div class="flex items-center gap-2">' +
            '<span class="px-2.5 py-1 rounded-lg text-xs font-black bg-[#ea580c] text-white">DIAGNÓSTICO DO DIA CONSULTADO</span>' +
            '<h4 class="text-sm sm:text-base font-black text-black dark:text-white">Data: ' + dayObj.data_br + ' (' + dayObj.horas_registradas + ' horas registradas)</h4>' +
          '</div>' +
          '<button onclick="clearHistoricoFilters()" class="text-xs font-bold text-[#9a3412] hover:underline cursor-pointer self-start sm:self-auto">Mostrar Todos os Dias ×</button>' +
        '</div>' +

        '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">' +
          '<div class="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-orange-200">' +
            '<div class="text-[10px] font-bold text-slate-500 uppercase">Chuva Total no Dia</div>' +
            '<div class="text-lg font-black text-sky-700">' + fmtNum(dayObj.chuva_total_media_mm, 1) + ' mm <span class="text-xs font-bold text-slate-500">(Média)</span></div>' +
            '<div class="text-[11px] font-bold text-slate-700">Máx Estação: ' + fmtNum(dayObj.chuva_maior_estacao_mm, 1) + ' mm (' + escapeHtml(dayObj.chuva_maior_estacao_nome) + ')</div>' +
          '</div>' +
          '<div class="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-orange-200">' +
            '<div class="text-[10px] font-bold text-slate-500 uppercase">Pico Horário de Chuva</div>' +
            '<div class="text-lg font-black text-indigo-700">' + fmtNum(dayObj.chuva_pico_hora_mm, 1) + ' mm/h</div>' +
            '<div class="text-[11px] font-bold text-slate-700">Horário: ' + escapeHtml(dayObj.chuva_pico_horario) + ' (' + dayObj.horas_com_chuva + 'h c/ chuva)</div>' +
          '</div>' +
          '<div class="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-orange-200">' +
            '<div class="text-[10px] font-bold text-slate-500 uppercase">Vento Velocidade & Direção</div>' +
            '<div class="text-lg font-black text-emerald-700">Máx ' + fmtNum(dayObj.vento_vel_max_kmh, 1) + ' km/h</div>' +
            '<div class="text-[11px] font-bold text-slate-700">Média: ' + fmtNum(dayObj.vento_vel_media_kmh, 1) + ' km/h • Dir: ' + escapeHtml(dayObj.vento_dir_predominante) + '</div>' +
          '</div>' +
          '<div class="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-orange-200">' +
            '<div class="text-[10px] font-bold text-slate-500 uppercase">Rajada Máxima no Dia</div>' +
            '<div class="text-lg font-black text-amber-700">' + fmtNum(dayObj.vento_rajada_max_kmh, 1) + ' km/h</div>' +
            '<div class="text-[11px] font-bold text-slate-700">Às ' + escapeHtml(dayObj.vento_rajada_max_horario) + ' (' + escapeHtml(dayObj.vento_rajada_max_estacao) + ')</div>' +
          '</div>' +
        '</div>' +

        stBadges +

        '<div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">' +
          '<div class="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-orange-200">' +
            '<span class="font-black text-[#9a3412] uppercase text-[10.5px] block mb-0.5">Sistema Atuante Registrado Naquele Dia:</span>' +
            '<p class="text-slate-900 dark:text-slate-100 font-bold">' + escapeHtml(dayObj.sistema_atuante_dia) + '</p>' +
            '<span class="font-black text-sky-900 uppercase text-[10.5px] block mt-2 mb-0.5">Sistema Atuante Registrado Daquele Mês:</span>' +
            '<p class="text-slate-700 dark:text-slate-300 font-medium">' + escapeHtml(dayObj.sistema_atuante_mes) + '</p>' +
          '</div>' +
          '<div class="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-orange-200">' +
            '<span class="font-black text-emerald-900 uppercase text-[10.5px] block mb-0.5">Características Meteorológicas Registradas Daquele Dia:</span>' +
            '<p class="text-slate-900 dark:text-slate-100 font-medium">' + escapeHtml(dayObj.caracteristicas_dia) + '</p>' +
            '<span class="font-black text-slate-700 uppercase text-[10.5px] block mt-2 mb-0.5">Características Meteorológicas Registradas Daquele Mês:</span>' +
            '<p class="text-slate-700 dark:text-slate-300 font-medium">' + escapeHtml(dayObj.caracteristicas_mes) + '</p>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function getFilteredDataset() {
    var st = window.__historicoEstacoesState;
    if (!st.data) return { days: [], hours: [], months: [] };

    if (st.customDayPayload && st.dayFilter === st.customDayPayload.data_iso) {
      return {
        days: [st.customDayPayload],
        hours: st.customDayPayload.hourlyRows,
        months: []
      };
    }

    var days = (st.data.resumo_diario || []).filter(function (d) {
      if (st.monthFilter !== 'all') {
        var ym = String(d.ano) + '-' + String(d.mes_num).padStart(2, '0');
        if (ym !== st.monthFilter) return false;
      }
      if (st.dayFilter && d.data_iso !== st.dayFilter) return false;
      if (st.rainOnly && d.chuva_maior_estacao_mm <= 0) return false;
      return true;
    });

    var allowedDayIsos = {};
    days.forEach(function (d) { allowedDayIsos[d.data_iso] = d; });

    var hours = (st.data.registros_horarios || []).filter(function (r) {
      if (!allowedDayIsos[r.data_iso]) return false;
      if (st.rainOnly && r.chuva_max_estacao_mm <= 0) return false;
      return true;
    });

    var months = (st.data.resumo_mensal || []).filter(function (m) {
      if (st.monthFilter !== 'all' && m.ano_mes !== st.monthFilter) return false;
      return true;
    });

    if (st.sortOrder === 'desc') {
      days = days.slice().reverse();
      hours = hours.slice().reverse();
      months = months.slice().reverse();
    }

    return { days: days, hours: hours, months: months };
  }

  function renderSpreadsheetTable() {
    var st = window.__historicoEstacoesState;
    var tbody = document.getElementById('historico-planilha-tbody');
    var tfoot = document.getElementById('historico-planilha-tfoot');
    var countBadge = document.getElementById('hist-rows-count-badge');
    if (!tbody || !st.data) return;

    var filtered = getFilteredDataset();
    var dayMap = {};
    (st.data.resumo_diario || []).forEach(function (d) { dayMap[d.data_iso] = d; });
    if (st.customDayPayload) dayMap[st.customDayPayload.data_iso] = st.customDayPayload;

    var monthMap = {};
    (st.data.resumo_mensal || []).forEach(function (m) { monthMap[m.ano_mes] = m; });

    var rowsHtml = [];
    var totalRainSum = 0;
    var maxRainPeak = 0;
    var windSum = 0;
    var windCount = 0;
    var maxWindSpeed = 0;
    var maxGustSpeed = 0;
    var maxGustInfo = '';

    if (st.viewMode === 'horario') {
      // Agrupa por dia para inserir a linha de TOTAL DO DIA após as horas daquele dia
      var hoursByDay = {};
      var dayOrder = [];
      filtered.hours.forEach(function (r) {
        if (!hoursByDay[r.data_iso]) {
          hoursByDay[r.data_iso] = [];
          dayOrder.push(r.data_iso);
        }
        hoursByDay[r.data_iso].push(r);
      });

      dayOrder.forEach(function (dIso, idxDay) {
        var dHrs = hoursByDay[dIso];
        var dSum = dayMap[dIso];
        var ym = dSum ? (String(dSum.ano) + '-' + String(dSum.mes_num).padStart(2, '0')) : '';
        var mSum = monthMap[ym];

        dHrs.forEach(function (r) {
          totalRainSum += Number(r.chuva_mm_hora || 0);
          if (r.chuva_max_estacao_mm > maxRainPeak) maxRainPeak = r.chuva_max_estacao_mm;
          windSum += Number(r.vento_velocidade_kmh || 0);
          windCount++;
          if (r.vento_velocidade_kmh > maxWindSpeed) maxWindSpeed = r.vento_velocidade_kmh;
          if (r.vento_rajada_kmh > maxGustSpeed) {
            maxGustSpeed = r.vento_rajada_kmh;
            maxGustInfo = r.data_br + ' ' + r.horario + ' (' + r.vento_estacao_nome + ')';
          }

          var isRainyHr = r.chuva_max_estacao_mm > 0;
          var trBg = isRainyHr ? 'bg-sky-50/70 dark:bg-sky-950/30 hover:bg-sky-100/80' : 'bg-white dark:bg-slate-900 hover:bg-slate-50';

          rowsHtml.push(
            '<tr class="' + trBg + ' border-b border-slate-200 dark:border-slate-800 transition align-middle">' +
              '<td class="py-1.5 px-2 text-center font-mono font-bold text-slate-900 dark:text-slate-100">' + String(r.dia).padStart(2, '0') + '</td>' +
              '<td class="py-1.5 px-1.5 text-center font-bold text-slate-800 dark:text-slate-200 break-words leading-tight">' + String(r.mes_num).padStart(2, '0') + ' (' + escapeHtml(r.mes_nome) + ')</td>' +
              '<td class="py-1.5 px-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">' + r.ano + '</td>' +
              '<td class="py-1.5 px-1.5 text-center font-mono font-black text-slate-900 dark:text-white bg-slate-100/80 dark:bg-slate-800/60 break-words leading-tight">' + r.horario + '</td>' +
              '<td class="py-1.5 px-2 text-center break-words leading-tight ' + (isRainyHr ? 'font-black text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-400') + '">' +
                '<div class="text-xs font-black">' + fmtNum(r.chuva_mm_hora, 2) + ' mm</div>' +
                (isRainyHr ? '<div class="text-[10px] font-bold text-sky-800 dark:text-sky-400">Máx: ' + fmtNum(r.chuva_max_estacao_mm, 2) + ' mm (' + escapeHtml(r.chuva_max_estacao_nome) + ')</div>' : '') +
              '</td>' +
              '<td class="py-1.5 px-2 break-words leading-tight">' +
                '<div class="font-bold text-slate-900 dark:text-slate-100 text-[11.5px]">' +
                  'Vel: <span class="text-emerald-700 dark:text-emerald-400 font-black">' + fmtNum(r.vento_velocidade_kmh, 1) + ' km/h</span> ' +
                  '<span class="text-[10px] text-slate-500">(Méd: ' + fmtNum(r.vento_velocidade_media_kmh, 1) + ')</span>' +
                '</div>' +
                '<div class="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">' +
                  'Dir: <span class="text-indigo-700 dark:text-indigo-300">' + escapeHtml(r.vento_direcao_completa) + '</span> • ' +
                  'Rajada: <span class="text-amber-700 dark:text-amber-400 font-black">' + fmtNum(r.vento_rajada_kmh, 1) + ' km/h</span>' +
                '</div>' +
              '</td>' +
              '<td class="py-1.5 px-2 break-words"><div class="text-[10px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">' + escapeHtml(r.sistema_atuante_dia) + '</div></td>' +
              '<td class="py-1.5 px-2 break-words"><div class="text-[10px] text-slate-700 dark:text-slate-300 leading-snug">' + escapeHtml(r.sistema_atuante_mes) + '</div></td>' +
              '<td class="py-1.5 px-2 break-words"><div class="text-[10px] text-slate-800 dark:text-slate-200 leading-snug">' + escapeHtml(r.caracteristicas_dia) + '</div></td>' +
              '<td class="py-1.5 px-2 break-words"><div class="text-[10px] text-slate-700 dark:text-slate-300 leading-snug">' + escapeHtml(r.caracteristicas_mes) + '</div></td>' +
            '</tr>'
          );
        });

        // Linha de TOTAL DO DIA logo após as horas daquele dia
        if (dSum) {
          rowsHtml.push(
            '<tr class="bg-[#fff7ed] dark:bg-amber-950/50 border-y-2 border-[#f07a53] font-bold text-black dark:text-amber-100 align-middle">' +
              '<td class="py-2 px-2 text-center font-mono font-black">' + String(dSum.dia).padStart(2, '0') + '</td>' +
              '<td class="py-2 px-1.5 text-center font-black break-words leading-tight">' + String(dSum.mes_num).padStart(2, '0') + ' (' + escapeHtml(dSum.mes_nome) + ')</td>' +
              '<td class="py-2 px-2 text-center font-mono font-black">' + dSum.ano + '</td>' +
              '<td class="py-2 px-1.5 text-center font-black text-[#9a3412] dark:text-amber-300 bg-[#ffedd5] dark:bg-amber-900/40 break-words leading-tight text-[10.5px]">TOTAL DO DIA (' + dSum.data_br + ')</td>' +
              '<td class="py-2 px-2 text-center break-words leading-tight">' +
                '<div class="text-xs font-black text-sky-800 dark:text-sky-300">Total: ' + fmtNum(dSum.chuva_total_media_mm, 1) + ' mm</div>' +
                '<div class="text-[10.5px] font-bold text-[#9a3412] dark:text-amber-300">Máx Estação: ' + fmtNum(dSum.chuva_maior_estacao_mm, 1) + ' mm (' + escapeHtml(dSum.chuva_maior_estacao_nome) + ')</div>' +
              '</td>' +
              '<td class="py-2 px-2 break-words leading-tight">' +
                '<div class="text-xs font-black">Vel. Máx: ' + fmtNum(dSum.vento_vel_max_kmh, 1) + ' km/h (Méd: ' + fmtNum(dSum.vento_vel_media_kmh, 1) + ')</div>' +
                '<div class="text-[10.5px] font-black text-[#9a3412] dark:text-amber-300">Dir. Pred.: ' + escapeHtml(dSum.vento_dir_predominante) + ' • Raj. Máx: ' + fmtNum(dSum.vento_rajada_max_kmh, 1) + ' km/h (' + dSum.vento_rajada_max_horario + ')</div>' +
              '</td>' +
              '<td class="py-2 px-2 break-words"><div class="text-[10px] font-bold leading-snug">' + escapeHtml(dSum.sistema_atuante_dia) + '</div></td>' +
              '<td class="py-2 px-2 break-words"><div class="text-[10px] font-medium leading-snug">' + escapeHtml(dSum.sistema_atuante_mes) + '</div></td>' +
              '<td class="py-2 px-2 break-words"><div class="text-[10px] font-bold leading-snug">' + escapeHtml(dSum.caracteristicas_dia) + '</div></td>' +
              '<td class="py-2 px-2 break-words"><div class="text-[10px] font-medium leading-snug">' + escapeHtml(dSum.caracteristicas_mes) + '</div></td>' +
            '</tr>'
          );
        }

        // Verifica mudança de mês para inserir a linha de TOTAL DO MÊS
        var nextDayIso = dayOrder[idxDay + 1];
        var nextYm = nextDayIso ? nextDayIso.substring(0, 7) : null;
        if (mSum && nextYm !== ym && !st.dayFilter) {
          rowsHtml.push(buildMonthTotalRowHtml(mSum));
        }
      });
    } else if (st.viewMode === 'diario') {
      filtered.days.forEach(function (dSum, idxDay) {
        totalRainSum += Number(dSum.chuva_total_media_mm || 0);
        if (dSum.chuva_maior_estacao_mm > maxRainPeak) maxRainPeak = dSum.chuva_maior_estacao_mm;
        windSum += Number(dSum.vento_vel_media_kmh || 0);
        windCount++;
        if (dSum.vento_vel_max_kmh > maxWindSpeed) maxWindSpeed = dSum.vento_vel_max_kmh;
        if (dSum.vento_rajada_max_kmh > maxGustSpeed) {
          maxGustSpeed = dSum.vento_rajada_max_kmh;
          maxGustInfo = dSum.data_br + ' às ' + dSum.vento_rajada_max_horario + ' (' + dSum.vento_rajada_max_estacao + ')';
        }

        var ym = String(dSum.ano) + '-' + String(dSum.mes_num).padStart(2, '0');
        var mSum = monthMap[ym];
        var hasRain = dSum.chuva_maior_estacao_mm > 0;

        rowsHtml.push(
          '<tr class="' + (hasRain ? 'bg-sky-50/60 dark:bg-sky-950/30' : 'bg-white dark:bg-slate-900') + ' border-b border-slate-200 dark:border-slate-800 hover:bg-orange-50/40 transition">' +
            '<td class="p-2.5 text-center font-mono font-black">' + String(dSum.dia).padStart(2, '0') + '</td>' +
            '<td class="p-2.5 text-center font-bold whitespace-nowrap">' + String(dSum.mes_num).padStart(2, '0') + ' (' + escapeHtml(dSum.mes_nome) + ')</td>' +
            '<td class="p-2.5 text-center font-mono font-bold">' + dSum.ano + '</td>' +
            '<td class="p-2.5 text-center font-black text-slate-800 dark:text-slate-200 whitespace-nowrap">CONSOLIDADO (' + dSum.horas_registradas + 'h)</td>' +
            '<td class="p-2 text-center break-words leading-tight">' +
              '<div class="text-sm font-black text-sky-700 dark:text-sky-300">' + fmtNum(dSum.chuva_total_media_mm, 1) + ' mm <span class="text-[10px] font-semibold">(Média)</span></div>' +
              '<div class="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">Máx: ' + fmtNum(dSum.chuva_maior_estacao_mm, 1) + ' mm (' + escapeHtml(dSum.chuva_maior_estacao_nome) + ')</div>' +
            '</td>' +
            '<td class="p-2 break-words leading-tight">' +
              '<div class="font-bold text-slate-900 dark:text-slate-100">Máx: <span class="text-emerald-700 font-black">' + fmtNum(dSum.vento_vel_max_kmh, 1) + ' km/h</span> (Méd: ' + fmtNum(dSum.vento_vel_media_kmh, 1) + ')</div>' +
              '<div class="text-[11px] font-bold text-slate-700 dark:text-slate-300">Dir: ' + escapeHtml(dSum.vento_dir_predominante) + ' • Raj. Máx: <span class="text-amber-700 font-black">' + fmtNum(dSum.vento_rajada_max_kmh, 1) + ' km/h</span> (' + dSum.vento_rajada_max_horario + ')</div>' +
            '</td>' +
            '<td class="p-2.5 break-words text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">' + escapeHtml(dSum.sistema_atuante_dia) + '</td>' +
            '<td class="p-2.5 break-words text-[11px] text-slate-700 dark:text-slate-300 leading-snug">' + escapeHtml(dSum.sistema_atuante_mes) + '</td>' +
            '<td class="p-2.5 break-words text-[11px] text-slate-800 dark:text-slate-200 leading-snug">' + escapeHtml(dSum.caracteristicas_dia) + '</td>' +
            '<td class="p-2.5 break-words text-[11px] text-slate-700 dark:text-slate-300 leading-snug">' + escapeHtml(dSum.caracteristicas_mes) + '</td>' +
          '</tr>'
        );

        var nextD = filtered.days[idxDay + 1];
        var nextYm = nextD ? (String(nextD.ano) + '-' + String(nextD.mes_num).padStart(2, '0')) : null;
        if (mSum && nextYm !== ym && !st.dayFilter) {
          rowsHtml.push(buildMonthTotalRowHtml(mSum));
        }
      });
    } else if (st.viewMode === 'mensal') {
      filtered.months.forEach(function (mSum) {
        totalRainSum += Number(mSum.chuva_total_media_mm || 0);
        if (mSum.chuva_maior_estacao_mm > maxRainPeak) maxRainPeak = mSum.chuva_maior_estacao_mm;
        windSum += Number(mSum.vento_vel_media_kmh || 0);
        windCount++;
        if (mSum.vento_vel_max_kmh > maxWindSpeed) maxWindSpeed = mSum.vento_vel_max_kmh;
        if (mSum.vento_rajada_max_kmh > maxGustSpeed) {
          maxGustSpeed = mSum.vento_rajada_max_kmh;
          maxGustInfo = mSum.vento_rajada_max_detalhe;
        }
        rowsHtml.push(buildMonthTotalRowHtml(mSum));
      });
    }

    if (rowsHtml.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="p-6 text-center text-slate-500 font-bold">Nenhum registro encontrado para o filtro selecionado.</td></tr>';
    } else {
      tbody.innerHTML = rowsHtml.join('');
    }

    if (countBadge) {
      if (st.viewMode === 'horario') {
        countBadge.textContent = filtered.hours.length + ' registros horários (' + filtered.days.length + ' dias) + Linhas de Totais';
      } else if (st.viewMode === 'diario') {
        countBadge.textContent = filtered.days.length + ' dias consolidados + Totais Mensais';
      } else {
        countBadge.textContent = filtered.months.length + ' meses consolidados';
      }
    }

    // Rodapé fixo com o TOTAL GERAL DO PERÍODO EXIBIDO
    if (tfoot) {
      var avgW = windCount > 0 ? (windSum / windCount) : 0;
      tfoot.innerHTML = (
        '<tr class="bg-[#dcfce7] dark:bg-emerald-950 border-t-2 border-emerald-600 text-black dark:text-emerald-100 font-black text-xs">' +
          '<td colspan="4" class="p-3 text-left uppercase tracking-wider">' +
            'TOTAL GERAL DOS ITENS EXIBIDOS (' + filtered.days.length + ' dias / ' + filtered.hours.length + 'h)' +
          '</td>' +
          '<td class="p-2.5 text-center break-words leading-tight">' +
            '<div class="text-sm font-black text-sky-900 dark:text-sky-300">Soma Rede: ' + fmtNum(totalRainSum, 1) + ' mm</div>' +
            '<div class="text-[10.5px] text-emerald-900 dark:text-emerald-300">Pico Registrado: ' + fmtNum(maxRainPeak, 1) + ' mm</div>' +
          '</td>' +
          '<td class="p-2.5 break-words leading-tight">' +
            '<div>Vel. Máx: ' + fmtNum(maxWindSpeed, 1) + ' km/h (Média: ' + fmtNum(avgW, 1) + ' km/h)</div>' +
            '<div class="text-[10.5px] text-amber-900 dark:text-amber-300">Maior Rajada: ' + fmtNum(maxGustSpeed, 1) + ' km/h ' + (maxGustInfo ? '(' + escapeHtml(maxGustInfo) + ')' : '') + '</div>' +
          '</td>' +
          '<td colspan="4" class="p-3 text-[11px] font-bold leading-snug">' +
            'Totais calculados automaticamente com base nos registros das estações de Rio das Ostras. Use os botões acima para baixar a planilha completa (.XLSX ou .CSV).' +
          '</td>' +
        '</tr>'
      );
    }
  }

  function buildMonthTotalRowHtml(mSum) {
    return (
      '<tr class="bg-sky-100/90 dark:bg-sky-950/70 border-y-2 border-sky-500 font-black text-black dark:text-sky-100">' +
        '<td class="p-2.5 text-center font-mono">MÊS</td>' +
        '<td class="p-2 text-center break-words leading-tight">' + String(mSum.mes_num).padStart(2, '0') + ' (' + escapeHtml(mSum.mes_nome) + ')</td>' +
        '<td class="p-2.5 text-center font-mono">' + mSum.ano + '</td>' +
        '<td class="p-2.5 text-center text-sky-900 dark:text-sky-300 whitespace-nowrap">TOTAL DO MÊS (' + mSum.dias_registrados + ' dias)</td>' +
        '<td class="p-2 text-center break-words leading-tight">' +
          '<div class="text-sm font-black text-sky-900 dark:text-sky-200">Total Mês: ' + fmtNum(mSum.chuva_total_media_mm, 1) + ' mm</div>' +
          '<div class="text-[10.5px] text-sky-800 dark:text-sky-300">Máx Estação: ' + fmtNum(mSum.chuva_maior_estacao_mm, 1) + ' mm (' + escapeHtml(mSum.chuva_maior_estacao_nome) + ')</div>' +
        '</td>' +
        '<td class="p-2 break-words leading-tight">' +
          '<div>Vel. Máx Mês: ' + fmtNum(mSum.vento_vel_max_kmh, 1) + ' km/h (Méd: ' + fmtNum(mSum.vento_vel_media_kmh, 1) + ')</div>' +
          '<div class="text-[10.5px] text-sky-900 dark:text-sky-300">Dir. Pred.: ' + escapeHtml(mSum.vento_dir_predominante) + ' • Raj. Máx: ' + fmtNum(mSum.vento_rajada_max_kmh, 1) + ' km/h</div>' +
        '</td>' +
        '<td class="p-2.5 text-[11px] font-bold leading-snug">Consolidado Mensal (' + mSum.dias_com_chuva + ' dias com chuva registrada)</td>' +
        '<td class="p-2.5 text-[11px] font-bold leading-snug">' + escapeHtml(mSum.sistema_atuante_mes) + '</td>' +
        '<td class="p-2.5 text-[11px] font-bold leading-snug">Dia mais chuvoso: ' + escapeHtml(mSum.dia_mais_chuvoso) + '</td>' +
        '<td class="p-2.5 text-[11px] font-bold leading-snug">' + escapeHtml(mSum.caracteristicas_mes) + '</td>' +
      '</tr>'
    );
  }

  /**
   * Exporta o recorte filtrado na tela para planilha CSV (compatível com Excel PT-BR)
   * incluindo linhas de Totais do Dia e Totais do Mês
   */
  window.exportFilteredHistoricoCSV = function () {
    var st = window.__historicoEstacoesState;
    if (!st.data) return;

    var filtered = getFilteredDataset();
    var headers = [
      'DIA',
      'MÊS',
      'ANO',
      'DATA',
      'HORÁRIO',
      'CHUVA EM MM POR HORA (Média Rede)',
      'CHUVA MÁXIMA NA HORA (mm)',
      'ESTAÇÃO MAIOR CHUVA',
      'VENTO VELOCIDADE (km/h)',
      'VENTO VELOCIDADE MÉDIA (km/h)',
      'VENTO DIREÇÃO',
      'VENTO RAJADAS POR HORA (km/h)',
      'VENTO COMPLETO POR HORA',
      'SISTEMA ATUANTE REGISTRADO NAQUELE DIA',
      'SISTEMA ATUANTE REGISTRADO DAQUELE MÊS',
      'CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE DIA',
      'CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE MÊS'
    ];

    var csvRows = [headers.join(';')];
    var dayMap = {};
    (st.data.resumo_diario || []).forEach(function (d) { dayMap[d.data_iso] = d; });
    if (st.customDayPayload) dayMap[st.customDayPayload.data_iso] = st.customDayPayload;

    function cleanCell(v) {
      if (v === null || v === undefined) return '';
      return '"' + String(v).replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
    }

    var hoursByDay = {};
    var dayOrder = [];
    filtered.hours.forEach(function (r) {
      if (!hoursByDay[r.data_iso]) {
        hoursByDay[r.data_iso] = [];
        dayOrder.push(r.data_iso);
      }
      hoursByDay[r.data_iso].push(r);
    });

    dayOrder.forEach(function (dIso) {
      var dHrs = hoursByDay[dIso];
      var dSum = dayMap[dIso];
      dHrs.forEach(function (r) {
        csvRows.push([
          String(r.dia).padStart(2, '0'),
          String(r.mes_num).padStart(2, '0') + ' - ' + r.mes_nome,
          r.ano,
          r.data_br,
          r.horario,
          fmtNum(r.chuva_mm_hora, 2),
          fmtNum(r.chuva_max_estacao_mm, 2),
          cleanCell(r.chuva_max_estacao_nome),
          fmtNum(r.vento_velocidade_kmh, 1),
          fmtNum(r.vento_velocidade_media_kmh, 1),
          cleanCell(r.vento_direcao_completa),
          fmtNum(r.vento_rajada_kmh, 1),
          cleanCell(r.vento_resumo_hora),
          cleanCell(r.sistema_atuante_dia),
          cleanCell(r.sistema_atuante_mes),
          cleanCell(r.caracteristicas_dia),
          cleanCell(r.caracteristicas_mes)
        ].join(';'));
      });

      if (dSum) {
        csvRows.push([
          String(dSum.dia).padStart(2, '0'),
          String(dSum.mes_num).padStart(2, '0') + ' - ' + dSum.mes_nome,
          dSum.ano,
          dSum.data_br,
          cleanCell('TOTAL DO DIA (' + dSum.horas_registradas + 'h)'),
          fmtNum(dSum.chuva_total_media_mm, 1),
          fmtNum(dSum.chuva_maior_estacao_mm, 1),
          cleanCell(dSum.chuva_maior_estacao_nome),
          fmtNum(dSum.vento_vel_max_kmh, 1),
          fmtNum(dSum.vento_vel_media_kmh, 1),
          cleanCell('Predom.: ' + dSum.vento_dir_predominante),
          fmtNum(dSum.vento_rajada_max_kmh, 1),
          cleanCell('Máx: ' + fmtNum(dSum.vento_vel_max_kmh, 1) + ' km/h | Dir: ' + dSum.vento_dir_predominante + ' | Rajada Máx: ' + fmtNum(dSum.vento_rajada_max_kmh, 1) + ' km/h'),
          cleanCell(dSum.sistema_atuante_dia),
          cleanCell(dSum.sistema_atuante_mes),
          cleanCell(dSum.caracteristicas_dia),
          cleanCell(dSum.caracteristicas_mes)
        ].join(';'));
      }
    });

    var blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    var suffix = st.dayFilter ? st.dayFilter : (st.monthFilter !== 'all' ? st.monthFilter : 'completo_out_nov_2026');
    link.download = 'historico_estacoes_rio_das_ostras_' + suffix + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.loadHistoricoEstacoesData(false);
  });
})();
