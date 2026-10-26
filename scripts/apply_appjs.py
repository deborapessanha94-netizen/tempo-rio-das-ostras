import sys

with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_marker = '// Modal 4: Meteogramas Oficiais (INMET & CPTEC/INPE)'
end_marker = '// Fechar no ESC'

start_pos = text.find(start_marker)
end_pos = text.find(end_marker, start_pos)

if start_pos == -1 or end_pos == -1:
    print("ERROR: Markers not found!")
    sys.exit(1)

new_js = '''// Modal 4: Meteogramas Oficiais (INMET & CPTEC/INPE) com Zoom e Pan Interativo
  const modalMeteo = document.getElementById('modal-meteogramas');
  const btnOpenMeteo1 = document.getElementById('dock-btn-meteogramas');
  const btnOpenMeteo2 = document.getElementById('btn-open-meteogramas-card');
  const btnCloseMeteo = document.getElementById('btn-close-modal-meteogramas');
  const btnCloseMeteoFoot = document.getElementById('btn-close-modal-meteogramas-foot');

  const openMeteo = () => {
    if (modalMeteo) {
      modalMeteo.classList.remove('hidden');
      modalMeteo.classList.add('flex');
      if (window.resetMeteoZoom) window.resetMeteoZoom();
      if (window.lucide) lucide.createIcons();
    }
  };

  const closeMeteo = () => {
    if (modalMeteo) {
      modalMeteo.classList.add('hidden');
      modalMeteo.classList.remove('flex');
      if (window.resetMeteoZoom) window.resetMeteoZoom();
    }
  };

  window.openMeteoModal = openMeteo;
  window.closeMeteoModal = closeMeteo;

  if (btnOpenMeteo1) btnOpenMeteo1.addEventListener('click', openMeteo);
  if (btnOpenMeteo2) btnOpenMeteo2.addEventListener('click', openMeteo);
  if (btnCloseMeteo) btnCloseMeteo.addEventListener('click', closeMeteo);
  if (btnCloseMeteoFoot) btnCloseMeteoFoot.addEventListener('click', closeMeteo);

  // Alternância de Abas: INMET COSMO vs CPTEC Multimodel
  const tabInmet = document.getElementById('tab-btn-inmet-meteo');
  const tabCptec = document.getElementById('tab-btn-cptec-meteo');
  const contentInmet = document.getElementById('tab-content-inmet-meteo');
  const contentCptec = document.getElementById('tab-content-cptec-meteo');

  if (tabInmet && tabCptec && contentInmet && contentCptec) {
    const activeTabClasses = 'px-4 py-2 text-xs sm:text-sm font-bold border-b-2 border-zinc-900 dark:border-sky-400 text-zinc-900 dark:text-white cursor-pointer flex items-center gap-2';
    const inactiveTabClasses = 'px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer flex items-center gap-2';

    tabInmet.addEventListener('click', () => {
      tabInmet.className = activeTabClasses;
      tabCptec.className = inactiveTabClasses;
      contentInmet.classList.remove('hidden');
      contentCptec.classList.add('hidden');
      if (window.resetMeteoZoom) window.resetMeteoZoom();
      if (window.lucide) lucide.createIcons();
    });

    tabCptec.addEventListener('click', () => {
      tabCptec.className = activeTabClasses;
      tabInmet.className = inactiveTabClasses;
      contentCptec.classList.remove('hidden');
      contentInmet.classList.add('hidden');
      if (window.resetMeteoZoom) window.resetMeteoZoom();
      if (window.lucide) lucide.createIcons();
    });
  }

  // Suporte a abertura via query param ?modal=meteo ou hash #meteogramas
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const mParam = (searchParams.get('modal') || '').toLowerCase();
    if (mParam === 'meteo' || mParam === 'meteograma' || mParam === 'meteogramas' || window.location.hash === '#meteogramas') {
      setTimeout(() => { openMeteo(); }, 400);
    }
  } catch (err) {}

  // ==========================================================================
  // METEOGRAM ZOOM & PAN ENGINE
  // ==========================================================================
  const initMeteoZoomController = () => {
    const viewport = document.getElementById('meteo-zoom-viewport');
    const stage = document.getElementById('meteo-panzoom-stage');
    const img = document.getElementById('modal-img-meteograma-inmet');
    const btnZoomIn = document.getElementById('meteo-btn-zoom-in');
    const btnZoomOut = document.getElementById('meteo-btn-zoom-out');
    const btnReset = document.getElementById('meteo-btn-zoom-reset');
    const btnExpand = document.getElementById('meteo-btn-zoom-expand');
    const badge = document.getElementById('meteo-zoom-badge');

    if (!viewport || !stage || !img) return;

    let scale = 1.0;
    const minScale = 1.0;
    const maxScale = 4.0;
    const zoomStep = 0.35;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialPanX = 0;
    let initialPanY = 0;

    let initialPinchDist = 0;
    let initialPinchScale = 1.0;

    const updateTransform = (smooth = false) => {
      if (scale <= 1.02) {
        scale = 1.0;
        panX = 0;
        panY = 0;
        viewport.classList.remove('is-zoomed', 'is-dragging');
        viewport.style.cursor = 'zoom-in';
      } else {
        viewport.classList.add('is-zoomed');
        viewport.style.cursor = isDragging ? 'grabbing' : 'grab';

        // Clamping bounds
        const vpRect = viewport.getBoundingClientRect();
        const maxPanX = Math.max(0, (vpRect.width * (scale - 1)) / 2 + 100);
        const maxPanY = Math.max(0, (vpRect.height * (scale - 1)) / 2 + 160);
        panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
        panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
      }

      stage.style.transition = smooth ? 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
      stage.style.transform = `translate(${panX.toFixed(1)}px, ${panY.toFixed(1)}px) scale(${scale.toFixed(2)})`;

      if (badge) {
        badge.textContent = `${Math.round(scale * 100)}%`;
      }
    };

    const setScale = (newScale, smooth = true) => {
      scale = Math.max(minScale, Math.min(maxScale, newScale));
      updateTransform(smooth);
    };

    const zoomIn = () => {
      setScale(scale + zoomStep, true);
    };

    const zoomOut = () => {
      setScale(scale - zoomStep, true);
    };

    const resetZoom = () => {
      setScale(1.0, true);
    };

    window.resetMeteoZoom = resetZoom;

    // Botões de Ação
    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', (e) => {
        e.stopPropagation();
        zoomIn();
      });
    }

    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', (e) => {
        e.stopPropagation();
        zoomOut();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', (e) => {
        e.stopPropagation();
        resetZoom();
      });
    }

    if (btnExpand) {
      btnExpand.addEventListener('click', (e) => {
        e.stopPropagation();
        const imgSrc = img.getAttribute('src') || 'img/meteograma_inmet.png';
        window.open(imgSrc, '_blank');
      });
    }

    // Zoom com a roda do mouse (Mouse Wheel) centrado no cursor
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? zoomStep * 0.75 : -zoomStep * 0.75;
      const oldScale = scale;
      const nextScale = Math.max(minScale, Math.min(maxScale, oldScale + delta));

      if (nextScale !== oldScale) {
        const rect = viewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        const ratio = nextScale / oldScale;

        panX = mouseX - (mouseX - panX) * ratio;
        panY = mouseY - (mouseY - panY) * ratio;
        scale = nextScale;
        updateTransform(false);
      }
    }, { passive: false });

    // Panning com o mouse (Click & Drag)
    viewport.addEventListener('mousedown', (e) => {
      if (scale <= 1.0) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialPanX = panX;
      initialPanY = panY;
      viewport.classList.add('is-dragging');
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      panX = initialPanX + dx;
      panY = initialPanY + dy;
      updateTransform(false);
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        viewport.classList.remove('is-dragging');
        updateTransform(false);
      }
    });

    // Duplo clique: Alterna entre 100% e 220%
    viewport.addEventListener('dblclick', (e) => {
      e.preventDefault();
      if (scale > 1.1) {
        resetZoom();
      } else {
        const rect = viewport.getBoundingClientRect();
        const clickX = e.clientX - rect.left - rect.width / 2;
        const clickY = e.clientY - rect.top - rect.height / 2;
        scale = 2.2;
        panX = -clickX * 1.1;
        panY = -clickY * 1.1;
        updateTransform(true);
      }
    });

    // Gestos Touch (Mobile / Tablet): Pinch-to-Zoom e Arrastar
    let lastTap = 0;
    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTap < 300) {
          e.preventDefault();
          if (scale > 1.1) {
            resetZoom();
          } else {
            scale = 2.2;
            updateTransform(true);
          }
          lastTap = 0;
          return;
        }
        lastTap = now;

        if (scale > 1.0) {
          isDragging = true;
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          initialPanX = panX;
          initialPanY = panY;
        }
      } else if (e.touches.length === 2) {
        isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.hypot(dx, dy);
        initialPinchScale = scale;
      }
    }, { passive: false });

    viewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && isDragging && scale > 1.0) {
        e.preventDefault();
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        panX = initialPanX + dx;
        panY = initialPanY + dy;
        updateTransform(false);
      } else if (e.touches.length === 2 && initialPinchDist > 0) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const factor = dist / initialPinchDist;
        scale = Math.max(minScale, Math.min(maxScale, initialPinchScale * factor));
        updateTransform(false);
      }
    }, { passive: false });

    viewport.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        initialPinchDist = 0;
      }
      if (e.touches.length === 0) {
        isDragging = false;
      }
    }, { passive: true });
  };

  initMeteoZoomController();

  '''

text = text[:start_pos] + new_js + text[end_pos:]

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("js/app.js updated successfully!")
