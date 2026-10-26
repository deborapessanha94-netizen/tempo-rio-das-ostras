# -*- coding: utf-8 -*-
with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'btn-open-meteogramas-card' in line:
        # Look backwards for opening <div class="flex items-center gap-2 flex-wrap">
        start_line = None
        for j in range(i, max(0, i-30), -1):
            if 'class="flex items-center gap-2 flex-wrap"' in lines[j]:
                start_line = j
                break
        
        # Look forwards for the matching closing </div>
        end_line = None
        div_count = 0
        for j in range(start_line, min(len(lines), start_line + 50)):
            if '<div' in lines[j]:
                div_count += lines[j].count('<div')
            if '</div' in lines[j]:
                div_count -= lines[j].count('</div')
                if div_count == 0:
                    end_line = j
                    break
        
        print(f"Opening div at line {start_line+1}: {lines[start_line].strip()}")
        print(f"Closing div at line {end_line+1}: {lines[end_line].strip()}")
        break
