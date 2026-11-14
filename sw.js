const CACHE_NAME = 'meteo-ostras-v223';
const STATIC_ASSETS = [
  './index.html',
  './assets/index-Bq1jnTk1.js',
  './assets/index-CahTAsCm.css',
  './img/logo-dark-text.png',
  './img/logo-transparent.png',
  './img/logo.png',
  './img/icon-192.png',
  './img/icon-512.png',
  './data/inea_cheias.json',
  './data/inmet_avisos.json',
  './data/inmet_previsao.json',
  './data/cptec_previsao.json',
  './data/boletim_oficial.json',
  './data/boletim_metadata.json',
  './data/fases_lua_inmet.json',
  './data/acumulados_estacoes.json',
  './data/balneabilidade.json',
  './data/marinha_avisos.json',
  './data/tabua_mares.json',
  './data/orla_condicoes.json',
  './docs/plancon_rio_das_ostras.pdf',
  './docs/plancon_el_nino_rio_das_ostras.pdf'
];

// Instalação do Service Worker com ativação imediata
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          fetch(url)
            .then(res => {
              if (res.ok) return cache.put(url, res);
            })
            .catch(() => {})
        )
      );
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
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // 2. DADOS JSON / TELEMETRIA: Network-first com fallback
  if (url.pathname.includes('/data/') || url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. ASSETS ESTÁTICOS / SCRIPTS / CSS: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {});
      return cachedResponse || fetchPromise;
    })
  );
});
