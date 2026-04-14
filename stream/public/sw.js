const CACHE_NAME = 'lsfplus-v7';
const MOVIE_CACHE = 'lsfplus-movies';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== MOVIE_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Skip non-http requests
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // NETWORK FIRST STRATEGY for HTML / Navigation requests
  // This ensures users always get the latest JS bundle hashes when online
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match('/index.html', { ignoreSearch: true }).then((cachedResponse) => {
            return cachedResponse || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
          });
        })
    );
    return;
  }

  // CACHE FIRST STRATEGY for static assets and media
  // Fallback to network if not in cache
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) return networkResponse;

        const urlString = event.request.url;
        
        const isHlsSegment = urlString.includes('.m3u8') || urlString.endsWith('.ts') || urlString.includes('.ts?');
        const isStaticAsset = !isHlsSegment && (
          urlString.includes('/images/') || 
          urlString.includes('.js') || 
          urlString.includes('.ts') || 
          urlString.includes('.jsx') || 
          urlString.includes('.css') || 
          urlString.includes('.woff') || 
          urlString.includes('.vtt') ||
          urlString.includes('.tsx') || 
          urlString.includes('/src/') || 
          urlString.includes('node_modules/') || 
          urlString.includes('/@vite/') || 
          urlString.includes('/@react-refresh') || 
          urlString.includes('/@id/')
        );

        if (isStaticAsset) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone).catch(() => {}));
        }
        
        return networkResponse;
      }).catch((error) => {
        if (error.name === 'AbortError') {
          throw error; // Let the browser handle standard aborts cleanly
        }
        return new Response('Network error occurred', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      });
    })
  );
});
