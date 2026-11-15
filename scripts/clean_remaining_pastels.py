# -*- coding: utf-8 -*-
app_path = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\src\App.tsx"

with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

use_crlf = "\r\n" in text
text_normalized = text.replace("\r\n", "\n")

# 1. status_geral_badge in inspeção
old_s1 = """                        {boletimMeta.inspecao_minuciosa_tempo_severo.status_geral_badge && (
                          <span className="text-[11px] font-mono font-bold uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 dark:bg-[#0B1324] dark:text-[#FCA311] dark:border-[#233354] shadow-2xs">
                            {boletimMeta.inspecao_minuciosa_tempo_severo.status_geral_badge}
                          </span>
                        )}"""

new_s1 = """                        {boletimMeta.inspecao_minuciosa_tempo_severo.status_geral_badge && (
                          <span className="text-[11px] font-mono font-bold uppercase px-3 py-1 rounded-full bg-[#FCA311]/15 text-[#14213D] dark:text-[#FCA311] border border-[#FCA311]/40">
                            {boletimMeta.inspecao_minuciosa_tempo_severo.status_geral_badge}
                          </span>
                        )}"""

assert old_s1 in text_normalized, "old_s1 not found"
text_normalized = text_normalized.replace(old_s1, new_s1)
print("1. Replaced status_geral_badge")

# 2. alerta_rotulo in inspeção
old_s2 = """                                {ins.alerta_rotulo && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 dark:bg-[#14213D] dark:text-[#FCA311] dark:border-[#233354] font-bold shadow-2xs inline-flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-[#FCA311]" />
                                    {ins.alerta_rotulo}
                                  </span>
                                )}"""

new_s2 = """                                {ins.alerta_rotulo && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-[#FCA311]/15 text-[#14213D] dark:text-[#FCA311] border border-[#FCA311]/40 font-bold inline-flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-[#FCA311]" />
                                    {ins.alerta_rotulo}
                                  </span>
                                )}"""

assert old_s2 in text_normalized, "old_s2 not found"
text_normalized = text_normalized.replace(old_s2, new_s2)
print("2. Replaced alerta_rotulo")

# 3. Panorama Sinótico Periodo Badge
old_s3 = """                    {boletimMeta?.periodo && (
                      <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border ${
                        isDark ? 'bg-[#0B1324] text-[#FCA311] border-[#233354]' : 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                      }`}>
                        {boletimMeta.periodo}
                      </span>
                    )}"""

new_s3 = """                    {boletimMeta?.periodo && (
                      <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full border bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#FCA311] border-[#E5E5E5] dark:border-[#233354]">
                        {boletimMeta.periodo}
                      </span>
                    )}"""

assert old_s3 in text_normalized, "old_s3 not found"
text_normalized = text_normalized.replace(old_s3, new_s3)
print("3. Replaced Panorama Sinótico Periodo Badge")

# 4. Tabela de Marés Hoje Badge & Cells
old_s4 = """                                  {dIdx === 0 && (
                                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-[#FCA311] dark:border-amber-700/60 font-bold">
                                      Hoje
                                    </span>
                                  )}"""

new_s4 = """                                  {dIdx === 0 && (
                                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#FCA311]/15 text-[#14213D] dark:text-[#FCA311] border border-[#FCA311]/40 font-bold">
                                      Hoje
                                    </span>
                                  )}"""

assert old_s4 in text_normalized, "old_s4 not found"
text_normalized = text_normalized.replace(old_s4, new_s4)
print("4. Replaced Tabela de Marés Hoje Badge")

old_s5 = """                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold border ${
                                      isHigh
                                        ? isDark ? 'bg-orange-950/50 text-orange-300 border-orange-800/50' : 'bg-orange-50 text-orange-800 border-orange-200 shadow-2xs'
                                        : isDark ? 'bg-sky-950/50 text-sky-300 border-sky-800/50' : 'bg-sky-50 text-sky-800 border-sky-200 shadow-2xs'
                                    }`}>"""

new_s5 = """                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-semibold border ${
                                      isHigh
                                        ? 'bg-[#FCA311]/10 text-[#14213D] dark:text-[#FCA311] border-[#FCA311]/30'
                                        : 'bg-[#F7F8FA] dark:bg-[#0B1324] text-slate-700 dark:text-[#E5E5E5]/90 border-[#E5E5E5] dark:border-[#233354]'
                                    }`}>"""

assert old_s5 in text_normalized, "old_s5 not found"
text_normalized = text_normalized.replace(old_s5, new_s5)
print("5. Replaced Tabela de Marés Cells")

final_text = text_normalized.replace("\n", "\r\n") if use_crlf else text_normalized

with open(app_path, "w", encoding="utf-8") as f:
    f.write(final_text)

print("SUCCESS: Cleaned remaining pastel colors!")
