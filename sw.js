const CACHE_NAME = 'meteo-ostras-v7';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/api.js',
  './js/charts.js',
  './js/radar.js',
  './js/weather-codes.js',
  './img/logo.png',
  './img/logo-full.png',
  './img/icon-192.png',
  './img/icon-512.png',
  './data/inea_cheias.json',
  './data/inmet_avisos.json',
  './data/inmet_previsao.json',
  './data/boletim_oficial.json',
  './data/boletim_metadata.json',
  './docs/boletim_operacional.pdf',
  './docs/informativo_populacao.pdf'
];

// Instalação do Service Worker e pré-cache dos arquivos essenciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de requisição:
// - Dados e APIs: Network-first com fallback para Cache
// - Arquivos estáticos: Cache-first com revalidação
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Não intercepta chamadas não-GET
  if (event.request.method !== 'GET') return;

  // Chamadas de dados oficiais (JSON ou APIs)
  if (url.pathname.includes('/data/') || url.pathname.includes('/api/') || url.hostname.includes('open-meteo.com') || url.hostname.includes('rainviewer.com')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const respClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then(cached => {
            if (cached) return cached;
            // Se for chamada de dados de cheias, tenta a versão em cache
            if (url.pathname.includes('inea_cheias')) return caches.match('./data/inea_cheias.json');
            if (url.pathname.includes('inmet_avisos')) return caches.match('./data/inmet_avisos.json');
            if (url.pathname.includes('inmet_previsao')) return caches.match('./data/inmet_previsao.json');
            return new Response(JSON.stringify({ offline: true, error: 'Sem conexão de rede' }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Demais arquivos (HTML, CSS, JS, Imagens, CDNs)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Busca atualização em segundo plano para o próximo carregamento
        fetch(event.request).then(netResp => {
          if (netResp && netResp.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, netResp));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const respClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
        }
        return networkResponse;
      });
    })
  );
});
