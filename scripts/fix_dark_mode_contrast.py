# -*- coding: utf-8 -*-
import re

with open('css/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Substituir regras de tipografia e cards que forçavam preto universal
# h1, h2, h3, h4, h5, h6, .font-heading { ... color: #000000 !important; }
css = re.sub(
    r'(/\* Tipografia \*/\s*)(h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6,\s*\.font-heading\s*\{[^}]*color:\s*#000000\s*!important;)',
    r'\1html:not(.dark) \2',
    css
)

css = re.sub(
    r'(\.font-mono,\s*\.mono-val\s*\{[^}]*color:\s*#000000\s*!important;)',
    r'html:not(.dark) \1',
    css
)

# .modern-card { ... color: #000000 !important; ... }
css = css.replace('.modern-card {\n  background: var(--bg-card);\n  border: 1.5px solid var(--border-light);\n  border-radius: 1.5rem; /* 24px */\n  box-shadow: var(--shadow-card);\n  color: #000000 !important;',
                  '.modern-card {\n  background: var(--bg-card);\n  border: 1.5px solid var(--border-light);\n  border-radius: 1.5rem; /* 24px */\n  box-shadow: var(--shadow-card);')

# .hero-card { ... color: #000000 !important; ... }
css = css.replace('color: #000000 !important;\n  position: relative;\n  overflow: hidden;\n}',
                  'position: relative;\n  overflow: hidden;\n}')

# Variações de cards
css = css.replace('.card-coral {\n  background: linear-gradient(150deg, #ffebe4 0%, #ffdcd1 100%) !important;\n  border: 1.5px solid #f97316 !important;\n  color: #000000 !important;',
                  '.card-coral {\n  background: linear-gradient(150deg, #ffebe4 0%, #ffdcd1 100%) !important;\n  border: 1.5px solid #f97316 !important;')

css = css.replace('.card-slate {\n  background: linear-gradient(150deg, #e3ecf4 0%, #d8e5f0 100%) !important;\n  border: 1.5px solid #6d8ba6 !important;\n  color: #000000 !important;',
                  '.card-slate {\n  background: linear-gradient(150deg, #e3ecf4 0%, #d8e5f0 100%) !important;\n  border: 1.5px solid #6d8ba6 !important;')

css = css.replace('.card-stoneware {\n  background: linear-gradient(150deg, #f5efe8 0%, #ebe2d7 100%) !important;\n  border: 1.5px solid #b8a99a !important;\n  color: #000000 !important;',
                  '.card-stoneware {\n  background: linear-gradient(150deg, #f5efe8 0%, #ebe2d7 100%) !important;\n  border: 1.5px solid #b8a99a !important;')

css = css.replace('.card-navy-banner {\n  background: #ffffff !important;\n  border: 1.5px solid var(--border-medium) !important;\n  color: #000000 !important;',
                  '.card-navy-banner {\n  background: #ffffff !important;\n  border: 1.5px solid var(--border-medium) !important;')

# Botões
css = css.replace('.btn-coral-pill, .btn-action-primary {\n  background: var(--coral-orange) !important;\n  color: #000000 !important;',
                  '.btn-coral-pill, .btn-action-primary {\n  background: var(--coral-orange) !important;')

css = css.replace('.btn-slate-pill {\n  background: #e2e8f0 !important;\n  color: #000000 !important;',
                  '.btn-slate-pill {\n  background: #e2e8f0 !important;')

css = css.replace('.btn-emergency {\n  background: #ffebe4 !important;\n  color: #000000 !important;',
                  '.btn-emergency {\n  background: #ffebe4 !important;')

css = css.replace('.btn-action-slate {\n  background: #eaf0f6 !important;\n  color: #000000 !important;',
                  '.btn-action-slate {\n  background: #eaf0f6 !important;')

css = css.replace('.btn-action-outline {\n  background: #ffffff !important;\n  color: #000000 !important;',
                  '.btn-action-outline {\n  background: #ffffff !important;')

# Chips e Medallions
css = css.replace('.icon-medallion {\n  width: 3rem;\n  height: 3rem;\n  border-radius: 9999px;\n  background: #ffffff;\n  border: 1.5px solid var(--border-medium);\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #000000 !important;',
                  '.icon-medallion {\n  width: 3rem;\n  height: 3rem;\n  border-radius: 9999px;\n  background: #ffffff;\n  border: 1.5px solid var(--border-medium);\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);\n  display: flex;\n  align-items: center;\n  justify-content: center;')

css = css.replace('.metric-chip {\n  background: #ffffff;\n  border: 1.5px solid var(--border-light);\n  border-radius: 0.875rem; /* 14px */\n  padding: 0.45rem 0.65rem;\n  display: flex;\n  align-items: center;\n  gap: 0.55rem;\n  transition: all 0.2s ease;\n  color: #000000 !important;',
                  '.metric-chip {\n  background: #ffffff;\n  border: 1.5px solid var(--border-light);\n  border-radius: 0.875rem; /* 14px */\n  padding: 0.45rem 0.65rem;\n  display: flex;\n  align-items: center;\n  gap: 0.55rem;\n  transition: all 0.2s ease;')

css = css.replace('.metric-icon-wrap {\n  width: 2.15rem;\n  height: 2.15rem;\n  border-radius: 9999px;\n  background: #f1f5f9;\n  color: #000000 !important;',
                  '.metric-icon-wrap {\n  width: 2.15rem;\n  height: 2.15rem;\n  border-radius: 9999px;\n  background: #f1f5f9;')

# Alertas
css = css.replace('border-radius: 1.25rem !important;\n  box-shadow: var(--shadow-card) !important;\n  color: #000000 !important;\n  transition: all 0.2s ease;\n}\n\n.alert-card-inmet-vermelho {\n  background: #ffffff !important;\n  border: 1.5px solid #ef4444 !important;\n  border-radius: 1.25rem !important;\n  box-shadow: var(--shadow-card) !important;\n  color: #000000 !important;',
                  'border-radius: 1.25rem !important;\n  box-shadow: var(--shadow-card) !important;\n  transition: all 0.2s ease;\n}\n\n.alert-card-inmet-vermelho {\n  background: #ffffff !important;\n  border: 1.5px solid #ef4444 !important;\n  border-radius: 1.25rem !important;\n  box-shadow: var(--shadow-card) !important;')

# Abas e Botões
css = css.replace('.tab-metric-btn {\n  padding: 0.4rem 0.9rem;\n  border-radius: 9999px;\n  font-size: 0.75rem;\n  font-weight: 700;\n  color: #000000 !important;',
                  '.tab-metric-btn {\n  padding: 0.4rem 0.9rem;\n  border-radius: 9999px;\n  font-size: 0.75rem;\n  font-weight: 700;')

css = css.replace('.orla-tab-btn {\n  border: 1.5px solid transparent;\n  outline: none;\n  cursor: pointer;\n  user-select: none;\n  border-radius: 9999px !important;\n  transition: all 0.2s ease;\n  color: #000000 !important;',
                  '.orla-tab-btn {\n  border: 1.5px solid transparent;\n  outline: none;\n  cursor: pointer;\n  user-select: none;\n  border-radius: 9999px !important;\n  transition: all 0.2s ease;')

css = css.replace('.orla-day-btn {\n  border-radius: 9999px !important;\n  transition: all 0.2s ease;\n  user-select: none;\n  color: #000000 !important;',
                  '.orla-day-btn {\n  border-radius: 9999px !important;\n  transition: all 0.2s ease;\n  user-select: none;')

css = css.replace('.app-nav-tab {\n  border: 2px solid transparent;\n  outline: none;\n  cursor: pointer;\n  user-select: none;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n  color: #000000 !important;',
                  '.app-nav-tab {\n  border: 2px solid transparent;\n  outline: none;\n  cursor: pointer;\n  user-select: none;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);')

# Novo bloco mestre de alto contraste e legibilidade para modo escuro
master_dark_rules = """
/* ========================================================================= */
/* ALTO CONTRASTE E VISIBILIDADE TOTAL NO MODO ESCURO (TEXTOS E SÍMBOLOS)     */
/* ========================================================================= */
html.dark,
html.dark body,
html.dark p, html.dark span, html.dark div,
html.dark h1, html.dark h2, html.dark h3, html.dark h4, html.dark h5, html.dark h6,
html.dark .font-heading, html.dark .font-mono, html.dark .mono-val,
html.dark a, html.dark button, html.dark input, html.dark select, html.dark textarea,
html.dark table, html.dark th, html.dark td, html.dark label, html.dark strong,
html.dark b, html.dark em, html.dark i, html.dark small, html.dark pre, html.dark code,
html.dark li, html.dark ul, html.dark ol {
  color: #f8fafc !important;
}

/* Ícones e Símbolos SVG traçados em branco/slate de alto contraste */
html.dark svg,
html.dark svg path,
html.dark svg circle,
html.dark svg line,
html.dark svg polyline,
html.dark svg rect,
html.dark svg polygon {
  stroke: #f8fafc !important;
}

/* Overrides de classes utilitárias text-black e tons escuros do Tailwind no modo escuro */
html.dark .text-black,
html.dark [class*="text-black/"],
html.dark [class*="text-[#334155]"],
html.dark [class*="text-[#475569]"],
html.dark [class*="text-[#3d4f61]"],
html.dark [class*="text-[#786450]"],
html.dark [class*="text-[#786350]"],
html.dark [class*="text-zinc-700"],
html.dark [class*="text-zinc-800"],
html.dark [class*="text-zinc-900"],
html.dark [class*="text-slate-700"],
html.dark [class*="text-slate-800"],
html.dark [class*="text-slate-900"],
html.dark [class*="text-gray-700"],
html.dark [class*="text-gray-800"],
html.dark [class*="text-gray-900"] {
  color: #f8fafc !important;
}

/* Textos secundários em slate suave de alta legibilidade */
html.dark [class*="text-[#64748b]"],
html.dark .text-slate-400,
html.dark .text-gray-400,
html.dark .text-zinc-400 {
  color: #cbd5e1 !important;
}

/* Destaques coloridos legíveis no escuro */
html.dark .text-\\[\\#ea580c\\],
html.dark .text-\\[\\#f07a53\\],
html.dark .text-orange-500,
html.dark .text-orange-600 {
  color: #fb923c !important;
}

html.dark .text-\\[\\#0284c7\\],
html.dark .text-\\[\\#0369a1\\],
html.dark .text-blue-600,
html.dark .text-sky-500 {
  color: #38bdf8 !important;
}

html.dark .text-emerald-700,
html.dark .text-emerald-800,
html.dark .text-emerald-600,
html.dark .text-\\[\\#065f46\\],
html.dark .text-\\[\\#166534\\] {
  color: #4ade80 !important;
}

html.dark .text-rose-700,
html.dark .text-rose-800,
html.dark .text-rose-600,
html.dark .text-\\[\\#9f1239\\],
html.dark .text-\\[\\#be123c\\] {
  color: #fb7185 !important;
}

html.dark .text-amber-700,
html.dark .text-amber-800,
html.dark .text-\\[\\#92400e\\],
html.dark .text-\\[\\#d97706\\] {
  color: #fbbf24 !important;
}

/* Ícones com destaques de cor preservados no modo escuro */
html.dark svg.text-emerald-500, html.dark svg.text-emerald-400, html.dark svg.text-emerald-600,
html.dark .text-emerald-500 svg, html.dark .text-emerald-400 svg {
  stroke: #34d399 !important;
}

html.dark svg.text-amber-500, html.dark svg.text-amber-400,
html.dark .text-amber-500 svg, html.dark .text-amber-400 svg {
  stroke: #fbbf24 !important;
}

html.dark svg.text-rose-500, html.dark svg.text-rose-600, html.dark svg.text-red-500,
html.dark .text-rose-500 svg, html.dark .text-red-500 svg {
  stroke: #f87171 !important;
}

html.dark svg.text-\\[\\#0284c7\\], html.dark svg.text-\\[\\#38bdf8\\], html.dark svg.text-sky-400, html.dark svg.text-blue-500,
html.dark [class*="text-[#0284c7]"] svg, html.dark [class*="text-[#38bdf8]"] svg {
  stroke: #38bdf8 !important;
}

html.dark svg.text-\\[\\#f07a53\\], html.dark svg.text-\\[\\#ea580c\\],
html.dark [class*="text-[#f07a53]"] svg, html.dark [class*="text-[#ea580c]"] svg {
  stroke: #f07a53 !important;
}
"""

if '/* ALTO CONTRASTE E VISIBILIDADE TOTAL NO MODO ESCURO' not in css:
    css += master_dark_rules
    print("Master dark contrast rules appended.")
else:
    print("Master dark contrast rules already present.")

with open('css/styles.css', 'w', encoding='utf-8') as f:
    f.write(css)
print("css/styles.css updated successfully.")
