import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

pos_start = text.find("if (st.categoria === 'inea') {", 99000)
pos_end = text.find("// CARD DAS 9 ESTA", pos_start)

new_block = """if (st.categoria === 'inea') {
        // CARD EXCLUSIVO DE TELEMETRIA HIDROLÓGICA (PALETA NÓRDICA CERÂMICA DO SITE)
        const nivelRio = st.nivel_rio || '1,59 m';
        const calhaPct = st.alerta_maximo_pct || 56;
        const cotaTransbordo = st.cota_transbordo || '2,84 m';
        const statusRio = st.status_rio || 'Vigilância';

        return `
          <div class="station-card station-item-card p-4 rounded-2xl bg-white border-2 border-[#38bdf8]/60 flex flex-col justify-between space-y-3 shadow-xs text-black" data-cat="inea">

            <div class="space-y-2.5">
              <div class="flex items-center justify-between gap-1 flex-wrap">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="px-2.5 py-0.5 rounded-full text-[9.5px] font-black bg-[#e0f2fe] text-[#0369a1] border border-[#38bdf8]/40 shadow-2xs flex items-center gap-1">
                    <i data-lucide="waves" class="w-3 h-3 text-[#0284c7]"></i> NÍVEL DO RIO
                  </span>
                  <span class="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#334155] border border-[#cbd5e1]">
                    INEA Alerta de Cheias
                  </span>
                </div>
                ${statusBadge}
              </div>

              <div>
                <h3 class="text-sm font-black text-black leading-tight tracking-tight">${st.nome}</h3>
                <span class="text-[11px] font-bold text-black/75 flex items-center gap-1 mt-0.5">
                  <i data-lucide="map-pin" class="w-3 h-3 text-black"></i>
                  ${st.bairro || 'Cantagalo / Rio das Ostras'} • Estação 2241036
                </span>
              </div>

              <!-- Destaque Hidrológico: Cota e Calha do Rio (Padrão Nórdico Cerâmico) -->
              <div class="p-3 rounded-xl bg-gradient-to-br from-[#f8fafc] to-[#f0f9ff] border border-[#cbd5e1] space-y-2 text-black">
                <div class="flex justify-between items-baseline">
                  <span class="text-xs font-bold text-black uppercase tracking-wider">Cota Atual do Rio:</span>
                  <strong class="text-2xl font-mono font-black text-[#0369a1]">${nivelRio}</strong>
                </div>
                <div class="space-y-1">
                  <div class="flex justify-between text-[10px] font-bold text-black">
                    <span>Ocupação da Calha: <strong>${calhaPct}%</strong></span>
                    <span>Transbordo: <strong>${cotaTransbordo}</strong></span>
                  </div>
                  <div class="w-full h-2 rounded-full bg-[#e2e8f0] overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-emerald-500 to-[#0284c7] rounded-full" style="width: ${calhaPct}%"></div>
                  </div>
                </div>
                <div class="flex justify-between items-center text-[10.5px] pt-1.5 border-t border-[#e2e8f0]">
                  <span class="text-black font-medium">Atenção: 1,99 m • Alerta: 2,27 m</span>
                  <span class="font-extrabold uppercase text-[#166534] px-2.5 py-0.5 rounded-full bg-[#dcfce7] border border-[#86efac] text-[10px]">${statusRio}</span>
                </div>
              </div>

              <p class="text-[10.5px] text-black/85 leading-snug">
                Monitoramento fluvial contínuo para prevenção de inundações. Medição da cota do leito em metros (m), sem interferência no ranking pluviométrico.
              </p>
            </div>

            <!-- Rodapé do Card com Link -->
            <div class="pt-2 border-t border-[#cbd5e1] flex items-center justify-between text-xs">
              <span class="text-[10px] text-black font-medium">${st.ultima_leitura || 'Hoje'}</span>
              <a href="${st.url}" target="_blank" rel="noopener noreferrer" class="btn-action-slate px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 hover:brightness-95 shrink-0">
                <span>Ver no Alerta de Cheias ↗</span>
              </a>
            </div>

          </div>
        `;
      }

      """

new_text = text[:pos_start] + new_block + text[pos_end:]

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(new_text)

print("SUCCESS: Replaced Rio Jundiá card in js/app.js with Nordic Ceramic styling!")
