# -*- coding: utf-8 -*-
with open('js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

target = """function setupChartMetricTabs() {
  const metricBtns = document.querySelectorAll('.bulletin-tab-btn');
  metricBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      metricBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeMetric = btn.getAttribute('data-metric') || 'temperature';
      updateBulletinChart();
    });
  });
}"""

replacement = """function setupChartMetricTabs() {
  const metricBtns = document.querySelectorAll('.bulletin-tab-btn');
  metricBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      metricBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeMetric = btn.getAttribute('data-metric') || 'temperature';
      updateBulletinChart();
    });
  });

  // Suporte a parâmetro na URL (?metric=wind, ?metric=precipitation, etc.)
  try {
    const params = new URLSearchParams(window.location.search);
    const urlMetric = params.get('metric');
    if (urlMetric && ['temperature', 'precipitation', 'wind', 'pressure', 'humidity'].includes(urlMetric)) {
      state.activeMetric = urlMetric;
      metricBtns.forEach(b => {
        if (b.getAttribute('data-metric') === urlMetric) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
    }
  } catch (e) {}

  window.setChartMetric = function(m) {
    if (!['temperature', 'precipitation', 'wind', 'pressure', 'humidity'].includes(m)) return;
    state.activeMetric = m;
    metricBtns.forEach(b => {
      if (b.getAttribute('data-metric') === m) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
    updateBulletinChart();
  };
}"""

code_norm = code.replace('\r\n', '\n')
target_norm = target.replace('\r\n', '\n')

if target_norm in code_norm:
    code_norm = code_norm.replace(target_norm, replacement)
    print("Replaced setupChartMetricTabs successfully.")
else:
    print("Target not found.")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(code_norm.replace('\n', '\r\n'))
