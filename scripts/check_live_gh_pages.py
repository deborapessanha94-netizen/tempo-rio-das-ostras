import urllib.request
import re

url = 'https://deborapessanha94-netizen.github.io/tempo-rio-das-ostras/'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    m = re.findall(r'assets/index-[^\"]+\.js', html)
    print('Live GitHub Pages JS bundles:', m)
    sw = urllib.request.urlopen(url + 'sw.js').read().decode('utf-8')
    v = re.findall(r'const CACHE_NAME = [^;]+;', sw)
    print('Live GitHub Pages sw.js version:', v)
except Exception as e:
    print('Error:', e)
