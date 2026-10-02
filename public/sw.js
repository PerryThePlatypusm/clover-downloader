const CACHE_NAME = 'clover-downloader-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;

  // Never intercept dynamic Vite modules, node_modules, HMR, or API endpoints
  if (
    url.includes('/@') ||
    url.includes('/src/') ||
    url.includes('/api/') ||
    url.includes('node_modules') ||
    url.includes('?') ||
    url.includes('hot-update')
  ) {
    return;
  }

  // Network-first strategy to prevent stale white screens
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Network error occurred', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
