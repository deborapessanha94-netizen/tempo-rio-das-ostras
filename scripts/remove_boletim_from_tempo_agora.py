import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = r'(\s*<p className="text-xs text-slate-500 dark:text-\[#E5E5E5\]/75 mt-1">\s*Regi.*?Telem.*?Sede)\s*\{boletimMeta\?\.periodo\s*\?\s*`.*?Boletim:.*?`\s*:\s*\'\'\}'

match = re.search(pattern, text)
if match:
    print("Match found:", match.group(0))
    new_text = re.sub(pattern, r'\1', text, count=1)
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("SUCCESS: Removed boletim from Tempo Agora!")
else:
    print("No regex match.")
