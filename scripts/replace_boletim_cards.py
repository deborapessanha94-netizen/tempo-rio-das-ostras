with open("src/App.tsx", "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "const isChuvaExpressiva = d.val >= 10;"
end_marker = "Sem chuva\n                                </span>\n                              )}\n                            </div>"

s_idx = text.find(start_marker)
if s_idx == -1:
    print("Start marker not found!")
    exit(1)

e_idx = text.find(end_marker, s_idx)
if e_idx == -1:
    print("End marker not found!")
    exit(1)

e_idx += len(end_marker)

new_block = """const isChuvaExpressiva = d.val >= 10;
                          return (
                            <div
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
                                <span className="text-[8px] text-slate-400">
                                  Sem chuva
                                </span>
                              )}
                            </div>"""

new_text = text[:s_idx] + new_block + text[e_idx:]
with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(new_text)

print("SUCCESS: Boletim minicards replaced cleanly!")
