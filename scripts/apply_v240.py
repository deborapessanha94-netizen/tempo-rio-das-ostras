import re

app_path = "src/App.tsx"
with open(app_path, "r", encoding="utf-8") as f:
    content = f.read()

target = """                {balneabilidade?.observacao_tecnica && (
                  <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200">
                    <strong className="text-amber-950 dark:text-amber-100 font-semibold">Recomendação Oficial do INEA:</strong> {balneabilidade.observacao_tecnica}
                  </div>
                )}"""

replacement = """                {balneabilidade?.observacao_tecnica && (
                  <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200">
                    <strong className="text-amber-950 dark:text-amber-100 font-semibold">Recomendação Oficial do INEA:</strong> {balneabilidade.observacao_tecnica}
                  </div>
                )}

                {/* Mapa Oficial de Balneabilidade do INEA (Boletim Oficial PDF) */}
                <div className="p-4 sm:p-5 rounded-xl border bg-white dark:bg-[#0B1324] border-[#E5E5E5] dark:border-[#233354] shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E5E5] dark:border-[#233354]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#FCA311]" />
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                      >
                        Ampliar Imagem <ExternalLink className="w-3 h-3 text-[#FCA311]" />
                      </a>
                      {balneabilidade?.url_boletim_pdf && (
                        <a
                          href={balneabilidade.url_boletim_pdf}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FCA311] text-[#14213D] hover:bg-[#FCA311]/90 shadow-sm transition-colors"
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
                </div>"""

# Normalize line endings for replacement
content_norm = content.replace("\r\n", "\n")
target_norm = target.replace("\r\n", "\n")
replacement_norm = replacement.replace("\r\n", "\n")

if target_norm in content_norm:
    new_content = content_norm.replace(target_norm, replacement_norm, 1)
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("SUCCESS: App.tsx updated with official INEA map card!")
else:
    print("ERROR: Target not found in App.tsx")
