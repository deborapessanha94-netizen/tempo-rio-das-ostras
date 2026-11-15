"""
v257 - Adiciona sub-aba Cartas Sinóticas (Marinha CHM 00Z/12Z + INMET 00Z/12Z)
"""
from datetime import datetime, timezone, timedelta

path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\src\App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# ===== 1. Adiciona sub-aba na lista boletim =====
old_boletim_subs = "    { id: 'meteogramas', label: 'Meteogramas Numéricos', shortLabel: 'Meteogramas' },"
new_boletim_subs = """    { id: 'cartas_sin', label: 'Cartas Sinóticas Oficiais', shortLabel: 'Cartas Sin.' },
    { id: 'meteogramas', label: 'Meteogramas Numéricos', shortLabel: 'Meteogramas' },"""

if old_boletim_subs in content:
    content = content.replace(old_boletim_subs, new_boletim_subs)
    print("OK: Sub-aba cartas_sin adicionada ao boletim")
else:
    print("WARN: Sub-aba boletim nao encontrada")

# ===== 2. Adiciona estado cartasSinView =====
old_state = "  const [meteoView, setMeteoView] = useState<'cptec' | 'inmet' | 'wwatch'>(() => {"
new_state = """  const [cartasSinView, setCartasSinView] = useState<'marinha_00' | 'marinha_12' | 'inmet_00' | 'inmet_12'>('marinha_12');
  const [meteoView, setMeteoView] = useState<'cptec' | 'inmet' | 'wwatch'>(() => {"""

if old_state in content:
    content = content.replace(old_state, new_state)
    print("OK: Estado cartasSinView adicionado")
else:
    print("WARN: Estado meteoView nao encontrado")

# ===== 3. Adiciona bloco JSX das cartas sinóticas antes de showSub('meteogramas') =====
old_meteo_block = "            {showSub('meteogramas') && ("
new_cartas_block = """            {showSub('cartas_sin') && (() => {
              // URLs das cartas sinóticas - geradas dinamicamente por data UTC
              const nowUtc = new Date();
              // Data UTC atual no formato YYMMDD para a Marinha CHM
              const pad2 = (n: number) => String(n).padStart(2, '0');
              const yy = String(nowUtc.getUTCFullYear()).slice(2);
              const mm = pad2(nowUtc.getUTCMonth() + 1);
              const dd = pad2(nowUtc.getUTCDate());
              const yyyymmdd = `${nowUtc.getUTCFullYear()}${mm}${dd}`;
              const yymmdd = `${yy}${mm}${dd}`;

              // Carta Marinha CHM: https://www.marinha.mil.br/chm/sites/www.marinha.mil.br.chm/files/YYYY-MM/CYYMMDDHR.png
              // Código: C + YYMMDD + HH (00 ou 12)
              const marinhaBase = `https://www.marinha.mil.br/chm/sites/www.marinha.mil.br.chm/files/${nowUtc.getUTCFullYear()}-${mm}`;
              const marinha00Url = `${marinhaBase}/C${yymmdd}00.png`;
              const marinha12Url = `${marinhaBase}/C${yymmdd}12.png`;

              // INMET: Análise da Situação Atual
              // URL das imagens: https://apiinmet.inmet.gov.br/static/cartasinotica/YYYYMMDD_HH.gif
              // ou https://tempo.inmet.gov.br/static/images/analise/YYYYMMDD_HH.gif (testar ambos)
              const inmetBase = `https://apiinmet.inmet.gov.br/static/cartasinotica`;
              const inmet00Url = `${inmetBase}/${yyyymmdd}00.gif`;
              const inmet12Url = `${inmetBase}/${yyyymmdd}12.gif`;

              const cartas = [
                {
                  id: 'marinha_00' as const,
                  label: 'Marinha 00Z',
                  badge: 'CHM · Marinha do Brasil',
                  titulo: 'Carta Sinótica Marinha 00 UTC',
                  desc: 'Análise sinótica de superfície emitida pelo Centro de Hidrografia da Marinha (CHM) para o horário de 00 UTC (21h Brasília).',
                  imgUrl: marinha00Url,
                  linkUrl: 'https://www.marinha.mil.br/chm/cartassinoticas',
                  linkLabel: 'Portal CHM',
                  fonte: 'Centro de Hidrografia da Marinha (CHM) · Marinha do Brasil',
                },
                {
                  id: 'marinha_12' as const,
                  label: 'Marinha 12Z',
                  badge: 'CHM · Marinha do Brasil',
                  titulo: 'Carta Sinótica Marinha 12 UTC',
                  desc: 'Análise sinótica de superfície emitida pelo Centro de Hidrografia da Marinha (CHM) para o horário de 12 UTC (09h Brasília).',
                  imgUrl: marinha12Url,
                  linkUrl: 'https://www.marinha.mil.br/chm/cartassinoticas',
                  linkLabel: 'Portal CHM',
                  fonte: 'Centro de Hidrografia da Marinha (CHM) · Marinha do Brasil',
                },
                {
                  id: 'inmet_00' as const,
                  label: 'INMET 00Z',
                  badge: 'INMET · Análise Sinótica',
                  titulo: 'Análise Sinótica INMET 00 UTC',
                  desc: 'Carta de análise sinótica oficial do INMET — posição dos sistemas meteorológicos (frentes, cavados, anticiclones) para 00 UTC (21h Brasília).',
                  imgUrl: inmet00Url,
                  linkUrl: 'https://tempo.inmet.gov.br/AnaliseSituacaoAtual',
                  linkLabel: 'Portal INMET',
                  fonte: 'Instituto Nacional de Meteorologia (INMET) · MAPA',
                },
                {
                  id: 'inmet_12' as const,
                  label: 'INMET 12Z',
                  badge: 'INMET · Análise Sinótica',
                  titulo: 'Análise Sinótica INMET 12 UTC',
                  desc: 'Carta de análise sinótica oficial do INMET — posição dos sistemas meteorológicos (frentes, cavados, anticiclones) para 12 UTC (09h Brasília).',
                  imgUrl: inmet12Url,
                  linkUrl: 'https://tempo.inmet.gov.br/AnaliseSituacaoAtual',
                  linkLabel: 'Portal INMET',
                  fonte: 'Instituto Nacional de Meteorologia (INMET) · MAPA',
                },
              ];
              const cartaAtual = cartas.find((c) => c.id === cartasSinView) ?? cartas[1];

              return (
                <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5E5E5] dark:border-[#233354]">
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
                        Marinha do Brasil (CHM) · INMET
                      </div>
                      <h2 className="font-display text-lg font-semibold text-[#14213D] dark:text-white mt-1">
                        Cartas Sinóticas Oficiais — 00Z e 12Z
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-0.5">
                        Análise de superfície: posição de frentes, anticiclones, cavados e sistemas atuantes na América do Sul.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg">
                      {cartas.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setCartasSinView(c.id)}
                          className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                            cartasSinView === c.id
                              ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-semibold'
                              : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-[#14213D] dark:hover:text-white'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#F7F8FA] dark:bg-[#14213D] text-[#14213D] dark:text-[#FF8244] border border-[#E5E5E5] dark:border-[#233354]">
                            {cartaAtual.badge}
                          </span>
                          <span className="text-xs font-semibold text-[#14213D] dark:text-white">
                            {cartaAtual.titulo}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/80 mt-1">{cartaAtual.desc}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={cartaAtual.imgUrl}
                          download
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-white hover:bg-slate-50 dark:hover:bg-[#1f2f4e] transition-colors"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" /> Baixar Carta
                        </a>
                        <a
                          href={cartaAtual.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] hover:opacity-90 transition-opacity"
                        >
                          {cartaAtual.linkLabel} <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="relative rounded-xl border border-[#E5E5E5] dark:border-[#233354] bg-white p-3 flex flex-col items-center justify-center overflow-hidden min-h-[220px]">
                      <a
                        href={cartaAtual.imgUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Clique para abrir em alta resolução"
                        className="block w-full text-center group cursor-zoom-in"
                      >
                        <img
                          key={cartaAtual.imgUrl}
                          src={cartaAtual.imgUrl}
                          alt={cartaAtual.titulo}
                          crossOrigin="anonymous"
                          className="w-full max-h-[750px] object-contain mx-auto rounded transition-transform group-hover:scale-[1.01]"
                          onError={(e) => {
                            const img = e.currentTarget;
                            if (!img.dataset.fallback) {
                              img.dataset.fallback = '1';
                              // Tenta data anterior se hoje ainda nao publicou
                              const d = new Date();
                              d.setUTCDate(d.getUTCDate() - 1);
                              const p2 = (n: number) => String(n).padStart(2, '0');
                              const yy2 = String(d.getUTCFullYear()).slice(2);
                              const mm2 = p2(d.getUTCMonth() + 1);
                              const dd2 = p2(d.getUTCDate());
                              const yyyymmdd2 = `${d.getUTCFullYear()}${mm2}${dd2}`;
                              const yymmdd2 = `${yy2}${mm2}${dd2}`;
                              const hr = cartaAtual.id.endsWith('00') ? '00' : '12';
                              if (cartaAtual.id.startsWith('marinha')) {
                                img.src = `https://www.marinha.mil.br/chm/sites/www.marinha.mil.br.chm/files/${d.getUTCFullYear()}-${mm2}/C${yymmdd2}${hr}.png`;
                              } else {
                                img.src = `https://apiinmet.inmet.gov.br/static/cartasinotica/${yyyymmdd2}${hr}.gif`;
                              }
                            }
                          }}
                        />
                      </a>
                      <div className="w-full pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 mt-2 gap-2">
                        <span>Fonte: {cartaAtual.fonte}</span>
                        <span className="italic shrink-0">Clique para abrir em resolução cheia</span>
                      </div>
                    </div>

                    {/* Grade das 4 cartas em miniatura */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {cartas.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setCartasSinView(c.id)}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            cartasSinView === c.id
                              ? 'border-[#FF8244] shadow-md scale-[1.02]'
                              : 'border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]/50'
                          }`}
                        >
                          <img
                            src={c.imgUrl}
                            alt={c.titulo}
                            className="w-full aspect-[4/3] object-cover bg-slate-100 dark:bg-[#0B1324]"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-[#14213D]/80 text-white text-[10px] font-mono font-bold text-center py-1">
                            {c.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              );
            })()}

            {showSub('meteogramas') && ("""

if old_meteo_block in content:
    content = content.replace(old_meteo_block, new_cartas_block)
    print("OK: Bloco JSX cartas sinoticas adicionado")
else:
    print("WARN: Bloco meteogramas nao encontrado")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("OK: Arquivo salvo")
