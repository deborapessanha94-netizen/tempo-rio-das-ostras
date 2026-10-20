import os

# ==========================================
# 1. Update css/styles.css
# ==========================================
css_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\css\styles.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Update #site-header
old_header_css = """/* Barra Superior Fixa: Cerâmica Minimalista */
#site-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1.5px solid var(--border-light);
}"""

new_header_css = """/* Barra Superior Fixa: Padrão Nórdico Cerâmico com Coroa Coral */
#site-header {
  border-top: 3.5px solid var(--coral-orange) !important;
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1.5px solid var(--border-medium) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04) !important;
}"""

if old_header_css in css:
    css = css.replace(old_header_css, new_header_css)
else:
    css = css.replace(old_header_css.replace('\r\n', '\n'), new_header_css)

# Update .btn-emergency, .btn-action-outline, and add .btn-action-slate
old_btn_emergency = """.btn-emergency {
  background: #fee2e2 !important;
  color: #000000 !important;
  font-weight: 800 !important;
  border-radius: 9999px !important;
  padding: 0.45rem 1.15rem !important;
  border: 1.5px solid #ef4444 !important;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.15) !important;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  justify-content: center;
  cursor: pointer;
  text-decoration: none;
}

.btn-emergency:hover {
  background: #fecaca !important;
  transform: translateY(-1px);
}"""

new_btn_emergency = """/* Botão Emergência 199: Terracota Coral Cerâmico de Alto Destaque */
.btn-emergency {
  background: #ffebe4 !important;
  color: #000000 !important;
  font-weight: 800 !important;
  border-radius: 9999px !important;
  padding: 0.45rem 1.15rem !important;
  border: 1.5px solid #f97316 !important;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.18) !important;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  justify-content: center;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-emergency:hover {
  background: #fbd5c8 !important;
  border-color: #ea580c !important;
  transform: translateY(-1.5px);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25) !important;
}

/* Botão Pílula Slate Ice (Nórdico) */
.btn-action-slate {
  background: #eaf0f6 !important;
  color: #000000 !important;
  border: 1.5px solid #94a3b8 !important;
  font-weight: 700 !important;
  border-radius: 9999px !important;
  padding: 0.45rem 1.05rem !important;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  justify-content: center;
  cursor: pointer;
  text-decoration: none;
  box-shadow: 0 1px 4px rgba(61, 79, 97, 0.08);
  transition: all 0.2s ease;
}

.btn-action-slate:hover {
  background: #dbe7f2 !important;
  border-color: #3d4f61 !important;
  transform: translateY(-1.5px);
  box-shadow: 0 4px 10px rgba(61, 79, 97, 0.12);
}"""

if old_btn_emergency in css:
    css = css.replace(old_btn_emergency, new_btn_emergency)
else:
    css = css.replace(old_btn_emergency.replace('\r\n', '\n'), new_btn_emergency)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

print("Updated css/styles.css for header")
