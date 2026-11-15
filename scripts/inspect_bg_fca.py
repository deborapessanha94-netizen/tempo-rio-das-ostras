import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

matches = re.findall(r'className="([^"]*bg-\[#FCA311\][^"]*)"', text)
print(f"Total matching classNames with bg-[#FCA311]: {len(matches)}")
for m in matches[:15]:
    print("  ", m)
