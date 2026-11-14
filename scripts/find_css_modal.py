import glob, os

cache_dir = r"C:\Users\debor\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data"
for f in glob.glob(os.path.join(cache_dir, "f_*")):
    try:
        with open(f, 'rb') as fp:
            data = fp.read()
            if b'CssExportModal' in data:
                print('Found in:', f, len(data))
    except Exception:
        pass
