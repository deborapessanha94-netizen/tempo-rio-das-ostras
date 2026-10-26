import subprocess

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

# Script to inject into edge to find overflowing elements
js_code = """
const modal = document.getElementById('modal-meteogramas');
const card = modal.querySelector('.modern-card');
console.log('WINDOW WIDTH:', window.innerWidth);
console.log('MODAL CLIENT WIDTH:', modal.clientWidth);
console.log('CARD OFFSET WIDTH:', card.offsetWidth);
console.log('CARD SCROLL WIDTH:', card.scrollWidth);

function checkOverflow(el, depth = 0) {
    if (el.scrollWidth > el.clientWidth && el.clientWidth > 0) {
        console.log('  '.repeat(depth) + 'OVERFLOW:', el.tagName, el.id, el.className, 'scrollW:', el.scrollWidth, 'clientW:', el.clientWidth);
    }
    for (const child of el.children) {
        checkOverflow(child, depth + 1);
    }
}
checkOverflow(card);
"""

# Let's save a test html or run node/playwright or python
print("Let's debug modal widths!")
