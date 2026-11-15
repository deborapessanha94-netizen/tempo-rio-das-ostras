import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "scripts", "extracted_modal.html"), "r", encoding="utf-8") as f:
    text = f.read()

print("Extracted modal size:", len(text))
# Check IDs present
ids = [
    'modal-social-chuva', 'social-modal-title', 'social-modal-subtitle',
    'social-tab-btn-tempo', 'social-tab-btn-chuva', 'social-tab-btn-vento', 'social-tab-btn-semanal',
    'social-btn-fmt-post', 'social-btn-fmt-story',
    'social-theme-btn-nordic', 'social-theme-btn-dark',
    'social-btn-filter-all', 'social-btn-filter-active', 'social-refresh-icon',
    'social-controls-chuva', 'social-custom-hours-input', 'social-btn-toggle-hoje',
    'social-chips-drawer', 'social-station-chips', 'social-selected-count', 'social-chips-chevron',
    'social-controls-vento', 'social-wind-btn-hoje', 'social-wind-btn-24h', 'social-wind-btn-agora',
    'social-preview-container', 'social-preview-image', 'social-download-main-btn'
]

for my_id in ids:
    print(f"ID {my_id}: {'id=\"' + my_id + '\"' in text}")
