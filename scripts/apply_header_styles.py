import os, re

path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\css\styles.css'
with open(path, 'r', encoding='utf-8') as f:
    css = f.read()

# Replace .btn-emergency block
old_pattern = r'/\* Bot.*?o Emerg.*?ncia 199 \*/\s*\.btn-emergency\s*\{[^}]*\}\s*\.btn-emergency:hover\s*\{[^}]*\}'

new_btn_block = """/* Botão Emergência 199: Terracota Coral Cerâmico de Alto Destaque */
.btn-emergency {
  background: #ffebe4 !important;
  color: #000000 !important;
  font-weight: 800 !important;
  border-radius: 9999px !important;
  padding: 0.45rem 1.15rem !important;
  border: 1.5px solid #f97316 !important;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.2) !important;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  justify-content: center;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease !important;
}

.btn-emergency:hover {
  background: #fbd5c8 !important;
  border-color: #ea580c !important;
  transform: translateY(-1.5px);
  box-shadow: 0 4px 14px rgba(249, 115, 22, 0.3) !important;
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
  transition: all 0.2s ease !important;
}

.btn-action-slate:hover {
  background: #dbe7f2 !important;
  border-color: #3d4f61 !important;
  transform: translateY(-1.5px);
  box-shadow: 0 4px 10px rgba(61, 79, 97, 0.15) !important;
}"""

css, count = re.subn(old_pattern, new_btn_block, css)
print("Replaced .btn-emergency count:", count)

# Also check #site-header for border-top coral hairline
header_pattern = r'#site-header\s*\{[^}]*\}'
new_header_rule = """#site-header {
  border-top: 3.5px solid #f07a53 !important;
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1.5px solid var(--border-medium) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04) !important;
}"""
css, h_count = re.subn(header_pattern, new_header_rule, css)
print("Replaced #site-header count:", h_count)

with open(path, 'w', encoding='utf-8') as f:
    f.write(css)

print("Updated css/styles.css successfully via regex")
