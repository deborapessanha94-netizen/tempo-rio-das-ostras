import subprocess
import shutil
import glob
import os
import re

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
index_path = os.path.join(base_dir, "index.html")
sw_path = os.path.join(base_dir, "sw.js")

with open(index_path, 'r', encoding='utf-8') as f:
    orig_index = f.read()

# 1. Point index.html to /src/main.tsx
temp_index = re.sub(
    r'<script type="module" crossorigin src="./assets/index-[^"]+\.js"></script>',
    '<script type="module" src="/src/main.tsx"></script>',
    orig_index
)
# remove old css link if present during build so vite generates new one
temp_index = re.sub(
    r'<link rel="stylesheet" crossorigin href="./assets/index-[^"]+\.css">',
    '',
    temp_index
)

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(temp_index)

print("Temporary index.html written. Running vite build...")

# 2. Run vite build
res = subprocess.run(["cmd", "/c", "npx", "vite", "build"], cwd=base_dir, capture_output=True, text=True)
print("VITE STDOUT:\n", res.stdout)
print("VITE STDERR:\n", res.stderr)

if res.returncode != 0:
    print("Vite build failed! Restoring original index.html...")
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(orig_index)
    exit(1)

# 3. Find newly built files in dist/assets
dist_assets = os.path.join(base_dir, "dist", "assets")
new_js_files = glob.glob(os.path.join(dist_assets, "index-*.js"))
new_css_files = glob.glob(os.path.join(dist_assets, "index-*.css"))

if not new_js_files:
    print("Error: No JS file found in dist/assets!")
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(orig_index)
    exit(1)

new_js = os.path.basename(new_js_files[0])
new_css = os.path.basename(new_css_files[0]) if new_css_files else None

print(f"New bundle created: JS={new_js}, CSS={new_css}")

# 4. Copy dist/assets/* to assets/
dest_assets = os.path.join(base_dir, "assets")
for f in os.listdir(dist_assets):
    src_f = os.path.join(dist_assets, f)
    dst_f = os.path.join(dest_assets, f)
    shutil.copy2(src_f, dst_f)
    print(f"Copied {f} to assets/")

# 5. Update index.html with new production bundle
prod_index = re.sub(
    r'<script type="module" src="/src/main.tsx"></script>',
    f'<script type="module" crossorigin src="./assets/{new_js}"></script>\n    <link rel="stylesheet" crossorigin href="./assets/{new_css}">',
    temp_index
)
with open(index_path, 'w', encoding='utf-8') as f:
    f.write(prod_index)

print("Updated index.html for production.")

# 6. Update sw.js version and assets
with open(sw_path, 'r', encoding='utf-8') as f:
    sw_code = f.read()

# bump version to meteo-ostras-v266
sw_code = re.sub(r"const CACHE_NAME = 'meteo-ostras-v\d+';", "const CACHE_NAME = 'meteo-ostras-v266';", sw_code)
sw_code = re.sub(r"'./assets/index-[^']+\.js'", f"'./assets/{new_js}'", sw_code)
if new_css:
    sw_code = re.sub(r"'./assets/index-[^']+\.css'", f"'./assets/{new_css}'", sw_code)

with open(sw_path, 'w', encoding='utf-8') as f:
    f.write(sw_code)

print("Updated sw.js to meteo-ostras-v266.")
