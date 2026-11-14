import re

app_path = r'src/App.tsx'

with open(app_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update isDark state and useEffect to persist and read from localStorage
old_isDark_block = """  const [isDark, setIsDark] = useState(true);
  const [isCssModalOpen, setIsCssModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);"""

new_isDark_block = """  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
    } catch {}
    return false; // Default to Light Mode or saved theme
  });
  const [isCssModalOpen, setIsCssModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);"""

assert old_isDark_block in code, "old_isDark_block not found!"
code = code.replace(old_isDark_block, new_isDark_block, 1)

old_useEffect_theme = """  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDark]);"""

new_useEffect_theme = """  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      try { localStorage.setItem('theme', 'dark'); } catch {}
    } else {
      root.classList.remove('dark');
      try { localStorage.setItem('theme', 'light'); } catch {}
    }
  }, [isDark]);"""

assert old_useEffect_theme in code, "old_useEffect_theme not found!"
code = code.replace(old_useEffect_theme, new_useEffect_theme, 1)

# 2. Replace Previsão dos Próximos Dias block
# Find start of dias_resumo.map
patt_dias = r'\{boletimMeta\?\.dias_resumo && boletimMeta\.dias_resumo\.length > 0 \? \(.*?(?=\) : \()'

new_dias_block = """{boletimMeta?.dias_resumo && boletimMeta.dias_resumo.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {boletimMeta.dias_resumo.map((d, idx) => {
                      const omMin = openMeteo?.daily?.temperature_2m_min?.[idx];
                      const omMax = openMeteo?.daily?.temperature_2m_max?.[idx];
                      const omRain = openMeteo?.daily?.precipitation_sum?.[idx];
                      const textoOficial =
                        Array.isArray(d.informe_populacao) && d.informe_populacao.length > 0
                          ? d.informe_populacao.join(' ')
                          : d.descricao;
                      const hasAlert =
                        d.badge?.toUpperCase().includes('AVISO') ||
                        d.badge?.toUpperCase().includes('ATENÇÃO') ||
                        d.badge_tipo === 'warning';

                      const cardBgClass = isDark
                        ? 'bg-[#0B1324] border-[#233354]'
                        : hasAlert
                        ? 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 border-amber-300/90 shadow-xs'
                        : 'bg-gradient-to-br from-sky-50/60 via-white to-slate-50/60 border-sky-200/80 shadow-xs';

                      const leftBorderClass = hasAlert ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-sky-500';

                      return (
                        <div
                          key={d.dia}
                          className={`p-5 rounded-xl transition-all space-y-3.5 border ${leftBorderClass} ${cardBgClass}`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Calendar className={`w-4 h-4 ${hasAlert ? (isDark ? 'text-[#FCA311]' : 'text-amber-600') : (isDark ? 'text-sky-400' : 'text-sky-600')} shrink-0`} />
                              <span className={`font-display text-sm font-bold ${isDark ? 'text-white' : 'text-[#14213D]'}`}>
                                {d.dia}
                              </span>
                            </div>
                            {d.badge && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight border ${
                                  hasAlert
                                    ? isDark
                                      ? 'bg-amber-950/60 text-[#FCA311] border-amber-700/60'
                                      : 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                                    : isDark
                                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/60'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs'
                                }`}
                              >
                                {hasAlert && <AlertTriangle className={`w-3 h-3 ${isDark ? 'text-[#FCA311]' : 'text-amber-600'}`} />}
                                {d.badge}
                              </span>
                            )}
                          </div>

                          <div className={`text-xs font-semibold ${isDark ? 'text-[#E5E5E5]/90' : 'text-slate-700'}`}>
                            {d.subtitulo}
                          </div>

                          {d.pilares && (
                            <div className="grid grid-cols-2 gap-2.5 text-[11px] font-mono">
                              {d.pilares.temp?.val && (
                                <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#14213D] border-[#233354]' : 'bg-gradient-to-br from-orange-50 to-amber-50/80 border-orange-200 shadow-2xs'}`}>
                                  <span className={`${isDark ? 'text-orange-400' : 'text-orange-700'} font-bold uppercase text-[9.5px] flex items-center gap-1`}>
                                    <Thermometer className="w-3.5 h-3.5 text-orange-500" /> Temperatura
                                  </span>
                                  <span className={`font-bold ${isDark ? 'text-white' : 'text-orange-950'} text-xs leading-snug block mt-0.5`}>
                                    {d.pilares.temp.val}
                                  </span>
                                </div>
                              )}
                              {d.pilares.chuva?.val && (
                                <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#14213D] border-[#233354]' : 'bg-gradient-to-br from-sky-50 to-blue-50/80 border-sky-200 shadow-2xs'}`}>
                                  <span className={`${isDark ? 'text-sky-400' : 'text-sky-700'} font-bold uppercase text-[9.5px] flex items-center gap-1`}>
                                    <CloudRain className="w-3.5 h-3.5 text-sky-500" /> Chuva
                                  </span>
                                  <span className={`font-bold ${isDark ? 'text-white' : 'text-sky-950'} text-xs leading-snug block mt-0.5`}>
                                    {d.pilares.chuva.val.split(' (')[0]}
                                  </span>
                                </div>
                              )}
                              {d.pilares.vento?.val && (
                                <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#14213D] border-[#233354]' : 'bg-gradient-to-br from-teal-50 to-emerald-50/80 border-teal-200 shadow-2xs'}`}>
                                  <span className={`${isDark ? 'text-teal-400' : 'text-teal-700'} font-bold uppercase text-[9.5px] flex items-center gap-1`}>
                                    <Wind className="w-3.5 h-3.5 text-teal-500" /> Vento
                                  </span>
                                  <span className={`font-bold ${isDark ? 'text-white' : 'text-teal-950'} text-xs leading-snug block mt-0.5`}>
                                    {d.pilares.vento.val}
                                  </span>
                                </div>
                              )}
                              {d.pilares.mar?.val && (
                                <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#14213D] border-[#233354]' : 'bg-gradient-to-br from-indigo-50 to-blue-50/80 border-indigo-200 shadow-2xs'}`}>
                                  <span className={`${isDark ? 'text-indigo-400' : 'text-indigo-700'} font-bold uppercase text-[9.5px] flex items-center gap-1`}>
                                    <Waves className="w-3.5 h-3.5 text-indigo-500" /> Mar na Orla
                                  </span>
                                  <span className={`font-bold ${isDark ? 'text-white' : 'text-indigo-950'} text-xs leading-snug block mt-0.5`}>
                                    {d.pilares.mar.val}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {textoOficial && (
                            <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#14213D]/60 border-[#233354]/60' : 'bg-white/80 border-slate-200/80 shadow-2xs'}`}>
                              <p className={`text-xs ${isDark ? 'text-[#E5E5E5]/90' : 'text-slate-700'} leading-relaxed text-justify`}>
                                {textoOficial}
                              </p>
                            </div>
                          )}

                          {!d.pilares && omMin !== undefined && omMax !== undefined && (
                            <div className={`pt-2 border-t ${isDark ? 'border-[#233354] text-[#E5E5E5]/75' : 'border-[#E5E5E5] text-slate-500'} flex items-center gap-4 font-mono text-xs`}>
                              <span>Mín {Math.round(omMin)}°C / Máx {Math.round(omMax)}°C</span>
                              {omRain !== undefined && <span>Chuva: {omRain.toFixed(1)} mm</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>"""

code, n1 = re.subn(patt_dias, new_dias_block, code, flags=re.DOTALL)
assert n1 == 1, f"Failed to replace dias_resumo block: {n1}"

# 3. Replace Panorama Sinótico Geral block
patt_sinotico = r'\{showSub\(\'sinotico\'\) && \(.*?(?=\n\s*\{showSub\(\'plancon\'\)\s*&&)'

new_sinotico_block = """{showSub('sinotico') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-5">
                <div className="border-b border-[#E5E5E5] dark:border-[#233354] pb-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="font-display text-xl font-semibold text-[#14213D] dark:text-white">
                      Panorama Sinótico Geral
                    </h2>
                    {boletimMeta?.periodo && (
                      <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border ${
                        isDark ? 'bg-[#0B1324] text-[#FCA311] border-[#233354]' : 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                      }`}>
                        {boletimMeta.periodo}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/80 mt-1.5 leading-relaxed">
                    Diagnóstico sinótico e termodinâmico da troposfera, modelagem numérica de mesoescala (ECMWF/GFS/COSMO), hidrometeorologia da Bacia do Rio Jundiá e oceanografia costeira (Carta Sinótica CHM 12Z)
                  </p>
                </div>

                {boletimMeta?.sinopse_geral ? (
                  <div className="space-y-4">
                    {boletimMeta.sinopse_geral
                      .split('\\n\\n')
                      .filter((p) => p.trim())
                      .map((paragrafo, idx) => {
                        const metaCards = [
                          {
                            tag: 'Escoamento & Dinâmica Sinótica',
                            title: 'Configuração Sinótica Regional, Campos de Pressão & Escoamento Troposférico',
                            badgeTech: 'ASAS (1020 hPa) • Cavados em 500 hPa • Advecção de Umidade',
                            borderLeft: 'border-l-blue-500',
                            cardBg: isDark ? 'bg-[#0B1324] border-[#233354]' : 'bg-gradient-to-br from-blue-50/60 via-white to-sky-50/40 border-blue-200/90 shadow-xs',
                            chipStyle: isDark ? 'bg-blue-950/60 text-blue-300 border-blue-700/60' : 'bg-blue-100 text-blue-900 border-blue-300 shadow-2xs',
                            techStyle: isDark ? 'bg-blue-950/40 text-blue-200 border-blue-800/40' : 'bg-blue-50 text-blue-800 border-blue-200',
                            icon: Compass,
                            iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
                          },
                          {
                            tag: 'Termodinâmica & Hidrometeorologia',
                            title: 'Termodinâmica Atmosférica, Instabilidade Convectiva & Resposta Hidrológica do Rio Jundiá',
                            badgeTech: 'Convecção Diurna • Índices CAPE / CINE • Telemetria INEA 2241036',
                            borderLeft: 'border-l-amber-500',
                            cardBg: isDark ? 'bg-[#0B1324] border-[#233354]' : 'bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 border-amber-200/90 shadow-xs',
                            chipStyle: isDark ? 'bg-amber-950/60 text-[#FCA311] border-amber-700/60' : 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs',
                            techStyle: isDark ? 'bg-amber-950/40 text-amber-200 border-amber-800/40' : 'bg-amber-50 text-amber-800 border-amber-200',
                            icon: Zap,
                            iconColor: isDark ? 'text-[#FCA311]' : 'text-amber-600',
                          },
                          {
                            tag: 'Modelagem Numérica & Oceanografia',
                            title: 'Prognóstico Numérico de Mesoescala (ECMWF/GFS), Oceanografia Costeira & Tendência',
                            badgeTech: 'Modelos ECMWF/GFS 12Z • Swell E/SE • Área Delta CHM',
                            borderLeft: 'border-l-teal-500',
                            cardBg: isDark ? 'bg-[#0B1324] border-[#233354]' : 'bg-gradient-to-br from-teal-50/60 via-white to-emerald-50/40 border-teal-200/90 shadow-xs',
                            chipStyle: isDark ? 'bg-teal-950/60 text-teal-300 border-teal-700/60' : 'bg-teal-100 text-teal-900 border-teal-300 shadow-2xs',
                            techStyle: isDark ? 'bg-teal-950/40 text-teal-200 border-teal-800/40' : 'bg-teal-50 text-teal-800 border-teal-200',
                            icon: Waves,
                            iconColor: isDark ? 'text-teal-400' : 'text-teal-600',
                          },
                        ];
                        const metaItem = metaCards[idx] || {
                          tag: `Tópico ${idx + 1}`,
                          title: `Diagnóstico Técnico — Setor ${idx + 1}`,
                          badgeTech: 'Telemetria Municipal',
                          borderLeft: 'border-l-[#FCA311]',
                          cardBg: isDark ? 'bg-[#0B1324] border-[#233354]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100/50 border-slate-200',
                          chipStyle: isDark ? 'bg-[#14213D] text-[#FCA311] border-[#233354]' : 'bg-slate-100 text-[#14213D] border-slate-300',
                          techStyle: isDark ? 'bg-[#0B1324] text-[#E5E5E5]/70 border-[#233354]' : 'bg-slate-50 text-slate-700 border-slate-200',
                          icon: Activity,
                          iconColor: isDark ? 'text-[#FCA311]' : 'text-[#14213D]',
                        };
                        const IconComponent = metaItem.icon;
                        return (
                          <div
                            key={idx}
                            className={`p-4 sm:p-5 rounded-xl border border-l-4 ${metaItem.borderLeft} ${metaItem.cardBg} shadow-xs space-y-3`}
                          >
                            <div className={`flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b ${isDark ? 'border-[#233354]' : 'border-slate-200/80'}`}>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[10.5px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${metaItem.chipStyle}`}>
                                  <IconComponent className={`w-3 h-3 ${metaItem.iconColor}`} />
                                  {metaItem.tag}
                                </span>
                                <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-[#14213D]'}`}>
                                  {metaItem.title}
                                </h3>
                              </div>
                              <span className={`text-[10.5px] font-mono px-2.5 py-0.5 rounded-full border ${metaItem.techStyle}`}>
                                {metaItem.badgeTech}
                              </span>
                            </div>
                            <p className={`text-xs sm:text-sm ${isDark ? 'text-[#E5E5E5]/90' : 'text-slate-700'} leading-relaxed text-justify`}>
                              {paragrafo}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-700 dark:text-[#E5E5E5]/90 leading-relaxed">
                    Carregando diagnóstico sinótico oficial...
                  </p>
                )}

                {boletimMeta?.glossario && boletimMeta.glossario.length > 0 && (
                  <div className="pt-4 border-t border-[#E5E5E5] dark:border-[#233354] space-y-3">
                    <h3 className="font-display text-sm font-semibold text-[#14213D] dark:text-white">
                      Glossário Técnico Meteorológico
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {boletimMeta.glossario.map((g) => (
                        <div
                          key={g.termo}
                          className={`p-3.5 rounded-lg border space-y-1 text-xs ${
                            isDark ? 'bg-[#0B1324] border-[#233354]' : 'bg-gradient-to-br from-slate-50 to-amber-50/30 border-slate-200'
                          }`}
                        >
                          <div className={`font-semibold ${isDark ? 'text-[#FCA311]' : 'text-amber-800'}`}>{g.termo}</div>
                          <div className={`${isDark ? 'text-[#E5E5E5]/80' : 'text-slate-600'} leading-snug`}>{g.def}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}"""

code, n2 = re.subn(patt_sinotico, new_sinotico_block, code, flags=re.DOTALL)
assert n2 == 1, f"Failed to replace sinotico block: {n2}"

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Successfully applied perfect theme colors for light & dark modes!")
