"""
v256 - Duas alterações:
1. Remove o card "Baixar App" do drawer/menu lateral mobile
2. Adiciona conteúdo real sobre rios de Macaé na aba macae
"""
import re

path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\src\App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# ===== 1. Remover card "Baixar App" do drawer =====
old_drawer_card = '''            {/* Card de Baixar App no topo do menu lateral/mobile */}
            {!isAppInstalled && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#14213D] to-[#1E293B] border border-[#FF8244]/40 shadow-sm space-y-2 text-white mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#FF8244]" />
                    <span className="text-xs font-bold">Aplicativo no Celular</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-[#FF8244] text-[#000000] text-[9px] font-mono font-bold uppercase">Grátis</span>
                </div>
                <p className="text-[11px] text-[#E5E5E5]/80 leading-snug">
                  Tenha acesso direto em tela cheia na sua tela inicial (Android e iPhone).
                </p>
                <button
                  onClick={() => {
                    setShowInstallModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#FF8244] hover:bg-[#e0682a] text-[#000000] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Aplicativo Agora</span>
                </button>
              </div>
            )}'''

if old_drawer_card in content:
    content = content.replace(old_drawer_card, '')
    print("OK: Card Baixar App removido do drawer")
else:
    print("WARN: Card nao encontrado exatamente - verificar manualmente")

# ===== 2. Substituir seção macae por conteúdo rico com rios de Macaé =====
old_macae = '''            {showSub('macae') && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 space-y-4">
                    <div className="pb-3 border-b border-[#E5E5E5] dark:border-[#233354]">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
                        Bacia Hidrográfica RH-VIII
                      </div>
                      <h2 className="font-display text-lg font-semibold text-[#14213D] dark:text-white mt-1">
                        Macaé e das Ostras • Escoamento e Foz
                      </h2>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed">
                      O Rio Jundiá corta áreas urbanas e rurais de Rio das Ostras, banhando os bairros Cantagalo, Âncora, Cláudio Ribeiro e desaguando em direção à orla costeira.
                    </p>
                    <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs space-y-1">
                      <div className="inline-flex items-center gap-1.5 font-semibold text-[#14213D] dark:text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF8244]" aria-hidden="true" />
                        Influência das Marés Oceânicas
                      </div>
                      <div className="text-slate-600 dark:text-[#E5E5E5]/75 leading-relaxed">
                        Em marés astronômicas altas (preamar), o refluxo das águas marinhas diminui o gradiente hidráulico do rio, desacelerando o escoamento pluvial e aumentando o tempo de retenção nos leitos.
                      </div>
                    </div>
                  </div>'''

new_macae_start = '''            {showSub('macae') && (
              <section className="space-y-6">
                {/* Cabeçalho da Bacia */}
                <div className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 space-y-4">
                  <div className="pb-3 border-b border-[#E5E5E5] dark:border-[#233354]">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
                      Bacia Hidrográfica RH-VIII · INEA · ANA
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#14213D] dark:text-white mt-1">
                      Rios de Macaé e Região — Monitoramento Hidrológico
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/75 mt-1">
                      Estações telemétricas e fluviométricas oficiais INEA e ANA na bacia RH-VIII (Macaé e das Ostras)
                    </p>
                  </div>

                  {/* Cards dos principais rios de Macaé */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      {
                        nome: 'Rio Macaé',
                        subtipo: 'Rio Principal — Foz em Macaé',
                        descricao: 'Nasce na Serra do Macaé de Cima (Nova Friburgo), percorre ~170 km e deságua no Atlântico em Macaé. Principal rio da bacia RH-VIII.',
                        estacao: 'ANA 58750000 · INEA Macaé-Foz',
                        url: 'https://telemetriainea.rj.gov.br/',
                        ana_url: 'https://www.snirh.gov.br/hidroweb/mapa',
                        icon: '🌊',
                      },
                      {
                        nome: 'Rio Macabu',
                        subtipo: 'Afluente — Bacia RH-VIII Norte',
                        descricao: 'Afluente relevante da margem esquerda do Rio Macaé. Influencia enchentes nas áreas de Carapebus e Macaé rural.',
                        estacao: 'ANA 58870000 · Carapebus',
                        url: 'https://www.snirh.gov.br/hidroweb/mapa',
                        icon: '🏞️',
                      },
                      {
                        nome: 'Rio Sana',
                        subtipo: 'Cabeceira — Serra do Macaé de Cima',
                        descricao: 'Afluente do Rio Macaé vindo da Serra Verde. Referência para previsão de cheias 12–24h à frente na parte baixa do Macaé.',
                        estacao: 'ANA 58765000 · Mury/Lumiar',
                        url: 'https://www.snirh.gov.br/hidroweb/mapa',
                        icon: '⛰️',
                      },
                      {
                        nome: 'Rio Jundiá',
                        subtipo: 'Rio das Ostras — INEA 2241036',
                        descricao: 'Corta Rio das Ostras (Cantagalo, Âncora, Cláudio Ribeiro). Monitoramento telemétrico em tempo real pelo INEA.',
                        estacao: `Sensor INEA 2241036 · Cota atual: ${rj?.nivel_rio || '--'}`,
                        url: rj?.url || 'https://telemetriainea.rj.gov.br/',
                        icon: '📡',
                        badge: rj?.status_rio,
                      },
                      {
                        nome: 'Canal das Ostras',
                        subtipo: 'Ligação Lagos-Mar · RH-VIII Sul',
                        descricao: 'Sistema lagunar costeiro que conecta as lagoas de Rio das Ostras ao mar. Sofre influência direta das marés e da precipitação local.',
                        estacao: 'Monitoramento INEA/SUBDEC',
                        url: 'https://telemetriainea.rj.gov.br/',
                        icon: '🌐',
                      },
                      {
                        nome: 'Sala de Situação INEA RH-VIII',
                        subtipo: 'Central de Monitoramento Oficial',
                        descricao: 'Sala de Situação do INEA monitora em tempo real todas as estações fluviométricas e pluviométricas da Bacia RH-VIII.',
                        estacao: 'sala.situacao@inea.rj.gov.br',
                        url: 'https://telemetriainea.rj.gov.br/',
                        icon: '🏢',
                        isLink: true,
                      },
                    ].map((rio) => (
                      <div
                        key={rio.nome}
                        className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{rio.icon}</span>
                              <span className="font-semibold text-sm text-[#14213D] dark:text-white">{rio.nome}</span>
                              {rio.badge && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#FF8244]/20 text-[#FF8244]">
                                  {rio.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/60 font-mono mt-0.5">{rio.subtipo}</div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/80 leading-relaxed">{rio.descricao}</p>
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E5E5E5] dark:border-[#233354]">
                          <span className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/60 truncate">{rio.estacao}</span>
                          {rio.url && (
                            <a
                              href={rio.url}
                              target="_blank"
                              rel="noreferrer"
                              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] text-[#14213D] dark:text-[#E5E5E5] transition-colors"
                            >
                              Ver <ExternalLink className="w-3 h-3 text-[#FF8244]" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Links rápidos */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { label: 'Telemetria INEA RJ', url: 'https://telemetriainea.rj.gov.br/' },
                      { label: 'HidroWeb ANA', url: 'https://www.snirh.gov.br/hidroweb/mapa' },
                      { label: 'INEA Alertas Cheias', url: 'https://www.inea.rj.gov.br/recursos-hidricos/alertas-de-cheias/' },
                      { label: 'Boletim RH-VIII', url: 'https://www.inea.rj.gov.br/recursos-hidricos/boletins-hidrologicos/' },
                    ].map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244] text-[#14213D] dark:text-[#E5E5E5] transition-colors bg-white dark:bg-[#14213D]"
                      >
                        {link.label} <ExternalLink className="w-3 h-3 text-[#FF8244]" />
                      </a>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 space-y-4">
                    <div className="pb-3 border-b border-[#E5E5E5] dark:border-[#233354]">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
                        Rio Jundiá · Bacia Hidrográfica RH-VIII
                      </div>
                      <h2 className="font-display text-lg font-semibold text-[#14213D] dark:text-white mt-1">
                        Rio das Ostras • Escoamento e Influência de Marés
                      </h2>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-[#E5E5E5]/85 leading-relaxed">
                      O Rio Jundiá corta áreas urbanas e rurais de Rio das Ostras, banhando os bairros Cantagalo, Âncora, Cláudio Ribeiro e desaguando em direção à orla costeira.
                    </p>
                    <div className="p-3.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-xs space-y-1">
                      <div className="inline-flex items-center gap-1.5 font-semibold text-[#14213D] dark:text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF8244]" aria-hidden="true" />
                        Influência das Marés Oceânicas
                      </div>
                      <div className="text-slate-600 dark:text-[#E5E5E5]/75 leading-relaxed">
                        Em marés astronômicas altas (preamar), o refluxo das águas marinhas diminui o gradiente hidráulico do rio, desacelerando o escoamento pluvial e aumentando o tempo de retenção nos leitos.
                      </div>
                    </div>
                  </div>'''

if old_macae in content:
    content = content.replace(old_macae, new_macae_start)
    print("OK: Secao macae atualizada com rios de Macae")
else:
    print("WARN: Bloco macae nao encontrado exatamente - verificar")
    # Tentar localizar parcialmente
    idx = content.find("showSub('macae')")
    if idx >= 0:
        print(f"   Encontrado showSub(macae) na posicao {idx}")
        print(f"   Contexto: {repr(content[idx:idx+100])}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("OK: Arquivo salvo")
