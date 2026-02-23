const CACHE_NAME = 'text-dev-v0.9.3';
const urlsToCache = [
  '/index.html',
  '/css/app.css',
  '/css/print.css',
  '/js/app.js',
  '/js/editor-cm.js',
  '/js/i18n-template.js',
  '/js/search.js',
  '/js/settings.js',
  '/js/tabs.js',
  '/js/util.js',
  '/third_party/jquery/jquery-1.8.3.min.js',
  '/third_party/material-components-web/material-components-web.min.js',
  '/third_party/material-components-web/material-components-web.min.css',
  '/third_party/material-design-icons/iconfont/material-icons.css',
  '/third_party/codemirror.next/codemirror.next.bin.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (event.request.method === 'GET' && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        });
      })
  );
});
