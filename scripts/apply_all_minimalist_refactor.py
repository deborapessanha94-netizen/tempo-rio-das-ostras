import re

app_path = "src/App.tsx"
with open(app_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. PLANCON: replace purple dot with rose-600
content = content.replace("maximo: 'bg-purple-500'", "maximo: 'bg-rose-600'")
content = content.replace("purple: 'bg-purple-500'", "purple: 'bg-rose-600'")

# 2. CHUVA: Replace the 3 top action buttons
old_chuva_btns = """                  {/* Ações Rápidas: Imagens Oficiais para Redes Sociais */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => (window as any).openSocialModalChuva?.(`${rainHorizonHours}h`)}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-[#9a3412] dark:text-[#ea580c] shadow-xs hover:brightness-95 active:scale-95"
                      title="Exportar imagem oficial de Acumulados de Chuva para Instagram / WhatsApp"
                    >
                      <CloudRain className="w-3.5 h-3.5 text-[#ea580c]" />
                      <span>Card de Chuva</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => (window as any).openSocialModalVento?.()}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer bg-[#e0f2fe] border-2 border-[#0284c7] text-[#0369a1] dark:text-[#0284c7] shadow-xs hover:brightness-95 active:scale-95"
                      title="Exportar imagem oficial dos Maiores Ventos e Rajadas para Instagram / WhatsApp"
                    >
                      <Wind className="w-3.5 h-3.5 text-[#0284c7]" />
                      <span>Card Ventos & Rajadas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => (window as any).openSocialModalTempoAgora?.()}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer bg-[#fff7ed] border-2 border-[#ea580c] text-[#c2410c] dark:text-[#ea580c] shadow-xs hover:brightness-95 active:scale-95"
                      title="Exportar imagem oficial do Tempo Agora para Instagram / WhatsApp"
                    >
                      <SunMedium className="w-3.5 h-3.5 text-[#ea580c]" />
                      <span>Card Tempo Agora</span>
                    </button>
                  </div>"""

new_chuva_btns = """                  {/* Ações Rápidas: Imagens Oficiais para Redes Sociais */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => (window as any).openSocialModalChuva?.(`${rainHorizonHours}h`)}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition cursor-pointer bg-[#F7F8FA] hover:bg-slate-200 dark:bg-[#0B1324] dark:hover:bg-[#14213D] text-[#14213D] dark:text-[#E5E5E5] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] shadow-2xs active:scale-95"
                      title="Exportar imagem oficial de Acumulados de Chuva para Instagram / WhatsApp"
                    >
                      <CloudRain className="w-3.5 h-3.5 text-[#FCA311]" />
                      <span>Card de Chuva</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => (window as any).openSocialModalVento?.()}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition cursor-pointer bg-[#F7F8FA] hover:bg-slate-200 dark:bg-[#0B1324] dark:hover:bg-[#14213D] text-[#14213D] dark:text-[#E5E5E5] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] shadow-2xs active:scale-95"
                      title="Exportar imagem oficial dos Maiores Ventos e Rajadas para Instagram / WhatsApp"
                    >
                      <Wind className="w-3.5 h-3.5 text-[#FCA311]" />
                      <span>Card Ventos & Rajadas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => (window as any).openSocialModalTempoAgora?.()}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition cursor-pointer bg-[#F7F8FA] hover:bg-slate-200 dark:bg-[#0B1324] dark:hover:bg-[#14213D] text-[#14213D] dark:text-[#E5E5E5] border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] shadow-2xs active:scale-95"
                      title="Exportar imagem oficial do Tempo Agora para Instagram / WhatsApp"
                    >
                      <SunMedium className="w-3.5 h-3.5 text-[#FCA311]" />
                      <span>Card Tempo Agora</span>
                    </button>
                  </div>"""

# 3. BALNEABILIDADE: Summary cards & recommendation box
old_balnear_cards = """                {/* Resumo Próprias vs Impróprias + Critério CONAMA */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300">Praias Próprias para Banho</span>
                      <span className="inline-flex items-center gap-1.5 font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                        {balnearSummary.proprias.length} ({balnearSummary.pctProprias}%)
                      </span>
                    </div>
                    <p className="text-emerald-700 dark:text-emerald-300/80 leading-relaxed text-[11px]">
                      {balnearSummary.proprias.map((p) => p.praia.replace('Praia ', '').replace('da ', '').replace('das ', '').replace('do ', '')).join(', ')}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-rose-800 dark:text-rose-300">Praias Impróprias / Atenção</span>
                      <span className="inline-flex items-center gap-1.5 font-mono font-bold text-rose-700 dark:text-rose-400 tabular-nums">
                        <span className="w-2 h-2 rounded-full bg-rose-500" aria-hidden="true" />
                        {balnearSummary.improprias.length} ({balnearSummary.pctImproprias}%)
                      </span>
                    </div>
                    <p className="text-rose-700 dark:text-rose-300/80 leading-relaxed text-[11px]">
                      {balnearSummary.improprias.map((p) => `${p.praia} (${p.localizacao})`).join(' · ')}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-1.5">
                    <div className="font-semibold text-[#14213D] dark:text-[#FCA311]">Critério CONAMA nº 274/2000</div>
                    <p className="text-slate-600 dark:text-[#E5E5E5]/80 leading-relaxed text-[11px]">
                      Próprio se Enterococos ≤ 100 NMP/100 mL em ao menos 4 das últimas 5 coletas e &lt; 400 NMP/100 mL na coleta mais recente.
                    </p>
                  </div>
                </div>

                {balneabilidade?.observacao_tecnica && (
                  <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200">
                    <strong className="text-amber-950 dark:text-amber-100 font-semibold">Recomendação Oficial do INEA:</strong> {balneabilidade.observacao_tecnica}
                  </div>
                )}"""

new_balnear_cards = """                {/* Resumo Próprias vs Impróprias + Critério CONAMA */}
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
                    <div className="font-semibold text-[#14213D] dark:text-[#FCA311]">Critério CONAMA nº 274/2000</div>
                    <p className="text-slate-600 dark:text-[#E5E5E5]/80 leading-relaxed text-[11px]">
                      Próprio se Enterococos ≤ 100 NMP/100 mL em ao menos 4 das últimas 5 coletas e &lt; 400 NMP/100 mL na coleta mais recente.
                    </p>
                  </div>
                </div>

                {balneabilidade?.observacao_tecnica && (
                  <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs text-slate-700 dark:text-[#E5E5E5] flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#FCA311] shrink-0" />
                    <div>
                      <strong className="text-[#14213D] dark:text-white font-semibold">Recomendação Oficial do INEA:</strong> {balneabilidade.observacao_tecnica}
                    </div>
                  </div>
                )}"""

# 4. ALERTAS: Top sync banner
old_alerta_banner = """                {/* Banner de Garantia de Sincronia de Horários Oficiais */}
                <div className="p-3.5 rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 text-xs text-sky-900 dark:text-sky-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>
                      <strong>Sincronização Oficial INMET:</strong> Os horários de início e término respeitam rigorosamente os minutos exatos da publicação no portal do INMET (Horário Oficial de Brasília — UTC-3).
                    </span>
                  </div>
                  <a
                    href="https://alertas2.inmet.gov.br/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-300 hover:underline shrink-0 text-[11px]"
                  >
                    Portal INMET Alertas <ExternalLink className="w-3 h-3" />
                  </a>
                </div>"""

new_alerta_banner = """                {/* Banner de Garantia de Sincronia de Horários Oficiais */}
                <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs text-slate-700 dark:text-[#E5E5E5] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#FCA311] shrink-0" />
                    <span>
                      <strong className="text-[#14213D] dark:text-white">Sincronização Oficial INMET:</strong> Os horários de início e término respeitam rigorosamente os minutos exatos da publicação no portal do INMET (Horário Oficial de Brasília — UTC-3).
                    </span>
                  </div>
                  <a
                    href="https://alertas2.inmet.gov.br/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[#14213D] dark:text-[#FCA311] hover:underline shrink-0 text-[11px]"
                  >
                    Portal INMET Alertas <ExternalLink className="w-3 h-3" />
                  </a>
                </div>"""

# 5. ALERTAS: Filter buttons
old_alerta_filters = """                    <button
                      type="button"
                      onClick={() => setAlertaFiltroLocal('ostras')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                        alertaFiltroLocal === 'ostras'
                          ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black border-emerald-600 dark:border-emerald-500 shadow-xs'
                          : 'bg-white dark:bg-[#14213D] text-emerald-800 dark:text-emerald-300 border-[#E5E5E5] dark:border-[#233354] hover:border-emerald-500'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Apenas Rio das Ostras ({inmetAvisos.filter((a) => a.eh_direto_ostras !== false).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertaFiltroLocal('outros')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                        alertaFiltroLocal === 'outros'
                          ? 'bg-amber-600 dark:bg-amber-500 text-white dark:text-black border-amber-600 dark:border-amber-500 shadow-xs'
                          : 'bg-white dark:bg-[#14213D] text-amber-800 dark:text-amber-300 border-[#E5E5E5] dark:border-[#233354] hover:border-amber-500'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Outras Localidades do RJ ({inmetAvisos.filter((a) => a.eh_direto_ostras === false).length})
                    </button>"""

new_alerta_filters = """                    <button
                      type="button"
                      onClick={() => setAlertaFiltroLocal('ostras')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                        alertaFiltroLocal === 'ostras'
                          ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#0B1324] border-[#14213D] dark:border-[#FCA311] shadow-xs'
                          : 'bg-white dark:bg-[#14213D] text-slate-700 dark:text-[#E5E5E5] border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311]'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#FCA311]" />
                      Apenas Rio das Ostras ({inmetAvisos.filter((a) => a.eh_direto_ostras !== false).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertaFiltroLocal('outros')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                        alertaFiltroLocal === 'outros'
                          ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#0B1324] border-[#14213D] dark:border-[#FCA311] shadow-xs'
                          : 'bg-white dark:bg-[#14213D] text-slate-700 dark:text-[#E5E5E5] border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311]'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-[#FCA311]" />
                      Outras Localidades do RJ ({inmetAvisos.filter((a) => a.eh_direto_ostras === false).length})
                    </button>"""

# 6. ALERTAS: Badges inside alert cards
old_vigencia_class = "vigenciaBadgeClass = 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800 font-medium';"
new_vigencia_class = "vigenciaBadgeClass = 'bg-[#F7F8FA] dark:bg-[#0B1324] text-slate-600 dark:text-[#E5E5E5]/80 border-[#E5E5E5] dark:border-[#233354] font-medium';"

old_vigencia_now = "vigenciaBadgeClass = 'bg-amber-50 dark:bg-amber-950/40 text-[#FCA311] border-[#FCA311]/50 font-bold';"
new_vigencia_now = "vigenciaBadgeClass = 'bg-[#F7F8FA] dark:bg-[#0B1324] text-[#FCA311] border-[#FCA311]/50 font-bold';"

old_alerta_card_badges = """                                {av.eh_direto_ostras !== false ? (
                                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    Rio das Ostras (Válido no Município)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                    Outras Localidades do RJ (Não inclui Rio das Ostras)
                                  </span>
                                )}"""

new_alerta_card_badges = """                                {av.eh_direto_ostras !== false ? (
                                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-white border border-[#E5E5E5] dark:border-[#233354] flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-[#FCA311] shrink-0" />
                                    Rio das Ostras (Válido no Município)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-[#F7F8FA] dark:bg-[#0B1324] text-slate-500 dark:text-[#E5E5E5]/70 border border-[#E5E5E5] dark:border-[#233354] flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-slate-400 shrink-0" />
                                    Outras Localidades do RJ (Não inclui Rio das Ostras)
                                  </span>
                                )}"""

old_alerta_notice_box = """                            {av.eh_direto_ostras !== false ? (
                              <div className="p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>
                                  <strong>Válido em Rio das Ostras:</strong> O município está incluído diretamente no polígono de risco deste alerta oficial.
                                </span>
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>
                                  <strong>Apenas Outras Regiões do RJ:</strong> Este alerta NÃO abrange o município de Rio das Ostras (válido somente para outras localidades fluminenses).
                                </span>
                              </div>
                            )}"""

new_alerta_notice_box = """                            {av.eh_direto_ostras !== false ? (
                              <div className="p-2.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs text-slate-700 dark:text-[#E5E5E5]/90 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#FCA311] shrink-0" />
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
                            )}"""

# 7. BOLETIM: 8-day mini-cards
old_boletim_minicards = """                            <div
                              key={idx}
                              className={`p-2 rounded-lg border text-center flex flex-col justify-between items-center transition-all ${
                                isChuvaExpressiva
                                  ? 'bg-amber-50/80 dark:bg-amber-950/30 border-[#FCA311]/60 text-[#14213D] dark:text-white shadow-2xs'
                                  : d.val > 0
                                  ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800/40 text-slate-700 dark:text-[#E5E5E5]'
                                  : 'bg-[#F7F8FA] dark:bg-[#0B1324] border-[#E5E5E5] dark:border-[#233354] text-slate-400 dark:text-[#E5E5E5]/50'
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
                                      ? 'text-[#FCA311]'
                                      : d.val > 0
                                      ? 'text-sky-600 dark:text-sky-400'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {d.val.toFixed(1)}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400 ml-0.5">mm</span>
                              </div>
                              {isChuvaExpressiva ? (
                                <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-amber-500/20 text-[#FCA311]">
                                  Moderada
                                </span>
                              ) : d.val > 0 ? (
                                <span className="text-[8px] text-sky-600 dark:text-sky-400 font-medium">
                                  Leve
                                </span>
                              ) : (
                                <span className="text-[8px] text-slate-400 font-normal">Sem chuva</span>
                              )}
                            </div>"""

new_boletim_minicards = """                            <div
                              key={idx}
                              className={`p-2 rounded-lg border text-center flex flex-col justify-between items-center transition-all bg-[#F7F8FA] dark:bg-[#0B1324] ${
                                isChuvaExpressiva
                                  ? 'border-[#FCA311]/50 text-[#14213D] dark:text-white shadow-2xs'
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
                                      ? 'text-[#FCA311]'
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
                                <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-[#FCA311]/15 text-[#FCA311]">
                                  Moderada
                                </span>
                              ) : d.val > 0 ? (
                                <span className="text-[8px] text-slate-500 dark:text-[#E5E5E5]/70 font-medium">
                                  Leve
                                </span>
                              ) : (
                                <span className="text-[8px] text-slate-400 font-normal">Sem chuva</span>
                              )}
                            </div>"""

# 8. METEOGRAMAS: Badges for INMET and WaveWatch
old_inmet_badge = 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
new_inmet_badge = 'bg-[#F7F8FA] dark:bg-[#14213D] text-[#14213D] dark:text-[#FCA311] border border-[#E5E5E5] dark:border-[#233354]'

old_wwatch_badge = 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60'
new_wwatch_badge = 'bg-[#F7F8FA] dark:bg-[#14213D] text-[#14213D] dark:text-[#FCA311] border border-[#E5E5E5] dark:border-[#233354]'

# Apply all replacements with normalization
content_norm = content.replace("\r\n", "\n")

replacements = [
    ("chuva_btns", old_chuva_btns, new_chuva_btns),
    ("balnear_cards", old_balnear_cards, new_balnear_cards),
    ("alerta_banner", old_alerta_banner, new_alerta_banner),
    ("alerta_filters", old_alerta_filters, new_alerta_filters),
    ("vigencia_class", old_vigencia_class, new_vigencia_class),
    ("vigencia_now", old_vigencia_now, new_vigencia_now),
    ("alerta_card_badges", old_alerta_card_badges, new_alerta_card_badges),
    ("alerta_notice_box", old_alerta_notice_box, new_alerta_notice_box),
    ("boletim_minicards", old_boletim_minicards, new_boletim_minicards),
    ("inmet_badge", old_inmet_badge, new_inmet_badge),
    ("wwatch_badge", old_wwatch_badge, new_wwatch_badge),
]

for name, target, repl in replacements:
    t_norm = target.replace("\r\n", "\n")
    r_norm = repl.replace("\r\n", "\n")
    if t_norm in content_norm:
        content_norm = content_norm.replace(t_norm, r_norm, 1)
        print(f"OK: Replaced {name}")
    else:
        print(f"FAILED to find {name}")

with open(app_path, "w", encoding="utf-8") as f:
    f.write(content_norm)

print("Finished applying all minimalist color refactoring to App.tsx!")
