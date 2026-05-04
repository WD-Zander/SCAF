// ============================================================
// SCAF — Service Worker v2
// Estrategia: Cache-First para assets estáticos (JS/CSS/íconos)
//             Network-First para HTML y navegación
//             Bypass total para llamadas a /api/
// ============================================================

const CACHE_VERSION = 'v2';
const STATIC_CACHE  = `scaf-static-${CACHE_VERSION}`;
const PAGES_CACHE   = `scaf-pages-${CACHE_VERSION}`;

// Assets que siempre se deben cachear al instalar
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ── INSTALL ─────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Continúa aunque algún recurso falle (ej. en desarrollo)
      })
    )
  );
  self.skipWaiting(); // Activa el nuevo SW sin esperar que cierren las pestañas
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const validCaches = [STATIC_CACHE, PAGES_CACHE];
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => !validCaches.includes(name))
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH ─────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Ignorar todo lo que no sea GET
  if (request.method !== 'GET') return;

  // 2. Ignorar llamadas al backend API (cualquier ruta /api/ o puerto 5000)
  if (url.pathname.startsWith('/api/') || url.port === '5000') return;

  // 3. Ignorar peticiones a otros orígenes (Google Fonts, CDNs, etc.)
  if (url.origin !== self.location.origin) return;

  // 4. Assets del bundle de Vite (JS/CSS con hash) → Cache First
  //    Una vez cacheados nunca cambian porque el hash cambia con cada build
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/splash/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => caches.match('/offline.html'));
      })
    );
    return;
  }

  // 5. Archivos subidos (fotos/PDFs de activos) → Cache First con red como fallback
  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => null);
      })
    );
    return;
  }

  // 6. Navegación (HTML / rutas SPA) → Network First, fallback a /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(PAGES_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match('/index.html').then((cached) => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  // 7. Resto → Network First genérico
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(PAGES_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/offline.html')))
  );
});

// ── MENSAJE DESDE LA APP (para forzar actualización) ─────────
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
