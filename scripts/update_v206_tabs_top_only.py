import re
from pathlib import Path

ROOT = Path(r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app")

# 2. Update js/app.js
app_path = ROOT / "js" / "app.js"
app_js = app_path.read_text(encoding="utf-8")

# A. Update switchOrlaTab in js/app.js to dynamically update #orla-card-header-title, #orla-card-header-subtitle, and #orla-seguranca-grid
pattern_switch_orla = re.compile(
    r'window\.switchOrlaTab\s*=\s*function\(tabName\)\s*\{.*?window\.lucide\.createIcons\(\);\s*\};',
    re.DOTALL
)
assert pattern_switch_orla.search(app_js), "Could not find window.switchOrlaTab in js/app.js"

new_switch_orla = """window.switchOrlaTab = function(tabName) {
  if (tabName === 'wwatch') tabName = 'mar';
  state.activeOrlaTab = tabName;
  if (window.state && window.state.activeSubSections) {
    window.state.activeSubSections.orla = `orla-panel-${tabName}`;
  }
  const tabs = ['mar', 'mares', 'balnear'];
  tabs.forEach(t => {
    const panel = document.getElementById(`orla-panel-${t}`);
    if (panel) {
      if (t === tabName) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    }
  });

  const hTitle = document.getElementById('orla-card-header-title');
  const hSub = document.getElementById('orla-card-header-subtitle');
  const segGrid = document.getElementById('orla-seguranca-grid');

  if (tabName === 'mar') {
    if (hTitle) hTitle.textContent = 'Condições do Mar & Ondas na Orla';
    if (hSub) hSub.textContent = 'Previsão marítima (1 Semana / 8 Dias), ondulação, swell e enseadas';
    if (segGrid) segGrid.classList.remove('hidden');
  } else if (tabName === 'mares') {
    if (hTitle) hTitle.textContent = 'Tábua de Marés Astronômica Oficial';
    if (hSub) hSub.textContent = 'Horários e alturas de preamar e baixa-mar (CHM / Marinha do Brasil)';
    if (segGrid) segGrid.classList.add('hidden');
  } else if (tabName === 'balnear') {
    if (hTitle) hTitle.textContent = 'Balneabilidade Oficial das Praias (INEA)';
    if (hSub) hSub.textContent = 'Qualidade da água para banho nas 11 praias monitoradas de Rio das Ostras';
    if (segGrid) segGrid.classList.add('hidden');
  }

  if (window.lucide) window.lucide.createIcons();
};"""

app_js = pattern_switch_orla.sub(new_switch_orla, app_js, count=1)

# B. Update switchSubSection, showAllSubSections, handleNavTabClick in js/app.js
old_app_orla_block = """  // 3. Caso especial para Aba Orla (abas integradas de mar, marés e balneabilidade)
  if (tabName === 'orla') {
    if (targetId === 'orla-panel-mar' && typeof window.switchOrlaTab === 'function') {
      window.switchOrlaTab('mar');
    } else if (targetId === 'orla-panel-mares' && typeof window.switchOrlaTab === 'function') {
      window.switchOrlaTab('mares');
    } else if (targetId === 'orla-panel-balnear' && typeof window.switchOrlaTab === 'function') {
      window.switchOrlaTab('balnear');
    }
  }"""

new_app_orla_block = """  // 3. Caso especial para Aba Orla (abas de mar, marés e balneabilidade)
  if (tabName === 'orla') {
    if (targetId === 'orla-panel-mar' && typeof window.switchOrlaTab === 'function') {
      window.switchOrlaTab('mar');
    } else if (targetId === 'orla-panel-mares' && typeof window.switchOrlaTab === 'function') {
      window.switchOrlaTab('mares');
    } else if (targetId === 'orla-panel-balnear' && typeof window.switchOrlaTab === 'function') {
      window.switchOrlaTab('balnear');
    }
  }
  if (tabName === 'rio') {
    const notifMacae = document.getElementById('notificacao-rios-macae');
    if (notifMacae) {
      if (targetId === 'card-tabela-rio-jundia') notifMacae.classList.add('hidden');
      else notifMacae.classList.remove('hidden');
    }
  }"""

assert old_app_orla_block.replace("\n", "\r\n") in app_js or old_app_orla_block in app_js, "Could not find app_orla_block in js/app.js"
app_js = app_js.replace(old_app_orla_block.replace("\n", "\r\n"), new_app_orla_block.replace("\n", "\r\n")).replace(old_app_orla_block, new_app_orla_block)

old_app_show_all = """  if (tabName === 'boletim') {
    const turnosCol = document.getElementById('section-boletim-turnos-col');
    const telCol = document.getElementById('section-boletim-telefones-col');
    if (turnosCol) {
      turnosCol.classList.remove('hidden', 'lg:col-span-12', 'w-full');
      turnosCol.classList.add('lg:col-span-8');
    }
    if (telCol) {
      telCol.classList.remove('hidden', 'lg:col-span-12', 'w-full');
      telCol.classList.add('lg:col-span-4');
    }
  }"""

new_app_show_all = """  if (tabName === 'boletim') {
    const turnosCol = document.getElementById('section-boletim-turnos-col');
    const telCol = document.getElementById('section-boletim-telefones-col');
    if (turnosCol) {
      turnosCol.classList.remove('hidden', 'lg:col-span-12', 'w-full');
      turnosCol.classList.add('lg:col-span-8');
    }
    if (telCol) {
      telCol.classList.remove('hidden', 'lg:col-span-12', 'w-full');
      telCol.classList.add('lg:col-span-4');
    }
  }
  if (tabName === 'orla') {
    const segGrid = document.getElementById('orla-seguranca-grid');
    if (segGrid) segGrid.classList.remove('hidden');
    const hTitle = document.getElementById('orla-card-header-title');
    const hSub = document.getElementById('orla-card-header-subtitle');
    if (hTitle) hTitle.textContent = 'Condições da Orla, Marés & Balneabilidade';
    if (hSub) hSub.textContent = 'Mar (1 Semana / 8 Dias), Tábuas de Maré e Balneabilidade INEA';
  }
  if (tabName === 'rio') {
    const notifMacae = document.getElementById('notificacao-rios-macae');
    if (notifMacae) notifMacae.classList.remove('hidden');
  }"""

assert old_app_show_all.replace("\n", "\r\n") in app_js or old_app_show_all in app_js, "Could not find app_show_all in js/app.js"
app_js = app_js.replace(old_app_show_all.replace("\n", "\r\n"), new_app_show_all.replace("\n", "\r\n")).replace(old_app_show_all, new_app_show_all)

old_app_nav_click = """  window.closeAllNavDropdowns();
  const activeSub = (window.state.activeSubSections && window.state.activeSubSections[tabName]) || window.SUB_SECTIONS_CONFIG[tabName]?.default;
  window.switchSubSection(tabName, activeSub);"""

new_app_nav_click = """  if (isCurrentlyActive) {
    window.toggleNavDropdown(tabName, event);
    return;
  }
  window.closeAllNavDropdowns();
  const activeSub = (window.state.activeSubSections && window.state.activeSubSections[tabName]) || window.SUB_SECTIONS_CONFIG[tabName]?.default;
  window.switchSubSection(tabName, activeSub);"""

assert old_app_nav_click.replace("\n", "\r\n") in app_js or old_app_nav_click in app_js, "Could not find app_nav_click in js/app.js"
app_js = app_js.replace(old_app_nav_click.replace("\n", "\r\n"), new_app_nav_click.replace("\n", "\r\n")).replace(old_app_nav_click, new_app_nav_click)

app_js = app_js.replace("v205", "v206")
app_path.write_text(app_js, encoding="utf-8")
print("Updated js/app.js successfully.")

# 3. Update sw.js
sw_path = ROOT / "sw.js"
sw_js = sw_path.read_text(encoding="utf-8")
sw_js = re.sub(r"v20[0-9]", "v206", sw_js)
sw_path.write_text(sw_js, encoding="utf-8")
print("Updated sw.js successfully.")
