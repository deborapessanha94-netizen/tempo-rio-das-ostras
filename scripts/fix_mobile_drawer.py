import sys, os
sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"

# 1. Update css/styles.css
css_path = os.path.join(BASE_DIR, "css", "styles.css")
with open(css_path, "r", encoding="utf-8") as fp:
    css = fp.read()

mobile_nav_rule = """
/* Responsive Drawer Rail Control */
@media (max-width: 1023px) {
  #app-sidebar-nav {
    display: none;
    width: 100% !important;
    position: relative !important;
    top: 0 !important;
  }
  #app-sidebar-nav.mobile-open {
    display: block !important;
    animation: drawerFadeIn 0.2s ease-out;
  }
}
@media (min-width: 1024px) {
  #app-sidebar-nav {
    display: block !important;
    position: -webkit-sticky;
    position: sticky;
    top: 5rem;
    max-height: calc(100vh - 6rem);
    overflow-y: auto;
  }
}

@keyframes drawerFadeIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
"""

css += "\n" + mobile_nav_rule
with open(css_path, "w", encoding="utf-8") as fp:
    fp.write(css)
print("Updated css/styles.css with mobile-open responsive drawer rules")

# 2. Update toggleMobileSidebar & closeMobileSidebar in index.html
index_path = os.path.join(BASE_DIR, "index.html")
with open(index_path, "r", encoding="utf-8") as fp:
    html = fp.read()

old_toggle = """    window.toggleMobileSidebar = function() {
      var aside = document.getElementById('app-sidebar-nav');
      var chevron = document.getElementById('mobile-menu-chevron');
      var menuText = document.getElementById('mobile-menu-text');
      if (!aside) return;
      var isHidden = aside.classList.contains('hidden');
      if (isHidden) {
        aside.classList.remove('hidden');
        if (chevron) chevron.classList.add('rotate-180');
        if (menuText) menuText.textContent = 'Ocultar Abas';
      } else {
        aside.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
        if (menuText) menuText.textContent = 'Abas & Seções';
      }
    };

    window.closeMobileSidebar = function() {
      if (window.innerWidth >= 1024) return;
      var aside = document.getElementById('app-sidebar-nav');
      var chevron = document.getElementById('mobile-menu-chevron');
      var menuText = document.getElementById('mobile-menu-text');
      if (aside && !aside.classList.contains('hidden')) {
        aside.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
        if (menuText) menuText.textContent = 'Abas & Seções';
      }
    };"""

new_toggle = """    window.toggleMobileSidebar = function() {
      var aside = document.getElementById('app-sidebar-nav');
      var chevron = document.getElementById('mobile-menu-chevron');
      var menuText = document.getElementById('mobile-menu-text');
      if (!aside) return;
      var isOpen = aside.classList.toggle('mobile-open');
      aside.classList.remove('hidden');
      if (isOpen) {
        if (chevron) chevron.classList.add('rotate-180');
        if (menuText) menuText.textContent = 'Ocultar Abas';
      } else {
        if (chevron) chevron.classList.remove('rotate-180');
        if (menuText) menuText.textContent = 'Abas & Seções';
      }
    };

    window.closeMobileSidebar = function() {
      if (window.innerWidth >= 1024) return;
      var aside = document.getElementById('app-sidebar-nav');
      var chevron = document.getElementById('mobile-menu-chevron');
      var menuText = document.getElementById('mobile-menu-text');
      if (aside && aside.classList.contains('mobile-open')) {
        aside.classList.remove('mobile-open');
        if (chevron) chevron.classList.remove('rotate-180');
        if (menuText) menuText.textContent = 'Abas & Seções';
      }
    };"""

assert old_toggle in html, "Could not find old_toggle in index.html"
html = html.replace(old_toggle, new_toggle, 1)

with open(index_path, "w", encoding="utf-8") as fp:
    fp.write(html)

print("Updated index.html toggleMobileSidebar logic")
