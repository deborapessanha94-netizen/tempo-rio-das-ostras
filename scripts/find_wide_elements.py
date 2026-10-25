import subprocess, json

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

# Let's inspect the page in Edge and find elements wider than window.innerWidth
js_code = """
(function() {
  const docWidth = document.documentElement.offsetWidth;
  const elements = document.querySelectorAll('*');
  const wide = [];
  for (let el of elements) {
    if (el.offsetWidth > docWidth || el.scrollWidth > docWidth) {
      wide.push({
        tag: el.tagName,
        id: el.id,
        className: el.className ? el.className.toString().slice(0, 50) : '',
        offsetWidth: el.offsetWidth,
        scrollWidth: el.scrollWidth
      });
    }
  }
  console.log(JSON.stringify(wide));
})();
"""

# Let's write an HTML test script to check it
with open('test_inspect.js', 'w', encoding='utf-8') as f:
    f.write(js_code)
print("Wrote test_inspect.js")
