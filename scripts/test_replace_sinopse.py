# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

start_marker = '<section id="section-panorama-sinotico"'
end_marker = '</div> <!-- /#view-tab-alertas -->'

p_start = c.find(start_marker)
p_end = c.find(end_marker, p_start)
section_slice = c[p_start:p_end]
p_section_end = section_slice.rfind('</section>') + len('</section>')

exact_section = c[p_start : p_start + p_section_end]
print("Exact section starts with:", repr(exact_section[:60]))
print("Exact section ends with:", repr(exact_section[-30:]))
print("Opening divs count in exact_section:", exact_section.count('<div'))
print("Closing divs count in exact_section:", exact_section.count('</div'))
print("Opening section count in exact_section:", exact_section.count('<section'))
print("Closing section count in exact_section:", exact_section.count('</section'))
