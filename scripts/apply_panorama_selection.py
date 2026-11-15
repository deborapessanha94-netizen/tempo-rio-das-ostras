import sys

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = """              {/* BARRA DE SELEÇÃO DE PERÍODO E DATAS LIVRES */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#14213D] dark:text-white">
                    <Calendar className="w-4 h-4 text-[#FCA311]" />
                    Atalhos Rápidos de Período:
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'nov_semana1', label: '01 a 07/11 (Semana 1 Nov)', start: '2026-11-01', end: '2026-11-07' },
                      { id: 'nov_semana2', label: '08 a 14/11 (Semana 2 Nov)', start: '2026-11-08', end: '2026-11-14' },
                      { id: 'nov_full', label: 'Novembro Completo (01 a 14/11)', start: '2026-11-01', end: '2026-11-14' },
                      { id: 'out_full', label: 'Outubro Completo (31 dias)', start: '2026-10-01', end: '2026-10-31' },
                    ].map((btn) => {
                      const isSelected = panoramaStart === btn.start && panoramaEnd === btn.end;
                      return (
                        <button
                          key={btn.id}
                          onClick={() => {
                            setPanoramaPreset(btn.id);
                            setPanoramaStart(btn.start);
                            setPanoramaEnd(btn.end);
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#000000] font-semibold shadow-sm'
                              : 'bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] text-slate-700 dark:text-[#E5E5E5]/80 hover:border-[#FCA311]'
                          }`}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5E5E5] dark:border-[#233354] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-wrap text-xs">
                    <span className="font-semibold text-slate-700 dark:text-white">Juntar Datas / Intervalo Livre:</span>
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70">Data Início:</label>
                      <input
                        type="date"
                        value={panoramaStart}
                        min="2026-10-01"
                        max="2026-11-14"
                        onChange={(e) => {
                          setPanoramaPreset('custom');
                          setPanoramaStart(e.target.value);
                        }}
                        className="px-2.5 py-1 text-xs rounded-md border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#14213D] text-[#14213D] dark:text-white cursor-pointer font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70">Data Fim:</label>
                      <input
                        type="date"
                        value={panoramaEnd}
                        min="2026-10-01"
                        max="2026-11-14"
                        onChange={(e) => {
                          setPanoramaPreset('custom');
                          setPanoramaEnd(e.target.value);
                        }}
                        className="px-2.5 py-1 text-xs rounded-md border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#14213D] text-[#14213D] dark:text-white cursor-pointer font-mono"
                      />
                    </div>
                  </div>

                  {/* Seleção rápida dia a dia de Novembro */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-[#E5E5E5]/70 mr-1">Dia avulso (Nov):</span>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((diaNum) => {
                      const dStr = `2026-11-${String(diaNum).padStart(2, '0')}`;
                      const isSel = panoramaStart === dStr && panoramaEnd === dStr;
                      return (
                        <button
                          key={diaNum}
                          onClick={() => {
                            setPanoramaPreset('custom');
                            setPanoramaStart(dStr);
                            setPanoramaEnd(dStr);
                          }}
                          title={`Gerar panorama do dia ${diaNum}/11/2026`}
                          className={`w-6 h-6 text-[11px] font-mono rounded flex items-center justify-center cursor-pointer transition-colors ${
                            isSel
                              ? 'bg-[#FCA311] text-[#000000] font-bold shadow-sm'
                              : 'bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] text-slate-600 dark:text-[#E5E5E5]/75 hover:border-[#FCA311]'
                          }`}
                        >
                          {diaNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>"""

replacement = """              {/* BARRA DE SELEÇÃO: MÊS E DIA */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* OPÇÃO 1: ESCOLHA O MÊS */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-[#14213D] dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#FCA311]" />
                      <span>Escolha o Mês:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPanoramaPreset('custom');
                          setPanoramaStart('2026-11-01');
                          setPanoramaEnd('2026-11-14');
                        }}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition cursor-pointer text-center ${
                          panoramaStart.startsWith('2026-11')
                            ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#0B1324] border-[#14213D] dark:border-[#FCA311] shadow-xs'
                            : 'bg-white dark:bg-[#14213D] text-slate-700 dark:text-[#E5E5E5] border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311]'
                        }`}
                      >
                        Novembro / 2026
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPanoramaPreset('custom');
                          setPanoramaStart('2026-10-01');
                          setPanoramaEnd('2026-10-31');
                        }}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition cursor-pointer text-center ${
                          panoramaStart.startsWith('2026-10')
                            ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#0B1324] border-[#14213D] dark:border-[#FCA311] shadow-xs'
                            : 'bg-white dark:bg-[#14213D] text-slate-700 dark:text-[#E5E5E5] border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311]'
                        }`}
                      >
                        Outubro / 2026
                      </button>
                    </div>
                  </div>

                  {/* OPÇÃO 2: ESCOLHA O DIA OU PERÍODO */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#14213D] dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <CalendarClock className="w-4 h-4 text-[#FCA311]" />
                        <span>Escolha o Dia ou Período:</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPanoramaPreset('custom');
                          if (panoramaStart.startsWith('2026-11')) {
                            setPanoramaStart('2026-11-01');
                            setPanoramaEnd('2026-11-14');
                          } else {
                            setPanoramaStart('2026-10-01');
                            setPanoramaEnd('2026-10-31');
                          }
                        }}
                        className="text-[11px] font-medium text-[#14213D] dark:text-[#FCA311] hover:underline cursor-pointer"
                      >
                        Mês Completo
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 whitespace-nowrap">De:</span>
                        <input
                          type="date"
                          value={panoramaStart}
                          min={panoramaStart.startsWith('2026-11') ? '2026-11-01' : '2026-10-01'}
                          max={panoramaStart.startsWith('2026-11') ? '2026-11-14' : '2026-10-31'}
                          onChange={(e) => {
                            setPanoramaPreset('custom');
                            setPanoramaStart(e.target.value);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#14213D] text-[#14213D] dark:text-white font-mono cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 whitespace-nowrap">Até:</span>
                        <input
                          type="date"
                          value={panoramaEnd}
                          min={panoramaStart.startsWith('2026-11') ? '2026-11-01' : '2026-10-01'}
                          max={panoramaStart.startsWith('2026-11') ? '2026-11-14' : '2026-10-31'}
                          onChange={(e) => {
                            setPanoramaPreset('custom');
                            setPanoramaEnd(e.target.value);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#14213D] text-[#14213D] dark:text-white font-mono cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTÕES DE CADA DIA DO MÊS ATIVO */}
                <div className="pt-3 border-t border-[#E5E5E5] dark:border-[#233354] space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-[#E5E5E5]/70">
                    <span>Clique em um dia de {panoramaStart.startsWith('2026-11') ? 'Novembro' : 'Outubro'}:</span>
                    <span className="font-mono text-slate-600 dark:text-[#E5E5E5]/80">
                      Período ativo: {panoramaStart.slice(8, 10)}/{panoramaStart.slice(5, 7)} a {panoramaEnd.slice(8, 10)}/{panoramaEnd.slice(5, 7)} ({panoramaData?.totalDias || 1} {panoramaData?.totalDias === 1 ? 'dia' : 'dias'})
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {(panoramaStart.startsWith('2026-11')
                      ? Array.from({ length: 14 }, (_, i) => i + 1)
                      : Array.from({ length: 31 }, (_, i) => i + 1)
                    ).map((diaNum) => {
                      const monthPrefix = panoramaStart.startsWith('2026-11') ? '2026-11' : '2026-10';
                      const dStr = `${monthPrefix}-${String(diaNum).padStart(2, '0')}`;
                      const isSingle = panoramaStart === dStr && panoramaEnd === dStr;
                      const isInRange = dStr >= panoramaStart && dStr <= panoramaEnd;
                      return (
                        <button
                          key={diaNum}
                          type="button"
                          onClick={() => {
                            setPanoramaPreset('custom');
                            setPanoramaStart(dStr);
                            setPanoramaEnd(dStr);
                          }}
                          title={`Ver dados do dia ${diaNum}/${monthPrefix.slice(5)}/2026`}
                          className={`w-7 h-7 text-xs font-mono font-semibold rounded-md transition cursor-pointer flex items-center justify-center ${
                            isSingle
                              ? 'bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#0B1324] shadow-xs'
                              : isInRange
                              ? 'bg-[#FCA311]/25 text-[#14213D] dark:text-[#FCA311] border border-[#FCA311]/50 font-bold'
                              : 'bg-white dark:bg-[#14213D] text-slate-600 dark:text-[#E5E5E5]/70 border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FCA311]'
                          }`}
                        >
                          {diaNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>"""

if target in text:
    new_text = text.replace(target, replacement, 1)
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("SUCCESS: Target found and replaced!")
else:
    print("ERROR: Target not found in text!")
    # Let's find where difference might be
    start_anchor = "BARRA DE SELEÇÃO DE PERÍODO E DATAS LIVRES"
    if start_anchor in text:
        pos = text.find(start_anchor)
        print("start_anchor found at pos", pos)
        print("Slice around pos:\n", repr(text[pos:pos+300]))
    else:
        print("start_anchor NOT found!")
