with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

target = 'window.resetMeteoZoom = resetZoom;'
replacement = '''window.resetMeteoZoom = resetZoom;
    window.setMeteoZoom = setScale;

    try {
      const initialZoom = parseFloat(new URLSearchParams(window.location.search).get('zoom'));
      if (!isNaN(initialZoom) && initialZoom > 1.0) {
        setTimeout(() => {
          setScale(initialZoom, false);
        }, 500);
      }
    } catch (e) {}'''

if target in text:
    text = text.replace(target, replacement, 1)
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Added setMeteoZoom and url zoom param check to app.js!")
else:
    print("Target not found in app.js!")
