import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update lucide imports
if 'ArrowDown,' not in code:
    code = code.replace('ArrowDownToLine,\n', 'ArrowDown,\n  ArrowDownToLine,\n  ArrowUp,\n', 1)

# 2. Pattern to replace tabua de mares body
old_tabua_body = """                {tabuaMares?.dias?.[0]?.eventos && tabuaMares.dias[0].eventos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                    {tabuaMares.dias[0].eventos.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]"
                      >
                        <div className="text-xs text-slate-500 dark:text-[#E5E5E5]/65">{ev.tipo}</div>
                        <div className="text-lg font-semibold text-[#14213D] dark:text-white mt-0.5 tabular-nums">{ev.hora}</div>
                        <div className="text-xs font-semibold text-[#FCA311] tabular-nums">{ev.altura}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs text-slate-600 dark:text-[#E5E5E5]/80">
                    As previsões astronômicas de maré (preia-mar e baixa-mar) são calculadas pelo Centro de Hidrografia da Marinha (CHM/DHN). Utilize o botão "Tábua Completa CHM" acima para consultar a grade horária oficial da Estação Imbetiba (#39).
                  </div>
                )}"""

new_tabua_body = """                {/* Card Destaque: Próxima Maré */}
                {tabuaMares?.proxima_mare && (
                  <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-[#0B1324] border-[#233354]'
                      : 'bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-amber-50/60 border-blue-200/90 shadow-xs'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        tabuaMares.proxima_mare.tipo === 'PREAMAR'
                          ? isDark ? 'bg-amber-950/60 border-amber-700/60 text-[#FCA311]' : 'bg-orange-100 border-orange-300 text-orange-700 shadow-2xs'
                          : isDark ? 'bg-sky-950/60 border-sky-700/60 text-sky-400' : 'bg-sky-100 border-sky-300 text-sky-700 shadow-2xs'
                      }`}>
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
                          <span className="font-mono text-orange-600 dark:text-[#FCA311]">{tabuaMares.proxima_mare.hora}</span> · Cota:{' '}
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
                            className={`p-4 rounded-xl border text-center transition-all ${
                              isDark
                                ? 'bg-[#0B1324] border-[#233354]'
                                : isHigh
                                ? 'bg-gradient-to-br from-orange-50 to-amber-50/70 border-orange-200/90 shadow-2xs'
                                : 'bg-gradient-to-br from-sky-50 to-blue-50/70 border-sky-200/90 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                              {isHigh ? (
                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase ${
                                  isDark ? 'text-orange-400' : 'text-orange-700'
                                }`}>
                                  <ArrowUp className="w-3.5 h-3.5 text-orange-500" /> Preia-mar
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase ${
                                  isDark ? 'text-sky-400' : 'text-sky-700'
                                }`}>
                                  <ArrowDown className="w-3.5 h-3.5 text-sky-500" /> Baixa-mar
                                </span>
                              )}
                            </div>
                            <div className="text-2xl font-bold text-[#14213D] dark:text-white tabular-nums">
                              {ev.hora}
                            </div>
                            <div className={`text-xs font-bold mt-1 tabular-nums ${
                              isHigh
                                ? isDark ? 'text-[#FCA311]' : 'text-orange-900'
                                : isDark ? 'text-sky-300' : 'text-sky-900'
                            }`}>
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
                                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-[#FCA311] dark:border-amber-700/60 font-bold">
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
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold border ${
                                      isHigh
                                        ? isDark ? 'bg-orange-950/50 text-orange-300 border-orange-800/50' : 'bg-orange-50 text-orange-800 border-orange-200 shadow-2xs'
                                        : isDark ? 'bg-sky-950/50 text-sky-300 border-sky-800/50' : 'bg-sky-50 text-sky-800 border-sky-200 shadow-2xs'
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

assert old_tabua_body in code, "old_tabua_body not found!"
code = code.replace(old_tabua_body, new_tabua_body, 1)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Tábua de Marés component successfully expanded!")
