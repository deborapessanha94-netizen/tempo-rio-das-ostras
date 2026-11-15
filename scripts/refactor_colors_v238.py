# -*- coding: utf-8 -*-
import os

app_path = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\src\App.tsx"

with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

use_crlf = "\r\n" in text
text_normalized = text.replace("\r\n", "\n")

# 5. Exportar Imagens Oficiais de Chuva e Vento
old_export = """            {/* Seção Oficial: Exportar Imagens de Acumulados de Chuva e Vento */}
            {showSub('resumo') && (
              <section className="bg-gradient-to-r from-orange-50/70 via-white to-sky-50/70 dark:from-[#14213D] dark:via-[#0B1324] dark:to-[#14213D] border border-orange-200 dark:border-[#233354] rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-orange-100 dark:border-[#233354] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#ffebe4] border border-[#f07a53]/50 text-[#ea580c] shadow-2xs">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-sm sm:text-base font-bold text-[#14213D] dark:text-white">
                          Exportar Imagens Oficiais para Redes Sociais
                        </h3>
                        <span className="text-[10px] font-mono font-bold uppercase bg-[#ffebe4] text-[#ea580c] border border-[#f07a53]/40 px-2 py-0.5 rounded-full">
                          Feed (4:5) & Stories (9:16)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-0.5">
                        Gere e baixe imagens em alta resolução com dados oficiais sincronizados da rede municipal
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Imagem de Acumulados de Chuva */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#14213D] border border-[#f07a53]/30 dark:border-[#233354] shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ffebe4] text-[#c2410c] border border-[#f07a53]/40">
                          <CloudRain className="w-3.5 h-3.5" />
                          Acumulados de Chuva
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">1080px HD</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#14213D] dark:text-white mt-2">
                        Card Oficial de Acumulados
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
                        Ranking completo de chuva das 10 estações com barras proporcionais e total do município.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#233354]">
                      <button
                        type="button"
                        onClick={() => (window as any).openSocialModalChuva?.('24h')}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-[#ffebe4] hover:bg-[#ffd9cb] text-[#9a3412] dark:text-[#ea580c] border border-[#f07a53] shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Abrir Card de Chuva</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Imagem de Maiores Ventos & Rajadas */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#14213D] border border-[#0284c7]/30 dark:border-[#233354] shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e0f2fe] text-[#0369a1] border border-[#0284c7]/40">
                          <Wind className="w-3.5 h-3.5" />
                          Ventos & Rajadas
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">1080px HD</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#14213D] dark:text-white mt-2">
                        Card Oficial de Ventos & Rajadas
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
                        Maiores ventos e rajadas na orla e bairros, separados da imagem de chuva para postagem oficial.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#233354]">
                      <button
                        type="button"
                        onClick={() => (window as any).openSocialModalVento?.()}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-[#e0f2fe] hover:bg-[#bae6fd] text-[#0369a1] dark:text-[#0284c7] border border-[#0284c7] shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Abrir Card de Vento</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Imagem do Tempo Agora */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#14213D] border border-amber-300/40 dark:border-[#233354] shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fff7ed] text-[#c2410c] border border-amber-400/40">
                          <SunMedium className="w-3.5 h-3.5" />
                          Tempo Agora
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">1080px HD</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#14213D] dark:text-white mt-2">
                        Card Oficial do Tempo Agora
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
                        Temperatura, sensação térmica, umidade, vento e condições costeiras em tempo real.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#233354]">
                      <button
                        type="button"
                        onClick={() => (window as any).openSocialModalTempoAgora?.()}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-[#fff7ed] hover:bg-[#ffedd5] text-[#c2410c] dark:text-[#ea580c] border border-[#ea580c] shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Abrir Card Tempo Agora</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}"""

new_export = """            {/* Seção Oficial: Exportar Imagens de Acumulados de Chuva e Vento */}
            {showSub('resumo') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E5] dark:border-[#233354] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-[#FCA311]">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-sm sm:text-base font-bold text-[#14213D] dark:text-white">
                          Exportar Imagens Oficiais para Redes Sociais
                        </h3>
                        <span className="text-[10px] font-mono font-bold uppercase bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#FCA311] border border-[#E5E5E5] dark:border-[#233354] px-2 py-0.5 rounded-full">
                          Feed (4:5) & Stories (9:16)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-0.5">
                        Gere e baixe imagens em alta resolução com dados oficiais sincronizados da rede municipal
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Imagem de Acumulados de Chuva */}
                  <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-[#14213D] text-[#14213D] dark:text-[#FCA311] border border-[#E5E5E5] dark:border-[#233354]">
                          <CloudRain className="w-3.5 h-3.5 text-[#FCA311]" />
                          Acumulados de Chuva
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">1080px HD</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#14213D] dark:text-white mt-2">
                        Card Oficial de Acumulados
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
                        Ranking completo de chuva das 10 estações com barras proporcionais e total do município.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-[#E5E5E5] dark:border-[#233354]">
                      <button
                        type="button"
                        onClick={() => (window as any).openSocialModalChuva?.('24h')}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-[#14213D] hover:bg-[#1c2e54] text-white dark:bg-[#FCA311] dark:hover:bg-[#e0910f] dark:text-[#0B1324] border border-[#14213D] dark:border-[#FCA311] shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Abrir Card de Chuva</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Imagem de Maiores Ventos & Rajadas */}
                  <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-[#14213D] text-[#14213D] dark:text-[#FCA311] border border-[#E5E5E5] dark:border-[#233354]">
                          <Wind className="w-3.5 h-3.5 text-[#FCA311]" />
                          Ventos & Rajadas
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">1080px HD</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#14213D] dark:text-white mt-2">
                        Card Oficial de Ventos & Rajadas
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
                        Maiores ventos e rajadas na orla e bairros, separados da imagem de chuva para postagem oficial.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-[#E5E5E5] dark:border-[#233354]">
                      <button
                        type="button"
                        onClick={() => (window as any).openSocialModalVento?.()}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-[#14213D] hover:bg-[#1c2e54] text-white dark:bg-[#FCA311] dark:hover:bg-[#e0910f] dark:text-[#0B1324] border border-[#14213D] dark:border-[#FCA311] shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Abrir Card de Vento</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Imagem do Tempo Agora */}
                  <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-[#14213D] text-[#14213D] dark:text-[#FCA311] border border-[#E5E5E5] dark:border-[#233354]">
                          <SunMedium className="w-3.5 h-3.5 text-[#FCA311]" />
                          Tempo Agora
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">1080px HD</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#14213D] dark:text-white mt-2">
                        Card Oficial do Tempo Agora
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-1">
                        Temperatura, sensação térmica, umidade, vento e condições costeiras em tempo real.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-[#E5E5E5] dark:border-[#233354]">
                      <button
                        type="button"
                        onClick={() => (window as any).openSocialModalTempoAgora?.()}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-[#14213D] hover:bg-[#1c2e54] text-white dark:bg-[#FCA311] dark:hover:bg-[#e0910f] dark:text-[#0B1324] border border-[#14213D] dark:border-[#FCA311] shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Abrir Card Tempo Agora</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}"""

assert old_export in text_normalized, "old_export not found in text"
text_normalized = text_normalized.replace(old_export, new_export)
print("Replaced section 5 (Social Cards)")

# 6. Marés Header
old_mares1 = """                    isDark
                      ? 'bg-[#0B1324] border-[#233354]'
                      : 'bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-amber-50/60 border-blue-200/90 shadow-xs'"""

new_mares1 = """                    'bg-white dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] shadow-xs'"""

assert old_mares1 in text_normalized, "old_mares1 not found in text"
text_normalized = text_normalized.replace(old_mares1, new_mares1)
print("Replaced section 6 (Marés Header)")

# 7. Marés Cards
old_mares2 = """                          <div
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
                          </div>"""

new_mares2 = """                          <div
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
                          </div>"""

assert old_mares2 in text_normalized, "old_mares2 not found in text"
text_normalized = text_normalized.replace(old_mares2, new_mares2)
print("Replaced section 7 (Marés Cards)")

final_text = text_normalized.replace("\n", "\r\n") if use_crlf else text_normalized

with open(app_path, "w", encoding="utf-8") as f:
    f.write(final_text)

print("SUCCESS: All color sections refactored to official site design system!")
