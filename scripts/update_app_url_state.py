import os

app_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\src\App.tsx'

with open(app_path, 'r', encoding='utf-8') as f:
    c = f.read()

target = '''  // Inner controls
  const [chartMetric, setChartMetric] = useState<ChartMetric>('temp');
  const [horizonCount, setHorizonCount] = useState<number>(192);
  const [chartDayFilter, setChartDayFilter] = useState<string>('all');
  const [showChartValues, setShowChartValues] = useState<boolean>(true);'''

replacement = '''  // Inner controls
  const [chartMetric, setChartMetric] = useState<ChartMetric>(() => {
    try {
      const m = new URLSearchParams(window.location.search).get('metric') as ChartMetric;
      if (m && ['temp', 'rain', 'wind', 'pressure', 'humidity'].includes(m)) return m;
    } catch {}
    return 'temp';
  });
  const [horizonCount, setHorizonCount] = useState<number>(() => {
    try {
      const h = parseInt(new URLSearchParams(window.location.search).get('horizon') || '', 10);
      if (h > 0) return h;
    } catch {}
    return 192;
  });
  const [chartDayFilter, setChartDayFilter] = useState<string>(() => {
    try {
      const d = new URLSearchParams(window.location.search).get('day');
      if (d) return d;
    } catch {}
    return 'all';
  });
  const [showChartValues, setShowChartValues] = useState<boolean>(true);'''

if target in c:
    c = c.replace(target, replacement)
    with open(app_path, 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(c)
    print('App.tsx URL state initialized!')
else:
    print('Target not found in App.tsx')
