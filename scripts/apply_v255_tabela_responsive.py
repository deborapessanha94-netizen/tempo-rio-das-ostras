# -*- coding: utf-8 -*-
import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
app_path = os.path.join(base_dir, "src", "App.tsx")

with open(app_path, "r", encoding="utf-8") as f:
    app_code = f.read()

old_tabela_div = """                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E5E5] dark:border-[#233354] text-xs text-slate-500 dark:text-[#E5E5E5]/70">
                        <th className="py-3 pr-5 font-medium min-w-[220px]">Estação / Localidade</th>
                        <th className="py-3 px-3 font-medium whitespace-nowrap">Rede</th>
                        {[1, 4, 12, 24, 36, 48, 96].map((h) => (
                          <th key={h} className="py-3 px-2.5 font-medium text-right whitespace-nowrap">
                            <button
                              onClick={() => selectRainHorizon(h)}
                              className={`cursor-pointer hover:text-[#14213D] dark:hover:text-white ${
                                rainHorizonHours === h ? 'text-[#FF8244] font-semibold underline underline-offset-4' : ''
                              }`}
                            >
                              {h}h
                            </button>
                          </th>
                        ))}
                        <th className="py-3 pl-4 font-medium whitespace-nowrap">Leitura</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#233354] text-sm">
                      {filteredStations.map((st) => (
                        <tr key={st.codigo} className="hover:bg-[#F7F8FA] dark:hover:bg-[#0B1324]/70 transition-colors">
                          <td className="py-4 pr-5 min-w-[220px] align-top">
                            <div className="space-y-1">
                              <div className="font-medium text-[#14213D] dark:text-white leading-snug">
                                {st.nome_curto || st.nome}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/65 leading-snug">
                                {st.codigo}
                                {st.bairro ? ` · ${st.bairro}` : ''}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-3 text-xs text-slate-600 dark:text-[#E5E5E5]/80 whitespace-nowrap align-top">
                            {st.rede}
                          </td>
                          <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 1 ? 'font-semibold text-[#FF8244]' : ''}`}>
                            {st.chuva_1h !== null ? st.chuva_1h.toFixed(1) : '--'}
                          </td>
                          <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 4 ? 'font-semibold text-[#FF8244]' : ''}`}>
                            {st.chuva_4h !== null ? st.chuva_4h.toFixed(1) : '--'}
                          </td>
                          <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 12 ? 'font-semibold text-[#FF8244]' : ''}`}>
                            {st.chuva_12h !== null ? st.chuva_12h.toFixed(1) : '--'}
                          </td>
                          <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 24 ? 'font-semibold text-[#FF8244]' : ''}`}>
                            {st.chuva_24h !== null ? st.chuva_24h.toFixed(1) : '--'}
                          </td>
                          <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 36 ? 'font-semibold text-[#FF8244]' : ''}`}>
                            {st.chuva_36h !== null && st.chuva_36h !== undefined ? st.chuva_36h.toFixed(1) : '--'}
                          </td>
                          <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 48 ? 'font-semibold text-[#FF8244]' : ''}`}>
                            {st.chuva_48h !== null ? st.chuva_48h.toFixed(1) : '--'}
                          </td>
                          <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 96 ? 'font-semibold text-[#FF8244]' : ''}`}>
                            {st.chuva_96h !== null ? st.chuva_96h.toFixed(1) : '--'}
                          </td>
                          <td className="py-4 pl-4 text-xs font-mono text-slate-500 dark:text-[#E5E5E5]/70 whitespace-nowrap align-top">
                            {st.ultima_leitura || '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>"""

new_tabela_div = """                {/* Visualização da Tabela: Mobile Cards (md:hidden) vs Desktop Table (hidden md:block) */}
                <div>
                  {/* Seletor de Horizonte Rápido no Celular */}
                  <div className="md:hidden pb-3">
                    <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 mb-1.5 font-medium">Acumulado em destaque:</div>
                    <div className="grid grid-cols-7 gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg text-center text-xs">
                      {[1, 4, 12, 24, 36, 48, 96].map((h) => (
                        <button
                          key={h}
                          onClick={() => selectRainHorizon(h)}
                          className={`py-1 rounded font-mono font-medium transition-colors cursor-pointer ${
                            rainHorizonHours === h
                              ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-bold shadow-2xs'
                              : 'text-slate-600 dark:text-[#E5E5E5]/70'
                          }`}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cards no Celular (md:hidden) */}
                  <div className="md:hidden space-y-2.5">
                    {filteredStations.map((st) => {
                      const rainVal =
                        rainHorizonHours === 1 ? st.chuva_1h :
                        rainHorizonHours === 4 ? st.chuva_4h :
                        rainHorizonHours === 12 ? st.chuva_12h :
                        rainHorizonHours === 24 ? st.chuva_24h :
                        rainHorizonHours === 36 ? st.chuva_36h :
                        rainHorizonHours === 48 ? st.chuva_48h : st.chuva_96h;

                      return (
                        <div
                          key={st.codigo}
                          className="p-3.5 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-2 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-[#14213D] dark:text-white leading-snug">
                                {st.nome_curto || st.nome}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/65">
                                {st.codigo} · {st.rede} {st.bairro ? `· ${st.bairro}` : ''}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-slate-400 dark:text-[#E5E5E5]/50 block">{rainHorizonHours}h acumulado</span>
                              <span className={`text-base font-mono font-bold ${
                                rainVal && rainVal > 0 ? 'text-[#FF8244]' : 'text-slate-600 dark:text-[#E5E5E5]/80'
                              }`}>
                                {rainVal !== null && rainVal !== undefined ? `${rainVal.toFixed(1)} mm` : '--'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-[#E5E5E5]/60 dark:border-[#233354]/60 text-[10.5px] font-mono text-slate-500 dark:text-[#E5E5E5]/60">
                            <span>1h: {st.chuva_1h !== null ? `${st.chuva_1h.toFixed(1)}mm` : '--'}</span>
                            <span>24h: {st.chuva_24h !== null ? `${st.chuva_24h.toFixed(1)}mm` : '--'}</span>
                            <span>96h: {st.chuva_96h !== null ? `${st.chuva_96h.toFixed(1)}mm` : '--'}</span>
                            <span>Leitura: {st.ultima_leitura || '--'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tabela Ampla para Desktop (hidden md:block) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E5E5E5] dark:border-[#233354] text-xs text-slate-500 dark:text-[#E5E5E5]/70">
                          <th className="py-3 pr-5 font-medium min-w-[220px]">Estação / Localidade</th>
                          <th className="py-3 px-3 font-medium whitespace-nowrap">Rede</th>
                          {[1, 4, 12, 24, 36, 48, 96].map((h) => (
                            <th key={h} className="py-3 px-2.5 font-medium text-right whitespace-nowrap">
                              <button
                                onClick={() => selectRainHorizon(h)}
                                className={`cursor-pointer hover:text-[#14213D] dark:hover:text-white ${
                                  rainHorizonHours === h ? 'text-[#FF8244] font-semibold underline underline-offset-4' : ''
                                }`}
                              >
                                {h}h
                              </button>
                            </th>
                          ))}
                          <th className="py-3 pl-4 font-medium whitespace-nowrap">Leitura</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#233354] text-sm">
                        {filteredStations.map((st) => (
                          <tr key={st.codigo} className="hover:bg-[#F7F8FA] dark:hover:bg-[#0B1324]/70 transition-colors">
                            <td className="py-4 pr-5 min-w-[220px] align-top">
                              <div className="space-y-1">
                                <div className="font-medium text-[#14213D] dark:text-white leading-snug">
                                  {st.nome_curto || st.nome}
                                </div>
                                <div className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/65 leading-snug">
                                  {st.codigo}
                                  {st.bairro ? ` · ${st.bairro}` : ''}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-3 text-xs text-slate-600 dark:text-[#E5E5E5]/80 whitespace-nowrap align-top">
                              {st.rede}
                            </td>
                            <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 1 ? 'font-semibold text-[#FF8244]' : ''}`}>
                              {st.chuva_1h !== null ? st.chuva_1h.toFixed(1) : '--'}
                            </td>
                            <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 4 ? 'font-semibold text-[#FF8244]' : ''}`}>
                              {st.chuva_4h !== null ? st.chuva_4h.toFixed(1) : '--'}
                            </td>
                            <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 12 ? 'font-semibold text-[#FF8244]' : ''}`}>
                              {st.chuva_12h !== null ? st.chuva_12h.toFixed(1) : '--'}
                            </td>
                            <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 24 ? 'font-semibold text-[#FF8244]' : ''}`}>
                              {st.chuva_24h !== null ? st.chuva_24h.toFixed(1) : '--'}
                            </td>
                            <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 36 ? 'font-semibold text-[#FF8244]' : ''}`}>
                              {st.chuva_36h !== null && st.chuva_36h !== undefined ? st.chuva_36h.toFixed(1) : '--'}
                            </td>
                            <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 48 ? 'font-semibold text-[#FF8244]' : ''}`}>
                              {st.chuva_48h !== null ? st.chuva_48h.toFixed(1) : '--'}
                            </td>
                            <td className={`py-4 px-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap align-top ${rainHorizonHours === 96 ? 'font-semibold text-[#FF8244]' : ''}`}>
                              {st.chuva_96h !== null ? st.chuva_96h.toFixed(1) : '--'}
                            </td>
                            <td className="py-4 pl-4 text-xs font-mono text-slate-500 dark:text-[#E5E5E5]/70 whitespace-nowrap align-top">
                              {st.ultima_leitura || '--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>"""

app_code = app_code.replace(old_tabela_div, new_tabela_div)

with open(app_path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(app_code)

print("Updated Tabela section with responsive mobile cards!")
