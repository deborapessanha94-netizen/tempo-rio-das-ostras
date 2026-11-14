import urllib.request
url = 'https://deborapessanha94-netizen.github.io/tempo-rio-das-ostras/index.html'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache'})
try:
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
        print('Live GitHub Pages length:', len(data))
        print('Has site-header:', b'id="site-header"' in data)
        print('Has app-sidebar-nav:', b'id="app-sidebar-nav"' in data)
        print('Last-Modified:', resp.headers.get('Last-Modified'))
        print('ETag:', resp.headers.get('ETag'))
except Exception as e:
    print('Error:', e)
