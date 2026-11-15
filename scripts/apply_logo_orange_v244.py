import re
import os

files_to_update = [
    'src/App.tsx',
    'src/components/HourlyChart.tsx',
    'src/components/RiverChart.tsx',
    'src/components/CssExportModal.tsx',
    'index.html',
    'tailwind.config.js',
]

OLD_ACCENT = '#FCA311'
NEW_ACCENT = '#FF8244'  # Exact logo color rgb(255, 130, 68)

total_replacements = 0

for rel_path in files_to_update:
    if not os.path.exists(rel_path):
        print(f"File not found: {rel_path}")
        continue
    with open(rel_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    initial_len = len(content)
    
    # Replace FCA311 case insensitive
    content, count_fca = re.subn(r'#FCA311', NEW_ACCENT, content, flags=re.IGNORECASE)
    
    # Replace earlier orange approx #FA824C
    content, count_fa = re.subn(r'#FA824C', NEW_ACCENT, content, flags=re.IGNORECASE)
    
    # Replace hover shade #e0910f or #e5920c
    content, count_hov1 = re.subn(r'#e0910f', '#E66E30', content, flags=re.IGNORECASE)
    content, count_hov2 = re.subn(r'#e5920c', '#E66E30', content, flags=re.IGNORECASE)
    
    # Replace rgba for HourlyChart
    content, count_rgba = re.subn(r'rgba\(252,\s*163,\s*17,\s*([0-9.]+)\)', r'rgba(255, 130, 68, \1)', content)
    
    # Replace amber badge in App.tsx
    content, count_amber = re.subn(r'bg-amber-50 dark:bg-amber-950/40', 'bg-[#FF8244]/10 dark:bg-[#FF8244]/15', content)
    
    file_repl = count_fca + count_fa + count_hov1 + count_hov2 + count_rgba + count_amber
    total_replacements += file_repl
    
    print(f"{rel_path}: {file_repl} changes (FCA={count_fca}, FA={count_fa}, Hov={count_hov1+count_hov2}, RGBA={count_rgba}, Amber={count_amber})")
    
    with open(rel_path, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"\nTotal replacements across all files: {total_replacements}")
