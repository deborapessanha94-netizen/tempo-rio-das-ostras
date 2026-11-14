import sys, os
sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
index_path = os.path.join(BASE_DIR, "index.html")

with open(index_path, "r", encoding="utf-8") as fp:
    html = fp.read()

old_dom_load = """    document.addEventListener('DOMContentLoaded', function() {
      var h = (window.location.hash || '').replace('#', '');
      if (h && window.SUB_SECTIONS_CONFIG) {
        for (var t in window.SUB_SECTIONS_CONFIG) {
          if (window.SUB_SECTIONS_CONFIG[t].sections.indexOf(h) !== -1) {
            window.switchSubSection(t, h);
            return;
          }
        }
      }
      window.updateSidebarNavState(window.state.activeTab || 'previsao', (window.state.activeSubSections && window.state.activeSubSections['previsao']) || 'section-hero-previsao');
    });"""

new_dom_load = """    document.addEventListener('DOMContentLoaded', function() {
      var h = (window.location.hash || '').replace('#', '');
      if (h) {
        if (window.SUB_SECTIONS_CONFIG && window.SUB_SECTIONS_CONFIG[h]) {
          var defaultSub = (window.state && window.state.activeSubSections && window.state.activeSubSections[h]) || window.SUB_SECTIONS_CONFIG[h].default;
          window.switchSubSection(h, defaultSub);
          return;
        }
        if (window.SUB_SECTIONS_CONFIG) {
          for (var t in window.SUB_SECTIONS_CONFIG) {
            if (window.SUB_SECTIONS_CONFIG[t].sections.indexOf(h) !== -1) {
              window.switchSubSection(t, h);
              return;
            }
          }
        }
      }
      window.updateSidebarNavState(window.state.activeTab || 'previsao', (window.state.activeSubSections && window.state.activeSubSections['previsao']) || 'section-hero-previsao');
    });"""

assert old_dom_load in html, "Could not find old_dom_load"
html = html.replace(old_dom_load, new_dom_load, 1)

with open(index_path, "w", encoding="utf-8") as fp:
    fp.write(html)

print("Updated DOMContentLoaded hash routing in index.html")
