import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
app_path = os.path.join(base_dir, "src", "App.tsx")

with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Add icons to lucide-react import
target_lucide = "  Wind,\n  X,"
replacement_lucide = "  Camera,\n  SunMedium,\n  Wind,\n  X,"
if target_lucide in text:
    text = text.replace(target_lucide, replacement_lucide, 1)
    print("Added Camera, SunMedium to lucide-react import")
else:
    print("Lucide icons already present or pattern changed")

# 2. Add SocialExportModal import
target_css_import = "import { CssExportModal } from './components/CssExportModal';"
replacement_css_import = "import { CssExportModal } from './components/CssExportModal';\nimport { SocialExportModal } from './components/SocialExportModal';"
if target_css_import in text and "SocialExportModal" not in text:
    text = text.replace(target_css_import, replacement_css_import, 1)
    print("Added SocialExportModal import")

# 3. Add buttons to Resumo Pluviometrico header
idx_pluv = text.find("Resumo Pluvio")
if idx_pluv != -1:
    p_close = text.find("</p>", idx_pluv)
    div_close = text.find("</div>", p_close)
    after_div = div_close + len("</div>")
    
    header_buttons = """

                  {/* Ações Rápidas: Imagens Oficiais para Redes Sociais */}
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

    if "Card de Chuva" not in text:
        text = text[:after_div] + header_buttons + text[after_div:]
        print("Added header buttons to Resumo Pluviométrico")

# 4. Add dedicated export section right before Barra Compartilhada de Redes
target_barra = "{/* Barra Compartilhada de Redes + Horizonte de Tempo"
idx_barra = text.find(target_barra)
if idx_barra != -1 and "Exportar Imagens Oficiais para Redes Sociais" not in text:
    dedicated_section = """{/* Seção Oficial: Exportar Imagens de Acumulados de Chuva e Vento */}
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
            )}

            """
    text = text[:idx_barra] + dedicated_section + text[idx_barra:]
    print("Added dedicated export section")

# 5. Render SocialExportModal alongside CssExportModal
target_footer_modal = "<CssExportModal isOpen={isCssModalOpen} onClose={() => setIsCssModalOpen(false)} />"
replacement_footer_modal = """<CssExportModal isOpen={isCssModalOpen} onClose={() => setIsCssModalOpen(false)} />
      <SocialExportModal curWeather={curWeather} acumulados={acumulados} boletimMeta={boletimMeta} />"""
if target_footer_modal in text and "<SocialExportModal" not in text:
    text = text.replace(target_footer_modal, replacement_footer_modal, 1)
    print("Added SocialExportModal to footer")

with open(app_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Applied changes to App.tsx successfully!")
