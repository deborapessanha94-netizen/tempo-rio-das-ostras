with open('src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = """                          {textoOficial && (
                            <div className="p-3 rounded-lg border bg-[#F7F8FA] dark:bg-[#14213D]/60 border-[#E5E5E5] dark:border-[#233354]">
                              <p className="text-xs text-slate-700 dark:text-[#E5E5E5]/90 leading-relaxed text-justify">
                                {textoOficial}
                              </p>
                            </div>
                          )}"""

replacement = """                          {Array.isArray(d.informe_populacao) && d.informe_populacao.length > 0 ? (
                            <div className="p-3.5 rounded-lg border bg-[#F7F8FA] dark:bg-[#14213D]/60 border-[#E5E5E5] dark:border-[#233354] space-y-2 text-xs text-slate-700 dark:text-[#E5E5E5]/90 leading-relaxed text-justify">
                              {d.informe_populacao.map((paragrafo, pIdx) => {
                                const isMar = paragrafo.toLowerCase().startsWith('condições do mar') || paragrafo.toLowerCase().startsWith('mar na orla');
                                return (
                                  <p
                                    key={pIdx}
                                    className={isMar ? 'font-medium text-[#14213D] dark:text-white pt-2 border-t border-[#E5E5E5] dark:border-[#233354] flex items-start gap-1.5' : ''}
                                  >
                                    {isMar && <Waves className="w-4 h-4 text-[#FF8244] shrink-0 mt-0.5" />}
                                    <span>{paragrafo}</span>
                                  </p>
                                );
                              })}
                            </div>
                          ) : textoOficial ? (
                            <div className="p-3 rounded-lg border bg-[#F7F8FA] dark:bg-[#14213D]/60 border-[#E5E5E5] dark:border-[#233354]">
                              <p className="text-xs text-slate-700 dark:text-[#E5E5E5]/90 leading-relaxed text-justify">
                                {textoOficial}
                              </p>
                            </div>
                          ) : null}"""

if target in text:
    new_text = text.replace(target, replacement, 1)
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("SUCCESS: Updated forecast cards in App.tsx with paragraph styling and marine highlight!")
else:
    print("ERROR: Target not found in App.tsx!")
