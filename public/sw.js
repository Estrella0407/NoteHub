// Minimal service worker to enable PWA installation capabilities
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Pass through all requests natively without caching. 
  // Required so Chrome detects offline capability potential.
});
