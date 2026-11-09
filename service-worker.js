const CACHE_NAME = 'the-yaha-app-v1';
const URLS_TO_CACHE = [
  '/app.html',
  '/manifest.json'
];

// Установка: кэшируем оболочку приложения
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Активация: удаляем старые кэши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Запросы: сначала кэш, потом сеть
self.addEventListener('fetch', event => {
  // Кэшируем только GET-запросы
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Не кэшируем mp3 и внешние запросы (шрифты, formspree)
        const url = new URL(event.request.url);
        const isSameOrigin = url.origin === location.origin;
        const isCacheable = isSameOrigin && !url.pathname.endsWith('.mp3');

        if (isCacheable && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }

        return response;
      }).catch(() => {
        // Если сети нет и в кэше нет — возвращаем app.html для навигации
        if (event.request.mode === 'navigate') {
          return caches.match('/app.html');
        }
      });
    })
  );
});