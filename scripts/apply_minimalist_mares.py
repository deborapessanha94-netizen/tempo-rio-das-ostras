# -*- coding: utf-8 -*-
app_path = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\src\App.tsx"

with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

use_crlf = "\r\n" in text
text_normalized = text.replace("\r\n", "\n")

old_block = """                {/* Card Destaque: Próxima Maré */}
                {tabuaMares?.proxima_mare && (
                  <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                    'bg-white dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] shadow-xs'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-[#F7F8FA] dark:bg-[#14213D] border-[#E5E5E5] dark:border-[#233354] text-[#FCA311]">
                        {tabuaMares.proxima_mare.tipo === 'PREAMAR' ? (
                          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <ArrowDown className="w-5 h-5 stroke-[2.5]" />
                        )}
                      </div>
                      <div>
                        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/70 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Próximo Evento Astronômico de Maré
                        </div>
                        <div className="text-base font-bold text-[#14213D] dark:text-white mt-0.5">
                          {tabuaMares.proxima_mare.tipo === 'PREAMAR' ? 'Preia-mar (Maré Alta)' : 'Baixa-mar (Maré Baixa)'} às{' '}
                          <span className="font-mono text-[#14213D] dark:text-[#FCA311]">{tabuaMares.proxima_mare.hora}</span> · Cota:{' '}
                          <span className="font-mono">{Number(tabuaMares.proxima_mare.altura).toFixed(1).replace('.', ',')} m</span>
                        </div>
                      </div>
                    </div>
                    <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
                      isDark ? 'bg-[#14213D] text-[#FCA311] border-[#233354]' : 'bg-white text-[#14213D] border-slate-200 shadow-2xs'
                    }`}>
                      Imbetiba / Rio das Ostras (#39)
                    </div>
                  </div>
                )}

                {/* Marés de Hoje (4 Indicadores com Ícones e Cores) */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-[#14213D] dark:text-white flex items-center gap-2">
                      <Waves className="w-4 h-4 text-sky-500" />
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
                            className="p-4 rounded-xl border text-center transition-all bg-[#F7F8FA] dark:bg-[#0B1324] border-[#E5E5E5] dark:border-[#233354]"
                          >
                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                              {isHigh ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-[#14213D] dark:text-[#FCA311]">
                                  <ArrowUp className="w-3.5 h-3.5 text-[#FCA311]" /> Preia-mar
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-slate-600 dark:text-[#E5E5E5]/70">
                                  <ArrowDown className="w-3.5 h-3.5 text-slate-500 dark:text-[#E5E5E5]/60" /> Baixa-mar
                                </span>
                              )}
                            </div>
                            <div className="text-2xl font-bold text-[#14213D] dark:text-white tabular-nums">
                              {ev.hora}
                            </div>
                            <div className="text-xs font-bold mt-1 tabular-nums text-[#14213D] dark:text-[#E5E5E5]">
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

                {/* Tábua Semanal Completa (Próximos 7 Dias) */}
                {tabuaMares?.dias && tabuaMares.dias.length > 0 && (
                  <div className="pt-2 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-display text-base font-bold text-[#14213D] dark:text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        Tábua Semanal Completa de Marés (Próximos 7 Dias)
                      </h3>
                      <span className="text-xs font-mono text-slate-500 dark:text-[#E5E5E5]/70">
                        Estação #39 Imbetiba / Macaé e Rio das Ostras
                      </span>
                    </div>

                    <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-[#233354] bg-[#0B1324]' : 'border-slate-200 bg-white shadow-xs'}`}>
                      <table className="w-full text-xs font-mono border-collapse">
                        <thead>
                          <tr className={`border-b ${isDark ? 'border-[#233354] bg-[#14213D]' : 'border-slate-200 bg-slate-50'} text-left`}>
                            <th className="py-3 px-4 font-bold text-[#14213D] dark:text-white">Data / Dia</th>
                            <th className="py-3 px-3 font-bold text-[#14213D] dark:text-white text-center">1ª Maré</th>
                            <th className="py-3 px-3 font-bold text-[#14213D] dark:text-white text-center">2ª Maré</th>
                            <th className="py-3 px-3 font-bold text-[#14213D] dark:text-white text-center">3ª Maré</th>
                            <th className="py-3 px-3 font-bold text-[#14213D] dark:text-white text-center">4ª Maré</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-[#233354]' : 'divide-slate-100'}`}>
                          {tabuaMares.dias.map((dia, dIdx) => (
                            <tr
                              key={dia.data_iso}
                              className={`${
                                dIdx === 0
                                  ? isDark ? 'bg-white/5 font-semibold' : 'bg-amber-50/40 font-semibold'
                                  : ''
                              } hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors`}
                            >
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="font-bold text-[#14213D] dark:text-white flex items-center gap-2">
                                  <span>{dia.dia_semana}</span>
                                  {dIdx === 0 && (
                                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#FCA311]/15 text-[#14213D] dark:text-[#FCA311] border border-[#FCA311]/40 font-bold">
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
                                  <td key={evIdx} className="py-3 px-3 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-semibold border ${
                                      isHigh
                                        ? 'bg-[#FCA311]/10 text-[#14213D] dark:text-[#FCA311] border-[#FCA311]/30'
                                        : 'bg-[#F7F8FA] dark:bg-[#0B1324] text-slate-700 dark:text-[#E5E5E5]/90 border-[#E5E5E5] dark:border-[#233354]'
                                    }`}>
                                      {isHigh ? <ArrowUp className="w-3 h-3 text-orange-500" /> : <ArrowDown className="w-3 h-3 text-sky-500" />}
                                      <strong className="text-xs">{ev.hora}</strong>
                                      <span className="opacity-90">({Number(ev.altura).toFixed(1).replace('.', ',')}m)</span>
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
                )}"""

new_block = """                {/* Card Destaque: Próxima Maré */}
                {tabuaMares?.proxima_mare && (
                  <div className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0B1324] border-[#E5E5E5] dark:border-[#233354] shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-[#F7F8FA] dark:bg-[#14213D] border-[#E5E5E5] dark:border-[#233354] text-[#FCA311]">
                        {tabuaMares.proxima_mare.tipo === 'PREAMAR' ? (
                          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <ArrowDown className="w-5 h-5 stroke-[2.5]" />
                        )}
                      </div>
                      <div>
                        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/70 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#FCA311] animate-pulse"></span>
                          Próximo Evento Astronômico de Maré
                        </div>
                        <div className="text-base font-bold text-[#14213D] dark:text-white mt-0.5">
                          {tabuaMares.proxima_mare.tipo === 'PREAMAR' ? 'Preia-mar (Maré Alta)' : 'Baixa-mar (Maré Baixa)'} às{' '}
                          <span className="font-mono text-[#FCA311] font-bold">{tabuaMares.proxima_mare.hora}</span> · Cota:{' '}
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
                      <Waves className="w-4 h-4 text-[#FCA311]" />
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
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-[#FCA311]">
                                  <ArrowUp className="w-3.5 h-3.5 text-[#FCA311] stroke-[2.5]" /> Preia-mar
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
                            <div className={`text-xs font-bold mt-1 tabular-nums ${isHigh ? 'text-[#FCA311]' : 'text-slate-500 dark:text-[#E5E5E5]/60'}`}>
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
                        <Calendar className="w-4 h-4 text-[#FCA311]" />
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
                                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#FCA311]/15 text-[#14213D] dark:text-[#FCA311] border border-[#FCA311]/40 font-bold">
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
                                        <ArrowUp className="w-3.5 h-3.5 text-[#FCA311] stroke-[2.5]" />
                                      ) : (
                                        <ArrowDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 stroke-[2.5]" />
                                      )}
                                      <strong className={`font-bold ${isHigh ? 'text-[#14213D] dark:text-[#FCA311]' : 'text-slate-700 dark:text-slate-200'}`}>
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
                )}"""

assert old_block in text_normalized, "old_block not found in App.tsx"
text_normalized = text_normalized.replace(old_block, new_block)
print("Replaced Tábua de Marés block with minimalist clean version!")

# Also clean line 4086 (Balneabilidade link) and line 4250 (INMET aviso banner)
old_balnear_link = """className="underline hover:text-[#FCA311] text-sky-600 dark:text-sky-400 font-medium transition-colors\""""
new_balnear_link = """className="underline hover:text-[#FCA311] text-[#14213D] dark:text-[#FCA311] font-medium transition-colors\""""
if old_balnear_link in text_normalized:
    text_normalized = text_normalized.replace(old_balnear_link, new_balnear_link)
    print("Replaced balneabilidade link color")

old_inmet_banner = """                <div className="p-3.5 rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 text-xs text-sky-900 dark:text-sky-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />"""
new_inmet_banner = """                <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs text-slate-700 dark:text-[#E5E5E5]/90 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-[#FCA311] shrink-0" />"""
if old_inmet_banner in text_normalized:
    text_normalized = text_normalized.replace(old_inmet_banner, new_inmet_banner)
    print("Replaced INMET aviso banner color")

final_text = text_normalized.replace("\n", "\r\n") if use_crlf else text_normalized

with open(app_path, "w", encoding="utf-8") as f:
    f.write(final_text)

print("SUCCESS: Minimalist marés applied!")
