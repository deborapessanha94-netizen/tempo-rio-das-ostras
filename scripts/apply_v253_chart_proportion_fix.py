# -*- coding: utf-8 -*-
import os
import re

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"

# 1. Update src/components/HourlyChart.tsx
chart_path = os.path.join(base_dir, "src", "components", "HourlyChart.tsx")
with open(chart_path, "r", encoding="utf-8") as f:
    chart_code = f.read()

# Increase height and padding
chart_code = chart_code.replace(
    "const chartHeight = metric === 'rain' ? 195 : 180;",
    "const chartHeight = metric === 'rain' ? 220 : 210;"
)
chart_code = chart_code.replace(
    "const paddingTop = 26;",
    "const paddingTop = 30;"
)
chart_code = chart_code.replace(
    "const paddingBottom = metric === 'rain' ? 46 : 40;",
    "const paddingBottom = metric === 'rain' ? 48 : 42;"
)

# Add Swipe hint above the chart (mobile & desktop)
old_chart_container = """      {/* Gráfico SVG com Rolagem Horizontal Suave */}
      <div
        className="w-full overflow-x-auto pb-2 scrollbar-thin touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >"""

new_chart_container = """      {/* Indicador de Deslizar para Ver Todas as Horas */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#FF8244]/10 border border-[#FF8244]/25 text-[#14213D] dark:text-[#FF8244] text-xs font-semibold">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FF8244] animate-pulse" />
          <span>Deslize o gráfico para os lados para ver as {points.length} horas →</span>
        </span>
        <span className="font-mono text-[10px] bg-[#FF8244] text-[#000000] px-2 py-0.5 rounded font-black uppercase">
          {horizonCount}h
        </span>
      </div>

      {/* Gráfico SVG com Rolagem Horizontal Suave */}
      <div
        className="w-full overflow-x-auto pb-2 scrollbar-thin touch-pan-x rounded-lg"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >"""

chart_code = chart_code.replace(old_chart_container, new_chart_container)

# Add Y-axis labels and middle grid line in SVG
old_grid_lines = """            {/* Linhas de grade horizontal */}
            <line
              x1="0"
              y1={paddingTop}
              x2={chartWidth}
              y2={paddingTop}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeDasharray="4 4"
            />
            <line
              x1="0"
              y1={chartHeight - paddingBottom}
              x2={chartWidth}
              y2={chartHeight - paddingBottom}
              stroke="currentColor"
              strokeOpacity="0.12"
            />"""

new_grid_lines = """            {/* Linhas de grade horizontal e Escala Y */}
            {/* Linha do Topo (Máximo) */}
            <line
              x1="0"
              y1={paddingTop}
              x2={chartWidth}
              y2={paddingTop}
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeDasharray="4 4"
            />
            <text
              x="6"
              y={paddingTop - 5}
              className="text-[10px] font-mono font-bold fill-slate-500 dark:fill-[#E5E5E5]/70"
            >
              Máx: {maxVal.toFixed(metric === 'rain' ? 1 : 0)}{getMetricUnit()}
            </text>

            {/* Linha Central de Referência */}
            <line
              x1="0"
              y1={paddingTop + innerHeight / 2}
              x2={chartWidth}
              y2={paddingTop + innerHeight / 2}
              stroke="currentColor"
              strokeOpacity="0.07"
              strokeDasharray="3 3"
            />
            <text
              x="6"
              y={paddingTop + innerHeight / 2 - 4}
              className="text-[9px] font-mono fill-slate-400 dark:fill-[#E5E5E5]/40"
            >
              {((maxVal + minVal) / 2).toFixed(metric === 'rain' ? 1 : 0)}{getMetricUnit()}
            </text>

            {/* Linha da Base (Mínimo) */}
            <line
              x1="0"
              y1={chartHeight - paddingBottom}
              x2={chartWidth}
              y2={chartHeight - paddingBottom}
              stroke="currentColor"
              strokeOpacity="0.15"
            />
            <text
              x="6"
              y={chartHeight - paddingBottom + 12}
              className="text-[10px] font-mono font-bold fill-slate-500 dark:fill-[#E5E5E5]/70"
            >
              Mín: {minVal.toFixed(metric === 'rain' ? 1 : 0)}{getMetricUnit()}
            </text>"""

chart_code = chart_code.replace(old_grid_lines, new_grid_lines)

with open(chart_path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(chart_code)
print("Updated HourlyChart.tsx with taller height, Y-axis labels and swipe hint!")

# 2. Update src/App.tsx section 'graficos'
app_path = os.path.join(base_dir, "src", "App.tsx")
with open(app_path, "r", encoding="utf-8") as f:
    app_code = f.read()

old_graficos_section = """            {showSub('graficos') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[#14213D] dark:text-white">
                      Gráficos de Tendência Horária
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-0.5">
                      Evolução contínua projetada pelos modelos numéricos de alta resolução
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg overflow-x-auto">
                      {(
                        [
                          { id: 'temp', label: 'Temperatura' },
                          { id: 'rain', label: 'Chuva' },
                          { id: 'wind', label: 'Vento' },
                          { id: 'pressure', label: 'Pressão' },
                          { id: 'humidity', label: 'Umidade' },
                        ] as { id: ChartMetric; label: string }[]
                      ).map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setChartMetric(m.id)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            chartMetric === m.id
                              ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-semibold'
                              : 'text-slate-600 dark:text-[#E5E5E5]/75'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg overflow-x-auto max-w-full">
                      {[
                        { label: '24h', count: 24 },
                        { label: '48h', count: 48 },
                        { label: '72h', count: 72 },
                        { label: '96h', count: 96 },
                        { label: '120h', count: 120 },
                        { label: '144h', count: 144 },
                        { label: '168h', count: 168 },
                        { label: '192h', count: 192 },
                      ].map((h) => (
                        <button
                          key={h.label}
                          onClick={() => {
                            setChartDayFilter('all');
                            setHorizonCount(h.count);
                          }}
                          className={`px-2.5 py-1.5 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            chartDayFilter === 'all' && horizonCount === h.count
                              ? 'bg-white dark:bg-[#14213D] text-[#14213D] dark:text-[#FF8244] font-semibold'
                              : 'text-slate-500 dark:text-[#E5E5E5]/70'
                          }`}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>

                    {chartDayOptions.length > 0 && (
                      <select
                        value={chartDayFilter}
                        onChange={(e) => setChartDayFilter(e.target.value)}
                        aria-label="Filtrar dia específico no gráfico"
                        className="px-2.5 py-1.5 text-xs font-mono rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#FF8244]/50 cursor-pointer"
                      >
                        <option value="all">Todos os dias</option>
                        {chartDayOptions.map((d, idx) => (
                          <option key={d} value={d}>
                            {idx === 0 ? `Hoje (${d})` : d}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      onClick={() => setShowChartValues((v) => !v)}
                      className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                        showChartValues
                          ? 'bg-[#14213D] dark:bg-[#FF8244] border-[#14213D] dark:border-[#FF8244] text-white dark:text-[#000000] font-semibold'
                          : 'border-[#E5E5E5] dark:border-[#233354] text-slate-500 dark:text-[#E5E5E5]/70 hover:border-[#FF8244]'
                      }`}
                    >
                      Valores: {showChartValues ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                <HourlyChart
                  data={displayedChartPoints}
                  metric={chartMetric}
                  horizonCount={chartDayFilter === 'all' ? horizonCount : 24}
                  showValues={showChartValues}
                />
              </section>
            )}"""

new_graficos_section = """            {showSub('graficos') && (
              <section className="bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl p-4 sm:p-7 space-y-5">
                {/* Cabeçalho do Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E5] dark:border-[#233354] pb-4">
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-[#14213D] dark:text-white">
                      Gráficos de Tendência Horária
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-0.5">
                      Evolução contínua projetada pelos modelos numéricos de alta resolução
                    </p>
                  </div>
                </div>

                {/* Controles de Métrica em Grid Responsivo (Sem cortes) */}
                <div className="space-y-2.5">
                  {/* Linha 1: Métricas (5 Colunas 100% Ajustadas) */}
                  <div className="w-full grid grid-cols-5 gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg">
                    {(
                      [
                        { id: 'temp', label: 'Temp', full: 'Temperatura' },
                        { id: 'rain', label: 'Chuva', full: 'Chuva' },
                        { id: 'wind', label: 'Vento', full: 'Vento' },
                        { id: 'pressure', label: 'Pressão', full: 'Pressão' },
                        { id: 'humidity', label: 'Umidade', full: 'Umidade' },
                      ] as { id: ChartMetric; label: string; full: string }[]
                    ).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setChartMetric(m.id)}
                        className={`py-1.5 px-0.5 sm:px-3 text-[11px] sm:text-xs font-semibold rounded-md transition-all text-center cursor-pointer ${
                          chartMetric === m.id
                            ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] shadow-xs'
                            : 'text-slate-600 dark:text-[#E5E5E5]/75 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span className="sm:hidden">{m.label}</span>
                        <span className="hidden sm:inline">{m.full}</span>
                      </button>
                    ))}
                  </div>

                  {/* Linha 2: Horizontes de Tempo (Sem cortes) */}
                  <div className="w-full grid grid-cols-5 gap-1 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] rounded-lg">
                    {[
                      { label: '24h', count: 24 },
                      { label: '48h', count: 48 },
                      { label: '72h', count: 72 },
                      { label: '5 dias', count: 120 },
                      { label: '7 dias', count: 168 },
                    ].map((h) => (
                      <button
                        key={h.label}
                        onClick={() => {
                          setChartDayFilter('all');
                          setHorizonCount(h.count);
                        }}
                        className={`py-1.5 px-1 text-[11px] sm:text-xs font-mono font-medium rounded-md transition-colors text-center cursor-pointer whitespace-nowrap ${
                          chartDayFilter === 'all' && horizonCount === h.count
                            ? 'bg-white dark:bg-[#14213D] text-[#14213D] dark:text-[#FF8244] font-bold shadow-xs'
                            : 'text-slate-500 dark:text-[#E5E5E5]/70 hover:text-slate-900'
                        }`}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>

                  {/* Linha 3: Filtro de Dia + Botão de Valores */}
                  <div className="w-full flex items-center justify-between gap-2 pt-0.5">
                    {chartDayOptions.length > 0 && (
                      <select
                        value={chartDayFilter}
                        onChange={(e) => setChartDayFilter(e.target.value)}
                        aria-label="Filtrar dia específico no gráfico"
                        className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] text-[#14213D] dark:text-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#FF8244]/50 cursor-pointer"
                      >
                        <option value="all">Todos os dias ({horizonCount}h)</option>
                        {chartDayOptions.map((d, idx) => (
                          <option key={d} value={d}>
                            {idx === 0 ? `Hoje (${d})` : d}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      onClick={() => setShowChartValues((v) => !v)}
                      className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        showChartValues
                          ? 'bg-[#14213D] dark:bg-[#FF8244] border-[#14213D] dark:border-[#FF8244] text-white dark:text-[#000000]'
                          : 'border-[#E5E5E5] dark:border-[#233354] text-slate-500 dark:text-[#E5E5E5]/70 hover:border-[#FF8244]'
                      }`}
                    >
                      Valores: {showChartValues ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* Gráfico SVG Taller & Proporcional */}
                <HourlyChart
                  data={displayedChartPoints}
                  metric={chartMetric}
                  horizonCount={chartDayFilter === 'all' ? horizonCount : 24}
                  showValues={showChartValues}
                />

                {/* Resumo Estatístico do Período (Preenche a tela com proporção e dados úteis) */}
                <div className="pt-4 border-t border-[#E5E5E5] dark:border-[#233354] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60 font-bold">
                      Resumo Estatístico ({chartDayFilter === 'all' ? `${horizonCount}h Projetadas` : chartDayFilter})
                    </h3>
                    <span className="text-[11px] font-mono text-[#FF8244]">
                      {displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : 24).length} pontos horários
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* KPI 1: Temperatura Máxima */}
                    <div className="p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-0.5">
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 font-medium">Temp. Máxima</div>
                      <div className="text-lg font-bold font-mono text-[#FF8244]">
                        {(() => {
                          const pts = displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : 24);
                          if (!pts.length) return '--';
                          const maxP = pts.reduce((prev, curr) => curr.temp > prev.temp ? curr : prev, pts[0]);
                          return `${maxP.temp.toFixed(1)}°C`;
                        })()}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-[#E5E5E5]/50 truncate">
                        {(() => {
                          const pts = displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : 24);
                          if (!pts.length) return '';
                          const maxP = pts.reduce((prev, curr) => curr.temp > prev.temp ? curr : prev, pts[0]);
                          return `às ${maxP.hour.slice(0, 5)} (${maxP.dayLabel})`;
                        })()}
                      </div>
                    </div>

                    {/* KPI 2: Temperatura Mínima */}
                    <div className="p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-0.5">
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 font-medium">Temp. Mínima</div>
                      <div className="text-lg font-bold font-mono text-blue-500 dark:text-blue-400">
                        {(() => {
                          const pts = displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : 24);
                          if (!pts.length) return '--';
                          const minP = pts.reduce((prev, curr) => curr.temp < prev.temp ? curr : prev, pts[0]);
                          return `${minP.temp.toFixed(1)}°C`;
                        })()}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-[#E5E5E5]/50 truncate">
                        {(() => {
                          const pts = displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : 24);
                          if (!pts.length) return '';
                          const minP = pts.reduce((prev, curr) => curr.temp < prev.temp ? curr : prev, pts[0]);
                          return `às ${minP.hour.slice(0, 5)} (${minP.dayLabel})`;
                        })()}
                      </div>
                    </div>

                    {/* KPI 3: Chuva Total Acumulada */}
                    <div className="p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-0.5">
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 font-medium">Chuva Total</div>
                      <div className="text-lg font-bold font-mono text-[#14213D] dark:text-white">
                        {(() => {
                          const pts = displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : 24);
                          const tot = pts.reduce((acc, p) => acc + p.rainMm, 0);
                          return `${tot.toFixed(1)} mm`;
                        })()}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-[#E5E5E5]/50 truncate">
                        {(() => {
                          const pts = displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : 24);
                          const maxR = pts.reduce((prev, curr) => curr.rainMm > prev.rainMm ? curr : prev, pts[0] || { rainMm: 0, hour: '' });
                          return maxR.rainMm > 0 ? `Pico: ${maxR.rainMm.toFixed(1)}mm (${maxR.hour.slice(0, 5)})` : 'Sem chuva prevista';
                        })()}
                      </div>
                    </div>

                    {/* KPI 4: Vento / Rajada Máxima */}
                    <div className="p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] space-y-0.5">
                      <div className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/70 font-medium">Vento Máximo</div>
                      <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {(() => {
                          const pts = displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : 24);
                          if (!pts.length) return '--';
                          const maxW = pts.reduce((prev, curr) => curr.windKmh > prev.windKmh ? curr : prev, pts[0]);
                          return `${maxW.windKmh.toFixed(0)} km/h`;
                        })()}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-[#E5E5E5]/50 truncate">
                        {(() => {
                          const pts = displayedChartPoints.slice(0, chartDayFilter === 'all' ? horizonCount : 24);
                          if (!pts.length) return '';
                          const maxW = pts.reduce((prev, curr) => curr.windKmh > prev.windKmh ? curr : prev, pts[0]);
                          return `Dir: ${maxW.windDir} às ${maxW.hour.slice(0, 5)}`;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Tabela / Detalhamento Horário Vertical (Rolagem móvel natural) */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#14213D] dark:text-white">
                        Detalhamento Hora a Hora
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-[#E5E5E5]/60 font-mono">
                        Rolagem vertical
                      </span>
                    </div>

                    <div className="divide-y divide-[#E5E5E5] dark:divide-[#233354] rounded-xl border border-[#E5E5E5] dark:border-[#233354] bg-[#F7F8FA] dark:bg-[#0B1324] overflow-hidden max-h-72 overflow-y-auto scrollbar-thin">
                      {displayedChartPoints.slice(0, chartDayFilter === 'all' ? Math.min(horizonCount, 24) : 24).map((pt, i) => (
                        <div key={i} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#14213D] dark:text-white w-11">
                              {pt.hour.slice(0, 5)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-[#E5E5E5]/60">
                              {pt.dayLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-[#FF8244]">
                              {pt.temp.toFixed(0)}°C
                            </span>
                            <span className={`font-mono text-[11px] ${pt.rainMm > 0 ? 'text-blue-500 font-bold' : 'text-slate-400 dark:text-[#E5E5E5]/40'}`}>
                              {pt.rainMm > 0 ? `${pt.rainMm.toFixed(1)} mm` : '0 mm'}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                              {pt.windKmh.toFixed(0)} km/h {pt.windDir}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}"""

app_code = app_code.replace(old_graficos_section, new_graficos_section)

with open(app_path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(app_code)

print("Updated src/App.tsx with balanced proportions, responsive controls, and hourly breakdown!")
