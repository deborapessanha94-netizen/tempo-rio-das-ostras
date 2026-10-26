# -*- coding: utf-8 -*-
"""
Patch js/app.js to add switchCemadenTab and support #cemaden / #riscos hash
"""
from pathlib import Path

app_path = Path("js/app.js")
content = app_path.read_text(encoding="utf-8")

cemaden_func = """

window.switchCemadenTab = function(tabName) {
  const tabs = ['rj', 'geo', 'hidro', 'mapas'];
  tabs.forEach(t => {
    const btn = document.getElementById(`cemaden-tab-btn-${t}`);
    const panel = document.getElementById(`cemaden-panel-${t}`);
    if (btn) {
      if (t === tabName) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        btn.className = 'cemaden-tab-btn active flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-black transition cursor-pointer bg-[#fef3c7] border-2 border-[#d97706] text-black shadow-xs';
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
        btn.className = 'cemaden-tab-btn flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-bold transition text-black dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 border-2 border-transparent cursor-pointer';
      }
    }
    if (panel) {
      if (t === tabName) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    }
  });
  if (window.lucide) window.lucide.createIcons();
};
"""

if "window.switchCemadenTab" not in content:
    target_orla_end = "if (window.lucide) window.lucide.createIcons();\n\n\n\n};"
    idx = content.find("window.switchOrlaTab = function")
    if idx != -1:
        idx_end = content.find("};", idx) + 2
        content = content[:idx_end] + cemaden_func + content[idx_end:]
        print("Added switchCemadenTab function.")
    else:
        content += cemaden_func
        print("Appended switchCemadenTab at end.")

# Update handleUrlHash
target_hash_block = """  if (rawHash === 'wwatch' || qTab === 'wwatch' || rawHash === 'ondas') {
    window.switchAppTab('orla');
    if (window.switchOrlaTab) {
      setTimeout(() => window.switchOrlaTab('wwatch'), 100);
    }
  }"""

replacement_hash_block = """  if (rawHash === 'wwatch' || qTab === 'wwatch' || rawHash === 'ondas') {
    window.switchAppTab('orla');
    if (window.switchOrlaTab) {
      setTimeout(() => window.switchOrlaTab('wwatch'), 100);
    }
  }

  if (rawHash === 'cemaden' || qTab === 'cemaden' || rawHash === 'riscos' || rawHash === 'geohidro') {
    window.switchAppTab('alertas');
    setTimeout(() => {
      const sec = document.getElementById('section-cemaden-riscos');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  }"""

if "rawHash === 'cemaden'" not in content:
    content = content.replace(target_hash_block, replacement_hash_block)
    print("Added cemaden hash support in handleUrlHash.")

app_path.write_text(content, encoding="utf-8")
print("Saved patched js/app.js.")
