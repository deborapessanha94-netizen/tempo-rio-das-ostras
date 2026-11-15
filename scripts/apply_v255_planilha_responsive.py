# -*- coding: utf-8 -*-
import os
import re

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
app_path = os.path.join(base_dir, "src", "App.tsx")

with open(app_path, "r", encoding="utf-8") as f:
    app_code = f.read()

# 1. Update Sub-aba 4: Histórico Completo das Estações em Planilha
old_planilha_header_buttons = """                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {historico?.arquivos_planilha && (
                      <>
                        <a
                          href={`${SITE_BASE}/${historico.arquivos_planilha.xlsx}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FF8244] transition-colors whitespace-nowrap"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5 text-[#FF8244]" />
                          Excel (.XLSX)
                        </a>
                        <a
                          href={`${SITE_BASE}/${historico.arquivos_planilha.csv}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FF8244] transition-colors whitespace-nowrap"
                        >
                          Planilha Completa (.CSV)
                        </a>
                      </>
                    )}
                    <button
                      onClick={handleDownloadFilteredHistCsv}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-[#E5E5E5] hover:border-[#FF8244] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Filtro Atual (.CSV)
                    </button>
                  </div>"""

new_planilha_header_buttons = """                  <div className="w-full sm:w-auto grid grid-cols-3 sm:flex sm:items-center gap-1.5 shrink-0 pt-2 sm:pt-0">
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
                  </div>"""

app_code = app_code.replace(old_planilha_header_buttons, new_planilha_header_buttons)

# Update mode buttons in planilha
old_mode_buttons = """                    <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg">
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
                              ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-semibold'
                              : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white font-medium'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>"""

new_mode_buttons = """                    <div className="w-full sm:w-auto grid grid-cols-3 sm:flex sm:items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg">
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
                    </div>"""

app_code = app_code.replace(old_mode_buttons, new_mode_buttons)

# Update filter controls layout
old_filters = """                  {historyMode !== 'mensal' && (
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
                        className="w-44 px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF8244]"
                      />

                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] cursor-pointer whitespace-nowrap">
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
                        className="px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] font-mono cursor-pointer hover:border-[#FF8244] transition-colors whitespace-nowrap"
                      >
                        {histSortOrder === 'desc' ? 'Mais Recentes ↓' : 'Cronológica ↑'}
                      </button>
                    </div>
                  )}"""

new_filters = """                  {historyMode !== 'mensal' && (
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
                  )}"""

app_code = app_code.replace(old_filters, new_filters)

# Now update the table area in planilha to provide mobile cards
old_table_block = """                <div className="overflow-x-auto">
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
                              <div className="space-y-0.5">
                                <div>{h.vento_rajada_max_kmh ? `${h.vento_rajada_max_kmh.toFixed(1)} km/h` : '--'}</div>
                                {h.vento_dir && <div className="text-[10px] text-slate-500">{h.vento_dir}</div>}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap text-xs align-top">
                              <div>{h.temperatura_c !== null ? `${h.temperatura_c.toFixed(1)}°C` : '--'}</div>
                              <div className="text-[10px] text-slate-500">
                                {h.umidade_pct !== null ? `${h.umidade_pct}%` : '--'} ·{' '}
                                {h.pressao_hpa !== null ? `${h.pressao_hpa.toFixed(0)}hPa` : '--'}
                              </div>
                            </td>
                            <td className="py-3.5 pl-4 text-slate-600 dark:text-[#E5E5E5]/80 align-top leading-relaxed">
                              <div className="font-medium text-[#14213D] dark:text-white">
                                {h.categoria_sistema || h.sistema_atuante_dia || '--'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>"""

new_table_block = """                {/* Visualização de Dados (Mobile Cards vs Desktop Table) */}
                <div>
                  {historyMode === 'mensal' ? (
                    <div className="space-y-4">
                      {/* Mobile Cards (md:hidden) */}
                      <div className="md:hidden space-y-3">
                        {(historico?.resumo_mensal ?? []).map((m) => (
                          <div key={m.ano_mes} className="p-3.5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-2.5 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-[#E5E5E5]/60 dark:border-[#233354]/60 pb-2">
                              <span className="font-display font-bold text-sm text-[#14213D] dark:text-white">{m.rotulo_mes}</span>
                              <span className="font-mono text-xs font-bold text-[#FF8244] bg-[#FF8244]/10 px-2 py-0.5 rounded-md border border-[#FF8244]/30">
                                {m.chuva_total_media_mm.toFixed(1)} mm média
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-500 dark:text-[#E5E5E5]/60">Maior Estação:</span>
                                <div className="font-mono font-bold text-blue-500">{m.chuva_maior_estacao_mm.toFixed(1)} mm</div>
                                <div className="text-[11px] text-slate-600 dark:text-[#E5E5E5]/75 truncate">{m.chuva_maior_estacao_nome}</div>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 dark:text-[#E5E5E5]/60">Dias c/ Chuva:</span>
                                <div className="font-mono font-semibold text-[#14213D] dark:text-white">{m.dias_com_chuva} de {m.dias_registrados} dias</div>
                                <div className="text-[11px] text-slate-500 truncate">{m.dia_mais_chuvoso}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table (hidden md:block) */}
                      <div className="hidden md:block overflow-x-auto">
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
                      </div>
                    </div>
                  ) : historyMode === 'diario' ? (
                    <div>
                      {/* Mobile Cards (md:hidden) */}
                      <div className="md:hidden space-y-2.5">
                        {filteredHistDaily.slice(0, 45).map((d) => (
                          <div
                            key={d.data_br}
                            className="p-3.5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-2 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#FF8244]" />
                                <span className="font-mono font-bold text-sm text-[#14213D] dark:text-white">{d.data_br}</span>
                              </div>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                                  d.chuva_total_media_mm > 0
                                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                    : 'bg-slate-200/50 dark:bg-[#14213D] text-slate-500 dark:text-[#E5E5E5]/60'
                                }`}
                              >
                                {d.chuva_total_media_mm.toFixed(1)} mm média
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#E5E5E5]/60 dark:border-[#233354]/60 text-xs">
                              <div className="space-y-0.5 min-w-0">
                                <span className="text-[10px] text-slate-500 dark:text-[#E5E5E5]/60">Pico da Rede:</span>
                                <div className="font-mono font-bold text-[#FF8244]">
                                  {d.chuva_maior_estacao_mm.toFixed(1)} mm
                                </div>
                                <div className="text-[11px] text-slate-600 dark:text-[#E5E5E5]/75 truncate" title={d.chuva_maior_estacao_nome}>
                                  {d.chuva_maior_estacao_nome}
                                </div>
                              </div>

                              <div className="space-y-0.5 min-w-0">
                                <span className="text-[10px] text-slate-500 dark:text-[#E5E5E5]/60">Vento &amp; Temp:</span>
                                <div className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                                  {d.vento_rajada_max_kmh ? `${d.vento_rajada_max_kmh.toFixed(0)} km/h ${d.vento_dir_predominante || ''}` : '--'}
                                </div>
                                <div className="font-mono text-slate-600 dark:text-[#E5E5E5]/75">
                                  {d.temp_min_c !== undefined && d.temp_max_c !== undefined
                                    ? `${d.temp_min_c.toFixed(0)}° / ${d.temp_max_c.toFixed(0)}°C`
                                    : '--'}
                                </div>
                              </div>
                            </div>

                            {(d.categoria_sistema || d.sistema_atuante_dia) && (
                              <div className="pt-1.5 border-t border-[#E5E5E5]/50 dark:border-[#233354]/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-[#E5E5E5]/70">
                                <span className="truncate pr-2">{d.categoria_sistema || d.sistema_atuante_dia}</span>
                                <span className="font-mono shrink-0">{d.horas_com_chuva}h c/ chuva</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table (hidden md:block) */}
                      <div className="hidden md:block overflow-x-auto">
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
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Mobile Cards (md:hidden) */}
                      <div className="md:hidden space-y-2.5">
                        {filteredHistHourly.slice(0, 50).map((h) => (
                          <div
                            key={`${h.data_iso}-${h.horario}`}
                            className="p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1.5 shadow-2xs text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-[#14213D] dark:text-white">
                                {h.data_br} · <strong className="text-[#FF8244]">{h.horario}</strong>
                              </span>
                              <span className={`font-mono font-bold ${h.chuva_mm_hora > 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                                {h.chuva_mm_hora.toFixed(1)} mm/h
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 pt-1 border-t border-[#E5E5E5]/50 dark:border-[#233354]/50">
                              <span className="truncate max-w-[180px]">{h.chuva_max_estacao_nome} ({h.chuva_max_estacao_mm.toFixed(1)}mm)</span>
                              <span>{h.temperatura_c !== null ? `${h.temperatura_c.toFixed(0)}°C` : '--'} · {h.vento_rajada_max_kmh ? `${h.vento_rajada_max_kmh.toFixed(0)}km/h` : '--'}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table (hidden md:block) */}
                      <div className="hidden md:block overflow-x-auto">
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
                                  <div className="space-y-0.5">
                                    <div>{h.vento_rajada_max_kmh ? `${h.vento_rajada_max_kmh.toFixed(1)} km/h` : '--'}</div>
                                    {h.vento_dir && <div className="text-[10px] text-slate-500">{h.vento_dir}</div>}
                                  </div>
                                </td>
                                <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap text-xs align-top">
                                  <div>{h.temperatura_c !== null ? `${h.temperatura_c.toFixed(1)}°C` : '--'}</div>
                                  <div className="text-[10px] text-slate-500">
                                    {h.umidade_pct !== null ? `${h.umidade_pct}%` : '--'} ·{' '}
                                    {h.pressao_hpa !== null ? `${h.pressao_hpa.toFixed(0)}hPa` : '--'}
                                  </div>
                                </td>
                                <td className="py-3.5 pl-4 text-slate-600 dark:text-[#E5E5E5]/80 align-top leading-relaxed">
                                  <div className="font-medium text-[#14213D] dark:text-white">
                                    {h.categoria_sistema || h.sistema_atuante_dia || '--'}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>"""

app_code = app_code.replace(old_table_block, new_table_block)

with open(app_path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(app_code)

print("Updated Planilha section with responsive controls and mobile cards!")
