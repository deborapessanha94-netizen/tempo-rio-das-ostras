with open('css/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

target = '''/* Dark mode overrides for Meteogram Modal */
html.dark #modal-meteogramas .modern-card {
  background-color: #0d1527 !important;
  border-color: #1e293b !important;
  color: #f1f5f9 !important;
}'''

replacement = '''/* Responsive constraints for Meteogram Modal */
#modal-meteogramas .modern-card {
  max-width: min(56rem, calc(100vw - 1.5rem)) !important;
  width: 100% !important;
  margin: auto !important;
}

#meteo-zoom-container-inmet,
#meteo-zoom-viewport,
#meteo-panzoom-stage {
  min-width: 0 !important;
  max-width: 100% !important;
}

/* Dark mode overrides for Meteogram Modal */
html.dark #modal-meteogramas .modern-card {
  background-color: #0d1527 !important;
  border-color: #1e293b !important;
  color: #f1f5f9 !important;
}'''

if target in css:
    css = css.replace(target, replacement, 1)
    with open('css/styles.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print("Updated css/styles.css with responsive constraints!")
else:
    print("Target not found in css/styles.css!")
