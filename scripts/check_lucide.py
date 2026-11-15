import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

m = re.search(r'import\s*\{([^}]+)\}\s*from\s*[\'"]lucide-react[\'"]', text)
if m:
    icons = [x.strip() for x in m.group(1).split(',')]
    print('CalendarClock in icons?', 'CalendarClock' in icons)
    print('Calendar in icons?', 'Calendar' in icons)
    print('Clock in icons?', 'Clock' in icons)
