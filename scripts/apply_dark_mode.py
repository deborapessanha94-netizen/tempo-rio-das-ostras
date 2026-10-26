#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Aplicacao do Modo Escuro Completo (Dark Mode 24/7)
Portal TEMPO em Rio das Ostras
"""

import sys
import os

def update_index_html():
    path = "index.html"
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    # 1. Configurar Tailwind darkMode e detector de tema imediato no <head>
    head_target = '<script src="https://cdn.tailwindcss.com"></script>'
    head_replacement = '''<script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class'
    };
  </script>

  <!-- Inicializacao Imediata do Tema (Prevencao de FOUC / Tela Branca) -->
  <script>
    (function() {
      try {
        var savedTheme = localStorage.getItem('theme');
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    })();
  </script>'''

    if head_target in html and "tailwind.config" not in html:
        html = html.replace(head_target, head_replacement, 1)
        print("[OK] Adicionado tailwind.config e inicializador de tema no <head>")
    else:
        print("[INFO] <head> ja possui tailwind.config ou nao encontrou target")

    # 2. Adicionar botao de alternancia de tema no cabecalho
    btn_target = '<button id="btn-sync-now"'
    btn_theme = '''<!-- Alternar Modo Escuro / Claro -->
        <button id="btn-theme-toggle" onclick="toggleTheme()" class="btn-action-outline p-2 text-black hover:bg-[#e2e8f0] cursor-pointer rounded-full" title="Alternar entre modo claro e modo escuro" aria-label="Alternar modo escuro">
          <i id="theme-icon" data-lucide="moon" class="w-3.5 h-3.5 text-black"></i>
        </button>

        '''
    if btn_target in html and "btn-theme-toggle" not in html:
        html = html.replace(btn_target, btn_theme + btn_target, 1)
        print("[OK] Adicionado botao #btn-theme-toggle no cabecalho")
    else:
        print("[INFO] Botao #btn-theme-toggle ja presente ou nao encontrou target")

    # Atualizar versao do css
    html = html.replace('css/styles.css?v=89', 'css/styles.css?v=90')

    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print("[OK] index.html salvo com sucesso.")


def update_css():
    path = "css/styles.css"
    with open(path, "r", encoding="utf-8") as f:
        css = f.read()

    new_universal = """:root.dark, html.dark {
  /* Paleta Dark Obsidian / Slate Nórdico Escuro */
  --bg-canvas: #0a0f1d;            /* Fundo escuro profundo oceânico */
  --bg-card: #131b2e;              /* Superfície escura dos cards */
  --bg-subtle: #1e293b;            /* Slate escuro sutil */
  --bg-stone: #243048;             /* Superfície secundária */
  
  /* Azul / Slate Nórdico Dark */
  --nordic-slate-ice: #1e293b;     /* Gelo nórdico dark */
  --nordic-slate-border: #334155;  /* Borda slate dark */
  
  /* Coral / Terracota (Vibrante e legível no escuro) */
  --coral-orange: #f07a53;         /* Coral cerâmica vibrante */
  --coral-soft: #2b1812;           /* Fundo sutil terracota escuro */
  --coral-border: #ea580c;
  
  /* Linhas e Bordas no Dark Mode */
  --border-light: #1e293b;         /* Linha ultrafina dark */
  --border-medium: #334155;        /* Contorno suave dark */
  --border-strong: #475569;        /* Contorno médio dark */
  --border-black: #64748b;         /* Contorno dark */
  
  /* Sombras Dark */
  --shadow-card: 0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.3);
  --shadow-hover: 0 16px 36px -4px rgba(0, 0, 0, 0.6), 0 4px 10px -2px rgba(0, 0, 0, 0.4);
  --shadow-pill: 0 4px 12px rgba(0, 0, 0, 0.4);
}

/* Base Geral */
* {
  box-sizing: border-box;
}

/* REGRA UNIVERSAL MODO CLARO: TODAS AS LETRAS, NÚMEROS E TEXTOS EM PRETO (#000000) */
html:not(.dark), 
html:not(.dark) body, 
html:not(.dark) p, html:not(.dark) span, html:not(.dark) div, 
html:not(.dark) h1, html:not(.dark) h2, html:not(.dark) h3, html:not(.dark) h4, html:not(.dark) h5, html:not(.dark) h6, 
html:not(.dark) a, html:not(.dark) button, html:not(.dark) input, html:not(.dark) select, html:not(.dark) textarea, 
html:not(.dark) table, html:not(.dark) th, html:not(.dark) td, html:not(.dark) label, html:not(.dark) strong, 
html:not(.dark) b, html:not(.dark) em, html:not(.dark) i, html:not(.dark) small, html:not(.dark) pre, html:not(.dark) code {
  color: #000000 !important;
}

html:not(.dark) body, html:not(.dark) body *:not(svg):not(path) {
  color: #000000 !important;
}

/* Ícones traçados em preto de alto contraste no modo claro */
html:not(.dark) svg, html:not(.dark) svg path {
  stroke: #000000 !important;
}

/* REGRA UNIVERSAL MODO ESCURO: TODAS AS LETRAS, NÚMEROS E TEXTOS EM BRANCO PURO / SLATE (#f8fafc) */
html.dark, 
html.dark body, 
html.dark p, html.dark span, html.dark div, 
html.dark h1, html.dark h2, html.dark h3, html.dark h4, html.dark h5, html.dark h6, 
html.dark a, html.dark button, html.dark input, html.dark select, html.dark textarea, 
html.dark table, html.dark th, html.dark td, html.dark label, html.dark strong, 
html.dark b, html.dark em, html.dark i, html.dark small, html.dark pre, html.dark code {
  color: #f8fafc !important;
}

html.dark body, html.dark body *:not(svg):not(path) {
  color: #f8fafc !important;
}

/* Ícones traçados em branco/slate de alto contraste no modo escuro */
html.dark svg, html.dark svg path {
  stroke: #f8fafc !important;
}

html, body {
  background-color: var(--bg-canvas) !important;"""

    norm_css = css.replace('\r\n', '\n')
    target_sub = "/* REGRA UNIVERSAL: TODAS AS LETRAS, NÚMEROS E TEXTOS EM PRETO (#000000) */"
    if target_sub in norm_css and "html:not(.dark)" not in norm_css:
        idx = norm_css.find(target_sub)
        end_idx = norm_css.find("font-family:", idx)
        prefix = norm_css[:idx]
        suffix = norm_css[end_idx:]
        norm_css = prefix + new_universal + "\n  " + suffix
        print("[OK] Regras universais substituidas com sucesso via delimitador")
    elif "html:not(.dark)" in norm_css:
        print("[INFO] Regras universais ja continham html:not(.dark)")

    # Adicionar o bloco completo de estilos do Dark Mode no final do CSS se ainda não estiver
    dark_mode_rules = """
/* ========================================================================= */
/* TEMA ESCURO PROFISSIONAL (MODO NOTURNO / DARK OBSIDIAN & SLATE)           */
/* ========================================================================= */
html.dark, html.dark body {
  background-color: var(--bg-canvas) !important;
  color: #f8fafc !important;
}

/* Barra Fixa de Topo e Navegação */
html.dark #site-header {
  background: rgba(15, 23, 42, 0.96) !important;
  border-top: 3.5px solid var(--coral-orange) !important;
  border-bottom: 1.5px solid #1e293b !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
}

html.dark #app-sticky-navigation {
  background: rgba(11, 17, 32, 0.96) !important;
  border-bottom: 1.5px solid #1e293b !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
}

html.dark #app-main-tabs div[role="tablist"] {
  background-color: #131b2e !important;
  border-color: #1e293b !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
}

html.dark .app-nav-tab {
  color: #f8fafc !important;
}

html.dark .app-nav-tab.active {
  background: #2b1812 !important;
  border-color: #f07a53 !important;
  color: #f8fafc !important;
  box-shadow: 0 2px 10px rgba(240, 122, 83, 0.35) !important;
}

html.dark .app-nav-tab:not(.active):hover {
  background-color: #1e293b !important;
  border-color: #334155 !important;
}

/* Cards Gerais e Hero */
html.dark .modern-card {
  background: var(--bg-card) !important;
  border-color: #1e293b !important;
  box-shadow: var(--shadow-card) !important;
  color: #f8fafc !important;
}

html.dark .modern-card:hover {
  border-color: #334155 !important;
  box-shadow: var(--shadow-hover) !important;
}

html.dark .hero-card {
  background: linear-gradient(160deg, #131b2e 0%, #0f172a 55%, #0b1120 100%) !important;
  border-color: #1e293b !important;
  border-top: 3.5px solid var(--coral-orange) !important;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.6) !important;
  color: #f8fafc !important;
}

html.dark .card-coral {
  background: linear-gradient(150deg, #2b1812 0%, #1c100c 100%) !important;
  border-color: #ea580c !important;
  box-shadow: 0 4px 16px rgba(234, 88, 12, 0.2) !important;
}

html.dark .card-slate {
  background: linear-gradient(150deg, #131f33 0%, #0c1524 100%) !important;
  border-color: #38bdf8 !important;
  box-shadow: 0 4px 16px rgba(56, 189, 248, 0.15) !important;
}

html.dark .card-stoneware {
  background: linear-gradient(150deg, #231f1c 0%, #171412 100%) !important;
  border-color: #786450 !important;
  box-shadow: 0 4px 16px rgba(120, 100, 80, 0.15) !important;
}

html.dark .card-navy-banner {
  background: #131b2e !important;
  border-color: #1e293b !important;
}

/* Station Cards & Alertas */
html.dark .station-card {
  background: #131b2e !important;
  border-color: #1e293b !important;
  box-shadow: var(--shadow-card) !important;
}

html.dark .station-card:hover {
  border-color: #334155 !important;
  box-shadow: var(--shadow-hover) !important;
}

html.dark .alert-card-inmet-amarelo,
html.dark .alert-card-inmet-laranja,
html.dark .alert-card-marinha {
  background: #131b2e !important;
  border-color: #334155 !important;
}

html.dark .alert-card-inmet-vermelho {
  background: #1e1318 !important;
  border-color: #ef4444 !important;
}

/* Chips, Medallions e Ícones */
html.dark .metric-chip {
  background: #192439 !important;
  border-color: #1e293b !important;
}

html.dark .metric-chip:hover {
  border-color: #334155 !important;
}

html.dark .metric-icon-wrap {
  background: #24324c !important;
  border-color: #334155 !important;
}

html.dark .icon-medallion {
  background: #192439 !important;
  border-color: #1e293b !important;
}

html.dark #hero-weather-icon {
  background: #192439 !important;
  border-color: #f07a53 !important;
  box-shadow: 0 4px 16px rgba(240, 122, 83, 0.25) !important;
}

html.dark .gauge-track {
  background-color: #1e293b !important;
  border-color: #334155 !important;
}

/* Botões */
html.dark .btn-action-outline {
  background: #192439 !important;
  border-color: #334155 !important;
  color: #f8fafc !important;
}

html.dark .btn-action-outline:hover {
  background: #24324c !important;
  border-color: #f8fafc !important;
}

html.dark .btn-action-slate {
  background: #1a253a !important;
  border-color: #334155 !important;
  color: #f8fafc !important;
}

html.dark .btn-action-slate:hover {
  background: #283955 !important;
  border-color: #475569 !important;
}

html.dark .btn-emergency {
  background: #2b1812 !important;
  border-color: #f97316 !important;
  color: #f8fafc !important;
}

html.dark .btn-emergency:hover {
  background: #3d2017 !important;
  border-color: #ea580c !important;
}

html.dark .station-filter-btn.active {
  background: #2b1812 !important;
  border-color: #f07a53 !important;
  color: #f8fafc !important;
}

html.dark .station-filter-btn:not(.active):hover {
  background-color: #1e293b !important;
}

html.dark .orla-tab-btn.active,
html.dark .orla-day-btn.active {
  background: #2b1812 !important;
  border-color: #f07a53 !important;
  color: #f8fafc !important;
}

html.dark .orla-tab-btn:not(.active):hover,
html.dark .orla-day-btn:not(.active):hover {
  background-color: #1e293b !important;
}

/* Tabelas Nórdicas em Dark Mode */
html.dark table {
  background-color: #131b2e !important;
  border-color: #1e293b !important;
}

html.dark thead tr, html.dark th {
  background-color: #172238 !important;
  border-color: #1e293b !important;
  color: #f8fafc !important;
}

html.dark td {
  border-color: #1e293b !important;
}

html.dark tbody tr {
  border-color: #1e293b !important;
}

html.dark tbody tr:nth-child(even) {
  background-color: #131b2e !important;
}

html.dark tbody tr:nth-child(odd) {
  background-color: #162035 !important;
}

html.dark tbody tr:hover {
  background-color: #1f2c48 !important;
}

/* Modais */
html.dark .modal-content,
html.dark .modal-backdrop > div > div {
  background-color: #131b2e !important;
  border-color: #334155 !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8) !important;
}

/* Inputs, Selects e Filtros */
html.dark input,
html.dark select,
html.dark textarea {
  background-color: #172238 !important;
  border-color: #334155 !important;
  color: #f8fafc !important;
}

html.dark input:focus,
html.dark select:focus,
html.dark textarea:focus {
  border-color: #f07a53 !important;
  outline: none;
}

/* Overrides de Utilitários Tailwind em Dark Mode */
html.dark .bg-white {
  background-color: #131b2e !important;
}

html.dark .bg-slate-50, html.dark .bg-gray-50 {
  background-color: #0a0f1d !important;
}

html.dark .bg-slate-100, html.dark .bg-gray-100 {
  background-color: #1e293b !important;
}

html.dark .bg-\\[\\#f4f6f8\\],
html.dark .bg-\\[\\#f8fafc\\],
html.dark .bg-\\[\\#f1f5f9\\],
html.dark .bg-\\[\\#eaeff2\\],
html.dark .bg-\\[\\#dee4e8\\] {
  background-color: #131b2e !important;
}

html.dark .bg-\\[\\#f5efe8\\],
html.dark .bg-\\[\\#f5efe8\\]\\/90,
html.dark .bg-\\[\\#eaf0f6\\] {
  background-color: #172238 !important;
}

html.dark .bg-\\[\\#ffebe4\\] {
  background-color: #2b1812 !important;
}

html.dark .border-slate-200,
html.dark .border-gray-200,
html.dark .border-\\[\\#e2e8f0\\],
html.dark .border-\\[\\#cbd5e1\\],
html.dark .border-\\[\\#94a3b8\\],
html.dark .border-\\[\\#b8a99a\\],
html.dark .border-\\[\\#b8a99a\\]\\/50 {
  border-color: #1e293b !important;
}

html.dark .divide-slate-200 > *,
html.dark .divide-gray-200 > *,
html.dark .divide-\\[\\#e2e8f0\\] > * {
  border-color: #1e293b !important;
}

html.dark [class*="bg-white/95"],
html.dark [class*="bg-white/90"],
html.dark [class*="bg-white/80"] {
  background-color: rgba(26, 37, 58, 0.95) !important;
}
"""
    if "/* TEMA ESCURO PROFISSIONAL" not in norm_css:
        norm_css += dark_mode_rules
        print("[OK] Regras do tema escuro adicionadas ao css/styles.css")
    else:
        print("[INFO] Regras do tema escuro ja presentes em css/styles.css")

    with open(path, "w", encoding="utf-8") as f:
        f.write(norm_css)
    print("[OK] css/styles.css salvo com sucesso.")


def update_charts_js():
    path = "js/charts.js"
    with open(path, "r", encoding="utf-8") as f:
        js = f.read()

    old_get_colors = """function getColors() {
  return {
    primary: '#334155',        /* Cinza Escuro Slate */
    secondary: '#ea580c',      /* Laranja Vibrante da Paleta */
    tertiary: '#64748b',       /* Cinza Médio */
    rain: '#0284c7',           /* Azul Chuva */
    rainFill: 'rgba(2, 132, 199, 0.80)', /* Azul Chuva Preenchimento */
    rainBorder: '#0369a1',     /* Azul Escuro Borda */
    barFill: 'rgba(100, 116, 139, 0.45)', /* Cinza para Barras */
    barBorder: '#334155',      /* Borda Cinza */
    gradStart: 'rgba(51, 65, 85, 0.22)',  /* Gradiente Cinza Suave */
    gradEnd: 'rgba(51, 65, 85, 0.02)',
    text: '#000000',           /* Texto 100% Preto */
    textMuted: '#000000',      /* Texto 100% Preto */
    grid: 'rgba(226, 232, 240, 0.85)' /* Linhas de grade suaves */
  };
}"""

    new_get_colors = """function getColors() {
  const isDark = typeof document !== 'undefined' && document.documentElement && document.documentElement.classList.contains('dark');
  if (isDark) {
    return {
      primary: '#94a3b8',        /* Slate Claro */
      secondary: '#f07a53',      /* Laranja Vibrante da Paleta */
      tertiary: '#cbd5e1',       /* Slate Médio */
      rain: '#38bdf8',           /* Azul Chuva Vibrante */
      rainFill: 'rgba(56, 189, 248, 0.45)',
      rainBorder: '#0284c7',
      barFill: 'rgba(148, 163, 184, 0.35)',
      barBorder: '#94a3b8',
      gradStart: 'rgba(148, 163, 184, 0.28)',
      gradEnd: 'rgba(148, 163, 184, 0.02)',
      text: '#f8fafc',           /* Texto Branco Puro */
      textMuted: '#cbd5e1',      /* Texto Slate Claro */
      grid: 'rgba(51, 65, 85, 0.45)' /* Linhas de grade sutis dark */
    };
  }
  return {
    primary: '#334155',        /* Cinza Escuro Slate */
    secondary: '#ea580c',      /* Laranja Vibrante da Paleta */
    tertiary: '#64748b',       /* Cinza Médio */
    rain: '#0284c7',           /* Azul Chuva */
    rainFill: 'rgba(2, 132, 199, 0.80)', /* Azul Chuva Preenchimento */
    rainBorder: '#0369a1',     /* Azul Escuro Borda */
    barFill: 'rgba(100, 116, 139, 0.45)', /* Cinza para Barras */
    barBorder: '#334155',      /* Borda Cinza */
    gradStart: 'rgba(51, 65, 85, 0.22)',  /* Gradiente Cinza Suave */
    gradEnd: 'rgba(51, 65, 85, 0.02)',
    text: '#000000',           /* Texto 100% Preto */
    textMuted: '#000000',      /* Texto 100% Preto */
    grid: 'rgba(226, 232, 240, 0.85)' /* Linhas de grade suaves */
  };
}"""

    norm_js = js.replace('\r\n', '\n')
    norm_old = old_get_colors.replace('\r\n', '\n')
    if norm_old in norm_js:
        norm_js = norm_js.replace(norm_old, new_get_colors)
        print("[OK] js/charts.js getColors() atualizado com suporte a dark mode")
    else:
        print("[INFO] getColors() nao encontrado exatamente em js/charts.js")

    with open(path, "w", encoding="utf-8") as f:
        f.write(norm_js)
    print("[OK] js/charts.js salvo com sucesso.")


def update_app_js():
    path = "js/app.js"
    with open(path, "r", encoding="utf-8") as f:
        js = f.read()

    theme_functions = """
// =============================================================================
// GERENCIADOR DE TEMA ESCURO / CLARO (DARK MODE 24/7)
// =============================================================================
window.toggleTheme = function() {
  const isDark = document.documentElement.classList.toggle('dark');
  try {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  } catch (e) {}

  window.updateThemeIcon(isDark);

  // Se houver gráficos Chart.js ativos, recarrega para adaptar cores
  if (typeof updateBulletinChart === 'function' && state.boletimData) {
    updateBulletinChart();
  }
  if (state.activeChartCanvas && state.activeHourlyData) {
    // Redesenha gráfico horário da métrica ativa
    const activeBtn = document.querySelector('.tab-metric-btn.active');
    const metric = activeBtn ? activeBtn.getAttribute('data-metric') : 'temperature';
    if (window.renderHourlyChart) {
      window.renderHourlyChart(state.activeChartCanvas, metric, state.activeHourlyData);
    }
  }
};

window.updateThemeIcon = function(isDark) {
  const btn = document.getElementById('btn-theme-toggle');
  const icon = document.getElementById('theme-icon');
  if (!icon) return;

  if (isDark) {
    icon.setAttribute('data-lucide', 'sun');
    if (btn) btn.setAttribute('title', 'Alternar para modo claro');
  } else {
    icon.setAttribute('data-lucide', 'moon');
    if (btn) btn.setAttribute('title', 'Alternar para modo escuro');
  }
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
};

// Sincroniza ícone na inicialização do DOM
document.addEventListener('DOMContentLoaded', () => {
  const isDark = document.documentElement.classList.contains('dark');
  window.updateThemeIcon(isDark);

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('theme')) {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        window.updateThemeIcon(e.matches);
      }
    });
  }
});
"""

    if "window.toggleTheme" not in js:
        js += theme_functions
        print("[OK] Funcoes de alternancia e sincronizacao de tema adicionadas a js/app.js")
    else:
        print("[INFO] Funcoes de tema ja presentes em js/app.js")

    with open(path, "w", encoding="utf-8") as f:
        f.write(js)
    print("[OK] js/app.js salvo com sucesso.")


if __name__ == "__main__":
    print("Iniciando aplicacao do Modo Escuro...")
    update_index_html()
    update_css()
    update_charts_js()
    update_app_js()
    print("Concluido com sucesso!")
