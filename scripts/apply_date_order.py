import re
import json

# 1. Update src/App.tsx
with open("src/App.tsx", "r", encoding="utf-8") as f:
    app_text = f.read()

target_start = "{inmetAvisos.length > 0 ? ("
target_end = '                      return (\n                        <article'

s_idx = app_text.find(target_start)
e_idx = app_text.find(target_end, s_idx)

if s_idx == -1 or e_idx == -1:
    print("Could not find target in App.tsx!")
    exit(1)

old_slice = app_text[s_idx:e_idx]

new_slice = """{inmetAvisos.length > 0 ? (() => {
                  // Cálculo exato no fuso horário de Rio das Ostras / Brasília (UTC-3)
                  const nowBrt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
                  const nowMs = nowBrt.getTime();

                  const parseAlertDate = (dStr?: string, hStr?: string) => {
                    if (!dStr) return null;
                    const cleanD = dStr.split('T')[0].split(' ')[0].trim();
                    let cleanH = (hStr || (dStr.includes(' ') ? dStr.split(' ')[1] : '00:00')).replace('h', '').trim();
                    if (cleanD.includes('/')) {
                      const [dia, mes, ano] = cleanD.split('/').map(Number);
                      const [hh, mm] = cleanH.split(':').map(Number);
                      return new Date(ano, mes - 1, dia, hh || 0, mm || 0, 0);
                    } else if (cleanD.includes('-')) {
                      const [ano, mes, dia] = cleanD.split('-').map(Number);
                      const [hh, mm] = cleanH.split(':').map(Number);
                      return new Date(ano, mes - 1, dia, hh || 0, mm || 0, 0);
                    }
                    return null;
                  };

                  const getAlertTimeMs = (dStr?: string, hStr?: string) => {
                    const d = parseAlertDate(dStr, hStr);
                    return d ? d.getTime() : 0;
                  };

                  const sortedAvisos = inmetAvisos
                    .filter((av) => {
                      if (alertaFiltroLocal === 'ostras') return av.eh_direto_ostras !== false;
                      if (alertaFiltroLocal === 'outros') return av.eh_direto_ostras === false;
                      return true;
                    })
                    .slice()
                    .sort((a, b) => {
                      const startA = getAlertTimeMs(a.inicio || a.data_inicio, a.hora_inicio);
                      const startB = getAlertTimeMs(b.inicio || b.data_inicio, b.hora_inicio);
                      if (startA !== startB) return startA - startB; // Ordem cronológica por data de início (mais próximo primeiro)
                      const endA = getAlertTimeMs(a.fim || a.data_fim, a.hora_fim);
                      const endB = getAlertTimeMs(b.fim || b.data_fim, b.hora_fim);
                      if (endA !== endB) return endA - endB;
                      const ostrasA = a.eh_direto_ostras !== false ? 1 : 0;
                      const ostrasB = b.eh_direto_ostras !== false ? 1 : 0;
                      if (ostrasA !== ostrasB) return ostrasB - ostrasA;
                      return (Number(a.id) || 0) - (Number(b.id) || 0);
                    });

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {sortedAvisos.map((av) => {
                        const startDate = parseAlertDate(av.inicio || av.data_inicio, av.hora_inicio);
                        const endDate = parseAlertDate(av.fim || av.data_fim, av.hora_fim);

                        let vigenciaLabel = 'Vigente Agora';
                        let vigenciaBadgeClass = 'bg-[#F7F8FA] dark:bg-[#0B1324] text-[#FCA311] border-[#FCA311]/50 font-bold';

                        if (startDate) {
                          const startMs = startDate.getTime();
                          if (nowMs < startMs) {
                            const hTxt = av.hora_inicio ? `${av.hora_inicio}h` : '';
                            vigenciaLabel = hTxt ? `Programado (${hTxt})` : 'Programado';
                            vigenciaBadgeClass = 'bg-[#F7F8FA] dark:bg-[#0B1324] text-slate-600 dark:text-[#E5E5E5]/80 border-[#E5E5E5] dark:border-[#233354] font-medium';
                          }
                        }
"""

app_text = app_text[:s_idx] + new_slice + app_text[e_idx:]

# Also update the closing of the inmetAvisos block
old_close = """                        </article>
                      );
                    })}
                  </div>
                ) : ("""

new_close = """                        </article>
                      );
                    })}
                    </div>
                  );
                })() : ("""

if old_close in app_text:
    app_text = app_text.replace(old_close, new_close, 1)
    print("SUCCESS: Updated App.tsx closure!")
else:
    print("FAILED to find old_close in App.tsx")
    exit(1)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(app_text)
print("SUCCESS: App.tsx updated with chronological date sorting!")

# 2. Update scripts/collector.py
with open("scripts/collector.py", "r", encoding="utf-8") as f:
    col_text = f.read()

old_col_sort = "all_list.sort(key=lambda it: (it.get('eh_direto_ostras', False), it.get('fim', '')), reverse=True)"
new_col_sort = """def alert_sort_key(it):
            ini = str(it.get('inicio', '') or it.get('data_inicio', ''))
            fim = str(it.get('fim', '') or it.get('data_fim', ''))
            return (ini, fim, it.get('id', 0))
        all_list.sort(key=alert_sort_key)"""

if old_col_sort in col_text:
    col_text = col_text.replace(old_col_sort, new_col_sort, 1)
    with open("scripts/collector.py", "w", encoding="utf-8") as f:
        f.write(col_text)
    print("SUCCESS: Updated scripts/collector.py sorting!")
else:
    print("WARNING: old_col_sort not found in collector.py")

# 3. Update scripts/sync_data.py
with open("scripts/sync_data.py", "r", encoding="utf-8") as f:
    sync_text = f.read()

old_sync_block = """        def alert_rank(item):
            score = 0
            if item.get('eh_direto_ostras'): score += 100
            if item.get('severidade') == 'Grande Perigo': score += 50
            elif item.get('severidade') == 'Perigo': score += 30
            # Prefer active/upcoming
            dt_fim = str(item.get('fim', ''))
            score += hash(item.get('id', 0)) % 10
            return (item.get('fim', ''), score)

        all_alerts.sort(key=alert_rank, reverse=True)"""

new_sync_block = """        def alert_rank(item):
            ini = str(item.get('inicio', '') or item.get('data_inicio', ''))
            fim = str(item.get('fim', '') or item.get('data_fim', ''))
            return (ini, fim, item.get('id', 0))

        all_alerts.sort(key=alert_rank)"""

if old_sync_block in sync_text:
    sync_text = sync_text.replace(old_sync_block, new_sync_block, 1)
    with open("scripts/sync_data.py", "w", encoding="utf-8") as f:
        f.write(sync_text)
    print("SUCCESS: Updated scripts/sync_data.py sorting!")
else:
    print("WARNING: old_sync_block not found in sync_data.py")

# 4. Sort data/inmet_avisos.json
with open("data/inmet_avisos.json", "r", encoding="utf-8") as f:
    avisos_data = json.load(f)

avisos_data.sort(key=lambda it: (
    str(it.get('inicio', '') or it.get('data_inicio', '')),
    str(it.get('fim', '') or it.get('data_fim', '')),
    it.get('id', 0)
))

with open("data/inmet_avisos.json", "w", encoding="utf-8") as f:
    json.dump(avisos_data, f, ensure_ascii=False, indent=2)
print("SUCCESS: Sorted data/inmet_avisos.json chronologically!")
