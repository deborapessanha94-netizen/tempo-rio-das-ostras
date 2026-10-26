with open('css/styles.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

new_styles = '''

/* ==========================================================================
   METEOGRAMA ZOOM & PAN VIEWER (v124)
   ========================================================================== */
#meteo-zoom-viewport {
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

#meteo-zoom-viewport.is-zoomed {
  cursor: grab;
}

#meteo-zoom-viewport.is-zoomed.is-dragging {
  cursor: grabbing !important;
}

#meteo-panzoom-stage {
  will-change: transform;
}

/* Dark mode overrides for Meteogram Modal */
html.dark #modal-meteogramas .modern-card {
  background-color: #0d1527 !important;
  border-color: #1e293b !important;
  color: #f1f5f9 !important;
}

html.dark #modal-meteogramas .bg-[#f8fafc],
html.dark #modal-meteogramas .bg-zinc-50 {
  background-color: #111a30 !important;
  border-color: #1e293b !important;
}

html.dark #modal-meteogramas .bg-white {
  background-color: #0d1527 !important;
}

html.dark #modal-meteogramas .border-b,
html.dark #modal-meteogramas .border-t,
html.dark #modal-meteogramas .border-[#e2e8f0],
html.dark #modal-meteogramas .border-[#cbd5e1] {
  border-color: #1e293b !important;
}

html.dark #modal-meteogramas h3 {
  color: #f8fafc !important;
}

html.dark #modal-meteogramas .text-[#1e293b] {
  color: #f1f5f9 !important;
}

html.dark #modal-meteogramas .text-[#64748b] {
  color: #94a3b8 !important;
}

html.dark #modal-meteogramas .text-[#334155] {
  color: #cbd5e1 !important;
}

html.dark #meteo-zoom-container-inmet {
  background-color: #070c18 !important;
  border-color: #1e293b !important;
}

html.dark #meteo-zoom-toolbar {
  background-color: rgba(15, 23, 42, 0.94) !important;
  border-color: #334155 !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5) !important;
}

html.dark #meteo-zoom-toolbar button {
  color: #f1f5f9 !important;
}

html.dark #meteo-zoom-toolbar button:hover {
  background-color: #1e293b !important;
}

html.dark #meteo-zoom-badge {
  color: #38bdf8 !important;
}

html.dark #meteo-zoom-hint {
  background-color: rgba(15, 23, 42, 0.9) !important;
  border-color: #334155 !important;
  color: #94a3b8 !important;
}

/* CPTEC Tab in Dark Mode */
html.dark #cptec-hourly-tbody tr:hover {
  background-color: #131d35 !important;
}

html.dark #cptec-hourly-tbody {
  color: #cbd5e1 !important;
}

html.dark #modal-meteogramas thead {
  background-color: #131d35 !important;
  color: #94a3b8 !important;
}
'''

if '#meteo-zoom-viewport' not in css_content:
    with open('css/styles.css', 'a', encoding='utf-8') as f:
        f.write(new_styles)
    print("Added zoom styles to css/styles.css")
else:
    print("Styles already present in css/styles.css")
