import sys, os, re
sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
app_path = os.path.join(BASE_DIR, "js", "app.js")

with open(app_path, "r", encoding="utf-8") as fp:
    code = fp.read()

# 1. Update window.switchAppTab
old_switch_target = """      if (btn) {



        btn.className = 'app-nav-tab active flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-[10.5px] sm:text-xs lg:text-sm font-black tracking-tight transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs w-full text-center';



        btn.setAttribute('aria-selected', 'true');



      }"""

new_switch_target = """      if (btn) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      }"""

assert old_switch_target in code, "Could not find old_switch_target in js/app.js"
code = code.replace(old_switch_target, new_switch_target, 1)

old_switch_inactive = """      if (btn) {



        btn.className = 'app-nav-tab flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-[10.5px] sm:text-xs lg:text-sm font-bold tracking-tight transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer w-full text-center';



        btn.setAttribute('aria-selected', 'false');



      }"""

new_switch_inactive = """      if (btn) {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }"""

assert old_switch_inactive in code, "Could not find old_switch_inactive in js/app.js"
code = code.replace(old_switch_inactive, new_switch_inactive, 1)

# Add window.updateSidebarNavState call inside switchAppTab
marker = "window.history.replaceState(null, null, '#' + target);"
assert marker in code, "Could not find history.replaceState marker in js/app.js"

addition = """const activeSub = (window.state && window.state.activeSubSections && window.state.activeSubSections[target]) || (window.SUB_SECTIONS_CONFIG && window.SUB_SECTIONS_CONFIG[target] && window.SUB_SECTIONS_CONFIG[target].default);
  if (typeof window.updateSidebarNavState === 'function') {
    window.updateSidebarNavState(target, activeSub);
  }
  """ + marker

code = code.replace(marker, addition, 1)

# 2. Update window.updateThemeIcon to also update theme-toggle-label
old_theme_icon = """  if (isDark) {



    icon.setAttribute('data-lucide', 'sun');



    if (btn) btn.setAttribute('title', 'Alternar para modo claro');



  } else {



    icon.setAttribute('data-lucide', 'moon');



    if (btn) btn.setAttribute('title', 'Alternar para modo escuro');



  }"""

new_theme_icon = """  const label = document.getElementById('theme-toggle-label');
  if (isDark) {
    icon.setAttribute('data-lucide', 'sun');
    if (btn) btn.setAttribute('title', 'Alternar para tema claro');
    if (label) label.textContent = 'Claro';
  } else {
    icon.setAttribute('data-lucide', 'moon');
    if (btn) btn.setAttribute('title', 'Alternar para tema escuro');
    if (label) label.textContent = 'Escuro';
  }"""

assert old_theme_icon in code, "Could not find old_theme_icon in js/app.js"
code = code.replace(old_theme_icon, new_theme_icon, 1)

with open(app_path, "w", encoding="utf-8") as fp:
    fp.write(code)

print("Updated js/app.js successfully!")
