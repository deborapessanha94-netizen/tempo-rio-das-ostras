import re
from pathlib import Path

ROOT = Path(r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app")

def patch_index_html():
    path = ROOT / "index.html"
    txt = path.read_text(encoding="utf-8")

    # Normalize multiple \r
    txt = txt.replace("\r\r\n", "\n").replace("\r\n", "\n")

    toolbar_html = """          <!-- Barra de Zoom, Recorte Temporal e Desembaraçamento Visual (v201 - Todos os Gráficos) -->
          <div id="bulletin-chart-zoom-toolbar" class="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-2.5 sm:px-3.5">
            <!-- Janela de Período & Filtro por Dia -->
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-[#334155] flex items-center gap-1 mr-1">
                <i data-lucide="calendar-range" class="w-3.5 h-3.5 text-[#ea580c]"></i>
                Período:
              </span>
              <button type="button" class="bulletin-range-btn px-2.5 py-1 rounded-lg text-[11px] font-extrabold border-2 transition-all bg-[#fed7aa] text-black border-[#ea580c] shadow-2xs" data-range="all" title="Exibir todos os 8 dias (32 turnos)">
                8 Dias (32 Turnos)
              </button>
              <button type="button" class="bulletin-range-btn px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all bg-white text-[#1e293b] border-[#cbd5e1] hover:bg-[#f1f5f9]" data-range="first16" title="Focar nos primeiros 4 dias (16 turnos)">
                Próx. 4 Dias
              </button>
              <button type="button" class="bulletin-range-btn px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all bg-white text-[#1e293b] border-[#cbd5e1] hover:bg-[#f1f5f9]" data-range="first8" title="Dar zoom nas próximas 48 horas (8 turnos)">
                Próx. 48h
              </button>
              <button type="button" class="bulletin-range-btn px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all bg-white text-[#1e293b] border-[#cbd5e1] hover:bg-[#f1f5f9]" data-range="last16" title="Focar nos dias 5 a 8 da previsão">
                Dias 5 a 8
              </button>
              <div class="flex items-center gap-1 ml-0.5">
                <select id="bulletin-day-filter-select" aria-label="Filtrar dia específico no gráfico" class="px-2 py-1 rounded-lg text-[11px] font-bold bg-white text-[#0f172a] border border-[#cbd5e1] focus:outline-none focus:border-[#ea580c] cursor-pointer">
                  <option value="">Dia específico (Todos)</option>
                </select>
              </div>
            </div>

            <!-- Controles de Zoom Horizontal, Valores e Altura -->
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-[#334155] flex items-center gap-1 mr-0.5">
                <i data-lucide="zoom-in" class="w-3.5 h-3.5 text-[#ea580c]"></i>
                Zoom:
              </span>
              <div class="inline-flex items-center bg-white border border-[#cbd5e1] rounded-lg p-0.5 shadow-2xs">
                <button type="button" id="bulletin-zoom-out-btn" class="px-2 py-0.5 rounded-md text-xs font-extrabold text-[#0f172a] hover:bg-[#f1f5f9] transition-colors" title="Diminuir Zoom (-25%)">
                  −
                </button>
                <button type="button" class="bulletin-zoom-preset-btn px-2 py-0.5 rounded-md text-[11px] font-bold text-[#475569] hover:bg-[#f1f5f9] transition-colors" data-zoom="100" title="100% (Compacto na tela)">
                  100%
                </button>
                <button type="button" class="bulletin-zoom-preset-btn px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-[#fed7aa] text-black border border-[#ea580c] shadow-2xs transition-colors" data-zoom="175" title="175% (Espaçado ideal sem embolar)">
                  175%
                </button>
                <button type="button" class="bulletin-zoom-preset-btn px-2 py-0.5 rounded-md text-[11px] font-bold text-[#475569] hover:bg-[#f1f5f9] transition-colors" data-zoom="250" title="250% (Zoom detalhado)">
                  250%
                </button>
                <button type="button" class="bulletin-zoom-preset-btn px-2 py-0.5 rounded-md text-[11px] font-bold text-[#475569] hover:bg-[#f1f5f9] transition-colors" data-zoom="325" title="325% (Zoom máximo por turno)">
                  325%
                </button>
                <button type="button" id="bulletin-zoom-in-btn" class="px-2 py-0.5 rounded-md text-xs font-extrabold text-[#0f172a] hover:bg-[#f1f5f9] transition-colors" title="Aumentar Zoom (+25%)">
                  +
                </button>
              </div>

              <!-- Navegação Horizontal Rápida (Pan) -->
              <div class="inline-flex items-center bg-white border border-[#cbd5e1] rounded-lg p-0.5 shadow-2xs" title="Deslizar gráfico para a esquerda ou direita">
                <button type="button" id="bulletin-pan-left-btn" class="px-2 py-0.5 rounded-md text-[11px] font-bold text-[#0f172a] hover:bg-[#f1f5f9] transition-colors" title="Rolar para turnos anteriores">
                  ◀
                </button>
                <button type="button" id="bulletin-pan-right-btn" class="px-2 py-0.5 rounded-md text-[11px] font-bold text-[#0f172a] hover:bg-[#f1f5f9] transition-colors" title="Rolar para próximos turnos">
                  ▶
                </button>
              </div>

              <!-- Toggle Rótulos de Valores nos Pontos -->
              <button type="button" id="bulletin-toggle-values-btn" class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold border-2 transition-all bg-[#ffedd5] text-black border-[#ea580c] hover:bg-[#fed7aa]" title="Mostrar ou ocultar os números diretamente em cima dos pontos e barras">
                Valores: ON
              </button>

              <!-- Toggle Expandir Altura Vertical -->
              <button type="button" id="bulletin-toggle-height-btn" class="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all bg-white text-[#1e293b] border-[#cbd5e1] hover:bg-[#f1f5f9]" title="Aumentar a altura vertical do gráfico para leitura mais ampla">
                Expandir Altura ↕
              </button>

              <!-- Resetar Visualização -->
              <button type="button" id="bulletin-zoom-reset-btn" class="px-2 py-1 rounded-lg text-[11px] font-bold border border-[#cbd5e1] bg-white text-[#475569] hover:text-black hover:bg-[#f1f5f9] transition-colors" title="Restaurar visualização padrão">
                Resetar
              </button>
            </div>
          </div>

          <!-- Dica interativa e status do zoom -->
          <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#475569] px-1">
            <span id="bulletin-zoom-status-label" class="font-semibold text-[#0f172a]">
              Exibindo: <strong>8 Dias (32 Turnos)</strong> • Zoom <strong>175%</strong> (arraste para os lados ou use ◀ ▶ para navegar)
            </span>
            <span class="text-[10.5px] text-[#64748b]">
              Dica: válido para <strong>Temperatura, Chuva, Vento, Pressão e Umidade</strong> • use <strong>Ctrl + Roda do Mouse</strong> para ampliar
            </span>
          </div>

          <!-- Canvas do Gráfico com Viewport de Rolagem Horizontal e Arraste -->
          <div id="bulletin-chart-scroll-viewport" class="relative w-full overflow-x-auto overflow-y-hidden rounded-xl border border-[#e2e8f0] bg-white p-2 cursor-grab select-none">
            <div id="bulletin-chart-stage" class="relative h-[340px] sm:h-[370px] transition-all duration-150" style="width: 175%; min-width: 100%;">
              <canvas id="bulletin-chart"></canvas>
            </div>
          </div>"""

    pattern2 = re.compile(
        r'<!-- Barra de Zoom, Recorte Temporal.*?<canvas id="bulletin-chart"></canvas>\s*</div>\s*</div>',
        re.DOTALL
    )
    txt, n = pattern2.subn(toolbar_html, txt, count=1)
    print(f"Updated zoom toolbar in index.html ({n})")
    path.write_text(txt, encoding="utf-8")


def patch_app_js():
    path = ROOT / "js" / "app.js"
    txt = path.read_text(encoding="utf-8")
    txt = txt.replace("\r\r\n", "\n").replace("\r\n", "\n")

    new_chart_controller = """function updateBulletinChart() {
  const canvas = document.getElementById('bulletin-chart');
  if (!canvas || !state.boletimData || state.boletimData.length === 0) return;

  // Inicializa o estado de zoom/recorte se ainda não existir
  if (!state.chartView) {
    state.chartView = {
      rangeMode: 'all',        // 'all' | 'first16' | 'first8' | 'last16'
      selectedDateIso: '',     // ex: '2026-11-10'
      zoomPercent: 175,
      showValues: true,
      expandedHeight: false
    };
  }

  initBulletinChartZoomControls();
  populateBulletinDayFilterSelect();

  const fullRows = state.boletimData || [];
  let filteredRows = fullRows;
  let periodLabel = `8 Dias (${fullRows.length} Turnos)`;

  if (state.chartView.selectedDateIso) {
    filteredRows = fullRows.filter(r => r.data_iso === state.chartView.selectedDateIso);
    if (filteredRows.length > 0) {
      const d0 = filteredRows[0];
      const parts = (d0.data_iso || '').split('-');
      const dtBr = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d0.data_iso;
      periodLabel = `${d0.dia_semana} (${dtBr} • ${filteredRows.length} Turnos)`;
    }
  } else if (state.chartView.rangeMode === 'first16') {
    filteredRows = fullRows.slice(0, 16);
    periodLabel = `Próx. 4 Dias (${filteredRows.length} Turnos)`;
  } else if (state.chartView.rangeMode === 'first8') {
    filteredRows = fullRows.slice(0, 8);
    periodLabel = `Próx. 48h (${filteredRows.length} Turnos)`;
  } else if (state.chartView.rangeMode === 'last16') {
    filteredRows = fullRows.slice(Math.max(0, fullRows.length - 16));
    periodLabel = `Dias 5 a 8 (${filteredRows.length} Turnos)`;
  }

  // Ajusta largura do palco (#bulletin-chart-stage) garantindo espaçamento mínimo em pixels por turno
  const stage = document.getElementById('bulletin-chart-stage');
  if (stage) {
    const effectiveZoom = Math.max(100, Math.min(350, Number(state.chartView.zoomPercent) || 175));
    const count = Math.max(4, filteredRows.length);

    if (effectiveZoom <= 100 || count <= 8) {
      stage.style.width = `${effectiveZoom}%`;
      stage.style.minWidth = '100%';
    } else {
      // Garante espaço confortável por turno tanto no Desktop quanto no Mobile (ex: 76px a 175%, 104px a 250%, 132px a 325%)
      const pxPerShift = Math.round(44 + (effectiveZoom - 100) * 0.42);
      const minTotalPx = count * pxPerShift;
      stage.style.width = `${effectiveZoom}%`;
      stage.style.minWidth = `${minTotalPx}px`;
    }

    if (state.chartView.expandedHeight) {
      stage.className = 'relative h-[460px] sm:h-[500px] transition-all duration-150';
    } else {
      stage.className = 'relative h-[340px] sm:h-[370px] transition-all duration-150';
    }
  }

  // Atualiza status textual e estado visual dos botões
  syncBulletinZoomToolbarUI(periodLabel);

  renderBulletinChart(canvas, state.activeMetric, filteredRows, {
    zoomPercent: state.chartView.zoomPercent,
    showValues: state.chartView.showValues,
    rangeMode: state.chartView.rangeMode,
    selectedDateIso: state.chartView.selectedDateIso
  });

  if (canvas._activeBulletinChart) {
    canvas._activeBulletinChart.resize();
  }
}

function populateBulletinDayFilterSelect() {
  const select = document.getElementById('bulletin-day-filter-select');
  if (!select || !state.boletimData || !state.boletimData.length) return;

  const uniqueDays = [];
  const seen = new Set();
  state.boletimData.forEach(r => {
    if (r.data_iso && !seen.has(r.data_iso)) {
      seen.add(r.data_iso);
      const parts = r.data_iso.split('-');
      const dtBr = parts.length === 3 ? `${parts[2]}/${parts[1]}` : r.data_iso;
      uniqueDays.push({ iso: r.data_iso, label: `${r.dia_semana} (${dtBr})` });
    }
  });

  const currentKey = uniqueDays.map(d => d.iso).join(',');
  if (select.dataset.daysKey !== currentKey) {
    select.dataset.daysKey = currentKey;
    select.innerHTML = `<option value="">Dia específico (Todos)</option>` +
      uniqueDays.map((d, idx) => `<option value="${d.iso}">Dia ${idx + 1}: ${d.label}</option>`).join('');
  }
  select.value = (state.chartView && state.chartView.selectedDateIso) ? state.chartView.selectedDateIso : '';
}

function syncBulletinZoomToolbarUI(periodLabel) {
  if (!state.chartView) return;
  const zp = Number(state.chartView.zoomPercent) || 175;

  // Botões de período (alto contraste preto sobre âmbar quando ativo)
  document.querySelectorAll('.bulletin-range-btn').forEach(btn => {
    const r = btn.getAttribute('data-range');
    const isActive = !state.chartView.selectedDateIso && r === state.chartView.rangeMode;
    if (isActive) {
      btn.className = 'bulletin-range-btn px-2.5 py-1 rounded-lg text-[11px] font-extrabold border-2 transition-all bg-[#fed7aa] text-black border-[#ea580c] shadow-2xs';
    } else {
      btn.className = 'bulletin-range-btn px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all bg-white text-[#1e293b] border-[#cbd5e1] hover:bg-[#f1f5f9]';
    }
  });

  // Botões de preset de zoom
  document.querySelectorAll('.bulletin-zoom-preset-btn').forEach(btn => {
    const val = Number(btn.getAttribute('data-zoom'));
    if (val === zp) {
      btn.className = 'bulletin-zoom-preset-btn px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-[#fed7aa] text-black border border-[#ea580c] shadow-2xs transition-colors';
    } else {
      btn.className = 'bulletin-zoom-preset-btn px-2 py-0.5 rounded-md text-[11px] font-bold text-[#475569] hover:bg-[#f1f5f9] transition-colors';
    }
  });

  // Botão Valores ON/OFF
  const valBtn = document.getElementById('bulletin-toggle-values-btn');
  if (valBtn) {
    valBtn.textContent = state.chartView.showValues ? 'Valores: ON' : 'Valores: OFF';
    valBtn.className = state.chartView.showValues
      ? 'px-2.5 py-1 rounded-lg text-[11px] font-extrabold border-2 transition-all bg-[#ffedd5] text-black border-[#ea580c] hover:bg-[#fed7aa]'
      : 'px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all bg-white text-[#475569] border-[#cbd5e1] hover:bg-[#f1f5f9]';
  }

  // Botão Expandir Altura
  const hBtn = document.getElementById('bulletin-toggle-height-btn');
  if (hBtn) {
    hBtn.textContent = state.chartView.expandedHeight ? 'Altura Normal ↕' : 'Expandir Altura ↕';
    hBtn.className = state.chartView.expandedHeight
      ? 'px-2.5 py-1 rounded-lg text-[11px] font-extrabold border-2 transition-all bg-[#fed7aa] text-black border-[#ea580c]'
      : 'px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all bg-white text-[#1e293b] border-[#cbd5e1] hover:bg-[#f1f5f9]';
  }

  // Rótulo de status
  const statusEl = document.getElementById('bulletin-zoom-status-label');
  if (statusEl) {
    const metricNames = {
      temperature: 'Temperatura',
      precipitation: 'Chuva',
      wind: 'Vento',
      pressure: 'Pressão',
      humidity: 'Umidade'
    };
    const mName = metricNames[state.activeMetric] || 'Temperatura';
    const scrollHint = zp > 100
      ? '(arraste para os lados ou use ◀ ▶ para navegar)'
      : '(visão compacta ajustada à tela)';
    statusEl.innerHTML = `Gráfico: <strong>${mName}</strong> • Exibindo: <strong>${periodLabel}</strong> • Zoom <strong>${zp}%</strong> ${scrollHint}`;
  }
}

function initBulletinChartZoomControls() {
  const toolbar = document.getElementById('bulletin-chart-zoom-toolbar');
  if (!toolbar || toolbar.dataset.boundZoom === 'true') return;
  toolbar.dataset.boundZoom = 'true';

  const setZoom = (newZoom) => {
    if (!state.chartView) return;
    state.chartView.zoomPercent = Math.max(100, Math.min(350, Math.round(newZoom / 25) * 25));
    updateBulletinChart();
  };

  // Botões de Período (Recorte Rápido)
  document.querySelectorAll('.bulletin-range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!state.chartView) return;
      const range = btn.getAttribute('data-range') || 'all';
      state.chartView.rangeMode = range;
      state.chartView.selectedDateIso = '';
      if (range === 'first8') {
        state.chartView.zoomPercent = 100;
      } else if (range === 'first16' || range === 'last16') {
        state.chartView.zoomPercent = 150;
      } else {
        state.chartView.zoomPercent = 175;
      }
      const viewport = document.getElementById('bulletin-chart-scroll-viewport');
      if (viewport) viewport.scrollLeft = 0;
      updateBulletinChart();
    });
  });

  // Seletor de Dia Específico
  const daySelect = document.getElementById('bulletin-day-filter-select');
  if (daySelect) {
    daySelect.addEventListener('change', () => {
      if (!state.chartView) return;
      const val = daySelect.value || '';
      state.chartView.selectedDateIso = val;
      if (val) {
        state.chartView.zoomPercent = 100;
      } else {
        state.chartView.zoomPercent = 175;
      }
      const viewport = document.getElementById('bulletin-chart-scroll-viewport');
      if (viewport) viewport.scrollLeft = 0;
      updateBulletinChart();
    });
  }

  // Botões Preset de Zoom (100%, 175%, 250%, 325%)
  document.querySelectorAll('.bulletin-zoom-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const z = Number(btn.getAttribute('data-zoom')) || 175;
      setZoom(z);
    });
  });

  // Zoom - / Zoom +
  const zoomOutBtn = document.getElementById('bulletin-zoom-out-btn');
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      setZoom((state.chartView?.zoomPercent || 175) - 25);
    });
  }
  const zoomInBtn = document.getElementById('bulletin-zoom-in-btn');
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      setZoom((state.chartView?.zoomPercent || 175) + 25);
    });
  }

  // Botões Pan ◀ / ▶
  const panLeftBtn = document.getElementById('bulletin-pan-left-btn');
  const panRightBtn = document.getElementById('bulletin-pan-right-btn');
  const viewport = document.getElementById('bulletin-chart-scroll-viewport');

  if (panLeftBtn && viewport) {
    panLeftBtn.addEventListener('click', () => {
      viewport.scrollBy({ left: -Math.max(240, viewport.clientWidth * 0.55), behavior: 'smooth' });
    });
  }
  if (panRightBtn && viewport) {
    panRightBtn.addEventListener('click', () => {
      viewport.scrollBy({ left: Math.max(240, viewport.clientWidth * 0.55), behavior: 'smooth' });
    });
  }

  // Toggle Valores ON/OFF
  const valBtn = document.getElementById('bulletin-toggle-values-btn');
  if (valBtn) {
    valBtn.addEventListener('click', () => {
      if (!state.chartView) return;
      state.chartView.showValues = !state.chartView.showValues;
      updateBulletinChart();
    });
  }

  // Toggle Expandir Altura
  const hBtn = document.getElementById('bulletin-toggle-height-btn');
  if (hBtn) {
    hBtn.addEventListener('click', () => {
      if (!state.chartView) return;
      state.chartView.expandedHeight = !state.chartView.expandedHeight;
      updateBulletinChart();
    });
  }

  // Botão Resetar
  const resetBtn = document.getElementById('bulletin-zoom-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.chartView = {
        rangeMode: 'all',
        selectedDateIso: '',
        zoomPercent: 175,
        showValues: true,
        expandedHeight: false
      };
      if (viewport) viewport.scrollLeft = 0;
      updateBulletinChart();
    });
  }

  // Arrastar com o mouse (Click & Drag) e Zoom com Ctrl + Roda do Mouse no viewport
  if (viewport) {
    let isDown = false;
    let startX = 0;
    let scrollLeftStart = 0;

    viewport.addEventListener('mousedown', (e) => {
      isDown = true;
      viewport.classList.remove('cursor-grab');
      viewport.classList.add('cursor-grabbing');
      startX = e.pageX - viewport.offsetLeft;
      scrollLeftStart = viewport.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      viewport.classList.remove('cursor-grabbing');
      viewport.classList.add('cursor-grab');
    });

    viewport.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - viewport.offsetLeft;
      const walk = (x - startX) * 1.35;
      viewport.scrollLeft = scrollLeftStart - walk;
    });

    viewport.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 25 : -25;
        setZoom((state.chartView?.zoomPercent || 175) + delta);
      }
    }, { passive: false });
  }
}"""

    pattern = re.compile(
        r'function updateBulletinChart\(\)\s*\{.*?\}\s*(?=window\.updateBulletinChart\s*=\s*updateBulletinChart;)',
        re.DOTALL
    )
    txt, n = pattern.subn(new_chart_controller + "\n", txt, count=1)
    print(f"Updated updateBulletinChart in js/app.js ({n})")
    path.write_text(txt, encoding="utf-8")

if __name__ == "__main__":
    patch_index_html()
    patch_app_js()
