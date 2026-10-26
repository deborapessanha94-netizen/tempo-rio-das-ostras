with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''    const btnZoomIn = document.getElementById('meteo-btn-zoom-in');
    const btnZoomOut = document.getElementById('meteo-btn-zoom-out');
    const btnReset = document.getElementById('meteo-btn-zoom-reset');
    const btnExpand = document.getElementById('meteo-btn-zoom-expand');
    const badge = document.getElementById('meteo-zoom-badge');'''

replacement = '''    const btnZoomIn = document.getElementById('meteo-btn-zoom-in');
    const btnZoomOut = document.getElementById('meteo-btn-zoom-out');
    const btnReset = document.getElementById('meteo-btn-zoom-reset');
    const btnExpand = document.getElementById('meteo-btn-zoom-expand');
    const btnDownload = document.getElementById('meteo-btn-download');
    const btnDownloadTop = document.getElementById('meteo-btn-download-top');
    const rodada00Btn = document.getElementById('meteo-rodada-00');
    const rodada12Btn = document.getElementById('meteo-rodada-12');
    const badge = document.getElementById('meteo-zoom-badge');
    let currentRodada = '00';'''

if target in text:
    text = text.replace(target, replacement, 1)
    print("Replaced button declarations in app.js!")
else:
    print("Button declarations not found!")

# Now add download and rodada click handlers after btnExpand
target2 = '''    if (btnExpand) {
      btnExpand.addEventListener('click', (e) => {
        e.stopPropagation();
        const imgSrc = img.getAttribute('src') || 'img/meteograma_inmet.png';
        window.open(imgSrc, '_blank');
      });
    }'''

replacement2 = '''    if (btnExpand) {
      btnExpand.addEventListener('click', (e) => {
        e.stopPropagation();
        const imgSrc = img.getAttribute('src') || 'img/meteograma_inmet.png';
        window.open(imgSrc, '_blank');
      });
    }

    // Ação de Download Direto do Meteograma
    const triggerDownload = (e) => {
      if (e) e.stopPropagation();
      const currentSrc = img.getAttribute('src') || 'img/meteograma_inmet.png';
      const todayStr = new Date().toISOString().split('T')[0];
      const filename = `meteograma_inmet_riodasostras_${todayStr}_${currentRodada}utc.png`;

      const a = document.createElement('a');
      a.href = currentSrc;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    if (btnDownload) btnDownload.addEventListener('click', triggerDownload);
    if (btnDownloadTop) btnDownloadTop.addEventListener('click', triggerDownload);

    // Alternância de Rodadas Oficiais do INMET (00 UTC vs 12 UTC)
    const activeRodadaClasses = 'px-2 py-0.5 text-xs font-bold rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs cursor-pointer transition';
    const inactiveRodadaClasses = 'px-2 py-0.5 text-xs font-semibold rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition';

    if (rodada00Btn) {
      rodada00Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentRodada = '00';
        rodada00Btn.className = activeRodadaClasses;
        if (rodada12Btn) rodada12Btn.className = inactiveRodadaClasses;
        img.src = 'img/meteograma_inmet.png';
        resetZoom();
      });
    }

    if (rodada12Btn) {
      rodada12Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentRodada = '12';
        rodada12Btn.className = activeRodadaClasses;
        if (rodada00Btn) rodada00Btn.className = inactiveRodadaClasses;
        img.src = 'img/inmet_live_12utc.png';
        resetZoom();
      });
    }'''

if target2 in text:
    text = text.replace(target2, replacement2, 1)
    print("Added download & rodada click handlers to app.js!")
else:
    print("Target2 not found!")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated js/app.js successfully!")
