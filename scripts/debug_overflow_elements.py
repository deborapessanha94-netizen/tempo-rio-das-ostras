import subprocess, json

# We can run edge with remote debugging or headless evaluation
edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

# Let's inspect index.html directly by reading styles or adding a temporary debug console.log
with open('js/app.js', 'r', encoding='utf-8') as f:
    app_text = f.read()

debug_snippet = """
setTimeout(() => {
  const m = document.getElementById('modal-meteogramas');
  if (!m) return;
  console.log('[DEBUG] window width:', window.innerWidth);
  const all = m.querySelectorAll('*');
  for (const el of all) {
    if (el.offsetWidth > window.innerWidth || el.scrollWidth > window.innerWidth) {
      console.log('[DEBUG OVERFLOW]', el.tagName, el.id, el.className, 'offsetW:', el.offsetWidth, 'scrollW:', el.scrollWidth);
    }
  }
}, 800);
"""

print("Debug snippet prepared")
