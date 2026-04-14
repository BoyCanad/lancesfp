const CACHE_NAME = 'lsfplus-v2';
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
  
  // Skip chrome extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // CACHE FIRST STRATEGY: Always serve from cache if available.
      // This is essential for offline HLS (.m3u8 and .ts files) and static assets.
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fallback to Network
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) return networkResponse;

        const url = event.request.url;
        
        // Cache static assets and HLS segments dynamically if they aren't pre-cached
        const isStaticAsset = url.includes('/images/') || url.includes('.js') || url.includes('.css') || url.includes('.woff') || url.includes('.vtt');
        const isHlsSegment = url.includes('.m3u8') || url.includes('.ts');

        if (isStaticAsset) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        } else if (isHlsSegment) {
          const responseClone = networkResponse.clone();
          caches.open('offline-hls-cache').then((cache) => cache.put(event.request, responseClone));
        }
        
        return networkResponse;
      }).catch((err) => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
      });
    })
  );
});
