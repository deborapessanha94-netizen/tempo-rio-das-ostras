from pathlib import Path

ROOT = Path(r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app")

# 1. Update index.html inline script so window.state.activeTab is always updated and switchAppTab has a synchronous fallback
index_path = ROOT / "index.html"
html = index_path.read_text(encoding="utf-8")

old_inline_switch = """      var targetId = sectionId || (window.state.activeSubSections && window.state.activeSubSections[tabName]) || config.default;
      window.state.activeSubSections[tabName] = targetId;

      if (typeof window.switchAppTab === 'function') {
        window.switchAppTab(tabName);
      }"""

new_inline_switch = """      var targetId = sectionId || (window.state.activeSubSections && window.state.activeSubSections[tabName]) || config.default;
      window.state.activeSubSections[tabName] = targetId;
      window.state.activeTab = tabName;

      if (typeof window.switchAppTab === 'function') {
        window.switchAppTab(tabName);
      } else {
        document.querySelectorAll('.app-tab-view').forEach(function(v) {
          if (v.id === 'view-tab-' + tabName) v.classList.remove('hidden');
          else v.classList.add('hidden');
        });
      }"""

assert old_inline_switch in html, "Could not find old_inline_switch in index.html"
html = html.replace(old_inline_switch, new_inline_switch, 1)

old_inline_active_check = "var isCurrentlyActive = (window.state && window.state.activeTab === tabName);"
new_inline_active_check = "var viewEl = document.getElementById('view-tab-' + tabName);\n      var isCurrentlyActive = (window.state && window.state.activeTab === tabName) || (viewEl && !viewEl.classList.contains('hidden'));"
assert old_inline_active_check in html, "Could not find old_inline_active_check in index.html"
html = html.replace(old_inline_active_check, new_inline_active_check, 1)

index_path.write_text(html, encoding="utf-8")

# 2. Update js/app.js so window.state.activeTab is always updated in switchSubSection and showAllSubSections
app_path = ROOT / "js" / "app.js"
app_js = app_path.read_text(encoding="utf-8")

old_app_switch = """  const targetId = sectionId || window.state.activeSubSections[tabName] || config.default;
  window.state.activeSubSections[tabName] = targetId;

  // 1. Ativa a aba principal caso ainda não esteja visível
  if (typeof window.switchAppTab === 'function') {
    window.switchAppTab(tabName);
  }"""

new_app_switch = """  const targetId = sectionId || window.state.activeSubSections[tabName] || config.default;
  window.state.activeSubSections[tabName] = targetId;
  window.state.activeTab = tabName;

  // 1. Ativa a aba principal caso ainda não esteja visível
  if (typeof window.switchAppTab === 'function') {
    window.switchAppTab(tabName);
  }"""

assert old_app_switch.replace("\n", "\r\n") in app_js or old_app_switch in app_js, "Could not find old_app_switch in js/app.js"
app_js = app_js.replace(old_app_switch.replace("\n", "\r\n"), new_app_switch.replace("\n", "\r\n")).replace(old_app_switch, new_app_switch)

old_app_active_check = "const isCurrentlyActive = (window.state && window.state.activeTab === tabName);"
new_app_active_check = "const viewEl = document.getElementById('view-tab-' + tabName);\n  const isCurrentlyActive = (window.state && window.state.activeTab === tabName) || (viewEl && !viewEl.classList.contains('hidden'));"
assert old_app_active_check.replace("\n", "\r\n") in app_js or old_app_active_check in app_js, "Could not find old_app_active_check in js/app.js"
app_js = app_js.replace(old_app_active_check.replace("\n", "\r\n"), new_app_active_check.replace("\n", "\r\n")).replace(old_app_active_check, new_app_active_check)

app_path.write_text(app_js, encoding="utf-8")
print("Updated activeTab sync in index.html and js/app.js.")
