const CACHE_NAME = 'lsfplus-v1';
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

  const url = event.request.url;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        // Just return the network response if it's not successful
        if (!networkResponse || networkResponse.status !== 200) return networkResponse;

        // Auto-cache common UI assets as they are requested
        const isAsset = url.includes('/images/') || url.includes('.js') || url.includes('.css') || url.includes('.woff') || url.includes('.vtt');
        
        if (isAsset && !url.includes('chrome-extension')) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        
        return networkResponse;
      }).catch((err) => {
        // Fallback for navigation (SPA)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        // Instead of returning undefined, we re-throw or return a dummy response to avoid TypeError
        throw err;
      });
    })
  );
});
