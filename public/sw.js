// ProjectM Service Worker for PWA (Offline & Mobile support)
const CACHE_NAME = 'projectm-shell-v5';

// Nếu đang chạy trên máy tính cục bộ (localhost hoặc 127.0.0.1), tự động hủy đăng ký và không can thiệp để tránh xung đột Vite dev server
const isLocalhost = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

if (isLocalhost) {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => {
    event.waitUntil(self.registration.unregister());
  });
}

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
];

// Install: Cache core assets and take control immediately (chỉ chạy trên GitHub Pages / mobile online)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  if (isLocalhost) return;
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll warning:', err);
      });
    })
  );
});

// Activate: Clean up all old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for everything when online, cache fallback when offline
self.addEventListener('fetch', (event) => {
  // 0. Bỏ qua hoàn toàn trên localhost để Vite dev server chạy mượt mà 100%
  if (isLocalhost) {
    return;
  }

  const url = new URL(event.request.url);

  // 1. Never cache internal storage bridge APIs
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Network-first strategy with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (event.request.method === 'GET' && networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./') || caches.match('./index.html') || caches.match('/index.html');
          }
          return new Response('Offline: Content not available', { status: 503, statusText: 'Offline' });
        });
      })
  );
});

