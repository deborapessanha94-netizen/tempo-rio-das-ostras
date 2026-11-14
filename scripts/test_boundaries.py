import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('C:/Users/debor/.gemini/antigravity/scratch/meteorologia-app/index.html', 'r', encoding='utf-8') as fp:
    html = fp.read()

# 1. Start and end of app-sticky-navigation
idx_nav_start = html.find('<div id="app-sticky-navigation"')
idx_nav_end = html.find('</div> <!-- /#app-sticky-navigation -->')
print('app-sticky-navigation found at:', idx_nav_start, 'ends at:', idx_nav_end)
if idx_nav_end != -1:
    idx_nav_end += len('</div> <!-- /#app-sticky-navigation -->')

# 2. Old footer
idx_footer_start = html.find('<footer class="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6 border-t-2 border-[#cbd5e1]')
idx_footer_end = html.find('<!-- VIEW 7: RETROSPECTIVA / PANORAMA MENSAL DO CLIMA', idx_footer_start)
print('Old footer found at:', idx_footer_start, 'ends before View 7 at:', idx_footer_end)

# 3. View 7 panorama
idx_pano_start = html.find('id="view-tab-panorama"')
idx_pano_modal = html.find('<div id="modal-boletim-tecnico"', idx_pano_start)
print('View 7 found at:', idx_pano_start, 'modal begins at:', idx_pano_modal)

# 4. Script block
idx_script_start = html.find('window.SUB_SECTIONS_CONFIG = {')
idx_script_end = html.find('</script>\n  <script src="js/historico_planilha.js')
if idx_script_end == -1:
    idx_script_end = html.find('</script>', idx_script_start)
print('Script block found at:', idx_script_start, 'ends at:', idx_script_end)
