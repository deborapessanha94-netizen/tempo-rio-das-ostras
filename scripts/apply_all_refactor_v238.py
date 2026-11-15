# -*- coding: utf-8 -*-
import os

app_path = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\src\App.tsx"

with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

use_crlf = "\r\n" in text
text_normalized = text.replace("\r\n", "\n")

# 1. Previsão dos Próximos Dias
old_prev = """                      const cardBgClass = isDark
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
                          )}"""

new_prev = """                      const cardBgClass = 'bg-white dark:bg-[#0B1324] border-[#E5E5E5] dark:border-[#233354] shadow-xs';
                      const leftBorderClass = hasAlert
                        ? 'border-l-4 border-l-[#FCA311]'
                        : 'border-l-4 border-l-[#14213D] dark:border-l-[#233354]';

                      return (
                        <div
                          key={d.dia}
                          className={`p-5 rounded-xl transition-all space-y-3.5 border ${leftBorderClass} ${cardBgClass}`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Calendar className={`w-4 h-4 ${hasAlert ? 'text-[#FCA311]' : isDark ? 'text-[#FCA311]' : 'text-[#14213D]'} shrink-0`} />
                              <span className="font-display text-sm font-bold text-[#14213D] dark:text-white">
                                {d.dia}
                              </span>
                            </div>
                            {d.badge && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight border ${
                                  hasAlert
                                    ? 'bg-[#FCA311]/15 text-[#14213D] dark:text-[#FCA311] border-[#FCA311]/50'
                                    : 'bg-[#F7F8FA] dark:bg-[#14213D] text-slate-700 dark:text-[#E5E5E5]/90 border-[#E5E5E5] dark:border-[#233354]'
                                }`}
                              >
                                {hasAlert && <AlertTriangle className="w-3 h-3 text-[#FCA311]" />}
                                {d.badge}
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-semibold text-slate-600 dark:text-[#E5E5E5]/80">
                            {d.subtitulo}
                          </div>

                          {d.pilares && (
                            <div className="grid grid-cols-2 gap-2.5 text-[11px] font-mono">
                              {d.pilares.temp?.val && (
                                <div className="p-2.5 rounded-lg border bg-[#F7F8FA] dark:bg-[#14213D] border-[#E5E5E5] dark:border-[#233354]">
                                  <span className="text-slate-500 dark:text-[#E5E5E5]/70 font-bold uppercase text-[9.5px] flex items-center gap-1">
                                    <Thermometer className="w-3.5 h-3.5 text-[#FCA311]" /> Temperatura
                                  </span>
                                  <span className="font-bold text-[#14213D] dark:text-white text-xs leading-snug block mt-0.5">
                                    {d.pilares.temp.val}
                                  </span>
                                </div>
                              )}
                              {d.pilares.chuva?.val && (
                                <div className="p-2.5 rounded-lg border bg-[#F7F8FA] dark:bg-[#14213D] border-[#E5E5E5] dark:border-[#233354]">
                                  <span className="text-slate-500 dark:text-[#E5E5E5]/70 font-bold uppercase text-[9.5px] flex items-center gap-1">
                                    <CloudRain className="w-3.5 h-3.5 text-[#FCA311]" /> Chuva
                                  </span>
                                  <span className="font-bold text-[#14213D] dark:text-white text-xs leading-snug block mt-0.5">
                                    {d.pilares.chuva.val.split(' (')[0]}
                                  </span>
                                </div>
                              )}
                              {d.pilares.vento?.val && (
                                <div className="p-2.5 rounded-lg border bg-[#F7F8FA] dark:bg-[#14213D] border-[#E5E5E5] dark:border-[#233354]">
                                  <span className="text-slate-500 dark:text-[#E5E5E5]/70 font-bold uppercase text-[9.5px] flex items-center gap-1">
                                    <Wind className="w-3.5 h-3.5 text-[#FCA311]" /> Vento
                                  </span>
                                  <span className="font-bold text-[#14213D] dark:text-white text-xs leading-snug block mt-0.5">
                                    {d.pilares.vento.val}
                                  </span>
                                </div>
                              )}
                              {d.pilares.mar?.val && (
                                <div className="p-2.5 rounded-lg border bg-[#F7F8FA] dark:bg-[#14213D] border-[#E5E5E5] dark:border-[#233354]">
                                  <span className="text-slate-500 dark:text-[#E5E5E5]/70 font-bold uppercase text-[9.5px] flex items-center gap-1">
                                    <Waves className="w-3.5 h-3.5 text-[#FCA311]" /> Mar na Orla
                                  </span>
                                  <span className="font-bold text-[#14213D] dark:text-white text-xs leading-snug block mt-0.5">
                                    {d.pilares.mar.val}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {textoOficial && (
                            <div className="p-3 rounded-lg border bg-[#F7F8FA] dark:bg-[#14213D]/60 border-[#E5E5E5] dark:border-[#233354]">
                              <p className="text-xs text-slate-700 dark:text-[#E5E5E5]/90 leading-relaxed text-justify">
                                {textoOficial}
                              </p>
                            </div>
                          )}"""

if old_prev in text_normalized:
    text_normalized = text_normalized.replace(old_prev, new_prev)
    print("1. Replaced Previsão dos Próximos Dias")
else:
    print("1. Already replaced Previsão dos Próximos Dias")

# 2. Distribuição Geográfica de Chuva
old_dist = """                                    className="p-3 rounded-lg bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 dark:bg-[#14213D] border border-amber-200/80 dark:border-[#233354] shadow-2xs space-y-1 text-xs"
                                  >
                                    <div className="font-bold text-[#14213D] dark:text-white">{setor.regiao}</div>
                                    <div className="font-mono text-amber-700 dark:text-[#FCA311] font-bold">
                                      {setor.volume_estimado}
                                    </div>"""

new_dist = """                                    className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] space-y-1 text-xs"
                                  >
                                    <div className="font-bold text-[#14213D] dark:text-white">{setor.regiao}</div>
                                    <div className="font-mono text-[#14213D] dark:text-[#FCA311] font-bold">
                                      {setor.volume_estimado}
                                    </div>"""

if old_dist in text_normalized:
    text_normalized = text_normalized.replace(old_dist, new_dist)
    print("2. Replaced Distribuição Geográfica")
else:
    print("2. Already replaced Distribuição Geográfica")

# 3. Panorama Sinótico Geral
old_sinopse = """                        const metaCards = [
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
                        );"""

new_sinopse = """                        const metaCards = [
                          {
                            tag: 'Escoamento & Dinâmica Sinótica',
                            title: 'Configuração Sinótica Regional, Campos de Pressão & Escoamento Troposférico',
                            badgeTech: 'ASAS (1020 hPa) • Cavados em 500 hPa • Advecção de Umidade',
                            icon: Compass,
                          },
                          {
                            tag: 'Termodinâmica & Hidrometeorologia',
                            title: 'Termodinâmica Atmosférica, Instabilidade Convectiva & Resposta Hidrológica do Rio Jundiá',
                            badgeTech: 'Convecção Diurna • Índices CAPE / CINE • Telemetria INEA 2241036',
                            icon: Zap,
                          },
                          {
                            tag: 'Modelagem Numérica & Oceanografia',
                            title: 'Prognóstico Numérico de Mesoescala (ECMWF/GFS), Oceanografia Costeira & Tendência',
                            badgeTech: 'Modelos ECMWF/GFS 12Z • Swell E/SE • Área Delta CHM',
                            icon: Waves,
                          },
                        ];
                        const metaItem = metaCards[idx] || {
                          tag: `Tópico ${idx + 1}`,
                          title: `Diagnóstico Técnico — Setor ${idx + 1}`,
                          badgeTech: 'Telemetria Municipal',
                          icon: Activity,
                        };
                        const IconComponent = metaItem.icon;
                        return (
                          <div
                            key={idx}
                            className="p-4 sm:p-5 rounded-xl border border-l-4 border-l-[#14213D] dark:border-l-[#FCA311] bg-white dark:bg-[#0B1324] border-[#E5E5E5] dark:border-[#233354] shadow-xs space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E5E5E5] dark:border-[#233354]">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 bg-[#F7F8FA] dark:bg-[#14213D] text-[#14213D] dark:text-[#FCA311] border-[#E5E5E5] dark:border-[#233354]">
                                  <IconComponent className="w-3.5 h-3.5 text-[#FCA311]" />
                                  {metaItem.tag}
                                </span>
                                <h3 className="text-xs sm:text-sm font-bold text-[#14213D] dark:text-white">
                                  {metaItem.title}
                                </h3>
                              </div>
                              <span className="text-[10.5px] font-mono px-2.5 py-0.5 rounded-full border bg-[#F7F8FA] dark:bg-[#14213D] text-slate-600 dark:text-[#E5E5E5]/70 border-[#E5E5E5] dark:border-[#233354]">
                                {metaItem.badgeTech}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 dark:text-[#E5E5E5]/90 leading-relaxed text-justify">
                              {paragrafo}
                            </p>
                          </div>
                        );"""

if old_sinopse in text_normalized:
    text_normalized = text_normalized.replace(old_sinopse, new_sinopse)
    print("3. Replaced Panorama Sinótico")
else:
    print("3. Already replaced Panorama Sinótico")

# 4. Glossário Técnico
old_gloss = """                        <div
                          key={g.termo}
                          className={`p-3.5 rounded-lg border space-y-1 text-xs ${
                            isDark ? 'bg-[#0B1324] border-[#233354]' : 'bg-gradient-to-br from-slate-50 to-amber-50/30 border-slate-200'
                          }`}
                        >
                          <div className={`font-semibold ${isDark ? 'text-[#FCA311]' : 'text-amber-800'}`}>{g.termo}</div>
                          <div className={`${isDark ? 'text-[#E5E5E5]/80' : 'text-slate-600'} leading-snug`}>{g.def}</div>
                        </div>"""

new_gloss = """                        <div
                          key={g.termo}
                          className="p-3.5 rounded-lg border space-y-1 text-xs bg-[#F7F8FA] dark:bg-[#0B1324] border-[#E5E5E5] dark:border-[#233354]"
                        >
                          <div className="font-semibold text-[#14213D] dark:text-[#FCA311]">{g.termo}</div>
                          <div className="text-slate-600 dark:text-[#E5E5E5]/80 leading-snug">{g.def}</div>
                        </div>"""

if old_gloss in text_normalized:
    text_normalized = text_normalized.replace(old_gloss, new_gloss)
    print("4. Replaced Glossário")
else:
    print("4. Already replaced Glossário")

# 5. Marés Proxima Mare Box
old_mare_box = """                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        tabuaMares.proxima_mare.tipo === 'PREAMAR'
                          ? isDark ? 'bg-amber-950/60 border-amber-700/60 text-[#FCA311]' : 'bg-orange-100 border-orange-300 text-orange-700 shadow-2xs'
                          : isDark ? 'bg-sky-950/60 border-sky-700/60 text-sky-400' : 'bg-sky-100 border-sky-300 text-sky-700 shadow-2xs'
                      }`}>"""

new_mare_box = """                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-[#F7F8FA] dark:bg-[#14213D] border-[#E5E5E5] dark:border-[#233354] text-[#FCA311]">"""

if old_mare_box in text_normalized:
    text_normalized = text_normalized.replace(old_mare_box, new_mare_box)
    print("5. Replaced Marés Proxima Mare Box")
else:
    print("5. Already replaced Marés Proxima Mare Box")

# 6. Marés Proxima Mare Hour Text
old_mare_hour = """                          <span className="font-mono text-orange-600 dark:text-[#FCA311]">{tabuaMares.proxima_mare.hora}</span>"""
new_mare_hour = """                          <span className="font-mono text-[#14213D] dark:text-[#FCA311]">{tabuaMares.proxima_mare.hora}</span>"""

if old_mare_hour in text_normalized:
    text_normalized = text_normalized.replace(old_mare_hour, new_mare_hour)
    print("6. Replaced Marés Hour Text")
else:
    print("6. Already replaced Marés Hour Text")

final_text = text_normalized.replace("\n", "\r\n") if use_crlf else text_normalized

with open(app_path, "w", encoding="utf-8") as f:
    f.write(final_text)

print("COMPLETED apply_all_refactor_v238!")
