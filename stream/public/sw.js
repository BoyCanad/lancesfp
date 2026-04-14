// Service Worker Disabled to prevent video buffering issues.
// All previous caching logic has been removed.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
