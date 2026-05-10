/**
 * HLS + Subtitle Offline Interceptor — injected into the Workbox service worker.
 *
 * Intercepts:
 *   - HLS .m3u8 manifest requests
 *   - HLS .ts video segment requests
 *   - WebVTT .vtt subtitle requests
 *
 * When offline (or network fails), serves them from the 'hls-offline-v1' cache.
 * When online, passes the request through to the network.
 */

const HLS_CACHE_NAME = 'hls-offline-v1';

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  const isM3u8    = url.includes('.m3u8');
  const isSegment = url.endsWith('.ts') || url.endsWith('.aac');
  const isVtt     = url.endsWith('.vtt');

  if (!isM3u8 && !isSegment && !isVtt) return;

  event.respondWith(
    (async () => {
      // Try network first (allows live streams and fresh segments to still work)
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse.ok) return networkResponse;
      } catch {
        // Network unavailable — fall through to cache
      }

      // Serve from offline cache
      const cache = await caches.open(HLS_CACHE_NAME);
      const cached = await cache.match(event.request.url);
      if (cached) return cached;

      // Nothing in cache — return a clean 503 instead of an unhandled error
      return new Response(
        JSON.stringify({ error: 'Content not available offline' }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    })()
  );
});
