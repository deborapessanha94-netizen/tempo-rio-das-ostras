import re
from pathlib import Path

ROOT = Path(r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app")

# 1. Hook sync_powerbi_balneabilidade into scripts/sync_data.py
sync_data_path = ROOT / "scripts" / "sync_data.py"
sync_txt = sync_data_path.read_text(encoding="utf-8")

if "sync_powerbi_balneabilidade" not in sync_txt:
    target_main = "    sync_inea_cheias()"
    replacement_main = """    sync_inea_cheias()
    try:
        try:
            from scripts.powerbi_balneabilidade_sync import sync_powerbi_balneabilidade
        except ImportError:
            from powerbi_balneabilidade_sync import sync_powerbi_balneabilidade
        sync_powerbi_balneabilidade(DATA_DIR)
    except Exception as e:
        print(f"Aviso ao sincronizar Balneabilidade Power BI INEA: {e}")"""
    assert target_main in sync_txt, "Could not find sync_inea_cheias() in scripts/sync_data.py"
    sync_txt = sync_txt.replace(target_main, replacement_main, 1)
    sync_data_path.write_text(sync_txt, encoding="utf-8")
    print("Updated scripts/sync_data.py with sync_powerbi_balneabilidade.")

# 2. Update getBalneabilidade in js/api.js to use fetchLiveCloudOrLocalJson + live Power BI query
api_path = ROOT / "js" / "api.js"
api_js = api_path.read_text(encoding="utf-8")

old_get_baln = """export async function getBalneabilidade() {
  const ts = Date.now();
  try {
    const res = await fetch(`./data/balneabilidade.json?t=${ts}`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {}
  return [];
}"""

new_get_baln = """export async function fetchLivePowerBiBalneabilidade(baseData = null) {
  const PBI_QUERY_URL = 'https://wabi-brazil-south-api.analysis.windows.net/public/reports/querydata?synchronous=true';
  const RESOURCE_KEY = '5b801b31-4f49-43f5-a91f-ece742be0290';
  const props = [
    'Ponto de Coleta',
    'Código Ponto de Coleta',
    'Praia',
    'Lagoa',
    'Localização',
    'Classificação',
    'Data da coleta',
    'Choveu nas últimas 24h?',
    'Observação',
    'Concentração NMP/100ml Enterococos',
    'Latitude ',
    'Longitude'
  ];
  const payload = {
    version: '1.0.0',
    queries: [{
      Query: {
        Commands: [{
          SemanticQueryDataShapeCommand: {
            Query: {
              Version: 2,
              From: [{ Name: 'f', Entity: 'fDISEQ_Balneabilidade_Praias', Type: 0 }],
              Select: props.map(p => ({
                Column: { Expression: { SourceRef: { Source: 'f' } }, Property: p },
                Name: p
              })),
              Where: [{
                Condition: {
                  In: {
                    Expressions: [{ Column: { Expression: { SourceRef: { Source: 'f' } }, Property: 'Município' } }],
                    Values: [[{ Literal: { Value: "'Rio das Ostras'" } }]]
                  }
                }
              }]
            },
            Binding: {
              Primary: { Groupings: [{ Projections: props.map((_, i) => i) }] },
              DataReduction: { DataVolume: 4, Primary: { Window: { Count: 100 } } },
              Version: 1
            },
            ExecutionMetricsKind: 1
          }
        }]
      },
      QueryId: '',
      ApplicationContext: {
        DatasetId: '3f9a82b6-9c0c-4a62-835f-610e0f8b41c7',
        Sources: [{ ReportId: '5d29285b-4347-4479-9e69-9f7e1c2b8c32' }]
      }
    }],
    cancelQueries: [],
    modelId: 5721923
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(PBI_QUERY_URL, {
      method: 'POST',
      headers: {
        'X-PowerBI-ResourceKey': RESOURCE_KEY,
        'Content-Type': 'application/json;charset=UTF-8',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return baseData;
    const json = await res.json();
    const ds = json?.results?.[0]?.result?.data?.dsr?.DS?.[0];
    const dm = ds?.PH?.[0]?.DM0;
    if (!Array.isArray(dm) || dm.length === 0) return baseData;

    const vdicts = ds.ValueDicts || {};
    const schema = dm[0].S || [];
    const ncols = schema.length;
    const prevVals = new Array(ncols).fill(null);
    const liveByPbiCode = {};

    for (const item of dm) {
      const rMask = item.R || 0;
      const nullMask = item['Ø'] || 0;
      const cArr = item.C || [];
      let cIdx = 0;
      const currVals = [];
      for (let colI = 0; colI < ncols; colI++) {
        let val = null;
        if ((rMask >> colI) & 1) {
          val = prevVals[colI];
        } else if ((nullMask >> colI) & 1) {
          val = null;
        } else {
          const rawV = cIdx < cArr.length ? cArr[cIdx++] : null;
          const dn = schema[colI]?.DN;
          if (dn && vdicts[dn] && typeof rawV === 'number' && rawV >= 0 && rawV < vdicts[dn].length) {
            val = vdicts[dn][rawV];
          } else if (schema[colI]?.T === 7 && typeof rawV === 'number') {
            val = new Date(rawV).toISOString().slice(0, 10);
          } else {
            val = rawV;
          }
        }
        currVals.push(val);
        prevVals[colI] = val;
      }
      const rowObj = {};
      props.forEach((p, idx) => { rowObj[p] = currVals[idx]; });
      const pbiCode = String(rowObj['Ponto de Coleta'] || '').trim();
      if (pbiCode) liveByPbiCode[pbiCode] = rowObj;
    }

    if (baseData && Array.isArray(baseData.pontos)) {
      let latestIso = baseData.data_coleta_iso || '';
      baseData.pontos.forEach(pt => {
        const key = pt.codigo_pbi || String(pt.codigo || '').replace('RO00', 'RO0');
        const live = liveByPbiCode[key];
        if (!live) return;
        const rawClass = String(live['Classificação'] || '').toUpperCase();
        const isPropria = rawClass.includes('PRÓPRIA') && !rawClass.includes('IMPRÓPRIA');
        pt.status = isPropria ? 'PRÓPRIA' : 'IMPRÓPRIA';
        pt.badge = isPropria ? 'success' : 'danger';
        if (live['Código Ponto de Coleta']) pt.codigo_seirhi = String(live['Código Ponto de Coleta']).trim();
        if (live['Localização']) pt.localizacao = String(live['Localização']).trim();
        const entNum = parseInt(String(live['Concentração NMP/100ml Enterococos'] || '').replace(',', '.'), 10);
        if (!isNaN(entNum)) {
          pt.enterococos_nmp = entNum;
          pt.enterococos_label = `${entNum} NMP/100 mL`;
          if (isPropria) {
            pt.motivo = `Enterococos: ${entNum} NMP/100 mL (Dentro do limite seguro ≤ 100 NMP/100 mL da Resolução CONAMA nº 274/2000)`;
          } else if (entNum > 400) {
            pt.motivo = `Enterococos: ${entNum} NMP/100 mL (Acima do limite máximo de 400 NMP/100 mL na última coleta — CONAMA nº 274/2000)`;
          } else {
            pt.motivo = `Enterococos: ${entNum} NMP/100 mL (Acima de 100 NMP/100 mL em 2 ou mais das últimas 5 campanhas — CONAMA nº 274/2000)`;
          }
        }
        const dtIso = String(live['Data da coleta'] || '').trim();
        if (dtIso && /^\d{4}-\d{2}-\d{2}$/.test(dtIso)) {
          pt.data_coleta_iso = dtIso;
          const [y, m, d] = dtIso.split('-');
          pt.data_coleta_br = `${d}/${m}/${y}`;
          if (!latestIso || dtIso > latestIso) latestIso = dtIso;
        }
      });
      if (latestIso && /^\d{4}-\d{2}-\d{2}$/.test(latestIso)) {
        const [y, m, d] = latestIso.split('-');
        const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        baseData.data_coleta_iso = latestIso;
        baseData.data_boletim_curta = `${d}/${m}/${y}`;
        baseData.data_boletim = `${d} de ${meses[parseInt(m, 10)]} de ${y}`;
      }
      baseData.powerbi_conectado = true;
    }
    return baseData;
  } catch (e) {
    return baseData;
  }
}

export async function getBalneabilidade() {
  const baseData = await fetchLiveCloudOrLocalJson('balneabilidade.json', null);
  if (!baseData) return [];
  return await fetchLivePowerBiBalneabilidade(baseData);
}"""

if "fetchLivePowerBiBalneabilidade" not in api_js:
    assert old_get_baln.replace("\n", "\r\n") in api_js or old_get_baln in api_js, "Could not find getBalneabilidade in js/api.js"
    api_js = api_js.replace(old_get_baln.replace("\n", "\r\n"), new_get_baln.replace("\n", "\r\n")).replace(old_get_baln, new_get_baln)
    api_path.write_text(api_js, encoding="utf-8")
    print("Updated js/api.js with live Power BI Balneabilidade integration.")

# 3. Update #orla-panel-balnear in index.html
index_path = ROOT / "index.html"
html = index_path.read_text(encoding="utf-8")

pattern_balnear_panel = re.compile(
    r'<!-- PAINEL 3: BALNEABILIDADE.*?</div> <!-- /#orla-panel-balnear -->',
    re.DOTALL
)
assert pattern_balnear_panel.search(html), "Could not find #orla-panel-balnear in index.html"

new_balnear_panel = """<!-- PAINEL 3: BALNEABILIDADE INEA (SINCRONIZADO COM POWER BI OFICIAL INEA / SEIRHI) -->
          <div id="orla-panel-balnear" class="orla-tab-panel hidden space-y-4">
            <div id="balnear-summary-content" class="space-y-4">
              <!-- Banner Executivo de Balneabilidade (Power BI INEA + CONAMA 274/2000) -->
              <div class="p-4 rounded-2xl bg-gradient-to-br from-[#f8fafc] via-[#f1f6fa] to-[#eaf2f8] border border-[#6d8ba6]/50 space-y-3.5 shadow-xs">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-xl bg-[#eaf0f6] border border-[#6d8ba6] flex items-center justify-center text-black shrink-0">
                      <i data-lucide="shield-check" class="w-4 h-4 text-black"></i>
                    </div>
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-[10px] font-black uppercase text-black tracking-wider" id="balnear-boletim-titulo">Boletim nº 20 (INEA • Power BI DISEQ / SEIRHI)</span>
                        <span class="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md bg-[#ccfbf1] text-[#0f766e] border border-[#0d9488]/40">CONAMA nº 274/2000 • RH-VIII</span>
                      </div>
                      <strong class="text-sm sm:text-base font-black text-black block mt-0.5" id="balnear-status-geral-txt">9 de 12 Pontos Próprios para Banho (75%)</strong>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[11px] font-black uppercase px-2.5 py-1 rounded-full bg-white text-black border border-[#6d8ba6]" id="balnear-data-badge">Coleta: 29/09/2026</span>
                    <a href="https://app.powerbi.com/view?r=eyJrIjoiNWI4MDFiMzEtNGY0OS00M2Y1LWE5MWYtZWNlNzQyYmUwMjkwIiwidCI6IjZkYjc3YWU3LWQwYTQtNDYxNi1iNzM4LTg4ODE4NTQxOWIzOSJ9&pageName=64fcd9486da0b10c1015" target="_blank" rel="noopener noreferrer" class="text-[11px] font-black px-3 py-1 rounded-full bg-[#ffebe4] hover:bg-[#fed7cc] text-black border border-[#f07a53] transition flex items-center gap-1 shadow-2xs">
                      <i data-lucide="bar-chart-3" class="w-3.5 h-3.5 text-[#ea580c]"></i>
                      <span>Abrir Power BI INEA ↗</span>
                    </a>
                  </div>
                </div>

                <!-- Resumo Próprias x Impróprias + Critério Enterococos -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                  <div class="p-3 rounded-xl bg-white/95 border border-[#6d8ba6]/40 shadow-2xs space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-black uppercase text-[#0f766e]">Pontos Próprios para Banho</span>
                      <span class="text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#eaf0f6] border border-[#6d8ba6]/50 text-black" id="balnear-proprias-count">9 Pontos (75%)</span>
                    </div>
                    <span class="text-[11px] text-black font-semibold block leading-snug" id="balnear-proprias-nomes">Tartarugas (10), Bosque (10), Centro Av. Amazonas (10), Cemitério (31), Joana (10), Areia Negra (10), Remanso (52), Costazul (20) e Mar do Norte (10 NMP/100 mL)</span>
                  </div>

                  <div class="p-3 rounded-xl bg-white/95 border border-[#f07a53]/50 shadow-2xs space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-black uppercase text-[#b91c1c]">Pontos Impróprios / Atenção</span>
                      <span class="text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#ffebe4] border border-[#f07a53]/60 text-black" id="balnear-improprias-count">3 Pontos (25%)</span>
                    </div>
                    <span class="text-[11px] text-black font-semibold block leading-snug" id="balnear-improprias-nomes">Centro R. Bento Costa Jr (700 NMP/100 mL), Boca da Barra (291 NMP/100 mL) e Lagoa de Iriri (683 NMP/100 mL)</span>
                  </div>

                  <div class="p-3 rounded-xl bg-white/95 border border-[#cbd5e1] shadow-2xs space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-black uppercase text-black">Critério Enterococos (CONAMA)</span>
                      <span class="text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#f1f5f9] border border-[#94a3b8] text-black">Res. nº 274/2000</span>
                    </div>
                    <span class="text-[11px] text-black font-medium block leading-snug">Próprio se Enterococos ≤ <strong>100 NMP/100 mL</strong> em ao menos 4 das últimas 5 coletas e &lt; <strong>400 NMP/100 mL</strong> na coleta mais recente.</span>
                  </div>
                </div>

                <p class="text-[11px] text-black font-medium leading-relaxed bg-white/90 p-2.5 rounded-xl border border-[#cbd5e1]" id="balnear-obs-tecnica">
                  <strong>Recomendação Oficial do INEA:</strong> Evitar o banho de mar nas primeiras horas após a ocorrência de chuvas e manter distância das saídas de galerias de águas pluviais ou canais de drenagem.
                </p>
              </div>

              <!-- GRADE COMPLETA DOS 12 PONTOS DE COLETA DO INEA DIRETO NA ABA -->
              <div class="space-y-2.5">
                <div class="flex items-center justify-between flex-wrap gap-2 px-0.5">
                  <div class="flex items-center gap-2">
                    <i data-lucide="map-pin" class="w-4 h-4 text-[#0284c7]"></i>
                    <h4 class="text-xs sm:text-sm font-black text-black uppercase tracking-tight">Detalhamento Ponto a Ponto — 12 Estações de Coleta INEA (Circuito Macaé e Rio das Ostras)</h4>
                  </div>
                  <span class="text-[10.5px] font-bold text-[#475569]">Valores de Enterococos (NMP/100 mL) e Qualificação Anual (PBP) extraídos do Power BI INEA</span>
                </div>

                <div id="balnear-inline-pontos-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <!-- Preenchido dinamicamente por renderBalneabilidadeList() em js/app.js -->
                </div>
              </div>

              <!-- Rodapé de Advertências & Links Oficiais -->
              <div class="pt-2.5 border-t border-[#dfb992]/20 flex items-center justify-between text-[11px] text-black flex-wrap gap-2">
                <span id="orla-aviso-resumo" class="font-medium text-black">* Dados sincronizados com o Painel Power BI de Balneabilidade do INEA (DISEQ/SEIRHI) e Marinha do Brasil (CHM).</span>
                <div class="flex items-center gap-2 flex-wrap">
                  <a href="https://app.powerbi.com/view?r=eyJrIjoiNWI4MDFiMzEtNGY0OS00M2Y1LWE5MWYtZWNlNzQyYmUwMjkwIiwidCI6IjZkYjc3YWU3LWQwYTQtNDYxNi1iNzM4LTg4ODE4NTQxOWIzOSJ9&pageName=64fcd9486da0b10c1015" target="_blank" rel="noopener noreferrer" class="bg-[#ffebe4] border border-[#f07a53] text-black font-bold px-2.5 py-1 rounded-lg text-[11px] hover:bg-[#fed7cc] transition flex items-center gap-1">
                    Painel Power BI INEA ↗
                  </a>
                  <a href="https://seirhi.inea.rj.gov.br/publico" target="_blank" rel="noopener" class="bg-[#eaf0f6] border border-[#6d8ba6]/50 text-black font-bold px-2 py-1 rounded-lg text-[11px] hover:bg-[#d8e5f0] transition flex items-center gap-0.5">
                    SEIRHI INEA ↗
                  </a>
                  <a href="https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo" target="_blank" rel="noopener" class="bg-[#eaf0f6] border border-[#6d8ba6]/50 text-black font-bold px-2 py-1 rounded-lg text-[11px] hover:bg-[#d8e5f0] transition flex items-center gap-0.5">
                    Avisos CHM ↗
                  </a>
                </div>
              </div>
            </div>
          </div> <!-- /#orla-panel-balnear -->"""

html = pattern_balnear_panel.sub(lambda _: new_balnear_panel, html, count=1)
html = html.replace("?v=206", "?v=207")
index_path.write_text(html, encoding="utf-8")
print("Updated #orla-panel-balnear in index.html.")

# 4. Update renderBalneabilidadeList in js/app.js
app_path = ROOT / "js" / "app.js"
app_js = app_path.read_text(encoding="utf-8")

pattern_render_balnear = re.compile(
    r'function renderBalneabilidadeList\(balnearData\)\s*\{.*?if\s*\(window\.lucide\)\s*window\.lucide\.createIcons\(\);\s*\}',
    re.DOTALL
)
assert pattern_render_balnear.search(app_js), "Could not find renderBalneabilidadeList in js/app.js"

new_render_balnear = """function renderBalneabilidadeList(balnearData) {
  const modalBalnearListEl = document.getElementById('modal-balnear-pontos-list');
  const inlineGridEl = document.getElementById('balnear-inline-pontos-grid');
  const tituloEl = document.getElementById('balnear-boletim-titulo');
  const modalTituloEl = document.getElementById('modal-balnear-titulo');
  const dataBadgeEl = document.getElementById('balnear-data-badge');
  const modalDataBadgeEl = document.getElementById('modal-balnear-data');
  const obsEl = document.getElementById('balnear-obs-tecnica');
  const modalObsEl = document.getElementById('modal-balnear-obs');
  const statusGeralTxt = document.getElementById('balnear-status-geral-txt');
  const countPropriasEl = document.getElementById('balnear-proprias-count');
  const countImpropriasEl = document.getElementById('balnear-improprias-count');
  const nomesPropriasEl = document.getElementById('balnear-proprias-nomes');
  const nomesImpropriasEl = document.getElementById('balnear-improprias-nomes');

  const data = (balnearData && balnearData.pontos) ? balnearData : null;
  if (!data) return;

  const boletimNome = data.boletim_numero
    ? `Boletim nº ${data.boletim_numero} (INEA • Power BI DISEQ / SEIRHI)`
    : 'Boletim Oficial de Balneabilidade (INEA • Power BI)';
  if (tituloEl) tituloEl.textContent = boletimNome;
  if (modalTituloEl) modalTituloEl.textContent = boletimNome;

  const dataCurta = data.data_boletim_curta || data.data_boletim || '';
  if (dataBadgeEl && dataCurta) dataBadgeEl.textContent = `Coleta: ${dataCurta}`;
  if (modalDataBadgeEl && data.data_boletim) modalDataBadgeEl.textContent = data.data_boletim;

  if (obsEl && data.observacao_tecnica) {
    obsEl.innerHTML = `<strong>Recomendação Oficial do INEA:</strong> ${data.observacao_tecnica}`;
  }
  if (modalObsEl && data.observacao_tecnica) {
    modalObsEl.innerHTML = `<strong>Recomendação Oficial do INEA:</strong> ${data.observacao_tecnica}`;
  }

  const pontos = data.pontos || [];
  if (pontos.length > 0) {
    const proprias = pontos.filter(pt => String(pt.status).toUpperCase() === 'PRÓPRIA');
    const improprias = pontos.filter(pt => String(pt.status).toUpperCase() !== 'PRÓPRIA');
    const perc = Math.round((proprias.length / pontos.length) * 100);
    const percImp = 100 - perc;

    if (statusGeralTxt) statusGeralTxt.textContent = `${proprias.length} de ${pontos.length} Pontos Próprios para Banho (${perc}%)`;
    if (countPropriasEl) countPropriasEl.textContent = `${proprias.length} Pontos (${perc}%)`;
    if (countImpropriasEl) countImpropriasEl.textContent = `${improprias.length} Pontos (${percImp}%)`;

    if (nomesPropriasEl && proprias.length > 0) {
      nomesPropriasEl.textContent = proprias.map(p => {
        const shortName = String(p.praia || '').replace(/^Praia d[aeo]s?\s+/i, '');
        return p.enterococos_nmp !== undefined && p.enterococos_nmp !== null
          ? `${shortName} (${p.enterococos_nmp} NMP)`
          : shortName;
      }).join(', ');
    }
    if (nomesImpropriasEl && improprias.length > 0) {
      nomesImpropriasEl.textContent = improprias.map(p => {
        const shortName = String(p.praia || '').replace(/^Praia d[aeo]s?\s+/i, '');
        return p.enterococos_nmp !== undefined && p.enterococos_nmp !== null
          ? `${shortName} (${p.enterococos_nmp} NMP/100 mL)`
          : shortName;
      }).join(', ');
    }

    const buildCardHtml = (pt) => {
      const isPropria = String(pt.status).toUpperCase() === 'PRÓPRIA';
      const themeCard = isPropria
        ? 'border-[#6d8ba6]/50 bg-gradient-to-br from-[#ffffff] to-[#f4f8fb]'
        : 'border-[#f07a53]/70 bg-gradient-to-br from-[#ffffff] to-[#fff5f2]';
      const badgeClass = isPropria
        ? 'bg-[#eaf0f6] text-black border-2 border-[#6d8ba6] font-black'
        : 'bg-[#ffebe4] text-black border-2 border-[#f07a53] font-black';

      const entVal = (pt.enterococos_nmp !== undefined && pt.enterococos_nmp !== null) ? Number(pt.enterococos_nmp) : null;
      const entPct = entVal !== null ? Math.min(100, Math.max(4, Math.round((entVal / 400) * 100))) : 0;
      const entBarColor = entVal === null ? 'bg-slate-400' : (entVal <= 100 ? 'bg-[#0d9488]' : (entVal <= 400 ? 'bg-[#d97706]' : 'bg-[#e11d48]'));
      const entPillClass = entVal !== null && entVal <= 100
        ? 'bg-[#ccfbf1] text-[#0f766e] border-[#0d9488]/40'
        : 'bg-[#ffe4e6] text-[#9f1239] border-[#f43f5e]/40';

      const catAnual = pt.categoria_anual && pt.categoria_anual !== 'Não Categorizada'
        ? `${pt.categoria_anual}${pt.pbp_anual_pct !== null && pt.pbp_anual_pct !== undefined ? ` (${pt.pbp_anual_pct}% Própria)` : ''}`
        : (pt.tipo === 'lagoa' ? 'Corpo Lagunar Monitorado' : 'Monitoramento Contínuo');

      const seirhiCode = pt.codigo_seirhi || pt.codigo;
      const pbiCode = pt.codigo_pbi || pt.codigo;
      const dtBr = pt.data_coleta_br || dataCurta || '';
      const coordsTxt = (pt.latitude && pt.longitude)
        ? `${Number(pt.latitude).toFixed(4)}°, ${Number(pt.longitude).toFixed(4)}°`
        : '';

      return `
        <div class="p-3.5 rounded-2xl border-2 ${themeCard} shadow-xs flex flex-col justify-between space-y-2.5 transition hover:shadow-md">
          <div class="space-y-1.5">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <strong class="font-black text-black text-sm leading-tight">${pt.praia}</strong>
                  <span class="font-mono font-bold text-[10px] bg-white px-1.5 py-0.5 rounded border border-[#cbd5e1] text-black" title="Código no Painel Power BI INEA">${pbiCode}</span>
                </div>
                <span class="text-[11px] text-black font-semibold block mt-0.5">${pt.localizacao}</span>
              </div>
              <span class="text-[10.5px] px-2.5 py-0.5 rounded-full ${badgeClass} shrink-0 uppercase tracking-wide">
                ${pt.status}
              </span>
            </div>

            <!-- Métrica Microbiológica Enterococos (Power BI INEA) -->
            ${entVal !== null ? `
            <div class="p-2 rounded-xl bg-white/95 border border-[#cbd5e1] space-y-1">
              <div class="flex items-center justify-between text-[10.5px]">
                <span class="font-bold text-black">Enterococos (Última Coleta):</span>
                <span class="font-mono font-black px-1.5 py-0.2 rounded border ${entPillClass}">${entVal} NMP/100 mL</span>
              </div>
              <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div class="h-full ${entBarColor} rounded-full" style="width: ${entPct}%"></div>
              </div>
              <div class="flex items-center justify-between text-[9.5px] text-[#475569] font-medium">
                <span>Limite Própria: ≤ 100 NMP</span>
                <span>Máx. CONAMA: 400 NMP/100 mL</span>
              </div>
            </div>
            ` : ''}
          </div>

          <div class="space-y-1.5 pt-1 border-t border-[#cbd5e1]/60 text-[10.5px] text-black">
            <div class="flex items-center justify-between gap-1 flex-wrap">
              <span class="font-semibold text-[#334155]">Histórico Anual (PBP):</span>
              <span class="font-bold text-black bg-white px-2 py-0.5 rounded border border-[#cbd5e1]">${catAnual}</span>
            </div>
            <div class="flex items-center justify-between gap-1 text-[10px] text-[#475569] font-mono">
              <span>SEIRHI: ${seirhiCode}</span>
              ${dtBr ? `<span>Coleta: ${dtBr}</span>` : ''}
            </div>
            ${coordsTxt ? `<div class="text-[9.5px] text-[#64748b] font-mono">GPS: ${coordsTxt} • RH-${pt.rh || 'VIII'}</div>` : ''}
          </div>
        </div>
      `;
    };

    const allCardsHtml = pontos.map(buildCardHtml).join('');
    if (inlineGridEl) inlineGridEl.innerHTML = allCardsHtml;
    if (modalBalnearListEl) modalBalnearListEl.innerHTML = allCardsHtml;
  }

  if (window.lucide) window.lucide.createIcons();
}"""

app_js = pattern_render_balnear.sub(lambda _: new_render_balnear, app_js, count=1)
app_js = app_js.replace("v206", "v207")
app_path.write_text(app_js, encoding="utf-8")
print("Updated renderBalneabilidadeList in js/app.js.")

# 5. Update sw.js to v207
sw_path = ROOT / "sw.js"
sw_js = sw_path.read_text(encoding="utf-8")
sw_js = re.sub(r"v20[0-9]", "v207", sw_js)
sw_path.write_text(sw_js, encoding="utf-8")
print("Updated sw.js to v207.")
