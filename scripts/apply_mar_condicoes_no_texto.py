import os
import json

app_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\src\App.tsx'

with open(app_path, 'r', encoding='utf-8') as f:
    app_code = f.read()

target_app = '''                          {Array.isArray(d.informe_populacao) && d.informe_populacao.length > 0 ? (
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
                            </div>'''

replacement_app = '''                          {Array.isArray(d.informe_populacao) && d.informe_populacao.length > 0 ? (
                            <div className="p-3.5 rounded-lg border bg-[#F7F8FA] dark:bg-[#14213D]/60 border-[#E5E5E5] dark:border-[#233354] space-y-2.5 text-xs text-slate-700 dark:text-[#E5E5E5]/90 leading-relaxed text-justify">
                              {d.informe_populacao.map((paragrafo, pIdx) => (
                                <p key={pIdx}>
                                  {paragrafo}
                                </p>
                              ))}
                            </div>'''

if target_app in app_code:
    app_code = app_code.replace(target_app, replacement_app)
    with open(app_path, 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(app_code)
    print('App.tsx updated (LF match)!')
else:
    target_app_crlf = target_app.replace('\n', '\r\n')
    replacement_app_crlf = replacement_app.replace('\n', '\r\n')
    if target_app_crlf in app_code:
        app_code = app_code.replace(target_app_crlf, replacement_app_crlf)
        with open(app_path, 'w', encoding='utf-8', newline='\r\n') as f:
            f.write(app_code)
        print('App.tsx updated (CRLF match)!')
    else:
        print('Target not found in App.tsx!')

# Update boletim_metadata.json to ensure descricao also has the sea conditions in text
meta_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\data\boletim_metadata.json'
with open(meta_path, 'r', encoding='utf-8') as f:
    meta = json.load(f)

# Update dias_resumo
for d in meta.get('dias_resumo', []):
    inf = d.get('informe_populacao', [])
    mar_p = next((p for p in inf if p.lower().startswith('condições do mar') or p.lower().startswith('mar na orla')), None)
    if mar_p:
        desc = d.get('descricao', '')
        if 'condições do mar' not in desc.lower() and 'mar na orla' not in desc.lower():
            d['descricao'] = f"{desc} {mar_p}"

# Update sinopse_estruturada.evolucao_3_dias
for d in meta.get('sinopse_estruturada', {}).get('evolucao_3_dias', []):
    inf = d.get('informe_populacao', [])
    mar_p = next((p for p in inf if p.lower().startswith('condições do mar') or p.lower().startswith('mar na orla')), None)
    if mar_p:
        desc = d.get('descricao', '')
        if 'condições do mar' not in desc.lower() and 'mar na orla' not in desc.lower():
            d['descricao'] = f"{desc} {mar_p}"

with open(meta_path, 'w', encoding='utf-8') as f:
    json.dump(meta, f, ensure_ascii=False, indent=2)
print('boletim_metadata.json updated!')

# Update auto_bulletin.py
bulletin_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\scripts\auto_bulletin.py'
with open(bulletin_path, 'r', encoding='utf-8') as f:
    bulletin_code = f.read()

target_ab = '''            desc_padrao = (
                f"Previsão de {wmo_desc.lower()} sobre Rio das Ostras. "
                f"Temperaturas variando entre mínima de {d['t_min']:.0f}°C e máxima de {d['t_max']:.0f}°C. "
                f"Volume pluviométrico diário estimado em {dia_chuva:.1f} mm com rajadas de vento de até {dia_rajada:.0f} km/h na faixa litorânea."
            )'''

replacement_ab = '''            desc_padrao = (
                f"Previsão de {wmo_desc.lower()} sobre Rio das Ostras. "
                f"Temperaturas variando entre mínima de {d['t_min']:.0f}°C e máxima de {d['t_max']:.0f}°C. "
                f"Volume pluviométrico diário estimado em {dia_chuva:.1f} mm com rajadas de vento de até {dia_rajada:.0f} km/h na faixa litorânea. "
                f"{t6}"
            )'''

if target_ab in bulletin_code:
    bulletin_code = bulletin_code.replace(target_ab, replacement_ab)
    with open(bulletin_path, 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(bulletin_code)
    print('auto_bulletin.py updated!')
else:
    target_ab_crlf = target_ab.replace('\n', '\r\n')
    replacement_ab_crlf = replacement_ab.replace('\n', '\r\n')
    if target_ab_crlf in bulletin_code:
        bulletin_code = bulletin_code.replace(target_ab_crlf, replacement_ab_crlf)
        with open(bulletin_path, 'w', encoding='utf-8', newline='\r\n') as f:
            f.write(bulletin_code)
        print('auto_bulletin.py updated (CRLF match)!')
    else:
        print('Target not found in auto_bulletin.py!')
