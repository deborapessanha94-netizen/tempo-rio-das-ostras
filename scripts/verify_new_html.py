import re
import sys
from collections import Counter

filename = sys.argv[1] if len(sys.argv) > 1 else 'index.html'

with open(filename, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Check all expected view IDs
expected_views = [
    'view-tab-previsao',
    'view-tab-chuva',
    'view-tab-rio',
    'view-tab-orla',
    'view-tab-alertas',
    'view-tab-boletim'
]
for v in expected_views:
    if f'id="{v}"' in content:
        print(f"OK view: {v}")
    else:
        print(f"MISSING view: {v}")

# 2. Check tab buttons
expected_tabs = [
    'nav-tab-previsao',
    'nav-tab-chuva',
    'nav-tab-rio',
    'nav-tab-orla',
    'nav-tab-alertas',
    'nav-tab-boletim'
]
for t in expected_tabs:
    if f'id="{t}"' in content:
        print(f"OK tab button: {t}")
    else:
        print(f"MISSING tab button: {t}")

# 3. Check important component IDs
expected_components = [
    'hero-condition',
    'bulletin-chart',
    'section-previsao-3dias',
    'card-condicoes-orla',
    'card-telemetria-jundia',
    'card-telefones-uteis',
    'card-chuva-turnos',
    'section-alertas-oficiais',
    'section-panorama-sinotico',
    'stations-cards-grid',
    'stations-table-tbody',
    'modal-social-chuva',
    'modal-praias-detalhes'
]
for c in expected_components:
    if f'id="{c}"' in content:
        print(f"OK component: {c}")
    else:
        print(f"MISSING component: {c}")

# 4. Check for duplicate IDs
ids = re.findall(r'id="([^"]+)"', content)
counts = Counter(ids)
dups = {k: v for k, v in counts.items() if v > 1}
print("\nDuplicate IDs count:", len(dups))
if dups:
    for k, v in dups.items():
        print(f"Duplicate id='{k}': {v} times")

# 5. Tag balance check for <div>, <section>, <nav>, <main>
for tag in ['div', 'section', 'nav', 'main']:
    opens = len(re.findall(rf'<{tag}(\s|>)', content))
    closes = len(re.findall(rf'</{tag}>', content))
    print(f"Tag <{tag}>: {opens} opens, {closes} closes, diff = {opens - closes}")
