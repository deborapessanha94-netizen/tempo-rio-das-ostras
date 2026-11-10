"""
Aplica a versão v200:
1. Integra historico_estacoes_service.py ao workflow sync_sources.yml e ao auto_bulletin.py
2. Insere botões de acesso rápido à Planilha Histórica no cabeçalho institucional,
   no menu Previsão & Tempo, no menu Acumulados Chuva e nos cards de Chuva
3. Insere a seção completa #section-chuva-historico em index.html com:
   - Botões de download da planilha completa (.XLSX e .CSV) e planilha filtrada
   - Painel de Totais Mensais (Outubro/2026 e Novembro/2026) com Sistemas e Características do Mês
   - Filtros por Mês, Dia e Pesquisa de Qualquer Data nas Estações (ex: 05/02/2026)
   - Planilha interativa com todas as colunas exigidas + Linhas de TOTAL DO DIA, TOTAL DO MÊS e TOTAL GERAL
4. Atualiza SUB_SECTIONS_CONFIG em index.html e js/app.js
"""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def patch_workflow():
    p = BASE_DIR / ".github" / "workflows" / "sync_sources.yml"
    txt = p.read_text(encoding="utf-8")
    if "historico_estacoes_service.py" not in txt:
        txt = txt.replace(
            "python scripts/stations_service.py || true",
            "python scripts/stations_service.py || true\n          python scripts/historico_estacoes_service.py || true",
        )
        # Atualiza thead caso já tenha sido inserido
    old_thead = """          <thead class="sticky top-0 z-20 bg-[#1e293b] text-white font-black uppercase text-[10.5px] border-b-2 border-[#0f172a] shadow-xs">
            <tr>
              <th class="p-3 text-center w-14">DIA</th>
              <th class="p-3 text-center w-28">MÊS</th>
              <th class="p-3 text-center w-16">ANO</th>
              <th class="p-3 text-center w-28 bg-[#0f172a]">HORÁRIO</th>
              <th class="p-3 text-center w-44 bg-sky-950 text-sky-200">CHUVA EM MM POR HORA<br><span class="text-[9px] font-normal text-sky-300">(Média Rede, Máx &amp; Totais)</span></th>
              <th class="p-3 w-64 bg-emerald-950 text-emerald-200">VENTO: VELOCIDADE, DIREÇÃO E RAJADAS POR HORA<br><span class="text-[9px] font-normal text-emerald-300">(km/h, Cardeal/Graus e Pico)</span></th>
              <th class="p-3 min-w-[230px]">SISTEMA ATUANTE REGISTRADO NAQUELE DIA</th>
              <th class="p-3 min-w-[230px]">SISTEMA ATUANTE REGISTRADO DAQUELE MÊS</th>
              <th class="p-3 min-w-[270px]">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE DIA</th>
              <th class="p-3 min-w-[270px]">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE MÊS</th>
            </tr>
          </thead>"""
    new_thead = """          <thead class="sticky top-0 z-20 bg-[#e2e8f0] dark:bg-slate-800 text-black dark:text-white font-black uppercase text-[10.5px] border-b-2 border-[#64748b] shadow-xs">
            <tr>
              <th class="p-2.5 text-center w-14 text-black dark:text-white">DIA</th>
              <th class="p-2.5 text-center w-28 text-black dark:text-white">MÊS</th>
              <th class="p-2.5 text-center w-16 text-black dark:text-white">ANO</th>
              <th class="p-2.5 text-center w-28 bg-[#cbd5e1] dark:bg-slate-700 text-black dark:text-white">HORÁRIO</th>
              <th class="p-2.5 text-center w-44 bg-[#e0f2fe] dark:bg-sky-950 text-sky-950 dark:text-sky-200">CHUVA EM MM POR HORA<br><span class="text-[9px] font-bold text-sky-800 dark:text-sky-300">(Média Rede, Máx &amp; Totais)</span></th>
              <th class="p-2.5 w-64 bg-[#dcfce7] dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200">VENTO: VELOCIDADE, DIREÇÃO E RAJADAS POR HORA<br><span class="text-[9px] font-bold text-emerald-800 dark:text-emerald-300">(km/h, Cardeal/Graus e Pico)</span></th>
              <th class="p-2.5 min-w-[210px] text-black dark:text-white">SISTEMA ATUANTE REGISTRADO NAQUELE DIA</th>
              <th class="p-2.5 min-w-[220px] text-black dark:text-white">SISTEMA ATUANTE REGISTRADO DAQUELE MÊS</th>
              <th class="p-2.5 min-w-[260px] text-black dark:text-white">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE DIA</th>
              <th class="p-2.5 min-w-[260px] text-black dark:text-white">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE MÊS</th>
            </tr>
          </thead>"""
    txt = txt.replace(old_thead, new_thead)

    p.write_text(txt, encoding="utf-8")
        print("[OK] .github/workflows/sync_sources.yml atualizado.")


def patch_auto_bulletin():
    p = BASE_DIR / "scripts" / "auto_bulletin.py"
    txt = p.read_text(encoding="utf-8")
    if "historico_estacoes_service" not in txt:
        target = '    print(">> [Auto-Bulletin] Rodada concluída com 100% de sucesso!")'
        hook = (
            "    # Atualiza Histórico Diário e Horário das Estações em Formato de Planilha (XLSX / CSV / JSON)\n"
            "    try:\n"
            "        try:\n"
            "            from scripts.historico_estacoes_service import update_historical_spreadsheet\n"
            "        except ImportError:\n"
            "            from historico_estacoes_service import update_historical_spreadsheet\n"
            "        update_historical_spreadsheet()\n"
            "    except Exception as e:\n"
            '        print(f"   [AVISO] Não foi possível atualizar histórico de estações: {e}")\n\n'
            '    print(">> [Auto-Bulletin] Rodada concluída com 100% de sucesso!")'
        )
        txt = txt.replace(target, hook)
        # Atualiza thead caso já tenha sido inserido
    old_thead = """          <thead class="sticky top-0 z-20 bg-[#1e293b] text-white font-black uppercase text-[10.5px] border-b-2 border-[#0f172a] shadow-xs">
            <tr>
              <th class="p-3 text-center w-14">DIA</th>
              <th class="p-3 text-center w-28">MÊS</th>
              <th class="p-3 text-center w-16">ANO</th>
              <th class="p-3 text-center w-28 bg-[#0f172a]">HORÁRIO</th>
              <th class="p-3 text-center w-44 bg-sky-950 text-sky-200">CHUVA EM MM POR HORA<br><span class="text-[9px] font-normal text-sky-300">(Média Rede, Máx &amp; Totais)</span></th>
              <th class="p-3 w-64 bg-emerald-950 text-emerald-200">VENTO: VELOCIDADE, DIREÇÃO E RAJADAS POR HORA<br><span class="text-[9px] font-normal text-emerald-300">(km/h, Cardeal/Graus e Pico)</span></th>
              <th class="p-3 min-w-[230px]">SISTEMA ATUANTE REGISTRADO NAQUELE DIA</th>
              <th class="p-3 min-w-[230px]">SISTEMA ATUANTE REGISTRADO DAQUELE MÊS</th>
              <th class="p-3 min-w-[270px]">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE DIA</th>
              <th class="p-3 min-w-[270px]">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE MÊS</th>
            </tr>
          </thead>"""
    new_thead = """          <thead class="sticky top-0 z-20 bg-[#e2e8f0] dark:bg-slate-800 text-black dark:text-white font-black uppercase text-[10.5px] border-b-2 border-[#64748b] shadow-xs">
            <tr>
              <th class="p-2.5 text-center w-14 text-black dark:text-white">DIA</th>
              <th class="p-2.5 text-center w-28 text-black dark:text-white">MÊS</th>
              <th class="p-2.5 text-center w-16 text-black dark:text-white">ANO</th>
              <th class="p-2.5 text-center w-28 bg-[#cbd5e1] dark:bg-slate-700 text-black dark:text-white">HORÁRIO</th>
              <th class="p-2.5 text-center w-44 bg-[#e0f2fe] dark:bg-sky-950 text-sky-950 dark:text-sky-200">CHUVA EM MM POR HORA<br><span class="text-[9px] font-bold text-sky-800 dark:text-sky-300">(Média Rede, Máx &amp; Totais)</span></th>
              <th class="p-2.5 w-64 bg-[#dcfce7] dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200">VENTO: VELOCIDADE, DIREÇÃO E RAJADAS POR HORA<br><span class="text-[9px] font-bold text-emerald-800 dark:text-emerald-300">(km/h, Cardeal/Graus e Pico)</span></th>
              <th class="p-2.5 min-w-[210px] text-black dark:text-white">SISTEMA ATUANTE REGISTRADO NAQUELE DIA</th>
              <th class="p-2.5 min-w-[220px] text-black dark:text-white">SISTEMA ATUANTE REGISTRADO DAQUELE MÊS</th>
              <th class="p-2.5 min-w-[260px] text-black dark:text-white">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE DIA</th>
              <th class="p-2.5 min-w-[260px] text-black dark:text-white">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE MÊS</th>
            </tr>
          </thead>"""
    txt = txt.replace(old_thead, new_thead)

    p.write_text(txt, encoding="utf-8")
        print("[OK] scripts/auto_bulletin.py atualizado.")


def patch_app_js():
    p = BASE_DIR / "js" / "app.js"
    txt = p.read_text(encoding="utf-8")
    if "'section-chuva-historico'" not in txt:
        txt = txt.replace(
            "      'section-chuva-resumo',\n      'section-chuva-cards',\n      'section-chuva-tabela'",
            "      'section-chuva-resumo',\n      'section-chuva-cards',\n      'section-chuva-tabela',\n      'section-chuva-historico'",
        )
        txt = txt.replace(
            "      'section-chuva-resumo',\r\n      'section-chuva-cards',\r\n      'section-chuva-tabela'",
            "      'section-chuva-resumo',\r\n      'section-chuva-cards',\r\n      'section-chuva-tabela',\r\n      'section-chuva-historico'",
        )
        # Atualiza thead caso já tenha sido inserido
    old_thead = """          <thead class="sticky top-0 z-20 bg-[#1e293b] text-white font-black uppercase text-[10.5px] border-b-2 border-[#0f172a] shadow-xs">
            <tr>
              <th class="p-3 text-center w-14">DIA</th>
              <th class="p-3 text-center w-28">MÊS</th>
              <th class="p-3 text-center w-16">ANO</th>
              <th class="p-3 text-center w-28 bg-[#0f172a]">HORÁRIO</th>
              <th class="p-3 text-center w-44 bg-sky-950 text-sky-200">CHUVA EM MM POR HORA<br><span class="text-[9px] font-normal text-sky-300">(Média Rede, Máx &amp; Totais)</span></th>
              <th class="p-3 w-64 bg-emerald-950 text-emerald-200">VENTO: VELOCIDADE, DIREÇÃO E RAJADAS POR HORA<br><span class="text-[9px] font-normal text-emerald-300">(km/h, Cardeal/Graus e Pico)</span></th>
              <th class="p-3 min-w-[230px]">SISTEMA ATUANTE REGISTRADO NAQUELE DIA</th>
              <th class="p-3 min-w-[230px]">SISTEMA ATUANTE REGISTRADO DAQUELE MÊS</th>
              <th class="p-3 min-w-[270px]">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE DIA</th>
              <th class="p-3 min-w-[270px]">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE MÊS</th>
            </tr>
          </thead>"""
    new_thead = """          <thead class="sticky top-0 z-20 bg-[#e2e8f0] dark:bg-slate-800 text-black dark:text-white font-black uppercase text-[10.5px] border-b-2 border-[#64748b] shadow-xs">
            <tr>
              <th class="p-2.5 text-center w-14 text-black dark:text-white">DIA</th>
              <th class="p-2.5 text-center w-28 text-black dark:text-white">MÊS</th>
              <th class="p-2.5 text-center w-16 text-black dark:text-white">ANO</th>
              <th class="p-2.5 text-center w-28 bg-[#cbd5e1] dark:bg-slate-700 text-black dark:text-white">HORÁRIO</th>
              <th class="p-2.5 text-center w-44 bg-[#e0f2fe] dark:bg-sky-950 text-sky-950 dark:text-sky-200">CHUVA EM MM POR HORA<br><span class="text-[9px] font-bold text-sky-800 dark:text-sky-300">(Média Rede, Máx &amp; Totais)</span></th>
              <th class="p-2.5 w-64 bg-[#dcfce7] dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200">VENTO: VELOCIDADE, DIREÇÃO E RAJADAS POR HORA<br><span class="text-[9px] font-bold text-emerald-800 dark:text-emerald-300">(km/h, Cardeal/Graus e Pico)</span></th>
              <th class="p-2.5 min-w-[210px] text-black dark:text-white">SISTEMA ATUANTE REGISTRADO NAQUELE DIA</th>
              <th class="p-2.5 min-w-[220px] text-black dark:text-white">SISTEMA ATUANTE REGISTRADO DAQUELE MÊS</th>
              <th class="p-2.5 min-w-[260px] text-black dark:text-white">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE DIA</th>
              <th class="p-2.5 min-w-[260px] text-black dark:text-white">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE MÊS</th>
            </tr>
          </thead>"""
    txt = txt.replace(old_thead, new_thead)

    p.write_text(txt, encoding="utf-8")
        print("[OK] js/app.js SUB_SECTIONS_CONFIG atualizado.")


def patch_index_html():
    p = BASE_DIR / "index.html"
    txt = p.read_text(encoding="utf-8")

    # 1. Botão rápido no cabeçalho institucional (ao lado de Boletim PDF)
    header_btn = """        <!-- Planilha Histórica das Estações (Outubro/2026 até Hoje) -->
        <button id="header-btn-historico-planilha" onclick="window.openHistoricoPlanilha(event)" class="btn-action-slate flex items-center gap-1.5 px-2 sm:px-3 text-xs font-extrabold cursor-pointer whitespace-nowrap bg-[#ffebe4] hover:bg-[#fed7cc] border border-[#f07a53]" title="Abrir e Baixar Histórico Diário e Horário das Estações em Planilha (Desde Outubro/2026)">
          <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-[#ea580c]"></i>
          <span class="hidden md:inline text-black">Histórico</span> <span class="text-black font-black">(Planilha)</span>
        </button>"""

    if 'id="header-btn-historico-planilha"' not in txt:
        anchor_header = '<!-- Meteogramas Numéricos INMET & CPTEC (Ceramic Stoneware) -->'
        txt = txt.replace(anchor_header, header_btn + "\n\n        " + anchor_header, 1)
        print("[OK] Botão Histórico (Planilha) inserido no cabeçalho institucional.")

    # 2. Item no dropdown Previsão & Tempo
    dropdown_prev_item = """            <a onclick="window.openHistoricoPlanilha(event)" class="nav-dropdown-item cursor-pointer bg-[#f0f9ff] hover:bg-[#e0f2fe] border border-sky-200 rounded-xl my-0.5">
              <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-[#0284c7] shrink-0"></i>
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="font-extrabold text-sky-950 dark:text-sky-200">Histórico das Estações (Planilha)</span>
                  <span class="text-[9px] font-black px-1.5 py-0.2 rounded bg-sky-200 text-sky-900 uppercase">XLSX / CSV</span>
                </div>
                <span class="nav-dropdown-item-desc">Planilha horária, diária e mensal desde Out/2026 com chuva, ventos, sistemas e totais</span>
              </div>
            </a>"""

    if "Histórico das Estações (Planilha)" not in txt:
        anchor_prev = """<a onclick="navigateSubSection('previsao', 'section-plancon-resumo', event)" class="nav-dropdown-item cursor-pointer">"""
        txt = txt.replace(anchor_prev, dropdown_prev_item + "\n            " + anchor_prev, 1)
        print("[OK] Item Histórico das Estações (Planilha) inserido no menu Previsão & Tempo.")

    # 3. Item no dropdown Acumulados Chuva
    dropdown_chuva_item = """            <a id="nav-item-chuva-historico" onclick="navigateSubSection('chuva', 'section-chuva-historico', event)" class="nav-dropdown-item cursor-pointer bg-[#fff7ed] hover:bg-[#ffedd5] border border-[#fed7aa] rounded-xl my-0.5">
              <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-[#ea580c] shrink-0"></i>
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="font-extrabold text-[#9a3412] dark:text-amber-300">Histórico em Planilha (Out/2026 até Hoje)</span>
                  <span class="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 uppercase">Baixar</span>
                </div>
                <span class="nav-dropdown-item-desc">Hora a hora, totais do dia e do mês, ventos, rajadas e sistemas atuantes</span>
              </div>
            </a>"""

    if 'id="nav-item-chuva-historico"' not in txt:
        anchor_chuva = """<a onclick="navigateSubSection('chuva', 'section-chuva-tabela', event)" class="nav-dropdown-item">"""
        txt = txt.replace(anchor_chuva, anchor_chuva.replace('class="nav-dropdown-item"', 'class="nav-dropdown-item cursor-pointer"'), 1)
        anchor_chuva_share = """<a onclick="window.closeAllNavDropdowns(); window.switchAppTab('chuva'); window.openSocialModal && window.openSocialModal()" class="nav-dropdown-item">"""
        txt = txt.replace(anchor_chuva_share, dropdown_chuva_item + "\n            " + anchor_chuva_share, 1)
        print("[OK] Item Histórico em Planilha inserido no menu Acumulados Chuva.")

    # 4. Atalho direto dentro de #section-chuva-resumo para abrir a Planilha Histórica
    banner_atalho_resumo = """      <!-- Banner de Acesso Rápido ao Histórico Completo em Planilha (Desde Outubro/2026) -->
      <div class="p-3.5 rounded-2xl bg-gradient-to-r from-[#fff7ed] via-[#ffedd5] to-[#f0f9ff] dark:from-slate-800 dark:to-slate-800 border-2 border-[#f07a53] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div class="flex items-start sm:items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-[#ea580c] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <i data-lucide="file-spreadsheet" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-xs sm:text-sm font-black text-black dark:text-white">Histórico Completo das Estações em Planilha (Alimentação Diária)</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">OUTUBRO/2026 ATÉ HOJE</span>
            </div>
            <p class="text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">
              Consulte quanto choveu e o comportamento do vento/rajadas em qualquer dia e horário, com totais diários, totais mensais, sistemas atuantes e download em Excel (.XLSX) e .CSV.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0 flex-wrap">
          <button onclick="window.openHistoricoPlanilha(event)" class="px-3.5 py-2 rounded-xl text-xs font-black bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-xs cursor-pointer transition flex items-center gap-1.5">
            <i data-lucide="table-2" class="w-4 h-4"></i>
            <span>Abrir Planilha & Consultar Datas</span>
          </button>
          <a href="docs/historico_estacoes_rio_das_ostras.xlsx" download="Historico_Estacoes_Rio_das_Ostras.xlsx" class="px-3 py-2 rounded-xl text-xs font-black bg-white hover:bg-slate-100 text-black border border-[#94a3b8] shadow-2xs flex items-center gap-1.5">
            <i data-lucide="download" class="w-3.5 h-3.5 text-emerald-700"></i>
            <span>Baixar Excel (.XLSX)</span>
          </a>
        </div>
      </div>"""

    if "Histórico Completo das Estações em Planilha (Alimentação Diária)" not in txt:
        target_resumo_div = '<div id="section-chuva-resumo" class="modern-card p-5 sm:p-6 bg-white border border-[#94a3b8] space-y-5 shadow-xs">'
        txt = txt.replace(target_resumo_div, target_resumo_div + "\n" + banner_atalho_resumo, 1)
        print("[OK] Banner de atalho inserido em #section-chuva-resumo.")

    # 5. Seção completa #section-chuva-historico
    section_historico_html = """
    <!-- ========================================================================= -->
    <!-- SEÇÃO 4: HISTÓRICO OFICIAL EM FORMATO DE PLANILHA (DESDE OUTUBRO/2026)     -->
    <!-- ========================================================================= -->
    <div id="section-chuva-historico" class="modern-card p-4 sm:p-6 bg-white dark:bg-slate-900 border-2 border-[#f07a53] space-y-5 shadow-sm hidden">

      <!-- Cabeçalho e Botões de Download da Planilha -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div class="flex items-start gap-3">
          <div class="medallion-title-orange w-11 h-11 rounded-2xl flex items-center justify-center text-black shadow-xs shrink-0">
            <i data-lucide="file-spreadsheet" class="w-5 h-5 text-black"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-base sm:text-lg font-black text-black dark:text-white tracking-tight font-heading">
                Histórico das Estações em Planilha (Horário, Diário e Mensal)
              </h3>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase">
                Alimentação Diária Automática
              </span>
            </div>
            <p class="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">
              Dados registrados pelas estações meteorológicas de Rio das Ostras (Praia da Tartaruga, Cantagalo, Costazul, Rocha Leão e Praiamar) desde <strong>01/10/2026 até Hoje</strong>, incluindo totais diários, totais mensais, sistemas sinóticos atuantes e características meteorológicas.
            </p>
            <div class="flex items-center gap-2 mt-1.5 flex-wrap">
              <span id="hist-last-update-badge" class="text-[11px] font-mono font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-sky-200 dark:border-slate-700">
                Sincronizando histórico...
              </span>
              <span id="hist-rows-count-badge" class="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
                Carregando registros...
              </span>
            </div>
          </div>
        </div>

        <!-- Botões de Download da Planilha (Excel .XLSX, .CSV Completo e .CSV Filtrado) -->
        <div class="flex items-center gap-2 flex-wrap shrink-0">
          <a
            href="docs/historico_estacoes_rio_das_ostras.xlsx"
            download="Historico_Estacoes_Rio_das_Ostras_Out_Nov_2026.xlsx"
            id="btn-download-historico-xlsx"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 border border-emerald-900 transition shadow-xs cursor-pointer"
            title="Baixar Planilha Excel Completa (.XLSX) com 3 Abas: Histórico Horário + Totais Diários + Totais Mensais"
          >
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>Baixar Planilha Excel (.XLSX)</span>
          </a>

          <a
            href="docs/historico_estacoes_rio_das_ostras.csv"
            download="Historico_Estacoes_Rio_das_Ostras_Out_Nov_2026.csv"
            id="btn-download-historico-csv"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-black bg-[#ffebe4] hover:bg-[#fed7cc] border-2 border-[#f07a53] transition shadow-2xs cursor-pointer"
            title="Baixar Planilha Completa em formato .CSV compatível com Excel"
          >
            <i data-lucide="file-down" class="w-4 h-4 text-[#ea580c]"></i>
            <span>Baixar Planilha Completa (.CSV)</span>
          </a>

          <button
            type="button"
            onclick="exportFilteredHistoricoCSV()"
            id="btn-download-historico-filtrado"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition cursor-pointer"
            title="Baixar apenas o mês ou dia filtrado na tela com seus respectivos totais"
          >
            <i data-lucide="filter" class="w-3.5 h-3.5 text-sky-700"></i>
            <span>Baixar Filtro Atual (.CSV)</span>
          </button>
        </div>
      </div>

      <!-- Painel Consolidado de Totais e Características por Mês (Outubro/2026 e Novembro/2026) -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <i data-lucide="calendar-check" class="w-4 h-4 text-[#ea580c]"></i>
            <span>Totais Mensais Consolidados, Sistemas Atuantes e Características de Cada Mês</span>
          </h4>
        </div>
        <div id="hist-monthly-cards-container" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Preenchido via js/historico_planilha.js -->
        </div>
      </div>

      <!-- Barra de Pesquisa e Filtros ("Quanto choveu em determinado dia?") -->
      <div class="p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/80 border border-[#cbd5e1] dark:border-slate-700 space-y-3">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-slate-700 pb-3">
          <div class="flex items-center gap-2">
            <i data-lucide="search" class="w-4 h-4 text-[#ea580c]"></i>
            <span class="text-xs sm:text-sm font-black text-black dark:text-white">
              Pesquisar Dia Específico, Filtrar por Mês ou Alternar Modo de Visão da Planilha
            </span>
          </div>

          <!-- Alternador de Visão da Planilha -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <button type="button" id="btn-hist-view-horario" onclick="setHistoricoViewMode('horario')" class="px-3 py-1.5 rounded-xl text-xs font-black bg-[#ffebe4] text-black border-2 border-[#f07a53] shadow-2xs cursor-pointer transition">
              Horário Completo + Totais
            </button>
            <button type="button" id="btn-hist-view-diario" onclick="setHistoricoViewMode('diario')" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-[#cbd5e1] hover:bg-slate-100 cursor-pointer transition">
              Totais Diários (1 Linha/Dia)
            </button>
            <button type="button" id="btn-hist-view-mensal" onclick="setHistoricoViewMode('mensal')" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-[#cbd5e1] hover:bg-slate-100 cursor-pointer transition">
              Totais Mensais
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <!-- Filtro 1: Mês -->
          <div>
            <label for="hist-filter-month" class="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase mb-1">
              1. Filtrar por Mês Registrado
            </label>
            <select id="hist-filter-month" onchange="onHistoricoFilterChange('month')" class="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-[#94a3b8] text-black dark:text-white">
              <option value="all">Todos os Meses (Outubro/2026 até Hoje)</option>
            </select>
          </div>

          <!-- Filtro 2: Selecionar Dia da Lista -->
          <div>
            <label for="hist-filter-day-select" class="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase mb-1">
              2. Escolher Dia na Planilha (Out/Nov)
            </label>
            <select id="hist-filter-day-select" onchange="onHistoricoFilterChange('day_select')" class="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-[#94a3b8] text-black dark:text-white">
              <option value="">Todos os Dias do Período</option>
            </select>
          </div>

          <!-- Filtro 3: Pesquisar Qualquer Data no Calendário (Inclusive antes de Out/2026, ex: 05/02/2026) -->
          <div>
            <label for="hist-filter-date-input" class="block text-[11px] font-black text-[#9a3412] dark:text-amber-300 uppercase mb-1">
              3. Pesquisar Data Específica (Ex: 05/02/2026)
            </label>
            <input
              type="date"
              id="hist-filter-date-input"
              min="2026-01-01"
              max="2026-12-31"
              onchange="onHistoricoFilterChange('date_input')"
              class="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border-2 border-[#f07a53] text-black dark:text-white"
            />
          </div>

          <!-- Filtro 4: Opções Extras e Ordem -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between gap-2">
              <label class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input type="checkbox" id="hist-filter-rain-only" onchange="onHistoricoFilterChange('rain')" class="rounded border-slate-400 text-sky-600 focus:ring-sky-500" />
                <span>Apenas c/ chuva (&gt; 0 mm)</span>
              </label>
              <button type="button" onclick="clearHistoricoFilters()" class="text-[11px] font-bold text-[#ea580c] hover:underline cursor-pointer">
                Limpar Filtros
              </button>
            </div>
            <select id="hist-filter-sort" onchange="onHistoricoFilterChange('sort')" class="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-[#cbd5e1] text-slate-800 dark:text-white">
              <option value="asc">Ordem Cronológica (01/10/2026 → Hoje)</option>
              <option value="desc">Mais Recentes Primeiro (Hoje → 01/10/2026)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Card Dinâmico de Diagnóstico Quando um Dia Específico é Selecionado -->
      <div id="hist-selected-day-card" class="hidden"></div>

      <!-- Tabela Principal em Formato de Planilha com Cabeçalho Fixo e Rodapé de Totais -->
      <div class="overflow-x-auto max-h-[680px] overflow-y-auto rounded-2xl border-2 border-[#94a3b8] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs">
        <table id="historico-planilha-table" class="w-full text-left text-xs border-collapse">
          <thead class="sticky top-0 z-20 bg-[#1e293b] text-white font-black uppercase text-[10.5px] border-b-2 border-[#0f172a] shadow-xs">
            <tr>
              <th class="p-3 text-center w-14">DIA</th>
              <th class="p-3 text-center w-28">MÊS</th>
              <th class="p-3 text-center w-16">ANO</th>
              <th class="p-3 text-center w-28 bg-[#0f172a]">HORÁRIO</th>
              <th class="p-3 text-center w-44 bg-sky-950 text-sky-200">CHUVA EM MM POR HORA<br><span class="text-[9px] font-normal text-sky-300">(Média Rede, Máx &amp; Totais)</span></th>
              <th class="p-3 w-64 bg-emerald-950 text-emerald-200">VENTO: VELOCIDADE, DIREÇÃO E RAJADAS POR HORA<br><span class="text-[9px] font-normal text-emerald-300">(km/h, Cardeal/Graus e Pico)</span></th>
              <th class="p-3 min-w-[230px]">SISTEMA ATUANTE REGISTRADO NAQUELE DIA</th>
              <th class="p-3 min-w-[230px]">SISTEMA ATUANTE REGISTRADO DAQUELE MÊS</th>
              <th class="p-3 min-w-[270px]">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE DIA</th>
              <th class="p-3 min-w-[270px]">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE MÊS</th>
            </tr>
          </thead>
          <tbody id="historico-planilha-tbody" class="divide-y divide-slate-200 dark:divide-slate-800 text-black dark:text-slate-100">
            <tr>
              <td colspan="10" class="p-8 text-center font-bold text-slate-500">
                Carregando planilha histórica das estações de Rio das Ostras...
              </td>
            </tr>
          </tbody>
          <tfoot id="historico-planilha-tfoot" class="sticky bottom-0 z-20 shadow-md">
          </tfoot>
        </table>
      </div>

    </div> <!-- /#section-chuva-historico -->
"""

    if 'id="section-chuva-historico"' not in txt:
        anchor_end_chuva = '</div> <!-- /#view-tab-chuva -->'
        txt = txt.replace(anchor_end_chuva, section_historico_html + "\n\n  " + anchor_end_chuva, 1)
        print("[OK] Seção #section-chuva-historico inserida em #view-tab-chuva.")

    # 6. Atualiza SUB_SECTIONS_CONFIG inline em index.html
    txt = txt.replace(
        "sections: ['section-chuva-resumo', 'section-chuva-cards', 'section-chuva-tabela']",
        "sections: ['section-chuva-resumo', 'section-chuva-cards', 'section-chuva-tabela', 'section-chuva-historico']",
    )

    # 7. Inclui script js/historico_planilha.js?v=200 e atualiza versão de app.js
    if '<script src="js/historico_planilha.js' not in txt:
        txt = txt.replace(
            '<script type="module" src="js/app.js?v=199"></script>',
            '<script src="js/historico_planilha.js?v=200"></script>\n  <script type="module" src="js/app.js?v=200"></script>',
        )
        txt = txt.replace(
            '<script type="module" src="js/app.js?v=200"></script>',
            '<script src="js/historico_planilha.js?v=200"></script>\n  <script type="module" src="js/app.js?v=200"></script>',
        )

    # Atualiza thead caso já tenha sido inserido
    old_thead = """          <thead class="sticky top-0 z-20 bg-[#1e293b] text-white font-black uppercase text-[10.5px] border-b-2 border-[#0f172a] shadow-xs">
            <tr>
              <th class="p-3 text-center w-14">DIA</th>
              <th class="p-3 text-center w-28">MÊS</th>
              <th class="p-3 text-center w-16">ANO</th>
              <th class="p-3 text-center w-28 bg-[#0f172a]">HORÁRIO</th>
              <th class="p-3 text-center w-44 bg-sky-950 text-sky-200">CHUVA EM MM POR HORA<br><span class="text-[9px] font-normal text-sky-300">(Média Rede, Máx &amp; Totais)</span></th>
              <th class="p-3 w-64 bg-emerald-950 text-emerald-200">VENTO: VELOCIDADE, DIREÇÃO E RAJADAS POR HORA<br><span class="text-[9px] font-normal text-emerald-300">(km/h, Cardeal/Graus e Pico)</span></th>
              <th class="p-3 min-w-[230px]">SISTEMA ATUANTE REGISTRADO NAQUELE DIA</th>
              <th class="p-3 min-w-[230px]">SISTEMA ATUANTE REGISTRADO DAQUELE MÊS</th>
              <th class="p-3 min-w-[270px]">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE DIA</th>
              <th class="p-3 min-w-[270px]">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE MÊS</th>
            </tr>
          </thead>"""
    new_thead = """          <thead class="sticky top-0 z-20 bg-[#e2e8f0] dark:bg-slate-800 text-black dark:text-white font-black uppercase text-[10.5px] border-b-2 border-[#64748b] shadow-xs">
            <tr>
              <th class="p-2.5 text-center w-14 text-black dark:text-white">DIA</th>
              <th class="p-2.5 text-center w-28 text-black dark:text-white">MÊS</th>
              <th class="p-2.5 text-center w-16 text-black dark:text-white">ANO</th>
              <th class="p-2.5 text-center w-28 bg-[#cbd5e1] dark:bg-slate-700 text-black dark:text-white">HORÁRIO</th>
              <th class="p-2.5 text-center w-44 bg-[#e0f2fe] dark:bg-sky-950 text-sky-950 dark:text-sky-200">CHUVA EM MM POR HORA<br><span class="text-[9px] font-bold text-sky-800 dark:text-sky-300">(Média Rede, Máx &amp; Totais)</span></th>
              <th class="p-2.5 w-64 bg-[#dcfce7] dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200">VENTO: VELOCIDADE, DIREÇÃO E RAJADAS POR HORA<br><span class="text-[9px] font-bold text-emerald-800 dark:text-emerald-300">(km/h, Cardeal/Graus e Pico)</span></th>
              <th class="p-2.5 min-w-[210px] text-black dark:text-white">SISTEMA ATUANTE REGISTRADO NAQUELE DIA</th>
              <th class="p-2.5 min-w-[220px] text-black dark:text-white">SISTEMA ATUANTE REGISTRADO DAQUELE MÊS</th>
              <th class="p-2.5 min-w-[260px] text-black dark:text-white">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE DIA</th>
              <th class="p-2.5 min-w-[260px] text-black dark:text-white">CARACTERÍSTICAS METEOROLÓGICAS REGISTRADAS DAQUELE MÊS</th>
            </tr>
          </thead>"""
    txt = txt.replace(old_thead, new_thead)

    p.write_text(txt, encoding="utf-8")
    print("[OK] index.html atualizado para v200 com sucesso.")


if __name__ == "__main__":
    patch_workflow()
    patch_auto_bulletin()
    patch_app_js()
    patch_index_html()
