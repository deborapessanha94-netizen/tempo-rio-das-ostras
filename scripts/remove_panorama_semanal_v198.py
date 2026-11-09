import re

INDEX_PATH = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html'
APP_JS_PATH = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\app.js'

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove Panorama Semanal (7 Dias) item from dropdown
# Target:
# <a onclick="navigateSubSection('previsao', 'section-panorama-semanal', event)" class="nav-dropdown-item cursor-pointer">
# ...
# </a>
pattern_item = re.compile(
    r'\s*<a\s+onclick="navigateSubSection\(\'previsao\',\s*\'section-panorama-semanal\',\s*event\)"[^>]*>.*?</a>',
    re.DOTALL
)
if pattern_item.search(content):
    content = pattern_item.sub('', content, count=1)
    print("SUCCESS: Removed Panorama Semanal item from dropdown")
else:
    print("WARNING: Could not find Panorama Semanal dropdown item")

# 2. Remove Baixar Card Panorama Semanal from dropdown download section
pattern_semanal_dl = re.compile(
    r'\s*<a\s+onclick="[^"]*openSocialModalWithTab\(\'semanal\'\)[^"]*"[^>]*>.*?</a>',
    re.DOTALL
)
if pattern_semanal_dl.search(content):
    content = pattern_semanal_dl.sub('', content, count=1)
    print("SUCCESS: Removed Baixar Card Panorama Semanal from dropdown")
else:
    print("WARNING: Could not find Baixar Card Panorama Semanal in dropdown")

# 3. Update the header of the download block in the dropdown to singular "Baixar Card Oficial"
content = content.replace("Baixar Cards Oficiais (Redes Sociais)", "Baixar Card Oficial (Redes Sociais)")

# 4. Remove section-panorama-semanal section from index.html
pattern_section = re.compile(
    r'\s*<!--\s*=+\s*-->\s*<!--\s*SEÇÃO DE PANORAMA SEMANAL.*?-->\s*<!--\s*=+\s*-->\s*<section id="section-panorama-semanal".*?</section>',
    re.DOTALL
)
if pattern_section.search(content):
    content = pattern_section.sub('', content, count=1)
    print("SUCCESS: Removed section-panorama-semanal element")
else:
    # Try fallback without exact comment encoding
    pattern_section_fallback = re.compile(r'\s*<section id="section-panorama-semanal".*?</section>', re.DOTALL)
    if pattern_section_fallback.search(content):
        content = pattern_section_fallback.sub('', content, count=1)
        print("SUCCESS: Removed section-panorama-semanal element (fallback)")
    else:
        print("WARNING: Could not find section-panorama-semanal element")

# 5. Remove 'section-panorama-semanal' from SUB_SECTIONS_CONFIG
content = content.replace("'section-panorama-semanal', ", "")
content = content.replace(", 'section-panorama-semanal'", "")
print("SUCCESS: Removed section-panorama-semanal from SUB_SECTIONS_CONFIG")

# 6. Bump to v=198
content = content.replace('src="js/app.js?v=197"', 'src="js/app.js?v=198"')
print("SUCCESS: Bumped index.html to v=198")

with open(INDEX_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

# Update js/app.js to v=198
with open(APP_JS_PATH, 'r', encoding='utf-8') as f:
    app_js = f.read()

app_js = app_js.replace("social-cards.js?v=197", "social-cards.js?v=198")
app_js = app_js.replace("weekly-overview.js?v=197", "weekly-overview.js?v=198")

with open(APP_JS_PATH, 'w', encoding='utf-8') as f:
    f.write(app_js)

print("SUCCESS: Bumped js/app.js to v=198")
