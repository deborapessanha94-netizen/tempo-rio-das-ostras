# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update hero-weather-icon static placeholder in HTML
old_icon = '''              <div id="hero-weather-icon" class="icon-medallion w-14 h-14 sm:w-16 sm:h-16 bg-white text-black border-2 border-[#f07a53] shadow-sm">
                <i data-lucide="cloud-rain" class="w-8 h-8 sm:w-9 sm:h-9 text-black"></i>
              </div>'''

# Match with regex for whitespace tolerance
import re
icon_pattern = re.compile(r'<div id="hero-weather-icon"[^>]*>[\s\S]*?<\/div>')
m_icon = icon_pattern.search(content)
if m_icon:
    new_icon = '''<div id="hero-weather-icon" class="icon-medallion w-14 h-14 sm:w-16 sm:h-16 bg-white dark:bg-[#192439] text-black dark:text-white border-2 border-[#f07a53] shadow-sm">
                <i data-lucide="cloud-lightning" class="w-8 h-8 sm:w-9 sm:h-9 text-amber-500 dark:text-amber-400"></i>
              </div>'''
    content = content[:m_icon.start()] + new_icon + content[m_icon.end():]
    print("Updated hero-weather-icon in index.html")
else:
    print("Could not match hero-weather-icon pattern!")

# 2. Bump cache-busters
content = content.replace('css/styles.css?v=98', 'css/styles.css?v=99')
content = content.replace('js/app.js?v=126', 'js/app.js?v=127')
print("Bumped cache-busters to v99 and v127")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Finished writing index.html")
