const CACHE_NAME = 'meteo-ostras-v46';
const STATIC_ASSETS = [
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
  './data/acumulados_estacoes.json',
  './data/balneabilidade.json',
  './data/marinha_avisos.json',
  './docs/boletim_operacional.pdf',
  './docs/informativo_populacao.pdf'
];

// Instalação do Service Worker com ativação imediata
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Ativação: LIMPA TODOS OS CACHES ANTIGOS IMEDIATAMENTE
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de requisição:
// - NAVEGAÇÃO / HTML: NETWORK-FIRST SEMPRE (nunca prende o usuário em HTML antigo)
// - Dados e APIs: Network-first com fallback para Cache
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  // 1. NAVEGAÇÃO / HTML: SEMPRE BUSCA DA REDE PRIMEIRO
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/tempo-rio-das-ostras/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const respClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 2. Chamadas de dados oficiais (JSON ou APIs)
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

  // 3. Demais arquivos com Network-First e fallback para Cache
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const respClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
