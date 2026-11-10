from pathlib import Path

base = Path(__file__).resolve().parent.parent
p_app = base / "js" / "app.js"
txt_app = p_app.read_text(encoding="utf-8")

old_block = """  const hash = window.location.hash ? window.location.hash.replace('#', '') : '';
  const initialTab = ['previsao', 'chuva', 'rio', 'orla', 'alertas', 'boletim'].includes(hash) ? hash : 'previsao';
  const initialSub = (window.state && window.state.activeSubSections && window.state.activeSubSections[initialTab]) || window.SUB_SECTIONS_CONFIG[initialTab]?.default;
  setTimeout(() => {
    window.switchSubSection(initialTab, initialSub);
  }, 50);"""

new_block = """  const hash = window.location.hash ? window.location.hash.replace('#', '') : '';
  const initialTab = (window.state && window.state.activeTab) ? window.state.activeTab : (['previsao', 'chuva', 'rio', 'orla', 'alertas', 'boletim'].includes(hash) ? hash : 'previsao');
  const initialSub = (window.state && window.state.activeSubSections && window.state.activeSubSections[initialTab]) || window.SUB_SECTIONS_CONFIG[initialTab]?.default;
  setTimeout(() => {
    const curTab = (window.state && window.state.activeTab) || initialTab;
    const curSub = (window.state && window.state.activeSubSections && window.state.activeSubSections[curTab]) || initialSub;
    window.switchSubSection(curTab, curSub);
  }, 50);"""

txt_app_norm = txt_app.replace("\r\n", "\n")
if old_block in txt_app_norm:
    txt_app_norm = txt_app_norm.replace(old_block, new_block)
    p_app.write_text(txt_app_norm, encoding="utf-8")
    print("[OK] js/app.js initialTab atualizado!")
else:
    print("[INFO] js/app.js ja atualizado.")
