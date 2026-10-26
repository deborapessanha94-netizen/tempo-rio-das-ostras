import re
import xml.etree.ElementTree as ET

def clean_svg(raw_svg):
    svg = raw_svg
    # Remove inkscape namespace attributes
    svg = re.sub(r'\s+[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+="[^"]*"', '', svg)
    # Remove duplicate id attribute
    svg = re.sub(r'\s+id="map[0-9]+"', '', svg)
    
    # Reset strokes cleanly: 1px white border with non-scaling-stroke so municipality fills show vibrant and clear!
    svg = re.sub(r'stroke:\s*[^;]+;', 'stroke: #ffffff;', svg)
    svg = re.sub(r'stroke-width:\s*[^;]+;', 'stroke-width: 1.2px;', svg)
    svg = re.sub(r'stroke-opacity:\s*[^;]+;', 'stroke-opacity: 0.9;', svg)
    
    # Highlight Rio das Ostras with a prominent 3.5px black stroke
    svg = re.sub(
        r'(<g id="rio-das-ostras"[^>]*>.*?<path [^>]*style=")([^"]*)(")',
        r'\1\2 stroke: #000000; stroke-width: 3.5px; stroke-opacity: 1;\3',
        svg,
        flags=re.DOTALL
    )
    
    # Check if marker already exists, if not add it
    if '<!-- Rio das Ostras Marker -->' not in svg:
        marker = '''
    <!-- Rio das Ostras Marker -->
    <circle cx="195500" cy="123500" r="5000" fill="#dc2626" stroke="#ffffff" stroke-width="1500" />
    <circle cx="195500" cy="123500" r="9000" fill="none" stroke="#dc2626" stroke-width="1000" stroke-opacity="0.9" />
    <text x="195500" y="113000" font-family="system-ui, -apple-system, sans-serif" font-size="7500" font-weight="900" fill="#000000" text-anchor="middle">Rio das Ostras</text>
    '''
        svg = svg.replace('</svg>', marker + '</svg>')
    
    return svg

for fname in ['cemaden_rj_hidro.svg', 'cemaden_rj_geo.svg']:
    fpath = f"img/cemaden/{fname}"
    with open(fpath, 'r', encoding='utf-8') as f:
        data = f.read()
    cleaned = clean_svg(data)
    
    try:
        ET.fromstring(cleaned)
        print(f"Cleaned {fname} is 100% VALID XML!")
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(cleaned)
    except Exception as e:
        print(f"Error in {fname}: {e}")
