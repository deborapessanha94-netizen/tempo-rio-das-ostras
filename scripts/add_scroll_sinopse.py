# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('js/app.js', 'r', encoding='utf-8') as f:
    c = f.read()

old_scroll = """  if (scrollVal) {
    const y = parseInt(scrollVal, 10);
    if (!isNaN(y)) {
      setTimeout(() => {
        window.scrollTo({ top: y, behavior: 'instant' });
      }, 700);
    }
  }"""

# Use regex or string replace
target = "if (scrollVal) {"
replacement = """if (scrollVal) {
    if (scrollVal === 'sinopse' || scrollVal === 'section-panorama-sinotico') {
      setTimeout(() => {
        const el = document.getElementById('section-panorama-sinotico');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, 800);
      return;
    }
    const y = parseInt(scrollVal, 10);"""

# Check if target is present
if "if (scrollVal) {" in c:
    import re
    p = re.compile(r'if\s*\(scrollVal\)\s*\{\s*const y = parseInt\(scrollVal, 10\);')
    m = p.search(c)
    if m:
        c = c[:m.start()] + replacement + c[m.end():]
        print("Updated scrollVal in js/app.js with element scroll support")
        with open('js/app.js', 'w', encoding='utf-8') as f:
            f.write(c)
    else:
        print("Could not match regex pattern!")
