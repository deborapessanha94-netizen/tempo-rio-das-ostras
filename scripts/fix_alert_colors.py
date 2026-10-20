import os, re

# ==========================================
# 1. Update css/styles.css
# ==========================================
css_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\css\styles.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

old_alert_css = """.alert-card-inmet-amarelo {
  background: #ffffff;
  border: 1.5px solid var(--border-light);
  border-left: 5px solid #f59e0b;
  border-radius: 1.15rem;
  box-shadow: var(--shadow-card);
  color: #000000 !important;
}

.alert-card-inmet-laranja {
  background: #ffffff;
  border: 1.5px solid var(--border-light);
  border-left: 5px solid var(--coral-orange);
  border-radius: 1.15rem;
  box-shadow: var(--shadow-card);
  color: #000000 !important;
}

.alert-card-inmet-vermelho {
  background: #ffffff;
  border: 1.5px solid var(--border-light);
  border-left: 5px solid #ef4444;
  border-radius: 1.15rem;
  box-shadow: var(--shadow-card);
  color: #000000 !important;
}

.alert-card-marinha {
  background: #ffffff;
  border: 1.5px solid var(--border-light);
  border-left: 5px solid #000000;
  border-radius: 1.15rem;
  box-shadow: var(--shadow-card);
  color: #000000 !important;
}"""

new_alert_css = """/* Cards de Alertas: Design Nórdico Cerâmico Harmonioso (Sem faixas coloridas dissonantes) */
.alert-card-inmet-amarelo,
.alert-card-inmet-laranja,
.alert-card-marinha {
  background: #ffffff !important;
  border: 1.5px solid var(--border-medium) !important;
  border-radius: 1.25rem !important;
  box-shadow: var(--shadow-card) !important;
  color: #000000 !important;
  transition: all 0.2s ease;
}

.alert-card-inmet-vermelho {
  background: #ffffff !important;
  border: 1.5px solid #ef4444 !important;
  border-radius: 1.25rem !important;
  box-shadow: var(--shadow-card) !important;
  color: #000000 !important;
  transition: all 0.2s ease;
}

.alert-card-inmet-amarelo:hover,
.alert-card-inmet-laranja:hover,
.alert-card-inmet-vermelho:hover,
.alert-card-marinha:hover {
  border-color: #94a3b8 !important;
  box-shadow: var(--shadow-hover) !important;
}"""

if old_alert_css in css:
    css = css.replace(old_alert_css, new_alert_css)
else:
    css = css.replace(old_alert_css.replace('\r\n', '\n'), new_alert_css)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

print("Updated css/styles.css successfully")
