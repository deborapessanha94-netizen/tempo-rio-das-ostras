import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('C:/Users/debor/.gemini/antigravity/scratch/meteorologia-app/index.html', 'r', encoding='utf-8') as fp:
    html = fp.read()

checks = [
    'id="site-header"',
    'id="btn-sidebar-toggle-top"',
    'id="app-workspace-shell"',
    'id="mobile-tab-bar"',
    'id="app-sidebar-nav"',
    'id="sidebar-nav-tabs"',
    'id="nav-tab-previsao"',
    'id="sidebar-subsections-previsao"',
    'id="nav-tab-chuva"',
    'id="sidebar-subsections-chuva"',
    'id="nav-tab-rio"',
    'id="sidebar-subsections-rio"',
    'id="nav-tab-orla"',
    'id="sidebar-subsections-orla"',
    'id="nav-tab-alertas"',
    'id="sidebar-subsections-alertas"',
    'id="nav-tab-boletim"',
    'id="sidebar-subsections-boletim"',
    'id="nav-tab-panorama"',
    'id="sidebar-subsections-panorama"',
    'id="app-main-content"',
    'id="view-tab-previsao"',
    'id="view-tab-chuva"',
    'id="view-tab-rio"',
    'id="view-tab-orla"',
    'id="view-tab-alertas"',
    'id="view-tab-boletim"',
    'id="view-tab-panorama"',
    '</main>',
    '<!-- FOOTER OFICIAL GOOGLE AI STUDIO DESIGN SYSTEM -->',
    'id="modal-boletim-tecnico"',
    'window.NAV_ITEMS_CONFIG',
    'window.updateSidebarNavState',
    'styles.css?v=219',
    'app.js?v=219'
]

for c in checks:
    status = "OK" if c in html else "MISSING"
    print(f"[{status}] {c}")
